import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { auth, googleProvider, signInWithPopup } from "../config/firebase.js";
import {
  BuildingIcon,
  ClockIcon,
  BarChartIcon,
  TagIcon,
  GraduationCapIcon,
  BookOpenIcon,
  ShieldIcon,
  MailIcon,
  KeyIcon,
  CheckCircleIcon,
  AlertTriangleIcon
} from "../components/common/Icons.jsx";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import api from "../services/api.js";
import { getDefaultDashboard, isRoleAuthorizedForPath, normalizeRole } from "../utils/roleUtils.js";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Universal Sign In | AssessIQ";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();

  const handleRoleRedirect = (userRole) => {
    const normalized = normalizeRole(userRole);
    if (normalized === "super_admin") {
      navigate("/superadmin/dashboard", { replace: true });
      return;
    }
    if (normalized === "org_admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
    if (normalized === "teacher") {
      navigate("/teacher/dashboard", { replace: true });
      return;
    }
    if (normalized === "student") {
      navigate("/student/dashboard", { replace: true });
      return;
    }

    const from = location.state?.from?.pathname;
    if (from && isRoleAuthorizedForPath(userRole, from)) {
      navigate(from, { replace: true });
      return;
    }

    navigate(getDefaultDashboard(userRole), { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedInput = email.trim();
    const cleanPassword = password.trim();

    if (!trimmedInput || !cleanPassword) {
      setError("Please fill in both email/username and password.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await login(trimmedInput, cleanPassword);
      handleRoleRedirect(res.user?.role);
    } catch (err) {
      console.error("Login failure:", err);
      const backendMsg = err.response?.data?.message;
      if (backendMsg) {
        setError(backendMsg);
      } else if (err.message && !err.response) {
        setError(`Connection failed: ${err.message}. Please check your connection.`);
      } else {
        setError("Invalid email or password. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password modal state (3-Step Progression)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ text: "", type: "" });
  const [forgotResendTimer, setForgotResendTimer] = useState(0);

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval = null;
    if (forgotResendTimer > 0) {
      interval = setInterval(() => {
        setForgotResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [forgotResendTimer]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      let userEmail = "";
      let userName = "";
      let userAvatar = "";
      let idToken = "";

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        userEmail = fbUser.email;
        userName = fbUser.displayName || fbUser.email.split("@")[0];
        userAvatar = fbUser.photoURL || "";
        idToken = await fbUser.getIdToken();
      } catch (fbErr) {
        console.warn("[Firebase Google Sign-in Notice]:", fbErr.code, fbErr.message);
        if (fbErr.code === "auth/popup-closed-by-user" || fbErr.code === "auth/cancelled-popup-request") {
          setLoading(false);
          return;
        }
        if (fbErr.code === "auth/api-key-not-valid" || fbErr.code === "auth/invalid-api-key") {
          throw new Error("Firebase Authentication is not yet linked to your project API Key. Please refer to FIREBASE_SETUP_GUIDE.md to add your credentials in frontend/.env.");
        }
        throw fbErr;
      }

      if (!userEmail) {
        throw new Error("Google did not provide a valid email account.");
      }

      const res = await loginWithGoogle({
        email: userEmail,
        name: userName,
        avatar: userAvatar,
        credential: idToken
      });

      handleRoleRedirect(res.user?.role);
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      setError(err.response?.data?.message || err.message || "Google sign-in encountered an issue.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Dispatch OTP code to user's registered email
  const handleSendForgotOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotMsg({ text: "", type: "" });
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setForgotMsg({ text: "Please enter your registered account email.", type: "error" });
      return;
    }
    try {
      setForgotLoading(true);
      const res = await api.post("/auth/send-reset-otp", { email: cleanEmail });
      setForgotMsg({ text: res.data?.message || `A 6-digit code has been dispatched to ${cleanEmail}.`, type: "success" });
      setForgotStep(2);
      setForgotResendTimer(45);
    } catch (err) {
      setForgotMsg({ text: err.response?.data?.message || "Failed to dispatch reset code.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2 Resend: Re-dispatch fresh OTP code
  const handleResendForgotOtp = async () => {
    if (forgotResendTimer > 0 || forgotLoading) return;
    setForgotMsg({ text: "", type: "" });
    try {
      setForgotLoading(true);
      const res = await api.post("/auth/send-reset-otp", { email: forgotEmail.trim() });
      setForgotMsg({ text: res.data?.message || "A fresh 6-digit verification code has been dispatched.", type: "success" });
      setForgotResendTimer(45);
    } catch (err) {
      setForgotMsg({ text: err.response?.data?.message || "Failed to resend reset code.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP only
  const handleVerifyForgotOtpStep = async (e) => {
    e.preventDefault();
    setForgotMsg({ text: "", type: "" });
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp) {
      setForgotMsg({ text: "Please enter the 6-digit verification code.", type: "error" });
      return;
    }
    if (cleanOtp.length !== 6) {
      setForgotMsg({ text: "Verification code must be exactly 6 digits.", type: "error" });
      return;
    }
    try {
      setForgotLoading(true);
      const res = await api.post("/auth/verify-otp", {
        email: forgotEmail.trim(),
        otp: cleanOtp
      });
      setForgotMsg({ text: res.data?.message || "Identity confirmed! Now create your new password.", type: "success" });
      setForgotStep(3);
    } catch (err) {
      setForgotMsg({ text: err.response?.data?.message || "Invalid or expired verification code.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Create and submit new password
  const handleResetPasswordFinal = async (e) => {
    e.preventDefault();
    setForgotMsg({ text: "", type: "" });
    if (!forgotNewPass || !forgotConfirmPass) {
      setForgotMsg({ text: "Please enter and confirm your new password.", type: "error" });
      return;
    }
    if (forgotNewPass.length < 6) {
      setForgotMsg({ text: "Password must be at least 6 characters long.", type: "error" });
      return;
    }
    if (!/[A-Z]/.test(forgotNewPass)) {
      setForgotMsg({ text: "Password must contain at least 1 uppercase letter (A-Z).", type: "error" });
      return;
    }
    if (!/[a-z]/.test(forgotNewPass)) {
      setForgotMsg({ text: "Password must contain at least 1 lowercase letter (a-z).", type: "error" });
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(forgotNewPass)) {
      setForgotMsg({ text: "Password must contain at least 1 special character (!@#$%^&* etc.).", type: "error" });
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotMsg({ text: "Passwords do not match. Please re-check.", type: "error" });
      return;
    }
    try {
      setForgotLoading(true);
      const res = await api.post("/auth/verify-reset-otp", {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPass,
        confirmPassword: forgotConfirmPass
      });
      setForgotMsg({ text: res.data?.message || "Password updated successfully! You can now log in.", type: "success" });
      setEmail(forgotEmail.trim());
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotOtp("");
        setForgotNewPass("");
        setForgotConfirmPass("");
        setForgotMsg({ text: "", type: "" });
      }, 2000);
    } catch (err) {
      setForgotMsg({ text: err.response?.data?.message || "Failed to update password. Please try again.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-panel-top">
          <Link to="/" className="auth-brand-header">
            <div className="brand-icon-box" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
              <BrandCrest size={32} />
            </div>
            <div className="brand-text-stack">
              <span className="brand-name">AssessIQ</span>
              <span className="brand-role-tag">Unified Institutional Access</span>
            </div>
          </Link>
        </div>

        <div className="auth-form-body">
          <div className="auth-title-block">
            <h1 className="auth-main-heading">Sign In to Your Workspace</h1>
            <p className="auth-main-sub">
              Access your institutional assessment portal and exam workspaces.
            </p>
          </div>

          {error && (
            <div className="auth-status-alert error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-fields">
            <div className="field-group">
              <label htmlFor="email" className="field-label">Email or Username</label>
              <div className="field-input-box">
                <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="3"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <input
                  id="email"
                  type="text"
                  className="field-input"
                  placeholder="e.g. name@institution.edu or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="password" className="field-label">Password</label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotStep(1);
                    setForgotEmail(email);
                    setForgotMsg({ text: "", type: "" });
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="field-input-box">
                <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="field-input"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="field-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" y1="2" x2="22" y2="22"></line>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading-state">
                  <span className="btn-spinner"></span>
                  <span>Verifying Credentials & Workspace...</span>
                </span>
              ) : (
                "Sign In to Workspace →"
              )}
            </button>
          </form>

          <div className="auth-divider-line">
            <span>or sign in with</span>
          </div>

          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            id="google-signin-button"
          >
            <svg className="google-brand-svg" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>{loading ? "Signing in..." : "Continue with Google"}</span>
          </button>

          <div className="auth-switch-row">
            <span>New Student Scholar?</span>
            <Link to="/register" className="auth-switch-link">Register student account →</Link>
          </div>

          {/* Institutional Onboarding Card */}
          <div className="auth-advisory-card">
            <div className="advisory-icon-circle">
              <BuildingIcon size={22} />
            </div>
            <div className="advisory-body">
              <strong>Institution or Faculty Access?</strong>
              <p>Sign in above using your assigned institutional credentials. New colleges, universities, or educators can apply for platform access below.</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
                <Link to="/join-us" className="advisory-cta-link">Institutional Onboarding →</Link>
                <Link to="/join-us?track=teacher" className="advisory-cta-link">Faculty Application →</Link>
                <Link to="/contact" className="advisory-cta-link">Contact Support →</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-panel-bottom">
          <span>© 2026 AssessIQ Institutional Assessment Systems</span>
          <div className="panel-footer-links">
            <Link to="/contact">Help Desk</Link>
            <span>·</span>
            <Link to="/public-tests">Public Exams</Link>
          </div>
        </div>
      </div>

      {/* Right Visual Showcase Panel */}
      <div className="auth-visual-panel">
        <div className="visual-panel-inner">
          <div className="visual-top-badge">
            <span className="status-live-indicator"></span>
            <span>ENTERPRISE ACADEMIC ARCHITECTURE</span>
          </div>

          <h2 className="visual-headline">
            Institutional examination integrity made effortless.
          </h2>

          <p className="visual-subtext">
            Experience server-enforced countdown timers, zero client tampering, instant auto-grading with negative marking, and certified academic transcripts.
          </p>

          <div className="visual-features-stack">
            <div className="visual-feat-card">
              <div className="feat-icon-bubble">
                <ClockIcon size={20} />
              </div>
              <div className="feat-details">
                <strong>Server-Synchronized Examination Clocks</strong>
                <p>Hardware-level time enforcement ensures zero clock manipulation with automatic submission on expiry.</p>
              </div>
            </div>

            <div className="visual-feat-card">
              <div className="feat-icon-bubble">
                <BarChartIcon size={20} />
              </div>
              <div className="feat-details">
                <strong>Automated Multi-Criterion Evaluation</strong>
                <p>Instant scoring with negative marking algorithms, question difficulty breakdown, and topic mastery matrices.</p>
              </div>
            </div>

            <div className="visual-feat-card">
              <div className="feat-icon-bubble">
                <TagIcon size={20} />
              </div>
              <div className="feat-details">
                <strong>Tenant-Isolated Candidate Batches</strong>
                <p>Assign exams directly to course batches, sections, or academic semesters with precise eligibility controls.</p>
              </div>
            </div>
          </div>

          <div className="visual-stats-row">
            <div className="visual-stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-caption">Exam Uptime</span>
            </div>
            <div className="stat-sep"></div>
            <div className="visual-stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-caption">Tests Evaluated</span>
            </div>
            <div className="stat-sep"></div>
            <div className="visual-stat-item">
              <span className="stat-number">0-Lag</span>
              <span className="stat-caption">Auto-Grading</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password OTP Modal */}
      {showForgotModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-box">
            <div className="auth-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <KeyIcon size={20} />
                <h3>Reset Password via Email OTP</h3>
              </div>
              <button
                type="button"
                className="auth-modal-close"
                onClick={() => setShowForgotModal(false)}
              >
                ✕
              </button>
            </div>

            {forgotMsg.text && (
              <div className={`auth-status-alert ${forgotMsg.type === "error" ? "error" : "success"}`} style={{ margin: "1rem" }}>
                {forgotMsg.type === "error" ? <AlertTriangleIcon size={18} /> : <CheckCircleIcon size={18} />}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            {/* Step Progress Bar */}
            <div className="auth-modal-stepper" style={{ margin: "1rem 1.25rem 0 1.25rem" }}>
              <div className={`modal-step-item ${forgotStep === 1 ? "active" : "completed"}`}>
                <span className="modal-step-num">{forgotStep > 1 ? "✓" : "1"}</span>
                <span>Email</span>
              </div>
              <span className="modal-step-arrow">→</span>
              <div className={`modal-step-item ${forgotStep === 2 ? "active" : forgotStep > 2 ? "completed" : ""}`}>
                <span className="modal-step-num">{forgotStep > 2 ? "✓" : "2"}</span>
                <span>Verify OTP</span>
              </div>
              <span className="modal-step-arrow">→</span>
              <div className={`modal-step-item ${forgotStep === 3 ? "active" : ""}`}>
                <span className="modal-step-num">3</span>
                <span>Set Password</span>
              </div>
            </div>

            {/* STEP 1: Enter Account Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendForgotOtp} className="auth-modal-body">
                <p className="auth-modal-desc">
                  Enter your registered institutional account email. We will dispatch a 6-digit verification code to verify your identity.
                </p>
                <div className="field-group">
                  <label className="field-label">Registered Account Email</label>
                  <div className="field-input-box">
                    <MailIcon size={18} className="field-icon" />
                    <input
                      type="email"
                      className="field-input"
                      placeholder="e.g. scholar@university.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="auth-modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Dispatching..." : "Dispatch Verification Code →"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter & Confirm OTP Only */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyForgotOtpStep} className="auth-modal-body">
                <p className="auth-modal-desc">
                  Enter the 6-digit one-time verification code dispatched to <strong>{forgotEmail}</strong>.
                </p>

                <div className="field-group">
                  <label className="field-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>6-Digit Verification OTP</span>
                    <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: "normal" }}>Numbers only</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="field-input auth-otp-large-input"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    autoFocus
                  />
                  <div className="auth-modal-resend-row">
                    <span>Didn't receive the code?</span>
                    <button
                      type="button"
                      className="btn-link-resend"
                      disabled={forgotResendTimer > 0 || forgotLoading}
                      onClick={handleResendForgotOtp}
                    >
                      {forgotResendTimer > 0 ? `Resend Code (${forgotResendTimer}s)` : "Resend Verification Code"}
                    </button>
                  </div>
                </div>

                <div className="auth-modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotMsg({ text: "", type: "" });
                    }}
                  >
                    ← Change Email
                  </button>
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={forgotLoading || forgotOtp.trim().length !== 6}
                  >
                    {forgotLoading ? "Verifying OTP..." : "Confirm OTP & Continue →"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Create New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPasswordFinal} className="auth-modal-body">
                <p className="auth-modal-desc" style={{ color: "#16a34a", fontWeight: "600" }}>
                  ✓ Code verified for {forgotEmail}! Now set a new strong password.
                </p>

                <div className="field-group">
                  <label className="field-label">New Password</label>
                  <div className="field-input-box">
                    <KeyIcon size={18} className="field-icon" />
                    <input
                      type={showForgotNewPass ? "text" : "password"}
                      className="field-input"
                      placeholder="Minimum 6 characters"
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      className="field-toggle-visibility"
                      onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                      tabIndex="-1"
                    >
                      {showForgotNewPass ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Confirm New Password</label>
                  <div className="field-input-box">
                    <KeyIcon size={18} className="field-icon" />
                    <input
                      type={showForgotConfirmPass ? "text" : "password"}
                      className="field-input"
                      placeholder="Re-enter new password"
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="field-toggle-visibility"
                      onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                      tabIndex="-1"
                    >
                      {showForgotConfirmPass ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="pwd-checklist-card">
                  <span className="pwd-checklist-title">Password Security Requirements:</span>
                  <div className="pwd-checklist-grid">
                    <span className={`pwd-check-item ${forgotNewPass.length >= 6 ? "valid" : "invalid"}`}>
                      {forgotNewPass.length >= 6 ? "✓" : "○"} At least 6 characters
                    </span>
                    <span className={`pwd-check-item ${/[A-Z]/.test(forgotNewPass) ? "valid" : "invalid"}`}>
                      {/[A-Z]/.test(forgotNewPass) ? "✓" : "○"} 1 Uppercase (A-Z)
                    </span>
                    <span className={`pwd-check-item ${/[a-z]/.test(forgotNewPass) ? "valid" : "invalid"}`}>
                      {/[a-z]/.test(forgotNewPass) ? "✓" : "○"} 1 Lowercase (a-z)
                    </span>
                    <span className={`pwd-check-item ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(forgotNewPass) ? "valid" : "invalid"}`}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(forgotNewPass) ? "✓" : "○"} 1 Special character (!@#$)
                    </span>
                  </div>
                  {forgotConfirmPass && (
                    <div style={{ marginTop: "6px", borderTop: "1px dashed #e2e8f0", paddingTop: "6px" }}>
                      <span className={`pwd-check-item ${forgotNewPass === forgotConfirmPass ? "valid" : "invalid"}`}>
                        {forgotNewPass === forgotConfirmPass ? "✓ Passwords match" : "✕ Passwords do not match"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="auth-modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => {
                      setForgotStep(2);
                      setForgotMsg({ text: "", type: "" });
                    }}
                  >
                    ← Re-check OTP
                  </button>
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={forgotLoading || !forgotNewPass || forgotNewPass !== forgotConfirmPass}
                  >
                    {forgotLoading ? "Updating Password..." : "Create New Password →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;