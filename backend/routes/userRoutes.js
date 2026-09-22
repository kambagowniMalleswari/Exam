// Import Express
import express from "express";

// Import user controllers
import {
  getUsers,
  getStudents,
  getTeachers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser
} from "../controllers/userController.js";

// Import middleware
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

// Create router
const router = express.Router();

// Protect all user routes
router.use(protect);

// Apply organization/tenant isolation
router.use(tenantMiddleware);

// Specific list routes (must come BEFORE parameterized /:id)
router.get("/", authorize("admin", "org_admin", "super_admin", "teacher"), getUsers);
router.get("/students", authorize("admin", "org_admin", "super_admin", "teacher"), getStudents);
router.get("/teachers", authorize("admin", "org_admin", "super_admin", "teacher"), getTeachers);
router.get("/:id", authorize("admin", "org_admin", "super_admin", "teacher"), getUserById);

// Administrative operations: admin, org_admin, and super_admin only
router.post("/", authorize("admin", "org_admin", "super_admin"), createUser);
router.put("/:id", authorize("admin", "org_admin", "super_admin"), updateUser);
router.patch("/:id/status", authorize("admin", "org_admin", "super_admin"), toggleUserStatus);
router.delete("/:id", authorize("admin", "org_admin", "super_admin"), deleteUser);

// Export router
export default router;