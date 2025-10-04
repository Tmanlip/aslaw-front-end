import React from "react";
import Button from "react-bootstrap/Button";
import { colors } from "../../constant/color";

type CustomButtonProps = {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "light"
    | "dark"
    | "link";
  customColor?: keyof typeof colors;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  style?: React.CSSProperties;
  size?: "sm" | "lg"; // ✅ allow bootstrap size prop
};

const CustomButton: React.FC<CustomButtonProps> = ({
  variant,
  customColor,
  children,
  onClick,
  disabled = false,
  type = "button",
  className,
  style,
  size,
}) => {
  const customStyle = customColor
    ? {
        backgroundColor: colors[customColor],
        borderColor: colors[customColor],
        color: "#fff",
        ...style,
      }
    : style;

  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
      style={customStyle}
      size={size} // ✅ pass through size
    >
      {children}
    </Button>
  );
};

export default CustomButton;
