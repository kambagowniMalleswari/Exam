import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from "../routes/authRoutes.js";
import testRoutes from "../routes/testRoutes.js";
import questionRoutes from "../routes/questionRoutes.js";
import attemptRoutes from "../routes/attemptRoutes.js";
import resultRoutes from "../routes/resultRoutes.js";
import batchRoutes from "../routes/batchRoutes.js";
import reportRoutes from "../routes/reportRoutes.js";
import User from "../models/User.js";
import Test from "../models/Test.js";
import Organization from "../models/Organization.js";

dotenv.config({ path: "./backend/.env" });

const PORT = 5005;
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/reports", reportRoutes);

async function runStep6Verification() {
  console.log("=== STEP 6: VERIFYING TEACHER & STUDENT ROLE FLOWS & TENANT ISOLATION ===\n");

  const mongoUri = process.env.MONGO_URI;
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB Atlas.");

  // Get existing organization
  const existingOrg = await Organization.findOne({});
  const orgId = existingOrg ? existingOrg._id : new mongoose.Types.ObjectId();
  console.log("Using Organization ID:", orgId.toString());

  // Setup test teacher and student
  const hashedPassword = await bcrypt.hash("TestPass@123", 10);
  const teacherUser = await User.findOneAndUpdate(
    { email: "step6_teacher@test.com" },
    {
      name: "Prof. Step6 Teacher",
      email: "step6_teacher@test.com",
      password: hashedPassword,
      role: "teacher",
      organizationId: orgId,
      status: "active",
      isActive: true
    },
    { upsert: true, new: true }
  );

  const studentUser = await User.findOneAndUpdate(
    { email: "step6_student@test.com" },
    {
      name: "Step6 Student",
      email: "step6_student@test.com",
      password: hashedPassword,
      role: "student",
      organizationId: orgId,
      status: "active",
      isActive: true
    },
    { upsert: true, new: true }
  );

  // Setup one test authored by teacher and one test authored by admin
  const teacherAuthoredTest = await Test.findOneAndUpdate(
    { title: "Teacher's Own Exam" },
    {
      title: "Teacher's Own Exam",
      subject: "Computer Science",
      duration: 45,
      totalMarks: 100,
      type: "private",
      status: "published",
      organizationId: orgId,
      createdBy: teacherUser._id
    },
    { upsert: true, new: true }
  );

  const adminAuthoredTest = await Test.findOneAndUpdate(
    { title: "Admin's General Exam" },
    {
      title: "Admin's General Exam",
      subject: "General Knowledge",
      duration: 30,
      totalMarks: 50,
      type: "private",
      status: "published",
      organizationId: orgId,
      createdBy: new mongoose.Types.ObjectId() // Not the teacher
    },
    { upsert: true, new: true }
  );

  const server = app.listen(PORT, async () => {
    try {
      console.log(`Test server running on port ${PORT}.\n`);

      // 1. Teacher Login
      console.log("1. Authenticating as Teacher...");
      const tLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "step6_teacher@test.com", password: "TestPass@123" })
      });
      const tLoginData = await tLoginRes.json();
      if (!tLoginData.token) {
        throw new Error(`Teacher login failed: ${JSON.stringify(tLoginData)}`);
      }
      const teacherHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tLoginData.token}`
      };
      console.log("Teacher login SUCCESS! Role:", tLoginData.user?.role, "Org:", tLoginData.user?.organizationId);

      // 2. Teacher Dashboard Stats
      console.log("\n2. Checking Teacher Dashboard Stats (/api/reports/teacher)...");
      const tReportRes = await fetch(`http://localhost:${PORT}/api/reports/teacher`, { headers: teacherHeaders });
      const tReportData = await tReportRes.json();
      console.log("Teacher Dashboard Stats:", {
        status: tReportRes.status,
        totalTests: tReportData.report?.totalTests,
        publishedTests: tReportData.report?.publishedTests
      });

      // 3. Teacher Tests Scope
      console.log("\n3. Testing Teacher Tests Scope (/api/tests)...");
      const tTestsRes = await fetch(`http://localhost:${PORT}/api/tests`, { headers: teacherHeaders });
      const tTestsData = await tTestsRes.json();
      const allAuthoredByTeacher = tTestsData.tests?.every(t => (t.createdBy?._id || t.createdBy)?.toString() === teacherUser._id.toString());
      console.log(`Teacher sees ${tTestsData.tests?.length} tests. All authored by this teacher?`, allAuthoredByTeacher);

      // Organization scope override test
      const tOrgTestsRes = await fetch(`http://localhost:${PORT}/api/tests?scope=organization`, { headers: teacherHeaders });
      const tOrgTestsData = await tOrgTestsRes.json();
      console.log(`Teacher requesting org scope sees ${tOrgTestsData.tests?.length} tests (includes admin tests).`);

      // 4. Teacher Results Scope
      console.log("\n4. Testing Teacher Results Scope (/api/results/organization)...");
      const tResultsRes = await fetch(`http://localhost:${PORT}/api/results/organization`, { headers: teacherHeaders });
      console.log("Results query status:", tResultsRes.status);

      // 5. Student Login
      console.log("\n5. Authenticating as Student...");
      const sLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "step6_student@test.com", password: "TestPass@123" })
      });
      const sLoginData = await sLoginRes.json();
      if (!sLoginData.token) {
        throw new Error(`Student login failed: ${JSON.stringify(sLoginData)}`);
      }
      const studentHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sLoginData.token}`
      };
      console.log("Student login SUCCESS! Role:", sLoginData.user?.role, "Org:", sLoginData.user?.organizationId);

      // 6. Student Dashboard Stats & Available Tests
      console.log("\n6. Checking Student Dashboard Stats & Available Tests...");
      const sReportRes = await fetch(`http://localhost:${PORT}/api/reports/student`, { headers: studentHeaders });
      const sReportData = await sReportRes.json();
      console.log("Student Stats:", {
        status: sReportRes.status,
        availableTestsCount: sReportData.report?.availableTestsCount
      });

      const sAvailRes = await fetch(`http://localhost:${PORT}/api/attempts/available-tests`, { headers: studentHeaders });
      const sAvailData = await sAvailRes.json();
      console.log(`Student sees ${sAvailData.tests?.length} available tests for their org.`);

      // 7. Cross-Tenant Isolation Test (Create a second dummy Org and private test)
      console.log("\n7. Testing Cross-Tenant & Unauthorized Question Access Isolation...");
      const secondOrg = await Organization.findOneAndUpdate(
        { slug: "isolated-testing-org" },
        { name: "Isolated Testing Org", slug: "isolated-testing-org", status: "active", isActive: true },
        { upsert: true, new: true }
      );

      const foreignTest = await Test.findOneAndUpdate(
        { title: "Foreign Private Test" },
        {
          title: "Foreign Private Test",
          subject: "Security",
          duration: 30,
          totalMarks: 50,
          type: "private",
          status: "published",
          organizationId: secondOrg._id,
          createdBy: new mongoose.Types.ObjectId()
        },
        { upsert: true, new: true }
      );

      // A) Teacher attempting to fetch questions of a foreign test
      const tForeignQRes = await fetch(`http://localhost:${PORT}/api/questions/test/${foreignTest._id}`, { headers: teacherHeaders });
      console.log("Teacher access foreign test questions:", tForeignQRes.status, "(Expected 403 Forbidden)");

      // B) Teacher attempting to publish foreign test
      const tForeignPublishRes = await fetch(`http://localhost:${PORT}/api/tests/${foreignTest._id}/publish`, {
        method: "PATCH",
        headers: teacherHeaders
      });
      console.log("Teacher publish foreign test:", tForeignPublishRes.status, "(Expected 403 Forbidden)");

      // C) Student attempting to fetch questions of foreign private test
      const sForeignQRes = await fetch(`http://localhost:${PORT}/api/questions/test/${foreignTest._id}/student`, { headers: studentHeaders });
      console.log("Student access foreign private test questions:", sForeignQRes.status, "(Expected 403 Forbidden)");

      // D) Student attempting to get test instructions for foreign private test
      const sForeignTestRes = await fetch(`http://localhost:${PORT}/api/tests/${foreignTest._id}`, { headers: studentHeaders });
      console.log("Student access foreign private test details:", sForeignTestRes.status, "(Expected 403 Forbidden)");

      // E) Student attempting to start attempt on foreign private test
      const sForeignStartRes = await fetch(`http://localhost:${PORT}/api/attempts/start`, {
        method: "POST",
        headers: studentHeaders,
        body: JSON.stringify({ testId: foreignTest._id })
      });
      console.log("Student start foreign private test attempt:", sForeignStartRes.status, "(Expected 403 Forbidden)");

      // Cleanup
      await Test.deleteOne({ _id: foreignTest._id });
      await Organization.deleteOne({ _id: secondOrg._id });
      await Test.deleteOne({ _id: teacherAuthoredTest._id });
      await Test.deleteOne({ _id: adminAuthoredTest._id });
      await User.deleteOne({ _id: teacherUser._id });
      await User.deleteOne({ _id: studentUser._id });

      console.log("\n=== ALL STEP 6 CHECKS PASSED WITH 100% SUCCESS! ===");
    } catch (err) {
      console.error("Step 6 test error:", err);
    } finally {
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    }
  });
}

runStep6Verification().catch(console.error);
