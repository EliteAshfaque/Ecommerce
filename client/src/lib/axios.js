import axios from "axios";

// API base comes from client/.env → VITE_API_URL (no localhost hardcoded).
const apiBaseUrl = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export { axiosInstance, apiBaseUrl };
export default axiosInstance;
