import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Package, ChevronDown, ShoppingBag, Star, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../lib/axios";
import { fetchMyOrders } from "../store/slices/orderSlice";
import { toggleAuthPopup } from "../store/slices/popupSlice";

const STATUS_TABS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];

const statusStyle = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "delivered") return "text-primary";
  if (s === "cancelled") return "text-red-600";
  if (s === "shipped") return "text-ink";
  return "text-stone";
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-AE", {
    style: "currency",
    currency: "AED",
  });

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const returnReasons = ["Changed my mind", "Damaged or defective", "Wrong item received", "Not as described", "Other"];

// Small child form inside an order card. It owns return-only fields, posts the
// request to the API, then tells the parent to refresh its returns list.
const ReturnRequestForm = ({ order, items, onSubmitted }) => {
  const [reason, setReason] = useState(returnReasons[0]);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState(() => items.map((item) => ({ order_item_id: item.order_item_id, quantity: Number(item.quantity || 1) })));
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const payloadItems = selected.filter((item) => Number(item.quantity) > 0).map((item) => ({ ...item, quantity: Number(item.quantity) }));
    if (!payloadItems.length) return toast.error("Select at least one item to return.");
    setSaving(true);
    try {
      const { data } = await axiosInstance.post(`/order/${order.id}/returns`, { reason, customer_note: note, items: payloadItems });
      toast.success(data.message);
      onSubmitted();
    } catch (error) { toast.error(error.response?.data?.message || "Could not submit the return request."); }
    finally { setSaving(false); }
  };
  const setQuantity = (item, value) => setSelected((current) => current.map((row) => row.order_item_id === item.order_item_id ? { ...row, quantity: Math.max(0, Math.min(Number(item.quantity || 1), Number(value) || 0)) } : row));
  return <form onSubmit={submit} className="rounded-2xl border border-primary/15 bg-primary/[.035] p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Start a return</p><p className="mt-2 text-sm text-stone">Choose the delivered items and tell us what happened. A LUMERA team member will review your request.</p><div className="mt-4 space-y-3">{items.map((item) => <div key={item.order_item_id} className="flex items-center justify-between gap-3 rounded-xl bg-white/75 px-3 py-2.5"><p className="line-clamp-1 text-sm font-medium">{item.title || "Order item"}</p><label className="flex items-center gap-2 text-xs text-stone">Qty <input type="number" min="0" max={item.quantity} value={selected.find((row) => row.order_item_id === item.order_item_id)?.quantity ?? 0} onChange={(event) => setQuantity(item, event.target.value)} className="w-14 rounded-lg border border-border/15 bg-white px-2 py-1 text-center outline-none focus:border-primary" /></label></div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={reason} onChange={(event) => setReason(event.target.value)} className="rounded-xl border border-border/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">{returnReasons.map((option) => <option key={option}>{option}</option>)}</select><input value={note} onChange={(event) => setNote(event.target.value)} maxLength="1500" placeholder="Optional note" className="rounded-xl border border-border/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" /></div><button disabled={saving} className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.13em] text-white transition hover:bg-primary">{saving ? "Submitting…" : "Submit return request"}</button></form>;
};

// Reusable display for one order. The parent supplies order data and any linked
// returns; local state controls whether detail and return form are expanded.
const OrderCard = ({ order, returns, onReturnSubmitted }) => {
  const [open, setOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  const shipping = order.shipping_info || {};
  const shortId = String(order.id || "").slice(0, 8).toUpperCase();
  const canReview = order.payment_status === "Paid" && order.order_status !== "Cancelled";
  const canReturn = order.payment_status === "Paid" && order.order_status === "Delivered";
  const activeReturns = returns || [];

  return (
    <article className="border-b border-border/10 py-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-6 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="font-display text-lg font-semibold tracking-tight">
              Order #{shortId}
            </p>
            <span
              className={`text-[11px] uppercase tracking-[0.18em] ${statusStyle(
                order.order_status
              )}`}
            >
              {order.order_status || "Processing"}
            </span>
          </div>
          <p className="mt-2 text-sm text-stone">
            {formatDate(order.created_at)} · {items.length}{" "}
            {items.length === 1 ? "item" : "items"} ·{" "}
            {formatMoney(order.total_price)}
          </p>
          {order.payment_status && order.payment_status !== "Paid" && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-amber-700">
              Payment {order.payment_status}
            </p>
          )}
          {order.refund_status && order.refund_status !== "None" && (
            <p className={`mt-2 text-[10px] uppercase tracking-[0.16em] ${
              order.refund_status === "Succeeded" ? "text-primary" : order.refund_status === "Failed" ? "text-red-600" : "text-amber-700"
            }`}>
              Refund {order.refund_status.toLowerCase()}
              {Number(order.refund_amount || 0) ? ` · ${formatMoney(order.refund_amount)}` : ""}
            </p>
          )}

          {/* Thumbnail strip */}
          {items.length > 0 && (
            <div className="mt-5 flex gap-2">
              {items.slice(0, 4).map((item) => (
                <div
                  key={item.order_item_id || item.product_id}
                  className="h-14 w-12 overflow-hidden bg-mist"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title || "Item"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-4 w-4 text-stone/40" />
                    </div>
                  )}
                </div>
              ))}
              {items.length > 4 && (
                <div className="flex h-14 w-12 items-center justify-center bg-mist text-[11px] text-stone">
                  +{items.length - 4}
                </div>
              )}
            </div>
          )}
        </div>

        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-stone transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-8 animate-fade-in space-y-8 border-t border-border/10 pt-8">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.order_item_id || `${item.product_id}-${item.title}`}
                className="flex gap-4"
              >
                <div className="h-20 w-16 shrink-0 overflow-hidden bg-mist">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title || "Item"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-5 w-5 text-stone/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">
                    {item.title || "Product"}
                  </p>
                  <p className="mt-1 text-sm text-stone">
                    Qty {item.quantity} · {formatMoney(item.price)}
                  </p>
                  {canReview && item.product_id && <Link to={`/product/${item.product_id}?review=1#reviews`} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/[.07] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-primary transition hover:bg-primary hover:text-white"><Star className="h-3.5 w-3.5" />Rate & review</Link>}
                </div>
                <p className="shrink-0 text-sm tabular-nums">
                  {formatMoney(Number(item.price) * Number(item.quantity || 1))}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone">
                Shipping
              </p>
              {shipping.full_name ? (
                <div className="mt-3 space-y-1 text-sm text-ink/80">
                  <p>{shipping.full_name}</p>
                  <p>{shipping.address}</p>
                  <p>
                    {[shipping.city, shipping.state, shipping.emirate, shipping.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{shipping.country}</p>
                  {shipping.delivery_type && (
                    <p className="pt-1 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                      {shipping.delivery_type} delivery
                    </p>
                  )}
                  {shipping.phone && <p>{shipping.phone}</p>}
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone">No shipping details</p>
              )}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone">
                Summary
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-stone">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-ink">
                    {formatMoney(
                      Number(order.total_price) -
                        Number(order.tax_price || 0) -
                        Number(order.shipping_price || 0) +
                        Number(order.discount_price || 0)
                    )}
                  </span>
                </div>
                {Number(order.discount_price || 0) > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Sale {order.promotion_code ? `· ${order.promotion_code}` : "discount"}</span>
                    <span className="tabular-nums">−{formatMoney(order.discount_price)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone">
                  <span>Shipping</span>
                  <span className="tabular-nums text-ink">
                    {formatMoney(order.shipping_price)}
                  </span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>Tax</span>
                  <span className="tabular-nums text-ink">
                    {formatMoney(order.tax_price)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/10 pt-2 font-medium">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatMoney(order.total_price)}
                  </span>
                </div>
                {order.refund_status && order.refund_status !== "None" && (
                  <div className="flex justify-between pt-1 text-primary">
                    <span>Refund {order.refund_status.toLowerCase()}</span>
                    <span className="tabular-nums">{formatMoney(order.refund_amount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {activeReturns.length > 0 && <div className="rounded-2xl border border-border/10 bg-mist/55 p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-stone">Return requests</p><div className="mt-3 space-y-2">{activeReturns.map((request) => <p key={request.id} className="text-sm text-ink/75"><span className="font-medium">{request.status}</span> · {request.reason} · requested {formatDate(request.requested_at)}</p>)}</div></div>}
          {canReturn && !activeReturns.some((request) => ["Requested", "Approved", "Received"].includes(request.status)) && (returnOpen ? <ReturnRequestForm order={order} items={items} onSubmitted={() => { setReturnOpen(false); onReturnSubmitted(); }} /> : <button type="button" onClick={() => setReturnOpen(true)} className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/20 bg-primary/[.05] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.13em] text-primary transition hover:bg-primary hover:text-white"><RotateCcw className="h-3.5 w-3.5" />Start a return</button>)}
        </div>
      )}
    </article>
  );
};

// Route page for `/orders`: fetches the signed-in customer's orders through Redux
// and return requests directly, then groups/filter them before rendering OrderCards.
const Orders = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const { myOrders, fetchingOrders, error } = useSelector((state) => state.order);
  const [tab, setTab] = useState("All");
  const [returns, setReturns] = useState([]);

  const loadReturns = async () => {
    try {
      const { data } = await axiosInstance.get("/order/returns/me");
      setReturns(data.returns || []);
    } catch (requestError) {
      // The order history stays usable even if the optional returns service is unavailable.
      console.error("Could not load returns", requestError);
    }
  };

  useEffect(() => {
    if (authUser) {
      dispatch(fetchMyOrders());
      loadReturns();
    }
  }, [authUser, dispatch]);

  const returnsByOrder = useMemo(() => returns.reduce((all, request) => ({ ...all, [request.order_id]: [...(all[request.order_id] || []), request] }), {}), [returns]);

  const filtered = useMemo(() => {
    const list = Array.isArray(myOrders) ? [...myOrders] : [];
    list.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    if (tab === "All") return list;
    return list.filter(
      (o) =>
        String(o.order_status || "").toLowerCase() === tab.toLowerCase()
    );
  }, [myOrders, tab]);

  if (!authUser) {
    return (
      <div className="min-h-screen bg-fog text-ink">
        <div className="h-16" />
        <main className="mx-auto flex max-w-lg flex-col items-center px-6 py-32 text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone">
            Account
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Your orders
          </h1>
          <p className="mt-4 text-stone">
            Sign in to view order history and tracking.
          </p>
          <button
            type="button"
            onClick={() => dispatch(toggleAuthPopup())}
            className="mt-8 bg-ink px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-fog transition hover:bg-primary"
          >
            Sign in
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog text-ink">
      <div className="h-16" />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-12 md:px-8 md:pt-16">
        <header className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone">
            Account
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Orders
          </h1>
          <p className="mt-3 text-stone">
            {fetchingOrders
              ? "Loading…"
              : `${myOrders.length} ${myOrders.length === 1 ? "order" : "orders"}`}
          </p>
        </header>

        {/* Status tabs */}
        <div className="mb-4 flex gap-5 overflow-x-auto border-b border-border/10 pb-4">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setTab(status)}
              className={`shrink-0 text-[11px] uppercase tracking-[0.18em] transition ${
                tab === status
                  ? "text-ink"
                  : "text-stone hover:text-ink"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {fetchingOrders ? (
          <div className="space-y-8 py-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse border-b border-border/10 py-8">
                <div className="h-5 w-40 bg-mist" />
                <div className="mt-3 h-4 w-56 bg-mist" />
                <div className="mt-5 flex gap-2">
                  <div className="h-14 w-12 bg-mist" />
                  <div className="h-14 w-12 bg-mist" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl font-semibold">
              Couldn’t load orders
            </p>
            <p className="mt-2 text-sm text-stone">{error}</p>
            <button
              type="button"
              onClick={() => dispatch(fetchMyOrders())}
              className="mt-6 text-[11px] uppercase tracking-[0.18em] text-stone underline-offset-4 hover:text-ink hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-28 text-center">
            <ShoppingBag className="h-8 w-8 text-stone/40" />
            <p className="mt-6 font-display text-2xl font-semibold">
              {tab === "All" ? "No orders yet" : `No ${tab.toLowerCase()} orders`}
            </p>
            <p className="mt-2 max-w-sm text-sm text-stone">
              When you place an order, it will appear here with status and
              details.
            </p>
            <Link
              to="/products"
              className="mt-8 bg-ink px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-fog transition hover:bg-primary"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div>
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} returns={returnsByOrder[order.id]} onReturnSubmitted={loadReturns} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
