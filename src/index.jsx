import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import store from "./store/index";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { initThemeMode } from "./utils/themeMode";
import { applyCachedStoreTheme, initStoreTheme } from "./utils/theme";

const App = lazy(() => import("./App"));

// Тема: режим світла/темна + кольори магазину — до першого рендера (без «блимання»).
initThemeMode();
applyCachedStoreTheme();
initStoreTheme();

const root = createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="min-h-screen grid place-items-center bg-(--page) text-(--ink-2)" role="status">
            Завантаження…
          </div>
        }
      >
        <App />
        <Toaster
          toastOptions={{
            position: "bottom-right",
            style: {
              background: "var(--ink)",
              color: "var(--surface)",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </Suspense>
    </BrowserRouter>
  </Provider>,
);

reportWebVitals();
