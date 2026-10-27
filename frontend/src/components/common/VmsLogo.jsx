import React from "react";
import brandLogoImg from "../../assets/brand-logo.png";

export const VmsLogo = ({ size = 48, className = "" }) => (
  <div
    className={`vms-brand-badge ${className}`}
    style={{
      width: size,
      height: size,
      backgroundColor: "#ffffff",
      borderRadius: Math.round(size * 0.22),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      border: "1px solid rgba(226, 232, 240, 0.8)",
      overflow: "hidden",
      flexShrink: 0
    }}
  >
    <img
      src={brandLogoImg}
      alt="VMS Logo"
      width={Math.round(size * 0.9)}
      height={Math.round(size * 0.9)}
      style={{
        width: "90%",
        height: "90%",
        objectFit: "contain",
        display: "block"
      }}
    />
  </div>
);

export default VmsLogo;
