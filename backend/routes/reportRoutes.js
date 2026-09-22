import express from "express";
import {
  getSuperAdminAnalytics,
  getOrganizationReport,
  getTeacherDashboardStats,
  getStudentDashboardStats
} from "../controllers/reportController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(tenantMiddleware);

// Super Admin platform analytics
router.get(
  "/platform",
  authorize("super_admin"),
  getSuperAdminAnalytics
);
router.get(
  "/super-admin",
  authorize("super_admin"),
  getSuperAdminAnalytics
);

// Organization report (Org Admin, Admin, Super Admin)
router.get(
  "/",
  authorize("admin", "org_admin", "super_admin"),
  getOrganizationReport
);
router.get(
  "/organization",
  authorize("admin", "org_admin", "super_admin"),
  getOrganizationReport
);

// Teacher dashboard stats
router.get(
  "/teacher",
  authorize("teacher", "admin", "org_admin", "super_admin"),
  getTeacherDashboardStats
);

// Student dashboard stats
router.get(
  "/student",
  authorize("student", "teacher", "admin", "org_admin", "super_admin"),
  getStudentDashboardStats
);


export default router;