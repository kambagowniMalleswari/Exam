// Email notification utility with real Nodemailer support and graceful fallback
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

/**
 * Send an email notification.
 * Supports:
 *  - Gmail directly (EMAIL_SERVICE=gmail or auto-detected when EMAIL_USER contains @gmail.com)
 *  - Generic SMTP (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD)
 *  - Structured console fallback when credentials are not configured or during connection tests.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const {
      EMAIL_SERVICE,
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASSWORD,
      EMAIL_PASS,
      EMAIL_FROM
    } = process.env;

    const userEmail = EMAIL_USER || "kambagownikmalleswari@gmail.com";
    const password = EMAIL_PASSWORD || EMAIL_PASS;

    if (!to) {
      console.warn("[Email Notification] Skipped: No recipient provided.");
      return { success: false, reason: "No recipient provided" };
    }

    // Check if password/credentials are configured for real dispatch
    if (password) {
      try {
        let transporterConfig;

        if (EMAIL_SERVICE === "gmail" || userEmail.endsWith("@gmail.com")) {
          transporterConfig = {
            service: "gmail",
            auth: {
              user: userEmail,
              pass: password
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 10000
          };
        } else if (EMAIL_HOST) {
          const port = Number(EMAIL_PORT) || 587;
          transporterConfig = {
            host: EMAIL_HOST,
            port,
            secure: port === 465,
            auth: {
              user: userEmail,
              pass: password
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 10000
          };
        }

        if (transporterConfig) {
          const transporter = nodemailer.createTransport(transporterConfig);

          const fromAddress = EMAIL_FROM || `"AssessIQ Platform" <${userEmail}>`;

          const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject,
            text,
            html: html || text?.replace(/\n/g, "<br/>")
          });

          console.log(`[Real Email Sent] Message ID: ${info.messageId} to: ${to} (Subject: "${subject}")`);
          return { success: true, messageId: info.messageId, real: true };
        }
      } catch (nodemailerErr) {
        console.warn("[Real Email Dispatch Failed - Falling back to log]:", nodemailerErr.message);
      }
    }

    // Fallback: Structured console logging with real-time payload
    console.log("==================================================");
    console.log(`[EMAIL DISPATCH - SIMULATED / FALLBACK]`);
    console.log(`Sender: ${userEmail}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text}`);
    console.log("==================================================");

    return {
      success: true,
      simulated: true,
      note: "SMTP credentials not provided in .env (set EMAIL_PASSWORD to Google App Password for live dispatch)."
    };
  } catch (error) {
    console.error("[Email Notification Error]:", error.message);
    return { success: false, error: error.message };
  }
};

export default sendEmail;
