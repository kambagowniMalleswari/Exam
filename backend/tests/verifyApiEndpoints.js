import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import app from "../server.js";
import User from "../models/User.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import Result from "../models/Result.js";
import Organization from "../models/Organization.js";

dotenv.config();

const TEST_PORT = 5099;

async function runApiIntegrationTests() {
  console.log("=================================================");
  console.log("  ASSESSIQ HTTP REST API INTEGRATION SUITE       ");
  console.log("=================================================\n");

  // Spin up an ephemeral HTTP server for tests
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://127.0.0.1:${TEST_PORT}/api`;
  console.log(` Test server listening at ${baseUrl}`);

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    // -----------------------------------------------------------------
    // 1. REGISTRATION VALIDATION TESTS
    // -----------------------------------------------------------------
    console.log("\n--- STEP 1: Registration Validation Tests ---");

    // Invalid phone (<10 digits)
    const badPhoneRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Doe",
        email: "johndoe@test.com",
        phone: "12345",
        password: "Password123"
      })
    });
    const badPhoneData = await badPhoneRes.json();
    assert(badPhoneRes.status === 400 && badPhoneData.message.includes("10 digits"), "Rejects phone number with fewer than 10 digits");

    // Password without uppercase
    const badPassRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Doe",
        email: "johndoe@test.com",
        phone: "9876543210",
        password: "password123"
      })
    });
    const badPassData = await badPassRes.json();
    assert(badPassRes.status === 400 && badPassData.message.includes("uppercase"), "Rejects password without uppercase letter");

    // Password without lowercase
    const badPass2Res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Doe",
        email: "johndoe@test.com",
        phone: "9876543210",
        password: "PASSWORD123"
      })
    });
    const badPass2Data = await badPass2Res.json();
    assert(badPass2Res.status === 400 && badPass2Data.message.includes("lowercase"), "Rejects password without lowercase letter");

    // Valid Registration for an Org Admin & Organization
    await User.deleteMany({ email: { $in: ["orgadmin@assessiq.test", "student1@assessiq.test"] } });
    await Organization.deleteMany({ name: "AssessIQ University" });

    const validAdminRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Professor Xavier",
        email: "orgadmin@assessiq.test",
        phone: "9876543210",
        password: "AdminPassword123",
        role: "org_admin",
        organizationName: "AssessIQ University",
        organizationType: "University"
      })
    });
    const validAdminData = await validAdminRes.json();
    assert(validAdminRes.status === 201 && validAdminData.token, "Org admin registers successfully with JWT token");
    const adminToken = validAdminData.token;
    const orgId = validAdminData.user.organizationId;

    // Valid Registration for a Student joining the organization
    const validStudentRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Peter Parker",
        email: "student1@assessiq.test",
        phone: "9876543211",
        password: "StudentPass123",
        role: "student",
        organizationId: orgId
      })
    });
    const validStudentData = await validStudentRes.json();
    assert(validStudentRes.status === 201 && validStudentData.token, "Student registers successfully with JWT token");
    const studentToken = validStudentData.token;

    // -----------------------------------------------------------------
    // 2. LOGIN VALIDATION TESTS
    // -----------------------------------------------------------------
    console.log("\n--- STEP 2: Login Endpoint Security Tests ---");

    // Invalid credentials
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "student1@assessiq.test",
        password: "WrongPassword123"
      })
    });
    const badLoginData = await badLoginRes.json();
    assert(badLoginRes.status === 401 && badLoginData.message === "Invalid email or password.", "Generic 401 error message returned on bad credentials");

    // Successful login
    const goodLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "student1@assessiq.test",
        password: "StudentPass123"
      })
    });
    const goodLoginData = await goodLoginRes.json();
    assert(goodLoginRes.status === 200 && goodLoginData.token, "Login succeeds with 200 and provides token");

    // -----------------------------------------------------------------
    // 3. TEST CREATION & SCHEDULING VALIDATION
    // -----------------------------------------------------------------
    console.log("\n--- STEP 3: Test Creation & Schedule Validation ---");

    // Short title (<3)
    const shortTitleRes = await fetch(`${baseUrl}/tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: "AB",
        duration: 30,
        passingPercentage: 50
      })
    });
    assert(shortTitleRes.status === 400, "Rejects test creation with title under 3 characters");

    // Invalid duration (<=0)
    const badDurationRes = await fetch(`${baseUrl}/tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: "Valid Title Here",
        duration: 0,
        passingPercentage: 50
      })
    });
    assert(badDurationRes.status === 400, "Rejects test creation with duration <= 0");

    // End date earlier than start date
    const badDatesRes = await fetch(`${baseUrl}/tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: "Engineering Finals",
        duration: 30,
        passingPercentage: 50,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() - 86400000).toISOString()
      })
    });
    assert(badDatesRes.status === 400, "Rejects test creation when end date is before start date");

    // Valid active test creation
    const createTestRes = await fetch(`${baseUrl}/tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: "Web Architecture Midterm",
        description: "Official assessment of Web and Systems concepts",
        subject: "Computer Science",
        duration: 45,
        passingPercentage: 50,
        startDate: new Date(Date.now() - 3600000).toISOString(), // started 1 hour ago
        endDate: new Date(Date.now() + 86400000).toISOString(),   // ends tomorrow
        status: "published",
        isPublished: true,
        allowedAttempts: 3
      })
    });
    const createTestData = await createTestRes.json();
    assert(createTestRes.status === 201 && createTestData.test?._id, "Creates valid scheduled test successfully");
    const testId = createTestData.test._id;

    // Add 5 Questions to Test
    const qData = [
      {
        questionText: "What protocol is used for encrypted web traffic?",
        options: [
          { optionKey: "A", text: "HTTP" },
          { optionKey: "B", text: "HTTPS" },
          { optionKey: "C", text: "FTP" },
          { optionKey: "D", text: "SSH" }
        ],
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0,
        explanation: "HTTPS secures communication over TLS/SSL."
      },
      {
        questionText: "Which HTTP status code indicates 'Not Found'?",
        options: [
          { optionKey: "A", text: "200" },
          { optionKey: "B", text: "301" },
          { optionKey: "C", text: "404" },
          { optionKey: "D", text: "500" }
        ],
        correctAnswer: "404",
        marks: 2,
        negativeMarks: 0,
        explanation: "404 signifies that the resource was not found on the server."
      },
      {
        questionText: "Which data format is native to MongoDB documents?",
        options: [
          { optionKey: "A", text: "XML" },
          { optionKey: "B", text: "BSON / JSON" },
          { optionKey: "C", text: "CSV" },
          { optionKey: "D", text: "YAML" }
        ],
        correctAnswer: "BSON / JSON",
        marks: 2,
        negativeMarks: 0,
        explanation: "MongoDB stores data internally as BSON."
      },
      {
        questionText: "Which keyword in JavaScript declares a block-scoped variable?",
        options: [
          { optionKey: "A", text: "var" },
          { optionKey: "B", text: "let" },
          { optionKey: "C", text: "function" },
          { optionKey: "D", text: "define" }
        ],
        correctAnswer: "B",
        marks: 2,
        negativeMarks: 0,
        explanation: "let allows you to declare variables that are limited to the scope of a block statement."
      },
      {
        questionText: "Which layer of the OSI model does IP address routing operate at?",
        options: [
          { optionKey: "A", text: "Data Link (Layer 2)" },
          { optionKey: "B", text: "Network (Layer 3)" },
          { optionKey: "C", text: "Transport (Layer 4)" },
          { optionKey: "D", text: "Application (Layer 7)" }
        ],
        correctAnswer: "Network (Layer 3)",
        marks: 2,
        negativeMarks: 0,
        explanation: "IP routing operates at Layer 3 (Network Layer)."
      }
    ];

    const questionsCreated = [];
    for (const q of qData) {
      const qRes = await fetch(`${baseUrl}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ ...q, testId })
      });
      const qJson = await qRes.json();
      questionsCreated.push(qJson.question);
    }
    assert(questionsCreated.length === 5, "5 questions successfully attached to the test");

    // -----------------------------------------------------------------
    // 4. STUDENT ATTEMPT, BACKGROUND SAVE & FINAL SUBMISSION FLOW
    // -----------------------------------------------------------------
    console.log("\n--- STEP 4: Student Attempt Flow & Result Evaluation ---");

    // Student starts attempt
    const startRes = await fetch(`${baseUrl}/attempts/${testId}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      }
    });
    const startData = await startRes.json();
    assert(startRes.status === 201 && startData.attempt?._id, "Student successfully starts test attempt");
    const attemptId = startData.attempt._id;

    // Student answers:
    // Q1: Option "B" -> Correct (+2)
    // Q2: Option text "404" -> Correct (+2)
    // Q3: Option key "B" (matches BSON / JSON) -> Correct (+2)
    // Q4: Option key "A" ('var') -> Incorrect (0)
    // Q5: Unanswered (skipped) -> Unanswered (0)
    // Total marks = 10, marks obtained = 6 (60%)

    // Simulate real-time background answer saving (PATCH /attempts/:id/answer)
    const patchAnswerRes = await fetch(`${baseUrl}/attempts/${attemptId}/answer`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        questionId: questionsCreated[0]._id,
        selectedAnswer: "B"
      })
    });
    assert(patchAnswerRes.status === 200, "Real-time background answer save endpoint functions properly");

    // Final Submit with all student answers
    const studentSubmission = [
      { questionId: questionsCreated[0]._id, selectedAnswer: "B" },
      { questionId: questionsCreated[1]._id, selectedAnswer: "404" },
      { questionId: questionsCreated[2]._id, selectedAnswer: "B" },
      { questionId: questionsCreated[3]._id, selectedAnswer: "A" }
      // Q5 left unanswered
    ];

    const submitRes = await fetch(`${baseUrl}/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ answers: studentSubmission })
    });
    const submitData = await submitRes.json();

    assert(submitRes.status === 200 && submitData.success, "Attempt submitted successfully");
    const evaluatedResult = submitData.result;

    console.log("Evaluation Output from Live API Submit:");
    console.log(`  Total Questions: ${evaluatedResult.totalQuestions}`);
    console.log(`  Correct: ${evaluatedResult.correctAnswers}`);
    console.log(`  Incorrect: ${evaluatedResult.wrongAnswers}`);
    console.log(`  Unanswered: ${evaluatedResult.unanswered}`);
    console.log(`  Score: ${evaluatedResult.score} / ${evaluatedResult.totalMarks} (${evaluatedResult.percentage}%)`);
    console.log(`  Passed: ${evaluatedResult.passed}`);

    assert(evaluatedResult.totalQuestions === 5, "API evaluated total questions: 5");
    assert(evaluatedResult.correctAnswers === 3, "API evaluated correct answers: 3 (Fixed: not 0)");
    assert(evaluatedResult.wrongAnswers === 1, "API evaluated wrong answers: 1");
    assert(evaluatedResult.unanswered === 1, "API evaluated unanswered questions: 1 (Fixed: not 5)");
    assert(evaluatedResult.score === 6, "API evaluated score: 6 out of 10 marks");
    assert(evaluatedResult.percentage === 60, "API evaluated percentage: 60%");
    assert(evaluatedResult.passed === true, "API evaluated passed status: true (>= 50% passing threshold)");

    // -----------------------------------------------------------------
    // 5. ATTEMPT RESULT RETRIEVAL & QUESTION BREAKDOWN
    // -----------------------------------------------------------------
    console.log("\n--- STEP 5: Attempt Result Retrieval & Question Review Breakdown ---");

    const getResultRes = await fetch(`${baseUrl}/results/attempt/${attemptId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const getResultData = await getResultRes.json();
    assert(getResultRes.status === 200 && getResultData.result, "Retrieved attempt result via GET /results/attempt/:id");

    const breakdown = getResultData.result.questionBreakdown;
    assert(Array.isArray(breakdown) && breakdown.length === 5, "Question review breakdown contains all 5 questions");

    const bq1 = breakdown.find((b) => b.questionId.toString() === questionsCreated[0]._id.toString());
    const bq4 = breakdown.find((b) => b.questionId.toString() === questionsCreated[3]._id.toString());
    const bq5 = breakdown.find((b) => b.questionId.toString() === questionsCreated[4]._id.toString());

    assert(bq1.status === "correct" && bq1.isCorrect === true && bq1.marksAwarded === 2, "Review for Q1 shows status 'correct' and 2 marks awarded");
    assert(bq4.status === "incorrect" && bq4.isCorrect === false && bq4.marksAwarded === 0, "Review for Q4 shows status 'incorrect' and 0 marks awarded");
    assert(bq5.status === "unanswered" && bq5.isUnanswered === true && bq5.yourAnswer === "Not answered", "Review for Q5 shows status 'unanswered' with 'Not answered' text");

    // Clean up
    await Question.deleteMany({ testId });
    await Result.deleteMany({ attemptId });
    await Attempt.deleteMany({ _id: attemptId });
    await Test.deleteMany({ _id: testId });
    await User.deleteMany({ email: { $in: ["orgadmin@assessiq.test", "student1@assessiq.test"] } });
    await Organization.deleteMany({ _id: orgId });

    console.log("\n=================================================");
    console.log(`  ALL REST API TESTS COMPLETED: ${passed}/${total} PASSED`);
    console.log("=================================================\n");

    server.close();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error("API Integration test error:", err);
    server.close();
    process.exit(1);
  }
}

runApiIntegrationTests();
