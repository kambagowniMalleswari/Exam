import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  ClockIcon,
  HelpCircleIcon,
  AwardIcon,
  TargetIcon,
  GlobeIcon,
  UsersIcon,
  SearchIcon,
  FileTextIcon,
  AlertTriangleIcon
} from "../../components/common/Icons.jsx";
import "./TeacherTests.css";

const TeacherTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
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
      .catch((err) => console.warn("Could not load batches in TeacherTests:", err.message));
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "create") {
      openCreate();
    }
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tests");
      setTests(res.data.tests || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tests.");
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditTest(null);
    setModalError("");
    setForm({
      title: "",
      description: "",
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
      title: test.title || "",
      description: test.description || "",
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
      setModalError("Test title must be at least 3 characters.");
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
        setModalError("Invalid start date/time.");
        return;
      }
    }
    if (form.endDate) {
      parsedEndDate = form.endTime
        ? new Date(`${form.endDate}T${form.endTime}`)
        : new Date(form.endDate);
      if (isNaN(parsedEndDate.getTime())) {
        setModalError("Invalid end date/time.");
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
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (testId) => {
    if (!window.confirm("Delete this test?")) return;
    try {
      await api.delete(`/tests/${testId}`);
      fetchTests();
    } catch { alert("Failed to delete test."); }
  };

  const handlePublish = async (test) => {
    const action = test.status === "published" ? "unpublish" : "publish";
    try {
      await api.patch(`/tests/${test._id}/${action}`);
      fetchTests();
    } catch (err) { alert(err.response?.data?.message || "Failed."); }
  };

  const filtered = tests.filter((t) =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="My Tests">
      <div className="teacher-tests-page">
        <div className="tt-header">
          <div>
            <h2>My Tests</h2>
            <p>Create and manage tests for your students.</p>
          </div>
          <button className="btn-create-test" onClick={openCreate}>+ Create Test</button>
        </div>

        <div className="tt-search-row">
          <div className="search-box">
            <SearchIcon size={16} />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="count-label">{filtered.length} tests</span>
        </div>

        {loading && <div className="tt-state"><div className="spinner"></div><p>Loading...</p></div>}
        {!loading && error && <div className="tt-state"><AlertTriangleIcon size={18} /><p>{error}</p></div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="tt-state">
            <FileTextIcon size={32} />
            <h3>No tests found</h3>
            <p>{search ? "Try a different search." : "Create your first test to get started."}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="tests-cards-grid">
            {filtered.map((test) => (
              <div className="test-manage-card" key={test._id}>
                <div className="tmc-top">
                  <div>
                    <span className={`status-chip ${test.status}`}>{test.status}</span>
                    {test.type === "public" && (
                      <span className="type-chip" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <GlobeIcon size={12} /> Public
                      </span>
                    )}
                    {test.targetType === "selective" ? (
                      <span style={{ marginLeft: "4px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <TargetIcon size={12} /> Selective ({test.targetBatches?.length || 0} Batches)
                      </span>
                    ) : (
                      <span style={{ marginLeft: "4px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <UsersIcon size={12} /> All Students
                      </span>
                    )}
                  </div>
                  <span className="tmc-subject">{test.subject || "General"}</span>
                </div>
                <h3>{test.title}</h3>
                <div className="tmc-meta">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <ClockIcon size={13} /> {test.duration}m
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <AwardIcon size={13} /> {test.totalMarks} marks
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <HelpCircleIcon size={13} /> {Array.isArray(test.questions) ? test.questions.length : test.questionCount || 0} Qs
                  </span>
                </div>
                <div className="tmc-actions">
                  <button className="tmc-btn questions" onClick={() => navigate(`/teacher/tests/${test._id}/questions`)}>
                    Questions
                  </button>
                  <button className="tmc-btn edit" onClick={() => openEdit(test)}>Edit</button>
                  <button
                    className={`tmc-btn publish ${test.status === "published" ? "unpublish" : ""}`}
                    onClick={() => handlePublish(test)}
                  >
                    {test.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button className="tmc-btn delete" onClick={() => handleDelete(test._id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowModal(false)}>
            <div className="test-modal" style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <h2>{editTest ? "Edit Test" : "Create New Test"}</h2>

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

              <div className="modal-form">
                <div className="form-row">
                  <label>Test Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Mathematics Chapter 5 Quiz"
                  />
                </div>
                <div className="form-row">
                  <label>Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the test..."
                  />
                </div>
                <div className="form-row">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Duration (minutes) *</label>
                    <input type="number" min="1" value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })} />
                  </div>
                  <div className="form-row">
                    <label>Passing Percentage (%) *</label>
                    <input type="number" min="0" max="100" value={form.passingPercentage} onChange={(e) => setForm({ ...form, passingPercentage: +e.target.value })} />
                  </div>
                  <div className="form-row">
                    <label>Status *</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="draft">Draft (Hidden from students)</option>
                      <option value="published">Published (Available to students)</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Max Attempts Allowed *</label>
                    <input type="number" min="1" max="10" value={form.numberOfAttempts} onChange={(e) => setForm({ ...form, numberOfAttempts: +e.target.value })} />
                  </div>
                  <div className="form-row">
                    <label>Attempt Evaluation Policy *</label>
                    <select value={form.attemptMode || "re_attempt_on_fail"} onChange={(e) => setForm({ ...form, attemptMode: e.target.value })}>
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
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#334155", marginBottom: "0.5rem" }}>
                    📅 Schedule Window (Optional)
                  </div>
                  <div className="form-grid-2">
                    <div className="form-row">
                      <label style={{ fontSize: "0.8rem" }}>Start Date</label>
                      <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label style={{ fontSize: "0.8rem" }}>Start Time</label>
                      <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label style={{ fontSize: "0.8rem" }}>End Date</label>
                      <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label style={{ fontSize: "0.8rem" }}>End Time</label>
                      <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
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
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#166534", marginBottom: "0.4rem" }}>
                    🎯 Student Cohort Targeting & Roll-Out
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#475569", margin: "0 0 0.6rem 0" }}>
                    Roll out this assessment to all students or restrict access to selective batches and merit rankers.
                  </p>

                  <div style={{ display: "flex", gap: "1.25rem", marginBottom: "0.75rem", fontSize: "0.85rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="targetType"
                        value="all"
                        checked={form.targetType === "all"}
                        onChange={() => setForm({ ...form, targetType: "all" })}
                      />
                      <strong>All Enrolled Students</strong>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="targetType"
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

                      <div className="form-grid-2" style={{ marginTop: "4px" }}>
                        <div className="form-row">
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
                        <div className="form-row">
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

                <div className="form-row">
                  <label>Visibility</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="private">Private (Organization only)</option>
                    <option value="public">Public (Anyone can take)</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Instructions</label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    rows={2}
                    placeholder="Any special instructions for this test..."
                  />
                </div>
              </div>
              <div className="modal-btns">
                <button className="btn-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-modal-save" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Saving..." : editTest ? "Update Test" : "Create Test"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default TeacherTests;
