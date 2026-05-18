import axios from "axios";
import { API_BASE_URL } from "../config/url";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV === "development" && error?.response) {
      const method = String(error.config?.method || "get").toUpperCase();
      const url = error.config?.url || "";
      // Aide au diagnostic en local sans impacter le flux applicatif.
      console.error(`[API ${error.response.status}] ${method} ${url}`, error.response.data);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
