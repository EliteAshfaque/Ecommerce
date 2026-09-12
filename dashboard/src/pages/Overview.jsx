import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats } from "../store/slices/adminSlice";
import StatCard, { money } from "../components/StatCard";

const Overview = () => {
  const dispatch = useDispatch();
  const { stats, statsLoading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (statsLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse bg-mist" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse bg-mist" />
          ))}
        </div>
      </div>
    );
  }

  const status = stats.orderStatusCounts || {};
  const monthly = stats.monthlySales || [];
  const maxSales = Math.max(
    ...monthly.map((m) => Number(m.totalSales) || 0),
    1
  );

  return (
    <div>
      <header className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-stone">
          Overview
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-stone">
          Growth {stats.revenueGrowth || "0%"} · {stats.newUsersThisMonth || 0}{" "}
          new users this month
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={money(stats.totalRevenueAllTime)} />
        <StatCard label="This month" value={money(stats.currentMonthSales)} />
        <StatCard label="Today" value={money(stats.todayRevenue)} />
        <StatCard
          label="Customers"
          value={String(stats.totalUsersCount || 0)}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="admin-surface rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Orders</h2>
            <Link
              to="/orders"
              className="text-[11px] uppercase tracking-[0.16em] text-stone hover:text-ink"
            >
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {["Processing", "Shipped", "Delivered", "Cancelled"].map((key) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-stone">{key}</span>
                <span className="font-medium tabular-nums">
                  {status[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-surface rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Low stock</h2>
            <Link
              to="/products"
              className="text-[11px] uppercase tracking-[0.16em] text-stone hover:text-ink"
            >
              Products
            </Link>
          </div>
          {(stats.lowStockProducts || []).length === 0 ? (
            <p className="text-sm text-stone">All products are healthy.</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStockProducts.slice(0, 6).map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate pr-4">{p.name}</span>
                  <span className="tabular-nums text-stone">{p.stock}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="admin-surface mt-8 rounded-2xl p-6">
        <h2 className="mb-6 font-display text-lg font-semibold">
          Monthly sales
        </h2>
        {monthly.length === 0 ? (
          <p className="text-sm text-stone">No sales data yet.</p>
        ) : (
          <div className="flex h-40 items-end gap-2">
            {monthly.slice(-8).map((row) => (
              <div
                key={row.month}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className="w-full bg-ink/80 transition hover:bg-primary"
                  style={{
                    height: `${Math.max(
                      8,
                      (Number(row.totalSales) / maxSales) * 100
                    )}%`,
                  }}
                  title={money(row.totalSales)}
                />
                <span className="text-[9px] uppercase tracking-wide text-stone">
                  {String(row.month).slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {(stats.topSellingProducts || []).length > 0 && (
        <section className="admin-surface mt-8 rounded-2xl p-6">
          <h2 className="mb-6 font-display text-lg font-semibold">
            Top selling
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.topSellingProducts.slice(0, 5).map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="aspect-[4/5] overflow-hidden bg-mist">
                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-stone">{p.totalQuantity} sold</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Overview;
