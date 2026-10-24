import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const categoryAdd = createAsyncThunk(
  "category/categoryAdd",
  async ({ name, image }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("image", image);
      const { data } = await api.post("/category-add", formData, {
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

export const get_category = createAsyncThunk(
  "category/get_category",
  async (
    { perPage, page, searchValue },
    { rejectWithValue, fulfillWithValue }
  ) => {
    try {
      const { data } = await api.get(
        `/category-get?page=${page}&searchValue=${searchValue}&perPage=${perPage}`,
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

export const updateCategory = createAsyncThunk(
  "category/updateCategory",
  async ({ id, name, image }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (image) {
        formData.append("image", image);
      }
      const { data } = await api.put(`/category-update/${id}`, formData, {
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

export const deleteCategory = createAsyncThunk(
  "category/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/category/${id}`);

      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.error || "⛔ Unknown error occurred";

      return rejectWithValue({ error: message });
    }
  }
);

export const categorySlice = createSlice({
  name: "category",

  initialState: {
    successMessage: "",
    errorMessage: "",
    loader: false,
    userInfo: "",
    categories: [],
    totalCategory: 0,
  },
  reducers: {
    messageClear: (state, _) => {
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(categoryAdd.pending, (state, { payload }) => {
        state.loader = true;
      })
      .addCase(categoryAdd.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || payload?.message || "⛔ Сталася помилка. Перевірте з'єднання з сервером";
      })
      .addCase(categoryAdd.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message;
        state.categories = [...state.categories, payload.category];
      })
      .addCase(get_category.fulfilled, (state, { payload }) => {
        state.totalCategory = payload.totalCategory;
        state.categories = payload.categories;
      })

      .addCase(updateCategory.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || payload?.message || "⛔ Сталася помилка. Перевірте з'єднання з сервером";
      })
      .addCase(updateCategory.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message;
        const index = state.categories.findIndex(
          (cat) => cat._id === payload.category._id
        );
        if (index !== -1) {
          state.categories[index] = payload.category;
        }
      })

      // deleteCategory
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (cat) => cat._id !== action.meta.arg
        );
        state.successMessage = action.payload.message;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.errorMessage = action.payload;
      });
  },
});
export const { messageClear } = categorySlice.actions;
export default categorySlice.reducer;
