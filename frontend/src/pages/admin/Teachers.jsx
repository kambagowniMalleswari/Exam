import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  SearchIcon,
  UserIcon,
  EditIcon,
  PlusIcon,
  AlertTriangleIcon
} from "../../components/common/Icons.jsx";
import "./Teachers.css";

const Teachers = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    password: ""
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: ""
  });

  useEffect(() => {
    fetchTeachers();
    if (searchParams.get("action") === "add") {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      const users = response.data.users || response.data || [];
      const teacherUsers = users.filter((user) => user.role === "teacher");
      setTeachers(teacherUsers);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError(
        err.response?.data?.message || "Unable to load teachers."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      setModalError("Please fill in Name, Email and Password.");
      return;
    }

    if (addForm.name.trim().length <= 3) {
      setModalError("Name must be more than 3 characters (at least 4 characters).");
      return;
    }

    if (addForm.phone.trim() && !/^\d{10}$/.test(addForm.phone.trim())) {
      setModalError("Phone number must be exactly 10 numeric digits.");
      return;
    }

    if (addForm.password.length < 6) {
      setModalError("Password must be at least 6 characters long.");
      return;
    }

    if (!/[A-Z]/.test(addForm.password)) {
      setModalError("Password must contain at least 1 uppercase letter (A-Z).");
      return;
    }

    if (!/[a-z]/.test(addForm.password)) {
      setModalError("Password must contain at least 1 lowercase letter (a-z).");
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(addForm.password)) {
      setModalError("Password must contain at least 1 special character (!@#$%^&* etc.).");
      return;
    }

    try {
      setModalLoading(true);
      await api.post("/users", {
        name: addForm.name.trim(),
        email: addForm.email.toLowerCase().trim(),
        phone: addForm.phone.trim(),
        subject: addForm.subject.trim(),
        password: addForm.password,
        role: "teacher"
      });

      setShowAddModal(false);
      setAddForm({ name: "", email: "", phone: "", subject: "", password: "" });
      setFeedback("Teacher account created successfully!");
      setTimeout(() => setFeedback(""), 4000);

      searchParams.delete("action");
      setSearchParams(searchParams);

      await fetchTeachers();
    } catch (err) {
      setModalError(
        err.response?.data?.message || "Failed to create teacher account."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setModalError("");

    if (!editForm.name || editForm.name.trim().length <= 3) {
      setModalError("Teacher name must be more than 3 characters (at least 4 characters).");
      return;
    }

    if (editForm.phone && editForm.phone.trim() && !/^\d{10}$/.test(editForm.phone.trim())) {
      setModalError("Phone number must be exactly 10 numeric digits.");
      return;
    }

    try {
      setModalLoading(true);
      await api.put(`/users/${selectedTeacher._id}`, editForm);
      setShowEditModal(false);
      setFeedback("Teacher updated successfully!");
      setTimeout(() => setFeedback(""), 4000);
      await fetchTeachers();
    } catch (err) {
      setModalError(
        err.response?.data?.message || "Failed to update teacher."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (teacher) => {
    try {
      const res = await api.patch(`/users/${teacher._id}/status`);
      setFeedback(res.data?.message || "Teacher status updated.");
      setTimeout(() => setFeedback(""), 3000);
      await fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    const confirm = window.confirm(
      `Are you sure you want to delete teacher "${teacher.name}"? This action cannot be undone.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/users/${teacher._id}`);
      setFeedback(`Teacher "${teacher.name}" deleted.`);
      setTimeout(() => setFeedback(""), 4000);
      await fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete teacher.");
    }
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setEditForm({
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      subject: teacher.subject || ""
    });
    setModalError("");
    setShowEditModal(true);
  };

  const openViewModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const searchValue = search.toLowerCase();
    return (
      teacher.name?.toLowerCase().includes(searchValue) ||
      teacher.email?.toLowerCase().includes(searchValue) ||
      teacher.phone?.includes(searchValue) ||
      teacher.subject?.toLowerCase().includes(searchValue)
    );
  });

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(
    (teacher) => teacher.isActive !== false && teacher.status !== "suspended"
  ).length;
  const inactiveTeachers = totalTeachers - activeTeachers;

  return (
    <DashboardLayout title="Teachers">
      <div className="teachers-page">
        {/* Page Header */}
        <div className="teachers-page-header">
          <div>
            <h2>Teachers Management</h2>
            <p>
              Manage teachers, provision test author accounts, and monitor their assessment activity.
            </p>
          </div>

          <button
            type="button"
            className="teachers-add-button"
            onClick={() => setShowAddModal(true)}
          >
            + Add Teacher
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
        <div className="teachers-summary-grid">
          <div className="teacher-summary-card">
            <div className="teacher-summary-icon"><UsersIcon size={20} /></div>
            <div>
              <span>Total Teachers</span>
              <strong>{totalTeachers}</strong>
            </div>
          </div>

          <div className="teacher-summary-card">
            <div className="teacher-summary-icon"><CheckCircleIcon size={20} /></div>
            <div>
              <span>Active Teachers</span>
              <strong>{activeTeachers}</strong>
            </div>
          </div>

          <div className="teacher-summary-card">
            <div className="teacher-summary-icon"><ClockIcon size={20} /></div>
            <div>
              <span>Inactive / Suspended</span>
              <strong>{inactiveTeachers}</strong>
            </div>
          </div>

          <div className="teacher-summary-card">
            <div className="teacher-summary-icon"><FileTextIcon size={20} /></div>
            <div>
              <span>Faculty in Database</span>
              <strong>{totalTeachers}</strong>
            </div>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="teachers-table-card">
          <div className="teachers-table-header">
            <div>
              <h3>All Teachers</h3>
              <p>View and manage teachers in your organization.</p>
            </div>

            <div className="teachers-search-wrapper">
              <SearchIcon size={16} className="teachers-search-icon" />
              <input
                type="text"
                placeholder="Search by name, email, phone or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="teachers-loading">Loading faculty roster...</div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="teachers-error">{error}</div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="teachers-table-container">
              <table className="teachers-table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Phone</th>
                    <th>Subject / Dept</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => {
                      const isActive =
                        teacher.isActive !== false &&
                        teacher.status !== "suspended";
                      return (
                        <tr key={teacher._id}>
                          <td>
                            <div className="teacher-profile">
                              <div className="teacher-avatar">
                                {(teacher.name || "T").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{teacher.name}</strong>
                                <span>{teacher.email}</span>
                              </div>
                            </div>
                          </td>

                          <td>{teacher.phone || "—"}</td>

                          <td>
                            <span
                              style={{
                                background: "#f1f5f9",
                                color: "#334155",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontSize: "0.82rem",
                                fontWeight: 500
                              }}
                            >
                              {teacher.subject || "General"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`teacher-status ${
                                isActive ? "active" : "inactive"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <div className="teacher-actions">
                              <button
                                type="button"
                                className="teacher-action view"
                                onClick={() => openViewModal(teacher)}
                              >
                                View
                              </button>

                              <button
                                type="button"
                                className="teacher-action edit"
                                onClick={() => openEditModal(teacher)}
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
                                onClick={() => handleToggleStatus(teacher)}
                              >
                                {isActive ? "Deactivate" : "Activate"}
                              </button>

                              <button
                                type="button"
                                className="teacher-action delete"
                                onClick={() => handleDeleteTeacher(teacher)}
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
                      <td colSpan="5" className="teachers-no-results">
                        {search
                          ? "No teachers found matching your search."
                          : "No teachers added yet. Click '+ Add Teacher' above to provision your first faculty member."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && (
            <div className="teachers-pagination">
              <span>
                Showing {filteredTeachers.length} of {teachers.length} teachers
              </span>
            </div>
          )}
        </div>

        {/* View Teacher Modal */}
        {showViewModal && selectedTeacher && (
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
                  <UserIcon size={20} />
                  <span>Teacher Profile</span>
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
                  <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>{selectedTeacher.name}</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>EMAIL ADDRESS</strong>
                  <span>{selectedTeacher.email}</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>SUBJECT / DEPARTMENT</strong>
                  <span>{selectedTeacher.subject || "Not assigned"}</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>PHONE NUMBER</strong>
                  <span>{selectedTeacher.phone || "Not provided"}</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>ACCOUNT STATUS</strong>
                  <span style={{ textTransform: "capitalize" }}>{selectedTeacher.status || "Active"}</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b", display: "block", fontSize: "0.78rem" }}>APPOINTMENT DATE</strong>
                  <span>{selectedTeacher.createdAt ? new Date(selectedTeacher.createdAt).toLocaleDateString() : "—"}</span>
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

        {/* Edit Teacher Modal */}
        {showEditModal && selectedTeacher && (
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
                  <span>Edit Teacher</span>
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

              <form onSubmit={handleEditTeacher}>
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Subject / Department</label>
                      <input
                        type="text"
                        value={editForm.subject}
                        onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                        placeholder="e.g. Computer Science"
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

        {/* Add Teacher Modal */}
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
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <PlusIcon size={18} />
                  <span>Add New Teacher</span>
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

              <form onSubmit={handleAddTeacher}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Prof. Alan Turing"
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
                      placeholder="teacher@institution.edu"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Subject / Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Mathematics"
                        value={addForm.subject}
                        onChange={(e) => setAddForm({ ...addForm, subject: e.target.value })}
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
                    {modalLoading ? "Creating..." : "Create Teacher"}
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

export default Teachers;