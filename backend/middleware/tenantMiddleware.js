// Multi-tenant isolation middleware
import Organization from "../models/Organization.js";
import User from "../models/User.js";

const tenantMiddleware = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  const rawUserRole = (req.user.role || "").toString().toLowerCase().trim();
  const cleanUserRole = rawUserRole.replace(/[-_\s]/g, "");

  // 1. Super Admin has platform-wide global visibility
  if (cleanUserRole === "superadmin") {
    // If a specific organizationId is passed via header, body, or query, attach it
    req.organizationId =
      req.headers["x-organization-id"] ||
      req.body?.organizationId ||
      req.query?.organizationId ||
      null;
    req.isSuperAdmin = true;
    return next();
  }

  // 2. Independent student without an organization
  if (cleanUserRole === "student" && !req.user.organizationId) {
    req.organizationId = null;
    req.isIndependentStudent = true;
    return next();
  }

  // 3. Independent teacher without an organization
  if (cleanUserRole === "teacher" && !req.user.organizationId) {
    req.organizationId = null;
    req.isIndependentTeacher = true;
    return next();
  }

  // 4. Auto-resolve organization if missing
  if (!req.user.organizationId) {
    try {
      const userEmail = req.user.email?.toLowerCase().trim();
      let org = await Organization.findOne({
        $or: [{ email: userEmail }, { adminName: req.user.name }]
      });

      if (!org) {
        org = await Organization.findOne({ isActive: true });
      }

      if (org) {
        req.user.organizationId = org._id.toString();
        await User.findByIdAndUpdate(req.user.id || req.user._id, { organizationId: org._id });
      }
    } catch (err) {
      console.warn("Auto-resolving org in tenantMiddleware notice:", err.message);
    }
  }

  // Attach verified organization ID string to request
  req.organizationId = req.user.organizationId
    ? (req.user.organizationId?._id || req.user.organizationId).toString()
    : null;

  next();
};

export default tenantMiddleware;