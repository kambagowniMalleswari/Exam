import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  FileTextIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  SearchIcon,
  AlertTriangleIcon,
  GlobeIcon,
  LockIcon,
  CalendarIcon,
  TargetIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon
} from "../../components/common/Icons.jsx";
import "./Tests.css";

const COVER_PRESETS = [
  { label: "💻 Programming", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=80" },
  { label: "📐 Mathematics", url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=80" },
  { label: "🌐 Web Dev", url: "https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=400&auto=format&fit=crop&q=80" },
  { label: "📊 Data & AI", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80" },
  { label: "🧠 Aptitude", url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&auto=format&fit=crop&q=80" },
  { label: "🛡️ Cyber Security", url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=80" },
];

const Tests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteTestTarget, setDeleteTestTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [modalError, setModalError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    duration: 30,
    passingPercentage: 40,
    totalMarks: 100,
    numberOfAttempts: 1,
    type: "private",
    status: "draft",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    instructions: "",
    targetType: "all",
    targetBatches: [],
    minPriorScore: "",
    meritListTopN: ""
  });
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchTests();
    api.get("/batches")
      .then((res) => setBatches(res.data?.batches || []))
      .catch((err) => console.warn("Could not load batches in Tests.jsx:", err.message));
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "create") {
      openCreate();
    }
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/tests");
      const testData = response.data.tests || response.data;
      setTests(Array.isArray(testData) ? testData : []);
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError(err.response?.data?.message || "Unable to load tests.");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditTest(null);
    setModalError("");
    setForm({
      title: "",
      description: "",
      image: "",
      subject: "",
      duration: 30,
      passingPercentage: 40,
      totalMarks: 100,
      numberOfAttempts: 1,
      attemptMode: "re_attempt_on_fail",
      type: "private",
      status: "draft",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      instructions: "",
      targetType: "all",
      targetBatches: [],
      minPriorScore: "",
      meritListTopN: ""
    });
    setShowModal(true);
  };

  const openEdit = (test) => {
    setEditTest(test);
    setModalError("");
    let sDate = "";
    let sTime = "";
    let eDate = "";
    let eTime = "";
    if (test.startDate) {
      const d = new Date(test.startDate);
      sDate = d.toISOString().slice(0, 10);
      sTime = d.toTimeString().slice(0, 5);
    }
    if (test.endDate) {
      const d = new Date(test.endDate);
      eDate = d.toISOString().slice(0, 10);
      eTime = d.toTimeString().slice(0, 5);
    }
    setForm({
      title: test.title || test.name || "",
      description: test.description || "",
      image: test.image || "",
      subject: test.subject || "",
      duration: test.duration || 30,
      passingPercentage: test.passingPercentage ?? (test.passingMarks || 40),
      totalMarks: test.totalMarks || 100,
      numberOfAttempts: test.numberOfAttempts || 1,
      attemptMode: test.attemptMode || "re_attempt_on_fail",
      type: test.type || "private",
      status: test.status || "draft",
      startDate: sDate,
      startTime: sTime,
      endDate: eDate,
      endTime: eTime,
      instructions: test.instructions || "",
      targetType: test.targetType || "all",
      targetBatches: Array.isArray(test.targetBatches)
        ? test.targetBatches.map((b) => (b && b._id ? b._id : b))
        : [],
      minPriorScore: test.targetCriteria?.minPriorScore ?? "",
      meritListTopN: test.targetCriteria?.meritListTopN ?? ""
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setModalError("");
    if (!form.title.trim() || form.title.trim().length < 3) {
      setModalError("Test title is required and must be at least 3 characters.");
      return;
    }
    if (!form.duration || Number(form.duration) <= 0) {
      setModalError("Duration must be greater than 0 minutes.");
      return;
    }
    const passPct = Number(form.passingPercentage);
    if (isNaN(passPct) || passPct < 0 || passPct > 100) {
      setModalError("Passing percentage must be between 0 and 100.");
      return;
    }

    let parsedStartDate = null;
    let parsedEndDate = null;
    if (form.startDate) {
      parsedStartDate = form.startTime
        ? new Date(`${form.startDate}T${form.startTime}`)
        : new Date(form.startDate);
      if (isNaN(parsedStartDate.getTime())) {
        setModalError("Please provide a valid start date/time.");
        return;
      }
    }
    if (form.endDate) {
      parsedEndDate = form.endTime
        ? new Date(`${form.endDate}T${form.endTime}`)
        : new Date(form.endDate);
      if (isNaN(parsedEndDate.getTime())) {
        setModalError("Please provide a valid end date/time.");
        return;
      }
    }
    if (parsedStartDate && parsedEndDate && parsedEndDate <= parsedStartDate) {
      setModalError("End date/time must be strictly after start date/time.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        description: form.description ? form.description.trim() : "",
        image: form.image ? form.image.trim() : "",
        subject: form.subject ? form.subject.trim() : "General",
        duration: Number(form.duration),
        passingPercentage: passPct,
        passingMarks: passPct,
        totalMarks: Number(form.totalMarks) || 100,
        numberOfAttempts: Number(form.numberOfAttempts) || 1,
        attemptMode: form.attemptMode || "re_attempt_on_fail",
        type: form.type,
        status: form.status,
        instructions: form.instructions || "Read each question carefully before submitting.",
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        targetType: form.targetType,
        targetBatches: form.targetType === "selective" ? form.targetBatches : [],
        targetCriteria: {
          minPriorScore: form.targetType === "selective" && form.minPriorScore !== "" ? Number(form.minPriorScore) : null,
          meritListTopN: form.targetType === "selective" && form.meritListTopN !== "" ? Number(form.meritListTopN) : null
        }
      };

      if (editTest) {
        await api.put(`/tests/${editTest._id}`, payload);
      } else {
        await api.post("/tests", payload);
      }
      setShowModal(false);
      fetchTests();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to save test.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (test) => {
    setDeleteTestTarget(test);
  };

  const confirmDeleteTest = async () => {
    if (!deleteTestTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/tests/${deleteTestTarget._id}`);
      setDeleteTestTarget(null);
      fetchTests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete test.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePublish = async (test) => {
    const action = test.status === "published" ? "unpublish" : "publish";
    try {
      await api.patch(`/tests/${test._id}/${action}`);
      fetchTests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle test status.");
    }
  };

  const filteredTests = tests.filter((test) => {
    const searchValue = search.toLowerCase();
    return (
      test.title?.toLowerCase().includes(searchValue) ||
      test.name?.toLowerCase().includes(searchValue) ||
      test.subject?.toLowerCase().includes(searchValue) ||
      test.status?.toLowerCase().includes(searchValue)
    );
  });

  const totalTests = tests.length;
  const publishedTests = tests.filter((t) => t.status?.toLowerCase() === "published").length;
  const draftTests = tests.filter((t) => t.status?.toLowerCase() === "draft").length;
  const totalAttempts = tests.reduce(
    (total, test) => total + Number(test.attempts || test.totalAttempts || 0),
    0
  );

  const getQuestionCount = (test) => {
    if (Array.isArray(test.questions)) {
      return test.questions.length;
    }
    return test.questionCount || test.questionsCount || 0;
  };

  return (
    <DashboardLayout title="Tests">
      <div className="tests-page">
        {/* Page Header */}
        <div className="tests-page-header">
          <div>
            <h2>Tests Management</h2>
            <p>Create, manage and monitor assessments for your organisation.</p>
          </div>
          <div className="create-test-header-wrap">
            <div className="create-test-illustration-badge" title="Smart Assessments">
              <span className="badge-icon">📝</span>
              <span>Interactive Assessments</span>
            </div>
            <button type="button" className="tests-create-button" onClick={openCreate}>
              <PlusIcon size={16} /> Create Test
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="tests-summary-grid">
          <div className="test-summary-card">
            <div className="test-summary-icon">
              <FileTextIcon size={22} />
            </div>
            <div>
              <span>Total Tests</span>
              <strong>{totalTests}</strong>
            </div>
          </div>

          <div className="test-summary-card">
            <div className="test-summary-icon">
              <CheckCircleIcon size={22} />
            </div>
            <div>
              <span>Published</span>
              <strong>{publishedTests}</strong>
            </div>
          </div>

          <div className="test-summary-card">
            <div className="test-summary-icon">
              <ClockIcon size={22} />
            </div>
            <div>
              <span>Draft Tests</span>
              <strong>{draftTests}</strong>
            </div>
          </div>

          <div className="test-summary-card">
            <div className="test-summary-icon">
              <UsersIcon size={22} />
            </div>
            <div>
              <span>Total Attempts</span>
              <strong>{totalAttempts}</strong>
            </div>
          </div>
        </div>

        {/* Tests Table Container */}
        <div className="tests-card">
          <div className="tests-card-header">
            <h3>Tests List</h3>
            <div className="tests-search-box">
              <SearchIcon size={16} className="tests-search-icon" />
              <input
                type="text"
                placeholder="Search by test name, subject or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && <div className="tests-loading">Loading tests...</div>}
          {!loading && error && <div className="tests-error">{error}</div>}

          {!loading && !error && (
            <div className="tests-table-container">
              <table className="tests-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Subject</th>
                    <th>Questions</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test) => {
                      const title = test.title || test.name || "Untitled Test";
                      const questionCount = getQuestionCount(test);
                      const status = test.status || "draft";

                      return (
                        <tr key={test._id}>
                          <td>
                            <div className="test-profile">
                              <div className="test-icon">
                                {test.image ? (
                                  <img
                                    src={test.image}
                                    alt={title}
                                    className="test-thumb-img"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <FileTextIcon size={16} />
                                )}
                              </div>
                              <div>
                                <strong>{title}</strong>
                                <span>
                                  {test.type === "public" ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                      <GlobeIcon size={12} /> Public
                                    </span>
                                  ) : (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                      <LockIcon size={12} /> Private
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="test-subject">{test.subject || "General"}</span>
                          </td>
                          <td>
                            <span className="test-question-count">{questionCount} Qs</span>
                          </td>
                          <td>{test.duration ? `${test.duration} min` : "—"}</td>
                          <td>
                            <span
                              className={`test-status ${
                                status.toLowerCase() === "published" ? "published" : "draft"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td>
                            <div className="test-actions">
                              <button
                                type="button"
                                className="test-action view"
                                onClick={() => navigate(`/admin/tests/${test._id}/questions`)}
                                title="Manage Questions"
                              >
                                <EyeIcon size={13} /> Questions
                              </button>
                              <button
                                type="button"
                                className="test-action edit"
                                onClick={() => openEdit(test)}
                                title="Edit Assessment Settings"
                              >
                                <EditIcon size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                className={`test-action ${status === "published" ? "unpublish" : "publish"}`}
                                onClick={() => handlePublish(test)}
                                title={status === "published" ? "Unpublish Test" : "Publish Test"}
                              >
                                <CheckCircleIcon size={13} />
                                {status === "published" ? "Unpublish" : "Publish"}
                              </button>
                              <button
                                type="button"
                                className="test-action delete"
                                onClick={() => handleDelete(test)}
                                title="Delete Assessment"
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
                      <td colSpan="6" className="tests-no-results">
                        {search ? "No tests found for your search." : "No tests found in your organisation."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Create/Edit */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target.classList.contains("modal-overlay") && setShowModal(false)}
          >
            <div className="admin-test-modal" style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <h2>{editTest ? "Edit Assessment" : "Create New Assessment"}</h2>

              {modalError && (
                <div style={{
                  background: "#fef2f2",
                  color: "#b91c1c",
                  padding: "0.65rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                  border: "1px solid #fecaca"
                }}>
                  ⚠️ {modalError}
                </div>
              )}

              <div className="atm-form">
                <div className="atm-group">
                  <label>Test Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Mid-Term Python Assessment"
                  />
                </div>

                <div className="atm-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the test content and objectives..."
                  />
                </div>

                {/* Cover Image Selector with Quick Presets */}
                <div className="atm-group" style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <label style={{ fontWeight: 600, color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Assessment Cover Image (Optional)</span>
                    {form.image && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image: "" })}
                        style={{
                          background: "#fee2e2",
                          border: "none",
                          color: "#991b1b",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                      >
                        Remove Image
                      </button>
                    )}
                  </label>
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://images.unsplash.com/... or paste image URL"
                    style={{ marginTop: "6px", marginBottom: "8px" }}
                  />
                  {form.image && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <img
                        src={form.image}
                        alt="Test Cover Preview"
                        style={{ width: "80px", height: "48px", objectFit: "cover", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <span style={{ fontSize: "11px", color: "#64748b" }}>Cover Preview</span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Presets:</span>
                    {COVER_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setForm({ ...form, image: preset.url })}
                        style={{
                          padding: "3px 8px",
                          background: form.image === preset.url ? "#e0e7ff" : "#ffffff",
                          border: form.image === preset.url ? "1px solid #6366f1" : "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "11px",
                          color: form.image === preset.url ? "#4338ca" : "#475569",
                          cursor: "pointer",
                          fontWeight: form.image === preset.url ? 700 : 500
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="atm-row">
                  <div className="atm-group half">
                    <label>Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                  <div className="atm-group half">
                    <label>Duration (Minutes) *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="atm-row">
                  <div className="atm-group half">
                    <label>Passing Percentage (%) *</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.passingPercentage}
                      onChange={(e) => setForm({ ...form, passingPercentage: Number(e.target.value) })}
                    />
                  </div>
                  <div className="atm-group half">
                    <label>Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="draft">Draft (Hidden from students)</option>
                      <option value="published">Published (Available to students)</option>
                    </select>
                  </div>
                </div>

                <div className="atm-row">
                  <div className="atm-group half">
                    <label>Max Attempts Allowed *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={form.numberOfAttempts}
                      onChange={(e) => setForm({ ...form, numberOfAttempts: Number(e.target.value) })}
                    />
                  </div>
                  <div className="atm-group half">
                    <label>Attempt Evaluation Policy *</label>
                    <select
                      value={form.attemptMode || "re_attempt_on_fail"}
                      onChange={(e) => setForm({ ...form, attemptMode: e.target.value })}
                    >
                      <option value="re_attempt_on_fail">Re-attempts Only If Failed (Passed students cannot re-attempt)</option>
                      <option value="best_of_n">Best of N Attempts (All attempts permitted up to N, best score counted)</option>
                    </select>
                  </div>
                </div>

                {/* Scheduling Section */}
                <div style={{
                  background: "#f8fafc",
                  padding: "0.85rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "0.85rem"
                }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#334155", marginBottom: "0.5rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <CalendarIcon size={16} />
                    <span>Schedule Window (Optional)</span>
                  </div>
                  <div className="atm-row">
                    <div className="atm-group half">
                      <label style={{ fontSize: "0.8rem" }}>Start Date</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      />
                    </div>
                    <div className="atm-group half">
                      <label style={{ fontSize: "0.8rem" }}>Start Time</label>
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="atm-row" style={{ marginTop: "0.4rem" }}>
                    <div className="atm-group half">
                      <label style={{ fontSize: "0.8rem" }}>End Date</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      />
                    </div>
                    <div className="atm-group half">
                      <label style={{ fontSize: "0.8rem" }}>End Time</label>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Student Targeting & Selective Rollout Section */}
                <div style={{
                  background: "#f0fdf4",
                  padding: "0.85rem",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                  marginBottom: "0.85rem"
                }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#166534", marginBottom: "0.4rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <TargetIcon size={16} />
                    <span>Student Cohort Targeting & Roll-Out</span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#475569", margin: "0 0 0.6rem 0" }}>
                    Roll out this assessment to all students or restrict access to selective batches and merit rankers.
                  </p>

                  <div style={{ display: "flex", gap: "1.25rem", marginBottom: "0.75rem", fontSize: "0.85rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="adminTargetType"
                        value="all"
                        checked={form.targetType === "all"}
                        onChange={() => setForm({ ...form, targetType: "all" })}
                      />
                      <strong>All Enrolled Students</strong>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="adminTargetType"
                        value="selective"
                        checked={form.targetType === "selective"}
                        onChange={() => setForm({ ...form, targetType: "selective" })}
                      />
                      <strong>Selective Cohort / Batches</strong>
                    </label>
                  </div>

                  {form.targetType === "selective" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", background: "#ffffff", padding: "0.75rem", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                          Target Batches (Select one or more)
                        </label>
                        {batches.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {batches.map((b) => {
                              const isSelected = form.targetBatches.includes(b._id);
                              return (
                                <button
                                  key={b._id}
                                  type="button"
                                  onClick={() => {
                                    const next = isSelected
                                      ? form.targetBatches.filter((id) => id !== b._id)
                                      : [...form.targetBatches, b._id];
                                    setForm({ ...form, targetBatches: next });
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "0.78rem",
                                    fontWeight: 600,
                                    border: isSelected ? "1px solid #16a34a" : "1px solid #cbd5e1",
                                    background: isSelected ? "#ecfdf5" : "#f8fafc",
                                    color: isSelected ? "#15803d" : "#475569",
                                    cursor: "pointer"
                                  }}
                                >
                                  {isSelected ? "✓ " : ""}{b.name} ({b.batchNumber})
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                            No batches created yet. Create batches in the 'Student Batches' menu.
                          </span>
                        )}
                      </div>

                      <div className="atm-row" style={{ marginTop: "4px" }}>
                        <div className="atm-group half">
                          <label style={{ fontSize: "0.78rem" }}>Min Prior Score % (Optional)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="e.g. 70"
                            value={form.minPriorScore}
                            onChange={(e) => setForm({ ...form, minPriorScore: e.target.value })}
                          />
                        </div>
                        <div className="atm-group half">
                          <label style={{ fontSize: "0.78rem" }}>Limit to Top N Merit Rankers (Optional)</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="e.g. 10 (Top 10)"
                            value={form.meritListTopN}
                            onChange={(e) => setForm({ ...form, meritListTopN: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="atm-row">
                  <div className="atm-group half">
                    <label>Allowed Attempts</label>
                    <input
                      type="number"
                      min="1"
                      value={form.numberOfAttempts}
                      onChange={(e) => setForm({ ...form, numberOfAttempts: Number(e.target.value) })}
                    />
                  </div>
                  <div className="atm-group half">
                    <label>Visibility</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="private">Private (Organisation)</option>
                      <option value="public">Public Portal</option>
                    </select>
                  </div>
                </div>

                <div className="atm-group">
                  <label>Instructions</label>
                  <textarea
                    rows={2}
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    placeholder="Candidate instructions..."
                  />
                </div>

                <div className="atm-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : editTest ? "Update Test" : "Create Test"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {deleteTestTarget && (
          <div className="custom-confirm-modal-overlay" onClick={() => !deleteLoading && setDeleteTestTarget(null)}>
            <div className="custom-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="confirm-icon-bubble danger">
                <TrashIcon size={24} />
              </div>
              <h3>Delete Assessment?</h3>
              <p>
                Are you sure you want to permanently delete <strong>"{deleteTestTarget.title || deleteTestTarget.name}"</strong>? All associated question sets and candidate attempt records will be removed.
              </p>
              <div className="confirm-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setDeleteTestTarget(null)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-danger"
                  onClick={confirmDeleteTest}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Yes, Delete Assessment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Tests;