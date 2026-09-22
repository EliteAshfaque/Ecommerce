import { useEffect, useState } from "react";
import { LocateFixed, MapPin, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import axiosInstance from "../../lib/axios";
import { requestDeliveryLocation } from "../../lib/location";
import { toggleAuthPopup } from "../../store/slices/popupSlice";

// Prompt only signed-in customers with no saved database address at all.
// Global, non-blocking prompt mounted by App. It suggests saving a delivery address
// after login/location use and sends guests to the shared auth modal when needed.
const DeliveryAddressPrompt = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.authUser?.id);
  const [show, setShow] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!userId) { setShow(false); return; }
    let active = true;
    axiosInstance.get("/address").then(({ data }) => {
      if (active) setShow((data.addresses || []).length === 0);
    }).catch(() => { if (active) setShow(false); });
    const saved = () => setShow(false);
    window.addEventListener("lumera:address-saved", saved);
    return () => { active = false; window.removeEventListener("lumera:address-saved", saved); };
  }, [userId]);

  const openAddressBook = (openMap = false) => {
    setShow(false);
    dispatch(toggleAuthPopup());
    // The profile panel mounts after Redux updates; dispatch after that mount.
    window.setTimeout(() => window.dispatchEvent(new Event(openMap ? "lumera:open-address-map" : "lumera:open-address-book")), 80);
  };
  const useLocationThenOpen = async () => { setLocating(true); try { const location = await requestDeliveryLocation(); toast.success(location.address ? "Location found. Complete your Home or Office address." : "GPS pin found. Complete your Home or Office address."); openAddressBook(); } catch (error) { toast.info(error.message || "Location could not be found."); } finally { setLocating(false); } };

  if (!show) return null;
  return <div className="fixed inset-0 z-[120] flex items-end bg-[#15112f]/45 p-4 backdrop-blur-sm sm:items-center sm:justify-center"><section className="w-full max-w-md rounded-[1.8rem] border border-white/70 bg-fog p-6 shadow-2xl sm:p-8"><button type="button" onClick={() => setShow(false)} className="float-right rounded-xl p-2 text-stone hover:bg-mist" aria-label="Close"><X className="h-4 w-4" /></button><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white"><MapPin className="h-5 w-5" /></span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-primary">Delivery setup</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Where should we deliver?</h2><p className="mt-3 text-sm leading-relaxed text-stone">Save Home or Office once. We will not ask again unless you remove all saved addresses.</p><div className="mt-7 space-y-3"><button type="button" onClick={useLocationThenOpen} disabled={locating} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 text-[10px] font-bold uppercase tracking-[.14em] text-white transition hover:bg-primary disabled:opacity-60"><LocateFixed className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />{locating ? "Finding location" : "Use my current location"}</button><button type="button" onClick={() => openAddressBook(true)} className="w-full rounded-xl border border-primary/20 bg-primary/[.05] px-4 py-3.5 text-[10px] font-bold uppercase tracking-[.14em] text-primary">Search building on map</button><button type="button" onClick={() => openAddressBook(false)} className="w-full rounded-xl border border-border/15 bg-white px-4 py-3.5 text-[10px] font-bold uppercase tracking-[.14em] text-ink">Add Home or Office manually</button></div><p className="mt-4 text-center text-[11px] text-stone">You can edit or remove this address any time.</p></section></div>;
};
export default DeliveryAddressPrompt;
