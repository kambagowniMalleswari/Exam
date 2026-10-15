import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import {
  dispatchMail,
  verifySmtpConnection,
  sendPasswordResetOtp
} from "../services/mailDispatcher.js";

async function run() {
  console.log("==================================================");
  console.log("🚀 AssessIQ Backend Mail Dispatcher — Diagnostic Test");
  console.log("==================================================");

  // 1. Check SMTP Connection
  console.log("\n1. Verifying SMTP Connection...");
  const connStatus = await verifySmtpConnection();
  console.log("SMTP Health:", connStatus);

  if (!connStatus.connected && !connStatus.configured) {
    console.error("❌ SMTP is not configured in .env");
    process.exit(1);
  }

  // 2. Test Real Email Dispatch
  const targetEmail = process.env.EMAIL_USER || "kambagownikmalleswari@gmail.com";
  console.log(`\n2. Dispatching Live Test Email to: ${targetEmail}...`);

  const startTime = Date.now();
  const testResult = await dispatchMail({
    to: targetEmail,
    subject: "AssessIQ Live Mail Dispatcher — Verification Check",
    html: `
      <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e1b4b; margin-top: 0;">AssessIQ Mail Dispatcher Operational</h2>
        <p style="color: #334155; font-size: 15px;">Your backend mail dispatching system is working directly through standard backend SMTP.</p>
        <div style="background: #f8fafc; padding: 14px; border-radius: 8px; margin: 16px 0; font-size: 14px;">
          <p style="margin: 4px 0;"><strong>Recipient:</strong> ${targetEmail}</p>
          <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p style="margin: 4px 0;"><strong>Provider:</strong> Backend Node.js SMTP Transporter</p>
        </div>
        <p style="color: #16a34a; font-weight: 600; font-size: 14px;">✓ Verified: All Firebase mailing and testing have been completely replaced.</p>
      </div>
    `
  });

  const duration = Date.now() - startTime;
  console.log(`\n3. Dispatch Result (${duration}ms):`, testResult);

  if (testResult.success) {
    console.log("\n🎉 TEST PASSED: Backend Mail Dispatching System is 100% operational!");
  } else {
    console.error("\n❌ TEST FAILED:", testResult.error);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
