import { useState } from "react";
import { ArrowUpRight, CreditCard, Headphones, LoaderCircle, MapPin, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { requestDeliveryLocation } from "../../lib/location";

const features = [
  { icon: Truck, title: "UAE delivery", description: "Set your delivery area for a faster checkout experience.", action: "location", cta: "Set delivery area", tone: "violet" },
  { icon: ShieldCheck, title: "Secure payment", description: "Protected Stripe card checkout with clear AED totals.", action: "/payment", cta: "View checkout", tone: "emerald" },
  { icon: PackageCheck, title: "Clear fulfilment", description: "Follow every paid order from processing to delivery.", action: "/orders", cta: "Track my orders", tone: "sky" },
  { icon: Headphones, title: "Order support", description: "Reach our support team for delivery or order assistance.", action: "/contact", cta: "Contact support", tone: "rose" },
];

const iconTones = { violet: "bg-violet-100 text-violet-700", emerald: "bg-emerald-100 text-emerald-700", sky: "bg-sky-100 text-sky-700", rose: "bg-rose-100 text-rose-700" };

const FeatureSection = () => {
  const [locating, setLocating] = useState(false);

  const setDeliveryArea = async () => {
    setLocating(true);
    try {
      const location = await requestDeliveryLocation();
      toast.success(location.label ? `Delivery area set to ${location.label}.` : "Delivery area saved.");
    } catch (error) { toast.info(error.message || "We could not find your location."); }
    finally { setLocating(false); }
  };

  return <section className="home-reveal py-16"><div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Shopping with confidence</p><h2 className="mt-2 font-display text-3xl font-semibold">Every order, considered.</h2></div><p className="max-w-sm text-sm leading-relaxed text-stone">Useful delivery, payment and support tools—right where customers need them.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{features.map((feature, index) => { const Icon = feature.icon; const isLocation = feature.action === "location"; return <article key={feature.title} className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_12px_34px_rgba(42,31,107,.07)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(42,31,107,.14)]" style={{ animationDelay: `${index * 0.08}s` }}><div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[.055] transition duration-500 group-hover:scale-150" /><div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${iconTones[feature.tone]}`}><Icon className="h-5 w-5" /></div><h3 className="relative mt-5 font-display text-xl font-semibold text-ink">{feature.title}</h3><p className="relative mt-2 min-h-12 text-sm leading-relaxed text-stone">{feature.description}</p>{isLocation ? <button type="button" onClick={setDeliveryArea} disabled={locating} className="relative mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:text-accent-deep disabled:opacity-60">{locating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}{locating ? "Finding location" : feature.cta}<ArrowUpRight className="h-3.5 w-3.5" /></button> : <Link to={feature.action} className="relative mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:text-accent-deep">{feature.action === "/payment" ? <CreditCard className="h-3.5 w-3.5" /> : null}{feature.cta}<ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>}</article>; })}</div></section>;
};

export default FeatureSection;
