import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getDefaultDashboard } from "../utils/roleUtils.js";
import api from "../services/api.js";
import VmsLogo from "../components/common/VmsLogo.jsx";
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
import Footer from "../components/common/Footer.jsx";
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
  const { user } = useAuth();

  useEffect(() => {
    document.title = "VMS | AssessIQ — Multi-Tenant Institutional Assessment & MCQ Portal";

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
  };  // Derive dynamic categories from available tests
  const dynamicCategories = [
    { id: "all", label: "All Assessments" },
    ...Array.from(
      new Set(
        displayTests
          .map((t) => t.subject?.trim())
          .filter((s) => s && s.toLowerCase() !== "general")
      )
    ).slice(0, 5).map((subj) => ({
      id: subj.toLowerCase(),
      label: subj
    }))
  ];

  return (
    <div className="lms-landing-page">
      {/* Navigation Bar */}
      <header className="lms-header">
        <div className="lms-header-container">
          <Link to="/" className="lms-brand" aria-label="VMS Home">
            <VmsLogo size={44} />
          </Link>

          <nav className="lms-nav-links">
            <Link to="/" className="active">Home</Link>
            <Link to="/public-tests">Courses</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/join-us">For Institutions</Link>
          </nav>

          <div className="lms-auth-actions">
            {user ? (
              <div className="lms-user-pill-wrap">
                <Link to={getDefaultDashboard(user.role)} className="btn btn-primary lms-btn-signup">
                  {user.role === "teacher" ? "Instructor Dashboard →" : user.role === "student" ? "Student Dashboard →" : "Dashboard →"}
                </Link>
                <div className="lms-user-avatar" title={user.name || user.email}>
                  {(user.name?.[0] || user.role?.[0] || "U").toUpperCase()}
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary lms-btn-login">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary lms-btn-signup">
                  Get Started
                </Link>
              </>
            )}
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
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/public-tests" onClick={() => setMobileMenuOpen(false)}>Courses</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <Link to="/join-us" onClick={() => setMobileMenuOpen(false)}>For Institutions</Link>
            <div className="lms-mobile-drawer-auth">
              {user ? (
                <Link to={getDefaultDashboard(user.role)} className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                  My Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  <Link to="/register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Matching Image 5 */}
      <section className="lms-hero-mentor-section">
        <div className="hero-mentor-container">
          {/* Left Text Column */}
          <div className="hero-mentor-text-col">
            <div className="hero-satisfaction-pill">
              <span className="sat-amber-dot"></span>
              <span>100% SATISFACTION GUARANTEE</span>
            </div>

            <h1 className="hero-mentor-heading">
              Learn any new skills from us from our <span className="hero-mentor-highlight">expert mentor</span>
            </h1>

            <p className="hero-mentor-subtext">
              Let's find the right course for you and start learning from our professional mentors to advance your career.
            </p>

            <div className="hero-mentor-cta-group">
              <Link to="/public-tests" className="btn-mentor-start">
                Get Started
              </Link>
              <a href="#available-tests" className="btn-mentor-how">
                <span className="play-circle-icon">▶</span>
                <span>See How It Works</span>
              </a>
            </div>

            <form className="hero-mentor-search" onSubmit={handleSearchSubmit}>
              <SearchIcon size={18} className="hero-search-icon" />
              <input
                type="text"
                placeholder="Search assessments by subject or course (e.g. Python, Aptitude, Java)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search Assessments"
              />
              <button type="submit" className="hero-search-btn">
                Search
              </button>
            </form>
          </div>

          {/* Right Visual Column matching Image 5 */}
          <div className="hero-mentor-visual-col">
            <div className="mentor-visual-card">
              <div className="mentor-img-frame">
                <img
                  src="/expert-mentor-hero.jpg"
                  alt="Professional Academic Mentor"
                  className="mentor-real-img"
                />
              </div>

              {/* Floating Star Rating Card matching Image 5 */}
              <div className="mentor-floating-rating">
                <div className="rating-star-box">★</div>
                <div className="rating-details">
                  <strong className="rating-score">4.9 / 5.0</strong>
                  <span className="rating-label">25k+ Mentors with 5 star rating</span>
                </div>
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
              <span className="section-kicker">EXAMINATION CATALOG</span>
              <h2>Available Assessments</h2>
              <p>Practice with real-time countdown timers, automatic evaluation, and comprehensive question answer keys.</p>
            </div>

            <div className="lms-filter-tabs">
              {dynamicCategories.map((tab) => (
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
                    <img
                      src={test.image || "/tests-hero-banner.jpg"}
                      alt={test.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/tests-hero-banner.jpg";
                      }}
                    />
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
            <h2>Why Institutions Trust AssessIQ</h2>
            <p>Engineered for secure, uncompromised, and high-concurrency academic assessment.</p>
          </div>

          <div className="features-three-grid">
            <div className="lms-feature-card">
              <div className="feature-icon-circle blue">
                <ClockIcon size={22} />
              </div>
              <h3>Server-Synced Tamper-Proof Timers</h3>
              <p>Hardware-synchronized countdown clocks auto-submit exams precisely when the duration concludes, eliminating client-side tampering.</p>
            </div>

            <div className="lms-feature-card">
              <div className="feature-icon-circle emerald">
                <BarChartIcon size={22} />
              </div>
              <h3>Instant Automated Grading</h3>
              <p>Scores are calculated immediately upon submission with negative marking, question telemetry, and verifiable digital transcripts.</p>
            </div>

            <div className="lms-feature-card">
              <div className="feature-icon-circle amber">
                <BuildingIcon size={22} />
              </div>
              <h3>Hermetic Tenant Isolation</h3>
              <p>Every university, college, or training academy operates in a completely isolated workspace with private batches, faculty, and custom question banks.</p>
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

      {/* Global VMS Learning Platform Footer (Image 2) */}
      <Footer />
    </div>
  );
};

export default LandingPage;
