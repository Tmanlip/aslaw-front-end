// src/components/UserTable.tsx
import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { TableVirtuoso, TableComponents } from "react-virtuoso";
import Chance from "chance";
import { colors } from "../../../../../../constant/color";

const chance = new Chance();

type UserRole = "Admin" | "Client" | "Lawyer";
type UserStatus = "Active" | "Inactive";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

// Generate mock users
const generateUsers = (count: number): User[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: chance.name(),
    email: chance.email(),
    role: chance.pickone(["Admin", "Client", "Lawyer"]) as UserRole,
    status: chance.pickone(["Active", "Inactive"]) as UserStatus,
  }));

const users: User[] = generateUsers(50);

// Virtuoso Table components
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
  { label: "Status", dataKey: "status", width: 120 }, // ✅ New column
];

export default function UserTable() {
  return (
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
                  backgroundColor: colors.green3, // solid header background
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
          </>
        )}
      />
    </Paper>
  );
}
