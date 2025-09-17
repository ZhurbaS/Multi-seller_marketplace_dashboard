import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";
import { handleThunkError } from "../../utils/handleThunkError";

export const get_admin_orders = createAsyncThunk(
  "order/get_admin_orders",
  async (
    { perPage, page, searchValue },
    { rejectWithValue, fulfillWithValue }
  ) => {
    try {
      const { data } = await api.get(
        `/admin/orders?page=${page}&searchValue=${searchValue}&perPage=${perPage}`,
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

export const get_admin_order_details = createAsyncThunk(
  "order/get_admin_order_details",
  async (orderId, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get(`/admin/order/${orderId}`, {
        withCredentials: true,
      });

      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

export const orderSlice = createSlice({
  name: "order",

  initialState: {
    successMessage: "",
    errorMessage: "",
    totalOrderCount: 0,
    order: {},
    myOrdersArr: [],
  },
  reducers: {
    messageClear: (state, _) => {
      state.errorMessage = "";
      state.successMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(get_admin_orders.fulfilled, (state, { payload }) => {
      state.totalOrderCount = payload.totalOrderCount;
      state.myOrdersArr = payload.myOrdersArr;
    });
  },
});
export const { messageClear } = orderSlice.actions;
export default orderSlice.reducer;
