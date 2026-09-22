import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { store } from "./store/store.js";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
// Load all languages once at app start (i18next). No Redux translation slice.
import "./translation/i18n.js";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";

// Registers the service worker generated at build time (vite-plugin-pwa).
// autoUpdate: new version applies when user revisits after you deploy.
registerSW({ immediate: true });

// Application bootstrap: Redux makes shared state available, ThemeProvider supplies
// the light/dark setting, and ToastContainer displays messages from pages/thunks.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
        <ToastContainer position="top-right" autoClose={1000} />
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
