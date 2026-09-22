// Route Protection Component
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const getDefaultDashboard = (role) => {
  if (role === "super_admin") {
    return "/super-admin/dashboard";
  }
  if (role === "admin" || role === "org_admin") {
    return "/admin/dashboard";
  }
  if (role === "teacher") {
    return "/teacher/dashboard";
  }
  if (role === "student") {
    return "/student/dashboard";
  }
  return "/login";
};

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
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      return null;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role check is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const expandedRoles = allowedRoles.flatMap((role) => {
      if (role === "admin" || role === "org_admin") {
        return ["admin", "org_admin", "super_admin"];
      }
      if (role === "teacher") {
        return ["teacher", "admin", "org_admin", "super_admin"];
      }
      return [role];
    });

    // Super Admin has global override
    const hasAccess = user.role === "super_admin" || expandedRoles.includes(user.role);

    if (!hasAccess) {
      // Seamlessly redirect to the user's role dashboard without showing Access Denied
      return <Navigate to={getDefaultDashboard(user.role)} replace />;
    }
  }


  return children;
};

export default ProtectedRoute;