import React from "react";
import { Form, Row, Col, Dropdown, ButtonGroup } from "react-bootstrap";
import CustomDropdown from "../components/Option";
import type { FeeOption, User } from "./index";

type StageKey = "initial" | "first" | "second" | "third" | "final";
type StageSelections = Record<StageKey, string[]>;
type StageAmountInputs = Record<StageKey, Record<string, string>>;

type Page1FormProps = {
  caseName: string;
  setCaseName: (val: string) => void;
  caseType: "Litigation" | "Criminal" | "Corporate";
  setCaseType: (val: "Litigation" | "Criminal" | "Corporate") => void;
  feeOptions: FeeOption[];
  feeOptionsLoading: boolean;
  feeOptionsError: string;
  selectedTypeOfWorkValues: StageSelections;
  onSelectedTypeOfWorkValuesChange: React.Dispatch<React.SetStateAction<StageSelections>>;
  selectedTypeOfWorkAmounts: StageAmountInputs;
  onSelectedTypeOfWorkAmountsChange: React.Dispatch<React.SetStateAction<StageAmountInputs>>;
  stageAmounts: Record<StageKey, number>;
  onResetExpectedPayments: () => void;

  description: string;
  setDescription: (val: string) => void;

  lawyer: User | null;
  setLawyer: (val: User | null) => void;
  lawyerOptions: User[];

  client: User | null;
  setClient: (val: User | null) => void;
  clientOptions: User[];
};

const Page1Form: React.FC<Page1FormProps> = ({
  caseName,
  setCaseName,
  caseType,
  setCaseType,
  feeOptions,
  feeOptionsLoading,
  feeOptionsError,
  selectedTypeOfWorkValues,
  onSelectedTypeOfWorkValuesChange,
  selectedTypeOfWorkAmounts,
  onSelectedTypeOfWorkAmountsChange,
  stageAmounts,
  onResetExpectedPayments,
  description,
  setDescription,
  lawyer,
  setLawyer,
  lawyerOptions,
  client,
  setClient,
  clientOptions,
}) => {
  const PHASES: Array<{ key: StageKey; label: string }> = [
    { key: "initial", label: "Initial" },
    { key: "first", label: "First" },
    { key: "second", label: "Second" },
    { key: "third", label: "Third" },
    { key: "final", label: "Final" },
  ];

  const getOptionKey = (option: FeeOption) => `${option.typeOfWork}|||${option.estimationFeesRange}`;

  const getOptionByKey = (key: string) => feeOptions.find((option) => getOptionKey(option) === key);

  const toggleStageOption = (stage: StageKey, optionKey: string) => {
    onSelectedTypeOfWorkValuesChange((prev) => {
      const current = prev[stage];
      const isSelected = current.includes(optionKey);
      const nextValues = isSelected
        ? current.filter((value) => value !== optionKey)
        : [...current, optionKey];

      onSelectedTypeOfWorkAmountsChange((prevAmounts) => {
        const nextStageAmounts = { ...(prevAmounts[stage] || {}) };

        if (isSelected) {
          delete nextStageAmounts[optionKey];
        } else if (!(optionKey in nextStageAmounts)) {
          nextStageAmounts[optionKey] = "";
        }

        return {
          ...prevAmounts,
          [stage]: nextStageAmounts,
        };
      });

      return {
        ...prev,
        [stage]: nextValues,
      };
    });
  };

  const getSelectedLabels = (stage: StageKey) =>
    selectedTypeOfWorkValues[stage]
      .map((optionKey) => getOptionByKey(optionKey))
      .filter((item): item is FeeOption => Boolean(item))
      .map((item) => `${item.typeOfWork} (${item.estimationFeesRange})`);

  const getSelectedOptions = (stage: StageKey) =>
    selectedTypeOfWorkValues[stage]
      .map((optionKey) => ({ optionKey, option: getOptionByKey(optionKey) }))
      .filter((entry): entry is { optionKey: string; option: FeeOption } => Boolean(entry.option));

  const practiceAreaLabel = feeOptions[0]?.practiceArea || (caseType === "Litigation" ? "Civil" : caseType);

  return (
    <Form className="admin-register-case-form">
      <div className="admin-register-case-section-title">Case Details</div>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Case Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter case name"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Case Type <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value as "Litigation" | "Criminal" | "Corporate")}
            >
              <option value="Litigation">Litigation</option>
              <option value="Criminal">Criminal</option>
              <option value="Corporate">Corporate</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <div className="admin-register-case-section-title">Assign Parties</div>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Lawyer <span className="text-danger">*</span></Form.Label>
            <CustomDropdown
              title={lawyer ? `${lawyer.name} (${lawyer.firmID})` : "Select lawyer"}
              options={lawyerOptions.map((l) => ({
                key: l.id,
                label: `${l.name} (${l.firmID})`,
                value: l.firmID,
              }))}
              onSelect={(firmID) =>
                setLawyer(lawyerOptions.find((l) => l.firmID === firmID) || null)
              }
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Client <span className="text-danger">*</span></Form.Label>
            <CustomDropdown
              title={client ? `${client.name} (${client.firmID})` : "Select client"}
              options={clientOptions.map((c) => ({
                key: c.id,
                label: `${c.name} (${c.firmID})`,
                value: c.firmID,
              }))}
              onSelect={(firmID) =>
                setClient(clientOptions.find((c) => c.firmID === firmID) || null)
              }
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="admin-register-case-section-title">Expected Payment Plan</div>
      <Row className="mb-3">
        <Col md={12}>
          <Form.Group>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">Type of Work by Phase</Form.Label>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onResetExpectedPayments}
              >
                Reset selections
              </button>
            </div>
            <Form.Text className="text-muted d-block mb-2">
              Choose one or more Type of Work items, then enter amount for each selected work. The phase amount is the sum of those entered amounts.
            </Form.Text>
            <Form.Text className="text-muted d-block mb-3">
              Practice area loaded for this case type: {practiceAreaLabel}. Hold Ctrl on Windows to select multiple items.
            </Form.Text>
            {feeOptionsError && (
              <Form.Text className="text-danger d-block mb-3">
                {feeOptionsError}
              </Form.Text>
            )}
            <Row>
              {PHASES.map(({ key, label }) => (
                <React.Fragment key={key}>
                  <Col md={8} className="mb-2">
                    <Form.Label>{label} Type of Work</Form.Label>
                    <Dropdown as={ButtonGroup} className="w-100">
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        className="w-100 text-start"
                        disabled={feeOptionsLoading}
                      >
                        {selectedTypeOfWorkValues[key].length > 0
                          ? `${label} (${selectedTypeOfWorkValues[key].length} selected)`
                          : `Select ${label.toLowerCase()} type of work`}
                      </Dropdown.Toggle>

                      <Dropdown.Menu className="w-100 p-2" style={{ maxHeight: 320, overflowY: "auto" }}>
                        {feeOptions.map((option) => {
                          const optionKey = getOptionKey(option);
                          const checked = selectedTypeOfWorkValues[key].includes(optionKey);

                          return (
                            <Dropdown.Item
                              key={optionKey}
                              as="button"
                              type="button"
                              className="px-2 py-1"
                              onClick={(event) => {
                                event.preventDefault();
                                toggleStageOption(key, optionKey);
                              }}
                            >
                              <Form.Check
                                type="checkbox"
                                checked={checked}
                                readOnly
                                label={`${option.typeOfWork} (${option.estimationFeesRange})`}
                                onClick={(event) => event.stopPropagation()}
                              />
                            </Dropdown.Item>
                          );
                        })}
                        {feeOptions.length === 0 && (
                          <div className="px-2 py-1 text-muted">No type of work options available.</div>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                    <Form.Text className="text-muted d-block mt-1">
                      Selected items: {getSelectedLabels(key).join(", ") || "None"}
                    </Form.Text>

                    {getSelectedOptions(key).map(({ optionKey, option }) => (
                      <div key={optionKey} className="border rounded p-2 mt-2 bg-white">
                        <div className="small text-muted mb-1">
                          {option.typeOfWork} | Range: RM {option.rangeMin} - RM {option.rangeMax}
                        </div>
                        <Form.Control
                          type="number"
                          min={option.rangeMin}
                          max={option.rangeMax}
                          step="0.01"
                          placeholder={`Enter amount for ${option.typeOfWork}`}
                          value={selectedTypeOfWorkAmounts[key]?.[optionKey] ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            onSelectedTypeOfWorkAmountsChange((prev) => ({
                              ...prev,
                              [key]: {
                                ...(prev[key] || {}),
                                [optionKey]: value,
                              },
                            }));
                          }}
                        />
                      </div>
                    ))}
                  </Col>
                  <Col md={4} className="mb-2">
                    <Form.Label>{label} Amount (RM)</Form.Label>
                    <Form.Control
                      type="text"
                      readOnly
                      value={`RM ${stageAmounts[key].toFixed(2)}`}
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      Auto-summed from selected Type of Work items.
                    </Form.Text>
                  </Col>
                </React.Fragment>
              ))}
            </Row>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={12}>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Enter case description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default Page1Form;
