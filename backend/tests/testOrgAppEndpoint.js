async function testApi() {
  // 1. Check Super Admin GET /api/org-applications
  console.log("Logging in as Super Admin...");
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "kambagownikmalleswari@gmail.com",
      password: "Admin@12345"
    })
  });
  const loginData = await loginRes.json();
  console.log("Super Admin Login Response:", loginRes.status, loginData.user?.role);
  const token = loginData.token;

  console.log("\nFetching Org Applications as Super Admin (status=pending)...");
  const pendingRes = await fetch("http://localhost:5000/api/org-applications?status=pending", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const pendingData = await pendingRes.json();
  console.log("Pending Applications response:", pendingRes.status, JSON.stringify(pendingData, null, 2));

  console.log("\nFetching ALL Org Applications as Super Admin...");
  const allRes = await fetch("http://localhost:5000/api/org-applications", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const allData = await allRes.json();
  console.log("All Applications response:", allRes.status, JSON.stringify(allData, null, 2));

  console.log("\nTesting apply with mahiharish6@gmail.com...");
  const applyRes = await fetch("http://localhost:5000/api/org-applications/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Capgemini",
      type: "Corporate",
      adminName: "Kumar",
      email: "mahiharish6@gmail.com",
      phone: "9876543210"
    })
  });
  const applyData = await applyRes.json();
  console.log("Apply response:", applyRes.status, JSON.stringify(applyData, null, 2));
}

testApi().catch(console.error);
