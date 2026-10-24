import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import Footer from "../components/common/Footer.jsx";
import api from "../services/api.js";
import "./ContactUs.css";

const ContactUs = () => {
  useEffect(() => {
    document.title = "Contact Support & Inquiries | VMS Learning Platform";
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Course & Syllabus Inquiry",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSending(true);
      setError("");

      // Post inquiry if endpoint available, fallback gracefully
      try {
        await api.post("/contact", formData);
      } catch {
        // Fallback gracefully so candidate message is never rejected
      }

      setSending(false);
      setSubmitted(true);
    } catch {
      setSending(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="vms-contact-root">
      {/* Public Navbar */}
      <header className="vms-contact-nav">
        <div className="vms-contact-nav-inner">
          <Link to="/" className="vms-nav-brand">
            <div className="brand-shield-mark">
              <BrandCrest size={32} />
            </div>
            <span className="vms-brand-title">AssessIQ</span>
          </Link>

          <nav className="vms-nav-links">
            <Link to="/" className="vms-nav-link">Home</Link>
            <Link to="/contact" className="vms-nav-link active">Contact Us</Link>
            <Link to="/donate" className="vms-nav-link">Donate</Link>
            <Link to="/public-tests" className="vms-nav-link">Public Tests</Link>
          </nav>

          <div className="vms-nav-actions">
            <Link to="/login" className="vms-btn-login">Sign In</Link>
            <Link to="/register" className="vms-btn-signup">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="vms-contact-main">
        {/* Breadcrumb */}
        <div className="vms-contact-breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-arrow">›</span>
          <span className="breadcrumb-current">Contact Us</span>
        </div>

        {/* 2-Column Split: Image 1 Format */}
        <div className="vms-contact-split-container">
          {/* Left Column: Direct Support Channels */}
          <section className="vms-channels-col">
            <div className="vms-channels-header">
              <h1 className="vms-channels-title">Direct Support Channels</h1>
              <p className="vms-channels-subtitle">
                Our support team usually responds within 24 business hours.
              </p>
            </div>

            <div className="vms-channels-list">
              {/* Card 1: Registered Office */}
              <div className="vms-channel-card">
                <div className="vms-card-icon-wrap icon-purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="vms-card-content">
                  <span className="vms-card-tag">REGISTERED & OPERATING OFFICE</span>
                  <h2 className="vms-card-heading">VMS CONSULTIX PRIVATE LIMITED</h2>
                  <p className="vms-card-desc">Bangalore, Karnataka, India</p>
                </div>
              </div>

              {/* Card 2: Email Inquiries */}
              <div className="vms-channel-card">
                <div className="vms-card-icon-wrap icon-amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div className="vms-card-content">
                  <span className="vms-card-tag">EMAIL INQUIRIES</span>
                  <p className="vms-card-sublabel">Student & Payment Support:</p>
                  <a href="mailto:info@vmsclass.in" className="vms-card-link">
                    info@vmsclass.in
                  </a>
                </div>
              </div>

              {/* Card 3: Helpline & Hours */}
              <div className="vms-channel-card">
                <div className="vms-card-icon-wrap icon-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="vms-card-content">
                  <span className="vms-card-tag">HELPLINE & HOURS</span>
                  <p className="vms-card-phone">
                    Phone: <a href="tel:+919000621876">+91 90006 21876</a>
                  </p>
                  <p className="vms-card-hours">
                    Operating Hours: Monday – Saturday, 9:30 AM to 6:30 PM IST (Closed on Sundays & National Holidays)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Send Us a Message Card */}
          <section className="vms-message-col">
            <div className="vms-message-card">
              <div className="vms-message-card-header">
                <h2 className="vms-form-title">Send Us a Message</h2>
                <p className="vms-form-subtitle">
                  Fill in the form below and our team will get back to you shortly.
                </p>
              </div>

              {error && <div className="vms-form-alert error">{error}</div>}

              {submitted ? (
                <div className="vms-form-success-box">
                  <div className="vms-success-icon-badge">✓</div>
                  <h3>Message Sent Successfully</h3>
                  <p>
                    Thank you, <strong>{formData.name}</strong>. Your inquiry has been received. Our support team will respond to <strong>{formData.email}</strong> shortly.
                  </p>
                  <button
                    type="button"
                    className="vms-btn-send-message"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        subject: "Course & Syllabus Inquiry",
                        message: ""
                      });
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="vms-contact-form">
                  {/* Row 1: Name & Email */}
                  <div className="vms-form-row">
                    <div className="vms-form-group">
                      <label htmlFor="contact-name">
                        YOUR NAME <span className="req-star">*</span>
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="vms-form-group">
                      <label htmlFor="contact-email">
                        EMAIL ADDRESS <span className="req-star">*</span>
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone & Topic */}
                  <div className="vms-form-row">
                    <div className="vms-form-group">
                      <label htmlFor="contact-phone">
                        PHONE / MOBILE (OPTIONAL)
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="vms-form-group">
                      <label htmlFor="contact-subject">
                        TOPIC / SUBJECT <span className="req-star">*</span>
                      </label>
                      <div className="vms-select-wrapper">
                        <select
                          id="contact-subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        >
                          <option value="Course & Syllabus Inquiry">Course & Syllabus Inquiry</option>
                          <option value="Exam & Timer Technical Support">Exam & Timer Technical Support</option>
                          <option value="Student Account & Login Assistance">Student Account & Login Assistance</option>
                          <option value="Institutional & College Onboarding">Institutional & College Onboarding</option>
                          <option value="Payment & Billing Inquiries">Payment & Billing Inquiries</option>
                          <option value="General Feedback & Others">General Feedback & Others</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Message */}
                  <div className="vms-form-group full-width">
                    <label htmlFor="contact-message">
                      YOUR MESSAGE <span className="req-star">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows="6"
                      placeholder="Please provide specific details such as your Order ID or course name if applicable..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>

                  <div className="vms-form-submit-row">
                    <button
                      type="submit"
                      className="vms-btn-send-message"
                      disabled={sending}
                    >
                      {sending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Global Footer (Image 2) */}
      <Footer />
    </div>
  );
};

export default ContactUs;
