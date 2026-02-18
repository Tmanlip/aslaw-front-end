import React from "react";
import CaseFolderSection from "./CaseFolderSelection";

interface CaseInfo {
  lawyerFirmID: string;
  clientFirmID?: string;
  caseId?: string;
  blob_folder_path?: string;
}

interface DocumentsSectionProps {
  selectedCase?: CaseInfo;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ selectedCase }) => {
  return <CaseFolderSection selectedCase={selectedCase} folderName="documents" title="Documents" />;
};

export default DocumentsSection;