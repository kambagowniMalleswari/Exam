import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import {
  RefreshIcon,
  CreditCardIcon,
  BuildingIcon,
  AwardIcon,
  FileTextIcon,
  SearchIcon,
  AlertTriangleIcon,
  EditIcon,
  CheckCircleIcon
} from "../../components/common/Icons.jsx";
import "./SuperAdminSubscriptions.css";

const PLAN_PRESETS = {
  free: { maxTests: 5, maxStudents: 100, price: 0 },
  basic: { maxTests: 25, maxStudents: 500, price: 29 },
  pro: { maxTests: 100, maxStudents: 2500, price: 79 },
  enterprise: { maxTests: 99999, maxStudents: 99999, price: 199 }
};

const SuperAdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [feedback, setFeedback] = useState("");

  // Edit Subscription Modal State
  const [editingSub, setEditingSub] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [editForm, setEditForm] = useState({
    plan: "free",
    price: 0,
    maxTests: 5,
    maxStudents: 100,
    status: "active"
  });

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

  const handleOpenEdit = (sub) => {
    setEditingSub(sub);
    setModalError("");
    setEditForm({
      plan: sub.plan || "free",
      price: sub.price ?? (PLAN_PRESETS[sub.plan]?.price || 0),
      maxTests: sub.maxTests ?? 5,
      maxStudents: sub.maxStudents ?? 100,
      status: sub.status || "active"
    });
  };

  const handlePlanPresetSelect = (tier) => {
    const preset = PLAN_PRESETS[tier] || PLAN_PRESETS.free;
    setEditForm((prev) => ({
      ...prev,
      plan: tier,
      price: preset.price,
      maxTests: preset.maxTests,
      maxStudents: preset.maxStudents
    }));
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!editingSub) return;

    try {
      setModalLoading(true);
      setModalError("");
      await api.put(`/subscriptions/${editingSub._id}`, editForm);
      setFeedback(`Subscription for ${editingSub.organizationId?.name || "tenant"} updated successfully!`);
      setTimeout(() => setFeedback(""), 4000);
      setEditingSub(null);
      await fetchSubscriptions();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to update subscription.");
    } finally {
      setModalLoading(false);
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
            <RefreshIcon size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Global KPI Cards */}
        <div className="sa-kpi-grid">
          <div className="sa-kpi-card mrr">
            <span className="sa-icon" style={{ color: "#0284c7" }}>
              <CreditCardIcon size={22} />
            </span>
            <div className="sa-kpi-info">
              <span className="sa-num">${stats.mrr}</span>
              <span className="sa-label">Monthly Recurring Revenue</span>
            </div>
          </div>

          <div className="sa-kpi-card active">
            <span className="sa-icon" style={{ color: "#16a34a" }}>
              <BuildingIcon size={22} />
            </span>
            <div className="sa-kpi-info">
              <span className="sa-num">{stats.active}</span>
              <span className="sa-label">Active Subscriptions</span>
            </div>
          </div>

          <div className="sa-kpi-card enterprise">
            <span className="sa-icon" style={{ color: "#8b5cf6" }}>
              <AwardIcon size={22} />
            </span>
            <div className="sa-kpi-info">
              <span className="sa-num">{stats.enterprise}</span>
              <span className="sa-label">Enterprise Tenants</span>
            </div>
          </div>

          <div className="sa-kpi-card total">
            <span className="sa-icon" style={{ color: "#d97706" }}>
              <FileTextIcon size={22} />
            </span>
            <div className="sa-kpi-info">
              <span className="sa-num">{stats.total}</span>
              <span className="sa-label">Total Subscriptions</span>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="sa-feedback-alert">
            <CheckCircleIcon size={18} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Controls */}
        <div className="sa-controls">
          <div className="sa-search">
            <span style={{ display: "flex", alignItems: "center", color: "#64748b" }}>
              <SearchIcon size={16} />
            </span>
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
            <AlertTriangleIcon size={32} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="sa-state">
            <FileTextIcon size={32} />
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
                  <th>Actions</th>
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
                    <td>
                      <button
                        type="button"
                        className="sa-action-btn-pill"
                        onClick={() => handleOpenEdit(sub)}
                        title="Manage Tier & Quotas"
                      >
                        <EditIcon size={12} /> Manage Tier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Subscription Modal */}
        {editingSub && (
          <div className="sa-modal-overlay" onClick={() => !modalLoading && setEditingSub(null)}>
            <div className="sa-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="sa-modal-header">
                <div>
                  <h3>Manage Tenant Subscription</h3>
                  <p>Update subscription tier, price, and operational quotas for <strong>{editingSub.organizationId?.name}</strong>.</p>
                </div>
                <button
                  type="button"
                  className="sa-modal-close"
                  onClick={() => setEditingSub(null)}
                >
                  ×
                </button>
              </div>

              {modalError && (
                <div className="sa-modal-alert error">
                  <AlertTriangleIcon size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSubscription} className="sa-modal-form">
                {/* Tier Presets Selection */}
                <div className="form-group-block">
                  <label className="sa-form-label">Subscription Tier</label>
                  <div className="tier-preset-grid">
                    {["free", "basic", "pro", "enterprise"].map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        className={`tier-preset-btn ${editForm.plan === tier ? "selected" : ""}`}
                        onClick={() => handlePlanPresetSelect(tier)}
                      >
                        <span className="preset-name">{tier.toUpperCase()}</span>
                        <span className="preset-price">
                          ${PLAN_PRESETS[tier].price}/mo
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-field">
                    <label className="sa-form-label">Monthly Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                      className="sa-input"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="sa-form-label">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="sa-input sa-select"
                    >
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-field">
                    <label className="sa-form-label">Max Tests Quota</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.maxTests}
                      onChange={(e) => setEditForm({ ...editForm, maxTests: Number(e.target.value) })}
                      className="sa-input"
                      required
                    />
                    <small className="field-hint">Use 99999 for unlimited tests</small>
                  </div>
                  <div className="form-field">
                    <label className="sa-form-label">Max Students Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.maxStudents}
                      onChange={(e) => setEditForm({ ...editForm, maxStudents: Number(e.target.value) })}
                      className="sa-input"
                      required
                    />
                    <small className="field-hint">Use 99999 for unlimited students</small>
                  </div>
                </div>

                <div className="sa-modal-footer">
                  <button
                    type="button"
                    className="sa-btn-cancel"
                    disabled={modalLoading}
                    onClick={() => setEditingSub(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="sa-btn-save"
                    disabled={modalLoading}
                  >
                    {modalLoading ? "Saving Changes..." : "Save Subscription Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminSubscriptions;
