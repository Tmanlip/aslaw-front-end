import React from "react";
import CaseFolderSection from "./CaseSelectionFolder";
import { Case } from "../../../../../../data/userInfo";

interface ChequesSectionProps {
  selectedCase?: Case;
}

const ChequesSection: React.FC<ChequesSectionProps> = ({ selectedCase }) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="cheques"
      title="Cheques"
      sectionOptions={["initial", "first", "second", "third", "final"]}
      renameFileWithSection={true}
    />
  );
};

export default ChequesSection;