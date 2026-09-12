import { useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../lib/axios";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    try {
      const { data } = await axiosInstance.post("/storefront/newsletter", { email });
      toast.success(data.message);
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save your subscription.");
    }
  };

  return (
    <section className="relative mb-10 grid overflow-hidden rounded-[2rem] bg-[#171536] px-6 py-14 text-fog shadow-[0_22px_60px_rgb(54_42_136_/_0.25)] md:grid-cols-2 md:items-center md:px-10">
      <div className="hero-aurora -right-24 -top-20 h-64 w-64 rounded-full opacity-80" />
      <div className="relative z-10">
        <p className="text-xs uppercase tracking-[0.24em] text-accent-soft">Newsletter</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          New drops, quietly delivered.
        </h2>
        <p className="mt-3 max-w-md text-fog/70">
          Be first to hear about arrivals, edits, and member-only offers.
        </p>
      </div>

      <form onSubmit={onSubmit} className="relative z-10 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-fog outline-none placeholder:text-fog/40 backdrop-blur-sm focus:border-white/50"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-white px-6 py-3 font-semibold text-[#3d2cb5] transition hover:-translate-y-0.5 hover:bg-[#eeeaff]"
        >
          Subscribe
        </button>
      </form>
    </section>
  );
};

export default NewsletterSection;
