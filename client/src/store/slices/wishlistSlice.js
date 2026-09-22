import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axiosInstance from "../../lib/axios";

export const fetchWishlist = createAsyncThunk("wishlist/fetch", async (_, thunkApi) => {
  try {
    const { data } = await axiosInstance.get("/wishlist");
    return data.products || [];
  } catch (error) {
    return thunkApi.rejectWithValue(error.response?.data?.message || "Could not load favourites.");
  }
});

export const toggleWishlist = createAsyncThunk(
  "wishlist/toggle",
  async (productId, thunkApi) => {
    const saved = thunkApi.getState().wishlist.products.some((product) => product.id === productId);
    try {
      const { data } = saved
        ? await axiosInstance.delete(`/wishlist/${productId}`)
        : await axiosInstance.post(`/wishlist/${productId}`);
      // Reload ensures cards and the saved-items page stay in sync.
      await thunkApi.dispatch(fetchWishlist());
      toast.success(data.message);
      return { productId, saved: !saved };
    } catch (error) {
      const message = error.response?.data?.message || "Could not update favourites.";
      toast.error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

// Server-backed saved products shared by ProductCard, Favourites and LiveUpdates.
// It is cleared locally on logout because the next visitor must not see prior data.
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { products: [], loading: false, error: null },
  reducers: { clearWishlist: (state) => { state.products = []; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => { state.loading = true; })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        if (!action.payload.saved) {
          state.products = state.products.filter((product) => product.id !== action.payload.productId);
        }
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
