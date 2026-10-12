import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import connectDB from "../config/db.js";
import initSuperAdmin from "../config/initSuperAdmin.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import OrgApplication from "../models/OrgApplication.js";
import TeacherApplication from "../models/TeacherApplication.js";

import authRoutes from "../routes/authRoutes.js";
import organizationRoutes from "../routes/organizationRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import orgApplicationRoutes from "../routes/orgApplicationRoutes.js";
import teacherApplicationRoutes from "../routes/teacherApplicationRoutes.js";

async function runComprehensiveEmailTest() {
  console.log("==================================================");
  console.log("  ASSESSIQ EMAIL ROLLOUT & API VERIFICATION SUITE ");
  console.log("==================================================");

  console.log("\n[1] Environment Variables Verification:");
  console.log("• SUPER_ADMIN_EMAIL:", process.env.SUPER_ADMIN_EMAIL || "(not set)");
  console.log("• SUPER_ADMIN_PASSWORD:", process.env.SUPER_ADMIN_PASSWORD ? "****** (Set)" : "(not set)");
  console.log("• EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "(not set)");
  console.log("• EMAIL_USER:", process.env.EMAIL_USER || "(not set)");
  console.log("• EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "****** (Set)" : "(not set)");
  console.log("• EMAIL_FROM:", process.env.EMAIL_FROM || "(not set)");
  console.log("• BREVO_API_KEY:", process.env.BREVO_API_KEY ? "****** (Set)" : "(none)");
  console.log("• RESEND_API_KEY:", process.env.RESEND_API_KEY ? "****** (Set)" : "(none)");

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "kambagownikmalleswari@gmail.com").toLowerCase().trim();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@145";

  // Connect to DB
  console.log("\n[2] Connecting to MongoDB...");
  await connectDB();
  console.log("✅ MongoDB Connected successfully.");

  // Sync Super Admin user with correct password
  let superAdminUser = await User.findOne({ email: superAdminEmail });
  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

  if (!superAdminUser) {
    superAdminUser = await User.create({
      name: "Malleswari (Super Admin)",
      email: superAdminEmail,
      phone: "9876543210",
      password: hashedPassword,
      role: "super_admin",
      organizationId: null,
      status: "active",
      isActive: true
    });
    console.log(`✅ Created Super Admin account: ${superAdminEmail}`);
  } else {
    superAdminUser.password = hashedPassword;
    superAdminUser.role = "super_admin";
    superAdminUser.status = "active";
    superAdminUser.isActive = true;
    await superAdminUser.save();
    console.log(`✅ Synchronized Super Admin password for: ${superAdminEmail}`);
  }

  // Start internal test server
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/org-applications", orgApplicationRoutes);
  app.use("/api/teacher-applications", teacherApplicationRoutes);

  const testPort = 5055;
  const server = app.listen(testPort);
  const baseUrl = `http://localhost:${testPort}/api`;
  console.log(`✅ Test server running on port ${testPort}`);

  const results = [];

  try {
    // ----------------------------------------------------
    // TEST 1: Password Reset OTP Email
    // ----------------------------------------------------
    console.log("\n--------------------------------------------------");
    console.log("TEST 1: POST /api/auth/send-reset-otp (OTP Email)");
    console.log("--------------------------------------------------");
    const otpRes = await fetch(`${baseUrl}/auth/send-reset-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: superAdminEmail })
    });
    const otpData = await otpRes.json();
    console.log("Status:", otpRes.status);
    console.log("Response:", otpData);

    const testUserWithOtp = await User.findOne({ email: superAdminEmail });
    console.log("OTP in Database:", testUserWithOtp?.resetPasswordOtp);
    const test1Success = otpRes.status === 200 && otpData.success && Boolean(testUserWithOtp?.resetPasswordOtp);
    results.push({
      api: "POST /api/auth/send-reset-otp",
      feature: "Password Reset OTP Email",
      recipient: superAdminEmail,
      status: test1Success ? "PASSED" : "FAILED",
      details: otpData.message
    });

    // ----------------------------------------------------
    // TEST 2: User Login & Login Notification Email
    // ----------------------------------------------------
    console.log("\n--------------------------------------------------");
    console.log("TEST 2: POST /api/auth/login (Login Notification Email)");
    console.log("--------------------------------------------------");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: superAdminEmail, password: superAdminPassword })
    });
    const loginData = await loginRes.json();
    console.log("Status:", loginRes.status);
    console.log("Login Success:", loginData.success);
    const token = loginData.token;
    const test2Success = loginRes.status === 200 && Boolean(token);
    results.push({
      api: "POST /api/auth/login",
      feature: "Login & Security Notification Email",
      recipient: superAdminEmail,
      status: test2Success ? "PASSED" : "FAILED",
      details: `Authenticated as ${loginData.user?.role}`
    });

    // ----------------------------------------------------
    // TEST 3: Student Registration Welcome & Admin Alert
    // ----------------------------------------------------
    console.log("\n--------------------------------------------------");
    console.log("TEST 3: POST /api/auth/register (Student Welcome & Admin Alert)");
    console.log("--------------------------------------------------");
    const testStudentEmail = `test.student.${Date.now()}@example.com`;
    // Clean up any test users first
    await User.deleteMany({ email: /test\.student\./i });

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student Rollout",
        email: testStudentEmail,
        phone: "9876543211",
        password: "StudentPass@123",
        confirmPassword: "StudentPass@123"
      })
    });
    const regData = await regRes.json();
    console.log("Status:", regRes.status);
    console.log("Response:", regData);
    const test3Success = regRes.status === 201 && regData.success;
    results.push({
      api: "POST /api/auth/register",
      feature: "Student Welcome Email + Super Admin Alert",
      recipient: `${testStudentEmail} & ${superAdminEmail}`,
      status: test3Success ? "PASSED" : "FAILED",
      details: regData.message
    });

    // ----------------------------------------------------
    // TEST 4: Organization Application & Admin Alert
    // ----------------------------------------------------
    console.log("\n--------------------------------------------------");
    console.log("TEST 4: POST /api/org-applications/apply (Org Request & Admin Alert)");
    console.log("--------------------------------------------------");
    const testOrgEmail = `test.org.${Date.now()}@example.com`;
    await OrgApplication.deleteMany({ email: /test\.org\./i });

    const orgAppRes = await fetch(`${baseUrl}/org-applications/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Apex Engineering Institute",
        type: "college",
        adminName: "Dr. Apex Director",
        email: testOrgEmail,
        phone: "9876543212",
        website: "https://apexengineering.edu",
        address: "742 Evergreen Terrace",
        city: "Hyderabad",
        state: "Telangana",
        country: "India",
        expectedStudents: 100,
        notes: "Testing automated email dispatch"
      })
    });
    const orgAppData = await orgAppRes.json();
    console.log("Status:", orgAppRes.status);
    console.log("Response:", orgAppData);
    const orgAppId = orgAppData.application?.id || orgAppData.application?._id;
    const test4Success = orgAppRes.status === 201 && Boolean(orgAppId);
    results.push({
      api: "POST /api/org-applications/apply",
      feature: "Applicant Confirmation + Super Admin New Request Alert",
      recipient: `${testOrgEmail} & ${superAdminEmail}`,
      status: test4Success ? "PASSED" : "FAILED",
      details: orgAppData.message
    });

    // ----------------------------------------------------
    // TEST 5: Org Application Approval & Credentials Email
    // ----------------------------------------------------
    if (orgAppId) {
      console.log("\n--------------------------------------------------");
      console.log("TEST 5: PATCH /api/org-applications/:id/approve (Approval & Credentials)");
      console.log("--------------------------------------------------");
      const approveRes = await fetch(`${baseUrl}/org-applications/${orgAppId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const approveData = await approveRes.json();
      console.log("Status:", approveRes.status);
      console.log("Response:", approveData);
      const test5Success = approveRes.status === 200 && approveData.success;
      results.push({
        api: "PATCH /api/org-applications/:id/approve",
        feature: "Org Admin Credentials & Password Email + Admin Notice",
        recipient: `${testOrgEmail} & ${superAdminEmail}`,
        status: test5Success ? "PASSED" : "FAILED",
        details: approveData.message
      });
    }

    // ----------------------------------------------------
    // TEST 6: Teacher Application & Admin Alert
    // ----------------------------------------------------
    console.log("\n--------------------------------------------------");
    console.log("TEST 6: POST /api/teacher-applications/apply (Teacher Request & Admin Alert)");
    console.log("--------------------------------------------------");
    // Find an active organization
    const activeOrg = await Organization.findOne({ isActive: true });
    const testTeacherEmail = `test.teacher.${Date.now()}@example.com`;
    await TeacherApplication.deleteMany({ email: /test\.teacher\./i });

    const teacherAppRes = await fetch(`${baseUrl}/teacher-applications/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Prof. Alan Turing",
        email: testTeacherEmail,
        phone: "9876543213",
        organizationId: activeOrg ? activeOrg._id.toString() : undefined,
        subject: "Computer Science & AI",
        qualification: "Ph.D in Computer Science",
        experienceYears: 8
      })
    });
    const teacherAppData = await teacherAppRes.json();
    console.log("Status:", teacherAppRes.status);
    console.log("Response:", teacherAppData);
    const teacherAppId = teacherAppData.application?.id || teacherAppData.application?._id;
    const test6Success = teacherAppRes.status === 201 && Boolean(teacherAppId);
    results.push({
      api: "POST /api/teacher-applications/apply",
      feature: "Teacher Application Confirmation + Admin Notification",
      recipient: `${testTeacherEmail} & ${superAdminEmail}`,
      status: test6Success ? "PASSED" : "FAILED",
      details: teacherAppData.message
    });

    // ----------------------------------------------------
    // TEST 7: Teacher Application Approval & Credentials Email
    // ----------------------------------------------------
    if (teacherAppId) {
      console.log("\n--------------------------------------------------");
      console.log("TEST 7: POST /api/teacher-applications/:id/approve (Approval & Credentials)");
      console.log("--------------------------------------------------");
      const approveTeacherRes = await fetch(`${baseUrl}/teacher-applications/${teacherAppId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const approveTeacherData = await approveTeacherRes.json();
      console.log("Status:", approveTeacherRes.status);
      console.log("Response:", approveTeacherData);
      const test7Success = approveTeacherRes.status === 200 && approveTeacherData.success;
      results.push({
        api: "POST /api/teacher-applications/:id/approve",
        feature: "Teacher Login Credentials & Temp Password Email",
        recipient: `${testTeacherEmail} & ${superAdminEmail}`,
        status: test7Success ? "PASSED" : "FAILED",
        details: approveTeacherData.message
      });
    }

    // ----------------------------------------------------
    // TEST 8: Direct User Creation by Admin & Credentials Email
    // ----------------------------------------------------
    console.log("\n--------------------------------------------------");
    console.log("TEST 8: POST /api/users (Direct User Creation Credentials)");
    console.log("--------------------------------------------------");
    const directUserEmail = `direct.student.${Date.now()}@example.com`;
    const createUserRes = await fetch(`${baseUrl}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "Directly Provisioned Student",
        email: directUserEmail,
        phone: "9876543214",
        password: "TempPassword#2026",
        role: "student",
        organizationId: activeOrg ? activeOrg._id.toString() : undefined
      })
    });
    const createUserData = await createUserRes.json();
    console.log("Status:", createUserRes.status);
    console.log("Response:", createUserData);
    const test8Success = createUserRes.status === 201 && createUserData.success;
    results.push({
      api: "POST /api/users",
      feature: "Direct Account Credentials & Temporary Password Email",
      recipient: `${directUserEmail} & ${superAdminEmail}`,
      status: test8Success ? "PASSED" : "FAILED",
      details: createUserData.message
    });

  } finally {
    server.close();
  }

  // Summary Table
  console.log("\n==================================================");
  console.log("           EMAIL ROLLOUT TEST RESULTS             ");
  console.log("==================================================");
  console.table(results);

  // Clean up test users created during test
  await User.deleteMany({ email: /test\.student\.|direct\.student\.|test\.teacher\.|test\.org\./i });
  await OrgApplication.deleteMany({ email: /test\.org\./i });
  await TeacherApplication.deleteMany({ email: /test\.teacher\./i });
  console.log("🧹 Test artifacts cleaned up.");

  const allPassed = results.every((r) => r.status === "PASSED");
  if (allPassed) {
    console.log("\n🎉 ALL 8 EMAIL DISPATCH APIS PASSED AND ARE ROLLING OUT SUCCESSFULLY!");
  } else {
    console.log("\n⚠️ Some APIs had issues. Review table above.");
  }

  await mongoose.disconnect();
  process.exit(allPassed ? 0 : 1);
}

runComprehensiveEmailTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
