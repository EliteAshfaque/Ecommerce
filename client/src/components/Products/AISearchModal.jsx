import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { fetchProductWithAI } from "../../store/slices/productSlice";
import { toggleAIModal, toggleAuthPopup } from "../../store/slices/popupSlice";

const prompts = [
  "Minimal wooden furniture for a calm living room",
  "Everyday luxury fashion under $300",
  "Premium electronics for focus and travel",
  "Kitchen pieces with timeless materials",
];

const AISearchModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAIPopupOpen } = useSelector((state) => state.popup);
  const { authUser } = useSelector((state) => state.auth);
  const { aiLoading } = useSelector((state) => state.product);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!isAIPopupOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAIPopupOpen]);

  if (!isAIPopupOpen) return null;

  const close = () => dispatch(toggleAIModal());

  const submit = async (value = prompt) => {
    const text = value.trim();
    if (!text) return toast.error("Describe what you're looking for.");

    if (!authUser) {
      toast.info("Sign in to use AI Find.");
      close();
      dispatch(toggleAuthPopup());
      return;
    }

    const result = await dispatch(fetchProductWithAI(text));
    if (result.meta.requestStatus === "fulfilled") {
      setPrompt("");
      navigate("/products?ai=1");
    }
  };

  return (
    <>
      <div
        className="animate-fade-in fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="animate-scale-in pointer-events-auto relative w-full max-w-lg overflow-hidden border border-border/10 bg-fog/95 p-8 shadow-2xl backdrop-blur-xl dark:bg-[#12151c]/96">
          <div className="ambient-orb -left-12 -top-12 h-36 w-36 opacity-70" />

          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 p-2 text-muted-foreground transition hover:text-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <p className="text-[11px] uppercase tracking-[0.28em]">AI Find</p>
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold text-foreground">
              Describe your ideal piece
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell LUMERA what you need — mood, material, use — and we&apos;ll
              curate matches.
            </p>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. Soft lighting and linen textures for a quiet bedroom…"
              className="mt-6 w-full border border-border/15 bg-mist/40 px-4 py-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />

            <button
              type="button"
              onClick={() => submit()}
              disabled={aiLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding pieces…
                </>
              ) : (
                <>
                  Find with AI
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="mt-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Try
              </p>
              {prompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setPrompt(item);
                    submit(item);
                  }}
                  className="block w-full border border-border/10 px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AISearchModal;
