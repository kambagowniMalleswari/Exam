import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import "./Students.css";

const Students = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [batches, setBatches] = useState([]);
  const [batchFilter, setBatchFilter] = useState("");

  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    batchId: ""
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    batchId: ""
  });

  useEffect(() => {
    fetchStudents();
    api.get("/batches")
      .then((res) => setBatches(res.data?.batches || []))
      .catch((err) => console.warn("Could not load batches:", err.message));
    if (searchParams.get("action") === "add") {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      const users = response.data.users || response.data || [];
      const studentUsers = users.filter((user) => user.role === "student");
      setStudents(studentUsers);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(
        err.response?.data?.message || "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      setModalError("Please fill in Name, Email and Password.");
      return;
    }

    if (addForm.password.length < 6) {
      setModalError("Password must be at least 6 characters.");
      return;
    }

    try {
      setModalLoading(true);
      await api.post("/users", {
        name: addForm.name.trim(),
        email: addForm.email.toLowerCase().trim(),
        phone: addForm.phone.trim(),
        password: addForm.password,
        role: "student",
        batchId: addForm.batchId || undefined
      });

      setShowAddModal(false);
      setAddForm({ name: "", email: "", phone: "", password: "", batchId: "" });
      setFeedback("Student account created successfully!");
      setTimeout(() => setFeedback(""), 4000);

      searchParams.delete("action");
      setSearchParams(searchParams);

      await fetchStudents();
    } catch (err) {
      setModalError(
        err.response?.data?.message || "Failed to create student account."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setModalError("");

    try {
      setModalLoading(true);
      await api.put(`/users/${selectedStudent._id}`, {
        name: editForm.name.trim(),
        email: editForm.email.toLowerCase().trim(),
        phone: editForm.phone.trim(),
        batchId: editForm.batchId || ""
      });
      setShowEditModal(false);
      setFeedback("Student updated successfully!");
      setTimeout(() => setFeedback(""), 4000);
      await fetchStudents();
    } catch (err) {
      setModalError(
        err.response?.data?.message || "Failed to update student."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      const res = await api.patch(`/users/${student._id}/status`);
      setFeedback(res.data?.message || "Student status updated.");
      setTimeout(() => setFeedback(""), 3000);
      await fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handleDeleteStudent = async (student) => {
    const confirm = window.confirm(
      `Are you sure you want to delete student "${student.name}"? This action cannot be undone.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/users/${student._id}`);
      setFeedback(`Student "${student.name}" deleted.`);
      setTimeout(() => setFeedback(""), 4000);
      await fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setModalError("");
    setEditForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      batchId: student.batchId?._id || student.batchId || ""
    });
    setShowEditModal(true);
  };

  const openViewModal = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      (student.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.phone || "").includes(search);
    const matchesBatch =
      !batchFilter ||
      (student.batchId?._id === batchFilter || student.batchId === batchFilter);
    return matchesSearch && matchesBatch;
  });

  const totalStudents = students.length;
  const activeStudents = students.filter(
    (student) => student.isActive !== false && student.status !== "suspended"
  ).length;
  const inactiveStudents = totalStudents - activeStudents;

  return (
    <DashboardLayout title="Students">
      <div className="students-page">
        {/* Page Header */}
        <div className="students-page-header">
          <div>
            <h2>Students Management</h2>
            <p>
              Manage enrolled students, create student logins, and monitor test participation.
            </p>
          </div>

          <button
            type="button"
            className="students-add-button"
            onClick={() => setShowAddModal(true)}
          >
            + Add Student
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

        {/* Summary Cards */}
        <div className="students-summary-grid">
          <div className="student-summary-card">
            <div className="student-summary-icon">👥</div>
            <div>
              <span>Total Students</span>
              <strong>{totalStudents}</strong>
            </div>
          </div>

          <div className="student-summary-card">
            <div className="student-summary-icon">✓</div>
            <div>
              <span>Active Students</span>
              <strong>{activeStudents}</strong>
            </div>
          </div>

          <div className="student-summary-card">
            <div className="student-summary-icon">⏸</div>
            <div>
              <span>Inactive / Suspended</span>
              <strong>{inactiveStudents}</strong>
            </div>
          </div>

          <div className="student-summary-card">
            <div className="student-summary-icon">📊</div>
            <div>
              <span>Enrolled in Organization</span>
              <strong>{totalStudents}</strong>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="students-table-card">
          <div className="students-table-header">
            <div>
              <h3>All Students</h3>
              <p>View students belonging to your organization.</p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  background: "#ffffff"
                }}
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.batchNumber})
                  </option>
                ))}
              </select>

              <div className="students-search-wrapper">
                <span className="students-search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="students-loading">Loading students roster...</div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="students-error">{error}</div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Phone</th>
                    <th>Batch / Cohort</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const isActive =
                        student.isActive !== false &&
                        student.status !== "suspended";
                      return (
                        <tr key={student._id}>
                          <td>
                            <div className="student-profile">
                              <div className="student-avatar">
                                {(student.name || "S").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{student.name}</strong>
                                <span>{student.email}</span>
                              </div>
                            </div>
                          </td>

                          <td>{student.phone || "—"}</td>

                          <td>
                            {student.batchId?.batchNumber || student.batchNumber ? (
                              <span style={{
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                color: "#2563eb",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "0.78rem",
                                fontWeight: 700
                              }}>
                                🏷️ {student.batchId?.batchNumber || student.batchNumber}
                              </span>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                                Unassigned
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              className={`student-status ${
                                isActive ? "active" : "inactive"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <div className="student-actions">
                              <button
                                type="button"
                                className="student-action view"
                                onClick={() => openViewModal(student)}
                              >
                                View
                              </button>

                              <button
                                type="button"
                                className="student-action edit"
                                onClick={() => openEditModal(student)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: isActive ? "#b45309" : "#15803d",
                                  cursor: "pointer",
                                  fontSize: "0.8rem",
                                  fontWeight: 600
                                }}
                                onClick={() => handleToggleStatus(student)}
                              >
                                {isActive ? "Deactivate" : "Activate"}
                              </button>

                              <button
                                type="button"
                                className="student-action delete"
                                onClick={() => handleDeleteStudent(student)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="students-no-results">
                        {search
                          ? "No students found matching your search."
                          : "No students enrolled yet. Click '+ Add Student' above to register your first student."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && (
            <div className="students-pagination">
              <span>
                Showing {filteredStudents.length} of {students.length} students
              </span>
            </div>
          )}
        </div>

        {/* View Student Modal */}
        {showViewModal && selectedStudent && (
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
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>
                  🎓 Student Profile
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.92rem" }}>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>FULL NAME</strong>
                  <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>{selectedStudent.name}</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>EMAIL ADDRESS</strong>
                  <span>{selectedStudent.email}</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>PHONE NUMBER</strong>
                  <span>{selectedStudent.phone || "Not provided"}</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>ACCOUNT STATUS</strong>
                  <span style={{ textTransform: "capitalize" }}>{selectedStudent.status || "Active"}</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>ENROLLMENT DATE</strong>
                  <span>{selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : "—"}</span>
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

        {/* Edit Student Modal */}
        {showEditModal && selectedStudent && (
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
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>
                  ✏️ Edit Student
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

              <form onSubmit={handleEditStudent}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Full Name *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Email Address *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Phone Number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Cohort / Batch Assignment</label>
                    <select
                      value={editForm.batchId}
                      onChange={(e) => setEditForm({ ...editForm, batchId: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                    >
                      <option value="">No Batch Assigned</option>
                      {batches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.batchNumber})
                        </option>
                      ))}
                    </select>
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

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>
                  🎓 Add New Student
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
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

              <form onSubmit={handleAddStudent}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Email Address *</label>
                    <input
                      type="email"
                      placeholder="alex@student.edu"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Phone Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Cohort / Batch Assignment (Optional)</label>
                    <select
                      value={addForm.batchId}
                      onChange={(e) => setAddForm({ ...addForm, batchId: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                    >
                      <option value="">No Batch Assigned</option>
                      {batches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.batchNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Initial Password (min 6 characters) *</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? "Creating..." : "Create Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Students;