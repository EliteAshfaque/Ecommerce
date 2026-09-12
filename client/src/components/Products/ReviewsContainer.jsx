import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Star } from "lucide-react";
import { toast } from "react-toastify";
import {
  postReview,
  deleteReview,
  fetchProductDetails,
} from "../../store/slices/productSlice";
import { toggleAuthPopup } from "../../store/slices/popupSlice";

const ReviewsContainer = ({ productId }) => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const { product, isPostingReview } = useSelector((state) => state.product);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [openForm, setOpenForm] = useState(false);

  const reviews = useMemo(() => {
    const raw = product?.reviews;
    return Array.isArray(raw) ? raw : [];
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authUser) {
      toast.info("Please sign in to review.");
      dispatch(toggleAuthPopup());
      return;
    }
    if (!comment.trim()) return toast.error("Write a short review.");

    const result = await dispatch(
      postReview({ productId, rating, comment: comment.trim() })
    );
    if (result.meta.requestStatus === "fulfilled") {
      setComment("");
      setOpenForm(false);
      dispatch(fetchProductDetails(productId));
    }
  };

  return (
    <section className="mt-28 border-t border-border/10 pt-16">
      <div className="mb-10 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Reviews
          <span className="ml-3 text-base font-normal text-stone">
            ({reviews.length})
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setOpenForm((v) => !v)}
          className="text-[11px] uppercase tracking-[0.18em] text-stone transition hover:text-ink"
        >
          {openForm ? "Cancel" : "Write a review"}
        </button>
      </div>

      {openForm && (
        <form onSubmit={handleSubmit} className="mb-12 max-w-lg">
          <div className="mb-4 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} stars`}
              >
                <Star
                  className={`h-5 w-5 ${
                    rating >= value ? "fill-ink text-ink" : "text-border/25"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Your experience…"
            className="w-full border-0 border-b border-border/15 bg-transparent py-2 text-sm outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={isPostingReview}
            className="mt-6 bg-ink px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-fog disabled:opacity-50"
          >
            {isPostingReview ? "Sending…" : "Submit"}
          </button>
        </form>
      )}

      <div className="max-w-2xl space-y-8">
        {reviews.length === 0 ? (
          <p className="text-sm text-stone">No reviews yet.</p>
        ) : (
          reviews.map((review, index) => {
            const isMine =
              authUser &&
              (review.reviewer?.id === authUser.id ||
                review.user_id === authUser.id);
            return (
              <div key={review.review_id || review.id || index}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {review.reviewer?.name || "Customer"}
                  </p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Number(review.rating)
                            ? "fill-ink text-ink"
                            : "text-border/25"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone">
                  {review.comment}
                </p>
                {isMine && (
                  <button
                    type="button"
                    onClick={() =>
                      dispatch(deleteReview(productId)).then((res) => {
                        if (res.meta.requestStatus === "fulfilled") {
                          dispatch(fetchProductDetails(productId));
                        }
                      })
                    }
                    className="mt-2 text-[11px] text-stone underline-offset-2 hover:text-ink hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ReviewsContainer;
