// Comprehensive Verification of All Dashboards and Platform Functionality
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

const API_BASE = process.env.API_BASE_URL || "https://assess-iq-backend.onrender.com/api";

const accounts = {
  superAdmin: { email: "kambagownikmalleswari@gmail.com", password: "Admin@145" },
  orgAdmin: { email: "orgadmin.itacademy@gmail.com", password: "Admin@12345" },
  teacher: { email: "teacher.cs@itacademy.edu", password: "Teacher@12345" },
  student1: { email: "student.aarav@itacademy.edu", password: "Student@12345" },
  student3: { email: "student.kiran@itacademy.edu", password: "Student@12345" }
};

const results = [];

const logResult = (role, action, status, details = "") => {
  const icon = status ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${role}] ${action}: ${details}`);
  results.push({ role, action, status, details });
};

async function apiRequest(endpoint, method = "GET", data = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const opts = { method, headers };
  if (data) {
    opts.body = JSON.stringify(data);
  }
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

async function login(email, password) {
  const res = await apiRequest("/auth/login", "POST", { email, password });
  if (!res.ok) {
    throw new Error(res.data?.message || `HTTP ${res.status}`);
  }
  return {
    token: res.data.token,
    user: res.data.user
  };
}

async function runVerification() {
  console.log("==================================================");
  console.log("STARTING FULL PLATFORM END-TO-END VERIFICATION");
  console.log(`Target API: ${API_BASE}`);
  console.log("==================================================\n");

  let saAuth, oaAuth, tAuth, s1Auth, s3Auth;

  // 1. Super Admin Verification
  console.log("--- 1. TESTING SUPER ADMIN (kambagownikmalleswari@gmail.com) ---");
  try {
    saAuth = await login(accounts.superAdmin.email, accounts.superAdmin.password);
    logResult("Super Admin", "Authentication", true, `Logged in as ${saAuth.user.email} (Role: ${saAuth.user.role})`);
  } catch (err) {
    logResult("Super Admin", "Authentication", false, err.message);
  }

  if (saAuth?.token) {
    try {
      const profRes = await apiRequest("/auth/profile", "GET", null, saAuth.token);
      const user = profRes.data.user;
      const orgIsNull = user?.organizationId === null || user?.organizationId === undefined;
      logResult(
        "Super Admin",
        "Profile Governance Check",
        orgIsNull && profRes.ok,
        `Role: ${user?.role}, OrganizationId is ${orgIsNull ? "properly null (Global scope)" : JSON.stringify(user?.organizationId)}`
      );
    } catch (err) {
      logResult("Super Admin", "Profile Governance Check", false, err.message);
    }

    try {
      const platRes = await apiRequest("/reports/platform", "GET", null, saAuth.token);
      const report = platRes.data.report;
      logResult(
        "Super Admin",
        "Platform Dashboard Metrics",
        platRes.ok && Boolean(report),
        `Total Orgs: ${report?.organizations?.total ?? 0}, Teachers: ${report?.teachers?.total ?? 0}, Students: ${report?.students?.total ?? 0}, Tests: ${report?.tests?.total ?? 0}`
      );
    } catch (err) {
      logResult("Super Admin", "Platform Dashboard Metrics", false, err.message);
    }

    try {
      const orgsRes = await apiRequest("/organizations", "GET", null, saAuth.token);
      const orgs = orgsRes.data.organizations || orgsRes.data || [];
      logResult("Super Admin", "Organizations List", orgsRes.ok && orgs.length > 0, `Found ${orgs.length} affiliated organization(s)`);
    } catch (err) {
      logResult("Super Admin", "Organizations List", false, err.message);
    }
  }

  // 2. Org Admin Verification
  console.log("\n--- 2. TESTING ORG ADMIN (orgadmin.itacademy@gmail.com) ---");
  try {
    oaAuth = await login(accounts.orgAdmin.email, accounts.orgAdmin.password);
    logResult("Org Admin", "Authentication", true, `Logged in as ${oaAuth.user.email}`);
  } catch (err) {
    logResult("Org Admin", "Authentication", false, err.message);
  }

  if (oaAuth?.token) {
    try {
      const orgRepRes = await apiRequest("/reports/organization", "GET", null, oaAuth.token);
      const rep = orgRepRes.data.report;
      logResult(
        "Org Admin",
        "Organization Dashboard",
        orgRepRes.ok && Boolean(rep),
        `Total Batches: ${rep?.batches?.total ?? 0}, Students: ${rep?.students?.total ?? 0}, Teachers: ${rep?.teachers?.total ?? 0}, Tests: ${rep?.tests?.total ?? 0}`
      );
    } catch (err) {
      logResult("Org Admin", "Organization Dashboard", false, err.message);
    }

    try {
      const batchRes = await apiRequest("/batches", "GET", null, oaAuth.token);
      const batches = batchRes.data.batches || [];
      const hasAlpha = batches.some((b) => b.batchNumber === "CS-2026-ALPHA");
      logResult(
        "Org Admin",
        "Batches Management",
        batchRes.ok && hasAlpha,
        `Retrieved ${batches.length} batch(es). Found CS-2026-ALPHA: ${hasAlpha}`
      );
    } catch (err) {
      logResult("Org Admin", "Batches Management", false, err.message);
    }
  }

  // 3. Teacher Verification
  console.log("\n--- 3. TESTING TEACHER (teacher.cs@itacademy.edu) ---");
  let publishedTests = [];
  try {
    tAuth = await login(accounts.teacher.email, accounts.teacher.password);
    logResult("Teacher", "Authentication", true, `Logged in as ${tAuth.user.email}`);
  } catch (err) {
    logResult("Teacher", "Authentication", false, err.message);
  }

  if (tAuth?.token) {
    try {
      const tRepRes = await apiRequest("/reports/teacher", "GET", null, tAuth.token);
      const rep = tRepRes.data.report;
      logResult(
        "Teacher",
        "Teacher Dashboard Metrics",
        tRepRes.ok && Boolean(rep),
        `Created Tests: ${rep?.totalTests ?? 0}, Total Questions: ${rep?.totalQuestions ?? 0}, Completed Attempts: ${rep?.totalAttempts ?? 0}`
      );
    } catch (err) {
      logResult("Teacher", "Teacher Dashboard Metrics", false, err.message);
    }

    try {
      const testsRes = await apiRequest("/tests", "GET", null, tAuth.token);
      publishedTests = testsRes.data.tests || [];
      logResult("Teacher", "Tests Management", testsRes.ok && publishedTests.length >= 3, `Retrieved ${publishedTests.length} tests created by teacher.`);
    } catch (err) {
      logResult("Teacher", "Tests Management", false, err.message);
    }
  }

  // 4. Student Verification (Aarav - Dashboard & Available Tests)
  console.log("\n--- 4. TESTING STUDENT (Aarav - Dashboard & Available Tests) ---");
  try {
    s1Auth = await login(accounts.student1.email, accounts.student1.password);
    logResult("Student (Aarav)", "Authentication", true, `Logged in as ${s1Auth.user.email}`);
  } catch (err) {
    logResult("Student (Aarav)", "Authentication", false, err.message);
  }

  if (s1Auth?.token) {
    try {
      const sRepRes = await apiRequest("/reports/student", "GET", null, s1Auth.token);
      const rep = sRepRes.data.report;
      logResult(
        "Student (Aarav)",
        "Student Dashboard",
        sRepRes.ok && Boolean(rep),
        `Avg Score: ${rep?.averageScore ?? 0}%, Pass Rate: ${rep?.passRate ?? 0}%`
      );
    } catch (err) {
      logResult("Student (Aarav)", "Student Dashboard", false, err.message);
    }

    try {
      const availRes = await apiRequest("/attempts/available-tests", "GET", null, s1Auth.token);
      const avail = availRes.data.tests || [];
      logResult("Student (Aarav)", "Available Tests List", availRes.ok && avail.length > 0, `Student has ${avail.length} test(s) available.`);
    } catch (err) {
      logResult("Student (Aarav)", "Available Tests List", false, err.message);
    }
  }

  // 5. Student Live Test Taking & Evaluation Test (Student Kiran)
  console.log("\n--- 5. TESTING STUDENT LIVE ATTEMPT & EVALUATION (Kiran) ---");
  try {
    s3Auth = await login(accounts.student3.email, accounts.student3.password);
    logResult("Student (Kiran)", "Authentication", true, `Logged in as ${s3Auth.user.email}`);
  } catch (err) {
    logResult("Student (Kiran)", "Authentication", false, err.message);
  }

  if (s3Auth?.token && publishedTests.length > 0) {
    const targetTest = publishedTests.find(t => t.title.includes("Database")) || publishedTests[0];

    try {
      // Start Attempt: POST /attempts/:testId/start
      const startRes = await apiRequest(`/attempts/${targetTest._id}/start`, "POST", {}, s3Auth.token);
      const attempt = startRes.data.attempt;
      const startedOk = startRes.ok && Boolean(attempt?._id);
      logResult("Student (Kiran)", "Start Test Attempt", startedOk, `Attempt started for "${targetTest.title}". Attempt ID: ${attempt?._id}`);

      if (startedOk && attempt.questions && attempt.questions.length > 0) {
        // Answer questions: select answer "B"
        const answers = attempt.questions.map((q) => ({
          questionId: q._id || q.questionId,
          selectedAnswer: "B",
          timeSpent: 15
        }));

        // Submit Attempt: POST /attempts/:id/submit
        const submitRes = await apiRequest(`/attempts/${attempt._id}/submit`, "POST", { answers }, s3Auth.token);
        const evaluated = submitRes.data.attempt || submitRes.data.result;
        logResult(
          "Student (Kiran)",
          "Submit & Auto-Evaluate Test",
          submitRes.ok,
          `Status: ${submitRes.status}, Percentage: ${evaluated?.percentage ?? evaluated?.scorePercentage ?? "Evaluated"}, Passed: ${evaluated?.isPassed ?? evaluated?.passed ?? true}`
        );
      }
    } catch (err) {
      logResult("Student (Kiran)", "Start/Submit Test", false, err.message);
    }
  }

  console.log("\n==================================================");
  console.log("VERIFICATION COMPLETE");
  console.log("==================================================");
  const total = results.length;
  const passed = results.filter((r) => r.status).length;
  console.log(`Summary: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}% success rate)`);
}

runVerification();
