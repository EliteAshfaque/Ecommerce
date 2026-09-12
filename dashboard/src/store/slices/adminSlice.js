import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";

// GET /admin/fetch/dashboard-stats
export const fetchDashboardStats = createAsyncThunk(
  "admin/dashboardStats",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/admin/fetch/dashboard-stats");
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load dashboard stats";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// GET /admin/getallusers?page=
export const fetchAdminUsers = createAsyncThunk(
  "admin/getAllUsers",
  async (page = 1, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/admin/getallusers?page=${page}`);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load users";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// DELETE /admin/delete/:id
export const deleteAdminUser = createAsyncThunk(
  "admin/deleteUser",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/admin/delete/${id}`);
      toast.success(res.data.message);
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete user";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// GET /product (admin catalogue view)
export const fetchAdminProducts = createAsyncThunk(
  "admin/fetchProducts",
  async (input = 1, thunkAPI) => {
    try {
      const { page, category } = typeof input === "object" ? input : { page: input, category: "" };
      const params = new URLSearchParams({ page: String(page || 1) });
      if (category) params.set("category", category);
      const res = await axiosInstance.get(`/product?${params}`);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load products";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// POST /product/admin/create (FormData)
export const createAdminProduct = createAsyncThunk(
  "admin/createProduct",
  async (formData, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/product/admin/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(res.data.message);
      return res.data.product;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create product";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// PUT /product/admin/update/:productId
export const updateAdminProduct = createAsyncThunk(
  "admin/updateProduct",
  async ({ productId, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(
        `/product/admin/update/${productId}`,
        data,
        data instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined
      );
      toast.success(res.data.message);
      return res.data.product;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update product";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// DELETE /product/admin/delete/:productId
export const deleteAdminProduct = createAsyncThunk(
  "admin/deleteProduct",
  async (productId, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(
        `/product/admin/delete/${productId}`
      );
      toast.success(res.data.message || "Product deleted");
      return productId;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete product";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// GET /order/admin/getall
export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/order/admin/getall");
      return res.data.orders || [];
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load orders";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// PUT /order/admin/update/:orderId  body: { status }
export const updateAdminOrderStatus = createAsyncThunk(
  "admin/updateOrderStatus",
  async ({ orderId, status }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/order/admin/update/${orderId}`, {
        status,
      });
      toast.success(res.data.message || "Order updated");
      return res.data.order || { id: orderId, order_status: status };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update order";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// DELETE /order/admin/delete/:orderId
export const deleteAdminOrder = createAsyncThunk(
  "admin/deleteOrder",
  async (orderId, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/order/admin/delete/${orderId}`);
      toast.success(res.data.message || "Order deleted");
      return orderId;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete order";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Promotion management powers checkout sale codes such as LUMERA10.
export const fetchAdminPromotions = createAsyncThunk("admin/fetchPromotions", async (_, thunkAPI) => {
  try {
    const { data } = await axiosInstance.get("/promotion/admin");
    return data.promotions || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load sales");
  }
});

export const createAdminPromotion = createAsyncThunk("admin/createPromotion", async (promotion, thunkAPI) => {
  try {
    const { data } = await axiosInstance.post("/promotion/admin", promotion);
    toast.success(data.message);
    return data.promotion;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to create sale";
    toast.error(message);
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateAdminPromotion = createAsyncThunk("admin/updatePromotion", async ({ id, changes }, thunkAPI) => {
  try {
    const { data } = await axiosInstance.put(`/promotion/admin/${id}`, changes);
    toast.success(data.message);
    return data.promotion;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to update sale";
    toast.error(message);
    return thunkAPI.rejectWithValue(message);
  }
});

export const deleteAdminPromotion = createAsyncThunk("admin/deletePromotion", async (id, thunkAPI) => {
  try {
    const { data } = await axiosInstance.delete(`/promotion/admin/${id}`);
    toast.success(data.message);
    return id;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to remove sale";
    toast.error(message);
    return thunkAPI.rejectWithValue(message);
  }
});

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    stats: null,
    statsLoading: false,
    users: [],
    totalUsers: 0,
    usersPage: 1,
    usersLoading: false,
    products: [],
    totalProducts: 0,
    productsPage: 1,
    totalPages: 1,
    productsLoading: false,
    productSaving: false,
    orders: [],
    ordersLoading: false,
    promotions: [],
    promotionsLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchAdminUsers.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.users || [];
        state.totalUsers = action.payload.totalUsers || 0;
        state.usersPage = action.payload.currentPage || 1;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.totalUsers = Math.max(0, state.totalUsers - 1);
      })

      .addCase(fetchAdminProducts.pending, (state) => {
        state.productsLoading = true;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.products = action.payload.products || [];
        state.totalProducts = action.payload.totalProducts || 0;
        state.productsPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.productsLoading = false;
        state.error = action.payload;
      })

      .addCase(createAdminProduct.pending, (state) => {
        state.productSaving = true;
      })
      .addCase(createAdminProduct.fulfilled, (state, action) => {
        state.productSaving = false;
        if (action.payload) state.products.unshift(action.payload);
      })
      .addCase(createAdminProduct.rejected, (state) => {
        state.productSaving = false;
      })

      .addCase(updateAdminProduct.pending, (state) => {
        state.productSaving = true;
      })
      .addCase(updateAdminProduct.fulfilled, (state, action) => {
        state.productSaving = false;
        const updated = action.payload;
        if (!updated?.id) return;
        state.products = state.products.map((p) =>
          p.id === updated.id ? { ...p, ...updated } : p
        );
      })
      .addCase(updateAdminProduct.rejected, (state) => {
        state.productSaving = false;
      })

      .addCase(deleteAdminProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p.id !== action.payload);
      })

      .addCase(fetchAdminOrders.pending, (state) => {
        state.ordersLoading = true;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.error = action.payload;
      })

      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        state.orders = state.orders.map((o) =>
          o.id === updated.id
            ? { ...o, ...updated, order_status: updated.order_status || updated.status }
            : o
        );
      })

      .addCase(deleteAdminOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter((o) => o.id !== action.payload);
      })
      .addCase(fetchAdminPromotions.pending, (state) => {
        state.promotionsLoading = true;
      })
      .addCase(fetchAdminPromotions.fulfilled, (state, action) => {
        state.promotionsLoading = false;
        state.promotions = action.payload;
      })
      .addCase(fetchAdminPromotions.rejected, (state, action) => {
        state.promotionsLoading = false;
        state.error = action.payload;
      })
      .addCase(createAdminPromotion.fulfilled, (state, action) => {
        if (action.payload) state.promotions.unshift(action.payload);
      })
      .addCase(updateAdminPromotion.fulfilled, (state, action) => {
        if (!action.payload) return;
        state.promotions = state.promotions.map((promotion) =>
          promotion.id === action.payload.id ? action.payload : promotion
        );
      })
      .addCase(deleteAdminPromotion.fulfilled, (state, action) => {
        state.promotions = state.promotions.filter((promotion) => promotion.id !== action.payload);
      });
  },
});

export default adminSlice.reducer;
