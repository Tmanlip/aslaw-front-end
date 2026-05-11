import React from "react";
import ConfirmModal from "../../../../../../../../components/Modals/ConfirmModal";

interface ProfileEditConfirmProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  originalData: Record<string, any>;
  updatedData: Record<string, any>; // only changed fields
}

const ProfileEditConfirm: React.FC<ProfileEditConfirmProps> = ({
  show,
  onConfirm,
  onCancel,
  isSaving = false,
  originalData,
  updatedData,
}) => {
  const changedFields = Object.keys(updatedData);
  const formatFieldLabel = (field: string) =>
    field
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <ConfirmModal
      show={show}
      title="Confirm Profile Changes"
      isConfirming={isSaving}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p style={{ color: "#334155", marginBottom: "0.85rem" }}>
        <strong>Review only the fields that changed before saving.</strong>
      </p>

      {changedFields.length === 0 && (
        <p>No changes detected.</p>
      )}

      {changedFields.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {changedFields.map((key) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.8rem 0.9rem",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e7edf4",
                }}
              >
                <strong style={{ minWidth: "185px" }}>{formatFieldLabel(key)}</strong>
                <span style={{ color: "#334155" }}>{String(originalData[key] ?? "-")}</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>→</span>
                <span style={{ color: "#0f766e", fontWeight: 600 }}>{String(updatedData[key] ?? "-")}</span>
              </div>
            ))}
        </div>
      )}
    </ConfirmModal>
  );
};

export default ProfileEditConfirm;