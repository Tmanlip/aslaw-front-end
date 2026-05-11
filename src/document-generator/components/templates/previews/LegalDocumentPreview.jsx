import React from "react";

const LegalDocumentPreview = ({ content }) => {
  const lines = content.split("\n");

  return (
    <div className="max-w-3xl p-10 mx-auto bg-white border rounded-md shadow-sm font-serif leading-8 text-gray-900">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-3" />;
        }

        const isMainTitle = trimmed === "WRIT OF SUMMONS";
        const isSectionTitle = ["Plaintiff:", "Defendant:", "Issued by:"].includes(trimmed);
        const isLabelLine = trimmed.startsWith("Date:")
          || trimmed.startsWith("Case No.:")
          || trimmed.startsWith("Interest Rate:")
          || trimmed.startsWith("Appearance must be entered within")
          || trimmed.startsWith("Hearing Date:")
          || trimmed.startsWith("LETTER OF DEMAND:")
          || trimmed.startsWith("Ref:")
          || trimmed.startsWith("Ruj:")
          || trimmed.startsWith("RE:")
          || trimmed.startsWith("PER:")
          || trimmed === "WITHOUT PREJUDICE"
          || trimmed.startsWith("Dear ")
          || trimmed.startsWith("Tuan/Puan")
          || trimmed === "Sincerely,";

        if (isMainTitle) {
          return (
            <h2 key={index} className="mb-4 text-xl font-semibold tracking-wide text-center uppercase">
              {line}
            </h2>
          );
        }

        if (isSectionTitle) {
          return (
            <h3 key={index} className="mt-2 mb-1 text-base font-semibold uppercase">
              {line}
            </h3>
          );
        }

        if (isLabelLine) {
          return (
            <p key={index} className="font-semibold whitespace-pre-wrap">
              {line}
            </p>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap">
            {line}
          </p>
        );
      })}
    </div>
  );
};

export default LegalDocumentPreview;
