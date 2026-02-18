// src/components/ProfileInfo/EditProfileModal.tsx
import React, { useEffect, useState } from "react";
import { Modal, Form, Row, Col } from "react-bootstrap";
import { User } from "../../../../../../../../context/ClientDataContext";
import CustomButton from "../../../../../../../../components/Button/button";
import ProfileEditConfirmAlert from "./ConfirmEdit";

interface EditProfileModalProps {
  show: boolean;
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  show,
  user,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<User>(user);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleChange = (field: keyof User, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmSave = () => {
    onSave(formData); // send full updated user
    setShowConfirm(false);
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile Information</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {showConfirm && (
          <ProfileEditConfirmAlert
            show={showConfirm}
            originalData={user}
            updatedData={formData}
            onConfirm={handleConfirmSave}
            onCancel={() => setShowConfirm(false)}
          />
        )}

        <Form>
          {/* Name & Username */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  value={formData.username || ""}
                  onChange={(e) => handleChange("username", e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Age & Email */}
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Age</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) => handleChange("age", Number(e.target.value))}
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* IC, Phone, Address */}
          <Form.Group className="mb-3">
            <Form.Label>IC Number</Form.Label>
            <Form.Control
              value={formData.ICNumber || ""}
              onChange={(e) => handleChange("ICNumber", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              value={formData.phoneNumber || ""}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Home Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.HomeAddress || ""}
              onChange={(e) => handleChange("HomeAddress", e.target.value)}
            />
          </Form.Group>

          {/* Gender & Marital Status */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  value={formData.gender || ""}
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
                  value={formData.maritalStatus || ""}
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
        <CustomButton variant="secondary" onClick={onClose}>
          Cancel
        </CustomButton>
        <CustomButton variant="primary" onClick={handleSaveClick}>
          Save Changes
        </CustomButton>
      </Modal.Footer>
    </Modal>
  );
};

export default EditProfileModal;
