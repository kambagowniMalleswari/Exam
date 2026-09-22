import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import "./AdminSubscription.css";

const AdminSubscription = () => {
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.get("/subscriptions/current");
      setSubData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planKey) => {
    try {
      setUpgrading(true);
      setSuccessMsg("");
      const res = await api.post("/subscriptions/upgrade", { plan: planKey });
      setSelectedPlanToUpgrade(null);
      setSuccessMsg(res.data.message || `Successfully upgraded to ${planKey.toUpperCase()}!`);
      await fetchSubscription();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upgrade subscription.");
    } finally {
      setUpgrading(false);
    }
  };

  const currentPlan = subData?.subscription?.plan || "free";
  const usage = subData?.usage || { testsUsed: 0, testsLimit: 5, studentsUsed: 0, studentsLimit: 100 };
  const plans = subData?.availablePlans || {
    free: { maxTests: 5, maxStudents: 100, price: 0, features: ["5 Tests", "100 Students", "Standard Reports"] },
    basic: { maxTests: 25, maxStudents: 500, price: 29, features: ["25 Tests", "500 Students", "Detailed Analytics", "Export Results"] },
    pro: { maxTests: 100, maxStudents: 2500, price: 79, features: ["100 Tests", "2,500 Students", "Advanced Analytics", "Question Bank", "Custom Certificates"] },
    enterprise: { maxTests: 99999, maxStudents: 99999, price: 199, features: ["Unlimited Tests", "Unlimited Students", "Dedicated Support", "Custom Branding", "API Access"] }
  };

  const testPerc = Math.min(Math.round((usage.testsUsed / (usage.testsLimit || 1)) * 100), 100);
  const studentPerc = Math.min(Math.round((usage.studentsUsed / (usage.studentsLimit || 1)) * 100), 100);

  return (
    <DashboardLayout title="Subscription & Plan Limits">
      <div className="admin-sub-page">
        {/* Header */}
        <div className="as-header">
          <div>
            <h2>Subscription & Plan Management</h2>
            <p>View resource consumption, manage organization billing tier, and scale your exam capacity.</p>
          </div>
          <button className="btn-refresh" onClick={fetchSubscription}>
            🔄 Refresh Status
          </button>
        </div>

        {/* Feedback message */}
        {successMsg && (
          <div className="sub-alert success">
            <span>🎉 {successMsg}</span>
            <button onClick={() => setSuccessMsg("")}>✕</button>
          </div>
        )}

        {loading && (
          <div className="as-state">
            <div className="spinner"></div>
            <p>Loading subscription metadata...</p>
          </div>
        )}

        {!loading && error && (
          <div className="as-state">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && subData && (
          <>
            {/* Current Active Plan Card & Usage Telemetry */}
            <div className="active-plan-banner">
              <div className="ap-left">
                <div className="ap-badge-row">
                  <span className="ap-badge-label">Active Plan</span>
                  <span className={`plan-badge ${currentPlan}`}>{currentPlan.toUpperCase()}</span>
                  <span className="status-indicator">● Active</span>
                </div>
                <h3>{currentPlan === "free" ? "Free Starter Plan" : `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Professional Plan`}</h3>
                <p className="ap-pricing">
                  <span className="amount">${plans[currentPlan]?.price || 0}</span>
                  <span className="interval"> / month</span>
                </p>
                <div className="ap-features-pill">
                  {(plans[currentPlan]?.features || []).map((f, i) => (
                    <span key={i} className="f-tag">✓ {f}</span>
                  ))}
                </div>
              </div>

              <div className="ap-right">
                <h4>Resource Utilization</h4>

                {/* Tests Quota */}
                <div className="quota-item">
                  <div className="quota-labels">
                    <span>Tests Created</span>
                    <span>
                      <strong>{usage.testsUsed}</strong> / {usage.testsLimit >= 99999 ? "Unlimited" : usage.testsLimit}
                    </span>
                  </div>
                  <div className="quota-track">
                    <div
                      className={`quota-fill ${testPerc > 80 ? "warning" : ""}`}
                      style={{ width: `${usage.testsLimit >= 99999 ? 5 : testPerc}%` }}
                    ></div>
                  </div>
                </div>

                {/* Students Quota */}
                <div className="quota-item">
                  <div className="quota-labels">
                    <span>Enrolled Students</span>
                    <span>
                      <strong>{usage.studentsUsed}</strong> / {usage.studentsLimit >= 99999 ? "Unlimited" : usage.studentsLimit}
                    </span>
                  </div>
                  <div className="quota-track">
                    <div
                      className={`quota-fill ${studentPerc > 80 ? "warning" : ""}`}
                      style={{ width: `${usage.studentsLimit >= 99999 ? 5 : studentPerc}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plans Comparison Grid */}
            <div className="plans-section">
              <div className="plans-heading">
                <h3>Select a Plan Tailored to Your Scale</h3>
                <p>Instant upgrades with immediate limit increases and zero downtime.</p>
              </div>

              <div className="plans-grid">
                {Object.keys(plans).map((key) => {
                  const plan = plans[key];
                  const isCurrent = currentPlan === key;
                  const isEnterprise = key === "enterprise";
                  const isPopular = key === "pro";

                  return (
                    <div
                      key={key}
                      className={`plan-card ${isCurrent ? "current" : ""} ${isPopular ? "popular" : ""}`}
                    >
                      {isPopular && <div className="popular-badge">Most Popular</div>}
                      {isCurrent && <div className="current-badge">Your Active Tier</div>}

                      <div className="pc-top">
                        <h4 className="plan-name">{key.toUpperCase()}</h4>
                        <div className="plan-price">
                          <span className="currency">$</span>
                          <span className="val">{plan.price}</span>
                          <span className="period">/mo</span>
                        </div>
                        <p className="plan-summary">
                          {key === "free" && "Essential toolkit for small classrooms."}
                          {key === "basic" && "Ideal for growing educational batches."}
                          {key === "pro" && "High capacity for scaling institutions."}
                          {key === "enterprise" && "Infinite capacity with white-glove features."}
                        </p>
                      </div>

                      <div className="plan-divider"></div>

                      <div className="pc-limits">
                        <div className="limit-row">
                          <span>📝 Max Tests</span>
                          <strong>{plan.maxTests >= 99999 ? "Unlimited" : plan.maxTests}</strong>
                        </div>
                        <div className="limit-row">
                          <span>👥 Max Students</span>
                          <strong>{plan.maxStudents >= 99999 ? "Unlimited" : plan.maxStudents}</strong>
                        </div>
                      </div>

                      <div className="pc-features">
                        <span className="features-label">Included Features:</span>
                        <ul>
                          {plan.features.map((feat, idx) => (
                            <li key={idx}>
                              <span className="check">✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pc-action">
                        {isCurrent ? (
                          <button className="btn-plan current" disabled>
                            Current Plan
                          </button>
                        ) : (
                          <button
                            className={`btn-plan upgrade ${isEnterprise ? "enterprise" : ""}`}
                            onClick={() => setSelectedPlanToUpgrade(key)}
                          >
                            Upgrade to {key.toUpperCase()}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upgrade Confirmation Modal */}
            {selectedPlanToUpgrade && (
              <div className="modal-overlay">
                <div className="confirm-modal">
                  <h3>Confirm Subscription Upgrade</h3>
                  <p>
                    Are you sure you want to upgrade your institutional workspace to the{" "}
                    <strong>{selectedPlanToUpgrade.toUpperCase()}</strong> tier?
                  </p>
                  <div className="confirm-details">
                    <div className="detail-row">
                      <span>Monthly Fee:</span>
                      <strong>${plans[selectedPlanToUpgrade]?.price} / month</strong>
                    </div>
                    <div className="detail-row">
                      <span>Max Tests Allowed:</span>
                      <strong>
                        {plans[selectedPlanToUpgrade]?.maxTests >= 99999
                          ? "Unlimited"
                          : plans[selectedPlanToUpgrade]?.maxTests}
                      </strong>
                    </div>
                    <div className="detail-row">
                      <span>Max Students Allowed:</span>
                      <strong>
                        {plans[selectedPlanToUpgrade]?.maxStudents >= 99999
                          ? "Unlimited"
                          : plans[selectedPlanToUpgrade]?.maxStudents}
                      </strong>
                    </div>
                  </div>
                  <div className="confirm-actions">
                    <button
                      className="btn-cancel"
                      onClick={() => setSelectedPlanToUpgrade(null)}
                      disabled={upgrading}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-confirm-upgrade"
                      onClick={() => handleUpgrade(selectedPlanToUpgrade)}
                      disabled={upgrading}
                    >
                      {upgrading ? "Processing..." : "Confirm & Upgrade"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSubscription;
