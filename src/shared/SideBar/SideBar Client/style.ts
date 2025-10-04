import styled from "styled-components";
import { colors } from "../../../constant/color";

export const SidebarContainer = styled.div`
  width: 240px;
  height: 100vh;
  background-color: ${colors.white};
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  padding: 16px;
  transition: transform 0.3s ease;  /* smooth open/close */

  /* Optional: animate hiding when closed */
  &.hidden {
    transform: translateX(-260px);
  }
`;

export const CloseButton = styled.button`
  align-self: flex-end;
  padding: 8px 12px;
  background: transparent;
  border: none;
  font-size: 22px;
  font-weight: bold;
  color: ${colors.black};
  cursor: pointer;

  &:hover {
    color: ${colors.gold};
  }
`;

export const NavMenu = styled.nav`
  margin-top: 24px;
`;

export const NavItem = styled.li`
  list-style: none;
  padding: 12px 0;
  cursor: pointer;
  font-size: 16px;
  color: ${colors.black};

  &:hover {
    color: ${colors.gold};
  }
`;

export const SearchWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 20px;
  width: 100%;
`;

export const SearchInputContainer = styled.div`
  flex: 1;
`;

export const SearchButtonWrapper = styled.div`
  flex-shrink: 0;
`;
