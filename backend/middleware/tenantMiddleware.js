// Multi-tenant isolation middleware
const tenantMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  // 1. Super Admin has platform-wide global visibility
  if (req.user.role === "super_admin" || req.user.role === "superadmin") {
    // If a specific organizationId is passed via header or query, attach it
    req.organizationId = req.headers["x-organization-id"] || req.query.organizationId || null;
    req.isSuperAdmin = true;
    return next();
  }

  // 2. Independent student without an organization
  if (req.user.role === "student" && !req.user.organizationId) {
    req.organizationId = null;
    req.isIndependentStudent = true;
    return next();
  }

  // 3. Independent teacher without an organization
  if (req.user.role === "teacher" && !req.user.organizationId) {
    req.organizationId = null;
    req.isIndependentTeacher = true;
    return next();
  }

  // 4. Organization users (org_admin, admin, teacher, student)
  if (!req.user.organizationId) {
    return res.status(403).json({
      success: false,
      message: "Organization membership is required to access this resource"
    });
  }

  // Attach verified organization ID to request
  req.organizationId = req.user.organizationId;

  next();
};

export default tenantMiddleware;