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

    // Expand aliases (admin <=> org_admin)
    const expandedRoles = roles.flatMap((role) => {
      if (role === "admin" || role === "org_admin") {
        return ["admin", "org_admin"];
      }
      return [role];
    });

    const userRole = req.user.role;

    // Super Admin security enforcement
    if (userRole === "super_admin") {
      if (req.user.email?.toLowerCase().trim() !== "kambagownikmalleswari@gmail.com") {
        return res.status(403).json({
          success: false,
          message: "Access denied: Unauthorized Super Admin account."
        });
      }
    }

    // Super Admin has global override unless strictly disallowed
    let hasPermission =
      userRole === "super_admin" || expandedRoles.includes(userRole);

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