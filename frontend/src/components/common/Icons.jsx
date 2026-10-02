// High-performance SVG Vector Icons library for AssessIQ
import React from "react";

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

export const ClockIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-clock ${className}`}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const HelpCircleIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-help ${className}`}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const AwardIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-award ${className}`}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

export const TargetIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-target ${className}`}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const RepeatIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-repeat ${className}`}>
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

export const BuildingIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-building ${className}`}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <line x1="8" y1="6" x2="8.01" y2="6" />
    <line x1="16" y1="6" x2="16.01" y2="6" />
    <line x1="12" y1="6" x2="12.01" y2="6" />
    <line x1="8" y1="10" x2="8.01" y2="10" />
    <line x1="16" y1="10" x2="16.01" y2="10" />
    <line x1="12" y1="10" x2="12.01" y2="10" />
    <line x1="8" y1="14" x2="8.01" y2="14" />
    <line x1="16" y1="14" x2="16.01" y2="14" />
    <line x1="12" y1="14" x2="12.01" y2="14" />
  </svg>
);

export const GlobeIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-globe ${className}`}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const LockIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-lock ${className}`}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const HourglassIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-hourglass ${className}`}>
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  </svg>
);

export const FileTextIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-file-text ${className}`}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const UsersIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-users ${className}`}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const BarChartIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-barchart ${className}`}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export const TagIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-tag ${className}`}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

export const SearchIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-search ${className}`}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const CheckCircleIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-check-circle ${className}`}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const AlertTriangleIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-alert ${className}`}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const MailIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-mail ${className}`}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const PhoneIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-phone ${className}`}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const CalendarIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-calendar ${className}`}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const UserIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-user ${className}`}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const KeyIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-key ${className}`}>
    <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9" />
    <circle cx="7.5" cy="16.5" r="5.5" />
    <path d="m15.5 8.5 2 2" />
  </svg>
);

export const ShieldIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-shield ${className}`}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const ShieldAlertIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-shield-alert ${className}`}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const EditIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-edit ${className}`}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const TrashIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-trash ${className}`}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const EyeIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-eye ${className}`}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const SparklesIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-sparkles ${className}`}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export const GraduationCapIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-gradcap ${className}`}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

export const PlusIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-plus ${className}`}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const PrinterIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-printer ${className}`}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

export const RefreshIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-refresh ${className}`}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const CreditCardIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-credit-card ${className}`}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

export const CheckIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-check ${className}`}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const XIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-x ${className}`}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const TrendingUpIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-trending-up ${className}`}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const TrendingDownIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-trending-down ${className}`}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

export const BookOpenIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-book-open ${className}`}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

export const FilterIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-filter ${className}`}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const StarIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-star ${className}`}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="none" />
  </svg>
);

export const PlayIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-play ${className}`}>
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
  </svg>
);

export const LayersIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-layers ${className}`}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export const ZapIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-zap ${className}`}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const CompassIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-compass ${className}`}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export const CodeIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-code ${className}`}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);


export const CpuIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-cpu ${className}`}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

export const BadgeCheckIcon = ({ size = 16, className = "" }) => (
  <svg {...baseProps} width={size} height={size} className={`vector-icon icon-badge-check ${className}`}>
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);



