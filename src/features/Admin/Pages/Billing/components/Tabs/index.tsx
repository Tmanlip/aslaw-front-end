import React, { useEffect, useState } from "react";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import DocumentsSection from "./UpdateDocument";
import ReportsSection from "./UpdateReport";
import ChequesSection from "./UpdateCheque";
import { colors } from "../../../../../../constant/color"; // ✅ import your colors

interface FileSectionProps {
  fileListUrl: string;
}

const FileSection: React.FC<FileSectionProps> = ({ fileListUrl }) => {
  const [pdfFiles, setPdfFiles] = useState<string[]>([]);
  const [activeKey, setActiveKey] = useState<string>("documents");

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
    <div style={{ marginTop: "2rem" }}>
      <Tabs
        id="file-tabs"
        activeKey={activeKey}
        onSelect={(k) => k && setActiveKey(k)}
        className="mb-3"
        justify
        style={{
          backgroundColor: colors.gold, // ✅ tab background
          borderRadius: "8px",
          padding: "0.5rem",
        }}
      >
        <Tab eventKey="documents" title="Documents">
          <DocumentsSection files={documents} />
        </Tab>
        <Tab eventKey="reports" title="Reports">
          <ReportsSection files={reports} />
        </Tab>
        <Tab eventKey="cheques" title="Cheques">
          <ChequesSection
            files={{
              initial: cheques.slice(0, 1),  // or whatever logic you want
              first: cheques.slice(1, 2),
              second: cheques.slice(2, 3),
              third: cheques.slice(3, 4),
              final: cheques.slice(4),
            }}
          />
        </Tab>
      </Tabs>
    </div>
  );
};

export default FileSection;