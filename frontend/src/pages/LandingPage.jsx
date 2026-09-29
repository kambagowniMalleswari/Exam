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

// Rich curated LMS tracks for the Udemy-style portal
const LMS_CATEGORIES = [
  { id: "software", name: "Software Development", icon: <CodeIcon size={20} />, count: "180+ Tests", color: "#0284c7" },
  { id: "ai", name: "Data Science & AI", icon: <CpuIcon size={20} />, count: "120+ Tests", color: "#8b5cf6" },
  { id: "cloud", name: "Cloud & DevOps", icon: <GlobeIcon size={20} />, count: "95+ Tests", color: "#06b6d4" },
  { id: "aptitude", name: "Aptitude & Reasoning", icon: <SparklesIcon size={20} />, count: "240+ Tests", color: "#f59e0b" },
  { id: "academics", name: "University Academics", icon: <GraduationCapIcon size={20} />, count: "310+ Tests", color: "#10b981" },
  { id: "cyber", name: "Cybersecurity & Security", icon: <ShieldIcon size={20} />, count: "75+ Tests", color: "#ef4444" }
];

const CURATED_FEATURED_TESTS = [
  {
    _id: "curated-1",
    title: "Full-Stack React & Node.js Architecture Certification",
    subject: "Software Development",
    category: "software",
    instructor: "Dr. Arvind Rao • Senior Full-Stack Architect",
    rating: 4.9,
    ratingCount: 2840,
    duration: 45,
    questionCount: 35,
    difficulty: "Intermediate",
    badge: "Bestseller",
    description: "Validate deep concepts in React 18, state management, asynchronous REST APIs, and event loops.",
    isCurated: true
  },
  {
    _id: "curated-2",
    title: "Python Data Structures & Algorithm Optimization",
    subject: "Data Science & AI",
    category: "ai",
    instructor: "Prof. Sarah Jenkins • MIT Algorithms Faculty",
    rating: 4.8,
    ratingCount: 3410,
    duration: 60,
    questionCount: 40,
    difficulty: "Advanced",
    badge: "High Rated",
    description: "Rigorous timed assessment on binary trees, graph algorithms, dynamic programming, and complexity.",
    isCurated: true
  },
  {
    _id: "curated-3",
    title: "AWS Cloud Practitioner & DevOps Essentials Exam",
    subject: "Cloud & DevOps",
    category: "cloud",
    instructor: "Mark Vance • AWS Certified Solutions Architect",
    rating: 4.9,
    ratingCount: 1950,
    duration: 50,
    questionCount: 50,
    difficulty: "Intermediate",
    badge: "Popular",
    description: "Covers VPC architectures, IAM security policies, S3 lifecycle, EC2 autoscaling, and CI/CD pipelines.",
    isCurated: true
  },
  {
    _id: "curated-4",
    title: "Quantitative Aptitude & Logical Reasoning Master Test",
    subject: "Aptitude & Reasoning",
    category: "aptitude",
    instructor: "K. R. Murthy • Placement & Competitive Trainer",
    rating: 4.7,
    ratingCount: 5120,
    duration: 40,
    questionCount: 45,
    difficulty: "All Levels",
    badge: "Essential",
    description: "Standardized numerical ability, permutation & combination, logical deductions, and data sufficiency.",
    isCurated: true
  },
  {
    _id: "curated-5",
    title: "Machine Learning & Deep Neural Network Foundations",
    subject: "Data Science & AI",
    category: "ai",
    instructor: "Dr. Elena Rostova • Stanford AI Lab",
    rating: 4.9,
    ratingCount: 1670,
    duration: 55,
    questionCount: 35,
    difficulty: "Advanced",
    badge: "Trending",
    description: "Supervised & unsupervised learning, gradient descent mathematics, transformer basics, and model evaluation.",
    isCurated: true
  },
  {
    _id: "curated-6",
    title: "Database Management Systems (DBMS & SQL Injection)",
    subject: "Software Development",
    category: "software",
    instructor: "Vikram Nair • Principal Database Engineer",
    rating: 4.8,
    ratingCount: 2280,
    duration: 35,
    questionCount: 30,
    difficulty: "Beginner to Intermediate",
    badge: "Top Pick",
    description: "ACID properties, normalization, indexing strategies, complex joins, transactions, and security checks.",
    isCurated: true
  }
];

const LandingPage = () => {
  const [publicTests, setPublicTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AssessIQ — Leading LMS & Multi-Tenant Assessment Portal";

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

  // Combine backend public tests with curated LMS tests
  const combinedTests = [
    ...publicTests.map((t) => ({
      ...t,
      instructor: t.createdBy?.name ? `Prof. ${t.createdBy.name}` : "AssessIQ Certified Faculty",
      rating: 4.8,
      ratingCount: 650 + Math.floor((t.duration || 30) * 12),
      difficulty: t.duration > 45 ? "Advanced" : "Intermediate",
      badge: "Institutional",
      category: (t.subject || "software").toLowerCase()
    })),
    ...CURATED_FEATURED_TESTS
  ];

  // Filter based on search query and category tab
  const filteredTests = combinedTests.filter((test) => {
    const matchesSearch =
      !searchQuery.trim() ||
      test.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      (test.category && test.category.includes(selectedCategory)) ||
      (test.subject && test.subject.toLowerCase().includes(selectedCategory));

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
            🎓 Institutional Onboarding is now live! Host campus exams, assign batches, and automate grading seamlessly.
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
              <span className="brand-subtitle">LMS & Assessment Portal</span>
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
        </div>
      </header>

      {/* Udemy-Style Hero Billboard Banner */}
      <section className="lms-hero-billboard">
        <div className="hero-billboard-container">
          <div className="hero-text-column">
            <div className="hero-trust-pill">
              <SparklesIcon size={14} />
              <span>Next-Gen Learning Management & MCQ Evaluation</span>
            </div>

            <h1 className="hero-billboard-heading">
              Skills that drive your career forward.{" "}
              <span className="hero-highlight">Verified through real-time assessments.</span>
            </h1>

            <p className="hero-billboard-subtext">
              Join over 25,000+ students and top institutions testing knowledge with timed exams,
              server-synchronized anti-cheat sessions, and instant percentile scorecards.
            </p>

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
              <div className="live-card-badge">
                <span className="live-dot"></span> LIVE TEST SESSION
              </div>
              <div className="live-card-body">
                <h3>Advanced React & Node Architecture Assessment</h3>
                <div className="live-timer-mock">
                  <ClockIcon size={16} />
                  <span>Time Remaining: <strong>24:38</strong></span>
                </div>
                <div className="progress-bar-mock">
                  <div className="progress-fill" style={{ width: "68%" }}></div>
                </div>
                <div className="live-stats-row">
                  <span>Questions Answered: <strong>24 / 35</strong></span>
                  <span className="accuracy-pill">94% Accuracy</span>
                </div>
              </div>
              <div className="live-card-footer">
                <div className="student-avatars-mock">
                  <span className="avatar">A</span>
                  <span className="avatar">S</span>
                  <span className="avatar">R</span>
                  <span className="avatar-more">+420</span>
                </div>
                <span className="live-enrolled-text">Active participants right now</span>
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
              <div className="metric-icon"><UsersIcon size={22} /></div>
              <div>
                <strong>150+ Campuses</strong>
                <span>Schools & Universities on AssessIQ</span>
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
            {LMS_CATEGORIES.map((cat) => (
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
                  {cat.icon}
                </div>
                <h3>{cat.name}</h3>
                <span className="category-count">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Udemy-Style Featured Assessment Cards Section */}
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
                All Courses ({combinedTests.length})
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
                    <div className="thumbnail-backdrop">
                      <BookOpenIcon size={32} />
                    </div>
                    {test.badge && <span className="course-badge">{test.badge}</span>}
                    <span className="difficulty-pill">{test.difficulty || "Intermediate"}</span>
                  </div>

                  {/* Card Details */}
                  <div className="course-content">
                    <span className="course-subject">{test.subject || "General MCQ"}</span>
                    <h3 className="course-title" title={test.title}>{test.title}</h3>
                    <p className="course-instructor">{test.instructor || "AssessIQ Expert Faculty"}</p>

                    {/* Star Ratings */}
                    <div className="course-rating-row">
                      <span className="rating-score">{test.rating || "4.8"}</span>
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="star-icon-gold"><StarIcon size={13} /></span>
                        ))}
                      </div>
                      <span className="rating-count">({(test.ratingCount || 1200).toLocaleString()})</span>
                    </div>

                    {/* Exam Meta: Time, Questions, Auto-Evaluation */}
                    <div className="course-meta-tags">
                      <span className="meta-tag"><ClockIcon size={12} /> {test.duration || 30} mins</span>
                      <span className="meta-tag"><HelpCircleIcon size={12} /> {test.questionCount || 25} Qs</span>
                      <span className="meta-tag"><BadgeCheckIcon size={12} /> Certificate</span>
                    </div>

                    <p className="course-snippet">
                      {test.description || "Comprehensive conceptual evaluation with server-side timed scoring."}
                    </p>

                    {/* Card Footer Action */}
                    <div className="course-card-footer">
                      <div className="course-pricing">
                        <span className="price-tag">Free Practice</span>
                        <span className="price-sub">Instant Access</span>
                      </div>
                      <button
                        className="btn-start-course"
                        onClick={() => navigate("/login")}
                      >
                        Start Test <PlayIcon size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="courses-empty">
                <p>No tests found matching "{searchQuery}". Try a different keyword or category.</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Platform Highlights (LMS Feature Pillars) */}
      <section className="lms-features-section">
        <div className="section-container">
          <div className="features-intro">
            <span className="section-kicker">WHY ASSESSIQ LMS</span>
            <h2>Engineered for High-Stakes Institutional Learning</h2>
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

      {/* Social Proof / Student & Educator Reviews */}
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

      {/* Udemy-Style "Teach on AssessIQ" & "Institutional Portal" Callout Banner */}
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

      {/* Rich LMS Footer */}
      <footer className="lms-footer">
        <div className="footer-top-container">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <BrandCrest size={32} />
              <span className="footer-brand-title">AssessIQ</span>
            </div>
            <p className="footer-desc">
              The premier institutional multi-tenant assessment and learning management SaaS platform.
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
            <span>© 2026 AssessIQ Learning & Assessment Technologies Inc. All rights reserved.</span>
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
