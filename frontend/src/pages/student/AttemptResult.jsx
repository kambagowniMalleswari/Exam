import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  AwardIcon,
  BookOpenIcon,
  ClockIcon,
  TargetIcon,
  CalendarIcon,
  BarChartIcon,
  SparklesIcon,
  AlertTriangleIcon
} from "../../components/common/Icons.jsx";
import "./AttemptResult.css";

const AttemptResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError("");
      // Fetch result for this attempt (try /results/attempt/:id, fallback to /results/:id)
      let data = null;
      try {
        const res = await api.get(`/results/attempt/${attemptId}`);
        data = res.data.result || res.data;
      } catch (err1) {
        try {
          const res2 = await api.get(`/results/${attemptId}`);
          data = res2.data.result || res2.data;
        } catch (err2) {
          throw err1;
        }
      }
      setResult(data);

      // Also fetch attempt for context
      try {
        const aRes = await api.get(`/attempts/${attemptId}`);
        setAttempt(aRes.data.attempt || aRes.data);
      } catch {}
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load result.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <DashboardLayout title="Your Result">
        <div className="result-loading">
          <div className="spinner"></div>
          <p>Loading your result...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Your Result">
        <div className="result-error">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={() => navigate("/student/my-attempts")} className="btn-back-r">← View My Attempts</button>
        </div>
      </DashboardLayout>
    );
  }

  const score = result?.score ?? 0;
  const totalMarks = result?.totalMarks ?? 0;
  const percentage = result?.percentage ?? 0;
  const correct = result?.correctAnswers ?? result?.correct ?? 0;
  const incorrect = result?.wrongAnswers ?? result?.incorrectAnswers ?? result?.incorrect ?? 0;
  const unanswered = result?.unanswered ?? 0;
  const timeTaken = result?.timeTaken ?? attempt?.timeTaken;
  const testTitle = result?.testId?.title || attempt?.testId?.title || "Test";
  
  const passingScore =
    result?.passingPercentage ??
    result?.testId?.passingPercentage ??
    attempt?.passingPercentage ??
    attempt?.testId?.passingPercentage ??
    40;

  // Strict evaluation of passing qualification based on passing percentage benchmark
  const passed = result?.passed ?? (percentage >= passingScore);
  const attemptMode = result?.testId?.attemptMode || attempt?.testId?.attemptMode || "re_attempt_on_fail";

  return (
    <DashboardLayout title="Your Result">
      <div className="result-page">

        {/* Pass/Fail Hero */}
        <div className={`result-hero ${passed ? "passed" : "failed"}`}>
          <div className="result-badge-large" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {passed ? <AwardIcon size={44} /> : <BookOpenIcon size={44} />}
          </div>
          <div className="result-verdict">
            <span className={`verdict-badge ${passed ? "pass" : "fail"}`}>
              {passed ? "PASSED & QUALIFIED" : "DID NOT MEET PASSING SCORE"}
            </span>
            <h1>{testTitle}</h1>
            <p>{passed
              ? `Congratulations! You scored ${percentage.toFixed(1)}% and met the institutional standard (${passingScore}%). Your performance is officially certified.`
              : `You scored ${percentage.toFixed(1)}%, which is below the required ${passingScore}%. ${attemptMode === "re_attempt_on_fail" ? "You may re-attempt this exam if attempts remain." : "Review the question breakdowns below."}`}
            </p>
          </div>
        </div>

        {/* Score Card */}
        <div className="score-section">
          <div className="score-main-card">
            <div className="score-circle-wrapper">
              <div className={`score-circle ${passed ? "pass" : "fail"}`}>
                <div className="score-circle-inner">
                  <strong>{percentage.toFixed(1)}%</strong>
                  <span>Score</span>
                </div>
              </div>
            </div>
            <div className="score-breakdown">
              <div className="score-headline">
                <span className="score-value">{score}</span>
                <span className="score-divider">/</span>
                <span className="score-total">{totalMarks}</span>
                <span className="score-label">marks obtained</span>
              </div>
              <div className="score-stats">
                <div className="stat-pill correct">
                  <span className="pill-icon">✓</span>
                  <div>
                    <strong>{correct}</strong>
                    <span>Correct</span>
                  </div>
                </div>
                <div className="stat-pill incorrect">
                  <span className="pill-icon">✗</span>
                  <div>
                    <strong>{incorrect}</strong>
                    <span>Incorrect</span>
                  </div>
                </div>
                <div className="stat-pill unanswered">
                  <span className="pill-icon">–</span>
                  <div>
                    <strong>{unanswered}</strong>
                    <span>Unanswered</span>
                  </div>
                </div>
              </div>
              {timeTaken !== undefined && timeTaken !== null && (
                <div className="time-taken" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <ClockIcon size={14} /> Time Taken: <strong>{formatTime(timeTaken)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Additional Stats */}
          <div className="result-meta-grid">
            <div className="meta-card">
              <span className="meta-icon" style={{ display: "inline-flex", alignItems: "center" }}><TargetIcon size={18} /></span>
              <div>
                <span>Passing Score</span>
                <strong>{passingScore}%</strong>
              </div>
            </div>
            <div className="meta-card">
              <span className="meta-icon" style={{ display: "inline-flex", alignItems: "center" }}><CalendarIcon size={18} /></span>
              <div>
                <span>Completed</span>
                <strong>
                  {result?.createdAt
                    ? new Date(result.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </strong>
              </div>
            </div>
            <div className="meta-card">
              <span className="meta-icon" style={{ display: "inline-flex", alignItems: "center" }}><BarChartIcon size={18} /></span>
              <div>
                <span>Accuracy</span>
                <strong>
                  {correct + incorrect > 0
                    ? `${((correct / (correct + incorrect)) * 100).toFixed(1)}%`
                    : "—"}
                </strong>
              </div>
            </div>
            <div className="meta-card">
              <span className="meta-icon">⏱️</span>
              <div>
                <span>Time Taken</span>
                <strong>{formatTime(timeTaken)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        {result?.questionBreakdown && result.questionBreakdown.length > 0 && (
          <div className="review-section">
            <button
              className="toggle-review-btn"
              onClick={() => setShowReview(!showReview)}
            >
              {showReview ? "▲ Hide Question Review" : "▼ Show Question-wise Review"}
            </button>

            {showReview && (
              <div className="review-list">
                {result.questionBreakdown.map((item, i) => {
                  const isUnanswered =
                    item.status === "unanswered" ||
                    item.isUnanswered ||
                    !item.selectedAnswer ||
                    item.selectedAnswer === "Not answered" ||
                    item.yourAnswer === "Not answered";
                  const isCorrect = item.status === "correct" || item.isCorrect;
                  const itemStatus = isCorrect
                    ? "Correct"
                    : isUnanswered
                    ? "Unanswered"
                    : "Incorrect";
                  const statusClass = isCorrect
                    ? "correct"
                    : isUnanswered
                    ? "unanswered"
                    : "incorrect";
                  const studentAnsDisplay = isUnanswered
                    ? "Not answered"
                    : item.selectedAnswer || item.yourAnswer || "Not answered";
                  const marksAwarded =
                    item.marksAwarded !== undefined
                      ? item.marksAwarded
                      : item.marksObtained !== undefined
                      ? item.marksObtained
                      : 0;

                  return (
                    <div
                      key={i}
                      className={`review-item ${statusClass}`}
                    >
                      <div className="review-num">
                        <span className={`review-status ${isCorrect ? "c" : isUnanswered ? "u" : "w"}`}>
                          {isCorrect ? "✓" : isUnanswered ? "–" : "✗"}
                        </span>
                        Q{i + 1}
                      </div>
                      <div className="review-content">
                        <p className="review-question">
                          {item.questionText || item.question || "Question"}
                        </p>
                        <div className="review-answers">
                          <div className="review-answer-row">
                            <strong>Your answer:</strong>{" "}
                            <span className={`review-answer ${isCorrect ? "your-correct" : isUnanswered ? "unanswered-label" : "your-wrong"}`}>
                              {studentAnsDisplay}
                            </span>
                          </div>
                          <div className="review-answer-row">
                            <strong>Correct answer:</strong>{" "}
                            <span className="review-answer correct-answer">
                              {item.correctAnswer || "—"}
                            </span>
                          </div>
                          <div className="review-answer-row">
                            <strong>Status:</strong>{" "}
                            <span className={`status-pill ${statusClass}`}>
                              {itemStatus}
                            </span>
                          </div>
                        </div>
                        {item.explanation && (
                          <p className="review-explanation" style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                            <SparklesIcon size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
                            <span><strong>Explanation:</strong> {item.explanation}</span>
                          </p>
                        )}
                      </div>
                      <div className="review-marks">
                        <strong className={marksAwarded > 0 ? "pos" : marksAwarded < 0 ? "neg" : ""}>
                          {marksAwarded >= 0 ? "+" : ""}{marksAwarded}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="result-actions">
          <button
            className="btn-view-attempts"
            onClick={() => navigate("/student/my-attempts")}
          >
            📜 View All Attempts
          </button>
          <button
            className="btn-take-more"
            onClick={() => navigate("/student/available-tests")}
          >
            🎯 Take More Tests
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AttemptResult;
