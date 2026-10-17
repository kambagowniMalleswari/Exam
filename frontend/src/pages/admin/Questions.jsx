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
import "./Questions.css";

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Section CRUD State
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("all");
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionInput, setNewSectionInput] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  // Section Rename State
  const [showRenameSectionModal, setShowRenameSectionModal] = useState(false);
  const [sectionToRename, setSectionToRename] = useState("");
  const [renamedSectionInput, setRenamedSectionInput] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renamingLoading, setRenamingLoading] = useState(false);

  // Section Delete State
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState("");
  const [deleteQuestionsOption, setDeleteQuestionsOption] = useState("reassign"); // "reassign" or "delete"
  const [deletingSectionLoading, setDeletingSectionLoading] = useState(false);

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
      setError(err.response?.data?.message || "Failed to load test questions.");
    } finally {
      setLoading(false);
    }
  };

  // Dynamically resolve all available sections for this test
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

const DEFAULT_STARTER_CODE_JS = `function solution(input) {
  // Write your code here
  return input * 2;
}`;

const DEFAULT_STARTER_CODE_PY = `def solution(input):
    # Write your code here
    return input * 2`;

const CODING_PRESETS = [
  {
    name: "Double a Number",
    statement: "Write a function `solution(n)` that takes a number `n` and returns its double (`n * 2`).",
    language: "javascript",
    starter: `function solution(n) {\n  // Write your code here\n  return n * 2;\n}`,
    testCases: [
      { input: "5", expectedOutput: "10", isSample: true, explanation: "5 * 2 = 10" },
      { input: "12", expectedOutput: "24", isSample: true, explanation: "12 * 2 = 24" },
      { input: "0", expectedOutput: "0", isSample: false, explanation: "Edge case: 0" },
      { input: "-4", expectedOutput: "-8", isSample: false, explanation: "Negative number" }
    ]
  },
  {
    name: "Reverse a String",
    statement: "Write a function `solution(str)` that takes a string and returns it reversed.",
    language: "javascript",
    starter: `function solution(str) {\n  // Write your code here\n  return str.split('').reverse().join('');\n}`,
    testCases: [
      { input: '"hello"', expectedOutput: '"olleh"', isSample: true, explanation: 'Reversed hello is olleh' },
      { input: '"world"', expectedOutput: '"dlrow"', isSample: true, explanation: 'Reversed world is dlrow' },
      { input: '"racecar"', expectedOutput: '"racecar"', isSample: false, explanation: 'Palindrome string' }
    ]
  },
  {
    name: "Array Sum",
    statement: "Write a function `solution(arr)` that computes and returns the sum of all elements in the given array.",
    language: "javascript",
    starter: `function solution(arr) {\n  // Write your code here\n  return arr.reduce((sum, x) => sum + x, 0);\n}`,
    testCases: [
      { input: "[1, 2, 3, 4]", expectedOutput: "10", isSample: true, explanation: "1+2+3+4 = 10" },
      { input: "[5, 10, 15]", expectedOutput: "30", isSample: true, explanation: "5+10+15 = 30" },
      { input: "[]", expectedOutput: "0", isSample: false, explanation: "Empty array sum is 0" }
    ]
  }
];

  const resetForm = (targetSection = "General") => {
    const isCodingSec = targetSection.toLowerCase().includes("code");
    setForm({
      questionText: isCodingSec ? "Write a function solution(n) that takes an input and returns its double." : "",
      section: targetSection,
      customSection: "",
      questionType: isCodingSec ? "coding" : "mcq",
      codingLanguage: "javascript",
      starterCode: DEFAULT_STARTER_CODE_JS,
      testCases: [
        { input: "5", expectedOutput: "10", isSample: true, explanation: "5 * 2 = 10" },
        { input: "12", expectedOutput: "24", isSample: true, explanation: "12 * 2 = 24" },
        { input: "100", expectedOutput: "200", isSample: false, explanation: "100 * 2 = 200 (Hidden test case)" }
      ],
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" }
      ],
      correctAnswer: "A",
      marks: isCodingSec ? 5 : 1,
      negativeMarks: 0,
      explanation: ""
    });
  };

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
    const isCoding = q.questionType === "coding" || (Array.isArray(q.testCases) && q.testCases.length > 0);

    setForm({
      questionText: q.questionText || q.text || "",
      section: isCustom ? "__custom__" : currentSec,
      customSection: isCustom ? currentSec : "",
      questionType: isCoding ? "coding" : "mcq",
      codingLanguage: q.codingLanguage || "javascript",
      starterCode: q.starterCode || (q.codingLanguage === "python" ? DEFAULT_STARTER_CODE_PY : DEFAULT_STARTER_CODE_JS),
      testCases: Array.isArray(q.testCases) && q.testCases.length > 0 ? q.testCases : [
        { input: "5", expectedOutput: "10", isSample: true, explanation: "" },
        { input: "12", expectedOutput: "24", isSample: true, explanation: "" }
      ],
      options: opts.length === 4 ? opts : [
        { key: "A", text: opts[0]?.text || "" },
        { key: "B", text: opts[1]?.text || "" },
        { key: "C", text: opts[2]?.text || "" },
        { key: "D", text: opts[3]?.text || "" }
      ],
      correctAnswer: q.correctAnswer || "A",
      marks: q.marks || (isCoding ? 5 : 1),
      negativeMarks: q.negativeMarks || 0,
      explanation: q.explanation || ""
    });
    setShowModal(true);
  };

  const addTestCase = () => {
    setForm((prev) => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        { input: "", expectedOutput: "", isSample: true, explanation: "" }
      ]
    }));
  };

  const updateTestCase = (idx, field, value) => {
    setForm((prev) => {
      const updated = [...prev.testCases];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, testCases: updated };
    });
  };

  const deleteTestCase = (idx) => {
    setForm((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== idx)
    }));
  };

  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      questionText: preset.statement,
      questionType: "coding",
      codingLanguage: preset.language,
      starterCode: preset.starter,
      testCases: preset.testCases
    }));
  };

  // Section CRUD 1: CREATE Section
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
      try {
        await api.post(`/tests/${testId}/sections`, { name });
      } catch {
        const updatedSections = [...availableSections, name];
        await api.put(`/tests/${testId}`, { sections: updatedSections });
      }

      setTest((prev) => ({
        ...prev,
        sections: [...(prev?.sections || availableSections), name]
      }));
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

  // Section CRUD 2: RENAME Section (e.g. section-1 -> section-4)
  const openRenameSectionModal = (secName, e) => {
    if (e) e.stopPropagation();
    setSectionToRename(secName);
    setRenamedSectionInput(secName);
    setRenameError("");
    setShowRenameSectionModal(true);
  };

  const handleRenameSectionSubmit = async (e) => {
    if (e) e.preventDefault();
    const oldName = sectionToRename.trim();
    const newName = renamedSectionInput.trim();

    if (!newName) {
      setRenameError("Section name cannot be empty.");
      return;
    }
    if (oldName.toLowerCase() === newName.toLowerCase()) {
      setShowRenameSectionModal(false);
      return;
    }
    if (availableSections.some((s) => s.toLowerCase() === newName.toLowerCase() && s.toLowerCase() !== oldName.toLowerCase())) {
      setRenameError(`A section named "${newName}" already exists.`);
      return;
    }

    try {
      setRenamingLoading(true);
      // Try dedicated backend endpoint
      try {
        await api.put(`/tests/${testId}/sections/rename`, {
          oldName,
          newName
        });
      } catch {
        // Fallback: update test sections + matching questions
        const updatedSections = availableSections.map((s) => (s === oldName ? newName : s));
        await api.put(`/tests/${testId}`, { sections: updatedSections });
        const matching = questions.filter((q) => (q.section?.trim() || "General") === oldName);
        await Promise.all(
          matching.map((q) => api.put(`/questions/${q._id}`, { section: newName }))
        );
      }

      // Update state in memory
      setTest((prev) => ({
        ...prev,
        sections: (prev?.sections || availableSections).map((s) => (s === oldName ? newName : s))
      }));
      setQuestions((prev) =>
        prev.map((q) => ((q.section?.trim() || "General") === oldName ? { ...q, section: newName } : q))
      );
      if (selectedSectionFilter === oldName) {
        setSelectedSectionFilter(newName);
      }

      setShowRenameSectionModal(false);
      setSectionToRename("");
      setRenamedSectionInput("");
    } catch (err) {
      setRenameError(err.response?.data?.message || "Failed to rename section.");
    } finally {
      setRenamingLoading(false);
    }
  };

  // Section CRUD 3: DELETE Section
  const openDeleteSectionModal = (secName, e) => {
    if (e) e.stopPropagation();
    setSectionToDelete(secName);
    setDeleteQuestionsOption("reassign");
    setShowDeleteSectionModal(true);
  };

  const handleDeleteSectionSubmit = async () => {
    if (!sectionToDelete) return;
    const secName = sectionToDelete.trim();
    const deleteQuestions = deleteQuestionsOption === "delete";

    try {
      setDeletingSectionLoading(true);
      // Try dedicated endpoint
      try {
        await api.delete(`/tests/${testId}/sections`, {
          data: { name: secName, deleteQuestions }
        });
      } catch {
        // Fallback: update test sections + reassign or delete questions
        const updatedSections = availableSections.filter((s) => s !== secName);
        await api.put(`/tests/${testId}`, {
          sections: updatedSections.length ? updatedSections : ["General"]
        });

        const matching = questions.filter((q) => (q.section?.trim() || "General") === secName);
        if (deleteQuestions) {
          await Promise.all(matching.map((q) => api.delete(`/questions/${q._id}`)));
        } else {
          await Promise.all(matching.map((q) => api.put(`/questions/${q._id}`, { section: "General" })));
        }
      }

      // Update in-memory state
      setTest((prev) => ({
        ...prev,
        sections: (prev?.sections || availableSections).filter((s) => s !== secName)
      }));

      if (deleteQuestions) {
        setQuestions((prev) => prev.filter((q) => (q.section?.trim() || "General") !== secName));
      } else {
        setQuestions((prev) =>
          prev.map((q) =>
            (q.section?.trim() || "General") === secName ? { ...q, section: "General" } : q
          )
        );
      }

      if (selectedSectionFilter === secName) {
        setSelectedSectionFilter("all");
      }

      setShowDeleteSectionModal(false);
      setSectionToDelete("");
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete section.");
    } finally {
      setDeletingSectionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.questionText.trim()) {
      alert("Question statement is required.");
      return;
    }

    const isCoding = form.questionType === "coding";

    if (isCoding) {
      if (!form.testCases || form.testCases.length === 0) {
        alert("Please provide at least 1 test case for automated evaluation.");
        return;
      }
      const missingOutput = form.testCases.some((tc) => !tc.expectedOutput || !tc.expectedOutput.trim());
      if (missingOutput) {
        alert("All test cases must have an Expected Output specified.");
        return;
      }
    } else {
      const emptyOpt = form.options.some((o) => !o.text.trim());
      if (emptyOpt) {
        alert("All 4 options must be filled for multiple-choice questions.");
        return;
      }
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
        questionType: isCoding ? "coding" : "mcq",
        codingLanguage: form.codingLanguage || "javascript",
        starterCode: form.starterCode || "",
        testCases: form.testCases || [],
        options: isCoding ? form.options : form.options,
        correctAnswer: isCoding ? "Passes Test Cases" : form.correctAnswer,
        marks: Number(form.marks) || (isCoding ? 5 : 1),
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
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete question.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const updateOption = (idx, value) => {
    const opts = [...form.options];
    opts[idx] = { ...opts[idx], text: value };
    setForm({ ...form, options: opts });
  };

  // Filtered questions based on selected section tab
  const filteredQuestions = useMemo(() => {
    if (selectedSectionFilter === "all") return questions;
    return questions.filter((q) => (q.section?.trim() || "General") === selectedSectionFilter);
  }, [questions, selectedSectionFilter]);

  // Questions grouped by section for structured view
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
                  <span className="aq-tag" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <FileTextIcon size={14} /> {questions.length} Questions
                  </span>
                  {test.subject && (
                    <span className="aq-tag" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <BookOpenIcon size={14} /> {test.subject}
                    </span>
                  )}
                  <span className="aq-tag" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <ClockIcon size={14} /> {test.duration} min
                  </span>
                  <span className="aq-tag" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <AwardIcon size={14} /> {test.totalMarks} Marks
                  </span>
                  <span className={`status-pill ${test.status}`}>{test.status}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className="btn-add-section-toolbar"
                  onClick={() => setShowAddSectionModal(true)}
                  title="Create new section (e.g. section-1, Coding)"
                >
                  <PlusIcon size={15} />
                  <span>New Section</span>
                </button>
                <button className="btn-add-question" onClick={() => openCreate()}>
                  <PlusIcon size={16} />
                  <span>Add Question</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sections Navigation & Filter Tabs with Inline Edit & Delete */}
        {!loading && !error && (
          <div className="aq-sections-bar">
            <div className="aq-sections-scroll">
              <button
                className={`aq-sec-tab ${selectedSectionFilter === "all" ? "active" : ""}`}
                onClick={() => setSelectedSectionFilter("all")}
              >
                <LayersIcon size={15} />
                <span>All Sections</span>
                <span className="aq-sec-badge">{questions.length}</span>
              </button>

              {availableSections.map((secName) => {
                const SecIcon = getSectionIcon(secName);
                const count = sectionStats[secName]?.count || 0;
                const isSelected = selectedSectionFilter === secName;

                return (
                  <div
                    key={secName}
                    className={`aq-sec-tab-wrapper ${isSelected ? "selected-wrap" : ""}`}
                  >
                    <button
                      className={`aq-sec-tab ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedSectionFilter(secName)}
                      title={`Filter by ${secName} (${count} questions)`}
                    >
                      <SecIcon size={15} />
                      <span>{secName}</span>
                      <span className="aq-sec-badge">{count} Qs</span>
                    </button>

                    {/* Quick Edit & Delete icons for section */}
                    <div className="aq-sec-quick-actions">
                      <button
                        type="button"
                        className="aq-sec-mini-btn edit"
                        onClick={(e) => openRenameSectionModal(secName, e)}
                        title={`Rename section "${secName}"`}
                      >
                        <EditIcon size={12} />
                      </button>
                      <button
                        type="button"
                        className="aq-sec-mini-btn delete"
                        onClick={(e) => openDeleteSectionModal(secName, e)}
                        title={`Delete section "${secName}"`}
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                className="aq-sec-tab add-new"
                onClick={() => setShowAddSectionModal(true)}
                title="Create a new section like section-1, Coding, Technical, etc."
              >
                <PlusIcon size={14} />
                <span>+ Section</span>
              </button>
            </div>
          </div>
        )}

        {/* State */}
        {loading && (
          <div className="aq-state">
            <div className="spinner"></div>
            <p>Loading questions...</p>
          </div>
        )}

        {!loading && error && (
          <div className="aq-state">
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangleIcon size={28} />
            </span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="aq-state">
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <HelpCircleIcon size={28} />
            </span>
            <h3>No questions in this test yet</h3>
            <p>Add sections like section-1, Coding, General Aptitude, or Technical to organize your test questions.</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button className="btn-add-section-toolbar" onClick={() => setShowAddSectionModal(true)}>
                <PlusIcon size={15} />
                <span>Create Section</span>
              </button>
              <button className="btn-add-question" onClick={() => openCreate("General")}>
                <PlusIcon size={16} />
                <span>Add First Question</span>
              </button>
            </div>
          </div>
        )}

        {/* Questions List (Grouped or Filtered View) */}
        {!loading && !error && questions.length > 0 && (
          <div className="aq-list">
            {selectedSectionFilter === "all" ? (
              // Grouped Section Display
              groupedQuestions.map((group) => {
                const SecIcon = getSectionIcon(group.sectionName);
                if (group.questions.length === 0) return null;

                return (
                  <div className="aq-section-block" key={group.sectionName}>
                    <div className="aq-section-block-header">
                      <div className="aq-section-title-wrap">
                        <span className="aq-section-icon-box">
                          <SecIcon size={18} />
                        </span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h3 className="aq-section-title">{group.sectionName}</h3>
                          </div>
                          <span className="aq-section-meta">
                            {group.questions.length} Question{group.questions.length > 1 ? "s" : ""} • {group.totalMarks} Total Marks
                          </span>
                        </div>
                      </div>

                      {/* Section CRUD Actions in Header */}
                      <div className="aq-section-header-actions">
                        <button
                          className="btn-sec-action rename"
                          onClick={() => openRenameSectionModal(group.sectionName)}
                          title={`Rename section "${group.sectionName}"`}
                        >
                          <EditIcon size={13} />
                          <span>Rename</span>
                        </button>

                        <button
                          className="btn-sec-action delete"
                          onClick={() => openDeleteSectionModal(group.sectionName)}
                          title={`Delete section "${group.sectionName}"`}
                        >
                          <TrashIcon size={13} />
                          <span>Delete</span>
                        </button>

                        <button
                          className="btn-add-in-section"
                          onClick={() => openCreate(group.sectionName)}
                          title={`Add question to ${group.sectionName}`}
                        >
                          <PlusIcon size={14} />
                          <span>Add Question</span>
                        </button>
                      </div>
                    </div>

                    <div className="aq-section-cards-grid">
                      {group.questions.map((q, idx) => {
                        const globalIdx = questions.findIndex((x) => x._id === q._id);
                        return renderQuestionCard(q, globalIdx !== -1 ? globalIdx : idx);
                      })}
                    </div>
                  </div>
                );
              })
            ) : filteredQuestions.length === 0 ? (
              <div className="aq-state" style={{ padding: "3rem 1.5rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <HelpCircleIcon size={26} />
                </span>
                <h3>No questions in {selectedSectionFilter} section</h3>
                <p>Add the first question to this section or rename/delete it.</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button
                    className="btn-sec-action rename"
                    onClick={() => openRenameSectionModal(selectedSectionFilter)}
                  >
                    <EditIcon size={13} />
                    <span>Rename Section</span>
                  </button>
                  <button
                    className="btn-sec-action delete"
                    onClick={() => openDeleteSectionModal(selectedSectionFilter)}
                  >
                    <TrashIcon size={13} />
                    <span>Delete Section</span>
                  </button>
                  <button
                    className="btn-add-question"
                    onClick={() => openCreate(selectedSectionFilter)}
                  >
                    <PlusIcon size={15} />
                    <span>Add Question to {selectedSectionFilter}</span>
                  </button>
                </div>
              </div>
            ) : (
              // Single Section View
              filteredQuestions.map((q, idx) => renderQuestionCard(q, idx))
            )}
          </div>
        )}

        {/* Question Modal (Add / Edit) */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target.classList.contains("modal-overlay") && setShowModal(false)}
          >
            <div className="aq-modal" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem"
                }}
              >
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
                    color: "#64748b"
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="aq-modal-form">
                {/* Section Selection */}
                <div className="aq-form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Test Section *</label>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      Select section or type a custom section
                    </span>
                  </div>

                  <div className="aq-section-chips-row">
                    {availableSections.map((secName) => {
                      const SecIcon = getSectionIcon(secName);
                      const isSelected = form.section === secName;
                      return (
                        <button
                          key={secName}
                          type="button"
                          className={`aq-section-chip ${isSelected ? "selected" : ""}`}
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
                      className={`aq-section-chip ${form.section === "__custom__" ? "selected" : ""}`}
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
                        placeholder="Type custom section name (e.g. section-1, Data Structures, SQL)..."
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

                  {/* Coding Section Tip */}
                  {(form.section === "Coding" || form.customSection.toLowerCase().includes("code")) && (
                    <div className="aq-coding-tip-banner">
                      <CodeIcon size={16} />
                      <div>
                        <strong>Coding Section Question:</strong> Code snippets, monospace indentation, and logic specifications will be formatted with high-readability developer styling.
                      </div>
                    </div>
                  )}
                </div>

                <div className="aq-form-group">
                  <label>Question Statement *</label>
                  <textarea
                    rows={4}
                    value={form.questionText}
                    onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                    placeholder="Enter the question clearly (code snippets or problem statements supported)..."
                    style={{
                      fontFamily: (form.section === "Coding" || form.questionText.includes("function") || form.questionText.includes("class")) ? "'JetBrains Mono', 'Fira Code', monospace" : "inherit"
                    }}
                  />
                </div>

                {/* Question Type: MCQ vs Coding */}
                <div className="aq-form-group">
                  <label>Question Type *</label>
                  <div className="aq-qtype-toggle">
                    <button
                      type="button"
                      className={`aq-qtype-btn ${form.questionType === "mcq" ? "active" : ""}`}
                      onClick={() => setForm({ ...form, questionType: "mcq" })}
                    >
                      <LayersIcon size={15} />
                      <span>Multiple Choice (MCQ)</span>
                    </button>
                    <button
                      type="button"
                      className={`aq-qtype-btn ${form.questionType === "coding" ? "active" : ""}`}
                      onClick={() => setForm({ ...form, questionType: "coding" })}
                    >
                      <CodeIcon size={15} />
                      <span>Coding Question (Live Code & Automated Evaluation)</span>
                    </button>
                  </div>
                </div>

                {/* CODING QUESTION BUILDER */}
                {form.questionType === "coding" && (
                  <div className="aq-coding-builder-box">
                    {/* Quick Presets */}
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                        ⚡ Quick Coding Problem Presets:
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {CODING_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            className="aq-preset-pill"
                            onClick={() => applyPreset(preset)}
                          >
                            + {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="aq-form-row">
                      <div className="aq-form-group half">
                        <label>Programming Language *</label>
                        <select
                          value={form.codingLanguage}
                          onChange={(e) => {
                            const lang = e.target.value;
                            setForm({
                              ...form,
                              codingLanguage: lang,
                              starterCode: lang === "python" ? DEFAULT_STARTER_CODE_PY : DEFAULT_STARTER_CODE_JS
                            });
                          }}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: "10px",
                            border: "1.5px solid #cbd5e1",
                            fontWeight: 600
                          }}
                        >
                          <option value="javascript">JavaScript (Node.js ES6)</option>
                          <option value="python">Python 3</option>
                        </select>
                      </div>

                      <div className="aq-form-group half">
                        <label>Evaluation Method</label>
                        <div style={{ padding: "9px 12px", background: "#f8fafc", borderRadius: "10px", fontSize: "0.82rem", color: "#0284c7", fontWeight: 700, border: "1px solid #e2e8f0" }}>
                          ✓ Live Sandboxed Test Case Runner
                        </div>
                      </div>
                    </div>

                    {/* Starter Code Editor */}
                    <div className="aq-form-group">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label>Starter / Solution Function Template *</label>
                        <button
                          type="button"
                          onClick={() => setForm({
                            ...form,
                            starterCode: form.codingLanguage === "python" ? DEFAULT_STARTER_CODE_PY : DEFAULT_STARTER_CODE_JS
                          })}
                          style={{ background: "none", border: "none", color: "#0284c7", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          Reset Boilerplate
                        </button>
                      </div>
                      <textarea
                        rows={5}
                        value={form.starterCode}
                        onChange={(e) => setForm({ ...form, starterCode: e.target.value })}
                        placeholder="function solution(input) { ... }"
                        className="aq-code-textarea"
                      />
                      <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                        💡 Candidates will see this code in their code editor when taking the test. The function should accept input and return the result.
                      </span>
                    </div>

                    {/* Test Cases Editor */}
                    <div className="aq-form-group">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <label style={{ margin: 0 }}>Automated Test Cases &amp; Expected Outputs *</label>
                        <button
                          type="button"
                          className="btn-add-tc"
                          onClick={addTestCase}
                        >
                          <PlusIcon size={13} />
                          <span>Add Test Case</span>
                        </button>
                      </div>

                      <div className="aq-tc-list">
                        {form.testCases.map((tc, idx) => (
                          <div key={idx} className="aq-tc-card">
                            <div className="aq-tc-card-header">
                              <span className="aq-tc-num">Test Case #{idx + 1}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <label className="aq-tc-sample-toggle">
                                  <input
                                    type="checkbox"
                                    checked={tc.isSample}
                                    onChange={(e) => updateTestCase(idx, "isSample", e.target.checked)}
                                  />
                                  <span>{tc.isSample ? "Sample (Visible in test)" : "Hidden (Used for scoring)"}</span>
                                </label>
                                {form.testCases.length > 1 && (
                                  <button
                                    type="button"
                                    className="aq-btn-tc-delete"
                                    onClick={() => deleteTestCase(idx)}
                                    title="Delete test case"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="aq-tc-grid">
                              <div>
                                <span className="tc-field-label">Input / Argument:</span>
                                <input
                                  type="text"
                                  placeholder='e.g. 5, or [1,2,3], or "hello"'
                                  value={tc.input}
                                  onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                                  className="aq-tc-input"
                                />
                              </div>
                              <div>
                                <span className="tc-field-label">Expected Output (return value) *:</span>
                                <input
                                  type="text"
                                  placeholder='e.g. 10, or 6, or "olleh"'
                                  value={tc.expectedOutput}
                                  onChange={(e) => updateTestCase(idx, "expectedOutput", e.target.value)}
                                  className="aq-tc-input expected"
                                  required
                                />
                              </div>
                            </div>
                            <div style={{ marginTop: "6px" }}>
                              <input
                                type="text"
                                placeholder="Explanation / note (optional)"
                                value={tc.explanation || ""}
                                onChange={(e) => updateTestCase(idx, "explanation", e.target.value)}
                                style={{ width: "100%", padding: "5px 8px", fontSize: "0.78rem", border: "1px solid #e2e8f0", borderRadius: "6px" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* MCQ OPTIONS BUILDER */}
                {form.questionType !== "coding" && (
                  <div className="aq-options-form">
                    <label>Multiple Choice Options (Mark Correct Answer) *</label>
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
                )}

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
                  <label>Explanation & Solution Guide (Optional)</label>
                  <input
                    type="text"
                    value={form.explanation}
                    onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                    placeholder="Provide reasoning, working, or code logic for the correct answer"
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

        {/* Modal 1: Add Section Modal (CREATE) */}
        {showAddSectionModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target.classList.contains("modal-overlay") && setShowAddSectionModal(false)}
          >
            <div className="aq-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
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
                      placeholder="e.g. section-1, Coding, Aptitude, SQL..."
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
                      Quick Preset Suggestions:
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

        {/* Modal 2: Rename Section Modal (UPDATE e.g. section-1 to section-4) */}
        {showRenameSectionModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target.classList.contains("modal-overlay") && setShowRenameSectionModal(false)}
          >
            <div className="aq-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <EditIcon size={20} color="#0284c7" />
                  <span>Rename Section</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRenameSectionModal(false)}
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

              {renameError && (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "12px", border: "1px solid #fecaca" }}>
                  ⚠️ {renameError}
                </div>
              )}

              <form onSubmit={handleRenameSectionSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>
                      Current Section Name:
                    </label>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", background: "#f1f5f9", padding: "8px 12px", borderRadius: "8px" }}>
                      {sectionToRename}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1e293b", display: "block", marginBottom: "6px" }}>
                      New Section Name * (e.g. section-4)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. section-4, Advanced Coding, Aptitude..."
                      value={renamedSectionInput}
                      onChange={(e) => {
                        setRenamedSectionInput(e.target.value);
                        setRenameError("");
                      }}
                      autoFocus
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #0284c7",
                        fontSize: "0.95rem"
                      }}
                    />
                    <span style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "6px", display: "block" }}>
                      💡 All {sectionStats[sectionToRename]?.count || 0} question(s) currently in &quot;{sectionToRename}&quot; will automatically update to &quot;{renamedSectionInput || "new name"}&quot;.
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowRenameSectionModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={renamingLoading}
                  >
                    {renamingLoading ? "Renaming..." : "Save New Name"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Delete Section Modal (DELETE) */}
        {showDeleteSectionModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target.classList.contains("modal-overlay") && setShowDeleteSectionModal(false)}
          >
            <div className="aq-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#e11d48", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <TrashIcon size={20} color="#e11d48" />
                  <span>Delete Section</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDeleteSectionModal(false)}
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

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#334155", lineHeight: "1.5" }}>
                  Are you sure you want to remove the section <strong>&quot;{sectionToDelete}&quot;</strong>?
                </p>

                {(sectionStats[sectionToDelete]?.count || 0) > 0 ? (
                  <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "12px", padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, color: "#9f1239", fontSize: "0.85rem", marginBottom: "8px" }}>
                      This section contains {sectionStats[sectionToDelete]?.count} question(s):
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="deleteSecChoice"
                          value="reassign"
                          checked={deleteQuestionsOption === "reassign"}
                          onChange={() => setDeleteQuestionsOption("reassign")}
                        />
                        <span>
                          <strong>Move questions to &quot;General&quot;</strong> (Recommended & safe)
                        </span>
                      </label>

                      <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.85rem", color: "#e11d48", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="deleteSecChoice"
                          value="delete"
                          checked={deleteQuestionsOption === "delete"}
                          onChange={() => setDeleteQuestionsOption("delete")}
                        />
                        <span>
                          <strong>Permanently delete all {sectionStats[sectionToDelete]?.count} question(s)</strong>
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px", fontSize: "0.82rem", color: "#64748b" }}>
                    ✓ This section currently has 0 questions. It will be safely removed.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowDeleteSectionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="aq-btn-delete"
                  onClick={handleDeleteSectionSubmit}
                  disabled={deletingSectionLoading}
                >
                  {deletingSectionLoading ? "Removing..." : "Delete Section"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Centered Modern Delete Confirmation Modal for Single Question */}
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
      <div className={`aq-card ${isCoding ? "is-coding-card" : ""}`} key={q._id}>
        <div className="aq-card-top">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className="aq-number">Question {idx + 1}</span>
            <span className={`aq-section-pill ${isCoding ? "coding" : ""}`}>
              <SecIcon size={13} />
              <span>{secName}</span>
            </span>
          </div>

          <div className="aq-card-actions">
            <span className="aq-marks-pill">
              +{q.marks || 1} / -{q.negativeMarks || 0} marks
            </span>

            {/* Redesigned, High-End Edit Button */}
            <button
              type="button"
              className="aq-btn-edit"
              onClick={() => openEdit(q)}
              title="Edit question text, options, and marks"
            >
              <EditIcon size={14} />
              <span>Edit</span>
            </button>

            {/* Redesigned, High-End Delete Button */}
            <button
              type="button"
              className="aq-btn-delete"
              onClick={() => setDeleteTarget(q)}
              title="Permanently remove question"
            >
              <TrashIcon size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <p className={`aq-question-text ${isCoding ? "code-text" : ""}`}>
          {q.questionText || q.text}
        </p>

        {isCoding || q.questionType === "coding" || (q.testCases && q.testCases.length > 0) ? (
          <div className="aq-coding-card-details">
            <div className="aq-code-meta-bar">
              <span className="aq-code-lang-tag">
                <CodeIcon size={13} /> {q.codingLanguage || "javascript"}
              </span>
              <span className="aq-code-tc-count">
                {(q.testCases || []).length} Automated Test Cases
              </span>
            </div>

            {q.starterCode && (
              <div className="aq-starter-preview-box">
                <span className="aq-starter-label">Starter Code:</span>
                <pre><code>{q.starterCode}</code></pre>
              </div>
            )}

            {(q.testCases || []).length > 0 && (
              <div className="aq-test-cases-preview">
                <span className="tc-header">Sample Test Cases:</span>
                <div className="tc-chips-row">
                  {q.testCases.map((tc, tci) => (
                    <div key={tci} className="tc-chip">
                      <span className="tc-in">In: <code>{tc.input || "∅"}</code></span>
                      <span className="tc-arrow">→</span>
                      <span className="tc-out">Out: <code>{tc.expectedOutput}</code></span>
                      {tc.isSample !== false ? (
                        <span className="sample-badge">Sample</span>
                      ) : (
                        <span className="sample-badge hidden">Hidden</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}

        {q.explanation && (
          <div className="aq-explanation" style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
            <span className="exp-icon" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <SparklesIcon size={14} /> Explanation:
            </span>
            <span>{q.explanation}</span>
          </div>
        )}
      </div>
    );
  }
};

export default Questions;
