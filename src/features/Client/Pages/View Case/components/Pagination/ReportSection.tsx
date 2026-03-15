import React from "react";
import { Case } from "../../../../../../data/userInfo";
import CaseFolderSection from "../../../../../Lawyer/Pages/Update Case/components/Tabs/CaseSelectionFolder";

interface ReportsSectionProps {
  selectedCase: Case;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ selectedCase }) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="reports"
      title="Reports"
      allowUpload={false}
      allowDelete={false}
    />
  );
};

export default ReportsSection;