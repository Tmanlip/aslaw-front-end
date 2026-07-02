// src/pages/LawyerDashboard.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new";
import Alert from "react-bootstrap/Alert";
import AuthMemory from "../../../../data/authMemory";
import { Case, LawyerFullData } from "../../../../data/userInfo";
import { fetchLawyerFullData } from "../../../../hooks/lawyerApi";
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

const LawyerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage || null;

  const [showAlert, setShowAlert] = useState(!!successMessage);
  const [user] = useState(AuthMemory.getUser());
  const [lawyerData, setLawyerData] = useState<LawyerFullData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (!AuthMemory.isLoggedIn() || user?.role !== "lawyer") {
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
    const loadLawyerAnalytics = async () => {
      try {
        const firmID = user?.firmID;
        if (!firmID) {
          setLawyerData(null);
          return;
        }

        const response = await fetchLawyerFullData(firmID);
        setLawyerData(response);
      } catch (error) {
        setLawyerData(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadLawyerAnalytics();
  }, [user?.firmID]);

  const cases = lawyerData?.cases || [];
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
      <NavBarLawyer />

      {/* Floating Alert */}
      {showAlert && successMessage && (
        <div className="lawyer-dashboard-alert-wrap">
          <Alert
            variant="success"
            onClose={() => setShowAlert(false)}
            dismissible
          >
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Main content */}
      <div className="lawyer-dashboard-page">
        <section className="lawyer-dashboard-hero">
          <p className="lawyer-dashboard-kicker">LAWYER ANALYTICS</p>
          <h1>Welcome, {user?.name || "Lawyer"}</h1>
          <p>Review your caseload, delivery progress, and recent assignment updates.</p>
        </section>

        <section className="lawyer-dashboard-kpi-grid">
          <article className="lawyer-dashboard-kpi-card">
            <h3>Assigned Cases</h3>
            <strong>{loadingAnalytics ? "..." : totalCases}</strong>
            <span>Total files under your responsibility</span>
          </article>
          <article className="lawyer-dashboard-kpi-card">
            <h3>Active Cases</h3>
            <strong>{loadingAnalytics ? "..." : activeCases}</strong>
            <span>Cases currently progressing</span>
          </article>
          <article className="lawyer-dashboard-kpi-card">
            <h3>Average Progress</h3>
            <strong>{loadingAnalytics ? "..." : `${averageProgress}%`}</strong>
            <span>Across all assigned matters</span>
          </article>
        </section>

        <section className="lawyer-dashboard-analytics-grid">
          <article className="lawyer-dashboard-panel">
            <h2>Status Overview</h2>

            <div className="lawyer-dashboard-bar-row">
              <span>Active</span>
              <div className="lawyer-dashboard-bar-track">
                <div
                  className="lawyer-dashboard-bar-fill"
                  style={{ width: `${totalCases ? (activeCases / totalCases) * 100 : 0}%` }}
                />
              </div>
              <strong>{activeCases}</strong>
            </div>

            <div className="lawyer-dashboard-bar-row">
              <span>Archived</span>
              <div className="lawyer-dashboard-bar-track">
                <div
                  className="lawyer-dashboard-bar-fill"
                  style={{ width: `${totalCases ? (archivedCases / totalCases) * 100 : 0}%` }}
                />
              </div>
              <strong>{archivedCases}</strong>
            </div>
          </article>

          <article className="lawyer-dashboard-panel">
            <h2>Recent Case Activity</h2>
            {loadingAnalytics ? (
              <p className="lawyer-dashboard-empty">Loading activity...</p>
            ) : recentCases.length === 0 ? (
              <p className="lawyer-dashboard-empty">No recent case activity available.</p>
            ) : (
              <ul className="lawyer-dashboard-activity-list">
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

export default LawyerDashboard;