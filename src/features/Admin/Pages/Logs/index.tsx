import React, { useEffect, useMemo, useState } from "react";
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

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await axiosUser.get<{ data: InteractionLog[] }>(
          `${process.env.REACT_APP_API_URL}/logs/interactions?limit=300`
        );
        setLogs(res.data?.data ?? []);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "Failed to load logs";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) => {
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
  }, [logs, search]);

  return (
    <>
      <NavBarAdmin />

      <div className="admin-logs-page">
        <div className="admin-logs-header">
          <h2>API Interaction Logs</h2>
          <input
            type="text"
            className="admin-logs-search"
            placeholder="Search by user, interaction, or IP"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="admin-logs-info">Loading logs...</p>}
        {error && <p className="admin-logs-error">{error}</p>}

        {!loading && !error && (
          <div className="admin-logs-table-wrap">
            <table className="admin-logs-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Interaction</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={`${log._id || log.path}-${index}`}>
                    <td>
                      {log.email || `User #${log.user_id ?? "-"}`}
                      {log.firm_id ? ` (${log.firm_id})` : ""}
                    </td>
                    <td>{getInteractionLabel(log)}</td>
                    <td>{log.ip || "-"}</td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="admin-logs-empty">
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
