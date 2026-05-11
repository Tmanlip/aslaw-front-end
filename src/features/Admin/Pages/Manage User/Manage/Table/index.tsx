import * as React from "react";
import axiosUser from "../../../../../../api/axiosUser";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { TableVirtuoso, TableComponents } from "react-virtuoso";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import PATH from "../../../../../../constant/paths";
import { useAuth } from "../../../../../../context/AuthContext";
import AppRoutes from "../../../../../../routes/AppRouter";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";
import { useClientData } from "../../../../../../context/ClientDataContext";
import AssignCase from "../../../Manage Case/Display Case/Assign Case";
import "../manageUser.css";

interface User {
  id: number;
  firmID: string;
  name: string;
  email: string;
  role: "admin" | "client" | "lawyer";
  status: "Active" | "Inactive" | "Archived";
  caseId?: number | null;
}

interface CaseRecord {
  id: number;
  clientName?: string;
  clientFirmID?: string;
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

export default function UserTable() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const roleRoutes = AppRoutes(role);
  const { setUserData } = useClientData();

  const [users, setUsers] = React.useState<User[]>([]);
  const [logs, setLogs] = React.useState<InteractionLog[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);

  const [showModal, setShowModal] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [loadingNavigate, setLoadingNavigate] = React.useState(false);

  const [showOffcanvas, setShowOffcanvas] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseRecord | null>(null);

  const [roleFilter, setRoleFilter] = React.useState<"all" | "admin" | "client" | "lawyer">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive" | "archived">("all");

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [usersRes, logsRes] = await Promise.all([
          axiosUser.get<User[]>(`${process.env.REACT_APP_API_URL}/users`),
          axiosUser.get(`${process.env.REACT_APP_API_URL}/logs/interactions?limit=60`),
        ]);

        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        const logData = Array.isArray(logsRes.data?.data)
          ? logsRes.data.data
          : Array.isArray(logsRes.data)
          ? logsRes.data
          : [];
        setLogs(logData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleCaseAssigned = (clientId: number, newCaseId: number) => {
    setUsers((prevUsers) =>
      prevUsers.map((item) => (item.id === clientId ? { ...item, caseId: newCaseId } : item))
    );
  };

  const handleManageClick = (item: User) => {
    if (role !== "admin") return;
    setSelectedUser(item);
    setShowModal(true);
  };

  const handleDirectManageUser = async (item: User) => {
    setSelectedUser(item);
    try {
      const res = await axiosUser.get(`${process.env.REACT_APP_API_URL}/clients/${item.firmID}`);
      const { client, cases } = res.data;
      setUserData(client, cases);
      navigate(
        roleRoutes.find((r: any) => r.path === PATH.ADMIN.MANAGE_PROFILE)?.path || PATH.ADMIN.MANAGE_PROFILE
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = async () => {
    if (!selectedUser) return;

    setLoadingNavigate(true);

    try {
      if (selectedUser.role === "client") {
        const res = await axiosUser.get(`${process.env.REACT_APP_API_URL}/clients/${selectedUser.firmID}`);
        const { client, cases } = res.data;
        setUserData(client, cases);
        navigate(roleRoutes.find((r: any) => r.path === PATH.ADMIN.BILLING)?.path || PATH.ADMIN.BILLING);
      }

      if (selectedUser.role === "lawyer") {
        const res = await axiosUser.get(`${process.env.REACT_APP_API_URL}/lawyers/${selectedUser.firmID}`);
        const { lawyer, cases } = res.data;
        setUserData(lawyer, cases);
        navigate(
          roleRoutes.find((r: any) => r.path === PATH.ADMIN.LAWYER_BILLING)?.path || PATH.ADMIN.LAWYER_BILLING
        );
      }

      if (selectedUser.role === "admin") {
        const res = await axiosUser.get(`${process.env.REACT_APP_API_URL}/admins/${selectedUser.firmID}`);
        const { admin, cases } = res.data;
        setUserData(admin, cases || []);
        navigate(
          roleRoutes.find((r: any) => r.path === PATH.ADMIN.MANAGE_PROFILE)?.path || PATH.ADMIN.MANAGE_PROFILE
        );
      }

      setShowModal(false);
    } catch (error) {
      console.error("Failed to fetch user data", error);
    } finally {
      setLoadingNavigate(false);
    }
  };

  const handleRegisterUser = () => {
    const registerPath =
      roleRoutes.find((r: any) => r.path === PATH.ADMIN.REGISTER_USER)?.path || PATH.ADMIN.REGISTER_USER;
    navigate(registerPath);
  };

  const VirtuosoTableComponents: TableComponents<User> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => <TableContainer component={Paper} {...props} ref={ref} />),
    Table: (props) => <Table {...props} sx={{ borderCollapse: "separate", tableLayout: "fixed" }} />,
    TableHead,
    TableRow,
    TableBody,
  };

  const columns = [
    { label: "Firm ID", dataKey: "firmID", width: 110 },
    { label: "Name", dataKey: "name", width: 200 },
    { label: "Email", dataKey: "email", width: 250 },
    { label: "Role", dataKey: "role", width: 120 },
    { label: "Status", dataKey: "status", width: 120 },
    { label: "Action", dataKey: "action", width: 200 },
  ];

  const totalUsers = users.length;
  const activeUsers = users.filter((item) => String(item.status || "").toLowerCase() === "active").length;
  const inactiveUsers = users.filter((item) => String(item.status || "").toLowerCase() !== "active").length;
  const adminUsers = users.filter((item) => item.role === "admin").length;
  const clientUsers = users.filter((item) => item.role === "client").length;
  const lawyerUsers = users.filter((item) => item.role === "lawyer").length;

  const roleDonutData = [
    { name: "Admins", value: adminUsers, color: "#0ea5e9" },
    { name: "Clients", value: clientUsers, color: "#ffd700" },
    { name: "Lawyers", value: lawyerUsers, color: "#34d399" },
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

  const toDisplayName = (email?: string | null): string => {
    if (!email) return "User";
    const base = email.split("@")[0].replace(/[._-]+/g, " ").trim();
    if (!base) return "User";
    return base
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const isUserRelatedLog = (log: InteractionLog): boolean => {
    const path = String(log.path || "").toLowerCase();
    return ["users", "clients", "lawyers", "admins", "register", "profile", "password", "reset", "login", "logout", "otp"].some((key) =>
      path.includes(key)
    );
  };

  const toRecentActivity = (log: InteractionLog, index: number): ActivityItem => {
    const path = String(log.path || "").toLowerCase();
    const method = String(log.method || "GET").toUpperCase();
    const name = toDisplayName(log.email);

    if (path.includes("login")) {
      return {
        id: String(log._id || `recent-${index}`),
        title: `${name} logged in`,
        detail: "User logged in from web client",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (path.includes("logout")) {
      return {
        id: String(log._id || `recent-${index}`),
        title: `${name} logged out`,
        detail: "User logged out from all devices",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (path.includes("password") || path.includes("reset") || path.includes("otp")) {
      return {
        id: String(log._id || `recent-${index}`),
        title: `${name} changed password`,
        detail: "Password changed for security reasons",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (method === "POST" && (path.includes("register") || path.includes("users"))) {
      return {
        id: String(log._id || `recent-${index}`),
        title: `${name} created account`,
        detail: "New user account created and activated",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (method === "PUT" || method === "PATCH" || path.includes("profile")) {
      return {
        id: String(log._id || `recent-${index}`),
        title: `${name} updated profile`,
        detail: "Updated contact information and preferences",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    return {
      id: String(log._id || `recent-${index}`),
      title: `${name} updated user information`,
      detail: "User record activity detected",
      timeLabel: formatRelativeTime(log.created_at),
    };
  };

  const toSystemActivity = (log: InteractionLog, index: number): ActivityItem => {
    const path = String(log.path || "").toLowerCase();
    const method = String(log.method || "GET").toUpperCase();
    const statusCode = Number(log.status_code || 0);

    if (statusCode >= 500) {
      return {
        id: String(log._id || `system-${index}`),
        title: "System Alert",
        detail: "User-management request failed and needs review",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (method === "POST" && (path.includes("register") || path.includes("users"))) {
      return {
        id: String(log._id || `system-${index}`),
        title: "User Registration Alert",
        detail: "New user registrations require approval",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (path.includes("password") || path.includes("reset") || path.includes("otp")) {
      return {
        id: String(log._id || `system-${index}`),
        title: "Security Notice",
        detail: "Password-related account activity recorded",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    if (method === "PUT" || method === "PATCH" || path.includes("profile")) {
      return {
        id: String(log._id || `system-${index}`),
        title: "Profile Update Notice",
        detail: "User profile and account details were modified",
        timeLabel: formatRelativeTime(log.created_at),
      };
    }

    return {
      id: String(log._id || `system-${index}`),
      title: "Authentication Activity",
      detail: "User authentication event recorded successfully",
      timeLabel: formatRelativeTime(log.created_at),
    };
  };

  const sortedLogs = [...logs].sort((a, b) => {
    const first = new Date(a.created_at || 0).getTime();
    const second = new Date(b.created_at || 0).getTime();
    return second - first;
  });

  const userLogs = sortedLogs.filter(isUserRelatedLog);
  const recentActivities = userLogs.slice(0, 5).map(toRecentActivity);
  const systemActivities = userLogs.slice(0, 5).map(toSystemActivity);

  const filteredUsers = users.filter((item) => {
    const roleMatches = roleFilter === "all" || item.role === roleFilter;
    const status = String(item.status || "").toLowerCase();
    const statusMatches = statusFilter === "all" || status === statusFilter;
    return roleMatches && statusMatches;
  });

  if (loadingUsers) {
    return (
      <Box height={500} display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <section className="admin-users-top-grid">
        <div className="admin-users-metrics-cluster">
          <article className="admin-table-analytics-card admin-table-analytics-card--total">
            <h4>Total Users</h4>
            <strong>{totalUsers}</strong>
            <span>All registered accounts</span>
          </article>
          <article className="admin-table-analytics-card admin-table-analytics-card--compact">
            <h4>Active Users</h4>
            <strong>{activeUsers}</strong>
            <span>{totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0}% of total users</span>
          </article>
          <article className="admin-table-analytics-card admin-table-analytics-card--compact">
            <h4>Inactive Users</h4>
            <strong>{inactiveUsers}</strong>
            <span>{totalUsers ? Math.round((inactiveUsers / totalUsers) * 100) : 0}% of total users</span>
          </article>
        </div>

        <article className="admin-table-analytics-panel admin-users-distribution-panel">
          <h4>User Distribution</h4>
          <div className="admin-table-donut-wrap">
            <ResponsiveContainer width="100%" height={188}>
              <PieChart>
                <Pie data={roleDonutData} dataKey="value" nameKey="name" outerRadius={68} paddingAngle={3}>
                  {roleDonutData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="admin-table-donut-legend">
              {roleDonutData.map((item) => (
                <div key={item.name}>
                  <span style={{ backgroundColor: item.color }} />
                  <p>{item.name}</p>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="admin-users-activity-grid">
        <article className="admin-table-analytics-panel">
          <h4>Recent Activity</h4>
          <ul className="admin-table-log-list">
            {recentActivities.length === 0 ? (
              <li className="admin-table-log-empty">No recent activity.</li>
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

        <article className="admin-table-analytics-panel">
          <h4>System Activities</h4>
          <ul className="admin-table-log-list">
            {systemActivities.length === 0 ? (
              <li className="admin-table-log-empty">No system activities.</li>
            ) : (
              systemActivities.map((item) => (
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
      </section>

      <section className="admin-table-filter-bar">
        <div className="admin-table-filter-item">
          <label htmlFor="admin-user-role-filter">Role</label>
          <select
            id="admin-user-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "client" | "lawyer")}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
            <option value="lawyer">Lawyer</option>
          </select>
        </div>

        <div className="admin-table-filter-item">
          <label htmlFor="admin-user-status-filter">Status</label>
          <select
            id="admin-user-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive" | "archived")}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <p className="admin-table-filter-result">Showing {filteredUsers.length} of {users.length} users</p>

        {role === "admin" && (
          <Button className="admin-register-btn" onClick={handleRegisterUser}>
            + Register New User
          </Button>
        )}
      </section>

      <Paper className="admin-table-shell" style={{ height: "min(62vh, 560px)", width: "100%", minWidth: 0 }}>
        <TableVirtuoso
          data={filteredUsers}
          components={VirtuosoTableComponents}
          fixedHeaderContent={() => (
            <TableRow>
              {columns.map((column) => (
                <TableCell className="admin-table-head-cell" key={column.dataKey} variant="head" style={{ width: column.width, fontWeight: 600 }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          )}
          itemContent={(_, row) => (
            <>
              <TableCell>{row.firmID}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.role}</TableCell>
              <TableCell>
                <span className={`admin-table-status-pill ${String(row.status).toLowerCase() === "active" ? "active" : String(row.status).toLowerCase() === "inactive" ? "inactive" : "archived"}`}>
                  {row.status}
                </span>
              </TableCell>
              <TableCell>
                {row.role === "client" ? (
                  row.caseId ? (
                    <button className="btn btn-sm admin-table-action-btn admin-primary-action" disabled={role !== "admin"} onClick={() => handleManageClick(row)}>
                      Manage User
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm admin-table-action-btn admin-secondary-action"
                        disabled={role !== "admin"}
                        onClick={() => {
                          const caseRecord: CaseRecord = {
                            id: row.id,
                            clientName: row.name,
                            clientFirmID: row.firmID,
                          };
                          setSelectedCase(caseRecord);
                          setShowOffcanvas(true);
                        }}
                      >
                        Assign Case
                      </button>
                      <button className="btn btn-sm admin-table-action-btn admin-primary-action" disabled={role !== "admin"} onClick={() => handleDirectManageUser(row)}>
                        Manage User
                      </button>
                    </div>
                  )
                ) : (
                  <button className="btn btn-sm admin-table-action-btn admin-primary-action" disabled={role !== "admin"} onClick={() => handleManageClick(row)}>
                    Manage User
                  </button>
                )}
              </TableCell>
            </>
          )}
        />
      </Paper>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Manage User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p><strong>Firm ID:</strong> {selectedUser.firmID}</p>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`admin-table-status-pill ${
                    String(selectedUser.status).toLowerCase() === "active"
                      ? "active"
                      : String(selectedUser.status).toLowerCase() === "inactive"
                      ? "inactive"
                      : "archived"
                  }`}
                >
                  {selectedUser.status}
                </span>
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loadingNavigate}>
            Close
          </Button>
          <Button variant="primary" onClick={handleNavigate} disabled={loadingNavigate}>
            {loadingNavigate ? (
              <>
                <Spinner size="sm" className="me-2" />
                Loading...
              </>
            ) : (
              "Go to Manage User"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {selectedCase && (
        <AssignCase
          show={showOffcanvas}
          handleClose={() => setShowOffcanvas(false)}
          selectedCase={selectedCase}
          onCaseAssigned={(newCaseId: number) => {
            handleCaseAssigned(selectedCase.id, newCaseId);
            setShowOffcanvas(false);
          }}
        />
      )}
    </>
  );
}
