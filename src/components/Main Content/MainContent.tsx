import React from "react";
import { ContentWrapper } from "../Main Content/style";

interface MainContentsProps {
  isSidebarOpen: boolean;
  children: React.ReactNode;
}

const MainContents: React.FC<MainContentsProps> = ({ isSidebarOpen, children }) => {
  return <ContentWrapper isSidebarOpen={isSidebarOpen}>{children}</ContentWrapper>;
};

export default MainContents;
