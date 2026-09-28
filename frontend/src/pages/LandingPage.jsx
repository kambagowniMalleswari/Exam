// Landing Page Component
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import {
  ShieldIcon,
  ClockIcon,
  AwardIcon,
  BarChartIcon,
  GlobeIcon,
  SparklesIcon,
  CheckIcon
} from "../components/common/Icons.jsx";
import "./LandingPage.css";

const LandingPage = () => {
  const [publicTests, setPublicTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AssessIQ — Institutional Online Test Management SaaS";

    const fetchPublicTests = async () => {
      try {
        const res = await api.get("/tests/public");
        setPublicTests(res.data?.tests || []);
      } catch (err) {
        console.warn("Could not fetch public tests:", err.message);
      } finally {
        setLoadingTests(false);
      }
    };
    fetchPublicTests();
  }, []);

  return (
    <div className="landing-page">
      {/* Navbar */}
      <header className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-brand">
            <BrandCrest size={34} />
            <span className="brand-text">AssessIQ</span>
          </div>

          <nav className="landing-nav-links">
            <Link to="/">Home</Link>
            <Link to="/join-us">Join with us</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/donate">Donate</Link>
            <a href="#features">Features</a>
            <a href="#tests">Public Tests</a>
            <a href="#pricing">Pricing Plans</a>
          </nav>

          <div className="landing-nav-auth">
            <Link to="/login" className="btn btn-secondary">Sign In</Link>
            <Link to="/join-us" className="btn btn-primary">Join With Us</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="sparkle"><SparklesIcon size={14} /></span> Enterprise Institutional Assessment SaaS
          </div>
          <h1>
            Empower Your Institution with <span className="gradient-text">Intelligent MCQ Assessments</span>
          </h1>
          <p className="hero-subtext">
            Enterprise multi-tenant assessment platform engineered for Schools, Colleges, Universities, and Corporate Training.
            Server-side scheduled tests, timed sessions, automated grading, and complete institutional tenant isolation.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Student Register →
            </Link>
            <Link to="/join-us" className="btn btn-secondary btn-large">
              Institution & Faculty Onboarding →
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-item">
              <strong>99.9%</strong>
              <span>System Uptime</span>
            </div>
            <div className="hero-stat-item">
              <strong>100%</strong>
              <span>Tenant Data Isolation</span>
            </div>
            <div className="hero-stat-item">
              <strong>Instant</strong>
              <span>Automated Scoring</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <div className="section-header">
          <span className="section-tag">BUILT FOR SCALE</span>
          <h2>Everything You Need to Run High-Stakes Assessments</h2>
          <p>Engineered for speed, security, and seamless collaboration between admins, teachers, and students.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ color: "#2563eb" }}>
              <ShieldIcon size={24} />
            </div>
            <h3>True Multi-Tenant Architecture</h3>
            <p>Strict organization-level data boundaries. Student lists, question banks, and scores never leak across organizations.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: "#d97706" }}>
              <ClockIcon size={24} />
            </div>
            <h3>Live Countdown & Auto-Submit</h3>
            <p>Strict client-server synchronized exam timers. Attempts automatically expire and evaluate if time runs out.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: "#7c3aed" }}>
              <AwardIcon size={24} />
            </div>
            <h3>Configurable Scoring & Negative Marking</h3>
            <p>Custom marks per question, negative penalty deductions, and configurable passing percentage rules.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: "#059669" }}>
              <BarChartIcon size={24} />
            </div>
            <h3>Actionable Performance Analytics</h3>
            <p>Subject performance breakdowns, class pass rates, and individual question difficulty metrics.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: "#0284c7" }}>
              <GlobeIcon size={24} />
            </div>
            <h3>Public & Private Test Delivery</h3>
            <p>Deliver private closed exams to enrolled institution students, or publish public certifications accessible to everyone.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: "#eab308" }}>
              <SparklesIcon size={24} />
            </div>
            <h3>Zero Frontend Score Trust</h3>
            <p>All answer checking and scorecard calculation happens exclusively on the secure backend server.</p>
          </div>
        </div>
      </section>

      {/* Featured Public Tests Showcase */}
      <section id="tests" className="landing-tests">
        <div className="section-header">
          <span className="section-tag">TRY AN ASSESSMENT</span>
          <h2>Explore Live Public Tests</h2>
          <p>Test your knowledge with publicly accessible certification assessments right now.</p>
        </div>

        <div className="public-tests-grid">
          {loadingTests ? (
            <div className="tests-loading-placeholder">Loading available tests...</div>
          ) : publicTests.length > 0 ? (
            publicTests.slice(0, 3).map((test) => (
              <div key={test._id} className="public-test-card">
                <div className="card-top">
                  <span className="subject-pill">{test.subject || "General"}</span>
                  <span className="duration-pill"><ClockIcon size={12} /> {test.duration} min</span>
                </div>
                <h3>{test.title}</h3>
                <p>{test.description || "Comprehensive test of skills and fundamental concepts."}</p>
                <div className="test-meta">
                  <span>Questions: <strong>{test.questionCount || 0}</strong></span>
                  <span>Pass: <strong>{test.passingPercentage}%</strong></span>
                </div>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => navigate("/login")}
                >
                  Take Test Now →
                </button>
              </div>
            ))
          ) : (
            <div className="empty-tests-note">No public tests currently available.</div>
          )}
        </div>
      </section>

      {/* SaaS Pricing Plans */}
      <section id="pricing" className="landing-pricing">
        <div className="section-header">
          <span className="section-tag">TRANSPARENT PRICING</span>
          <h2>Flexible SaaS Plans for Any Organization</h2>
          <p>Choose the tier that matches your institutional scale. Upgrade or cancel anytime.</p>
        </div>

        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="pricing-card">
            <div className="plan-header">
              <h3>Free Tier</h3>
              <p className="plan-desc">For testing and small classes</p>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">0</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li><CheckIcon size={14} /> Up to 5 Active Tests</li>
              <li><CheckIcon size={14} /> Up to 100 Students</li>
              <li><CheckIcon size={14} /> Automated Evaluation</li>
              <li><CheckIcon size={14} /> Standard Scorecards</li>
            </ul>
            <Link to="/register" className="btn btn-secondary btn-block">Get Started Free</Link>
          </div>

          {/* Basic Tier */}
          <div className="pricing-card">
            <div className="plan-header">
              <h3>Basic</h3>
              <p className="plan-desc">For coaching institutes & schools</p>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">29</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li><CheckIcon size={14} /> Up to 25 Active Tests</li>
              <li><CheckIcon size={14} /> Up to 500 Students</li>
              <li><CheckIcon size={14} /> Detailed Analytics</li>
              <li><CheckIcon size={14} /> Export Results to CSV</li>
              <li><CheckIcon size={14} /> Email Support</li>
            </ul>
            <Link to="/register" className="btn btn-secondary btn-block">Select Basic</Link>
          </div>

          {/* Pro Tier (Popular) */}
          <div className="pricing-card popular">
            <div className="popular-badge">MOST POPULAR</div>
            <div className="plan-header">
              <h3>Pro SaaS</h3>
              <p className="plan-desc">For colleges & large institutions</p>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">79</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li><CheckIcon size={14} /> Up to 100 Active Tests</li>
              <li><CheckIcon size={14} /> Up to 2,500 Students</li>
              <li><CheckIcon size={14} /> Advanced Analytics & Charts</li>
              <li><CheckIcon size={14} /> Centralized Question Bank</li>
              <li><CheckIcon size={14} /> Verified Digital Certificates</li>
              <li><CheckIcon size={14} /> Priority Support</li>
            </ul>
            <Link to="/register" className="btn btn-primary btn-block">Select Pro SaaS</Link>
          </div>

          {/* Enterprise */}
          <div className="pricing-card">
            <div className="plan-header">
              <h3>Enterprise</h3>
              <p className="plan-desc">For multi-campus universities</p>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">199</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li><CheckIcon size={14} /> Unlimited Tests & Students</li>
              <li><CheckIcon size={14} /> Custom Organization Branding</li>
              <li><CheckIcon size={14} /> Dedicated Support Manager</li>
              <li><CheckIcon size={14} /> REST API & Webhooks</li>
              <li><CheckIcon size={14} /> SLA Guarantee</li>
            </ul>
            <Link to="/register" className="btn btn-secondary btn-block">Contact Sales</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BrandCrest size={28} />
            <span>AssessIQ Platform</span>
          </div>
          <p>© 2026 AssessIQ Multi-Tenant SaaS Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
