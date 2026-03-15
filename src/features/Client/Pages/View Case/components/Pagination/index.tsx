import React from "react";
import { Case } from "../../../../../../data/userInfo";
import CaseFileTabs from "../../../../../../shared/components/CaseFileTabs";

interface FileSectionProps {
  selectedCase: Case;
}

const FileSection: React.FC<FileSectionProps> = ({ selectedCase }) => {
  return <CaseFileTabs selectedCase={selectedCase} readOnly={true} />;
};

export default FileSection;