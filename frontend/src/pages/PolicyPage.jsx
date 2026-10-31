import React, { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import VmsLogo from "../components/common/VmsLogo.jsx";
import Footer from "../components/common/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getDefaultDashboard } from "../utils/roleUtils.js";
import "./PolicyPage.css";

const POLICIES_DATA = {
  terms: {
    slug: "terms",
    navLabel: "Terms & Conditions",
    badge: "LEGAL AGREEMENT",
    title: "Terms & Conditions of Service",
    updated: "Last Updated: October 2026 • Effective Immediately",
    notice:
      "Please read these Terms and Conditions carefully before using the VMS learning website or enrolling in any digital courses. By accessing, signing up, or making a payment on this website, you agree to be bound by these Terms.",
    sections: [
      {
        title: "1. Introduction & Overview",
        content: `This website and its associated assessment and learning management services are operated by VMS ("we", "us", or "our"). Throughout the site, the terms refer to our educational assessment engine, question authoring tools, live sandboxed code execution suite, and student learning portal.

We provide users and academic partners with access to pre-recorded technical materials, practice assessments, competitive examinations, automated scorecards, and verifiable certification courses upon enrollment or institutional license provision.`
      },
      {
        title: "2. Eligibility & Account Responsibilities",
        content: `By registering an account on VMS, you warrant that you are legally capable of entering into binding contracts. You are solely responsible for maintaining the confidentiality of your login credentials, password, and session access tokens.

Each candidate profile is strictly non-transferable. Attempting to share accounts, proxy tests, or allow secondary examinees to participate under your identity violates our Academic Integrity Standard and results in immediate forfeiture of test credits and account termination.`
      },
      {
        title: "3. Examination Rules & Anti-Cheat Proctoring",
        content: `All assessments administered through the VMS portal leverage synchronized server-side clocks, automated focus-loss detection, and anti-tamper telemetry:
• Tab-Switch Telemetry: Switching browser windows or navigating outside the active test runner is logged in the candidate audit trail.
• Server-Enforced Timeouts: Tests automatically submit when the server deadline expires, irrespective of local client-side system clock manipulation.
• Code Sandboxing: Submissions made in our polyglot coding workbench (Java, C, C++, Python, JavaScript, PHP, C#, TypeScript, Ruby, Go, Kotlin, Rust) are evaluated in an isolated container without network escape permissions.`
      },
      {
        title: "4. Intellectual Property & Course Assets",
        content: `All test banks, algorithmic challenges, proprietary explanations, grading rubrics, audio-visual materials, and platform code are the exclusive intellectual property of VMS and its licensed institutional partners.

You may not scrape, republish, redistribute, mirror, or reverse engineer any question papers, solution keys, or platform interfaces without express written authorization.`
      },
      {
        title: "5. Institutional Multi-Tenant Isolation",
        content: `Colleges, universities, and corporate training divisions using VMS receive hermetically isolated tenant environments. Faculty rosters, private departmental question repositories, and student cohorts are partitioned with tenant-specific encryption keys. Institutional administrators maintain sole authority over internal candidate batch assignments.`
      },
      {
        title: "6. Limitation of Liability & Warranties",
        content: `The platform and all examination modules are provided on an "as is" and "as available" basis. While we maintain a 99.9% uptime SLA, VMS shall not be held liable for candidate-side hardware malfunctions, power failures, or local internet service provider outages during exam sessions. In verified platform-side downtime, affected students are granted an administrative re-attempt without charge.`
      }
    ]
  },

  privacy: {
    slug: "privacy",
    navLabel: "Privacy Policy",
    badge: "DATA PROTECTION COMPLIANCE",
    title: "Privacy Policy & Candidate Data Protection",
    updated: "Last Updated: October 2026 • Strict Confidentiality Protocol",
    notice:
      "VMS adheres to international standards of educational privacy. We strictly safeguard candidate data, academic performance logs, and institutional assets with multi-tenant row-level isolation and zero third-party commercial data sharing.",
    sections: [
      {
        title: "1. Information We Collect",
        content: `We collect information necessary to administer academic assessments and issue verified credentials:
• Identity Data: Full legal name, verified email address, institutional roll/employee number, and phone number.
• Examination Telemetry: Start timestamps, submission timestamps, answer selections, coding inputs, compiler execution times, and focus-switch counters.
• Academic Affiliation: Enrolled institution, department, section, and assigned batches.`
      },
      {
        title: "2. How We Use Academic Data",
        content: `Candidate information is used strictly to:
• Compute examination scores, negative marking subtractions, percentile rankings, and difficulty curves.
• Generate instant digital scorecards and verified completion badges.
• Transmit authorized performance summaries and security alerts to the candidate's affiliated university administration.`
      },
      {
        title: "3. Multi-Tenant Row-Level Data Isolation",
        content: `Our database infrastructure operates with strict multi-tenant boundary checks:
• No student records, question databases, or test scores are ever cross-accessible between different institutions.
• Data is encrypted in transit using TLS 1.3 and at rest with AES-256 standard encryption.
• We do not sell, rent, or monetize student or educator data to advertisers, data brokers, or third-party recruiters.`
      },
      {
        title: "4. Cookies & Security Telemetry",
        content: `We use essential HTTP-only cookies and local session tokens exclusively to authenticate user logins, prevent cross-site request forgery (CSRF), and maintain examination timer continuity across intermittent network drops.`
      },
      {
        title: "5. Data Retention & Candidate Rights",
        content: `Assessment score records and exam attempt logs are retained in compliance with accredited university archiving policies. Candidates may request a digital copy of their past attempt breakdowns or request account data anonymization through their institutional portal administrator or by writing to privacy@vmsclass.in.`
      }
    ]
  },

  refund: {
    slug: "refund",
    navLabel: "Refund & Cancellation",
    badge: "ACADEMIC COMMERCE POLICY",
    title: "Refund & Cancellation Policy",
    updated: "Last Updated: October 2026 • Clear & Transparent Terms",
    notice:
      "We provide fair, student-friendly refund terms. Please review the qualifying conditions below for examination subscriptions, premium test attempts, and institutional license packages.",
    sections: [
      {
        title: "1. Examination Pass & Subscription Cancellations",
        content: `Candidates who purchase an individual premium test attempt or student learning pass are eligible for a 100% full refund within 48 hours of purchase, provided that no examination attempt has been initiated or submitted. Once a candidate clicks 'Start Test' or accesses proprietary examination content, test credits are permanently redeemed and non-refundable.`
      },
      {
        title: "2. Institutional Tier & Seat Allocations",
        content: `Universities and training partners purchasing seat licenses or bulk batch packages may adjust their committed student capacity within 7 calendar days of onboarding. Unallocated student seat credits can be transferred to future academic semesters or refunded on a prorated basis subject to platform provisioning fees.`
      },
      {
        title: "3. Technical Disruptions & Automatic Free Re-Attempts",
        content: `If an examination is interrupted due to a verified platform-side server failure or maintenance outage, candidates are automatically awarded a complimentary re-attempt voucher or a full refund at their discretion.`
      },
      {
        title: "4. Refund Processing Timelines",
        content: `Approved refunds are credited directly back to the original source payment method (Credit/Debit Card, UPI, Net Banking, or Institutional Invoice) within 5 to 7 standard business days, in accordance with banking clearing cycles.`
      },
      {
        title: "5. Raising a Refund Request",
        content: `To submit a refund or cancellation inquiry, email billing@vmsclass.in or info@vmsclass.in with your Registered Candidate Email, Transaction ID / Receipt Number, and Assessment Name. Our academic billing desk responds within 24 business hours.`
      }
    ]
  },

  shipping: {
    slug: "shipping",
    navLabel: "Shipping & Delivery",
    badge: "100% DIGITAL SAAS FULFILLMENT",
    title: "Shipping & Digital Delivery Policy",
    updated: "Last Updated: October 2026 • Instant Cloud Delivery",
    notice:
      "VMS Learning Platform is a pure digital cloud assessment software service. All examination access, batch enrollments, scorecards, and certificates are fulfilled instantly via secure electronic delivery.",
    sections: [
      {
        title: "1. Digital Fulfillment Model",
        content: `VMS operates as a software-as-a-service (SaaS) educational ecosystem. We do not manufacture, package, or physically ship tangible goods (such as physical books or paper certificates) via courier services. Zero shipping fees or handling charges are ever applied.`
      },
      {
        title: "2. Instant Examination Provisioning",
        content: `Upon successful enrollment or institutional assignment:
• Candidate accounts and test authorizations are provisioned instantaneously in the cloud portal.
• Candidates receive their test authorization link and login confirmation within seconds via authenticated platform email.
• Assigned assessments immediately appear in the student's 'Available Tests' dashboard.`
      },
      {
        title: "3. Real-Time Digital Certificates & Scorecards",
        content: `Official examination scorecards, question-by-question performance breakdowns, percentile distributions, and verifiable digital completion certificates are generated dynamically immediately upon test submission and remain permanently accessible for download in PDF format.`
      },
      {
        title: "4. Delivery Troubleshooting & Support",
        content: `If you do not see your enrolled assessment or scorecard within 5 minutes of transaction completion, please refresh your dashboard or check your spam/junk folder for verification emails. For immediate assistance, contact our technical desk at support@vmsclass.in or call +91 90006 21876.`
      }
    ]
  }
};

export const PolicyPage = ({ defaultType = "terms" }) => {
  const { policyType } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentType = (policyType || defaultType || "terms").toLowerCase();
  const activePolicy = POLICIES_DATA[currentType] || POLICIES_DATA.terms;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.title = `${activePolicy.title} — VMS Learning Platform`;
  }, [currentType, activePolicy]);

  return (
    <div className="vms-policy-page">
      {/* Top Navbar */}
      <header className="policy-navbar">
        <div className="policy-navbar-container">
          <Link to="/" className="policy-brand" aria-label="VMS Home">
            <VmsLogo size={42} />
          </Link>

          <nav className="policy-nav-links">
            <Link to="/">Home</Link>
            <Link to="/public-tests">Courses</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </nav>

          <div className="policy-nav-actions">
            {user ? (
              <Link to={getDefaultDashboard(user.role)} className="btn-policy-portal">
                My Dashboard →
              </Link>
            ) : (
              <Link to="/login" className="btn-policy-portal">
                Sign In →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner with Breadcrumbs & Real Academic Visual */}
      <section className="policy-hero-banner">
        <div className="policy-hero-container">
          <div className="policy-hero-text">
            {/* Breadcrumbs matching Image 4 */}
            <div className="policy-breadcrumbs">
              <Link to="/">Home</Link>
              <span className="crumb-sep">›</span>
              <span className="crumb-current">{activePolicy.navLabel}</span>
            </div>

            <span className="policy-legal-badge">{activePolicy.badge}</span>
            <h1 className="policy-hero-title">{activePolicy.title}</h1>
            <p className="policy-hero-sub">{activePolicy.updated}</p>
          </div>

          <div className="policy-hero-media">
            <img
              src="/academic-compliance-hero.jpg"
              alt="Academic Compliance and Examination Facility"
              className="policy-hero-img"
            />
            <div className="policy-media-overlay">
              <span>🔒 Verified Institutional Compliance</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout with Sidebar */}
      <main className="policy-main-container">
        <div className="policy-layout-grid">
          {/* Main Legal Document Content */}
          <article className="policy-document-card">
            {/* Important Notice Box matching Image 4 */}
            <div className="policy-notice-box">
              <div className="notice-icon-title">
                <span className="notice-amber-dot"></span>
                <strong>Important Notice</strong>
              </div>
              <p>{activePolicy.notice}</p>
            </div>

            {/* Document Clauses */}
            <div className="policy-sections-list">
              {activePolicy.sections.map((sec, idx) => (
                <section key={idx} className="policy-clause-item">
                  <h2 className="clause-heading">{sec.title}</h2>
                  <div className="clause-body">
                    {sec.content.split("\n\n").map((para, pIdx) => (
                      <p key={pIdx}>
                        {para.startsWith("• ") ? (
                          <span className="clause-bullet">{para}</span>
                        ) : (
                          para
                        )}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Document Signature Footnote */}
            <div className="policy-doc-footer">
              <div className="footer-seal">
                <span className="seal-icon">🏛️</span>
                <div>
                  <strong>VMS Educational Assessment Platform</strong>
                  <p>Certified Multi-Tenant Academic Infrastructure · All Rights Reserved</p>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar Navigation & Direct Assistance */}
          <aside className="policy-sidebar">
            <div className="sidebar-nav-card">
              <h3 className="sidebar-card-title">POLICIES</h3>
              <ul className="sidebar-policy-menu">
                {Object.values(POLICIES_DATA).map((p) => {
                  const isActive = p.slug === currentType;
                  return (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onClick={() => navigate(`/${p.slug === "terms" ? "terms" : p.slug === "privacy" ? "privacy" : p.slug === "refund" ? "refund-policy" : "shipping-policy"}`)}
                        className={`sidebar-policy-btn ${isActive ? "active" : ""}`}
                      >
                        <span>{p.navLabel}</span>
                        {isActive && <span className="active-arrow">→</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Support & Inquiries Card */}
            <div className="sidebar-support-card">
              <span className="support-badge">HELP DESK</span>
              <h4>Questions About Policies?</h4>
              <p>Our academic compliance and student advisory team is here to assist you.</p>
              <div className="support-contact-list">
                <a href="mailto:info@vmsclass.in" className="support-link-item">
                  ✉️ info@vmsclass.in
                </a>
                <a href="tel:+919000621876" className="support-link-item">
                  📞 +91 90006 21876
                </a>
              </div>
              <Link to="/contact" className="btn-sidebar-contact">
                Contact Legal Desk →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PolicyPage;
