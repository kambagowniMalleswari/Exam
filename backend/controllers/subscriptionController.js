// Import Subscription, Organization, User, and Test models
import Subscription from "../models/Subscription.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Test from "../models/Test.js";

// Plan limits definition
const PLAN_LIMITS = {
  free: { maxTests: 5, maxStudents: 100, price: 0, features: ["5 Tests", "100 Students", "Standard Reports"] },
  basic: { maxTests: 25, maxStudents: 500, price: 29, features: ["25 Tests", "500 Students", "Detailed Analytics", "Export Results"] },
  pro: { maxTests: 100, maxStudents: 2500, price: 79, features: ["100 Tests", "2,500 Students", "Advanced Analytics", "Question Bank", "Custom Certificates"] },
  enterprise: { maxTests: 99999, maxStudents: 99999, price: 199, features: ["Unlimited Tests", "Unlimited Students", "Dedicated Support", "Custom Branding", "API Access"] }
};

// Get current organization subscription & usage
export const getCurrentSubscription = async (req, res) => {
  try {
    const orgId = req.isSuperAdmin
      ? req.query.organizationId || req.organizationId
      : req.organizationId;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required"
      });
    }

    let subscription = await Subscription.findOne({ organizationId: orgId });
    const org = await Organization.findById(orgId);

    // If no subscription record exists yet, create default free tier
    if (!subscription && org) {
      const planTier = org.subscriptionPlan || "free";
      const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;

      subscription = await Subscription.create({
        organizationId: orgId,
        plan: planTier,
        status: "active",
        maxTests: limits.maxTests,
        maxStudents: limits.maxStudents,
        price: limits.price,
        features: limits.features,
        startDate: new Date()
      });
    }

    // Measure actual usage
    const testsUsed = await Test.countDocuments({ organizationId: orgId });
    const studentsUsed = await User.countDocuments({ organizationId: orgId, role: "student" });

    res.status(200).json({
      success: true,
      subscription,
      usage: {
        testsUsed,
        testsLimit: subscription?.maxTests || 5,
        studentsUsed,
        studentsLimit: subscription?.maxStudents || 100
      },
      availablePlans: PLAN_LIMITS
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get subscription information",
      error: error.message
    });
  }
};

// Upgrade plan
export const upgradeSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const orgId = req.organizationId;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required"
      });
    }

    if (!plan || !PLAN_LIMITS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected"
      });
    }

    const limits = PLAN_LIMITS[plan];

    let subscription = await Subscription.findOne({ organizationId: orgId });
    if (!subscription) {
      subscription = await Subscription.create({
        organizationId: orgId,
        plan,
        status: "active",
        maxTests: limits.maxTests,
        maxStudents: limits.maxStudents,
        price: limits.price,
        features: limits.features
      });
    } else {
      subscription.plan = plan;
      subscription.maxTests = limits.maxTests;
      subscription.maxStudents = limits.maxStudents;
      subscription.price = limits.price;
      subscription.features = limits.features;
      subscription.status = "active";
      await subscription.save();
    }

    // Update organization record
    await Organization.findByIdAndUpdate(orgId, {
      subscriptionPlan: plan,
      subscriptionStatus: "active"
    });

    res.status(200).json({
      success: true,
      message: `Plan upgraded to ${plan.toUpperCase()} successfully`,
      subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upgrade subscription",
      error: error.message
    });
  }
};

// List all subscriptions (Super Admin)
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate("organizationId", "name email slug")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      subscriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions",
      error: error.message
    });
  }
};

// Update subscription tier, quotas, and status (Super Admin)
export const updateSubscriptionBySuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, status, maxTests, maxStudents, price } = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    if (plan) {
      subscription.plan = plan;
      if (PLAN_LIMITS[plan]) {
        subscription.features = PLAN_LIMITS[plan].features;
      }
    }
    if (status) subscription.status = status;
    if (maxTests !== undefined) subscription.maxTests = Number(maxTests);
    if (maxStudents !== undefined) subscription.maxStudents = Number(maxStudents);
    if (price !== undefined) subscription.price = Number(price);

    await subscription.save();

    if (subscription.organizationId) {
      await Organization.findByIdAndUpdate(subscription.organizationId, {
        ...(plan && { subscriptionPlan: plan }),
        ...(status && { subscriptionStatus: status })
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update subscription",
      error: error.message
    });
  }
};
