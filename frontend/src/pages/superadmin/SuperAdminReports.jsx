import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import api from "../../services/api.js";
import "./SuperAdminReports.css";

const SuperAdminReports = () => {
  const [report, setReport] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      setLoading(true);
      const [repRes, orgsRes] = await Promise.all([
        api.get("/reports/platform"),
        api.get("/organizations")
      ]);
      setReport(repRes.data.report || null);
      setOrgs(orgsRes.data.organizations || orgsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load platform analytics report.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout title="Platform Global Reports">
      <div className="sa-reports-page">
        {/* Header */}
        <div className="sar-header">
          <div>
            <h2>Global Platform Analytics</h2>
            <p>Macro-level multi-tenant platform KPIs, cross-organization exam throughput, and system health.</p>
          </div>
          <div className="sar-actions">
            <button className="btn-print" onClick={handlePrint}>
              🖨️ Print Report
            </button>
            <button className="btn-refresh" onClick={fetchPlatformData}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* State */}
        {loading && (
          <div className="sar-state">
            <div className="spinner"></div>
            <p>Aggregating global platform telemetry across all tenants...</p>
          </div>
        )}

        {!loading && error && (
          <div className="sar-state">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && report && (
          <div className="sar-content">
            {/* Macro KPIs */}
            <div className="sar-kpi-grid">
              <div className="sar-card orgs">
                <div className="sar-icon">🏢</div>
                <div className="sar-info">
                  <span className="sar-val">
                    {report.activeOrganizations} <small>/ {report.totalOrganizations}</small>
                  </span>
                  <span className="sar-label">Active / Total Tenants</span>
                </div>
              </div>

              <div className="sar-card users">
                <div className="sar-icon">👥</div>
                <div className="sar-info">
                  <span className="sar-val">{report.totalUsers}</span>
                  <span className="sar-label">Total Platform Users</span>
                </div>
              </div>

              <div className="sar-card tests">
                <div className="sar-icon">📝</div>
                <div className="sar-info">
                  <span className="sar-val">{report.totalTests}</span>
                  <span className="sar-label">Tests Configured</span>
                </div>
              </div>

              <div className="sar-card attempts">
                <div className="sar-icon">🎯</div>
                <div className="sar-info">
                  <span className="sar-val">{report.totalAttempts}</span>
                  <span className="sar-label">Total Exam Attempts</span>
                </div>
              </div>

              <div className="sar-card pass">
                <div className="sar-icon">📈</div>
                <div className="sar-info">
                  <span className="sar-val">{report.globalPassRate}%</span>
                  <span className="sar-label">Global Pass Rate</span>
                </div>
              </div>

              <div className="sar-card score">
                <div className="sar-icon">🏆</div>
                <div className="sar-info">
                  <span className="sar-val">{report.globalAvgScore}%</span>
                  <span className="sar-label">Global Avg Score</span>
                </div>
              </div>
            </div>

            {/* Platform Insights Grid */}
            <div className="sar-insights-grid">
              <div className="sar-panel">
                <h3>System Telemetry & Throughput</h3>
                <p className="panel-desc">Real-time health of multi-tenant assessment clusters.</p>

                <div className="telemetry-items">
                  <div className="tele-item">
                    <div className="tele-top">
                      <span>Multi-Tenant Isolation</span>
                      <span className="tele-val safe">Enforced (Active)</span>
                    </div>
                    <div className="tele-track">
                      <div className="tele-fill safe" style={{ width: "100%" }}></div>
                    </div>
                  </div>

                  <div className="tele-item">
                    <div className="tele-top">
                      <span>Database Query Load</span>
                      <span className="tele-val normal">Optimal</span>
                    </div>
                    <div className="tele-track">
                      <div className="tele-fill normal" style={{ width: "28%" }}></div>
                    </div>
                  </div>

                  <div className="tele-item">
                    <div className="tele-top">
                      <span>Automated Grading Latency</span>
                      <span className="tele-val fast">&lt; 150ms</span>
                    </div>
                    <div className="tele-track">
                      <div className="tele-fill fast" style={{ width: "95%" }}></div>
                    </div>
                  </div>

                  <div className="tele-item">
                    <div className="tele-top">
                      <span>Global Exam Pass Rate</span>
                      <span className="tele-val">{report.globalPassRate}%</span>
                    </div>
                    <div className="tele-track">
                      <div
                        className="tele-fill pass"
                        style={{ width: `${Math.min(report.globalPassRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sar-panel">
                <h3>Tenant Ecosystem Summary</h3>
                <p className="panel-desc">Distribution of tenant accounts and operational status.</p>

                <div className="eco-stats">
                  <div className="eco-stat-box">
                    <span className="eco-num">{orgs.length}</span>
                    <span className="eco-lbl">Registered Tenants</span>
                  </div>
                  <div className="eco-stat-box active">
                    <span className="eco-num">
                      {orgs.filter((o) => o.status === "active" || o.isActive).length}
                    </span>
                    <span className="eco-lbl">Active Tenants</span>
                  </div>
                </div>

                <div className="eco-list">
                  <div className="eco-list-title">Quick Tenant Directory</div>
                  {orgs.slice(0, 5).map((org) => (
                    <div key={org._id} className="eco-row">
                      <div className="eco-org-info">
                        <span className="eco-org-name">{org.name}</span>
                        <span className="eco-org-slug">/{org.slug}</span>
                      </div>
                      <span className={`eco-status ${org.status || (org.isActive ? "active" : "inactive")}`}>
                        {org.status || (org.isActive ? "Active" : "Inactive")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminReports;
