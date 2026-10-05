import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import express from "express";
import authRoutes from "../routes/authRoutes.js";

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE TESTS ===");
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // Setup local express app to test routes
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);

  const server = app.listen(5099);

  try {
    // -------------------------------------------------------------
    // TEST 1: Login with isitpoornima2008@gmail.com / OrgAdmin#kwbpsa!
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Organization Admin Login via Email...");
    const loginEmailRes = await fetch("http://localhost:5099/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "isitpoornima2008@gmail.com",
        password: "OrgAdmin#kwbpsa!"
      })
    });
    const loginEmailData = await loginEmailRes.json();
    console.log("Status:", loginEmailRes.status, "Success:", loginEmailData.success);
    if (!loginEmailData.success) {
      throw new Error(`Login failed: ${loginEmailData.message}`);
    }
    console.log("✓ Logged in successfully! Role:", loginEmailData.user?.role, "Org:", loginEmailData.user?.organizationId);

    // -------------------------------------------------------------
    // TEST 2: Login by Username 'Kumar' / OrgAdmin#kwbpsa!
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Organization Admin Login via Username 'Kumar'...");
    const loginNameRes = await fetch("http://localhost:5099/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "Kumar",
        password: "OrgAdmin#kwbpsa!"
      })
    });
    const loginNameData = await loginNameRes.json();
    console.log("Status:", loginNameRes.status, "Success:", loginNameData.success);
    if (!loginNameData.success) {
      throw new Error(`Username login failed: ${loginNameData.message}`);
    }
    console.log("✓ Username login succeeded! User email:", loginNameData.user?.email);

    // -------------------------------------------------------------
    // TEST 3: Step-by-Step OTP Flow
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Step-by-Step OTP Reset Flow...");
    const testEmail = "madhusujan593@gmail.com";

    // Step 1: Send OTP
    console.log("Step 1: Dispatching OTP for", testEmail);
    const sendRes = await fetch("http://localhost:5099/api/auth/send-reset-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail })
    });
    const sendData = await sendRes.json();
    console.log("Step 1 result:", sendData.message);

    // Get the generated OTP from database directly for testing
    const testUser = await db.collection("users").findOne({ email: testEmail });
    const realOtp = testUser.resetPasswordOtp;
    console.log("Database OTP is:", realOtp);

    // Step 2A: Test invalid OTP
    console.log("Step 2A: Testing invalid OTP verification...");
    const badOtpRes = await fetch("http://localhost:5099/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: "000000" })
    });
    const badOtpData = await badOtpRes.json();
    console.log("Bad OTP status:", badOtpRes.status, "Message:", badOtpData.message);
    if (badOtpData.success) {
      throw new Error("Bad OTP should have failed!");
    }
    console.log("✓ Invalid OTP rejected correctly.");

    // Step 2B: Test valid OTP
    console.log("Step 2B: Testing valid OTP verification...");
    const goodOtpRes = await fetch("http://localhost:5099/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: realOtp })
    });
    const goodOtpData = await goodOtpRes.json();
    console.log("Good OTP status:", goodOtpRes.status, "Success:", goodOtpData.success, "Message:", goodOtpData.message);
    if (!goodOtpData.success) {
      throw new Error(`Valid OTP verification failed: ${goodOtpData.message}`);
    }
    console.log("✓ Valid OTP verified successfully without needing password!");

    // Step 3: Test final reset with new password
    console.log("Step 3: Resetting password with new valid password...");
    const newTestPass = "NewPass@2026!";
    const finalResetRes = await fetch("http://localhost:5099/api/auth/verify-reset-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        otp: realOtp,
        newPassword: newTestPass,
        confirmPassword: newTestPass
      })
    });
    const finalResetData = await finalResetRes.json();
    console.log("Step 3 result:", finalResetData.message);
    if (!finalResetData.success) {
      throw new Error(`Final password reset failed: ${finalResetData.message}`);
    }
    console.log("✓ Password reset completed successfully!");

    // Verify login with new password
    const newLoginRes = await fetch("http://localhost:5099/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: newTestPass })
    });
    const newLoginData = await newLoginRes.json();
    console.log("Login with new password status:", newLoginRes.status, "Success:", newLoginData.success);
    if (!newLoginData.success) {
      throw new Error(`Login with new password failed: ${newLoginData.message}`);
    }
    console.log("✓ Login with new password succeeded!");

    console.log("\n==========================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==========================================");

  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
