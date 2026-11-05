import { useEffect, useState } from "react";

/** Відкладене значення (для пошуку). */
export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export const PER_PAGE_OPTIONS = [
  { value: 5, label: "5 на сторінці" },
  { value: 10, label: "10 на сторінці" },
  { value: 20, label: "20 на сторінці" },
  { value: 50, label: "50 на сторінці" },
];

export const frontProductUrl = (slug) => `${import.meta.env.VITE_PRODUCTION_FRONT}/product/details/${slug}`;
