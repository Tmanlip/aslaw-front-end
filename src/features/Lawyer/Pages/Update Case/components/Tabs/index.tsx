import React from "react";
import { Case } from "../../../../../../data/userInfo";
import CaseFileTabs from "../../../../../../shared/components/CaseFileTabs";

interface FileSectionProps {
  selectedCase: Case;
  onUploadSuccess?: () => void; // callback to refresh case data
  onDeleteSuccess?: () => void; // callback to refresh case data
  activeKey?: "recent" | "pending" | "documents" | "reports" | "invoices";
  onActiveKeyChange?: (key: "recent" | "pending" | "documents" | "reports" | "invoices") => void;
  onCreateDocument?: (category?: string) => void;
}

const FileSection: React.FC<FileSectionProps> = ({ selectedCase, onUploadSuccess, onDeleteSuccess, activeKey, onActiveKeyChange, onCreateDocument }) => {
  return (
    <CaseFileTabs
      selectedCase={selectedCase}
      onUploadSuccess={onUploadSuccess}
      onDeleteSuccess={onDeleteSuccess}
      activeKey={activeKey}
      onActiveKeyChange={onActiveKeyChange}
      onCreateDocument={onCreateDocument}
      lockInvoices={true}
    />
  );
};

export default FileSection;