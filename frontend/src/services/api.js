// High-Performance Centralized Axios API Service with Backend Pre-Warming & Fast Cache
import axios from "axios";

// Determine base API URL from environment or production Render backend
const getBaseApiUrl = () => {
  // If running in production browser (e.g. assess-iq.web.app, assess-iq.firebaseapp.com)
  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
    return "https://assess-iq-backend.onrender.com/api";
  }
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
    fetch(`${rootUrl}/api`, { method: "GET" }).catch(() => {});

    // Periodic ping every 8 minutes to prevent Render idle spin-down
    if (typeof window !== "undefined") {
      setInterval(() => {
        fetch(`${rootUrl}/api`, { method: "GET" }).catch(() => {});
      }, 8 * 60 * 1000);
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
  timeout: 90000
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
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    // Auto-retry once on Render cold-start timeouts (ECONNABORTED) or 504 Gateway Timeouts
    const isTimeoutOrColdStart =
      error.code === "ECONNABORTED" ||
      status === 504 ||
      (!error.response && error.message === "Network Error");

    if (isTimeoutOrColdStart && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.warn("[API Auto-Retry] Retrying request following backend cold-start latency:", requestUrl);
        return await api(originalRequest);
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }

    // Handle token expiration only on authenticated private requests
    if (status === 401) {
      const isAuthEndpoint = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");
      const isPublicEndpoint = requestUrl.includes("/public");

      if (!isAuthEndpoint && !isPublicEndpoint) {
        const token = localStorage.getItem("token");
        // Only wipe credentials if the server explicitly rejected the existing token
        if (token && error.response?.data?.message?.toLowerCase().includes("token")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("organizationId");
          clearApiCache();

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
      }
    }
    return Promise.reject(error);
  }
);

export default api;