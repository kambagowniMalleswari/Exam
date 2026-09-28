import express from "express";
import {
  applyOrganization,
  getOrganizationApplications,
  approveOrganizationApplication,
  resendOrgApprovalEmail,
  rejectOrganizationApplication
} from "../controllers/orgApplicationController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public submission route
router.post("/apply", applyOrganization);

// Protected Super Admin routes
router.use(protect);
router.use(authorize("super_admin"));

router.get("/", getOrganizationApplications);
router.patch("/:id/approve", approveOrganizationApplication);
router.post("/:id/resend-email", resendOrgApprovalEmail);
router.patch("/:id/reject", rejectOrganizationApplication);

export default router;
