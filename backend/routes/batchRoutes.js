import express from "express";
import {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  assignStudentsToBatch,
  removeStudentFromBatch,
  getAvailableBatchesForStudent,
  enrollStudentInBatch
} from "../controllers/batchController.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(tenantMiddleware);

// Student Self-Enrollment Routes
router.get("/available", authorize("student", "teacher", "org_admin", "admin", "super_admin"), getAvailableBatchesForStudent);
router.post("/:id/enroll", authorize("student", "teacher", "org_admin", "admin", "super_admin"), enrollStudentInBatch);


// Faculty & Admin Batch Management Routes
router.get("/", authorize("super_admin", "admin", "org_admin", "teacher"), getBatches);
router.post("/", authorize("super_admin", "admin", "org_admin", "teacher"), createBatch);
router.get("/:id", authorize("super_admin", "admin", "org_admin", "teacher"), getBatchById);
router.put("/:id", authorize("super_admin", "admin", "org_admin", "teacher"), updateBatch);
router.delete("/:id", authorize("super_admin", "admin", "org_admin", "teacher"), deleteBatch);
router.post("/:id/assign-students", authorize("super_admin", "admin", "org_admin", "teacher"), assignStudentsToBatch);
router.post("/:id/remove-student", authorize("super_admin", "admin", "org_admin", "teacher"), removeStudentFromBatch);

export default router;
