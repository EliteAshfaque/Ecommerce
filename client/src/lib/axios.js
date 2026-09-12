import axios from "axios";

const axiosInstance = axios.create({
  // Configure VITE_API_URL in each deployed client; localhost remains a useful
  // zero-configuration default for development.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  withCredentials: true,
});

export { axiosInstance };
export default axiosInstance;
