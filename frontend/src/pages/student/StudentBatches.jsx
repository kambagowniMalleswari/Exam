import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  TagIcon,
  UsersIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  BuildingIcon,
  ClockIcon
} from "../../components/common/Icons.jsx";
import "./StudentBatches.css";

const StudentBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionNotice, setActionNotice] = useState({ text: "", type: "" });
  const [enrollingId, setEnrollingId] = useState(null);

  // Unauthorized / capacity modal alert state
  const [alertModal, setAlertModal] = useState({ show: false, title: "", message: "", type: "warning" });

  useEffect(() => {
    fetchAvailableBatches();
  }, []);

  const fetchAvailableBatches = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/batches/available");
      setBatches(res.data?.batches || []);
    } catch (err) {
      console.error("Error loading available batches:", err);
      setError(err.response?.data?.message || "Failed to load course batches.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (batch) => {
    try {
      setEnrollingId(batch._id);
      setActionNotice({ text: "", type: "" });

      const res = await api.post(`/batches/${batch._id}/enroll`, {});
      setActionNotice({
        text: res.data?.message || `Successfully enrolled in ${batch.name}!`,
        type: "success"
      });
      await fetchAvailableBatches();
    } catch (err) {
      const errMsg =
        err.response?.data?.message || "Failed to enroll in this course batch.";
      const isFull = err.response?.data?.isFull;
      const isUnauthorized = err.response?.data?.unauthorized;

      setAlertModal({
        show: true,
        title: isFull
          ? "Batch Capacity Reached"
          : isUnauthorized
          ? "Unauthorized Batch"
          : "Enrollment Restricted",
        message: errMsg,
        type: isUnauthorized ? "unauthorized" : "warning"
      });
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <DashboardLayout title="Student Course Batches">
      <div className="student-batches-page">
        {/* Top Header Banner */}
        <div className="student-batches-header">
          <div>
            <h2>Browse & Self-Enroll in Course Batches</h2>
            <p>
              Join faculty course cohorts to unlock dedicated test series, assignments, and curriculum updates.
            </p>
          </div>
          <button className="btn-refresh-batches" onClick={fetchAvailableBatches}>
            Refresh Batches
          </button>
        </div>

        {/* Action Notice */}
        {actionNotice.text && (
          <div className={`batch-toast ${actionNotice.type}`}>
            <CheckCircleIcon size={18} />
            <span>{actionNotice.text}</span>
          </div>
        )}

        {error && (
          <div className="batch-toast error">
            <AlertTriangleIcon size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Batches Grid */}
        {loading ? (
          <div className="student-batches-loading">Loading published batches...</div>
        ) : batches.length > 0 ? (
          <div className="student-batches-grid">
            {batches.map((batch) => {
              const maxCap = batch.maxStudents || 50;
              const count = batch.studentCount || 0;
              const pct = Math.min(100, Math.round((count / maxCap) * 100));
              const isFull = count >= maxCap;
              const isEnrolled = batch.isEnrolled;
              const isSelective = batch.enrollmentType === "selective";

              return (
                <div
                  key={batch._id}
                  className={`student-batch-card ${isEnrolled ? "enrolled" : ""}`}
                >
                  <div className="batch-card-badges">
                    <span className="batch-code-badge">{batch.batchNumber}</span>
                    {isEnrolled ? (
                      <span className="batch-enrolled-badge">
                        <CheckCircleIcon size={13} /> Enrolled
                      </span>
                    ) : isFull ? (
                      <span className="batch-full-badge">Cohort Full</span>
                    ) : isSelective ? (
                      <span className="batch-selective-badge">Selective Cohort</span>
                    ) : (
                      <span className="batch-open-badge">Open Enrollment</span>
                    )}
                  </div>

                  <h3 className="batch-name">{batch.name}</h3>
                  <p className="batch-description">
                    {batch.description || "Instructor has not provided a description for this course batch."}
                  </p>

                  <div className="batch-instructor-info">
                    <span className="instructor-label">Instructor / Creator:</span>
                    <strong>{batch.createdBy?.name || "Faculty"}</strong>
                  </div>

                  {/* Attached Test Series */}
                  <div className="batch-tests-section">
                    <div className="tests-header">
                      <FileTextIcon size={15} />
                      <span>{batch.tests?.length || 0} Test Series Attached</span>
                    </div>
                    {batch.tests && batch.tests.length > 0 && (
                      <div className="batch-test-chips">
                        {batch.tests.slice(0, 3).map((t) => (
                          <span key={t._id} className="test-chip">
                            {t.title} ({t.duration}m)
                          </span>
                        ))}
                        {batch.tests.length > 3 && (
                          <span className="test-chip-more">
                            +{batch.tests.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Student Capacity Limit */}
                  <div className="batch-capacity-bar-box">
                    <div className="capacity-label-row">
                      <span>Cohort Capacity:</span>
                      <strong>
                        {count} / {maxCap} Students ({pct}%)
                      </strong>
                    </div>
                    <div className="capacity-track">
                      <div
                        className="capacity-fill"
                        style={{
                          width: `${pct}%`,
                          background: isFull
                            ? "#ef4444"
                            : pct > 80
                            ? "#f59e0b"
                            : "#10b981"
                        }}
                      />
                    </div>
                  </div>

                  {/* Enrollment Button */}
                  <div className="batch-card-footer">
                    {isEnrolled ? (
                      <button className="btn-enrolled-active" disabled>
                        <CheckCircleIcon size={15} /> Active in this Batch
                      </button>
                    ) : isFull ? (
                      <button
                        className="btn-enroll-full"
                        onClick={() =>
                          setAlertModal({
                            show: true,
                            title: "Batch Full",
                            message: `This cohort is currently at maximum capacity (${maxCap} students). Contact instructor ${batch.createdBy?.name || "faculty"} to increase the limit.`,
                            type: "warning"
                          })
                        }
                      >
                        Batch Full (Limit Reached)
                      </button>
                    ) : (
                      <button
                        className="btn-enroll-action"
                        onClick={() => handleEnroll(batch)}
                        disabled={enrollingId === batch._id}
                      >
                        {enrollingId === batch._id ? "Enrolling..." : "Enroll in Batch →"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="student-batches-empty">
            <TagIcon size={48} />
            <h3>No Published Course Batches Available</h3>
            <p>
              Your institution's teachers have not published any course batches yet. Check back soon!
            </p>
          </div>
        )}

        {/* Modal Alert for Unauthorized or Capacity Reached */}
        {alertModal.show && (
          <div className="batch-modal-overlay">
            <div className="batch-alert-modal-box">
              <div
                className={`alert-modal-icon ${
                  alertModal.type === "unauthorized" ? "unauth" : "warning"
                }`}
              >
                {alertModal.type === "unauthorized" ? (
                  <ShieldAlertIcon size={36} />
                ) : (
                  <AlertTriangleIcon size={36} />
                )}
              </div>

              <h3>{alertModal.title}</h3>
              <p>{alertModal.message}</p>

              <div className="alert-modal-actions">
                <button
                  className="btn-modal-dismiss"
                  onClick={() => setAlertModal({ show: false, title: "", message: "", type: "warning" })}
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentBatches;
