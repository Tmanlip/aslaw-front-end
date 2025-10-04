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
import Button from "react-bootstrap/Button"; 
import AssignCase from "../Assign Case"; // ✅ Import new component

const chance = new Chance();

interface CaseRecord {
  id: number;
  clientName?: string;
  lawyerName?: string;
  caseName?: string;
}

// Generate mock cases (some missing values)
const generateCases = (count: number): CaseRecord[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    clientName: chance.bool() ? chance.name() : undefined,
    lawyerName: chance.bool() ? chance.name() : undefined,
    caseName: chance.bool() ? chance.sentence({ words: 3 }) : undefined,
  }));

// Filter: require BOTH client and lawyer
const cases: CaseRecord[] = generateCases(50).filter(
  (c) => c.clientName && c.lawyerName
);

// Virtuoso Table components
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
  { label: "Action", dataKey: "action", width: 150 },
];

export default function UserTable() {
  const [show, setShow] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseRecord | null>(null);

  const handleShow = (row: CaseRecord) => {
    setSelectedCase(row);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setSelectedCase(null);
  };

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
              <TableCell>{row.caseName ?? "—"}</TableCell>
              <TableCell>
                {!row.caseName && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleShow(row)}
                  >
                    Add Case
                  </Button>
                )}
              </TableCell>
            </>
          )}
        />
      </Paper>

      {/* ✅ Offcanvas Component */}
      <AssignCase
        show={show}
        handleClose={handleClose}
        selectedCase={selectedCase}
      />
    </>
  );
}