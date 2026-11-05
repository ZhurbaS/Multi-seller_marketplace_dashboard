// Кеш товарів для блоку «products» (GET /admin/crm/product-search?ids=) і хук {id: товар}
import { useEffect, useState } from "react";
import api from "../../../../api/api";
import { CRM } from "../mkUtils";

export const MAX_PRODUCTS = 6;

// Кеш товарів на сесію (id → товар), щоб прев'ю й список не перезапитували
const cache = new Map();
export const cacheProduct = (p) => cache.set(String(p._id), p);

export const fetchProducts = async (ids) => {
  const need = [...new Set(ids || [])].filter((id) => !cache.has(id));
  if (need.length) {
    for (let i = 0; i < need.length; i += MAX_PRODUCTS) {
      const { data } = await api.get(`${CRM}/product-search`, { params: { ids: need.slice(i, i + MAX_PRODUCTS).join(",") } });
      (data?.products || []).forEach((p) => cache.set(String(p._id), p));
    }
  }
  return Object.fromEntries((ids || []).filter((id) => cache.has(id)).map((id) => [id, cache.get(id)]));
};

// {id: product} для набору id (для схематичного прев'ю)
export const useProductsMap = (ids) => {
  const key = (ids || []).join(",");
  const [map, setMap] = useState({});
  useEffect(() => {
    if (!key) return setMap({});
    let alive = true;
    fetchProducts(key.split(","))
      .then((m) => alive && setMap(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);
  return map;
};

