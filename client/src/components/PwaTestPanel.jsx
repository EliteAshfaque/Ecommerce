import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";

const isLocalHost = () => {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
};

const isPwaTestEnabled = () => {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("pwa-test") === "1") return true;
  return sessionStorage.getItem("lumera-pwa-test") === "1";
};

/**
 * Hidden PWA dev tools — does NOT show on the store by default.
 *
 * Open it only when testing:
 *   http://localhost:4173/?pwa-test=1
 *   or press Ctrl+Shift+P (Cmd+Shift+P on Mac) on localhost
 *
 * For a clean UI with zero overlay, use Chrome DevTools → Application instead.
 */
const PwaTestPanel = () => {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [swStatus, setSwStatus] = useState("…");
  const [standalone, setStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [manifestOk, setManifestOk] = useState(false);

  const refreshStatus = useCallback(async () => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        Boolean(window.navigator.standalone)
    );

    if (!("serviceWorker" in navigator)) {
      setSwStatus("not supported");
      return;
    }

    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      setSwStatus("none — use npm run build && npm run preview");
      return;
    }
    if (reg.installing) setSwStatus("installing");
    else if (reg.waiting) setSwStatus("update waiting");
    else if (reg.active) setSwStatus("active");
    else setSwStatus("registered");

    setManifestOk(Boolean(document.querySelector('link[rel="manifest"]')));
  }, []);

  useEffect(() => {
    if (!isLocalHost()) return;

    const boot = isPwaTestEnabled();
    setEnabled(boot);
    if (boot) setOpen(true);

    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setEnabled(true);
        sessionStorage.setItem("lumera-pwa-test", "1");
        setOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!enabled || !isLocalHost()) return;

    setOnline(navigator.onLine);
    refreshStatus();

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onBip = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      refreshStatus();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [enabled, refreshStatus]);

  if (!isLocalHost() || !enabled || !open) return null;

  const handleInstall = async () => {
    if (!installPrompt) {
      toast.info("Use Chrome menu → Install app (or iOS Share → Add to Home Screen).");
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    refreshStatus();
  };

  const closePanel = () => {
    setOpen(false);
    sessionStorage.removeItem("lumera-pwa-test");
    setEnabled(false);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[200] w-[min(100vw-2rem,18rem)] border border-border/10 bg-fog/95 p-4 shadow-xl backdrop-blur-md"
      role="dialog"
      aria-label="PWA developer tools"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone">
          PWA dev
        </p>
        <button
          type="button"
          onClick={closePanel}
          className="text-stone hover:text-ink"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <dl className="space-y-1.5 text-[11px] text-stone">
        <div className="flex justify-between gap-2">
          <dt>Network</dt>
          <dd className="font-medium text-ink">{online ? "online" : "offline"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Service worker</dt>
          <dd className="font-medium text-ink">{swStatus}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Manifest</dt>
          <dd className="font-medium text-ink">{manifestOk ? "ok" : "missing"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Standalone</dt>
          <dd className="font-medium text-ink">{standalone ? "yes" : "no"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleInstall}
          className="flex items-center justify-center gap-1.5 bg-ink py-2 text-[10px] font-semibold uppercase tracking-wider text-fog"
        >
          <Download className="h-3 w-3" />
          Install
        </button>
        <button
          type="button"
          onClick={refreshStatus}
          className="flex items-center justify-center gap-1.5 border border-border/15 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      <p className="mt-3 text-[9px] leading-relaxed text-stone/80">
        Hidden from shoppers. Chrome DevTools → Application works too. Close with × or
        Cmd+Shift+P.
      </p>
    </div>
  );
};

export default PwaTestPanel;
