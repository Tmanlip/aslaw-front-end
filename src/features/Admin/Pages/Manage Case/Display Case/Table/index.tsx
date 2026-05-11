import * as React from "react";
import axiosUser from "../../../../../../api/axiosUser";
import { useNavigate } from "react-router-dom";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { TableVirtuoso, TableComponents } from "react-virtuoso";
import { Modal, Button, Spinner } from "react-bootstrap";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import AssignCase from "../Assign Case";
import { colors } from "../../../../../../constant/color";
import PATH from "../../../../../../constant/paths";
import { useAuth } from "../../../../../../context/AuthContext";
import "../displayCase.css";

interface CaseRecord {
  id: number;
  caseNumber?: string;
  clientName: string;
  lawyerName: string;
  clientFirmID?: string;
  lawyerFirmID?: string;
  caseName?: string;
  caseType?: string;
  status?: string;
  created_at?: string;
  blob_folder_path?: string;
}

interface InteractionLog {
  _id?: string;
  method?: string;
  path?: string;
  status_code?: number;
  created_at?: string;
  email?: string | null;
}

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
};

export default function CaseTable() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [cases, setCases] = React.useState<CaseRecord[]>([]);
  const [logs, setLogs] = React.useState<InteractionLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [showAssign, setShowAssign] = React.useState(false);
  const [showManageModal, setShowManageModal] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseRecord | null>(null);
  const [loadingNavigate, setLoadingNavigate] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, logsRes] = await Promise.all([
          axiosUser.get(`${process.env.REACT_APP_API_URL}/cases`),
          axiosUser.get(`${process.env.REACT_APP_API_URL}/logs/interactions?limit=60`),
        ]);

        const casesData = Array.isArray(casesRes.data)
          ? casesRes.data
          : Array.isArray(casesRes.data?.data)
          ? casesRes.data.data
          : [];

        const logsData = Array.isArray(logsRes.data?.data)
          ? logsRes.data.data
          : Array.isArray(logsRes.data)
          ? logsRes.data
          : [];

        setCases(casesData);
        setLogs(logsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRegisterCase = () => {
    navigate(PATH.ADMIN.REGISTER_CASE);
  };

  const handleShowAssign = (row: CaseRecord) => {
    setSelectedCase(row);
    setShowAssign(true);
  };

  const handleCloseAssign = () => {
    setShowAssign(false);
    setSelectedCase(null);
  };

  const handleManageCase = (row: CaseRecord) => {
    if (role !== "admin") return;
    setSelectedCase(row);
    setShowManageModal(true);
  };

  const handleNavigateManageCase = () => {
    if (!selectedCase) return;
    setLoadingNavigate(true);

    try {
      navigate(PATH.ADMIN.BILLING, {
        state: {
          selectedCase: {
            ...selectedCase,
            caseId: selectedCase.id,
            title: selectedCase.caseName,
          },
          lockManageUser: true,
        },
      });

      setShowManageModal(false);
    } catch (err) {
      console.error(err);
      setLoadingNavigate(false);
    }
  };

  const VirtuosoTableComponents: TableComponents<CaseRecord> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
      <TableContainer component={Paper} {...props} ref={ref} />
    )),
    Table: (props) => (
      <Table {...props} sx={{ borderCollapse: "separate", tableLayout: "fixed" }} />
    ),
    TableHead,
    TableRow,
    TableBody,
  };

  const columns = [
    { label: "Case Number", dataKey: "caseNumber", width: 130 },
    { label: "Client Name", dataKey: "clientName", width: 200 },
    { label: "Lawyer Name", dataKey: "lawyerName", width: 200 },
    { label: "Case Name", dataKey: "caseName", width: 260 },
    { label: "Case Type", dataKey: "caseType", width: 150 },
    { label: "Status", dataKey: "status", width: 130 },
    { label: "Date Created", dataKey: "createdAt", width: 140 },
    { label: "Action", dataKey: "action", width: 200 },
  ];

  const totalCases = cases.length;
  const assignedCases = cases.filter((item) => Boolean(item.caseName)).length;
  const unassignedCases = totalCases - assignedCases;
  const litigationCases = cases.filter((item) => String(item.caseType || "").toLowerCase() === "litigation").length;
  const criminalCases = cases.filter((item) => String(item.caseType || "").toLowerCase() === "criminal").length;
  const corporateCases = cases.filter((item) => String(item.caseType || "").toLowerCase() === "corporate").length;

  const caseTypeDonutData = [
    { name: "Litigation", value: litigationCases, color: "#0ea5e9" },
    { name: "Criminal", value: criminalCases, color: "#ffd700" },
    { name: "Corporate", value: corporateCases, color: "#34d399" },
  ];

  const formatRelativeTime = (value?: string): string => {
    if (!value) return "-";
    const now = Date.now();
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return "-";

    const diffMs = Math.max(0, now - then);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;

    if (diffMs < minute) return "just now";
    if (diffMs < hour) return `${Math.floor(diffMs / minute)} minute(s) ago`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)} hour(s) ago`;
    if (diffMs < week) return `${Math.floor(diffMs / day)} day(s) ago`;
    return `${Math.floor(diffMs / week)} week(s) ago`;
  };

  const formatCreatedDate = (value?: string): string => {
    if (!value) return "-";

    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) return "-";

    return dateValue.toLocaleDateString();
  };

  const isCaseRelatedLog = (log: InteractionLog): boolean => {
    const path = String(log.path || "").toLowerCase();
    return ["case", "cases", "registercases", "assign", "billing", "encrypted-documents"].some((key) =>
      path.includes(key)
    );
  };

  const toDisplayName = (email?: string | null): string => {
    if (!email) return "Team Member";
    const base = email.split("@")[0].replace(/[._-]+/g, " ").trim();
    if (!base) return "Team Member";
    return base
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const toCaseSystemActivity = (log: InteractionLog, index: number): ActivityItem => {
    const path = String(log.path || "").toLowerCase();
    const method = String(log.method || "GET").toUpperCase();
    const actor = toDisplayName(log.email);

    if (path.includes("encrypted-documents")) {
      if (method === "POST" && path.includes("upload")) {
        return {
          id: String(log._id || `case-system-${index}`),
          title: `${actor} uploaded document`,
          detail: "A new encrypted case document was uploaded",
          timeLabel: formatRelativeTime(log.created_at),
        };
      }

      if (method === "DELETE") {
        return {
          id: String(log._id || `case-system-${index}`),
          title: `${actor} removed document`,
          detail: "An encrypted case document was deleted",
          timeLabel: formatRelativeTime(log.created_at),
        };
      }

      if (method === "POST" && (path.includes("share") || path.includes("revoke"))) {
        return {
          id: String(log._id || `case-system-${index}`),
          title: `${actor} updated document access`,
          detail: "Encrypted document sharing permissions were updated",
          timeLabel: formatRelativeTime(log.created_at),
        };
      }
    }

    if (method === "POST" && (path.includes("registercases") || path.includes("cases"))) {
      return {
        id: String(log._id || `case-system-${index}`),
        title: `${actor} created case`,
        detail: "New case record was created and sent for assignment",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if ((method === "PATCH" || method === "PUT") && path.includes("case")) {
      return {
        id: String(log._id || `case-system-${index}`),
        title: `${actor} updated case`,
        detail: "Case details and assignment information were updated",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (path.includes("assign")) {
      return {
        id: String(log._id || `case-system-${index}`),
        title: `${actor} assigned case`,
        detail: "Case ownership was assigned to a responsible lawyer",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (path.includes("billing")) {
      return {
        id: String(log._id || `case-system-${index}`),
        title: `${actor} updated case billing`,
        detail: "Billing milestones and payment workflow were updated",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (method === "DELETE" && path.includes("case")) {
      return {
        id: String(log._id || `case-system-${index}`),
        title: `${actor} removed case`,
        detail: "Case record removal was requested and logged",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    return {
      id: String(log._id || `case-system-${index}`),
      title: `${actor} viewed case`,
      detail: "Case details were accessed from the case management dashboard",
      timeLabel: formatRelativeTime(log.created_at),
    };
  };

  const toCaseAlert = (log: InteractionLog, index: number): ActivityItem => {
    const statusCode = Number(log.status_code || 0);
    const path = String(log.path || "-");

    if (statusCode >= 500) {
      return {
        id: String(log._id || `case-alert-${index}`),
        title: "Critical Case Alert",
        detail: `Server error detected while processing ${path}`,
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (statusCode >= 400) {
      return {
        id: String(log._id || `case-alert-${index}`),
        title: "Case Request Warning",
        detail: `Request validation or permission issue on ${path}`,
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    return {
      id: String(log._id || `case-alert-${index}`),
      title: "Case Alert",
      detail: `Activity detected on ${path}`,
      timeLabel: formatRelativeTime(log.created_at),
    };
  };

  const sortedLogs = [...logs].sort((a, b) => {
    const first = new Date(a.created_at || 0).getTime();
    const second = new Date(b.created_at || 0).getTime();
    return second - first;
  });
  const caseLogs = sortedLogs.filter(isCaseRelatedLog);
  const recentActivities = caseLogs.slice(0, 5).map(toCaseSystemActivity);
  const alerts = caseLogs
    .filter((item) => Number(item.status_code || 0) >= 400)
    .slice(0, 5)
    .map(toCaseAlert);

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" style={{ color: colors.green3 }} />
      </div>
    );
  }

  return (
    <>
      <section className="admin-cases-top-grid">
        <div className="admin-cases-metrics-cluster">
          <article className="admin-case-analytics-card admin-case-analytics-card--total">
            <h4>Total Cases</h4>
            <strong>{totalCases}</strong>
            <span>All records in case registry</span>
          </article>
          <article className="admin-case-analytics-card admin-case-analytics-card--compact">
            <h4>Assigned Cases</h4>
            <strong>{assignedCases}</strong>
            <span>{totalCases ? Math.round((assignedCases / totalCases) * 100) : 0}% assigned</span>
          </article>
          <article className="admin-case-analytics-card admin-case-analytics-card--compact">
            <h4>Unassigned Cases</h4>
            <strong>{unassignedCases}</strong>
            <span>{totalCases ? Math.round((unassignedCases / totalCases) * 100) : 0}% unassigned</span>
          </article>
        </div>

        <section className="admin-case-analytics-panel admin-cases-distribution-panel">
          <h4>Case Type Distribution</h4>
          <div className="admin-case-donut-wrap">
            <ResponsiveContainer width="100%" height={188}>
              <PieChart>
                <Pie data={caseTypeDonutData} dataKey="value" nameKey="name" outerRadius={68} paddingAngle={3}>
                  {caseTypeDonutData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="admin-case-donut-legend">
              {caseTypeDonutData.map((item) => (
                <div key={item.name}>
                  <span style={{ backgroundColor: item.color }} />
                  <p>{item.name}</p>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="admin-case-ops-grid">
        <article className="admin-case-analytics-panel">
          <h4>System Activity</h4>
          <ul className="admin-case-log-list">
            {recentActivities.length === 0 ? (
              <li className="admin-case-log-empty">No recent activity.</li>
            ) : (
              recentActivities.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <span>{item.timeLabel}</span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="admin-case-analytics-panel">
          <h4>Alerts</h4>
          <ul className="admin-case-log-list">
            {alerts.length === 0 ? (
              <li className="admin-case-log-empty">No alerts detected.</li>
            ) : (
              alerts.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong className="admin-case-alert-code">{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <span>{item.timeLabel}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="admin-case-toolbar">
        <p>Showing {cases.length} case records</p>
        {role === "admin" && (
          <Button className="admin-case-register-btn" onClick={handleRegisterCase}>
            + Register New Case
          </Button>
        )}
      </section>

      <Paper className="admin-case-table-shell" style={{ height: "min(62vh, 560px)", width: "100%", minWidth: 0 }}>
        <TableVirtuoso
          data={cases}
          components={VirtuosoTableComponents}
          fixedHeaderContent={() => (
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  className="admin-case-table-head-cell"
                  key={column.dataKey}
                  variant="head"
                  style={{
                    width: column.width,
                    fontWeight: 600,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          )}
          itemContent={(_, row) => (
            <>
              <TableCell>{row.caseNumber || `CASE-${row.id}`}</TableCell>
              <TableCell>{row.clientName}</TableCell>
              <TableCell>{row.lawyerName}</TableCell>
              <TableCell>{row.caseName || "-"}</TableCell>
              <TableCell>{row.caseType || "Litigation"}</TableCell>
              <TableCell>
                {row.status ? (
                  <span
                    className={`admin-case-status-pill ${
                      String(row.status).toLowerCase() === "active"
                        ? "active"
                        : String(row.status).toLowerCase() === "inactive"
                        ? "inactive"
                        : "archived"
                    }`}
                  >
                    {row.status}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>{formatCreatedDate(row.created_at)}</TableCell>
              <TableCell>
                <div className="admin-case-action-cell">
                {!row.caseName && (
                  <Button
                    className="admin-case-action-btn admin-case-secondary-action"
                    size="sm"
                    onClick={() => handleShowAssign(row)}
                  >
                    Add Case
                  </Button>
                )}
                {row.caseName && (
                  <Button
                    className="admin-case-action-btn admin-case-primary-action"
                    size="sm"
                    onClick={() => handleManageCase(row)}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    Manage Case
                  </Button>
                )}
                </div>
              </TableCell>
            </>
          )}
        />
      </Paper>

      <AssignCase
        show={showAssign}
        handleClose={handleCloseAssign}
        selectedCase={selectedCase}
      />

      <Modal show={showManageModal} onHide={() => setShowManageModal(false)} centered className="admin-case-modal">
        <Modal.Header closeButton style={{ backgroundColor: colors.green3 }}>
          <Modal.Title className="text-white">Manage Case</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCase && (
            <>
              <p><strong>Case Number:</strong> {selectedCase.caseNumber || `CASE-${selectedCase.id}`}</p>
              <p><strong>Client Name:</strong> {selectedCase.clientName}</p>
              <p><strong>Lawyer Name:</strong> {selectedCase.lawyerName}</p>
              <p><strong>Case Name:</strong> {selectedCase.caseName}</p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedCase.status ? (
                  <span
                    className={`admin-case-status-pill ${
                      String(selectedCase.status).toLowerCase() === "active"
                        ? "active"
                        : String(selectedCase.status).toLowerCase() === "inactive"
                        ? "inactive"
                        : "archived"
                    }`}
                  >
                    {selectedCase.status}
                  </span>
                ) : (
                  "-"
                )}
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowManageModal(false)}
            disabled={loadingNavigate}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleNavigateManageCase}
            disabled={loadingNavigate}
          >
            {loadingNavigate ? (
              <>
                <Spinner size="sm" className="me-2" />
                Loading...
              </>
            ) : (
              "Go to Manage Case"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
