import { createSlice } from "@reduxjs/toolkit";

// Shared UI-only state for overlays that can be opened from distant components,
// such as Navbar -> CartSidebar or ProductCard -> LoginModal.
const popupSlice = createSlice({
  name: "popup",
  initialState: {
    isAuthPopupOpen: false,
    isSidebarOpen: false,
    isSearchBarOpen: false,
    isCartOpen: false,
    isAIPopupOpen: false,
  },
  reducers: {
    toggleAuthPopup: (state) => {
      state.isAuthPopupOpen = !state.isAuthPopupOpen;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    toggleSearchBar: (state) => {
      state.isSearchBarOpen = !state.isSearchBarOpen;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    toggleAIModal: (state) => {
      state.isAIPopupOpen = !state.isAIPopupOpen;
    },
  },
});

export const {
  toggleAuthPopup,
  toggleSidebar,
  toggleSearchBar,
  toggleCart,
  toggleAIModal,
} = popupSlice.actions;

export default popupSlice.reducer;
