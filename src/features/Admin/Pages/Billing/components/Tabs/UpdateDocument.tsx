import React from "react";
import CaseFolderSection from "./CaseFolderSelection";

interface CaseInfo {
  lawyerFirmID: string;
  clientFirmID?: string;
  caseId?: string;
  blob_folder_path?: string;
  encrypted_documents?: any[]; // ✅ Support for encrypted documents
}

interface DocumentsSectionProps {
  selectedCase?: CaseInfo;
  onUploadingChange?: (uploading: boolean) => void;
  onCreateDocument?: (category: string) => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ selectedCase, onUploadingChange, onCreateDocument }) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="documents"
      title="Documents"
      onUploadingChange={onUploadingChange}
      onCreateDocument={onCreateDocument}
    />
  );
};

export default DocumentsSection;