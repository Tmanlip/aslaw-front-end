import React, { useEffect, useState } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import Form from "react-bootstrap/Form";
import { Case } from "../../../../../data/userInfo";
import { userData } from "../../../../../data/userData"; // keep this for progress

interface CaseProgressProps {
  cases: Case[];
  selectedCase: Case | null;
  onSelectCase: (c: Case) => void;
}

const getRandomProgress = () => Math.floor(Math.random() * 76) + 15;

const CaseProgress: React.FC<CaseProgressProps> = ({ cases, selectedCase, onSelectCase }) => {
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});

  useEffect(() => {
    if (cases.length > 0) {
      setProgressMap((prev) => {
        const updated = { ...prev };
        cases.forEach((c) => {
          if (!updated[c.caseId]) {
            updated[c.caseId] = getRandomProgress();
          }
        });
        return updated;
      });
    }
  }, [cases]);

  const selectedCaseId = selectedCase?.caseId ?? (cases.length > 0 ? cases[0].caseId : null);

  const handleSelect = (id: number) => {
    const c = cases.find((item) => item.caseId === id);
    if (c) onSelectCase(c);
  };

  if (cases.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
      {cases.length > 1 ? (
        <Form.Select
          value={selectedCaseId ?? ""}
          onChange={(e) => handleSelect(Number(e.target.value))}
          style={{ maxWidth: "260px" }}
        >
          {cases.map((c) => (
            <option key={c.caseId} value={c.caseId}>
              {c.title}
            </option>
          ))}
        </Form.Select>
      ) : (
        <span style={{ fontWeight: "bold", fontSize: "1.75rem" }}>
          {selectedCase?.title || userData.name}
        </span>
      )}
      <ProgressBar
        now={selectedCaseId ? progressMap[selectedCaseId] ?? userData.progress : userData.progress}
        label={`${selectedCaseId ? progressMap[selectedCaseId] ?? userData.progress : userData.progress}%`}
        style={{ width: "300px", height: "28px", fontSize: "1rem" }}
      />
    </div>
  );
};

export default CaseProgress;