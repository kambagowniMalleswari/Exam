// Official Unified Brand Crest and Logo Component for AssessIQ
import React from "react";
import { Link } from "react-router-dom";

export const BrandCrest = ({ size = 32, className = "" }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    width={size}
    height={size}
    className={`brand-crest-svg ${className}`}
    aria-label="AssessIQ Emblem"
    style={{ display: "block", flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="brandShieldGrad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="60%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="brandGoldGrad" x1="16" y1="12" x2="48" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>

    {/* Academic Shield Base */}
    <path
      d="M32 4 C44 4 54 11 56 22 C56 40 44 54 32 60 C20 54 8 40 8 22 C10 11 20 4 32 4 Z"
      fill="url(#brandShieldGrad)"
      stroke="#3b82f6"
      strokeWidth="2"
    />

    {/* Academic Mortarboard Diamond */}
    <polygon
      points="32,15 48,23 32,31 16,23"
      fill="url(#brandGoldGrad)"
      stroke="#fef3c7"
      strokeWidth="0.8"
    />

    {/* Skull Base */}
    <path
      d="M22 26.5 L22 34 C22 38 42 38 42 34 L42 26.5 C38 29.5 26 29.5 22 26.5 Z"
      fill="#b45309"
      opacity="0.9"
    />

    {/* Verified Nib / Check Mark */}
    <path
      d="M26 44 L30 48 L39 39"
      stroke="#38bdf8"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BrandLogo = ({
  size = 32,
  subtitle = "",
  to = "/",
  className = "",
  titleColor = "#0f172a"
}) => {
  const content = (
    <div
      className={`assess-iq-brand-lockup ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none"
      }}
    >
      <BrandCrest size={size} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span
          style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: size >= 32 ? "1.35rem" : "1.15rem",
            color: titleColor,
            letterSpacing: "-0.02em"
          }}
        >
          AssessIQ
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginTop: "2px"
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none", display: "inline-flex" }}>
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
