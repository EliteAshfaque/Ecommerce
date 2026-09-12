import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "../store/slices/authSlice";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

const Login = () => {
  const dispatch = useDispatch();
  const { authUser, isLoggingIn, isCheckingAuth } = useSelector(
    (state) => state.auth
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isCheckingAuth && authUser?.role === "Admin") {
    return <Navigate to="/" replace />;
  }

  if (!isCheckingAuth && authUser && authUser.role !== "Admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fog px-6">
        <div className="admin-surface max-w-md rounded-3xl p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-5 font-display text-2xl font-semibold">Admin access required</h1><p className="mt-3 text-sm leading-relaxed text-stone">This signed-in account does not have LUMERA administrator permissions. Sign out, then continue with an Admin account.</p><button type="button" onClick={() => dispatch(logout())} className="mt-6 rounded-xl bg-ink px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-white transition hover:bg-primary">Sign out and continue</button></div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email: email.trim(), password }));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fog px-6 py-10">
      <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_28px_90px_rgba(42,32,110,.16)] backdrop-blur-xl lg:grid-cols-[.9fr_1.1fr]">
        <aside className="hidden bg-[#211b52] p-10 text-white lg:flex lg:flex-col"><div className="flex items-center gap-2 font-display text-lg font-semibold tracking-[.14em]"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15"><Sparkles className="h-4 w-4 text-violet-200" /></span>LUMERA</div><p className="mt-16 text-[10px] font-bold uppercase tracking-[.22em] text-violet-200">Commerce operations</p><h1 className="mt-4 max-w-xs font-display text-4xl font-semibold leading-tight">Make every store decision feel clear.</h1><div className="mt-auto space-y-4 text-sm text-white/70"><p className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-violet-200" />Role-protected access</p><p className="flex items-center gap-3"><LockKeyhole className="h-4 w-4 text-violet-200" />Secure session cookies</p></div></aside>
        <div className="p-7 sm:p-10"><div className="flex items-center gap-2 font-display text-lg font-semibold tracking-[.14em] lg:hidden"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white"><Sparkles className="h-4 w-4" /></span>LUMERA</div><p className="mt-8 text-[10px] font-bold uppercase tracking-[.22em] text-primary lg:mt-0">Admin sign in</p><h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Welcome back.</h1><p className="mt-2 text-sm leading-relaxed text-stone">Sign in to manage catalogue, orders, sales and customers.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourstore.com"
              className="mt-2 w-full rounded-xl border border-border/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="mt-2 w-full rounded-xl border border-border/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-primary disabled:opacity-50"
          >
            {isLoggingIn ? "Signing in…" : <>Sign in securely <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-stone">Administrator accounts only.</p></div>
      </div>
    </div>
  );
};

export default Login;
