// Comprehensive Backend API & CRUD Verification Test
import http from "http";
import app from "../server.js";

const PORT = 5099;

const runTests = async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  const BASE_URL = `http://localhost:${PORT}/api`;
  console.log(`Test server running on port ${PORT}...`);

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, testName, extra = "") => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${testName}`);
    } else {
      console.error(`  ✗ FAIL: ${testName} ${extra}`);
      throw new Error(`Assertion failed: ${testName} ${extra}`);
    }
  };

  try {
    console.log("\n--- TEST GROUP 1: Health & Authentication ---");
    // 1. Root health check
    const rootRes = await fetch(`http://localhost:${PORT}/`);
    const rootData = await rootRes.json();
    assert(rootRes.status === 200 && rootData.success, "Root API Health Check");

    // 2. Login Super Admin
    const superAdminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "superadmin@example.com", password: "superadmin123" })
    });
    const superAdminData = await superAdminRes.json();
    assert(superAdminRes.status === 200 && superAdminData.token, "Super Admin Login");
    const superAdminToken = superAdminData.token;

    // 3. Login Org Admin
    const orgAdminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@apexuniv.edu", password: "password123" })
    });
    const orgAdminData = await orgAdminRes.json();
    assert(orgAdminRes.status === 200 && orgAdminData.token, "Org Admin Login");
    const orgAdminToken = orgAdminData.token;
    const orgId = orgAdminData.user.organizationId;

    // 4. Login Student
    const studentRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex@apexuniv.edu", password: "password123" })
    });
    const studentData = await studentRes.json();
    assert(studentRes.status === 200 && studentData.token, "Student Login");
    const studentToken = studentData.token;

    // 5. Login Test Creator
    const creatorRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "creator@example.com", password: "password123" })
    });
    const creatorData = await creatorRes.json();
    assert(creatorRes.status === 200 && creatorData.token, "Test Creator Login");
    const creatorToken = creatorData.token;

    // 6. Get Profile
    const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200 && profileData.user.email === "alex@apexuniv.edu", "Get Profile (/auth/profile)");

    console.log("\n--- TEST GROUP 2: Organizations & Multi-Tenancy ---");
    // 7. Super Admin lists organizations
    const orgsRes = await fetch(`${BASE_URL}/organizations`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const orgsData = await orgsRes.json();
    assert(orgsRes.status === 200 && orgsData.organizations.length >= 1, "Super Admin List Organizations");

    // 8. Public list of active organizations
    const publicOrgsRes = await fetch(`${BASE_URL}/organizations/public`);
    const publicOrgsData = await publicOrgsRes.json();
    assert(publicOrgsRes.status === 200 && publicOrgsData.organizations.length >= 1, "Public Organizations List");

    // 9. Cross-tenant check: Student cannot access Super Admin organization routes
    const forbiddenOrgRes = await fetch(`${BASE_URL}/organizations`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(forbiddenOrgRes.status === 403, "Student Blocked from Org Admin Routes (403 Forbidden)");

    console.log("\n--- TEST GROUP 3: Users Management ---");
    // 10. Org Admin lists students
    const studentsRes = await fetch(`${BASE_URL}/users/students`, {
      headers: { Authorization: `Bearer ${orgAdminToken}` }
    });
    const studentsData = await studentsRes.json();
    assert(studentsRes.status === 200 && studentsData.students.length >= 2, "Org Admin List Students");

    // 11. Org Admin creates student
    const newStudentRes = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orgAdminToken}`
      },
      body: JSON.stringify({
        name: "Lucas Scott",
        email: `lucas_${Date.now()}@apexuniv.edu`,
        password: "password123",
        role: "student",
        phone: "9876599999"
      })
    });
    const newStudentData = await newStudentRes.json();
    assert(newStudentRes.status === 201 && newStudentData.user.name === "Lucas Scott", "Create Student inside Organization");

    console.log("\n--- TEST GROUP 4: Tests & Question Management ---");
    // 12. Public tests list
    const publicTestsRes = await fetch(`${BASE_URL}/tests/public`);
    const publicTestsData = await publicTestsRes.json();
    assert(publicTestsRes.status === 200 && publicTestsData.tests.length >= 1, "Public Test Catalog");

    // 13. Create Test by Creator
    const createTestRes = await fetch(`${BASE_URL}/tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creatorToken}`
      },
      body: JSON.stringify({
        title: "Creator Custom Test",
        description: "Created independently by test creator",
        subject: "Algorithms",
        duration: 20,
        passingPercentage: 60,
        type: "public"
      })
    });
    const createTestData = await createTestRes.json();
    assert(createTestRes.status === 201 && createTestData.test.title === "Creator Custom Test", "Create Test (Creator)");
    const createdTestId = createTestData.test._id;

    // 14. Add Question to Test
    const addQuestionRes = await fetch(`${BASE_URL}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creatorToken}`
      },
      body: JSON.stringify({
        testId: createdTestId,
        questionText: "What is the time complexity of binary search?",
        options: [
          { key: "A", text: "O(n)" },
          { key: "B", text: "O(log n)" },
          { key: "C", text: "O(n^2)" },
          { key: "D", text: "O(1)" }
        ],
        correctAnswer: "O(log n)",
        marks: 10,
        negativeMarks: 2
      })
    });
    const addQuestionData = await addQuestionRes.json();
    assert(addQuestionRes.status === 201 && addQuestionData.question.marks === 10, "Add Question to Test");

    // 15. Publish Test
    const publishRes = await fetch(`${BASE_URL}/tests/${createdTestId}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creatorToken}` }
    });
    const publishData = await publishRes.json();
    assert(publishRes.status === 200 && publishData.test.status === "published", "Publish Test with Validation");

    // 16. Duplicate Test
    const duplicateRes = await fetch(`${BASE_URL}/tests/${createdTestId}/duplicate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creatorToken}` }
    });
    const duplicateData = await duplicateRes.json();
    assert(duplicateRes.status === 201 && duplicateData.test.status === "draft", "Duplicate Test as Draft");

    // 17. Verify Student questions do NOT expose correctAnswer
    const studentQRes = await fetch(`${BASE_URL}/questions/test/${createdTestId}/student`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentQData = await studentQRes.json();
    assert(
      studentQRes.status === 200 &&
      studentQData.questions[0].correctAnswer === undefined,
      "Security: Question correct answer is hidden from student"
    );

    console.log("\n--- TEST GROUP 5: Student Attempt Flow & Automatic Evaluation ---");
    // 18. Available tests for student
    const availRes = await fetch(`${BASE_URL}/attempts/available-tests`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const availData = await availRes.json();
    assert(availRes.status === 200 && availData.tests.length >= 2, "Get Available Tests for Student");

    // 19. Start Attempt
    const startAttemptRes = await fetch(`${BASE_URL}/attempts/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ testId: createdTestId })
    });
    const startAttemptData = await startAttemptRes.json();
    assert(startAttemptRes.status === 201 || startAttemptRes.status === 200, "Start Test Attempt");
    const attemptId = startAttemptData.attempt._id;

    // 20. Save Answer
    const qId = studentQData.questions[0]._id;
    const saveAnsRes = await fetch(`${BASE_URL}/attempts/${attemptId}/answer`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ questionId: qId, selectedAnswer: "O(log n)", isFlagged: false })
    });
    const saveAnsData = await saveAnsRes.json();
    assert(saveAnsRes.status === 200 && saveAnsData.attempt.answers.length >= 1, "Save Student Answer");

    // 21. Submit Attempt & Verify Automatic Server-side Evaluation
    const submitRes = await fetch(`${BASE_URL}/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const submitData = await submitRes.json();
    assert(
      submitRes.status === 200 &&
      submitData.result &&
      submitData.result.score === 10 &&
      submitData.result.passed === true,
      "Submit Attempt & Server-Side Automatic Evaluation (10/10 marks, Passed)"
    );

    // 22. Get My Results
    const myResultsRes = await fetch(`${BASE_URL}/results/my-results`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const myResultsData = await myResultsRes.json();
    assert(myResultsRes.status === 200 && myResultsData.results.length >= 1, "Student View My Results");

    console.log("\n--- TEST GROUP 6: Reports & Subscriptions ---");
    // 23. Organization Report
    const orgReportRes = await fetch(`${BASE_URL}/reports/organization?organizationId=${orgId}`, {
      headers: { Authorization: `Bearer ${orgAdminToken}` }
    });
    const orgReportData = await orgReportRes.json();
    assert(
      orgReportRes.status === 200 &&
      orgReportData.report.totalStudents >= 2 &&
      orgReportData.report.totalAttempts >= 1,
      "Organization Analytics & Reports"
    );

    // 24. Super Admin Platform Report
    const platformReportRes = await fetch(`${BASE_URL}/reports/platform`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const platformReportData = await platformReportRes.json();
    assert(
      platformReportRes.status === 200 &&
      platformReportData.report.totalOrganizations >= 1,
      "Platform Global Report (Super Admin)"
    );

    // 25. Subscription Usage & Limits
    const subRes = await fetch(`${BASE_URL}/subscriptions/current`, {
      headers: { Authorization: `Bearer ${orgAdminToken}` }
    });
    const subData = await subRes.json();
    assert(
      subRes.status === 200 &&
      subData.subscription &&
      subData.usage.testsLimit > 0,
      "Subscription Plan & Usage Limits"
    );

    console.log(`\n========================================`);
    console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} assertions passed)`);
    console.log(`========================================\n`);

    server.close();
    process.exit(0);
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    server.close();
    process.exit(1);
  }
};

runTests();
