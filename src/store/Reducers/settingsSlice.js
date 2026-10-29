import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";
import { handleThunkError } from "../../utils/handleThunkError";

export const get_discounts = createAsyncThunk(
  "settings/get_discounts",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get("/home/settings/discounts", {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

export const update_discounts = createAsyncThunk(
  "settings/update_discounts",
  async (orderDiscountTiers, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put(
        "/admin/settings/discounts",
        { orderDiscountTiers },
        { withCredentials: true }
      );
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

// Комісія магазину (адмін)
export const get_commission = createAsyncThunk(
  "settings/get_commission",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get("/admin/settings/commission", {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

export const update_commission = createAsyncThunk(
  "settings/update_commission",
  async (body, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put("/admin/settings/commission", body, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

// Індивідуальна комісія продавця (адмін): percent = null — за категорією, 0 — власний магазин
export const update_seller_commission = createAsyncThunk(
  "settings/update_seller_commission",
  async ({ sellerId, percent }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put(
        `/admin/seller/${sellerId}/commission`,
        { percent },
        { withCredentials: true }
      );
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

// Продавець: яку комісію він платить (для підказки в картці товару)
export const get_commission_info = createAsyncThunk(
  "settings/get_commission_info",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get("/seller/commission-info", {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

export const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    orderDiscountTiers: [],
    commission: null, // { defaultCommissionPercent, categoryCommissions, payoutHoldDays }
    commissionInfo: null, // для продавця
    loader: false,
    successMessage: "",
    errorMessage: "",
  },
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(get_discounts.fulfilled, (state, { payload }) => {
        state.orderDiscountTiers = payload.orderDiscountTiers || [];
      })
      .addCase(get_discounts.rejected, (state, { payload }) => {
        state.errorMessage = payload?.error || "Не вдалося завантажити знижки";
      })
      .addCase(update_discounts.pending, (state) => {
        state.loader = true;
      })
      .addCase(update_discounts.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Не вдалося зберегти знижки";
      })
      .addCase(update_discounts.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.orderDiscountTiers = payload.orderDiscountTiers;
        state.successMessage = payload.message;
      })
      .addCase(get_commission.fulfilled, (state, { payload }) => {
        state.commission = payload;
      })
      .addCase(get_commission.rejected, (state, { payload }) => {
        state.errorMessage = payload?.error || "Не вдалося завантажити комісію";
      })
      .addCase(update_commission.pending, (state) => {
        state.loader = true;
      })
      .addCase(update_commission.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Не вдалося зберегти комісію";
      })
      .addCase(update_commission.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.commission = payload;
        state.successMessage = payload.message;
      })
      .addCase(update_seller_commission.rejected, (state, { payload }) => {
        state.errorMessage = payload?.error || "Не вдалося зберегти комісію продавця";
      })
      .addCase(update_seller_commission.fulfilled, (state, { payload }) => {
        state.successMessage = payload.message;
      })
      .addCase(get_commission_info.fulfilled, (state, { payload }) => {
        state.commissionInfo = payload;
      });
  },
});

export const { messageClear } = settingsSlice.actions;
export default settingsSlice.reducer;
