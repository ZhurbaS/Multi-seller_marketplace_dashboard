import React, { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
// import App from "./App";
const App = lazy(() => import("./App"));
import { Provider } from "react-redux";
import store from "./store/index";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

const root = createRoot(document.getElementById("root"));

root.render(
  // <StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <Suspense fallback={<div>Завантаження...</div>}>
        <App />
        <Toaster
          toastOptions={{
            position: "bottom-right",
            style: {
              background: "#283046",
              color: "white",
            },
          }}
        />
      </Suspense>
    </BrowserRouter>
  </Provider>
  // </StrictMode>
);

reportWebVitals();
