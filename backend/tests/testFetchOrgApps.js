async function testFetch() {
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "kambagownikmalleswari@gmail.com", password: "Admin@12345" })
  });
  const { token, user } = await loginRes.json();
  console.log("Logged in:", user.name, user.role);

  const pendingRes = await fetch("http://localhost:5000/api/org-applications?status=pending", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const pendingData = await pendingRes.json();
  console.log("Pending org applications in API:", pendingData.count);
  console.log(JSON.stringify(pendingData.applications, null, 2));
}

testFetch().catch(console.error);
