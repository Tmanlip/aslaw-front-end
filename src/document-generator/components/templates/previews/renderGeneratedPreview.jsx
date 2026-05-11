import React from "react";
import LegalDocumentPreview from "./LegalDocumentPreview";
import ReportPreview from "./ReportPreview";
import DefaultPreview from "./DefaultPreview";

export const renderGeneratedPreview = (templateId, content) => {
  if (templateId === "writ-of-summons") {
    return <LegalDocumentPreview content={content} />;
  }

  if (templateId === "report") {
    return <ReportPreview content={content} />;
  }

  return <DefaultPreview content={content} />;
};
