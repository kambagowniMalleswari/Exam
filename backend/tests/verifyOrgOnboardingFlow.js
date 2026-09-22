// Verification script for Organization Onboarding & Super Admin Requests Flow

const BASE_URL = "http://localhost:5000/api";

async function verifyFlow() {
  console.log("==================================================");
  console.log("VERIFYING ORG ONBOARDING & SUPER ADMIN FLOW");
  console.log("==================================================");

  // 1. Super Admin Login
  console.log("\n1. Logging in as Super Admin...");
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "kambagownikmalleswari@gmail.com", password: "Admin@12345" })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error("Super admin login failed: " + JSON.stringify(loginData));
  console.log(`✓ Authenticated as: ${loginData.user.name} | Role: ${loginData.user.role} | OrgId: ${loginData.user.organizationId || "null (Global Authority)"}`);

  const token = loginData.token;
  const headers = { Authorization: `Bearer ${token}` };

  // 2. Fetch Pending Org Applications
  console.log("\n2. Fetching pending org applications...");
  const pendingRes = await fetch(`${BASE_URL}/org-applications?status=pending`, { headers });
  const pendingData = await pendingRes.json();
  console.log(`✓ Pending applications count: ${pendingData.count}`);
  pendingData.applications.forEach(a => {
    console.log(`  - Institution: "${a.name}" | Type: ${a.type} | Contact: ${a.adminName} (${a.email}) | Status: ${a.status}`);
  });

  // 3. Test non-blocking apply API with dummy organization
  const dummyEmail = `test_inst_${Date.now()}@sampledomain.edu`;
  console.log(`\n3. Testing non-blocking apply API with: ${dummyEmail}...`);
  const t0 = Date.now();
  const applyRes = await fetch(`${BASE_URL}/org-applications/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Speed Test Academy ${Date.now().toString().slice(-4)}`,
      type: "College",
      adminName: "Dean Adams",
      email: dummyEmail,
      phone: "9876543210",
      city: "Bangalore",
      state: "Karnataka",
      expectedStudents: "101-500"
    })
  });
  const tDuration = Date.now() - t0;
  const applyData = await applyRes.json();
  if (!applyRes.ok) throw new Error("Apply failed: " + JSON.stringify(applyData));
  console.log(`✓ Onboarding application responded in ${tDuration}ms! (Status: ${applyRes.status})`);
  console.log(`  Message: "${applyData.message}"`);

  // 4. Check that new pending application immediately shows in list
  console.log("\n4. Verifying immediate visibility for Super Admin...");
  const updatedPendingRes = await fetch(`${BASE_URL}/org-applications?status=pending`, { headers });
  const updatedPendingData = await updatedPendingRes.json();
  console.log(`✓ Updated pending count: ${updatedPendingData.count}`);
  const found = updatedPendingData.applications.find(a => a.email === dummyEmail);
  if (!found) throw new Error("Newly created application not found in pending list!");
  console.log(`✓ Newly submitted application "${found.name}" is immediately visible in pending verification!`);

  console.log("\n==================================================");
  console.log("ALL VERIFICATION CHECKS PASSED PERFECTLY!");
  console.log("==================================================");
}

verifyFlow().catch(err => {
  console.error("Verification failed:", err.message);
  process.exit(1);
});
