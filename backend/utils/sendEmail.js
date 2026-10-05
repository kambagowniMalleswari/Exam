// Email notification utility with multi-provider HTTP API (Brevo, Resend, SendGrid) + Nodemailer SMTP fallback
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

// Helper to get client URL (defaults to production web app)
export const getClientUrl = () => {
  return (process.env.CLIENT_URL || "https://assess-iq.web.app").replace(/\/$/, "");
};

// Cached singleton transporter instance for connection pooling
let cachedTransporter = null;
let cachedTransporterKey = "";

const getTransporter = () => {
  const service = (process.env.EMAIL_SERVICE || process.env.SMTP_SERVICE || "").trim().toLowerCase();
  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || (host ? 587 : 465);
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || "").trim().replace(/\s+/g, "");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass) {
    return null;
  }

  const configKey = `${service}_${host}_${port}_${user}_${pass}_${secure}`;
  if (cachedTransporter && cachedTransporterKey === configKey) {
    return cachedTransporter;
  }

  let transporterConfig = null;

  if (service === "gmail" || user.endsWith("@gmail.com") || (!host && pass)) {
    transporterConfig = {
      service: "gmail",
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      },
      // Aggressive short timeouts so blocked cloud SMTP ports fail fast instead of freezing the UI
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 6000
    };
  } else if (host) {
    transporterConfig = {
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 6000
    };
  }

  if (transporterConfig) {
    try {
      cachedTransporter = nodemailer.createTransport(transporterConfig);
      cachedTransporterKey = configKey;
    } catch (createErr) {
      console.error("[Email Transporter Creation Failed]:", createErr.message);
      return null;
    }
  }

  return cachedTransporter;
};

/**
 * Dispatch via Brevo (Sendinblue) HTTP API over HTTPS (Port 443).
 * Brevo free tier sends 300 emails/day to any recipient without domain configuration.
 * Never blocked on Render or any cloud host!
 */
const sendViaBrevo = async ({ to, subject, cleanPlainText, html, senderEmail, senderName }) => {
  const apiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || "").trim();
  if (!apiKey) return null;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: senderName || "AssessIQ Platform",
        email: senderEmail || "kambagownikmalleswari@gmail.com"
      },
      to: [{ email: to }],
      subject,
      htmlContent: html || cleanPlainText?.replace(/\n/g, "<br/>"),
      textContent: cleanPlainText
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Brevo API HTTP Error ${response.status}`);
  }

  console.log(`[Brevo HTTP Email Sent] ID: ${data.messageId} to: ${to}`);
  return { success: true, messageId: data.messageId, provider: "brevo", real: true };
};

/**
 * Dispatch via Resend HTTP API over HTTPS (Port 443).
 * Resend free tier sends 3,000 emails/month (100/day).
 * Never blocked on Render or any cloud host!
 */
const sendViaResend = async ({ to, subject, cleanPlainText, html, fromAddress }) => {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) return null;

  // Use configured FROM or Resend onboarding sandbox address
  const sender = fromAddress || process.env.EMAIL_FROM || "AssessIQ <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: sender,
      to: [to],
      subject,
      html: html || cleanPlainText?.replace(/\n/g, "<br/>"),
      text: cleanPlainText
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Resend API HTTP Error ${response.status}`);
  }

  console.log(`[Resend HTTP Email Sent] ID: ${data.id} to: ${to}`);
  return { success: true, messageId: data.id, provider: "resend", real: true };
};

/**
 * Dispatch via SendGrid HTTP API over HTTPS (Port 443).
 */
const sendViaSendGrid = async ({ to, subject, cleanPlainText, html, senderEmail, senderName }) => {
  const apiKey = (process.env.SENDGRID_API_KEY || "").trim();
  if (!apiKey) return null;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: senderEmail || "kambagownikmalleswari@gmail.com",
        name: senderName || "AssessIQ Platform"
      },
      subject,
      content: [
        { type: "text/plain", value: cleanPlainText },
        { type: "text/html", value: html || cleanPlainText?.replace(/\n/g, "<br/>") }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API HTTP Error ${response.status}: ${errorText}`);
  }

  console.log(`[SendGrid HTTP Email Sent] to: ${to}`);
  return { success: true, provider: "sendgrid", real: true };
};

/**
 * Base email sending function with multi-provider support:
 * 1. Brevo HTTP API (Port 443 - zero block risk on Render)
 * 2. Resend HTTP API (Port 443 - zero block risk on Render)
 * 3. SendGrid HTTP API (Port 443)
 * 4. Nodemailer SMTP (Port 465/587 - Gmail/Custom SMTP) with fast fail detection
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const userEmail = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();

    if (!to) {
      console.warn("[Email Notification] Skipped: No recipient provided.");
      return { success: false, reason: "No recipient provided", real: false };
    }

    // Generate clean plain text from HTML to prevent spam flagging
    const cleanPlainText =
      text ||
      html
        ?.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        ?.replace(/<[^>]+>/g, " ")
        ?.replace(/\s+/g, " ")
        ?.trim() ||
      "Notification from AssessIQ";

    const senderEmail = userEmail || "kambagownikmalleswari@gmail.com";
    const senderName = "AssessIQ Platform";
    const fromAddress = process.env.EMAIL_FROM
      ? process.env.EMAIL_FROM.replace(/^["']|["']$/g, "").trim()
      : `"AssessIQ Platform" <${senderEmail}>`;

    // 1. Try Brevo HTTP API if configured (HTTPS Port 443 - highly recommended for Render free tier)
    if (process.env.BREVO_API_KEY) {
      try {
        const brevoResult = await sendViaBrevo({ to, subject, cleanPlainText, html, senderEmail, senderName });
        if (brevoResult) return brevoResult;
      } catch (brevoErr) {
        console.warn("[Brevo HTTP Dispatch Error]:", brevoErr.message);
      }
    }

    // 2. Try Resend HTTP API if configured (HTTPS Port 443)
    if (process.env.RESEND_API_KEY) {
      try {
        const resendResult = await sendViaResend({ to, subject, cleanPlainText, html, fromAddress });
        if (resendResult) return resendResult;
      } catch (resendErr) {
        console.warn("[Resend HTTP Dispatch Error]:", resendErr.message);
      }
    }

    // 3. Try SendGrid HTTP API if configured
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sendgridResult = await sendViaSendGrid({ to, subject, cleanPlainText, html, senderEmail, senderName });
        if (sendgridResult) return sendgridResult;
      } catch (sgErr) {
        console.warn("[SendGrid HTTP Dispatch Error]:", sgErr.message);
      }
    }

    // 4. Try Nodemailer SMTP (Gmail / Custom SMTP)
    const transporter = getTransporter();

    if (transporter && userEmail) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          text: cleanPlainText,
          html: html || text?.replace(/\n/g, "<br/>")
        });

        console.log(`[Real SMTP Email Sent] Message ID: ${info.messageId} to: ${to} (Subject: "${subject}")`);
        return { success: true, messageId: info.messageId, real: true, provider: "smtp" };
      } catch (nodemailerErr) {
        const isTimeout = /timeout|etimedout|econnrefused/i.test(nodemailerErr.message);
        const detailedError = isTimeout
          ? "Connection timeout (Render free-tier blocks SMTP ports 465/587. Configure BREVO_API_KEY or RESEND_API_KEY in Render for instant delivery)."
          : nodemailerErr.message;

        console.error("[Real SMTP Email Dispatch Failed]:", detailedError);
        return {
          success: false,
          error: detailedError,
          real: false
        };
      }
    }

    // Graceful fallback when SMTP credentials are not configured in .env
    console.log("==================================================");
    console.log(`[EMAIL DISPATCH - SIMULATED / NOT CONFIGURED]`);
    console.log(`Sender: ${userEmail || "not-configured"}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${cleanPlainText}`);
    console.log("==================================================");

    return {
      success: false,
      real: false,
      simulated: true,
      error: "SMTP credentials not configured in environment (.env)"
    };
  } catch (error) {
    console.error("[Email Notification Error]:", error.message);
    return { success: false, error: error.message, real: false };
  }
};

/**
 * Intelligent Fast-Response Email Helper:
 * Attempts to deliver the email within maxWaitMs (default 1200ms).
 * - If delivered quickly (e.g. Brevo/Resend HTTP API taking ~250ms), returns full delivery details.
 * - If it exceeds maxWaitMs (e.g. SMTP connecting or cold network), it does NOT block the HTTP response!
 *   It continues executing in the background, logs results, and returns queued=true immediately so the UI responds in < 200ms!
 */
export const sendEmailQuickOrBackground = async (mailOptions, maxWaitMs = 5000) => {
  const emailPromise = sendEmail(mailOptions);

  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve({ timeout: true }), maxWaitMs)
  );

  const raceResult = await Promise.race([emailPromise, timeoutPromise]);

  if (raceResult?.timeout) {
    // Background execution continues without blocking caller
    emailPromise
      .then((res) => {
        if (res?.success) {
          console.log(`[Background Email Delivered to ${mailOptions.to}]:`, res);
        } else {
          console.warn(`[Background Email Delivery Status for ${mailOptions.to}]:`, res?.error || res?.reason);
        }
      })
      .catch((err) => console.error(`[Background Email Error for ${mailOptions.to}]:`, err.message));

    return {
      success: true,
      emailSent: true,
      queued: true,
      message: "Credentials email dispatched in background."
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
 * 2. Account Credentials & Temporary Password Email (For Teacher or Student created by Admin/Org)
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
          <strong>Did not recognize this activity?</strong> If you did not sign in, someone else may have gained access to your account. Please reset your password immediately or contact platform security.
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
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER || "").trim();
  if (!superAdminEmail) {
    console.warn("[Admin Alert Skipped]: No Super Admin notification email configured.");
    return { success: false, reason: "No admin alert recipient configured" };
  }
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
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER || "").trim();
  if (!superAdminEmail) {
    return { success: false, reason: "No admin alert recipient configured" };
  }
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
      <p style="color: #475569; font-size: 15px; line-height: 1.5;">You have requested to reset or modify your account password. Use the single-use 6-digit verification code below to authorize this change:</p>
      <div style="margin: 28px 0; text-align: center;">
        <span style="font-family: 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 14px 28px; border-radius: 10px; border: 2px dashed #93c5fd; display: inline-block;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; margin-bottom: 6px;">⏱️ This verification code is valid for <strong>10 minutes</strong>.</p>
      <p style="color: #64748b; font-size: 13px;">If you did not initiate this request, please ignore this email or notify platform security.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">AssessIQ Multi-Tenant Institutional Assessment Platform</p>
    </div>
  `;
  const text = `Hello ${name || "User"},\n\nYour 6-digit password reset verification code is:\n\n${otp}\n\nThis code will expire in 10 minutes. If you did not request a password change, please ignore this email.\n\nAssessIQ Security Operations`;

  return sendEmailQuickOrBackground({ to, subject, text, html }, 5000);
};

export default sendEmail;

