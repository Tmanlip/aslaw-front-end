import React from "react";
import { Case } from "../../../../../../data/userInfo";
import CaseFileTabs from "../../../../../../shared/components/CaseFileTabs";

interface FileSectionProps {
  selectedCase: Case;
  onUploadSuccess?: () => void; // callback to refresh case data
  onDeleteSuccess?: () => void; // callback to refresh case data
}

const FileSection: React.FC<FileSectionProps> = ({ selectedCase, onUploadSuccess, onDeleteSuccess }) => {
  return (
    <CaseFileTabs
      selectedCase={selectedCase}
      onUploadSuccess={onUploadSuccess}
      onDeleteSuccess={onDeleteSuccess}
    />
  );
};

export default FileSection;