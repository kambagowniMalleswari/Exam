import { useCallback, useEffect, useRef, useState } from "react";
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

  const timerRef = useRef(null);
  const submitRef = useRef(false);

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
    await submitAttempt(true);
  }, []);

  const submitAttempt = async (isAuto = false) => {
    try {
      setSubmitting(true);
      const res = await api.post(`/attempts/${attemptId}/submit`, { answers });
      const resultAttemptId = res.data.attempt?._id || attemptId;
      navigate(`/student/result/${resultAttemptId}`, { state: { autoSubmitted: isAuto } });
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

      {/* Main Content */}
      <div className="exam-body">

        {/* Question Panel */}
        <main className="exam-question-panel">
          {currentQuestion ? (
            <div className="question-container">
              <div className="question-meta">
                <span className="question-number">
                  Question {currentIdx + 1} of {questions.length}
                </span>
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

          <div className="palette-grid">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(idx);
              return (
                <button
                  key={q._id}
                  className={`palette-btn ${status}`}
                  onClick={() => setCurrentIdx(idx)}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
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
