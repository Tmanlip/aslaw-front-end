// src/components/UserTable.tsx
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
import { colors } from "../../../../../../constant/color";
import PATH from "../../../../../../constant/paths";
import { useAuth } from "../../../../../../context/AuthContext";
import AppRoutes from "../../../../../../routes/AppRouter";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { useClientData } from "../../../../../../context/ClientDataContext";
import AssignCase from "../../../Manage Case/Display Case/Assign Case";

interface User {
  id: number;
  firmID: string;
  name: string;
  email: string;
  role: "admin" | "client" | "lawyer";
  status: "Active" | "Inactive";
  caseId?: number | null;
}

interface CaseRecord {
  id: number;
  clientName?: string;
  clientFirmID?: string;
}

export default function UserTable() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const roleRoutes = AppRoutes(role);
  const { setUserData } = useClientData();

  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);

  const [showModal, setShowModal] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const [showOffcanvas, setShowOffcanvas] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseRecord | null>(null);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosUser.get<User[]>(`${process.env.REACT_APP_API_URL}/users`);
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  /* ================= LIVE UPDATE WHEN CASE IS ASSIGNED ================= */
  const handleCaseAssigned = (clientId: number, newCaseId: number) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === clientId ? { ...user, caseId: newCaseId } : user
      )
    );
  };

  /* ================= ACTION HANDLERS ================= */
  const handleManageClick = (user: User) => {
    if (role !== "admin") return;
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDirectManageUser = async (user: User) => {
    setSelectedUser(user);
    try {
      const res = await axiosUser.get(`${process.env.REACT_APP_API_URL}/clients/${user.firmID}`);
      const { client, cases } = res.data;
      setUserData(client, cases);
      navigate(
        roleRoutes.find((r: any) => r.path === PATH.ADMIN.MANAGE_PROFILE)?.path ||
        PATH.ADMIN.MANAGE_PROFILE
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.role === "client") {
        const res = await axiosUser.get(`${process.env.REACT_APP_API_URL}/clients/${selectedUser.firmID}`);
        const { client, cases } = res.data;
        setUserData(client, cases);
        navigate(
          roleRoutes.find((r: any) => r.path === PATH.ADMIN.BILLING)?.path || PATH.ADMIN.BILLING
        );
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
    }
  };

  const handleRegisterUser = () => {
    const registerPath =
      roleRoutes.find((r: any) => r.path === PATH.ADMIN.REGISTER_USER)?.path ||
      PATH.ADMIN.REGISTER_USER;
    navigate(registerPath);
  };

  /* ================= VIRTUOSO TABLE ================= */
  const VirtuosoTableComponents: TableComponents<User> = {
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
    { label: "ID", dataKey: "id", width: 70 },
    { label: "Name", dataKey: "name", width: 200 },
    { label: "Email", dataKey: "email", width: 250 },
    { label: "Role", dataKey: "role", width: 120 },
    { label: "Status", dataKey: "status", width: 120 },
    { label: "Action", dataKey: "action", width: 200 },
  ];

  if (loadingUsers) {
    return (
      <Box height={500} display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper style={{ height: "min(62vh, 560px)", width: "max-content", minWidth: "100%" }}>
        <TableVirtuoso
          data={users}
          components={VirtuosoTableComponents}
          fixedHeaderContent={() => (
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.dataKey}
                  variant="head"
                  style={{
                    width: column.width,
                    backgroundColor: colors.green3,
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
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.role}</TableCell>
              <TableCell style={{ color: row.status === "Active" ? "green" : "red" }}>
                {row.status}
              </TableCell>
              <TableCell>
                {row.role === "client" ? (
                  row.caseId ? (
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={role !== "admin"}
                      onClick={() => handleManageClick(row)}
                    >
                      Manage User
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-success"
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
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={role !== "admin"}
                        onClick={() => handleDirectManageUser(row)}
                      >
                        Manage User
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={role !== "admin"}
                    onClick={() => handleManageClick(row)}
                  >
                    Manage User
                  </button>
                )}
              </TableCell>
            </>
          )}
        />
      </Paper>

      {/* ================= REGISTER BUTTON ================= */}
      {role === "admin" && (
        <div className="d-flex justify-content-center mt-3 mb-2">
          <Button
            variant="success"
            onClick={handleRegisterUser}
            style={{
              backgroundColor: colors.green3,
              borderColor: colors.green3,
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: "8px",
            }}
          >
            + Register New User
          </Button>
        </div>
      )}

      {/* ================= MODAL ================= */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.green3 }}>
          <Modal.Title className="text-white">Manage User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p><strong>ID:</strong> {selectedUser.id}</p>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleNavigate}>
            Go to Manage User
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= ASSIGN CASE OFFCANVAS ================= */}
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