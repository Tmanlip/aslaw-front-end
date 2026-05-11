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
  onSave: (user: User) => Promise<void> | void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  show,
  user,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<User>(user);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changedData, setChangedData] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(user);
    setChangedData({});
  }, [user]);

  const handleChange = (field: keyof User, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildChangedData = (original: User, updated: User): Partial<User> => {
    const diff: Partial<User> = {};

    (Object.keys(updated) as Array<keyof User>).forEach((key) => {
      const oldValue = original[key];
      const newValue = updated[key];

      const normalizedOld = typeof oldValue === "string" ? oldValue.trim() : oldValue;
      const normalizedNew = typeof newValue === "string" ? newValue.trim() : newValue;

      if (normalizedOld !== normalizedNew) {
        (diff as Record<string, unknown>)[key as string] = newValue;
      }
    });

    return diff;
  };

  const handleSaveClick = () => {
    const diff = buildChangedData(user, formData);
    setChangedData(diff);

    if (Object.keys(diff).length === 0) {
      alert("No changes detected.");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    try {
      setIsSaving(true);
      await onSave(formData); // send full updated user
      setShowConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered dialogClassName="admin-profile-edit-modal">
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile Information</Modal.Title>
      </Modal.Header>

      <Modal.Body className="admin-profile-edit-modal-body">
        {showConfirm && (
          <ProfileEditConfirmAlert
            show={showConfirm}
            originalData={user}
            updatedData={changedData}
            isSaving={isSaving}
            onConfirm={handleConfirmSave}
            onCancel={() => setShowConfirm(false)}
          />
        )}

        <Form>
          {/* Name & Username */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3 admin-profile-edit-field">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3 admin-profile-edit-field">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  value={formData.username || ""}
                  readOnly
                  disabled
                />
                <Form.Text className="text-muted">Username cannot be changed.</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Age & Email */}
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3 admin-profile-edit-field">
                <Form.Label>Age</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) => handleChange("age", Number(e.target.value))}
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group className="mb-3 admin-profile-edit-field">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email || ""}
                  readOnly
                  disabled
                />
                <Form.Text className="text-muted">Email cannot be changed.</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* IC, Phone, Address */}
          <Form.Group className="mb-3 admin-profile-edit-field">
            <Form.Label>IC Number</Form.Label>
            <Form.Control
              value={formData.ICNumber || ""}
              onChange={(e) => handleChange("ICNumber", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3 admin-profile-edit-field">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              value={formData.phoneNumber || ""}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3 admin-profile-edit-field">
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
              <Form.Group className="mb-3 admin-profile-edit-field">
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
              <Form.Group className="mb-3 admin-profile-edit-field">
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

          {/* Account Status */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3 admin-profile-edit-field">
                <Form.Label>Account Status</Form.Label>
                <Form.Select
                  value={formData.status || ""}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="admin-profile-edit-modal-footer">
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
