import sendEmail from "../utils/sendEmail.js";

console.log("Testing sendEmail...");
const start = Date.now();
sendEmail({
  to: "test@example.com",
  subject: "AssessIQ Test Email",
  text: "This is a test email"
}).then(res => {
  console.log(`sendEmail completed in ${Date.now() - start}ms:`, res);
  process.exit(0);
}).catch(err => {
  console.error(`sendEmail failed in ${Date.now() - start}ms:`, err);
  process.exit(1);
});
