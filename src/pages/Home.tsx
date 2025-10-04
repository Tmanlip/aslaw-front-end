import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../constant/color";
import CustomButton from "../components/Button/button";
import BlurPopup from "../components/Popup";
import logo from "../assets/pics/logo-landscape.png";
import LoginForm from "../components/Login/LoginForm";
import { useAuth } from "../context/AuthContext";
import "./styles.css"; // ✅ keep your homepage styles

const HomePage: React.FC = () => {
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const { role } = useAuth();
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

  // ✅ handle login success from LoginForm
  const handleLoginSuccess = (
    role: "admin" | "client" | "lawyer",
    message: string
  ) => {
    console.log(message);
    if (role === "admin") navigate("/admin/dashboard");
    if (role === "client") navigate("/client/dashboard");
    if (role === "lawyer") navigate("/lawyer/dashboard");
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
          {/* ✅ Pass in handler */}
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
  );
};

export default HomePage;
