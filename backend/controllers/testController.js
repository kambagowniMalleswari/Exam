// Import Test, Question, and Attempt models
import mongoose from "mongoose";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";

// Create a test (Admin, Teacher, or Test Creator)
export const createTest = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      duration,
      totalMarks,
      passingMarks,
      passingPercentage,
      numberOfAttempts,
      attemptMode = "re_attempt_on_fail",
      type = "private",
      instructions,
      startDate,
      endDate,
      targetType = "all",
      targetBatches = [],
      targetBatchNumbers = [],
      targetCriteria = {},
      selectedStudentIds = []
    } = req.body;

    // Check required fields & validations
    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Test title is required and must be at least 3 characters"
      });
    }

    const durationNum = Number(duration);
    if (!duration || isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a number greater than 0 minutes"
      });
    }

    let passPct = passingPercentage !== undefined ? Number(passingPercentage) : 40;
    if (isNaN(passPct) || passPct < 0 || passPct > 100) {
      return res.status(400).json({
        success: false,
        message: "Passing percentage must be a number between 0 and 100"
      });
    }

    // Schedule date validation
    let parsedStart = null;
    let parsedEnd = null;
    if (startDate) {
      parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date/time format"
        });
      }
    }
    if (endDate) {
      parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date/time format"
        });
      }
    }
    if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
      return res.status(400).json({
        success: false,
        message: "End date/time must be strictly after start date/time"
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "User authentication is required"
      });
    }

    // Determine organization ownership
    const finalOrgId = req.organizationId || req.user.organizationId || null;

    // Initial status
    const initialStatus = req.body.status === "published" ? "published" : "draft";

    // Create test
    const test = await Test.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      subject: subject ? subject.trim() : "General",
      duration: durationNum,
      totalMarks: Number(totalMarks) || 0,
      passingMarks: Number(passingMarks) || 0,
      passingPercentage: passPct,
      numberOfAttempts: Number(numberOfAttempts) || 1,
      attemptMode: attemptMode === "best_of_n" ? "best_of_n" : "re_attempt_on_fail",
      type: type === "public" ? "public" : "private",
      status: initialStatus,
      instructions: instructions || "Read each question carefully before submitting.",
      startDate: parsedStart,
      endDate: parsedEnd,
      organizationId: finalOrgId,
      createdBy: req.user.id,
      targetType: targetType === "selective" ? "selective" : "all",
      targetBatches: Array.isArray(targetBatches) ? targetBatches : [],
      targetBatchNumbers: Array.isArray(targetBatchNumbers) ? targetBatchNumbers : [],
      targetCriteria: {
        minPriorScore: targetCriteria?.minPriorScore !== undefined && targetCriteria.minPriorScore !== "" ? Number(targetCriteria.minPriorScore) : null,
        maxPriorScore: targetCriteria?.maxPriorScore !== undefined && targetCriteria.maxPriorScore !== "" ? Number(targetCriteria.maxPriorScore) : null,
        meritListTopN: targetCriteria?.meritListTopN !== undefined && targetCriteria.meritListTopN !== "" ? Number(targetCriteria.meritListTopN) : null
      },
      selectedStudentIds: Array.isArray(selectedStudentIds) ? selectedStudentIds : []
    });

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      test
    });
  } catch (error) {
    console.error("Create test error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test",
      error: error.message
    });
  }
};

// Get all tests for management
export const getTests = async (req, res) => {
  try {
    const query = {};

    if (!req.isSuperAdmin) {
      if (!req.organizationId) {
        return res.status(403).json({
          success: false,
          message: "Organization information is missing"
        });
      }
      query.organizationId = req.organizationId;
    } else if (req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    }

    if (req.user.role === "teacher") {
      // By default a teacher manages their own authored tests, unless organization scope is explicitly requested
      if (req.query.scope !== "organization" && req.query.scope !== "all") {
        query.createdBy = req.user.id;
      }
    } else if (req.query.myOnly === "true") {
      query.createdBy = req.user.id;
    }

    // Optional filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.type = req.query.type;
    if (req.query.subject) query.subject = new RegExp(req.query.subject, "i");

    const tests = await Test.find(query)
      .populate("createdBy", "name email")
      .populate("organizationId", "name slug")
      .populate("targetBatches", "name batchNumber")
      .sort({ createdAt: -1 });

    // Populate question counts and attempt counts
    const testsWithCounts = await Promise.all(
      tests.map(async (t) => {
        const questionCount = await Question.countDocuments({ testId: t._id });
        const attemptCount = await Attempt.countDocuments({ testId: t._id });
        return {
          ...t.toObject(),
          questionCount,
          totalAttempts: attemptCount
        };
      })
    );

    res.status(200).json({
      success: true,
      tests: testsWithCounts
    });
  } catch (error) {
    console.error("Get tests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tests",
      error: error.message
    });
  }
};

// Get public catalog of published tests (for landing page / student exploration)
export const getPublicTests = async (req, res) => {
  try {
    const query = {
      type: "public",
      status: "published"
    };

    if (req.query.subject) {
      query.subject = new RegExp(req.query.subject, "i");
    }

    const tests = await Test.find(query)
      .populate("createdBy", "name")
      .select("-instructions")
      .sort({ createdAt: -1 });

    const testsWithDetails = await Promise.all(
      tests.map(async (t) => {
        const questionCount = await Question.countDocuments({ testId: t._id });
        const attemptCount = await Attempt.countDocuments({ testId: t._id });
        return {
          ...t.toObject(),
          questionCount,
          totalAttempts: attemptCount
        };
      })
    );

    res.status(200).json({
      success: true,
      tests: testsWithDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch public tests",
      error: error.message
    });
  }
};

// Get test by ID
export const getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    const test = await Test.findById(id)
      .populate("createdBy", "name email")
      .populate("organizationId", "name slug");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    // Permission check for non-superadmins
    if (!req.isSuperAdmin && test.type !== "public") {
      const userOrgId = (req.organizationId || req.user.organizationId)?.toString();
      const testOrgId = (test.organizationId?._id || test.organizationId)?.toString();

      if (!userOrgId || !testOrgId || userOrgId !== testOrgId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Cross-organization test access is forbidden."
        });
      }

      if (req.user.role === "teacher" && test.createdBy?._id?.toString() !== req.user.id && testOrgId !== userOrgId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this test"
        });
      }
    }

    const questionCount = await Question.countDocuments({ testId: test._id });
    const attemptCount = await Attempt.countDocuments({ testId: test._id });

    res.status(200).json({
      success: true,
      test: {
        ...test.toObject(),
        questionCount,
        totalAttempts: attemptCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get test",
      error: error.message
    });
  }
};

// Update test
export const updateTest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    const test = await Test.findById(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    // Ownership check
    if (!req.isSuperAdmin) {
      if (req.user.role === "teacher" && test.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Teachers can only edit tests they authored"
        });
      }
      if (req.organizationId && test.organizationId && test.organizationId.toString() !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to edit this test"
        });
      }
    }

    const {
      title,
      description,
      subject,
      duration,
      totalMarks,
      passingMarks,
      passingPercentage,
      numberOfAttempts,
      attemptMode,
      type,
      status,
      instructions,
      startDate,
      endDate,
      targetType,
      targetBatches,
      targetBatchNumbers,
      targetCriteria,
      selectedStudentIds
    } = req.body;

    if (title !== undefined) {
      if (!title || title.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "Test title must be at least 3 characters"
        });
      }
      test.title = title.trim();
    }

    if (duration !== undefined) {
      const dNum = Number(duration);
      if (isNaN(dNum) || dNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "Duration must be greater than 0"
        });
      }
      test.duration = dNum;
    }

    if (passingPercentage !== undefined) {
      const pNum = Number(passingPercentage);
      if (isNaN(pNum) || pNum < 0 || pNum > 100) {
        return res.status(400).json({
          success: false,
          message: "Passing percentage must be between 0 and 100"
        });
      }
      test.passingPercentage = pNum;
    }

    let finalStart = startDate !== undefined ? (startDate ? new Date(startDate) : null) : test.startDate;
    let finalEnd = endDate !== undefined ? (endDate ? new Date(endDate) : null) : test.endDate;

    if (finalStart && isNaN(finalStart.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid start date format" });
    }
    if (finalEnd && isNaN(finalEnd.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid end date format" });
    }
    if (finalStart && finalEnd && finalEnd <= finalStart) {
      return res.status(400).json({
        success: false,
        message: "End date/time must be strictly after start date/time"
      });
    }

    if (startDate !== undefined) test.startDate = finalStart;
    if (endDate !== undefined) test.endDate = finalEnd;
    if (description !== undefined) test.description = description.trim();
    if (subject !== undefined) test.subject = subject.trim();
    if (totalMarks !== undefined) test.totalMarks = Number(totalMarks);
    if (passingMarks !== undefined) test.passingMarks = Number(passingMarks);
    if (numberOfAttempts !== undefined) test.numberOfAttempts = Number(numberOfAttempts);
    if (attemptMode !== undefined) test.attemptMode = attemptMode === "best_of_n" ? "best_of_n" : "re_attempt_on_fail";
    if (type !== undefined) test.type = type === "public" ? "public" : "private";
    if (status !== undefined) test.status = status;
    if (instructions !== undefined) test.instructions = instructions;
    if (targetType !== undefined) test.targetType = targetType === "selective" ? "selective" : "all";
    if (targetBatches !== undefined) test.targetBatches = Array.isArray(targetBatches) ? targetBatches : [];
    if (targetBatchNumbers !== undefined) test.targetBatchNumbers = Array.isArray(targetBatchNumbers) ? targetBatchNumbers : [];
    if (targetCriteria !== undefined) {
      test.targetCriteria = {
        minPriorScore: targetCriteria?.minPriorScore !== undefined && targetCriteria.minPriorScore !== "" ? Number(targetCriteria.minPriorScore) : null,
        maxPriorScore: targetCriteria?.maxPriorScore !== undefined && targetCriteria.maxPriorScore !== "" ? Number(targetCriteria.maxPriorScore) : null,
        meritListTopN: targetCriteria?.meritListTopN !== undefined && targetCriteria.meritListTopN !== "" ? Number(targetCriteria.meritListTopN) : null
      };
    }
    if (selectedStudentIds !== undefined) test.selectedStudentIds = Array.isArray(selectedStudentIds) ? selectedStudentIds : [];

    await test.save();

    res.status(200).json({
      success: true,
      message: "Test updated successfully",
      test
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update test",
      error: error.message
    });
  }
};

// Delete test and its questions
export const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    const test = await Test.findById(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    // Ownership check
    if (!req.isSuperAdmin) {
      if (req.user.role === "teacher" && test.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Teachers can only delete tests they authored"
        });
      }
      if (req.organizationId && test.organizationId && test.organizationId.toString() !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this test"
        });
      }
    }

    // Delete associated questions
    await Question.deleteMany({ testId: id });

    // Delete test
    await Test.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Test and its questions deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete test",
      error: error.message
    });
  }
};

// Publish test with validation (Rule 29: must have at least 1 question, valid configuration)
export const publishTest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    // Ownership and organization check
    if (!req.isSuperAdmin) {
      if (req.user.role === "teacher" && test.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Teachers can only publish tests they authored"
        });
      }
      if (req.organizationId && test.organizationId && test.organizationId.toString() !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to publish this test"
        });
      }
    }

    // Check questions
    const questionCount = await Question.countDocuments({ testId: id });
    if (questionCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish test: Please add at least one question before publishing."
      });
    }

    // Automatically recalculate total marks from questions
    const questions = await Question.find({ testId: id });
    const computedTotalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

    test.status = "published";
    test.publishedAt = new Date();
    test.totalMarks = computedTotalMarks;
    await test.save();

    res.status(200).json({
      success: true,
      message: "Test published successfully",
      test
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to publish test",
      error: error.message
    });
  }
};

// Unpublish test
export const unpublishTest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    // Ownership and organization check
    if (!req.isSuperAdmin) {
      if (req.user.role === "teacher" && test.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Teachers can only unpublish tests they authored"
        });
      }
      if (req.organizationId && test.organizationId && test.organizationId.toString() !== req.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to unpublish this test"
        });
      }
    }

    test.status = "draft";
    await test.save();

    res.status(200).json({
      success: true,
      message: "Test unpublished successfully",
      test
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to unpublish test",
      error: error.message
    });
  }
};

// Duplicate test (creates duplicate in draft with copied questions)
export const duplicateTest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    const originalTest = await Test.findById(id);
    if (!originalTest) {
      return res.status(404).json({
        success: false,
        message: "Original test not found"
      });
    }

    // Ownership and organization check
    if (!req.isSuperAdmin && originalTest.type !== "public") {
      const userOrgId = (req.organizationId || req.user.organizationId)?.toString();
      const testOrgId = (originalTest.organizationId?._id || originalTest.organizationId)?.toString();
      if (!userOrgId || !testOrgId || userOrgId !== testOrgId) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to duplicate tests from another organization"
        });
      }
    }

    const targetOrgId = req.organizationId || req.user.organizationId || originalTest.organizationId;

    // Create cloned test
    const clonedTest = await Test.create({
      title: `${originalTest.title} (Copy)`,
      description: originalTest.description,
      subject: originalTest.subject,
      duration: originalTest.duration,
      totalMarks: originalTest.totalMarks,
      passingMarks: originalTest.passingMarks,
      passingPercentage: originalTest.passingPercentage,
      numberOfAttempts: originalTest.numberOfAttempts,
      type: originalTest.type,
      status: "draft",
      instructions: originalTest.instructions,
      organizationId: targetOrgId,
      createdBy: req.user.id
    });

    // Copy questions
    const originalQuestions = await Question.find({ testId: id });
    if (originalQuestions.length > 0) {
      const clonedQuestions = originalQuestions.map((q) => ({
        testId: clonedTest._id,
        organizationId: clonedTest.organizationId,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        order: q.order,
        explanation: q.explanation
      }));
      await Question.insertMany(clonedQuestions);
    }

    res.status(201).json({
      success: true,
      message: "Test duplicated successfully",
      test: clonedTest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to duplicate test",
      error: error.message
    });
  }
};

// Preview test with full questions (for test creator/admin review)
export const previewTest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID"
      });
    }

    const test = await Test.findById(id)
      .populate("createdBy", "name email")
      .populate("organizationId", "name slug");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    const questions = await Question.find({ testId: id }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      test,
      questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to preview test",
      error: error.message
    });
  }
};

// Toggle status (for backward compatibility)
export const toggleTestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }
    if (test.status === "published") {
      return unpublishTest(req, res);
    } else {
      return publishTest(req, res);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};