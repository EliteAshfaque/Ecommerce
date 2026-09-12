const money = (n) =>
  Number(n || 0).toLocaleString("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  });

const tones = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
};

// KPI cards use the dashboard's actual server aggregates; no placeholder metrics are shown.
const StatCard = ({ label, value, caption, icon: Icon, tone = "violet" }) => (
  <div className="admin-surface group relative overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(39,28,104,.14)]">
    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/[.06] transition group-hover:scale-125" />
    <div className="relative flex items-start justify-between gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone">{label}</p>
      {Icon && <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone] || tones.violet}`}><Icon className="h-4 w-4" /></span>}
    </div>
    <p className="relative mt-5 font-display text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
    {caption && <p className="relative mt-2 text-xs text-stone">{caption}</p>}
  </div>
);

export { money };
export default StatCard;
