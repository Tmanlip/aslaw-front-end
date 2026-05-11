// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import Alert from "react-bootstrap/Alert";
import AuthMemory from "../../../../data/authMemory";
import axiosUser from "../../../../api/axiosUser";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import "./dashboard.css";

type CaseItem = {
  id?: number;
  caseId?: number;
  status?: string;
  caseType?: string;
  created_at?: string;
  title?: string;
  caseName?: string;
};

type UserItem = {
  id?: number;
  role?: string;
  status?: string;
};

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage || null;

  const [showAlert, setShowAlert] = useState(!!successMessage);
  const [user] = useState(AuthMemory.getUser());
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!AuthMemory.isLoggedIn() || user?.role !== "admin") {
      navigate("/login"); // redirect if not logged in or wrong role
    }
  }, [navigate, user]);

  useEffect(() => {
    if (successMessage) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const parseArrayPayload = <T,>(payload: any): T[] => {
      if (Array.isArray(payload)) return payload as T[];
      if (Array.isArray(payload?.data)) return payload.data as T[];
      if (Array.isArray(payload?.cases)) return payload.cases as T[];
      if (Array.isArray(payload?.users)) return payload.users as T[];
      return [];
    };

    const loadAnalytics = async () => {
      try {
        const [casesRes, usersRes] = await Promise.all([
          axiosUser.get(`${process.env.REACT_APP_API_URL}/cases`),
          axiosUser.get(`${process.env.REACT_APP_API_URL}/users`),
        ]);

        const caseData = parseArrayPayload<CaseItem>(casesRes.data);
        const userData = parseArrayPayload<UserItem>(usersRes.data);

        setCases(caseData);
        setUsers(userData);
        setApiError(null);
      } catch (error: any) {
        console.error("Failed to load admin analytics data:", error);
        const errorMsg = error?.response?.data?.message || error?.message || "Failed to load analytics";
        setApiError(errorMsg);
        setCases([]);
        setUsers([]);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, []);

  // For main KPIs: show ALL cases (not filtered by time range)
  const totalCases = cases.length;
  const totalUsers = users.length;
  const activeUsers = users.filter((item) => String(item.status || "").toLowerCase() === "active").length;
  const archivedUsers = users.filter((item) => {
    const value = String(item.status || "").toLowerCase();
    return value === "archived" || value === "inactive";
  }).length;
  const activeCases = cases.filter((item) => String(item.status || "").toLowerCase() === "active").length;
  const archivedCases = cases.filter((item) => String(item.status || "").toLowerCase() === "archived").length;
  const litigationCount = cases.filter((item) => String(item.caseType || "").toLowerCase() === "litigation").length;
  const criminalCount = cases.filter((item) => String(item.caseType || "").toLowerCase() === "criminal").length;
  const corporateCount = cases.filter((item) => String(item.caseType || "").toLowerCase() === "corporate").length;

  const maxTypeCount = Math.max(litigationCount, criminalCount, corporateCount, cases.length / 3, 1);
  const recentCases = [...cases]
    .sort((a, b) => {
      const first = new Date(a.created_at || 0).getTime();
      const second = new Date(b.created_at || 0).getTime();
      return second - first;
    })
    .slice(0, 4);

  // Generate sparkline data
  const generateSparklineData = () => {
    const data = [];
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const count = cases.filter(c => {
        const cDate = new Date(c.created_at || 0);
        return cDate >= dayStart && cDate <= dayEnd;
      }).length;
      
      data.push({ value: count });
    }
    return data;
  };

  const sparklineData = generateSparklineData();

  return (
    <>
      <NavBarAdmin />

      {/* Floating Alert */}
      {showAlert && successMessage && (
        <div className="admin-dashboard-alert-wrap">
          <Alert
            variant="success"
            onClose={() => setShowAlert(false)}
            dismissible
          >
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Error Alert */}
      {apiError && (
        <div className="admin-dashboard-alert-wrap">
          <Alert
            variant="danger"
            onClose={() => setApiError(null)}
            dismissible
          >
            <strong>Error Loading Data:</strong> {apiError}
          </Alert>
        </div>
      )}

      {/* Main content */}
      <div className="admin-dashboard-page">
        <section className="admin-dashboard-hero">
          <p className="admin-dashboard-kicker">ADMIN ANALYTICS</p>
          <h1>Welcome, {user?.name || "Admin"}</h1>
          <p>This is your control center for case operations and workload visibility.</p>
        </section>

        {/* Time Range Toggle */}
        <div className="admin-dashboard-time-range">
          <button 
            className={`time-range-btn ${timeRange === "7d" ? "active" : ""}`}
            onClick={() => setTimeRange("7d")}
          >
            Last 7 Days
          </button>
          <button 
            className={`time-range-btn ${timeRange === "30d" ? "active" : ""}`}
            onClick={() => setTimeRange("30d")}
          >
            Last 30 Days
          </button>
          <button 
            className={`time-range-btn ${timeRange === "90d" ? "active" : ""}`}
            onClick={() => setTimeRange("90d")}
          >
            Last 90 Days
          </button>
        </div>

        {/* No Data Warning */}
        {!loadingAnalytics && cases.length === 0 && !apiError && (
          <Alert variant="warning" className="mb-3">
            <strong>No cases found.</strong> The backend may not have case data, or the API connection might need to be verified.
          </Alert>
        )}

        <section className="admin-dashboard-kpi-grid">
          <article className="admin-dashboard-kpi-card">
            <div className="kpi-header">
              <h3>Total Cases</h3>
              <span className="kpi-icon">✓</span>
            </div>
            <strong>{loadingAnalytics ? "Loading..." : totalCases}</strong>
            <span>All registered matters</span>
            {!loadingAnalytics && (
              <div className="kpi-sparkline">
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={sparklineData}>
                    <Line type="monotone" dataKey="value" stroke="#ffd700" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>
          <article className="admin-dashboard-kpi-card">
            <div className="kpi-header">
              <h3>Total Users</h3>
              <span className="kpi-icon">👥</span>
            </div>
            <strong>{loadingAnalytics ? "Loading..." : totalUsers}</strong>
            <span>Registered platform users</span>
          </article>
          <article className="admin-dashboard-kpi-card">
            <div className="kpi-header">
              <h3>Active Users</h3>
              <span className="kpi-icon">🟢</span>
            </div>
            <strong>{loadingAnalytics ? "Loading..." : activeUsers}</strong>
            <span>Users currently active</span>
            <div className="kpi-badge">{loadingAnalytics ? "-" : ((activeUsers / Math.max(totalUsers, 1)) * 100).toFixed(0)}% active</div>
          </article>
          <article className="admin-dashboard-kpi-card">
            <div className="kpi-header">
              <h3>Archived Users</h3>
              <span className="kpi-icon">🗃️</span>
            </div>
            <strong>{loadingAnalytics ? "Loading..." : archivedUsers}</strong>
            <span>Archived or inactive users</span>
            <div className="kpi-badge">{loadingAnalytics ? "-" : ((archivedUsers / Math.max(totalUsers, 1)) * 100).toFixed(0)}% archived</div>
          </article>
          <article className="admin-dashboard-kpi-card">
            <div className="kpi-header">
              <h3>Active Cases</h3>
              <span className="kpi-icon">⏱</span>
            </div>
            <strong>{loadingAnalytics ? "Loading..." : activeCases}</strong>
            <span>Currently in progress</span>
            <div className="kpi-badge">{loadingAnalytics ? "-" : ((activeCases / Math.max(totalCases, 1)) * 100).toFixed(0)}% active</div>
          </article>
          <article className="admin-dashboard-kpi-card">
            <div className="kpi-header">
              <h3>Archived Cases</h3>
              <span className="kpi-icon">📦</span>
            </div>
            <strong>{loadingAnalytics ? "Loading..." : archivedCases}</strong>
            <span>Closed or inactive files</span>
            <div className="kpi-badge">{loadingAnalytics ? "-" : ((archivedCases / Math.max(totalCases, 1)) * 100).toFixed(0)}% archived</div>
          </article>
        </section>

        <section className="admin-dashboard-analytics-grid">
          <article className="admin-dashboard-panel">
            <div className="panel-header">
              <h2>Case Type Distribution</h2>
              <span className="panel-icon">📊</span>
            </div>

            {loadingAnalytics ? (
              <p className="admin-dashboard-empty">Loading distribution...</p>
            ) : litigationCount === 0 && criminalCount === 0 && corporateCount === 0 ? (
              <p className="admin-dashboard-empty">No case type data available in the selected period.</p>
            ) : (
              <>
                <div className="admin-dashboard-bar-row">
                  <span>Litigation</span>
                  <div className="admin-dashboard-bar-track">
                    <div
                      className="admin-dashboard-bar-fill"
                      style={{ width: `${(litigationCount / maxTypeCount) * 100}%` }}
                    />
                  </div>
                  <strong>{litigationCount}</strong>
                </div>

                <div className="admin-dashboard-bar-row">
                  <span>Criminal</span>
                  <div className="admin-dashboard-bar-track">
                    <div
                      className="admin-dashboard-bar-fill"
                      style={{ width: `${(criminalCount / maxTypeCount) * 100}%` }}
                    />
                  </div>
                  <strong>{criminalCount}</strong>
                </div>

                <div className="admin-dashboard-bar-row">
                  <span>Corporate</span>
                  <div className="admin-dashboard-bar-track">
                    <div
                      className="admin-dashboard-bar-fill"
                      style={{ width: `${(corporateCount / maxTypeCount) * 100}%` }}
                    />
                  </div>
                  <strong>{corporateCount}</strong>
                </div>
              </>
            )}
          </article>

          <article className="admin-dashboard-panel">
            <h2>Recent Case Activity</h2>
            {loadingAnalytics ? (
              <p className="admin-dashboard-empty">Loading activity...</p>
            ) : recentCases.length === 0 ? (
              <p className="admin-dashboard-empty">No recent case activity available.</p>
            ) : (
              <ul className="admin-dashboard-activity-list">
                {recentCases.map((item, index) => (
                  <li key={`${item.id || item.caseId || index}`}>
                    <div>
                      <strong>{item.title || item.caseName || `Case #${item.caseId || item.id || "-"}`}</strong>
                      <p>{item.caseType || "General"}</p>
                    </div>
                    <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </div>
    </>
  );
};

export default AdminDashboard;