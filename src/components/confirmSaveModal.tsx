import React from "react";
import { Modal, Button, Table } from "react-bootstrap";

interface ConfirmSaveModalProps<T> {
  show: boolean;
  original: T;
  updated: Partial<T>; // changed fields only
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmSaveModal = <T extends Record<string, any>>({
  show,
  original,
  updated,
  onConfirm,
  onCancel,
}: ConfirmSaveModalProps<T>) => {
  const changedFields = Object.keys(updated);

  return (
    <Modal show={show} onHide={onCancel} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Confirm Profile Changes</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p><strong>Please confirm the following changes:</strong></p>

        {changedFields.length > 0 ? (
          <Table bordered size="sm">
            <tbody>
              {changedFields.map((field) => (
                <tr key={field}>
                  <th style={{ width: "30%" }}>{field}</th>
                  <td>
                    <div style={{ color: "red" }}>
                      Old: {String((original as any)[field] ?? "-")}
                    </div>
                    <div style={{ color: "green" }}>
                      New: {String((updated as any)[field] ?? "-")}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p style={{ color: "gray" }}>No changes detected.</p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={changedFields.length === 0}
        >
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmSaveModal;