import * as React from "react";
import axios from "axios"; // ✅ add axios
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { TableVirtuoso, TableComponents } from "react-virtuoso";
import { colors } from "../../../../../../constant/color";
import { useAuth } from "../../../../../../context/AuthContext";
import AppRoutes from "../../../../../../routes/AppRouter";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";

interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Client" | "Lawyer";
  status: "Active" | "Inactive";
}

export default function UserTable() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const roleRoutes = AppRoutes(role);

  const [users, setUsers] = React.useState<User[]>([]);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    axios.get<User[]>(`${process.env.REACT_APP_API_URL}/users`) // fetch users from Laravel
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleManageClick = (user: User) => {
    if (role !== "admin") return;
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleNavigate = () => {
    if (!selectedUser) return;
    const targetPath =
      roleRoutes.find((r: any) => r.name === "ManageUser")?.path ||
      "/admin/billing";
    navigate(targetPath, { state: { user: selectedUser } });
    setShowModal(false);
  };

  const handleRegisterUser = () => {
    const registerPath =
      roleRoutes.find((r: any) => r.name === "RegisterUser")?.path ||
      "/admin/manage_user/register";
    navigate(registerPath);
  };

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
    { label: "Action", dataKey: "action", width: 150 },
  ];

  return (
    <>
      <Paper style={{ height: 500, width: "100%" }}>
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
              <TableCell
                style={{ color: row.status === "Active" ? "green" : "red" }}
              >
                {row.status}
              </TableCell>
              <TableCell>
                {role === "admin" ? (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleManageClick(row)}
                  >
                    Manage
                  </button>
                ) : (
                  <button className="btn btn-sm btn-secondary" disabled title="Admins only">
                    Manage
                  </button>
                )}
              </TableCell>
            </>
          )}
        />
      </Paper>

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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.green3 }}>
          <Modal.Title className="text-white">Manage User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser ? (
            <div>
              <p><strong>ID:</strong> {selectedUser.id}</p>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span style={{ color: selectedUser.status === "Active" ? "green" : "red" }}>
                  {selectedUser.status}
                </span>
              </p>
            </div>
          ) : (
            <p>No user selected.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleNavigate}>
            Go to Manage Page
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}