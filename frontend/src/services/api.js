// Centralized Axios API Service
import axios from "axios";

// Determine base API URL from environment or production Render backend
const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "/api") {
    return import.meta.env.VITE_API_URL;
  }
  return "https://assess-iq-backend.onrender.com/api";
};

const API_BASE_URL = getBaseApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000
});

// Request interceptor: attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token renewal and unauthorized sessions
api.interceptors.response.use(
  (response) => {
    // Automatically update token if backend provided an updated JWT
    const newToken = response.headers?.["x-new-token"];
    if (newToken) {
      localStorage.setItem("token", newToken);
    }
    return response;
  },
  (error) => {

    if (error.response?.status === 401) {
      // Clear expired credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on login/register/landing page
      const currentPath = window.location.pathname;
      if (
        currentPath !== "/login" &&
        currentPath !== "/register" &&
        currentPath !== "/" &&
        !currentPath.startsWith("/public")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;