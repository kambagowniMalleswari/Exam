// Institutional Reports & Analytics Controller with Real MongoDB Aggregations
import mongoose from "mongoose";
import Result from "../models/Result.js";
import Test from "../models/Test.js";
import User from "../models/User.js";
import Attempt from "../models/Attempt.js";
import Organization from "../models/Organization.js";
import Subscription from "../models/Subscription.js";
import TeacherApplication from "../models/TeacherApplication.js";
import Question from "../models/Question.js";

// 1. Super Admin Platform Analytics (Real MongoDB aggregations, strictly no mock numbers)
export const getSuperAdminAnalytics = async (req, res) => {
  try {
    // Parallel aggregation execution
    const [
      totalOrgs,
      activeOrgs,
      inactiveOrgs,
      orgGrowthRaw,
      totalTeachers,
      activeTeachers,
      pendingTeacherApprovals,
      teachersBySubjectRaw,
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalTests,
      testsBySubjectRaw,
      totalAttempts,
      completedAttempts,
      resultsStatsRaw,
      activeSubscriptionsRaw
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: "active", isActive: true }),
      Organization.countDocuments({ $or: [{ status: { $ne: "active" } }, { isActive: false }] }),
      // Organization growth by month
      Organization.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      // Teachers
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "teacher", status: "active", isActive: true }),
      TeacherApplication.countDocuments({ status: "pending" }),
      // Teachers by Subject
      User.aggregate([
        { $match: { role: "teacher" } },
        {
          $group: {
            _id: { $ifNull: ["$subject", "General"] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      // Students
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", status: "active", isActive: true }),
      User.countDocuments({ role: "student", $or: [{ status: { $ne: "active" } }, { isActive: false }] }),
      // Tests
      Test.countDocuments(),
      // Tests by Subject
      Test.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$subject", "General"] },
            totalTests: { $sum: 1 },
            publishedTests: {
              $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] }
            }
          }
        },
        { $sort: { totalTests: -1 } }
      ]),
      // Attempts
      Attempt.countDocuments(),
      Attempt.countDocuments({ status: { $in: ["submitted", "evaluated"] } }),
      // Results summary (pass rate, avg percentage)
      Result.aggregate([
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            passedCount: {
              $sum: { $cond: [{ $or: [{ $eq: ["$passed", true] }, { $eq: ["$result", "pass"] }] }, 1, 0] }
            },
            avgPercentage: { $avg: "$percentage" },
            highestScore: { $max: "$percentage" },
            lowestScore: { $min: "$percentage" }
          }
        }
      ]),
      // Subscriptions for real revenue
      Subscription.find({ status: "active" }).select("price plan")
    ]);

    // Format Organization Growth
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const orgGrowth = orgGrowthRaw.map((item) => ({
      period: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count
    }));

    // Format Teachers by Subject
    const teachersBySubject = teachersBySubjectRaw
      .filter((t) => t._id && t._id.trim())
      .map((t) => ({
        subject: t._id,
        teachersCount: t.count
      }));

    // Format Tests by Subject
    const testsBySubject = testsBySubjectRaw.map((s) => ({
      subject: s._id,
      totalTests: s.totalTests,
      publishedTests: s.publishedTests
    }));

    // Results calculations
    const resSummary = resultsStatsRaw[0] || {
      totalResults: 0,
      passedCount: 0,
      avgPercentage: 0,
      highestScore: 0,
      lowestScore: 0
    };

    const passRate = resSummary.totalResults > 0
      ? Number(((resSummary.passedCount / resSummary.totalResults) * 100).toFixed(1))
      : 0;

    const completionRate = totalAttempts > 0
      ? Number(((completedAttempts / totalAttempts) * 100).toFixed(1))
      : 0;

    // Revenue calculation (strictly from real subscription records)
    let revenueData = null;
    const paidSubscriptions = activeSubscriptionsRaw.filter((sub) => sub.price && sub.price > 0);
    if (paidSubscriptions.length > 0) {
      const totalAmount = paidSubscriptions.reduce((acc, sub) => acc + sub.price, 0);
      revenueData = {
        available: true,
        totalRevenue: totalAmount,
        activeSubscriptionsCount: paidSubscriptions.length,
        currency: "USD",
        status: "recorded"
      };
    } else {
      revenueData = {
        available: false,
        display: "Revenue data unavailable",
        message: "No paid transactions recorded. Current active organizations are on free/institutional tier.",
        status: "N/A"
      };
    }

    // Total legitimate platform users
    const totalUsers = totalTeachers + totalStudents;

    res.status(200).json({
      success: true,
      report: {
        organizations: {
          total: totalOrgs,
          active: activeOrgs,
          inactive: inactiveOrgs,
          growthTrend: orgGrowth
        },
        teachers: {
          total: totalTeachers,
          active: activeTeachers,
          pendingApprovals: pendingTeacherApprovals,
          bySubject: teachersBySubject
        },
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: inactiveStudents,
          participatingInTests: completedAttempts,
          averagePerformance: Number((resSummary.avgPercentage || 0).toFixed(1)),
          completionRate
        },
        tests: {
          total: totalTests,
          bySubject: testsBySubject
        },
        attempts: {
          total: totalAttempts,
          completed: completedAttempts,
          passRate
        },
        users: {
          total: totalUsers,
          teachers: totalTeachers,
          students: totalStudents
        },
        revenue: revenueData
      }
    });
  } catch (error) {
    console.error("Super Admin Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load super admin analytics",
      error: error.message
    });
  }
};

// 2. Organization Admin Dashboard Report (Multi-tenant isolated)
export const getOrganizationReport = async (req, res) => {
  try {
    const orgId = req.isSuperAdmin
      ? req.query.organizationId || req.organizationId
      : req.organizationId;

    if (!orgId && !req.isSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required"
      });
    }

    const orgFilter = orgId ? { organizationId: orgId } : {};

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      pendingTeacherRequests,
      totalTests,
      publishedTests,
      draftTests,
      results,
      attemptsCount
    ] = await Promise.all([
      User.countDocuments({ ...orgFilter, role: "student" }),
      User.countDocuments({ ...orgFilter, role: "student", status: "active", isActive: true }),
      User.countDocuments({ ...orgFilter, role: "teacher" }),
      User.countDocuments({ ...orgFilter, role: "teacher", status: "active", isActive: true }),
      TeacherApplication.countDocuments({ ...(orgId ? { organizationId: orgId } : {}), status: "pending" }),
      Test.countDocuments(orgFilter),
      Test.countDocuments({ ...orgFilter, status: "published" }),
      Test.countDocuments({ ...orgFilter, status: "draft" }),
      Result.find(orgFilter)
        .populate("testId", "title subject duration")
        .populate("studentId", "name email")
        .sort({ createdAt: -1 }),
      Attempt.countDocuments(orgFilter)
    ]);

    const totalAttempts = results.length;
    const passed = results.filter((item) => item.passed || item.result === "pass").length;
    const failed = totalAttempts - passed;
    const passRate = totalAttempts > 0 ? Number(((passed / totalAttempts) * 100).toFixed(1)) : 0;

    const averagePercentage =
      totalAttempts > 0
        ? Number((results.reduce((total, item) => total + (item.percentage || 0), 0) / totalAttempts).toFixed(1))
        : 0;

    const highestPercentage =
      totalAttempts > 0 ? Math.max(...results.map((item) => item.percentage || 0)) : 0;

    const lowestPercentage =
      totalAttempts > 0 ? Math.min(...results.map((item) => item.percentage || 0)) : 0;

    // Subject breakdown
    const subjectMap = {};
    results.forEach((r) => {
      const subj = r.testId?.subject || "General";
      if (!subjectMap[subj]) {
        subjectMap[subj] = { subject: subj, attempts: 0, totalScore: 0, passed: 0 };
      }
      subjectMap[subj].attempts++;
      subjectMap[subj].totalScore += r.percentage || 0;
      if (r.passed || r.result === "pass") {
        subjectMap[subj].passed++;
      }
    });

    const subjectBreakdown = Object.values(subjectMap).map((s) => ({
      subject: s.subject,
      attempts: s.attempts,
      averagePercentage: Number((s.totalScore / s.attempts).toFixed(1)),
      passRate: Number(((s.passed / s.attempts) * 100).toFixed(1))
    }));

    res.status(200).json({
      success: true,
      report: {
        totalStudents,
        activeStudents,
        totalTeachers,
        activeTeachers,
        pendingTeacherRequests,
        totalTests,
        publishedTests,
        draftTests,
        totalAttempts: attemptsCount || totalAttempts,
        completedAttempts: totalAttempts,
        passed,
        failed,
        passRate,
        averagePercentage,
        highestPercentage,
        lowestPercentage,
        recentAttempts: results.slice(0, 6),
        subjectBreakdown
      }
    });
  } catch (error) {
    console.error("Organization report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate organization report",
      error: error.message
    });
  }
};

// 3. Teacher Dashboard Stats (Teacher-scoped)
export const getTeacherDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get all tests authored by this teacher
    const myTests = await Test.find({ createdBy: teacherId }).sort({ createdAt: -1 });
    const testIds = myTests.map((t) => t._id);

    const now = new Date();
    const draftTests = myTests.filter((t) => t.status === "draft").length;
    const publishedTests = myTests.filter((t) => t.status === "published").length;
    const scheduledTests = myTests.filter((t) => t.startDate && new Date(t.startDate) > now).length;

    // Total questions in teacher's tests
    const totalQuestions = await Question.countDocuments({ testId: { $in: testIds } });

    // Attempts and results on teacher's tests
    const [attempts, results] = await Promise.all([
      Attempt.find({ testId: { $in: testIds } }).sort({ createdAt: -1 }),
      Result.find({ testId: { $in: testIds } })
        .populate("testId", "title subject")
        .populate("studentId", "name email")
        .sort({ createdAt: -1 })
    ]);

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(
      (a) => a.status === "submitted" || a.status === "evaluated"
    ).length;

    const completionRate = totalAttempts > 0
      ? Number(((completedAttempts / totalAttempts) * 100).toFixed(1))
      : 0;

    const avgScore = results.length > 0
      ? Number((results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length).toFixed(1))
      : 0;

    const passedCount = results.filter((r) => r.passed || r.result === "pass").length;
    const passRate = results.length > 0
      ? Number(((passedCount / results.length) * 100).toFixed(1))
      : 0;

    const totalStudents = await User.countDocuments({
      role: "student",
      ...(req.user.organizationId ? { organizationId: req.user.organizationId } : {})
    });

    res.status(200).json({
      success: true,
      report: {
        totalTests: myTests.length,
        totalStudents,
        draftTests,
        publishedTests,
        scheduledTests,
        totalQuestions,
        totalAttempts,
        completedAttempts,
        completionRate,
        avgScore,
        passRate,
        recentTests: myTests.slice(0, 5),
        recentAttempts: results.slice(0, 5)
      }
    });
  } catch (error) {
    console.error("Teacher dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load teacher dashboard statistics",
      error: error.message
    });
  }
};

// 4. Student Dashboard Stats (Student-scoped)
export const getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentOrgId = req.user.organizationId || null;

    // Available tests query
    const orConditions = [{ type: "public", status: "published" }];
    if (studentOrgId) {
      orConditions.push({ organizationId: studentOrgId, status: "published" });
    }

    const allCandidateTests = await Test.find({ $or: orConditions })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    const now = new Date();
    let upcomingCount = 0;
    let availableCount = 0;

    allCandidateTests.forEach((t) => {
      if (t.startDate && new Date(t.startDate) > now) {
        upcomingCount++;
      } else if (t.endDate && new Date(t.endDate) < now) {
        // closed
      } else {
        availableCount++;
      }
    });

    // Student's own attempts & results
    const [myAttempts, myResults] = await Promise.all([
      Attempt.find({ studentId }).sort({ createdAt: -1 }),
      Result.find({ studentId })
        .populate("testId", "title subject passingMarks totalMarks duration")
        .sort({ createdAt: -1 })
    ]);

    const inProgressCount = myAttempts.filter(
      (a) => a.status === "in_progress" || a.status === "started"
    ).length;

    const completedAttempts = myAttempts.filter(
      (a) => a.status === "submitted" || a.status === "evaluated"
    );

    const avgScore = myResults.length > 0
      ? Number((myResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / myResults.length).toFixed(1))
      : 0;

    const passedCount = myResults.filter((r) => r.passed || r.result === "pass").length;
    const passRate = myResults.length > 0
      ? Number(((passedCount / myResults.length) * 100).toFixed(1))
      : 0;

    // Calculate accuracy (correct answers / total questions across all attempts)
    let totalCorrectAnswers = 0;
    let totalQuestionsAttempted = 0;
    myResults.forEach((r) => {
      totalCorrectAnswers += r.correctAnswers || 0;
      totalQuestionsAttempted += (r.totalQuestions || 0);
    });

    const accuracyRate = totalQuestionsAttempted > 0
      ? Number(((totalCorrectAnswers / totalQuestionsAttempted) * 100).toFixed(1))
      : 0;

    // Subject-wise performance breakdown
    const subjectMap = {};
    myResults.forEach((r) => {
      const subj = r.testId?.subject || "General";
      if (!subjectMap[subj]) {
        subjectMap[subj] = { subject: subj, count: 0, totalScore: 0, passed: 0 };
      }
      subjectMap[subj].count++;
      subjectMap[subj].totalScore += r.percentage || 0;
      if (r.passed || r.result === "pass") subjectMap[subj].passed++;
    });

    const subjectPerformance = Object.values(subjectMap).map((s) => ({
      subject: s.subject,
      testsTaken: s.count,
      avgPercentage: Number((s.totalScore / s.count).toFixed(1)),
      passRate: Number(((s.passed / s.count) * 100).toFixed(1))
    }));

    res.status(200).json({
      success: true,
      report: {
        availableTestsCount: availableCount,
        upcomingTestsCount: upcomingCount,
        testsInProgressCount: inProgressCount,
        completedTestsCount: completedAttempts.length,
        averageScore: avgScore,
        passRate,
        accuracyRate,
        subjectPerformance,
        recentResults: myResults.slice(0, 5)
      }
    });
  } catch (error) {
    console.error("Student dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load student dashboard statistics",
      error: error.message
    });
  }
};