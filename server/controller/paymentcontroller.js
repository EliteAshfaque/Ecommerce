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
      // Only the first successful webhook can change state and decrement stock.
      // Stripe may retry a delivered webhook, so this makes fulfilment idempotent.
      const paymentTableUpdateResult = await database.query(
        `UPDATE payments SET payment_status = $1 WHERE payment_intent_id = $2 AND payment_status <> $1 RETURNING *`,
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

      // 3. REDUCE STOCK FOR EACH PRODUCT
      const { rows: orderedItems } = await database.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
        [orderId]
      );

      for (const item of orderedItems) {
        // Fixed: Added 'await' and completed the SQL query
        await database.query(
          `UPDATE products SET stock = stock - $1 WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      emitOrderChange(updatedOrders[0], "paid");
      emitCatalogueChange("stock-updated");

      console.log(`✅ Order #${orderId} fulfilled successfully.`);
    } 
    else if (event.type === "payment_intent.payment_failed") {
      const paymentIntentId = event.data.object.id;
      
      await database.query(
        `UPDATE payments SET payment_status = 'Failed' WHERE payment_intent_id = $1`,
        [paymentIntentId]
      );
      
      console.log(`❌ Payment failed for Stripe ID: ${paymentIntentId}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });

  } catch (error) {
    console.error("Error processing webhook:", error);
    // Return 500 so Stripe knows to retry this event later
    res.status(500).json({ error: "Webhook handler failed" });
  }
};
