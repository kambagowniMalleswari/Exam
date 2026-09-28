// Modern Clean Institutional Student Registration Component
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import api from "../services/api.js";
import "./Register.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organizationId, setOrganizationId] = useState("");

  const [availableOrgs, setAvailableOrgs] = useState([]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  useEffect(() => {
    document.title = "Student Registration | AssessIQ";
    // Fetch active public organizations for student affiliation
    const fetchOrgs = async () => {
      try {
        const res = await api.get("/organizations/public");
        setAvailableOrgs(res.data?.organizations || []);
      } catch (err) {
        console.warn("Could not load organizations:", err.message);
      }
    };
    fetchOrgs();
  }, []);

  const validate = () => {
    const errs = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!trimmedName) {
      errs.name = "Full name is required.";
    } else if (trimmedName.length < 3) {
      errs.name = "Name must be at least 3 characters long.";
    }

    if (!trimmedEmail) {
      errs.email = "Email address is required.";
    } else if (!emailRegex.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address.";
    }

    if (!trimmedPhone) {
      errs.phone = "Phone number is required.";
    } else if (!phoneRegex.test(trimmedPhone)) {
      errs.phone = "Phone number must be exactly 10 numeric digits.";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    } else if (!/[A-Z]/.test(password)) {
      errs.password = "Password must contain at least 1 uppercase letter.";
    } else if (!/[a-z]/.test(password)) {
      errs.password = "Password must contain at least 1 lowercase letter.";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0]);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        organizationId: organizationId || null
      };

      await register(payload);
      navigate("/student/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      const backendMsg = err.response?.data?.message;
      if (backendMsg) {
        setError(backendMsg);
      } else if (err.message && !err.response) {
        setError(`Connection failed: ${err.message}. Please check your connection.`);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError("");
      await loginWithGoogle({
        email: "student.google@apexuniv.edu",
        name: "Google Registered Student",
        organizationId: organizationId || null
      });
      navigate("/student/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Google registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Form Panel */}
      <div className="auth-form-panel register-panel">
        <div className="auth-panel-top">
          <Link to="/" className="auth-brand-header">
            <div className="brand-icon-box" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
              <BrandCrest size={32} />
            </div>
            <div className="brand-text-stack">
              <span className="brand-name">AssessIQ</span>
              <span className="brand-role-tag">Student Registration</span>
            </div>
          </Link>
        </div>

        <div className="auth-form-body register-form-body">
          <div className="auth-title-block">
            <span className="auth-kicker-pill">
              <span className="kicker-dot"></span>
              NEW STUDENT SCHOLAR ONBOARDING
            </span>
            <h1 className="auth-main-heading">Create Scholar Account</h1>
            <p className="auth-main-sub">
              Register your student profile to access institutional exams, timed tests, and verified score transcripts.
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
            {/* 2-Column: Full Name and Mobile Number */}
            <div className="field-row-grid">
              <div className="field-group">
                <label htmlFor="reg-name" className="field-label">Full Name</label>
                <div className="field-input-box">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    id="reg-name"
                    type="text"
                    className="field-input"
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                {fieldErrors.name && <span className="field-validation-msg">{fieldErrors.name}</span>}
              </div>

              <div className="field-group">
                <label htmlFor="reg-phone" className="field-label">Mobile Number</label>
                <div className="field-input-box">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="field-input"
                    placeholder="10-digit number"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                {fieldErrors.phone && <span className="field-validation-msg">{fieldErrors.phone}</span>}
              </div>
            </div>

            {/* Email Address */}
            <div className="field-group">
              <label htmlFor="reg-email" className="field-label">Student Email Address</label>
              <div className="field-input-box">
                <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="3"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <input
                  id="reg-email"
                  type="email"
                  className="field-input"
                  placeholder="e.g. alex@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {fieldErrors.email && <span className="field-validation-msg">{fieldErrors.email}</span>}
            </div>

            {/* College / Institution Affiliation */}
            <div className="field-group">
              <label htmlFor="reg-org" className="field-label">College / Organization Affiliation</label>
              <div className="field-input-box">
                <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <select
                  id="reg-org"
                  className="field-input field-select"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                >
                  <option value="">Independent Student Scholar (Open Exams Only)</option>
                  {availableOrgs.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.type || "Institution"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2-Column: Password and Confirm Password */}
            <div className="field-row-grid">
              <div className="field-group">
                <label htmlFor="reg-password" className="field-label">Password</label>
                <div className="field-input-box">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    className="field-input"
                    placeholder="Min 6 chars (A-Z, a-z)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {fieldErrors.password && <span className="field-validation-msg">{fieldErrors.password}</span>}
              </div>

              <div className="field-group">
                <label htmlFor="reg-confirm-password" className="field-label">Confirm Password</label>
                <div className="field-input-box">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="field-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="field-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
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
                {fieldErrors.confirmPassword && (
                  <span className="field-validation-msg">{fieldErrors.confirmPassword}</span>
                )}
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading-state">
                  <span className="btn-spinner"></span>
                  <span>Creating Student Account...</span>
                </span>
              ) : (
                "Complete Student Registration →"
              )}
            </button>
          </form>

          <div className="auth-divider-line">
            <span>or sign up with</span>
          </div>

          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <svg className="google-brand-svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Register with Student Google ID</span>
          </button>

          <div className="auth-switch-row">
            <span>Already registered as a scholar?</span>
            <Link to="/login" className="auth-switch-link">Sign in to your desk →</Link>
          </div>

          {/* Institutional Advisory Card */}
          <div className="auth-advisory-card">
            <div className="advisory-icon-circle">🏛️</div>
            <div className="advisory-body">
              <strong>Educator or Institution Representative?</strong>
              <p>Registration here is strictly for student test-takers. To onboard your university, college, or school, please submit an application.</p>
              <Link to="/join-us" className="advisory-cta-link">Institutional & Faculty Onboarding →</Link>
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
            <span>ACADEMIC INTEGRITY STANDARDS</span>
          </div>

          <h2 className="visual-headline">
            Take verified tests, track performance, and earn credentials.
          </h2>

          <p className="visual-subtext">
            AssessIQ delivers a distraction-free, reliable examination environment with instant automatic scoring and comprehensive competency analysis.
          </p>

          <div className="visual-features-stack">
            <div className="visual-feat-card">
              <div className="feat-icon-bubble">🎯</div>
              <div className="feat-details">
                <strong>Cohort-Targeted Assessments</strong>
                <p>Access exams specifically configured for your academic branch, batch number, and syllabus level.</p>
              </div>
            </div>

            <div className="visual-feat-card">
              <div className="feat-icon-bubble">📈</div>
              <div className="feat-details">
                <strong>Instant Diagnostic Transcripts</strong>
                <p>Detailed performance analytics showing topic strengths, speed per question, and historical progression.</p>
              </div>
            </div>

            <div className="visual-feat-card">
              <div className="feat-icon-bubble">🏆</div>
              <div className="feat-details">
                <strong>Merit & Honor Opportunities</strong>
                <p>Unlock selective advanced exams and institutional honors based on verified cumulative merit scores.</p>
              </div>
            </div>
          </div>

          <div className="visual-trust-strip">
            <div className="trust-metric">
              <span className="metric-val">Instant</span>
              <span className="metric-lbl">Result Publishing</span>
            </div>
            <div className="trust-sep"></div>
            <div className="trust-metric">
              <span className="metric-val">100%</span>
              <span className="metric-lbl">Verified Grading</span>
            </div>
            <div className="trust-sep"></div>
            <div className="trust-metric">
              <span className="metric-val">Fair</span>
              <span className="metric-lbl">Proctoring Rules</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;