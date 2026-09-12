import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";

// Server: GET /order/orders/me
export const fetchMyOrders = createAsyncThunk(
  "order/orders/me",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/order/orders/me");
      return res.data.orders || [];
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch orders.";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Server: POST /order/new
// Body: shipping fields + orderedItems
// Response: { paymentIntent, total_price, orderId }
export const placeNewOrder = createAsyncThunk(
  "order/new",
  async (orderData, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/order/new", orderData);
      toast.success(res.data.message);
      return {
        paymentIntent: res.data.paymentIntent,
        finalPrice: res.data.total_price,
        orderId: res.data.orderId,
      };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to place order.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Server: GET /order/:orderId
export const fetchSingleOrder = createAsyncThunk(
  "order/single",
  async (orderId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/order/${orderId}`);
      return res.data.orders;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch order.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState: {
    myOrders: [],
    fetchingOrders: false,
    placingOrder: false,
    finalPrice: null,
    orderStep: 1,
    paymentIntent: "",
    orderId: null,
    singleOrder: null,
    error: null,
  },
  reducers: {
    setOrderStep: (state, action) => {
      state.orderStep = action.payload;
    },
    setFinalPrice: (state, action) => {
      state.finalPrice = action.payload;
    },
    clearPaymentIntent: (state) => {
      state.paymentIntent = "";
      state.orderId = null;
    },
    resetOrderFlow: (state) => {
      state.placingOrder = false;
      state.finalPrice = null;
      state.orderStep = 1;
      state.paymentIntent = "";
      state.orderId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMyOrders
      .addCase(fetchMyOrders.pending, (state) => {
        state.fetchingOrders = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.fetchingOrders = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.fetchingOrders = false;
        state.error = action.payload;
        state.myOrders = [];
      })

      // placeNewOrder
      .addCase(placeNewOrder.pending, (state) => {
        state.placingOrder = true;
        state.error = null;
      })
      .addCase(placeNewOrder.fulfilled, (state, action) => {
        state.placingOrder = false;
        state.paymentIntent = action.payload.paymentIntent || "";
        state.finalPrice = action.payload.finalPrice;
        state.orderId = action.payload.orderId;
        state.orderStep = 2;
      })
      .addCase(placeNewOrder.rejected, (state, action) => {
        state.placingOrder = false;
        state.error = action.payload;
      })

      // fetchSingleOrder
      .addCase(fetchSingleOrder.fulfilled, (state, action) => {
        state.singleOrder = action.payload;
      });
  },
});

export const {
  setOrderStep,
  setFinalPrice,
  clearPaymentIntent,
  resetOrderFlow,
} = orderSlice.actions;

export default orderSlice.reducer;
