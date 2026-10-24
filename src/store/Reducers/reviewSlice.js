import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";
import { handleThunkError } from "../../utils/handleThunkError";

export const get_admin_reviews = createAsyncThunk(
  "review/get_admin_reviews",
  async ({ pageNo, status }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get(
        `/home/admin/reviews?pageNo=${pageNo}&status=${status}`,
        { withCredentials: true }
      );
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

export const review_status_update = createAsyncThunk(
  "review/review_status_update",
  async (
    { reviewId, status, adminNote },
    { rejectWithValue, fulfillWithValue }
  ) => {
    try {
      const { data } = await api.patch(
        `/home/admin/review/${reviewId}/status`,
        { status, adminNote },
        { withCredentials: true }
      );
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(handleThunkError(error));
    }
  }
);

export const reviewSlice = createSlice({
  name: "review",

  initialState: {
    successMessage: "",
    errorMessage: "",
    loader: false,
    reviews: [],
    totalReview: 0,
    pendingCount: 0,
  },
  reducers: {
    messageClear: (state, _) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(get_admin_reviews.pending, (state) => {
        state.loader = true;
      })
      .addCase(get_admin_reviews.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Не вдалося завантажити відгуки";
      })
      .addCase(get_admin_reviews.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.reviews = payload.reviews;
        state.totalReview = payload.totalReview;
        state.pendingCount = payload.pendingCount;
      })
      .addCase(review_status_update.rejected, (state, { payload }) => {
        state.errorMessage = payload?.error || "Не вдалося оновити відгук";
      })
      .addCase(review_status_update.fulfilled, (state, { payload }) => {
        state.successMessage = payload.message;
      });
  },
});

export const { messageClear } = reviewSlice.actions;
export default reviewSlice.reducer;
