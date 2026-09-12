import database from "../database/db.js";
import Stripe from "stripe";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { emitCatalogueChange, emitOrderChange } from "../realtime/socket.js";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ==========================================
// 1. HELPER FUNCTION: Generate Payment Intent
// ==========================================
export async function generatePaymentIntent(orderId, totalPrice) {
  try {
    // 1. Create a Payment Intent on Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents safely
      // LUMERA checkout is denominated in UAE Dirhams.
      currency: "aed",
      metadata: {
        orderId: orderId,
      },
    });

    // 2. Save the Payment Intent ID (NOT the client_secret) to your database
    // This is CRITICAL so the stripeWebhook can find this record later
    await database.query(
      "INSERT INTO payments (order_id, payment_type, payment_status, payment_intent_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [orderId, "Online", "Pending", paymentIntent.id]
    );

    // 3. Return success and the client_secret to the frontend
    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Payment Error:", error.message || error);
    return {
      success: false,
      message: "Payment Failed.",
    };
  }
}

// Full-order refunds are issued only by the authenticated admin fulfilment flow.
// A stable Stripe idempotency key makes a retry safe if the network drops.
export async function createOrderRefund(paymentIntentId, orderId) {
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
        metadata: { orderId },
      },
      { idempotencyKey: `lumera-refund-${orderId}` }
    );
    const refundStatus = refund.status === "succeeded"
      ? "Succeeded"
      : refund.status === "failed" || refund.status === "canceled"
        ? "Failed"
        : "Pending";
    return { success: true, refund, refundStatus };
  } catch (error) {
    console.error("Refund Error:", error.message || error);
    return { success: false, message: "Stripe could not create the refund." };
  }
}

// ==========================================
// 2. CONTROLLER: Process Payment
// ==========================================
export const processPayment = catchAsyncErrors(async (req, res, next) => {
  const { orderId, totalPrice } = req.body;

  if (!orderId || !totalPrice) {
    return next(new ErrorHandler("Please provide Order ID and Total Price.", 400));
  }

  // Call the helper function
  const result = await generatePaymentIntent(orderId, totalPrice);

  if (!result.success) {
    return next(new ErrorHandler(result.message, 500));
  }

  // Send the clientSecret back to the frontend
  // The frontend uses this secret to confirm the payment on Stripe's side
  res.status(200).json({
    success: true,
    clientSecret: result.clientSecret,
  });
});

// ==========================================
// 3. CONTROLLER: Stripe Webhook
// ==========================================
// ⚠️ Remember: This route MUST use express.raw({ type: "application/json" })
export const  stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify that the request actually came from Stripe
    event = stripe.webhooks.constructEvent(
      req.body, // This is the raw Buffer (thanks to express.raw middleware)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the successful payment event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntentId = event.data.object.id;

      // 1. FIND AND UPDATE PAYMENT STATUS TO 'Paid'
      const updatedPaymentStatus = "Paid";
      // Only the first successful webhook can change payment state.
      // Stripe may retry a delivered webhook, so this makes fulfilment idempotent.
      const paymentTableUpdateResult = await database.query(
        `UPDATE payments SET payment_status = $1 WHERE payment_intent_id = $2 AND payment_status = 'Pending' RETURNING *`,
        [updatedPaymentStatus, paymentIntentId]
      );

      // Safety check: Ensure the payment record was found
      if (paymentTableUpdateResult.rows.length === 0) {
        console.error(`Payment record not found for Stripe ID: ${paymentIntentId}`);
        return res.status(200).json({ received: true });
      }

      const orderId = paymentTableUpdateResult.rows[0].order_id;

      // 2. UPDATE ORDER STATUS
      const { rows: updatedOrders } = await database.query(
        `UPDATE orders SET paid_at = NOW(), order_status = 'Processing' WHERE id = $1 RETURNING *`,
        [orderId]
      );

      // Stock was reserved before the Payment Intent was made; a successful
      // webhook confirms the reservation rather than subtracting it twice.
      emitOrderChange(updatedOrders[0], "paid", { paymentStatus: "Paid" });

      console.log(`✅ Order #${orderId} fulfilled successfully.`);
    } 
    else if (event.type === "payment_intent.payment_failed") {
      const paymentIntentId = event.data.object.id;
      
      const failedPayment = await database.query(
        `UPDATE payments SET payment_status = 'Failed' WHERE payment_intent_id = $1 AND payment_status = 'Pending' RETURNING order_id`,
        [paymentIntentId]
      );
      if (failedPayment.rows[0]) {
        const orderId = failedPayment.rows[0].order_id;
        const { rows: orderedItems } = await database.query(
          "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
          [orderId]
        );
        await Promise.all(orderedItems.map((item) =>
          database.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [item.quantity, item.product_id])
        ));
        const { rows: orders } = await database.query(
          "UPDATE orders SET order_status = 'Cancelled' WHERE id = $1 RETURNING *",
          [orderId]
        );
        emitCatalogueChange("stock-released");
        if (orders[0]) emitOrderChange(orders[0], "payment-failed", { paymentStatus: "Failed" });
      }
      
      console.log(`❌ Payment failed for Stripe ID: ${paymentIntentId}`);
    }
    else if (["charge.refund.updated", "refund.updated"].includes(event.type)) {
      const refund = event.data.object;
      const refundStatus = refund.status === "succeeded"
        ? "Succeeded"
        : refund.status === "failed" || refund.status === "canceled"
          ? "Failed"
          : "Pending";
      const { rows: payments } = await database.query(
        `UPDATE payments
         SET refund_status = $1,
             refunded_at = CASE WHEN $1 = 'Succeeded' THEN NOW() ELSE refunded_at END
         WHERE refund_id = $2
         RETURNING order_id`,
        [refundStatus, refund.id]
      );
      if (payments[0]) {
        const { rows: orders } = await database.query(
          "SELECT * FROM orders WHERE id = $1",
          [payments[0].order_id]
        );
        if (orders[0]) emitOrderChange(orders[0], "refund-updated", { refundStatus });
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });

  } catch (error) {
    console.error("Error processing webhook:", error);
    // Return 500 so Stripe knows to retry this event later
    res.status(500).json({ error: "Webhook handler failed" });
  }
};
