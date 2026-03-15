import React from "react";
import { Case } from "../../../../../../data/userInfo";
import CaseFolderSection from "../../../../../Lawyer/Pages/Update Case/components/Tabs/CaseSelectionFolder";

interface ChequesSectionProps {
  selectedCase: Case;
}

const ChequesSection: React.FC<ChequesSectionProps> = ({ selectedCase }) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="cheques"
      title="Cheques"
      allowUpload={false}
      allowDelete={false}
      sectionOptions={["initial", "first", "second", "third", "final"]}
    />
  );
};

export default ChequesSection;