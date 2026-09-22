// Import Express
import express from "express";

// Import result controllers
import {
  getResultByAttemptId,
  getMyResults,
  getResultsByTest,
  getAllResults,
  calculateResult
} from "../controllers/resultController.js";

// Import middleware
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

// Create router
const router = express.Router();

// Protect all result routes
router.use(protect);
router.use(tenantMiddleware);

// Get student's own results
router.get("/my-results", getMyResults);

// Get organization-wide results (admin, teacher, super_admin)
router.get(
  "/",
  authorize("admin", "org_admin", "teacher", "super_admin"),
  getAllResults
);
router.get(
  "/organization",
  authorize("admin", "org_admin", "teacher", "super_admin"),
  getAllResults
);

// Get results for a specific test (admin, teacher, super_admin)
router.get(
  "/test/:testId",
  authorize("admin", "org_admin", "teacher", "super_admin"),
  getResultsByTest
);

// Calculate result if needed
router.post("/calculate/:attemptId", calculateResult);

// Get specific result by attempt ID (supports both /attempt/:attemptId and /:attemptId)
router.get("/attempt/:attemptId", getResultByAttemptId);
router.get("/:attemptId", getResultByAttemptId);

// Export router
export default router;