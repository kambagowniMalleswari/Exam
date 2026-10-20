import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import {
  sanitizeDigits,
  getPasswordCriteria,
  validatePassword,
  validatePhone,
  validateUsername
} from "../utils/validation.js";
import { normalizeRole } from "../utils/roleUtils.js";
import "./Profile.css";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(
    requestedTab || "overview"
  );
  const [profileData, setProfileData] = useState(user);

  // Sync tab if URL param changes
  useEffect(() => {
    if (requestedTab && ["students", "overview", "edit", "security"].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Edit form state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [subject, setSubject] = useState(user?.subject || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileAlert, setProfileAlert] = useState({ text: "", type: "" });

  // Keep form fields synced when auth user changes
  useEffect(() => {
    if (user) {
      setProfileData(user);
      setName(user.name || "");
      setPhone(user.phone || "");
      setSubject(user.subject || "");
      setAvatar(user.avatar || "");
      setAvatarPreview(user.avatar || "");
    }
  }, [user]);

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
        if (updateUser) updateUser(u);
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

  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Get optimized base64
          const optimizedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(optimizedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileAlert({ text: "Please select a valid image file (JPG, PNG, or WEBP).", type: "error" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileAlert({ text: "Profile image must be smaller than 2MB.", type: "error" });
      return;
    }

    try {
      const optimizedBase64 = await compressImage(file, 400, 400, 0.85);
      setAvatar(optimizedBase64);
      setAvatarPreview(optimizedBase64);
      setProfileAlert({
        text: "Photo loaded and optimized successfully. Click 'Save Profile Details' to persist.",
        type: "success"
      });
    } catch (err) {
      console.error("Avatar compression error:", err);
      // Fallback to raw data url
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
      setSecurityAlert({
        text: res.data?.message || "Verification code dispatched to your email! Please check your inbox (and Spam folder).",
        type: "success"
      });
      setOtpStep(2);
      setOtpCountdown(600); // 10 minutes
    } catch (err) {
      setSecurityAlert({ text: err.response?.data?.message || "Failed to dispatch reset code.", type: "error" });
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

  const activeUser = user || profileData;
  const userActiveRole = activeUser?.role || "";
  const normRole = normalizeRole(userActiveRole);
  const isSuperAdmin = normRole === "super_admin";
  const uniqueBatches = Array.from(new Set(orgStudents.map((s) => s.batchNumber).filter(Boolean)));
  const orgName = isSuperAdmin
    ? "Platform Super Admin (Global Scope)"
    : (activeUser?.organizationId?.name || "Independent / Platform User");

  let profileTitle = "Account & Faculty Profile";
  if (isSuperAdmin) {
    profileTitle = "Platform Super Admin Profile";
  } else if (normRole === "org_admin") {
    profileTitle = "Organization Admin Profile";
  } else if (normRole === "student") {
    profileTitle = "Student Scholar Profile & Account";
  }

  return (
    <DashboardLayout title={profileTitle}>
      <div className="profile-page">
        {/* Profile Hero Card */}
        <div className="profile-hero-card">
          <div className="profile-avatar-box">
            <div className="profile-avatar-circle" style={{ overflow: "hidden" }}>
              {(avatarPreview || activeUser?.avatar) ? (
                <img
                  src={avatarPreview || activeUser?.avatar}
                  alt={activeUser?.name || "Avatar"}
                  className="profile-avatar-image"
                />
              ) : (
                activeUser?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <span className="profile-avatar-badge">
              <CheckCircleIcon size={14} />
            </span>
          </div>

          <div className="profile-hero-details">
            <div className="profile-hero-name-row">
              <h2>{activeUser?.name}</h2>
              <span className={`role-pill role-${activeUser?.role}`}>
                {activeUser?.role?.replace("_", " ").toUpperCase()}
              </span>
            </div>

            <p className="profile-hero-sub">
              <MailIcon size={14} /> <span>{activeUser?.email}</span>
              {activeUser?.phone && (
                <>
                  <span className="dot-sep">•</span>
                  <PhoneIcon size={14} /> <span>{activeUser?.phone}</span>
                </>
              )}
              {activeUser?.subject && (
                <>
                  <span className="dot-sep">•</span>
                  <GraduationCapIcon size={14} /> <span>{activeUser?.subject}</span>
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
              {activeUser?.createdAt && (
                <span className="hero-tag">
                  <ClockIcon size={13} /> Member since {new Date(activeUser?.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs-bar">
          <button
            className={`profile-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            <UserIcon size={16} />
            <span>Account Details</span>
          </button>

          <button
            className={`profile-tab-btn ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => handleTabChange("edit")}
          >
            <EditIcon size={16} />
            <span>Edit Information</span>
          </button>

          <button
            className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => handleTabChange("security")}
          >
            <KeyIcon size={16} />
            <span>Security & OTP Reset</span>
          </button>

          {user?.role === "teacher" && (
            <button
              className={`profile-tab-btn ${activeTab === "students" ? "active" : ""}`}
              onClick={() => handleTabChange("students")}
            >
              <UsersIcon size={16} />
              <span>Organization Students</span>
              <span className="tab-pill-count">{orgStudents.length}</span>
            </button>
          )}
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
                <span className="field-value">{activeUser?.name}</span>
              </div>

              <div className="overview-field-card email-card">
                <span className="field-label">Official Email Address</span>
                <span className="field-value email-value" title={activeUser?.email}>
                  <MailIcon size={16} />
                  <span>{activeUser?.email}</span>
                </span>
              </div>

              <div className="overview-field-card">
                <span className="field-label">Contact Phone</span>
                <span className="field-value">{activeUser?.phone || "Not configured"}</span>
              </div>

              <div className="overview-field-card">
                <span className="field-label">Platform Role</span>
                <span className="field-value capitalize">{activeUser?.role?.replace("_", " ")}</span>
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

              {activeUser?.subject && (
                <div className="overview-field-card">
                  <span className="field-label">Teaching Department / Subject</span>
                  <span className="field-value">{activeUser.subject}</span>
                </div>
              )}

              <div className="overview-field-card">
                <span className="field-label">Registered On</span>
                <span className="field-value">
                  {activeUser?.createdAt ? new Date(activeUser.createdAt).toLocaleDateString() : "—"}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label>10-Digit Phone Number</label>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>10 digits</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  className="profile-input"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(sanitizeDigits(e.target.value, 10))}
                />
                {phone && phone.length < 10 && (
                  <span style={{ fontSize: "0.76rem", color: "#e11d48", marginTop: "4px", display: "block" }}>
                    ⚠️ Must be 10 numeric digits ({phone.length}/10)
                  </span>
                )}
                {phone && phone.length === 10 && (
                  <span style={{ fontSize: "0.76rem", color: "#16a34a", marginTop: "4px", display: "block" }}>
                    ✓ Valid 10-digit number
                  </span>
                )}
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
                    <span className="avatar-upload-hint">
                      <strong>Recommended Dimensions:</strong> 400 × 400 px (Square) • Max 2MB (JPG, PNG, WEBP)
                    </span>
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
                    Click the button below to dispatch a single-use verification code to your registered email address ({profileData?.email || user?.email}).
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
                    {newPassword.length > 0 && (() => {
                      const pwdCriteria = getPasswordCriteria(newPassword);
                      return (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "4px 8px",
                          marginTop: "6px",
                          fontSize: "0.74rem",
                          background: "#f8fafc",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0"
                        }}>
                          <span style={{ color: pwdCriteria.hasLength ? "#16a34a" : "#94a3b8", fontWeight: pwdCriteria.hasLength ? 600 : 400 }}>
                            {pwdCriteria.hasLength ? "✓" : "○"} Min 6 characters
                          </span>
                          <span style={{ color: pwdCriteria.hasUpper ? "#16a34a" : "#94a3b8", fontWeight: pwdCriteria.hasUpper ? 600 : 400 }}>
                            {pwdCriteria.hasUpper ? "✓" : "○"} 1 Uppercase (A-Z)
                          </span>
                          <span style={{ color: pwdCriteria.hasLower ? "#16a34a" : "#94a3b8", fontWeight: pwdCriteria.hasLower ? 600 : 400 }}>
                            {pwdCriteria.hasLower ? "✓" : "○"} 1 Lowercase (a-z)
                          </span>
                          <span style={{ color: pwdCriteria.hasSpecial ? "#16a34a" : "#94a3b8", fontWeight: pwdCriteria.hasSpecial ? 600 : 400 }}>
                            {pwdCriteria.hasSpecial ? "✓" : "○"} 1 Special char (!@#$)
                          </span>
                        </div>
                      );
                    })()}
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
                    {confirmPassword.length > 0 && (
                      <span style={{
                        fontSize: "0.76rem",
                        color: newPassword === confirmPassword ? "#16a34a" : "#e11d48",
                        marginTop: "4px",
                        display: "block"
                      }}>
                        {newPassword === confirmPassword ? "✓ Passwords match" : "⚠️ Passwords do not match"}
                      </span>
                    )}
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
