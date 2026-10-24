import React, { useState } from "react";
import { Link } from "react-router-dom";
import VmsLogo from "./VmsLogo.jsx";
import "./Footer.css";

const POLICIES_CONTENT = {
  terms: {
    title: "Terms & Conditions",
    body: (
      <div>
        <p>Welcome to <strong>VMS Learning Platform</strong>. By accessing our portal, tests, and training content, you agree to comply with our academic honor code and institutional terms.</p>
        <h4>1. Account Integrity</h4>
        <p>Each user account is unique to the enrolled candidate. Sharing credentials or allowing secondary test takers violates examination integrity protocols and will lead to immediate account suspension.</p>
        <h4>2. Assessment Examination Rules</h4>
        <p>All online MCQ evaluations are monitored via our automated proctoring telemetry. Tab switching, window minimization, or unauthorized peripheral connections may be flagged during live quizzes.</p>
        <h4>3. Intellectual Property</h4>
        <p>All quiz questions, syllabus content, and practice assessments are proprietary assets of VMS CONSULTIX PRIVATE LIMITED.</p>
      </div>
    )
  },
  privacy: {
    title: "Privacy Policy",
    body: (
      <div>
        <p>Your privacy and candidate data security are paramount at <strong>VMS Learning Platform</strong>.</p>
        <h4>1. Information We Collect</h4>
        <p>We collect essential academic data including name, email address, student/employee roll numbers, and examination attempt logs to calculate academic performance.</p>
        <h4>2. Data Isolation & Security</h4>
        <p>Our platform enforces multi-tenant row-level data isolation. No student records or proprietary quiz sets are shared across institutions or external advertising networks.</p>
        <h4>3. Communications</h4>
        <p>Transactional emails (scorecards, temporary passwords, security alerts) are dispatched strictly via authenticated platform SMTP channels.</p>
      </div>
    )
  },
  refund: {
    title: "Refund & Cancellation Policy",
    body: (
      <div>
        <p>At <strong>VMS Learning Platform</strong>, we strive to provide world-class assessment and training solutions.</p>
        <h4>1. Subscription & Course Cancellations</h4>
        <p>Candidates or institutional sponsors may request cancellation within 48 hours of enrolment if no premium examinations or certification attempts have been initiated.</p>
        <h4>2. Refund Processing</h4>
        <p>Approved refunds are credited back to the original payment source within 5–7 business days. Processing fees, if any, will be deducted as per banking guidelines.</p>
        <h4>3. Inquiries</h4>
        <p>For refund requests, please email <a href="mailto:info@vmsclass.in">info@vmsclass.in</a> with your candidate ID and order transaction reference.</p>
      </div>
    )
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    body: (
      <div>
        <p><strong>VMS Learning Platform</strong> is a 100% digital SaaS educational ecosystem.</p>
        <h4>1. Digital Delivery of Examination Access</h4>
        <p>Access credentials, batch allocations, and live test enrollments are provisioned immediately upon account registration or institutional batch assignment.</p>
        <h4>2. Certification & Scorecards</h4>
        <p>Official performance scorecards, completion badges, and certificates are generated digitally in real-time and delivered directly to the candidate's verified email and student dashboard.</p>
        <h4>3. Physical Materials</h4>
        <p>No physical shipping is required. All learning materials, test rubrics, and answer keys are accessible through the cloud portal 24/7.</p>
      </div>
    )
  }
};

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 4000);
  };

  return (
    <>
      <footer className="vms-global-footer">
        <div className="vms-footer-main">
          {/* Brand & Newsletter Column */}
          <div className="vms-footer-col vms-col-brand">
            <Link to="/" className="vms-brand-link" aria-label="VMS Home">
              <VmsLogo size={52} />
            </Link>
            <p className="vms-footer-desc">
              Get the latest updates, special course offers, and learning tips straight to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="vms-subscribe-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="vms-subscribe-input"
              />
              <button type="submit" className="vms-subscribe-btn">
                {subscribed ? "✓ Subscribed" : "Subscribe"}
              </button>
            </form>
          </div>

          {/* EXPLORE Column */}
          <div className="vms-footer-col">
            <h3 className="vms-col-title">EXPLORE</h3>
            <ul className="vms-footer-nav">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/public-tests">Browse Courses</Link>
              </li>
              <li>
                <Link to="/public-tests">Live Quizzes</Link>
              </li>
              <li>
                <Link to="/join-us">About Us</Link>
              </li>
            </ul>
          </div>

          {/* POLICIES Column */}
          <div className="vms-footer-col">
            <h3 className="vms-col-title">POLICIES</h3>
            <ul className="vms-footer-nav">
              <li>
                <button type="button" onClick={() => setActivePolicy("terms")} className="vms-text-link">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePolicy("privacy")} className="vms-text-link">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePolicy("refund")} className="vms-text-link">
                  Refund & Cancellation
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePolicy("shipping")} className="vms-text-link">
                  Shipping & Delivery
                </button>
              </li>
            </ul>
          </div>

          {/* SUPPORT Column */}
          <div className="vms-footer-col vms-col-support">
            <h3 className="vms-col-title">SUPPORT</h3>
            <ul className="vms-footer-nav">
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
              <li className="vms-support-item">
                <span className="vms-support-label">EMAIL</span>
                <a href="mailto:info@vmsclass.in" className="vms-support-val">
                  info@vmsclass.in
                </a>
              </li>
              <li className="vms-support-item">
                <span className="vms-support-label">PHONE</span>
                <a href="tel:+919000621876" className="vms-support-val">
                  +91 90006 21876
                </a>
              </li>
              <li className="vms-support-hours">
                Mon - Sat: 9:30 AM – 6:30 PM
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="vms-footer-bottom">
          <div className="vms-footer-bottom-inner">
            <p className="vms-copyright">
              Copyright © 2026 VMS Learning Platform. All rights reserved.
            </p>
            <div className="vms-bottom-links">
              <button type="button" onClick={() => setActivePolicy("terms")} className="vms-bottom-link">
                Terms
              </button>
              <button type="button" onClick={() => setActivePolicy("privacy")} className="vms-bottom-link">
                Privacy
              </button>
              <button type="button" onClick={() => setActivePolicy("refund")} className="vms-bottom-link">
                Refund Policy
              </button>
              <button type="button" onClick={() => setActivePolicy("shipping")} className="vms-bottom-link">
                Shipping Policy
              </button>
              <Link to="/contact" className="vms-bottom-link">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal Overlay */}
      {activePolicy && (
        <div className="vms-policy-modal-overlay" onClick={() => setActivePolicy(null)}>
          <div className="vms-policy-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="vms-policy-modal-header">
              <h3>{POLICIES_CONTENT[activePolicy]?.title}</h3>
              <button
                type="button"
                className="vms-policy-modal-close"
                onClick={() => setActivePolicy(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="vms-policy-modal-body">
              {POLICIES_CONTENT[activePolicy]?.body}
            </div>
            <div className="vms-policy-modal-footer">
              <button
                type="button"
                className="vms-policy-close-btn"
                onClick={() => setActivePolicy(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
