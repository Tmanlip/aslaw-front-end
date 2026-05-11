import React from "react";
import "../../../styles/documentGenerator.css";

const TemplateFields = ({ fields, formData, onChange }) => {
  const renderField = (field) => {
    const computedMax =
      field.name === "paid_amount" &&
      formData.expected_amount !== undefined &&
      formData.expected_amount !== ""
        ? Number(formData.expected_amount)
        : field.max;

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
          />
        ) : field.type === "select" ? (
          <select
            name={field.name}
            required={field.required ?? true}
            value={formData[field.name] || ""}
            onChange={onChange}
            className="dg-field"
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
