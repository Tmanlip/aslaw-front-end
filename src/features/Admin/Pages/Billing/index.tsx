import React from "react";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { useNavigate, useLocation } from "react-router-dom";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Tabs";
import { useAuth } from "../../../../context/AuthContext"; 
import AppRoutes from "../../../../routes/AppRouter"; 
import { useClientData } from "../../../../context/ClientDataContext";
import PATH from "../../../../constant/paths";
import axiosUser from "../../../../api/axiosUser";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatCaseDate } from "../../../../utils/caseDates";
import { subscribeToWebPubSubNotifications } from "../../../../lib/webPubSubNotifications";
import { getEcho } from "../../../../lib/echo";
import { resolveRealtimeDriver } from "../../../../lib/realtimeDriver";
import "./billing.css";

const REALTIME_DRIVER = resolveRealtimeDriver();

const extractRealtimeCaseId = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const nested = candidate.data && typeof candidate.data === "object" ? (candidate.data as Record<string, unknown>) : null;
  const source = nested ?? candidate;

  const explicitCaseId = Number(source.case_id);
  if (Number.isFinite(explicitCaseId) && explicitCaseId > 0) {
    return explicitCaseId;
  }

  const message = typeof source.message === "string" ? source.message : "";
  const match = message.match(/Case\s*#(\d+)/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const isDocumentRealtimeEvent = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  const nested = candidate.data && typeof candidate.data === "object" ? (candidate.data as Record<string, unknown>) : null;
  const source = nested ?? candidate;

  const title = String(source.title || source.event || "").toLowerCase();
  const message = String(source.message || "").toLowerCase();

  return (
    title.includes("document") ||
    title.includes("invoice") ||
    message.includes("document") ||
    message.includes("invoice")
  );
};

const UpdateCheque: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();
  const { cases } = useClientData();
  const routes = AppRoutes(role);
  const lastRealtimeRefreshRef = useRef<{ key: string; at: number } | null>(null);

  // Get the selected case and the flag for locking Manage Client button
  const {
    selectedCase,
    lockManageUser,
    activeFileSection: requestedActiveFileSection,
    successMessage,
  } = location.state || {};

  const initialActiveSection =
    requestedActiveFileSection === "documents" ||
    requestedActiveFileSection === "reports" ||
    requestedActiveFileSection === "invoices" ||
    requestedActiveFileSection === "pending" ||
    requestedActiveFileSection === "recent"
      ? requestedActiveFileSection
      : "recent";

  const [caseToManage, setCaseToManage] = useState(selectedCase || (cases.length > 0 ? cases[0] : null));
  const [activeFileSection, setActiveFileSection] = useState<"recent" | "pending" | "documents" | "reports" | "invoices">(initialActiveSection);
  const [showAlert, setShowAlert] = useState(Boolean(successMessage));
  const [progressSourceLabel, setProgressSourceLabel] = useState<string>("Loaded from case data");
  const caseDescription =
    (caseToManage as any)?.description ||
    (caseToManage as any)?.caseDescription ||
    "No case description available.";

  const parseDateMillis = (value: unknown): number => {
    if (!value) return 0;
    const dateMillis = new Date(String(value)).getTime();
    return Number.isFinite(dateMillis) ? dateMillis : 0;
  };

  const caseCreatedAt = formatCaseDate((caseToManage as any)?.created_at || (caseToManage as any)?.createdAt);
  const caseModifiedSource =
    (caseToManage as any)?.updated_at ||
    (caseToManage as any)?.modified_at ||
    (caseToManage as any)?.updatedAt;
  const caseModifiedMillis = parseDateMillis(caseModifiedSource);
  const encryptedDocs = Array.isArray((caseToManage as any)?.encrypted_documents)
    ? (caseToManage as any).encrypted_documents
    : [];
  const activeEncryptedCount = encryptedDocs.filter(
    (doc: any) =>
      doc?.status !== "deleted" &&
      String(doc?.status || "").toLowerCase() !== "pending_approval"
  ).length;
  const encryptedInvoiceCount = encryptedDocs.filter((doc: any) => doc?.category === "invoices" && doc?.status !== "deleted").length;
  const latestDocumentMillis = encryptedDocs.reduce((latest: number, doc: any) => {
    const docMillis = parseDateMillis(doc?.updated_at || doc?.created_at || doc?.createdAt);
    return Math.max(latest, docMillis);
  }, 0);
  const effectiveModifiedMillis = Math.max(caseModifiedMillis, latestDocumentMillis);
  const caseModifiedAt =
    effectiveModifiedMillis > 0
      ? formatCaseDate(new Date(effectiveModifiedMillis).toISOString())
      : formatCaseDate(caseModifiedSource);
  const caseStatusLabel = String(
    (caseToManage as any)?.status || (caseToManage as any)?.caseStatus || "Unknown"
  ).trim() || "Unknown";
  const normalizedCaseStatus = caseStatusLabel.toLowerCase();
  const currentCaseId = Number(caseToManage?.caseId ?? caseToManage?.id ?? 0);

  const quickAccessItems = [
    {
      label: "Recent",
      count: activeEncryptedCount,
      hint: "All encrypted",
      section: "recent" as const,
    },
    {
      label: "Pending",
      count: encryptedDocs.filter((doc: any) => String(doc?.status || "").toLowerCase() === "pending_approval").length,
      hint: "Awaiting review",
      section: "pending" as const,
    },
    {
      label: "Documents",
      count: encryptedDocs.filter((doc: any) => doc?.category === "documents" && doc?.status !== "deleted").length,
      hint: "Case files",
      section: "documents" as const,
    },
    {
      label: "Reports",
      count: encryptedDocs.filter((doc: any) => doc?.category === "reports" && doc?.status !== "deleted").length,
      hint: "Generated",
      section: "reports" as const,
    },
    {
      label: "Invoices",
      count: encryptedInvoiceCount,
      hint: "Payment docs",
      section: "invoices" as const,
    },
  ];

  useEffect(() => {
    const selectedCaseId = Number((selectedCase as any)?.caseId ?? (selectedCase as any)?.id ?? 0);

    if (Number.isFinite(selectedCaseId) && selectedCaseId > 0) {
      const matchedCase = cases.find(
        (item: any) => Number(item?.caseId ?? item?.id) === selectedCaseId
      );

      setCaseToManage(matchedCase || selectedCase);
      return;
    }

    setCaseToManage(cases.length > 0 ? cases[0] : null);
  }, [selectedCase, cases]);

  useEffect(() => {
    if (!successMessage) return;

    setShowAlert(true);
    const timer = setTimeout(() => setShowAlert(false), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (
      requestedActiveFileSection === "recent" ||
      requestedActiveFileSection === "pending" ||
      requestedActiveFileSection === "documents" ||
      requestedActiveFileSection === "reports" ||
      requestedActiveFileSection === "invoices"
    ) {
      setActiveFileSection(requestedActiveFileSection);
    }
  }, [requestedActiveFileSection]);

  const refreshCaseData = useCallback(async (options?: { silent?: boolean }) => {
    const { silent = false } = options || {};
    if (!Number.isFinite(currentCaseId) || currentCaseId <= 0) {
      return;
    }

    try {
      try {
        const caseResponse = await axiosUser.get(
          `${process.env.REACT_APP_API_URL}/cases/${currentCaseId}`,
          {
            params: { _ts: Date.now() },
          }
        );

        const updatedCase =
          caseResponse?.data?.case ||
          caseResponse?.data?.data ||
          caseResponse?.data ||
          null;

        if (updatedCase) {
          setCaseToManage(updatedCase);
          if (!silent) {
            setProgressSourceLabel("Refreshed from case data");
          }
          return;
        }
      } catch (detailError) {
        console.warn("Case detail refresh failed, falling back to case list", detailError);
      }

      // Fallback for backends that only expose list response shapes.
      const response = await axiosUser.get(`${process.env.REACT_APP_API_URL}/cases`, {
        params: { _ts: Date.now() },
      });
      const allCases = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
      const updatedCaseFromList = allCases.find(
        (item: any) => Number(item.caseId ?? item.id) === currentCaseId
      );
      if (updatedCaseFromList) {
        setCaseToManage(updatedCaseFromList);
        if (!silent) {
          setProgressSourceLabel("Refreshed from case data");
        }
      }
    } catch (error) {
      console.error("Failed to refresh billing case data", error);
    }
  }, [currentCaseId]);

  useEffect(() => {
    if (!Number.isFinite(currentCaseId) || currentCaseId <= 0) {
      return;
    }

    void refreshCaseData({ silent: true });
  }, [currentCaseId, refreshCaseData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshCaseData({ silent: true });
    }, 10000);

    const handleFocus = () => {
      void refreshCaseData({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCaseData({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshCaseData]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId || !Number.isFinite(currentCaseId) || currentCaseId <= 0) {
      return;
    }

    const handleRealtimePayload = (payload: unknown) => {
      if (!isDocumentRealtimeEvent(payload)) {
        return;
      }

      const payloadCaseId = extractRealtimeCaseId(payload);
      if (!payloadCaseId || payloadCaseId !== currentCaseId) {
        return;
      }

      const now = Date.now();
      const refreshKey = `${payloadCaseId}`;
      const previous = lastRealtimeRefreshRef.current;
      if (previous && previous.key === refreshKey && now - previous.at < 4000) {
        return;
      }

      lastRealtimeRefreshRef.current = { key: refreshKey, at: now };
      void refreshCaseData({ silent: true });
    };

    if (REALTIME_DRIVER === "webpubsub") {
      const dispose = subscribeToWebPubSubNotifications(
        (payload) => {
          handleRealtimePayload(payload);
        },
        (err) => {
          console.warn("Azure Web PubSub admin billing sync issue", err);
        }
      );

      return () => {
        dispose();
      };
    }

    try {
      getEcho()
        .private(`App.Models.User.${userId}`)
        .listen(".UserNotificationCreated", (payload: unknown) => {
          handleRealtimePayload(payload);
        });
    } catch (err) {
      console.warn("Realtime admin billing sync subscription failed", err);
    }

    return () => {
      try {
        getEcho().leave(`App.Models.User.${userId}`);
      } catch {
        // ignore cleanup errors
      }
    };
  }, [currentCaseId, refreshCaseData, user?.id]);

  const handleCaseProgressUpdate = (caseId: number, progress: number) => {
    if (!Number.isFinite(caseId) || caseId <= 0 || !Number.isFinite(progress)) {
      return;
    }

    setCaseToManage((prev: any) => {
      if (!prev || Number(prev.caseId ?? prev.id) !== caseId) return prev;
      setProgressSourceLabel("Updated from invoice save");
      return { ...prev, progress };
    });
  };

  /* ================== HANDLE MANAGE CLIENT ================== */
  const handleManageClick = () => {
    if (role !== "admin") return;
    if (lockManageUser) return; // Button locked

    const manageRoute = routes.find(
      (route) =>
        route.path &&
        route.path.toLowerCase().includes(PATH.ADMIN.MANAGE_PROFILE.toLowerCase())
    );

    if (manageRoute?.path) {
      navigate(manageRoute.path);
    } else {
      console.warn("Manage User route not found for admin");
    }
  };

  /* ================== HANDLE MANAGE CASE ================== */
  const handleManageCaseClick = () => {
    if (role !== "admin") {
      console.warn("Access denied: only admin can manage cases");
      return;
    }

    if (!caseToManage) {
      console.warn("No cases available to manage");
      return;
    }

    // Pass the full case object instead of only the ID
    navigate(PATH.ADMIN.EDIT_CASE, {
      state: {
        selectedCase: caseToManage,
        successMessage: "Welcome to Manage Case",
        lockManageUser: true, // optional if needed
      },
    });

    console.log("Navigating to EditCase with selectedCase:", caseToManage);
  };

  const handleChangeLawyerClick = () => {
    if (role !== "admin") {
      console.warn("Access denied: only admin can change assigned lawyer");
      return;
    }

    if (!caseToManage) {
      console.warn("No cases available to change lawyer");
      return;
    }

    navigate(PATH.ADMIN.EDIT_CASE, {
      state: {
        selectedCase: caseToManage,
        lockManageUser: true,
        editMode: "lawyerOnly",
        autoStartEdit: true,
      },
    });
  };

  return (
    <>
      <NavBarAdmin />

      {showAlert && successMessage && (
        <div className="admin-billing-alert-wrap">
          <Alert variant="success" onClose={() => setShowAlert(false)} dismissible>
            {successMessage}
          </Alert>
        </div>
      )}

      <div className="admin-billing-page">
        <div className="admin-billing-header">
          <CaseProgress caseItem={caseToManage || undefined} progressSourceLabel={progressSourceLabel} />
        </div>

        <div className="admin-billing-main-grid">
          <aside className="admin-billing-side-panel admin-billing-card">
            <div className="admin-billing-toolbar-label">Quick Access</div>
            <div className="admin-billing-quick-grid">
              {quickAccessItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`admin-billing-quick-item-btn ${activeFileSection === item.section ? "active" : ""}`}
                  onClick={() => setActiveFileSection(item.section)}
                >
                  <div className="admin-billing-quick-item-main">
                    <span>{item.label}</span>
                    <small>{item.hint}</small>
                  </div>
                  <strong>{item.count}</strong>
                </button>
              ))}
            </div>
          </aside>

          <div className="admin-billing-content-col">
            <div className="admin-billing-top-row admin-billing-card">
              <div className="admin-billing-card-header-row">
                <div>
                  <h2>Case Description</h2>
                  <p>{caseDescription}</p>
                  <div className="admin-billing-meta-row" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <span><strong>Date Created:</strong> {caseCreatedAt}</span>
                    <span><strong>Date Modified:</strong> {caseModifiedAt}</span>
                  </div>
                  <div className="admin-billing-status-row">
                    <span className="admin-billing-status-label">Status</span>
                    <span className={`admin-billing-status-badge admin-billing-status-${normalizedCaseStatus}`}>
                      {caseStatusLabel}
                    </span>
                  </div>
                </div>

                {(role === "admin" || role === "adminstaff") && (
                  <div className="admin-billing-action-col">
                    <Button
                      variant="primary"
                      className="admin-billing-action-btn"
                      onClick={handleManageClick}
                      disabled={lockManageUser}
                    >
                      Edit Client Information
                    </Button>

                    <Button
                      variant="secondary"
                      className="admin-billing-action-btn"
                      onClick={handleManageCaseClick}
                    >
                      Edit Case Information
                    </Button>

                    <Button
                      variant="outline-secondary"
                      className="admin-billing-action-btn"
                      onClick={handleChangeLawyerClick}
                    >
                      Change Lawyer
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Files / documents section */}
            <div className="admin-billing-files-wrap admin-billing-card">
              <FileSection
                fileListUrl="/files/fileList.json"
                selectedCase={caseToManage}
                onUploadSuccess={refreshCaseData}
                onDeleteSuccess={refreshCaseData}
                onCaseProgressUpdate={handleCaseProgressUpdate}
                onPhaseSnapshotChange={() => setProgressSourceLabel("Using latest invoice phase snapshot")}
                activeKey={activeFileSection}
                onActiveKeyChange={(key) => setActiveFileSection(key as "recent" | "pending" | "documents" | "reports" | "invoices")}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateCheque;