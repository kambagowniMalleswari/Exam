// Test Teacher and Student API endpoints and data shapes

async function testTeacherAndStudent() {
  console.log("=== TESTING TEACHER & STUDENT AUTH & DASHBOARD FLOWS ===\n");

  // 1. Teacher Test
  console.log("1. Logging in as Teacher (teacher@apexuniv.edu)...");
  const teacherLogin = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "teacher@apexuniv.edu", password: "password123" })
  });
  const teacherData = await teacherLogin.json();
  console.log("Teacher Login Status:", teacherLogin.status, {
    role: teacherData.user?.role,
    org: teacherData.user?.organizationId
  });

  const teacherToken = teacherData.token;
  const teacherHeaders = { Authorization: `Bearer ${teacherToken}` };

  console.log("\nTeacher Endpoints:");
  const tReport = await fetch("http://localhost:5000/api/reports/teacher", { headers: teacherHeaders });
  console.log("GET /api/reports/teacher:", tReport.status, await tReport.json());

  const tTests = await fetch("http://localhost:5000/api/tests", { headers: teacherHeaders });
  console.log("GET /api/tests:", tTests.status);

  const tBatches = await fetch("http://localhost:5000/api/batches", { headers: teacherHeaders });
  console.log("GET /api/batches:", tBatches.status);

  const tResults = await fetch("http://localhost:5000/api/results/organization", { headers: teacherHeaders });
  console.log("GET /api/results/organization:", tResults.status);

  // 2. Student Test
  console.log("\n2. Logging in as Student (alex@apexuniv.edu)...");
  const studentLogin = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "alex@apexuniv.edu", password: "password123" })
  });
  const studentData = await studentLogin.json();
  console.log("Student Login Status:", studentLogin.status, {
    role: studentData.user?.role,
    org: studentData.user?.organizationId,
    batch: studentData.user?.batchId
  });

  const studentToken = studentData.token;
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  console.log("\nStudent Endpoints:");
  const sAvail = await fetch("http://localhost:5000/api/attempts/available-tests", { headers: studentHeaders });
  console.log("GET /api/attempts/available-tests:", sAvail.status, await sAvail.json());

  const sReport = await fetch("http://localhost:5000/api/reports/student", { headers: studentHeaders });
  console.log("GET /api/reports/student:", sReport.status, await sReport.json());

  const sMyAttempts = await fetch("http://localhost:5000/api/attempts/my-attempts", { headers: studentHeaders });
  console.log("GET /api/attempts/my-attempts:", sMyAttempts.status);

  // 3. Super Admin Platform endpoints
  console.log("\n3. Testing Super Admin Platform Dashboard Endpoints...");
  const superLogin = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "kambagownikmalleswari@gmail.com", password: "Admin@12345" })
  });
  const superData = await superLogin.json();
  const superToken = superData.token;
  const superHeaders = { Authorization: `Bearer ${superToken}` };

  const superReport = await fetch("http://localhost:5000/api/reports/platform", { headers: superHeaders });
  console.log("GET /api/reports/platform:", superReport.status, await superReport.json());

  const superOrgs = await fetch("http://localhost:5000/api/organizations", { headers: superHeaders });
  console.log("GET /api/organizations:", superOrgs.status);

  process.exit(0);
}

testTeacherAndStudent().catch(console.error);
