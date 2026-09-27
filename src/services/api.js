import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Tao instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Them token vao request neu co
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");
    // localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Xử lý lỗi response
api.interceptors.response.use(
  (response) => {
    // Neu response la blob, tra ve response object truc tiep
    // vi axios da chuyen doi response.data thanh Blob
    if (response.config?.responseType === "blob") {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    if (status === 401) {
      // localStorage.removeItem("auth_token");
      localStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminToken");
    }
    const message =
      typeof data === "string"
        ? data
        : data?.error || data?.message || "Request error";
    error.message = message;
    return Promise.reject(error);
  },
);

export default api;
