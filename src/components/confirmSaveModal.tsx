import React from "react";
import { Modal, Button, Spinner } from "react-bootstrap";

interface ConfirmSaveModalProps<T> {
  show: boolean;
  original: T;
  updated: Partial<T>; // changed fields only
  isSaving?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmSaveModal = <T extends Record<string, any>>({
  show,
  original,
  updated,
  isSaving = false,
  onConfirm,
  onCancel,
}: ConfirmSaveModalProps<T>) => {
  const changedFields = Object.keys(updated);
  const formatFieldLabel = (field: string) =>
    field
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <Modal show={show} onHide={onCancel} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Confirm Profile Changes</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p style={{ color: "#334155", marginBottom: "0.85rem" }}>
          <strong>Review only the fields that changed before saving.</strong>
        </p>

        {changedFields.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {changedFields.map((field) => (
              <div
                key={field}
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
                <strong style={{ minWidth: "185px" }}>{formatFieldLabel(field)}</strong>
                <span style={{ color: "#334155" }}>{String((original as any)[field] ?? "-")}</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>→</span>
                <span style={{ color: "#0f766e", fontWeight: 600 }}>{String((updated as any)[field] ?? "-")}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "gray" }}>No changes detected.</p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={changedFields.length === 0 || isSaving}
        >
          {isSaving ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            "Confirm"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmSaveModal;