import React from "react";
import CaseFolderSection from "./CaseSelectionFolder";
import { Case } from "../../../../../../data/userInfo";

interface DocumentsSectionProps {
  selectedCase?: Case;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ selectedCase }) => {
  return <CaseFolderSection selectedCase={selectedCase} folderName="documents" title="Documents" />;
};

export default DocumentsSection;