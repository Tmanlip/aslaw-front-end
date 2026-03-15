import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import axios from "axios";
import { Case } from "../../../../../context/ClientDataContext";
import AuthMemory from "../../../../../data/authMemory";

interface EditCaseModalProps {
  show: boolean;
  onClose: () => void;
  selectedCase: Case;
  setSelectedCase: (updatedCase: Case) => void;
}

const EditCaseModal: React.FC<EditCaseModalProps> = ({
  show,
  onClose,
  selectedCase,
  setSelectedCase,
}) => {
  const asSafeString = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const [formData, setFormData] = useState({
    title: "",
    status: "Active",
    description: "",
    clientFirmID: "",
    lawyerFirmID: "",
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize form when modal opens or selectedCase changes
  useEffect(() => {
    if (selectedCase) {
      setFormData({
        title: asSafeString(selectedCase.title),
        status: asSafeString(selectedCase.status) || "Active",
        description: asSafeString(selectedCase.description),
        clientFirmID: asSafeString(selectedCase.clientFirmID),
        lawyerFirmID: asSafeString(selectedCase.lawyerFirmID),
      });

      // Log case data when modal opens
      console.log("Editing case:", selectedCase);
    }
  }, [selectedCase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!selectedCase) {
      alert("No case selected");
      return;
    }

    setLoading(true);

    try {
      const currentUser = AuthMemory.getUser();
      const token = AuthMemory.getToken();
      const normalizedDescription = asSafeString(formData.description).trim();

      const payload: any = {
        title: asSafeString(formData.title),
        status: asSafeString(formData.status) || "Active",
      };

      // If description is empty, do not send it so backend ignores description updates.
      if (normalizedDescription.length > 0) {
        payload.description = normalizedDescription;
      }

      if (asSafeString(formData.clientFirmID).trim()) payload.clientID = asSafeString(formData.clientFirmID).trim();
      if (asSafeString(formData.lawyerFirmID).trim()) payload.lawyerID = asSafeString(formData.lawyerFirmID).trim();

      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await axios.put(`${apiUrl}/cases/${selectedCase.caseId}`, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": currentUser?.role || "",
          "X-User-FirmID": currentUser?.firmID || "",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const updatedCase: Case = {
        ...selectedCase,
        ...formData,
        description: normalizedDescription.length > 0 ? normalizedDescription : selectedCase.description,
        updated_at: response.data.case.updated_at,
        clientFirmID: response.data.case.clientFirmID || formData.clientFirmID,
        lawyerFirmID: response.data.case.lawyerFirmID || formData.lawyerFirmID,
      };

      setSelectedCase(updatedCase);
      setShowConfirm(false);
      onClose();
    } catch (error: any) {
      console.error("Error updating case:", error.response?.data || error.message);
      const apiMessage = error?.response?.data?.message;
      alert(apiMessage || "Failed to update case. Please check the input and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ================== EDIT FORM MODAL ================== */}
      <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Case</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter case title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Client Firm ID</Form.Label>
              <Form.Control
                name="clientFirmID"
                value={formData.clientFirmID}
                onChange={handleChange}
                placeholder="Optional client firm ID"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Lawyer Firm ID</Form.Label>
              <Form.Control
                name="lawyerFirmID"
                value={formData.lawyerFirmID}
                onChange={handleChange}
                placeholder="Optional lawyer firm ID"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================== CONFIRMATION MODAL ================== */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to save the following changes?</p>
          <ul>
            <li>
              <strong>Title:</strong> {formData.title}
            </li>
            <li>
              <strong>Status:</strong> {formData.status}
            </li>
            {formData.clientFirmID && (
              <li>
                <strong>Client Firm ID:</strong> {formData.clientFirmID}
              </li>
            )}
            {formData.lawyerFirmID && (
              <li>
                <strong>Lawyer Firm ID:</strong> {formData.lawyerFirmID}
              </li>
            )}
            {formData.description && (
              <li>
                <strong>Description:</strong> {formData.description}
              </li>
            )}
          </ul>
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
            {loading ? "Saving..." : "Confirm Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditCaseModal;