// Comprehensive E2E Verification for Super Admin, Teacher, and Student Dashboards

const BASE_URL = "http://localhost:5000/api";

async function verifyAllRoleDashboards() {
  console.log("===============================================================");
  console.log("STARTING VERIFICATION OF SUPER ADMIN, TEACHER & STUDENT PORTALS");
  console.log("===============================================================\n");

  let allPassed = true;

  // 1. SUPER ADMIN VERIFICATION
  console.log("--- 1. VERIFYING SUPER ADMIN DASHBOARD FLOW ---");
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "kambagownikmalleswari@gmail.com", password: "Admin@12345" })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Super Admin login failed: " + JSON.stringify(data));
    console.log(`✓ Super Admin Authenticated: ${data.user.name} (${data.user.email}) | Role: ${data.user.role}`);

    const token = data.token;
    const headers = { Authorization: `Bearer ${token}` };

    const platformRes = await fetch(`${BASE_URL}/reports/platform`, { headers });
    const platformData = await platformRes.json();
    if (!platformRes.ok) throw new Error("GET /reports/platform failed: " + JSON.stringify(platformData));
    console.log(`✓ Platform Metrics Loaded: ${platformData.report?.organizations?.total} Orgs, ${platformData.report?.teachers?.total} Teachers, ${platformData.report?.students?.total} Students`);

    const orgsRes = await fetch(`${BASE_URL}/organizations`, { headers });
    const orgsData = await orgsRes.json();
    if (!orgsRes.ok) throw new Error("GET /organizations failed");
    console.log(`✓ Institutional Clients Loaded: ${orgsData.organizations?.length ?? 0} Organizations`);

    const orgAppsRes = await fetch(`${BASE_URL}/org-applications`, { headers });
    const orgAppsData = await orgAppsRes.json();
    if (!orgAppsRes.ok) throw new Error("GET /org-applications failed");
    console.log(`✓ Institution Requests Loaded: ${orgAppsData.applications?.length ?? 0} Applications`);
  } catch (err) {
    console.error("❌ Super Admin Test Error:", err.message);
    allPassed = false;
  }

  // 2. TEACHER VERIFICATION
  console.log("\n--- 2. VERIFYING TEACHER DASHBOARD FLOW ---");
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "teacher@apexuniv.edu", password: "password123" })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Teacher login failed: " + JSON.stringify(data));
    console.log(`✓ Teacher Authenticated: ${data.user.name} (${data.user.email}) | Role: ${data.user.role}`);

    const token = data.token;
    const headers = { Authorization: `Bearer ${token}` };

    const reportRes = await fetch(`${BASE_URL}/reports/teacher`, { headers });
    const reportData = await reportRes.json();
    if (!reportRes.ok) throw new Error("GET /reports/teacher failed: " + JSON.stringify(reportData));
    console.log(`✓ Teacher Report Loaded: ${reportData.report?.totalTests} Tests, ${reportData.report?.totalAttempts} Attempts, Avg: ${reportData.report?.avgScore}%`);

    const testsRes = await fetch(`${BASE_URL}/tests`, { headers });
    if (!testsRes.ok) throw new Error("GET /tests failed");
    console.log(`✓ Teacher Tests Accessible: 200 OK`);

    const batchesRes = await fetch(`${BASE_URL}/batches`, { headers });
    if (!batchesRes.ok) throw new Error("GET /batches failed");
    console.log(`✓ Course Batches Accessible: 200 OK`);

    const resultsRes = await fetch(`${BASE_URL}/results/organization`, { headers });
    if (!resultsRes.ok) throw new Error("GET /results/organization failed");
    console.log(`✓ Evaluation Results Accessible: 200 OK`);
  } catch (err) {
    console.error("❌ Teacher Test Error:", err.message);
    allPassed = false;
  }

  // 3. STUDENT VERIFICATION
  console.log("\n--- 3. VERIFYING STUDENT DASHBOARD FLOW ---");
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex@apexuniv.edu", password: "password123" })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Student login failed: " + JSON.stringify(data));
    console.log(`✓ Student Authenticated: ${data.user.name} (${data.user.email}) | Role: ${data.user.role}`);

    const token = data.token;
    const headers = { Authorization: `Bearer ${token}` };

    const availRes = await fetch(`${BASE_URL}/attempts/available-tests`, { headers });
    const availData = await availRes.json();
    if (!availRes.ok) throw new Error("GET /attempts/available-tests failed: " + JSON.stringify(availData));
    console.log(`✓ Available Tests Loaded: ${availData.tests?.length ?? 0} Published Tests`);

    const reportRes = await fetch(`${BASE_URL}/reports/student`, { headers });
    const reportData = await reportRes.json();
    if (!reportRes.ok) throw new Error("GET /reports/student failed: " + JSON.stringify(reportData));
    console.log(`✓ Student Analytics Loaded: Avg Score: ${reportData.report?.averageScore}%, Qualification Rate: ${reportData.report?.passRate}%`);

    const myAttemptsRes = await fetch(`${BASE_URL}/attempts/my-attempts`, { headers });
    if (!myAttemptsRes.ok) throw new Error("GET /attempts/my-attempts failed");
    console.log(`✓ Student Attempt History Accessible: 200 OK`);
  } catch (err) {
    console.error("❌ Student Test Error:", err.message);
    allPassed = false;
  }

  console.log("\n===============================================================");
  if (allPassed) {
    console.log("🎉 ALL ROLE DASHBOARDS AND API FLOWS VERIFIED 100% SUCCESSFUL!");
  } else {
    console.log("❌ SOME TESTS FAILED");
  }
  console.log("===============================================================\n");

  process.exit(allPassed ? 0 : 1);
}

verifyAllRoleDashboards();
