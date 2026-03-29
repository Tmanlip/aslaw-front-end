import * as React from "react";
import axiosUser from "../../../../../../api/axiosUser";
import { useNavigate } from "react-router-dom";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { TableVirtuoso, TableComponents } from "react-virtuoso";
import { Modal, Button, Spinner } from "react-bootstrap";

import AssignCase from "../Assign Case";
import { colors } from "../../../../../../constant/color";
import PATH from "../../../../../../constant/paths";
import { useAuth } from "../../../../../../context/AuthContext";

interface CaseRecord {
  id: number;
  clientName: string;
  lawyerName: string;
  clientFirmID: string;
  lawyerFirmID: string;
  caseName: string;
  status?: string;
  blob_folder_path?: string;
}

export default function CaseTable() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [cases, setCases] = React.useState<CaseRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [showAssign, setShowAssign] = React.useState(false);
  const [showManageModal, setShowManageModal] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseRecord | null>(null);
  const [loadingNavigate, setLoadingNavigate] = React.useState(false);

  /* ================= FETCH CASES ================= */
  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await axiosUser.get(`${process.env.REACT_APP_API_URL}/cases`);
        setCases(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  /* ================= REGISTER CASE ================= */
  const handleRegisterCase = () => {
    navigate(PATH.ADMIN.REGISTER_CASE);
  };

  /* ================= ASSIGN CASE ================= */
  const handleShowAssign = (row: CaseRecord) => {
    setSelectedCase(row);
    setShowAssign(true);
  };

  const handleCloseAssign = () => {
    setShowAssign(false);
    setSelectedCase(null);
  };

  /* ================= MANAGE CASE ================= */
  const handleManageCase = (row: CaseRecord) => {
    if (role !== "admin") return;
    setSelectedCase(row);
    setShowManageModal(true);
  };

  const handleNavigateManageCase = () => {
    if (!selectedCase) return;
    setLoadingNavigate(true);

    try {

          // --- log the selectedCase object before navigating ---
    console.log("Navigating to billing with selectedCase:", {
      caseId: selectedCase.id,
      title: selectedCase.caseName,
      clientName: selectedCase.clientName,
      lawyerName: selectedCase.lawyerName,
      clientFirmID: selectedCase.clientFirmID,
      lawyerFirmID: selectedCase.lawyerFirmID || "",
      status: selectedCase.status,
      blob_folder_path: selectedCase.blob_folder_path,
    });

      navigate(PATH.ADMIN.BILLING, {
        state: {
          selectedCase: {
            caseId: selectedCase.id,
            title: selectedCase.caseName,
            clientName: selectedCase.clientName,
            lawyerName: selectedCase.lawyerName,
            clientFirmID: selectedCase.clientFirmID || "",
            lawyerFirmID: selectedCase.lawyerFirmID || "",
            status: selectedCase.status,
            blob_folder_path: selectedCase.blob_folder_path,
          },
          lockManageUser: true,
        },
      });

      setShowManageModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNavigate(false);
    }
  };

  /* ================= VIRTUOSO TABLE COMPONENTS ================= */
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" style={{ color: colors.green3 }} />
      </div>
    );
  }

  return (
    <>
      {/* ================= TABLE ================= */}
      <Paper style={{ height: "min(62vh, 560px)", width: "max-content", minWidth: "100%" }}>
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
              <TableCell>{row.clientName}</TableCell>
              <TableCell>{row.lawyerName}</TableCell>
              <TableCell>{row.caseName || "-"}</TableCell>
              <TableCell>
                {!row.caseName && (
                  <Button size="sm" onClick={() => handleShowAssign(row)}>
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

      {/* ================= REGISTER CASE BUTTON ================= */}
      {role === "admin" && (
        <div className="d-flex justify-content-center mt-3 mb-2">
          <Button
            variant="success"
            onClick={handleRegisterCase}
            style={{
              backgroundColor: colors.green3,
              borderColor: colors.green3,
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: "8px",
            }}
          >
            + Register New Case
          </Button>
        </div>
      )}

      {/* ================= ASSIGN CASE MODAL ================= */}
      <AssignCase
        show={showAssign}
        handleClose={handleCloseAssign}
        selectedCase={selectedCase}
      />

      {/* ================= MANAGE CASE MODAL ================= */}
      <Modal show={showManageModal} onHide={() => setShowManageModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.green3 }}>
          <Modal.Title className="text-white">Manage Case</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCase && (
            <>
              <p><strong>Case ID:</strong> {selectedCase.id}</p>
              <p><strong>Client Name:</strong> {selectedCase.clientName}</p>
              <p><strong>Lawyer Name:</strong> {selectedCase.lawyerName}</p>
              <p><strong>Case Name:</strong> {selectedCase.caseName}</p>
              {selectedCase.status && (
                <p><strong>Status:</strong> {selectedCase.status}</p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowManageModal(false)}
            disabled={loadingNavigate}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleNavigateManageCase}
            disabled={loadingNavigate}
          >
            {loadingNavigate ? (
              <>
                <Spinner size="sm" className="me-2" />
                Loading...
              </>
            ) : (
              "Go to Manage Case"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}