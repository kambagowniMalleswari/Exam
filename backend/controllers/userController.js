import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Batch from "../models/Batch.js";
import Organization from "../models/Organization.js";
import OrgApplication from "../models/OrgApplication.js";
import TeacherApplication from "../models/TeacherApplication.js";
import { sendAccountCredentialsEmail } from "../utils/sendEmail.js";

// Get users in current organization (or all users for super admin)
export const getUsers = async (req, res) => {
  try {
    const query = {};

    if (!req.isSuperAdmin) {
      if (!req.organizationId) {
        return res.status(200).json({
          success: true,
          count: 0,
          users: []
        });
      }
      query.organizationId = req.organizationId;
    } else if (req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    }

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.batchId) {
      query.batchId = req.query.batchId;
    }

    const users = await User.find(query)
      .select("-password")
      .populate("organizationId", "name slug")
      .populate("batchId", "name batchNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message
    });
  }
};

// Get students in current organization
export const getStudents = async (req, res) => {
  try {
    const query = { role: "student" };

    if (!req.isSuperAdmin) {
      if (!req.organizationId) {
        return res.status(200).json({
          success: true,
          count: 0,
          students: []
        });
      }
      query.organizationId = req.organizationId;
    } else if (req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    }

    if (req.query.batchId) {
      query.batchId = req.query.batchId;
    }

    const students = await User.find(query)
      .select("-password")
      .populate("batchId", "name batchNumber department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get students",
      error: error.message
    });
  }
};

// Get teachers in current organization
export const getTeachers = async (req, res) => {
  try {
    const query = { role: "teacher" };

    if (!req.isSuperAdmin) {
      if (!req.organizationId) {
        return res.status(200).json({
          success: true,
          count: 0,
          teachers: []
        });
      }
      query.organizationId = req.organizationId;
    } else if (req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    }


    const teachers = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get teachers",
      error: error.message
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const query = { _id: id };
    if (!req.isSuperAdmin) {
      query.organizationId = req.organizationId;
    }

    const user = await User.findOne(query).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message
    });
  }
};

// Create student or teacher
export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, subject, batchId } = req.body;

    // Check required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required"
      });
    }

    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Only student or teacher roles can be created here"
      });
    }

    // Check existing email across User collection and pending applications (no duplicates)
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email address already exists in the system"
      });
    }

    const pendingOrg = await OrgApplication.findOne({ email: cleanEmail, status: "pending" });
    if (pendingOrg) {
      return res.status(409).json({
        success: false,
        message: "An institutional application with this email address is pending review"
      });
    }

    const pendingTeacher = await TeacherApplication.findOne({ email: cleanEmail, status: "pending" });
    if (pendingTeacher) {
      return res.status(409).json({
        success: false,
        message: "A faculty application with this email address is pending review"
      });
    }

    // Target organization ID
    const targetOrgId = req.isSuperAdmin
      ? req.body.organizationId || req.organizationId
      : req.organizationId;

    if (!targetOrgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required"
      });
    }

    const org = await Organization.findById(targetOrgId);

    // Resolve batch if provided
    let resolvedBatchId = null;
    let resolvedBatchNumber = "";
    if (role === "student" && batchId) {
      const batch = await Batch.findById(batchId);
      if (batch) {
        resolvedBatchId = batch._id;
        resolvedBatchNumber = batch.batchNumber;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user inside organization
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone || "",
      subject: subject || "",
      password: hashedPassword,
      role,
      organizationId: targetOrgId,
      createdBy: req.user.id,
      batchId: resolvedBatchId,
      batchNumber: resolvedBatchNumber,
      status: "active",
      isActive: true
    });

    // Send account credentials and temporary password email asynchronously
    sendAccountCredentialsEmail({
      to: user.email,
      name: user.name,
      email: user.email,
      password: password,
      role: user.role === "teacher" ? "Faculty / Teacher" : "Student",
      orgName: org?.name || "AssessIQ Institution",
      loginUrl: "http://localhost:5173/login"
    }).catch((emailErr) => {
      console.error("[User Account Credentials Email Error]:", emailErr.message);
    });

    res.status(201).json({
      success: true,
      message: `${role === "student" ? "Student" : "Teacher"} created successfully. Login credentials sent to email.`,
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
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const query = { _id: id };
    if (!req.isSuperAdmin) {
      query.organizationId = req.organizationId;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const { name, email, phone, password, role, status, subject, batchId } = req.body;

    if (name) user.name = name.trim();
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        // Enforce uniqueness across all users
        const duplicateUser = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (duplicateUser) {
          return res.status(409).json({
            success: false,
            message: "Another user with this email already exists"
          });
        }
        user.email = cleanEmail;
      }
    }
    if (phone !== undefined) user.phone = phone;
    if (subject !== undefined) user.subject = subject;
    if (role && ["student", "teacher"].includes(role)) user.role = role;
    if (status && ["active", "suspended", "pending"].includes(status)) {
      user.status = status;
      user.isActive = status === "active";
    }

    if (batchId !== undefined) {
      if (batchId) {
        const batch = await Batch.findById(batchId);
        if (batch) {
          user.batchId = batch._id;
          user.batchNumber = batch.batchNumber;
        }
      } else {
        user.batchId = null;
        user.batchNumber = "";
      }
    }

    if (password && password.length >= 6) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message
    });
  }
};

// Activate or deactivate user
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const query = { _id: id };
    if (!req.isSuperAdmin) {
      query.organizationId = req.organizationId;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isActive = !user.isActive;
    user.status = user.isActive ? "active" : "suspended";
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        isActive: user.isActive,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const query = { _id: id };
    if (!req.isSuperAdmin) {
      query.organizationId = req.organizationId;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
};