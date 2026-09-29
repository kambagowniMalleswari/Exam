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
import "./TeacherQuestions.css";

const TeacherQuestions = () => {
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
    questionText: "", options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" }
    ],
    correctAnswer: "A", marks: 1, negativeMarks: 0, explanation: ""
  });

  useEffect(() => { fetchData(); }, [testId]);

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
      setError(err.response?.data?.message || "Failed to load questions.");
    } finally { setLoading(false); }
  };

  const resetForm = () => setForm({
    questionText: "", options: [
      { key: "A", text: "" }, { key: "B", text: "" },
      { key: "C", text: "" }, { key: "D", text: "" }
    ],
    correctAnswer: "A", marks: 1, negativeMarks: 0, explanation: ""
  });

  const openCreate = () => { setEditQ(null); resetForm(); setShowModal(true); };

  const openEdit = (q) => {
    setEditQ(q);
    const opts = q.options.map((o, i) =>
      typeof o === "object" ? o : { key: String.fromCharCode(65 + i), text: o }
    );
    setForm({
      questionText: q.questionText || q.text || "",
      options: opts,
      correctAnswer: q.correctAnswer || "A",
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      explanation: q.explanation || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.questionText.trim()) return;
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
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (qId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/questions/${qId}`);
      fetchData();
    } catch { alert("Failed to delete question."); }
  };

  const updateOption = (idx, value) => {
    const opts = [...form.options];
    opts[idx] = { ...opts[idx], text: value };
    setForm({ ...form, options: opts });
  };

  return (
    <DashboardLayout title="Question Manager">
      <div className="questions-page">

        {/* Test Header */}
        <div className="qp-header">
          <button className="btn-back-q" onClick={() => navigate(-1)}>← Back to Tests</button>
          {test && (
            <div className="qp-test-info">
              <div>
                <h2>{test.title}</h2>
                <div className="qp-meta">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><FileTextIcon size={14} /> {questions.length} questions</span>
                  {test.subject && <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><BookOpenIcon size={14} /> {test.subject}</span>}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><ClockIcon size={14} /> {test.duration} min</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><AwardIcon size={14} /> {test.totalMarks} marks</span>
                  <span className={`status-chip ${test.status}`}>{test.status}</span>
                </div>
              </div>
              <button className="btn-add-q" onClick={openCreate}>+ Add Question</button>
            </div>
          )}
        </div>

        {loading && <div className="q-state"><div className="spinner"></div><p>Loading questions...</p></div>}
        {!loading && error && <div className="q-state"><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><AlertTriangleIcon size={28} /></span><p>{error}</p></div>}

        {!loading && !error && questions.length === 0 && (
          <div className="q-state">
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><HelpCircleIcon size={28} /></span>
            <h3>No questions yet</h3>
            <p>Add your first question to this test.</p>
            <button className="btn-add-q" onClick={openCreate}>+ Add First Question</button>
          </div>
        )}

        {!loading && !error && questions.length > 0 && (
          <div className="questions-list">
            {questions.map((q, idx) => (
              <div className="q-card" key={q._id}>
                <div className="q-card-top">
                  <span className="q-num">Q{idx + 1}</span>
                  <div className="q-card-actions">
                    <span className="q-marks">+{q.marks || 1} / -{q.negativeMarks || 0}</span>
                    <button className="q-btn edit" onClick={() => openEdit(q)}>Edit</button>
                    <button className="q-btn delete" onClick={() => handleDelete(q._id)}>Delete</button>
                  </div>
                </div>
                <p className="q-text">{q.questionText || q.text}</p>
                <div className="q-options">
                  {(q.options || []).map((opt, oi) => {
                    const key = typeof opt === "object" ? opt.key : String.fromCharCode(65 + oi);
                    const text = typeof opt === "object" ? opt.text : opt;
                    const isCorrect = q.correctAnswer === key;
                    return (
                      <div key={oi} className={`q-option ${isCorrect ? "correct" : ""}`}>
                        <span className="q-opt-key">{key}</span>
                        <span>{text}</span>
                        {isCorrect && <span className="correct-tick">✓ Correct</span>}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="q-explanation" style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <SparklesIcon size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowModal(false)}>
            <div className="q-modal">
              <h2>{editQ ? "Edit Question" : "Add Question"}</h2>
              <div className="modal-form">
                <div className="form-row">
                  <label>Question Text *</label>
                  <textarea
                    rows={3}
                    value={form.questionText}
                    onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                    placeholder="Enter your question here..."
                  />
                </div>
                <div className="form-row">
                  <label>Options</label>
                  {form.options.map((opt, i) => (
                    <div key={i} className="option-input-row">
                      <span className="opt-key-label">{opt.key}</span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${opt.key}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="form-row">
                  <label>Correct Answer</label>
                  <select value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}>
                    {form.options.map((opt) => (
                      <option key={opt.key} value={opt.key}>{opt.key}: {opt.text || "(empty)"}</option>
                    ))}
                  </select>
                </div>
                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Marks (correct)</label>
                    <input type="number" min="0" step="0.5" value={form.marks} onChange={(e) => setForm({ ...form, marks: +e.target.value })} />
                  </div>
                  <div className="form-row">
                    <label>Negative Marks</label>
                    <input type="number" min="0" step="0.25" value={form.negativeMarks} onChange={(e) => setForm({ ...form, negativeMarks: +e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <label>Explanation (optional)</label>
                  <textarea
                    rows={2}
                    value={form.explanation}
                    onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                    placeholder="Explain why the correct answer is right..."
                  />
                </div>
              </div>
              <div className="modal-btns">
                <button className="btn-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-modal-save" onClick={handleSubmit} disabled={submitting || !form.questionText.trim()}>
                  {submitting ? "Saving..." : editQ ? "Update" : "Add Question"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default TeacherQuestions;
