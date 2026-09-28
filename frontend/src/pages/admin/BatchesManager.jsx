import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import {
  TagIcon,
  GraduationCapIcon,
  BuildingIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  PlusIcon,
  FileTextIcon,
  ShieldIcon
} from "../../components/common/Icons.jsx";
import "./BatchesManager.css";

const BatchesManager = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [batches, setBatches] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [activeBatch, setActiveBatch] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    batchNumber: "",
    department: "General",
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    description: "",
    maxStudents: 50,
    tests: [],
    enrollmentType: "open",
    selectiveStudentIds: [],
    accessCode: "",
    isPublished: true,
    isActive: true
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Student list modal state (View enrolled / whitelist)
  const [orgStudents, setOrgStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [studentSearch, setStudentSearch] = useState("");
  const [savingStudents, setSavingStudents] = useState(false);

  useEffect(() => {
    fetchBatches();
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      const [testsRes, usersRes] = await Promise.all([
        api.get("/tests?scope=organization").catch(() => ({ data: { tests: [] } })),
        api.get("/users?role=student").catch(() => ({ data: { users: [] } }))
      ]);
      setAvailableTests(testsRes.data?.tests || []);
      setOrgStudents(usersRes.data?.users || []);
    } catch (err) {
      console.warn("Could not load prerequisite tests or students:", err.message);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/batches");
      setBatches(res.data?.batches || []);
    } catch (err) {
      console.error("Fetch batches error:", err);
      setError(err.response?.data?.message || "Failed to load batches.");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalError("");
    setFormData({
      name: "",
      batchNumber: "",
      department: "General",
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      description: "",
      maxStudents: 50,
      tests: [],
      enrollmentType: "open",
      selectiveStudentIds: [],
      accessCode: "",
      isPublished: true,
      isActive: true
    });
    setShowCreateModal(true);
  };

  const openEdit = (batch) => {
    setActiveBatch(batch);
    setModalError("");
    setFormData({
      name: batch.name || "",
      batchNumber: batch.batchNumber || "",
      department: batch.department || "General",
      academicYear: batch.academicYear || "",
      description: batch.description || "",
      maxStudents: batch.maxStudents || 50,
      tests: Array.isArray(batch.tests)
        ? batch.tests.map((t) => (t && t._id ? t._id : t))
        : [],
      enrollmentType: batch.enrollmentType || "open",
      selectiveStudentIds: Array.isArray(batch.selectiveStudentIds)
        ? batch.selectiveStudentIds.map((s) => (s && s._id ? s._id : s))
        : [],
      accessCode: batch.accessCode || "",
      isPublished: batch.isPublished !== false,
      isActive: batch.isActive !== undefined ? batch.isActive : true
    });
    setShowEditModal(true);
  };

  const toggleTestSelection = (testId) => {
    const current = formData.tests || [];
    if (current.includes(testId)) {
      setFormData({ ...formData, tests: current.filter((id) => id !== testId) });
    } else {
      setFormData({ ...formData, tests: [...current, testId] });
    }
  };

  const toggleSelectiveStudent = (studentId) => {
    const current = formData.selectiveStudentIds || [];
    if (current.includes(studentId)) {
      setFormData({
        ...formData,
        selectiveStudentIds: current.filter((id) => id !== studentId)
      });
    } else {
      setFormData({
        ...formData,
        selectiveStudentIds: [...current, studentId]
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.name.trim() || !formData.batchNumber.trim()) {
      setModalError("Batch name and unique batch code/number are required.");
      return;
    }

    try {
      setModalLoading(true);
      await api.post("/batches", {
        ...formData,
        batchNumber: formData.batchNumber.toUpperCase().trim(),
        maxStudents: Number(formData.maxStudents) || 50
      });
      setShowCreateModal(false);
      setFeedback(`Batch '${formData.name}' created and published for student self-enrollment!`);
      setTimeout(() => setFeedback(""), 4000);
      await fetchBatches();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create batch.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!activeBatch) return;
    setModalError("");

    if (!formData.name.trim() || !formData.batchNumber.trim()) {
      setModalError("Batch name and unique batch code are required.");
      return;
    }

    try {
      setModalLoading(true);
      await api.put(`/batches/${activeBatch._id}`, {
        ...formData,
        batchNumber: formData.batchNumber.toUpperCase().trim(),
        maxStudents: Number(formData.maxStudents) || 50
      });
      setShowEditModal(false);
      setFeedback("Batch settings and capacity limit updated successfully!");
      setTimeout(() => setFeedback(""), 4000);
      await fetchBatches();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to update batch.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (batch) => {
    if (
      !window.confirm(
        `Are you sure you want to delete batch '${batch.name}' (${batch.batchNumber})? Enrolled students will be unlinked.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/batches/${batch._id}`);
      setFeedback(`Batch '${batch.name}' deleted.`);
      setTimeout(() => setFeedback(""), 4000);
      await fetchBatches();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete batch.");
    }
  };

  // Open Enrolled Students roster modal
  const openManageStudents = async (batch) => {
    setActiveBatch(batch);
    setStudentSearch("");
    setShowStudentsModal(true);
    try {
      const [batchRes, usersRes] = await Promise.all([
        api.get(`/batches/${batch._id}`),
        api.get("/users?role=student")
      ]);

      const enrolled = batchRes.data?.students || [];
      const allStudents = usersRes.data?.users || [];

      setOrgStudents(allStudents);
      setSelectedStudentIds(new Set(enrolled.map((s) => s._id)));
    } catch (err) {
      console.error("Error loading students for batch:", err);
    }
  };

  const toggleStudentSelection = (studentId) => {
    if (isTeacher) return; // Teachers cannot manually assign students; students self-enroll
    const updated = new Set(selectedStudentIds);
    if (updated.has(studentId)) {
      updated.delete(studentId);
    } else {
      updated.add(studentId);
    }
    setSelectedStudentIds(updated);
  };

  const handleSaveStudents = async () => {
    if (!activeBatch || isTeacher) return;
    try {
      setSavingStudents(true);
      const studentIdArray = Array.from(selectedStudentIds);
      await api.post(`/batches/${activeBatch._id}/assign-students`, {
        studentIds: studentIdArray
      });
      setShowStudentsModal(false);
      setFeedback(`Updated cohort assignment for batch '${activeBatch.name}'.`);
      setTimeout(() => setFeedback(""), 4000);
      await fetchBatches();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save student assignments.");
    } finally {
      setSavingStudents(false);
    }
  };

  const filteredBatches = batches.filter(
    (b) =>
      (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.batchNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.department || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredStudents = orgStudents.filter(
    (s) =>
      (s.name || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(studentSearch.toLowerCase())
  );

  const totalStudentsEnrolled = batches.reduce(
    (sum, b) => sum + (b.studentCount || 0),
    0
  );

  return (
    <DashboardLayout title={isTeacher ? "Faculty Batches & Cohorts" : "Institutional Batches Manager"}>
      <div className="batches-manager">
        {/* Page Top Banner */}
        <div className="batches-page-header">
          <div>
            <h2>{isTeacher ? "My Course Batches & Test Cohorts" : "Student Batches & Cohorts"}</h2>
            <p>
              {isTeacher
                ? "Create batches, link your test series, configure student capacity limits, and allow students to self-enroll."
                : "Manage institutional student cohorts, review capacities, and inspect enrolled rosters."}
            </p>
          </div>
          <button className="btn-primary-gold" onClick={openCreate}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <PlusIcon size={16} /> Create New Batch
            </span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="batch-alert alert-success">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <CheckCircleIcon size={16} /> {feedback}
            </span>
          </div>
        )}
        {error && (
          <div className="batch-alert alert-error">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangleIcon size={16} /> {error}
            </span>
          </div>
        )}

        {/* Quick KPI Stat Strip */}
        <div className="batch-kpi-grid">
          <div className="batch-kpi-card">
            <span className="kpi-icon">
              <TagIcon size={24} />
            </span>
            <div>
              <div className="kpi-number">{batches.length}</div>
              <div className="kpi-label">Active Batches</div>
            </div>
          </div>
          <div className="batch-kpi-card">
            <span className="kpi-icon">
              <GraduationCapIcon size={24} />
            </span>
            <div>
              <div className="kpi-number">{totalStudentsEnrolled}</div>
              <div className="kpi-label">Enrolled Students</div>
            </div>
          </div>
          <div className="batch-kpi-card">
            <span className="kpi-icon">
              <FileTextIcon size={24} />
            </span>
            <div>
              <div className="kpi-number">
                {batches.reduce((sum, b) => sum + (b.tests?.length || 0), 0)}
              </div>
              <div className="kpi-label">Test Series Linked</div>
            </div>
          </div>
          <div className="batch-kpi-card">
            <span className="kpi-icon">
              <BuildingIcon size={24} />
            </span>
            <div>
              <div className="kpi-number">
                {new Set(batches.map((b) => b.department).filter(Boolean)).size}
              </div>
              <div className="kpi-label">Departments</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="batch-search-bar">
          <input
            type="text"
            placeholder="Search by batch name, code (e.g. CS2026-A), or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Batches Grid */}
        {loading ? (
          <div className="batch-loading">Loading batches...</div>
        ) : filteredBatches.length > 0 ? (
          <div className="batches-grid">
            {filteredBatches.map((batch) => {
              const maxCap = batch.maxStudents || 50;
              const count = batch.studentCount || 0;
              const pct = Math.min(100, Math.round((count / maxCap) * 100));
              const isFull = count >= maxCap;

              return (
                <div key={batch._id} className="batch-card">
                  <div className="batch-card-top">
                    <span className="batch-code-badge">{batch.batchNumber}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span className={`batch-status-pill ${batch.enrollmentType === "selective" ? "selective" : "active"}`}>
                        {batch.enrollmentType === "selective" ? "Selective" : "Open Enrollment"}
                      </span>
                      {isFull && <span className="batch-status-pill archived">Full</span>}
                    </div>
                  </div>

                  <h3 className="batch-title">{batch.name}</h3>
                  <p className="batch-desc">{batch.description || "No description provided."}</p>

                  <div className="batch-meta-row">
                    <span>
                      <strong>Dept:</strong> {batch.department || "General"}
                    </span>
                    <span>
                      <strong>Year:</strong> {batch.academicYear || "Current"}
                    </span>
                  </div>

                  {/* Test Series Attached */}
                  <div style={{ margin: "0.6rem 0", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--primary)" }}>
                    <FileTextIcon size={14} />
                    <strong>{batch.tests?.length || 0} Test Series Linked</strong>
                  </div>

                  {/* Student Capacity Progress Bar */}
                  <div className="batch-students-count-bar" style={{ flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <span>Enrolled Capacity:</span>
                      <strong>
                        {count} / {maxCap} Students ({pct}%)
                      </strong>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: isFull ? "#ef4444" : pct > 75 ? "#f59e0b" : "#10b981",
                          borderRadius: "999px",
                          transition: "width 0.3s ease"
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="batch-card-actions">
                    <button
                      className="btn-batch-manage"
                      onClick={() => openManageStudents(batch)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      title={isTeacher ? "Inspect enrolled students" : "Manage students"}
                    >
                      <UsersIcon size={14} /> Enrolled Students ({count})
                    </button>
                    <button className="btn-batch-secondary" onClick={() => openEdit(batch)}>
                      Edit Limit & Tests
                    </button>
                    <button className="btn-batch-danger" onClick={() => handleDelete(batch)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="batch-empty-state">
            <TagIcon size={48} />
            <h3>No Batches Found</h3>
            <p>
              {search
                ? "No batches match your query."
                : isTeacher
                ? "You haven't created any course batches yet. Click '+ Create New Batch' to start."
                : "No student cohorts registered in this organization yet."}
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* CREATE / EDIT MODAL                                       */}
        {/* ========================================================= */}
        {(showCreateModal || showEditModal) && (
          <div className="batch-modal-overlay">
            <div className="batch-modal-box modal-large" style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <div className="modal-header">
                <h3>{showCreateModal ? "Create & Publish New Course Batch" : `Edit Batch: ${activeBatch?.name}`}</h3>
                <button
                  className="modal-close-btn"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="batch-alert alert-error">
                  <span>⚠️ {modalError}</span>
                </div>
              )}

              <form onSubmit={showCreateModal ? handleCreate : handleUpdate} className="modal-form">
                <div className="form-group">
                  <label>Batch Name *</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="e.g. Computer Science - Morning Cohort"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Unique Batch Code / Number *</label>
                    <input
                      type="text"
                      className="modal-input uppercase"
                      placeholder="e.g. CS2026-A"
                      value={formData.batchNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, batchNumber: e.target.value.toUpperCase() })
                      }
                      required
                    />
                    <small className="field-hint">Must be unique within your institution.</small>
                  </div>

                  <div className="form-group">
                    <label>Department / Subject</label>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Student Capacity Limit (Max Students) *</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      className="modal-input"
                      placeholder="e.g. 50"
                      value={formData.maxStudents}
                      onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                      required
                    />
                    <small className="field-hint">
                      Maximum number of students who can self-enroll in this batch (editable anytime).
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Enrollment Mode</label>
                    <select
                      className="modal-input"
                      value={formData.enrollmentType}
                      onChange={(e) => setFormData({ ...formData, enrollmentType: e.target.value })}
                    >
                      <option value="open">Open (Any Student from Institution Can Self-Enroll)</option>
                      <option value="selective">Selective Cohort (Whitelisted Students Only)</option>
                    </select>
                  </div>
                </div>

                {/* Test Series Attached */}
                <div className="form-group">
                  <label>Attach Test Series to this Batch</label>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Select tests created by faculty to associate with this batch. Students enrolled will have access to these assessments.
                  </p>
                  {availableTests.length > 0 ? (
                    <div
                      style={{
                        maxHeight: "160px",
                        overflowY: "auto",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                      }}
                    >
                      {availableTests.map((t) => {
                        const isSelected = formData.tests?.includes(t._id);
                        return (
                          <label
                            key={t._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              background: isSelected ? "var(--bg-card-hover)" : "transparent",
                              cursor: "pointer",
                              fontSize: "0.88rem"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTestSelection(t._id)}
                            />
                            <strong>{t.title}</strong>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                              ({t.duration}m • {t.totalMarks} Marks • {t.status})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      No tests created yet. You can create tests in the Tests Management portal.
                    </p>
                  )}
                </div>

                {/* Selective Whitelist (if selective) */}
                {formData.enrollmentType === "selective" && (
                  <div className="form-group">
                    <label>Selective Students Whitelist</label>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      Only the selected students will be authorized to self-enroll in this batch.
                    </p>
                    <div
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px"
                      }}
                    >
                      {orgStudents.map((s) => {
                        const isSelected = formData.selectiveStudentIds?.includes(s._id);
                        return (
                          <label
                            key={s._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "0.85rem",
                              cursor: "pointer",
                              padding: "4px"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectiveStudent(s._id)}
                            />
                            <span>{s.name} ({s.email})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Description / Instructions for Students</label>
                  <textarea
                    className="modal-textarea"
                    rows={2}
                    placeholder="Provide details on timetable, lecture room, or course guidelines..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-batch-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-gold" disabled={modalLoading}>
                    {modalLoading ? "Saving..." : showCreateModal ? "Publish Batch →" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ENROLLED STUDENTS ROSTER MODAL                            */}
        {/* ========================================================= */}
        {showStudentsModal && activeBatch && (
          <div className="batch-modal-overlay">
            <div className="batch-modal-box modal-large">
              <div className="modal-header">
                <div>
                  <h3>Enrolled Students: {activeBatch.name}</h3>
                  <span className="batch-code-tag">
                    {activeBatch.batchNumber} • Limit: {activeBatch.maxStudents || 50} Students
                  </span>
                </div>
                <button className="modal-close-btn" onClick={() => setShowStudentsModal(false)}>
                  ✕
                </button>
              </div>

              <div className="students-selector-header">
                <input
                  type="text"
                  placeholder="Filter enrolled students by name or email..."
                  className="modal-input"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <span className="selected-count-pill">
                  {selectedStudentIds.size} Enrolled
                </span>
              </div>

              <div className="students-selection-list">
                {filteredStudents.filter((s) => selectedStudentIds.has(s._id)).length > 0 ? (
                  filteredStudents
                    .filter((s) => selectedStudentIds.has(s._id))
                    .map((s) => (
                      <div key={s._id} className="student-row-item selected">
                        <div className="student-row-info">
                          <strong>{s.name}</strong>
                          <span>{s.email}</span>
                        </div>
                        <span className="status-pill active" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                          Enrolled
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="no-students-msg">
                    No students have enrolled in this batch yet. Once published, students can self-enroll from their portal.
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-batch-secondary"
                  onClick={() => setShowStudentsModal(false)}
                >
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

export default BatchesManager;
