import React from "react";
import { Table } from "react-bootstrap";
import ConfirmModal from "../../../../../../../../components/Modals/ConfirmModal";

interface ProfileEditConfirmProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  originalData: Record<string, any>;
  updatedData: Record<string, any>; // only changed fields
}

const ProfileEditConfirm: React.FC<ProfileEditConfirmProps> = ({
  show,
  onConfirm,
  onCancel,
  originalData,
  updatedData,
}) => {
  const changedFields = Object.keys(updatedData);

  return (
    <ConfirmModal
      show={show}
      title="Confirm Profile Changes"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p><strong>Please confirm the following changes:</strong></p>

      <Table bordered size="sm">
        <tbody>
          {changedFields.map((key) => (
            <tr key={key}>
              <th>{key}</th>
              <td>
                <div style={{ color: "red" }}>Old: {String(originalData[key] ?? "")}</div>
                <div style={{ color: "green" }}>New: {String(updatedData[key] ?? "")}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </ConfirmModal>
  );
};

export default ProfileEditConfirm;