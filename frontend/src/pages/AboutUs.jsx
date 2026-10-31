import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import VmsLogo from "../components/common/VmsLogo.jsx";
import Footer from "../components/common/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getDefaultDashboard } from "../utils/roleUtils.js";
import "./AboutUs.css";

export const AboutUs = () => {
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.title = "About Us — VMS Learning & AssessIQ Platform";
  }, []);

  return (
    <div className="vms-about-page">
      {/* Navbar */}
      <header className="about-navbar">
        <div className="about-navbar-container">
          <Link to="/" className="about-brand" aria-label="VMS Home">
            <VmsLogo size={42} />
          </Link>

          <nav className="about-nav-links">
            <Link to="/">Home</Link>
            <Link to="/public-tests">Courses &amp; Tests</Link>
            <Link to="/about" className="active">About</Link>
            <Link to="/join-us">For Institutions</Link>
            <Link to="/contact">Contact</Link>
          </nav>

          <div className="about-nav-actions">
            {user ? (
              <Link to={getDefaultDashboard(user.role)} className="btn-about-portal">
                My Dashboard →
              </Link>
            ) : (
              <Link to="/login" className="btn-about-portal">
                Sign In →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="about-hero-section">
        <div className="about-hero-container">
          <div className="about-hero-text">
            <span className="about-pill-tag">
              <span className="about-dot"></span> ACADEMIC ASSESSMENT ENGINE
            </span>
            <h1 className="about-hero-title">
              Built for High-Stakes Institutional Examinations &amp; Skill Mastery
            </h1>
            <p className="about-hero-desc">
              VMS Learning &amp; AssessIQ is a next-generation multi-tenant examination ecosystem.
              We empower universities, colleges, and training academies to author, proctor, and evaluate
              complex MCQ tests and live coding assessments at scale with bulletproof academic integrity.
            </p>
            <div className="about-hero-cta">
              <Link to="/public-tests" className="btn-about-primary">
                Explore Practice Tests →
              </Link>
              <Link to="/join-us" className="btn-about-secondary">
                Institutional Partnership
              </Link>
            </div>
          </div>

          <div className="about-hero-image-wrap">
            <img
              src="/academic-team-about.jpg"
              alt="Academic Mentors and Examination Analytics"
              className="about-hero-img"
            />
            <div className="about-image-badge">
              <strong>★ 99.98%</strong>
              <span>Evaluation Accuracy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="about-metrics-strip">
        <div className="about-metrics-container">
          <div className="metric-col">
            <span className="metric-number">50+</span>
            <span className="metric-label">Partner Institutions &amp; Colleges</span>
          </div>
          <div className="metric-col">
            <span className="metric-number">25,000+</span>
            <span className="metric-label">Enrolled Student Candidates</span>
          </div>
          <div className="metric-col">
            <span className="metric-number">12</span>
            <span className="metric-label">Programming Languages Supported</span>
          </div>
          <div className="metric-col">
            <span className="metric-number">100,000+</span>
            <span className="metric-label">Verified Test Submissions</span>
          </div>
        </div>
      </section>

      {/* Core Platform Architecture */}
      <section className="about-features-section">
        <div className="about-features-container">
          <div className="features-header">
            <span className="features-sub">ARCHITECTURAL ADVANTAGES</span>
            <h2>How Our Assessment Platform Operates</h2>
            <p>Designed from the ground up for strict security, fairness, and deep performance insights.</p>
          </div>

          <div className="features-grid-3">
            <div className="feature-card">
              <div className="feature-icon-box blue">🏫</div>
              <h3>Hermetic Multi-Tenancy</h3>
              <p>
                Every college, university, or corporate department receives an isolated tenant partition.
                Student rosters, faculty authors, and proprietary question banks remain strictly confidential with row-level security.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box green">⚡</div>
              <h3>Live Sandboxed Code Runner</h3>
              <p>
                Supports 12 languages: Java, C, C++, Python, JavaScript, PHP, C#, TypeScript, Ruby, Go, Kotlin, and Rust.
                Code is tested automatically against sample and hidden automated test cases with microsecond accuracy.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box amber">⏱️</div>
              <h3>Tamper-Proof Proctoring</h3>
              <p>
                Server-synchronized deadlines eliminate client-side clock tampering. Tab-switch telemetry,
                focus tracking, and automatic submission enforce strict examination compliance.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box purple">📊</div>
              <h3>Granular Score Telemetry</h3>
              <p>
                Negative marking computation, sectional breakdowns, percentile curves, and customized re-attempt policies
                (such as re-attempts only on fail or best-of-N scoring) give faculty total grading control.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box teal">🎓</div>
              <h3>Instant Digital Verification</h3>
              <p>
                Real-time certificate issuance, cryptographically signed scorecards, and verifiable performance badges
                delivered directly to candidate inboxes and student profiles within seconds.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box rose">🤝</div>
              <h3>Faculty &amp; Author Tools</h3>
              <p>
                Intuitive question drafting with LaTeX formulas, code templates, customizable test duration windows,
                and bulk student batch allocations via spreadsheet imports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lab Showcase Section */}
      <section className="about-showcase-section">
        <div className="about-showcase-container">
          <div className="showcase-img-wrap">
            <img
              src="/academic-compliance-hero.jpg"
              alt="Students taking verified online tests"
              className="showcase-img"
            />
          </div>
          <div className="showcase-text">
            <span className="showcase-tag">ACADEMIC EXCELLENCE</span>
            <h2>Empowering Students and Faculty Worldwide</h2>
            <p>
              Whether you are an aspiring software engineer practicing algorithm challenges,
              a student taking an official university semester final, or an instructor authoring
              standardized entrance exams, our platform provides the stability, speed, and accuracy
              required for true educational measurement.
            </p>
            <div className="showcase-points">
              <div className="showcase-point">
                <span className="check-icon">✓</span>
                <span>Zero software installation required — works directly in any standard browser.</span>
              </div>
              <div className="showcase-point">
                <span className="check-icon">✓</span>
                <span>Mobile-responsive, accessible design for candidates on desktops, tablets, or laptops.</span>
              </div>
              <div className="showcase-point">
                <span className="check-icon">✓</span>
                <span>Comprehensive institutional support desk and guaranteed 99.9% exam uptime.</span>
              </div>
            </div>
            <Link to="/contact" className="btn-showcase-contact">
              Get in Touch with Academic Support →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
