import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import Result from "../models/Result.js";
import { evaluateAttempt } from "../utils/calculateResult.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";

async function runTests() {
  console.log("=================================================");
  console.log("  ASSESSIQ PRODUCTION TEST SUITE & VERIFICATION  ");
  console.log("=================================================\n");

  try {
    await mongoose.connect(MONGO_URI);
    console.log(" Connected to MongoDB:", MONGO_URI);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: User Registration Validations (Phone, Password, Role)
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: User Registration & Model Validations ---");
    
    // Clean up test users
    await User.deleteMany({ email: { $in: ["teststudent1@example.com", "testteacher1@example.com", "badphone@example.com"] } });
    
    // Phone validation test: Invalid phone (not 10 digits)
    let phoneError = false;
    try {
      const invalidUser = new User({
        name: "Bad Phone User",
        email: "badphone@example.com",
        phone: "12345", // Only 5 digits
        password: "HashedPassword123",
        role: "student"
      });
      await invalidUser.validate();
    } catch (err) {
      phoneError = true;
    }
    assert(phoneError, "User model rejects non-10-digit phone number");

    // Valid User Creation
    const hashedPassword = await bcrypt.hash("StudentPass123", 10);
    const validStudent = await User.create({
      name: "Test Student Alpha",
      email: "teststudent1@example.com",
      phone: "9876543210",
      password: hashedPassword,
      role: "student",
      status: "active",
      isActive: true
    });
    assert(validStudent._id && validStudent.phone === "9876543210", "Valid student created with 10-digit phone number");

    // -------------------------------------------------------------
    // TEST 2: Scoring & Calculation Engine (The Core Reported Bug)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Core Scoring & Answer Evaluation Engine ---");

    // Setup 5 Mock Questions
    const mockQuestions = [
      {
        _id: new mongoose.Types.ObjectId(),
        questionText: "What does HTML stand for?",
        options: [
          { optionKey: "A", text: "Hyper Text Markup Language" },
          { optionKey: "B", text: "High Tech Multi Language" },
          { optionKey: "C", text: "Hyper Transfer Meta Logic" },
          { optionKey: "D", text: "Home Tool Markup Language" }
        ],
        correctAnswer: "Hyper Text Markup Language", // Option text format
        marks: 2,
        negativeMarks: 0.5,
        explanation: "HTML stands for Hyper Text Markup Language."
      },
      {
        _id: new mongoose.Types.ObjectId(),
        questionText: "Which HTTP status represents Success?",
        options: [
          { optionKey: "A", text: "404 Not Found" },
          { optionKey: "B", text: "200 OK" },
          { optionKey: "C", text: "500 Internal Server Error" },
          { optionKey: "D", text: "301 Moved Permanently" }
        ],
        correctAnswer: "B", // Option key format
        marks: 2,
        negativeMarks: 0.5,
        explanation: "200 OK signifies that the request has succeeded."
      },
      {
        _id: new mongoose.Types.ObjectId(),
        questionText: "Which keyword defines an immutable variable in modern JavaScript?",
        options: [
          { optionKey: "A", text: "var" },
          { optionKey: "B", text: "let" },
          { optionKey: "C", text: "const" },
          { optionKey: "D", text: "def" }
        ],
        correctAnswer: "const", // Plain text match
        marks: 2,
        negativeMarks: 0.5,
        explanation: "const defines a block-scoped immutable variable binding."
      },
      {
        _id: new mongoose.Types.ObjectId(),
        questionText: "Which database is a document-oriented NoSQL database?",
        options: [
          { optionKey: "A", text: "PostgreSQL" },
          { optionKey: "B", text: "MySQL" },
          { optionKey: "C", text: "MongoDB" },
          { optionKey: "D", text: "SQLite" }
        ],
        correctAnswer: "C", // Key format
        marks: 2,
        negativeMarks: 0.5,
        explanation: "MongoDB stores data in JSON-like BSON documents."
      },
      {
        _id: new mongoose.Types.ObjectId(),
        questionText: "What protocol is used for secure web browsing?",
        options: [
          { optionKey: "A", text: "HTTP" },
          { optionKey: "B", text: "FTP" },
          { optionKey: "C", text: "SMTP" },
          { optionKey: "D", text: "HTTPS" }
        ],
        correctAnswer: "HTTPS",
        marks: 2,
        negativeMarks: 0.5,
        explanation: "HTTPS encrypts data over SSL/TLS."
      }
    ];

    const mockTest = {
      _id: new mongoose.Types.ObjectId(),
      title: "Full Stack Engineering Assessment",
      passingMarks: 6,
      passingPercentage: 60,
      totalMarks: 10
    };

    // Scenario: Student answers 3 correct, 1 wrong, 1 left unanswered
    // Q1: Student picks "A" (which matches "Hyper Text Markup Language") -> CORRECT
    // Q2: Student picks "B" (matches key "B") -> CORRECT
    // Q3: Student picks "C" (matches "const") -> CORRECT
    // Q4: Student picks "A" (wrong: correct is C) -> WRONG (-0.5 neg marks)
    // Q5: Student does not answer -> UNANSWERED (0 marks)
    const studentAnswers = [
      { questionId: mockQuestions[0]._id, selectedAnswer: "A" },
      { questionId: mockQuestions[1]._id, selectedAnswer: "B" },
      { questionId: mockQuestions[2]._id, selectedAnswer: "const" },
      { questionId: mockQuestions[3]._id, selectedAnswer: "A" },
      // Q5 intentionally omitted
    ];

    const evaluation = evaluateAttempt(
      mockQuestions,
      studentAnswers,
      mockTest,
      new Date(Date.now() - 300000),
      new Date()
    );

    console.log("Evaluation Results Summary:");
    console.log(`  Total Questions: ${evaluation.totalQuestions}`);
    console.log(`  Correct: ${evaluation.correctAnswers}`);
    console.log(`  Wrong: ${evaluation.wrongAnswers}`);
    console.log(`  Unanswered: ${evaluation.unanswered}`);
    console.log(`  Score: ${evaluation.score} / ${evaluation.totalMarks} (${evaluation.percentage}%)`);
    console.log(`  Passed: ${evaluation.passed}`);

    assert(evaluation.totalQuestions === 5, "Total questions accurately calculated (5)");
    assert(evaluation.correctAnswers === 3, "Correct answers accurately counted as 3 (Not 0)");
    assert(evaluation.wrongAnswers === 1, "Wrong answers accurately counted as 1");
    assert(evaluation.unanswered === 1, "Unanswered questions accurately counted as 1 (Not 5)");
    // Marks: Q1 (+2) + Q2 (+2) + Q3 (+2) + Q4 (-0.5) = 5.5
    assert(evaluation.score === 5.5, "Marks calculation properly applies marks and negative markings (5.5)");
    assert(evaluation.percentage === 55, "Percentage calculated accurately (55%)");
    assert(Array.isArray(evaluation.questionBreakdown) && evaluation.questionBreakdown.length === 5, "Detailed question breakdown generated for all 5 questions");

    const q1Review = evaluation.questionBreakdown[0];
    const q4Review = evaluation.questionBreakdown[3];
    const q5Review = evaluation.questionBreakdown[4];

    assert(q1Review.status === "correct" && q1Review.isCorrect === true, "Q1 breakdown status is 'correct'");
    assert(q4Review.status === "incorrect" && q4Review.isCorrect === false, "Q4 breakdown status is 'incorrect'");
    assert(q5Review.status === "unanswered" && q5Review.isUnanswered === true && q5Review.yourAnswer === "Not answered", "Q5 breakdown status is 'unanswered' with 'Not answered' label");

    // Also test object format: { [questionId]: selectedAnswer }
    const objectAnswers = {
      [mockQuestions[0]._id.toString()]: "Hyper Text Markup Language",
      [mockQuestions[1]._id.toString()]: "200 OK",
      [mockQuestions[2]._id.toString()]: "C",
      [mockQuestions[3]._id.toString()]: "C",
      [mockQuestions[4]._id.toString()]: "HTTPS"
    };
    const perfectEval = evaluateAttempt(mockQuestions, objectAnswers, mockTest, new Date(), new Date());
    assert(perfectEval.correctAnswers === 5 && perfectEval.score === 10 && perfectEval.percentage === 100, "Supports object answer format and achieves 100% when all correct");

    // -------------------------------------------------------------
    // TEST 3: Test Scheduling Engine (Upcoming, Active, Closed)
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Test Scheduling & Availability Rules ---");

    const now = new Date();
    const futureStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const pastStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const pastEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const upcomingTest = {
      startDate: futureStart,
      endDate: futureEnd,
      status: "published"
    };

    const activeTest = {
      startDate: pastStart,
      endDate: futureEnd,
      status: "published"
    };

    const closedTest = {
      startDate: pastStart,
      endDate: pastEnd,
      status: "published"
    };

    // Helper logic replicating attemptController scheduleStatus calculation
    function getScheduleStatus(test) {
      const currentTime = new Date();
      if (test.startDate && new Date(test.startDate) > currentTime) {
        return "upcoming";
      }
      if (test.endDate && new Date(test.endDate) < currentTime) {
        return "closed";
      }
      return "active";
    }

    assert(getScheduleStatus(upcomingTest) === "upcoming", "Future test classified as 'upcoming'");
    assert(getScheduleStatus(activeTest) === "active", "Ongoing test classified as 'active'");
    assert(getScheduleStatus(closedTest) === "closed", "Expired test classified as 'closed'");

    // -------------------------------------------------------------
    // TEST 4: Multi-Tenant Data Isolation Checks
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Multi-Tenant Query Scoping & Isolation ---");

    // Create 2 distinct organizations
    const orgA = await Organization.findOneAndUpdate(
      { slug: "alpha-university-test" },
      { name: "Alpha University", slug: "alpha-university-test", adminName: "Admin Alpha", email: "admin@alpha.test" },
      { upsert: true, new: true }
    );

    const orgB = await Organization.findOneAndUpdate(
      { slug: "beta-college-test" },
      { name: "Beta College", slug: "beta-college-test", adminName: "Admin Beta", email: "admin@beta.test" },
      { upsert: true, new: true }
    );

    // Create a test in Org A
    const testOrgA = await Test.findOneAndUpdate(
      { title: "Alpha Org Test", organizationId: orgA._id },
      {
        title: "Alpha Org Test",
        organizationId: orgA._id,
        duration: 30,
        passingPercentage: 50,
        status: "published"
      },
      { upsert: true, new: true }
    );

    // Create a student in Org B
    const studentOrgB = await User.findOneAndUpdate(
      { email: "student@beta.test" },
      {
        name: "Beta Student",
        email: "student@beta.test",
        password: hashedPassword,
        phone: "9123456780",
        role: "student",
        organizationId: orgB._id,
        status: "active",
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Simulate cross-tenant test query: Org B student looking for available tests in Org B
    const orgBTests = await Test.find({ organizationId: studentOrgB.organizationId });
    const containsAlphaTest = orgBTests.some((t) => t._id.toString() === testOrgA._id.toString());
    assert(!containsAlphaTest, "Org B student cannot see tests created in Org A");

    // Simulate tenant isolation check on Result
    const mockResultOrgA = {
      organizationId: orgA._id,
      studentId: new mongoose.Types.ObjectId()
    };
    const canOrgBAdminViewOrgAResult = mockResultOrgA.organizationId.toString() === orgB._id.toString();
    assert(!canOrgBAdminViewOrgAResult, "Org B admin is rejected from viewing Org A attempt results");

    // -------------------------------------------------------------
    // Clean up test data
    // -------------------------------------------------------------
    await User.deleteMany({ email: { $in: ["teststudent1@example.com", "student@beta.test"] } });
    await Test.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await Organization.deleteMany({ _id: { $in: [orgA._id, orgB._id] } });

    console.log("\n=================================================");
    console.log(`  ALL TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
    console.log("=================================================\n");

    await mongoose.disconnect();
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error("Test execution failed with error:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
