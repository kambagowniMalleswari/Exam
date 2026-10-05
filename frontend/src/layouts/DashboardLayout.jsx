// Import navigation
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Import authentication
import { useAuth } from "../context/AuthContext.jsx";

// Import sidebar
import Sidebar from "../components/Sidebar.jsx";

// Import CSS
import "./DashboardLayout.css";

const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Synchronize browser tab title
  useEffect(() => {
    document.title = title ? `${title} | AssessIQ` : "AssessIQ — Institutional Portal";
  }, [title]);

  // Auto-close sidebar on mobile navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Get authentication information
  const { user, logout } = useAuth();

  // Navigation
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get first letter of user's name
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="dashboard-layout">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar with mobile toggle state */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="dashboard-main">
        {/* Top header */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              type="button"
              className="dashboard-mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>

            <div className="dashboard-header-title">
              <h1>{title || "Dashboard"}</h1>
              <p>Welcome back, {user?.name || "User"}</p>
            </div>
          </div>

          {/* User section */}
          <div className="dashboard-user">
            <div
              className="dashboard-user-info"
              onClick={() => navigate("/profile")}
              style={{ cursor: "pointer" }}
              title="View your profile"
            >
              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {user?.role?.replace("_", " ")}
              </span>
            </div>

            <div
              className="dashboard-avatar"
              onClick={() => navigate("/profile")}
              style={{ cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="View your profile"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                userInitial
              )}
            </div>

            <button
              type="button"
              className="dashboard-security-btn"
              onClick={() => navigate("/profile?tab=security")}
              title="Security & OTP Reset"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Security & OTP</span>
            </button>

            <button
              type="button"
              className="dashboard-logout"
              onClick={handleLogout}
              title="Sign out of AssessIQ"
            >
              <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;