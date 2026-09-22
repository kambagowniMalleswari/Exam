import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ShieldAlertIcon } from "../components/common/Icons.jsx";
import "./Unauthorized.css";

const Unauthorized = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "super_admin" || user.role === "admin" || user.role === "org_admin") return "/admin/dashboard";
    if (user.role === "teacher") return "/teacher/dashboard";
    if (user.role === "student") return "/student/dashboard";
    return "/";
  };

  useEffect(() => {
    navigate(getDashboardPath(), { replace: true });
  }, [user]);

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">
          <ShieldAlertIcon size={32} />
        </div>

        <p className="unauthorized-code">403</p>

        <h1>Access Denied</h1>

        <p className="unauthorized-message">
          You don't have permission to access this page with your current account ({user?.role ? user.role.replace("_", " ") : "guest"}).
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <button
            onClick={() => navigate(getDashboardPath())}
            className="unauthorized-button"
            style={{ cursor: "pointer", border: "none" }}
          >
            Return to My Dashboard
          </button>
          {user && (
            <button
              onClick={logout}
              className="unauthorized-button"
              style={{
                cursor: "pointer",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)"
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;