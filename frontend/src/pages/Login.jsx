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
  CheckCircleIcon,
  AlertTriangleIcon
} from "../components/common/Icons.jsx";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import { getDefaultDashboard, isRoleAuthorizedForPath, normalizeRole } from "../utils/roleUtils.js";
import "./Login.css";

const Login = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign In with Google | AssessIQ";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle } = useAuth();

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
              <span className="brand-role-tag">Unified Portal Access</span>
            </div>
          </Link>
        </div>

        <div className="auth-form-body">
          <div className="auth-title-block">
            <h1 className="auth-main-heading">Sign In to Your Workspace</h1>
            <p className="auth-main-sub">
              Access your institutional assessment portal and exam workspaces with Google Single Sign-On.
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

          {/* Exclusive Google Sign-In Card */}
          <div className="auth-google-card-block">
            <button
              type="button"
              className="auth-google-btn auth-google-hero-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              id="google-signin-button"
            >
              <svg className="google-brand-svg" viewBox="0 0 24 24" width="22" height="22">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>{loading ? "Signing In with Google..." : "Continue with Google"}</span>
            </button>
            <p className="auth-google-card-hint">
              Instant access for scholars, educators, and institutional members with Google authentication.
            </p>
          </div>

          <div className="auth-switch-row">
            <span>New Student Scholar?</span>
            <Link to="/register" className="auth-switch-link">Register student account →</Link>
          </div>

          {/* Institutional Access Card */}
          <div className="auth-advisory-card">
            <div className="advisory-icon-circle">
              <BuildingIcon size={22} />
            </div>
            <div className="advisory-body">
              <strong>Institutional Admin or Faculty Access?</strong>
              <p>Admins and faculty members provisioned with institutional password credentials can sign in to the Admin Console directly.</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
                <Link to="/admin/login" className="advisory-cta-link" style={{ fontWeight: 700 }}>Admin Console Sign In →</Link>
                <Link to="/join-us" className="advisory-cta-link">Institutional Onboarding →</Link>
                <Link to="/join-us?track=teacher" className="advisory-cta-link">Faculty Application →</Link>
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
    </div>
  );
};

export default Login;