// Teacher Application Controller
import bcrypt from "bcryptjs";
import crypto from "crypto";
import TeacherApplication from "../models/TeacherApplication.js";
import OrgApplication from "../models/OrgApplication.js";
import User from "../models/User.js";
import sendEmail, {
  sendEmailQuickOrBackground,
  sendAccountCredentialsEmail,
  getClientUrl
} from "../utils/sendEmail.js";

// Submit a new Teacher Application (Public)
export const applyForTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      organizationId,
      subject,
      qualification,
      experienceYears,
      experienceDetails,
      certifications,
      supportingInfo
    } = req.body;

    // 1. Validation
    if (!name || name.trim().length <= 3) {
      return res.status(400).json({
        success: false,
        message: "Full name is required and must be more than 3 characters (at least 4 characters)."
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "A valid professional email address is required."
      });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phone || !phoneRegex.test(phone.toString().trim())) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required and must be exactly 10 digits."
      });
    }

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Please select the institution/organization you are applying to."
      });
    }

    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: "The selected organization does not exist."
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Teaching subject or specialization is required."
      });
    }

    if (!qualification || !qualification.trim()) {
      return res.status(400).json({
        success: false,
        message: "Highest qualification is required."
      });
    }

    // 2. Check for duplicate email across User, TeacherApplication, and OrgApplication
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please sign in or use another email."
      });
    }

    const existingPending = await TeacherApplication.findOne({
      email: cleanEmail,
      status: "pending"
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: "A teacher application with this email address is already pending review."
      });
    }

    const existingOrgApp = await OrgApplication.findOne({
      email: cleanEmail,
      status: "pending"
    });

    if (existingOrgApp) {
      return res.status(409).json({
        success: false,
        message: "An institutional application with this email address is already pending review."
      });
    }

    // 3. Create application
    const application = await TeacherApplication.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.toString().trim(),
      organizationId,
      subject: subject.trim(),
      qualification: qualification.trim(),
      experienceYears: Number(experienceYears) || 0,
      experienceDetails: experienceDetails?.trim() || "",
      certifications: certifications?.trim() || "",
      supportingInfo: supportingInfo?.trim() || "",
      status: "pending"
    });

    // 4. Send email confirmation to applicant & administration
    const adminAlertEmail = process.env.SUPER_ADMIN_EMAIL || process.env.EMAIL_USER || "";
    await Promise.allSettled([
      sendEmail({
        to: application.email,
        subject: `Teacher Application Received — ${org.name}`,
        text: `Hello ${application.name},\n\nYour application to join ${org.name} as a Teacher for ${application.subject} has been received and is currently pending administrator review.\n\nYou will receive an update once the institutional admin reviews your application.\n\nThank you,\n${org.name} Academic Management`
      }),
      ...(org.email && org.email.toLowerCase() !== application.email.toLowerCase() ? [
        sendEmail({
          to: org.email,
          subject: `[Faculty Notice] New Teacher Application Received — ${application.name} (${application.subject})`,
          text: `Dear ${org.name} Administration,\n\nA new teacher application has been submitted by ${application.name} (${application.email}) for the subject/department: "${application.subject}".\n\nPlease log in to your AssessIQ institutional portal to review the applicant's credentials and approve/reject.\n\nAssessIQ Platform Operations`
        })
      ] : []),
      sendEmail({
        to: adminAlertEmail,
        subject: `[AssessIQ Alert] New Teacher Application for ${org.name} — ${application.name}`,
        text: `Hello Administrator,\n\nA new teacher application has been received for institution "${org.name}".\n\nApplicant Details:\n- Name: ${application.name}\n- Email: ${application.email}\n- Phone: ${application.phone}\n- Subject: ${application.subject}\n- Qualification: ${application.qualification}\n- Experience: ${application.experienceYears || 0} years\n\nYou can review this application in the Super Admin or Organization dashboard.\n\nAssessIQ System`
      })
    ]);

    res.status(201).json({
      success: true,
      message: "Teacher application submitted successfully and is pending administrator review.",
      application: {
        id: application._id,
        name: application.name,
        email: application.email,
        organizationName: org.name,
        subject: application.subject,
        status: application.status,
        createdAt: application.createdAt
      }
    });
  } catch (error) {
    console.error("TEACHER APPLICATION ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit teacher application",
      error: error.message
    });
  }
};

// Get Teacher Applications (Org Admin gets their org's, Super Admin gets all)
export const getTeacherApplications = async (req, res) => {
  try {
    const query = {};

    if (!req.isSuperAdmin) {
      if (!req.organizationId) {
        return res.status(403).json({
          success: false,
          message: "Organization access required."
        });
      }
      query.organizationId = req.organizationId;
    } else if (req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const applications = await TeacherApplication.find(query)
      .populate("organizationId", "name slug type")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher applications",
      error: error.message
    });
  }
};

// Approve Teacher Application (Admin or Super Admin)
export const approveTeacherApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await TeacherApplication.findById(id).populate("organizationId", "name");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Role check: Org Admin can only approve applications for their own org
    if (!req.isSuperAdmin && req.organizationId.toString() !== application.organizationId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only approve applications for your own organization."
      });
    }

    if (application.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "This application has already been approved."
      });
    }

    // 1. Check if user already exists
    let user = await User.findOne({ email: application.email });
    let temporaryPassword = null;

    if (user) {
      if (user.role === "super_admin") {
        return res.status(400).json({
          success: false,
          message: "A Platform Super Admin account cannot be altered by a teacher application."
        });
      }
      // Promote existing user to teacher
      user.role = "teacher";
      user.organizationId = application.organizationId._id;
      user.subject = application.subject;
      user.phone = user.phone || application.phone;
      user.status = "active";
      user.isActive = true;
      await user.save();
    } else {
      // Create new Teacher user with a generated secure initial password
      temporaryPassword = `Teach@${Math.floor(100000 + Math.random() * 900000)}`;
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      user = await User.create({
        name: application.name,
        email: application.email,
        phone: application.phone,
        password: hashedPassword,
        role: "teacher",
        organizationId: application.organizationId._id,
        subject: application.subject,
        status: "active",
        isActive: true,
        createdBy: req.user.id
      });
    }

    // 2. Mark application as approved
    application.status = "approved";
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    await application.save();

    // 3. Send approval notification email
    const orgName = application.organizationId?.name || "the institution";
    const portalLoginUrl = `${getClientUrl()}/admin/login`;
    let emailDispatch = null;

    if (temporaryPassword) {
      emailDispatch = await sendAccountCredentialsEmail({
        to: application.email,
        name: application.name,
        email: application.email,
        password: temporaryPassword,
        role: "Faculty / Teacher",
        orgName,
        loginUrl: portalLoginUrl
      });
    } else {
      const elevationSubject = `🎓 AssessIQ Faculty Access Granted — ${orgName}`;
      const elevationHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 14px;">
            <div style="width: 40px; height: 40px; background: #1e1b4b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 800; font-size: 18px; margin-right: 12px;">IQ</div>
            <div>
              <h2 style="margin: 0; color: #0f172a; font-size: 18px;">AssessIQ Faculty Operations</h2>
              <span style="font-size: 13px; color: #64748b;">${orgName}</span>
            </div>
          </div>
          <h3 style="color: #0f172a; margin-top: 0;">Congratulations, ${application.name}!</h3>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Your teacher application for <strong>${orgName}</strong> in <strong>${application.subject}</strong> has been officially approved.
          </p>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <p style="margin: 6px 0; font-size: 14px;"><strong>Account Email:</strong> ${application.email}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Assigned Role:</strong> Faculty / Teacher</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Subject:</strong> ${application.subject}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Faculty Portal Login:</strong> <a href="${portalLoginUrl}" style="color: #2563eb; font-weight: 600;">Sign in with your existing password</a></p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${portalLoginUrl}" style="background: #1e1b4b; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Go to Faculty Portal →</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">AssessIQ Multi-Tenant Examination Platform</p>
        </div>
      `;
      const emailText = `Dear ${application.name},\n\nCongratulations! Your teacher application for ${orgName} in ${application.subject} has been APPROVED.\n\nYour existing AssessIQ account (${application.email}) now has Teacher privileges for ${orgName}.\n\nSign in at: ${portalLoginUrl}\n\nAssessIQ Operations`;
      emailDispatch = await sendEmailQuickOrBackground({
        to: application.email,
        subject: elevationSubject,
        text: emailText,
        html: elevationHtml
      });
    }

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || process.env.EMAIL_USER || "";
    if (adminEmail && adminEmail.toLowerCase() !== application.email.toLowerCase()) {
      sendEmailQuickOrBackground({
        to: adminEmail,
        subject: `[AssessIQ Alert] Teacher Application Approved — ${application.name} (${orgName})`,
        text: `Teacher application for ${application.name} (${application.email}) has been approved for institution ${orgName}.\nRole: Faculty / Teacher\nSubject: ${application.subject}`
      }).catch(err => console.warn("[Admin Alert] Failed:", err.message));
    }

    const emailSent = Boolean(emailDispatch?.real || emailDispatch?.success || emailDispatch?.queued);

    res.status(200).json({
      success: true,
      message: `Teacher application approved successfully. ${user.name} now has Teacher access.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject,
        organizationId: user.organizationId
      },
      temporaryPassword: temporaryPassword || undefined,
      emailSent,
      emailMessage: emailSent ? "Credentials email dispatched." : "Could not send credentials email automatically."
    });
  } catch (error) {
    console.error("APPROVE TEACHER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve application",
      error: error.message
    });
  }
};

// Reject Teacher Application (Admin or Super Admin)
export const rejectTeacherApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await TeacherApplication.findById(id).populate("organizationId", "name");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    if (!req.isSuperAdmin && req.organizationId.toString() !== application.organizationId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only review applications for your own organization."
      });
    }

    application.status = "rejected";
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    application.rejectionReason = reason?.trim() || "Qualifications or departmental capacity requirements not met at this time.";
    await application.save();

    const orgName = application.organizationId?.name || "the institution";
    sendEmailQuickOrBackground({
      to: application.email,
      subject: `Teacher Application Status Update — ${orgName}`,
      text: `Dear ${application.name},\n\nThank you for applying to join ${orgName} as a Teacher. After review, we regret to inform you that we are unable to approve your application at this time.\n\nReason: ${application.rejectionReason}\n\nWe wish you the best in your professional endeavors.\n\n${orgName} Academic Team`
    }).catch(err => console.warn("Could not dispatch teacher rejection email:", err.message));

    res.status(200).json({
      success: true,
      message: "Application rejected.",
      application
    });
  } catch (error) {
    console.error("REJECT TEACHER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject application",
      error: error.message
    });
  }
};
