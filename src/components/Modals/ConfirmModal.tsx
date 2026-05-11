import React from "react";
import { Modal, Button, Spinner } from "react-bootstrap";

export interface ConfirmModalProps {
  show: boolean;
  title?: string;
  confirmText?: string;
  confirmingText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  title = "Confirm Action",
  confirmText = "Confirm",
  confirmingText = "Saving...",
  cancelText = "Cancel",
  isConfirming = false,
  onConfirm,
  onCancel,
  children,
}) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>{children}</Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={isConfirming}>
          {cancelText}
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {confirmingText}
            </>
          ) : (
            confirmText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;