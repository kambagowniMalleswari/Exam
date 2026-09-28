import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { auth, googleProvider, signInWithPopup } from "../../config/firebase.js";
import { BrandCrest } from "../../components/common/BrandLogo.jsx";
import {
  BuildingIcon,
  ClockIcon,
  BarChartIcon,
  KeyIcon,
  GraduationCapIcon,
  ShieldIcon,
  FileTextIcon
} from "../../components/common/Icons.jsx";
import api from "../../services/api.js";
import { getDefaultDashboard, isRoleAuthorizedForPath } from "../../utils/roleUtils.js";
import "../Login.css";

const TeacherLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Faculty Sign In | AssessIQ";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();

  const handleRoleRedirect = (userRole) => {
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

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !password) {
      setError("Please provide both email address and password.");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await login(trimmedEmail, password);
      handleRoleRedirect(res.user?.role);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid educator credentials or unauthorized account.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ text: "", type: "" });

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
          throw new Error("Firebase Authentication is not yet linked. Please check frontend/.env.");
        }
        throw fbErr;
      }

      if (!userEmail) {
        throw new Error("Google did not return an authorized email address.");
      }

      const res = await loginWithGoogle({
        email: userEmail,
        name: userName,
        avatar: userAvatar,
        credential: idToken
      });

      handleRoleRedirect(res.user?.role);
    } catch (err) {
      console.error("Teacher Google Sign-In Error:", err);
      setError(err.response?.data?.message || err.message || "Google sign-in encountered an issue.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setForgotMsg({ text: "", type: "" });
    if (!forgotEmail.trim()) {
      setForgotMsg({ text: "Please enter your registered educator email.", type: "error" });
      return;
    }
    try {
      setForgotLoading(true);
      const res = await api.post("/auth/send-reset-otp", { email: forgotEmail.trim() });
      setForgotMsg({ text: res.data?.message || "Verification code sent to your email.", type: "success" });
      setForgotStep(2);
    } catch (err) {
      setForgotMsg({ text: err.response?.data?.message || "Failed to send reset code.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    setForgotMsg({ text: "", type: "" });
    if (!forgotOtp.trim() || !forgotNewPass) {
      setForgotMsg({ text: "Please enter the 6-digit OTP and new password.", type: "error" });
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotMsg({ text: "Passwords do not match.", type: "error" });
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
      setForgotMsg({ text: res.data?.message || "Password updated successfully!", type: "success" });
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
      setForgotMsg({ text: err.response?.data?.message || "Invalid or expired OTP code.", type: "error" });
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
              <span className="brand-role-tag" style={{ color: "#0f766e" }}>Faculty & Educator Portal</span>
            </div>
          </Link>
        </div>

        <div className="auth-form-body">
          <div className="auth-title-block">
            <span className="auth-kicker-pill" style={{ background: "#f0fdfa", borderColor: "#ccfbf1", color: "#0f766e" }}>
              <span className="kicker-dot" style={{ background: "#0f766e" }}></span>
              FACULTY ASSESSMENT CONSOLE
            </span>
            <h1 className="auth-main-heading">Sign In to Faculty Desk</h1>
            <p className="auth-main-sub">
              Access your curriculum test banks, author autonomous cohorts, publish assessments, and monitor live submissions.
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
              <label htmlFor="teacher-email" className="field-label">Faculty Email Address</label>
              <div className="field-input-box">
                <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="3"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <input
                  id="teacher-email"
                  type="email"
                  className="field-input"
                  placeholder="e.g. professor@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="teacher-password" className="field-label">Password</label>
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
                  id="teacher-password"
                  type={showPassword ? "text" : "password"}
                  className="field-input"
                  placeholder="Enter your faculty password"
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
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)" }}
            >
              {loading ? (
                <span className="btn-loading-state">
                  <span className="btn-spinner"></span>
                  <span>Verifying Faculty Credentials...</span>
                </span>
              ) : (
                "Sign In to Faculty Desk →"
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
          >
            <svg className="google-brand-svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Faculty Google ID</span>
          </button>

          {/* Quick Portal Switcher */}
          <div className="auth-advisory-card" style={{ marginTop: "1.5rem" }}>
            <div className="advisory-icon-circle" style={{ background: "#f0fdfa", color: "#0f766e" }}>
              <GraduationCapIcon size={22} />
            </div>
            <div className="advisory-body">
              <strong>Need a Different Portal?</strong>
              <p>Looking to take assessments or manage institution billing and quotas?</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
                <Link to="/login" className="advisory-cta-link">Student Portal →</Link>
                <Link to="/admin/login" className="advisory-cta-link">Admin Console →</Link>
                <Link to="/join-us?track=teacher" className="advisory-cta-link">Apply as Faculty →</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-panel-bottom">
          <span>© 2026 AssessIQ Faculty Assessment Systems</span>
          <div className="panel-footer-links">
            <Link to="/contact">Help Desk</Link>
            <span>·</span>
            <Link to="/public-tests">Public Exams</Link>
          </div>
        </div>
      </div>

      {/* Right Visual Showcase Panel */}
      <div className="auth-visual-panel" style={{ background: "linear-gradient(135deg, #042f2e 0%, #115e59 50%, #0f172a 100%)" }}>
        <div className="visual-panel-inner">
          <div className="visual-top-badge" style={{ background: "rgba(20, 184, 166, 0.15)", borderColor: "rgba(20, 184, 166, 0.3)" }}>
            <span className="status-live-indicator" style={{ background: "#14b8a6" }}></span>
            <span style={{ color: "#2dd4bf" }}>AUTONOMOUS FACULTY WORKSPACE</span>
          </div>

          <h2 className="visual-headline">
            Design, schedule, and grade assessments with total autonomy.
          </h2>

          <p className="visual-subtext">
            Teachers can create test series, set student capacity limits, publish cohorts autonomously, and review subject-level competency breakdowns without administrative delay.
          </p>

          <div className="visual-features-stack">
            <div className="visual-feat-card">
              <div className="feat-icon-bubble" style={{ background: "rgba(20, 184, 166, 0.2)", color: "#2dd4bf" }}>
                <FileTextIcon size={20} />
              </div>
              <div className="feat-details">
                <strong>Autonomous Batch & Test Publishing</strong>
                <p>Attach multiple curriculum tests to custom student cohorts with instant student enrollment.</p>
              </div>
            </div>

            <div className="visual-feat-card">
              <div className="feat-icon-bubble" style={{ background: "rgba(20, 184, 166, 0.2)", color: "#2dd4bf" }}>
                <BarChartIcon size={20} />
              </div>
              <div className="feat-details">
                <strong>Detailed Subject Analytics</strong>
                <p>Evaluate student passing margins, question difficulty indices, and candidate attendance.</p>
              </div>
            </div>

            <div className="visual-feat-card">
              <div className="feat-icon-bubble" style={{ background: "rgba(20, 184, 166, 0.2)", color: "#2dd4bf" }}>
                <ShieldIcon size={20} />
              </div>
              <div className="feat-details">
                <strong>Enforced Academic Integrity</strong>
                <p>Strict session timeouts, randomized option distribution, and automated candidate auditing.</p>
              </div>
            </div>
          </div>

          <div className="visual-trust-strip">
            <div className="trust-metric">
              <span className="metric-val">Zero</span>
              <span className="metric-lbl">Admin Delay</span>
            </div>
            <div className="trust-sep"></div>
            <div className="trust-metric">
              <span className="metric-val">100%</span>
              <span className="metric-lbl">Autonomous Batches</span>
            </div>
            <div className="trust-sep"></div>
            <div className="trust-metric">
              <span className="metric-val">Real-Time</span>
              <span className="metric-lbl">Grade Generation</span>
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
                <span>{forgotMsg.text}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendForgotOtp} style={{ padding: "1.25rem" }}>
                <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1rem" }}>
                  Enter your registered educator email. We will dispatch a 6-digit verification code.
                </p>
                <div className="field-group" style={{ marginBottom: "1.25rem" }}>
                  <label className="field-label">Educator Email Address</label>
                  <input
                    type="email"
                    className="field-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="professor@college.edu"
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={forgotLoading}>
                  {forgotLoading ? "Dispatching Code..." : "Send Verification OTP →"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyForgotOtp} style={{ padding: "1.25rem" }}>
                <div className="field-group" style={{ marginBottom: "1rem" }}>
                  <label className="field-label">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    className="field-input"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    required
                  />
                </div>
                <div className="field-group" style={{ marginBottom: "1rem" }}>
                  <label className="field-label">New Password</label>
                  <input
                    type="password"
                    className="field-input"
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <div className="field-group" style={{ marginBottom: "1.25rem" }}>
                  <label className="field-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="field-input"
                    value={forgotConfirmPass}
                    onChange={(e) => setForgotConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={forgotLoading}>
                  {forgotLoading ? "Updating Password..." : "Confirm Password Reset"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLogin;
