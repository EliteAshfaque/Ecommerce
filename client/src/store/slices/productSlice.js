import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";
import { toggleAIModal } from "./popupSlice";

// Server: GET /product
// Query: availability, price, category, ratings, search, page
// Response: { products, totalProducts, currentPage, totalPages, newProducts, topRated }
export const fetchProducts = createAsyncThunk(
  "product/fetchProducts",
  async (
    {
      price = "0-10000",
      category = "",
      ratings = "",
      search = "",
      page = 1,
      availability = "",
      sort = "newest",
    } = {},
    thunkApi
  ) => {
    try {
      const params = new URLSearchParams();

      if (category) params.append("category", category);
      if (price) params.append("price", price);
      if (ratings) params.append("ratings", ratings);
      if (search) params.append("search", search);
      if (page) params.append("page", page);
      if (availability) params.append("availability", availability);
      if (sort && sort !== "newest") params.append("sort", sort);

      const response = await axiosInstance.get(`/product?${params.toString()}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch products";
      toast.error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

// Server: GET /product/singleProduct/:productId
export const fetchProductDetails = createAsyncThunk(
  "product/singleProduct",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/product/singleProduct/${id}`);
      return res.data.product;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch product details";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Server: PUT /product/post-new/review/:productId
// Body: { rating, comment }
export const postReview = createAsyncThunk(
  "product/post-new/review",
  async ({ productId, rating, comment, review }, thunkAPI) => {
    try {
      const body = review || { rating, comment };
      const res = await axiosInstance.put(
        `/product/post-new/review/${productId}`,
        body
      );
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to post review";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Server: DELETE /product/delete/review/:productId
export const deleteReview = createAsyncThunk(
  "product/delete/review",
  async (productId, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(
        `/product/delete/review/${productId}`
      );
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete review";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Server: POST /product/ai-search
// Body: { userPrompt }
export const fetchProductWithAI = createAsyncThunk(
  "product/ai-search",
  async (userPrompt, thunkAPI) => {
    try {
      const body =
        typeof userPrompt === "string" ? { userPrompt } : userPrompt;

      const res = await axiosInstance.post(`/product/ai-search`, body);
      thunkAPI.dispatch(toggleAIModal());
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch product details.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  products: [],
  product: null,
  newProducts: [],
  topRatedProducts: [],
  totalProducts: 0,
  currentPage: 1,
  totalPages: 1,
  activeFilters: {},
  loading: false,
  productLoading: false,
  isPostingReview: false,
  isDeletingReview: false,
  aiLoading: false,
  aiQuery: "",
  error: null,
};

// Stores catalogue list/detail data, active API filters and request states used
// by Home, Products, ProductDetail, search, reviews and socket refreshes.
const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearProduct: (state) => {
      state.product = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.newProducts = action.payload.newProducts || [];
        // Backend returns `topRated` — store as topRatedProducts for the UI
        state.topRatedProducts = action.payload.topRated || [];
        state.totalProducts = action.payload.totalProducts || 0;
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages || 1;
        // Live updates reuse the visitor's current search/filter/page view.
        state.activeFilters = action.meta.arg || {};
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchProductDetails
      .addCase(fetchProductDetails.pending, (state) => {
        state.productLoading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.productLoading = false;
        state.product = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.productLoading = false;
        state.error = action.payload;
      })

      // postReview
      .addCase(postReview.pending, (state) => {
        state.isPostingReview = true;
      })
      .addCase(postReview.fulfilled, (state, action) => {
        state.isPostingReview = false;
        if (action.payload.product) {
          state.product = {
            ...(state.product || {}),
            ...action.payload.product,
          };
        }
      })
      .addCase(postReview.rejected, (state, action) => {
        state.isPostingReview = false;
        state.error = action.payload;
      })

      // deleteReview
      .addCase(deleteReview.pending, (state) => {
        state.isDeletingReview = true;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.isDeletingReview = false;
        if (action.payload.product) {
          state.product = {
            ...(state.product || {}),
            ...action.payload.product,
          };
        }
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.isDeletingReview = false;
        state.error = action.payload;
      })

      // fetchProductWithAI
      .addCase(fetchProductWithAI.pending, (state) => {
        state.aiLoading = true;
      })
      .addCase(fetchProductWithAI.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.products = action.payload.products || [];
        state.totalProducts = state.products.length;
        state.currentPage = 1;
        state.totalPages = 1;
        state.activeFilters = { ai: true };
        state.aiQuery = typeof action.meta.arg === "string" ? action.meta.arg : action.meta.arg?.userPrompt || "";
      })
      .addCase(fetchProductWithAI.rejected, (state, action) => {
        state.aiLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProduct } = productSlice.actions;
export default productSlice.reducer;
