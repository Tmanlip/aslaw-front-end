import React, { useState, useEffect } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import { Lawyer } from "../../../../../data/userInfo";
import ConfirmSaveModal from "../../../../../components/confirmSaveModal";

interface EditAdminModalProps {
  show: boolean;
  admin: Lawyer;
  onClose: () => void;
  onSave: (updatedAdmin: Lawyer) => Promise<void>;
}

const EditAdminModal: React.FC<EditAdminModalProps> = ({
  show,
  admin,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Lawyer>(admin);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changedFields, setChangedFields] = useState<
    Partial<Record<keyof Lawyer, any>>
  >({});

  useEffect(() => {
    setFormData(admin);
  }, [admin]);

  const handleChange = (field: keyof Lawyer, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = () => {
    const updates: Partial<Record<keyof Lawyer, any>> = {};

    Object.keys(formData).forEach((key) => {
      const typedKey = key as keyof Lawyer;
      if (formData[typedKey] !== admin[typedKey]) {
        updates[typedKey] = formData[typedKey];
      }
    });

    setChangedFields(updates);
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    await onSave({ ...admin, ...changedFields });
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      <Modal show={show} onHide={onClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Admin Information</Modal.Title>
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
                    onChange={(e) => handleChange("age", Number(e.target.value))}
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
                    onChange={(e) => handleChange("maritalStatus", e.target.value)}
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

      <ConfirmSaveModal
        show={showConfirm}
        original={admin}
        updated={changedFields}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default EditAdminModal;
