import { useEffect, useMemo, useState } from "react";
import { BadgePercent, ChartNoAxesCombined, CircleDollarSign, Pause, Play, ShoppingBag, Trash2, TrendingUp } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createAdminPromotion, deleteAdminPromotion, fetchAdminPromotions, fetchDashboardStats, updateAdminPromotion } from "../store/slices/adminSlice";
import StatCard, { money } from "../components/StatCard";

const blankSale = { code: "", name: "", discount_type: "Percent", discount_value: "", min_order_amount: "0" };

// This SVG chart intentionally uses the same paid-order server aggregates as Overview.
// It means revenue is never inflated by pending, failed, or refunded payments.
const RevenueChart = ({ monthly }) => {
  const points = monthly.slice(-8);
  const max = Math.max(...points.map((row) => Number(row.totalSales) || 0), 1);
  const coordinates = points.map((row, index) => {
    const x = points.length === 1 ? 50 : 8 + (index / (points.length - 1)) * 84;
    const y = 84 - ((Number(row.totalSales) || 0) / max) * 62;
    return `${x},${y}`;
  }).join(" ");

  if (!points.length) return <div className="flex h-64 items-center justify-center rounded-2xl bg-mist/60 text-center"><div><ChartNoAxesCombined className="mx-auto h-7 w-7 text-primary" /><p className="mt-3 text-sm font-medium">No paid sales yet</p><p className="mt-1 text-xs text-stone">This chart will populate after the first paid order.</p></div></div>;
  if (points.length === 1) return <div className="rounded-2xl bg-[linear-gradient(180deg,rgba(102,80,255,.18),rgba(255,255,255,0))] p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">First recorded sales period</p><p className="mt-2 font-display text-4xl font-semibold">{money(points[0].totalSales)}</p><div className="mt-7 h-24 overflow-hidden rounded-t-2xl bg-primary/[.08]"><div className="h-full w-full rounded-t-2xl bg-[linear-gradient(90deg,#332985,#8d78ff)]" /></div><p className="mt-3 text-[10px] font-bold uppercase tracking-[.15em] text-stone">{points[0].month}</p></div>;

  return <div><div className="relative h-64 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(102,80,255,.16),rgba(255,255,255,0))]"><div className="pointer-events-none absolute inset-x-0 top-1/4 border-t border-dashed border-primary/15" /><div className="pointer-events-none absolute inset-x-0 top-2/4 border-t border-dashed border-primary/15" /><div className="pointer-events-none absolute inset-x-0 top-3/4 border-t border-dashed border-primary/15" /><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-label="Paid revenue by month"><defs><linearGradient id="sales-workspace-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6650ff" stopOpacity=".34" /><stop offset="100%" stopColor="#6650ff" stopOpacity="0" /></linearGradient></defs><polygon points={`0,100 ${coordinates} 100,100`} fill="url(#sales-workspace-area)" /><polyline points={coordinates} fill="none" stroke="#6650ff" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />{points.map((row, index) => { const [x, y] = coordinates.split(" ")[index].split(","); return <circle key={row.month} cx={x} cy={y} r="2" fill="#fff" stroke="#6650ff" strokeWidth="1.2"><title>{`${row.month}: ${money(row.totalSales)}`}</title></circle>; })}</svg></div><div className="mt-3 flex justify-between gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-stone">{points.map((row) => <span key={row.month}>{String(row.month).slice(0, 3)}</span>)}</div></div>;
};

const Sales = () => {
  const dispatch = useDispatch();
  const { promotions, promotionsLoading, stats } = useSelector((state) => state.admin);
  const [sale, setSale] = useState(blankSale);

  useEffect(() => {
    dispatch(fetchAdminPromotions());
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const activePromotions = promotions.filter((promotion) => promotion.is_active).length;
  const categorySales = stats?.categorySales || [];
  const categoryMax = useMemo(() => Math.max(...categorySales.map((row) => Number(row.revenue) || 0), 1), [categorySales]);

  const submit = async (event) => {
    event.preventDefault();
    const result = await dispatch(createAdminPromotion(sale));
    if (result.meta.requestStatus === "fulfilled") setSale(blankSale);
  };

  return <div className="pb-8">
    <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-primary">Revenue intelligence</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Sales</h1><p className="mt-2 text-sm text-stone">Monitor paid revenue and launch checkout-ready UAE campaigns.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/[.09] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-emerald-700"><TrendingUp className="h-3.5 w-3.5" />Live paid-order data</span></header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Paid revenue" value={money(stats?.totalRevenueAllTime)} caption={`${stats?.revenueGrowth || "0%"} versus last month`} icon={CircleDollarSign} tone="violet" /><StatCard label="This month" value={money(stats?.currentMonthSales)} caption={`${money(stats?.todayRevenue)} today`} icon={TrendingUp} tone="blue" /><StatCard label="Paid orders" value={String(stats?.totalOrders || 0)} caption={`${stats?.pendingPayments || 0} awaiting payment`} icon={ShoppingBag} tone="rose" /><StatCard label="Live campaigns" value={String(activePromotions)} caption={`${promotions.length} campaigns created`} icon={BadgePercent} tone="amber" /></section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]"><div className="admin-surface rounded-3xl p-5 md:p-7"><div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Revenue trend</p><h2 className="mt-2 font-display text-2xl font-semibold">Paid sales by month</h2></div><span className="rounded-full bg-primary/[.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-primary">AED</span></div><RevenueChart monthly={stats?.monthlySales || []} /></div><div className="admin-surface rounded-3xl p-5 md:p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Revenue by department</p><h2 className="mt-2 font-display text-2xl font-semibold">Sales mix</h2>{categorySales.length ? <div className="mt-7 space-y-5">{categorySales.map((category) => <div key={category.category}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">{category.category}</span><span className="text-xs text-stone">{money(category.revenue)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-[linear-gradient(90deg,#332985,#8d78ff)]" style={{ width: `${Math.max(7, (Number(category.revenue) / categoryMax) * 100)}%` }} /></div><p className="mt-1 text-[10px] text-stone">{category.quantity} units sold</p></div>)}</div> : <p className="py-16 text-sm text-stone">Category results appear after paid orders.</p>}</div></section>

    <section className="mt-8"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Campaign manager</p><h2 className="mt-2 font-display text-2xl font-semibold">Create a sale</h2><p className="mt-1 text-sm text-stone">Codes are checked by the server before a discount reaches checkout.</p></div><form onSubmit={submit} className="admin-surface mb-6 grid gap-4 rounded-2xl p-5 md:grid-cols-2 xl:grid-cols-6"><input required value={sale.code} onChange={(event) => setSale({ ...sale, code: event.target.value.toUpperCase() })} placeholder="CODE" className="rounded-xl border border-border/15 bg-white/60 px-3 py-2.5 text-sm outline-none focus:border-primary" /><input required value={sale.name} onChange={(event) => setSale({ ...sale, name: event.target.value })} placeholder="Campaign name" className="rounded-xl border border-border/15 bg-white/60 px-3 py-2.5 text-sm outline-none focus:border-primary" /><select value={sale.discount_type} onChange={(event) => setSale({ ...sale, discount_type: event.target.value })} className="rounded-xl border border-border/15 bg-white/60 px-3 py-2.5 text-sm outline-none"><option>Percent</option><option>Fixed</option></select><input required min="1" type="number" value={sale.discount_value} onChange={(event) => setSale({ ...sale, discount_value: event.target.value })} placeholder="Discount" className="rounded-xl border border-border/15 bg-white/60 px-3 py-2.5 text-sm outline-none focus:border-primary" /><input min="0" type="number" value={sale.min_order_amount} onChange={(event) => setSale({ ...sale, min_order_amount: event.target.value })} placeholder="Min. basket (AED)" className="rounded-xl border border-border/15 bg-white/60 px-3 py-2.5 text-sm outline-none focus:border-primary" /><button className="admin-action gradient-primary rounded-xl px-4 py-2.5 text-sm font-semibold text-white">Create sale</button></form>
      {promotionsLoading ? <div className="h-32 animate-pulse rounded-2xl bg-mist" /> : <div className="admin-surface divide-y divide-border/10 overflow-hidden rounded-2xl px-5">{promotions.length ? promotions.map((promotion) => <div key={promotion.id} className="flex items-center gap-4 py-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BadgePercent className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-medium">{promotion.code} · {promotion.name}</p><p className="text-xs text-stone">{promotion.discount_type === "Percent" ? `${promotion.discount_value}% off` : `AED ${promotion.discount_value} off`} · Minimum AED {promotion.min_order_amount || 0} · {promotion.is_active ? "Live" : "Paused"}</p></div><button type="button" onClick={() => dispatch(updateAdminPromotion({ id: promotion.id, changes: { is_active: !promotion.is_active } }))} className="rounded-lg p-2 text-stone hover:bg-primary/10 hover:text-primary" aria-label={promotion.is_active ? "Pause sale" : "Activate sale"}>{promotion.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button><button type="button" onClick={() => window.confirm(`Remove ${promotion.code}?`) && dispatch(deleteAdminPromotion(promotion.id))} className="rounded-lg p-2 text-stone hover:bg-red-50 hover:text-red-600" aria-label="Delete sale"><Trash2 className="h-4 w-4" /></button></div>) : <p className="py-12 text-center text-sm text-stone">No sales yet. Your first code can launch today.</p>}</div>}</section>
  </div>;
};

export default Sales;
