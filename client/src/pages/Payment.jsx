import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CreditCard, LocateFixed, LoaderCircle, MapPin, ShieldCheck, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";
import PaymentForm from "../components/PaymentForm";
import { placeNewOrder } from "../store/slices/orderSlice";
import { toggleAuthPopup } from "../store/slices/popupSlice";
import { getProductImage } from "../components/Products/ProductCard";
import axiosInstance from "../lib/axios";
import { getSavedDeliveryLocation, requestDeliveryLocation } from "../lib/location";

const emptyShipping = {
  full_name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "United Arab Emirates",
  pincode: "",
  emirate: "",
  delivery_type: "Standard",
};

const emirates = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];
const formatAED = (amount) => Number(amount || 0).toLocaleString("en-AE", { style: "currency", currency: "AED" });

const fieldClass =
  "mt-1.5 w-full border-0 border-b border-border/15 bg-transparent py-2.5 text-sm outline-none transition focus:border-ink";

// Route page for `/payment`: coordinates local shipping/address/promotion form data
// with Redux cart/order state. The server creates the order and Stripe intent; the
// child PaymentForm safely confirms the payment through Stripe Elements.
const Payment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { authUser } = useSelector((state) => state.auth);
  const { cart = [] } = useSelector((state) => state.cart);
  const {
    placingOrder,
    paymentIntent,
    finalPrice,
    orderStep,
    orderId,
  } = useSelector((state) => state.order);

  // The app has already finished the session check before this route renders,
  // so the first checkout paint can include the signed-in customer's name.
  const [shipping, setShipping] = useState(() => ({
    ...emptyShipping,
    full_name: authUser?.name || "",
  }));
  const [errors, setErrors] = useState({});
  const [promotions, setPromotions] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [activePromotion, setActivePromotion] = useState(null);
  const [locating, setLocating] = useState(false);
  const [deliveryPin, setDeliveryPin] = useState(() => getSavedDeliveryLocation());
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [rememberAddress, setRememberAddress] = useState(false);

  const stripePromise = useMemo(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    return key ? loadStripe(key) : null;
  }, []);

  useEffect(() => {
    axiosInstance.get("/promotion/active")
      .then(({ data }) => setPromotions(data.promotions || []))
      .catch(() => setPromotions([]));
  }, []);

  useEffect(() => {
    if (!authUser) return;
    axiosInstance.get("/address").then(({ data }) => setSavedAddresses(data.addresses || [])).catch(() => setSavedAddresses([]));
  }, [authUser]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + Number(item.product?.price || 0) * Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const discount = useMemo(() => {
    if (!activePromotion || subtotal < Number(activePromotion.min_order_amount || 0)) return 0;
    let amount = activePromotion.discount_type === "Percent"
      ? subtotal * (Number(activePromotion.discount_value) / 100)
      : Number(activePromotion.discount_value);
    if (activePromotion.max_discount_amount) amount = Math.min(amount, Number(activePromotion.max_discount_amount));
    return Number(Math.min(amount, subtotal).toFixed(2));
  }, [activePromotion, subtotal]);

  const discountedSubtotal = subtotal - discount;
  const shippingFee = shipping.delivery_type === "Express" ? 25 : discountedSubtotal >= 250 ? 0 : 15;
  const vat = Number((discountedSubtotal * 0.05).toFixed(2));

  // Matches the server: sale discount, UAE 5% VAT, then selected delivery.
  const estimatedTotal = useMemo(() => {
    return Number((discountedSubtotal + vat + shippingFee).toFixed(2));
  }, [discountedSubtotal, vat, shippingFee]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const applySavedAddress = (address) => {
    setSelectedAddressId(address.id);
    setRememberAddress(false);
    if (address.latitude && address.longitude) setDeliveryPin({ latitude: address.latitude, longitude: address.longitude, label: address.label });
    setShipping((previous) => ({ ...previous, full_name: address.recipient_name, phone: address.phone, address: address.address, city: address.city, state: address.state, emirate: address.emirate, country: address.country, pincode: address.pincode }));
  };

  // A saved browser location can fill address fields, but customers can always review or edit them before payment.
  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const location = await requestDeliveryLocation();
      setDeliveryPin(location);
      setShipping((previous) => ({
        ...previous,
        address: previous.address || location.address || "",
        city: previous.city || location.city || "",
        state: previous.state || location.emirate || "",
        emirate: previous.emirate || (emirates.includes(location.emirate) ? location.emirate : ""),
        country: location.country || previous.country,
      }));
      toast.success(location.label ? `Delivery area set to ${location.label}.` : "Delivery area saved.");
    } catch (error) {
      toast.info(error.message || "We could not find your location.");
    } finally {
      setLocating(false);
    }
  };

  const validate = () => {
    const next = {};
    const required = [
      "full_name",
      "phone",
      "address",
      "city",
      "state",
      "country",
      "pincode",
      "emirate",
    ];

    required.forEach((key) => {
      if (!String(shipping[key] || "").trim()) {
        next[key] = "Required";
      }
    });

    if (shipping.full_name.trim() && shipping.full_name.trim().length < 3) {
      next.full_name = "Enter your full name";
    }
    if (shipping.phone && !/^[0-9+\-\s()]{7,20}$/.test(shipping.phone.trim())) {
      next.phone = "Enter a valid phone";
    }
    if (shipping.pincode && shipping.pincode.trim().length < 3) {
      next.pincode = "Enter a valid postal code";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!authUser) {
      toast.info("Please sign in to checkout.");
      dispatch(toggleAuthPopup());
      return;
    }
    if (cart.length === 0) {
      toast.error("Your bag is empty.");
      navigate("/products");
      return;
    }
    if (!validate()) {
      toast.error("Please complete shipping details.");
      return;
    }

    const orderedItems = cart.map((item) => ({
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        images: Array.isArray(item.product.images)
          ? item.product.images
          : [{ url: getProductImage(item.product) }],
      },
      quantity: item.quantity,
    }));

    // Saving is opt-in; historical shipping records stay with their orders either way.
    if (rememberAddress && !selectedAddressId) {
      const pin = getSavedDeliveryLocation();
      try {
        const { data } = await axiosInstance.post("/address", { label: "Home", recipient_name: shipping.full_name.trim(), phone: shipping.phone.trim(), address: shipping.address.trim(), city: shipping.city.trim(), state: shipping.state.trim(), emirate: shipping.emirate, country: shipping.country.trim(), pincode: shipping.pincode.trim(), latitude: pin?.latitude || "", longitude: pin?.longitude || "", is_default: savedAddresses.length === 0 });
        setSavedAddresses((current) => [data.address, ...current]);
        setSelectedAddressId(data.address.id);
        toast.success("Address saved to your delivery book.");
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not save your address.");
        return;
      }
    }

    const result = await dispatch(
      placeNewOrder({
        ...shipping,
        full_name: shipping.full_name.trim(),
        phone: shipping.phone.trim(),
        address: shipping.address.trim(),
        city: shipping.city.trim(),
        state: shipping.state.trim(),
        country: shipping.country.trim(),
        pincode: shipping.pincode.trim(),
        emirate: shipping.emirate,
        delivery_type: shipping.delivery_type,
        promoCode: activePromotion?.code || "",
        orderedItems,
      })
    );

    if (result.meta.requestStatus !== "fulfilled") return;
  };

  if (!authUser) {
    return (
      <div className="min-h-screen bg-fog text-ink">
        <div className="h-16" />
        <main className="mx-auto flex max-w-lg flex-col items-center px-6 py-32 text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone">
            Checkout
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Sign in to continue
          </h1>
          <p className="mt-4 text-stone">
            You need an account to place an order and pay securely.
          </p>
          <button
            type="button"
            onClick={() => dispatch(toggleAuthPopup())}
            className="mt-8 bg-ink px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-fog"
          >
            Sign in
          </button>
        </main>
      </div>
    );
  }

  if (cart.length === 0 && orderStep < 2) {
    return (
      <div className="min-h-screen bg-fog text-ink">
        <div className="h-16" />
        <main className="mx-auto flex max-w-lg flex-col items-center px-6 py-32 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Your bag is empty
          </h1>
          <p className="mt-4 text-stone">Add pieces before checkout.</p>
          <Link
            to="/products"
            className="mt-8 bg-ink px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-fog"
          >
            Shop
          </Link>
        </main>
      </div>
    );
  }

  const displayTotal = orderStep >= 2 && finalPrice != null ? finalPrice : estimatedTotal;

  const applyPromotion = () => {
    const found = promotions.find((promotion) => promotion.code === promoCode.trim().toUpperCase());
    if (!found) return toast.info("Enter a live sale code.");
    if (subtotal < Number(found.min_order_amount || 0)) return toast.info(`This code starts at ${formatAED(found.min_order_amount)}.`);
    setActivePromotion(found);
    setPromoCode(found.code);
    toast.success(`${found.code} applied.`);
  };

  return (
    // Checkout visual shell: fixed-navbar spacer, centered max width and mobile-safe
    // padding. The layout expands from one reading column into a 12-column grid at lg.
    <div className="min-h-screen bg-fog text-ink">
      <div className="h-16" />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 md:px-8 md:pt-14">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-stone transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continue shopping
        </Link>

        <header className="mt-8 mb-12 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> UAE checkout</span>
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Payment
          </h1>
        </header>

        {/* Checkout stepper */}
        <div className="glass-card mb-12 flex max-w-xl items-center justify-between rounded-2xl p-3 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px]">
          <div
            className={`flex items-center gap-2 ${
              orderStep >= 1 ? "text-ink" : "text-stone"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl text-[10px] ${
                orderStep > 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-ink text-fog"
              }`}
            >
              {orderStep > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
            </span>
            Shipping
          </div>
          <span className="h-px flex-1 bg-border/15" />
          <div
            className={`flex items-center gap-2 ${
              orderStep >= 2 ? "text-ink" : "text-stone"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl text-[10px] ${
                orderStep >= 2 ? "bg-ink text-fog" : "border border-border/20"
              }`}
            >
              2
            </span>
            Secure pay
          </div>
        </div>

        {/* Form owns 7 desktop columns; the summary owns 5. On phones Grid has no
            column prefix, so the checkout naturally stacks with a comfortable gap. */}
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Left: forms */}
          <div className="lg:col-span-7">
            {orderStep === 1 && (
              <form onSubmit={handlePlaceOrder} className="glass-card space-y-6 rounded-3xl p-6 md:p-8">
                <div className="flex flex-col gap-3 border-b border-border/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
                      <MapPin className="h-5 w-5 text-primary" /> Shipping details
                    </h2>
                    {deliveryPin?.label && <p className="mt-1 text-xs text-stone">Saved delivery area: {deliveryPin.label}</p>}
                  </div>
                  <button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/[.06] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[.12em] text-primary transition hover:bg-primary hover:text-white disabled:cursor-wait disabled:opacity-70">
                    {locating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    {locating ? "Locating" : "Use my location"}
                  </button>
                </div>

                {deliveryPin?.latitude && deliveryPin?.longitude && <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[.045] p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white"><MapPin className="h-4 w-4" /></span><div><p className="text-xs font-bold text-ink">Exact delivery pin saved</p><p className="mt-0.5 text-[11px] text-stone">{Number(deliveryPin.latitude).toFixed(5)}, {Number(deliveryPin.longitude).toFixed(5)}</p></div></div><a href={`https://www.google.com/maps?q=${encodeURIComponent(`${deliveryPin.latitude},${deliveryPin.longitude}`)}`} target="_blank" rel="noreferrer" className="rounded-xl border border-primary/20 bg-white px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[.12em] text-primary">Preview pin</a></div>}

                {savedAddresses.length > 0 && <div className="flex gap-3 overflow-x-auto pb-1">{savedAddresses.map((address) => <button key={address.id} type="button" onClick={() => applySavedAddress(address)} className={`min-w-[190px] rounded-2xl border p-3 text-left transition ${selectedAddressId === address.id ? "border-primary bg-primary/[.06]" : "border-border/10 bg-white/55 hover:border-primary/30"}`}><p className="text-xs font-bold">{address.label}{address.is_default ? " · Default" : ""}</p><p className="mt-1 truncate text-[11px] text-stone">{address.address}, {address.city}</p></button>)}</div>}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
                      Full name
                    </label>
                    <input
                      name="full_name"
                      value={shipping.full_name}
                      onChange={onChange}
                      className={fieldClass}
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {!selectedAddressId && <label className="sm:col-span-2 flex items-center gap-2 rounded-xl bg-primary/[.05] px-3 py-3 text-xs text-stone"><input type="checkbox" checked={rememberAddress} onChange={(event) => setRememberAddress(event.target.checked)} /> Save this as a reusable Home address</label>}

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={shipping.phone}
                      onChange={onChange}
                      className={fieldClass}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-stone">Emirate</label>
                    <select name="emirate" value={shipping.emirate} onChange={onChange} className={fieldClass}>
                      <option value="">Select emirate</option>
                      {emirates.map((emirate) => <option key={emirate}>{emirate}</option>)}
                    </select>
                    {errors.emirate && <p className="mt-1 text-xs text-red-600">{errors.emirate}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
                      Postal code
                    </label>
                    <input
                      name="pincode"
                      value={shipping.pincode}
                      onChange={onChange}
                      className={fieldClass}
                    />
                    {errors.pincode && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.pincode}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
                      Address
                    </label>
                    <input
                      name="address"
                      value={shipping.address}
                      onChange={onChange}
                      className={fieldClass}
                    />
                    {errors.address && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
                      City
                    </label>
                    <input
                      name="city"
                      value={shipping.city}
                      onChange={onChange}
                      className={fieldClass}
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
                      State
                    </label>
                    <input
                      name="state"
                      value={shipping.state}
                      onChange={onChange}
                      className={fieldClass}
                    />
                    {errors.state && (
                      <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-[0.16em] text-stone">
                      Country
                    </label>
                    <input
                      name="country"
                      value={shipping.country}
                      onChange={onChange}
                      className={fieldClass}
                    />
                    {errors.country && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.country}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] uppercase tracking-[.16em] text-stone">Delivery preference</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[{ value: "Standard", title: discountedSubtotal >= 250 ? "Complimentary delivery" : "Standard delivery", copy: discountedSubtotal >= 250 ? "Free · 2–4 business days" : "AED 15 · 2–4 business days" }, { value: "Express", title: "Express delivery", copy: "AED 25 · next business day" }].map((option) => (
                      <button key={option.value} type="button" onClick={() => setShipping((current) => ({ ...current, delivery_type: option.value }))} className={`rounded-2xl border p-4 text-left transition ${shipping.delivery_type === option.value ? "border-primary bg-primary/10 shadow-sm" : "border-border/15 bg-white/35"}`}>
                        <span className="flex items-center gap-2 font-medium"><Truck className="h-4 w-4 text-primary" />{option.title}</span><span className="mt-1 block text-xs text-stone">{option.copy}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={placingOrder}
                  className="btn-primary mt-4 w-full py-4 text-[11px] uppercase tracking-[0.22em] disabled:opacity-50 sm:w-auto sm:px-12"
                >
                  {placingOrder ? "Placing order…" : "Continue to payment"}
                </button>
              </form>
            )}

            {orderStep === 2 && paymentIntent && stripePromise && (
              <div className="glass-card rounded-3xl p-6 md:p-8">
                <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
                  <CreditCard className="h-5 w-5 text-primary" /> Card payment
                </h2>
                {orderId && (
                  <p className="mb-6 text-sm text-stone">
                    Order #{String(orderId).slice(0, 8).toUpperCase()}
                  </p>
                )}
                {/* Stripe Elements is styled through Stripe's appearance options; card fields
                    stay in Stripe's secure component rather than being hand-built inputs. */}
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: paymentIntent,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#6d4cff",
                        colorBackground: "#f8f7ff",
                        colorText: "#16182d",
                        colorDanger: "#dc2626",
                        fontFamily: "Outfit, system-ui, sans-serif",
                        borderRadius: "14px",
                      },
                    },
                  }}
                >
                  <PaymentForm amount={displayTotal} />
                </Elements>
              </div>
            )}

            {orderStep === 2 && !stripePromise && (
              <p className="text-sm text-stone">
                Loading secure payment…
              </p>
            )}
          </div>

          {/* Right: order summary */}
          <aside className="lg:col-span-5">
            <div className="glass-card rounded-3xl p-6 md:sticky md:top-24 md:p-8">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone">
                Order summary
              </h3>

              <div className="mt-6 max-h-64 space-y-4 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="h-16 w-14 shrink-0 overflow-hidden bg-mist">
                      <img
                        src={getProductImage(item.product)}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-stone">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm tabular-nums">
                      {(
                        Number(item.product.price) * item.quantity
                      ).toLocaleString("en-AE", { style: "currency", currency: "AED" })}
                    </p>
                  </div>
                ))}
              </div>

              {orderStep === 1 && (
                <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/[.045] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Sale code</p>
                  <div className="mt-2 flex gap-2">
                    <input value={promoCode} onChange={(event) => { setPromoCode(event.target.value.toUpperCase()); if (activePromotion) setActivePromotion(null); }} placeholder="LUMERA10" className="min-w-0 flex-1 rounded-xl border border-border/15 bg-white/70 px-3 py-2 text-xs font-medium tracking-[.08em] outline-none focus:border-primary" />
                    <button type="button" onClick={applyPromotion} className="rounded-xl bg-ink px-3 text-xs font-semibold text-white transition hover:bg-primary">Apply</button>
                  </div>
                  {activePromotion && <p className="mt-2 text-xs text-primary">{activePromotion.name} is applied.</p>}
                </div>
              )}

              <div className="mt-6 space-y-2 border-t border-border/10 pt-5 text-sm">
                <div className="flex justify-between text-stone">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-ink">
                    {formatAED(subtotal)}
                  </span>
                </div>
                {discount > 0 && <div className="flex justify-between text-primary"><span>Sale discount{activePromotion?.code ? ` · ${activePromotion.code}` : ""}</span><span className="tabular-nums">−{formatAED(discount)}</span></div>}
                <div className="flex justify-between text-stone">
                  <span>Delivery</span>
                  <span className="tabular-nums text-ink">{formatAED(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>UAE VAT (5%)</span><span className="tabular-nums text-ink">{formatAED(vat)}</span>
                </div>
                <div className="flex justify-between border-t border-border/10 pt-3 text-base font-medium">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatAED(displayTotal)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Payment;
