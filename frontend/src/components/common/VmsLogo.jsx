import React from "react";

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
    <svg
      viewBox="0 0 100 100"
      width={Math.round(size * 0.85)}
      height={Math.round(size * 0.85)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Laurel Wreath / Leaves (Green) */}
      <g stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="#22c55e" fillOpacity="0.18">
        {/* Left Wreath Branch */}
        <path d="M 50 88 C 28 84 14 68 15 45 C 16 30 25 18 36 12" />
        <path d="M 22 75 C 14 65 18 56 22 55" />
        <path d="M 17 60 C 10 52 14 43 19 43" />
        <path d="M 18 45 C 12 36 19 28 26 29" />
        <path d="M 24 30 C 20 22 30 16 36 19" />
        <path d="M 34 18 C 32 10 44 8 48 13" />

        {/* Right Wreath Branch */}
        <path d="M 50 88 C 72 84 86 68 85 45 C 84 30 75 18 64 12" />
        <path d="M 78 75 C 86 65 82 56 78 55" />
        <path d="M 83 60 C 90 52 86 43 81 43" />
        <path d="M 82 45 C 88 36 81 28 74 29" />
        <path d="M 76 30 C 80 22 70 16 64 19" />
        <path d="M 66 18 C 68 10 56 8 52 13" />
      </g>

      {/* Central VMS Typography */}
      <text
        x="50"
        y="53"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#1d4ed8"
        fontFamily="'Outfit', 'Inter', -apple-system, sans-serif"
        fontWeight="800"
        fontSize="24"
        letterSpacing="0.5"
      >
        VMS
      </text>

      {/* Small open book / academic symbol below text */}
      <path
        d="M 37 66 C 42 63 47 63 50 65 C 53 63 58 63 63 66 L 63 72 C 58 69 53 69 50 71 C 47 69 42 69 37 72 Z"
        fill="#1d4ed8"
        opacity="0.85"
      />
      <line x1="50" y1="65" x2="50" y2="71" stroke="#ffffff" strokeWidth="1" />
    </svg>
  </div>
);

export default VmsLogo;
