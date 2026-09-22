import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import "./SuperAdminSubscriptions.css";

const SuperAdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/subscriptions");
      setSubscriptions(res.data.subscriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load platform subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = subscriptions.filter((sub) => {
    const orgName = sub.organizationId?.name?.toLowerCase() || "";
    const orgEmail = sub.organizationId?.email?.toLowerCase() || "";
    const orgSlug = sub.organizationId?.slug?.toLowerCase() || "";
    const matchesSearch =
      orgName.includes(search.toLowerCase()) ||
      orgEmail.includes(search.toLowerCase()) ||
      orgSlug.includes(search.toLowerCase());

    const matchesPlan = planFilter === "all" || sub.plan === planFilter;

    return matchesSearch && matchesPlan;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "active").length,
    mrr: subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (s.price || 0), 0),
    enterprise: subscriptions.filter((s) => s.plan === "enterprise").length
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <DashboardLayout title="Platform Subscriptions">
      <div className="sa-sub-page">
        {/* Header */}
        <div className="sa-header">
          <div>
            <h2>Tenant Subscriptions & Billing</h2>
            <p>Monitor enterprise recurring revenue, active subscription tiers, and tenant resource allocations.</p>
          </div>
          <button className="btn-refresh" onClick={fetchSubscriptions}>
            🔄 Refresh
          </button>
        </div>

        {/* Global KPI Cards */}
        <div className="sa-kpi-grid">
          <div className="sa-kpi-card mrr">
            <span className="sa-icon">💳</span>
            <div className="sa-kpi-info">
              <span className="sa-num">${stats.mrr}</span>
              <span className="sa-label">Monthly Recurring Revenue</span>
            </div>
          </div>

          <div className="sa-kpi-card active">
            <span className="sa-icon">🏢</span>
            <div className="sa-kpi-info">
              <span className="sa-num">{stats.active}</span>
              <span className="sa-label">Active Subscriptions</span>
            </div>
          </div>

          <div className="sa-kpi-card enterprise">
            <span className="sa-icon">👑</span>
            <div className="sa-kpi-info">
              <span className="sa-num">{stats.enterprise}</span>
              <span className="sa-label">Enterprise Tenants</span>
            </div>
          </div>

          <div className="sa-kpi-card total">
            <span className="sa-icon">📑</span>
            <div className="sa-kpi-info">
              <span className="sa-num">{stats.total}</span>
              <span className="sa-label">Total Subscriptions</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="sa-controls">
          <div className="sa-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by organization name, slug, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sa-plan-filters">
            {["all", "free", "basic", "pro", "enterprise"].map((tier) => (
              <button
                key={tier}
                className={`filter-btn ${planFilter === tier ? "active" : ""}`}
                onClick={() => setPlanFilter(tier)}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="sa-state">
            <div className="spinner"></div>
            <p>Loading tenant subscription tiers...</p>
          </div>
        )}

        {!loading && error && (
          <div className="sa-state">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="sa-state">
            <span>📑</span>
            <h3>No subscriptions found</h3>
            <p>{search ? "Try adjusting your search criteria." : "No tenant subscriptions have been created yet."}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="sa-table-card">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Subscription Tier</th>
                  <th>Monthly Price</th>
                  <th>Tests Limit</th>
                  <th>Students Limit</th>
                  <th>Status</th>
                  <th>Subscribed On</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub._id}>
                    <td>
                      <div className="org-cell">
                        <div className="org-avatar">
                          {sub.organizationId?.name ? sub.organizationId.name.charAt(0).toUpperCase() : "O"}
                        </div>
                        <div>
                          <div className="org-name">{sub.organizationId?.name || "Organization"}</div>
                          <div className="org-slug">/{sub.organizationId?.slug || "tenant"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`plan-badge ${sub.plan || "free"}`}>
                        {(sub.plan || "free").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="price-tag">
                        ${sub.price || 0}<small>/mo</small>
                      </span>
                    </td>
                    <td>
                      <span className="limit-val">
                        {sub.maxTests >= 99999 ? "Unlimited" : `${sub.maxTests || 5} tests`}
                      </span>
                    </td>
                    <td>
                      <span className="limit-val">
                        {sub.maxStudents >= 99999 ? "Unlimited" : `${sub.maxStudents || 100} students`}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${sub.status === "active" ? "active" : "inactive"}`}>
                        {sub.status || "active"}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(sub.startDate || sub.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminSubscriptions;
