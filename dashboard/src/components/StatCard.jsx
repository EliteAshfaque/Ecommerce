const money = (n) =>
  Number(n || 0).toLocaleString("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  });

const StatCard = ({ label, value }) => (
  <div className="border border-border/10 bg-mist/20 p-5">
    <p className="text-[10px] uppercase tracking-[0.18em] text-stone">{label}</p>
    <p className="mt-3 font-display text-2xl font-semibold tabular-nums">
      {value}
    </p>
  </div>
);

export { money };
export default StatCard;
