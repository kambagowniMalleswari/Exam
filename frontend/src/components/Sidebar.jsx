// Modern SaaS Sidebar Component with Real-Time Super Admin Badges
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import "./Sidebar.css";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingOrgCount, setPendingOrgCount] = useState(0);

  // For Super Admin, poll pending organization onboarding applications
  useEffect(() => {
    if (user?.role === "super_admin") {
      const checkPending = async () => {
        try {
          const res = await api.get("/org-applications?status=pending");
          setPendingOrgCount(res.data?.count ?? res.data?.applications?.length ?? 0);
        } catch {
          // silently ignore
        }
      };
      checkPending();
      const interval = setInterval(checkPending, 20000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

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
    { label: "Platform Dashboard", path: "/super-admin/dashboard", icon: <BarChartIcon size={18} /> },
    { label: "Institutional Clients", path: "/super-admin/organizations", icon: <BuildingIcon size={18} /> },
    {
      label: "Institution Requests",
      path: "/super-admin/org-requests",
      icon: <FileTextIcon size={18} />,
      badge: pendingOrgCount > 0 ? pendingOrgCount : null
    },
    { label: "Platform Reports", path: "/super-admin/reports", icon: <BarChartIcon size={18} /> },
    { label: "SaaS Subscriptions", path: "/super-admin/subscriptions", icon: <ShieldIcon size={18} /> },
    { label: "My Profile", path: "/profile", icon: <UserIcon size={18} /> }
  ];

  const menuConfig = {
    super_admin: superAdminMenuItems,
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

  const currentMenu = menuConfig[user.role] || [];
  const orgName = user.role === "super_admin"
    ? null
    : user.organizationId?.name || (user.organizationId ? "Organization" : "");

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate("/")} role="button" tabIndex={0}>
          <div className="sidebar-logo-mark">
            <svg viewBox="0 0 64 64" fill="none" width="28" height="28">
              <path d="M32 4 C44 4 54 11 56 22 C56 40 44 54 32 60 C20 54 8 40 8 22 C10 11 20 4 32 4 Z" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2"/>
              <polygon points="32,16 46,24 32,32 18,24" fill="#fbbf24"/>
              <path d="M26 44 L30 48 L39 39" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="brand-name">AssessIQ</span>
            <span className="brand-tag">Institutional SaaS</span>
          </div>
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
          <div className="user-avatar">
            {user.name?.charAt(0).toUpperCase() || "U"}
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