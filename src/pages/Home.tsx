import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../constant/color";
import PATH from "../constant/paths";
import CustomButton from "../components/Button/button";
import BlurPopup from "../components/Popup";
import logo from "../assets/pics/logo-landscape.png";
import LoginForm from "../components/Login/LoginForm";
import "./styles.css";

const HomePage: React.FC = () => {
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const navigate = useNavigate();

  const handleLogin = () => {
    setShowLoginPage(true);
    setTimeout(() => setShowLoginPopup(true), 100);
  };

  const handleClosePopup = () => {
    setShowLoginPopup(false);
    setTimeout(() => setShowLoginPage(false), 300);
  };

  const handleBackToHome = () => {
    setShowLoginPopup(false);
    setShowLoginPage(false);
  };

  // ✅ handle login success and redirect with message
const handleLoginSuccess = (
  role: "admin" | "junioradmin" | "client" | "lawyer",
  message: string,
  options?: {
    redirectTo?: string;
    forcePasswordReset?: boolean;
  }
) => {
  const dashboardPath =
    role === "junioradmin"
      ? PATH.JUNIOR_ADMIN.DASHBOARD
      : role === "admin"
      ? PATH.ADMIN.DASHBOARD
      : `/${role}/dashboard`;
  const targetPath = options?.redirectTo || dashboardPath;

  // The 'login' function was called inside LoginForm. 
  // We wait one "tick" to ensure RenderRouter sees the new role.
  setTimeout(() => {
    navigate(targetPath, {
        state: {
          successMessage: message,
          forcePasswordReset: Boolean(options?.forcePasswordReset),
        },
        replace: true // Use replace so the user can't "back button" into the login 
    });
  }, 10);
};

  const LoginPageContent = () => (
    <div
      className="homepage-container"
      style={{ "--bg-color": colors.gold4 } as React.CSSProperties}
    >
      <div className="text-center">
        <div className="mb-8">
          <img
            src={logo}
            alt="Adnan Sharida & Associates"
            className="logo-img"
          />
        </div>
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8">
          Login Portal
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12">
          Please enter your credentials to continue
        </p>
        <CustomButton
          customColor="red4"
          size="lg"
          onClick={handleBackToHome}
          className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          Back to Home
        </CustomButton>
      </div>
    </div>
  );

  if (showLoginPage) {
    return (
      <>
        <LoginPageContent />
        <BlurPopup
          isOpen={showLoginPopup}
          onClose={handleClosePopup}
          title="Login to Your Account"
          maxWidth="max-w-md"
          colors={colors}
        >
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </BlurPopup>
      </>
    );
  }

  return (
    <div
      className="homepage-container"
      style={{ "--bg-color": colors.gold4 } as React.CSSProperties}
    >
      <div className="text-center">
        <div className="mb-8">
          <img
            src={logo}
            alt="Adnan Sharida & Associates"
            className="logo-img"
          />
        </div>
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8">
          Welcome to Adnan Sharida & Associates!
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12">
          Kindly login to use our services! Thank you!
        </p>
        <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-3">
          <CustomButton
            customColor="gold6"
            size="lg"
            onClick={handleLogin}
            className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-12 py-6 text-2xl"
          >
            Login
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default HomePage;