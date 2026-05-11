import React from "react";
import { Case } from "../../../../../../data/userInfo";
import CaseFileTabs from "../../../../../../shared/components/CaseFileTabs";

interface FileSectionProps {
  selectedCase: Case;
  activeKey?: "recent" | "pending" | "documents" | "reports" | "invoices";
  onActiveKeyChange?: (key: "recent" | "pending" | "documents" | "reports" | "invoices") => void;
}

const FileSection: React.FC<FileSectionProps> = ({ selectedCase, activeKey, onActiveKeyChange }) => {
  return <CaseFileTabs selectedCase={selectedCase} readOnly={true} activeKey={activeKey} onActiveKeyChange={onActiveKeyChange} />;
};

export default FileSection;