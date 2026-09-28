// Role utilities for authentication and route determination
export const normalizeRole = (role) => {
  if (!role) return "";
  const clean = String(role).toLowerCase().trim();
  if (clean === "superadmin" || clean === "super_admin") return "super_admin";
  if (clean === "org_admin" || clean === "admin") return "org_admin";
  if (clean === "teacher") return "teacher";
  if (clean === "student") return "student";
  return clean;
};

export const getDefaultDashboard = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "super_admin") return "/superadmin/dashboard";
  if (normalized === "org_admin") return "/admin/dashboard";
  if (normalized === "teacher") return "/teacher/dashboard";
  if (normalized === "student") return "/student/dashboard";
  return "/login";
};

export const isRoleAuthorizedForPath = (role, path) => {
  if (!role || !path) return false;
  const normalized = normalizeRole(role);
  const p = path.toLowerCase();

  // Profile is common to all authenticated roles
  if (p === "/profile" || p.startsWith("/profile/")) return true;

  if (normalized === "super_admin") {
    return p.startsWith("/superadmin") || p.startsWith("/super-admin");
  }
  if (normalized === "org_admin") {
    return p.startsWith("/admin");
  }
  if (normalized === "teacher") {
    return p.startsWith("/teacher");
  }
  if (normalized === "student") {
    return p.startsWith("/student");
  }

  return false;
};
