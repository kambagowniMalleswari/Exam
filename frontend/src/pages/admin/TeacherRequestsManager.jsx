// Teacher Requests Review & Approval Manager Component
import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  FileTextIcon,
  ClockIcon,
  XIcon
} from "../../components/common/Icons.jsx";
import "./TeacherRequestsManager.css";

const TeacherRequestsManager = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [processingId, setProcessingId] = useState(null);

  // Rejection modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Detail modal
  const [viewingApp, setViewingApp] = useState(null);

  // Approval credentials modal
  const [provisionResult, setProvisionResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;

      const res = await api.get("/teacher-applications", { params });
      setApplications(res.data?.applications || []);
    } catch (err) {
      console.error("Failed to load teacher applications:", err);
      setError("Unable to load teacher applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId) => {
    if (!window.confirm("Are you sure you want to approve this teacher application? An active faculty account will be provisioned.")) {
      return;
    }

    try {
      setProcessingId(appId);
      setSuccessMsg("");
      const res = await api.post(`/teacher-applications/${appId}/approve`);
      setProvisionResult(res.data);
      setSuccessMsg(res.data?.message || "Teacher application approved successfully!");
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve application.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReject = (app) => {
    setSelectedApp(app);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setProcessingId(selectedApp._id);
      await api.post(`/teacher-applications/${selectedApp._id}/reject`, {
        reason: rejectionReason
      });
      setShowRejectModal(false);
      setSuccessMsg(`Application for ${selectedApp.name} has been rejected.`);
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject application.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout title="Teacher Requests & Faculty Onboarding">
      <div className="trm-root">
        {/* Header Intro */}
        <div className="trm-header">
          <div>
            <h2>Faculty Applications</h2>
            <p>Review credentials, teaching qualifications, and grant institutional test authoring permissions.</p>
          </div>

          <div className="trm-filters">
            <button
              className={`trm-filter-btn ${filterStatus === "all" ? "active" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              All Applications
            </button>
            <button
              className={`trm-filter-btn ${filterStatus === "pending" ? "active" : ""}`}
              onClick={() => setFilterStatus("pending")}
            >
              Pending Review
            </button>
            <button
              className={`trm-filter-btn ${filterStatus === "approved" ? "active" : ""}`}
              onClick={() => setFilterStatus("approved")}
            >
              Approved
            </button>
            <button
              className={`trm-filter-btn ${filterStatus === "rejected" ? "active" : ""}`}
              onClick={() => setFilterStatus("rejected")}
            >
              Rejected
            </button>
          </div>
        </div>

        {error && <div className="trm-alert error" style={{ display: "flex", alignItems: "center", gap: "6px" }}><AlertTriangleIcon size={16} /><span>{error}</span></div>}
        {successMsg && <div className="trm-alert success" style={{ display: "flex", alignItems: "center", gap: "6px" }}><CheckCircleIcon size={16} /><span>{successMsg}</span></div>}

        {/* Applications Table Card */}
        <div className="trm-card">
          {loading ? (
            <div className="trm-loading">
              <div className="trm-spinner"></div>
              <span>Loading applications...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="trm-empty">
              <span className="trm-empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><FileTextIcon size={36} /></span>
              <h3>No Teacher Applications Found</h3>
              <p>When prospective educators submit requests, they will appear here for review.</p>
            </div>
          ) : (
            <div className="trm-table-wrapper">
              <table className="trm-table">
                <thead>
                  <tr>
                    <th>Applicant Name</th>
                    <th>Email & Phone</th>
                    <th>Organization</th>
                    <th>Subject & Qualification</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <strong>{app.name}</strong>
                      </td>
                      <td>
                        <div className="trm-contact-cell">
                          <span>{app.email}</span>
                          <small>{app.phone}</small>
                        </div>
                      </td>
                      <td>{app.organizationId?.name || "Institution"}</td>
                      <td>
                        <div className="trm-contact-cell">
                          <strong>{app.subject}</strong>
                          <small>{app.qualification}</small>
                        </div>
                      </td>
                      <td>{app.experienceYears} Years</td>
                      <td>
                        <span className={`status-pill ${app.status}`}>
                          {app.status === "pending" && "Pending"}
                          {app.status === "approved" && "Approved"}
                          {app.status === "rejected" && "Rejected"}
                        </span>
                      </td>
                      <td>
                        <div className="trm-actions-row">
                          <button
                            type="button"
                            className="btn-trm-view"
                            onClick={() => setViewingApp(app)}
                            title="View Credentials"
                          >
                            View
                          </button>
                          {app.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="btn-trm-approve"
                                onClick={() => handleApprove(app._id)}
                                disabled={processingId === app._id}
                              >
                                {processingId === app._id ? "..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                className="btn-trm-reject"
                                onClick={() => handleOpenReject(app)}
                                disabled={processingId === app._id}
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
          )}
        </div>

        {/* View Details Modal */}
        {viewingApp && (
          <div className="trm-modal-backdrop" onClick={() => setViewingApp(null)}>
            <div className="trm-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="trm-modal-header">
                <h3>Teacher Application Details</h3>
                <button type="button" className="btn-modal-close" onClick={() => setViewingApp(null)}>✕</button>
              </div>
              <div className="trm-modal-body">
                <div className="modal-info-grid">
                  <div>
                    <label>Applicant Name</label>
                    <p>{viewingApp.name}</p>
                  </div>
                  <div>
                    <label>Email Address</label>
                    <p>{viewingApp.email}</p>
                  </div>
                  <div>
                    <label>Phone Number</label>
                    <p>{viewingApp.phone}</p>
                  </div>
                  <div>
                    <label>Institution</label>
                    <p>{viewingApp.organizationId?.name || "Institution"}</p>
                  </div>
                  <div>
                    <label>Subject</label>
                    <p>{viewingApp.subject}</p>
                  </div>
                  <div>
                    <label>Highest Qualification</label>
                    <p>{viewingApp.qualification}</p>
                  </div>
                  <div>
                    <label>Teaching Experience</label>
                    <p>{viewingApp.experienceYears} Years</p>
                  </div>
                  <div>
                    <label>Certifications</label>
                    <p>{viewingApp.certifications || "None specified"}</p>
                  </div>
                </div>

                {viewingApp.experienceDetails && (
                  <div className="modal-text-block">
                    <label>Experience Details</label>
                    <p>{viewingApp.experienceDetails}</p>
                  </div>
                )}

                {viewingApp.supportingInfo && (
                  <div className="modal-text-block">
                    <label>Supporting Info & Portfolio</label>
                    <p>{viewingApp.supportingInfo}</p>
                  </div>
                )}

                {viewingApp.rejectionReason && (
                  <div className="modal-text-block rejection-block">
                    <label>Rejection Reason</label>
                    <p>{viewingApp.rejectionReason}</p>
                  </div>
                )}
              </div>
              <div className="trm-modal-footer">
                {viewingApp.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className="btn-trm-approve"
                      onClick={() => {
                        handleApprove(viewingApp._id);
                        setViewingApp(null);
                      }}
                    >
                      Approve & Grant Teacher Role
                    </button>
                    <button
                      type="button"
                      className="btn-trm-reject"
                      onClick={() => {
                        const app = viewingApp;
                        setViewingApp(null);
                        handleOpenReject(app);
                      }}
                    >
                      Reject Application
                    </button>
                  </>
                )}
                <button type="button" className="btn-modal-dismiss" onClick={() => setViewingApp(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedApp && (
          <div className="trm-modal-backdrop" onClick={() => setShowRejectModal(false)}>
            <div className="trm-modal-box" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleConfirmReject}>
                <div className="trm-modal-header">
                  <h3>Reject Teacher Application</h3>
                  <button type="button" className="btn-modal-close" onClick={() => setShowRejectModal(false)}>✕</button>
                </div>
                <div className="trm-modal-body">
                  <p>
                    Please specify the reason for declining <strong>{selectedApp.name}</strong>'s application
                    to <strong>{selectedApp.organizationId?.name}</strong>.
                  </p>
                  <textarea
                    rows="4"
                    placeholder="e.g. Department capacity full / Missing relevant teaching credential..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="trm-modal-footer">
                  <button type="submit" className="btn-trm-reject" disabled={processingId === selectedApp._id}>
                    Confirm Rejection
                  </button>
                  <button type="button" className="btn-modal-dismiss" onClick={() => setShowRejectModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Approved Credentials Modal */}
        {provisionResult && (
          <div className="trm-modal-backdrop" onClick={() => setProvisionResult(null)}>
            <div className="trm-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="trm-modal-header">
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}>
                  <span style={{ color: "#16a34a" }}>✓</span> Faculty Account Provisioned
                </h3>
                <button type="button" className="btn-modal-close" onClick={() => setProvisionResult(null)}>✕</button>
              </div>
              <div className="trm-modal-body">
                <p style={{ color: "#334155", marginBottom: "16px" }}>
                  {provisionResult.message}
                </p>

                {provisionResult.temporaryPassword ? (
                  <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <strong style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Teacher Name:</strong>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{provisionResult.user?.name}</div>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Login Email:</strong>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{provisionResult.user?.email}</div>
                    </div>
                    <div>
                      <strong style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Temporary Password:</strong>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <code style={{ background: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: "4px", fontWeight: 800, fontSize: "1.05rem", border: "1px dashed #f59e0b" }}>
                          {provisionResult.temporaryPassword}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(provisionResult.temporaryPassword);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2500);
                          }}
                          style={{
                            background: copied ? "#16a34a" : "#0284c7",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "5px 12px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          {copied ? "Copied!" : "Copy Password"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px", color: "#166534", marginBottom: "16px" }}>
                    This applicant already had an active account. Their existing account has been upgraded to Faculty access. They can sign in using their existing password.
                  </div>
                )}

                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                  {provisionResult.emailSent
                    ? "✓ Credentials notification email has been dispatched to the faculty member."
                    : "ℹ Note: If email delivery is pending or queued, you may share the temporary password above directly with the instructor."}
                </p>
              </div>
              <div className="trm-modal-footer">
                <button type="button" className="btn-modal-dismiss" onClick={() => setProvisionResult(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherRequestsManager;
