import React from "react";
import { Case } from "../../../../../../data/userInfo";
import CaseFolderSection from "../../../../../Lawyer/Pages/Update Case/components/Tabs/CaseSelectionFolder";

interface DocumentsSectionProps {
  selectedCase: Case;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ selectedCase }) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="documents"
      title="Documents"
      allowUpload={false}
      allowDelete={false}
    />
  );
};

export default DocumentsSection;
