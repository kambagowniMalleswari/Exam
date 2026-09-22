import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";
const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_mcq_jwt_key_2026";
const BASE_URL = "http://localhost:5000/api";

async function runVerification() {
  console.log("=== ACCESS DENIED ISSUE VERIFICATION ===");
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Locate teacher Rama
  const ramaUser = await db.collection("users").findOne({ email: "nidigantiharipriya@gmail.com" });
  if (!ramaUser) throw new Error("Rama user not found");
  console.log(`✓ Teacher Rama found: ${ramaUser.name} (${ramaUser.email}), DB Role: "${ramaUser.role}", Org: ${ramaUser.organizationId}`);

  // 2. Craft a STALE JWT token where role is "student" (simulating token issued prior to teacher approval)
  const staleToken = jwt.sign(
    {
      id: ramaUser._id,
      role: "student", // Stale role in token!
      organizationId: ramaUser.organizationId
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  console.log("\n--- TEST 1: Calling Teacher Endpoints with Stale 'student' Token ---");
  console.log("Stale Token claims role: 'student'");

  const batchesRes = await fetch(`${BASE_URL}/batches`, {
    headers: {
      Authorization: `Bearer ${staleToken}`,
      "Content-Type": "application/json"
    }
  });
  const batchesData = await batchesRes.json();
  const returnedNewToken = batchesRes.headers.get("x-new-token");

  console.log(`GET /api/batches Status: ${batchesRes.status}`);
  console.log(`x-new-token header present: ${!!returnedNewToken}`);
  console.log(`Response message: ${batchesData.message || (batchesData.success ? "Success" : "")}`);

  if (batchesRes.status !== 200) {
    throw new Error(`Expected 200 from GET /batches but got ${batchesRes.status}: ${JSON.stringify(batchesData)}`);
  }
  if (!returnedNewToken) {
    throw new Error("Expected x-new-token header to be present for stale token");
  }
  console.log("✓ SUCCESS: Stale token was dynamically refreshed from DB! No 403 Access Denied!");

  // Verify the renewed token
  const decodedNewToken = jwt.verify(returnedNewToken, JWT_SECRET);
  console.log(`Renewed token role decoded: "${decodedNewToken.role}" (matches DB role)`);
  if (decodedNewToken.role !== "teacher") {
    throw new Error(`Expected renewed token to have role 'teacher', got '${decodedNewToken.role}'`);
  }

  // 3. Test other dashboard prerequisites that BatchesManager calls
  console.log("\n--- TEST 2: Testing Other BatchesManager & Teacher Dashboard APIs ---");
  const testsRes = await fetch(`${BASE_URL}/tests`, {
    headers: { Authorization: `Bearer ${returnedNewToken}` }
  });
  console.log(`GET /api/tests -> Status: ${testsRes.status}`);

  const studentsRes = await fetch(`${BASE_URL}/users?role=student`, {
    headers: { Authorization: `Bearer ${returnedNewToken}` }
  });
  console.log(`GET /api/users?role=student -> Status: ${studentsRes.status}`);

  const teacherReportRes = await fetch(`${BASE_URL}/reports/teacher`, {
    headers: { Authorization: `Bearer ${returnedNewToken}` }
  });
  console.log(`GET /api/reports/teacher -> Status: ${teacherReportRes.status}`);

  if (testsRes.status !== 200 || studentsRes.status !== 200 || teacherReportRes.status !== 200) {
    throw new Error("One of the teacher endpoints failed!");
  }
  console.log("✓ SUCCESS: All Teacher Dashboard prerequisite APIs succeed with HTTP 200!");

  // 4. Test Org Admin accessing batches and teacher routes
  console.log("\n--- TEST 3: Testing Org Admin Supervisory Permissions ---");
  const orgAdminUser = await db.collection("users").findOne({ role: "org_admin" });
  if (orgAdminUser) {
    const adminToken = jwt.sign(
      { id: orgAdminUser._id, role: orgAdminUser.role, organizationId: orgAdminUser.organizationId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const adminBatchesRes = await fetch(`${BASE_URL}/batches`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Org Admin GET /api/batches -> Status: ${adminBatchesRes.status}`);

    const adminOrgReportRes = await fetch(`${BASE_URL}/reports/organization`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Org Admin GET /api/reports/organization -> Status: ${adminOrgReportRes.status}`);

    const adminStudentReportRes = await fetch(`${BASE_URL}/reports/student`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Org Admin GET /api/reports/student -> Status: ${adminStudentReportRes.status}`);

    if (adminBatchesRes.status !== 200 || adminOrgReportRes.status !== 200 || adminStudentReportRes.status !== 200) {
      throw new Error("Org Admin permission check failed!");
    }
    console.log("✓ SUCCESS: Org Admin has supervisory access to all dashboard reports & batches!");
  }

  // 5. Test /auth/profile returns fresh token
  console.log("\n--- TEST 4: Testing /auth/profile Returns Refreshed Token ---");
  const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${staleToken}` }
  });
  const profileData = await profileRes.json();
  console.log(`GET /api/auth/profile -> Status: ${profileRes.status}, user role: ${profileData.user?.role}, token present: ${!!profileData.token}`);
  if (profileRes.status !== 200 || !profileData.token || profileData.user?.role !== "teacher") {
    throw new Error("Profile refresh failed!");
  }
  console.log("✓ SUCCESS: /auth/profile automatically delivers refreshed token & user state!");

  console.log("\n==========================================");
  console.log("ALL VERIFICATIONS PASSED SUCCESSFULLY!");
  console.log("Access Denied issue is fully resolved across all dashboards!");
  console.log("==========================================");

  await mongoose.disconnect();
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
