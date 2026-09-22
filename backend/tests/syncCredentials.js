import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";

async function syncAndTest() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  console.log("=== UPDATING USER CREDENTIALS FOR TESTING ===");

  // 1. Update Org Admin: nanisree65@gmail.com
  const salt = await bcrypt.genSalt(10);
  const naniHash = await bcrypt.hash("OrgAdmin#85ppaz!", salt);

  const naniUpdate = await db.collection("users").findOneAndUpdate(
    { email: "nanisree65@gmail.com" },
    {
      $set: {
        role: "org_admin",
        password: naniHash,
        status: "active",
        isActive: true
      }
    },
    { returnDocument: "after" }
  );
  console.log("✓ Updated nanisree65@gmail.com to org_admin with OrgAdmin#85ppaz!:");
  console.log({
    email: naniUpdate.value?.email || naniUpdate.email,
    role: naniUpdate.value?.role || naniUpdate.role,
    orgId: naniUpdate.value?.organizationId || naniUpdate.organizationId
  });

  // 2. Update Super Admin: kambagownikmalleswari@gmail.com
  const superHash = await bcrypt.hash("Admin@12345", salt);
  const superUpdate = await db.collection("users").findOneAndUpdate(
    { email: "kambagownikmalleswari@gmail.com" },
    {
      $set: {
        role: "super_admin",
        password: superHash,
        status: "active",
        isActive: true
      }
    },
    { returnDocument: "after" }
  );
  console.log("✓ Updated kambagownikmalleswari@gmail.com password to Admin@12345:");
  console.log({
    email: superUpdate.value?.email || superUpdate.email,
    role: superUpdate.value?.role || superUpdate.role
  });

  // 3. Test Login via Backend API
  console.log("\n=== TESTING BACKEND API LOGIN ===");
  const testLogins = [
    { email: "nanisree65@gmail.com", password: "OrgAdmin#85ppaz!", expectedRole: "org_admin" },
    { email: "kambagownikmalleswari@gmail.com", password: "Admin@12345", expectedRole: "super_admin" }
  ];

  for (const cred of testLogins) {
    console.log(`\nTesting login for: ${cred.email}...`);
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cred.email, password: cred.password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error(`❌ FAILED login for ${cred.email}:`, data);
    } else {
      console.log(`✅ SUCCESS login for ${cred.email}!`);
      console.log("Returned User:", {
        id: data.user?.id || data.user?._id,
        name: data.user?.name,
        email: data.user?.email,
        role: data.user?.role,
        organizationId: data.user?.organizationId
      });
      console.log("Token received:", data.token ? data.token.substring(0, 20) + "..." : "NONE");

      // Test authorized endpoint with token
      const token = data.token;
      if (cred.expectedRole === "org_admin") {
        // Test fetching students, batches, and teachers for this org
        const studentsRes = await fetch("http://localhost:5000/api/users/students", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`- Org Admin GET /api/users/students status: ${studentsRes.status}`);
        const batchesRes = await fetch("http://localhost:5000/api/batches", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`- Org Admin GET /api/batches status: ${batchesRes.status}`);
        const teachersRes = await fetch("http://localhost:5000/api/users/teachers", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`- Org Admin GET /api/users/teachers status: ${teachersRes.status}`);
      } else if (cred.expectedRole === "super_admin") {
        // Test fetching org applications and all orgs
        const orgsRes = await fetch("http://localhost:5000/api/organizations", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`- Super Admin GET /api/organizations status: ${orgsRes.status}`);
        const orgAppsRes = await fetch("http://localhost:5000/api/org-applications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`- Super Admin GET /api/org-applications status: ${orgAppsRes.status}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log("\nSync & Test Completed.");
  process.exit(0);
}

syncAndTest().catch(console.error);
