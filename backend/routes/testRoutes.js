// Import Express
import express from "express";

// Import test controllers
import {
  createTest,
  getTests,
  getPublicTests,
  getTestById,
  updateTest,
  deleteTest,
  publishTest,
  unpublishTest,
  duplicateTest,
  previewTest,
  toggleTestStatus
} from "../controllers/testController.js";

// Import middleware
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

// Create router
const router = express.Router();

// Public test explore route (accessible without auth)
router.get("/public", getPublicTests);

// Protect all remaining test routes
router.use(protect);
router.use(tenantMiddleware);

// Institutional educators and managers allowed
const testManagerRoles = authorize("admin", "org_admin", "teacher", "super_admin");

// Get all tests (scoped by tenant / teacher in controller)
router.get("/", testManagerRoles, getTests);

// Create test
router.post("/", testManagerRoles, createTest);

// Preview test
router.get("/:id/preview", testManagerRoles, previewTest);

// Publish / Unpublish (supports both POST and PATCH)
router.route("/:id/publish").post(testManagerRoles, publishTest).patch(testManagerRoles, publishTest);
router.route("/:id/unpublish").post(testManagerRoles, unpublishTest).patch(testManagerRoles, unpublishTest);
router.patch("/:id/status", testManagerRoles, toggleTestStatus);

// Duplicate
router.post("/:id/duplicate", testManagerRoles, duplicateTest);

// Get test by ID (students also allowed to see basic test details)
router.get("/:id", getTestById);

// Update test
router.put("/:id", testManagerRoles, updateTest);

// Delete test
router.delete("/:id", testManagerRoles, deleteTest);

// Export router
export default router;