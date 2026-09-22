import mongoose from "mongoose";
import Attempt from "../models/Attempt.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import Result from "../models/Result.js";
import User from "../models/User.js";
import { evaluateAttempt } from "../utils/calculateResult.js";

// Helper: Check student eligibility for selective tests
export const isStudentEligibleForTest = async (student, test) => {
  if (!test || !test.targetType || test.targetType === "all") {
    return { eligible: true };
  }

  if (!student) {
    return { eligible: true };
  }

  // 1. Direct student selection whitelist check
  if (test.selectedStudentIds && test.selectedStudentIds.length > 0) {
    const isSelected = test.selectedStudentIds.some(
      (id) => id.toString() === student._id.toString()
    );
    if (isSelected) return { eligible: true };
  }

  // 2. Batch check
  let matchedBatch = false;
  if (test.targetBatches && test.targetBatches.length > 0) {
    if (student.batchId) {
      matchedBatch = test.targetBatches.some((b) => {
        const bId = b._id ? b._id.toString() : b.toString();
        return bId === student.batchId.toString();
      });
    }
  }
  if (!matchedBatch && test.targetBatchNumbers && test.targetBatchNumbers.length > 0) {
    if (student.batchNumber) {
      matchedBatch = test.targetBatchNumbers.some(
        (code) => code.toUpperCase() === student.batchNumber.toUpperCase()
      );
    }
  }

  const hasBatchRestriction =
    (test.targetBatches && test.targetBatches.length > 0) ||
    (test.targetBatchNumbers && test.targetBatchNumbers.length > 0);

  const hasScoreCriteria =
    test.targetCriteria?.minPriorScore != null ||
    test.targetCriteria?.maxPriorScore != null ||
    test.targetCriteria?.meritListTopN != null;

  if (hasBatchRestriction && !matchedBatch && !hasScoreCriteria) {
    return {
      eligible: false,
      reason: "Restricted to specific cohort batch(es)."
    };
  }

  // 3. Score & Merit Criteria check
  if (hasScoreCriteria) {
    const results = await Result.find({ studentId: student._id });
    const avgScore = results.length > 0
      ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length
      : 0;

    if (test.targetCriteria?.minPriorScore != null && avgScore < test.targetCriteria.minPriorScore) {
      return {
        eligible: false,
        reason: `Requires minimum prior score of ${test.targetCriteria.minPriorScore}% (current average: ${Math.round(avgScore)}%).`
      };
    }

    if (test.targetCriteria?.maxPriorScore != null && avgScore > test.targetCriteria.maxPriorScore) {
      return {
        eligible: false,
        reason: `Assessment targeted for remedial cohort (ceiling score: ${test.targetCriteria.maxPriorScore}%).`
      };
    }

    if (test.targetCriteria?.meritListTopN != null) {
      const topN = Number(test.targetCriteria.meritListTopN);
      if (topN > 0 && student.organizationId) {
        const topStudents = await Result.aggregate([
          { $match: { organizationId: student.organizationId } },
          { $group: { _id: "$studentId", avgPercentage: { $avg: "$percentage" } } },
          { $sort: { avgPercentage: -1 } },
          { $limit: topN }
        ]);
        const isTopMerit = topStudents.some(
          (s) => s._id.toString() === student._id.toString()
        );
        if (!isTopMerit) {
          return {
            eligible: false,
            reason: `Restricted to top ${topN} merit list rankers.`
          };
        }
      }
    }
  }

  // If test has batch restriction, check student's batch; but if teacher published it for the organization, let it reflect
  if (hasBatchRestriction && !matchedBatch) {
    // If student is enrolled in a batch linked to this test, they match
    if (student.batchId) {
      const isBatchLinked = test.targetBatches?.some(
        (b) => (b._id ? b._id.toString() : b.toString()) === student.batchId.toString()
      );
      if (isBatchLinked) return { eligible: true };
    }
    // If teacher set targetType to all or general organization test, allow access
    if (test.targetType !== "selective") {
      return { eligible: true };
    }
    return {
      eligible: false,
      reason: "Restricted to specific cohort batch(es)."
    };
  }

  return { eligible: true };
};

// Get tests available for student to take
export const getAvailableTests = async (req, res) => {
  try {
    const studentOrgId = req.organizationId || req.user.organizationId || null;

    // Filter published tests:
    // 1. All public tests
    // 2. Private tests belonging to student's organization (if student has org)
    const orConditions = [{ type: "public", status: "published" }];
    if (studentOrgId) {
      orConditions.push({ organizationId: studentOrgId, status: "published" });
    }

    const studentUser = await User.findById(req.user.id);

    const tests = await Test.find({ $or: orConditions })
      .populate("createdBy", "name")
      .populate("organizationId", "name slug")
      .populate("targetBatches", "name batchNumber")
      .sort({ createdAt: -1 });

    // Map through tests to attach question counts, schedule status, and student's attempt status
    const now = new Date();
    const availableTests = await Promise.all(
      tests.map(async (test) => {
        const questionCount = await Question.countDocuments({ testId: test._id });
        const studentAttempts = await Attempt.find({
          testId: test._id,
          studentId: req.user.id
        }).sort({ createdAt: -1 });

        const completedAttempts = studentAttempts.filter(
          (a) => a.status === "submitted" || a.status === "evaluated"
        );
        const completedCount = completedAttempts.length;

        const activeAttempt = studentAttempts.find(
          (a) => a.status === "in_progress" || a.status === "started"
        );

        let scheduleStatus = "active";
        if (test.startDate && now < new Date(test.startDate)) {
          scheduleStatus = "upcoming";
        } else if (test.endDate && now > new Date(test.endDate)) {
          scheduleStatus = "closed";
        }

        const maxAttempts = test.numberOfAttempts || 1;
        const attemptMode = test.attemptMode || "re_attempt_on_fail";
        const passingThreshold = test.passingPercentage !== undefined ? test.passingPercentage : 40;

        // Check if student has already passed this assessment
        const hasPassed = completedAttempts.some(
          (a) => a.passed === true || (a.percentage != null && a.percentage >= passingThreshold)
        );

        // Calculate pending attempts
        let attemptsPending = 0;
        let attemptBlockedReason = "";

        if (attemptMode === "re_attempt_on_fail") {
          if (hasPassed) {
            attemptsPending = 0;
            attemptBlockedReason = "Passed (Qualified - No re-attempts required)";
          } else {
            attemptsPending = Math.max(0, maxAttempts - completedCount);
            if (attemptsPending === 0 && completedCount >= maxAttempts) {
              attemptBlockedReason = "All re-attempts exhausted";
            }
          }
        } else {
          // best_of_n
          attemptsPending = Math.max(0, maxAttempts - completedCount);
          if (attemptsPending === 0 && completedCount >= maxAttempts) {
            attemptBlockedReason = "All attempts completed";
          }
        }

        const eligibility = await isStudentEligibleForTest(studentUser, test);
        const canAttempt = attemptsPending > 0 && scheduleStatus === "active" && eligibility.eligible;

        return {
          ...test.toObject(),
          questionCount,
          studentAttemptsCount: completedCount,
          maxAttempts,
          attemptMode,
          attemptsPending,
          hasPassed,
          attemptBlockedReason,
          canAttempt,
          scheduleStatus,
          eligibility,
          activeAttemptId: activeAttempt ? activeAttempt._id : null,
          latestAttempt: studentAttempts[0] || null
        };
      })
    );

    res.status(200).json({
      success: true,
      tests: availableTests
    });
  } catch (error) {
    console.error("Get available tests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get available tests",
      error: error.message
    });
  }
};

// Start a test attempt
export const startAttempt = async (req, res) => {
  try {
    const testId = req.body.testId || req.params.testId;

    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,
        message: "A valid test ID is required to begin an attempt"
      });
    }

    // Find test
    const test = await Test.findById(testId);
    if (!test || test.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "This test is not published or is no longer available"
      });
    }

    // Scheduling rules enforcement
    const now = new Date();
    if (test.startDate && now < new Date(test.startDate)) {
      return res.status(400).json({
        success: false,
        message: `This test is not available yet. It is scheduled to start on ${new Date(test.startDate).toLocaleString()}.`
      });
    }
    if (test.endDate && now > new Date(test.endDate)) {
      return res.status(400).json({
        success: false,
        message: "This test has ended and is now closed."
      });
    }

    // Tenant check
    if (test.type !== "public") {
      const studentOrgId = req.organizationId || req.user.organizationId;
      if (!studentOrgId || test.organizationId?.toString() !== studentOrgId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to attempt this private test"
        });
      }
    }

    // Selective cohort targeting eligibility check
    if (test.targetType === "selective") {
      const student = await User.findById(req.user.id);
      const eligibility = await isStudentEligibleForTest(student, test);
      if (!eligibility.eligible) {
        return res.status(403).json({
          success: false,
          message: `You are not eligible to attempt this assessment: ${eligibility.reason || "Selective cohort restriction."}`
        });
      }
    }

    // Check if student already has an active attempt (resume existing attempt)
    const existingActiveAttempt = await Attempt.findOne({
      testId,
      studentId: req.user.id,
      status: { $in: ["in_progress", "started"] }
    });

    if (existingActiveAttempt) {
      // Verify timer hasn't expired
      const durationSeconds = (test.duration || 30) * 60;
      const elapsedSeconds = Math.round((Date.now() - new Date(existingActiveAttempt.startedAt).getTime()) / 1000);

      // If time still remains, return the active attempt
      if (elapsedSeconds < durationSeconds + 60) {
        return res.status(200).json({
          success: true,
          message: "Resuming existing test attempt",
          attempt: existingActiveAttempt,
          remainingSeconds: Math.max(0, durationSeconds - elapsedSeconds)
        });
      } else {
        // Auto submit expired attempt
        await autoSubmitAttempt(existingActiveAttempt, test);
      }
    }

    // Check completed attempts and attempt policy
    const completedAttempts = await Attempt.find({
      testId,
      studentId: req.user.id,
      status: { $in: ["submitted", "evaluated"] }
    });

    const completedAttemptsCount = completedAttempts.length;
    const maxAttempts = test.numberOfAttempts || 1;
    const attemptMode = test.attemptMode || "re_attempt_on_fail";
    const passThreshold = test.passingPercentage !== undefined ? test.passingPercentage : 40;

    if (attemptMode === "re_attempt_on_fail") {
      const alreadyPassed = completedAttempts.find(
        (a) => a.passed === true || (a.percentage != null && a.percentage >= passThreshold)
      );
      if (alreadyPassed) {
        return res.status(400).json({
          success: false,
          message: `You have already passed this assessment with ${alreadyPassed.percentage}%. Re-attempts are only permitted if you do not meet the passing percentage (${passThreshold}%).`
        });
      }
    }

    if (completedAttemptsCount >= maxAttempts) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum allowed attempts (${maxAttempts}) for this test.`
      });
    }

    // Create new attempt
    const attempt = await Attempt.create({
      testId,
      studentId: req.user.id,
      organizationId: test.organizationId || null,
      answers: [],
      status: "in_progress",
      startedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Test started successfully",
      attempt,
      remainingSeconds: (test.duration || 30) * 60
    });
  } catch (error) {
    console.error("Start attempt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start test attempt",
      error: error.message
    });
  }
};

// Save student answer
export const saveAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, selectedAnswer, isFlagged } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required"
      });
    }

    const attempt = await Attempt.findOne({
      _id: id,
      studentId: req.user.id,
      status: { $in: ["in_progress", "started"] }
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Active attempt not found"
      });
    }

    // Timer check: verify if time has expired
    const test = await Test.findById(attempt.testId);
    if (test) {
      const durationSeconds = (test.duration || 30) * 60;
      const elapsedSeconds = Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      if (elapsedSeconds > durationSeconds + 120) {
        // Expired, auto submit
        const evaluatedResult = await autoSubmitAttempt(attempt, test);
        return res.status(400).json({
          success: false,
          message: "Time has expired. Test has been automatically submitted.",
          result: evaluatedResult
        });
      }
    }

    // Find and update or append answer
    const existingIndex = attempt.answers.findIndex(
      (a) => a.questionId.toString() === questionId.toString()
    );

    if (existingIndex > -1) {
      if (selectedAnswer !== undefined) {
        attempt.answers[existingIndex].selectedAnswer = selectedAnswer;
      }
      if (isFlagged !== undefined) {
        attempt.answers[existingIndex].isFlagged = isFlagged;
      }
    } else {
      attempt.answers.push({
        questionId,
        selectedAnswer: selectedAnswer || "",
        isFlagged: Boolean(isFlagged)
      });
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: "Answer saved successfully",
      attempt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save answer",
      error: error.message
    });
  }
};

// Internal helper for auto submitting on time expiration
const autoSubmitAttempt = async (attempt, test) => {
  const questions = await Question.find({ testId: attempt.testId });
  const submittedAt = new Date();
  const evaluation = evaluateAttempt(
    questions,
    attempt.answers,
    test,
    attempt.startedAt,
    submittedAt
  );

  attempt.status = "evaluated";
  attempt.submittedAt = submittedAt;
  attempt.score = evaluation.score;
  attempt.totalMarks = evaluation.totalMarks;
  attempt.percentage = evaluation.percentage;
  attempt.passed = evaluation.passed;
  attempt.passingPercentage = evaluation.passingPercentage || 40;
  attempt.timeTaken = evaluation.timeTaken;
  await attempt.save();

  // Create or update result safely
  const resultData = {
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
    passingPercentage: evaluation.passingPercentage || 40,
    result: evaluation.result,
    timeTaken: evaluation.timeTaken,
    questionBreakdown: evaluation.questionBreakdown,
    evaluatedAt: submittedAt
  };

  const result = await Result.findOneAndUpdate(
    { attemptId: attempt._id },
    { $set: resultData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return result;
};

// Submit test and automatically evaluate
export const submitAttempt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID"
      });
    }

    let attempt = await Attempt.findOne({
      _id: id,
      studentId: req.user.id
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    // Prevent duplicate evaluation if already submitted
    if (attempt.status === "evaluated" || attempt.status === "submitted") {
      const existingResult = await Result.findOne({ attemptId: attempt._id });
      return res.status(200).json({
        success: true,
        message: "Test has already been submitted",
        attempt,
        result: existingResult
      });
    }

    const test = await Test.findById(attempt.testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    // Persist any submitted answers provided directly in request body
    if (req.body.answers) {
      const incoming = req.body.answers;
      if (Array.isArray(incoming)) {
        incoming.forEach((ans) => {
          if (ans && ans.questionId) {
            const existingIdx = attempt.answers.findIndex(
              (a) => a.questionId.toString() === ans.questionId.toString()
            );
            if (existingIdx > -1) {
              attempt.answers[existingIdx].selectedAnswer = ans.selectedAnswer || "";
            } else {
              attempt.answers.push({
                questionId: ans.questionId,
                selectedAnswer: ans.selectedAnswer || "",
                isFlagged: Boolean(ans.isFlagged)
              });
            }
          }
        });
      } else if (typeof incoming === "object") {
        Object.entries(incoming).forEach(([qId, selAns]) => {
          if (mongoose.Types.ObjectId.isValid(qId)) {
            const existingIdx = attempt.answers.findIndex(
              (a) => a.questionId.toString() === qId.toString()
            );
            if (existingIdx > -1) {
              attempt.answers[existingIdx].selectedAnswer = selAns || "";
            } else {
              attempt.answers.push({
                questionId: qId,
                selectedAnswer: selAns || "",
                isFlagged: false
              });
            }
          }
        });
      }
      await attempt.save();
    }

    // Perform server-side evaluation with actual Question documents
    const questions = await Question.find({ testId: attempt.testId });
    const submittedAt = new Date();
    const evaluation = evaluateAttempt(
      questions,
      attempt.answers,
      test,
      attempt.startedAt,
      submittedAt
    );

    // Update attempt record
    attempt.status = "evaluated";
    attempt.submittedAt = submittedAt;
    attempt.score = evaluation.score;
    attempt.totalMarks = evaluation.totalMarks;
    attempt.percentage = evaluation.percentage;
    attempt.passed = evaluation.passed;
    attempt.passingPercentage = evaluation.passingPercentage || 40;
    attempt.timeTaken = evaluation.timeTaken;
    await attempt.save();

    // Create or update Result document safely (idempotent upsert)
    const resultData = {
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
      passingPercentage: evaluation.passingPercentage || 40,
      result: evaluation.result,
      timeTaken: evaluation.timeTaken,
      questionBreakdown: evaluation.questionBreakdown,
      evaluatedAt: submittedAt
    };

    const result = await Result.findOneAndUpdate(
      { attemptId: attempt._id },
      { $set: resultData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Test submitted and evaluated successfully",
      attempt,
      result
    });
  } catch (error) {
    console.error("Submit attempt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit test",
      error: error.message
    });
  }
};

// Get single attempt by ID
export const getAttempt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID"
      });
    }

    const query = { _id: id };
    // Students can only see their own attempts
    if (req.user.role === "student") {
      query.studentId = req.user.id;
    }

    const attempt = await Attempt.findOne(query)
      .populate("testId")
      .populate("studentId", "name email");

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found"
      });
    }

    // Calculate remaining seconds if active
    let remainingSeconds = 0;
    if (attempt.status === "in_progress" && attempt.testId) {
      const durationSeconds = (attempt.testId.duration || 30) * 60;
      const elapsedSeconds = Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
    }

    res.status(200).json({
      success: true,
      attempt,
      remainingSeconds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get attempt",
      error: error.message
    });
  }
};

// Get all attempts for current logged-in student with attempt tracking & pending statistics
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ studentId: req.user.id })
      .populate("testId", "title subject duration passingPercentage passingMarks type numberOfAttempts attemptMode status startDate endDate")
      .sort({ createdAt: -1 });

    // Track test attempt counts and qualification status
    const testAttemptCounts = {};
    const testPassedMap = {};

    attempts.forEach((a) => {
      const tId = a.testId?._id?.toString() || a.testId?.toString();
      if (!tId) return;
      if (a.status === "submitted" || a.status === "evaluated") {
        testAttemptCounts[tId] = (testAttemptCounts[tId] || 0) + 1;
        const passThreshold = a.testId?.passingPercentage ?? 40;
        if (a.passed === true || (a.percentage != null && a.percentage >= passThreshold)) {
          testPassedMap[tId] = true;
        }
      }
    });

    const enrichedAttempts = attempts.map((a) => {
      const t = a.testId;
      const tId = t?._id?.toString();
      const maxAtt = t?.numberOfAttempts || 1;
      const mode = t?.attemptMode || "re_attempt_on_fail";
      const totalTaken = tId ? (testAttemptCounts[tId] || 0) : 1;
      const hasPassed = tId ? Boolean(testPassedMap[tId]) : (a.passed === true);

      let pending = 0;
      if (mode === "re_attempt_on_fail") {
        pending = hasPassed ? 0 : Math.max(0, maxAtt - totalTaken);
      } else {
        pending = Math.max(0, maxAtt - totalTaken);
      }

      return {
        ...a.toObject(),
        maxAttempts: maxAtt,
        attemptMode: mode,
        attemptsTaken: totalTaken,
        attemptsPending: pending,
        hasPassed,
        canReattempt: pending > 0 && t?.status === "published"
      };
    });

    res.status(200).json({
      success: true,
      attempts: enrichedAttempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get student attempts",
      error: error.message
    });
  }
};