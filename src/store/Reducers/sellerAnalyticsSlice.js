import { createSlice } from "@reduxjs/toolkit";

// Спільний стан аналітики продавця:
//  - range — останній обраний період ({from,to,compare,preset}); переноситься між сторінками «Аналітики»
//    (джерело істини — URL query, сюди лише копія для переходів по меню без query);
//  - cache — відповіді /seller/analytics/* за ключем (userId|endpoint?query), щоб повернення на сторінку
//    показувало дані одразу (stale-while-revalidate). Обмеження — MAX_ENTRIES (LRU).
const MAX_ENTRIES = 40;

const sellerAnalyticsSlice = createSlice({
  name: "sellerAnalytics",
  initialState: { range: null, cache: {}, order: [] },
  reducers: {
    setAnalyticsRange(state, { payload }) {
      state.range = payload || null;
    },
    cacheAnalytics(state, { payload }) {
      const { key, data } = payload || {};
      if (!key) return;
      state.cache[key] = { data, at: Date.now() };
      state.order = state.order.filter((k) => k !== key);
      state.order.push(key);
      while (state.order.length > MAX_ENTRIES) delete state.cache[state.order.shift()];
    },
    clearAnalytics(state) {
      state.cache = {};
      state.order = [];
      state.range = null;
    },
  },
});

export const { setAnalyticsRange, cacheAnalytics, clearAnalytics } = sellerAnalyticsSlice.actions;
export default sellerAnalyticsSlice.reducer;
