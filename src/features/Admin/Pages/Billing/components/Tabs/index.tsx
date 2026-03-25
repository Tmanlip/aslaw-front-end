import React, { useState } from "react";
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
  const [activeKey, setActiveKey] = useState<string>("documents");

  void fileListUrl;

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <Tabs
        id="file-tabs"
        activeKey={activeKey}
        onSelect={(k) => k && setActiveKey(k)}
        mountOnEnter
        unmountOnExit
        className="mb-3"
        justify
        style={{
          backgroundColor: colors.gold,
          borderRadius: "8px",
          padding: "0.5rem",
          rowGap: "0.5rem",
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