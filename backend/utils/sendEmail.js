// Email notification utility with real Nodemailer support and graceful fallback
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded reliably regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

// Cached singleton transporter instance for connection pooling
let cachedTransporter = null;
let cachedTransporterKey = "";

const getTransporter = () => {
  const {
    EMAIL_SERVICE,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASSWORD,
    EMAIL_PASS
  } = process.env;

  const userEmail = (EMAIL_USER || "kambagownikmalleswari@gmail.com").trim();
  // Strip spaces from Google App Password (e.g. "jyfp phcx bpox ruzc" -> "jyfpphcxbpoxruzc")
  const password = (EMAIL_PASSWORD || EMAIL_PASS || "").trim().replace(/\s+/g, "");

  if (!password) {
    return null;
  }

  const configKey = `${EMAIL_SERVICE}_${EMAIL_HOST}_${EMAIL_PORT}_${userEmail}_${password}`;
  if (cachedTransporter && cachedTransporterKey === configKey) {
    return cachedTransporter;
  }

  let transporterConfig = null;

  if (EMAIL_SERVICE === "gmail" || userEmail.endsWith("@gmail.com")) {
    transporterConfig = {
      service: "gmail",
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: userEmail,
        pass: password
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    };
  } else if (EMAIL_HOST) {
    const port = Number(EMAIL_PORT) || 587;
    transporterConfig = {
      host: EMAIL_HOST,
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: userEmail,
        pass: password
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    };
  }

  if (transporterConfig) {
    cachedTransporter = nodemailer.createTransport(transporterConfig);
    cachedTransporterKey = configKey;
  }

  return cachedTransporter;
};

/**
 * Base email sending function.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const { EMAIL_USER, EMAIL_FROM } = process.env;
    const userEmail = (EMAIL_USER || "kambagownikmalleswari@gmail.com").trim();

    if (!to) {
      console.warn("[Email Notification] Skipped: No recipient provided.");
      return { success: false, reason: "No recipient provided" };
    }

    const transporter = getTransporter();

    // Generate fallback plain text from HTML to prevent spam flagging
    const cleanPlainText =
      text ||
      html
        ?.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        ?.replace(/<[^>]+>/g, " ")
        ?.replace(/\s+/g, " ")
        ?.trim() ||
      "Notification from AssessIQ";

    if (transporter) {
      try {
        const fromAddress = EMAIL_FROM || `"AssessIQ Platform" <${userEmail}>`;

        const info = await transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          text: cleanPlainText,
          html: html || text?.replace(/\n/g, "<br/>")
        });

        console.log(`[Real Email Sent] Message ID: ${info.messageId} to: ${to} (Subject: "${subject}")`);
        return { success: true, messageId: info.messageId, real: true };
      } catch (nodemailerErr) {
        console.error("[Real Email Dispatch Failed]:", nodemailerErr.message);
      }
    }

    // Fallback: Structured console logging with real-time payload
    console.log("==================================================");
    console.log(`[EMAIL DISPATCH - SIMULATED / FALLBACK]`);
    console.log(`Sender: ${userEmail}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${cleanPlainText}`);
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

/**
 * 1. Student Registration Welcome Email
 */
export const sendStudentWelcomeEmail = async ({ to, name, email }) => {
  const subject = "🎉 Welcome to AssessIQ — Your Student Account is Ready";
  const loginUrl = "http://localhost:5173/login";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display: flex; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
        <div style="width: 42px; height: 42px; background: #1e1b4b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 800; font-size: 20px; margin-right: 14px;">IQ</div>
        <div>
          <h2 style="margin: 0; color: #0f172a; font-size: 20px;">AssessIQ Assessment Platform</h2>
          <span style="font-size: 13px; color: #64748b;">Enterprise Multi-Tenant Examination System</span>
        </div>
      </div>
      <h3 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Welcome, ${name}!</h3>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Your student account has been successfully created. You can now log in, take assigned tests, view detailed performance analytics, and access certified assessment results.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Registered Email:</strong> <span style="color: #1e40af;">${email}</span></p>
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Role:</strong> Student</p>
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Login Portal:</strong> <a href="${loginUrl}" style="color: #2563eb; text-decoration: underline;">Click Here to Access Desk</a></p>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${loginUrl}" style="background: #1e1b4b; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Go to Student Portal →</a>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        Need help? Contact your institution administrator or reply directly to this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">© 2026 AssessIQ Multi-Tenant Examination Platform</p>
    </div>
  `;

  const text = `Hello ${name},\n\nWelcome to AssessIQ! Your student account (${email}) has been successfully created.\n\nYou can sign in anytime at: ${loginUrl}\n\nAssessIQ Operations Team`;

  return sendEmail({ to, subject, text, html });
};

/**
 * 2. Account Credentials & Temporary Password Email (For Teacher or Student created by Admin/Org)
 */
export const sendAccountCredentialsEmail = async ({ to, name, email, password, role, orgName, loginUrl }) => {
  const portalUrl = loginUrl || "http://localhost:5173/login";
  const roleDisplay = role || "Member";
  const subject = `🎓 Your AssessIQ ${roleDisplay} Account Credentials & Temporary Password`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display: flex; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
        <div style="width: 42px; height: 42px; background: #1e1b4b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 800; font-size: 20px; margin-right: 14px;">IQ</div>
        <div>
          <h2 style="margin: 0; color: #0f172a; font-size: 20px;">AssessIQ Assessment Platform</h2>
          <span style="font-size: 13px; color: #64748b;">${orgName ? orgName + " Portal" : "Enterprise Multi-Tenant Examination"}</span>
        </div>
      </div>
      <h3 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Hello ${name},</h3>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        An account has been created for you on AssessIQ${orgName ? ` for <strong>${orgName}</strong>` : ""}. Please find your initial login credentials below:
      </p>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Role:</strong> <span style="text-transform: capitalize; color: #0f172a; font-weight: 600;">${roleDisplay}</span></p>
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Login Email:</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-weight: 600; color: #0f172a;">${email}</code></p>
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Temporary Password:</strong> <code style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 15px; border: 1px dashed #f59e0b;">${password}</code></p>
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Portal Link:</strong> <a href="${portalUrl}" style="color: #2563eb; text-decoration: underline;">Click Here to Access Portal</a></p>
      </div>
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 18px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          ⚠️ <strong>Security Recommendation:</strong> For your security, please sign in and change your temporary password immediately from your profile settings.
        </p>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${portalUrl}" style="background: #1e1b4b; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Log In to AssessIQ →</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">© 2026 AssessIQ Multi-Tenant Examination Platform</p>
    </div>
  `;

  const text = `Hello ${name},\n\nYour AssessIQ account has been created.\n\nRole: ${roleDisplay}\nEmail: ${email}\nTemporary Password: ${password}\n\nLogin URL: ${portalUrl}\n\nPlease change your password upon your first sign in.\n\nAssessIQ Operations`;

  return sendEmail({ to, subject, text, html });
};

/**
 * 3. Successful Login Notification Email
 */
export const sendLoginNotificationEmail = async ({ to, name, role, email, ip, userAgent }) => {
  const subject = "🔐 AssessIQ Security Notice: Successful Login to Your Account";
  const loginTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium"
  });

  const roleLabels = {
    super_admin: "Super Administrator",
    org_admin: "Institutional Administrator",
    admin: "Institutional Administrator",
    teacher: "Faculty / Teacher",
    student: "Student"
  };

  const roleText = roleLabels[role] || role || "User";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display: flex; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
        <div style="width: 42px; height: 42px; background: #1e1b4b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 800; font-size: 20px; margin-right: 14px;">IQ</div>
        <div>
          <h2 style="margin: 0; color: #0f172a; font-size: 20px;">AssessIQ Security Operations</h2>
          <span style="font-size: 13px; color: #64748b;">Account Access Security Alert</span>
        </div>
      </div>
      <h3 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Successful Login Detected</h3>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Hello <strong>${name || email}</strong>, this is an automated confirmation that your <strong>${roleText}</strong> account was just accessed on AssessIQ.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Account Email:</strong> ${email}</p>
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Account Role:</strong> ${roleText}</p>
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Timestamp:</strong> ${loginTime} (IST)</p>
        <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 600;">Authenticated Successfully</span></p>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
        If you initiated this sign-in, you can safely disregard this message.
      </p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 18px 0;">
        <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.4;">
          <strong>Did not recognize this activity?</strong> If you did not sign in, someone else may have gained access to your account. Please reset your password immediately or contact platform security.
        </p>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">© 2026 AssessIQ Security Operations Center</p>
    </div>
  `;

  const text = `Hello ${name || email},\n\nA successful login to your AssessIQ ${roleText} account was detected on ${loginTime}.\n\nIf this was you, no action is needed.\nIf this was NOT you, please reset your password immediately.\n\nAssessIQ Security Team`;

  return sendEmail({ to, subject, text, html });
};

/**
 * 4. Organization Application Alert to Super Admin
 */
export const sendOrgApplicationAdminAlert = async ({ orgName, orgType, adminName, email, phone, city, state, expectedStudents, website, notes }) => {
  const superAdminEmail = (process.env.EMAIL_USER || "kambagownikmalleswari@gmail.com").trim();
  const subject = `🏛️ [AssessIQ Alert] New Organization Request — ${orgName} (${orgType})`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 14px;">
        <div style="width: 38px; height: 38px; background: #1e1b4b; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 800; font-size: 18px; margin-right: 12px;">IQ</div>
        <div>
          <h3 style="margin: 0; color: #0f172a; font-size: 18px;">AssessIQ Platform Administration</h3>
          <span style="font-size: 13px; color: #64748b;">New Institutional Onboarding Request</span>
        </div>
      </div>
      <h3 style="color: #0f172a; margin-top: 0;">New Organization Request Received</h3>
      <p style="color: #334155; font-size: 15px;">A new institutional partnership application has been submitted and is waiting for your review:</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 18px 0;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Institution:</strong> ${orgName} (${orgType})</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Administrator Name:</strong> ${adminName}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Contact Email:</strong> <a href="mailto:${email}" style="color: #2563eb;">${email}</a></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Contact Phone:</strong> ${phone || "N/A"}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Location:</strong> ${city || ""}, ${state || ""}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Expected Students:</strong> ${expectedStudents || 50}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Website:</strong> ${website || "N/A"}</p>
        ${notes ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Notes:</strong> ${notes}</p>` : ""}
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="http://localhost:5173/admin/org-requests" style="background: #1e1b4b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Open Institutional Requests Portal →</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">AssessIQ Multi-Tenant System Notification</p>
    </div>
  `;

  const text = `Hello Super Admin,\n\nA new organization onboarding request has been submitted:\nInstitution: ${orgName} (${orgType})\nAdministrator: ${adminName}\nEmail: ${email}\nPhone: ${phone}\nExpected Students: ${expectedStudents}\nLocation: ${city}, ${state}\n\nReview this application in your dashboard:\nhttp://localhost:5173/admin/org-requests\n\nAssessIQ Platform Operations`;

  return sendEmail({ to: superAdminEmail, subject, text, html });
};

/**
 * 5. Student Self-Registration Alert to Admin
 */
export const sendStudentRegistrationAdminAlert = async ({ studentName, studentEmail, studentPhone, orgName }) => {
  const superAdminEmail = (process.env.EMAIL_USER || "kambagownikmalleswari@gmail.com").trim();
  const subject = `🎓 [AssessIQ Alert] New Student Registration — ${studentName}`;

  const text = `Hello Administrator,\n\nA new student has registered on AssessIQ:\nName: ${studentName}\nEmail: ${studentEmail}\nPhone: ${studentPhone || "N/A"}\nInstitution: ${orgName || "Independent / Platform"}\n\nAssessIQ System`;

  return sendEmail({ to: superAdminEmail, subject, text });
};

export default sendEmail;
