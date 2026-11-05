import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

// Огляд адміністратора: GET /api/admin/analytics/overview?from&to&compare (DASHBOARD_SPEC.md §6).
// cache — відповіді за ключем query (показ одразу при поверненні на сторінку), обмеження MAX_ENTRIES.
const MAX_ENTRIES = 12;

export const overviewKey = ({ from, to, compare }) => `${from}|${to}|${compare || "prev"}`;

export const get_admin_overview = createAsyncThunk(
  "adminAnalytics/get_admin_overview",
  async ({ from, to, compare }, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/analytics/overview", {
        params: { from, to, compare: compare || "prev" },
        withCredentials: true,
      });
      return data;
    } catch (error) {
      if (!error.response) return rejectWithValue({ error: "Немає зв'язку із сервером. Перевірте інтернет і спробуйте ще раз." });
      return rejectWithValue(error.response.data || { error: "Не вдалося завантажити дані." });
    }
  },
);

const adminAnalyticsSlice = createSlice({
  name: "adminAnalytics",
  initialState: { cache: {}, order: [], loadingKey: null, errorKey: null, error: "" },
  reducers: {
    clearAdminAnalytics(state) {
      state.cache = {};
      state.order = [];
      state.error = "";
      state.errorKey = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(get_admin_overview.pending, (state, { meta }) => {
        state.loadingKey = overviewKey(meta.arg);
        state.error = "";
        state.errorKey = null;
      })
      .addCase(get_admin_overview.fulfilled, (state, { payload, meta }) => {
        const key = overviewKey(meta.arg);
        state.cache[key] = { data: payload, at: Date.now() };
        state.order = state.order.filter((k) => k !== key);
        state.order.push(key);
        while (state.order.length > MAX_ENTRIES) delete state.cache[state.order.shift()];
        if (state.loadingKey === key) state.loadingKey = null;
      })
      .addCase(get_admin_overview.rejected, (state, { payload, meta }) => {
        const key = overviewKey(meta.arg);
        if (state.loadingKey === key) state.loadingKey = null;
        state.errorKey = key;
        state.error = payload?.error || payload?.message || "Не вдалося завантажити дані. Спробуйте ще раз.";
      });
  },
});

export const { clearAdminAnalytics } = adminAnalyticsSlice.actions;
export default adminAnalyticsSlice.reducer;
