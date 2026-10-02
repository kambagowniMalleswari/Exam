// Unified Profile Page for Super Admin, Org Admin, Teacher, and Student
import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  ShieldIcon,
  KeyIcon,
  GraduationCapIcon,
  TagIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SearchIcon,
  EditIcon
} from "../components/common/Icons.jsx";
import "./Profile.css";

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState(user?.role === "teacher" ? "students" : "overview");
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Edit form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileAlert, setProfileAlert] = useState({ text: "", type: "" });

  // OTP Password Reset state
  const [otpStep, setOtpStep] = useState(1); // 1 = request otp, 2 = verify & reset
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [securityAlert, setSecurityAlert] = useState({ text: "", type: "" });

  // Organization Students for Teachers state
  const [orgStudents, setOrgStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");

  useEffect(() => {
    fetchProfile();
    if (user?.role === "teacher") {
      fetchOrganizationStudents();
    }
  }, []);

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/profile");
      const u = res.data?.user;
      if (u) {
        setProfileData(u);
        setName(u.name || "");
        setPhone(u.phone || "");
        setSubject(u.subject || "");
        setAvatar(u.avatar || "");
        setAvatarPreview(u.avatar || "");
      }
    } catch (err) {
      console.error("Failed to load profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationStudents = async () => {
    try {
      setStudentsLoading(true);
      const res = await api.get("/users?role=student");
      setOrgStudents(res.data?.users || []);
    } catch (err) {
      console.error("Failed to fetch organization students:", err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileAlert({ text: "Profile image must be smaller than 2MB.", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileAlert({ text: "", type: "" });

    if (name && name.trim().length <= 3) {
      setProfileAlert({ text: "Full name must be more than 3 characters (at least 4 characters).", type: "error" });
      return;
    }

    if (phone && !/^\d{10}$/.test(phone.trim())) {
      setProfileAlert({ text: "Phone number must be exactly 10 numeric digits.", type: "error" });
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.put("/auth/profile", {
        name,
        phone,
        subject,
        avatar
      });
      const updated = res.data?.user || { ...profileData, name, phone, subject, avatar };
      setProfileData(updated);
      if (updateUser) {
        updateUser(updated);
      }
      setProfileAlert({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => setProfileAlert({ text: "", type: "" }), 4000);
    } catch (err) {
      setProfileAlert({ text: err.response?.data?.message || "Failed to update profile.", type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendOtp = async () => {
    setSecurityAlert({ text: "", type: "" });
    try {
      setOtpLoading(true);
      const res = await api.post("/auth/send-reset-otp", { email: profileData?.email || user?.email });
      setSecurityAlert({ text: res.data?.message || "Verification code sent to your email!", type: "success" });
      setOtpStep(2);
      setOtpCountdown(600); // 10 minutes
    } catch (err) {
      setSecurityAlert({ text: err.response?.data?.message || "Failed to send reset code.", type: "error" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    setSecurityAlert({ text: "", type: "" });

    if (!otpCode.trim() || !newPassword) {
      setSecurityAlert({ text: "Please enter both the OTP code and your new password.", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setSecurityAlert({ text: "Password must be at least 6 characters long.", type: "error" });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setSecurityAlert({ text: "Password must contain at least 1 uppercase letter (A-Z).", type: "error" });
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setSecurityAlert({ text: "Password must contain at least 1 lowercase letter (a-z).", type: "error" });
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword)) {
      setSecurityAlert({ text: "Password must contain at least 1 special character (!@#$%^&* etc.).", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityAlert({ text: "New password and confirmation do not match.", type: "error" });
      return;
    }

    try {
      setOtpLoading(true);
      const res = await api.post("/auth/verify-reset-otp", {
        email: profileData?.email || user?.email,
        otp: otpCode.trim(),
        newPassword,
        confirmPassword
      });
      setSecurityAlert({ text: res.data?.message || "Password updated successfully!", type: "success" });
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpStep(1);
      setOtpCountdown(0);
    } catch (err) {
      setSecurityAlert({ text: err.response?.data?.message || "Invalid or expired verification code.", type: "error" });
    } finally {
      setOtpLoading(false);
    }
  };

  // Filter students for Teacher view
  const filteredStudents = orgStudents.filter((s) => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.batchNumber || "").toLowerCase().includes(studentSearch.toLowerCase());

    const matchesBatch =
      batchFilter === "all" ||
      (batchFilter === "unassigned" && !s.batchNumber) ||
      s.batchNumber === batchFilter;

    return matchesSearch && matchesBatch;
  });

  const userActiveRole = profileData?.role || user?.role || "";
  const isSuperAdmin = userActiveRole === "super_admin" || userActiveRole === "superadmin";
  const uniqueBatches = Array.from(new Set(orgStudents.map((s) => s.batchNumber).filter(Boolean)));
  const orgName = isSuperAdmin
    ? "Platform Super Admin (Global Scope)"
    : (profileData?.organizationId?.name || user?.organizationId?.name || "Independent / Platform User");

  let profileTitle = "Account & Faculty Profile";
  if (isSuperAdmin) {
    profileTitle = "Platform Super Admin Profile";
  } else if (userActiveRole === "org_admin" || userActiveRole === "admin") {
    profileTitle = "Organization Admin Profile";
  } else if (userActiveRole === "student") {
    profileTitle = "Student Scholar Profile & Account";
  }

  return (
    <DashboardLayout title={profileTitle}>
      <div className="profile-page">
        {/* Profile Hero Card */}
        <div className="profile-hero-card">
          <div className="profile-avatar-box">
            <div className="profile-avatar-circle" style={{ overflow: "hidden" }}>
              {(avatarPreview || profileData?.avatar || user?.avatar) ? (
                <img
                  src={avatarPreview || profileData?.avatar || user?.avatar}
                  alt={profileData?.name || user?.name || "Avatar"}
                  className="profile-avatar-image"
                />
              ) : (
                profileData?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <span className="profile-avatar-badge">
              <CheckCircleIcon size={14} />
            </span>
          </div>

          <div className="profile-hero-details">
            <div className="profile-hero-name-row">
              <h2>{profileData?.name || user?.name}</h2>
              <span className={`role-pill role-${profileData?.role || user?.role}`}>
                {(profileData?.role || user?.role)?.replace("_", " ").toUpperCase()}
              </span>
            </div>

            <p className="profile-hero-sub">
              <MailIcon size={14} /> <span>{profileData?.email || user?.email}</span>
              {profileData?.phone && (
                <>
                  <span className="dot-sep">•</span>
                  <PhoneIcon size={14} /> <span>{profileData.phone}</span>
                </>
              )}
              {profileData?.subject && (
                <>
                  <span className="dot-sep">•</span>
                  <GraduationCapIcon size={14} /> <span>{profileData.subject}</span>
                </>
              )}
            </p>

            <div className="profile-hero-tags">
              {isSuperAdmin ? (
                <span className="hero-tag" style={{ background: "rgba(99, 102, 241, 0.15)", borderColor: "rgba(99, 102, 241, 0.4)", color: "#818cf8", fontWeight: "600" }}>
                  <ShieldIcon size={13} /> Global Platform Super Admin
                </span>
              ) : (
                <span className="hero-tag">
                  <BuildingIcon size={13} /> {orgName}
                </span>
              )}
              <span className="hero-tag">
                <ShieldIcon size={13} /> Verified Account
              </span>
              {profileData?.createdAt && (
                <span className="hero-tag">
                  <ClockIcon size={13} /> Member since {new Date(profileData.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs-bar">
          {user?.role === "teacher" && (
            <button
              className={`profile-tab-btn ${activeTab === "students" ? "active" : ""}`}
              onClick={() => setActiveTab("students")}
            >
              <UsersIcon size={16} />
              <span>Organization Students</span>
              <span className="tab-pill-count">{orgStudents.length}</span>
            </button>
          )}

          <button
            className={`profile-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <UserIcon size={16} />
            <span>Account Details</span>
          </button>

          <button
            className={`profile-tab-btn ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            <EditIcon size={16} />
            <span>Edit Information</span>
          </button>

          <button
            className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <KeyIcon size={16} />
            <span>Security & OTP Reset</span>
          </button>
        </div>

        {/* Tab 1: Organization Students (For Teachers) */}
        {activeTab === "students" && user?.role === "teacher" && (
          <div className="profile-tab-pane">
            <div className="tab-pane-header">
              <div>
                <h3>Students in Your Organization</h3>
                <p>Enrolled scholars and students belonging to <strong>{orgName}</strong> eligible for your assessments and cohorts.</p>
              </div>
            </div>

            {/* Students Search & Filter Bar */}
            <div className="profile-filter-row">
              <div className="search-box-pill">
                <SearchIcon size={16} />
                <input
                  type="text"
                  placeholder="Search students by name, email, or batch code..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <div className="batch-filter-dropdown">
                <TagIcon size={15} />
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                >
                  <option value="all">All Batches / Cohorts ({orgStudents.length})</option>
                  {uniqueBatches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="unassigned">Unassigned to Batch</option>
                </select>
              </div>
            </div>

            {/* Students Table / Grid */}
            {studentsLoading ? (
              <div className="pane-loading">Loading organization students...</div>
            ) : filteredStudents.length > 0 ? (
              <div className="students-table-container">
                <table className="profile-students-table">
                  <thead>
                    <tr>
                      <th>Student Scholar</th>
                      <th>Email Address</th>
                      <th>Phone</th>
                      <th>Batch / Cohort</th>
                      <th>Status</th>
                      <th>Enrolled On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <div className="student-cell-profile">
                            <div className="student-initials">
                              {s.name?.charAt(0).toUpperCase() || "S"}
                            </div>
                            <strong>{s.name}</strong>
                          </div>
                        </td>
                        <td>{s.email}</td>
                        <td>{s.phone || "—"}</td>
                        <td>
                          {s.batchNumber ? (
                            <span className="batch-cell-tag">
                              <TagIcon size={12} /> {s.batchNumber}
                            </span>
                          ) : (
                            <span className="text-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${s.isActive !== false ? "active" : "inactive"}`}>
                            {s.status || "Active"}
                          </span>
                        </td>
                        <td>
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="pane-empty-state">
                <UsersIcon size={36} />
                <h4>No Students Found</h4>
                <p>
                  {studentSearch
                    ? "No student matches your search query."
                    : `No students are registered under ${orgName} yet.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Account Overview */}
        {activeTab === "overview" && (
          <div className="profile-tab-pane">
            <div className="tab-pane-header">
              <div>
                <h3>Account Information</h3>
                <p>Your institutional user credentials and platform attributes.</p>
              </div>
            </div>

            <div className="overview-details-grid">
              <div className="overview-field-card">
                <span className="field-label">Full Name</span>
                <span className="field-value">{profileData?.name || user?.name}</span>
              </div>

              <div className="overview-field-card">
                <span className="field-label">Official Email Address</span>
                <span className="field-value">{profileData?.email || user?.email}</span>
              </div>

              <div className="overview-field-card">
                <span className="field-label">Contact Phone</span>
                <span className="field-value">{profileData?.phone || "Not configured"}</span>
              </div>

              <div className="overview-field-card">
                <span className="field-label">Platform Role</span>
                <span className="field-value capitalize">{(profileData?.role || user?.role)?.replace("_", " ")}</span>
              </div>

              {isSuperAdmin ? (
                <div className="overview-field-card" style={{ borderColor: "rgba(99, 102, 241, 0.3)" }}>
                  <span className="field-label">Platform Governance Scope</span>
                  <span className="field-value" style={{ color: "#6366f1", fontWeight: 600 }}>
                    Global Platform Administration (All Organizations)
                  </span>
                </div>
              ) : (
                <div className="overview-field-card">
                  <span className="field-label">Institution / Organization</span>
                  <span className="field-value">{orgName}</span>
                </div>
              )}

              {profileData?.subject && (
                <div className="overview-field-card">
                  <span className="field-label">Teaching Department / Subject</span>
                  <span className="field-value">{profileData.subject}</span>
                </div>
              )}


              <div className="overview-field-card">
                <span className="field-label">Registered On</span>
                <span className="field-value">
                  {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Edit Information */}
        {activeTab === "edit" && (
          <div className="profile-tab-pane">
            <div className="tab-pane-header">
              <div>
                <h3>Edit Profile Information</h3>
                <p>Modify your display name, contact phone number, and academic details.</p>
              </div>
            </div>

            {profileAlert.text && (
              <div className={`profile-alert-banner ${profileAlert.type}`}>
                {profileAlert.type === "success" ? <CheckCircleIcon size={16} /> : <AlertTriangleIcon size={16} />}
                <span>{profileAlert.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="profile-edit-form">
              <div className="form-group-profile">
                <label>Full Name *</label>
                <input
                  type="text"
                  className="profile-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-profile">
                <label>Email Address</label>
                <input
                  type="email"
                  className="profile-input disabled"
                  value={profileData?.email || user?.email || ""}
                  disabled
                  title="Official email address is managed through system administrators"
                />
                <small className="field-note">Email address cannot be modified directly.</small>
              </div>

              <div className="form-group-profile">
                <label>10-Digit Phone Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  className="profile-input"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              {user?.role === "teacher" && (
                <div className="form-group-profile">
                  <label>Teaching Subject / Department</label>
                  <input
                    type="text"
                    className="profile-input"
                    placeholder="e.g. Computer Science, Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              )}

              {/* Profile Picture / Avatar Customizer */}
              <div className="form-group-profile avatar-customizer-block">
                <label>Profile Picture / Avatar</label>
                <div className="avatar-edit-container">
                  <div className="avatar-preview-box">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="avatar-preview-img" />
                    ) : (
                      <span className="avatar-preview-fallback">
                        {name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="avatar-controls">
                    <label className="btn-upload-avatar">
                      📁 Upload Custom Photo
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleAvatarFileSelect}
                        style={{ display: "none" }}
                      />
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        className="btn-clear-avatar"
                        onClick={() => {
                          setAvatar("");
                          setAvatarPreview("");
                        }}
                      >
                        Remove Photo
                      </button>
                    )}
                    <span className="avatar-upload-hint">Upload JPG, PNG, or WEBP (Max 2MB)</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-save-profile" disabled={savingProfile}>
                {savingProfile ? "Saving Changes..." : "Save Profile Details →"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Security & OTP Password Reset */}
        {activeTab === "security" && (
          <div className="profile-tab-pane">
            <div className="tab-pane-header">
              <div>
                <h3>Password Reset & Security</h3>
                <p>Update your password using two-factor real-time Email OTP verification.</p>
              </div>
            </div>

            {securityAlert.text && (
              <div className={`profile-alert-banner ${securityAlert.type}`}>
                {securityAlert.type === "success" ? <CheckCircleIcon size={16} /> : <AlertTriangleIcon size={16} />}
                <span>{securityAlert.text}</span>
              </div>
            )}

            <div className="security-otp-box">
              <div className="security-info-strip">
                <ShieldIcon size={20} />
                <div>
                  <strong>Email OTP Protection</strong>
                  <p>A 6-digit numeric verification code will be dispatched to <strong>{profileData?.email || user?.email}</strong> to authorize any password modification.</p>
                </div>
              </div>

              {otpStep === 1 ? (
                <div className="otp-step-1">
                  <p className="otp-instruction">
                    Click the button below to dispatch a single-use verification code to your registered email address.
                  </p>
                  <button
                    type="button"
                    className="btn-primary-otp"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                  >
                    {otpLoading ? "Dispatching Code..." : "Send Verification OTP to My Email →"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtpAndReset} className="otp-step-2-form">
                  <div className="form-group-profile">
                    <label>
                      <span>6-Digit Verification Code *</span>
                      {otpCountdown > 0 && (
                        <span className="otp-timer">
                          Expires in {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      className="profile-input otp-code-field"
                      maxLength={6}
                      placeholder="e.g. 592813"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>

                  <div className="form-group-profile">
                    <label>New Password *</label>
                    <input
                      type="password"
                      className="profile-input"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group-profile">
                    <label>Confirm New Password *</label>
                    <input
                      type="password"
                      className="profile-input"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="otp-form-actions">
                    <button
                      type="button"
                      className="btn-resend-otp"
                      onClick={handleSendOtp}
                      disabled={otpLoading || otpCountdown > 540}
                    >
                      Resend OTP Code
                    </button>
                    <button
                      type="submit"
                      className="btn-save-profile"
                      disabled={otpLoading}
                    >
                      {otpLoading ? "Verifying..." : "Verify OTP & Update Password →"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
