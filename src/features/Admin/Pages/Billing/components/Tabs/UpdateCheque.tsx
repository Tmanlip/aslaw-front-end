import React from "react";
import CaseFolderSection from "./CaseFolderSelection";

interface CaseInfo {
  lawyerFirmID: string;
  clientFirmID?: string;
  caseId?: string;
  blob_folder_path?: string;
  encrypted_documents?: any[]; // ✅ Support for encrypted documents
}

interface InvoicesSectionProps {
  selectedCase?: CaseInfo;
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onUploadingChange?: (uploading: boolean) => void;
  onCreateDocument?: (category: string) => void;
  onCaseProgressUpdate?: (caseId: number, progress: number) => void;
  onPhaseSnapshotChange?: (snapshot: {
    expected_payment_phases?: {
      initial: number;
      first: number;
      second: number;
      third: number;
      final: number;
    } | null;
    invoice_payment_phases?: {
      initial: { expected: number; paid: number; balance: number };
      first: { expected: number; paid: number; balance: number };
      second: { expected: number; paid: number; balance: number };
      third: { expected: number; paid: number; balance: number };
      final: { expected: number; paid: number; balance: number };
    } | null;
  }) => void;
}

const InvoicesSection: React.FC<InvoicesSectionProps> = ({ selectedCase, onUploadSuccess, onDeleteSuccess, onUploadingChange, onCreateDocument, onCaseProgressUpdate, onPhaseSnapshotChange }) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="invoices"
      title="Invoices"
      sectionOptions={["initial", "first", "second", "third", "final"]}
      renameFileWithSection={true}
      onUploadSuccess={onUploadSuccess}
      onDeleteSuccess={onDeleteSuccess}
      onUploadingChange={onUploadingChange}
      onCreateDocument={onCreateDocument}
      onCaseProgressUpdate={onCaseProgressUpdate}
      onPhaseSnapshotChange={onPhaseSnapshotChange}
    />
  );
};

export default InvoicesSection;