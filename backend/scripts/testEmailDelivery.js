import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

import { sendEmail, sendAccountCredentialsEmail } from "../utils/sendEmail.js";

async function runDiagnostics() {
  console.log("==================================================");
  console.log("       AssessIQ Email Diagnostics & Tester        ");
  console.log("==================================================");

  console.log("Active Environment Configuration:");
  console.log("• EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "(none)");
  console.log("• EMAIL_USER:", process.env.EMAIL_USER || "(none)");
  console.log("• EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "****** (Set)" : "(none)");
  console.log("• BREVO_API_KEY:", process.env.BREVO_API_KEY ? "****** (Set - Port 443 HTTPS)" : "(none - recommended for Render)");
  console.log("• RESEND_API_KEY:", process.env.RESEND_API_KEY ? "****** (Set - Port 443 HTTPS)" : "(none - recommended for Render)");
  console.log("• SUPER_ADMIN_EMAIL:", process.env.SUPER_ADMIN_EMAIL || "(none)");
  console.log("--------------------------------------------------");

  const targetEmail = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || process.env.EMAIL_USER;

  if (!targetEmail) {
    console.error("❌ Error: No target email provided to test.");
    console.log("Usage: node scripts/testEmailDelivery.js <recipient@example.com>");
    process.exit(1);
  }

  console.log(`Sending test credentials email to: ${targetEmail} ...`);
  const result = await sendAccountCredentialsEmail({
    to: targetEmail,
    name: "Platform Test User",
    email: targetEmail,
    password: "TestPassword#2026!",
    role: "Faculty / Teacher",
    orgName: "AssessIQ University",
    loginUrl: "https://assess-iq.web.app/admin/login"
  });

  console.log("--------------------------------------------------");
  console.log("Result:", result);
  console.log("==================================================");

  if (result.success && result.real) {
    console.log(`✅ Success! Real email delivered via provider: ${result.provider || "smtp"}`);
  } else if (result.simulated) {
    console.log("⚠️ Notice: Email was simulated because credentials are not configured.");
  } else {
    console.log("❌ Email delivery failed or returned an error.");
  }

  process.exit(0);
}

runDiagnostics().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
