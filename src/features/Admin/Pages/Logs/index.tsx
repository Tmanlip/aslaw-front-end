import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "react-bootstrap/Pagination";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import axiosUser from "../../../../api/axiosUser";
import "./logs.css";

type InteractionLog = {
  _id?: string;
  user_id: number | null;
  firm_id: string | null;
  email: string | null;
  method: string;
  path: string;
  status_code: number;
  ip: string;
  created_at: string;
  severity?: string;
  service?: string;
  module?: string;
};

const methodToVerb = (method: string): string => {
  switch (String(method || "").toUpperCase()) {
    case "GET":
      return "Viewed";
    case "POST":
      return "Created";
    case "PUT":
    case "PATCH":
      return "Updated";
    case "DELETE":
      return "Deleted";
    default:
      return "Interacted with";
  }
};

const objectFromPath = (path: string): string => {
  const normalized = String(path || "").toLowerCase();

  if (normalized.includes("encrypted-documents")) return "encrypted document";
  if (normalized.includes("cases")) return "case";
  if (normalized.includes("users") || normalized.includes("lawyers") || normalized.includes("clients") || normalized.includes("admins")) return "user profile";
  if (normalized.includes("files") || normalized.includes("upload") || normalized.includes("download") || normalized.includes("delete")) return "file";
  if (normalized.includes("login") || normalized.includes("logout") || normalized.includes("password") || normalized.includes("otp")) return "authentication";

  return "record";
};

const getInteractionLabel = (log: InteractionLog): string => {
  const verb = methodToVerb(log.method);
  const objectName = objectFromPath(log.path);
  return `${verb} ${objectName}`;
};

type SeverityLevel =
  | "DEBUG"
  | "INFO"
  | "NOTICE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "SECURITY"
  | "AUDIT";

const deriveFallbackSeverity = (log: InteractionLog): SeverityLevel => {
  const statusCode = Number(log.status_code || 0);
  const method = String(log.method || "").toUpperCase();
  const path = String(log.path || "").toLowerCase();
  const isAuthPath =
    path.includes("login") ||
    path.includes("logout") ||
    path.includes("password") ||
    path.includes("otp") ||
    path.includes("reset") ||
    path.includes("auth");
  const isAuditPath =
    path.includes("case") ||
    path.includes("invoice") ||
    path.includes("meeting") ||
    path.includes("document") ||
    path.includes("encrypted-documents") ||
    path.includes("user") ||
    path.includes("lawyer") ||
    path.includes("client") ||
    path.includes("admin");

  if (statusCode >= 200 && statusCode < 300 && ["POST", "PUT", "PATCH", "DELETE"].includes(method) && isAuditPath) {
    return "AUDIT";
  }

  if (statusCode >= 100 && statusCode <= 103) return "INFO";

  if (statusCode === 200 || statusCode === 204) return "INFO";
  if (statusCode === 201 || statusCode === 202) return "NOTICE";
  if (statusCode === 301 || statusCode === 302) return "LOW";
  if (statusCode === 304) return "INFO";
  if (statusCode === 400) return "LOW";
  if (statusCode === 401) return isAuthPath ? "SECURITY" : "MEDIUM";
  if (statusCode === 403) return isAuthPath ? "SECURITY" : "HIGH";
  if (statusCode === 404) return "LOW";
  if (statusCode === 405) return isAuthPath ? "SECURITY" : "MEDIUM";
  if (statusCode === 406) return "LOW";
  if ([408, 409, 413, 415, 422].includes(statusCode)) return "MEDIUM";
  if (statusCode === 410) return "LOW";
  if (statusCode === 429) return "SECURITY";
  if (statusCode === 500) return "HIGH";
  if (statusCode === 501) return "MEDIUM";
  if ([502, 503, 504].includes(statusCode)) return "CRITICAL";

  if (statusCode >= 500) return "HIGH";
  if (statusCode >= 400) return "MEDIUM";
  if (statusCode >= 300) return "LOW";
  return "DEBUG";
};

const normalizeSeverity = (log: InteractionLog): SeverityLevel => {
  const raw = String(log.severity || "").trim().toUpperCase();
  const allowed: SeverityLevel[] = [
    "DEBUG",
    "INFO",
    "NOTICE",
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
    "SECURITY",
    "AUDIT",
  ];

  if (allowed.includes(raw as SeverityLevel)) {
    return raw as SeverityLevel;
  }

  return deriveFallbackSeverity(log);
};

const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return "-";
  }
};

const formatDateInputValue = (dateStr?: string): string => {
  if (!dateStr) return "";

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-CA");
  } catch {
    return "";
  }
};

const getStatusGroup = (statusCode: number): string => {
  const normalized = Number(statusCode || 0);
  if (normalized >= 500) return "5xx";
  if (normalized >= 400) return "4xx";
  if (normalized >= 300) return "3xx";
  if (normalized >= 200) return "2xx";
  if (normalized >= 100) return "1xx";
  return "other";
};

const formatDateOptionLabel = (dateValue: string): string => {
  if (!dateValue) return "";

  try {
    const date = new Date(`${dateValue}T00:00:00`);
    if (isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateValue;
  }
};

const AdminLogs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = (searchParams.get("search") || searchParams.get("q") || "").trim();
  const [pageSize, setPageSize] = useState(10);

  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [interactionFilter, setInteractionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ipFilter, setIpFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const urlSearch = (searchParams.get("search") || searchParams.get("q") || "").trim();
    setSearch(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, severityFilter, pageSize, interactionFilter, userFilter, statusFilter, ipFilter, dateFilter]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await axiosUser.get<{ data: InteractionLog[] }>(`/logs/interactions`);
        setLogs(res.data?.data ?? []);
      } catch (err: any) {
        const status = err?.response?.status;
        const message =
          status === 401 || status === 403
            ? "Unauthorized Access"
            : "Unable to load logs.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const interactionQuery = interactionFilter.trim().toLowerCase();
    const userQuery = userFilter.trim().toLowerCase();
    const ipQuery = ipFilter.trim().toLowerCase();
    const dateQuery = dateFilter.trim();
    
    let results = logs;

    // Filter by search query
    if (query) {
      results = results.filter((log) => {
        const haystack = [
          log.method,
          log.path,
          String(log.status_code),
          log.email || "",
          log.firm_id || "",
          log.ip || "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      });
    }

    // Filter by severity
    if (severityFilter !== "all") {
      results = results.filter((log) => normalizeSeverity(log) === severityFilter);
    }

    if (interactionQuery) {
      results = results.filter((log) => getInteractionLabel(log).toLowerCase().includes(interactionQuery));
    }

    if (userQuery) {
      results = results.filter((log) => {
        const userLabel = [log.email || "", log.user_id ? `User #${log.user_id}` : "", log.firm_id || ""]
          .join(" ")
          .toLowerCase();

        return userLabel.includes(userQuery);
      });
    }

    if (statusFilter !== "all") {
      results = results.filter((log) => getStatusGroup(log.status_code) === statusFilter);
    }

    if (ipQuery) {
      results = results.filter((log) => String(log.ip || "").toLowerCase().includes(ipQuery));
    }

    if (dateQuery) {
      results = results.filter((log) => formatDateInputValue(log.created_at) === dateQuery);
    }

    return results;
  }, [logs, search, severityFilter, interactionFilter, userFilter, statusFilter, ipFilter, dateFilter]);

  const interactionOptions = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map((log) => getInteractionLabel(log).trim())
          .filter((value) => value !== "")
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const userOptions = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map((log) => [log.email || "", log.user_id ? `User #${log.user_id}` : "", log.firm_id ? `(${log.firm_id})` : ""]
            .filter(Boolean)
            .join(" ")
            .trim())
          .filter((value) => value !== "")
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const ipOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => String(log.ip || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const dateOptions = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map((log) => formatDateInputValue(log.created_at))
          .filter((value) => value !== "")
      )
    ).sort((a, b) => b.localeCompare(a));
  }, [logs]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const visibleLogs = filteredLogs.slice(pageStartIndex, pageStartIndex + pageSize);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const pageWindowStart = Math.max(1, safeCurrentPage - 2);
  const pageWindowEnd = Math.min(totalPages, pageWindowStart + 4);
  const pageItems = [] as number[];
  for (let page = pageWindowStart; page <= pageWindowEnd; page += 1) {
    pageItems.push(page);
  }

  return (
    <>
      <NavBarAdmin />

      <div className="admin-logs-page">
        <div className="admin-logs-header">
          <h2>System Logs</h2>
          <div className="admin-logs-controls">
            <input
              type="text"
              className="admin-logs-search"
              placeholder="Search by user, interaction, or IP"
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                const trimmed = value.trim();
                if (trimmed) {
                  setSearchParams({ search: trimmed });
                } else {
                  setSearchParams({});
                }
              }}
            />
            <select
              className="admin-logs-filter"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as SeverityLevel | "all")}
            >
              <option value="all">All Severity Levels</option>
              <option value="DEBUG">🟣 Debug</option>
              <option value="INFO">🔵 Info</option>
              <option value="NOTICE">🟢 Notice</option>
              <option value="LOW">🟩 Low</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HIGH">🟠 High</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="SECURITY">🚨 Security</option>
              <option value="AUDIT">🧾 Audit</option>
            </select>
            <select
              className="admin-logs-filter"
              value={interactionFilter}
              onChange={(e) => setInteractionFilter(e.target.value)}
            >
              <option value="">All Interactions</option>
              {interactionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="admin-logs-filter"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="">All Users</option>
              {userOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="admin-logs-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status Groups</option>
              <option value="2xx">2xx Success</option>
              <option value="3xx">3xx Redirect</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>
            <select
              className="admin-logs-filter"
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
            >
              <option value="">All IPs</option>
              {ipOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="admin-logs-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
            >
              <option value="">All Dates</option>
              {dateOptions.map((option) => (
                <option key={option} value={option}>
                  {formatDateOptionLabel(option)}
                </option>
              ))}
            </select>
            <select
              className="admin-logs-page-size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) || 10)}
              aria-label="Rows per page"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={300}>300 per page</option>
              <option value={500}>500 per page</option>
              <option value={1000}>1000 per page</option>
            </select>
          </div>
        </div>

        {loading && <p className="admin-logs-info">Loading logs...</p>}
        {error && <p className="admin-logs-error">{error}</p>}

        {!loading && !error && (
          <div className="admin-logs-table-wrap">
            <table className="admin-logs-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>User</th>
                  <th>Interaction</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {visibleLogs.map((log, index) => {
                  const severity = normalizeSeverity(log);
                  const severityKey = severity.toLowerCase();
                  const severityEmoji = {
                    debug: "🟣",
                    info: "🔵",
                    notice: "🟢",
                    low: "🟩",
                    medium: "🟡",
                    high: "🟠",
                    critical: "🔴",
                    security: "🚨",
                    audit: "🧾",
                  };
                  return (
                    <tr key={`${log._id || log.path}-${index}`} className={`severity-${severityKey}`}>
                      <td data-label="Severity">
                        <span className={`severity-badge severity-${severityKey}`}>
                          {severityEmoji[severityKey as keyof typeof severityEmoji]} {severity}
                        </span>
                      </td>
                      <td data-label="User">
                        {log.email || `User #${log.user_id ?? "-"}`}
                        {log.firm_id ? ` (${log.firm_id})` : ""}
                      </td>
                      <td data-label="Interaction">{getInteractionLabel(log)}</td>
                      <td data-label="Status">
                        <span className={`status-code status-${Math.floor(log.status_code / 100)}xx`}>
                          {log.status_code}
                        </span>
                      </td>
                      <td data-label="Date & Time">{formatDateTime(log.created_at)}</td>
                      <td data-label="IP">{log.ip || "-"}</td>
                    </tr>
                  );
                })}

                {visibleLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-logs-empty">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filteredLogs.length > pageSize && (
          <div className="admin-logs-pagination-area">
            <div className="admin-logs-pagination-summary">
              Showing {pageStartIndex + 1}-{Math.min(pageStartIndex + pageSize, filteredLogs.length)} of {filteredLogs.length} logs
            </div>

            <Pagination className="admin-logs-pagination">
              <Pagination.First onClick={() => setCurrentPage(1)} disabled={safeCurrentPage === 1} />
              <Pagination.Prev onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1} />

              {pageItems[0] > 1 && (
                <>
                  <Pagination.Item onClick={() => setCurrentPage(1)}>1</Pagination.Item>
                  {pageItems[0] > 2 && <Pagination.Ellipsis disabled />}
                </>
              )}

              {pageItems.map((page) => (
                <Pagination.Item key={page} active={page === safeCurrentPage} onClick={() => setCurrentPage(page)}>
                  {page}
                </Pagination.Item>
              ))}

              {pageItems[pageItems.length - 1] < totalPages && (
                <>
                  {pageItems[pageItems.length - 1] < totalPages - 1 && <Pagination.Ellipsis disabled />}
                  <Pagination.Item onClick={() => setCurrentPage(totalPages)}>{totalPages}</Pagination.Item>
                </>
              )}

              <Pagination.Next onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages} />
              <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage === totalPages} />
            </Pagination>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminLogs;
