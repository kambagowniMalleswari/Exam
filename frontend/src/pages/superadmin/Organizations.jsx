import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  BuildingIcon,
  EditIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  MailIcon,
  UsersIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  EyeIcon
} from "../../components/common/Icons.jsx";
import "./Organizations.css";

const Organizations = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedback, setFeedback] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteOrgTarget, setDeleteOrgTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(""), 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "College",
    adminName: "",
    phone: "",
    city: "",
    subscriptionPlan: "starter"
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    type: "College",
    phone: "",
    city: ""
  });

  useEffect(() => {
    fetchOrganizations();
    if (searchParams.get("action") === "add") {
      setCreatedCredentials(null);
      setShowAddModal(true);
    }
  }, [searchParams]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/organizations");
      const list = res.data.organizations || res.data || [];
      setOrganizations(list);
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError("Failed to fetch organizations.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setModalError("Organization name and email are required.");
      return;
    }

    if (formData.name.trim().length <= 3) {
      setModalError("Organization name must be more than 3 characters (at least 4 characters).");
      return;
    }

    if (formData.adminName && formData.adminName.trim().length <= 3) {
      setModalError("Administrator name must be more than 3 characters (at least 4 characters).");
      return;
    }

    if (formData.phone && formData.phone.trim() && !/^\d{10}$/.test(formData.phone.trim())) {
      setModalError("Phone number must be exactly 10 numeric digits.");
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
        subscriptionPlan: "starter"
      });
      setFeedback("Organization registered successfully!");
      setTimeout(() => setFeedback(""), 4000);
      searchParams.delete("action");
      setSearchParams(searchParams);
      await fetchOrganizations();
    } catch (err) {
      setModalError(
        err.response?.data?.message || "Failed to create organization."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditOrg = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setModalError("");

    if (editFormData.name && editFormData.name.trim().length <= 3) {
      setModalError("Organization name must be more than 3 characters (at least 4 characters).");
      return;
    }

    if (editFormData.phone && editFormData.phone.trim() && !/^\d{10}$/.test(editFormData.phone.trim())) {
      setModalError("Phone number must be exactly 10 numeric digits.");
      return;
    }

    try {
      setModalLoading(true);
      await api.put(`/organizations/${selectedOrg._id}`, editFormData);
      setShowEditModal(false);
      setFeedback("Organization updated successfully!");
      setTimeout(() => setFeedback(""), 4000);
      await fetchOrganizations();
    } catch (err) {
      setModalError(
        err.response?.data?.message || "Failed to update organization."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (org) => {
    try {
      const res = await api.patch(`/organizations/${org._id}/status`);
      setFeedback(res.data?.message || "Status updated successfully!");
      setTimeout(() => setFeedback(""), 3000);
      await fetchOrganizations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    }
  };

  const confirmDeleteOrg = async () => {
    if (!deleteOrgTarget) return;

    try {
      setDeleteLoading(true);
      await api.delete(`/organizations/${deleteOrgTarget._id}`);
      setFeedback(`"${deleteOrgTarget.name}" deleted successfully.`);
      setTimeout(() => setFeedback(""), 4000);
      setDeleteOrgTarget(null);
      await fetchOrganizations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete organization.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (org) => {
    setSelectedOrg(org);
    setEditFormData({
      name: org.name || "",
      email: org.email || "",
      type: org.type || "College",
      phone: org.phone || "",
      city: org.city || ""
    });
    setShowEditModal(true);
  };

  const openViewModal = (org) => {
    setSelectedOrg(org);
    setShowViewModal(true);
  };

  // Filter organizations
  const filteredOrganizations = organizations.filter((org) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (org.name || "").toLowerCase().includes(q) ||
      (org.email || "").toLowerCase().includes(q) ||
      (org.city || "").toLowerCase().includes(q);

    const isActive = org.status === "active" || org.isActive === true;
    if (statusFilter === "active") return matchesSearch && isActive;
    if (statusFilter === "inactive") return matchesSearch && !isActive;
    return matchesSearch;
  });

  const totalCount = organizations.length;
  const activeCount = organizations.filter(
    (o) => o.status === "active" || o.isActive === true
  ).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <DashboardLayout title="Organizations Management">
      <div className="organizations-page">
        {/* Page heading */}
        <div className="organizations-heading">
          <div>
            <h2>Organizations</h2>
            <p>Manage institutions registered on the AssessIQ portal.</p>
          </div>

          <button
            className="add-organization-button"
            onClick={() => {
              setCreatedCredentials(null);
              setModalError("");
              setShowAddModal(true);
            }}
          >
            + Add Organization
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            style={{
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontWeight: 500,
              fontSize: "0.9rem"
            }}
          >
            ✓ {feedback}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "0.9rem"
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="organization-summary">
          <div className="organization-summary-card">
            <span>Total Organizations</span>
            <strong>{loading ? "..." : totalCount}</strong>
          </div>

          <div className="organization-summary-card">
            <span>Active</span>
            <strong>{loading ? "..." : activeCount}</strong>
          </div>

          <div className="organization-summary-card">
            <span>Inactive</span>
            <strong>{loading ? "..." : inactiveCount}</strong>
          </div>
        </div>

        {/* Organizations panel */}
        <div className="organizations-panel">
          {/* Panel header */}
          <div className="organizations-panel-header">
            <div>
              <h3>All Organizations</h3>
              <p>View, manage and monitor registered organizations.</p>
            </div>

            <div className="dashboard-filter-bar">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="dashboard-filter-select"
                aria-label="Filter organizations by status"
              >
                <option value="all">All Statuses ({totalCount})</option>
                <option value="active">Active Only ({activeCount})</option>
                <option value="inactive">Inactive Only ({inactiveCount})</option>
              </select>

              {/* Search */}
              <div className="organization-search">
                <SearchIcon size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="organizations-table-wrapper">
            <table className="organizations-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Users</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      Loading organizations...
                    </td>
                  </tr>
                ) : filteredOrganizations.length > 0 ? (
                  filteredOrganizations.map((organization) => {
                    const isActive =
                      organization.status === "active" ||
                      organization.isActive === true;
                    return (
                      <tr key={organization._id || organization.id}>
                        {/* Organization */}
                        <td>
                          <div className="table-organization">
                            <div className="table-organization-avatar">
                              {(organization.name || "O").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{organization.name}</strong>
                              <span>{organization.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td>
                          <span className="table-location">
                            {organization.city
                              ? `${organization.city}${organization.state ? `, ${organization.state}` : ""}`
                              : "—"}
                          </span>
                        </td>

                        {/* Type */}
                        <td>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              background: "#f1f5f9",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              color: "#475569"
                            }}
                          >
                            {organization.type || "College"}
                          </span>
                        </td>

                        {/* Users */}
                        <td>
                          <span className="user-count">
                            {organization.totalUsers !== undefined
                              ? organization.totalUsers
                              : organization.users || 0}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`organization-status ${
                              isActive ? "active" : "inactive"
                            }`}
                          >
                            <span className="status-dot"></span>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="organization-actions">
                            <button
                              type="button"
                              className="btn-action-pill view"
                              onClick={() => openViewModal(organization)}
                              title="View Details"
                            >
                              <EyeIcon size={13} /> View
                            </button>

                            <button
                              type="button"
                              className="btn-action-pill edit"
                              onClick={() => openEditModal(organization)}
                              title="Edit Organization"
                            >
                              <EditIcon size={13} /> Edit
                            </button>

                            <button
                              type="button"
                              className={`btn-action-pill ${isActive ? "deactivate" : "activate"}`}
                              onClick={() => handleToggleStatus(organization)}
                              title={isActive ? "Deactivate Organization" : "Activate Organization"}
                            >
                              <CheckCircleIcon size={13} />
                              {isActive ? "Deactivate" : "Activate"}
                            </button>

                            <button
                              type="button"
                              className="btn-action-pill delete"
                              onClick={() => setDeleteOrgTarget(organization)}
                              title="Delete Organization"
                            >
                              <TrashIcon size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-organizations">
                      {search
                        ? "No organizations matched your search query."
                        : "No registered organizations found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="organizations-table-footer">
            <span>
              Showing {filteredOrganizations.length} of {organizations.length} organizations
            </span>
          </div>
        </div>

        {/* View Modal */}
        {showViewModal && selectedOrg && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <BuildingIcon size={20} />
                  <span>{selectedOrg.name}</span>
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "0.9rem" }}>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>OFFICIAL EMAIL</strong>
                  <span>{selectedOrg.email || "—"}</span>
                </div>

                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>INSTITUTION TYPE</strong>
                  <span>{selectedOrg.type || "College"}</span>
                </div>

                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>ADMIN CONTACT</strong>
                  <span>{selectedOrg.adminName || "—"}</span>
                </div>

                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>PHONE NUMBER</strong>
                  <span>{selectedOrg.phone || "—"}</span>
                </div>

                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>LOCATION</strong>
                  <span>{selectedOrg.city || "—"}</span>
                </div>

                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>SUBSCRIPTION TIER</strong>
                  <span style={{ textTransform: "capitalize" }}>{selectedOrg.subscriptionPlan || "Free"}</span>
                </div>

                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>TOTAL STUDENTS/USERS</strong>
                  <span>{selectedOrg.totalUsers || 0} registered</span>
                </div>

                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>TOTAL TESTS AUTHORED</strong>
                  <span>{selectedOrg.totalTests || 0} tests</span>
                </div>
              </div>

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedOrg && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <EditIcon size={18} />
                  <span>Edit Organization Details</span>
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "14px" }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleEditOrg}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Organization Name *</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Official Email *</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Institution Type</label>
                      <select
                        value={editFormData.type}
                        onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff" }}
                      >
                        <option value="College">College</option>
                        <option value="University">University</option>
                        <option value="School">School</option>
                        <option value="Coaching">Coaching</option>
                        <option value="Corporate">Corporate</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Location / City</label>
                      <input
                        type="text"
                        value={editFormData.city}
                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>
                  {createdCredentials ? "Organization Provisioned" : "Register New Organization"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setCreatedCredentials(null);
                  }}
                  style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "14px" }}>
                  {modalError}
                </div>
              )}

              {createdCredentials ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "6px" }}>✓</div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", color: "#0f172a" }}>Organization Registered Successfully!</h4>
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
                        onClick={() => copyToClipboard(createdCredentials.adminUser?.email || createdCredentials.organization?.email, "orgEmail")}
                      >
                        {copiedField === "orgEmail" ? "Copied!" : "Copy"}
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
                          onClick={() => copyToClipboard(createdCredentials.temporaryPassword, "orgPassword")}
                        >
                          {copiedField === "orgPassword" ? "Copied!" : "Copy Password"}
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
                        onClick={() => copyToClipboard(`${window.location.origin}/admin/login`, "orgLoginUrl")}
                      >
                        {copiedField === "orgLoginUrl" ? "Copied!" : "Copy URL"}
                      </button>
                    </div>

                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#475569" }}>Organization Slug:</strong>{" "}
                      <code style={{ fontSize: "0.85rem", color: "#0f172a" }}>{createdCredentials.organization?.slug}</code>
                    </div>
                  </div>

                  {createdCredentials.emailSent ? (
                    <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", textAlign: "left" }}>
                      ✓ Credentials email dispatched successfully to {createdCredentials.adminUser?.email || createdCredentials.organization?.email}.
                    </div>
                  ) : (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", textAlign: "left" }}>
                      ⚠️ Email delivery failed ({createdCredentials.emailError || "SMTP unavailable"}). Please copy the temporary password above and share it with the administrator manually.
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
                <form onSubmit={handleCreateOrg}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>Organization / College Name *</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="e.g. Stanford Academy"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>Official Email *</label>
                        <input
                          type="email"
                          name="email"
                          placeholder="admin@institution.edu"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>Institution Type</label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff" }}
                        >
                          <option value="College">College</option>
                          <option value="University">University</option>
                          <option value="School">School</option>
                          <option value="Coaching">Coaching / Tutoring</option>
                          <option value="Corporate">Corporate Training</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>Admin Contact Name</label>
                        <input
                          type="text"
                          name="adminName"
                          placeholder="e.g. Dr. Arthur Smith"
                          value={formData.adminName}
                          onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="10-digit number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>City / Location</label>
                        <input
                          type="text"
                          name="city"
                          placeholder="e.g. Bengaluru, Karnataka"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>Subscription Plan</label>
                        <select
                          name="subscriptionPlan"
                          value={formData.subscriptionPlan}
                          onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff" }}
                        >
                          <option value="free">Free Tier</option>
                          <option value="starter">Starter Plan</option>
                          <option value="pro">Pro Plan</option>
                          <option value="enterprise">Enterprise Plan</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                      {modalLoading ? "Creating..." : "Create Organization"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Custom Modern Delete Confirmation Modal */}
        {deleteOrgTarget && (
          <div className="modal-backdrop" onClick={() => !deleteLoading && setDeleteOrgTarget(null)}>
            <div className="custom-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="confirm-icon-danger">
                <AlertTriangleIcon size={32} />
              </div>
              <h3>Permanently Delete Organization?</h3>
              <p>
                Are you sure you want to delete <strong>"{deleteOrgTarget.name}"</strong>?
                This action is irreversible and will remove all tenant configurations.
              </p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  disabled={deleteLoading}
                  onClick={() => setDeleteOrgTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-danger"
                  disabled={deleteLoading}
                  onClick={confirmDeleteOrg}
                >
                  {deleteLoading ? "Deleting..." : "Yes, Delete Organization"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Organizations;