// Import navigation
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Import authentication
import { useAuth } from "../context/AuthContext.jsx";

// Import sidebar
import Sidebar from "../components/Sidebar.jsx";

// Import CSS
import "./DashboardLayout.css";

const DashboardLayout = ({ children, title }) => {
  // Synchronize browser tab title
  useEffect(() => {
    document.title = title ? `${title} | AssessIQ` : "AssessIQ — Institutional Portal";
  }, [title]);

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
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="dashboard-main">
        {/* Top header */}
        <header className="dashboard-header">
          <div className="dashboard-header-title">
            <h1>{title || "Dashboard"}</h1>

            <p>
              Welcome back, {user?.name || "User"}
            </p>
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
              style={{ cursor: "pointer" }}
              title="View your profile"
            >
              {userInitial}
            </div>

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