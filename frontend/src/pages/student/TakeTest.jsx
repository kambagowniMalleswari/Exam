import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api.js";
import "./TakeTest.css";

const TakeTest = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Proctoring tab-switch state
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showProctorWarning, setShowProctorWarning] = useState(false);
  const [proctorWarningStage, setProctorWarningStage] = useState(1);
  const [proctorSubmitted, setProctorSubmitted] = useState(false);

  const timerRef = useRef(null);
  const submitRef = useRef(false);
  const lastSwitchTimeRef = useRef(0);
  const tabSwitchesRef = useRef(0);

  // Tab-switch & focus loss detection
  const handleTabSwitch = useCallback(() => {
    // Only detect if test is loaded, active, and not currently submitting
    if (loading || submitRef.current || autoSubmitted || proctorSubmitted) return;

    const now = Date.now();
    // Debounce to prevent multiple events from a single switch (visibilitychange + blur)
    if (now - lastSwitchTimeRef.current < 1500) return;
    lastSwitchTimeRef.current = now;

    const nextCount = tabSwitchesRef.current + 1;
    tabSwitchesRef.current = nextCount;
    setTabSwitches(nextCount);

    if (nextCount >= 3) {
      // 3rd violation: Auto-submit test immediately!
      setProctorWarningStage(3);
      setShowProctorWarning(true);
      setProctorSubmitted(true);
      submitRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      setTimeout(() => {
        submitAttempt(true, "Auto-submitted: 3 tab switches detected (Focus & Tab-Switch Proctoring)");
      }, 2500);
    } else {
      // Strike 1 or Strike 2: Show popup modal
      setProctorWarningStage(nextCount);
      setShowProctorWarning(true);
    }
  }, [loading, autoSubmitted, proctorSubmitted]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitch();
      }
    };

    const handleWindowBlur = () => {
      handleTabSwitch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [handleTabSwitch]);

  // Load attempt + questions
  useEffect(() => {
    loadAttempt();
    return () => clearInterval(timerRef.current);
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      setLoading(true);
      // Get attempt info
      const attemptRes = await api.get(`/attempts/${attemptId}`);
      const attemptData = attemptRes.data.attempt || attemptRes.data;
      setAttempt(attemptData);

      // Load questions (student-safe endpoint without correct answers)
      const testId = attemptData.testId?._id || attemptData.testId;
      const qRes = await api.get(`/questions/test/${testId}/student`);
      const qs = qRes.data.questions || qRes.data || [];
      setQuestions(Array.isArray(qs) ? qs : []);

      // Restore saved answers from attempt
      if (Array.isArray(attemptData.answers)) {
        const restored = {};
        attemptData.answers.forEach((a) => {
          if (a && a.questionId) {
            const qId = a.questionId._id ? a.questionId._id : a.questionId;
            restored[qId] = a.selectedAnswer;
          }
        });
        setAnswers(restored);
      } else if (attemptData.answers && typeof attemptData.answers === "object") {
        setAnswers(attemptData.answers);
      }

      // Calculate time left
      const duration = attemptData.testId?.duration || attemptData.duration || 30;
      const startedAt = new Date(attemptData.startedAt || attemptData.createdAt).getTime();
      const expiresAt = startedAt + duration * 60 * 1000;
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to load the exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || loading) return;

    if (timeLeft <= 0 && !submitRef.current) {
      handleAutoSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1 && !submitRef.current) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, loading]);

  const handleAutoSubmit = useCallback(async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    setAutoSubmitted(true);
    clearInterval(timerRef.current);
    await submitAttempt(true, "Time expired");
  }, []);

  const submitAttempt = async (isAuto = false, reason = "") => {
    try {
      setSubmitting(true);
      const res = await api.post(`/attempts/${attemptId}/submit`, { answers });
      const resultAttemptId = res.data.attempt?._id || attemptId;
      navigate(`/student/result/${resultAttemptId}`, {
        state: {
          autoSubmitted: isAuto,
          submissionReason: reason || (isAuto ? "Exam automatically submitted" : "Manual submission")
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Please try again.");
      submitRef.current = false;
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    // Auto-save answer to server in the background
    api.patch(`/attempts/${attemptId}/answer`, {
      questionId,
      selectedAnswer: option
    }).catch((err) => {
      console.warn("Background answer save:", err?.response?.data?.message || err.message);
    });
  };

  const handleClear = (questionId) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    api.patch(`/attempts/${attemptId}/answer`, {
      questionId,
      selectedAnswer: ""
    }).catch(() => {});
  };

  const toggleFlag = (questionId) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getQuestionStatus = (idx) => {
    const q = questions[idx];
    if (!q) return "unanswered";
    if (idx === currentIdx) return "current";
    if (answers[q._id]) return flagged[q._id] ? "flagged" : "answered";
    if (flagged[q._id]) return "flagged";
    return "unanswered";
  };

  const answeredCount = questions.filter((q) => answers[q._id]).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  // Derive sections (Section A, Section B, Section C)
  const sections = useMemo(() => {
    if (!questions || questions.length === 0) return [];

    // Check if questions have custom section defined
    const hasCustomSections = questions.some((q) => q.section && q.section.trim() !== "");

    if (hasCustomSections) {
      const secMap = new Map();
      questions.forEach((q, idx) => {
        const secName = q.section?.trim() || "General";
        if (!secMap.has(secName)) {
          secMap.set(secName, []);
        }
        secMap.get(secName).push({ ...q, _globalIndex: idx });
      });

      return Array.from(secMap.entries()).map(([name, qs]) => ({
        name,
        questions: qs,
        startIndex: qs[0]._globalIndex,
        answeredCount: qs.filter((q) => answers[q._id]).length
      }));
    }

    // Default intelligent partitioning into Section A, Section B, Section C
    const total = questions.length;
    let sectionDefs = [];

    if (total <= 2) {
      if (total === 1) {
        sectionDefs = [
          { name: "Section A", slice: [0, 1] }
        ];
      } else {
        sectionDefs = [
          { name: "Section A", slice: [0, 1] },
          { name: "Section B", slice: [1, 2] }
        ];
      }
    } else {
      const part1 = Math.ceil(total / 3);
      const part2 = Math.ceil((total - part1) / 2);
      const split1 = part1;
      const split2 = part1 + part2;

      sectionDefs = [
        { name: "Section A", slice: [0, split1] },
        { name: "Section B", slice: [split1, split2] },
        { name: "Section C", slice: [split2, total] }
      ];
    }

    return sectionDefs.map((def) => {
      const qs = questions.slice(def.slice[0], def.slice[1]).map((q, i) => ({
        ...q,
        _globalIndex: def.slice[0] + i
      }));

      return {
        name: def.name,
        questions: qs,
        startIndex: qs[0]?._globalIndex ?? 0,
        answeredCount: qs.filter((q) => answers[q._id]).length
      };
    });
  }, [questions, answers]);

  const currentSection = useMemo(() => {
    if (!sections.length) return null;
    return sections.find((sec) =>
      sec.questions.some((q) => q._globalIndex === currentIdx)
    ) || sections[0];
  }, [sections, currentIdx]);

  const handleSelectSection = (secName) => {
    const targetSec = sections.find((s) => s.name === secName);
    if (targetSec && targetSec.questions.length > 0) {
      setCurrentIdx(targetSec.startIndex);
    }
  };

  const currentQuestion = questions[currentIdx];
  const isLowTime = timeLeft !== null && timeLeft < 300; // < 5 min
  const isCriticalTime = timeLeft !== null && timeLeft < 60; // < 1 min

  if (loading) {
    return (
      <div className="take-test-loading">
        <div className="loading-card">
          <div className="spinner"></div>
          <h2>Loading your exam...</h2>
          <p>Please wait while we prepare your questions.</p>
        </div>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="take-test-loading">
        <div className="loading-card error">
          <span>⚠️</span>
          <h2>Failed to Load Exam</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn-back-exam">← Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="take-test-page">

      {/* Confirm Submit Modal */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-icon">📤</div>
            <h2>Submit Test?</h2>
            <p>Are you sure you want to submit the exam?</p>
            <div className="submit-summary">
              <div className="summary-item green">
                <strong>{answeredCount}</strong>
                <span>Answered</span>
              </div>
              <div className="summary-item yellow">
                <strong>{flaggedCount}</strong>
                <span>Flagged</span>
              </div>
              <div className="summary-item red">
                <strong>{unansweredCount}</strong>
                <span>Unanswered</span>
              </div>
            </div>
            <p className="modal-warning">
              {unansweredCount > 0
                ? `You still have ${unansweredCount} unanswered question(s). Unanswered questions score 0.`
                : "All questions answered. Good job!"}
            </p>
            <div className="modal-actions">
              <button
                className="btn-modal-submit"
                onClick={() => submitAttempt(false)}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "✓ Submit Now"}
              </button>
              <button
                className="btn-modal-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                ← Review Answers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-submit overlay */}
      {autoSubmitted && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-icon">⏰</div>
            <h2>Time's Up!</h2>
            <p>Your test is being automatically submitted...</p>
            <div className="spinner" style={{ margin: "1rem auto" }}></div>
          </div>
        </div>
      )}

      {/* Focus & Tab-Switch Proctoring Alert Modal */}
      {showProctorWarning && (
        <div className="modal-overlay proctor-overlay">
          <div className={`confirm-modal proctor-modal stage-${proctorWarningStage}`}>
            <div className="modal-icon">
              {proctorWarningStage === 1 && "⚠️"}
              {proctorWarningStage === 2 && "🚨"}
              {proctorWarningStage >= 3 && "⛔"}
            </div>

            <div className="proctor-pill-tag">
              Focus &amp; Tab-Switch Proctoring
            </div>

            <h2>
              {proctorWarningStage === 1 && "Tab Switch Detected (Warning 1 of 3)"}
              {proctorWarningStage === 2 && "FINAL WARNING: Tab Switch Detected (2 of 3)"}
              {proctorWarningStage >= 3 && "Exam Terminated (3 of 3 Infractions)"}
            </h2>

            <p className="proctor-modal-msg">
              {proctorWarningStage === 1 && (
                <>
                  You navigated away from the exam window or switched tabs.
                  <br />
                  Under enterprise proctoring rules, your session is monitored in real-time.
                  <strong style={{ display: "block", marginTop: "8px", color: "#b45309" }}>
                    You have 2 warnings remaining before your exam is automatically submitted.
                  </strong>
                </>
              )}
              {proctorWarningStage === 2 && (
                <>
                  You left the exam window a second time!
                  <br />
                  <strong style={{ display: "block", marginTop: "8px", color: "#dc2626" }}>
                    ATTENTION: Navigating away or switching tabs ONE MORE TIME will immediately and irreversibly submit your examination.
                  </strong>
                </>
              )}
              {proctorWarningStage >= 3 && (
                <>
                  You have exceeded the maximum limit of 3 tab switch infractions.
                  <br />
                  In accordance with Examination Security protocols, your test has been locked and is now being automatically submitted.
                </>
              )}
            </p>

            <div className="proctor-meter">
              <div className={`proctor-meter-bar step-1 ${tabSwitches >= 1 ? "active" : ""}`}>
                <span>Strike 1</span>
              </div>
              <div className={`proctor-meter-bar step-2 ${tabSwitches >= 2 ? "active" : ""}`}>
                <span>Strike 2</span>
              </div>
              <div className={`proctor-meter-bar step-3 ${tabSwitches >= 3 ? "active danger" : ""}`}>
                <span>Strike 3 (Auto-Submit)</span>
              </div>
            </div>

            {proctorWarningStage < 3 ? (
              <div className="modal-actions" style={{ marginTop: "1.25rem" }}>
                <button
                  className={`btn-modal-resume ${proctorWarningStage === 2 ? "btn-urgent" : ""}`}
                  onClick={() => setShowProctorWarning(false)}
                >
                  {proctorWarningStage === 1 ? "✓ I Understand, Resume Exam" : "⚠️ Return to Exam (Last Chance)"}
                </button>
              </div>
            ) : (
              <div className="submitting-spinner-row" style={{ marginTop: "1.25rem" }}>
                <div className="spinner" style={{ margin: "0 auto 10px auto" }}></div>
                <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>
                  Finalizing &amp; submitting your test answers...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="exam-header">
        <div className="exam-header-left">
          <div className="exam-logo">IQ</div>
          <div>
            <h1 className="exam-title">
              {attempt?.testId?.title || "Online Exam"}
            </h1>
            <span className="exam-subject">
              {attempt?.testId?.subject || "Assessment"}
            </span>
          </div>
        </div>

        <div className="exam-header-center">
          <div className={`exam-timer ${isLowTime ? "warning" : ""} ${isCriticalTime ? "critical" : ""}`}>
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
            <span className="timer-label">remaining</span>
          </div>

          {/* Real-time Focus & Tab-Switch Proctoring Indicator */}
          <div className={`exam-proctor-chip ${tabSwitches > 0 ? (tabSwitches >= 2 ? "danger" : "warning") : "safe"}`}>
            <span className="proctor-chip-icon">🛡️</span>
            <span className="proctor-chip-text">
              {tabSwitches === 0 ? "Focus Monitored" : `Tab Switches: ${tabSwitches}/3`}
            </span>
          </div>
        </div>

        <div className="exam-header-right">
          <div className="exam-progress">
            <span>{answeredCount}/{questions.length} answered</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <button
            className="btn-submit-header"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Sections Navigation Bar (Section A, Section B, Section C) */}
      {sections.length > 0 && (
        <div className="exam-sections-bar">
          <div className="section-label-chip">Sections:</div>
          <div className="section-tabs-wrapper">
            {sections.map((sec) => {
              const isActive = currentSection?.name === sec.name;
              return (
                <button
                  key={sec.name}
                  className={`exam-section-tab ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectSection(sec.name)}
                  title={`Switch to ${sec.name}`}
                >
                  <span className="sec-tab-title">{sec.name}</span>
                  <span className="sec-tab-badge">
                    {sec.answeredCount}/{sec.questions.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="exam-body">

        {/* Question Panel */}
        <main className="exam-question-panel">
          {currentQuestion ? (
            <div className="question-container">
              <div className="question-meta">
                <div className="question-meta-left">
                  {currentSection && (
                    <span className="section-indicator-pill">{currentSection.name}</span>
                  )}
                  <span className="question-number">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                </div>
                <div className="question-actions">
                  <button
                    className={`btn-flag ${flagged[currentQuestion._id] ? "flagged" : ""}`}
                    onClick={() => toggleFlag(currentQuestion._id)}
                  >
                    {flagged[currentQuestion._id] ? "🚩 Flagged" : "🏳️ Mark for Review"}
                  </button>
                  {answers[currentQuestion._id] && (
                    <button
                      className="btn-clear"
                      onClick={() => handleClear(currentQuestion._id)}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="question-text">
                <p>{currentQuestion.questionText || currentQuestion.text}</p>
              </div>

              <div className="options-list">
                {(currentQuestion.options || []).map((option, oi) => {
                  const optionKey = typeof option === "object" ? option.key : String.fromCharCode(65 + oi);
                  const optionText = typeof option === "object" ? option.text : option;
                  const isSelected = answers[currentQuestion._id] === optionKey;

                  return (
                    <button
                      key={oi}
                      className={`option-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => handleAnswer(currentQuestion._id, optionKey)}
                    >
                      <span className="option-key">{optionKey}</span>
                      <span className="option-text">{optionText}</span>
                      {isSelected && <span className="option-check">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Question Navigation Buttons */}
              <div className="question-nav-btns">
                <button
                  className="btn-nav prev"
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                >
                  ← Previous
                </button>
                <span className="nav-indicator">
                  {currentIdx + 1} / {questions.length}
                </span>
                <button
                  className="btn-nav next"
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIdx === questions.length - 1}
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="no-questions">
              <span>❓</span>
              <p>No questions found for this exam.</p>
            </div>
          )}

          {error && (
            <div className="exam-error-banner">⚠️ {error}</div>
          )}
        </main>

        {/* Question Palette Sidebar */}
        <aside className="exam-palette">
          <div className="palette-header">
            <h3>Question Palette</h3>
            <div className="palette-legend">
              <div className="pal-legend-item">
                <div className="pal-dot answered"></div>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="pal-legend-item">
                <div className="pal-dot unanswered"></div>
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="pal-legend-item">
                <div className="pal-dot flagged"></div>
                <span>Flagged ({flaggedCount})</span>
              </div>
            </div>
          </div>

          <div className="palette-sections-container">
            {sections.map((sec) => (
              <div key={sec.name} className="palette-section-group">
                <div className="palette-section-header">
                  <span className="pal-sec-name">{sec.name}</span>
                  <span className="pal-sec-count">
                    ({sec.answeredCount}/{sec.questions.length})
                  </span>
                </div>
                <div className="palette-grid">
                  {sec.questions.map((q) => {
                    const globalIdx = q._globalIndex;
                    const status = getQuestionStatus(globalIdx);
                    return (
                      <button
                        key={q._id}
                        className={`palette-btn ${status}`}
                        onClick={() => setCurrentIdx(globalIdx)}
                        title={`Question ${globalIdx + 1} (${sec.name})`}
                      >
                        {globalIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="palette-submit-section">
            <div className="palette-stats">
              <div className="pal-stat">
                <strong>{answeredCount}</strong>
                <span>Done</span>
              </div>
              <div className="pal-stat">
                <strong>{unansweredCount}</strong>
                <span>Pending</span>
              </div>
              <div className="pal-stat">
                <strong>{flaggedCount}</strong>
                <span>Review</span>
              </div>
            </div>
            <button
              className="btn-palette-submit"
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
            >
              📤 Submit Test
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default TakeTest;
