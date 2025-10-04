import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import logo from "../../../assets/pics/logo-landscape.png";
import menuIcon from "../../../assets/pics/menus.png";
import { colors } from "../../../constant/color";
import { LeftSection, MenuIcon, Logo } from "./style";
import SearchBar from "../../../components/SearchBar/Search";
import CustomButton from "../../../components/Button/button";
import SideBarClient from "../../SideBar/SideBar Client/new";// Offcanvas sidebar

const NavBarClient: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const handleSearch = () => {
    console.log("Searching for:", searchValue);
  };

  const toggleSideBar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <>
      {/* Navbar */}
      <Navbar
        expand="lg"
        style={{
          backgroundColor: colors.gold,
          color: colors.white,
          padding: "0 1rem",
        }}
      >
        <Container
          fluid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left Section: Hamburger + Logo */}
          <LeftSection style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <MenuIcon
              src={menuIcon}
              alt="Menu"
              onClick={toggleSideBar}
              style={{ cursor: "pointer" }}
            />
            <Navbar.Brand href="#home">
              <Logo src={logo} alt="Logo" />
            </Navbar.Brand>

            {/* SearchBar: visible only on md+ screens */}
            <div className="d-none d-lg-block" style={{ marginLeft: "1rem" }}>
              <SearchBar
                value={searchValue}
                onChange={(val) => setSearchValue(val)}
                onSearch={handleSearch}
                placeholder="Search here..."
                buttonLabel="Search"
              />
            </div>
          </LeftSection>

          {/* Right-side Logout button */}
          <Nav>
            <CustomButton
              customColor="darkSilver"
              size="lg"
              className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-12 py-6 text-2xl"
            >
              Logout
            </CustomButton>
          </Nav>
        </Container>
      </Navbar>

      {/* Sidebar: contains menu + SearchBar on small screens */}
      <SideBarClient show={showSidebar} handleClose={() => setShowSidebar(false)}>
        {/* Optional: put SearchBar inside sidebar on small screens */}
        <div className="d-lg-none" style={{ marginBottom: "1rem" }}>
          <SearchBar
            value={searchValue}
            onChange={(val) => setSearchValue(val)}
            onSearch={handleSearch}
            placeholder="Search here..."
            buttonLabel="Search"
          />
        </div>
        {/* You can also put your menu links here */}
      </SideBarClient>
    </>
  );
};

export default NavBarClient;