// src/components/Page1Form.tsx
import React, { useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import CustomDropdown from "./Option";
import { formatICNumber, formatPhoneNumber, getLocationFromPostcode } from "../../../../../../utils/malaysianPostcodes";

type Gender = "Male" | "Female";
type MaritalStatus = "Single" | "Married" | "Divorced";

type Page1FormProps = {
  fullName: string;
  setFullName: (val: string) => void;

  age: string;
  setAge: (val: string) => void;

  gender: Gender | "";
  setGender: (val: Gender) => void;

  identification: string;
  setIdentification: (val: string) => void;

  maritalStatus: MaritalStatus | "";
  setMaritalStatus: (val: MaritalStatus) => void;

  phoneCountryCode: string;
  setPhoneCountryCode: (val: string) => void;
  phoneLocalNumber: string;
  setPhoneLocalNumber: (val: string) => void;
  countryCodeOptions: Array<{ label: string; value: string }>;

  addressLine1: string;
  setAddressLine1: (val: string) => void;

  addressLine2: string;
  setAddressLine2: (val: string) => void;

  postcode: string;
  setPostcode: (val: string) => void;

  district: string;
  setDistrict: (val: string) => void;

  stateRegion: string;
  setStateRegion: (val: string) => void;

  country: string;
  setCountry: (val: string) => void;

  errors: {
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
  };
};

const Page1Form: React.FC<Page1FormProps> = ({
  fullName,
  setFullName,
  age,
  setAge,
  gender,
  setGender,
  identification,
  setIdentification,
  maritalStatus,
  setMaritalStatus,
  phoneCountryCode,
  setPhoneCountryCode,
  phoneLocalNumber,
  setPhoneLocalNumber,
  countryCodeOptions,
  addressLine1,
  setAddressLine1,
  addressLine2,
  setAddressLine2,
  postcode,
  setPostcode,
  district,
  setDistrict,
  stateRegion,
  setStateRegion,
  country,
  setCountry,
  errors,
}) => {
  const [autoDetectedState, setAutoDetectedState] = useState<string>("");
  const [showPostcodeHint, setShowPostcodeHint] = useState(false);

  // Handle postcode change and auto-detect state
  const handlePostcodeChange = (value: string) => {
    setPostcode(value);
    
    if (value.trim()) {
      const location = getLocationFromPostcode(value.trim());
      if (location) {
        setAutoDetectedState(location.state);
        setDistrict(location.district);
        setStateRegion(location.state);
        setShowPostcodeHint(true);
      } else {
        setAutoDetectedState("");
        setShowPostcodeHint(false);
      }
    } else {
      setAutoDetectedState("");
      setShowPostcodeHint(false);
    }
  };

  // Handle IC number formatting
  const handleIdentificationChange = (value: string) => {
    const formatted = formatICNumber(value);
    setIdentification(formatted);
  };

  // Handle phone number input (only digits)
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneLocalNumber(formatted);
  };

  return (
    <Form className="admin-register-user-form">
      <div className="admin-register-user-form-section-title">Personal Information</div>
      {/* Row 1 */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formFullName">
            <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              isInvalid={!!errors.fullName}
            />
            <Form.Control.Feedback type="invalid">{errors.fullName}</Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formAge">
            <Form.Label>Age <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min={1}
              max={120}
              isInvalid={!!errors.age}
            />
            <Form.Control.Feedback type="invalid">{errors.age}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      {/* Row 2 */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formGender">
            <Form.Label>Gender <span className="text-danger">*</span></Form.Label>
            <CustomDropdown
              title={gender || "Select gender"}
              options={[
                { label: "Male", value: "Male" },
                { label: "Female", value: "Female" },
              ]}
              onSelect={(val) => setGender(val as Gender)}
            />
            {errors.gender && <div className="text-danger small mt-1">{errors.gender}</div>}
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formPhoneNumber">
            <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
            <div className="d-flex gap-2">
              <Form.Select
                value={phoneCountryCode}
                onChange={(e) => setPhoneCountryCode(e.target.value)}
                style={{ maxWidth: "220px" }}
              >
                {countryCodeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Control
                type="text"
                placeholder="e.g., 123456789"
                value={phoneLocalNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
                isInvalid={!!errors.phoneNumber}
              />
            </div>
            <Form.Control.Feedback type="invalid">{errors.phoneNumber}</Form.Control.Feedback>
            <Form.Text className="text-muted">Digits only (e.g., {phoneCountryCode}123456789)</Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <div className="admin-register-user-form-section-title">Identity and Marital Information</div>
      {/* Row 3 */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formIdentification">
            <Form.Label>Identification Number <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="xxxxxx-xx-xxxx"
              value={identification}
              onChange={(e) => handleIdentificationChange(e.target.value)}
              required
              isInvalid={!!errors.identification}
              maxLength={14}
            />
            <Form.Control.Feedback type="invalid">{errors.identification}</Form.Control.Feedback>
            <Form.Text className="text-muted">Format: 123456-12-1234 (auto-formatted)</Form.Text>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formMaritalStatus">
            <Form.Label>Marital Status <span className="text-danger">*</span></Form.Label>
            <CustomDropdown
              title={maritalStatus || "Select status"}
              options={[
                { label: "Single", value: "Single" },
                { label: "Married", value: "Married" },
                { label: "Divorced", value: "Divorced" },
              ]}
              onSelect={(val) => setMaritalStatus(val as MaritalStatus)}
            />
            {errors.maritalStatus && (
              <div className="text-danger small mt-1">{errors.maritalStatus}</div>
            )}
          </Form.Group>
        </Col>
      </Row>

      <div className="admin-register-user-form-section-title">Address Details</div>
      {/* Row 4 */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formAddressLine1">
            <Form.Label>Address Line 1 <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter address line 1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required
              isInvalid={!!errors.addressLine1}
            />
            <Form.Control.Feedback type="invalid">{errors.addressLine1}</Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formAddressLine2">
            <Form.Label>Address Line 2 (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter address line 2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Row 5 */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group controlId="formPostcode">
            <Form.Label>Postcode <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter postcode"
              value={postcode}
              onChange={(e) => handlePostcodeChange(e.target.value)}
              required
              isInvalid={!!errors.postcode}
            />
            <Form.Control.Feedback type="invalid">{errors.postcode}</Form.Control.Feedback>
            <Form.Text className="text-muted">Digits only (4-10 digits)</Form.Text>
            {showPostcodeHint && autoDetectedState && (
              <div className="mt-2 p-2 bg-success bg-opacity-10 border border-success rounded small">
                <span className="text-success">✓ State auto-detected: <strong>{autoDetectedState}</strong></span>
              </div>
            )}
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group controlId="formDistrict">
            <Form.Label>District <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
              isInvalid={!!errors.district}
            />
            <Form.Control.Feedback type="invalid">{errors.district}</Form.Control.Feedback>
            <Form.Text className="text-muted">Auto-filled from postcode</Form.Text>
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group controlId="formStateRegion">
            <Form.Label>State <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter state"
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              required
              isInvalid={!!errors.stateRegion}
            />
            <Form.Control.Feedback type="invalid">{errors.stateRegion}</Form.Control.Feedback>
            <Form.Text className="text-muted">Auto-filled from postcode</Form.Text>
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group controlId="formCountry">
            <Form.Label>Country <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              isInvalid={!!errors.country}
            />
            <Form.Control.Feedback type="invalid">{errors.country}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default Page1Form;