import { useEffect, useRef, useState } from "react";
import { X, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  login,
  register,
  forgotPassword,
  resetPassword,
} from "../../store/slices/authSlice";
import { toggleAuthPopup } from "../../store/slices/popupSlice";

const titles = {
  signin: "Welcome Back",
  signup: "Create Account",
  forgot: "Forgot Password?",
  reset: "Reset Password",
};

const subtitles = {
  signin: "Sign in to continue shopping with LUMERA.",
  signup: "Join LUMERA and start your shopping journey.",
  forgot: "Enter your email and we'll send you a reset link.",
  reset: "Enter your new password below.",
};

const LoginModal = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const openedResetRef = useRef(false);

  const {
    authUser,
    isSigningUp,
    isLoggingIn,
    isRequestingForToken,
    isUpdatingPassword,
  } = useSelector((state) => state.auth);
  const { isAuthPopupOpen } = useSelector((state) => state.popup);

  const [mode, setMode] = useState("signin");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!location.pathname.startsWith("/password/reset/")) {
      openedResetRef.current = false;
      return;
    }
    setMode("reset");
    if (!openedResetRef.current) {
      openedResetRef.current = true;
      if (!isAuthPopupOpen) dispatch(toggleAuthPopup());
    }
    // Only react to route changes for reset-link deep open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (!isAuthPopupOpen || authUser) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAuthPopupOpen, authUser]);

  if (!isAuthPopupOpen || authUser) return null;

  const isLoading =
    isSigningUp || isLoggingIn || isRequestingForToken || isUpdatingPassword;

  const closeModal = () => dispatch(toggleAuthPopup());

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const switchMode = (next) => {
    setMode(next);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === "forgot") {
      if (!formData.email) return toast.error("Please enter your email.");
      dispatch(forgotPassword(formData.email)).then((res) => {
        if (res.meta.requestStatus === "fulfilled") setMode("signin");
      });
      return;
    }

    if (mode === "reset") {
      if (formData.password !== formData.confirmPassword) {
        return toast.error("Passwords do not match.");
      }
      if (formData.password.length < 8 || formData.password.length > 16) {
        return toast.error("Password must be between 8 and 16 characters.");
      }

      const token = location.pathname.split("/").pop();
      dispatch(
        resetPassword({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          setMode("signin");
          setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
          });
        }
      });
      return;
    }

    if (mode === "signup") {
      if (!formData.name || !formData.email || !formData.password) {
        return toast.error("Please fill in all fields.");
      }
      if (formData.password.length < 8 || formData.password.length > 16) {
        return toast.error("Password must be between 8 and 16 characters.");
      }
      dispatch(
        register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        })
      );
      return;
    }

    if (!formData.email || !formData.password) {
      return toast.error("Please fill in all fields.");
    }
    dispatch(
      login({
        email: formData.email.trim(),
        password: formData.password,
      })
    );
  };

  const inputClass =
    "w-full border border-border/15 bg-mist/40 py-3.5 pl-12 pr-4 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20";

  return (
    <>
      <div
        className="animate-fade-in fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="animate-scale-in pointer-events-auto relative w-full max-w-md overflow-hidden border border-border/10 bg-fog/95 p-8 shadow-2xl backdrop-blur-xl dark:bg-[#12151c]/96">
          {/* Ambient light */}
          <div className="ambient-orb -left-16 -top-16 h-40 w-40 animate-drift opacity-80" />
          <div
            className="ambient-orb -bottom-20 -right-12 h-48 w-48 opacity-60"
            style={{ animationDelay: "2s" }}
          />

          <button
            type="button"
            onClick={closeModal}
            aria-label="Close"
            className="glass-card glow-on-hover absolute right-4 top-4 z-10 rounded-lg p-2"
          >
            <X className="h-5 w-5 text-primary" />
          </button>

          <div className="relative z-10 mb-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary">
              LUMERA
            </p>
            <h2
              key={mode}
              className="mt-2 animate-fade-up font-display text-3xl font-semibold text-foreground"
            >
              {titles[mode]}
            </h2>
            <p
              key={`${mode}-sub`}
              className="mt-2 animate-fade-up text-sm text-muted-foreground"
              style={{ animationDelay: "60ms" }}
            >
              {subtitles[mode]}
            </p>
          </div>

          <form
            key={mode}
            onSubmit={handleSubmit}
            className="relative z-10 animate-fade-up space-y-4"
            style={{ animationDelay: "100ms" }}
          >
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
            )}

            {mode !== "reset" && (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                  autoComplete="email"
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  name="password"
                  placeholder={mode === "reset" ? "New Password" : "Password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                />
              </div>
            )}

            {mode === "reset" && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            )}

            {mode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-sm text-primary transition hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>
                    {mode === "reset"
                      ? "Resetting password..."
                      : mode === "signup"
                        ? "Signing up..."
                        : mode === "forgot"
                          ? "Requesting for email..."
                          : "Signing in..."}
                  </span>
                </>
              ) : (
                <>
                  {mode === "signin" && "Sign In"}
                  {mode === "signup" && "Create Account"}
                  {mode === "forgot" && "Send Reset Link"}
                  {mode === "reset" && "Reset Password"}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative z-10 mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" && (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign Up
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign In
                </button>
              </>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="font-semibold text-primary hover:underline"
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal;
