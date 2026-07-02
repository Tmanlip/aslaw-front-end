// src/pages/ClientDashboard.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import Alert from "react-bootstrap/Alert";
import AuthMemory from "../../../../data/authMemory";
import { Case, ClientFullData } from "../../../../data/userInfo";
import { fetchClientFullData } from "../../../../hooks/clientApi";
import "./dashboard.css";

const toSafePercent = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

const getCaseProgress = (item: Case): number => {
  const invoicePhases = item.invoice_payment_phases;
  const totalExpected = invoicePhases
    ? Object.values(invoicePhases).reduce((sum, phase) => sum + Number(phase?.expected ?? 0), 0)
    : 0;
  const totalPaid = invoicePhases
    ? Object.values(invoicePhases).reduce((sum, phase) => sum + Number(phase?.paid ?? 0), 0)
    : 0;

  if (totalExpected > 0) {
    return toSafePercent((totalPaid / totalExpected) * 100);
  }

  return toSafePercent(item.progress ?? 0);
};

const ClientDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage || null;

  const [showAlert, setShowAlert] = useState(!!successMessage);
  const [user] = useState(AuthMemory.getUser());
  const [clientData, setClientData] = useState<ClientFullData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (!AuthMemory.isLoggedIn()) {
      // Redirect to login if no valid session
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (successMessage) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const loadClientAnalytics = async () => {
      try {
        const firmID = user?.firmID;
        if (!firmID) {
          setClientData(null);
          return;
        }
        const response = await fetchClientFullData(firmID);
        setClientData(response);
      } catch (error) {
        setClientData(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadClientAnalytics();
  }, [user?.firmID]);

  const cases = clientData?.cases || [];
  const totalCases = cases.length;
  const activeCases = cases.filter((item) => String(item.status || "").toLowerCase() === "active").length;
  const archivedCases = cases.filter((item) => String(item.status || "").toLowerCase() === "archived").length;
  const averageProgress =
    totalCases > 0
      ? Math.round(
          cases.reduce((acc: number, item: Case) => acc + getCaseProgress(item), 0) / totalCases
        )
      : 0;

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 4);

  return (
    <>
      <NavBarClient />

      {/* ✅ Floating Alert at top */}
      {showAlert && successMessage && (
        <div className="client-dashboard-alert-wrap">
          <Alert
            variant="success"
            onClose={() => setShowAlert(false)}
            dismissible
          >
            {successMessage}
          </Alert>
        </div>
      )}

      {/* ✅ Main content */}
      <div className="client-dashboard-page">
        <section className="client-dashboard-hero">
          <p className="client-dashboard-kicker">CLIENT ANALYTICS</p>
          <h1>Welcome, {user?.name || "Client"}</h1>
          <p>Track your matters, status updates, and progress snapshots in one view.</p>
        </section>

        <section className="client-dashboard-kpi-grid">
          <article className="client-dashboard-kpi-card">
            <h3>Total Cases</h3>
            <strong>{loadingAnalytics ? "..." : totalCases}</strong>
            <span>Cases linked to your profile</span>
          </article>
          <article className="client-dashboard-kpi-card">
            <h3>Active Cases</h3>
            <strong>{loadingAnalytics ? "..." : activeCases}</strong>
            <span>Currently moving forward</span>
          </article>
          <article className="client-dashboard-kpi-card">
            <h3>Average Progress</h3>
            <strong>{loadingAnalytics ? "..." : `${averageProgress}%`}</strong>
            <span>Across your case portfolio</span>
          </article>
        </section>

        <section className="client-dashboard-analytics-grid">
          <article className="client-dashboard-panel">
            <h2>Case Status Breakdown</h2>

            <div className="client-dashboard-bar-row">
              <span>Active</span>
              <div className="client-dashboard-bar-track">
                <div
                  className="client-dashboard-bar-fill"
                  style={{ width: `${totalCases ? (activeCases / totalCases) * 100 : 0}%` }}
                />
              </div>
              <strong>{activeCases}</strong>
            </div>

            <div className="client-dashboard-bar-row">
              <span>Archived</span>
              <div className="client-dashboard-bar-track">
                <div
                  className="client-dashboard-bar-fill"
                  style={{ width: `${totalCases ? (archivedCases / totalCases) * 100 : 0}%` }}
                />
              </div>
              <strong>{archivedCases}</strong>
            </div>
          </article>

          <article className="client-dashboard-panel">
            <h2>Recent Activity</h2>
            {loadingAnalytics ? (
              <p className="client-dashboard-empty">Loading activity...</p>
            ) : recentCases.length === 0 ? (
              <p className="client-dashboard-empty">No recent case activity available.</p>
            ) : (
              <ul className="client-dashboard-activity-list">
                {recentCases.map((item, index) => (
                  <li key={`${item.caseId || item.id || index}`}>
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

export default ClientDashboard;