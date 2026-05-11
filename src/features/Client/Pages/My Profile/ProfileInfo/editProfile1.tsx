import React, { useState, useEffect } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import { Client } from "../../../../../data/userInfo";
import ConfirmSaveModal from "../../../../../components/confirmSaveModal"; // your confirmation modal

interface EditClientModalProps {
  show: boolean;
  client: Client;
  onClose: () => void;
  onSave: (updatedClient: Client) => Promise<void>;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  show,
  client,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Client>(client);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Changed fields only
  const [changedFields, setChangedFields] = useState<
    Partial<Record<keyof Client, any>>
  >({});

  // Update form when client prop changes
  useEffect(() => {
    setFormData(client);
  }, [client]);

  const handleChange = (field: keyof Client, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // On save click: compute changed fields and open confirm modal
  const handleSaveClick = () => {
    const updates: Partial<Record<keyof Client, any>> = {};

    Object.keys(formData).forEach((key) => {
      const k = key as keyof Client;
      if (formData[k] !== client[k]) {
        updates[k] = formData[k];
      }
    });

    if (Object.keys(updates).length === 0) {
      alert("No changes detected.");
      return;
    }

    setChangedFields(updates);
    setShowConfirm(true);
  };

  // When user confirms changes
  const handleConfirmSave = async () => {
    try {
      setIsSaving(true);
      await onSave({ ...client, ...changedFields }); // merge original + changed fields
      setShowConfirm(false);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Client Information</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      handleChange("age", Number(e.target.value))
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>IC Number</Form.Label>
              <Form.Control
                value={formData.ICNumber}
                onChange={(e) => handleChange("ICNumber", e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Home Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.HomeAddress}
                onChange={(e) => handleChange("HomeAddress", e.target.value)}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Marital Status</Form.Label>
                  <Form.Select
                    value={formData.maritalStatus}
                    onChange={(e) =>
                      handleChange("maritalStatus", e.target.value)
                    }
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveClick}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmSaveModal
        show={showConfirm}
        original={client}
        updated={changedFields}
        isSaving={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default EditClientModal;