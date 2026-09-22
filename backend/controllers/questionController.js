// Import Question and Test models
import mongoose from "mongoose";
import Question from "../models/Question.js";
import Test from "../models/Test.js";

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
      explanation = ""
    } = req.body;

    // Check required fields
    if (!questionText || !testId || !options || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: "Question text, test ID, options, and correct answer are required"
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
      if (req.organizationId && test.organizationId && test.organizationId.toString() !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to add questions to another organization's test"
        });
      }
    }

    // Check options
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 options are required"
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
      options,
      correctAnswer: correctAnswer.trim(),
      marks: Number(marks) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      order: questionOrder,
      explanation: explanation || ""
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

    // Exclude correctAnswer and explanation to prevent cheating
    const questions = await Question.find({ testId })
      .select("-correctAnswer -explanation")
      .sort({ order: 1 });

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

    const {
      questionText,
      options,
      correctAnswer,
      marks,
      negativeMarks,
      order,
      explanation
    } = req.body;

    if (questionText !== undefined) question.questionText = questionText.trim();
    if (options !== undefined) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: "At least 2 options are required"
        });
      }
      question.options = options;
    }
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer.trim();
    if (marks !== undefined) question.marks = Number(marks) || 1;
    if (negativeMarks !== undefined) question.negativeMarks = Number(negativeMarks) || 0;
    if (order !== undefined) question.order = Number(order) || 1;
    if (explanation !== undefined) question.explanation = explanation;

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