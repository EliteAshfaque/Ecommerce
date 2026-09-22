import { useEffect, useRef, useState } from "react";
import { Check, LocateFixed, MapPin, Search, X } from "lucide-react";
import { locationFromPlace, loadGoogleMaps, requestDeliveryLocation, reverseGeocode } from "../../lib/location";

const UAE_CENTER = { lat: 25.2048, lng: 55.2708 };

// A real Google Maps picker: search comes from Places Autocomplete and map clicks reverse-geocode a precise pin.
// Reusable Google Maps dialog. Parent controls whether it is open and receives the
// normalized selected location; refs hold external map/marker DOM instances safely.
const LocationPickerDialog = ({ open, onClose, onSelect }) => {
  const mapElement = useRef(null);
  const searchInput = useRef(null);
  const mapInstance = useRef(null);
  const marker = useRef(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const placeMarker = async (latitude, longitude, knownLocation = null) => {
    const location = knownLocation || { latitude, longitude, ...(await reverseGeocode(latitude, longitude)), label: "Selected map pin", savedAt: new Date().toISOString() };
    setSelected(location);
    if (mapInstance.current && marker.current) {
      const point = { lat: location.latitude, lng: location.longitude };
      marker.current.setPosition(point);
      mapInstance.current.panTo(point);
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    let listeners = [];
    const initialise = async () => {
      setError("");
      try {
        const maps = await loadGoogleMaps();
        if (cancelled || !mapElement.current) return;
        const map = new maps.Map(mapElement.current, { center: UAE_CENTER, zoom: 11, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false });
        mapInstance.current = map;
        marker.current = new maps.Marker({ map, position: UAE_CENTER, visible: false });
        const autocomplete = new maps.places.Autocomplete(searchInput.current, { componentRestrictions: { country: "ae" }, fields: ["geometry", "formatted_address", "address_components", "name"] });
        autocomplete.bindTo("bounds", map);
        listeners = [
          autocomplete.addListener("place_changed", () => {
            const location = locationFromPlace(autocomplete.getPlace());
            if (location) placeMarker(location.latitude, location.longitude, location);
            else setError("Choose a suggestion with a valid map location.");
          }),
          map.addListener("click", (event) => placeMarker(event.latLng.lat(), event.latLng.lng()).catch(() => setError("We could not read that map location."))),
        ];
      } catch (mapError) {
        if (!cancelled) setError(mapError.message || "Google Maps is unavailable. Check your Maps key restrictions.");
      }
    };
    initialise();
    return () => { cancelled = true; listeners.forEach((listener) => listener?.remove?.()); mapInstance.current = null; marker.current = null; };
  }, [open]);

  const useCurrentLocation = async () => {
    setLoading(true); setError("");
    try {
      const location = await requestDeliveryLocation();
      await placeMarker(location.latitude, location.longitude, location);
    } catch (locationError) { setError(locationError.message || "We could not get your location."); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return <div className="fixed inset-0 z-[130] flex items-end bg-[#15112f]/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"><section role="dialog" aria-modal="true" aria-label="Choose delivery location" className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.7rem] bg-[#fbfbff] shadow-2xl"><header className="flex items-start justify-between border-b border-border/10 px-5 py-5 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Delivery pin</p><h2 className="mt-1 font-display text-2xl font-semibold text-ink">Find your building or area</h2><p className="mt-1 text-sm text-stone">Search a place, or tap directly on the map.</p></div><button type="button" onClick={onClose} className="rounded-xl bg-mist p-2 text-stone hover:text-ink" aria-label="Close map"><X className="h-5 w-5" /></button></header>
    <div className="p-4 sm:p-5"><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><input ref={searchInput} placeholder="Search building, street, community or landmark" className="w-full rounded-xl border border-border/15 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></div><button type="button" onClick={useCurrentLocation} disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[.05] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-primary disabled:opacity-60"><LocateFixed className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />{loading ? "Finding location" : "Use current location"}</button>{error && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>}<div ref={mapElement} className="mt-4 h-64 overflow-hidden rounded-2xl bg-mist sm:h-80" /></div>
    <footer className="border-t border-border/10 bg-white px-4 py-4 sm:flex sm:items-center sm:justify-between sm:px-6"><div className="mb-3 flex min-w-0 items-center gap-2 sm:mb-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/[.1] text-primary"><MapPin className="h-4 w-4" /></span><p className="truncate text-xs text-stone">{selected?.address || "Select a place to continue"}</p></div><button type="button" disabled={!selected} onClick={() => { onSelect(selected); onClose(); }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[10px] font-bold uppercase tracking-[.13em] text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"><Check className="h-4 w-4" />Use this location</button></footer>
  </section></div>;
};

export default LocationPickerDialog;
