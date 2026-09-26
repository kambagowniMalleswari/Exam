// Verification script for all four user requirements:
// 1. Email notification dispatch (welcome, login notice, credentials)
// 2. Super Admin credentials validation (only kambagownikmalleswari@gmail.com with Admin@12345)
// 3. User data reset verification (only super admin exists)
// 4. Duplicate email rejection across all roles

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import sendEmail, {
  sendStudentWelcomeEmail,
  sendAccountCredentialsEmail,
  sendLoginNotificationEmail
} from "../utils/sendEmail.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const runVerification = async () => {
  console.log("=== STARTING FULL REQUIREMENTS VERIFICATION ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Test 1: Verify users collection state
  console.log("\n[TEST 1] Verifying Users in Database...");
  const allUsers = await User.find({}).lean();
  console.log(`Total users in database: ${allUsers.length}`);

  if (allUsers.length !== 1) {
    throw new Error(`Expected exactly 1 user (Super Admin), found: ${allUsers.length}`);
  }

  const superAdmin = allUsers[0];
  console.log(`User in DB: ${superAdmin.email}, Role: ${superAdmin.role}`);

  if (superAdmin.email !== "kambagownikmalleswari@gmail.com" || superAdmin.role !== "super_admin") {
    throw new Error("Super Admin user email or role does not match kambagownikmalleswari@gmail.com");
  }

  // Test 2: Verify Super Admin Credentials (Password Admin@12345)
  console.log("\n[TEST 2] Verifying Super Admin Password...");
  const correctPasswordMatch = await bcrypt.compare("Admin@12345", superAdmin.password);
  const wrongPasswordMatch1 = await bcrypt.compare("Admin@1234", superAdmin.password);
  const wrongPasswordMatch2 = await bcrypt.compare("wrongpass", superAdmin.password);

  console.log(`Password 'Admin@12345' valid: ${correctPasswordMatch} (Expected: true)`);
  console.log(`Password 'Admin@1234' valid: ${wrongPasswordMatch1} (Expected: false)`);
  console.log(`Password 'wrongpass' valid: ${wrongPasswordMatch2} (Expected: false)`);

  if (!correctPasswordMatch || wrongPasswordMatch1 || wrongPasswordMatch2) {
    throw new Error("Super Admin password verification failed!");
  }

  // Test 3: Verify Email Dispatch (Live SMTP)
  console.log("\n[TEST 3] Testing Email Notifications with Nodemailer...");
  
  console.log("-> Testing sendLoginNotificationEmail to Super Admin...");
  const loginEmailRes = await sendLoginNotificationEmail({
    to: "kambagownikmalleswari@gmail.com",
    name: "Malleswari",
    role: "super_admin",
    email: "kambagownikmalleswari@gmail.com"
  });
  console.log("Login notification email result:", loginEmailRes);

  if (!loginEmailRes.success) {
    throw new Error(`Login email failed: ${loginEmailRes.error}`);
  }

  console.log("-> Testing sendAccountCredentialsEmail (Temporary password)...");
  const credsEmailRes = await sendAccountCredentialsEmail({
    to: "kambagownikmalleswari@gmail.com",
    name: "Test Faculty Member",
    email: "test_faculty@example.com",
    password: "TempPass#987654!",
    role: "Faculty / Teacher",
    orgName: "AssessIQ University",
    loginUrl: "http://localhost:5173/login"
  });
  console.log("Credentials email result:", credsEmailRes);

  if (!credsEmailRes.success) {
    throw new Error(`Credentials email failed: ${credsEmailRes.error}`);
  }

  console.log("-> Testing sendStudentWelcomeEmail...");
  const welcomeEmailRes = await sendStudentWelcomeEmail({
    to: "kambagownikmalleswari@gmail.com",
    name: "Test Student",
    email: "test_student@example.com"
  });
  console.log("Welcome email result:", welcomeEmailRes);

  if (!welcomeEmailRes.success) {
    throw new Error(`Welcome email failed: ${welcomeEmailRes.error}`);
  }

  // Test 4: Duplicate Email Rejection
  console.log("\n[TEST 4] Testing Duplicate Email Prevention...");
  try {
    // Attempt inserting duplicate super admin email
    await User.create({
      name: "Duplicate User Attempt",
      email: "kambagownikmalleswari@gmail.com",
      password: "hashedpassword",
      role: "student"
    });
    throw new Error("Duplicate email was allowed! (Should have thrown MongoServerError duplicate key)");
  } catch (dupErr) {
    if (dupErr.code === 11000 || dupErr.message.includes("E11000")) {
      console.log("SUCCESS: MongoDB unique index strictly rejected duplicate email (code 11000)!");
    } else {
      throw dupErr;
    }
  }

  console.log("\n=== ALL 4 REQUIREMENTS VERIFIED AND PASSING SUCCESSFULLY! ===");
  await mongoose.disconnect();
  process.exit(0);
};

runVerification().catch((err) => {
  console.error("\n❌ Verification Failed:", err);
  process.exit(1);
});
