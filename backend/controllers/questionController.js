// Import Question and Test models
import mongoose from "mongoose";
import Question from "../models/Question.js";
import Test from "../models/Test.js";
import { runCodeAgainstTestCases } from "../utils/codeExecutor.js";

// Helper to recalculate test total marks
const updateTestTotalMarks = async (testId) => {
  const questions = await Question.find({ testId });
  const total = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
  await Test.findByIdAndUpdate(testId, { totalMarks: total });
};

// Create a question
export const createQuestion = async (req, res) => {
  try {
    const {
      questionText,
      testId,
      options,
      correctAnswer,
      marks = 1,
      negativeMarks = 0,
      order,
      explanation = "",
      section = "General",
      questionType = "mcq",
      codingLanguage = "javascript",
      starterCode = "",
      testCases = []
    } = req.body;

    const isCoding = questionType === "coding";

    // Check required fields
    if (!questionText || !testId) {
      return res.status(400).json({
        success: false,
        message: "Question text and test ID are required"
      });
    }

    if (!isCoding && (!options || !correctAnswer)) {
      return res.status(400).json({
        success: false,
        message: "Options and correct answer are required for multiple-choice questions"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    // Check if test exists and user has permission
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    // Permission check
    if (!req.isSuperAdmin) {
      if (req.user.role === "teacher" && test.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Teachers can only add questions to their own tests"
        });
      }
      const testOrgId = (test.organizationId?._id || test.organizationId)?.toString();
      if (req.organizationId && testOrgId && testOrgId !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to add questions to another organization's test"
        });
      }
    }

    // Check options if MCQ
    if (!isCoding && (!Array.isArray(options) || options.length < 2)) {
      return res.status(400).json({
        success: false,
        message: "At least 2 options are required for multiple-choice questions"
      });
    }

    // Determine current highest order if order is not specified
    let questionOrder = order;
    if (!questionOrder) {
      const highestOrderQ = await Question.findOne({ testId }).sort({ order: -1 });
      questionOrder = highestOrderQ ? (highestOrderQ.order || 0) + 1 : 1;
    }

    // Create question
    const question = await Question.create({
      questionText: questionText.trim(),
      testId,
      organizationId: test.organizationId,
      questionType: isCoding ? "coding" : "mcq",
      codingLanguage: isCoding ? (codingLanguage || "javascript") : "javascript",
      starterCode: isCoding ? (starterCode || "") : "",
      testCases: isCoding && Array.isArray(testCases) ? testCases : [],
      options: isCoding ? (Array.isArray(options) ? options : []) : options,
      correctAnswer: isCoding ? (correctAnswer || "Passing Test Cases") : (correctAnswer ? correctAnswer.trim() : ""),
      marks: Number(marks) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      order: questionOrder,
      explanation: explanation || "",
      section: section ? section.trim() : "General"
    });

    // Update test total marks
    await updateTestTotalMarks(testId);

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create question",
      error: error.message
    });
  }
};

// Get all questions for a test (Teacher / Admin / Creator view, includes correct answers)
export const getQuestionsByTest = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    // Permission check
    if (!req.isSuperAdmin) {
      if (req.user.role === "teacher" && test.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Teachers can only view questions for tests they authored"
        });
      }
      const testOrgId = (test.organizationId?._id || test.organizationId)?.toString();
      if (req.organizationId && testOrgId && testOrgId !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view questions from another organization"
        });
      }
    }

    const questions = await Question.find({ testId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get questions",
      error: error.message
    });
  }
};

// Get questions for students taking the test (SCRUBBED: NO correct answer, NO explanation)
export const getQuestionsForStudent = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    const test = await Test.findById(testId);
    if (!test || test.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Test is not published or does not exist"
      });
    }

    // Tenant check for non-public tests
    if (!req.isSuperAdmin && test.type !== "public") {
      const studentOrgId = (req.organizationId || req.user.organizationId)?.toString();
      const testOrgId = (test.organizationId?._id || test.organizationId)?.toString();
      if (studentOrgId && testOrgId && studentOrgId !== testOrgId) {
        const isEligible = req.user.role === "student" && (
          test.status === "published" ||
          (test.targetBatches && test.targetBatches.length > 0) ||
          (test.selectedStudentIds && test.selectedStudentIds.some((id) => id.toString() === req.user.id))
        );
        if (!isEligible && test.status !== "published") {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to view questions for this private test"
          });
        }
      }
    }

    // Exclude correctAnswer and explanation to prevent cheating, and provide sample test cases for coding questions
    const rawQuestions = await Question.find({ testId })
      .select("-correctAnswer -explanation")
      .sort({ order: 1 })
      .lean();

    const questions = rawQuestions.map((q) => {
      if (q.questionType === "coding") {
        return {
          ...q,
          // Only show sample test cases to candidate
          testCases: (q.testCases || []).filter((tc) => tc.isSample !== false)
        };
      }
      return q;
    });

    res.status(200).json({
      success: true,
      questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch student questions",
      error: error.message
    });
  }
};

// Get question by ID
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID"
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    res.status(200).json({
      success: true,
      question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get question",
      error: error.message
    });
  }
};

// Update question
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID"
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    const test = await Test.findById(question.testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Associated test not found"
      });
    }

    // Permission check
    if (!req.isSuperAdmin) {
      if (req.user.role === "teacher" && test.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Teachers can only edit questions for tests they authored"
        });
      }
      const testOrgId = (test.organizationId?._id || test.organizationId)?.toString();
      if (req.organizationId && testOrgId && testOrgId !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to edit questions from another organization"
        });
      }
    }

    const {
      questionText,
      options,
      correctAnswer,
      marks,
      negativeMarks,
      order,
      explanation,
      section,
      questionType,
      codingLanguage,
      starterCode,
      testCases
    } = req.body;

    const targetType = questionType !== undefined ? questionType : question.questionType;
    const isCoding = targetType === "coding";

    if (questionText !== undefined) question.questionText = questionText.trim();
    if (questionType !== undefined) question.questionType = questionType;
    if (codingLanguage !== undefined) question.codingLanguage = codingLanguage;
    if (starterCode !== undefined) question.starterCode = starterCode;
    if (testCases !== undefined && Array.isArray(testCases)) question.testCases = testCases;

    if (options !== undefined) {
      if (!isCoding && (!Array.isArray(options) || options.length < 2)) {
        return res.status(400).json({
          success: false,
          message: "At least 2 options are required for multiple-choice questions"
        });
      }
      question.options = options;
    }
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer.trim();
    if (marks !== undefined) question.marks = Number(marks) || 1;
    if (negativeMarks !== undefined) question.negativeMarks = Number(negativeMarks) || 0;
    if (order !== undefined) question.order = Number(order) || 1;
    if (explanation !== undefined) question.explanation = explanation;
    if (section !== undefined) question.section = section ? section.trim() : "General";

    await question.save();

    // Recalculate test total marks
    await updateTestTotalMarks(question.testId);

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update question",
      error: error.message
    });
  }
};

// Real-time Candidate Code Execution / Test Runner
export const runCandidateCode = async (req, res) => {
  try {
    const { code, language = "javascript", testCases = [], questionId } = req.body;

    let targetTestCases = Array.isArray(testCases) ? testCases : [];

    // If questionId is provided without testCases, fetch sample test cases from question
    if (questionId && targetTestCases.length === 0) {
      const q = await Question.findById(questionId);
      if (q && q.testCases) {
        targetTestCases = q.testCases.filter((tc) => tc.isSample !== false);
      }
    }

    if (!targetTestCases || targetTestCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No test cases provided for execution"
      });
    }

    const results = runCodeAgainstTestCases(code, language, targetTestCases);
    const passedCount = results.filter((r) => r.passed).length;

    res.status(200).json({
      success: true,
      totalTestCases: results.length,
      passedCount,
      allPassed: passedCount === results.length,
      results
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Code execution error",
      error: err.message
    });
  }
};

// Delete question
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID"
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    const test = await Test.findById(question.testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Associated test not found"
      });
    }

    // Permission check
    if (!req.isSuperAdmin) {
      if (req.user.role === "teacher" && test.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Teachers can only delete questions for tests they authored"
        });
      }
      const testOrgId = (test.organizationId?._id || test.organizationId)?.toString();
      if (req.organizationId && testOrgId && testOrgId !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete questions from another organization"
        });
      }
    }

    const testId = question.testId;
    await Question.findByIdAndDelete(id);

    // Recalculate test total marks
    await updateTestTotalMarks(testId);

    res.status(200).json({
      success: true,
      message: "Question deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete question",
      error: error.message
    });
  }
};