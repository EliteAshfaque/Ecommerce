import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, LayoutDashboard, LogOut, MapPin, ShieldCheck, Upload, UserRound, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { logout, updatePassword, updateProfile } from "../../store/slices/authSlice";
import { toggleAuthPopup } from "../../store/slices/popupSlice";
import AddressBook from "../Account/AddressBook";

const tabs = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "delivery", label: "Delivery", icon: MapPin },
  { id: "security", label: "Security", icon: ShieldCheck },
];

const ProfilePanel = () => {
  const dispatch = useDispatch();
  const { isAuthPopupOpen } = useSelector((state) => state.popup);
  const { authUser, isUpdatingProfile, isUpdatingPassword } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deliveryIntent, setDeliveryIntent] = useState(null);

  useEffect(() => {
    if (!authUser) return;
    setName(authUser.name || "");
    setEmail(authUser.email || "");
  }, [authUser]);

  useEffect(() => {
    if (!isAuthPopupOpen) return undefined;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isAuthPopupOpen]);

  // This bridge receives the delivery prompt action before the Delivery tab is mounted.
  useEffect(() => {
    const openDelivery = (event) => {
      setActiveTab("delivery");
      setDeliveryIntent(event.type === "lumera:open-address-map" ? "map" : "form");
    };
    window.addEventListener("lumera:open-address-book", openDelivery);
    window.addEventListener("lumera:open-address-map", openDelivery);
    return () => {
      window.removeEventListener("lumera:open-address-book", openDelivery);
      window.removeEventListener("lumera:open-address-map", openDelivery);
    };
  }, []);

  const avatarPreview = useMemo(() => {
    if (avatar) return URL.createObjectURL(avatar);
    const raw = authUser?.avatar;
    if (!raw) return null;
    if (typeof raw === "string") {
      try { return JSON.parse(raw)?.url || raw; } catch { return raw; }
    }
    return raw?.url || null;
  }, [avatar, authUser]);

  if (!isAuthPopupOpen || !authUser) return null;

  const closePanel = () => dispatch(toggleAuthPopup());
  const handleLogout = () => { dispatch(logout()); dispatch(toggleAuthPopup()); };

  const handleUpdateProfile = (event) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return toast.error("Name and email are required.");
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    if (avatar) formData.append("avatar", avatar);
    dispatch(updateProfile(formData));
  };

  const handleUpdatePassword = (event) => {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) return toast.error("Please fill in all password fields.");
    if (newPassword !== confirmNewPassword) return toast.error("New passwords do not match.");
    if (newPassword.length < 8 || newPassword.length > 16) return toast.error("Password must be between 8 and 16 characters.");
    dispatch(updatePassword({ currentPassword, newPassword, confirmNewPassword }));
    setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
  };

  const inputClass = "mt-1.5 w-full rounded-xl border border-border/10 bg-white/75 px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-stone focus:border-primary/50 focus:ring-4 focus:ring-primary/10";
  const initials = authUser.name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "L";

  // Render at document level so page transforms, glass cards, and route layouts
  // cannot affect the account panel's stacking or opacity.
  return createPortal((
    <>
      <div className="profile-dimmer" onClick={closePanel} />
      <aside aria-label="My account" className="profile-drawer animate-slide-in-right dark:bg-[#12151c]">
        {/* Account identity keeps the drawer personal while reducing visual noise. */}
        <header className="relative overflow-hidden border-b border-border/10 bg-gradient-to-br from-[#211647] via-[#33246d] to-[#6d55f6] px-6 pb-5 pt-6 text-white">
          <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-white/65">LUMERA account</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Good to see you</h2></div><button type="button" onClick={closePanel} aria-label="Close account" className="rounded-xl border border-white/20 bg-white/10 p-2.5 transition hover:bg-white/20"><X className="h-4 w-4" /></button></div>
          <div className="relative mt-5 flex items-center gap-3">{avatarPreview ? <img src={avatarPreview} alt="" className="h-12 w-12 rounded-2xl border border-white/30 object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-sm font-bold">{initials}</div>}<div className="min-w-0"><p className="truncate font-semibold">{authUser.name}</p><p className="mt-0.5 truncate text-xs text-white/65">{authUser.email}</p></div></div>
        </header>

        <nav className="grid grid-cols-3 gap-1 border-b border-border/10 bg-white px-4 py-3 dark:bg-white/[.02]" aria-label="Account sections">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold uppercase tracking-[.1em] transition ${activeTab === id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-stone hover:bg-mist hover:text-ink"}`}><Icon className="h-4 w-4" />{label}</button>)}
        </nav>

        <main className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {activeTab === "profile" && <form onSubmit={handleUpdateProfile} className="space-y-5"><section className="rounded-2xl border border-primary/10 bg-primary/[.035] p-4"><div className="flex items-center gap-2 text-primary"><CheckCircle2 className="h-4 w-4" /><p className="text-xs font-semibold">Your account details are private and secure.</p></div></section><div className="flex items-center gap-4 rounded-2xl border border-border/10 bg-white p-4 dark:bg-white/[.02]">{avatarPreview ? <img src={avatarPreview} alt="Your avatar" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mist text-primary"><UserRound className="h-7 w-7" /></div>}<div><p className="font-semibold text-ink">Profile photo</p><p className="mt-1 text-xs leading-relaxed text-stone">A clear photo helps identify your account.</p><label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><Upload className="h-3.5 w-3.5" />Upload new<input type="file" accept="image/*" className="hidden" onChange={(event) => setAvatar(event.target.files?.[0] || null)} /></label></div></div><div><label className="text-[10px] font-bold uppercase tracking-[.16em] text-stone">Full name</label><input type="text" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></div><div><label className="text-[10px] font-bold uppercase tracking-[.16em] text-stone">Email address</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></div><button type="submit" disabled={isUpdatingProfile} className="w-full rounded-xl bg-ink py-3.5 text-[11px] font-bold uppercase tracking-[.14em] text-white transition hover:bg-primary disabled:opacity-50">{isUpdatingProfile ? "Saving changes…" : "Save profile"}</button><Link to="/orders" onClick={closePanel} className="flex w-full items-center justify-center rounded-xl border border-border/15 bg-white py-3 text-[10px] font-bold uppercase tracking-[.14em] text-primary transition hover:border-primary/35">View order history</Link></form>}
          {activeTab === "delivery" && <div><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Delivery preferences</p><h3 className="mt-1 font-display text-xl font-semibold text-ink">Your saved places</h3><p className="mt-1 text-sm leading-relaxed text-stone">Choose a default address to make checkout faster.</p></div><AddressBook deliveryIntent={deliveryIntent} onIntentHandled={() => setDeliveryIntent(null)} /></div>}
          {activeTab === "security" && <form onSubmit={handleUpdatePassword} className="space-y-5"><section className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[.06] p-4"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" /><div><p className="text-sm font-semibold text-ink">Keep your account secure</p><p className="mt-1 text-xs leading-relaxed text-stone">Use a unique password with 8–16 characters.</p></div></div></section><PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} show={showCurrentPassword} onToggle={() => setShowCurrentPassword((value) => !value)} inputClass={inputClass} /><PasswordField label="New password" value={newPassword} onChange={setNewPassword} show={showNewPassword} onToggle={() => setShowNewPassword((value) => !value)} inputClass={inputClass} /><div><label className="text-[10px] font-bold uppercase tracking-[.16em] text-stone">Confirm new password</label><input type="password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} className={inputClass} /></div><button type="submit" disabled={isUpdatingPassword} className="w-full rounded-xl bg-ink py-3.5 text-[11px] font-bold uppercase tracking-[.14em] text-white transition hover:bg-primary disabled:opacity-50">{isUpdatingPassword ? "Updating password…" : "Update password"}</button></form>}
          {authUser.role === "Admin" && <a href={import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5174"} target="_blank" rel="noreferrer" onClick={closePanel} className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-border/15 bg-white py-3 text-xs font-semibold text-ink transition hover:border-primary/35"><LayoutDashboard className="h-4 w-4" />Open admin dashboard</a>}
        </main>
        <footer className="border-t border-border/10 bg-white px-5 py-4 dark:bg-white/[.02]"><button type="button" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-500/15"><LogOut className="h-4 w-4" />Sign out securely</button></footer>
      </aside>
    </>
  ), document.body);
};

function PasswordField({ label, value, onChange, show, onToggle, inputClass }) {
  return <div className="relative"><label className="text-[10px] font-bold uppercase tracking-[.16em] text-stone">{label}</label><input type={show ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} pr-11`} /><button type="button" onClick={onToggle} className="absolute right-3 top-8 rounded-lg p-1.5 text-stone hover:bg-mist" aria-label={`Show or hide ${label}`}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>;
}

export default ProfilePanel;
