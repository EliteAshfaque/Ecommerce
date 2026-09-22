import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";

export const fetchStorefront = createAsyncThunk("storefront/fetch", async (_, thunkApi) => {
  try {
    const { data } = await axiosInstance.get("/storefront");
    return data;
  } catch (error) {
    return thunkApi.rejectWithValue(error.response?.data?.message || "Could not load storefront content.");
  }
});

// Stores CMS-style homepage content. Home reads it and Socket.IO invalidates it
// when an administrator changes banners, categories, offers or news.
const storefrontSlice = createSlice({
  name: "storefront",
  initialState: { categories: [], banners: [], offers: [], news: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchStorefront.pending, (state) => { state.loading = true; })
    .addCase(fetchStorefront.fulfilled, (state, action) => {
      state.loading = false;
      state.categories = action.payload.categories || [];
      state.banners = action.payload.banners || [];
      state.offers = action.payload.offers || [];
      state.news = action.payload.news || [];
    })
    .addCase(fetchStorefront.rejected, (state, action) => { state.loading = false; state.error = action.payload; }),
});

export default storefrontSlice.reducer;
