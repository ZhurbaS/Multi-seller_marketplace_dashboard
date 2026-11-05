// Завантаження /api/seller/analytics/<endpoint> з кешем у Redux і скасуванням застарілих запитів.
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../../../api/api";
import { cacheAnalytics } from "../../../../store/Reducers/sellerAnalyticsSlice";

// Стабільний рядок query (порожні значення відкидаються, ключі відсортовано)
export function stableQuery(params = {}) {
  const p = new URLSearchParams();
  Object.keys(params)
    .sort()
    .forEach((k) => {
      const v = params[k];
      if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    });
  return p.toString();
}

export function errorText(error, fallback = "Не вдалося завантажити дані. Спробуйте ще раз.") {
  if (!error) return fallback;
  if (!error.response) return "Немає зв'язку із сервером. Перевірте інтернет і спробуйте ще раз.";
  return error.response?.data?.error || error.response?.data?.message || fallback;
}

/**
 * useAnalytics(endpoint, params, { enabled }) → { data, loading, refreshing, error, reload }
 * loading — даних для цього запиту ще немає (показувати skeleton);
 * refreshing — є кешовані дані, у фоні йде оновлення.
 * Зміна параметрів скасовує попередній запит (AbortController), тож застаріла відповідь не перезапише нову.
 */
export function useAnalytics(endpoint, params = {}, { enabled = true } = {}) {
  const dispatch = useDispatch();
  const uid = useSelector((s) => s.auth?.userInfo?._id || "");
  const qs = stableQuery(params);
  const key = `${uid}|${endpoint}?${qs}`;
  const cached = useSelector((s) => s.sellerAnalytics?.cache?.[key]);
  const [state, setState] = useState({ key: null, loading: false, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled || !endpoint) return undefined;
    const ctrl = new AbortController();
    setState({ key, loading: true, error: null });
    api
      .get(`/seller/analytics/${endpoint}`, { params: Object.fromEntries(new URLSearchParams(qs)), signal: ctrl.signal, withCredentials: true })
      .then(({ data }) => {
        if (ctrl.signal.aborted) return;
        dispatch(cacheAnalytics({ key, data }));
        setState({ key, loading: false, error: null });
      })
      .catch((e) => {
        if (ctrl.signal.aborted || e?.code === "ERR_CANCELED" || e?.name === "CanceledError") return;
        setState({ key, loading: false, error: errorText(e) });
      });
    return () => ctrl.abort();
  }, [endpoint, qs, key, enabled, nonce, dispatch]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const current = state.key === key;
  const pending = !current || state.loading;
  const data = cached ? cached.data : null;
  return {
    data,
    loading: enabled && !data && pending && !(current && state.error),
    refreshing: !!data && pending,
    error: current && !data ? state.error : null,
    staleError: current && data ? state.error : null,
    reload,
  };
}
