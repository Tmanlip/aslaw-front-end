import React from "react";
import "../../../styles/documentGenerator.css";

const TemplateFields = ({ fields, formData, onChange, onDefendantsChange }) => {
  const defendants = Array.isArray(formData.Defendants) ? formData.Defendants : [];

  const handleDefendantFieldChange = (index, key, value) => {
    if (typeof onDefendantsChange !== "function") {
      return;
    }

    const next = defendants.map((item, currentIndex) =>
      currentIndex === index ? { ...item, [key]: value } : item
    );

    onDefendantsChange(next);
  };

  const handleAddDefendant = () => {
    if (typeof onDefendantsChange !== "function") {
      return;
    }

    onDefendantsChange([
      ...defendants,
      { name: "", nric: "", address: "" },
    ]);
  };

  const handleRemoveDefendant = (index) => {
    if (typeof onDefendantsChange !== "function") {
      return;
    }

    if (defendants.length <= 1) {
      return;
    }

    const next = defendants.filter((_, currentIndex) => currentIndex !== index);
    onDefendantsChange(next);
  };

  const renderField = (field) => {
    const computedMax =
      field.name === "paid_amount" &&
      formData.expected_amount !== undefined &&
      formData.expected_amount !== ""
        ? Number(formData.expected_amount)
        : field.max;

    if (field.type === "defendants") {
      const rows = defendants.length > 0 ? defendants : [{ name: "", nric: "", address: "" }];

      return (
        <div key={field.name}>
          <label className="dg-label">{field.label}</label>
          {rows.map((defendant, index) => (
            <div
              key={`defendant-row-${index}`}
              style={{ border: "1px solid #ddd", borderRadius: 8, padding: "0.75rem", marginBottom: "0.65rem" }}
            >
              <label className="dg-label">Defendant {index + 1} Name</label>
              <input
                type="text"
                className="dg-field"
                value={defendant?.name || ""}
                onChange={(event) => handleDefendantFieldChange(index, "name", event.target.value)}
                required
              />

              <label className="dg-label" style={{ marginTop: "0.45rem" }}>Defendant {index + 1} NRIC</label>
              <input
                type="text"
                className="dg-field"
                value={defendant?.nric || ""}
                onChange={(event) => handleDefendantFieldChange(index, "nric", event.target.value)}
                required
              />

              <label className="dg-label" style={{ marginTop: "0.45rem" }}>Defendant {index + 1} Address</label>
              <textarea
                rows={3}
                className="dg-textarea"
                value={defendant?.address || ""}
                onChange={(event) => handleDefendantFieldChange(index, "address", event.target.value)}
                required
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.45rem" }}>
                <button
                  type="button"
                  className="dg-btn dg-btn-defendant-remove"
                  disabled={rows.length <= 1}
                  onClick={() => handleRemoveDefendant(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button type="button" className="dg-btn dg-btn-defendant-add" onClick={handleAddDefendant}>
            + Defendant
          </button>
        </div>
      );
    }

    return (
      <div key={field.name}>
        {field.type === "checkbox" ? (
          <label className="dg-checkbox-wrap">
            <input
              type="checkbox"
              name={field.name}
              checked={Boolean(formData[field.name])}
              onChange={onChange}
              required={Boolean(field.required)}
            />
            {field.label}
          </label>
        ) : (
          <label className="dg-label">
            {field.label}
          </label>
        )}

        {field.type === "textarea" ? (
          <textarea
            name={field.name}
            rows={4}
            required={field.required ?? true}
            value={formData[field.name] || ""}
            onChange={onChange}
            className="dg-textarea"
            readOnly={Boolean(field.readOnly)}
          />
        ) : field.type === "select" ? (
          <select
            name={field.name}
            required={field.required ?? true}
            value={formData[field.name] || ""}
            onChange={onChange}
            className="dg-field"
            disabled={Boolean(field.readOnly)}
          >
            <option value="">Select an option</option>
            {(field.options || []).map((option) => {
              const value = typeof option === "string" ? option : option.value;
              const label = typeof option === "string" ? option : option.label;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        ) : field.type === "checkbox" ? null : field.type === "file" ? (
          <input
            type="file"
            name={field.name}
            accept={field.accept || "*"}
            required={Boolean(field.required)}
            onChange={onChange}
            className="dg-file"
          />
        ) : (
          <input
            type={field.type}
            name={field.name}
            required={field.required ?? true}
            value={formData[field.name] || ""}
            onChange={onChange}
            className="dg-field"
            readOnly={Boolean(field.readOnly)}
            {...(field.min !== undefined ? { min: field.min } : {})}
            {...(computedMax !== undefined ? { max: computedMax } : {})}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {fields.map(renderField)}
    </>
  );
};

export default TemplateFields;
