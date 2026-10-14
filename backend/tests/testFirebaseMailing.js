// Automated Test Script for Firebase Mailing System
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  sendFirebasePasswordReset,
  getFirebaseConfigStatus,
  testFirebaseEmailDelivery
} from "../services/firebaseMailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runFirebaseEmailTest() {
  console.log("=================================================");
  console.log("🔥 AssessIQ Firebase Mailing System - Diagnostic Test");
  console.log("=================================================");

  const config = getFirebaseConfigStatus();
  console.log("1. Checking Firebase Configuration:");
  console.log("   - Provider:", config.provider);
  console.log("   - Project ID:", config.projectId);
  console.log("   - Auth Domain:", config.authDomain);
  console.log("   - API Key Status:", config.apiKeyMasked);
  console.log("   - Configured:", config.configured ? "✅ YES" : "❌ NO");

  if (!config.configured) {
    console.error("❌ Firebase is not properly configured. Check FIREBASE_API_KEY in .env");
    process.exit(1);
  }

  const testRecipient = process.env.EMAIL_USER || "kambagownikmalleswari@gmail.com";
  console.log(`\n2. Testing Firebase Email Dispatch to: ${testRecipient}`);

  const startTime = Date.now();
  const testReport = await testFirebaseEmailDelivery(testRecipient);
  const totalDuration = Date.now() - startTime;

  console.log("3. Test Result:");
  console.log("   - Status:", testReport.status === "SUCCESS" ? "✅ SUCCESS" : "❌ FAILED");
  console.log("   - Time Elapsed:", `${totalDuration}ms`);
  console.log("   - Target Email:", testReport.targetEmail);

  if (testReport.status === "SUCCESS") {
    console.log("   - Delivery Details:", JSON.stringify(testReport.result, null, 2));
    console.log("\n🎉 TEST PASSED: Firebase successfully dispatched email through Google infrastructure!");
  } else {
    console.error("   - Error Details:", testReport.error);
    process.exit(1);
  }
}

runFirebaseEmailTest().catch((err) => {
  console.error("Fatal Test Exception:", err);
  process.exit(1);
});
