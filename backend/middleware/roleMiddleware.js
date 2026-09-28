// Check user role with support for role aliases and hierarchical access
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    // Expand aliases (admin <=> org_admin, super_admin <=> superadmin)
    const expandedRoles = roles.flatMap((role) => {
      if (role === "admin" || role === "org_admin") {
        return ["admin", "org_admin"];
      }
      if (role === "super_admin" || role === "superadmin") {
        return ["super_admin", "superadmin"];
      }
      return [role];
    });

    const userRole = req.user.role;
    const isSuperAdmin = userRole === "super_admin" || userRole === "superadmin";

    // Super Admin has global override unless strictly disallowed
    let hasPermission = isSuperAdmin || expandedRoles.includes(userRole);

    // Hierarchical permissions:
    // 1. Org Admin / Admin have supervisory authority over Teacher resources
    if (!hasPermission && (userRole === "org_admin" || userRole === "admin")) {
      if (expandedRoles.includes("teacher")) {
        hasPermission = true;
      }
    }

    // 2. Educators and Admins have preview/supervisory authority over Student resources
    if (!hasPermission && (userRole === "org_admin" || userRole === "admin" || userRole === "teacher")) {
      if (expandedRoles.includes("student")) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission for this resource."
      });
    }

    // Continue to controller
    next();
  };
};


// Export role middleware
export default authorize;