import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";
import { toggleAuthPopup } from "./popupSlice";

export const   register = createAsyncThunk(
  "auth/register",
  async (data, thunkApi) => {
    try {
      const response = await axiosInstance.post("/auth/register", data);
      toast.success(response.data.message);
      thunkApi.dispatch(toggleAuthPopup());
      return response.data.user;
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

export const login = createAsyncThunk("auth/login", async (data, thunkApi) => {
  try {
    const response = await axiosInstance.post("/auth/login", data);
    toast.success(response.data.message);
    thunkApi.dispatch(toggleAuthPopup());
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
    const message = error.response?.data?.message || "Failed to get user";
    return thunkApi.rejectWithValue(message);
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

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, thunkApi) => {
    try {
      const frontendUrl = window.location.origin;
      const response = await axiosInstance.post(
        `/auth/forgot-password?frontendUrl=${encodeURIComponent(frontendUrl)}`,
        { email }
      );
      toast.success(response.data.message);
      return null;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send reset email";
      toast.error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

// Server: PUT /auth/password/reset/:token
// Body: { password, confirmPassword }
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password, confirmPassword }, thunkApi) => {
    try {
      const response = await axiosInstance.put(
        `/auth/password/reset/${token}`,
        { password, confirmPassword }
      );
      toast.success(response.data.message);
      thunkApi.dispatch(toggleAuthPopup());
      return response.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to reset password";
      toast.error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

// Server: PUT /auth/update-password (authenticated)
// Body: { currentPassword, newPassword, confirmNewPassword }
export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async (data, thunkApi) => {
    try {
      const response = await axiosInstance.put("/auth/update-password", data);
      toast.success(response.data.message);
      return response.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update password";
      toast.error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

// Server: PUT /auth/update-profile (authenticated)
// Body: FormData or { name, email } (+ optional avatar file)
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data, thunkApi) => {
    try {
      const response = await axiosInstance.put("/auth/update-profile", data, {
        headers:
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      });
      toast.success(response.data.message);
      return response.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      toast.error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isUpdatingPassword: false,
    isRequestingForToken: false,
    isCheckingAuth: true,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // register
      .addCase(register.pending, (state) => {
        state.isSigningUp = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isSigningUp = false;
        state.authUser = action.payload;
      })
      .addCase(register.rejected, (state) => {
        state.isSigningUp = false;
      })

      // login
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

      // getUser
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

      // logout
      .addCase(logout.fulfilled, (state) => {
        state.authUser = null;
      })

      // forgotPassword
      .addCase(forgotPassword.pending, (state) => {
        state.isRequestingForToken = true;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isRequestingForToken = false;
      })
      .addCase(forgotPassword.rejected, (state) => {
        state.isRequestingForToken = false;
      })

      // resetPassword
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.authUser = action.payload;
      })

      // updatePassword
      .addCase(updatePassword.pending, (state) => {
        state.isUpdatingPassword = true;
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.isUpdatingPassword = false;
        state.authUser = action.payload;
      })
      .addCase(updatePassword.rejected, (state) => {
        state.isUpdatingPassword = false;
      })

      // updateProfile
      .addCase(updateProfile.pending, (state) => {
        state.isUpdatingProfile = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        state.authUser = action.payload;
      })
      .addCase(updateProfile.rejected, (state) => {
        state.isUpdatingProfile = false;
      });
  },
});

export default authSlice.reducer;
