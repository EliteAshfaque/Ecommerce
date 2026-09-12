import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { store } from "./store/store.js";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
