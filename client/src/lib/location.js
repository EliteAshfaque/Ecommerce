const LOCATION_STORAGE_KEY = "lumera-delivery-location";

const getAddressComponent = (components = [], type) =>
  components.find((component) => component.types?.includes(type))?.long_name || "";

const normaliseEmirate = (value = "") => {
  const candidate = value.replace(/ emirate$/i, "").trim();
  return ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"].find(
    (emirate) => emirate.toLowerCase() === candidate.toLowerCase()
  ) || "";
};

// Reads the optional browser-only delivery pin used to prefill delivery UX.
// It is not the source of truth for an order address.
export const getSavedDeliveryLocation = () => {
  try {
    return JSON.parse(window.localStorage.getItem(LOCATION_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

// Places powers building, tower, street, and area suggestions in the delivery picker.
// Loads Google Maps only after a location feature needs it, keeping first-page
// JavaScript lighter. The browser key must be restricted to approved domains.
export const loadGoogleMaps = () => new Promise((resolve, reject) => {
  if (window.google?.maps) return resolve(window.google.maps);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return reject(new Error("Maps is not configured."));

  const existing = document.querySelector("script[data-lumera-google-maps]");
  if (existing) {
    if (window.google?.maps) return resolve(window.google.maps);
    const previous = window.__lumeraMapsReady;
    window.__lumeraMapsReady = () => { previous?.(); resolve(window.google?.maps); };
    existing.addEventListener("error", () => reject(new Error("Maps could not be loaded.")), { once: true });
    return;
  }

  const script = document.createElement("script");
  script.dataset.lumeraGoogleMaps = "true";
  // Google signals API readiness through this callback when loading asynchronously.
  window.__lumeraMapsReady = () => {
    delete window.__lumeraMapsReady;
    resolve(window.google?.maps);
  };
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly&loading=async&callback=__lumeraMapsReady`;
  script.async = true;
  script.onerror = () => reject(new Error("Maps could not be loaded."));
  document.head.appendChild(script);
});

// Converts coordinates into the normalized address shape expected by address/checkout forms.
export const reverseGeocode = async (latitude, longitude) => {
  const maps = await loadGoogleMaps();
  const geocoder = new maps.Geocoder();
  const { results } = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
  const address = results?.[0];
  const components = address?.address_components || [];

  return {
    address: address?.formatted_address || "",
    city: getAddressComponent(components, "locality") || getAddressComponent(components, "administrative_area_level_2"),
    emirate: normaliseEmirate(getAddressComponent(components, "administrative_area_level_1")),
    country: getAddressComponent(components, "country"),
  };
};

// A Places Autocomplete result has the same address data shape as Geocoder.
// Converts a Places Autocomplete result into the same normalized delivery-location shape.
export const locationFromPlace = (place) => {
  const components = place?.address_components || [];
  const location = place?.geometry?.location;
  const latitude = typeof location?.lat === "function" ? location.lat() : location?.lat;
  const longitude = typeof location?.lng === "function" ? location.lng() : location?.lng;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
    address: place.formatted_address || place.name || "",
    city: getAddressComponent(components, "locality") || getAddressComponent(components, "administrative_area_level_2"),
    emirate: normaliseEmirate(getAddressComponent(components, "administrative_area_level_1")),
    country: getAddressComponent(components, "country") || "United Arab Emirates",
    label: place.name || getAddressComponent(components, "locality") || "Delivery area",
    savedAt: new Date().toISOString(),
  };
};

// Location is requested only after a customer action. Coordinates stay in this browser's local storage.
// Requests browser geolocation only after a user action, then saves a local convenience pin.
export const requestDeliveryLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error("Location is not supported by this browser."));
    return;
  }

  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const base = { latitude: coords.latitude, longitude: coords.longitude, savedAt: new Date().toISOString() };
    try {
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      const location = {
        ...base,
        ...address,
        label: address.city || address.emirate || "Delivery area saved",
      };
      window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      resolve(location);
    } catch {
      // Geolocation still helps delivery selection even if Maps or reverse-geocoding is unavailable.
      const location = { ...base, label: "Delivery area saved" };
      window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      resolve(location);
    }
  }, (error) => {
    const messages = {
      1: "Location permission was not granted.",
      2: "Your location is currently unavailable.",
      3: "Finding your location timed out.",
    };
    reject(new Error(messages[error.code] || "We could not find your location."));
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
});
