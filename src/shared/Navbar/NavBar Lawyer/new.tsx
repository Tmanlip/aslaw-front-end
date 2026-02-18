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
import SideBar from "../../SideBar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import AuthMemory from "../../../data/authMemory";
import { apiFetch } from "../../../hooks/api";

const NavBarLawyer: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = () => {
    console.log("Searching for:", searchValue);
  };

  const toggleSideBar = () => setShowSidebar(!showSidebar);

  const handleLogout = async () => {
    try {
      // 1️⃣ Get the stored token from AuthMemory
      const token = AuthMemory.getToken(); // assuming you store it after login

      // 2️⃣ Call backend logout to revoke the token
      await apiFetch("/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`, // include token
        },
      });

    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // 3️⃣ Clear memory-only auth
      AuthMemory.clear();

      // 4️⃣ Clear auth context
      logout();

      // 5️⃣ Redirect to login page
      navigate("/login");
    }
  };

  return (
    <>
      <Navbar
        expand="lg"
        style={{ backgroundColor: colors.gold, color: colors.white, padding: "0 1rem" }}
      >
        <Container
          fluid
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
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

      <SideBar show={showSidebar} handleClose={() => setShowSidebar(false)}>
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

export default NavBarLawyer;