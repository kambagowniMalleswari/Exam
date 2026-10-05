import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  FileTextIcon,
  BookOpenIcon,
  ClockIcon,
  AwardIcon,
  AlertTriangleIcon,
  HelpCircleIcon,
  SparklesIcon
} from "../../components/common/Icons.jsx";
import "./Questions.css";

const Questions = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    questionText: "",
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" }
    ],
    correctAnswer: "A",
    marks: 1,
    negativeMarks: 0,
    explanation: ""
  });

  useEffect(() => {
    fetchData();
  }, [testId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testRes, qRes] = await Promise.all([
        api.get(`/tests/${testId}`),
        api.get(`/questions/test/${testId}`)
      ]);
      setTest(testRes.data.test || testRes.data);
      setQuestions(qRes.data.questions || qRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load test questions.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () =>
    setForm({
      questionText: "",
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" }
      ],
      correctAnswer: "A",
      marks: 1,
      negativeMarks: 0,
      explanation: ""
    });

  const openCreate = () => {
    setEditQ(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditQ(q);
    const opts = (q.options || []).map((o, i) =>
      typeof o === "object" ? o : { key: String.fromCharCode(65 + i), text: o }
    );
    setForm({
      questionText: q.questionText || q.text || "",
      options: opts.length === 4 ? opts : [
        { key: "A", text: opts[0]?.text || "" },
        { key: "B", text: opts[1]?.text || "" },
        { key: "C", text: opts[2]?.text || "" },
        { key: "D", text: opts[3]?.text || "" }
      ],
      correctAnswer: q.correctAnswer || "A",
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      explanation: q.explanation || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.questionText.trim()) {
      alert("Question text is required.");
      return;
    }
    const emptyOpt = form.options.some((o) => !o.text.trim());
    if (emptyOpt) {
      alert("All 4 options must be filled.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = { ...form, testId };
      if (editQ) {
        await api.put(`/questions/${editQ._id}`, payload);
      } else {
        await api.post("/questions", payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save question.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (qId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.delete(`/questions/${qId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete question.");
    }
  };

  const updateOption = (idx, value) => {
    const opts = [...form.options];
    opts[idx] = { ...opts[idx], text: value };
    setForm({ ...form, options: opts });
  };

  return (
    <DashboardLayout title="Manage Test Questions">
      <div className="admin-questions-page">
        {/* Header */}
        <div className="aq-header">
          <button className="btn-back-tests" onClick={() => navigate("/admin/tests")}>
            ← Back to Tests
          </button>
          {test && (
            <div className="aq-test-banner">
              <div>
                <h2>{test.title}</h2>
                <div className="aq-meta-tags">
                  <span className="aq-tag" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><FileTextIcon size={14} /> {questions.length} Questions</span>
                  {test.subject && <span className="aq-tag" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><BookOpenIcon size={14} /> {test.subject}</span>}
                  <span className="aq-tag" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><ClockIcon size={14} /> {test.duration} min</span>
                  <span className="aq-tag" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><AwardIcon size={14} /> {test.totalMarks} Marks</span>
                  <span className={`status-pill ${test.status}`}>{test.status}</span>
                </div>
              </div>
              <button className="btn-add-question" onClick={openCreate}>
                + Add Question
              </button>
            </div>
          )}
        </div>

        {/* State */}
        {loading && (
          <div className="aq-state">
            <div className="spinner"></div>
            <p>Loading questions...</p>
          </div>
        )}

        {!loading && error && (
          <div className="aq-state">
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><AlertTriangleIcon size={28} /></span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="aq-state">
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><HelpCircleIcon size={28} /></span>
            <h3>No questions in this test yet</h3>
            <p>Add questions to enable students to take this assessment.</p>
            <button className="btn-add-question" onClick={openCreate}>
              + Add First Question
            </button>
          </div>
        )}

        {/* Questions List */}
        {!loading && !error && questions.length > 0 && (
          <div className="aq-list">
            {questions.map((q, idx) => (
              <div className="aq-card" key={q._id}>
                <div className="aq-card-top">
                  <span className="aq-num">Question {idx + 1}</span>
                  <div className="aq-card-actions">
                    <span className="aq-marks-pill">
                      +{q.marks || 1} / -{q.negativeMarks || 0} marks
                    </span>
                    <button className="btn-action edit" onClick={() => openEdit(q)}>
                      Edit
                    </button>
                    <button className="btn-action delete" onClick={() => handleDelete(q._id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <p className="aq-question-text">{q.questionText || q.text}</p>

                <div className="aq-options-grid">
                  {(q.options || []).map((opt, oi) => {
                    const key = typeof opt === "object" ? opt.key : String.fromCharCode(65 + oi);
                    const text = typeof opt === "object" ? opt.text : opt;
                    const isCorrect = q.correctAnswer === key;
                    return (
                      <div key={oi} className={`aq-option ${isCorrect ? "correct" : ""}`}>
                        <span className="opt-key-circle">{key}</span>
                        <span className="opt-text">{text}</span>
                        {isCorrect && <span className="correct-badge">✓ Correct</span>}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="aq-explanation" style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <span className="exp-icon" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <SparklesIcon size={14} /> Explanation:
                    </span>
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target.classList.contains("modal-overlay") && setShowModal(false)}
          >
            <div className="aq-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h2 style={{ margin: 0 }}>
                  <HelpCircleIcon size={22} color="#0284c7" />
                  <span>{editQ ? "Edit Question" : "Add New Question"}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    color: "#64748b",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
                >
                  ✕
                </button>
              </div>
              <div className="aq-modal-form">
                <div className="aq-form-group">
                  <label>Question Statement *</label>
                  <textarea
                    rows={3}
                    value={form.questionText}
                    onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                    placeholder="Enter the question clearly..."
                  />
                </div>

                <div className="aq-options-form">
                  <label>Multiple Choice Options *</label>
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="opt-input-row">
                      <span className="opt-label">{opt.key}</span>
                      <input
                        type="text"
                        placeholder={`Option ${opt.key}`}
                        value={opt.text}
                        onChange={(e) => updateOption(idx, e.target.value)}
                      />
                      <input
                        type="radio"
                        name="correctAnswer"
                        id={`radio-${opt.key}`}
                        checked={form.correctAnswer === opt.key}
                        onChange={() => setForm({ ...form, correctAnswer: opt.key })}
                      />
                      <label htmlFor={`radio-${opt.key}`} className="radio-label">
                        Correct
                      </label>
                    </div>
                  ))}
                </div>

                <div className="aq-form-row">
                  <div className="aq-form-group half">
                    <label>Marks for Correct (+)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.marks}
                      onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
                    />
                  </div>
                  <div className="aq-form-group half">
                    <label>Negative Marks (-)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={form.negativeMarks}
                      onChange={(e) => setForm({ ...form, negativeMarks: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="aq-form-group">
                  <label>Explanation (Optional)</label>
                  <input
                    type="text"
                    value={form.explanation}
                    onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                    placeholder="Provide reasoning or working for the correct answer"
                  />
                </div>

                <div className="aq-modal-actions">
                  <button
                    className="btn-cancel"
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-submit"
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : editQ ? "Update Question" : "Create Question"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Questions;
