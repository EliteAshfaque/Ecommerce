import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trash2 } from "lucide-react";
import {
  fetchAdminUsers,
  deleteAdminUser,
} from "../store/slices/adminSlice";

const DashboardUsers = () => {
  const dispatch = useDispatch();
  const { users, usersLoading, totalUsers, usersPage } = useSelector(
    (state) => state.admin
  );

  useEffect(() => {
    dispatch(fetchAdminUsers(1));
  }, [dispatch]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / 10));

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-stone">
          Customers
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Users
        </h1>
        <p className="mt-1 text-sm text-stone">{totalUsers} customers</p>
      </header>

      {usersLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse bg-mist" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="py-16 text-sm text-stone">No users found.</p>
      ) : (
        <div className="admin-surface divide-y divide-border/10 overflow-hidden rounded-2xl px-5">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink text-sm text-fog">
                {String(user.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-stone">{user.email}</p>
              </div>
              <p className="hidden text-xs text-stone sm:block">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : ""}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete ${user.name}?`)) {
                    dispatch(deleteAdminUser(user.id));
                  }
                }}
                className="p-2 text-stone hover:text-red-600"
                aria-label="Delete user"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => dispatch(fetchAdminUsers(page))}
              className={`h-9 min-w-9 px-2 text-sm ${
                usersPage === page
                  ? "bg-ink text-fog"
                  : "border border-border/15 text-stone"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardUsers;
