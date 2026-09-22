// Super Admin Organization Onboarding Requests Manager with Real-Time Polling, Search & Filter Controls
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import "./OrgRequestsManager.css";

const OrgRequestsManager = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [provisionResult, setProvisionResult] = useState(null);

  // Initial load and periodic real-time polling (every 20s)
  useEffect(() => {
    fetchApplications(false);

    const timer = setInterval(() => {
      fetchApplications(true);
    }, 20000);

    return () => clearInterval(timer);
  }, []);

  const fetchApplications = async (isBackground = false) => {
    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      // Fetch all applications so tab count badges and filters work instantly in real-time
      const res = await api.get("/org-applications");
      const list = res.data?.applications || [];
      setApplications(list);
      setLastSynced(new Date());
    } catch (err) {
      console.error("Error fetching org applications:", err);
      if (!isBackground) {
        setError("Failed to load organization requests. Please check connection.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Status counts for real-time tab badges
  const counts = useMemo(() => {
    const p = applications.filter((a) => a.status === "pending").length;
    const ap = applications.filter((a) => a.status === "approved").length;
    const r = applications.filter((a) => a.status === "rejected").length;
    return {
      pending: p,
      approved: ap,
      rejected: r,
      all: applications.length
    };
  }, [applications]);

  // Client-side search and filtering
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Status Filter
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }

      // 2. Type Filter
      if (typeFilter !== "all" && app.type !== typeFilter) {
        return false;
      }

      // 3. Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = app.name?.toLowerCase().includes(query);
        const matchAdmin = app.adminName?.toLowerCase().includes(query);
        const matchEmail = app.email?.toLowerCase().includes(query);
        const matchCity = app.city?.toLowerCase().includes(query);
        const matchPhone = app.phone?.includes(query);
        if (!matchName && !matchAdmin && !matchEmail && !matchCity && !matchPhone) {
          return false;
        }
      }

      return true;
    });
  }, [applications, statusFilter, typeFilter, searchTerm]);

  const handleApprove = async () => {
    if (!selectedApp) return;
    try {
      setModalLoading(true);
      const res = await api.patch(`/org-applications/${selectedApp._id}/approve`);
      setProvisionResult(res.data);
      setFeedback(`Institution '${selectedApp.name}' approved and tenant provisioned!`);
      setTimeout(() => setFeedback(""), 6000);
      await fetchApplications(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve organization.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    try {
      setModalLoading(true);
      await api.patch(`/org-applications/${selectedApp._id}/reject`, {
        reason: rejectionReason || "Does not meet verification criteria."
      });
      setShowRejectModal(false);
      setFeedback(`Request for '${selectedApp.name}' rejected.`);
      setTimeout(() => setFeedback(""), 4000);
      await fetchApplications(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject organization request.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <DashboardLayout title="Organization Onboarding Requests">
      <div className="org-requests-manager">
        {/* Top Header */}
        <div className="org-req-header">
          <div className="org-req-title-area">
            <div>
              <h2>Institution Onboarding Applications</h2>
              <p>Review partnership applications from universities, colleges, and training academies. Approving provisions an isolated tenant and Org Admin credentials.</p>
            </div>
            <div className="header-sync-box">
              {lastSynced && (
                <span className="last-sync-tag">
                  Synced: {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
              <button
                className={`btn-sync ${refreshing ? "spinning" : ""}`}
                onClick={() => fetchApplications(true)}
                disabled={refreshing}
                title="Refresh requests from database"
              >
                🔄 {refreshing ? "Syncing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="req-alert alert-success">
            <span>✓ {feedback}</span>
          </div>
        )}
        {error && (
          <div className="req-alert alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Real-Time Filter Pills with Badges */}
        <div className="req-filter-bar">
          <div className="filter-chips">
            <button
              className={`filter-chip ${statusFilter === "pending" ? "active" : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              Pending Verification
              <span className={`chip-badge ${counts.pending > 0 ? "badge-pending" : ""}`}>
                {counts.pending}
              </span>
            </button>
            <button
              className={`filter-chip ${statusFilter === "approved" ? "active" : ""}`}
              onClick={() => setStatusFilter("approved")}
            >
              Approved Institutions
              <span className="chip-badge">{counts.approved}</span>
            </button>
            <button
              className={`filter-chip ${statusFilter === "rejected" ? "active" : ""}`}
              onClick={() => setStatusFilter("rejected")}
            >
              Rejected
              <span className="chip-badge">{counts.rejected}</span>
            </button>
            <button
              className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All Requests
              <span className="chip-badge">{counts.all}</span>
            </button>
          </div>
        </div>

        {/* Search and Dropdown Filter Toolbar */}
        <div className="req-toolbar-card">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="req-search-input"
              placeholder="Search by Institution Name, Admin Name, Email, or City..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="btn-clear-search" onClick={() => setSearchTerm("")}>
                ✕
              </button>
            )}
          </div>

          <div className="toolbar-dropdown-wrap">
            <label htmlFor="type-filter-select" className="dropdown-label">Type:</label>
            <select
              id="type-filter-select"
              className="req-type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Institution Types</option>
              <option value="University">University</option>
              <option value="College">College</option>
              <option value="School">School</option>
              <option value="Corporate">Corporate</option>
              <option value="Coaching / Training">Coaching / Training</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        {loading ? (
          <div className="req-loading">
            <div className="loading-spinner"></div>
            <p>Loading institutional applications in real-time...</p>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="req-table-card">
            <table className="req-table">
              <thead>
                <tr>
                  <th>Institution Name</th>
                  <th>Type</th>
                  <th>Admin Contact</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app._id} className={app.status === "pending" ? "row-pending" : ""}>
                    <td>
                      <div className="institution-cell">
                        <strong>{app.name}</strong>
                        {app.website ? (
                          <a href={app.website} target="_blank" rel="noreferrer" className="site-link">
                            {app.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="sub-text">ID: {app._id.slice(-6)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="type-badge">{app.type}</span>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <strong>{app.adminName}</strong>
                        <span>{app.email}</span>
                        <span>📞 {app.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span>{app.city || "—"}{app.state ? `, ${app.state}` : ""}</span>
                    </td>
                    <td>
                      <span className="capacity-pill">{app.expectedStudents}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-${app.status}`}>
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="submitted-date">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          className="btn-action-view"
                          onClick={() => {
                            setSelectedApp(app);
                            setShowViewModal(true);
                          }}
                        >
                          Inspect
                        </button>
                        {app.status === "pending" && (
                          <>
                            <button
                              className="btn-action-approve"
                              onClick={() => {
                                setSelectedApp(app);
                                setProvisionResult(null);
                                setShowApproveModal(true);
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-action-reject"
                              onClick={() => {
                                setSelectedApp(app);
                                setRejectionReason("");
                                setShowRejectModal(true);
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="req-empty-card">
            <div className="empty-crest">🏛️</div>
            <h3>
              {searchTerm || typeFilter !== "all"
                ? "No matching institution requests"
                : `No ${statusFilter !== "all" ? statusFilter : ""} Institution Requests`}
            </h3>
            <p>
              {searchTerm || typeFilter !== "all"
                ? "Try adjusting your search keywords or institution type filter."
                : "New institutional requests submitted through the 'Join With Us' page will appear here for review."}
            </p>
            {(searchTerm || typeFilter !== "all") && (
              <button
                className="btn-reset-filters"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                }}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* INSPECT DOSSIER MODAL                                     */}
        {/* ========================================================= */}
        {showViewModal && selectedApp && (
          <div className="req-modal-overlay">
            <div className="req-modal-box">
              <div className="modal-header">
                <div>
                  <h3>{selectedApp.name}</h3>
                  <span className="type-badge">{selectedApp.type}</span>
                </div>
                <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>✕</button>
              </div>

              <div className="dossier-grid">
                <div className="dossier-item">
                  <span className="lbl">Designated Administrator</span>
                  <strong>{selectedApp.adminName}</strong>
                </div>
                <div className="dossier-item">
                  <span className="lbl">Institutional Email</span>
                  <strong>{selectedApp.email}</strong>
                </div>
                <div className="dossier-item">
                  <span className="lbl">Phone</span>
                  <strong>{selectedApp.phone}</strong>
                </div>
                <div className="dossier-item">
                  <span className="lbl">Location</span>
                  <strong>{selectedApp.city || "—"}, {selectedApp.state || "—"} ({selectedApp.country})</strong>
                </div>
                <div className="dossier-item">
                  <span className="lbl">Expected Capacity</span>
                  <strong>{selectedApp.expectedStudents}</strong>
                </div>
                <div className="dossier-item">
                  <span className="lbl">Application Status</span>
                  <span className={`status-badge status-${selectedApp.status}`}>{selectedApp.status.toUpperCase()}</span>
                </div>
              </div>

              {selectedApp.notes && (
                <div className="dossier-notes">
                  <span className="lbl">Notes / Requirements:</span>
                  <p>{selectedApp.notes}</p>
                </div>
              )}

              {selectedApp.status === "approved" && selectedApp.createdOrganizationId && (
                <div className="provision-info-box">
                  <strong>Provisioned Tenant:</strong> {selectedApp.createdOrganizationId.name} (<code>{selectedApp.createdOrganizationId.slug}</code>)
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                  Close Dossier
                </button>
                {selectedApp.status === "pending" && (
                  <button
                    className="btn-primary-gold"
                    onClick={() => {
                      setShowViewModal(false);
                      setShowApproveModal(true);
                    }}
                  >
                    Proceed to Approve →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* APPROVE & PROVISION MODAL                                 */}
        {/* ========================================================= */}
        {showApproveModal && selectedApp && (
          <div className="req-modal-overlay">
            <div className="req-modal-box">
              <div className="modal-header">
                <h3>Approve Institution: {selectedApp.name}</h3>
                <button className="modal-close-btn" onClick={() => setShowApproveModal(false)}>✕</button>
              </div>

              {provisionResult ? (
                <div className="provision-success-card">
                  <div className="success-icon">🎉</div>
                  <h4>Tenant Provisioned Successfully!</h4>
                  <p>Organization record and Org Admin account have been created.</p>
                  <div className="cred-strip">
                    <div><strong>Admin Email:</strong> {provisionResult.adminUser?.email}</div>
                    <div><strong>Organization Name:</strong> {provisionResult.organization?.name}</div>
                    <div><strong>Slug:</strong> {provisionResult.organization?.slug}</div>
                  </div>
                  <p className="notice-text">An activation email with credentials has been sent to the administrator.</p>
                  <button
                    className="btn-primary-gold"
                    onClick={() => {
                      setShowApproveModal(false);
                      setProvisionResult(null);
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="approval-confirm-content">
                  <p>
                    Are you sure you want to approve <strong>{selectedApp.name}</strong>?
                  </p>
                  <div className="checklist-box">
                    <div>✓ Provisions new Organization tenant record</div>
                    <div>✓ Provisions <code>org_admin</code> user account for <strong>{selectedApp.adminName}</strong></div>
                    <div>✓ Generates secure access credentials and dispatches activation email</div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setShowApproveModal(false)} disabled={modalLoading}>
                      Cancel
                    </button>
                    <button className="btn-primary-gold" onClick={handleApprove} disabled={modalLoading}>
                      {modalLoading ? "Provisioning Tenant..." : "Confirm & Provision Tenant →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* REJECT MODAL                                              */}
        {/* ========================================================= */}
        {showRejectModal && selectedApp && (
          <div className="req-modal-overlay">
            <div className="req-modal-box">
              <div className="modal-header">
                <h3>Reject Request: {selectedApp.name}</h3>
                <button className="modal-close-btn" onClick={() => setShowRejectModal(false)}>✕</button>
              </div>

              <p>Please specify the reason for rejection (this will be emailed to the applicant):</p>
              <textarea
                className="modal-textarea"
                rows={3}
                placeholder="e.g. Verification documents incomplete, or invalid institutional domain..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowRejectModal(false)} disabled={modalLoading}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={handleReject} disabled={modalLoading}>
                  {modalLoading ? "Rejecting..." : "Reject Application"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrgRequestsManager;
