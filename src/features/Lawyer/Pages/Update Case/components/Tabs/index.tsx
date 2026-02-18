import React, { useEffect, useState } from "react";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import DocumentsSection from "./UpdateDocument";
import ReportsSection from "./UpdateReport";
import ChequesSection from "./UpdateCheque";
import { colors } from "../../../../../../constant/color";
import { Case } from "../../../../../../data/userInfo";

interface FileSectionProps {
  selectedCase: Case;
}

const FileSection: React.FC<FileSectionProps> = ({ selectedCase }) => {
  const [activeKey, setActiveKey] = useState<string>("documents");

  useEffect(() => {
    console.log("Selected Case in FileSection:", selectedCase);
  }, [selectedCase]);

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
          <DocumentsSection selectedCase={selectedCase} />
        </Tab>

        <Tab eventKey="reports" title="Reports">
          <ReportsSection selectedCase={selectedCase} />
        </Tab>

        <Tab eventKey="cheques" title="Cheques">
          <ChequesSection selectedCase={selectedCase} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default FileSection;