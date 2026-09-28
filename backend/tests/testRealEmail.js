import dotenv from "dotenv";
dotenv.config();
import { sendEmail } from "../utils/sendEmail.js";

async function run() {
  console.log("Testing sendEmail utility...");
  const result = await sendEmail({
    to: "kambagownikmalleswari@gmail.com",
    subject: "AssessIQ Test Email Verification",
    html: "<p>This is a test email to verify that Nodemailer can send emails from AssessIQ.</p>"
  });
  console.log("sendEmail result:", result);
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
