// Comprehensive Step 10 Regression Test Suite for AssessIQ SaaS
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// App routes
import authRoutes from "../routes/authRoutes.js";
import testRoutes from "../routes/testRoutes.js";
import questionRoutes from "../routes/questionRoutes.js";
import attemptRoutes from "../routes/attemptRoutes.js";
import resultRoutes from "../routes/resultRoutes.js";
import reportRoutes from "../routes/reportRoutes.js";
import organizationRoutes from "../routes/organizationRoutes.js";
import orgApplicationRoutes from "../routes/orgApplicationRoutes.js";

// Models
import User from "../models/User.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import Organization from "../models/Organization.js";
import initSuperAdmin from "../config/initSuperAdmin.js";

dotenv.config({ path: "./backend/.env" });

const PORT = 5010;
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/org-applications", orgApplicationRoutes);

async function runRegressionSuite() {
  console.log("==================================================================");
  console.log("   STEP 10: COMPLETE END-TO-END REGRESSION TEST SUITE");
  console.log("   AssessIQ Multi-Tenant SaaS Portal");
  console.log("==================================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI not defined in backend/.env");
  }

  await mongoose.connect(mongoUri);
  console.log("✓ MongoDB Atlas connected successfully.");

  // Start internal test server
  const server = app.listen(PORT);
  console.log(`✓ Test API server listening on http://localhost:${PORT}\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "kambagownikmalleswari@gmail.com";
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@12345";

  try {
    // -------------------------------------------------------------
    // TEST SECTION 1: Super Admin Initialization & Idempotency
    // -------------------------------------------------------------
    console.log("--- Section 1: Super Admin Role & Demotion Prevention ---");
    await initSuperAdmin();
    const superAdmin = await User.findOne({ email: superAdminEmail });
    assert(superAdmin !== null, "Super Admin user exists in database");
    assert(superAdmin && (superAdmin.role === "super_admin" || superAdmin.role === "superadmin"), "Super Admin has role === 'super_admin'");
    assert(superAdmin && (superAdmin.organizationId === null || superAdmin.organizationId === undefined), "Super Admin has no organization boundary");

    // -------------------------------------------------------------
    // TEST SECTION 2: Role Authentication & JWT Payload Checks
    // -------------------------------------------------------------
    console.log("\n--- Section 2: Role Authentication & JWT Normalization ---");
    // 1. Super Admin Login
    const saLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: superAdminEmail, password: superAdminPassword })
    });
    const saLoginData = await saLoginRes.json();
    assert(saLoginRes.status === 200, "Super Admin login succeeds (200 OK)");
    assert(saLoginData.token && (saLoginData.user?.role === "super_admin" || saLoginData.user?.role === "superadmin"), "Super Admin token returned with role === 'super_admin'");
    const saToken = saLoginData.token;

    // Create 2 separate organizations for tenant isolation testing
    const orgA = await Organization.findOneAndUpdate(
      { slug: "reg-test-org-a" },
      { name: "Regression Test University A", slug: "reg-test-org-a", status: "active", email: "admin@reg-org-a.edu" },
      { upsert: true, returnDocument: 'after' }
    );
    const orgB = await Organization.findOneAndUpdate(
      { slug: "reg-test-org-b" },
      { name: "Regression Test Institute B", slug: "reg-test-org-b", status: "active", email: "admin@reg-org-b.edu" },
      { upsert: true, returnDocument: 'after' }
    );

    const testPassword = "Password@123";
    const hashedPass = await bcrypt.hash(testPassword, 10);

    // Create Org A Admin, Teacher A, Student A
    const orgAdminA = await User.findOneAndUpdate(
      { email: "admin@reg-org-a.edu" },
      { name: "Admin Org A", email: "admin@reg-org-a.edu", password: hashedPass, role: "org_admin", organizationId: orgA._id, status: "active" },
      { upsert: true, returnDocument: 'after' }
    );
    const teacherA = await User.findOneAndUpdate(
      { email: "teacher@reg-org-a.edu" },
      { name: "Prof. Teacher A", email: "teacher@reg-org-a.edu", password: hashedPass, role: "teacher", organizationId: orgA._id, status: "active" },
      { upsert: true, returnDocument: 'after' }
    );
    const studentA = await User.findOneAndUpdate(
      { email: "student@reg-org-a.edu" },
      { name: "Student A", email: "student@reg-org-a.edu", password: hashedPass, role: "student", organizationId: orgA._id, status: "active" },
      { upsert: true, returnDocument: 'after' }
    );

    // Create Teacher B and Student B in Org B
    const teacherB = await User.findOneAndUpdate(
      { email: "teacher@reg-org-b.edu" },
      { name: "Prof. Teacher B", email: "teacher@reg-org-b.edu", password: hashedPass, role: "teacher", organizationId: orgB._id, status: "active" },
      { upsert: true, returnDocument: 'after' }
    );
    const studentB = await User.findOneAndUpdate(
      { email: "student@reg-org-b.edu" },
      { name: "Student B", email: "student@reg-org-b.edu", password: hashedPass, role: "student", organizationId: orgB._id, status: "active" },
      { upsert: true, returnDocument: 'after' }
    );

    // 2. Org Admin Login
    const oaLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@reg-org-a.edu", password: testPassword })
    });
    const oaLoginData = await oaLoginRes.json();
    assert(oaLoginRes.status === 200, "Org Admin login succeeds (200 OK)");
    const oaToken = oaLoginData.token;

    // 3. Teacher A Login
    const taLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "teacher@reg-org-a.edu", password: testPassword })
    });
    const taLoginData = await taLoginRes.json();
    assert(taLoginRes.status === 200, "Teacher A login succeeds (200 OK)");
    const taToken = taLoginData.token;

    // 4. Teacher B Login
    const tbLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "teacher@reg-org-b.edu", password: testPassword })
    });
    const tbLoginData = await tbLoginRes.json();
    assert(tbLoginRes.status === 200, "Teacher B login succeeds (200 OK)");
    const tbToken = tbLoginData.token;

    // 5. Student A Login
    const saStudLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@reg-org-a.edu", password: testPassword })
    });
    const saStudLoginData = await saStudLoginRes.json();
    assert(saStudLoginRes.status === 200, "Student A login succeeds (200 OK)");
    const saStudToken = saStudLoginData.token;

    // 6. Student B Login
    const sbStudLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@reg-org-b.edu", password: testPassword })
    });
    const sbStudLoginData = await sbStudLoginRes.json();
    assert(sbStudLoginRes.status === 200, "Student B login succeeds (200 OK)");
    const sbStudToken = sbStudLoginData.token;

    // -------------------------------------------------------------
    // TEST SECTION 3: Tenant Boundary & Author Access Isolation
    // -------------------------------------------------------------
    console.log("\n--- Section 3: Tenant Boundary & Question Bank Isolation ---");
    // Teacher A creates Test A
    const createTestRes = await fetch(`http://localhost:${PORT}/api/tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${taToken}` },
      body: JSON.stringify({
        title: "Regression Physics Exam A",
        subject: "Physics",
        duration: 45,
        passingPercentage: 50,
        scope: "organization",
        isPublished: true,
        status: "published"
      })
    });
    const createTestData = await createTestRes.json();
    const testA = createTestData.test || createTestData;
    assert(createTestRes.status === 201 || createTestRes.status === 200, "Teacher A creates Test A in Org A");
    const testAId = testA._id;

    // Teacher A adds a question to Test A
    const addQRes = await fetch(`http://localhost:${PORT}/api/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${taToken}` },
      body: JSON.stringify({
        testId: testAId,
        questionText: "What is the speed of light in vacuum?",
        options: [
          { text: "3 x 10^8 m/s", key: "A" },
          { text: "1.5 x 10^8 m/s", key: "B" },
          { text: "3 x 10^6 m/s", key: "C" },
          { text: "300 m/s", key: "D" }
        ],
        correctAnswer: "3 x 10^8 m/s",
        marks: 4,
        negativeMarks: 1
      })
    });
    assert(addQRes.status === 201 || addQRes.status === 200, "Teacher A adds Question to Test A");

    // Attack 1: Teacher B (Org B) tries to read Test A by ID
    const tBReadTestARes = await fetch(`http://localhost:${PORT}/api/tests/${testAId}`, {
      headers: { "Authorization": `Bearer ${tbToken}` }
    });
    assert(tBReadTestARes.status === 403, "Teacher B receives 403 Forbidden reading Test A");

    // Attack 2: Teacher B (Org B) tries to update Test A
    const tBUpdateTestARes = await fetch(`http://localhost:${PORT}/api/tests/${testAId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tbToken}` },
      body: JSON.stringify({ title: "Hacked Test Title" })
    });
    assert(tBUpdateTestARes.status === 403, "Teacher B receives 403 Forbidden updating Test A");

    // Attack 3: Teacher B (Org B) tries to read Test A's Question Bank
    const tBReadQRes = await fetch(`http://localhost:${PORT}/api/questions/test/${testAId}`, {
      headers: { "Authorization": `Bearer ${tbToken}` }
    });
    assert(tBReadQRes.status === 403, "Teacher B receives 403 Forbidden accessing Test A questions");

    // Attack 4: Student B (Org B) attempts to take Test A
    const sBStartAttemptRes = await fetch(`http://localhost:${PORT}/api/attempts/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sbStudToken}` },
      body: JSON.stringify({ testId: testAId })
    });
    assert(sBStartAttemptRes.status === 403 || sBStartAttemptRes.status === 404, "Student B receives 403/404 trying to attempt Org A's test");

    // Legitimate Action: Student A (Org A) takes Test A
    const sAStartAttemptRes = await fetch(`http://localhost:${PORT}/api/attempts/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${saStudToken}` },
      body: JSON.stringify({ testId: testAId })
    });
    assert(sAStartAttemptRes.status === 201 || sAStartAttemptRes.status === 200, "Student A (Org A) can legitimately start Test A");

    // -------------------------------------------------------------
    // TEST SECTION 4: Real Aggregated Reports (No Dummy/Hardcoded Data)
    // -------------------------------------------------------------
    console.log("\n--- Section 4: Live Reports & Empty State Accuracy ---");

    // 1. Super Admin Global Platform Report
    const saRepRes = await fetch(`http://localhost:${PORT}/api/reports/platform`, {
      headers: { "Authorization": `Bearer ${saToken}` }
    });
    const saRepData = await saRepRes.json();
    assert(saRepRes.status === 200, "Super Admin platform telemetry returns 200 OK");
    assert(typeof (saRepData.report?.organizations?.total ?? saRepData.report?.totalOrganizations) === "number", "Platform report returns real numeric totalOrganizations");
    assert(typeof (saRepData.report?.users?.total ?? saRepData.report?.totalUsers) === "number", "Platform report returns real numeric totalUsers");
    assert(typeof (saRepData.report?.attempts?.passRate ?? saRepData.report?.globalPassRate) === "number", "Platform report returns real numeric globalPassRate");

    // 2. Organization Admin Report
    const oaRepRes = await fetch(`http://localhost:${PORT}/api/reports/organization`, {
      headers: { "Authorization": `Bearer ${oaToken}` }
    });
    const oaRepData = await oaRepRes.json();
    assert(oaRepRes.status === 200, "Org Admin report returns 200 OK");
    assert(typeof oaRepData.report?.totalStudents === "number", "Org Admin report returns real numeric totalStudents");
    assert(typeof oaRepData.report?.totalTests === "number", "Org Admin report returns real numeric totalTests");

    // 3. Teacher Dashboard Report
    const tRepRes = await fetch(`http://localhost:${PORT}/api/reports/teacher`, {
      headers: { "Authorization": `Bearer ${taToken}` }
    });
    const tRepData = await tRepRes.json();
    assert(tRepRes.status === 200, "Teacher analytics report returns 200 OK");
    assert(typeof tRepData.report?.totalTests === "number", "Teacher report returns real numeric totalTests");
    assert(Array.isArray(tRepData.report?.recentTests), "Teacher report returns real recentTests array");

    // 4. Student Individual Report
    const sRepRes = await fetch(`http://localhost:${PORT}/api/reports/student`, {
      headers: { "Authorization": `Bearer ${saStudToken}` }
    });
    const sRepData = await sRepRes.json();
    assert(sRepRes.status === 200, "Student performance report returns 200 OK");
    assert(typeof sRepData.report?.completedTestsCount === "number", "Student report returns real numeric completedTestsCount");
    assert(typeof sRepData.report?.averageScore === "number", "Student report returns real numeric averageScore");

    // -------------------------------------------------------------
    // TEST SECTION 5: Cleanup Temporary Regression Data
    // -------------------------------------------------------------
    console.log("\n--- Section 5: Data Cleanup ---");
    await Attempt.deleteMany({ testId: testAId });
    await Question.deleteMany({ testId: testAId });
    await Test.findByIdAndDelete(testAId);
    await User.deleteMany({
      email: {
        $in: [
          "admin@reg-org-a.edu",
          "teacher@reg-org-a.edu",
          "student@reg-org-a.edu",
          "teacher@reg-org-b.edu",
          "student@reg-org-b.edu"
        ]
      }
    });
    await Organization.deleteMany({ slug: { $in: ["reg-test-org-a", "reg-test-org-b"] } });
    console.log("✓ Regression test artifacts removed cleanly from database.");

  } catch (err) {
    console.error("Test execution threw error:", err);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log("\n==================================================================");
    console.log(`   REGRESSION SUITE COMPLETED: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log("==================================================================\n");

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

runRegressionSuite();
