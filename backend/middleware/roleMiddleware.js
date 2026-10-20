// Check user role with support for role aliases and hierarchical access
const normalizeRoleStr = (r) => (r || "").toString().toLowerCase().trim().replace(/[-_\s]/g, "");

const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    const cleanUserRole = normalizeRoleStr(req.user.role);
    const isSuperAdmin = cleanUserRole === "superadmin";
    const isOrgAdmin = cleanUserRole === "orgadmin" || cleanUserRole === "admin" || cleanUserRole === "organizationadmin";
    const isTeacher = cleanUserRole === "teacher";

    // Clean and expand allowed roles
    const normalizedAllowed = roles.map(normalizeRoleStr);

    // Direct permission check or Super Admin global override
    let hasPermission = isSuperAdmin;

    if (!hasPermission) {
      if (isOrgAdmin && (normalizedAllowed.includes("admin") || normalizedAllowed.includes("orgadmin") || normalizedAllowed.includes("organizationadmin"))) {
        hasPermission = true;
      } else if (normalizedAllowed.includes(cleanUserRole)) {
        hasPermission = true;
      }
    }

    // Hierarchical permissions:
    // 1. Org Admin / Admin have supervisory authority over Teacher resources
    if (!hasPermission && isOrgAdmin) {
      if (normalizedAllowed.includes("teacher")) {
        hasPermission = true;
      }
    }

    // 2. Educators and Admins have preview/supervisory authority over Student resources
    if (!hasPermission && (isOrgAdmin || isTeacher)) {
      if (normalizedAllowed.includes("student")) {
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