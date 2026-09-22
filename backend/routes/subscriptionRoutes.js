// Import Express
import express from "express";

// Import subscription controllers
import {
  getCurrentSubscription,
  upgradeSubscription,
  getAllSubscriptions
} from "../controllers/subscriptionController.js";

// Import middleware
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

// Create router
const router = express.Router();

// Protect all subscription routes
router.use(protect);
router.use(tenantMiddleware);

// Get current organization subscription & usage
router.get(
  "/current",
  authorize("admin", "org_admin", "super_admin"),
  getCurrentSubscription
);

// Upgrade subscription
router.post(
  "/upgrade",
  authorize("admin", "org_admin", "super_admin"),
  upgradeSubscription
);

// Get all subscriptions (Super Admin)
router.get(
  "/",
  authorize("super_admin"),
  getAllSubscriptions
);

// Export router
export default router;
