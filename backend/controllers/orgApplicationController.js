import OrgApplication from "../models/OrgApplication.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import TeacherApplication from "../models/TeacherApplication.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";

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
      expectedStudents,
      notes: notes.trim(),
      status: "pending"
    });

    // Send confirmation email asynchronously in background
    sendEmail({
      to: cleanEmail,
      subject: "AssessIQ - Institutional Onboarding Application Received",
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
    }).catch((emailErr) => {
      console.warn("Could not dispatch confirmation email:", emailErr.message);
    });

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

    // 5. Send approval email with credentials asynchronously in background
    sendEmail({
      to: application.email,
      subject: "🎉 AssessIQ - Institutional Portal Approved & Provisioned",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Welcome to AssessIQ Enterprise!</h2>
          <p>Dear ${application.adminName},</p>
          <p>Congratulations! Your institution application for <strong>${organization.name}</strong> has been officially approved by the platform administration.</p>
          <div style="background: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 10px 0; color: #0284c7;">Institutional Administrator Credentials:</h4>
            <p style="margin: 4px 0;"><strong>Portal Login:</strong> <a href="http://localhost:5173/login">Access Portal</a></p>
            <p style="margin: 4px 0;"><strong>Admin Email:</strong> ${application.email}</p>
            <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${tempPassword}</code></p>
            <p style="margin: 4px 0;"><strong>Organization Slug:</strong> ${organization.slug}</p>
          </div>
          <p style="color: #d97706; font-size: 13px;">Please change your password immediately after your first sign in.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 13px; color: #64748b;">AssessIQ Platform Operations</p>
        </div>
      `
    }).catch((emailErr) => {
      console.warn("Could not dispatch approval email:", emailErr.message);
    });

    res.status(200).json({
      success: true,
      message: `Organization '${organization.name}' approved and Org Admin account provisioned.`,
      organization,
      adminUser: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
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

    // Send rejection email asynchronously in background
    sendEmail({
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
    }).catch((emailErr) => {
      console.warn("Could not dispatch rejection email:", emailErr.message);
    });

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
