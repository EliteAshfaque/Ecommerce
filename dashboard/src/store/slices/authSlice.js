import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";

export const login = createAsyncThunk("auth/login", async (data, thunkApi) => {
  try {
    const response = await axiosInstance.post("/auth/login", data);
    toast.success(response.data.message);
    return response.data.user;
  } catch (error) {
    const message = error.response?.data?.message || "Login failed";
    toast.error(message);
    return thunkApi.rejectWithValue(message);
  }
});

export const getUser = createAsyncThunk("auth/getUser", async (_, thunkApi) => {
  try {
    const response = await axiosInstance.get("/auth/me");
    return response.data.user;
  } catch (error) {
    return thunkApi.rejectWithValue(
      error.response?.data?.message || "Failed to get user"
    );
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, thunkApi) => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    toast.success(response.data.message);
    return null;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to logout";
    toast.error(message);
    return thunkApi.rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    authUser: null,
    isLoggingIn: false,
    isCheckingAuth: true,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoggingIn = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.authUser = action.payload;
      })
      .addCase(login.rejected, (state) => {
        state.isLoggingIn = false;
      })
      .addCase(getUser.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.authUser = action.payload;
      })
      .addCase(getUser.rejected, (state) => {
        state.isCheckingAuth = false;
        state.authUser = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.authUser = null;
      });
  },
});

export default authSlice.reducer;
