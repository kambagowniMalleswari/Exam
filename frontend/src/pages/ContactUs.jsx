import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BrandCrest } from "../components/common/BrandLogo.jsx";
import "./ContactUs.css";

const ContactUs = () => {
  useEffect(() => {
    document.title = "Contact Support & Inquiries | AssessIQ";
  }, []);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "General Inquiry",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    // Simulate inquiry transmission
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="contact-page-root">
      {/* Public Navbar */}
      <header className="public-top-nav">
        <div className="public-nav-inner">
          <Link to="/" className="public-brand">
            <div className="brand-shield-mark">
              <BrandCrest size={32} />
            </div>
            <span className="public-brand-title">AssessIQ</span>
          </Link>

          <nav className="public-nav-links">
            <Link to="/" className="nav-item-link">Home</Link>
            <Link to="/contact" className="nav-item-link active">Contact Us</Link>
            <Link to="/donate" className="nav-item-link">Donate</Link>
            <Link to="/public-tests" className="nav-item-link">Public Tests</Link>
          </nav>

          <div className="public-nav-actions">
            <Link to="/login" className="btn-nav-outline">Sign In</Link>
            <Link to="/register" className="btn-nav-solid">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="contact-main-wrapper">
        {/* Breadcrumb */}
        <div className="contact-breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Contact Us</span>
        </div>

        {/* Hero Title Section */}
        <section className="contact-header-section">
          <span className="contact-badge-pill">INSTITUTIONAL SUPPORT</span>
          <h1 className="contact-title">Get In Touch</h1>
          <p className="contact-lead-text">
            Have a question about our assessment platform, university onboarding,
            technical support, or feature feedback? Reach out to our team.
          </p>
        </section>

        {/* Quick Contact Cards */}
        <div className="contact-channels-grid">
          {/* Card 1: Email */}
          <div className="channel-card">
            <div className="channel-icon-circle email-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h3 className="channel-name">Institutional Support</h3>
            <p className="channel-detail">For enterprise onboarding, syllabus setup, and academic technical issues.</p>
            <a href="mailto:support@assessiq.portal.io" className="channel-action-btn btn-mail">
              <span>Send Email</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>

          {/* Card 2: Phone */}
          <div className="channel-card">
            <div className="channel-icon-circle phone-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <h3 className="channel-name">Administrative Hotline</h3>
            <p className="channel-detail">Mon – Fri from 9:00 AM to 6:00 PM IST for urgent institutional queries.</p>
            <a href="tel:+18005550199" className="channel-action-btn btn-call">
              <span>Call Now</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>

          {/* Card 3: WhatsApp Support */}
          <div className="channel-card">
            <div className="channel-icon-circle whatsapp-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <h3 className="channel-name">Instant Chat Assistant</h3>
            <p className="channel-detail">Fast track admissions, teacher inquiries, and instant query resolution.</p>
            <a
              href="https://wa.me/18005550199?text=Hello%20AssessIQ%20Support"
              target="_blank"
              rel="noopener noreferrer"
              className="channel-action-btn btn-whatsapp"
            >
              <span>WhatsApp</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>

        {/* Form and Office Details Split */}
        <section className="contact-form-section">
          <div className="form-card-container">
            <div className="form-heading-group">
              <h2>Send an Official Inquiry</h2>
              <p>Our academic administration desk will respond to your request within 24 business hours.</p>
            </div>

            {submitted ? (
              <div className="inquiry-success-card">
                <div className="success-badge-icon">✓</div>
                <h3>Message Sent Successfully</h3>
                <p>
                  Thank you, <strong>{formData.name}</strong>. Your inquiry has been forwarded to our
                  institutional coordinator. We will reply to <strong>{formData.email}</strong> shortly.
                </p>
                <button
                  type="button"
                  className="btn-submit-inquiry"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", category: "General Inquiry", subject: "", message: "" });
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form-grid">
                <div className="form-row-duo">
                  <div className="form-group-item">
                    <label htmlFor="contact-name">Your Full Name</label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      placeholder="e.g. Dr. Jennifer Adams"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label htmlFor="contact-email">Official / Academic Email</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      placeholder="e.g. j.adams@university.edu"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-duo">
                  <div className="form-group-item">
                    <label htmlFor="contact-category">Inquiry Category</label>
                    <select
                      id="contact-category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="General Inquiry">General Platform Inquiry</option>
                      <option value="Institution Onboarding">Institution / College Onboarding</option>
                      <option value="Teacher Request Status">Teacher Application Status</option>
                      <option value="Technical Support">Exam & Timer Technical Support</option>
                      <option value="Billing / Grants">Billing & Institutional Grants</option>
                    </select>
                  </div>

                  <div className="form-group-item">
                    <label htmlFor="contact-subject">Subject Line</label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      placeholder="Brief topic summary"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-item full-span">
                  <label htmlFor="contact-message">Detailed Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows="5"
                    placeholder="Describe your question, request, or institutional context in detail..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn-submit-inquiry" disabled={sending}>
                  {sending ? "Transmitting Inquiry..." : "Submit Inquiry →"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="public-footer">
        <div className="public-footer-inner">
          <p>© {new Date().getFullYear()} AssessIQ Institutional Portal. Built with true multi-tenant data isolation.</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/donate">Donate</Link>
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;
