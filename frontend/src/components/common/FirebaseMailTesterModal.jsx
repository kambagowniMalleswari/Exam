import React, { useState, useEffect } from "react";
import {
  dispatchFirebasePasswordReset,
  runFirebaseMailDiagnostic,
  fetchFirebaseMailStatus
} from "../../services/firebaseMailService.js";
import api from "../../services/api.js";
import {
  MailIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XIcon
} from "./Icons.jsx";
import "./FirebaseMailTesterModal.css";

const FirebaseMailTesterModal = ({ isOpen, onClose, defaultEmail = "" }) => {
  const [targetEmail, setTargetEmail] = useState(defaultEmail || "kambagownikmalleswari@gmail.com");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("firebase"); // 'firebase' | 'smtp'
  const [configStatus, setConfigStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      if (defaultEmail) {
        setTargetEmail(defaultEmail);
      }
    }
  }, [isOpen, defaultEmail]);

  const loadStatus = async () => {
    const res = await fetchFirebaseMailStatus();
    setConfigStatus(res);
  };

  if (!isOpen) return null;

  // Handle Firebase Mail Test
  const handleTestFirebase = async (e) => {
    e?.preventDefault();
    if (!targetEmail.trim()) return;

    setLoading(true);
    setTestResult(null);

    try {
      const res = await runFirebaseMailDiagnostic(targetEmail.trim());
      setTestResult({
        type: "firebase",
        success: res.success,
        durationMs: res.durationMs,
        data: res.report || res,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      setTestResult({
        type: "firebase",
        success: false,
        error: err.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle SMTP Standard Email Test
  const handleTestSmtp = async (e) => {
    e?.preventDefault();
    if (!targetEmail.trim()) return;

    setLoading(true);
    setTestResult(null);
    const startTime = Date.now();

    try {
      const res = await api.post("/auth/test-email", { email: targetEmail.trim() });
      const durationMs = Date.now() - startTime;
      setTestResult({
        type: "smtp",
        success: true,
        durationMs,
        data: res.data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      setTestResult({
        type: "smtp",
        success: false,
        durationMs,
        error: err.response?.data?.message || err.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!testResult) return;
    navigator.clipboard.writeText(JSON.stringify(testResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fb-modal-backdrop" onClick={onClose}>
      <div className="fb-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fb-modal-header">
          <div className="fb-header-left">
            <div className="fb-logo-badge">🔥</div>
            <div>
              <h2 className="fb-modal-title">Firebase Mailing System Diagnostic</h2>
              <p className="fb-modal-subtitle">Test and verify live email delivery powered by Google Firebase</p>
            </div>
          </div>
          <button className="fb-btn-close" onClick={onClose} aria-label="Close modal">
            <XIcon size={20} />
          </button>
        </div>

        {/* Configuration Pills */}
        <div className="fb-config-strip">
          <div className="fb-config-item">
            <span className="fb-pill-dot active"></span>
            <span className="fb-pill-label">Project:</span>
            <strong>{configStatus?.projectId || "assess-iq"}</strong>
          </div>
          <div className="fb-config-item">
            <span className="fb-pill-dot active"></span>
            <span className="fb-pill-label">Provider:</span>
            <span>Google Firebase Auth</span>
          </div>
          <div className="fb-config-item">
            <span className="fb-pill-dot active"></span>
            <span className="fb-pill-label">API Status:</span>
            <span className="fb-status-tag">Operational</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="fb-tab-selector">
          <button
            className={`fb-tab-btn ${activeTab === "firebase" ? "active" : ""}`}
            onClick={() => setActiveTab("firebase")}
          >
            🔥 Firebase Mail (Google Cloud)
          </button>
          <button
            className={`fb-tab-btn ${activeTab === "smtp" ? "active" : ""}`}
            onClick={() => setActiveTab("smtp")}
          >
            ✉️ SMTP / System Mail
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={activeTab === "firebase" ? handleTestFirebase : handleTestSmtp} className="fb-form-section">
          <label className="fb-input-label">Target Recipient Email</label>
          <div className="fb-input-wrapper">
            <MailIcon size={18} className="fb-input-icon" />
            <input
              type="email"
              className="fb-input-field"
              placeholder="e.g. kambagownikmalleswari@gmail.com"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading || !targetEmail.trim()}
              className={`fb-btn-submit ${activeTab === "firebase" ? "firebase" : "smtp"}`}
            >
              {loading ? (
                <>
                  <span className="fb-spinner"></span>
                  Dispatching...
                </>
              ) : activeTab === "firebase" ? (
                "🔥 Send Firebase Test Email"
              ) : (
                "✉️ Send SMTP Test Email"
              )}
            </button>
          </div>
          <p className="fb-hint-text">
            {activeTab === "firebase"
              ? "Dispatches an authentic password reset verification link using Google Firebase Identity Toolkit (Bypasses port blocks)."
              : "Dispatches a live HTML diagnostic email via configured NodeMailer / Gmail SMTP."}
          </p>
        </form>

        {/* Test Result Section */}
        {testResult && (
          <div className={`fb-result-card ${testResult.success ? "success" : "failure"}`}>
            <div className="fb-result-header">
              <div className="fb-result-status">
                {testResult.success ? (
                  <>
                    <CheckCircleIcon size={20} className="icon-success" />
                    <span className="status-text success">Email Dispatched Successfully</span>
                  </>
                ) : (
                  <>
                    <AlertTriangleIcon size={20} className="icon-error" />
                    <span className="status-text error">Dispatch Failed</span>
                  </>
                )}
              </div>
              <div className="fb-result-meta">
                {testResult.durationMs && (
                  <span className="fb-latency-badge">⚡ {testResult.durationMs}ms</span>
                )}
                <button type="button" className="fb-copy-btn" onClick={copyResult}>
                  {copied ? "Copied!" : "Copy Details"}
                </button>
              </div>
            </div>

            <div className="fb-result-body">
              {testResult.error ? (
                <div className="fb-error-callout">
                  <strong>Error:</strong> {testResult.error}
                </div>
              ) : (
                <div className="fb-success-callout">
                  ✓ Verification email successfully reached Google Mail Server queue for <strong>{targetEmail}</strong>.
                  Please inspect your inbox (or Spam/Junk folder).
                </div>
              )}

              <details className="fb-details-payload" open>
                <summary>Diagnostic Payload</summary>
                <pre>{JSON.stringify(testResult.data || testResult, null, 2)}</pre>
              </details>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="fb-modal-footer">
          <div className="fb-footer-info">
            <span>💡 To customize email templates or sender names:</span>
            <a
              href="https://console.firebase.google.com/project/assess-iq/authentication/emails"
              target="_blank"
              rel="noreferrer"
              className="fb-link"
            >
              Firebase Console → Authentication → Templates ↗
            </a>
          </div>
          <button type="button" className="fb-btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseMailTesterModal;
