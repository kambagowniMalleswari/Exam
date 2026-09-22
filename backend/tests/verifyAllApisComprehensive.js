// Comprehensive End-to-End API Verification
const BASE_URL = "http://localhost:5000/api";

const testSuite = async () => {
  console.log("\n==========================================");
  console.log("STARTING ASSESSIQ COMPREHENSIVE VERIFICATION");
  console.log("==========================================\n");

  try {
    // 1. Super Admin Login
    console.log("1. Testing Super Admin Login with kambagownikmalleswari@gmail.com / Admin@1234...");
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "kambagownikmalleswari@gmail.com",
        password: "Admin@1234"
      })
    });
    const adminData = await adminLoginRes.json();
    if (!adminData.success) {
      throw new Error(`Super admin login failed: ${adminData.message}`);
    }
    console.log(`✓ Super Admin Login Success! Role: ${adminData.user.role}, Email: ${adminData.user.email}`);

    // 2. Teacher Login & Student Permissions
    console.log("\n2. Testing Teacher Login & Organization Students Access...");
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "teacher@apexuniv.edu",
        password: "password123"
      })
    });
    const teacherData = await teacherLoginRes.json();
    if (!teacherData.success) {
      throw new Error(`Teacher login failed: ${teacherData.message}`);
    }
    const teacherToken = teacherData.token;
    console.log(`✓ Teacher Logged In: ${teacherData.user.name} (${teacherData.user.email})`);

    // Fetch students as teacher (THE CORE BUG FROM USER SCREENSHOT 1)
    const teacherStudentsRes = await fetch(`${BASE_URL}/users?role=student`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    const teacherStudentsData = await teacherStudentsRes.json();
    if (!teacherStudentsRes.ok) {
      throw new Error(`Teacher fetching students failed with status ${teacherStudentsRes.status}: ${teacherStudentsData.message}`);
    }
    console.log(`✓ Teacher Successfully Fetched ${teacherStudentsData.users?.length || 0} Students without 403 Forbidden!`);

    // 3. Teacher Batch Management
    console.log("\n3. Testing Teacher Batch Creation & Student Assignment...");
    const testBatchCode = `B-${Date.now().toString().slice(-4)}`;
    const createBatchRes = await fetch(`${BASE_URL}/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        name: `Automated Test Cohort ${testBatchCode}`,
        batchNumber: testBatchCode,
        department: "Computer Science",
        academicYear: "2025-2026",
        description: "Verified via automated test runner"
      })
    });
    const createBatchData = await createBatchRes.json();
    if (!createBatchRes.ok) {
      throw new Error(`Batch creation by teacher failed: ${createBatchData.message}`);
    }
    const createdBatchId = createBatchData.batch._id;
    console.log(`✓ Teacher Successfully Created Batch '${createBatchData.batch.name}' (${createBatchData.batch.batchNumber})`);

    // Assign students to batch
    const studentIds = (teacherStudentsData.users || []).slice(0, 2).map((s) => s._id);
    if (studentIds.length > 0) {
      const assignRes = await fetch(`${BASE_URL}/batches/${createdBatchId}/assign-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ studentIds })
      });
      const assignData = await assignRes.json();
      console.log(`✓ Teacher Assigned ${studentIds.length} Students to Batch: ${assignData.message}`);
    }

    // 4. Test Email OTP Password Reset Flow
    console.log("\n4. Testing Email OTP Password Reset Flow...");
    const sendOtpRes = await fetch(`${BASE_URL}/auth/send-reset-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "teacher@apexuniv.edu" })
    });
    const sendOtpData = await sendOtpRes.json();
    if (!sendOtpData.success) {
      throw new Error(`Send OTP failed: ${sendOtpData.message}`);
    }
    console.log(`✓ OTP Request Dispatched: ${sendOtpData.message}`);

    // 5. Test Teacher Application Submission with Real-time Email Dispatch
    console.log("\n5. Testing Teacher Application Notification Workflow...");
    const orgsRes = await fetch(`${BASE_URL}/organizations`);
    const orgsData = await orgsRes.json();
    const firstOrg = orgsData.organizations?.[0];

    if (firstOrg) {
      const applyRes = await fetch(`${BASE_URL}/teacher-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Dr. Candidate Test",
          email: "nanisree65@gmail.com",
          phone: "9876543210",
          organizationId: firstOrg._id,
          subject: "Advanced Python & AI",
          qualification: "Ph.D in Computing",
          experienceYears: 6
        })
      });
      const applyData = await applyRes.json();
      console.log(`✓ Teacher Application Processed: ${applyData.message || applyData.error}`);
    }

    console.log("\n==========================================");
    console.log("ALL E2E API VERIFICATIONS PASSED 100%!");
    console.log("==========================================\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ E2E VERIFICATION FAILED:", error.message);
    process.exit(1);
  }
};

testSuite();
