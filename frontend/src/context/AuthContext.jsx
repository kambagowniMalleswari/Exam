// Authentication Context
import { createContext, useContext, useEffect, useState } from "react";
import api, { clearApiCache } from "../services/api.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Synchronous initial state from localStorage prevents null-user race conditions on page refresh
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    // If we already have token and stored user, we can render immediately without showing access denied
    return !token || !storedUser;
  });

  // Background check and synchronization with backend
  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/profile");
        if (res.data?.user && isMounted) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          if (res.data?.token) {
            localStorage.setItem("token", res.data.token);
          }
        }
      } catch (err) {
        console.warn("Session sync notice:", err.message);
        const errMsg = err.response?.data?.message?.toLowerCase() || "";
        if (err.response?.status === 401 && (errMsg.includes("expired") || errMsg.includes("no longer exists")) && isMounted) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("organizationId");
          clearApiCache();
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for storage changes across tabs to eliminate session desync
    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === "token") {
        try {
          const storedUser = localStorage.getItem("user");
          const storedToken = localStorage.getItem("token");
          if (!storedToken || !storedUser) {
            setUser(null);
          } else {
            setUser(JSON.parse(storedUser));
          }
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Login
  const login = async (email, password) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organizationId");
    sessionStorage.clear();
    clearApiCache();

    const response = await api.post("/auth/login", { email, password });
    const { token, user: loggedUser } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(loggedUser));
    setUser(loggedUser);

    return response.data;
  };

  // Register
  const register = async (registrationData) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organizationId");
    sessionStorage.clear();
    clearApiCache();

    const response = await api.post("/auth/register", registrationData);
    const { token, user: registeredUser } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(registeredUser));
    setUser(registeredUser);

    return response.data;
  };

  // Google OAuth Login
  const loginWithGoogle = async (googlePayload) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organizationId");
    sessionStorage.clear();
    clearApiCache();

    const response = await api.post("/auth/google", googlePayload);
    const { token, user: loggedUser } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(loggedUser));
    setUser(loggedUser);

    return response.data;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organizationId");
    sessionStorage.clear();
    clearApiCache();
    setUser(null);
    window.location.href = "/login";
  };

  const rawRole = (user?.role || "").toString().toLowerCase().trim().replace(/[-_\s]/g, "");
  const isSuperAdmin = rawRole === "superadmin";
  const isOrgAdmin = rawRole === "orgadmin" || rawRole === "admin" || rawRole === "organizationadmin";
  const isTeacher = rawRole === "teacher";
  const isStudent = rawRole === "student";
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
        isSuperAdmin,
        isOrgAdmin,
        isAdmin: isOrgAdmin,
        isTeacher,
        isStudent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;