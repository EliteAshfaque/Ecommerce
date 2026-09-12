import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/authSlice";

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
        <p className="text-sm text-stone">
          This account is not an admin. Use an Admin login.
        </p>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email: email.trim(), password }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-fog px-6">
      <div className="w-full max-w-md">
        <p className="font-display text-2xl font-semibold tracking-[0.2em]">
          LUMERA
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-stone">
          Admin dashboard
        </p>
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">
          Sign in
        </h1>

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
              className="mt-1 w-full border-0 border-b border-border/15 bg-transparent py-2.5 text-sm outline-none focus:border-ink"
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
              className="mt-1 w-full border-0 border-b border-border/15 bg-transparent py-2.5 text-sm outline-none focus:border-ink"
            />
          </div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-ink py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fog disabled:opacity-50"
          >
            {isLoggingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
