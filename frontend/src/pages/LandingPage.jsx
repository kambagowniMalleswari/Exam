import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import {
  ClockIcon,
  HelpCircleIcon,
  SearchIcon,
  BookOpenIcon,
  BadgeCheckIcon,
  PlayIcon,
  BuildingIcon,
  ShieldIcon,
  BarChartIcon,
  SparklesIcon
} from "../components/common/Icons.jsx";
import "./LandingPage.css";

// Direct AEO & SEO Structured FAQs
const FAQS = [
  {
    q: "What is AssessIQ?",
    a: "AssessIQ is an institutional multi-tenant assessment platform designed for universities, colleges, and training academies to host secure, server-timed online MCQ examinations with automated grading."
  },
  {
    q: "How does multi-tenant isolation work for colleges?",
    a: "Every institution receives a dedicated private tenant portal. Student rosters, faculty members, question banks, and exam schedules remain completely isolated and secure."
  },
  {
    q: "How do anti-cheat timed assessments work?",
    a: "Exams run on synchronized server clocks with tab-switch detection. Even if a student changes browser tabs or system time, auto-submission executes at the exact duration deadline."
  },
  {
    q: "Can students practice free MCQ tests?",
    a: "Yes. Students can take public practice exams in software development, cloud, AI, and aptitude, receiving instant scorecards and performance breakdowns."
  }
];

const LandingPage = () => {
  const [publicTests, setPublicTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFaq, setOpenFaq] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AssessIQ — Multi-Tenant Institutional Assessment & MCQ Portal";

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

  // Format tests cleanly
  const displayTests = Array.isArray(publicTests)
    ? publicTests.map((t) => ({
        _id: t._id,
        title: t.title || t.name || "Assessment",
        subject: t.subject || "General",
        duration: Number(t?.duration) || 30,
        questionCount: Array.isArray(t.questions) ? t.questions.length : (t.questionCount || 0),
        image: t.image || "",
        organizationName: t.organizationId?.name || "AssessIQ Academic Platform",
        category: typeof t?.subject === "string" ? t.subject.toLowerCase() : "general"
      }))
    : [];

  // Filter tests
  const filteredTests = displayTests.filter((test) => {
    if (!test) return false;
    const q = (searchQuery || "").toLowerCase().trim();
    const title = (test.title || "").toLowerCase();
    const subj = (test.subject || "").toLowerCase();

    const matchesSearch = !q || title.includes(q) || subj.includes(q);
    const matchesCategory =
      selectedCategory === "all" ||
      subj.includes(selectedCategory) ||
      test.category.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const el = document.getElementById("available-tests");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lms-landing-page">
      {/* Navigation Bar */}
      <header className="lms-header">
        <div className="lms-header-container">
          <Link to="/" className="lms-brand" aria-label="AssessIQ Home">
            <BrandCrest size={32} />
            <div className="brand-text-group">
              <span className="brand-title">AssessIQ</span>
              <span className="brand-subtitle">Assessment Portal</span>
            </div>
          </Link>

          <nav className="lms-nav-links">
            <a href="#available-tests">Browse Tests</a>
            <a href="#key-benefits">Platform Features</a>
            <a href="#faq-section">FAQ</a>
            <Link to="/join-us">For Institutions</Link>
          </nav>

          <div className="lms-auth-actions">
            <Link to="/login" className="btn btn-secondary lms-btn-login">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary lms-btn-signup">
              Sign Up Free
            </Link>
          </div>

          <button
            type="button"
            className="lms-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lms-mobile-drawer">
            <a href="#available-tests" onClick={() => setMobileMenuOpen(false)}>Browse Tests</a>
            <a href="#key-benefits" onClick={() => setMobileMenuOpen(false)}>Platform Features</a>
            <a href="#faq-section" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <Link to="/join-us" onClick={() => setMobileMenuOpen(false)}>For Institutions</Link>
            <div className="lms-mobile-drawer-auth">
              <Link to="/login" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Sign Up Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Clean, High Impact */}
      <section className="lms-hero-billboard">
        <div className="hero-billboard-container">
          <div className="hero-text-column">
            <div className="hero-trust-pill">
              <SparklesIcon size={14} />
              <span>Multi-Tenant Online Assessment Platform</span>
            </div>

            <h1 className="hero-billboard-heading">
              Multi-Tenant Institutional MCQ & Assessment Platform
            </h1>

            <p className="hero-billboard-subtext">
              Conduct secure campus exams with synchronized anti-cheat timers, automatic grading, and dedicated private portals for every college and academy.
            </p>

            <div className="hero-cta-buttons">
              <a href="#available-tests" className="btn-hero-explore">
                Explore Tests <PlayIcon size={14} />
              </a>
              <Link to="/join-us" className="btn-hero-partner">
                <BuildingIcon size={15} /> Onboard Institution →
              </Link>
            </div>

            <form className="hero-search-box" onSubmit={handleSearchSubmit}>
              <SearchIcon size={18} className="hero-search-icon" />
              <input
                type="text"
                placeholder="Search tests by skill (e.g. Python, Aptitude, Web)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search Assessments"
              />
              <button type="submit" className="hero-search-btn">
                Search
              </button>
            </form>
          </div>

          <div className="hero-preview-column">
            <div className="hero-live-card">
              <div className="live-card-badge">
                <span className="live-dot"></span> LIVE ENGINE
              </div>
              <div className="live-card-body">
                <h3>Enterprise Examination Security</h3>
                <div className="feature-quick-list">
                  <div className="quick-list-item">
                    <span>⏱️</span>
                    <span>Server-Synchronized Non-Tamper Clocks</span>
                  </div>
                  <div className="quick-list-item">
                    <span>🛡️</span>
                    <span>Tab-Switch Anti-Cheat Proctoring</span>
                  </div>
                  <div className="quick-list-item">
                    <span>📊</span>
                    <span>Instant Grading with Negative Marking</span>
                  </div>
                  <div className="quick-list-item">
                    <span>🏫</span>
                    <span>Isolated Campus & Batch Workspaces</span>
                  </div>
                </div>
              </div>
              <div className="live-card-footer">
                <Link to="/register" className="card-footer-link">
                  Get Started as a Student →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Tests Section */}
      <section id="available-tests" className="lms-courses-section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">CURATED EXAMS</span>
              <h2>Available Assessments</h2>
              <p>Practice with real-time timers, automatic scoring, and comprehensive question answer keys.</p>
            </div>

            <div className="lms-filter-tabs">
              {[
                { id: "all", label: "All Tests" },
                { id: "software", label: "Software" },
                { id: "ai", label: "AI & Data" },
                { id: "cloud", label: "Cloud" },
                { id: "aptitude", label: "Aptitude" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`filter-pill ${selectedCategory === tab.id ? "active" : ""}`}
                  onClick={() => setSelectedCategory(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="courses-grid">
            {loadingTests ? (
              <div className="courses-loading">
                <div className="spinner"></div>
                <p>Loading assessment catalog...</p>
              </div>
            ) : filteredTests.length > 0 ? (
              filteredTests.map((test) => (
                <div key={test._id} className="course-card">
                  <div className="course-thumbnail">
                    {test.image ? (
                      <img
                        src={test.image}
                        alt={test.title}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="thumbnail-backdrop">
                        <BookOpenIcon size={28} />
                      </div>
                    )}
                    <span className="difficulty-pill">{test.subject}</span>
                  </div>

                  <div className="course-content">
                    <span className="course-subject">{test.subject}</span>
                    <h3 className="course-title" title={test.title}>{test.title}</h3>
                    <p className="course-instructor">{test.organizationName}</p>

                    <div className="course-meta-tags">
                      <span className="meta-tag"><ClockIcon size={12} /> {test.duration} mins</span>
                      <span className="meta-tag"><HelpCircleIcon size={12} /> {test.questionCount} Questions</span>
                      <span className="meta-tag"><BadgeCheckIcon size={12} /> Auto-Graded</span>
                    </div>

                    <div className="course-card-footer">
                      <span className="price-tag">Free Practice</span>
                      <button
                        type="button"
                        className="btn-start-course"
                        onClick={() => navigate("/login")}
                      >
                        Start Test <PlayIcon size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="courses-empty">
                <p>
                  {searchQuery
                    ? `No public tests match "${searchQuery}".`
                    : "No public tests currently available in this track. Sign in to access your institution's batch exams."}
                </p>
                <Link to="/login" className="btn btn-primary btn-sm">
                  Sign In to Your Workspace
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Key Benefits - 3 Crisp Value Cards */}
      <section id="key-benefits" className="lms-features-section">
        <div className="section-container">
          <div className="features-intro">
            <span className="section-kicker">CORE CAPABILITIES</span>
            <h2>Why Institutions Choose AssessIQ</h2>
            <p>Engineered for secure, fast, and scalable academic assessment.</p>
          </div>

          <div className="features-three-grid">
            <div className="lms-feature-card">
              <div className="feature-icon-circle blue">
                <ClockIcon size={22} />
              </div>
              <h3>Anti-Cheat Timed Sessions</h3>
              <p>Server-side clocks enforce auto-submission the exact second test duration elapses, preventing client-side timer manipulation.</p>
            </div>

            <div className="lms-feature-card">
              <div className="feature-icon-circle emerald">
                <BarChartIcon size={22} />
              </div>
              <h3>Instant Automated Grading</h3>
              <p>Scores are calculated immediately upon submission with negative marking, speed analytics, and downloadable PDF transcripts.</p>
            </div>

            <div className="lms-feature-card">
              <div className="feature-icon-circle amber">
                <BuildingIcon size={22} />
              </div>
              <h3>Multi-Tenant Campus Isolation</h3>
              <p>Every university, college, or training academy operates in a completely isolated workspace with private batches and custom question banks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AEO / SEO FAQ Section */}
      <section id="faq-section" className="lms-faq-section">
        <div className="section-container">
          <div className="features-intro">
            <span className="section-kicker">QUESTIONS & ANSWERS</span>
            <h2>Frequently Asked Questions</h2>
            <p>Direct answers about how the AssessIQ multi-tenant testing platform works.</p>
          </div>

          <div className="faq-list">
            {FAQS.map((item, idx) => (
              <div
                key={idx}
                className={`faq-item ${openFaq === idx ? "open" : ""}`}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="faq-question">
                  <span>{item.q}</span>
                  <span className="faq-toggle">{openFaq === idx ? "−" : "+"}</span>
                </div>
                {openFaq === idx && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional CTA Banner */}
      <section className="lms-cta-strip">
        <div className="section-container">
          <div className="cta-strip-card">
            <div>
              <h2>Ready to Elevate Your Institution's Assessments?</h2>
              <p>Join colleges and academies using AssessIQ for secure, proctored examinations.</p>
            </div>
            <div className="cta-strip-actions">
              <Link to="/join-us" className="btn btn-primary">
                Onboard Your Institution →
              </Link>
              <Link to="/contact" className="btn btn-secondary">
                Contact Platform Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Clean Footer */}
      <footer className="lms-footer">
        <div className="footer-top-container">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <BrandCrest size={28} />
              <span className="footer-brand-title">AssessIQ</span>
            </div>
            <p className="footer-desc">
              Multi-tenant institutional assessment SaaS platform.
            </p>
          </div>

          <div className="footer-links-row">
            <div>
              <h4>Platform</h4>
              <ul>
                <li><a href="#available-tests">Browse Tests</a></li>
                <li><a href="#key-benefits">Features</a></li>
                <li><a href="#faq-section">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4>Institutions</h4>
              <ul>
                <li><Link to="/join-us">Campus Onboarding</Link></li>
                <li><Link to="/join-us">Faculty Portal</Link></li>
                <li><Link to="/login">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4>Support</h4>
              <ul>
                <li><Link to="/contact">Help & Contact</Link></li>
                <li><Link to="/donate">Support Education</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-bottom-container">
            <span>© 2026 AssessIQ Platform. All rights reserved.</span>
            <span>Multi-Tenant Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
