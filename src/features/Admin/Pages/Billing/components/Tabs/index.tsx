import React, { useEffect, useState } from "react";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import DocumentsSection from "./UpdateDocument";
import ReportsSection from "./UpdateReport";
import ChequesSection from "./UpdateCheque";
import { colors } from "../../../../../../constant/color";

interface FileSectionProps {
  fileListUrl: string;
  selectedCase?: {
    lawyerFirmID: string;
    clientFirmID?: string;
    caseId?: string;
    blob_folder_path?: string;
    title?: string;
  };
}

const FileSection: React.FC<FileSectionProps> = ({ fileListUrl, selectedCase }) => {
  const [pdfFiles, setPdfFiles] = useState<string[]>([]);
  const [activeKey, setActiveKey] = useState<string>("documents");

  useEffect(() => {
    fetch(fileListUrl)
      .then((res) => res.json())
      .then((data: string[]) => setPdfFiles(data))
      .catch((err) => console.error("Error loading file list:", err));
  }, [fileListUrl]);

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
          backgroundColor: colors.gold,
          borderRadius: "8px",
          padding: "0.5rem",
        }}
      >
        <Tab eventKey="documents" title="Documents">
          {/* ✅ Pass selectedCase prop */}
          <DocumentsSection selectedCase={selectedCase} />
        </Tab>

        <Tab eventKey="reports" title="Reports">
          <ReportsSection />
        </Tab>

        <Tab eventKey="cheques" title="Cheques">
          <ChequesSection selectedCase={selectedCase}/>
        </Tab>
      </Tabs>
    </div>
  );
};

export default FileSection;