import React, { useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import axiosUser from "../../../../../api/axiosUser";
import { Case, useClientData } from "../../../../../context/ClientDataContext";
import AuthMemory from "../../../../../data/authMemory";
import CaseProgress from "../../Billing/components/CaseProgress";
import ExpectedPaymentsPagination from "./ExpectedPaymentsPagination";
import { useNavigate } from "react-router-dom";
import PATH from "../../../../../constant/paths";

interface EditCaseModalProps {
  selectedCase: Case;
  setSelectedCase: (updatedCase: Case) => void;
  editMode?: "full" | "lawyerOnly";
  autoStartEdit?: boolean;
}

interface LawyerOption {
  id: number;
  name: string;
  firmID: string;
  email?: string;
  status?: string;
}

const EditCaseModal: React.FC<EditCaseModalProps> = ({
  selectedCase,
  setSelectedCase,
  editMode = "full",
  autoStartEdit = false,
}) => {
  const navigate = useNavigate();
  const { upsertCase } = useClientData();

  const asSafeString = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const formatMoney = (value: unknown): string => {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00";
  };

  const formatMalaysiaDateTime = (value: unknown): string => {
    if (!value) return "-";

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  };

  const [formData, setFormData] = useState({
    title: "",
    caseType: "",
    status: "Active",
    description: "",
    clientFirmID: "",
    lawyerFirmID: "",
    expectedInitialPayment: "0",
    expectedFirstPayment: "0",
    expectedSecondPayment: "0",
    expectedThirdPayment: "0",
    expectedFinalPayment: "0",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState<LawyerOption[]>([]);
  const [lawyersLoading, setLawyersLoading] = useState(false);
  const [lawyersError, setLawyersError] = useState("");
  const isLawyerOnlyMode = editMode === "lawyerOnly";
  const statusClass = asSafeString(selectedCase.status).toLowerCase() === "archived"
    ? "is-archived"
    : "is-active";

  useEffect(() => {
    if (selectedCase) {
      setFormData({
        title: asSafeString(selectedCase.title),
        caseType: asSafeString(selectedCase.caseType),
        status: asSafeString(selectedCase.status) || "Active",
        description: asSafeString(selectedCase.description),
        clientFirmID: asSafeString(selectedCase.clientFirmID),
        lawyerFirmID: asSafeString(selectedCase.lawyerFirmID),
        expectedInitialPayment: asSafeString(selectedCase.expected_payment_phases?.initial ?? 0),
        expectedFirstPayment: asSafeString(selectedCase.expected_payment_phases?.first ?? 0),
        expectedSecondPayment: asSafeString(selectedCase.expected_payment_phases?.second ?? 0),
        expectedThirdPayment: asSafeString(selectedCase.expected_payment_phases?.third ?? 0),
        expectedFinalPayment: asSafeString(selectedCase.expected_payment_phases?.final ?? 0),
      });
      setIsEditing(autoStartEdit);
      setShowConfirm(false);
    }
  }, [selectedCase, autoStartEdit]);

  useEffect(() => {
    if (!isLawyerOnlyMode) return;

    const fetchLawyers = async () => {
      setLawyersLoading(true);
      setLawyersError("");

      try {
        const response = await axiosUser.get(`/lawyers`);
        const list = Array.isArray(response.data) ? response.data : [];

        const normalized: LawyerOption[] = list
          .map((item: any) => ({
            id: Number(item?.id ?? 0),
            name: asSafeString(item?.name).trim(),
            firmID: asSafeString(item?.firmID ?? item?.firmId).trim(),
            email: asSafeString(item?.email).trim(),
            status: asSafeString(item?.status).trim(),
          }))
          .filter((item) => item.firmID.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));

        setLawyers(normalized);
      } catch (error) {
        setLawyersError("Failed to load lawyer list. You can still enter lawyer firm ID manually.");
      } finally {
        setLawyersLoading(false);
      }
    };

    fetchLawyers();
  }, [isLawyerOnlyMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const changes = useMemo(() => {
    if (!selectedCase) return [];

    const entries = [
      { key: "title", label: "Title", before: asSafeString(selectedCase.title).trim(), after: asSafeString(formData.title).trim() },
      { key: "caseType", label: "Case Type", before: asSafeString(selectedCase.caseType).trim(), after: asSafeString(formData.caseType).trim() },
      { key: "status", label: "Status", before: asSafeString(selectedCase.status).trim(), after: asSafeString(formData.status).trim() },
      { key: "description", label: "Description", before: asSafeString(selectedCase.description).trim(), after: asSafeString(formData.description).trim() },
      { key: "clientFirmID", label: "Client Firm ID", before: asSafeString(selectedCase.clientFirmID).trim(), after: asSafeString(formData.clientFirmID).trim() },
      { key: "lawyerFirmID", label: "Lawyer Firm ID", before: asSafeString(selectedCase.lawyerFirmID).trim(), after: asSafeString(formData.lawyerFirmID).trim() },
      { key: "expectedInitialPayment", label: "Expected Initial Payment", before: formatMoney(selectedCase.expected_payment_phases?.initial), after: formatMoney(formData.expectedInitialPayment) },
      { key: "expectedFirstPayment", label: "Expected First Payment", before: formatMoney(selectedCase.expected_payment_phases?.first), after: formatMoney(formData.expectedFirstPayment) },
      { key: "expectedSecondPayment", label: "Expected Second Payment", before: formatMoney(selectedCase.expected_payment_phases?.second), after: formatMoney(formData.expectedSecondPayment) },
      { key: "expectedThirdPayment", label: "Expected Third Payment", before: formatMoney(selectedCase.expected_payment_phases?.third), after: formatMoney(formData.expectedThirdPayment) },
      { key: "expectedFinalPayment", label: "Expected Final Payment", before: formatMoney(selectedCase.expected_payment_phases?.final), after: formatMoney(formData.expectedFinalPayment) },
    ];

    if (isLawyerOnlyMode) {
      return entries
        .filter((entry) => entry.key === "lawyerFirmID")
        .filter((entry) => entry.before !== entry.after);
    }

    return entries.filter((entry) => entry.before !== entry.after);
  }, [formData, selectedCase, isLawyerOnlyMode]);
  const hasChanges = changes.length > 0;

  const buildPayload = () => {
    const payload: Record<string, unknown> = {};

    const title = asSafeString(formData.title).trim();
    if (title !== asSafeString(selectedCase.title).trim()) payload.title = title;

    const caseType = asSafeString(formData.caseType).trim();
    if (caseType !== asSafeString(selectedCase.caseType).trim()) payload.caseType = caseType;

    const status = asSafeString(formData.status).trim() || "Active";
    if (status !== asSafeString(selectedCase.status).trim()) payload.status = status;

    const description = asSafeString(formData.description).trim();
    if (description !== asSafeString(selectedCase.description).trim() && description.length > 0) {
      payload.description = description;
    }

    if (isLawyerOnlyMode) {
      const lawyerFirmID = asSafeString(formData.lawyerFirmID).trim();
      if (lawyerFirmID !== asSafeString(selectedCase.lawyerFirmID).trim() && lawyerFirmID.length > 0) {
        payload.lawyerID = lawyerFirmID;
      }
    }

    const expectedInitialPayment = Number(formData.expectedInitialPayment || 0);
    const expectedFirstPayment = Number(formData.expectedFirstPayment || 0);
    const expectedSecondPayment = Number(formData.expectedSecondPayment || 0);
    const expectedThirdPayment = Number(formData.expectedThirdPayment || 0);
    const expectedFinalPayment = Number(formData.expectedFinalPayment || 0);

    if (expectedInitialPayment !== Number(selectedCase.expected_payment_phases?.initial ?? 0)) {
      payload.expected_initial_payment = expectedInitialPayment;
    }
    if (expectedFirstPayment !== Number(selectedCase.expected_payment_phases?.first ?? 0)) {
      payload.expected_first_payment = expectedFirstPayment;
    }
    if (expectedSecondPayment !== Number(selectedCase.expected_payment_phases?.second ?? 0)) {
      payload.expected_second_payment = expectedSecondPayment;
    }
    if (expectedThirdPayment !== Number(selectedCase.expected_payment_phases?.third ?? 0)) {
      payload.expected_third_payment = expectedThirdPayment;
    }
    if (expectedFinalPayment !== Number(selectedCase.expected_payment_phases?.final ?? 0)) {
      payload.expected_final_payment = expectedFinalPayment;
    }

    if (isLawyerOnlyMode) {
      const lawyerOnlyPayload: Record<string, unknown> = {};
      if (payload.lawyerID) {
        lawyerOnlyPayload.lawyerID = payload.lawyerID;
      }
      return lawyerOnlyPayload;
    }

    return payload;
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowConfirm(false);
    setFormData({
      title: asSafeString(selectedCase.title),
      caseType: asSafeString(selectedCase.caseType),
      status: asSafeString(selectedCase.status) || "Active",
      description: asSafeString(selectedCase.description),
      clientFirmID: asSafeString(selectedCase.clientFirmID),
      lawyerFirmID: asSafeString(selectedCase.lawyerFirmID),
      expectedInitialPayment: asSafeString(selectedCase.expected_payment_phases?.initial ?? 0),
      expectedFirstPayment: asSafeString(selectedCase.expected_payment_phases?.first ?? 0),
      expectedSecondPayment: asSafeString(selectedCase.expected_payment_phases?.second ?? 0),
      expectedThirdPayment: asSafeString(selectedCase.expected_payment_phases?.third ?? 0),
      expectedFinalPayment: asSafeString(selectedCase.expected_payment_phases?.final ?? 0),
    });
  };

  const handleReviewChanges = () => {
    if (changes.length === 0) {
      alert("No changes detected.");
      return;
    }

    setShowConfirm(true);
  };

  const handleSave = async () => {
    if (!selectedCase) {
      alert("No case selected");
      return;
    }

    setLoading(true);

    try {
      const currentUser = AuthMemory.getUser();
      const payload = buildPayload();

      if (Object.keys(payload).length === 0) {
        setShowConfirm(false);
        return;
      }

      const response = await axiosUser.put(`/cases/${selectedCase.caseId}`, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": currentUser?.role || "",
          "X-User-FirmID": currentUser?.firmID || "",
        },
      });

      let refreshedCaseFromApi: Case | null = null;
      try {
        const casesResponse = await axiosUser.get(`/cases`);
        const allCases = Array.isArray(casesResponse.data) ? casesResponse.data : [];
        const currentCaseId = Number(selectedCase.caseId ?? (selectedCase as any).id ?? 0);
        const matchedCase = allCases.find(
          (item: any) => Number(item.caseId ?? item.id ?? 0) === currentCaseId
        );

        if (matchedCase) {
          refreshedCaseFromApi = {
            ...selectedCase,
            ...matchedCase,
            caseId: Number(matchedCase.caseId ?? matchedCase.id ?? currentCaseId),
            title: asSafeString(matchedCase.title || matchedCase.caseName || selectedCase.title),
          } as Case;
        }
      } catch (refreshError) {
      }

      const updatedCase: Case = {
        ...selectedCase,
        title: asSafeString(formData.title).trim() || selectedCase.title,
        caseType: asSafeString(formData.caseType).trim() as Case["caseType"],
        status: asSafeString(formData.status).trim() || selectedCase.status,
        description: asSafeString(formData.description).trim() || selectedCase.description,
        expected_payment_phases: response.data.case.expected_payment_phases || {
          initial: Number(formData.expectedInitialPayment || 0),
          first: Number(formData.expectedFirstPayment || 0),
          second: Number(formData.expectedSecondPayment || 0),
          third: Number(formData.expectedThirdPayment || 0),
          final: Number(formData.expectedFinalPayment || 0),
        },
        updated_at: response.data.case.updated_at,
        clientFirmID: response.data.case.clientFirmID || asSafeString(formData.clientFirmID).trim(),
        lawyerFirmID: response.data.case.lawyerFirmID || asSafeString(formData.lawyerFirmID).trim(),
      };

      const resolvedUpdatedCase = refreshedCaseFromApi || updatedCase;

      setSelectedCase(resolvedUpdatedCase);
      upsertCase(resolvedUpdatedCase);
      setIsEditing(false);
      setShowConfirm(false);

      if (isLawyerOnlyMode) {
        navigate(PATH.ADMIN.BILLING, {
          state: {
            selectedCase: resolvedUpdatedCase,
            lockManageUser: true,
            successMessage: "Lawyer updated successfully!",
          },
        });
        return;
      }

      alert("Case updated successfully!");
    } catch (error: any) {
      alert("Unable to update case. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-edit-case-shell">
      <div className="admin-edit-case-header">
        <div>
          <p className="admin-edit-case-kicker">Case details</p>
          <h3>
            {isEditing
              ? (isLawyerOnlyMode ? "Change Assigned Lawyer" : "Edit Case")
              : "Case Information"}
          </h3>
        </div>

        {!isEditing ? (
          <Button variant="warning" onClick={handleStartEdit} className="admin-edit-case-action-btn">
            {isLawyerOnlyMode ? "Change Lawyer" : "Edit Case"}
          </Button>
        ) : (
          <div className="admin-edit-case-action-group">
            <Button variant="outline-secondary" onClick={handleCancelEdit} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReviewChanges} disabled={loading || !hasChanges}>
              Review Changes
            </Button>
          </div>
        )}
      </div>

      <div className="admin-edit-case-content">
        {!isEditing ? (
          <section className="admin-edit-case-panel">
            <div className="admin-edit-case-panel-heading">
              <h4>Case Overview</h4>
              <div className={`admin-edit-case-status-pill ${statusClass}`}>
                {selectedCase.status || "Unknown"}
              </div>
            </div>

            <div className="admin-edit-case-meta-row">
              <span>Case ID: {selectedCase.caseId}</span>
              <span>Type: {selectedCase.caseType || "-"}</span>
              <span>Updated: {formatMalaysiaDateTime(selectedCase.updated_at)} (MYT)</span>
            </div>

            <div className="admin-edit-case-progress-wrap">
              <CaseProgress caseItem={selectedCase} />
            </div>

            <dl className="admin-edit-case-details-grid">
              <div><dt>Case ID</dt><dd>{selectedCase.caseId}</dd></div>
              <div><dt>Title</dt><dd>{selectedCase.title || "-"}</dd></div>
              <div><dt>Case Type</dt><dd>{selectedCase.caseType || "-"}</dd></div>
              <div><dt>Status</dt><dd>{selectedCase.status || "-"}</dd></div>
              <div><dt>Client Name</dt><dd>{selectedCase.clientName || "-"}</dd></div>
              <div><dt>Lawyer Name</dt><dd>{selectedCase.lawyerName || "-"}</dd></div>
              <div><dt>Client Firm ID</dt><dd>{selectedCase.clientFirmID || "-"}</dd></div>
              <div><dt>Lawyer Firm ID</dt><dd>{selectedCase.lawyerFirmID || "-"}</dd></div>
              <div><dt>Created At</dt><dd>{formatMalaysiaDateTime(selectedCase.created_at)} (MYT)</dd></div>
              <div><dt>Updated At</dt><dd>{formatMalaysiaDateTime(selectedCase.updated_at)} (MYT)</dd></div>
              <div className="admin-edit-case-details-full"><dt>Description</dt><dd>{selectedCase.description || "-"}</dd></div>
              <div className="admin-edit-case-details-full"><dt>Blob Folder Path</dt><dd>{selectedCase.blob_folder_path || "-"}</dd></div>
            </dl>

            <div className="admin-edit-case-payments">
              <h5>Expected Payment Phases</h5>
              <ExpectedPaymentsPagination
                mode="view"
                payments={selectedCase.expected_payment_phases}
              />
            </div>
          </section>
        ) : (
          <section className="admin-edit-case-panel">
            <div className="admin-edit-case-panel-heading">
              <h4>{isLawyerOnlyMode ? "Change Assigned Lawyer" : "Edit Case"}</h4>
              <span className="admin-edit-case-edit-note">
                {isLawyerOnlyMode
                  ? "Update the assigned lawyer for this case, then review changes."
                  : "Update only the fields you need, then review changes."}
              </span>
            </div>
            <Form className="admin-edit-case-form">
              <h6 className="admin-edit-case-form-section-title">
                {isLawyerOnlyMode ? "Lawyer Assignment" : "Core Details"}
              </h6>
              <div className="admin-edit-case-form-grid">
                {isLawyerOnlyMode ? (
                  <Form.Group>
                    <Form.Label>Lawyer Firm ID</Form.Label>
                    {lawyersLoading ? (
                      <div className="d-flex align-items-center gap-2">
                        <Spinner animation="border" size="sm" />
                        <span>Loading lawyers...</span>
                      </div>
                    ) : lawyers.length > 0 ? (
                      <Form.Select
                        name="lawyerFirmID"
                        value={formData.lawyerFirmID}
                        onChange={handleChange}
                      >
                        <option value="">Select lawyer</option>
                        {lawyers.map((lawyer) => (
                          <option key={`${lawyer.id}-${lawyer.firmID}`} value={lawyer.firmID}>
                            {lawyer.name || lawyer.firmID}
                            {lawyer.email ? ` (${lawyer.email})` : ""}
                          </option>
                        ))}
                      </Form.Select>
                    ) : (
                      <Form.Control
                        name="lawyerFirmID"
                        value={formData.lawyerFirmID}
                        onChange={handleChange}
                        placeholder="Enter lawyer firm ID"
                      />
                    )}
                    {lawyersError ? (
                      <div className="text-danger mt-2">{lawyersError}</div>
                    ) : null}
                  </Form.Group>
                ) : (
                  <>
                    <Form.Group>
                      <Form.Label>Title</Form.Label>
                      <Form.Control
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter case title"
                      />
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Current Status</Form.Label>
                      <Form.Select name="status" value={formData.status} onChange={handleChange}>
                        <option value="Active">Active</option>
                        <option value="Archived">Archived</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Case Type</Form.Label>
                      <Form.Select
                        name="caseType"
                        value={formData.caseType}
                        onChange={handleChange}
                      >
                        <option value="">Select case type</option>
                        <option value="Litigation">Litigation</option>
                        <option value="Criminal">Criminal</option>
                        <option value="Corporate">Corporate</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Client Firm ID</Form.Label>
                      <Form.Control
                        name="clientFirmID"
                        value={formData.clientFirmID}
                        onChange={handleChange}
                        placeholder="Client firm ID"
                        disabled
                      />
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Lawyer Firm ID</Form.Label>
                      <Form.Control
                        name="lawyerFirmID"
                        value={formData.lawyerFirmID}
                        onChange={handleChange}
                        placeholder="Lawyer firm ID"
                        disabled
                      />
                    </Form.Group>

                    <Form.Group className="admin-edit-case-form-full">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter description"
                      />
                    </Form.Group>

                    <h6 className="admin-edit-case-form-section-title admin-edit-case-form-full">Financial Plan</h6>
                    <Form.Group className="admin-edit-case-form-full">
                      <Form.Label>Expected Payment Phases (RM)</Form.Label>
                      <ExpectedPaymentsPagination
                        formData={formData}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </>
                )}
              </div>
            </Form>
          </section>
        )}
      </div>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="admin-edit-case-confirm-caption">Review only the fields that changed before saving.</p>
          <div className="admin-edit-case-confirm-list">
            {changes.map((change) => (
              <div key={change.key} className="admin-edit-case-confirm-item">
                <strong className="admin-edit-case-confirm-label">{change.label}</strong>
                <span className="admin-edit-case-confirm-value">{change.before || "-"}</span>
                <span className="admin-edit-case-confirm-arrow">→</span>
                <span className="admin-edit-case-confirm-value is-new">{change.after || "-"}</span>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirm(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              "Confirm Save"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EditCaseModal;
