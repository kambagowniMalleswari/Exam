// Route Protection Component with Strict Role-Based Verification
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { normalizeRole, getDefaultDashboard } from "../utils/roleUtils.js";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-body)",
        color: "var(--primary)",
        fontWeight: 600,
        fontSize: "1.1rem"
      }}>
        Loading AssessIQ Portal...
      </div>
    );
  }

  // If user is not authenticated, redirect to login with return path
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = normalizeRole(user.role);

  // If role check is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

    // Check direct role permission
    let hasAccess = normalizedAllowed.includes(userRole);

    // Super Admin has platform-wide global override access across roles
    if (!hasAccess && userRole === "super_admin") {
      hasAccess = true;
    }

    if (!hasAccess) {
      // Redirect unauthorized user strictly to their own role dashboard
      return <Navigate to={getDefaultDashboard(userRole)} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;