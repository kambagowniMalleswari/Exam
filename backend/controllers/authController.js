import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import OrgApplication from "../models/OrgApplication.js";
import TeacherApplication from "../models/TeacherApplication.js";
import generateToken from "../utils/generateToken.js";
import sendEmail, {
  sendEmailQuickOrBackground,
  sendStudentWelcomeEmail,
  sendLoginNotificationEmail,
  sendStudentRegistrationAdminAlert
} from "../utils/sendEmail.js";

// Register user - Public registration strictly registers Student accounts
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      organizationId
    } = req.body;

    // 1. Validation: Name (> 3 characters)
    if (!name || typeof name !== "string" || name.trim().length <= 3) {
      return res.status(400).json({
        success: false,
        message: "Full name / username is required and must be more than 3 characters (at least 4 characters)"
      });
    }

    // 2. Validation: Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required"
      });
    }

    // 3. Validation: Phone (strictly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phone || !phoneRegex.test(phone.toString().trim())) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required and must be exactly 10 digits"
      });
    }

    // 4. Validation: Password strength (uppercase, lowercase, special character, min 6)
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter (A-Z)"
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one lowercase letter (a-z)"
      });
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one special character (!@#$%^&* etc.)"
      });
    }

    // 5. Validation: Confirm password
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    // 6. Check existing user and pending applications (no duplicate emails allowed)
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    const pendingOrg = await OrgApplication.findOne({ email: cleanEmail, status: "pending" });
    if (pendingOrg) {
      return res.status(409).json({
        success: false,
        message: "An organization onboarding application with this email is currently pending review"
      });
    }

    const pendingTeacher = await TeacherApplication.findOne({ email: cleanEmail, status: "pending" });
    if (pendingTeacher) {
      return res.status(409).json({
        success: false,
        message: "A teacher application with this email is currently pending review"
      });
    }

    // 7. Security enforcement: Public registration role is strictly "student"
    const finalRole = "student";

    // 8. Validate organization if provided
    let finalOrgId = null;
    let organization = null;
    if (organizationId) {
      organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: "Selected organization not found"
        });
      }
      if (!organization.isActive || organization.status === "suspended") {
        return res.status(403).json({
          success: false,
          message: "Selected organization is currently inactive or suspended"
        });
      }
      finalOrgId = organization._id;
    }

    // 9. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 10. Create user
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.toString().trim(),
      password: hashedPassword,
      role: finalRole,
      organizationId: finalOrgId,
      status: "active",
      isActive: true
    });

    // 11. Generate JWT token
    const token = generateToken(user);

    // 12. Dispatch student welcome email & admin alert
    await Promise.allSettled([
      sendStudentWelcomeEmail({
        to: user.email,
        name: user.name,
        email: user.email
      }),
      sendStudentRegistrationAdminAlert({
        studentName: user.name,
        studentEmail: user.email,
        studentPhone: user.phone,
        orgName: organization?.name || "Independent / Platform"
      })
    ]);

    // 13. Send response
    res.status(201).json({
      success: true,
      message: "Student account created successfully",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password."
      });
    }

    // Find user by exact email or username prefix
    const rawIdentifier = (email || "").trim();
    const cleanIdentifier = rawIdentifier.toLowerCase();

    let user = await User.findOne({ email: cleanIdentifier });

    if (!user) {
      if (!cleanIdentifier.includes("@")) {
        user = await User.findOne({
          $or: [
            { email: `${cleanIdentifier}@gmail.com` },
            { email: new RegExp(`^${cleanIdentifier}@`, "i") }
          ]
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password."
      });
    }

    // Check account status
    if (user.isActive === false || user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended or inactive. Please contact your administrator."
      });
    }

    // Check organization status if user belongs to one (exempt super admins)
    const isSuperAdminRole = user.role === "super_admin" || user.role === "superadmin";
    if (user.organizationId && !isSuperAdminRole) {
      const org = await Organization.findById(user.organizationId);
      if (org && (org.isActive === false || org.status === "suspended")) {
        return res.status(403).json({
          success: false,
          message: "Your organization account is currently suspended. Please contact support."
        });
      }
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password."
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Send successful login notification email asynchronously
    sendLoginNotificationEmail({
      to: user.email,
      name: user.name,
      role: user.role,
      email: user.email
    }).catch((emailErr) => {
      console.error("[Login Notification Email Error]:", emailErr.message);
    });

    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

// Google OAuth Sign-in / Sign-up
export const googleLogin = async (req, res) => {
  try {
    const { credential, email: directEmail, name: directName, organizationId } = req.body;

    let email = directEmail;
    let name = directName;
    let googleId = null;
    let avatar = "";

    // 1. If Google ID token is supplied from Google Identity Services
    if (credential) {
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (response.ok) {
          const payload = await response.json();
          email = payload.email;
          name = payload.name;
          googleId = payload.sub;
          avatar = payload.picture || "";
        } else {
          // Attempt decoding JWT payload if offline or test token
          const parts = credential.split(".");
          if (parts.length === 3) {
            const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
            email = decoded.email || email;
            name = decoded.name || name;
            googleId = decoded.sub || googleId;
            avatar = decoded.picture || avatar;
          }
        }
      } catch (tokenErr) {
        console.warn("[Google Auth Warning]: Could not verify with Google API, checking fallback:", tokenErr.message);
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google authentication failed to provide a valid email."
      });
    }

    // 2. Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase().trim() }]
    });

    if (user) {
      // Check account status
      if (user.isActive === false || user.status === "suspended") {
        return res.status(403).json({
          success: false,
          message: "Your account is currently suspended. Please contact support."
        });
      }

      // Link googleId or avatar if not yet attached
      if (!user.googleId && googleId) user.googleId = googleId;
      if (!user.avatar && avatar) user.avatar = avatar;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // 3. New user - auto-create as student
      // Do not allow Google login to automatically create privileged roles
      let finalOrgId = null;
      if (organizationId) {
        const org = await Organization.findById(organizationId);
        if (org && org.isActive && org.status === "active") {
          finalOrgId = org._id;
        }
      }

      const randomPassword = crypto.randomBytes(16).toString("hex") + "A1!";
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        googleId: googleId || crypto.randomUUID(),
        avatar: avatar || "",
        role: "student", // Strictly student
        organizationId: finalOrgId,
        status: "active",
        isActive: true,
        lastLogin: new Date()
      });
    }

    // 4. Generate token
    const token = generateToken(user);

    // Send successful login notification email asynchronously
    sendLoginNotificationEmail({
      to: user.email,
      name: user.name,
      role: user.role,
      email: user.email
    }).catch((emailErr) => {
      console.error("[Google Login Notification Email Error]:", emailErr.message);
    });

    res.status(200).json({
      success: true,
      message: "Google sign-in successful",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        organizationId: user.organizationId
      }
    });
  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Google authentication failed",
      error: error.message
    });
  }
};

// Get current logged-in user profile
export const getCurrentUser = async (req, res) => {
  try {
    let user = await User.findById(req.user.id)
      .select("-password")
      .populate("organizationId", "name slug type logo subscriptionPlan subscriptionStatus");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Ensure super_admin has no organization attached
    if (user.role === "super_admin" && user.organizationId) {
      await User.findByIdAndUpdate(user._id, { $unset: { organizationId: 1 } });
      user.organizationId = null;
    }

    // Issue fresh JWT token reflecting current role and organization
    const freshToken = generateToken(user);
    res.setHeader("x-new-token", freshToken);
    res.setHeader("Access-Control-Expose-Headers", "x-new-token");

    res.status(200).json({
      success: true,
      user,
      token: freshToken
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message
    });
  }
};

// Update current logged-in user profile details (Name, Phone, Subject)
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, subject } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (name !== undefined) {
      if (!name || name.trim().length <= 3) {
        return res.status(400).json({
          success: false,
          message: "Name must be more than 3 characters (at least 4 characters)"
        });
      }
      user.name = name.trim();
    }

    if (phone !== undefined) {
      const cleanPhone = phone.toString().trim();
      if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 digits"
        });
      }
      user.phone = cleanPhone;
    }

    if (subject !== undefined && user.role === "teacher") {
      user.subject = subject.trim();
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("organizationId", "name slug type logo");

    res.status(200).json({
      success: true,
      message: "Profile details updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};

// Request Password Reset OTP via Email
export const sendResetPasswordOtp = async (req, res) => {
  try {
    const targetEmail = req.body.email?.toLowerCase().trim() || req.user?.email;

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: "Email address is required to request a reset code"
      });
    }

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      // Security standard: don't reveal email existence in unauthenticated context,
      // but return friendly message
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a 6-digit verification code has been dispatched."
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = expires;
    await user.save();

    // Dispatch OTP email to user (non-blocking)
    sendEmailQuickOrBackground({
      to: user.email,
      subject: "AssessIQ Platform — Password Reset Verification Code",
      text: `Hello ${user.name},\n\nYour 6-digit password reset verification code is:\n\n${otp}\n\nThis code will expire in 10 minutes. If you did not request a password change, please ignore this email or contact platform support.\n\nAssessIQ Security Operations`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="width: 36px; height: 36px; background: #1e3a8a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 12px;">IQ</div>
            <h3 style="margin: 0; color: #0f172a; font-size: 18px;">AssessIQ Platform Security</h3>
          </div>
          <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 12px;">Password Reset Verification</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">Hello <strong>${user.name}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">You have requested to reset or modify your account password. Use the single-use 6-digit verification code below to authorize this change:</p>
          <div style="margin: 28px 0; text-align: center;">
            <span style="font-family: 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 14px 28px; border-radius: 10px; border: 2px dashed #93c5fd; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 6px;">⏱️ This verification code is valid for <strong>10 minutes</strong>.</p>
          <p style="color: #64748b; font-size: 13px;">If you did not initiate this request, please change your credentials immediately or notify your institution administrator.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">AssessIQ Multi-Tenant Institutional Assessment Platform</p>
        </div>
      `
    }).catch(err => console.warn("[OTP Email Dispatch Warning]:", err.message));

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}.`,
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {})
    });
  } catch (error) {
    console.error("Send Reset OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to dispatch reset code",
      error: error.message
    });
  }
};

// Verify OTP and Reset Password
export const verifyResetPasswordOtp = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    const targetEmail = email?.toLowerCase().trim() || req.user?.email;

    if (!targetEmail || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, 6-digit OTP code, and new password are required"
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter (A-Z)"
      });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one lowercase letter (a-z)"
      });
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one special character (!@#$%^&* etc.)"
      });
    }

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or verification code"
      });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
    }

    if (!user.resetPasswordOtpExpires || new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a fresh OTP."
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully. You can now use your new password to sign in."
    });
  } catch (error) {
    console.error("Verify OTP and Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message
    });
  }
};