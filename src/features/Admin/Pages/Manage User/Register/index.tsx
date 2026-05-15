// src/pages/HomePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import Pagination from "react-bootstrap/Pagination";
import Spinner from "react-bootstrap/Spinner";
import axiosUser from "../../../../../api/axiosUser";
import CustomAlert from "../../../../../components/NormalAlert/Alerts";
import Page1Form from "./components/pageoneform";
import Page2Form from "./components/pagetwoform";
import RegisterCase from "./Register Case";
import { createFailureMessage } from "./feedback";
import { UserRole } from "../../../../../constant/user";
import PATH from "../../../../../constant/paths";
import { useAuth } from "../../../../../context/AuthContext";
import "./registerUser.css";

type CreatedUser = {
  id: number;
  name: string;
  role: UserRole;
  firmID: string;
};

type ValidationErrors = {
  fullName?: string;
  age?: string;
  gender?: string;
  identification?: string;
  maritalStatus?: string;
  phoneNumber?: string;
  addressLine1?: string;
  postcode?: string;
  district?: string;
  stateRegion?: string;
  country?: string;
  username?: string;
  email?: string;
  role?: string;
  picture?: string;
};

const RegisterUser: React.FC = () => {
  const navigate = useNavigate();
  const { role: currentRole } = useAuth();
  const adminPathGroup = currentRole === "junioradmin" ? PATH.JUNIOR_ADMIN : PATH.ADMIN;

  const COUNTRY_CODE_OPTIONS = [
    { label: "Malaysia (+60)", value: "+60" },
    { label: "Singapore (+65)", value: "+65" },
    { label: "Indonesia (+62)", value: "+62" },
    { label: "Thailand (+66)", value: "+66" },
    { label: "Brunei (+673)", value: "+673" },
    { label: "Philippines (+63)", value: "+63" },
    { label: "India (+91)", value: "+91" },
    { label: "United Kingdom (+44)", value: "+44" },
    { label: "United States (+1)", value: "+1" },
    { label: "Australia (+61)", value: "+61" },
  ];

  const [page, setPage] = useState(1);
  const [showRegisterCase, setShowRegisterCase] = useState(false);

  // Page 1 state
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [identification, setIdentification] = useState("");
  const [maritalStatus, setMaritalStatus] =
    useState<"Single" | "Married" | "Divorced" | "">("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+60");
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postcode, setPostcode] = useState("");
  const [district, setDistrict] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");

  // Page 2 state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "junioradmin" | "lawyer" | "client" | "">("");
  const [picture, setPicture] = useState<File | null>(null);

  // Created user
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: string; message: string } | null>(null);

  const validatePassportPicture = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        resolve("Picture must be JPG or PNG format.");
        return;
      }

      const maxBytes = 2 * 1024 * 1024;
      if (file.size > maxBytes) {
        resolve("Picture must be 2MB or smaller.");
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        URL.revokeObjectURL(imageUrl);

        if (width < 350 || height < 450) {
          resolve("Picture must be at least 350x450 pixels (passport size).");
          return;
        }

        const passportRatio = 35 / 45;
        const actualRatio = width / height;
        if (Math.abs(actualRatio - passportRatio) > 0.08) {
          resolve("Picture must follow passport ratio (35:45).");
          return;
        }

        resolve(null);
      };
      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve("Unable to read selected picture.");
      };
      image.src = imageUrl;
    });
  };

  const handleSubmit = async () => {
    const nextErrors: ValidationErrors = {};
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    const icRegex = /^\d{6}-\d{2}-\d{4}$/;
    const normalizedLocalPhone = phoneLocalNumber.trim();
    const fullPhoneNumber = `${phoneCountryCode}${normalizedLocalPhone}`;

    if (!fullName.trim()) nextErrors.fullName = "Full name is required.";

    const ageNumber = parseInt(age, 10);
    if (!age.trim()) {
      nextErrors.age = "Age is required.";
    } else if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      nextErrors.age = "Age must be a valid number between 1 and 120.";
    }

    if (!gender) nextErrors.gender = "Gender is required.";

    if (!normalizedLocalPhone) {
      nextErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\d+$/.test(normalizedLocalPhone)) {
      nextErrors.phoneNumber = "Phone number must contain digits only (no dashes or spaces).";
    } else if (!phoneRegex.test(fullPhoneNumber)) {
      nextErrors.phoneNumber =
        "Phone number must include country code and digits only (example: +60123456789).";
    }

    if (!identification.trim()) {
      nextErrors.identification = "IC number is required.";
    } else if (!icRegex.test(identification.trim())) {
      nextErrors.identification = "IC number must follow xxxxxx-xx-xxxx format.";
    }

    if (!maritalStatus) nextErrors.maritalStatus = "Marital status is required.";

    if (!addressLine1.trim()) nextErrors.addressLine1 = "Address Line 1 is required.";

    if (!postcode.trim()) {
      nextErrors.postcode = "Postcode is required.";
    } else if (!/^\d{4,10}$/.test(postcode.trim())) {
      nextErrors.postcode = "Postcode must be 4 to 10 digits.";
    }

    if (!district.trim()) nextErrors.district = "District is required.";
    if (!stateRegion.trim()) nextErrors.stateRegion = "State is required.";
    if (!country.trim()) nextErrors.country = "Country is required.";

    if (!username.trim()) nextErrors.username = "Username is required.";

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Email format is invalid.";
    }

    if (!role) nextErrors.role = "Role is required.";

    let validatedPicture: File | null = null;
    if (!picture) {
      nextErrors.picture = "Passport picture is required.";
    } else {
      const pictureValidationError = await validatePassportPicture(picture);
      if (pictureValidationError) {
        nextErrors.picture = pictureValidationError;
      } else {
        validatedPicture = picture;
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (
        nextErrors.fullName ||
        nextErrors.age ||
        nextErrors.gender ||
        nextErrors.identification ||
        nextErrors.maritalStatus ||
        nextErrors.phoneNumber ||
        nextErrors.addressLine1 ||
        nextErrors.postcode ||
        nextErrors.district ||
        nextErrors.stateRegion ||
        nextErrors.country
      ) {
        setPage(1);
      } else {
        setPage(2);
      }
      setFeedback({
        variant: "warning",
        message: "Please complete all required fields with valid values.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!validatedPicture) {
        setFeedback({
          variant: "warning",
          message: "Passport picture is required.",
        });
        return;
      }

      const formattedHomeAddress = [
        addressLine1.trim(),
        addressLine2.trim(),
        postcode.trim(),
        district.trim(),
        stateRegion.trim(),
        country.trim(),
      ]
        .filter(Boolean)
        .join(", ");

      const payload = new FormData();
      payload.append("name", fullName);
      payload.append("email", email);
      payload.append("username", username);
      payload.append("role", role);
      payload.append("age", String(ageNumber));
      payload.append("ICNumber", identification);
      payload.append("phoneNumber", fullPhoneNumber);
      payload.append("HomeAddress", formattedHomeAddress);
      payload.append("gender", gender);
      payload.append("maritalStatus", maritalStatus);
      payload.append("picture", validatedPicture);

      const response = await axiosUser.post(
        `${process.env.REACT_APP_API_URL}/registerusers`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setCreatedUser({
        id: response.data.user.id,
        name: response.data.user.name,
        role: response.data.user.role,
        firmID: response.data.user.firmID,
      });

      // Reset form after successful registration
      resetForm();

      const emailSent = response?.data?.email_sent !== false;
      const generatedPassword = response?.data?.generated_password;

      if (!emailSent) {
        const baseWarning =
          response?.data?.email_warning ||
          "User was created but the account email could not be delivered.";

        const passwordHint =
          typeof generatedPassword === "string" && generatedPassword.trim()
            ? ` Temporary password (dev only): ${generatedPassword}`
            : "";

        setFeedback({
          variant: "warning",
          message: `${baseWarning}${passwordHint}`,
        });
        return;
      }

      setFeedback({
        variant: "success",
        message: "User registered successfully!",
      });
    } catch (error: any) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );
      setFeedback({
        variant: "danger",
        message: createFailureMessage(
          "register user",
          error,
          "Server error occurred. Please check the data."
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    // Reset Page 1 fields
    setFullName("");
    setAge("");
    setGender("");
    setIdentification("");
    setMaritalStatus("");
    setPhoneCountryCode("+60");
    setPhoneLocalNumber("");
    setAddressLine1("");
    setAddressLine2("");
    setPostcode("");
    setDistrict("");
    setStateRegion("");
    setCountry("");

    // Reset Page 2 fields
    setUsername("");
    setEmail("");
    setRole("");
    setPicture(null);

    // Reset errors and go to page 1
    setErrors({});
    setPage(1);
  };

  // Move to Register Case if user created
  if (showRegisterCase && createdUser) {
    return <RegisterCase user={createdUser} />;
  }

  return (
    <>
      <NavBarAdmin />

      <div className="admin-register-user-page">
        <div className="admin-register-user-header">
          <h1>Register User</h1>
          <p>Create a complete user profile with identity, contact, and account details.</p>
        </div>

        {feedback && (
          <div className="mb-3">
            <CustomAlert
              variant={feedback.variant}
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          </div>
        )}

        <div className="admin-register-user-card">
          <div className="admin-register-user-card-header">
            <div>
              <h2>User Registration Form</h2>
              <p>Complete personal profile and account access details.</p>
            </div>
            <div className="admin-register-user-step-indicator">
              Step {page} of 2
            </div>
          </div>

          <div className="admin-register-user-card-body">
            {page === 1 && (
              <Page1Form
                fullName={fullName}
                setFullName={setFullName}
                age={age}
                setAge={setAge}
                gender={gender}
                setGender={setGender}
                identification={identification}
                setIdentification={setIdentification}
                maritalStatus={maritalStatus}
                setMaritalStatus={setMaritalStatus}
                phoneCountryCode={phoneCountryCode}
                setPhoneCountryCode={setPhoneCountryCode}
                phoneLocalNumber={phoneLocalNumber}
                setPhoneLocalNumber={setPhoneLocalNumber}
                countryCodeOptions={COUNTRY_CODE_OPTIONS}
                addressLine1={addressLine1}
                setAddressLine1={setAddressLine1}
                addressLine2={addressLine2}
                setAddressLine2={setAddressLine2}
                postcode={postcode}
                setPostcode={setPostcode}
                district={district}
                setDistrict={setDistrict}
                stateRegion={stateRegion}
                setStateRegion={setStateRegion}
                country={country}
                setCountry={setCountry}
                errors={errors}
              />
            )}

            {page === 2 && (
              <Page2Form
                username={username}
                setUsername={setUsername}
                email={email}
                setEmail={setEmail}
                role={role}
                setRole={setRole}
                picture={picture}
                setPicture={setPicture}
                errors={errors}
              />
            )}
          </div>

          <div className="admin-register-user-footer d-flex justify-content-between mt-4">
            <Pagination className="admin-register-user-pagination">
              <Pagination.Item
                active={page === 1}
                onClick={() => setPage(1)}
              >
                1
              </Pagination.Item>
              <Pagination.Item
                active={page === 2}
                onClick={() => setPage(2)}
              >
                2
              </Pagination.Item>
            </Pagination>

            {page === 2 && (
              <div className="admin-register-user-action-group d-flex gap-2">
                <button
                  className="btn btn-primary"
                  disabled={!createdUser}
                  onClick={() => setShowRegisterCase(true)}
                >
                  Go to Register Case
                </button>

                {!createdUser ? (
                  <button
                    className="btn btn-success"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting && (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                    )}
                    Submit
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-info"
                      onClick={resetForm}
                    >
                      Register Another User
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(adminPathGroup.MANAGE_USER)}
                    >
                      Back to User Table
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterUser;