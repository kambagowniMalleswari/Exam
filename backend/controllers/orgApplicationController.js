import OrgApplication from "../models/OrgApplication.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import TeacherApplication from "../models/TeacherApplication.js";
import bcrypt from "bcryptjs";
import { sendEmail, sendEmailQuickOrBackground, sendOrgApplicationAdminAlert, getClientUrl } from "../utils/sendEmail.js";

// 1. Submit Organization Application (Public)
export const applyOrganization = async (req, res) => {
  try {
    const {
      name,
      type = "College",
      adminName,
      email,
      phone,
      website = "",
      address = "",
      city = "",
      state = "",
      country = "India",
      expectedStudents = "101-500",
      notes = ""
    } = req.body;

    if (!name || !adminName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Organization name, administrator name, official email, and phone are required."
      });
    }

    if (name.trim().length <= 3 || adminName.trim().length <= 3) {
      return res.status(400).json({
        success: false,
        message: "Organization name and administrator name must be more than 3 characters."
      });
    }

    // Phone validation: exactly 10 digits
    const cleanPhone = phone.toString().trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 numeric digits."
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if active user already exists with this email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists on AssessIQ."
      });
    }

    // Check if active organization already registered
    const existingOrg = await Organization.findOne({ email: cleanEmail });
    if (existingOrg) {
      return res.status(409).json({
        success: false,
        message: "An active organization with this email address already exists on AssessIQ."
      });
    }

    // Check if an application is already pending
    const existingApp = await OrgApplication.findOne({
      email: cleanEmail,
      status: "pending"
    });
    if (existingApp) {
      return res.status(409).json({
        success: false,
        message: "An organization onboarding application with this email is already pending Super Admin review."
      });
    }

    // Check if a teacher application is pending with this email
    const existingTeacherApp = await TeacherApplication.findOne({
      email: cleanEmail,
      status: "pending"
    });
    if (existingTeacherApp) {
      return res.status(409).json({
        success: false,
        message: "A faculty application with this email address is currently pending review."
      });
    }

    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    const validEnums = ["1-100", "101-500", "501-2000", "2000+"];
    let normalizedExpectedStudents = "101-500";
    if (validEnums.includes(expectedStudents)) {
      normalizedExpectedStudents = expectedStudents;
    } else if (typeof expectedStudents === "number" || !isNaN(Number(expectedStudents))) {
      const num = Number(expectedStudents);
      if (num <= 100) normalizedExpectedStudents = "1-100";
      else if (num <= 500) normalizedExpectedStudents = "101-500";
      else if (num <= 2000) normalizedExpectedStudents = "501-2000";
      else normalizedExpectedStudents = "2000+";
    }

    const application = await OrgApplication.create({
      name: name.trim(),
      slug: generatedSlug,
      type,
      adminName: adminName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      website: website.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      expectedStudents: normalizedExpectedStudents,
      notes: notes.trim(),
      status: "pending"
    });

    // 1. Send confirmation email to applicant & alert to Super Admin
    await Promise.allSettled([
      sendEmail({
        to: cleanEmail,
        subject: "AssessIQ - Institutional Onboarding Application Received",
        text: `Dear ${adminName},\n\nThank you for submitting an institutional partnership request for "${name}" on AssessIQ.\n\nOur platform administration team is reviewing your institution's profile. Once verified, your organization portal will be provisioned, and your administrator access credentials will be delivered to this email.\n\nAssessIQ Institutional Assessment Platform · Secure Multi-Tenant Architecture`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-bottom: 12px;">Institutional Onboarding Application Received</h2>
            <p>Dear ${adminName},</p>
            <p>Thank you for submitting an institutional partnership request for <strong>${name}</strong> on AssessIQ.</p>
            <p>Our platform administration team is reviewing your institution's profile. Once verified, your organization portal will be provisioned, and your administrator access credentials will be delivered to this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 13px; color: #64748b;">AssessIQ Institutional Assessment Platform · Secure Multi-Tenant Architecture</p>
          </div>
        `
      }),
      sendOrgApplicationAdminAlert({
        orgName: name.trim(),
        orgType: type,
        adminName: adminName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        city: city.trim(),
        state: state.trim(),
        expectedStudents,
        website: website.trim(),
        notes: notes.trim()
      })
    ]);

    res.status(201).json({
      success: true,
      message: "Institutional onboarding application submitted successfully. Our administration will review your request.",
      application
    });
  } catch (error) {
    console.error("Apply organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit institutional onboarding request",
      error: error.message
    });
  }
};

// 2. List Organization Applications (Super Admin only)
export const getOrganizationApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const applications = await OrgApplication.find(query)
      .populate("reviewedBy", "name email")
      .populate("createdOrganizationId", "name slug")
      .populate("createdAdminUserId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error("Get org applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve organization applications",
      error: error.message
    });
  }
};

// 3. Approve Organization Application (Super Admin only)
export const approveOrganizationApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await OrgApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Organization application not found."
      });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}.`
      });
    }

    // Ensure unique slug
    let baseSlug = (application.slug || application.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    const existingSlug = await Organization.findOne({ slug: baseSlug });
    if (existingSlug) {
      baseSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 1. Create Organization
    const organization = await Organization.create({
      name: application.name,
      slug: baseSlug,
      type: application.type,
      adminName: application.adminName,
      email: application.email,
      phone: application.phone,
      address: application.address,
      city: application.city,
      state: application.state,
      country: application.country,
      status: "active",
      isActive: true,
      subscriptionPlan: "free",
      subscriptionStatus: "active"
    });

    // 2. Generate secure temporary password
    const tempPassword = `OrgAdmin#${Math.random().toString(36).slice(-6)}!`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // 3. Provision Org Admin user
    let adminUser = await User.findOne({ email: application.email });
    if (adminUser) {
      // Update role and organization
      adminUser.role = "org_admin";
      adminUser.organizationId = organization._id;
      adminUser.status = "active";
      adminUser.isActive = true;
      adminUser.password = hashedPassword;
      await adminUser.save();
    } else {
      adminUser = await User.create({
        name: application.adminName,
        email: application.email,
        phone: application.phone,
        password: hashedPassword,
        role: "org_admin",
        organizationId: organization._id,
        status: "active",
        isActive: true
      });
    }

    // 4. Update Application status
    application.status = "approved";
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    application.createdOrganizationId = organization._id;
    application.createdAdminUserId = adminUser._id;
    await application.save();

    // 5. Send approval email with credentials to applicant (non-blocking fast response)
    const portalLoginUrl = `${getClientUrl()}/admin/login`;
    const targetEmail = (application.email || "").toLowerCase().trim();
    let emailDispatch = null;

    try {
      emailDispatch = await sendEmailQuickOrBackground({
        to: targetEmail,
        subject: `AssessIQ — Institutional Portal Approved & Provisioned (${organization.name})`,
        text: `Dear ${application.adminName},\n\nCongratulations! Your institution application for "${organization.name}" has been officially approved by the platform administration.\n\nInstitutional Administrator Credentials:\n- Portal Login: ${portalLoginUrl}\n- Administrator Email: ${targetEmail}\n- Temporary Password: ${tempPassword}\n- Organization Slug: ${organization.slug}\n\nPlease sign in to the Admin Console at ${portalLoginUrl} and update your password immediately.\n\nAssessIQ Enterprise Operations`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="display: flex; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
              <div style="width: 44px; height: 44px; background: #1e1b4b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 800; font-size: 20px; margin-right: 14px;">IQ</div>
              <div>
                <h2 style="margin: 0; color: #0f172a; font-size: 20px;">AssessIQ Platform Operations</h2>
                <span style="font-size: 13px; color: #64748b;">Enterprise Multi-Tenant Examination System</span>
              </div>
            </div>

            <h3 style="color: #0f172a; font-size: 19px; margin-bottom: 12px;">Welcome to AssessIQ Enterprise!</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Dear <strong>${application.adminName}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              Congratulations! Your institution application for <strong>${organization.name}</strong> has been officially approved by the platform administration. Your hermetically isolated tenant has been provisioned and your institutional administrator account is ready.
            </p>

            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 22px; margin: 24px 0;">
              <h4 style="margin: 0 0 14px 0; color: #0369a1; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                Institutional Administrator Access Credentials
              </h4>
              <p style="margin: 8px 0; font-size: 14px; color: #334155;"><strong>Admin Portal Login:</strong> <a href="${portalLoginUrl}" style="color: #2563eb; font-weight: 700; text-decoration: underline;">Click Here to Access Admin Console</a></p>
              <p style="margin: 8px 0; font-size: 14px; color: #334155;"><strong>Administrator Email:</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-weight: 600; color: #0f172a;">${targetEmail}</code></p>
              <p style="margin: 8px 0; font-size: 14px; color: #334155;"><strong>Temporary Password:</strong> <code style="background: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 4px; font-weight: 800; font-size: 16px; border: 1px dashed #f59e0b;">${tempPassword}</code></p>
              <p style="margin: 8px 0; font-size: 14px; color: #334155;"><strong>Organization Slug:</strong> <code style="background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-weight: 600; color: #475569;">${organization.slug}</code></p>
            </div>

            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                Security Notice: Please sign in and update your password immediately from your admin profile settings upon your first login.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0 20px 0;">
              <a href="${portalLoginUrl}" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">Log In to Institutional Admin Console →</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
            <p style="font-size: 13px; color: #64748b; margin: 0; text-align: center;">AssessIQ Enterprise Multi-Tenant Platform Operations</p>
          </div>
        `
      }, 3000);
      console.log(`[Org Approval] Email dispatch response for ${targetEmail}:`, emailDispatch);

      // Also notify Super Admin if configured
      const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
      if (superAdminEmail && superAdminEmail !== targetEmail) {
        sendEmailQuickOrBackground({
          to: superAdminEmail,
          subject: `[Super Admin Notification] Institutional Portal Approved: ${organization.name}`,
          text: `Dear Super Admin,\n\nThe institutional application for "${organization.name}" has been approved.\n\nInstitutional Admin:\n- Name: ${application.adminName}\n- Email: ${targetEmail}\n- Temporary Password: ${tempPassword}\n- Portal Login: ${portalLoginUrl}\n\nAssessIQ Platform Operations`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
              <h3 style="color: #0f172a; margin-top: 0;">Institutional Portal Approved & Provisioned</h3>
              <p>Organization: <strong>${organization.name}</strong></p>
              <p>Admin Name: <strong>${application.adminName}</strong></p>
              <p>Admin Email: <code>${targetEmail}</code></p>
              <p>Temporary Password: <code>${tempPassword}</code></p>
              <p>Portal Login: <a href="${portalLoginUrl}">${portalLoginUrl}</a></p>
            </div>
          `
        }, 1000).catch((err) => console.warn("[Super Admin Copy] Failed:", err.message));
      }
    } catch (emailErr) {
      console.error("[Org Approval] Email dispatch error:", emailErr);
      emailDispatch = { success: false, error: emailErr.message };
    }

    const emailSent = Boolean(emailDispatch?.real || emailDispatch?.success || emailDispatch?.queued);

    res.status(200).json({
      success: true,
      message: emailSent
        ? `Organization '${organization.name}' approved and credentials dispatched to ${targetEmail}.`
        : `Organization '${organization.name}' approved, but credentials email could not be delivered. Please provide the temporary password manually.`,
      organization,
      adminUser: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      temporaryPassword: tempPassword,
      emailSent,
      emailMessageId: emailDispatch?.messageId,
      emailError: emailSent ? null : (emailDispatch?.error || "Email delivery failed")
    });
  } catch (error) {
    console.error("Approve organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve organization application",
      error: error.message
    });
  }
};

// 4. Resend Organization Approval Email / Credentials (Super Admin only)
export const resendOrgApprovalEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await OrgApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Organization application not found."
      });
    }

    if (application.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Cannot resend credentials: Application is currently '${application.status}'. Only approved organizations can receive credentials.`
      });
    }

    const org = await Organization.findOne({
      $or: [
        { _id: application.createdOrganizationId },
        { email: application.email }
      ]
    });

    let adminUser = await User.findOne({
      $or: [
        { _id: application.createdAdminUserId },
        { email: application.email }
      ]
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Associated organization record could not be found."
      });
    }

    // Generate fresh temporary password
    const tempPassword = `OrgAdmin#${Math.random().toString(36).slice(-6)}!`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    if (adminUser) {
      adminUser.password = hashedPassword;
      adminUser.status = "active";
      adminUser.isActive = true;
      adminUser.role = "org_admin";
      adminUser.organizationId = org._id;
      await adminUser.save();
    } else {
      adminUser = await User.create({
        name: application.adminName,
        email: application.email,
        phone: application.phone,
        password: hashedPassword,
        role: "org_admin",
        organizationId: org._id,
        status: "active",
        isActive: true
      });
      application.createdAdminUserId = adminUser._id;
      await application.save();
    }

    const portalLoginUrl = `${getClientUrl()}/admin/login`;
    const targetEmail = application.email.toLowerCase().trim();
    let emailDispatch = null;

    try {
      emailDispatch = await sendEmailQuickOrBackground({
        to: targetEmail,
        subject: `AssessIQ — Updated Institutional Administrator Credentials (${org.name})`,
        text: `Dear ${application.adminName},\n\nYour institutional administrator credentials for "${org.name}" have been updated by platform administration:\n\nPortal Login: ${portalLoginUrl}\nAdministrator Email: ${targetEmail}\nTemporary Password: ${tempPassword}\nOrganization Slug: ${org.slug}\n\nPlease sign in to the Admin Console at ${portalLoginUrl} immediately.\n\nAssessIQ Enterprise Operations`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="display: flex; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
              <div style="width: 44px; height: 44px; background: #1e1b4b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 800; font-size: 20px; margin-right: 14px;">IQ</div>
              <div>
                <h2 style="margin: 0; color: #0f172a; font-size: 20px;">AssessIQ Platform Operations</h2>
                <span style="font-size: 13px; color: #64748b;">Enterprise Multi-Tenant Examination System</span>
              </div>
            </div>

            <h3 style="color: #0f172a; font-size: 19px; margin-bottom: 12px;">Institutional Access Credentials</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Dear <strong>${application.adminName}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              Your administrator access credentials for <strong>${org.name}</strong> have been reissued by the AssessIQ platform administrator.
            </p>

            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 22px; margin: 24px 0;">
              <h4 style="margin: 0 0 14px 0; color: #0369a1; font-size: 16px;">Institutional Administrator Credentials:</h4>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Admin Portal:</strong> <a href="${portalLoginUrl}" style="color: #2563eb; font-weight: 700; text-decoration: underline;">${portalLoginUrl}</a></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Admin Email:</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-weight: 600;">${targetEmail}</code></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 4px; font-weight: 800; font-size: 16px; border: 1px dashed #f59e0b;">${tempPassword}</code></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Organization Slug:</strong> <code style="background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-weight: 600;">${org.slug}</code></p>
            </div>

            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="${portalLoginUrl}" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">Sign In to Admin Console →</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
            <p style="font-size: 13px; color: #64748b; margin: 0; text-align: center;">AssessIQ Enterprise Platform Operations</p>
          </div>
        `
      }, 1000);
      console.log(`[Org Resend] Email dispatch response for ${targetEmail}:`, emailDispatch);
    } catch (emailErr) {
      console.error("[Org Resend] Email dispatch error:", emailErr);
      emailDispatch = { success: false, error: emailErr.message };
    }

    const emailSent = Boolean(emailDispatch?.real || emailDispatch?.success || emailDispatch?.queued);

    res.status(200).json({
      success: true,
      message: emailSent
        ? `Updated administrator credentials dispatched to ${targetEmail}!`
        : `Credentials updated, but email could not be delivered. Please provide the temporary password manually.`,
      temporaryPassword: tempPassword,
      emailSent,
      emailError: emailSent ? null : (emailDispatch?.error || "Email delivery failed")
    });
  } catch (error) {
    console.error("Resend org approval error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend approval email",
      error: error.message
    });
  }
};

// 4. Reject Organization Application (Super Admin only)
export const rejectOrganizationApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "Institutional criteria not met." } = req.body;

    const application = await OrgApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Organization application not found."
      });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}.`
      });
    }

    application.status = "rejected";
    application.rejectionReason = reason.trim();
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    await application.save();

    // Send rejection email to applicant (non-blocking)
    sendEmailQuickOrBackground({
      to: application.email,
      subject: "AssessIQ - Institutional Application Status Update",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 12px;">Institutional Onboarding Update</h2>
          <p>Dear ${application.adminName},</p>
          <p>Thank you for your interest in AssessIQ. After reviewing the institutional request for <strong>${application.name}</strong>, our administrative team was unable to approve the onboarding at this time.</p>
          <p><strong>Reason provided:</strong> ${application.rejectionReason}</p>
          <p>If you believe this is an error or would like to provide additional institutional verification documents, please reply directly or contact support.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 13px; color: #64748b;">AssessIQ Institutional Assessment Platform</p>
        </div>
      `
    }).catch(err => console.warn("Could not dispatch rejection email:", err.message));

    res.status(200).json({
      success: true,
      message: "Organization application has been rejected.",
      application
    });
  } catch (error) {
    console.error("Reject organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject organization application",
      error: error.message
    });
  }
};
