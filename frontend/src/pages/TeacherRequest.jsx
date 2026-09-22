// Professional Institutional Teacher Application Component
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import "./TeacherRequest.css";

const TeacherRequest = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organizationId: "",
    subject: "",
    qualification: "",
    experienceYears: "",
    experienceDetails: "",
    certifications: "",
    supportingInfo: ""
  });

  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get("/organizations/public");
        setOrganizations(res.data?.organizations || []);
      } catch (err) {
        console.warn("Could not load organizations:", err.message);
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "") }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      errs.name = "Full name is required (minimum 3 characters).";
    }

    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = "A valid academic/work email is required.";
    }

    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.trim())) {
      errs.phone = "Phone number must be exactly 10 digits.";
    }

    if (!formData.organizationId) {
      errs.organizationId = "Please select your target institution.";
    }

    if (!formData.subject.trim()) {
      errs.subject = "Teaching subject / specialization is required.";
    }

    if (!formData.qualification.trim()) {
      errs.qualification = "Highest educational qualification is required.";
    }

    if (formData.experienceYears === "" || Number(formData.experienceYears) < 0) {
      errs.experienceYears = "Please provide valid years of teaching experience.";
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
      setSubmitting(true);
      const res = await api.post("/teacher-applications/apply", {
        ...formData,
        experienceYears: Number(formData.experienceYears)
      });
      setSubmittedApp(res.data?.application || {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit application. Please check input.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tr-page-root">
      {/* Navbar */}
      <header className="public-top-nav">
        <div className="public-nav-inner">
          <Link to="/" className="public-brand">
            <div className="brand-shield-mark">
              <svg viewBox="0 0 64 64" fill="none">
                <path d="M32 4 C44 4 54 11 56 22 C56 40 44 54 32 60 C20 54 8 40 8 22 C10 11 20 4 32 4 Z" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" />
                <polygon points="32,16 46,24 32,32 18,24" fill="#fbbf24" />
                <path d="M26 44 L30 48 L39 39" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="public-brand-title">AssessIQ</span>
          </Link>

          <div className="public-nav-actions">
            <Link to="/login" className="btn-nav-outline">Sign In</Link>
            <Link to="/register" className="btn-nav-solid">Student Register</Link>
          </div>
        </div>
      </header>

      <main className="tr-main-wrapper">
        <div className="tr-breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <Link to="/register">Registration</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Teacher Application</span>
        </div>

        {submittedApp ? (
          <div className="tr-success-box">
            <div className="tr-success-icon">✓</div>
            <h2>Application Submitted Successfully</h2>
            <p className="tr-success-lead">
              Thank you, <strong>{submittedApp.name}</strong>. Your application to join{" "}
              <strong>{submittedApp.organizationName}</strong> as an authorized Teacher for{" "}
              <strong>{submittedApp.subject}</strong> has been received.
            </p>

            <div className="tr-status-card">
              <div className="tr-status-row">
                <span>Application Reference ID:</span>
                <code>{submittedApp.id}</code>
              </div>
              <div className="tr-status-row">
                <span>Current Status:</span>
                <span className="status-badge pending">Pending Administrator Review</span>
              </div>
              <div className="tr-status-row">
                <span>Confirmation Email:</span>
                <strong>{submittedApp.email}</strong>
              </div>
            </div>

            <p className="tr-next-steps">
              The institutional administrator will review your credentials and teaching experience.
              Once approved, your account will be activated and login credentials will be delivered via email.
            </p>

            <div className="tr-success-actions">
              <Link to="/login" className="btn-tr-primary">Return to Sign In</Link>
              <Link to="/" className="btn-tr-secondary">Visit Homepage</Link>
            </div>
          </div>
        ) : (
          <div className="tr-card-container">
            <div className="tr-header-group">
              <span className="tr-badge-pill">FACULTY ONBOARDING</span>
              <h1>Teacher & Faculty Application</h1>
              <p>
                Authorized teachers can create examination modules, curate question banks,
                and monitor student progress. Fill in your academic details below for institutional verification.
              </p>
            </div>

            {error && (
              <div className="tr-error-alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="tr-form-grid">
              {/* Section 1: Personal & Contact */}
              <div className="tr-section-title">
                <span>1</span> Personal & Institutional Affiliation
              </div>

              <div className="form-row-duo">
                <div className="form-group-item">
                  <label htmlFor="tr-name">Full Name *</label>
                  <input
                    id="tr-name"
                    name="name"
                    type="text"
                    placeholder="e.g. Prof. Alan Turing"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.name && <span className="field-err">{fieldErrors.name}</span>}
                </div>

                <div className="form-group-item">
                  <label htmlFor="tr-email">Professional Email *</label>
                  <input
                    id="tr-email"
                    name="email"
                    type="email"
                    placeholder="e.g. alan.turing@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.email && <span className="field-err">{fieldErrors.email}</span>}
                </div>
              </div>

              <div className="form-row-duo">
                <div className="form-group-item">
                  <label htmlFor="tr-phone">Phone Number (10 Digits) *</label>
                  <input
                    id="tr-phone"
                    name="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.phone && <span className="field-err">{fieldErrors.phone}</span>}
                </div>

                <div className="form-group-item">
                  <label htmlFor="tr-org">Target Institution / College *</label>
                  <select
                    id="tr-org"
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name} ({org.type || "College"})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.organizationId && <span className="field-err">{fieldErrors.organizationId}</span>}
                </div>
              </div>

              {/* Section 2: Academic & Specialization */}
              <div className="tr-section-title">
                <span>2</span> Academic Credentials & Subject Specialization
              </div>

              <div className="form-row-duo">
                <div className="form-group-item">
                  <label htmlFor="tr-subject">Primary Teaching Subject *</label>
                  <input
                    id="tr-subject"
                    name="subject"
                    type="text"
                    placeholder="e.g. Computer Science, Mathematics, Physics"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.subject && <span className="field-err">{fieldErrors.subject}</span>}
                </div>

                <div className="form-group-item">
                  <label htmlFor="tr-qual">Highest Qualification *</label>
                  <input
                    id="tr-qual"
                    name="qualification"
                    type="text"
                    placeholder="e.g. Ph.D. in Computer Science / M.Tech"
                    value={formData.qualification}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.qualification && <span className="field-err">{fieldErrors.qualification}</span>}
                </div>
              </div>

              <div className="form-row-duo">
                <div className="form-group-item">
                  <label htmlFor="tr-exp">Years of Teaching Experience *</label>
                  <input
                    id="tr-exp"
                    name="experienceYears"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.experienceYears && <span className="field-err">{fieldErrors.experienceYears}</span>}
                </div>

                <div className="form-group-item">
                  <label htmlFor="tr-cert">Relevant Certifications / Links</label>
                  <input
                    id="tr-cert"
                    name="certifications"
                    type="text"
                    placeholder="e.g. UGC-NET Certified, Google Cloud Educator"
                    value={formData.certifications}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group-item full-span">
                <label htmlFor="tr-details">Summary of Teaching Experience</label>
                <textarea
                  id="tr-details"
                  name="experienceDetails"
                  rows="3"
                  placeholder="Outline prior courses taught, departments served, or test creation experience..."
                  value={formData.experienceDetails}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="form-group-item full-span">
                <label htmlFor="tr-info">Supporting Information or Portfolio Link</label>
                <textarea
                  id="tr-info"
                  name="supportingInfo"
                  rows="2"
                  placeholder="Include LinkedIn profile, research portal, faculty profile link, or references..."
                  value={formData.supportingInfo}
                  onChange={handleChange}
                ></textarea>
              </div>

              <button type="submit" className="btn-submit-application" disabled={submitting}>
                {submitting ? "Submitting Application..." : "Submit Teacher Application for Approval →"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherRequest;
