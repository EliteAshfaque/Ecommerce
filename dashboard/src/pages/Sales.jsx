import { useEffect, useState } from "react";
import { BadgePercent, Pause, Play, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createAdminPromotion, deleteAdminPromotion, fetchAdminPromotions, updateAdminPromotion } from "../store/slices/adminSlice";

const blankSale = { code: "", name: "", discount_type: "Percent", discount_value: "", min_order_amount: "0" };

const Sales = () => {
  const dispatch = useDispatch();
  const { promotions, promotionsLoading } = useSelector((state) => state.admin);
  const [sale, setSale] = useState(blankSale);

  useEffect(() => { dispatch(fetchAdminPromotions()); }, [dispatch]);
  const submit = async (event) => {
    event.preventDefault();
    const result = await dispatch(createAdminPromotion(sale));
    if (result.meta.requestStatus === "fulfilled") setSale(blankSale);
  };

  return <div>
    <header className="mb-8"><p className="text-[11px] uppercase tracking-[.24em] text-stone">Campaigns</p><h1 className="mt-2 font-display text-3xl font-semibold">Sales</h1><p className="mt-1 text-sm text-stone">Create UAE checkout codes that are verified by the server.</p></header>
    <form onSubmit={submit} className="admin-surface mb-8 grid gap-4 rounded-2xl p-5 md:grid-cols-2 xl:grid-cols-6">
      <input required value={sale.code} onChange={(e) => setSale({ ...sale, code: e.target.value.toUpperCase() })} placeholder="CODE" className="rounded-xl border border-border/15 bg-white/60 px-3 py-2 text-sm outline-none focus:border-primary" />
      <input required value={sale.name} onChange={(e) => setSale({ ...sale, name: e.target.value })} placeholder="Campaign name" className="rounded-xl border border-border/15 bg-white/60 px-3 py-2 text-sm outline-none focus:border-primary" />
      <select value={sale.discount_type} onChange={(e) => setSale({ ...sale, discount_type: e.target.value })} className="rounded-xl border border-border/15 bg-white/60 px-3 py-2 text-sm outline-none"><option>Percent</option><option>Fixed</option></select>
      <input required min="1" type="number" value={sale.discount_value} onChange={(e) => setSale({ ...sale, discount_value: e.target.value })} placeholder="Discount" className="rounded-xl border border-border/15 bg-white/60 px-3 py-2 text-sm outline-none focus:border-primary" />
      <input min="0" type="number" value={sale.min_order_amount} onChange={(e) => setSale({ ...sale, min_order_amount: e.target.value })} placeholder="Min. basket (AED)" className="rounded-xl border border-border/15 bg-white/60 px-3 py-2 text-sm outline-none focus:border-primary" />
      <button className="admin-action gradient-primary rounded-xl px-4 py-2 text-sm font-semibold text-white">Create sale</button>
    </form>
    {promotionsLoading ? <div className="h-32 animate-pulse rounded-2xl bg-mist" /> : <div className="admin-surface divide-y divide-border/10 overflow-hidden rounded-2xl px-5">
      {promotions.length ? promotions.map((promotion) => <div key={promotion.id} className="flex items-center gap-4 py-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BadgePercent className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-medium">{promotion.code} · {promotion.name}</p><p className="text-xs text-stone">{promotion.discount_type === "Percent" ? `${promotion.discount_value}% off` : `AED ${promotion.discount_value} off`} · Minimum AED {promotion.min_order_amount || 0} · {promotion.is_active ? "Live" : "Paused"}</p></div><button onClick={() => dispatch(updateAdminPromotion({ id: promotion.id, changes: { is_active: !promotion.is_active } }))} className="rounded-lg p-2 text-stone hover:bg-primary/10 hover:text-primary" aria-label={promotion.is_active ? "Pause sale" : "Activate sale"}>{promotion.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button><button onClick={() => window.confirm(`Remove ${promotion.code}?`) && dispatch(deleteAdminPromotion(promotion.id))} className="rounded-lg p-2 text-stone hover:bg-red-50 hover:text-red-600" aria-label="Delete sale"><Trash2 className="h-4 w-4" /></button></div>) : <p className="py-12 text-center text-sm text-stone">No sales yet. Your first code can launch today.</p>}
    </div>}
  </div>;
};

export default Sales;
