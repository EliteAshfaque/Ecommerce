import { useEffect, useMemo, useState } from "react";
import { X, LogOut, Upload, Eye, EyeOff, UserRound, LayoutDashboard } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  updateProfile,
  updatePassword,
  logout,
} from "../../store/slices/authSlice";
import { toggleAuthPopup } from "../../store/slices/popupSlice";
import AddressBook from "../Account/AddressBook";

const ProfilePanel = () => {
  const dispatch = useDispatch();
  const { isAuthPopupOpen } = useSelector((state) => state.popup);
  const { authUser, isUpdatingProfile, isUpdatingPassword } = useSelector(
    (state) => state.auth
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (authUser) {
      setName(authUser.name || "");
      setEmail(authUser.email || "");
    }
  }, [authUser]);

  useEffect(() => {
    if (!isAuthPopupOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAuthPopupOpen]);

  const avatarPreview = useMemo(() => {
    if (avatar) return URL.createObjectURL(avatar);

    const raw = authUser?.avatar;
    if (!raw) return null;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return parsed?.url || null;
      } catch {
        return raw;
      }
    }
    return raw?.url || null;
  }, [avatar, authUser]);

  if (!isAuthPopupOpen || !authUser) return null;

  const closePanel = () => dispatch(toggleAuthPopup());

  const handleLogout = () => {
    dispatch(logout());
    dispatch(toggleAuthPopup());
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      return toast.error("Name and email are required.");
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    if (avatar) formData.append("avatar", avatar);

    dispatch(updateProfile(formData));
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return toast.error("Please fill in all password fields.");
    }
    if (newPassword !== confirmNewPassword) {
      return toast.error("New passwords do not match.");
    }
    if (newPassword.length < 8 || newPassword.length > 16) {
      return toast.error("Password must be between 8 and 16 characters.");
    }

    // Server expects JSON body (not FormData)
    dispatch(
      updatePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      })
    );

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const inputClass =
    "mt-1.5 w-full border border-border/15 bg-mist/50 px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20";

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={closePanel}
      />

      {/* PROFILE SIDEBAR */}
      <aside className="animate-slide-in-right fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-border/10 bg-fog/95 shadow-2xl backdrop-blur-xl dark:bg-[#12151c]/96">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border/10 px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
              Account
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              My Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close profile"
            className="glass-card glow-on-hover rounded-lg p-2"
          >
            <X className="h-5 w-5 text-primary" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {/* UPDATE PROFILE */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Update Profile
            </h3>

            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full border-2 border-primary object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/40 bg-mist">
                    <UserRound className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 text-sm text-primary transition hover:underline">
                <Upload className="h-4 w-4" />
                Change Avatar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {isUpdatingProfile ? "Updating..." : "Save Changes"}
            </button>
          </form>

          <AddressBook />

          {/* UPDATE PASSWORD */}
          <form
            onSubmit={handleUpdatePassword}
            className="space-y-4 border-t border-border/10 pt-8"
          >
            <h3 className="font-display text-lg font-semibold text-foreground">
              Change Password
            </h3>

            <div className="relative">
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Current Password
              </label>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute right-3 top-9 text-muted-foreground"
                aria-label="Toggle current password"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="relative">
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                New Password
              </label>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-9 text-muted-foreground"
                aria-label="Toggle new password"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full border border-border/15 bg-mist py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 disabled:opacity-50"
            >
              {isUpdatingPassword ? "Updating..." : "Change Password"}
            </button>
          </form>

          {authUser?.role === "Admin" && (
            <div className="border-t border-border/10 pt-6">
              <a
                href={
                  import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5174"
                }
                target="_blank"
                rel="noreferrer"
                onClick={closePanel}
                className="flex w-full items-center justify-center gap-2 border border-border/15 bg-mist py-3 text-sm font-semibold text-foreground transition hover:border-primary/30"
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin Dashboard
              </a>
            </div>
          )}

          {/* LOGOUT */}
          <div className="border-t border-border/10 pt-6 pb-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 bg-red-500/10 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ProfilePanel;
