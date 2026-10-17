import { useEffect, useState, useMemo } from "react";
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
  SparklesIcon,
  EditIcon,
  TrashIcon,
  CodeIcon,
  LayersIcon,
  PlusIcon,
  CpuIcon,
  CheckIcon
} from "../../components/common/Icons.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";
import "./TeacherQuestions.css";

const PRESET_SECTIONS = [
  { name: "General", icon: BookOpenIcon, desc: "Multiple-choice & aptitude" },
  { name: "Coding", icon: CodeIcon, desc: "Programming & algorithmic questions" },
  { name: "Aptitude", icon: BookOpenIcon, desc: "Quantitative & logical reasoning" },
  { name: "Technical", icon: CpuIcon, desc: "Core technical concepts & theory" }
];

const getSectionIcon = (secName = "") => {
  const lower = secName.toLowerCase();
  if (lower.includes("code") || lower.includes("coding") || lower.includes("program")) return CodeIcon;
  if (lower.includes("tech") || lower.includes("core") || lower.includes("system")) return CpuIcon;
  if (lower.includes("general") || lower.includes("aptitude") || lower.includes("verbal")) return BookOpenIcon;
  return LayersIcon;
};

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Section State
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("all");
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionInput, setNewSectionInput] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  const [form, setForm] = useState({
    questionText: "",
    section: "General",
    customSection: "",
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
      setError(err.response?.data?.message || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  // Available sections
  const availableSections = useMemo(() => {
    const list = ["General", "Coding"];
    if (test?.sections && Array.isArray(test.sections)) {
      test.sections.forEach((s) => {
        if (s && s.trim() && !list.includes(s.trim())) {
          list.push(s.trim());
        }
      });
    }
    questions.forEach((q) => {
      const s = q.section?.trim();
      if (s && !list.includes(s)) {
        list.push(s);
      }
    });
    return list;
  }, [test, questions]);

  // Section summary statistics
  const sectionStats = useMemo(() => {
    const stats = {};
    availableSections.forEach((s) => {
      stats[s] = { count: 0, marks: 0 };
    });
    questions.forEach((q) => {
      const s = q.section?.trim() || "General";
      if (!stats[s]) {
        stats[s] = { count: 0, marks: 0 };
      }
      stats[s].count += 1;
      stats[s].marks += Number(q.marks) || 1;
    });
    return stats;
  }, [availableSections, questions]);

  const resetForm = (targetSection = "General") =>
    setForm({
      questionText: "",
      section: targetSection,
      customSection: "",
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

  const openCreate = (preselectedSection = null) => {
    setEditQ(null);
    const sec = preselectedSection || (selectedSectionFilter !== "all" ? selectedSectionFilter : "General");
    resetForm(sec);
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditQ(q);
    const opts = (q.options || []).map((o, i) =>
      typeof o === "object" ? o : { key: String.fromCharCode(65 + i), text: o }
    );
    const currentSec = q.section?.trim() || "General";
    const isCustom = !availableSections.includes(currentSec);

    setForm({
      questionText: q.questionText || q.text || "",
      section: isCustom ? "__custom__" : currentSec,
      customSection: isCustom ? currentSec : "",
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

  const handleCreateSection = async (e) => {
    if (e) e.preventDefault();
    const name = newSectionInput.trim();
    if (!name) {
      setSectionError("Please enter a section name.");
      return;
    }
    if (availableSections.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setSectionError("A section with this name already exists.");
      return;
    }

    try {
      setSavingSection(true);
      const updatedSections = [...availableSections, name];
      await api.put(`/tests/${testId}`, { sections: updatedSections });
      setTest((prev) => (prev ? { ...prev, sections: updatedSections } : prev));
      setSelectedSectionFilter(name);
      setShowAddSectionModal(false);
      setNewSectionInput("");
      setSectionError("");
    } catch (err) {
      setSectionError(err.response?.data?.message || "Failed to create section.");
    } finally {
      setSavingSection(false);
    }
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

    let finalSection = form.section;
    if (form.section === "__custom__") {
      if (!form.customSection.trim()) {
        alert("Please enter the custom section name.");
        return;
      }
      finalSection = form.customSection.trim();
    }

    try {
      setSubmitting(true);
      const payload = {
        questionText: form.questionText.trim(),
        options: form.options,
        correctAnswer: form.correctAnswer,
        marks: Number(form.marks) || 1,
        negativeMarks: Number(form.negativeMarks) || 0,
        explanation: form.explanation.trim(),
        section: finalSection || "General",
        testId
      };

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/questions/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchData();
    } catch {
      alert("Failed to delete question.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const updateOption = (idx, value) => {
    const opts = [...form.options];
    opts[idx] = { ...opts[idx], text: value };
    setForm({ ...form, options: opts });
  };

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (selectedSectionFilter === "all") return questions;
    return questions.filter((q) => (q.section?.trim() || "General") === selectedSectionFilter);
  }, [questions, selectedSectionFilter]);

  // Questions grouped by section
  const groupedQuestions = useMemo(() => {
    const map = new Map();
    availableSections.forEach((sec) => map.set(sec, []));
    questions.forEach((q) => {
      const sec = q.section?.trim() || "General";
      if (!map.has(sec)) {
        map.set(sec, []);
      }
      map.get(sec).push(q);
    });
    return Array.from(map.entries()).map(([sectionName, qs]) => ({
      sectionName,
      questions: qs,
      totalMarks: qs.reduce((acc, curr) => acc + (Number(curr.marks) || 1), 0)
    }));
  }, [availableSections, questions]);

  return (
    <DashboardLayout title="Question Manager">
      <div className="questions-page">
        {/* Test Header */}
        <div className="qp-header">
          <button className="btn-back-q" onClick={() => navigate(-1)}>
            ← Back to Tests
          </button>
          {test && (
            <div className="qp-test-info">
              <div>
                <h2>{test.title}</h2>
                <div className="qp-meta">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <FileTextIcon size={14} /> {questions.length} questions
                  </span>
                  {test.subject && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <BookOpenIcon size={14} /> {test.subject}
                    </span>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <ClockIcon size={14} /> {test.duration} min
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <AwardIcon size={14} /> {test.totalMarks} marks
                  </span>
                  <span className={`status-chip ${test.status}`}>{test.status}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className="btn-add-section-toolbar"
                  onClick={() => setShowAddSectionModal(true)}
                  title="Create custom section for this test"
                >
                  <PlusIcon size={15} />
                  <span>New Section</span>
                </button>
                <button className="btn-add-q" onClick={() => openCreate()}>
                  <PlusIcon size={16} />
                  <span>Add Question</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section Filter Bar */}
        {!loading && !error && (
          <div className="tq-sections-bar">
            <div className="tq-sections-scroll">
              <button
                className={`tq-sec-tab ${selectedSectionFilter === "all" ? "active" : ""}`}
                onClick={() => setSelectedSectionFilter("all")}
              >
                <LayersIcon size={15} />
                <span>All Sections</span>
                <span className="tq-sec-badge">{questions.length}</span>
              </button>

              {availableSections.map((secName) => {
                const SecIcon = getSectionIcon(secName);
                const count = sectionStats[secName]?.count || 0;
                return (
                  <button
                    key={secName}
                    className={`tq-sec-tab ${selectedSectionFilter === secName ? "active" : ""}`}
                    onClick={() => setSelectedSectionFilter(secName)}
                  >
                    <SecIcon size={15} />
                    <span>{secName}</span>
                    <span className="tq-sec-badge">{count} Qs</span>
                  </button>
                );
              })}

              <button
                className="tq-sec-tab add-new"
                onClick={() => setShowAddSectionModal(true)}
                title="Create a new section"
              >
                <PlusIcon size={14} />
                <span>+ Section</span>
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="q-state">
            <div className="spinner"></div>
            <p>Loading questions...</p>
          </div>
        )}

        {!loading && error && (
          <div className="q-state">
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangleIcon size={28} />
            </span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="q-state">
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <HelpCircleIcon size={28} />
            </span>
            <h3>No questions in this test yet</h3>
            <p>Organize this examination by adding questions under Coding, General Aptitude, or custom sections.</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button className="btn-add-section-toolbar" onClick={() => setShowAddSectionModal(true)}>
                <PlusIcon size={15} />
                <span>Create Section</span>
              </button>
              <button className="btn-add-q" onClick={() => openCreate("General")}>
                <PlusIcon size={16} />
                <span>Add First Question</span>
              </button>
            </div>
          </div>
        )}

        {/* Questions List */}
        {!loading && !error && questions.length > 0 && (
          <div className="questions-list">
            {selectedSectionFilter === "all" ? (
              // Grouped Section Display
              groupedQuestions.map((group) => {
                const SecIcon = getSectionIcon(group.sectionName);
                if (group.questions.length === 0) return null;

                return (
                  <div className="tq-section-block" key={group.sectionName}>
                    <div className="tq-section-block-header">
                      <div className="tq-section-title-wrap">
                        <span className="tq-section-icon-box">
                          <SecIcon size={18} />
                        </span>
                        <div>
                          <h3 className="tq-section-title">{group.sectionName} Section</h3>
                          <span className="tq-section-meta">
                            {group.questions.length} Question{group.questions.length > 1 ? "s" : ""} • {group.totalMarks} Marks
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn-add-in-section"
                        onClick={() => openCreate(group.sectionName)}
                        title={`Add question to ${group.sectionName}`}
                      >
                        <PlusIcon size={14} />
                        <span>Add Question</span>
                      </button>
                    </div>

                    <div className="tq-section-cards-grid">
                      {group.questions.map((q, idx) => {
                        const globalIdx = questions.findIndex((x) => x._id === q._id);
                        return renderQuestionCard(q, globalIdx !== -1 ? globalIdx : idx);
                      })}
                    </div>
                  </div>
                );
              })
            ) : filteredQuestions.length === 0 ? (
              <div className="q-state" style={{ padding: "3rem 1.5rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <HelpCircleIcon size={26} />
                </span>
                <h3>No questions in {selectedSectionFilter} section</h3>
                <p>Add the first question to this section.</p>
                <button className="btn-add-q" onClick={() => openCreate(selectedSectionFilter)}>
                  <PlusIcon size={15} />
                  <span>Add Question to {selectedSectionFilter}</span>
                </button>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => renderQuestionCard(q, idx))
            )}
          </div>
        )}

        {/* Question Modal */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target.classList.contains("modal-overlay") && setShowModal(false)}
          >
            <div className="q-modal" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem"
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1.35rem", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <HelpCircleIcon size={22} color="#0284c7" />
                  <span>{editQ ? "Edit Question" : "Add Question"}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-form">
                {/* Section Selection */}
                <div className="form-row">
                  <label>Section *</label>
                  <div className="tq-section-chips-row">
                    {availableSections.map((secName) => {
                      const SecIcon = getSectionIcon(secName);
                      const isSelected = form.section === secName;
                      return (
                        <button
                          key={secName}
                          type="button"
                          className={`tq-section-chip ${isSelected ? "selected" : ""}`}
                          onClick={() => setForm({ ...form, section: secName, customSection: "" })}
                        >
                          <SecIcon size={14} />
                          <span>{secName}</span>
                          {isSelected && <CheckIcon size={13} />}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className={`tq-section-chip ${form.section === "__custom__" ? "selected" : ""}`}
                      onClick={() => setForm({ ...form, section: "__custom__" })}
                    >
                      <PlusIcon size={14} />
                      <span>+ Custom Section</span>
                    </button>
                  </div>

                  {form.section === "__custom__" && (
                    <div style={{ marginTop: "8px" }}>
                      <input
                        type="text"
                        placeholder="Type custom section name (e.g. Data Structures, SQL)..."
                        value={form.customSection}
                        onChange={(e) => setForm({ ...form, customSection: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1.5px solid #0284c7"
                        }}
                      />
                    </div>
                  )}

                  {(form.section === "Coding" || form.customSection.toLowerCase().includes("code")) && (
                    <div className="tq-coding-tip-banner">
                      <CodeIcon size={16} />
                      <div>
                        <strong>Coding Section:</strong> Code blocks and algorithm specifications are displayed with high-clarity developer monospace formatting.
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <label>Question Statement *</label>
                  <textarea
                    rows={4}
                    value={form.questionText}
                    onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                    placeholder="Enter the question clearly..."
                    style={{
                      fontFamily: (form.section === "Coding" || form.questionText.includes("function") || form.questionText.includes("class")) ? "'JetBrains Mono', 'Fira Code', monospace" : "inherit"
                    }}
                  />
                </div>

                <div className="form-row">
                  <label>Options & Correct Answer *</label>
                  <div className="tq-options-builder">
                    {form.options.map((opt, idx) => (
                      <div key={idx} className="tq-opt-input-row">
                        <span className="tq-opt-key">{opt.key}</span>
                        <input
                          type="text"
                          placeholder={`Option ${opt.key}`}
                          value={opt.text}
                          onChange={(e) => updateOption(idx, e.target.value)}
                        />
                        <input
                          type="radio"
                          name="teacherCorrectAnswer"
                          id={`t-radio-${opt.key}`}
                          checked={form.correctAnswer === opt.key}
                          onChange={() => setForm({ ...form, correctAnswer: opt.key })}
                        />
                        <label htmlFor={`t-radio-${opt.key}`} className="tq-radio-label">
                          Correct
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Marks for Correct (+)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.marks}
                      onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-row">
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

                <div className="form-row">
                  <label>Explanation & Solution (Optional)</label>
                  <input
                    type="text"
                    value={form.explanation}
                    onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                    placeholder="Brief explanation for the answer"
                  />
                </div>

                <div className="modal-actions">
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

        {/* Add Section Modal */}
        {showAddSectionModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target.classList.contains("modal-overlay") && setShowAddSectionModal(false)}
          >
            <div className="q-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <LayersIcon size={20} color="#0284c7" />
                  <span>Create Test Section</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                >
                  ✕
                </button>
              </div>

              {sectionError && (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "12px", border: "1px solid #fecaca" }}>
                  ⚠️ {sectionError}
                </div>
              )}

              <form onSubmit={handleCreateSection}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1e293b", display: "block", marginBottom: "6px" }}>
                      Section Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Coding, Aptitude, Technical..."
                      value={newSectionInput}
                      onChange={(e) => {
                        setNewSectionInput(e.target.value);
                        setSectionError("");
                      }}
                      autoFocus
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.95rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "6px" }}>
                      Quick Presets:
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {PRESET_SECTIONS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setNewSectionInput(p.name)}
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "9999px",
                            padding: "4px 10px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "#475569",
                            cursor: "pointer"
                          }}
                        >
                          + {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowAddSectionModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={savingSection}
                  >
                    {savingSection ? "Creating..." : "Create Section"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Centered Modern Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Assessment Question?"
          message="Are you sure you want to permanently delete this question from the examination bank?"
          itemName={deleteTarget ? (deleteTarget.questionText || deleteTarget.text || "Selected Question") : ""}
          confirmText="Yes, Delete Question"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
        />
      </div>
    </DashboardLayout>
  );

  // Helper renderer for Question Card with Enhanced Edit & Delete UI
  function renderQuestionCard(q, idx) {
    const secName = q.section?.trim() || "General";
    const SecIcon = getSectionIcon(secName);
    const isCoding = secName.toLowerCase().includes("code");

    return (
      <div className={`q-card ${isCoding ? "is-coding-card" : ""}`} key={q._id}>
        <div className="q-card-top">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className="q-num">Question {idx + 1}</span>
            <span className={`tq-section-pill ${isCoding ? "coding" : ""}`}>
              <SecIcon size={13} />
              <span>{secName}</span>
            </span>
          </div>

          <div className="q-card-actions">
            <span className="q-marks">
              +{q.marks || 1} / -{q.negativeMarks || 0} marks
            </span>

            {/* Redesigned Edit Button */}
            <button
              type="button"
              className="tq-btn-edit"
              onClick={() => openEdit(q)}
              title="Edit Question"
            >
              <EditIcon size={14} />
              <span>Edit</span>
            </button>

            {/* Redesigned Delete Button */}
            <button
              type="button"
              className="tq-btn-delete"
              onClick={() => setDeleteTarget(q)}
              title="Delete Question"
            >
              <TrashIcon size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <p className={`q-text ${isCoding ? "code-text" : ""}`}>
          {q.questionText || q.text}
        </p>

        <div className="q-options">
          {(q.options || []).map((opt, oi) => {
            const key = typeof opt === "object" ? opt.key : String.fromCharCode(65 + oi);
            const text = typeof opt === "object" ? opt.text : opt;
            const isCorrect = q.correctAnswer === key;
            return (
              <div key={oi} className={`q-option ${isCorrect ? "correct" : ""}`}>
                <span className="q-opt-key">{key}</span>
                <span style={{ flex: 1 }}>{text}</span>
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
    );
  }
};

export default TeacherQuestions;
