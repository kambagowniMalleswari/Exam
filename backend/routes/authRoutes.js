// Import Express
import express from "express";

// Import authentication controllers
import {
  register,
  login,
  googleLogin,
  getCurrentUser,
  updateProfile,
  sendResetPasswordOtp,
  verifyResetPasswordOtp
} from "../controllers/authController.js";

// Import authentication middleware
import protect from "../middleware/authMiddleware.js";

// Create router
const router = express.Router();

// Register user
router.post("/register", register);

// Login user
router.post("/login", login);

// Google OAuth Login
router.post("/google", googleLogin);

// Get profile
router.get("/profile", protect, getCurrentUser);
router.get("/me", protect, getCurrentUser);

// Update profile details
router.put("/profile", protect, updateProfile);
router.put("/update-profile", protect, updateProfile);

// OTP-based Password Reset (accessible logged-in or logged-out via email)
router.post("/send-reset-otp", sendResetPasswordOtp);
router.post("/verify-reset-otp", verifyResetPasswordOtp);

// Export router
export default router;