import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../../api/api";
import { errMsg, isMissing } from "./mkUtils";

export const useDebounced = (value, ms = 500) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

// Завантаження з м'якою обробкою помилок: {data, loading, error, missing, reload}
export const useApiGet = (path, params) => {
  const [state, setState] = useState({ data: null, loading: true, error: "", missing: false });
  const key = JSON.stringify(params || {});
  const req = useRef(0);
  const reload = useCallback(() => {
    if (!path) return;
    const my = ++req.current;
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get(path, { params: JSON.parse(key) })
      .then(({ data }) => my === req.current && setState({ data, loading: false, error: "", missing: false }))
      .catch(
        (e) =>
          my === req.current &&
          setState((s) => ({ ...s, loading: false, error: errMsg(e, "Не вдалося завантажити дані"), missing: isMissing(e) }))
      );
  }, [path, key]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { ...state, reload, setData: (d) => setState((s) => ({ ...s, data: typeof d === "function" ? d(s.data) : d })) };
};

// Підказки для тегів і категорій (кеш на сесію)
let sugCache = null;
export const useSuggestions = () => {
  const [s, setS] = useState(sugCache || { tags: [], categories: [] });
  useEffect(() => {
    if (sugCache) return;
    Promise.allSettled([api.get("/admin/crm/tags"), api.get("/category-get")]).then(([t, c]) => {
      const tagsRaw = t.status === "fulfilled" ? t.value.data : [];
      const tags = (Array.isArray(tagsRaw) ? tagsRaw : tagsRaw?.tags || [])
        .map((x) => (typeof x === "string" ? x : x.tag))
        .filter(Boolean);
      const categories = c.status === "fulfilled" ? (c.value.data.categories || []).map((x) => x.name).filter(Boolean) : [];
      sugCache = { tags, categories };
      setS(sugCache);
    });
  }, []);
  return s;
};
export const resetSuggestions = () => {
  sugCache = null;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex="0"]';

// Модальний шар: фокус усередині, Escape, повернення фокусу, блок прокрутки
export const useModal = (ref, onEscape, { lockScroll = true } = {}) => {
  const escRef = useRef(onEscape);
  useEffect(() => {
    escRef.current = onEscape;
  }, [onEscape]);
  useEffect(() => {
    const prev = document.activeElement;
    const el = ref.current;
    const first = el?.querySelector("[data-autofocus]") || el?.querySelector(FOCUSABLE) || el;
    first?.focus?.();
    if (lockScroll) document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (!ref.current) return;
      // Реагує лише найвищий шар
      const layers = document.querySelectorAll("[data-mk-layer]");
      if (layers[layers.length - 1] !== ref.current) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        escRef.current?.();
      } else if (e.key === "Tab") {
        const list = [...ref.current.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
        if (!list.length) return;
        const a = list[0];
        const z = list[list.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (lockScroll && !document.querySelectorAll("[data-mk-layer]").length) document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [ref, lockScroll]);
};
