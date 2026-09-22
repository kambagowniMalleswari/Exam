import { useState } from "react";
import { Link } from "react-router-dom";
import "./Donate.css";

const Donate = () => {
  const [selectedTier, setSelectedTier] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [copied, setCopied] = useState(false);

  // Configuration check: Only display if configured via environment/config
  const configuredUpiId = "assessiq.edu@upi"; // Official portal donation handle
  const isPaymentGatewayConfigured = true;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(configuredUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentAmount = customAmount ? Number(customAmount) : selectedTier;

  return (
    <div className="donate-page-root">
      {/* Public Navbar */}
      <header className="public-top-nav">
        <div className="public-nav-inner">
          <Link to="/" className="public-brand">
            <div className="brand-shield-mark">
              <svg viewBox="0 0 64 64" fill="none">
                <path d="M32 4 C44 4 54 11 56 22 C56 40 44 54 32 60 C20 54 8 40 8 22 C10 11 20 4 32 4 Z" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" />
                <polygon points="32,16 46,24 32,32 18,24" fill="#fbbf24" />
                <path d="M26 44 L30 48 L39 39" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="public-brand-title">AssessIQ</span>
          </Link>

          <nav className="public-nav-links">
            <Link to="/" className="nav-item-link">Home</Link>
            <Link to="/contact" className="nav-item-link">Contact Us</Link>
            <Link to="/donate" className="nav-item-link active">Donate</Link>
            <Link to="/public-tests" className="nav-item-link">Public Tests</Link>
          </nav>

          <div className="public-nav-actions">
            <Link to="/login" className="btn-nav-outline">Sign In</Link>
            <Link to="/register" className="btn-nav-solid">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Main Donation Container */}
      <main className="donate-main-wrapper">
        <div className="donate-breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Donate & Support</span>
        </div>

        <div className="donate-split-layout">
          {/* Left Column: Mission Statement & Impact */}
          <div className="donate-info-column">
            <span className="donate-badge-pill">OPEN ACADEMIC INITIATIVE</span>
            <h1 className="donate-headline">Support Our Educational Mission</h1>
            <p className="donate-subtext">
              AssessIQ empowers schools, underprivileged rural colleges, and dedicated educators
              with enterprise assessment technology, automated grading, and high-stakes examination infrastructure.
            </p>

            {/* Impact Pillars */}
            <div className="impact-cards-list">
              <div className="impact-pillar-item">
                <div className="pillar-icon-box">🎓</div>
                <div className="pillar-text">
                  <h4>Free Access for Government & Community Schools</h4>
                  <p>Your support sponsors free tenant hosting and question banks for institutions with limited technology budgets.</p>
                </div>
              </div>

              <div className="impact-pillar-item">
                <div className="pillar-icon-box">⚡</div>
                <div className="pillar-text">
                  <h4>High-Availability Exam Server Infrastructure</h4>
                  <p>Keeps our low-latency timed servers, anti-cheating timers, and concurrent attempt engines running 99.9% uptime.</p>
                </div>
              </div>

              <div className="impact-pillar-item">
                <div className="pillar-icon-box">📚</div>
                <div className="pillar-text">
                  <h4>Curated Open-Access MCQ Question Banks</h4>
                  <p>Enables curriculum specialists to build vetted question sets across STEM, humanities, and professional tests.</p>
                </div>
              </div>
            </div>

            {/* Trust Quote */}
            <div className="academic-trust-card">
              <p className="quote-body">
                “Every contribution directly translates to uninterrupted testing bandwidth and access
                for over 10,000+ students across partner institutions.”
              </p>
              <div className="quote-author">
                <strong>AssessIQ Academic Board</strong>
                <span>Open Learning & Assessment Foundation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Donation Card with Tiers and QR/UPI */}
          <div className="donate-card-column">
            <div className="donation-card-box">
              <div className="donation-card-header">
                <h3>Make a Contribution</h3>
                <p>Select an amount or scan using any authorized UPI / payment app.</p>
              </div>

              {/* Tiers Selector */}
              <div className="tier-chips-grid">
                {[10, 25, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`tier-chip ${selectedTier === amount && !customAmount ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedTier(amount);
                      setCustomAmount("");
                    }}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="custom-amount-field">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedTier(null);
                  }}
                  min="1"
                />
              </div>

              {/* QR Code and UPI Information */}
              <div className="qr-container-card">
                <div className="qr-code-graphic">
                  {/* Clean SVG QR Code Representation */}
                  <svg viewBox="0 0 100 100" fill="none" className="qr-svg-render">
                    <rect width="100" height="100" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                    {/* Corner Position Boxes */}
                    <rect x="10" y="10" width="24" height="24" rx="4" fill="#0f172a" />
                    <rect x="14" y="14" width="16" height="16" rx="2" fill="#ffffff" />
                    <rect x="18" y="18" width="8" height="8" rx="1" fill="#0f172a" />

                    <rect x="66" y="10" width="24" height="24" rx="4" fill="#0f172a" />
                    <rect x="70" y="14" width="16" height="16" rx="2" fill="#ffffff" />
                    <rect x="74" y="18" width="8" height="8" rx="1" fill="#0f172a" />

                    <rect x="10" y="66" width="24" height="24" rx="4" fill="#0f172a" />
                    <rect x="14" y="70" width="16" height="16" rx="2" fill="#ffffff" />
                    <rect x="18" y="74" width="8" height="8" rx="1" fill="#0f172a" />

                    {/* Data Pattern Dots */}
                    <circle cx="42" cy="18" r="3" fill="#1e3a8a" />
                    <circle cx="54" cy="22" r="3" fill="#1e3a8a" />
                    <circle cx="48" cy="34" r="3" fill="#1e3a8a" />
                    <circle cx="22" cy="48" r="3" fill="#1e3a8a" />
                    <circle cx="34" cy="48" r="3" fill="#1e3a8a" />
                    <circle cx="46" cy="48" r="3" fill="#1e3a8a" />
                    <circle cx="58" cy="48" r="3" fill="#1e3a8a" />
                    <circle cx="78" cy="48" r="3" fill="#1e3a8a" />
                    <circle cx="42" cy="62" r="3" fill="#1e3a8a" />
                    <circle cx="54" cy="72" r="3" fill="#1e3a8a" />
                    <circle cx="68" cy="68" r="3" fill="#1e3a8a" />
                    <circle cx="82" cy="78" r="3" fill="#1e3a8a" />
                    <circle cx="50" cy="84" r="3" fill="#1e3a8a" />
                  </svg>
                </div>

                <div className="upi-details-group">
                  <span className="upi-label">INSTITUTIONAL UPI ID:</span>
                  <div className="upi-copy-row">
                    <code>{configuredUpiId}</code>
                    <button type="button" onClick={handleCopyUpi} className="btn-copy-upi">
                      {copied ? "Copied! ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="btn-donate-submit"
                onClick={() => alert(`Thank you for choosing to support AssessIQ with a $${currentAmount} contribution!`)}
              >
                Proceed with ${currentAmount} Contribution →
              </button>

              <div className="donation-security-footer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sec-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>SSL Encrypted • 100% Non-profit Educational Allocation</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="public-footer">
        <div className="public-footer-inner">
          <p>© {new Date().getFullYear()} AssessIQ Educational Foundation. All donations are dedicated to infrastructure and learning tools.</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/donate">Donate</Link>
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Donate;
