import React from "react";
import { colors } from "../../../../../../constant/color";

interface SelectToggleButtonProps {
  selectionMode: boolean;
  onToggle: () => void;
}

const SelectToggleButton: React.FC<SelectToggleButtonProps> = ({
  selectionMode,
  onToggle,
}) => {
  return (
    <button
      style={{
        padding: "0.5rem 1rem",
        background: colors.red1,
        color: "white",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
      }}
      onClick={onToggle}
    >
      {selectionMode ? "Cancel" : "Select"}
    </button>
  );
};

export default SelectToggleButton;