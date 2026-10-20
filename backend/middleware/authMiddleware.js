// Import JWT and User model
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// Protect private routes
const protect = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token required."
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET || "my_super_secret_mcq_jwt_key_2026";
    // Verify token
    const decoded = jwt.verify(token, secret);

    // Fetch up-to-date user from database to prevent stale token permissions
    const dbUser = await User.findById(decoded.id).select("-password");
    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User account no longer exists."
      });
    }

    // Check account status
    if (dbUser.isActive === false || dbUser.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended or inactive. Please contact support."
      });
    }

    // Auto-resolve organization if missing for org admin or institutional members
    const cleanUserRole = (dbUser.role || "").toLowerCase().replace(/[-_\s]/g, "");
    const isSuperAdmin = cleanUserRole === "superadmin";
    const isOrgAdmin = cleanUserRole === "orgadmin" || cleanUserRole === "admin" || cleanUserRole === "organizationadmin";

    if (!isSuperAdmin && !dbUser.organizationId) {
      try {
        const Organization = (await import("../models/Organization.js")).default;
        let org = null;

        if (isOrgAdmin) {
          org = await Organization.findOne({
            $or: [{ email: dbUser.email?.toLowerCase().trim() }, { adminName: dbUser.name }]
          });
        }

        if (!org) {
          org = await Organization.findOne({ isActive: true });
        }

        if (!org && isOrgAdmin) {
          // Auto-create active organization for this admin if none exist
          org = await Organization.create({
            name: `${dbUser.name}'s Organization`,
            slug: `${dbUser.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-org`,
            email: dbUser.email?.toLowerCase().trim(),
            adminName: dbUser.name,
            status: "active",
            isActive: true,
            subscriptionPlan: "enterprise",
            subscriptionStatus: "active"
          });
        }

        if (org) {
          dbUser.organizationId = org._id;
          await User.findByIdAndUpdate(dbUser._id, { organizationId: org._id });
        }
      } catch (err) {
        console.warn("Auto-resolve organization notice:", err.message);
      }
    }

    // Check if role or organization has changed since token issuance
    const tokenRole = decoded.role;
    const currentRole = dbUser.role;
    const tokenOrgId = decoded.organizationId ? String(decoded.organizationId) : "";
    const currentOrgId = dbUser.organizationId ? String(dbUser.organizationId) : "";

    if (tokenRole !== currentRole || tokenOrgId !== currentOrgId) {
      const freshToken = generateToken(dbUser);
      res.setHeader("x-new-token", freshToken);
      res.setHeader("Access-Control-Expose-Headers", "x-new-token");
    }

    // Store up-to-date user information
    req.user = {
      id: dbUser._id.toString(),
      _id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      organizationId: dbUser.organizationId ? dbUser.organizationId.toString() : null
    };

    // Continue to controller
    next();
  } catch (error) {
    // Handle invalid or expired token
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token."
    });
  }
};

// Export middleware
export default protect;