import React, { useState } from "react";
import { Link } from "react-router-dom";
import VmsLogo from "./VmsLogo.jsx";
import "./Footer.css";

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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
              <Link to="/about">About Us</Link>
            </li>
          </ul>
        </div>

        {/* POLICIES Column - Navigates to full pages without modal */}
        <div className="vms-footer-col">
          <h3 className="vms-col-title">POLICIES</h3>
          <ul className="vms-footer-nav">
            <li>
              <Link to="/terms">Terms &amp; Conditions</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/refund-policy">Refund &amp; Cancellation</Link>
            </li>
            <li>
              <Link to="/shipping-policy">Shipping &amp; Delivery</Link>
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
            <Link to="/terms" className="vms-bottom-link">
              Terms
            </Link>
            <Link to="/privacy" className="vms-bottom-link">
              Privacy
            </Link>
            <Link to="/refund-policy" className="vms-bottom-link">
              Refund Policy
            </Link>
            <Link to="/shipping-policy" className="vms-bottom-link">
              Shipping Policy
            </Link>
            <Link to="/contact" className="vms-bottom-link">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
