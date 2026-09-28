// Super Admin Dashboard with 100% Real MongoDB Aggregations & Institutional Aesthetics
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  BuildingIcon,
  UsersIcon,
  GraduationCapIcon,
  ShieldIcon,
  BarChartIcon,
  AlertTriangleIcon,
  CheckIcon,
  CheckCircleIcon,
  XIcon,
  FileTextIcon
} from "../../components/common/Icons.jsx";
import "./SuperAdminDashboard.css";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Real Aggregated Platform Metrics
  const [metrics, setMetrics] = useState({
    organizations: { total: 0, active: 0, inactive: 0, growthTrend: [] },
    teachers: { total: 0, active: 0, pendingApprovals: 0, bySubject: [] },
    students: { total: 0, active: 0, inactive: 0, participatingInTests: 0, averagePerformance: 0, completionRate: 0 },
    tests: { total: 0, bySubject: [] },
    attempts: { total: 0, completed: 0, passRate: 0 },
    users: { total: 0, teachers: 0, students: 0 },
    revenue: { available: false, display: "Revenue data unavailable", status: "N/A" }
  });

  // Recent Organizations List
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Add Organization Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [pendingOrgCount, setPendingOrgCount] = useState(0);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "College",
    adminName: "",
    phone: "",
    city: "",
    subscriptionPlan: "free"
  });

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(""), 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [reportRes, orgsRes, orgAppsRes] = await Promise.all([
        api.get("/reports/platform"),
        api.get("/organizations"),
        api.get("/org-applications?status=pending").catch(() => ({ data: { count: 0 } }))
      ]);

      if (reportRes.data?.report) {
        setMetrics(reportRes.data.report);
      }

      const orgs = orgsRes.data?.organizations || orgsRes.data || [];
      setOrganizations(orgs);
      setPendingOrgCount(orgAppsRes.data?.count ?? orgAppsRes.data?.applications?.length ?? 0);
    } catch (err) {
      console.error("Dashboard error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to load platform data.";
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError(`Access Restriction (${err.response.status}): ${msg}. Please re-login with an active Super Admin account.`);
      } else {
        setError(`Platform Error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setModalError("Organization name and email are required.");
      return;
    }

    try {
      setModalLoading(true);
      const res = await api.post("/organizations", formData);
      if (res.data?.temporaryPassword) {
        setCreatedCredentials(res.data);
      } else {
        setShowAddModal(false);
      }
      setFormData({
        name: "",
        email: "",
        type: "College",
        adminName: "",
        phone: "",
        city: "",
        subscriptionPlan: "free"
      });
      setSuccessMessage("Organization provisioned successfully!");
      fetchSuperAdminData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create organization.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (orgId, currentStatus) => {
    try {
      await api.patch(`/organizations/${orgId}/status`);
      setSuccessMessage("Organization status updated.");
      fetchSuperAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle organization status.");
    }
  };

  // Filtered organizations
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.adminName?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "active") {
      return matchesSearch && (org.status === "active" || org.isActive === true);
    }
    if (statusFilter === "inactive") {
      return matchesSearch && (org.status !== "active" && org.isActive !== true);
    }
    return matchesSearch;
  });

  return (
    <DashboardLayout title="Super Admin Platform Governance">
      <div className="sad-root">
        {/* Top Header Banner */}
        <div className="sad-banner">
          <div>
            <span className="sad-badge-pill">PLATFORM GOVERNANCE</span>
            <h2>Multi-Tenant Management Console</h2>
            <p>Live MongoDB real-time metrics across all affiliated institutions, teachers, and enrolled students.</p>
          </div>

          <div className="sad-header-actions">
            {pendingOrgCount > 0 && (
              <button
                type="button"
                className="btn-pending-requests-pill btn-pending-orgs"
                onClick={() => navigate("/superadmin/org-requests")}
                title="Review pending institutional onboarding applications"
              >
                <BuildingIcon size={16} />
                <strong>{pendingOrgCount} Pending Institution Request{pendingOrgCount > 1 ? "s" : ""}</strong>
              </button>
            )}
            {metrics.teachers?.pendingApprovals > 0 && (
              <button
                type="button"
                className="btn-pending-requests-pill"
                onClick={() => navigate("/superadmin/teacher-requests")}
              >
                <FileTextIcon size={16} />
                <strong>{metrics.teachers.pendingApprovals} Pending Faculty Requests</strong>
              </button>
            )}
            <button
              type="button"
              className="btn-sad-primary"
              onClick={() => {
                setCreatedCredentials(null);
                setModalError("");
                setShowAddModal(true);
              }}
            >
              + Add Organization
            </button>
          </div>
        </div>

        {pendingOrgCount > 0 && (
          <div
            className="sad-pending-banner"
            onClick={() => navigate("/superadmin/org-requests")}
            role="button"
            tabIndex={0}
          >
            <div className="spb-left">
              <span className="spb-icon"><BuildingIcon size={24} /></span>
              <div>
                <h4>{pendingOrgCount} Institutional Onboarding Application{pendingOrgCount > 1 ? "s" : ""} Awaiting Review</h4>
                <p>New partnership requests have been submitted. Review and approve to provision tenant isolation.</p>
              </div>
            </div>
            <button className="spb-btn" onClick={(e) => { e.stopPropagation(); navigate("/superadmin/org-requests"); }}>
              Review Requests →
            </button>
          </div>
        )}

        {error && <div className="sad-alert error"><AlertTriangleIcon size={16} /> <span>{error}</span></div>}
        {successMessage && <div className="sad-alert success"><CheckIcon size={16} /> <span>{successMessage}</span></div>}

        {/* 1. Main KPI Cards - Clickable & Animated */}
        <div className="sad-kpi-grid">
          {/* Total Organisations */}
          <div
            className="kpi-card-item card-orgs"
            onClick={() => navigate("/superadmin/organizations")}
            role="button"
            tabIndex={0}
            title="Click to manage organizations"
          >
            <div className="kpi-header">
              <span className="kpi-label">TOTAL ORGANISATIONS</span>
              <div className="kpi-icon-wrap" style={{ color: "#2563eb" }}>
                <BuildingIcon size={22} />
              </div>
            </div>
            <div className="kpi-main-number">{metrics.organizations.total}</div>
            <div className="kpi-sub-stats">
              <span className="stat-pill active">
                <span className="dot-green"></span> {metrics.organizations.active} Active
              </span>
              <span className="stat-pill inactive">
                {metrics.organizations.inactive} Inactive
              </span>
            </div>
          </div>

          {/* Total Teachers */}
          <div
            className="kpi-card-item card-teachers"
            onClick={() => navigate("/superadmin/teacher-requests")}
            role="button"
            tabIndex={0}
            title="Click to view teacher applications"
          >
            <div className="kpi-header">
              <span className="kpi-label">TOTAL TEACHERS</span>
              <div className="kpi-icon-wrap" style={{ color: "#059669" }}>
                <UsersIcon size={22} />
              </div>
            </div>
            <div className="kpi-main-number">{metrics.teachers.total}</div>
            <div className="kpi-sub-stats">
              <span className="stat-pill active">
                <span className="dot-green"></span> {metrics.teachers.active} Active
              </span>
              {metrics.teachers.pendingApprovals > 0 ? (
                <span className="stat-pill pending">
                  {metrics.teachers.pendingApprovals} Pending
                </span>
              ) : (
                <span className="stat-pill">0 Pending</span>
              )}
            </div>
          </div>

          {/* Total Students */}
          <div
            className="kpi-card-item card-students"
            onClick={() => navigate("/superadmin/reports")}
            role="button"
            tabIndex={0}
            title="Click to view student participation reports"
          >
            <div className="kpi-header">
              <span className="kpi-label">TOTAL STUDENTS</span>
              <div className="kpi-icon-wrap" style={{ color: "#7c3aed" }}>
                <GraduationCapIcon size={22} />
              </div>
            </div>
            <div className="kpi-main-number">{metrics.students.total}</div>
            <div className="kpi-sub-stats">
              <span className="stat-pill active">
                <span className="dot-green"></span> {metrics.students.active} Active
              </span>
              <span className="stat-pill">
                {metrics.students.participatingInTests} Completed Tests
              </span>
            </div>
          </div>

          {/* Total Users (Teachers + Students) */}
          <div
            className="kpi-card-item card-users"
            onClick={() => navigate("/superadmin/reports")}
            role="button"
            tabIndex={0}
            title="Click to view platform user reports"
          >
            <div className="kpi-header">
              <span className="kpi-label">TOTAL PLATFORM USERS</span>
              <div className="kpi-icon-wrap" style={{ color: "#d97706" }}>
                <BarChartIcon size={22} />
              </div>
            </div>
            <div className="kpi-main-number">{metrics.users.total}</div>
            <div className="kpi-sub-stats">
              <span className="stat-pill calc">
                {metrics.teachers.total} Teachers + {metrics.students.total} Students
              </span>
            </div>
          </div>
        </div>

        {/* 2. Primary Analytics Split: Teachers by Subject & Tests by Subject */}
        <div className="sad-analytics-split">
          {/* Teachers by Subject (Requirement 4) */}
          <div className="analytics-card">
            <div className="card-top-title">
              <div>
                <h3>Teachers by Subject</h3>
                <p>Distribution of teaching faculty across curriculum subjects</p>
              </div>
              <span className="tag-count">{metrics.teachers.bySubject?.length || 0} Subjects</span>
            </div>

            {metrics.teachers.bySubject?.length === 0 ? (
              <div className="empty-chart-state">
                <p>No teacher subject records found yet.</p>
              </div>
            ) : (
              <div className="subject-bars-list">
                {metrics.teachers.bySubject?.map((item) => {
                  const maxCount = Math.max(...metrics.teachers.bySubject.map((s) => s.teachersCount), 1);
                  const pct = Math.round((item.teachersCount / maxCount) * 100);

                  return (
                    <div className="subject-bar-row" key={item.subject}>
                      <div className="bar-labels">
                        <span className="subj-name">{item.subject}</span>
                        <strong className="subj-count">{item.teachersCount} Teachers</strong>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill fill-blue"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tests by Subject (Requirement 5) */}
          <div className="analytics-card">
            <div className="card-top-title">
              <div>
                <h3>Tests by Subject</h3>
                <p>Total examinations authored and published per discipline</p>
              </div>
              <span className="tag-count">{metrics.tests.total} Total Tests</span>
            </div>

            {metrics.tests.bySubject?.length === 0 ? (
              <div className="empty-chart-state">
                <p>No tests created in the database yet.</p>
              </div>
            ) : (
              <div className="subject-bars-list">
                {metrics.tests.bySubject?.map((item) => {
                  const maxCount = Math.max(...metrics.tests.bySubject.map((s) => s.totalTests), 1);
                  const pct = Math.round((item.totalTests / maxCount) * 100);

                  return (
                    <div className="subject-bar-row" key={item.subject}>
                      <div className="bar-labels">
                        <span className="subj-name">{item.subject}</span>
                        <div className="subj-count-duo">
                          <strong>{item.totalTests} Tests</strong>
                          <small>({item.publishedTests} Published)</small>
                        </div>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill fill-indigo"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Secondary Analytics: Student Performance & Institutional Revenue */}
        <div className="sad-analytics-split">
          {/* Student Analytics (Requirement 6) */}
          <div className="analytics-card">
            <div className="card-top-title">
              <div>
                <h3>Student Assessment Analytics</h3>
                <p>Global attempt performance and exam participation rate</p>
              </div>
            </div>

            <div className="student-metrics-quad">
              <div className="quad-box">
                <span className="quad-label">Avg Student Score</span>
                <strong className="quad-value">{metrics.students.averagePerformance}%</strong>
                <span className="quad-hint">Across all verified tests</span>
              </div>
              <div className="quad-box">
                <span className="quad-label">Overall Pass Rate</span>
                <strong className="quad-value">{metrics.attempts.passRate}%</strong>
                <span className="quad-hint">Threshold passing score</span>
              </div>
              <div className="quad-box">
                <span className="quad-label">Test Completion Rate</span>
                <strong className="quad-value">{metrics.students.completionRate}%</strong>
                <span className="quad-hint">Submitted vs Started</span>
              </div>
              <div className="quad-box">
                <span className="quad-label">Total Test Attempts</span>
                <strong className="quad-value">{metrics.attempts.total}</strong>
                <span className="quad-hint">{metrics.attempts.completed} Evaluated</span>
              </div>
            </div>
          </div>

          {/* Revenue Requirements (Requirement 3: strictly real data, or "Revenue data unavailable") */}
          <div className="analytics-card">
            <div className="card-top-title">
              <div>
                <h3>Organisation Revenue & Subscriptions</h3>
                <p>Verified financial and subscription billing status</p>
              </div>
            </div>

            {metrics.revenue.available ? (
              <div className="revenue-active-box">
                <div className="rev-amount-row">
                  <span className="rev-currency">$</span>
                  <span className="rev-number">{metrics.revenue.totalRevenue}</span>
                  <span className="rev-period">/ month</span>
                </div>
                <p className="rev-desc">
                  Calculated from <strong>{metrics.revenue.activeSubscriptionsCount}</strong> recorded active institutional subscriptions.
                </p>
                <div className="rev-badge-row">
                  <span className="status-pill active"><CheckIcon size={12} /> Real Transaction Records Verified</span>
                </div>
              </div>
            ) : (
              <div className="revenue-unavailable-box">
                <div className="unavail-icon"><ShieldIcon size={32} /></div>
                <h4>{metrics.revenue.display}</h4>
                <p>
                  Current affiliated organizations are operating under the free or open-access educational tier.
                  No commercial subscription transactions are recorded in the database.
                </p>
                <div className="unavail-note">
                  <small>Policy: No artificial or estimated revenue metrics are displayed.</small>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Super Admin Organisation Management (Requirement 8) */}
        <div className="org-management-section">
          <div className="section-header-row">
            <div>
              <h3>Institutional Organizations</h3>
              <p>Monitor affiliated schools, colleges, student strengths, and toggle platform access.</p>
            </div>

            <div className="org-table-controls">
              <input
                type="text"
                placeholder="Search organizations or admins..."
                className="org-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="filter-pill-group">
                <button
                  className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
                  onClick={() => setStatusFilter("all")}
                >
                  All ({organizations.length})
                </button>
                <button
                  className={`filter-btn ${statusFilter === "active" ? "active" : ""}`}
                  onClick={() => setStatusFilter("active")}
                >
                  Active
                </button>
                <button
                  className={`filter-btn ${statusFilter === "inactive" ? "active" : ""}`}
                  onClick={() => setStatusFilter("inactive")}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <div className="org-table-container">
            {filteredOrgs.length === 0 ? (
              <div className="empty-table-state">
                <p>No organizations matching your search criteria.</p>
              </div>
            ) : (
              <table className="sad-table">
                <thead>
                  <tr>
                    <th>Organization Name</th>
                    <th>Type</th>
                    <th>Admin Details</th>
                    <th>Total Users</th>
                    <th>Total Tests</th>
                    <th>Status</th>
                    <th>Access Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrgs.map((org) => {
                    const isActive = org.status === "active" || org.isActive === true;
                    return (
                      <tr key={org._id}>
                        <td>
                          <strong>{org.name}</strong>
                          <small className="org-slug">{org.slug}</small>
                        </td>
                        <td>
                          <span className="type-badge">{org.type || "College"}</span>
                        </td>
                        <td>
                          <div>{org.adminName || "Assigned Admin"}</div>
                          <small className="org-email">{org.email}</small>
                        </td>
                        <td>
                          <strong>{org.totalUsers || 0}</strong> Users
                        </td>
                        <td>
                          <strong>{org.totalTests || 0}</strong> Tests
                        </td>
                        <td>
                          <span className={`status-pill ${isActive ? "active" : "inactive"}`}>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`btn-action-toggle ${isActive ? "deactivate" : "activate"}`}
                            onClick={() => handleToggleStatus(org._id, org.status)}
                          >
                            {isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add Organization Modal */}
        {showAddModal && (
          <div className="sad-modal-backdrop" onClick={() => setShowAddModal(false)}>
            <div className="sad-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{createdCredentials ? "Institution Provisioned" : "Provision New Institutional Organization"}</h3>
                <button type="button" className="btn-close" onClick={() => { setShowAddModal(false); setCreatedCredentials(null); }}><XIcon size={14} /></button>
              </div>

              {modalError && <div className="sad-alert error modal-alert"><AlertTriangleIcon size={16} /> <span>{modalError}</span></div>}

              {createdCredentials ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "#16a34a" }}>
                    <CheckCircleIcon size={36} />
                  </div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", color: "#0f172a" }}>Organization Provisioned Successfully!</h4>
                  <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "0 0 16px 0" }}>
                    Tenant record created for <strong>{createdCredentials.organization?.name}</strong>.
                  </p>

                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", textAlign: "left", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0" }}>
                      <div>
                        <strong style={{ fontSize: "0.85rem", color: "#475569" }}>Admin Email:</strong>{" "}
                        <code style={{ fontSize: "0.85rem", color: "#0f172a" }}>{createdCredentials.adminUser?.email || createdCredentials.organization?.email}</code>
                      </div>
                      <button
                        type="button"
                        style={{ padding: "4px 10px", fontSize: "0.78rem", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#fff", cursor: "pointer" }}
                        onClick={() => copyToClipboard(createdCredentials.adminUser?.email || createdCredentials.organization?.email, "dashEmail")}
                      >
                        {copiedField === "dashEmail" ? "Copied!" : "Copy"}
                      </button>
                    </div>

                    {createdCredentials.temporaryPassword && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", padding: "8px 10px", background: "#fffbeb", borderRadius: "8px", border: "1px dashed #f59e0b" }}>
                        <div>
                          <strong style={{ fontSize: "0.85rem", color: "#92400e" }}>Temporary Password:</strong>{" "}
                          <code style={{ fontSize: "1rem", fontWeight: "bold", color: "#b45309" }}>{createdCredentials.temporaryPassword}</code>
                        </div>
                        <button
                          type="button"
                          style={{ padding: "4px 10px", fontSize: "0.78rem", border: "1px solid #fde68a", borderRadius: "6px", background: "#fef3c7", color: "#92400e", fontWeight: "bold", cursor: "pointer" }}
                          onClick={() => copyToClipboard(createdCredentials.temporaryPassword, "dashPassword")}
                        >
                          {copiedField === "dashPassword" ? "Copied!" : "Copy Password"}
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0" }}>
                      <div>
                        <strong style={{ fontSize: "0.85rem", color: "#475569" }}>Admin Login URL:</strong>{" "}
                        <code style={{ fontSize: "0.85rem", color: "#0f172a" }}>{window.location.origin}/admin/login</code>
                      </div>
                      <button
                        type="button"
                        style={{ padding: "4px 10px", fontSize: "0.78rem", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#fff", cursor: "pointer" }}
                        onClick={() => copyToClipboard(`${window.location.origin}/admin/login`, "dashLoginUrl")}
                      >
                        {copiedField === "dashLoginUrl" ? "Copied!" : "Copy URL"}
                      </button>
                    </div>

                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#475569" }}>Organization Slug:</strong>{" "}
                      <code style={{ fontSize: "0.85rem", color: "#0f172a" }}>{createdCredentials.organization?.slug}</code>
                    </div>
                  </div>

                  {createdCredentials.emailSent ? (
                    <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
                      <CheckCircleIcon size={18} />
                      <span>Credentials email dispatched successfully to {createdCredentials.adminUser?.email || createdCredentials.organization?.email}.</span>
                    </div>
                  ) : (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertTriangleIcon size={18} />
                      <span>Email delivery failed ({createdCredentials.emailError || "SMTP unavailable"}). Please copy the temporary password above and share it with the administrator manually.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    style={{ background: "#0f172a", color: "#fff", padding: "10px 24px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}
                    onClick={() => {
                      setShowAddModal(false);
                      setCreatedCredentials(null);
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateOrganization} className="modal-form">
                  <div className="form-field-item">
                    <label>Institution Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Stanford Medical College"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-field-row">
                    <div className="form-field-item">
                      <label>Official Email *</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="admin@institution.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-field-item">
                      <label>Institution Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="College">College</option>
                        <option value="University">University</option>
                        <option value="School">School</option>
                        <option value="Training Academy">Training Academy</option>
                        <option value="Corporate">Corporate / Enterprise</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field-row">
                    <div className="form-field-item">
                      <label>Administrator Full Name</label>
                      <input
                        type="text"
                        name="adminName"
                        placeholder="e.g. Dr. Robert Chen"
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      />
                    </div>

                    <div className="form-field-item">
                      <label>Contact Phone (10 Digits)</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="10-digit phone"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                      />
                    </div>
                  </div>

                  <div className="modal-actions-row">
                    <button type="button" className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-modal-submit" disabled={modalLoading}>
                      {modalLoading ? "Creating Institution..." : "Provision Organization →"}
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

export default SuperAdminDashboard;