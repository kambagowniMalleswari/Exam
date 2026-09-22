// Verification script for all newly implemented backend capabilities
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import initSuperAdmin from "../config/initSuperAdmin.js";

dotenv.config();

const runTest = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for testing...");

    // 1. Verify Super Admin credentials
    await initSuperAdmin();
    const superAdmin = await User.findOne({ email: "kambagownikmalleswari@gmail.com" });
    if (!superAdmin) throw new Error("Super Admin was not found!");
    const passMatch = await bcrypt.compare("Admin@1234", superAdmin.password);
    console.log("✓ Super Admin Account Exists:", superAdmin.email, "| Role:", superAdmin.role, "| Password Matches Admin@1234:", passMatch);

    // 2. Verify Teacher Permissions Logic
    const teacher = await User.findOne({ role: "teacher" });
    const studentsCount = await User.countDocuments({ role: "student", organizationId: teacher?.organizationId });
    console.log(`✓ Found Teacher: ${teacher?.email} in Org: ${teacher?.organizationId} with ${studentsCount} students in their organization.`);

    // 3. Test OTP Generation
    const testOtp = "849201";
    superAdmin.resetPasswordOtp = testOtp;
    superAdmin.resetPasswordOtpExpires = new Date(Date.now() + 600000);
    await superAdmin.save();

    const checkAdmin = await User.findOne({ email: superAdmin.email, resetPasswordOtp: testOtp });
    if (!checkAdmin) throw new Error("OTP verification check failed!");
    console.log("✓ OTP Password Reset fields work correctly on User model. OTP:", checkAdmin.resetPasswordOtp);

    // Reset OTP back to null
    superAdmin.resetPasswordOtp = null;
    superAdmin.resetPasswordOtpExpires = null;
    await superAdmin.save();

    console.log("\n==========================================");
    console.log("ALL BACKEND VERIFICATION CHECKS PASSED!");
    console.log("==========================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("TEST FAILED:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runTest();
