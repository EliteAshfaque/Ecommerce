import axios from "axios";

const axiosInstance = axios.create({
  // Keep the admin and storefront pointed at the same configurable API.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  withCredentials: true,
});

export { axiosInstance };
export default axiosInstance;
