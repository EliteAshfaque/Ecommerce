import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { clearCart } from "../store/slices/cartSlice";
import { resetOrderFlow } from "../store/slices/orderSlice";

const PaymentForm = ({ amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
    });

    if (error) {
      toast.error(error.message || "Payment failed.");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      toast.success("Payment successful.");
      dispatch(clearCart());
      dispatch(resetOrderFlow());
      navigate("/orders");
      return;
    }

    toast.info(`Payment status: ${paymentIntent?.status || "pending"}`);
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-border/10 bg-white/40 p-5 md:p-6">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="btn-primary flex w-full justify-center py-4 text-[11px] uppercase tracking-[0.22em] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {processing
          ? "Processing…"
          : `Pay ${Number(amount || 0).toLocaleString("en-AE", {
              style: "currency",
              currency: "AED",
            })}`}
      </button>

      <p className="text-center text-xs text-stone">
        Secured by Stripe. Your card details never touch our servers.
      </p>
    </form>
  );
};

export default PaymentForm;
