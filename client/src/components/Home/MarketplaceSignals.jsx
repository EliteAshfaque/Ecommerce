import { CreditCard, Headphones, MapPin, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";

const signals = [
  { icon: MapPin, title: "UAE-wide delivery", copy: "Set your delivery area", to: "/payment" },
  { icon: PackageCheck, title: "Free over AED 250", copy: "Standard delivery", to: "/products" },
  { icon: CreditCard, title: "Secure card checkout", copy: "Clear AED totals", to: "/payment" },
  { icon: Headphones, title: "Need order help?", copy: "Talk to LUMERA support", to: "/contact" },
];

const MarketplaceSignals = () => (
  <section className="relative z-20 -mt-5 mx-auto w-[calc(100%-2rem)] max-w-6xl rounded-2xl border border-white/80 bg-white/90 p-2 shadow-[0_18px_42px_rgba(24,18,74,.12)] backdrop-blur-xl md:-mt-7 md:w-[calc(100%-4rem)]">
    <div className="grid grid-cols-2 divide-x divide-y divide-ink/8 md:grid-cols-4 md:divide-y-0">
      {signals.map((signal) => { const Icon = signal.icon; return <Link key={signal.title} to={signal.to} className="group flex min-w-0 items-center gap-2.5 px-3 py-3 transition hover:bg-primary/[.04] sm:px-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/[.08] text-primary transition group-hover:bg-primary group-hover:text-white"><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-[11px] font-bold text-ink">{signal.title}</span><span className="mt-0.5 block truncate text-[10px] text-stone">{signal.copy}</span></span></Link>; })}
    </div>
  </section>
);

export default MarketplaceSignals;
