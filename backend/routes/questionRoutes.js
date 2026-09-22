// Import Express
import express from "express";

// Import question controllers
import {
  createQuestion,
  getQuestionsByTest,
  getQuestionsForStudent,
  getQuestionById,
  updateQuestion,
  deleteQuestion
} from "../controllers/questionController.js";

// Import middleware
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

// Create router
const router = express.Router();

// Protect all question routes
router.use(protect);
router.use(tenantMiddleware);

// Endpoint for students to get questions without correct answers
router.get("/test/:testId/student", getQuestionsForStudent);

// Management roles
const managerRoles = authorize("admin", "org_admin", "teacher", "super_admin");

// Get all questions with answers for test managers
router.get("/test/:testId", managerRoles, getQuestionsByTest);

// Get question by ID
router.get("/:id", managerRoles, getQuestionById);

// Create question
router.post("/", managerRoles, createQuestion);

// Update question
router.put("/:id", managerRoles, updateQuestion);

// Delete question
router.delete("/:id", managerRoles, deleteQuestion);

// Export router
export default router;