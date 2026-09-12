import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import database from "../database/db.js";
import { generatePaymentIntent } from "./paymentcontroller.js";
import { emitCatalogueChange, emitOrderChange } from "../realtime/socket.js";

// A reservation is returned when payment setup fails, preventing stranded stock.
const restoreReservedStock = async (items) => {
  await Promise.all(
    items.map((item) =>
      database.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [item.quantity, item.productId])
    )
  );
};

export const placeNewOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    full_name,
    state,
    city,
    country,
    address,
    pincode,
    phone,
    emirate,
    delivery_type = "Standard",
    promoCode,
    orderedItems,
  } = req.body;

  // 1. Basic Validation
  if (
    !full_name || !state || !city || !country || !address || !pincode || !phone || !emirate || !orderedItems
  ) {
    return next(new ErrorHandler("Please provide complete order details.", 400));
  }

  // Force orderedItems to be an array to prevent runtime errors
  const items = Array.isArray(orderedItems) ? orderedItems : [orderedItems];

  if (!items || items.length === 0) {
    return next(new ErrorHandler("No items in cart.", 400));
  }

  if (!["Standard", "Express"].includes(delivery_type)) {
    return next(new ErrorHandler("Choose a valid delivery option.", 400));
  }

  // 2. Fetch Product Details from the database to verify prices and stock
  if (items.some((item) => !item?.product?.id || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
    return next(new ErrorHandler("Each order item needs a product and a positive quantity.", 400));
  }

  const productIds = [...new Set(items.map((item) => item.product.id))];
  const { rows: products } = await database.query(
    `SELECT id, price, stock, name, images FROM products WHERE id = ANY($1::uuid[])`,
    [productIds]
  );

  let total_price = 0;
  const values = []; // Flattened array of values for the order_items bulk insert
  const placeholders = []; // $1, $2... placeholders for the bulk insert

  // 3. Loop through items to validate stock and calculate totals
  for (const [index, item] of items.entries()) {
    const product = products.find((p) => p.id === item.product.id);

    if (!product) {
      return next(new ErrorHandler(`Product not found for ID: ${item.product.id}`, 404));
    }

    const requestedQuantity = items
      .filter((cartItem) => cartItem.product.id === product.id)
      .reduce((sum, cartItem) => sum + Number(cartItem.quantity), 0);

    if (requestedQuantity > product.stock) {
      return next(new ErrorHandler(`Only ${product.stock} units available for ${product.name}`, 400));
    }

    // Calculate item total and add to order total
    const itemTotal = product.price * item.quantity;
    total_price += itemTotal;

    // Push values for the bulk INSERT INTO order_items query
    values.push(
      null, // Placeholder for order_id (will be filled in after order creation)
      product.id,
      Number(item.quantity),
      product.price,
      product.images?.[0]?.url || "",
      product.name
    );

    // Create the placeholder group (e.g., "($1, $2, $3, $4, $5, $6)")
    const offset = index * 6;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${
        offset + 5
      }, $${offset + 6})`
    );
  }

  // 4. Apply the server-verified promotion before calculating UAE VAT.
  let discount_price = 0;
  let promotion_code = null;
  if (promoCode?.trim()) {
    const { rows: promotions } = await database.query(
      `SELECT * FROM promotions WHERE UPPER(code) = $1 AND is_active = TRUE
       AND starts_at <= CURRENT_TIMESTAMP AND (ends_at IS NULL OR ends_at > CURRENT_TIMESTAMP)`,
      [promoCode.trim().toUpperCase()]
    );
    const promotion = promotions[0];
    if (!promotion) return next(new ErrorHandler("This sale code is not active.", 400));
    if (total_price < Number(promotion.min_order_amount)) {
      return next(new ErrorHandler(`This sale starts at AED ${promotion.min_order_amount}.`, 400));
    }
    discount_price = promotion.discount_type === "Percent"
      ? total_price * (Number(promotion.discount_value) / 100)
      : Number(promotion.discount_value);
    if (promotion.max_discount_amount) {
      discount_price = Math.min(discount_price, Number(promotion.max_discount_amount));
    }
    discount_price = Number(Math.min(discount_price, total_price).toFixed(2));
    promotion_code = promotion.code;
  }

  const discounted_subtotal = total_price - discount_price;
  // UAE standard VAT is 5%; tax is calculated after a valid sale discount.
  const tax_price = Number((discounted_subtotal * 0.05).toFixed(2));
  const shipping_price = delivery_type === "Express" ? 25 : discounted_subtotal >= 250 ? 0 : 15;
  total_price = Number((discounted_subtotal + tax_price + shipping_price).toFixed(2));

  // 5. Atomically reserve each unique product before card payment starts.
  // The conditional update is the final stock check when simultaneous buyers checkout.
  const reservedItems = [];
  const requestedByProduct = new Map();
  items.forEach((item) => {
    requestedByProduct.set(
      item.product.id,
      (requestedByProduct.get(item.product.id) || 0) + Number(item.quantity)
    );
  });

  try {
    for (const [productId, quantity] of requestedByProduct) {
      const reservation = await database.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id",
        [quantity, productId]
      );
      if (!reservation.rows[0]) {
        await restoreReservedStock(reservedItems);
        return next(new ErrorHandler("An item just sold out. Refresh your bag and try again.", 409));
      }
      reservedItems.push({ productId, quantity });
    }
  } catch (error) {
    await restoreReservedStock(reservedItems);
    throw error;
  }

  let orderResult;
  let orderId;
  try {
    // 6. Persist the order, lines, and delivery selection. Release stock on any database failure.
    orderResult = await database.query(
      `INSERT INTO orders (buyer_id, total_price, tax_price, shipping_price, discount_price, promotion_code)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, total_price, tax_price, shipping_price, discount_price, promotion_code]
    );
    orderId = orderResult.rows[0].id;

    for (let i = 0; i < values.length; i += 6) values[i] = orderId;
    await database.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price, image, title)
       VALUES ${placeholders.join(", ")} RETURNING *`,
      values
    );
    await database.query(
      `INSERT INTO shipping_info (order_id, full_name, state, city, country, emirate, delivery_type, address, pincode, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [orderId, full_name, state, city, country, emirate, delivery_type, address, pincode, phone]
    );
  } catch (error) {
    if (orderId) await database.query("DELETE FROM orders WHERE id = $1", [orderId]);
    await restoreReservedStock(reservedItems);
    throw error;
  }

  // 7. Generate the Stripe Payment Intent only after the reservation is stored.
  const paymentResponse = await generatePaymentIntent(orderId, total_price);

  if (!paymentResponse.success) {
    // Remove the unpaid draft and return its held inventory.
    await database.query("DELETE FROM orders WHERE id = $1", [orderId]);
    await restoreReservedStock(reservedItems);
    emitCatalogueChange("stock-released");
    return next(new ErrorHandler("Payment failed. Try again.", 500));
  }

  // 8. Send the verified amount and payment secret to the checkout stepper.
  res.status(200).json({
    success: true,
    message: "Order placed successfully. Please proceed to payment.",
    paymentIntent: paymentResponse.clientSecret,
    total_price,
    discount_price,
    promotion_code,
    orderId,
  });
  emitCatalogueChange("stock-reserved");
  emitOrderChange(orderResult.rows[0], "created");
});
export const fetchSingleOrder = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;
  
    // Note: Renamed the variable to 'orderResult' to match the code at the top of your screenshot
    const orderResult = await database.query(
      `
      SELECT 
        o.*,
        p.payment_status,
        COALESCE(
          json_agg(
            json_build_object(
              'order_item_id', oi.id,
              'order_id', oi.order_id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS order_items,
        json_build_object(
          'full_name', s.full_name,
          'state', s.state,
          'city', s.city,
          'country', s.country,
          'emirate', s.emirate,
          'delivery_type', s.delivery_type,
          'address', s.address,
          'pincode', s.pincode,
          'phone', s.phone
        ) AS shipping_info
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN shipping_info s ON o.id = s.order_id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.id = $1 AND (o.buyer_id = $2 OR $3 = 'Admin')
      GROUP BY o.id, s.id, p.payment_status;
      `,
      [orderId, req.user.id, req.user.role]
    );
  
    // Safety check: Ensure the order was found
    if (orderResult.rows.length === 0) {
      return next(new ErrorHandler("Order not found.", 404));
    }
  
    res.status(200).json({
      success: true,
      message: "Orders fetched.",
      orders: orderResult.rows[0],
    });
  });

export const fetchMyOrders = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(
    `
    SELECT o.*, p.payment_status,
    COALESCE(
      json_agg(
        json_build_object(
          'order_item_id', oi.id,
          'order_id', oi.order_id,
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'image', oi.image,
          'title', oi.title
        )
      ) FILTER (WHERE oi.id IS NOT NULL), '[]'
    ) AS order_items,
    json_build_object(
      'full_name', s.full_name,
      'state', s.state,
      'city', s.city,
      'country', s.country,
      'emirate', s.emirate,
      'delivery_type', s.delivery_type,
      'address', s.address,
      'pincode', s.pincode,
      'phone', s.phone
    ) AS shipping_info
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN shipping_info s ON o.id = s.order_id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.buyer_id = $1
    GROUP BY o.id, s.id, p.payment_status
    `,
    [req.user.id]
  );

  // Completed the cut-off response block
  res.status(200).json({
    success: true,
    message: "All your orders are fetched.",
    orders: result.rows,
  });
});
export const fetchAllOrders = catchAsyncErrors(async (req, res, next) => {
    const result = await database.query(
      `
      SELECT o.*, p.payment_status,
      COALESCE(
        json_agg(
          json_build_object(
            'order_item_id', oi.id,
            'order_id', oi.order_id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'image', oi.image,
            'title', oi.title
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]'
      ) AS order_items,
      json_build_object(
        'full_name', s.full_name,
        'state', s.state,
        'city', s.city,
        'country', s.country,
        'emirate', s.emirate,
        'delivery_type', s.delivery_type,
        'address', s.address,
        'pincode', s.pincode,
        'phone', s.phone
      ) AS shipping_info
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN shipping_info s ON o.id = s.order_id
      LEFT JOIN payments p ON p.order_id = o.id
      GROUP BY o.id, s.id, p.payment_status
      ORDER BY o.created_at DESC
      `
    );
  
    res.status(200).json({
      success: true,
      message: "All orders fetched.",
      orders: result.rows,
    });
  }); 
  export const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
    const { status } = req.body;
  
    const allowedStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return next(new ErrorHandler("Provide a valid status for order.", 400));
    }
  
    const { orderId } = req.params;
  
    // 1. Check if the order exists
    const results = await database.query(
      `SELECT o.*, p.payment_status
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = $1`,
      [orderId]
    );
  
    if (results.rows.length === 0) {
      return next(new ErrorHandler("Invalid order ID.", 404));
    }

    const currentOrder = results.rows[0];
    if (currentOrder.payment_status !== "Paid") {
      return next(new ErrorHandler("An order must be paid before its fulfilment status can change.", 409));
    }

    const allowedTransitions = {
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Delivered", "Cancelled"],
      Delivered: [],
      Cancelled: [],
    };
    if (status !== currentOrder.order_status && !allowedTransitions[currentOrder.order_status]?.includes(status)) {
      return next(new ErrorHandler("This order cannot move to the requested status.", 409));
    }
  
    // 2. Update the order status (Completed the cut-off query)
    const updatedOrder = await database.query(
      `UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *`,
      [status, orderId]
    );

    if (status === "Cancelled" && currentOrder.order_status !== "Cancelled" && currentOrder.payment_status === "Paid") {
      const { rows: items } = await database.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
        [orderId]
      );
      await Promise.all(
        items.map((item) =>
          database.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [item.quantity, item.product_id])
        )
      );
      emitCatalogueChange("stock-restored");
    }
  
    // 3. Send the final response
    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder.rows[0],
    });
    emitOrderChange(updatedOrder.rows[0], "status-updated");
  });
  export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const { orderId } = req.params;

    // Paid orders are financial records. They must be cancelled/refunded, not erased.
    const payment = await database.query(
      `SELECT p.payment_status FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = $1`,
      [orderId]
    );
    if (!payment.rows[0]) return next(new ErrorHandler("Invalid order ID.", 404));
    if (payment.rows[0].payment_status === "Paid") {
      return next(new ErrorHandler("Paid orders cannot be deleted. Cancel and refund them through the payment provider.", 409));
    }

    // A pending checkout still holds stock; release it before deleting the draft.
    if (payment.rows[0].payment_status !== "Failed") {
      const { rows: items } = await database.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
        [orderId]
      );
      await restoreReservedStock(items.map((item) => ({ productId: item.product_id, quantity: item.quantity })));
      emitCatalogueChange("stock-released");
    }

    // Related line items, shipping, and payment data cascade with the order.
    const results = await database.query(
      `DELETE FROM orders WHERE id = $1 RETURNING *`,
      [orderId]
    );

    res.status(200).json({
      success: true,
      message: "Order deleted successfully.",
      order: results.rows[0],
    });
    emitOrderChange(results.rows[0], "deleted");
  });
