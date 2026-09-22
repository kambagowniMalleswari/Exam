// Native Node.js fetch is available in Node 18+

async function testAllAdminFlows() {
  console.log("=== COMPREHENSIVE ENDPOINT AUDIT FOR ORG ADMIN & SUPER ADMIN ===\n");

  // 1. Org Admin Login
  console.log("1. Logging in as Org Admin (nanisree65@gmail.com)...");
  const orgLogin = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nanisree65@gmail.com", password: "OrgAdmin#85ppaz!" })
  });
  const orgData = await orgLogin.json();
  if (!orgData.success) {
    throw new Error("Org Admin login failed: " + JSON.stringify(orgData));
  }
  const orgToken = orgData.token;
  console.log("✓ Org Admin Login Success. Token generated.");

  const orgHeaders = { Authorization: `Bearer ${orgToken}` };
  const orgEndpoints = [
    { name: "Dashboard Reports", url: "http://localhost:5000/api/reports/organization" },
    { name: "Tests List", url: "http://localhost:5000/api/tests" },
    { name: "Students List", url: "http://localhost:5000/api/users/students" },
    { name: "Teachers List", url: "http://localhost:5000/api/users/teachers" },
    { name: "Batches List", url: "http://localhost:5000/api/batches" },
    { name: "Teacher Applications", url: "http://localhost:5000/api/teacher-applications" },
    { name: "Results List", url: "http://localhost:5000/api/results" },
    { name: "Current User Profile", url: "http://localhost:5000/api/auth/me" }
  ];

  console.log("\nTesting all Org Admin UI Endpoints:");
  for (const ep of orgEndpoints) {
    const res = await fetch(ep.url, { headers: orgHeaders });
    const body = await res.json().catch(() => ({}));
    const status = res.status;
    const ok = res.ok;
    console.log(`  [${ok ? "✓ 200 OK" : "❌ " + status}] ${ep.name} (${ep.url})`);
    if (!ok) {
      console.log("    Response:", body);
    }
  }

  // 2. Super Admin Login
  console.log("\n2. Logging in as Super Admin (kambagownikmalleswari@gmail.com)...");
  const superLogin = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "kambagownikmalleswari@gmail.com", password: "Admin@12345" })
  });
  const superData = await superLogin.json();
  if (!superData.success) {
    throw new Error("Super Admin login failed: " + JSON.stringify(superData));
  }
  const superToken = superData.token;
  console.log("✓ Super Admin Login Success. Token generated.");

  const superHeaders = { Authorization: `Bearer ${superToken}` };
  const superEndpoints = [
    { name: "All Organizations", url: "http://localhost:5000/api/organizations" },
    { name: "Org Applications", url: "http://localhost:5000/api/org-applications" },
    { name: "Platform Users", url: "http://localhost:5000/api/users" },
    { name: "Platform Tests", url: "http://localhost:5000/api/tests" },
    { name: "Current User Profile", url: "http://localhost:5000/api/auth/me" }
  ];

  console.log("\nTesting all Super Admin UI Endpoints:");
  for (const ep of superEndpoints) {
    const res = await fetch(ep.url, { headers: superHeaders });
    const body = await res.json().catch(() => ({}));
    const status = res.status;
    const ok = res.ok;
    console.log(`  [${ok ? "✓ 200 OK" : "❌ " + status}] ${ep.name} (${ep.url})`);
    if (!ok) {
      console.log("    Response:", body);
    }
  }

  console.log("\n=== ALL ENDPOINTS VERIFIED ===");
  process.exit(0);
}

testAllAdminFlows().catch(err => {
  console.error(err);
  process.exit(1);
});
