import React from "react";
import CaseFolderSection from "./CaseFolderSelection";

interface CaseInfo {
  lawyerFirmID: string;
  clientFirmID?: string;
  caseId?: string;
  blob_folder_path?: string;
  encrypted_documents?: any[];
}

interface ReportsSectionProps {
  selectedCase?: CaseInfo;
  onCreateDocument?: (category: string) => void;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ selectedCase, onCreateDocument }) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="reports"
      title="Reports"
      onCreateDocument={onCreateDocument}
    />
  );
};

export default ReportsSection;
