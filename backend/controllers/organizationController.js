// Import Organization, User, and Test models
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Test from "../models/Test.js";
import mongoose from "mongoose";

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

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
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
    const organizations = await Organization.find().sort({ createdAt: -1 });

    // Fetch user and test counts for each organization
    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await User.countDocuments({ organizationId: org._id });
        const testCount = await Test.countDocuments({ organizationId: org._id });
        return {
          ...org.toObject(),
          totalUsers: userCount,
          totalTests: testCount
        };
      })
    );

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