// Import Result, Attempt, Test, and Question models
import mongoose from "mongoose";
import Result from "../models/Result.js";
import Attempt from "../models/Attempt.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import { evaluateAttempt } from "../utils/calculateResult.js";

// Get single result by attempt ID
export const getResultByAttemptId = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID"
      });
    }

    let result = await Result.findOne({ attemptId })
      .populate("testId", "title subject duration passingPercentage passingMarks instructions")
      .populate("studentId", "name email")
      .populate("organizationId", "name slug");

    // Fallback 1: check if attemptId was actually Result._id
    if (!result) {
      result = await Result.findById(attemptId)
        .populate("testId", "title subject duration passingPercentage passingMarks instructions")
        .populate("studentId", "name email")
        .populate("organizationId", "name slug");
    }

    // Fallback 2: check if Attempt exists and is evaluated/submitted, generate Result on the fly
    if (!result) {
      const attempt = await Attempt.findById(attemptId);
      if (attempt && (attempt.status === "evaluated" || attempt.status === "submitted")) {
        const test = await Test.findById(attempt.testId);
        const questions = await Question.find({ testId: attempt.testId });
        const evaluation = evaluateAttempt(
          questions,
          attempt.answers || [],
          test,
          attempt.startedAt || new Date(),
          attempt.submittedAt || new Date()
        );

        result = await Result.create({
          attemptId: attempt._id,
          testId: attempt.testId,
          studentId: attempt.studentId,
          organizationId: attempt.organizationId,
          totalQuestions: evaluation.totalQuestions,
          correctAnswers: evaluation.correctAnswers,
          wrongAnswers: evaluation.wrongAnswers,
          unanswered: evaluation.unanswered,
          totalMarks: evaluation.totalMarks,
          score: evaluation.score,
          percentage: evaluation.percentage,
          passed: evaluation.passed,
          result: evaluation.result,
          timeTaken: evaluation.timeTaken,
          questionBreakdown: evaluation.questionBreakdown,
          evaluatedAt: attempt.submittedAt || new Date()
        });

        result = await Result.findById(result._id)
          .populate("testId", "title subject duration passingPercentage passingMarks instructions")
          .populate("studentId", "name email")
          .populate("organizationId", "name slug");
      }
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found for this attempt"
      });
    }

    // Security check: student can only view their own result
    const studentIdStr = result.studentId?._id ? result.studentId._id.toString() : result.studentId?.toString();
    if (req.user.role === "student" && studentIdStr !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this result"
      });
    }

    // Security check: tenant isolation
    if (!req.isSuperAdmin && req.organizationId) {
      const orgIdStr = result.organizationId?._id
        ? result.organizationId._id.toString()
        : result.organizationId?.toString();
      if (orgIdStr && orgIdStr !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view results from another organization"
        });
      }
    }

    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get result",
      error: error.message
    });
  }
};

// Get all results for logged-in student
export const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user.id })
      .populate("testId", "title subject duration passingPercentage passingMarks")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get student results",
      error: error.message
    });
  }
};

// Get all results for a specific test (Teachers, Admins, Creators)
export const getResultsByTest = async (req, res) => {
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
          message: "Teachers can only view results for their own authored tests"
        });
      }
      if (req.organizationId && test.organizationId && test.organizationId.toString() !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view results for another organization's test"
        });
      }
    }

    const results = await Result.find({ testId })
      .populate("studentId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      test: {
        _id: test._id,
        title: test.title,
        subject: test.subject,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        passingPercentage: test.passingPercentage
      },
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get test results",
      error: error.message
    });
  }
};

// Get organization-wide results (Admin / Teacher view)
export const getAllResults = async (req, res) => {
  try {
    const query = {};

    if (!req.isSuperAdmin) {
      if (!req.organizationId) {
        return res.status(403).json({
          success: false,
          message: "Organization access is required"
        });
      }
      query.organizationId = req.organizationId;
    } else if (req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    }

    if (req.user.role === "teacher") {
      // Teachers view student results only for their authored tests
      const myTests = await Test.find({ createdBy: req.user.id }).select("_id");
      const myTestIds = myTests.map((t) => t._id);
      query.testId = { $in: myTestIds };
    }

    const results = await Result.find(query)
      .populate("testId", "title subject totalMarks passingPercentage")
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get organization results",
      error: error.message
    });
  }
};

// Fallback manual calculate result if needed
export const calculateResult = async (req, res) => {
  try {
    const { attemptId } = req.params;

    let existingResult = await Result.findOne({ attemptId })
      .populate("testId")
      .populate("studentId", "name email");

    if (existingResult) {
      return res.status(200).json({
        success: true,
        message: "Result already evaluated",
        result: existingResult
      });
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    const test = await Test.findById(attempt.testId);
    const questions = await Question.find({ testId: attempt.testId });

    const evaluation = evaluateAttempt(
      questions,
      attempt.answers,
      test,
      attempt.startedAt,
      attempt.submittedAt || new Date()
    );

    attempt.status = "evaluated";
    attempt.score = evaluation.score;
    attempt.totalMarks = evaluation.totalMarks;
    attempt.percentage = evaluation.percentage;
    attempt.passed = evaluation.passed;
    attempt.timeTaken = evaluation.timeTaken;
    await attempt.save();

    const newResult = await Result.create({
      attemptId: attempt._id,
      testId: attempt.testId,
      studentId: attempt.studentId,
      organizationId: attempt.organizationId,
      totalQuestions: evaluation.totalQuestions,
      correctAnswers: evaluation.correctAnswers,
      wrongAnswers: evaluation.wrongAnswers,
      unanswered: evaluation.unanswered,
      totalMarks: evaluation.totalMarks,
      score: evaluation.score,
      percentage: evaluation.percentage,
      passed: evaluation.passed,
      result: evaluation.result,
      timeTaken: evaluation.timeTaken,
      questionBreakdown: evaluation.questionBreakdown,
      evaluatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Result calculated successfully",
      result: newResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate result",
      error: error.message
    });
  }
};