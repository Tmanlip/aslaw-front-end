import * as React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { TableVirtuoso, TableComponents } from "react-virtuoso";
import Button from "react-bootstrap/Button";

import AssignCase from "../Assign Case";
import { colors } from "../../../../../../constant/color";
import { useAuth } from "../../../../../../context/AuthContext";

interface CaseRecord {
  id: number;
  clientName: string;
  lawyerName: string;
  caseName: string;
  status?: string;
}

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
  { label: "ID", dataKey: "id", width: 70 },
  { label: "Client Name", dataKey: "clientName", width: 200 },
  { label: "Lawyer Name", dataKey: "lawyerName", width: 200 },
  { label: "Case Name", dataKey: "caseName", width: 300 },
  { label: "Action", dataKey: "action", width: 200 },
];

export default function UserTable() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [cases, setCases] = React.useState<CaseRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [show, setShow] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseRecord | null>(null);

  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/cases");
        setCases(res.data);
      } catch (error) {
        console.error("Failed to fetch cases", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const handleShow = (row: CaseRecord) => {
    setSelectedCase(row);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setSelectedCase(null);
  };

  const handleManageCase = (row: CaseRecord) => {
    if (role !== "admin") {
      alert("Only admins can access this page.");
      return;
    }

    navigate("/admin/manage_case/edit_case", {
      state: {
        caseData: row,
        successMessage: `Now managing case: ${row.caseName}`,
      },
    });
  };

  if (loading) {
    return <p>Loading cases...</p>;
  }

  return (
    <>
      <Paper style={{ height: 500, width: "100%" }}>
        <TableVirtuoso
          data={cases}
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
                    fontWeight: "bold",
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
              <TableCell>{row.clientName}</TableCell>
              <TableCell>{row.lawyerName}</TableCell>
              <TableCell>{row.caseName}</TableCell>
              <TableCell>
                {!row.caseName && (
                  <Button size="sm" onClick={() => handleShow(row)}>
                    Add Case
                  </Button>
                )}

                {row.caseName && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleManageCase(row)}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    Manage Case
                  </Button>
                )}
              </TableCell>
            </>
          )}
        />
      </Paper>

      <AssignCase
        show={show}
        handleClose={handleClose}
        selectedCase={selectedCase}
      />
    </>
  );
}