// Authentication Context
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api.js";

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
        console.warn("Session sync notice, keeping local user state:", err.message);
        if (err.response?.status === 401 && isMounted) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }

    };

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Login
  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user: loggedUser } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(loggedUser));
    setUser(loggedUser);

    return response.data;
  };

  // Register
  const register = async (registrationData) => {
    const response = await api.post("/auth/register", registrationData);
    const { token, user: registeredUser } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(registeredUser));
    setUser(registeredUser);

    return response.data;
  };

  // Google OAuth Login
  const loginWithGoogle = async (googlePayload) => {
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
    setUser(null);
    window.location.href = "/login";
  };

  // Role verification helpers
  const role = user?.role || "";
  const isSuperAdmin = role === "super_admin" && user?.email?.toLowerCase().trim() === "kambagownikmalleswari@gmail.com";
  const isOrgAdmin = role === "org_admin" || role === "admin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
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