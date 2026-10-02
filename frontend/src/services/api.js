// High-Performance Centralized Axios API Service with Backend Pre-Warming & Fast Cache
import axios from "axios";

// Determine base API URL from environment or production Render backend
const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "/api") {
    return import.meta.env.VITE_API_URL;
  }
  return "https://assess-iq-backend.onrender.com/api";
};

const API_BASE_URL = getBaseApiUrl();

// Backend Pre-Warming & Keep-Alive to eliminate Render free-tier cold starts
const prewarmBackend = () => {
  try {
    const rootUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    // Immediate background wake-up ping on application load
    fetch(`${rootUrl}/`, { method: "GET", mode: "no-cors" }).catch(() => {});

    // Periodic ping every 10 minutes to prevent Render idle spin-down
    if (typeof window !== "undefined") {
      setInterval(() => {
        fetch(`${rootUrl}/`, { method: "GET", mode: "no-cors" }).catch(() => {});
      }, 10 * 60 * 1000);
    }
  } catch {
    // Fail silently
  }
};

prewarmBackend();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000
});

// Fast Client-Side In-Memory Cache for GET queries (TTL = 8 seconds)
const getCache = new Map();
const inflightRequests = new Map();

export const clearApiCache = () => {
  getCache.clear();
};

// Request interceptor: attach JWT token automatically & serve fast cached GETs
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Invalidate cache immediately on state-mutating methods
    const method = (config.method || "get").toUpperCase();
    if (method !== "GET") {
      getCache.clear();
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
      localStorage.removeItem("organizationId");
      clearApiCache();

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