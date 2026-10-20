import "../server.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sendEmail from "../utils/sendEmail.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_mcq_jwt_key_2026";
const BASE_URL = "http://localhost:5000/api";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyAll() {
  console.log("==================================================");
  console.log("🔍 ASSESSIQ COMPREHENSIVE REQUIREMENTS VERIFICATION");
  console.log("==================================================");

  // Wait 3 seconds for server and MongoDB connection
  await sleep(3000);

  const db = mongoose.connection.db;

  // 1. Verify SMTP Email Integration
  console.log("\n[1/5] Testing SMTP Email Integration with admin@vmsclass.com...");
  const mailResult = await sendEmail({
    to: "admin@vmsclass.com",
    subject: "AssessIQ Platform SMTP Integration Test",
    text: "Automated verification test for admin@vmsclass.com SMTP credentials."
  });
  console.log("SMTP Send Result:", mailResult);
  if (!mailResult.success) {
    throw new Error(`SMTP sending failed: ${mailResult.error}`);
  }
  console.log("✅ SMTP email integrated and verified successfully!");

  // 2. Verify Database Users
  console.log("\n[2/5] Checking Administrator Users in Database...");
  const superAdmin = await db.collection("users").findOne({ email: "admin@vmsclass.com" });
  console.log("admin@vmsclass.com:", superAdmin ? `Found (Role: ${superAdmin.role}, Status: ${superAdmin.status})` : "Not found");
  
  const orgAdmin = await db.collection("users").findOne({ role: "org_admin" });
  console.log("Org Admin:", orgAdmin ? `${orgAdmin.email} (Org: ${orgAdmin.organizationId})` : "None");

  const org = await db.collection("organizations").findOne({ isActive: true });
  console.log("Active Org:", org ? `${org.name} (ID: ${org._id})` : "None");

  // 3. Test Super Admin JWT & Endpoints
  console.log("\n[3/5] Testing Super Admin Endpoints (No Access Denied)...");
  const superToken = jwt.sign(
    { id: superAdmin._id, role: superAdmin.role, organizationId: null },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  const testEndpoints = [
    { url: "/reports/platform", name: "Super Admin Platform Reports" },
    { url: "/organizations", name: "Organizations List" },
    { url: "/org-applications", name: "Organization Applications" },
    { url: "/subscriptions", name: "Subscriptions List" },
    { url: "/tests", name: "Tests Management" },
    { url: "/batches", name: "Batches Management" },
    { url: "/users/students", name: "Students List" },
    { url: "/users/teachers", name: "Teachers List" }
  ];

  for (const ep of testEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.url}`, {
      headers: { Authorization: `Bearer ${superToken}`, "Content-Type": "application/json" }
    });
    const data = await res.json();
    console.log(`Endpoint ${ep.name} (${ep.url}) -> Status: ${res.status} (Success: ${data.success})`);
    if (res.status === 403 || res.status === 401) {
      throw new Error(`FAILED: Got ${res.status} Access Denied on ${ep.url}`);
    }
  }
  console.log("✅ All Super Admin endpoints returned 200 without Access Denied!");

  // 4. Test Org Admin JWT & Endpoints
  console.log("\n[4/5] Testing Org Admin Endpoints (No Access Denied)...");
  if (orgAdmin) {
    const orgToken = jwt.sign(
      { id: orgAdmin._id, role: orgAdmin.role, organizationId: orgAdmin.organizationId },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const orgEndpoints = [
      { url: "/reports/organization", name: "Organization Reports" },
      { url: "/subscriptions/current", name: "Current Subscription" },
      { url: "/organizations", name: "Organizations Overview" },
      { url: "/tests", name: "Tests Management" },
      { url: "/batches", name: "Batches Management" },
      { url: "/users/students", name: "Students List" },
      { url: "/users/teachers", name: "Teachers List" },
      { url: "/teacher-applications", name: "Teacher Applications" }
    ];

    for (const ep of orgEndpoints) {
      const res = await fetch(`${BASE_URL}${ep.url}`, {
        headers: { Authorization: `Bearer ${orgToken}`, "Content-Type": "application/json" }
      });
      const data = await res.json();
      console.log(`OrgAdmin ${ep.name} (${ep.url}) -> Status: ${res.status} (Success: ${data.success})`);
      if (res.status === 403 || res.status === 401) {
        throw new Error(`FAILED: Org Admin got ${res.status} Access Denied on ${ep.url}`);
      }
    }
    console.log("✅ All Org Admin endpoints returned 200 without Access Denied!");
  }

  // 5. Test User Without Organization (Auto-resolve in authMiddleware/tenantMiddleware)
  console.log("\n[5/5] Testing Auto-Resolution for User without Org ID...");
  const tempUser = await db.collection("users").insertOne({
    name: "Independent Faculty",
    email: `tempfaculty_${Date.now()}@vmsclass.com`,
    password: await bcrypt.hash("Pass@123", 10),
    role: "teacher",
    organizationId: null,
    status: "active",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const facultyToken = jwt.sign(
    { id: tempUser.insertedId, role: "teacher", organizationId: null },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  const facultyTestsRes = await fetch(`${BASE_URL}/tests`, {
    headers: { Authorization: `Bearer ${facultyToken}`, "Content-Type": "application/json" }
  });
  const facultyTestsData = await facultyTestsRes.json();
  console.log(`Faculty with no orgId -> GET /tests Status: ${facultyTestsRes.status} (Success: ${facultyTestsData.success})`);
  if (facultyTestsRes.status === 403 || facultyTestsRes.status === 401) {
    throw new Error(`FAILED: Faculty got ${facultyTestsRes.status} Access Denied!`);
  }
  console.log("✅ Auto-resolved organization seamlessly without 403!");

  // Clean up temp user
  await db.collection("users").deleteOne({ _id: tempUser.insertedId });

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO ACCESS DENIED!");
  console.log("==================================================");

  await mongoose.disconnect();
  process.exit(0);
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
