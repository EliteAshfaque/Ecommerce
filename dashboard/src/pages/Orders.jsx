import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trash2 } from "lucide-react";
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
} from "../store/slices/adminSlice";

const STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];

const money = (n) =>
  Number(n || 0).toLocaleString("en-AE", {
    style: "currency",
    currency: "AED",
  });

const DashboardOrders = () => {
  const dispatch = useDispatch();
  const { orders, ordersLoading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  const sorted = [...(orders || [])].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-stone">
          Fulfilment
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="mt-1 text-sm text-stone">{orders.length} total</p>
      </header>

      {ordersLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse bg-mist" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="py-16 text-sm text-stone">No orders yet.</p>
      ) : (
        <div className="admin-surface divide-y divide-border/10 overflow-hidden rounded-2xl px-5">
          {sorted.map((order) => {
            const items = Array.isArray(order.order_items)
              ? order.order_items
              : [];
            return (
              <div
                key={order.id}
                className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    #{String(order.id).slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-xs text-stone">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString()
                      : "—"}{" "}
                    · {items.length} items · {money(order.total_price)}
                  </p>
                  {order.shipping_info?.emirate && (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
                      {order.shipping_info.emirate} · {order.shipping_info.delivery_type || "Standard"} delivery
                    </p>
                  )}
                  {order.payment_status && (
                    <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      order.payment_status === "Paid" ? "bg-emerald-100 text-emerald-700" : order.payment_status === "Failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      Payment · {order.payment_status}
                    </p>
                  )}
                  {order.refund_status && order.refund_status !== "None" && (
                    <p className={`mt-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                      order.refund_status === "Succeeded" ? "text-primary" : order.refund_status === "Failed" ? "text-red-600" : "text-amber-700"
                    }`}>
                      Refund {order.refund_status}{Number(order.refund_amount || 0) ? ` · ${money(order.refund_amount)}` : ""}
                    </p>
                  )}
                </div>

                <select
                  value={order.order_status || "Processing"}
                  onChange={(e) => {
                    const status = e.target.value;
                    if (status === "Cancelled" && order.order_status !== "Cancelled" && !window.confirm(
                      `Cancel this order and issue a full Stripe refund of ${money(order.total_price)}?`
                    )) return;
                    dispatch(updateAdminOrderStatus({ orderId: order.id, status }));
                  }}
                  className="border border-border/15 bg-transparent px-3 py-2 text-sm outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Delete this order?")) {
                      dispatch(deleteAdminOrder(order.id));
                    }
                  }}
                  className="p-2 text-stone hover:text-red-600"
                  aria-label="Delete order"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardOrders;
