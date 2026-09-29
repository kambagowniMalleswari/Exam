// Institutional Join With Us Page (Dual Track: Organization Onboarding & Faculty Application)
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import "./JoinWithUs.css";

const JoinWithUs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTrack = searchParams.get("track") === "teacher" ? "teacher" : "organization";
  const [activeTrack, setActiveTrack] = useState(initialTrack);

  useEffect(() => {
    document.title = "Partner With AssessIQ | Institutional Onboarding";
  }, []);

  // Form states for Organization Onboarding
  const [orgForm, setOrgForm] = useState({
    name: "",
    type: "College",
    adminName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    expectedStudents: "101-500",
    notes: ""
  });
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState(false);
  const [orgError, setOrgError] = useState("");

  // Form states for Teacher Application
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    phone: "",
    organizationId: "",
    subject: "",
    qualification: "",
    experienceYears: 2,
    experienceDetails: "",
    certifications: "",
    supportingInfo: ""
  });
  const [organizations, setOrganizations] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherSuccess, setTeacherSuccess] = useState(false);
  const [teacherError, setTeacherError] = useState("");

  // Load public organizations for teacher dropdown
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get("/organizations/public");
        setOrganizations(res.data?.organizations || []);
      } catch (err) {
        console.warn("Could not fetch organizations for teacher form:", err.message);
      }
    };
    fetchOrgs();
  }, []);

  // Update track from URL if changed
  useEffect(() => {
    const track = searchParams.get("track");
    if (track === "teacher" || track === "organization") {
      setActiveTrack(track);
    }
  }, [searchParams]);

  const handleTrackSwitch = (track) => {
    setActiveTrack(track);
    setSearchParams({ track });
  };

  // Submit Organization Application
  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setOrgError("");
    setOrgSuccess(false);

    if (!orgForm.name.trim() || !orgForm.adminName.trim() || !orgForm.email.trim() || !orgForm.phone.trim()) {
      setOrgError("Please provide Organization Name, Administrator Name, Email, and 10-digit Phone.");
      return;
    }

    if (orgForm.name.trim().length <= 3 || orgForm.adminName.trim().length <= 3) {
      setOrgError("Organization Name and Administrator Name must be more than 3 characters (at least 4 characters).");
      return;
    }

    if (!/^\d{10}$/.test(orgForm.phone.trim())) {
      setOrgError("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      setOrgLoading(true);
      const res = await api.post("/org-applications/apply", {
        ...orgForm,
        name: orgForm.name.trim(),
        adminName: orgForm.adminName.trim(),
        email: orgForm.email.toLowerCase().trim(),
        phone: orgForm.phone.trim()
      });
      setOrgSuccess(true);
    } catch (err) {
      setOrgError(err.response?.data?.message || "Failed to submit institutional onboarding request.");
    } finally {
      setOrgLoading(false);
    }
  };

  // Submit Teacher Application
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setTeacherError("");
    setTeacherSuccess(false);

    if (!teacherForm.name.trim() || !teacherForm.email.trim() || !teacherForm.phone.trim()) {
      setTeacherError("Full Name, Email, and 10-digit Phone are required.");
      return;
    }

    if (teacherForm.name.trim().length <= 3) {
      setTeacherError("Full Name must be more than 3 characters (at least 4 characters).");
      return;
    }

    if (!/^\d{10}$/.test(teacherForm.phone.trim())) {
      setTeacherError("Phone number must be exactly 10 digits.");
      return;
    }

    if (!teacherForm.organizationId) {
      setTeacherError("Please select an institution or organization to affiliate with.");
      return;
    }

    if (!teacherForm.subject.trim() || !teacherForm.qualification.trim()) {
      setTeacherError("Primary Subject and Highest Qualification are required.");
      return;
    }

    try {
      setTeacherLoading(true);
      await api.post("/teacher-applications/apply", {
        ...teacherForm,
        name: teacherForm.name.trim(),
        email: teacherForm.email.toLowerCase().trim(),
        phone: teacherForm.phone.trim(),
        experienceYears: Number(teacherForm.experienceYears) || 0
      });
      setTeacherSuccess(true);
    } catch (err) {
      setTeacherError(err.response?.data?.message || "Failed to submit faculty application.");
    } finally {
      setTeacherLoading(false);
    }
  };

  return (
    <div className="join-us-page">
      {/* Institutional Top Navbar */}
      <header className="join-nav">
        <div className="join-nav-container">
          <Link to="/" className="join-brand">
            <BrandCrest size={34} />
            <div className="brand-titles">
              <span className="brand-name">AssessIQ</span>
              <span className="brand-subtitle">Partnership Desk</span>
            </div>
          </Link>
          <div className="join-nav-links">
            <Link to="/">Home</Link>
            <Link to="/public-tests">Public Tests</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/login" className="btn-nav-login">Sign In</Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="join-hero">
        <div className="join-hero-content">
          <div className="join-tag">
            <span className="crest-mini">🏛️</span>
            <span>ACADEMIC ALLIANCES & FACULTY ONBOARDING</span>
          </div>
          <h1>Join With Us</h1>
          <p className="join-hero-subtitle">
            Partner with AssessIQ to power institutional examinations or author verified assessments.
            Select your track below to begin the official verification process.
          </p>

          {/* Quick Sign-In Switcher Strip */}
          <div className="portal-switchers-strip">
            <span className="switchers-label">Already registered with an institution?</span>
            <div className="switchers-links">
              <Link to="/login" className="portal-pill-btn pill-student">
                <span className="dot dot-blue"></span> Student Desk →
              </Link>
              <Link to="/teacher/login" className="portal-pill-btn pill-teacher">
                <span className="dot dot-teal"></span> Faculty Sign-In →
              </Link>
              <Link to="/admin/login" className="portal-pill-btn pill-admin">
                <span className="dot dot-gold"></span> Admin Console →
              </Link>
            </div>
          </div>

          {/* Dual Track Switcher Tabs */}
          <div className="track-switcher">
            <button
              type="button"
              className={`track-tab ${activeTrack === "organization" ? "active" : ""}`}
              onClick={() => handleTrackSwitch("organization")}
            >
              <span className="tab-icon">🏢</span>
              <div className="tab-info">
                <strong>Institution Onboarding</strong>
                <span>Universities, Colleges, Schools & L&D</span>
              </div>
            </button>

            <button
              type="button"
              className={`track-tab ${activeTrack === "teacher" ? "active" : ""}`}
              onClick={() => handleTrackSwitch("teacher")}
            >
              <span className="tab-icon">👨‍🏫</span>
              <div className="tab-info">
                <strong>Faculty & Teacher Application</strong>
                <span>Professors, Lecturers & Educators</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="join-main-container">
        {/* ================================================================= */}
        {/* TRACK 1: ORGANISATION ONBOARDING FORM                             */}
        {/* ================================================================= */}
        {activeTrack === "organization" && (
          <div className="application-card fade-in">
            <div className="card-top-header">
              <div className="header-badge-wrap">
                <span className="badge-pill pill-gold">Super Admin Review</span>
                <span className="badge-pill pill-blue">Tenant Isolation</span>
              </div>
              <h2>Institutional Portal Registration Request</h2>
              <p>
                Submit this request to provision an independent, encrypted tenant portal for your institution.
                Upon Super Admin approval, your Organization Administrator account will be dispatched via email.
              </p>
            </div>

            {orgSuccess ? (
              <div className="application-success-box">
                <div className="success-crest">🎉</div>
                <h3>Institutional Request Submitted Successfully!</h3>
                <p>
                  Thank you, <strong>{orgForm.adminName}</strong>. Your onboarding application for <strong>{orgForm.name}</strong> has been forwarded to the Platform Super Admin team.
                </p>
                <div className="success-checklist">
                  <div className="check-item">✓ Verification of institutional credentials</div>
                  <div className="check-item">✓ Dedicated tenant slug and schema provisioning</div>
                  <div className="check-item">✓ Organization Administrator login credentials delivered by email</div>
                </div>
                <button
                  type="button"
                  className="btn-academic-gold"
                  onClick={() => {
                    setOrgSuccess(false);
                    setOrgForm({
                      name: "",
                      type: "College",
                      adminName: "",
                      email: "",
                      phone: "",
                      website: "",
                      address: "",
                      city: "",
                      state: "",
                      country: "India",
                      expectedStudents: "101-500",
                      notes: ""
                    });
                  }}
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrgSubmit} className="academic-form">
                {orgError && (
                  <div className="form-alert alert-danger">
                    <span>⚠️ {orgError}</span>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Organization / Institution Name *</label>
                    <input
                      type="text"
                      className="academic-input"
                      placeholder="e.g. Oxford Institute of Technology"
                      value={orgForm.name}
                      onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Institution Type *</label>
                    <select
                      className="academic-input"
                      value={orgForm.type}
                      onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })}
                    >
                      <option value="College">College</option>
                      <option value="University">University</option>
                      <option value="School">High School / Academy</option>
                      <option value="Coaching / Training">Coaching & Training Institute</option>
                      <option value="Corporate">Corporate Learning & Development</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Designated Administrator Full Name *</label>
                    <input
                      type="text"
                      className="academic-input"
                      placeholder="e.g. Dr. Robert Vance"
                      value={orgForm.adminName}
                      onChange={(e) => setOrgForm({ ...orgForm, adminName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Official Institutional Email *</label>
                    <input
                      type="email"
                      className="academic-input"
                      placeholder="admin@oxfordinstitute.edu"
                      value={orgForm.email}
                      onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                      required
                    />
                    <small className="helper-text">Access credentials will be delivered to this address.</small>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>10-Digit Mobile / Contact Number *</label>
                    <input
                      type="tel"
                      className="academic-input"
                      placeholder="9876543210"
                      maxLength={10}
                      value={orgForm.phone}
                      onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value.replace(/\D/g, "") })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Official Website (Optional)</label>
                    <input
                      type="url"
                      className="academic-input"
                      placeholder="https://oxfordinstitute.edu"
                      value={orgForm.website}
                      onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      className="academic-input"
                      placeholder="e.g. Bangalore"
                      value={orgForm.city}
                      onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      className="academic-input"
                      placeholder="e.g. Karnataka"
                      value={orgForm.state}
                      onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected Student Capacity</label>
                    <select
                      className="academic-input"
                      value={orgForm.expectedStudents}
                      onChange={(e) => setOrgForm({ ...orgForm, expectedStudents: e.target.value })}
                    >
                      <option value="1-100">1 - 100 Students</option>
                      <option value="101-500">101 - 500 Students</option>
                      <option value="501-2000">501 - 2,000 Students</option>
                      <option value="2000+">2,000+ Students (Enterprise)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Additional Notes or Curriculum Requirements</label>
                  <textarea
                    className="academic-textarea"
                    rows={3}
                    placeholder="Provide any specifics regarding your examination schedule, batch structures, or accreditation requirements..."
                    value={orgForm.notes}
                    onChange={(e) => setOrgForm({ ...orgForm, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-academic-gold btn-full" disabled={orgLoading}>
                  {orgLoading ? "Submitting Request..." : "Submit Institutional Application →"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TRACK 2: TEACHER / FACULTY APPLICATION FORM                       */}
        {/* ================================================================= */}
        {activeTrack === "teacher" && (
          <div className="application-card fade-in">
            <div className="card-top-header">
              <div className="header-badge-wrap">
                <span className="badge-pill pill-gold">Faculty Portal</span>
                <span className="badge-pill pill-emerald">Assessment Authoring</span>
              </div>
              <h2>Faculty & Educator Partnership Application</h2>
              <p>
                Apply to become a verified educator on AssessIQ. Faculty members can author timed examinations,
                curate question banks, manage student cohorts/batches, and track performance telemetry.
              </p>
            </div>

            {teacherSuccess ? (
              <div className="application-success-box">
                <div className="success-crest">🎓</div>
                <h3>Faculty Application Submitted Successfully!</h3>
                <p>
                  Thank you, <strong>{teacherForm.name}</strong>. Your application to teach <strong>{teacherForm.subject}</strong> has been recorded.
                </p>
                <div className="success-checklist">
                  <div className="check-item">✓ Application queued for administrator verification</div>
                  <div className="check-item">✓ Educational qualifications and credentials verification</div>
                  <div className="check-item">✓ Teacher account activation notice sent via email upon approval</div>
                </div>
                <button
                  type="button"
                  className="btn-academic-gold"
                  onClick={() => {
                    setTeacherSuccess(false);
                    setTeacherForm({
                      name: "",
                      email: "",
                      phone: "",
                      organizationId: "",
                      subject: "",
                      qualification: "",
                      experienceYears: 2,
                      experienceDetails: "",
                      certifications: "",
                      supportingInfo: ""
                    });
                  }}
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleTeacherSubmit} className="academic-form">
                {teacherError && (
                  <div className="form-alert alert-danger">
                    <span>⚠️ {teacherError}</span>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      className="academic-input"
                      placeholder="e.g. Prof. David Miller"
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Academic / Professional Email *</label>
                    <input
                      type="email"
                      className="academic-input"
                      placeholder="david.miller@university.edu"
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>10-Digit Phone Number *</label>
                    <input
                      type="tel"
                      className="academic-input"
                      placeholder="9876543210"
                      maxLength={10}
                      value={teacherForm.phone}
                      onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value.replace(/\D/g, "") })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Institution / Organization *</label>
                    <select
                      className="academic-input"
                      value={teacherForm.organizationId}
                      onChange={(e) => setTeacherForm({ ...teacherForm, organizationId: e.target.value })}
                      required
                    >
                      <option value="">Select Institution...</option>
                      {organizations.map((org) => (
                        <option key={org._id} value={org._id}>
                          {org.name} ({org.type || "Institution"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Primary Subject / Specialization *</label>
                    <input
                      type="text"
                      className="academic-input"
                      placeholder="e.g. Computer Science / Data Structures"
                      value={teacherForm.subject}
                      onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Highest Qualification *</label>
                    <input
                      type="text"
                      className="academic-input"
                      placeholder="e.g. Ph.D. in Artificial Intelligence, M.Tech, M.Sc."
                      value={teacherForm.qualification}
                      onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Years of Teaching Experience *</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      className="academic-input"
                      value={teacherForm.experienceYears}
                      onChange={(e) => setTeacherForm({ ...teacherForm, experienceYears: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Academic Certifications (Optional)</label>
                    <input
                      type="text"
                      className="academic-input"
                      placeholder="e.g. UGC NET, GATE, AWS Certified Educator"
                      value={teacherForm.certifications}
                      onChange={(e) => setTeacherForm({ ...teacherForm, certifications: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Teaching Background & Experience Summary</label>
                  <textarea
                    className="academic-textarea"
                    rows={3}
                    placeholder="Summarize your experience with examination authoring, question drafting, and student cohort mentoring..."
                    value={teacherForm.experienceDetails}
                    onChange={(e) => setTeacherForm({ ...teacherForm, experienceDetails: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-academic-gold btn-full" disabled={teacherLoading}>
                  {teacherLoading ? "Submitting Application..." : "Submit Faculty Application →"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Institutional Pillars */}
        <div className="join-pillars-grid">
          <div className="pillar-item">
            <div className="pillar-icon">🔒</div>
            <h4>Strict Tenant Isolation</h4>
            <p>Organizations and question banks operate under complete data privacy with dedicated namespaces.</p>
          </div>

          <div className="pillar-item">
            <div className="pillar-icon">🏷️</div>
            <h4>Selective Batch Rollouts</h4>
            <p>Group candidates into cohorts, batch numbers, and merit lists to roll out customized test sessions.</p>
          </div>

          <div className="pillar-item">
            <div className="pillar-icon">📜</div>
            <h4>Certified Transcripts</h4>
            <p>Automated grading with question-level diagnostic breakdown and pass-threshold verification.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JoinWithUs;
