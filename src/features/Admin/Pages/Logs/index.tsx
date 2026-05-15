import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import { useAuth } from "../../../../context/AuthContext";
import PATH from "../../../../constant/paths";
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

type SeverityLevel = "critical" | "high" | "medium" | "low";

const getSeverity = (log: InteractionLog): SeverityLevel => {
  const statusCode = Number(log.status_code || 0);
  const method = String(log.method || "").toUpperCase();
  const path = String(log.path || "").toLowerCase();

  // Critical: Server errors (5xx) or DELETE operations
  if (statusCode >= 500 || method === "DELETE") {
    return "critical";
  }

  // High: Client errors (4xx), user registration, password changes
  if (statusCode >= 400 || (method === "POST" && (path.includes("register") || path.includes("users"))) || 
      path.includes("password") || path.includes("otp") || path.includes("reset")) {
    return "high";
  }

  // Medium: PUT/PATCH operations (updates)
  if (method === "PUT" || method === "PATCH") {
    return "medium";
  }

  // Low: GET operations (views)
  return "low";
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
  const { role } = useAuth();
  const navigate = useNavigate();
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
      results = results.filter((log) => getSeverity(log) === severityFilter);
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
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
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
                  const severity = getSeverity(log);
                  const severityEmoji = {
                    critical: "🔴",
                    high: "🟠",
                    medium: "🟡",
                    low: "🟢",
                  };
                  return (
                    <tr key={`${log._id || log.path}-${index}`} className={`severity-${severity}`}>
                      <td data-label="Severity">
                        <span className={`severity-badge severity-${severity}`}>
                          {severityEmoji[severity]} {severity.charAt(0).toUpperCase() + severity.slice(1)}
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
