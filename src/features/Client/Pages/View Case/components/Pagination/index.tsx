import React, { useEffect, useState } from "react";
import Pagination from "react-bootstrap/Pagination";
import DocumentsSection from "./DocumentSection";
import ReportsSection from "./ReportSection";
import ChequesSection from "./ChequeSection";

interface FileSectionProps {
  fileListUrl: string;
}

const FileSection: React.FC<FileSectionProps> = ({ fileListUrl }) => {
  const [pdfFiles, setPdfFiles] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    fetch(fileListUrl)
      .then((res) => res.json())
      .then((data: string[]) => setPdfFiles(data))
      .catch((err) => console.error("Error loading file list:", err));
  }, [fileListUrl]);

  const documents = pdfFiles.slice(0, 2);
  const reports = pdfFiles.slice(2, 3);
  const cheques = pdfFiles.slice(3);

  return (
    <>
      {page === 1 && <DocumentsSection files={documents} />}
      {page === 2 && <ReportsSection files={reports} />}
      {page === 3 && (
        <ChequesSection
          files={{
            initial: cheques.slice(0, 1),
            first: cheques.slice(1, 2),
            second: cheques.slice(2, 3),
            third: cheques.slice(3, 4),
            final: cheques.slice(4),
          }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
        <Pagination>
          <Pagination.Item active={page === 1} onClick={() => setPage(1)}>
            Documents
          </Pagination.Item>
          <Pagination.Item active={page === 2} onClick={() => setPage(2)}>
            Reports
          </Pagination.Item>
          <Pagination.Item active={page === 3} onClick={() => setPage(3)}>
            Cheques
          </Pagination.Item>
        </Pagination>
      </div>
    </>
  );
};

export default FileSection;