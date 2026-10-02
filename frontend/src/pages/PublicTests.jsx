import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import {
  ClockIcon,
  HelpCircleIcon,
  AwardIcon,
  GlobeIcon,
  GraduationCapIcon,
  SearchIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  CheckCircleIcon
} from "../components/common/Icons.jsx";
import "./PublicTests.css";

const PublicTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    document.title = "Public Examination Catalog | AssessIQ";
    fetchPublicTests();
  }, []);

  const fetchPublicTests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tests/public");
      const data = res.data.tests || res.data || [];
      setTests(Array.isArray(data) ? data : []);
      const uniqueSubjects = [...new Set(data.map((t) => t.subject).filter(Boolean))];
      setSubjects(uniqueSubjects);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load public tests.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = tests.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === "all" || t.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const getDifficultyColor = (marks) => {
    if (marks <= 20) return "easy";
    if (marks <= 50) return "medium";
    return "hard";
  };

  return (
    <div className="public-tests-page">
      {/* Navbar */}
      <nav className="public-nav">
        <Link to="/" className="public-nav-brand">
          <BrandCrest size={32} />
          <span className="brand-name">AssessIQ</span>
        </Link>
        <div className="public-nav-actions">
          <Link to="/join-us" className="btn-link-partner">Join With Us</Link>
          <Link to="/login" className="btn-outline">Sign In</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="public-tests-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <GlobeIcon size={14} />
            <span>Public Assessment Catalog</span>
          </div>
          <h1>Explore Free MCQ Tests</h1>
          <p>
            Browse hundreds of publicly available tests from verified creators and accredited institutions.
            Sharpen your knowledge or preview exam structures with instant access.
          </p>

          {/* Integrated Search Bar */}
          <div className="public-search-wrapper">
            <div className="public-search-bar">
              <span className="search-icon-box">
                <SearchIcon size={18} />
              </span>
              <input
                type="text"
                placeholder="Search by title, subject, or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="public-search"
              />
              {search && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearch("")}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Styled Hero Stats Bar */}
          <div className="hero-stats-row">
            <div className="hero-stat-pill">
              <span className="stat-pill-num">{tests.length}</span>
              <span className="stat-pill-label">Public Tests</span>
            </div>
            <div className="hero-stat-sep"></div>
            <div className="hero-stat-pill">
              <span className="stat-pill-num">{subjects.length}</span>
              <span className="stat-pill-label">Subjects</span>
            </div>
            <div className="hero-stat-sep"></div>
            <div className="hero-stat-pill">
              <span className="stat-pill-badge">Free</span>
              <span className="stat-pill-label">Instant Preview</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="public-tests-container">
        {/* Filter Section */}
        <div className="public-filter-section">
          <div className="filter-chips-wrap">
            <span className="filter-title">Filter by Subject:</span>
            <div className="filter-chips">
              <button
                type="button"
                className={`filter-chip ${subjectFilter === "all" ? "active" : ""}`}
                onClick={() => setSubjectFilter("all")}
              >
                All
              </button>
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`filter-chip ${subjectFilter === s ? "active" : ""}`}
                  onClick={() => setSubjectFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <span className="filter-count-badge">
            <strong>{filtered.length}</strong> {filtered.length === 1 ? "test" : "tests"} found
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="public-tests-loading">
            <div className="spinner"></div>
            <p>Loading catalog tests...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="public-tests-error">
            <AlertTriangleIcon size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="public-tests-empty">
            <SearchIcon size={32} />
            <h3>No matching tests found</h3>
            <p>{search ? `No tests matching "${search}". Try searching for another topic.` : "No public tests are published yet."}</p>
            {search && (
              <button type="button" className="btn-reset-search" onClick={() => setSearch("")}>
                Reset Search
              </button>
            )}
          </div>
        )}

        {/* Tests Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="public-tests-grid">
            {filtered.map((test) => (
              <div className="public-test-card" key={test._id}>
                {/* Test Cover Image / Banner */}
                <div className="test-card-cover">
                  {test.image ? (
                    <img
                      src={test.image}
                      alt={test.title}
                      className="test-cover-img"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="test-cover-fallback">
                      <BookOpenIcon size={28} />
                      <span className="fallback-subject">{test.subject || "MCQ Assessment"}</span>
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="card-cover-badges">
                    <span className={`test-difficulty-badge ${getDifficultyColor(test.totalMarks)}`}>
                      {getDifficultyColor(test.totalMarks) === "easy"
                        ? "Beginner"
                        : getDifficultyColor(test.totalMarks) === "medium"
                        ? "Intermediate"
                        : "Advanced"}
                    </span>
                    <span className="test-public-badge">
                      <GlobeIcon size={11} /> Public
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="test-card-content">
                  {test.subject && (
                    <div className="test-subject-wrap">
                      <span className="subject-chip">
                        <GraduationCapIcon size={12} /> {test.subject}
                      </span>
                    </div>
                  )}
                  <h3 className="test-card-title">{test.title}</h3>
                  <p className="test-card-desc">
                    {test.instructions
                      ? test.instructions.slice(0, 110) + (test.instructions.length > 110 ? "..." : "")
                      : "Assess your knowledge with this verified multiple choice evaluation."}
                  </p>

                  <div className="test-meta-strip">
                    <span className="test-meta-item" title="Duration">
                      <ClockIcon size={13} /> {test.duration} min
                    </span>
                    <span className="test-meta-item" title="Question count">
                      <HelpCircleIcon size={13} /> {Array.isArray(test.questions) ? test.questions.length : test.questionCount || 0} Qs
                    </span>
                    <span className="test-meta-item" title="Total marks">
                      <AwardIcon size={13} /> {test.totalMarks || 0} marks
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="test-card-footer">
                  <div className="test-creator-info">
                    <div className="creator-avatar">
                      {test.createdBy?.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div className="creator-meta">
                      <span className="creator-name">{test.createdBy?.name || "Verified Author"}</span>
                      <span className="creator-badge"><CheckCircleIcon size={10} /> Verified</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={() => navigate("/register")}
                  >
                    Take Test →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CTA Footer Banner */}
      <section className="public-cta">
        <div className="public-cta-inner">
          <h2>Ready to take timed examinations?</h2>
          <p>Create a free student or educator account to access analytics, merit rankings, and certificates.</p>
          <div className="cta-actions">
            <Link to="/register" className="btn-primary-lg">Create Free Account</Link>
            <Link to="/login" className="btn-ghost-lg">Already registered? Sign In</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicTests;
