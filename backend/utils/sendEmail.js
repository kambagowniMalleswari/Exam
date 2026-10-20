// Clean and Direct SMTP Email Dispatcher using Nodemailer
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded reliably
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

// Helper to get client URL
export const getClientUrl = () => {
  return (process.env.CLIENT_URL || "https://assess-iq.web.app").replace(/\/$/, "");
};

// Singleton transporter instance for SMTP connection
let cachedTransporter = null;

export const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true";
  const user = (process.env.SMTP_USER || "admin@vmsclass.com").trim();
  const pass = (process.env.SMTP_PASS || "qnqpynogbbmiaxhi").trim();

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return cachedTransporter;
};

/**
 * Base email dispatcher using configured SMTP credentials
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to) {
      console.warn("[Email Notification] Skipped: No recipient provided.");
      return { success: false, reason: "No recipient provided" };
    }

    const smtpUser = (process.env.SMTP_USER || "admin@vmsclass.com").trim();
    const fromAddress = process.env.EMAIL_FROM || `"AssessIQ Platform" <${smtpUser}>`;

    const cleanPlainText =
      text ||
      html
        ?.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        ?.replace(/<[^>]+>/g, " ")
        ?.replace(/\s+/g, " ")
        ?.trim() ||
      "Notification from AssessIQ";

    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: cleanPlainText,
      html: html || text?.replace(/\n/g, "<br/>")
    });

    console.log(`[SMTP Email Sent] Message ID: ${info.messageId} to: ${to} (Subject: "${subject}")`);
    return { success: true, messageId: info.messageId, provider: "smtp" };
  } catch (error) {
    console.error("[SMTP Email Dispatch Failed]:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Intelligent Fast-Response Email Helper:
 * Dispatches email in the background or returns quickly so UI does not wait on network latency.
 */
export const sendEmailQuickOrBackground = async (mailOptions, maxWaitMs = 3500) => {
  const emailPromise = sendEmail(mailOptions);

  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve({ timeout: true }), maxWaitMs)
  );

  const raceResult = await Promise.race([emailPromise, timeoutPromise]);

  if (raceResult?.timeout) {
    emailPromise
      .then((res) => {
        if (res?.success) {
          console.log(`[Background SMTP Delivered to ${mailOptions.to}]:`, res.messageId);
        } else {
          console.warn(`[Background SMTP Status for ${mailOptions.to}]:`, res?.error || res?.reason);
        }
      })
      .catch((err) => console.error(`[Background SMTP Error for ${mailOptions.to}]:`, err.message));

    return {
      success: true,
      emailSent: true,
      queued: true,
      message: "Email dispatched via SMTP in background."
    };
  }

  return raceResult;
};

/**
 * 1. Student Registration Welcome Email
 */
export const sendStudentWelcomeEmail = async ({ to, name, email }) => {
  const subject = "🎉 Welcome to AssessIQ — Your Student Account is Ready";
  const loginUrl = `${getClientUrl()}/login`;

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

  return sendEmailQuickOrBackground({ to, subject, text, html });
};

/**
 * 2. Account Credentials & Temporary Password Email
 */
export const sendAccountCredentialsEmail = async ({ to, name, email, password, role, orgName, loginUrl }) => {
  const portalUrl = loginUrl || `${getClientUrl()}/login`;
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

  return sendEmailQuickOrBackground({ to, subject, text, html });
};

/**
 * 3. Successful Login Notification Email
 */
export const sendLoginNotificationEmail = async ({ to, name, role, email }) => {
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
          <strong>Did not recognize this activity?</strong> If you did not sign in, please reset your password immediately or contact platform security.
        </p>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">© 2026 AssessIQ Security Operations Center</p>
    </div>
  `;

  const text = `Hello ${name || email},\n\nA successful login to your AssessIQ ${roleText} account was detected on ${loginTime}.\n\nIf this was you, no action is needed.\nIf this was NOT you, please reset your password immediately.\n\nAssessIQ Security Team`;

  return sendEmailQuickOrBackground({ to, subject, text, html });
};

/**
 * 4. Organization Application Alert to Super Admin
 */
export const sendOrgApplicationAdminAlert = async ({ orgName, orgType, adminName, email, phone, city, state, expectedStudents, website, notes }) => {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.SMTP_USER || "admin@vmsclass.com").trim();
  const subject = `[AssessIQ Alert] New Organization Request — ${orgName} (${orgType})`;

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
        <a href="${getClientUrl()}/superadmin/org-requests" style="background: #1e1b4b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Open Institutional Requests Portal →</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">AssessIQ Multi-Tenant System Notification</p>
    </div>
  `;

  const text = `Hello Super Admin,\n\nA new organization onboarding request has been submitted:\nInstitution: ${orgName} (${orgType})\nAdministrator: ${adminName}\nEmail: ${email}\nPhone: ${phone}\nExpected Students: ${expectedStudents}\nLocation: ${city}, ${state}\n\nReview this application in your dashboard:\n${getClientUrl()}/superadmin/org-requests\n\nAssessIQ Platform Operations`;

  return sendEmailQuickOrBackground({ to: superAdminEmail, subject, text, html });
};

/**
 * 5. Student Self-Registration Alert to Admin
 */
export const sendStudentRegistrationAdminAlert = async ({ studentName, studentEmail, studentPhone, orgName }) => {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.SMTP_USER || "admin@vmsclass.com").trim();
  const subject = `[AssessIQ Alert] New Student Registration — ${studentName}`;

  const text = `Hello Administrator,\n\nA new student has registered on AssessIQ:\nName: ${studentName}\nEmail: ${studentEmail}\nPhone: ${studentPhone || "N/A"}\nInstitution: ${orgName || "Independent / Platform"}\n\nAssessIQ System`;

  return sendEmailQuickOrBackground({ to: superAdminEmail, subject, text });
};

/**
 * 6. Email Password Reset OTP Verification Code
 */
export const sendPasswordResetOtpEmail = async ({ to, name, otp }) => {
  const subject = "AssessIQ Platform — Password Reset Verification Code";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="width: 36px; height: 36px; background: #1e3a8a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 12px;">IQ</div>
        <h3 style="margin: 0; color: #0f172a; font-size: 18px;">AssessIQ Platform Security</h3>
      </div>
      <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 12px;">Password Reset Verification</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.5;">Hello <strong>${name || "User"}</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.5;">You have requested to reset your account password. Use the single-use 6-digit verification code below to authorize this change:</p>
      <div style="margin: 28px 0; text-align: center;">
        <span style="font-family: 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 14px 28px; border-radius: 10px; border: 2px dashed #93c5fd; display: inline-block;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; margin-bottom: 6px;">⏱️ This verification code is valid for <strong>10 minutes</strong>.</p>
      <p style="color: #64748b; font-size: 13px;">If you did not initiate this request, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">AssessIQ Multi-Tenant Institutional Assessment Platform</p>
    </div>
  `;
  const text = `Hello ${name || "User"},\n\nYour 6-digit password reset verification code is:\n\n${otp}\n\nThis code will expire in 10 minutes. If you did not request a password change, please ignore this email.\n\nAssessIQ Security Operations`;

  return sendEmailQuickOrBackground({ to, subject, text, html });
};

/**
 * 7. Student Test Completion & Scorecard Email
 */
export const sendStudentScorecardEmail = async ({ to, studentName, testTitle, score, totalMarks, percentage, passed, timeTaken }) => {
  const subject = `📊 AssessIQ Scorecard: ${testTitle} (${passed ? "PASSED" : "COMPLETED"})`;
  const formattedTime = timeTaken ? `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s` : "N/A";
  const statusColor = passed ? "#16a34a" : "#dc2626";
  const statusBg = passed ? "#f0fdf4" : "#fef2f2";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 14px;">
        <div style="width: 40px; height: 40px; background: #1e1b4b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 800; font-size: 18px; margin-right: 12px;">IQ</div>
        <div>
          <h3 style="margin: 0; color: #0f172a; font-size: 18px;">AssessIQ Examination Scorecard</h3>
          <span style="font-size: 13px; color: #64748b;">Instant Automated Evaluation</span>
        </div>
      </div>
      <p style="color: #334155; font-size: 15px;">Hello <strong>${studentName || "Student"}</strong>,</p>
      <p style="color: #334155; font-size: 15px;">You have successfully completed <strong>"${testTitle}"</strong>. Below is your official evaluation summary:</p>
      <div style="background: ${statusBg}; border: 1px solid ${passed ? "#bbf7d0" : "#fecaca"}; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #475569; font-size: 14px;"><strong>Result Status:</strong></span>
          <span style="color: ${statusColor}; font-weight: 800; font-size: 15px;">${passed ? "PASSED ✓" : "NEEDS IMPROVEMENT"}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #475569; font-size: 14px;"><strong>Score:</strong></span>
          <span style="color: #0f172a; font-weight: 700; font-size: 15px;">${score} / ${totalMarks}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #475569; font-size: 14px;"><strong>Percentage:</strong></span>
          <span style="color: #0f172a; font-weight: 700; font-size: 15px;">${percentage}%</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #475569; font-size: 14px;"><strong>Time Taken:</strong></span>
          <span style="color: #475569; font-size: 14px;">${formattedTime}</span>
        </div>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${getClientUrl()}/student/my-attempts" style="background: #1e1b4b; color: #ffffff; padding: 12px 26px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View Full Scorecard & Answer Breakdown →</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0 14px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">AssessIQ Academic Examination Platform</p>
    </div>
  `;

  const text = `Hello ${studentName || "Student"},\n\nYou have completed "${testTitle}".\n\nResult: ${passed ? "PASSED" : "COMPLETED"}\nScore: ${score} / ${totalMarks} (${percentage}%)\nTime Taken: ${formattedTime}\n\nView details: ${getClientUrl()}/student/my-attempts\n\nAssessIQ Operations`;

  return sendEmailQuickOrBackground({ to, subject, text, html });
};

export default sendEmail;
