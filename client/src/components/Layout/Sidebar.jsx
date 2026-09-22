import {
  X,
  Home,
  Package,
  Info,
  HelpCircle,
  ShoppingCart,
  List,
  Phone,
  LayoutDashboard,
  Heart,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "../../store/slices/popupSlice";

// Mobile/navigation drawer controlled by popup Redux state so Navbar and this
// distant component can coordinate without passing props through App.
const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { authUser } = useSelector((state) => state.auth);
  const { isSidebarOpen } = useSelector((state) => state.popup);

  if (!isSidebarOpen) return null;

  const menuItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Products", icon: Package, path: "/products" },
    { name: "About", icon: Info, path: "/about" },
    { name: "FAQ", icon: HelpCircle, path: "/faq" },
    { name: "Contact", icon: Phone, path: "/contact" },
    { name: "Cart", icon: ShoppingCart, path: "/cart" },
    authUser && { name: "Favourites", icon: Heart, path: "/favourites" },
    authUser && { name: "My Orders", icon: List, path: "/orders" },
    authUser?.role === "Admin" && {
      name: "Dashboard",
      icon: LayoutDashboard,
      path:
        import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5174",
      external: true,
    },
  ];

  const closeSidebar = () => dispatch(toggleSidebar());

  return (
    <>
      {/* Modal-style backdrop: it occupies the viewport but stays one z-index below drawer. */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={closeSidebar}
      />

      {/* Fixed 320px navigation drawer. The slide-in animation comes from Tailwind config;
          route Links close it so navigation feels like a single mobile interaction. */}
      <aside className="glass-panel animate-slide-in-left fixed left-0 top-0 z-50 h-full w-80">
        <div className="flex items-center justify-between border-b border-border/10 p-6">
          <h2 className="font-display text-xl font-semibold text-primary">
            Menu
          </h2>
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close menu"
            className="glass-card glow-on-hover animate-smooth rounded-lg p-2"
          >
            <X className="h-5 w-5 text-primary" />
          </button>
        </div>

        <nav className="p-6">
          <ul className="space-y-2">
            {menuItems.filter(Boolean).map((item) => {
              const isActive = !item.external && location.pathname === item.path;
              const className = `group glass-card glow-on-hover animate-smooth flex items-center space-x-3 rounded-lg p-3 transition-colors ${
                isActive
                  ? "border-primary/30 text-primary"
                  : "text-foreground hover:text-primary"
              }`;
              return (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noreferrer"
                      onClick={closeSidebar}
                      className={className}
                    >
                      <item.icon className="h-5 w-5 transition-colors group-hover:text-primary" />
                      <span className="font-medium">{item.name}</span>
                    </a>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={closeSidebar}
                      className={className}
                    >
                      <item.icon className="h-5 w-5 transition-colors group-hover:text-primary" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 w-full border-t border-border/10 p-6">
          <p className="font-display text-lg font-semibold tracking-tight text-foreground">
            LUMERA
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Brighter finds, beautifully chosen.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
