import axios from "axios";

const local = import.meta.env.VITE_LOCAL;
const production = import.meta.env.VITE_PRODUCTION;

let api_url = "";
let mode = import.meta.env.VITE_SELLER_COMMISSION;

if (mode === "pro") {
  api_url = production;
} else {
  api_url = local;
}

const api = axios.create({
  baseURL: `${api_url}/api`,
  withCredentials: true,
});

export default api;
