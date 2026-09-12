import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  LogOut,
  ExternalLink,
  BadgePercent,
  Activity,
  Sparkles,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";

const STORE_URL = import.meta.env.VITE_STORE_URL || "http://localhost:5173";

const links = [
  { to: "/", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/users", label: "Users", icon: Users },
  { to: "/sales", label: "Sales", icon: BadgePercent },
];

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-30 border-b border-border/10 bg-fog/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 md:px-8">
          <div className="flex items-center gap-6">
            <p className="flex items-center gap-2 font-display text-lg font-semibold tracking-[.12em]"><span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-primary text-white shadow-lg"><Sparkles className="h-3.5 w-3.5" /></span>LUMERA</p>
            <span className="hidden text-[10px] uppercase tracking-[0.22em] text-stone sm:inline">
              Commerce OS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-emerald-700 lg:inline-flex"><Activity className="h-3.5 w-3.5" /> Live</span>
            <p className="hidden text-sm text-stone md:block">{authUser?.name}</p>
            <a
              href={STORE_URL}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-stone transition hover:text-ink"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Store
            </a>
            <button
              type="button"
              onClick={() => dispatch(logout())}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-stone transition hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 py-8 md:flex-row md:px-8 md:py-10">
        <aside className="md:w-56 md:shrink-0">
          <nav className="admin-glass flex gap-1 overflow-x-auto rounded-3xl p-2.5 md:sticky md:top-24 md:flex-col md:gap-1">
            {links.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                    `flex items-center gap-2.5 whitespace-nowrap px-3.5 py-3 text-sm font-medium transition ${
                    isActive ? "rounded-2xl bg-ink text-white shadow-lg" : "rounded-2xl text-stone hover:bg-white/70 hover:text-ink"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
