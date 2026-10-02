import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import {
  ShieldIcon,
  ClockIcon,
  HelpCircleIcon,
  AwardIcon,
  BarChartIcon,
  GlobeIcon,
  SparklesIcon,
  CheckIcon,
  SearchIcon,
  BookOpenIcon,
  StarIcon,
  CodeIcon,
  GraduationCapIcon,
  CpuIcon,
  BadgeCheckIcon,
  PlayIcon,
  UsersIcon,
  BuildingIcon
} from "../components/common/Icons.jsx";
import "./LandingPage.css";

// Clean curated assessment categories
const ASSESSMENT_TRACKS = [
  { id: "software", name: "Software Development", color: "#0284c7" },
  { id: "ai", name: "Data Science & AI", color: "#8b5cf6" },
  { id: "cloud", name: "Cloud & DevOps", color: "#06b6d4" },
  { id: "aptitude", name: "Aptitude & Reasoning", color: "#f59e0b" },
  { id: "academics", name: "University Academics", color: "#10b981" },
  { id: "cyber", name: "Cybersecurity", color: "#ef4444" }
];

const renderCategoryIcon = (id) => {
  switch (id) {
    case "software":
      return <CodeIcon size={20} />;
    case "ai":
      return <CpuIcon size={20} />;
    case "cloud":
      return <GlobeIcon size={20} />;
    case "aptitude":
      return <SparklesIcon size={20} />;
    case "academics":
      return <GraduationCapIcon size={20} />;
    case "cyber":
      return <ShieldIcon size={20} />;
    default:
      return <BookOpenIcon size={20} />;
  }
};

const LandingPage = () => {
  const [publicTests, setPublicTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AssessIQ — Multi-Tenant Assessment Portal";

    let isMounted = true;
    const fetchPublicTests = async () => {
      try {
        const res = await api.get("/tests/public");
        if (isMounted) {
          const list = Array.isArray(res.data?.tests)
            ? res.data.tests
            : Array.isArray(res.data)
            ? res.data
            : [];
          setPublicTests(list);
        }
      } catch (err) {
        console.warn("Notice: public tests fetch:", err.message);
        if (isMounted) setPublicTests([]);
      } finally {
        if (isMounted) setLoadingTests(false);
      }
    };

    fetchPublicTests();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real backend tests mapped cleanly
  const displayTests = Array.isArray(publicTests)
    ? publicTests.map((t) => {
        const durationNum = Number(t?.duration) || 30;
        return {
          _id: t._id,
          title: t.title || t.name || "Assessment",
          subject: t.subject || "General",
          duration: durationNum,
          questionCount: Array.isArray(t.questions) ? t.questions.length : (t.questionCount || 0),
          image: t.image || "",
          description: t.description || "Timed institutional MCQ evaluation with instant scorecard.",
          organizationName: t.organizationId?.name || "AssessIQ Academic Platform",
          category: typeof t?.subject === "string" ? t.subject.toLowerCase() : "software"
        };
      })
    : [];

  const combinedTests = displayTests;

  // Defensive filtering
  const filteredTests = displayTests.filter((test) => {
    if (!test) return false;
    const q = (searchQuery || "").toLowerCase().trim();
    const title = typeof test.title === "string" ? test.title.toLowerCase() : "";
    const subj = typeof test.subject === "string" ? test.subject.toLowerCase() : "";
    const desc = typeof test.description === "string" ? test.description.toLowerCase() : "";
    const cat = typeof test.category === "string" ? test.category.toLowerCase() : "";

    const matchesSearch = !q || title.includes(q) || subj.includes(q) || desc.includes(q);
    const matchesCategory =
      selectedCategory === "all" || cat.includes(selectedCategory) || subj.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const testSection = document.getElementById("lms-courses-section");
    if (testSection) {
      testSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="lms-landing-page">
      {/* Top Banner Notice */}
      <div className="lms-top-announcement">
        <div className="announcement-content">
          <span className="announcement-tag">NEW</span>
          <span>
            Institutional Onboarding is now live! Host campus exams, assign batches, and automate grading seamlessly.
          </span>
          <Link to="/join-us" className="announcement-link">
            Learn More →
          </Link>
        </div>
      </div>

      {/* Main LMS Header Navigation */}
      <header className="lms-header">
        <div className="lms-header-container">
          {/* Logo & Brand */}
          <Link to="/" className="lms-brand">
            <BrandCrest size={34} />
            <div className="brand-text-group">
              <span className="brand-title">AssessIQ</span>
              <span className="brand-subtitle">Assessment Portal</span>
            </div>
          </Link>

          {/* Global Header Search Bar (Udemy Style) */}
          <form className="lms-header-search" onSubmit={handleSearchSubmit}>
            <SearchIcon size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search for any skill, subject, or certification exam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="global-lms-search"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                ×
              </button>
            )}
          </form>

          {/* Navigation Links */}
          <nav className="lms-nav-links">
            <a href="#lms-courses-section">Browse Tests</a>
            <a href="#learning-tracks">Skill Tracks</a>
            <Link to="/join-us">For Institutions</Link>
            <Link to="/join-us">Teach with Us</Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="lms-auth-actions">
            <Link to="/login" className="btn btn-secondary lms-btn-login">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary lms-btn-signup">
              Sign Up Free
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="lms-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lms-mobile-drawer">
            <a href="#lms-courses-section" onClick={() => setMobileMenuOpen(false)}>Browse Tests</a>
            <a href="#learning-tracks" onClick={() => setMobileMenuOpen(false)}>Skill Tracks</a>
            <Link to="/join-us" onClick={() => setMobileMenuOpen(false)}>For Institutions</Link>
            <Link to="/join-us" onClick={() => setMobileMenuOpen(false)}>Teach with Us</Link>
            <div className="lms-mobile-drawer-auth">
              <Link to="/login" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Sign Up Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* Udemy-Style Hero Billboard Banner */}
      <section className="lms-hero-billboard">
        <div className="hero-billboard-container">
          <div className="hero-text-column">
            <div className="hero-trust-pill">
              <SparklesIcon size={14} />
              <span>Next-Gen Multi-Tenant Assessment & MCQ Evaluation</span>
            </div>

            <h1 className="hero-billboard-heading">
              Skills that drive your career forward.{" "}
              <span className="hero-highlight">Verified through real-time assessments.</span>
            </h1>

            <p className="hero-billboard-subtext">
              Join over 25,000+ students and top institutions testing knowledge with timed exams,
              server-synchronized anti-cheat sessions, and instant percentile scorecards.
            </p>

            {/* Hero CTA Buttons */}
            <div className="hero-cta-buttons">
              <a href="#lms-courses-section" className="btn-hero-explore">
                <SparklesIcon size={16} /> Explore Free Public Tests
              </a>
              <Link to="/join-us" className="btn-hero-partner">
                <BuildingIcon size={16} /> Onboard Institution →
              </Link>
            </div>

            {/* In-Hero Search and Category Quick Chips */}
            <form className="hero-search-box" onSubmit={handleSearchSubmit}>
              <SearchIcon size={20} className="hero-search-icon" />
              <input
                type="text"
                placeholder="What skill or test do you want to master today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="hero-search-btn">
                Search Assessments
              </button>
            </form>

            <div className="hero-quick-tags">
              <span className="tags-label">Popular Searches:</span>
              {["Python", "Full Stack", "Data Science", "Aptitude", "Cloud", "Cybersecurity"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="quick-tag-chip"
                  onClick={() => {
                    setSearchQuery(tag);
                    const testSection = document.getElementById("lms-courses-section");
                    if (testSection) testSection.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right Hero Interactive Preview Card */}
          <div className="hero-preview-column">
            <div className="hero-live-card">
              <div className="live-card-badge" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                <span className="live-dot" style={{ background: "#10b981" }}></span> PLATFORM HIGHLIGHTS
              </div>
              <div className="live-card-body">
                <h3>Enterprise Multi-Tenant Assessment Engine</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "14px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
                    <span style={{ fontSize: "16px" }}>⏱️</span>
                    <span>Server-Synchronized Non-Tamper Timers</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
                    <span style={{ fontSize: "16px" }}>🛡️</span>
                    <span>Active Tab Anti-Cheat & Proctored Submission</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
                    <span style={{ fontSize: "16px" }}>📊</span>
                    <span>Instant Automated Grading & PDF Scorecards</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
                    <span style={{ fontSize: "16px" }}>🏫</span>
                    <span>Hermetic Institution & Batch Cohort Isolation</span>
                  </div>
                </div>
              </div>
              <div className="live-card-footer" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Ready to evaluate your skills?</span>
                  <Link to="/register" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0284c7", textDecoration: "none" }}>
                    Create Student Account →
                  </Link>
                </div>
              </div>
            </div>

            {/* Floating Trust Indicator */}
            <div className="floating-metric-card top">
              <div className="metric-icon"><BadgeCheckIcon size={22} /></div>
              <div>
                <strong>100% Verifiable</strong>
                <span>Digitally signed certificates</span>
              </div>
            </div>

            <div className="floating-metric-card bottom">
              <div className="metric-icon"><BuildingIcon size={22} /></div>
              <div>
                <strong>Multi-Tenant Ready</strong>
                <span>Isolated Campus Portals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Stats Ribbon */}
      <section className="lms-stats-ribbon">
        <div className="stats-ribbon-container">
          <div className="stat-box">
            <strong>50,000+</strong>
            <span>Assessments Completed</span>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-box">
            <strong>150+</strong>
            <span>Educational Institutions</span>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-box">
            <strong>99.8%</strong>
            <span>Verified Test Integrity</span>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-box">
            <strong>4.9 / 5.0</strong>
            <span>Learner & Faculty Rating</span>
          </div>
        </div>
      </section>

      {/* Top Categories / Skill Tracks */}
      <section id="learning-tracks" className="lms-categories-section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">LEARNING TRACKS</span>
              <h2>Top Assessment Categories to Explore</h2>
              <p>Prepare for technical interviews, semester exams, and career credentials.</p>
            </div>
            <Link to="/public-tests" className="view-all-link">
              Explore All Categories →
            </Link>
          </div>

          <div className="categories-grid">
            {ASSESSMENT_TRACKS.map((cat) => (
              <div
                key={cat.id}
                className={`category-card ${selectedCategory === cat.id ? "active-category" : ""}`}
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat.id ? "all" : cat.id);
                  const el = document.getElementById("lms-courses-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="category-icon-wrapper" style={{ color: cat.color, background: `${cat.color}15` }}>
                  {renderCategoryIcon(cat.id)}
                </div>
                <h3>{cat.name}</h3>
                <span className="category-count" style={{ fontSize: "0.78rem", color: "#64748b" }}>Click to filter</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Assessment Cards Section */}
      <section id="lms-courses-section" className="lms-courses-section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">CURATED ASSESSMENTS</span>
              <h2>A Broad Selection of Standardized MCQ Exams</h2>
              <p>Practice with real-world timed simulations, negative marking, and detailed answer keys.</p>
            </div>

            {/* Filter Tabs */}
            <div className="lms-filter-tabs">
              <button
                className={`filter-pill ${selectedCategory === "all" ? "active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                All Courses ({displayTests.length})
              </button>
              <button
                className={`filter-pill ${selectedCategory === "software" ? "active" : ""}`}
                onClick={() => setSelectedCategory("software")}
              >
                Software & Web
              </button>
              <button
                className={`filter-pill ${selectedCategory === "ai" ? "active" : ""}`}
                onClick={() => setSelectedCategory("ai")}
              >
                Data Science & AI
              </button>
              <button
                className={`filter-pill ${selectedCategory === "cloud" ? "active" : ""}`}
                onClick={() => setSelectedCategory("cloud")}
              >
                Cloud & DevOps
              </button>
              <button
                className={`filter-pill ${selectedCategory === "aptitude" ? "active" : ""}`}
                onClick={() => setSelectedCategory("aptitude")}
              >
                Aptitude
              </button>
            </div>
          </div>

          {/* Test Cards Grid */}
          <div className="courses-grid">
            {loadingTests ? (
              <div className="courses-loading">
                <div className="spinner"></div>
                <p>Loading assessment catalog...</p>
              </div>
            ) : filteredTests.length > 0 ? (
              filteredTests.map((test) => (
                <div key={test._id} className="course-card">
                  {/* Card Thumbnail / Header */}
                  <div className="course-thumbnail">
                    {test.image ? (
                      <img
                        src={test.image}
                        alt={test.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="thumbnail-backdrop">
                        <BookOpenIcon size={32} />
                      </div>
                    )}
                    <span className="difficulty-pill">{test.subject}</span>
                  </div>

                  {/* Card Details */}
                  <div className="course-content">
                    <span className="course-subject">{test.subject || "General MCQ"}</span>
                    <h3 className="course-title" title={test.title}>{test.title}</h3>
                    <p className="course-instructor">{test.organizationName || "AssessIQ Academic Platform"}</p>

                    {/* Exam Meta: Time, Questions, Auto-Evaluation */}
                    <div className="course-meta-tags">
                      <span className="meta-tag"><ClockIcon size={12} /> {test.duration || 30} mins</span>
                      <span className="meta-tag"><HelpCircleIcon size={12} /> {test.questionCount || 0} Qs</span>
                      <span className="meta-tag"><BadgeCheckIcon size={12} /> Auto-Evaluated</span>
                    </div>

                    <p className="course-snippet">
                      {test.description || "Comprehensive conceptual evaluation with server-side timed scoring."}
                    </p>

                    {/* Card Footer Action */}
                    <div className="course-card-footer">
                      <div className="course-pricing">
                        <span className="price-tag">Free Assessment</span>
                        <span className="price-sub">Instant Access</span>
                      </div>
                      <button
                        className="btn-start-course"
                        onClick={() => navigate("/login")}
                      >
                        Take Test <PlayIcon size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="courses-empty" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                <p style={{ fontSize: "1.05rem", color: "#475569", marginBottom: "1rem" }}>
                  {searchQuery
                    ? `No public tests found matching "${searchQuery}".`
                    : "No public tests currently available in this category. Sign in to your institutional workspace to access tests assigned to your batch."}
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  {searchQuery && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                    >
                      Clear Search Filters
                    </button>
                  )}
                  <Link to="/login" className="btn btn-primary btn-sm">
                    Sign In to Your Portal
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="lms-features-section">
        <div className="section-container">
          <div className="features-intro">
            <span className="section-kicker">WHY ASSESSIQ</span>
            <h2>Engineered for High-Stakes Institutional Assessment</h2>
            <p>From university midterms to industry hiring certifications, we guarantee security, speed, and deep analytical clarity.</p>
          </div>

          <div className="features-four-grid">
            <div className="lms-feature-card">
              <div className="feature-icon-circle blue">
                <ClockIcon size={24} />
              </div>
              <h3>Synchronized Timed Sessions</h3>
              <p>Zero frontend client-side timer tampering. Server-side timestamp clocks enforce auto-submission the exact second duration ends.</p>
            </div>

            <div className="lms-feature-card">
              <div className="feature-icon-circle purple">
                <BarChartIcon size={24} />
              </div>
              <h3>Diagnostic Topic Analytics</h3>
              <p>Understand student knowledge gaps with granular subject breakdown, speed-per-question analysis, and percentile rankings.</p>
            </div>

            <div className="lms-feature-card">
              <div className="feature-icon-circle emerald">
                <BadgeCheckIcon size={24} />
              </div>
              <h3>Verifiable Digital Certifications</h3>
              <p>Generate cryptographic tamper-proof PDF scorecards and digital achievement credentials that students can share on LinkedIn.</p>
            </div>

            <div className="lms-feature-card">
              <div className="feature-icon-circle amber">
                <BuildingIcon size={24} />
              </div>
              <h3>Multi-Tenant Campus Isolation</h3>
              <p>Strict database boundaries for every institution. Separate rosters, custom question banks, and dedicated batch enrollments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="lms-reviews-section">
        <div className="section-container">
          <div className="section-heading-row" style={{ justifyContent: "center", textAlign: "center" }}>
            <div>
              <span className="section-kicker">TESTIMONIALS</span>
              <h2>How Students & Faculty Excel with AssessIQ</h2>
            </div>
          </div>

          <div className="reviews-grid">
            <div className="review-card">
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="star-icon-gold"><StarIcon size={14} /></span>
                ))}
              </div>
              <p className="review-quote">
                "The realistic countdown and immediate score breakdown helped our computer science students prepare for actual technical placement drives. Outstanding platform."
              </p>
              <div className="reviewer-info">
                <div className="reviewer-avatar">VS</div>
                <div>
                  <strong>Prof. Vikram S.</strong>
                  <span>Head of Department, Tech University</span>
                </div>
              </div>
            </div>

            <div className="review-card">
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="star-icon-gold"><StarIcon size={14} /></span>
                ))}
              </div>
              <p className="review-quote">
                "Taking timed MCQ tests with negative marking conditioned my exam timing completely. I went from 65% to 88% on competitive entrance mocks in two months."
              </p>
              <div className="reviewer-info">
                <div className="reviewer-avatar student">PA</div>
                <div>
                  <strong>Pooja Agarwal</strong>
                  <span>Engineering Graduate & Cloud Aspirant</span>
                </div>
              </div>
            </div>

            <div className="review-card">
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="star-icon-gold"><StarIcon size={14} /></span>
                ))}
              </div>
              <p className="review-quote">
                "Managing 400+ students across three distinct batches with zero administrative overhead was incredible. Grading used to take days; now it happens instantly."
              </p>
              <div className="reviewer-info">
                <div className="reviewer-avatar">RM</div>
                <div>
                  <strong>Dr. Rajesh Mehta</strong>
                  <span>Dean of Academic Assessment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor & Institutional Banner */}
      <section className="lms-instructor-banner">
        <div className="section-container">
          <div className="instructor-banner-card">
            <div className="banner-column">
              <span className="banner-tag">FOR INSTRUCTORS</span>
              <h2>Become an Instructor & Author Assessments</h2>
              <p>Share your domain expertise with thousands of learners. Create MCQ question banks, conduct proctored evaluations, and track student success metrics.</p>
              <Link to="/join-us" className="btn btn-secondary">
                Apply as Faculty Today →
              </Link>
            </div>

            <div className="banner-divider"></div>

            <div className="banner-column">
              <span className="banner-tag">FOR INSTITUTIONS</span>
              <h2>Transform Your Campus Assessment Strategy</h2>
              <p>Empower your university, college, or coaching institute with a private multi-tenant portal, selective batch scheduling, and comprehensive audit logs.</p>
              <Link to="/join-us" className="btn btn-primary">
                Onboard Your Institution →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rich Footer */}
      <footer className="lms-footer">
        <div className="footer-top-container">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <BrandCrest size={32} />
              <span className="footer-brand-title">AssessIQ</span>
            </div>
            <p className="footer-desc">
              The premier institutional multi-tenant assessment and examination SaaS platform.
              Dedicated to delivering secure, intelligent, and scalable evaluation tools.
            </p>
            <div className="footer-badge-row">
              <span className="footer-badge">ISO 27001 Compliant</span>
              <span className="footer-badge">99.9% Uptime</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h4>Explore Tracks</h4>
            <ul>
              <li><a href="#learning-tracks">Software Engineering</a></li>
              <li><a href="#learning-tracks">Data Science & AI</a></li>
              <li><a href="#learning-tracks">Cloud Architecture</a></li>
              <li><a href="#learning-tracks">Quantitative Aptitude</a></li>
              <li><a href="#learning-tracks">Academics & Midterms</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>For Institutions</h4>
            <ul>
              <li><Link to="/join-us">Campus Onboarding</Link></li>
              <li><Link to="/join-us">Faculty Application</Link></li>
              <li><Link to="/login">Institutional Sign-In</Link></li>
              <li><Link to="/register">Student Registration</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Platform & Support</h4>
            <ul>
              <li><Link to="/contact">Help & Contact</Link></li>
              <li><Link to="/donate">Support Education</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-bottom-container">
            <span>© 2026 AssessIQ Assessment Technologies Inc. All rights reserved.</span>
            <div className="footer-bottom-links">
              <span>English (US)</span>
              <span>•</span>
              <span>Multi-Tenant Architecture</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
