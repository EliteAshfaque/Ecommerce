import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle, MessageSquareText, Pencil, ShieldCheck, Star, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteReview, fetchProductDetails, postReview } from "../../store/slices/productSlice";
import { toggleAuthPopup } from "../../store/slices/popupSlice";
import { fetchMyOrders } from "../../store/slices/orderSlice";

// Display-only reusable star rating. The surrounding review component owns review data.
const Stars = ({ value, size = "h-4 w-4" }) => <span className="flex gap-0.5" aria-label={`${Number(value).toFixed(1)} out of 5 stars`}>{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`${size} ${index < Math.round(Number(value)) ? "fill-amber-400 text-amber-400" : "text-border/20"}`} />)}</span>;

// Product-detail child for reviews. It combines the passed product id with Redux
// product/auth/order data to allow verified signed-in customers to create/delete a review.
const ReviewsContainer = ({ productId }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { authUser } = useSelector((state) => state.auth);
  const { product, isPostingReview } = useSelector((state) => state.product);
  const { myOrders, fetchingOrders } = useSelector((state) => state.order);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const reviews = useMemo(() => Array.isArray(product?.reviews) ? product.reviews : [], [product]);
  const myReview = useMemo(() => reviews.find((review) => authUser && (review.reviewer?.id === authUser.id || review.user_id === authUser.id)), [reviews, authUser]);
  const hasVerifiedPurchase = useMemo(() => (myOrders || []).some((order) => order.payment_status === "Paid" && (order.order_items || []).some((item) => String(item.product_id) === String(productId))), [myOrders, productId]);
  const average = useMemo(() => reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : Number(product?.ratings || 0), [reviews, product]);
  const distribution = useMemo(() => [5, 4, 3, 2, 1].map((value) => ({ value, count: reviews.filter((review) => Math.round(Number(review.rating)) === value).length })), [reviews]);

  useEffect(() => { if (authUser) dispatch(fetchMyOrders()); }, [authUser, dispatch]);
  useEffect(() => {
    if (authUser && new URLSearchParams(location.search).get("review") === "1") {
      setRating(Number(myReview?.rating) || 5);
      setComment(myReview?.comment || "");
      setOpenForm(true);
    }
  }, [authUser, location.search, myReview]);

  const startReview = () => {
    if (!authUser) { toast.info("Please sign in to review your purchase."); dispatch(toggleAuthPopup()); return; }
    if (!fetchingOrders && !hasVerifiedPurchase) { toast.info("Reviews are available after a paid purchase."); return; }
    setRating(Number(myReview?.rating) || 5);
    setComment(myReview?.comment || "");
    setOpenForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!authUser) return startReview();
    if (!fetchingOrders && !hasVerifiedPurchase) return toast.info("Reviews are available after a paid purchase.");
    if (!comment.trim()) return toast.error("Write a short review before submitting.");
    const result = await dispatch(postReview({ productId, rating, comment: comment.trim() }));
    if (result.meta.requestStatus === "fulfilled") { setOpenForm(false); dispatch(fetchProductDetails(productId)); }
  };

  const maxCount = Math.max(...distribution.map((row) => row.count), 1);
  return <section id="reviews" className="mt-28 scroll-mt-24 border-t border-border/10 pt-14 md:pt-16"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary"><MessageSquareText className="h-3.5 w-3.5" />Customer reviews</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Loved by the LUMERA community.</h2><p className="mt-2 text-sm leading-relaxed text-stone">Reviews come from customers with paid orders only.</p></div><button type="button" onClick={openForm ? () => setOpenForm(false) : startReview} className="inline-flex w-fit items-center gap-2 rounded-xl bg-ink px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-white transition hover:bg-primary"><Pencil className="h-3.5 w-3.5" />{openForm ? "Cancel review" : myReview ? "Edit my review" : "Write a review"}</button></div>

    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"><div className="rounded-3xl border border-border/10 bg-white/75 p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-stone">Average rating</p><div className="mt-3 flex items-end gap-3"><p className="font-display text-5xl font-semibold tracking-tight">{average ? average.toFixed(1) : "—"}</p><div className="pb-1"><Stars value={average} /><p className="mt-1 text-xs text-stone">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p></div></div><div className="mt-7 space-y-2.5">{distribution.map((row) => <div key={row.value} className="flex items-center gap-3"><span className="w-7 text-xs font-medium text-stone">{row.value} star</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-[linear-gradient(90deg,#f3b846,#f7cd69)]" style={{ width: `${(row.count / maxCount) * 100}%` }} /></div><span className="w-4 text-right text-xs text-stone">{row.count}</span></div>)}</div></div><div className="rounded-3xl border border-primary/10 bg-primary/[.035] p-6"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white"><ShieldCheck className="h-5 w-5" /></span><div><p className="font-semibold text-ink">Verified buyer reviews</p><p className="mt-1 text-sm leading-relaxed text-stone">Only a customer with a successful payment can submit or edit a review.</p>{authUser && !fetchingOrders && !hasVerifiedPurchase && <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.11em] text-stone"><CheckCircle2 className="h-3.5 w-3.5" />Purchase required</p>}</div></div></div></div>

    {openForm && <form onSubmit={submit} className="mt-7 rounded-3xl border border-primary/20 bg-white p-5 shadow-[0_18px_42px_rgba(54,40,125,.09)] md:p-6"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Your rating</p><h3 className="mt-2 font-display text-2xl font-semibold">How was your experience?</h3></div><div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onMouseEnter={() => setHoveredRating(value)} onMouseLeave={() => setHoveredRating(0)} onClick={() => setRating(value)} className="rounded-lg p-1.5" aria-label={`${value} stars`}><Star className={`h-7 w-7 transition ${value <= (hoveredRating || rating) ? "fill-amber-400 text-amber-400" : "text-border/20"}`} /></button>)}</div></div><p className="mt-3 text-sm text-stone">{["Tell us what worked for you.", "It was good, with room for improvement.", "It was not what you expected.", "You had a disappointing experience.", "You loved it—tell other shoppers why."][rating - 1]}</p><textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} maxLength={1000} placeholder="Share details about product quality, fit, delivery or your experience…" className="mt-5 w-full rounded-2xl border border-border/10 bg-mist/40 px-4 py-3.5 text-sm outline-none transition placeholder:text-stone focus:border-primary focus:ring-4 focus:ring-primary/10" /><div className="mt-4 flex items-center justify-between gap-4"><p className="text-xs text-stone">{comment.length}/1000</p><button type="submit" disabled={isPostingReview} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-white disabled:opacity-60">{isPostingReview && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{isPostingReview ? "Saving" : myReview ? "Update review" : "Submit review"}</button></div></form>}

    <div className="mt-10 max-w-3xl divide-y divide-border/10">{reviews.length === 0 ? <div className="rounded-3xl bg-mist/55 px-6 py-12 text-center"><MessageSquareText className="mx-auto h-6 w-6 text-primary" /><p className="mt-4 font-display text-xl font-semibold">Be the first to share.</p><p className="mt-2 text-sm text-stone">Verified buyers can leave a review after payment.</p></div> : reviews.map((review, index) => { const isMine = authUser && (review.reviewer?.id === authUser.id || review.user_id === authUser.id); const reviewerName = review.reviewer?.name || "Verified customer"; const initials = reviewerName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(); return <article key={review.review_id || review.id || index} className="py-7 first:pt-0"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mist text-xs font-bold text-primary">{initials}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{isMine ? "Your review" : reviewerName}</p><p className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Verified buyer</p></div><Stars value={review.rating} /></div><p className="mt-4 text-sm leading-relaxed text-stone">{review.comment}</p>{isMine && <div className="mt-4 flex gap-4"><button type="button" onClick={startReview} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.12em] text-primary"><Pencil className="h-3.5 w-3.5" />Edit</button><button type="button" onClick={() => dispatch(deleteReview(productId)).then((result) => { if (result.meta.requestStatus === "fulfilled") dispatch(fetchProductDetails(productId)); })} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.12em] text-red-600"><Trash2 className="h-3.5 w-3.5" />Remove</button></div>}</div></div></article>; })}</div>
  </section>;
};

export default ReviewsContainer;
