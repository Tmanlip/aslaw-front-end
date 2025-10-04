// src/features/Admin/Components/NavBarAdmin.tsx
import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/pics/logo-landscape.png";
import menuIcon from "../../../assets/pics/menus.png";
import { colors } from "../../../constant/color";
import { LeftSection, MenuIcon, Logo } from "./style";
import SearchBar from "../../../components/SearchBar/Search";
import CustomButton from "../../../components/Button/button";
import SideBar from "../../SideBar";
import { useAuth } from "../../../context/AuthContext";

const NavBarAdmin: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = () => {
    console.log("Searching for:", searchValue);
  };

  const toggleSideBar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleLogout = () => {
    logout();       // clear auth context + localStorage
    navigate("/");  // redirect to homepage/login
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
            <Navbar.Brand href="/">
              <Logo src={logo} alt="Logo" />
            </Navbar.Brand>

            {/* SearchBar: visible on md+ screens */}
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
              onClick={handleLogout}
              className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-12 py-6 text-2xl"
            >
              Logout
            </CustomButton>
          </Nav>
        </Container>
      </Navbar>

      {/* Sidebar */}
      <SideBar show={showSidebar} handleClose={() => setShowSidebar(false)}>
        {/* Optional: SearchBar inside sidebar on small screens */}
        <div className="d-lg-none" style={{ marginBottom: "1rem" }}>
          <SearchBar
            value={searchValue}
            onChange={(val) => setSearchValue(val)}
            onSearch={handleSearch}
            placeholder="Search here..."
            buttonLabel="Search"
          />
        </div>
      </SideBar>
    </>
  );
};

export default NavBarAdmin;