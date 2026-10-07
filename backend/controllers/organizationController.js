// Import Organization, User, and Test models
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Test from "../models/Test.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { sendEmail, sendEmailQuickOrBackground, getClientUrl } from "../utils/sendEmail.js";

// Create a new organization (Super Admin)
export const createOrganization = async (req, res) => {
  try {
    const {
      name,
      slug,
      type = "College",
      adminName,
      email,
      phone,
      address,
      city,
      state,
      country,
      logo,
      subscriptionPlan = "free"
    } = req.body;

    // Check required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Organization name and email are required"
      });
    }

    if (name.trim().length <= 3) {
      return res.status(400).json({
        success: false,
        message: "Organization name must be more than 3 characters (at least 4 characters)"
      });
    }

    if (adminName && adminName.trim().length <= 3) {
      return res.status(400).json({
        success: false,
        message: "Administrator name must be more than 3 characters (at least 4 characters)"
      });
    }

    if (phone) {
      const cleanPhone = phone.toString().trim();
      if (!/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 numeric digits"
        });
      }
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    // Check if organization already exists
    const existingOrganization = await Organization.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { slug: generatedSlug }]
    });

    if (existingOrganization) {
      return res.status(400).json({
        success: false,
        message: "Organization with this email or slug already exists"
      });
    }

    // Create organization
    const organization = await Organization.create({
      name: name.trim(),
      slug: generatedSlug,
      type,
      adminName: adminName || "",
      email: email.toLowerCase().trim(),
      phone: phone || "",
      address: address || "",
      city: city || "",
      state: state || "",
      country: country || "",
      logo: logo || "",
      status: "active",
      isActive: true,
      subscriptionPlan,
      subscriptionStatus: "active"
    });

    // Provision Org Admin user if email and adminName provided
    let tempPassword = "";
    let adminUser = null;
    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail) {
      tempPassword = `OrgAdmin#${Math.random().toString(36).slice(-6)}!`;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      adminUser = await User.findOne({ email: cleanEmail });
      if (adminUser) {
        adminUser.role = "org_admin";
        adminUser.organizationId = organization._id;
        adminUser.status = "active";
        adminUser.isActive = true;
        adminUser.password = hashedPassword;
        await adminUser.save();
      } else {
        adminUser = await User.create({
          name: adminName || `${name.trim()} Administrator`,
          email: cleanEmail,
          phone: phone || "",
          password: hashedPassword,
          role: "org_admin",
          organizationId: organization._id,
          status: "active",
          isActive: true
        });
      }

      // Dispatch welcome credentials email to organization admin (non-blocking fast response)
      const portalLoginUrl = `${getClientUrl()}/admin/login`;
      let emailDispatch = null;
      try {
        emailDispatch = await sendEmailQuickOrBackground({
          to: cleanEmail,
          subject: `AssessIQ — Institutional Portal Created (${organization.name})`,
          text: `Dear ${adminName || organization.name},\n\nYour institution "${organization.name}" has been registered on AssessIQ.\n\nAdministrator Credentials:\n- Admin Portal: ${portalLoginUrl}\n- Email: ${cleanEmail}\n- Temporary Password: ${tempPassword}\n- Organization Slug: ${organization.slug}\n\nPlease sign in to the Admin Console at ${portalLoginUrl} and change your password immediately.\n\nAssessIQ Enterprise Operations`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0;">AssessIQ Platform Operations</h2>
              <h3>Welcome to AssessIQ Enterprise!</h3>
              <p>Your institution <strong>${organization.name}</strong> has been provisioned on AssessIQ.</p>
              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #0369a1;">Institutional Administrator Credentials:</h4>
                <p style="margin: 6px 0;"><strong>Admin Portal:</strong> <a href="${portalLoginUrl}" style="color: #2563eb; font-weight: bold;">${portalLoginUrl}</a></p>
                <p style="margin: 6px 0;"><strong>Admin Email:</strong> <code>${cleanEmail}</code></p>
                <p style="margin: 6px 0;"><strong>Temporary Password:</strong> <code style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${tempPassword}</code></p>
                <p style="margin: 6px 0;"><strong>Organization Slug:</strong> <code>${organization.slug}</code></p>
              </div>
              <p style="font-size: 13px; color: #64748b;">Please sign in and change your temporary password immediately from your profile settings.</p>
            </div>
          `
        }, 1000);
      } catch (emailErr) {
        console.warn("[Create Org] Email dispatch error:", emailErr.message);
        emailDispatch = { success: false, error: emailErr.message };
      }

      const emailSent = Boolean(emailDispatch?.real || emailDispatch?.success || emailDispatch?.queued);

      return res.status(201).json({
        success: true,
        message: emailSent
          ? "Organization registered and administrator credentials dispatched."
          : "Organization registered. Email delivery failed, please provide temporary password manually.",
        organization,
        adminUser: {
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        },
        temporaryPassword: tempPassword,
        emailSent,
        emailError: emailSent ? null : (emailDispatch?.error || "Email delivery failed")
      });
    }

    res.status(201).json({
      success: true,
      message: "Organization registered successfully.",
      organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create organization",
      error: error.message
    });
  }
};

// Get public list of active organizations (for registration dropdown)
export const getPublicOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find({
      $or: [{ status: "active" }, { isActive: true }]
    })
      .select("name slug type city")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      organizations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get organizations list",
      error: error.message
    });
  }
};

// Get all organizations (Super Admin) with aggregated user & test counts
export const getAllOrganizations = async (req, res) => {
  try {
    const [organizations, userCounts, testCounts] = await Promise.all([
      Organization.find().sort({ createdAt: -1 }).lean(),
      User.aggregate([
        { $match: { organizationId: { $ne: null } } },
        { $group: { _id: "$organizationId", count: { $sum: 1 } } }
      ]),
      Test.aggregate([
        { $match: { organizationId: { $ne: null } } },
        { $group: { _id: "$organizationId", count: { $sum: 1 } } }
      ])
    ]);

    const userCountMap = new Map(userCounts.map((u) => [u._id.toString(), u.count]));
    const testCountMap = new Map(testCounts.map((t) => [t._id.toString(), t.count]));

    const orgsWithStats = organizations.map((org) => ({
      ...org,
      totalUsers: userCountMap.get(org._id.toString()) || 0,
      totalTests: testCountMap.get(org._id.toString()) || 0
    }));

    res.status(200).json({
      success: true,
      organizations: orgsWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get organizations",
      error: error.message
    });
  }
};

// Get organization by ID
export const getOrganizationById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    const totalStudents = await User.countDocuments({
      organizationId: organization._id,
      role: "student"
    });
    const totalTeachers = await User.countDocuments({
      organizationId: organization._id,
      role: "teacher"
    });
    const totalTests = await Test.countDocuments({
      organizationId: organization._id
    });

    res.status(200).json({
      success: true,
      organization: {
        ...organization.toObject(),
        totalStudents,
        totalTeachers,
        totalTests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get organization",
      error: error.message
    });
  }
};

// Update organization
export const updateOrganization = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update organization",
      error: error.message
    });
  }
};

// Activate or deactivate organization
export const toggleOrganizationStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    const newIsActive = !organization.isActive;
    organization.isActive = newIsActive;
    organization.status = newIsActive ? "active" : "suspended";

    await organization.save();

    res.status(200).json({
      success: true,
      message: `Organization ${newIsActive ? "activated" : "suspended"} successfully`,
      organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update organization status",
      error: error.message
    });
  }
};

// Delete organization
export const deleteOrganization = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const organization = await Organization.findByIdAndDelete(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Organization deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete organization",
      error: error.message
    });
  }
};

// Resend / Reissue Organization Admin Credentials (Super Admin)
export const resendOrganizationCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    // Find the org_admin user for this organization
    let adminUser = await User.findOne({
      $or: [
        { organizationId: organization._id, role: "org_admin" },
        { email: organization.email }
      ]
    });

    // Generate fresh secure temporary password
    const tempPassword = `OrgAdmin#${Math.random().toString(36).slice(-6)}!`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    if (adminUser) {
      adminUser.password = hashedPassword;
      adminUser.status = "active";
      adminUser.isActive = true;
      adminUser.role = "org_admin";
      adminUser.organizationId = organization._id;
      await adminUser.save();
    } else {
      adminUser = await User.create({
        name: organization.adminName || organization.name + " Admin",
        email: organization.email,
        phone: organization.phone || "9999999999",
        password: hashedPassword,
        role: "org_admin",
        organizationId: organization._id,
        status: "active",
        isActive: true
      });
    }

    const portalLoginUrl = `${getClientUrl()}/admin/login`;
    const targetEmail = (adminUser.email || organization.email).toLowerCase().trim();
    let emailDispatch = null;

    try {
      emailDispatch = await sendEmailQuickOrBackground({
        to: targetEmail,
        subject: `AssessIQ — Institutional Admin Credentials Reissued (${organization.name})`,
        text: `Dear ${adminUser.name || organization.name},\n\nYour administrator credentials for "${organization.name}" on AssessIQ have been updated by platform administration:\n\nAdmin Portal: ${portalLoginUrl}\nAdministrator Email: ${targetEmail}\nTemporary Password: ${tempPassword}\nOrganization Slug: ${organization.slug}\n\nPlease sign in immediately at ${portalLoginUrl}.\n\nAssessIQ Enterprise Operations`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="display: flex; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
              <div style="width: 44px; height: 44px; background: #1e1b4b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 800; font-size: 20px; margin-right: 14px;">IQ</div>
              <div>
                <h2 style="margin: 0; color: #0f172a; font-size: 20px;">AssessIQ Platform Operations</h2>
                <span style="font-size: 13px; color: #64748b;">Enterprise Multi-Tenant Examination System</span>
              </div>
            </div>

            <h3 style="color: #0f172a; font-size: 19px; margin-bottom: 12px;">Institutional Access Credentials Reissued</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Dear <strong>${adminUser.name || organization.name}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              Your administrator credentials for <strong>${organization.name}</strong> have been reissued by platform administration.
            </p>

            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 22px; margin: 24px 0;">
              <h4 style="margin: 0 0 14px 0; color: #0369a1; font-size: 16px;">Institutional Administrator Credentials:</h4>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Admin Portal:</strong> <a href="${portalLoginUrl}" style="color: #2563eb; font-weight: 700; text-decoration: underline;">${portalLoginUrl}</a></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Admin Email:</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-weight: 600;">${targetEmail}</code></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 4px; font-weight: 800; font-size: 16px; border: 1px dashed #f59e0b;">${tempPassword}</code></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Organization Slug:</strong> <code style="background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-weight: 600;">${organization.slug}</code></p>
            </div>

            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="${portalLoginUrl}" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">Sign In to Admin Console →</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
            <p style="font-size: 13px; color: #64748b; margin: 0; text-align: center;">AssessIQ Enterprise Platform Operations</p>
          </div>
        `
      }, 3000);
    } catch (emailErr) {
      console.error("[Org Resend Credentials Error]:", emailErr);
      emailDispatch = { success: false, error: emailErr.message };
    }

    const emailSent = Boolean(emailDispatch?.real || emailDispatch?.success || emailDispatch?.queued);

    res.status(200).json({
      success: true,
      message: emailSent
        ? `Credentials reissued and dispatched to ${targetEmail}!`
        : `Credentials reissued, but email could not be delivered. Please provide the temporary password manually.`,
      temporaryPassword: tempPassword,
      adminEmail: targetEmail,
      emailSent,
      emailError: emailSent ? null : (emailDispatch?.error || "Email delivery failed")
    });
  } catch (error) {
    console.error("Resend org credentials error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend organization credentials",
      error: error.message
    });
  }
};