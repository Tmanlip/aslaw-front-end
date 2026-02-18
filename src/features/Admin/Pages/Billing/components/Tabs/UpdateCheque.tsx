import React from "react";
import CaseFolderSection from "./CaseFolderSelection";

interface CaseInfo {
  lawyerFirmID: string;
  clientFirmID?: string;
  caseId?: string;
  blob_folder_path?: string;
}

interface ChequesSectionProps {
  selectedCase?: CaseInfo;
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