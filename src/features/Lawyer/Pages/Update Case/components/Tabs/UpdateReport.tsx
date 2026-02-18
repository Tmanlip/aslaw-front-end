import React from "react";
import CaseFolderSection from "./CaseSelectionFolder";
import { Case } from "../../../../../../data/userInfo";

interface ReportsSectionProps {
  selectedCase?: Case;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ selectedCase }) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="reports"
      title="Reports"
    />
  );
};

export default ReportsSection;