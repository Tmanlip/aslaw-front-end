import React from "react";
import CaseFolderSection from "./CaseSelectionFolder";
import { Case } from "../../../../../../data/userInfo";

interface InvoicesSectionProps {
  selectedCase?: Case;
  allowUpload?: boolean;
  allowDelete?: boolean;
  bannerMessage?: string;
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

const InvoicesSection: React.FC<InvoicesSectionProps> = ({
  selectedCase,
  allowUpload = true,
  allowDelete = true,
  bannerMessage,
  onUploadSuccess,
  onDeleteSuccess,
}) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="invoices"
      title="Invoices"
      sectionOptions={["initial", "first", "second", "third", "final"]}
      renameFileWithSection={true}
      allowUpload={allowUpload}
      allowDelete={allowDelete}
      bannerMessage={bannerMessage}
      onUploadSuccess={onUploadSuccess}
      onDeleteSuccess={onDeleteSuccess}
    />
  );
};

export default InvoicesSection;