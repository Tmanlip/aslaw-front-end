import React from "react";

interface SpinnerProps {
  size?: number;      // spinner size in px
  color?: string;     // spinner color
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 40,
  color = "#2563eb",
}) => {
  const spinnerStyle: React.CSSProperties = {
    width: size,
    height: size,
    border: `${size / 8}px solid #e5e7eb`,
    borderTop: `${size / 8}px solid ${color}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  };

  return (
    <>
      <div style={spinnerStyle} />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default Spinner;