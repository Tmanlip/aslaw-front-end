import React from "react";
import { colors } from "../../../../../../constant/color";

interface SelectToggleButtonProps {
  selectionMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const SelectToggleButton: React.FC<SelectToggleButtonProps> = ({
  selectionMode,
  onToggle,
  disabled = false,
}) => {
  return (
    <button
      style={{
        padding: "0.5rem 1rem",
        background: colors.red1,
        color: "white",
        borderRadius: "8px",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontWeight: "bold",
      }}
      disabled={disabled}
      onClick={onToggle}
    >
      {selectionMode ? "Cancel" : "Select"}
    </button>
  );
};

export default SelectToggleButton;