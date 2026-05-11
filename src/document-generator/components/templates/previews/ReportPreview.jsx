import React from "react";

const ReportPreview = ({ content }) => {
  const sectionHeaders = new Set([
    "Objective:",
    "Findings:",
    "Recommendations:",
    "Conclusion:",
  ]);

  return (
    <div className="p-6 bg-white border rounded-md shadow-sm">
      {content.split("\n").map((line, index) => {
        if (!line.trim()) {
          return <div key={index} className="h-3" />;
        }

        if (sectionHeaders.has(line.trim())) {
          return (
            <h3 key={index} className="mt-2 mb-1 text-base font-semibold text-gray-900">
              {line}
            </h3>
          );
        }

        return (
          <p key={index} className="leading-7 text-gray-800 whitespace-pre-wrap">
            {line}
          </p>
        );
      })}
    </div>
  );
};

export default ReportPreview;
