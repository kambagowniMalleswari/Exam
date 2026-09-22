import express from "express";
import {
  applyForTeacher,
  getTeacherApplications,
  approveTeacherApplication,
  rejectTeacherApplication
} from "../controllers/teacherApplicationController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

const router = express.Router();

// Public route: submit teacher request
router.post("/apply", applyForTeacher);

// Protected routes: listing, approving, rejecting
router.use(protect);
router.use(tenantMiddleware);

const adminRoles = authorize("admin", "org_admin", "super_admin");

// Get teacher requests
router.get("/", adminRoles, getTeacherApplications);

// Approve request
router.post("/:id/approve", adminRoles, approveTeacherApplication);

// Reject request
router.post("/:id/reject", adminRoles, rejectTeacherApplication);

export default router;
