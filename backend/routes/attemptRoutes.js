// Import Express
import express from "express";

// Import attempt controllers
import {
  getAvailableTests,
  startAttempt,
  saveAnswer,
  getAttempt,
  submitAttempt,
  getMyAttempts
} from "../controllers/attemptController.js";

// Import middleware
import protect from "../middleware/authMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

// Create router
const router = express.Router();

// Protect all attempt routes
router.use(protect);
router.use(tenantMiddleware);

// Available tests for student
router.get("/available-tests", getAvailableTests);

// Student's own attempt history
router.get("/my-attempts", getMyAttempts);

// Start test
router.post("/start", startAttempt);
router.post("/:testId/start", startAttempt);

// Save answer
router.patch("/:id/answer", saveAnswer);

// Submit test
router.post("/:id/submit", submitAttempt);

// Get attempt details
router.get("/:id", getAttempt);

// Export router
export default router;