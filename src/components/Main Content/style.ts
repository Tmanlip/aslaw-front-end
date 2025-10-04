import styled from "styled-components";

const HEADER_HEIGHT = 70;   // header height
const SIDE_GAP = 20;        // gap left/right
const BOTTOM_GAP = 10;      // bottom gap
const SIDEBAR_WIDTH = 260;  // sidebar width

export const ContentWrapper = styled.div<{ isSidebarOpen: boolean }>`
  flex: 1;
  background-color: #000;    /* Black background */
  color: #fff;               /* White text */
  padding: 24px;
  margin-top: ${HEADER_HEIGHT}px;   /* Gap below header */
  margin-left: ${SIDE_GAP}px;
  margin-right: ${SIDE_GAP}px;
  margin-bottom: ${BOTTOM_GAP}px;   /* Gap from bottom */
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;

  /* Let content dictate height */
  height: auto;
  min-height: calc(100vh - ${HEADER_HEIGHT}px - ${BOTTOM_GAP}px - 40px);

  ${({ isSidebarOpen }) =>
    isSidebarOpen &&
    `
      margin-left: ${SIDE_GAP}px;
    `}
`;

/* Inputs arranged in row, each ~40% of content */
export const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 50px;

  & > * {
    flex: 0 0 40%;   /* each input ~40% of main width */
    max-width: 40%;
  }
`;
