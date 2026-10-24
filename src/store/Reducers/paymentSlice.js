import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";
import { handleThunkError } from "../../utils/handleThunkError";
import Payment from "./../../views/seller/Payments";

export const get_seller_payment_details = createAsyncThunk(
  "payment/get_seller_payment_details",
  async (sellerId, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get(
        `/payment/seller-payment-details/${sellerId}`,
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

export const send_withdrawal_request = createAsyncThunk(
  "payment/send_withdrawal_request",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post(`/payment/withdrawal-request`, info, {
        withCredentials: true,
      });

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

export const get_payment_requests = createAsyncThunk(
  "payment/get_payment_requests",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get(`/payment/requests`, {
        withCredentials: true,
      });

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

export const confirm_payment_request = createAsyncThunk(
  "payment/confirm_payment_request",
  async (paymentId, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post(
        `/payment/request-confirm`,
        { paymentId },
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

export const PaymentSlice = createSlice({
  name: "payment",

  initialState: {
    successMessage: "",
    errorMessage: "",
    loader: false,
    pendingWithdrawals: [],
    successWithdrawals: [],
    totalAmount: 0,
    withdrawalAmount: 0,
    pendingAmount: 0,
    availableAmount: 0,
  },
  reducers: {
    messageClear: (state, _) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(get_seller_payment_details.fulfilled, (state, { payload }) => {
        state.pendingWithdrawals = payload.pendingWithdrawals;
        state.successWithdrawals = payload.successWithdrawals;
        state.totalAmount = payload.totalAmount;
        state.withdrawalAmount = payload.withdrawalAmount;
        state.pendingAmount = payload.pendingAmount;
        state.availableAmount = payload.availableAmount;
      })
      .addCase(send_withdrawal_request.pending, (state, { payload }) => {
        state.loader = true;
      })
      .addCase(send_withdrawal_request.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || payload?.message || "⛔ Сталася помилка. Перевірте з'єднання з сервером";
      })
      .addCase(send_withdrawal_request.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message;
        state.pendingWithdrawals = [
          ...state.pendingWithdrawals,
          payload.withdrawal,
        ];
        state.availableAmount =
          state.availableAmount - payload.withdrawal.amount;
        state.pendingAmount += payload.withdrawal.amount;
      })
      .addCase(get_payment_requests.fulfilled, (state, { payload }) => {
        state.pendingWithdrawals = payload.withdrawalRequestsArr;
      })
      .addCase(confirm_payment_request.pending, (state, { payload }) => {
        state.loader = true;
      })
      .addCase(confirm_payment_request.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || payload?.message || "⛔ Сталася помилка. Перевірте з'єднання з сервером";
      })
      .addCase(confirm_payment_request.fulfilled, (state, { payload }) => {
        const temp = state.pendingWithdrawals.filter(
          (r) => r._id !== payload.payment._id
        );
        state.loader = false;
        state.successMessage = payload.message;
        state.pendingWithdrawals = temp;
      });
  },
});
export const { messageClear } = PaymentSlice.actions;
export default PaymentSlice.reducer;
