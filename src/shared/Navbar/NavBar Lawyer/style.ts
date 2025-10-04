  // src/components/NavBarAdmin/HeaderStyles.ts
  import { styled } from "@mui/material/styles";
  import { colors } from "../../../constant/color";

  export const HeaderContainer = styled("div")({
    backgroundColor: colors.gold,
    color: colors.black2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    position: "relative"
  });

  export const LeftSection = styled("div")({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
  });

  export const MenuIcon = styled("img")({
    width: "28px",
    height: "28px",
  });

  export const SearchWrapper = styled("div")({
    display: "flex",
    alignItems: "center",
    flex: 1,
    maxWidth: "450px",
  });

  export const SearchInputContainer = styled("div")({
    flex: 1,
    "& input": {
      padding: "12px 18px",       // ✅ bigger height/width
      borderRadius: "50px",       // ✅ round pill shape
      fontSize: "1rem",           // ✅ larger text
      border: "1px solid #ccc",
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
    },
  });

  export const SearchButtonWrapper = styled("div")({
    marginLeft: "5px", // ✅ keep button close
    "& button": {
      padding: "12px 28px",       // ✅ bigger button
      borderRadius: "50px",       // ✅ rounder edges
      fontSize: "1rem",           // ✅ slightly larger text
      fontWeight: 600,
    },
  });

  export const Nav = styled("div")({
    display: "flex",
    alignItems: "center",
    gap: "16px",
  });

  export const Logo = styled("img")({
    height: "40px",
    objectFit: "contain",
  });

  export const LogoutBtn = styled("button")({
    background: "white",
    color: "goldenrod",
    border: "none",
    padding: "8px 16px",
    borderRadius: "9999px", // ✅ round pill
    fontWeight: "500",
    cursor: "pointer",
    "&:hover": {
      background: "#f8e49c",
    },
  });
