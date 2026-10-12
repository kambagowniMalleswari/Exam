async function checkFrontendAndBackend() {
  console.log("Checking frontend and backend connectivity...");

  try {
    const feRes = await fetch("http://localhost:5173/");
    const feText = await feRes.text();
    console.log("1. Frontend HTTP (port 5173):", feRes.status, feText.includes("root") ? "✅ Page HTML Loaded" : "❌ HTML Issue");
  } catch (err) {
    console.error("1. Frontend HTTP failed:", err.message);
  }

  try {
    const beRes = await fetch("http://localhost:5000/api/");
    const beData = await beRes.json();
    console.log("2. Backend Direct API (port 5000):", beRes.status, beData);
  } catch (err) {
    console.error("2. Backend Direct API failed:", err.message);
  }

  try {
    const proxyRes = await fetch("http://localhost:5173/api/");
    const proxyData = await proxyRes.json();
    console.log("3. Frontend Proxy to Backend (/api/):", proxyRes.status, proxyData);
  } catch (err) {
    console.error("3. Frontend Proxy failed:", err.message);
  }

  try {
    const superAdminEmail = "kambagownikmalleswari@gmail.com";
    const superAdminPassword = "Admin@145";

    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: superAdminEmail, password: superAdminPassword })
    });
    const loginData = await loginRes.json();
    console.log("4. Super Admin Login via Local Backend:", loginRes.status, loginData.success ? `✅ Authenticated as ${loginData.user?.role}` : "❌ Login Failed");

    if (loginData.token) {
      const orgAppRes = await fetch("http://localhost:5000/api/org-applications", {
        headers: { "Authorization": `Bearer ${loginData.token}` }
      });
      const orgAppData = await orgAppRes.json();
      console.log("5. Super Admin Fetch Org Applications:", orgAppRes.status, orgAppData.success ? `✅ Loaded ${orgAppData.count || orgAppData.applications?.length || 0} applications` : "❌ Failed");
    }
  } catch (err) {
    console.error("4/5. Auth check failed:", err.message);
  }

  process.exit(0);
}

checkFrontendAndBackend();
