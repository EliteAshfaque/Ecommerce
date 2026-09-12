import { useCallback, useEffect, useState } from "react";
import { Check, LocateFixed, MapPin, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../lib/axios";
import { getSavedDeliveryLocation, requestDeliveryLocation } from "../../lib/location";
import LocationPickerDialog from "./LocationPickerDialog";

const blank = { label: "Home", recipient_name: "", phone: "", address: "", city: "", state: "", emirate: "", country: "United Arab Emirates", pincode: "", latitude: "", longitude: "", is_default: false };
const emirates = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

// Account-owned addresses persist in user_addresses, not only in browser storage.
const AddressBook = ({ onSelect, deliveryIntent, onIntentHandled }) => {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const load = useCallback(async () => {
    try { const { data } = await axiosInstance.get("/address"); setAddresses(data.addresses || []); }
    catch { setAddresses([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const fillLocation = useCallback((location) => {
    setForm((previous) => ({ ...previous, address: location.address || previous.address, city: location.city || previous.city, state: location.emirate || previous.state, emirate: emirates.includes(location.emirate) ? location.emirate : previous.emirate, country: location.country || previous.country, latitude: location.latitude || previous.latitude, longitude: location.longitude || previous.longitude }));
  }, []);

  const startAddress = useCallback(() => {
    const pin = getSavedDeliveryLocation();
    setEditingId(null);
    setForm({ ...blank, address: pin?.address || "", city: pin?.city || "", state: pin?.emirate || "", emirate: emirates.includes(pin?.emirate) ? pin.emirate : "", country: pin?.country || blank.country, latitude: pin?.latitude || "", longitude: pin?.longitude || "", is_default: addresses.length === 0 });
    setOpen(true);
  }, [addresses.length]);

  // The panel stores the intent until this tab exists, then the right surface opens reliably.
  useEffect(() => {
    if (!deliveryIntent) return;
    startAddress();
    if (deliveryIntent === "map") setMapOpen(true);
    onIntentHandled?.();
  }, [deliveryIntent, onIntentHandled, startAddress]);

  const change = (event) => { const { name, value, checked, type } = event.target; setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value })); };
  const edit = (address) => { setEditingId(address.id); setForm({ ...blank, ...address, latitude: address.latitude || "", longitude: address.longitude || "" }); setOpen(true); };

  const usePin = async () => {
    setLocating(true);
    try { const location = await requestDeliveryLocation(); fillLocation(location); toast.success("Current pin added. Check the details before saving."); }
    catch (error) { toast.info(error.message || "Location could not be found."); }
    finally { setLocating(false); }
  };

  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      // The first saved address is always the default. This prevents delivery setup from asking again.
      const payload = { ...form, is_default: editingId ? form.is_default : (addresses.length === 0 || form.is_default) };
      const { data } = editingId ? await axiosInstance.put(`/address/${editingId}`, payload) : await axiosInstance.post("/address", payload);
      toast.success(data.message);
      setOpen(false); setEditingId(null); setForm(blank);
      await load();
      window.dispatchEvent(new CustomEvent("lumera:address-saved"));
    } catch (error) { toast.error(error.response?.data?.message || "Could not save address."); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { if (!window.confirm("Remove this saved address?")) return; try { const { data } = await axiosInstance.delete(`/address/${id}`); toast.success(data.message); await load(); } catch (error) { toast.error(error.response?.data?.message || "Could not remove address."); } };
  const makeDefault = async (id) => { try { const { data } = await axiosInstance.put(`/address/${id}/default`); toast.success(data.message); await load(); } catch (error) { toast.error(error.response?.data?.message || "Could not update default address."); } };

  const field = "rounded-xl border border-border/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";
  return <section className="border-t border-border/10 pt-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Delivery book</p><h3 className="mt-1 font-display text-lg font-semibold">Home, Office & more</h3></div><button type="button" onClick={startAddress} className="rounded-xl bg-ink p-2.5 text-white transition hover:bg-primary" aria-label="Add an address"><Plus className="h-4 w-4" /></button></div><p className="mt-2 text-xs leading-relaxed text-stone">Your first saved address becomes your default delivery address.</p>
    <div className="mt-4 space-y-3">{addresses.map((address) => <div key={address.id} className="rounded-2xl border border-border/10 bg-white p-3"><div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><button type="button" onClick={() => onSelect?.(address)} className="min-w-0 flex-1 text-left"><p className="text-sm font-semibold">{address.label}{address.is_default && <span className="ml-2 text-[10px] font-bold uppercase tracking-[.12em] text-primary">Default</span>}</p><p className="mt-1 text-xs leading-relaxed text-stone">{address.address}, {address.city} · {address.emirate}</p></button><div className="flex items-start gap-1"><button type="button" onClick={() => edit(address)} className="rounded-lg p-1.5 text-stone hover:bg-mist"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => remove(address.id)} className="rounded-lg p-1.5 text-stone hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div></div>{!address.is_default && <button type="button" onClick={() => makeDefault(address.id)} className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.12em] text-primary"><Star className="h-3.5 w-3.5" /> Set default</button>}</div>)}{!addresses.length && !open && <p className="rounded-2xl bg-mist/60 p-4 text-xs text-stone">No saved delivery addresses yet.</p>}</div>
    {open && <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl border border-primary/15 bg-primary/[.035] p-4"><div className="flex gap-2"><select name="label" value={form.label} onChange={change} className={`flex-1 ${field}`}><option>Home</option><option>Office</option><option>Other</option></select><button type="button" onClick={() => setMapOpen(true)} className="inline-flex items-center gap-1 rounded-xl bg-ink px-3 text-[10px] font-bold uppercase tracking-[.1em] text-white"><Search className="h-3.5 w-3.5" />Search map</button><button type="button" onClick={usePin} disabled={locating} className="inline-flex rounded-xl border border-primary/20 px-3 text-primary disabled:opacity-50" aria-label="Use current location"><LocateFixed className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} /></button></div><div className="grid grid-cols-2 gap-3"><input required name="recipient_name" value={form.recipient_name} onChange={change} placeholder="Recipient name" className={field} /><input required name="phone" value={form.phone} onChange={change} placeholder="Phone" className={field} /></div><input required name="address" value={form.address} onChange={change} placeholder="Building, street, area" className={`w-full ${field}`} /><div className="grid grid-cols-2 gap-3"><input required name="city" value={form.city} onChange={change} placeholder="City" className={field} /><select required name="emirate" value={form.emirate} onChange={(event) => { change(event); setForm((previous) => ({ ...previous, state: event.target.value })); }} className={field}><option value="">Emirate</option>{emirates.map((emirate) => <option key={emirate}>{emirate}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><input required name="pincode" value={form.pincode} onChange={change} placeholder="P.O. Box / postal code" className={field} /><label className="flex items-center gap-2 text-xs text-stone"><input type="checkbox" name="is_default" checked={form.is_default} onChange={change} /> Default address</label></div><button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[10px] font-bold uppercase tracking-[.14em] text-white disabled:opacity-60"><Check className="h-3.5 w-3.5" />{saving ? "Saving" : editingId ? "Save changes" : "Save address"}</button></form>}
    <LocationPickerDialog open={mapOpen} onClose={() => setMapOpen(false)} onSelect={(location) => { fillLocation(location); toast.success("Map location added. Review your address, then save it."); }} />
  </section>;
};

export default AddressBook;
