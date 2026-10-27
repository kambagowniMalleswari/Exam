// Official Unified Brand Crest and Logo Component for AssessIQ
import React from "react";
import { Link } from "react-router-dom";
import brandLogoImg from "../../assets/brand-logo.png";

export const BrandCrest = ({ size = 32, className = "", style = {} }) => (
  <img
    src={brandLogoImg}
    alt="AssessIQ Logo"
    width={size}
    height={Math.round(size * (896 / 1024))}
    className={`brand-crest-img ${className}`}
    style={{
      width: size,
      height: "auto",
      maxHeight: size,
      objectFit: "contain",
      display: "block",
      flexShrink: 0,
      ...style
    }}
  />
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
