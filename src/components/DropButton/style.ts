import styled from "styled-components";
import { DropdownButton } from "react-bootstrap";
import { colors } from "../../constant/color";

export const Wrapper = styled.div`
  width: 100%;
`;

export const Label = styled.label`
  display: block;
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* medium */
  color: ${colors.white4}; /* fallback if not defined */
  margin-bottom: 0.25rem; /* mb-1 */
`;

export const StyledDropdownButton = styled(DropdownButton)`
  width: 100%;
`;
