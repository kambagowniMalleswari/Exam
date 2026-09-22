import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import "./TestInstructions.css";

const TestInstructions = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tests/${testId}`);
      setTest(res.data.test || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load test details.");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!agreed) return;
    try {
      setStarting(true);
      const res = await api.post("/attempts/start", { testId });
      const attemptId = res.data.attempt?._id || res.data._id;
      navigate(`/student/test/${attemptId}/take`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start test. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Test Instructions">
        <div className="instructions-loading">
          <div className="spinner"></div>
          <p>Loading test details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !test) {
    return (
      <DashboardLayout title="Test Instructions">
        <div className="instructions-error">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn-back">← Go Back</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Test Instructions">
      <div className="instructions-page">

        {/* Test Info Banner */}
        <div className="test-info-banner">
          <div className="test-banner-left">
            <div className="test-icon-large">📝</div>
            <div>
              <span className="test-banner-category">
                {test?.organizationId ? "🏢 Organization Test" : "🌐 Public Test"}
                {test?.subject ? ` • ${test.subject}` : ""}
              </span>
              <h1>{test?.title}</h1>
              <div className="test-banner-meta">
                <span>⏱️ {test?.duration} minutes</span>
                <span>❓ {Array.isArray(test?.questions) ? test.questions.length : test?.questionCount || "?"} Questions</span>
                <span>🏆 {test?.totalMarks || "—"} Total Marks</span>
                <span>🎯 Pass at {test?.passingMarks || "—"}%</span>
              </div>
            </div>
          </div>
          <div className="test-banner-right">
            <div className="attempt-info">
              <div className="attempt-badge">
                <strong>Max Attempts</strong>
                <span>{test?.numberOfAttempts || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Content */}
        <div className="instructions-grid">
          <div className="instructions-main">

            {/* Custom Instructions */}
            {test?.instructions && (
              <div className="instructions-card">
                <h2>📋 Test Instructions</h2>
                <div className="instructions-text">
                  {test.instructions.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* General Guidelines */}
            <div className="instructions-card">
              <h2>📌 General Guidelines</h2>
              <ul className="guidelines-list">
                <li>
                  <span className="bullet green">✓</span>
                  The timer will start as soon as you click "Start Test" and cannot be paused.
                </li>
                <li>
                  <span className="bullet green">✓</span>
                  You can navigate between questions using the question palette or Previous/Next buttons.
                </li>
                <li>
                  <span className="bullet green">✓</span>
                  Mark questions for review if you are unsure — revisit them before submitting.
                </li>
                <li>
                  <span className="bullet yellow">⚠</span>
                  The test will be automatically submitted when the timer expires.
                </li>
                {test?.negativeMarks > 0 && (
                  <li>
                    <span className="bullet red">✗</span>
                    Negative marking applies: {test.negativeMarks} marks will be deducted for each wrong answer.
                  </li>
                )}
                <li>
                  <span className="bullet yellow">⚠</span>
                  Do not refresh or close the browser tab during the exam.
                </li>
                <li>
                  <span className="bullet green">✓</span>
                  Once submitted, you cannot re-enter the test (subject to attempt limits).
                </li>
              </ul>
            </div>

            {/* Question Stats */}
            <div className="instructions-card">
              <h2>🔢 Marking Scheme</h2>
              <div className="marking-grid">
                <div className="marking-item correct">
                  <strong>+{test?.marksPerQuestion || (test?.totalMarks && Array.isArray(test.questions) ? (test.totalMarks / test.questions.length).toFixed(1) : "1")}</strong>
                  <span>Correct Answer</span>
                </div>
                <div className="marking-item wrong">
                  <strong>-{test?.negativeMarks || 0}</strong>
                  <span>Wrong Answer</span>
                </div>
                <div className="marking-item unattempted">
                  <strong>0</strong>
                  <span>Not Attempted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="instructions-sidebar">
            <div className="start-card">
              <h3>Ready to Begin?</h3>
              <div className="quick-facts">
                <div className="quick-fact">
                  <span className="qf-label">Duration</span>
                  <strong className="qf-value">{test?.duration} min</strong>
                </div>
                <div className="quick-fact">
                  <span className="qf-label">Questions</span>
                  <strong className="qf-value">
                    {Array.isArray(test?.questions) ? test.questions.length : test?.questionCount || "?"}
                  </strong>
                </div>
                <div className="quick-fact">
                  <span className="qf-label">Total Marks</span>
                  <strong className="qf-value">{test?.totalMarks || "—"}</strong>
                </div>
                <div className="quick-fact">
                  <span className="qf-label">Passing Score</span>
                  <strong className="qf-value">{test?.passingMarks || "—"}%</strong>
                </div>
              </div>

              <label className="agree-checkbox">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  id="agree-checkbox"
                />
                <span>I have read and agree to all instructions and guidelines.</span>
              </label>

              {(() => {
                const now = new Date();
                const isUpcoming = test?.startDate && now < new Date(test.startDate);
                const isClosed = test?.endDate && now > new Date(test.endDate);

                if (isUpcoming) {
                  return (
                    <div className="start-error" style={{ background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}>
                      ⏳ This test is scheduled to start on {new Date(test.startDate).toLocaleString()}. You cannot attempt it yet.
                    </div>
                  );
                }
                if (isClosed) {
                  return (
                    <div className="start-error" style={{ background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" }}>
                      🔒 This test closed on {new Date(test.endDate).toLocaleString()} and is no longer available.
                    </div>
                  );
                }
                return null;
              })()}

              {error && (
                <div className="start-error">⚠️ {error}</div>
              )}

              {(() => {
                const now = new Date();
                const isUpcoming = test?.startDate && now < new Date(test.startDate);
                const isClosed = test?.endDate && now > new Date(test.endDate);
                const canClick = agreed && !starting && !isUpcoming && !isClosed;

                return (
                  <button
                    className={`btn-start-test ${canClick ? "active" : "disabled"}`}
                    onClick={handleStart}
                    disabled={!canClick}
                  >
                    {starting
                      ? "Starting..."
                      : isUpcoming
                      ? "⏳ Not Available Yet"
                      : isClosed
                      ? "🔒 Test Closed"
                      : "▶ Start Test Now"}
                  </button>
                );
              })()}

              <button className="btn-cancel" onClick={() => navigate(-1)}>
                ← Back to Tests
              </button>
            </div>

            <div className="legend-card">
              <h4>Question Status Legend</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-dot answered"></div>
                  <span>Answered</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot unanswered"></div>
                  <span>Not Answered</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot flagged"></div>
                  <span>Marked for Review</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot current"></div>
                  <span>Current Question</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default TestInstructions;
