// Modern SaaS Sidebar Component with Real-Time Super Admin Badges
import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import {
  BarChartIcon,
  BuildingIcon,
  FileTextIcon,
  TagIcon,
  UsersIcon,
  AwardIcon,
  TargetIcon,
  GraduationCapIcon,
  UserIcon,
  ShieldIcon
} from "./common/Icons.jsx";
import { BrandCrest } from "./common/BrandLogo.jsx";
import "./Sidebar.css";

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingOrgCount, setPendingOrgCount] = useState(0);

  const userRole = user?.role || "";
  const isAuthorizedSuperAdmin = userRole === "super_admin" || userRole === "superadmin";

  // For Super Admin, poll pending organization onboarding applications with relaxed interval
  useEffect(() => {
    if (isAuthorizedSuperAdmin) {
      const checkPending = async () => {
        try {
          const res = await api.get("/org-applications?status=pending");
          setPendingOrgCount(res.data?.count ?? res.data?.applications?.length ?? 0);
        } catch {
          // silently ignore
        }
      };
      checkPending();
      const interval = setInterval(checkPending, 45000);
      return () => clearInterval(interval);
    }
  }, [isAuthorizedSuperAdmin, location.pathname]);

  if (!user) return null;

  const adminMenuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: <BarChartIcon size={18} /> },
    { label: "Students", path: "/admin/students", icon: <GraduationCapIcon size={18} /> },
    { label: "Student Batches", path: "/admin/batches", icon: <TagIcon size={18} /> },
    { label: "Teachers", path: "/admin/teachers", icon: <UsersIcon size={18} /> },
    { label: "Tests Management", path: "/admin/tests", icon: <FileTextIcon size={18} /> },
    { label: "Teacher Requests", path: "/admin/teacher-requests", icon: <FileTextIcon size={18} /> },
    { label: "Student Results", path: "/admin/results", icon: <AwardIcon size={18} /> },
    { label: "Reports & Analytics", path: "/admin/reports", icon: <BarChartIcon size={18} /> },
    { label: "SaaS Subscription", path: "/admin/subscription", icon: <ShieldIcon size={18} /> },
    { label: "My Profile", path: "/profile", icon: <UserIcon size={18} /> }
  ];

  const superAdminMenuItems = [
    { label: "Platform Dashboard", path: "/superadmin/dashboard", icon: <BarChartIcon size={18} /> },
    { label: "Institutional Clients", path: "/superadmin/organizations", icon: <BuildingIcon size={18} /> },
    {
      label: "Institution Requests",
      path: "/superadmin/org-requests",
      icon: <FileTextIcon size={18} />,
      badge: pendingOrgCount > 0 ? pendingOrgCount : null
    },
    { label: "Platform Reports", path: "/superadmin/reports", icon: <BarChartIcon size={18} /> },
    { label: "SaaS Subscriptions", path: "/superadmin/subscriptions", icon: <ShieldIcon size={18} /> },
    { label: "My Profile", path: "/profile", icon: <UserIcon size={18} /> }
  ];

  const menuConfig = {
    super_admin: superAdminMenuItems,
    superadmin: superAdminMenuItems,
    admin: adminMenuItems,
    org_admin: adminMenuItems,
    teacher: [
      { label: "Dashboard", path: "/teacher/dashboard", icon: <BarChartIcon size={18} /> },
      { label: "My Tests", path: "/teacher/tests", icon: <FileTextIcon size={18} /> },
      { label: "Student Batches", path: "/teacher/batches", icon: <TagIcon size={18} /> },
      { label: "Student Results", path: "/teacher/results", icon: <AwardIcon size={18} /> },
      { label: "Faculty Profile", path: "/profile", icon: <UserIcon size={18} /> }
    ],
    student: [
      { label: "Dashboard", path: "/student/dashboard", icon: <BarChartIcon size={18} /> },
      { label: "Available Tests", path: "/student/available-tests", icon: <TargetIcon size={18} /> },
      { label: "Course Batches", path: "/student/batches", icon: <TagIcon size={18} /> },
      { label: "My Attempts & Results", path: "/student/my-attempts", icon: <AwardIcon size={18} /> },
      { label: "Student Profile", path: "/profile", icon: <UserIcon size={18} /> }
    ]
  };

  const currentMenu = isAuthorizedSuperAdmin
    ? superAdminMenuItems
    : (menuConfig[user.role] || []);
  const orgName = isAuthorizedSuperAdmin
    ? null
    : user.organizationId?.name || (user.organizationId ? "Organization" : "");

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="sidebar-logo" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <div className="sidebar-logo-mark">
              <BrandCrest size={28} />
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-name">AssessIQ</span>
              <span className="brand-tag">Institutional SaaS</span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              className="sidebar-mobile-close"
              onClick={onClose}
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        {user.role === "super_admin" ? (
          <div className="sidebar-org-chip super-admin-chip" title="Root Platform Authority">
            <span className="org-indicator super-admin-indicator"></span>
            <span className="org-text">Platform Super Admin</span>
          </div>
        ) : (
          orgName && (
            <div className="sidebar-org-chip" title={orgName}>
              <span className="org-indicator"></span>
              <span className="org-text">{orgName}</span>
            </div>
          )
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">PORTAL MENU</div>
        <div className="sidebar-links">
          {currentMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
              {item.badge != null && (
                <span className="sidebar-item-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Footer Profile */}
      <div className="sidebar-footer">
        <div
          className="sidebar-user-card"
          onClick={() => navigate("/profile")}
          style={{ cursor: "pointer" }}
          title="Click to view and edit your profile"
          role="button"
          tabIndex={0}
        >
          <div className="user-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              user?.name?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-role-badge">
              {user.role?.replace("_", " ")}
            </span>
          </div>
        </div>
        <button
          className="sidebar-logout-btn"
          onClick={logout}
          title="Sign out of your account"
        >
          <span>Sign Out</span>
          <svg className="sb-logout-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;