import React, { useState } from "react";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import { Case } from "../../../data/userInfo";
import { colors } from "../../../constant/color";
import CaseFolderSection from "../../../features/Lawyer/Pages/Update Case/components/Tabs/CaseSelectionFolder";
import { useAuth } from "../../../context/AuthContext";

interface CaseFileTabsProps {
  selectedCase: Case;
  readOnly?: boolean;
}

const CaseFileTabs: React.FC<CaseFileTabsProps> = ({ selectedCase, readOnly = false }) => {
  const [activeKey, setActiveKey] = useState<string>("documents");
  const { role } = useAuth();

  const isArchived = (selectedCase.status || "").toLowerCase() === "archived";
  const isAdmin = role === "admin";
  const lockArchivedActions = isArchived && !isAdmin;

  return (
    <div style={{ marginTop: "2rem" }}>
      {lockArchivedActions && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            backgroundColor: "#fff3cd",
            color: "#664d03",
            border: "1px solid #ffecb5",
          }}
        >
          This case is archived. Upload, delete, and case edits are locked for non-admin users.
        </div>
      )}

      <Tabs
        id="case-file-tabs"
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
          <CaseFolderSection
            selectedCase={selectedCase}
            folderName="documents"
            title="Documents"
            allowUpload={!readOnly}
            allowDelete={!readOnly}
            uploadDisabled={lockArchivedActions}
            deleteDisabled={lockArchivedActions}
          />
        </Tab>

        <Tab eventKey="reports" title="Reports">
          <CaseFolderSection
            selectedCase={selectedCase}
            folderName="reports"
            title="Reports"
            allowUpload={!readOnly}
            allowDelete={!readOnly}
            uploadDisabled={lockArchivedActions}
            deleteDisabled={lockArchivedActions}
          />
        </Tab>

        <Tab eventKey="cheques" title="Cheques">
          <CaseFolderSection
            selectedCase={selectedCase}
            folderName="cheques"
            title="Cheques"
            sectionOptions={["initial", "first", "second", "third", "final"]}
            renameFileWithSection={!readOnly && !lockArchivedActions}
            allowUpload={!readOnly}
            allowDelete={!readOnly}
            uploadDisabled={lockArchivedActions}
            deleteDisabled={lockArchivedActions}
          />
        </Tab>
      </Tabs>
    </div>
  );
};

export default CaseFileTabs;
