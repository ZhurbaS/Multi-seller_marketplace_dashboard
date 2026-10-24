import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";
import { handleThunkError } from "../../utils/handleThunkError";

export const get_seller_request = createAsyncThunk(
  "seller/get_seller_request",
  async (
    { perPage, page, searchValue },
    { rejectWithValue, fulfillWithValue }
  ) => {
    try {
      const { data } = await api.get(
        `/request-seller-get?page=${page}&searchValue=${searchValue}&perPage=${perPage}`,
        {
          withCredentials: true,
        }
      );

      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      // console.log(error.response.data);
      const message =
        error?.response?.data?.error || "⛔ Unknown error occurred";

      return rejectWithValue({ error: message });
    }
  }
);

export const get_seller = createAsyncThunk(
  "seller/get_seller",
  async (sellerId, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get(`/get-seller/${sellerId}`, {
        withCredentials: true,
      });

      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      // console.log(error.response.data);
      console.error("💥 Error in sellerSlice get_seller:", error);
      const message =
        error?.response?.data?.error || "⛔ Unknown error occurred";

      return rejectWithValue({ error: message });
    }
  }
);

export const seller_status_update = createAsyncThunk(
  "seller/seller_status_update",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post(`/seller-status-update`, info, {
        withCredentials: true,
      });

      console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      // console.log(error.response.data);
      console.error("💥 Error in sellerSlice seller_status_update:", error);
      const message =
        error?.response?.data?.error || "⛔ Unknown error occurred";

      return rejectWithValue({ error: message });
    }
  }
);

export const get_active_sellers = createAsyncThunk(
  "seller/get_active_sellers",
  async (
    { perPage, page, searchValue },
    { rejectWithValue, fulfillWithValue }
  ) => {
    try {
      const { data } = await api.get(
        `/get-sellers?page=${page}&searchValue=${searchValue}&perPage=${perPage}`,
        {
          withCredentials: true,
        }
      );

      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

export const get_deactive_sellers = createAsyncThunk(
  "seller/get_deactive_sellers",
  async (
    { perPage, page, searchValue },
    { rejectWithValue, fulfillWithValue }
  ) => {
    try {
      const { data } = await api.get(
        `/get-deactive-sellers?page=${page}&searchValue=${searchValue}&perPage=${perPage}`,
        {
          withCredentials: true,
        }
      );

      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

export const create_stripe_connect_account = createAsyncThunk(
  "seller/create_stripe_connect_account",
  async () => {
    try {
      const {
        data: { url },
      } = await api.get(`/payment/create-stripe-connect-account`, {
        withCredentials: true,
      });

      // console.log(data);

      window.location.href = url;
    } catch (error) {
      console.error(
        "💥 Error in sellerSlice: create_stripe_connect_account:",
        error?.response?.data
      );
    }
  }
);

export const active_stripe_connect_account = createAsyncThunk(
  "seller/active_stripe_connect_account",
  async (activeCode, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put(
        `/payment/active-stripe-connect-account/${activeCode}`,
        {},
        { withCredentials: true }
      );

      // console.log(data);

      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

export const sellerSlice = createSlice({
  name: "seller",

  initialState: {
    successMessage: "",
    errorMessage: "",
    loader: false,
    sellers: [],
    totalSeller: 0,
    seller: "",
  },
  reducers: {
    messageClear: (state, _) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(get_seller_request.fulfilled, (state, { payload }) => {
        state.sellers = payload.sellers;
        state.totalSeller = payload.totalSeller;
      })
      .addCase(get_seller.fulfilled, (state, { payload }) => {
        state.seller = payload.seller;
      })
      .addCase(seller_status_update.fulfilled, (state, { payload }) => {
        state.seller = payload.seller;
        state.successMessage = payload.message;
      })
      .addCase(get_active_sellers.fulfilled, (state, { payload }) => {
        state.sellers = payload.sellers;
        state.totalSeller = payload.totalSeller;
      })
      .addCase(get_deactive_sellers.fulfilled, (state, { payload }) => {
        state.sellers = payload.sellers;
        state.totalSeller = payload.totalSeller;
      })
      .addCase(active_stripe_connect_account.pending, (state, { payload }) => {
        state.loader = true;
      })
      .addCase(active_stripe_connect_account.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || payload?.message || "⛔ Сталася помилка. Перевірте з'єднання з сервером";
      })
      .addCase(
        active_stripe_connect_account.fulfilled,
        (state, { payload }) => {
          state.loader = false;
          state.successMessage = payload.message;
        }
      );
  },
});
export const { messageClear } = sellerSlice.actions;
export default sellerSlice.reducer;
