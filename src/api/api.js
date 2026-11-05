import axios from "axios";

const local = import.meta.env.VITE_LOCAL;
const production = import.meta.env.VITE_PRODUCTION;

let api_url = "";
let mode = import.meta.env.VITE_MODE;

if (mode === "pro") {
  api_url = production;
} else {
  api_url = local;
}

const api = axios.create({
  baseURL: `${api_url}/api`,
  withCredentials: true,
});

// Старі записи мають http://res.cloudinary.com/... — на https-сайті це Mixed Content; піднімаємо до https.
api.interceptors.response.use((res) => {
  try {
    if (res.data && typeof res.data === "object") {
      const raw = JSON.stringify(res.data);
      if (raw.includes("http://res.cloudinary.com")) {
        res.data = JSON.parse(raw.replaceAll("http://res.cloudinary.com", "https://res.cloudinary.com"));
      }
    }
  } catch {
    /* залишаємо як є */
  }
  return res;
});

export default api;
