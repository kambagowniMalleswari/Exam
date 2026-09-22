// Import Express
import express from "express";

// Import organization controllers
import {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  toggleOrganizationStatus,
  deleteOrganization,
  getPublicOrganizations
} from "../controllers/organizationController.js";

// Import middleware
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

// Create router
const router = express.Router();

// Public route for active organizations
router.get("/public", getPublicOrganizations);

// Protect remaining organization routes
router.use(protect);

// Allow organization admin or super admin to get their specific org
router.get("/:id", authorize("super_admin", "admin", "org_admin"), getOrganizationById);

// Super admin exclusive routes
router.post("/", authorize("super_admin"), createOrganization);
router.get("/", authorize("super_admin"), getAllOrganizations);
router.put("/:id", authorize("super_admin"), updateOrganization);
router.patch("/:id/status", authorize("super_admin"), toggleOrganizationStatus);
router.delete("/:id", authorize("super_admin"), deleteOrganization);

// Export router
export default router;