import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import Button from "react-bootstrap/Button";
import axiosUser from "../../../../api/axiosUser";
import PATH from "../../../../constant/paths";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import "./search.css";

type UserRecord = {
  id: number;
  firmID?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
};

type CaseRecord = {
  id: number;
  caseNumber?: string;
  caseName?: string;
  caseType?: string;
  clientName?: string;
  lawyerName?: string;
  clientFirmID?: string;
  lawyerFirmID?: string;
  status?: string;
  created_at?: string;
};

type InteractionLog = {
  _id?: string;
  method?: string;
  path?: string;
  status_code?: number;
  created_at?: string;
  email?: string | null;
};

const normalize = (value: unknown): string => String(value ?? "").trim().toLowerCase();

const containsQuery = (value: unknown, query: string): boolean => {
  if (!query) return false;
  return normalize(value).includes(query);
};

const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return "-";
  return `${dateValue.toLocaleDateString()} ${dateValue.toLocaleTimeString()}`;
};

const AdminSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = (searchParams.get("q") || "").trim();
  const queryNormalized = normalize(query);

  const [searchInput, setSearchInput] = React.useState(query);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const [allUsers, setAllUsers] = React.useState<UserRecord[]>([]);
  const [allCases, setAllCases] = React.useState<CaseRecord[]>([]);
  const [allLogs, setAllLogs] = React.useState<InteractionLog[]>([]);

  React.useEffect(() => {
    setSearchInput(query);
  }, [query]);

  React.useEffect(() => {
    const fetchAllData = async () => {
      if (!queryNormalized) {
        setAllUsers([]);
        setAllCases([]);
        setAllLogs([]);
        setErrorMessage("");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const [usersRes, casesRes, logsRes] = await Promise.all([
          axiosUser.get(`/users`),
          axiosUser.get(`/cases`),
          axiosUser.get(`/logs/interactions?limit=120`),
        ]);

        const usersData = Array.isArray(usersRes.data)
          ? usersRes.data
          : Array.isArray(usersRes.data?.data)
          ? usersRes.data.data
          : [];

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

        setAllUsers(usersData);
        setAllCases(casesData);
        setAllLogs(logsData);
      } catch (error) {
        console.error("Admin global search failed", error);
        setErrorMessage("Unable to load search results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [queryNormalized]);

  const matchedUsers = React.useMemo(() => {
    if (!queryNormalized) return [];
    return allUsers.filter((user) => {
      return [user.name, user.email, user.firmID, user.role, user.status].some((field) => containsQuery(field, queryNormalized));
    });
  }, [allUsers, queryNormalized]);

  const matchedCases = React.useMemo(() => {
    if (!queryNormalized) return [];

    const userTokens = new Set<string>();
    matchedUsers.forEach((user) => {
      const nameToken = normalize(user.name);
      const firmToken = normalize(user.firmID);
      if (nameToken) userTokens.add(nameToken);
      if (firmToken) userTokens.add(firmToken);
    });

    return allCases.filter((item) => {
      const directMatch = [
        item.caseName,
        item.caseNumber,
        item.caseType,
        item.status,
        item.clientName,
        item.lawyerName,
        item.clientFirmID,
        item.lawyerFirmID,
      ].some((field) => containsQuery(field, queryNormalized));

      if (directMatch) return true;

      const clientName = normalize(item.clientName);
      const lawyerName = normalize(item.lawyerName);
      const clientFirmId = normalize(item.clientFirmID);
      const lawyerFirmId = normalize(item.lawyerFirmID);

      return Array.from(userTokens).some(
        (token) => token && [clientName, lawyerName, clientFirmId, lawyerFirmId].some((field) => field.includes(token))
      );
    });
  }, [allCases, matchedUsers, queryNormalized]);

  const matchedLogs = React.useMemo(() => {
    if (!queryNormalized) return [];
    return allLogs.filter((log) => {
      return [log.email, log.path, log.method, String(log.status_code || "")].some((field) => containsQuery(field, queryNormalized));
    });
  }, [allLogs, queryNormalized]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: trimmed });
  };

  return (
    <>
      <NavBarAdmin />
      <div className="admin-search-page">
        <div className="admin-search-head">
          <p className="admin-search-kicker">ADMIN</p>
          <h2>Global Search</h2>
          <p className="admin-search-subtitle">Find users, related cases, and system activities in one place.</p>
        </div>

        <form className="admin-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, email, firm ID, case number, case name..."
            aria-label="Admin global search"
          />
          <Button type="submit">Search</Button>
        </form>

        {query ? (
          <p className="admin-search-query-label">
            Showing results for: <strong>{query}</strong>
          </p>
        ) : (
          <p className="admin-search-query-label">Enter a keyword to start searching.</p>
        )}

        {loading && (
          <div className="admin-search-loading">
            <Spinner animation="border" size="sm" />
            <span>Searching...</span>
          </div>
        )}

        {errorMessage && <p className="admin-search-error">{errorMessage}</p>}

        {!loading && queryNormalized && !errorMessage && (
          <>
            <section className="admin-search-summary-grid">
              <article>
                <h4>Users</h4>
                <strong>{matchedUsers.length}</strong>
              </article>
              <article>
                <h4>Cases</h4>
                <strong>{matchedCases.length}</strong>
              </article>
              <article>
                <h4>Activities</h4>
                <strong>{matchedLogs.length}</strong>
              </article>
            </section>

            <section className="admin-search-results-grid">
              <article className="admin-search-panel">
                <div className="admin-search-panel-head">
                  <h3>Users</h3>
                  <Button size="sm" variant="outline-secondary" onClick={() => navigate(`${PATH.ADMIN.MANAGE_USER}?search=${encodeURIComponent(query)}`)}>
                    Open User List
                  </Button>
                </div>
                <ul>
                  {matchedUsers.length === 0 && <li className="empty">No matching users.</li>}
                  {matchedUsers.slice(0, 12).map((user) => (
                    <li key={user.id}>
                      <strong>{user.name || "-"}</strong>
                      <p>{user.email || "-"}</p>
                      <span>{user.firmID || "-"} • {user.role || "-"} • {user.status || "-"}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="admin-search-panel">
                <div className="admin-search-panel-head">
                  <h3>Cases</h3>
                  <Button size="sm" variant="outline-secondary" onClick={() => navigate(`${PATH.ADMIN.MANAGE_CASE}?search=${encodeURIComponent(query)}`)}>
                    Open Case List
                  </Button>
                </div>
                <ul>
                  {matchedCases.length === 0 && <li className="empty">No matching cases.</li>}
                  {matchedCases.slice(0, 12).map((item) => (
                    <li key={item.id}>
                      <strong>{item.caseName || item.caseNumber || `CASE-${item.id}`}</strong>
                      <p>{item.clientName || "-"} vs {item.lawyerName || "-"}</p>
                      <span>{item.caseType || "-"} • {item.status || "-"}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="admin-search-panel">
                <div className="admin-search-panel-head">
                  <h3>Activities</h3>
                  <Button size="sm" variant="outline-secondary" onClick={() => navigate(`${PATH.ADMIN.LOGS}?search=${encodeURIComponent(query)}`)}>
                    Open Logs
                  </Button>
                </div>
                <ul>
                  {matchedLogs.length === 0 && <li className="empty">No matching activities.</li>}
                  {matchedLogs.slice(0, 12).map((log, index) => (
                    <li key={log._id || `${log.created_at || "log"}-${index}`}>
                      <strong>{(log.method || "GET").toUpperCase()} {log.path || "-"}</strong>
                      <p>{log.email || "Unknown actor"}</p>
                      <span>Status {log.status_code || "-"} • {formatDateTime(log.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </section>
          </>
        )}
      </div>
    </>
  );
};

export default AdminSearch;
