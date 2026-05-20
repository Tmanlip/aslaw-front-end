import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

const AdminLogs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = (searchParams.get("search") || searchParams.get("q") || "").trim();

  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "all">("all");

  useEffect(() => {
    const urlSearch = (searchParams.get("search") || searchParams.get("q") || "").trim();
    setSearch(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await axiosUser.get<{ data: InteractionLog[] }>(
          `${process.env.REACT_APP_API_URL}/logs/interactions?limit=300`
        );
        setLogs(res.data?.data ?? []);
      } catch (err: any) {
        const status = err?.response?.status;
        const message =
          status === 401 || status === 403
            ? "Unauthorized Access"
            : err?.response?.data?.message || err?.message || "Failed to load logs";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    
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

    return results;
  }, [logs, search, severityFilter]);

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
                {filteredLogs.map((log, index) => {
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

                {filteredLogs.length === 0 && (
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
      </div>
    </>
  );
};

export default AdminLogs;
