// Firebase Mailing System Service (Frontend)
// Manages Firebase Auth Password Reset, Email Verification, and Diagnostic Testing
import { auth, sendPasswordResetEmail, isFirebaseConfigured, firebaseConfig } from "../config/firebase.js";
import api from "./api.js";

/**
 * Friendly error messaging for Firebase Auth exceptions
 */
const getFriendlyFirebaseError = (err) => {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account exists with this email address.";
    case "auth/too-many-requests":
      return "Too many requests. Please wait a moment before trying again.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection.";
    default:
      return err?.message || "Failed to dispatch email via Firebase.";
  }
};

/**
 * Dispatches a password reset email using Firebase Auth.
 * Attempts client-side Firebase Auth SDK first, with automatic backend REST fallback.
 *
 * @param {string} email - Recipient email
 * @returns {Promise<{ success: boolean, message: string, email: string, provider: string }>}
 */
export const dispatchFirebasePasswordReset = async (email) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("A valid recipient email address is required.");
  }

  // 1. Try Firebase Client SDK if configured
  if (isFirebaseConfigured()) {
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        email: cleanEmail,
        provider: "Firebase Auth (Client SDK)",
        message: `Firebase password reset link dispatched to ${cleanEmail}. Please check your inbox and spam folder.`
      };
    } catch (clientErr) {
      console.warn("[Firebase Client SDK Reset Failed, attempting backend fallback]:", clientErr.code, clientErr.message);
      
      // If client-side failed due to user-not-found or invalid-email, don't spam backend unless needed
      if (clientErr.code === "auth/invalid-email") {
        throw new Error("Please enter a valid email address.");
      }
    }
  }

  // 2. Seamless Backend REST Fallback
  try {
    const response = await api.post("/auth/firebase-password-reset", { email: cleanEmail });
    return {
      success: true,
      email: cleanEmail,
      provider: "Firebase Identity REST API (Backend)",
      message: response.data?.message || `Firebase password reset link dispatched to ${cleanEmail}.`
    };
  } catch (apiErr) {
    const errorText = apiErr.response?.data?.message || apiErr.message || "Failed to dispatch Firebase email";
    throw new Error(errorText);
  }
};

/**
 * Executes a comprehensive live diagnostic test of the Firebase Mailing System
 * @param {string} testEmail - Recipient email to receive the test dispatch
 */
export const runFirebaseMailDiagnostic = async (testEmail) => {
  const startTime = Date.now();
  const email = (testEmail || "").trim().toLowerCase();

  try {
    const response = await api.all ? api.post("/auth/firebase-test-email", { email }) : await api.get(`/auth/firebase-test-email?email=${encodeURIComponent(email)}`);
    const duration = Date.now() - startTime;

    return {
      success: true,
      durationMs: duration,
      targetEmail: email,
      report: response.data?.report || response.data,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      durationMs: duration,
      targetEmail: email,
      error: err.response?.data?.message || err.message,
      report: err.response?.data?.report || null,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Retrieves the live status of the Firebase Mailing configuration
 */
export const fetchFirebaseMailStatus = async () => {
  try {
    const response = await api.get("/auth/firebase-status");
    return {
      success: true,
      status: response.data?.status || {},
      clientConfigured: isFirebaseConfigured(),
      projectId: firebaseConfig.projectId
    };
  } catch (err) {
    return {
      success: false,
      clientConfigured: isFirebaseConfigured(),
      projectId: firebaseConfig.projectId,
      error: err.message
    };
  }
};

export default {
  dispatchFirebasePasswordReset,
  runFirebaseMailDiagnostic,
  fetchFirebaseMailStatus
};
