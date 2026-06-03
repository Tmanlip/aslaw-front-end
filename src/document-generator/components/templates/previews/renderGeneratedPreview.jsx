import React from "react";
import LegalDocumentPreview from "./LegalDocumentPreview";
import ReportPreview from "./ReportPreview";
import DefaultPreview from "./DefaultPreview";
import InvoicePreview from "./InvoicePreview";

export const renderGeneratedPreview = (templateId, content, options = {}) => {
  if (templateId === "writ-of-summons") {
    return <LegalDocumentPreview content={content} />;
  }

  if (templateId === "report") {
    return <ReportPreview content={content} />;
  }

  if (templateId === "invoice") {
    return <InvoicePreview data={options.formData || {}} language={options.language || "english"} />;
  }

  return <DefaultPreview content={content} />;
};
