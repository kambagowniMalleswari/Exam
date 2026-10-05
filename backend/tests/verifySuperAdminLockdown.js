import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import User from "../models/User.js";
import initSuperAdmin from "../config/initSuperAdmin.js";

async function verify() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB Atlas");

  // Run initSuperAdmin to ensure idempotency and verify it works on boot
  console.log("Running initSuperAdmin()...");
  await initSuperAdmin();

  // Test 1: Only ONE super_admin in entire database
  const allSuperAdmins = await User.find({ role: { $in: ["super_admin", "superadmin"] } });
  console.log(`\nTest 1 - Super Admin Count in DB: ${allSuperAdmins.length}`);
  if (allSuperAdmins.length !== 1) {
    throw new Error(`Expected exactly 1 super_admin, found ${allSuperAdmins.length}`);
  }
  console.log("  PASSED: Exactly 1 super admin exists in DB");

  // Test 2: That super admin MUST be kambagownikmalleswari@gmail.com
  const sa = allSuperAdmins[0];
  console.log(`\nTest 2 - Super Admin Email: ${sa.email}`);
  if (sa.email !== "kambagownikmalleswari@gmail.com") {
    throw new Error(`Expected kambagownikmalleswari@gmail.com, got ${sa.email}`);
  }
  console.log("  PASSED: Authorized email verified");

  // Test 3: Password verification
  console.log("\nTest 3 - Password Verification:");
  const correctMatch = await bcrypt.compare("Admin@145", sa.password);
  const oldMatch = await bcrypt.compare("Admin@12345", sa.password);
  console.log("  Admin@145 match:", correctMatch ? "PASS (True)" : "FAIL (False)");
  console.log("  Admin@12345 match:", !oldMatch ? "PASS (Rejected)" : "FAIL (Accepted)");

  if (!correctMatch || oldMatch) {
    throw new Error("Password verification failed!");
  }

  // Test 4: madhusujan593@gmail.com check
  console.log("\nTest 4 - madhusujan593@gmail.com Check:");
  const madhu = await User.findOne({ email: "madhusujan593@gmail.com" });
  if (madhu) {
    console.log(`  madhusujan593@gmail.com role: ${madhu.role}`);
    if (madhu.role === "super_admin" || madhu.role === "superadmin") {
      throw new Error("madhusujan593@gmail.com still has super_admin role!");
    }
    console.log("  PASSED: madhusujan593@gmail.com is NOT super_admin (role is " + madhu.role + ")");
  } else {
    console.log("  PASSED: madhusujan593@gmail.com does not exist in DB");
  }

  console.log("\nALL SUPER ADMIN LOCKDOWN TESTS PASSED SUCCESSFULLY! ✅");
  await mongoose.disconnect();
}

verify().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
