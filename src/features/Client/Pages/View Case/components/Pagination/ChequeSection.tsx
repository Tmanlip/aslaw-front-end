import React from "react";
import { Case } from "../../../../../../data/userInfo";
import CaseFolderSection from "../../../../../Lawyer/Pages/Update Case/components/Tabs/CaseSelectionFolder";

interface InvoicesSectionProps {
  selectedCase: Case;
}

const InvoicesSection: React.FC<InvoicesSectionProps> = ({ selectedCase }) => {
  return (
    <CaseFolderSection
      selectedCase={selectedCase}
      folderName="invoices"
      title="Invoices"
      allowUpload={false}
      allowDelete={false}
      sectionOptions={["initial", "first", "second", "third", "final"]}
    />
  );
};

export default InvoicesSection;