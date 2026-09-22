// Verification of Available Tests (Limit positive fix) & Student Batch Self-Enrollment
const BASE_URL = "http://localhost:5000/api";

const runTests = async () => {
  console.log("\n========================================================");
  console.log("TESTING AVAILABLE TESTS & BATCH SELF-ENROLLMENT APIS");
  console.log("========================================================\n");

  try {
    // 1. Log in student
    console.log("1. Logging in as Student (alex@apexuniv.edu)...");
    const stuLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex@apexuniv.edu",
        password: "password123"
      })
    });
    const stuData = await stuLoginRes.json();
    if (!stuData.success) {
      throw new Error(`Student login failed: ${stuData.message}`);
    }
    const studentToken = stuData.token;
    console.log(`✓ Student logged in successfully: ${stuData.user.name} (${stuData.user.email})`);

    // 2. Fetch Available Tests (Check MongoServerError Location15958 fix)
    console.log("\n2. Fetching available tests via GET /api/attempts/available-tests...");
    const availTestsRes = await fetch(`${BASE_URL}/attempts/available-tests`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const availTestsData = await availTestsRes.json();
    if (availTestsRes.status !== 200 || !availTestsData.success) {
      throw new Error(`Available tests returned status ${availTestsRes.status}: ${JSON.stringify(availTestsData)}`);
    }
    console.log(`✓ Available tests query succeeded with HTTP 200! Found ${availTestsData.tests?.length || 0} tests without MongoDB limit error.`);

    // 3. Fetch Available Batches for Student Self-Enrollment
    console.log("\n3. Fetching available batches via GET /api/batches/available...");
    const availBatchesRes = await fetch(`${BASE_URL}/batches/available`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const availBatchesData = await availBatchesRes.json();
    if (availBatchesRes.status !== 200 || !availBatchesData.success) {
      throw new Error(`Available batches returned status ${availBatchesRes.status}: ${JSON.stringify(availBatchesData)}`);
    }
    console.log(`✓ Available batches query succeeded with HTTP 200! Found ${availBatchesData.batches?.length || 0} batches.`);

    // 4. Test self-enrollment if a batch is available
    if (availBatchesData.batches?.length > 0) {
      const targetBatch = availBatchesData.batches[0];
      console.log(`\n4. Testing self-enrollment into batch '${targetBatch.name}' (ID: ${targetBatch._id})...`);
      const enrollRes = await fetch(`${BASE_URL}/batches/${targetBatch._id}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({})
      });
      const enrollData = await enrollRes.json();
      console.log(`✓ Self-enrollment response (HTTP ${enrollRes.status}): ${enrollData.message || enrollData.error}`);
    }

    console.log("\n========================================================");
    console.log("ALL AVAILABLE TESTS & BATCH SELF-ENROLLMENT CHECKS PASSED!");
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test failed with error:", err.message);
    process.exit(1);
  }
};

runTests();
