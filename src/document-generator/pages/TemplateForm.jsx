import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { templates } from "../data/templates";
import { deterministicTemplateBuilders } from "../components/templates/builders";
import { renderGeneratedPreview } from "../components/templates/previews/renderGeneratedPreview";
import TemplateEditorCard from "../components/templates/ui/TemplateEditorCard";
import TemplatePreviewCard from "../components/templates/ui/TemplatePreviewCard";
import {
  buildMalayDeterministicTranslationPrompt,
  shouldRefineDeterministicTranslation,
} from "../utils/translation";

import jsPDF from "jspdf";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";
import { resolveApiBaseUrl } from "../../api/resolveApiBaseUrl";
import {
  DEFAULT_DOCUMENT_PLACEHOLDER,
  DOCUMENT_PLACEHOLDER_OPTIONS,
} from "../../shared/constants/documentPlaceholders";

const MAIN_API_URL = resolveApiBaseUrl();
const BACKEND_BASE_URL = `${MAIN_API_URL}/document-generator`;

const templateDocxEndpointById = {
  "formal-letter": {
    endpoint: `${BACKEND_BASE_URL}/generate-lod-docx`,
    fallbackFilename: "LOD_Template.docx",
    errorText: "Failed to export LOD DOCX. Make sure backend is running.",
  },
  "writ-of-summons": {
    endpoint: `${BACKEND_BASE_URL}/generate-writ-docx`,
    fallbackFilename: "Writ_of_Summons_Template.docx",
    errorText: "Failed to export Writ DOCX. Make sure backend is running.",
  },
};

const templatePdfEndpointById = {
  "formal-letter": {
    endpoint: `${BACKEND_BASE_URL}/generate-lod-pdf`,
    fallbackFilename: "LOD_Template_work.pdf",
    errorText: "Failed to export LOD PDF. Make sure backend is running and LibreOffice is installed.",
  },
  "writ-of-summons": {
    endpoint: `${BACKEND_BASE_URL}/generate-writ-pdf`,
    fallbackFilename: "Writ_of_Summons_Template.pdf",
    errorText: "Failed to export Writ PDF. Make sure backend is running and LibreOffice is installed.",
  },
  invoice: {
    endpoint: `${BACKEND_BASE_URL}/generate-invoice-pdf`,
    fallbackFilename: "Invoice_Template.pdf",
    errorText: "Failed to export Invoice PDF. Make sure backend is running.",
  },
};

const getFileNameFromContentDisposition = (headerValue, fallbackName) => {
  if (!headerValue) {
    return fallbackName;
  }

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // Fall through to plain filename.
    }
  }

  const plainMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || fallbackName;
};

const sanitizeInvoiceFileStem = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  return raw.replace(/[^A-Za-z0-9\-_]/g, "_");
};

const resolveInvoicePdfFilename = (response, payloadFormData, fallbackName) => {
  const contentDisposition = response.headers.get("Content-Disposition");
  if (contentDisposition) {
    return getFileNameFromContentDisposition(contentDisposition, fallbackName);
  }

  const invoiceNumberFromHeader = response.headers.get("X-Invoice-Number");
  const invoiceNumberFromPayload = payloadFormData?.invoice_number;
  const safeInvoiceNumber =
    sanitizeInvoiceFileStem(invoiceNumberFromHeader) || sanitizeInvoiceFileStem(invoiceNumberFromPayload);

  return safeInvoiceNumber ? `${safeInvoiceNumber}.pdf` : fallbackName;
};

const INVOICE_NUMBER_CONFLICT_MESSAGE =
  "Unable to generate a unique invoice number right now. Please try again.";

const resolveResponseErrorMessage = async (response, fallbackMessage) => {
  if (response.status === 409) {
    return INVOICE_NUMBER_CONFLICT_MESSAGE;
  }

  try {
    const payload = await response.json();
    if (payload?.message) {
      return payload.message;
    }
    if (payload?.error) {
      return payload.error;
    }
  } catch {
    // ignore non-json responses
  }

  return fallbackMessage;
};

const parsePrefillData = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const readPath = (obj, path) => {
  if (!obj || !path) return undefined;
  const segments = String(path).split(".");
  let current = obj;

  for (const segment of segments) {
    if (current == null || typeof current !== "object" || !hasOwn(current, segment)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const resolveFirstPositiveInteger = (...values) => {
  for (const value of values) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return Math.trunc(numericValue);
    }
  }

  return 0;
};

const toPositiveNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};

const toNonNegativeAmount = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};

const parseRangeAmount = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const matches = value.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) {
    return null;
  }

  const numbers = matches
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item >= 0);

  if (numbers.length === 0) {
    return null;
  }

  if (numbers.length === 1) {
    return numbers[0];
  }

  return (numbers[0] + numbers[numbers.length - 1]) / 2;
};

const resolveItemAmount = (item) => {
  if (!item || typeof item !== "object") {
    return 0;
  }

  const directAmount = toNonNegativeAmount(
    item.selectedFee ?? item.selected_fee ?? item.estimatedFee ?? item.estimated_fee ?? item.fee
  );
  if (directAmount !== null) {
    return directAmount;
  }

  const fromRange = parseRangeAmount(item.estimationFeesRange ?? item.estimation_fees_range);
  return fromRange ?? 0;
};

const toNullableInteger = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.trunc(numericValue);
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeInvoiceApiFormData = ({ formData, currentCaseId, currentCase, prefillData }) => {
  const resolvedCaseId = resolveFirstPositiveInteger(
    formData?.case_id,
    currentCaseId,
    currentCase?.caseId,
    currentCase?.id,
    prefillData?.case_data?.caseId,
    prefillData?.case_data?.case_id,
    prefillData?.caseId,
    prefillData?.case_id
  );

  if (!Number.isFinite(resolvedCaseId) || resolvedCaseId <= 0) {
    return null;
  }

  const normalizedStage = resolveInvoiceStage(formData?.payment_stage);
  const normalizedIssueDate = String(formData?.issue_date || "").trim() || new Date().toISOString().slice(0, 10);

  return {
    ...formData,
    case_id: resolvedCaseId,
    payment_stage: normalizedStage,
    issue_date: normalizedIssueDate,
    invoice_id: toNullableInteger(formData?.invoice_id),
    clientID: toNullableInteger(formData?.clientID),
    lawyerID: toNullableInteger(formData?.lawyerID),
    expected_amount: toNullableNumber(formData?.expected_amount),
    paid_amount: toNullableNumber(formData?.paid_amount),
    tax: toNullableNumber(formData?.tax),
    discount: toNullableNumber(formData?.discount),
    balance: toNullableNumber(formData?.balance),
    total_amount: toNullableNumber(formData?.total_amount),
    phase_balance: toNullableNumber(formData?.phase_balance),
  };
};

const normalizeDefendantsArray = (rawValue, options = {}) => {
  const { dropEmpty = true } = options;

  if (!Array.isArray(rawValue)) {
    return [];
  }

  const normalized = rawValue
    .map((item) => ({
      name: String(item?.name || "").trim(),
      nric: String(item?.nric || "").trim(),
      address: String(item?.address || "").trim(),
    }));

  if (!dropEmpty) {
    return normalized;
  }

  return normalized.filter((item) => item.name || item.nric || item.address);
};

const toMalayDayWord = (value) => {
  const n = Number(value);
  const map = {
    1: "satu",
    2: "dua",
    3: "tiga",
    4: "empat",
    5: "lima",
    6: "enam",
    7: "tujuh",
    8: "lapan",
    9: "sembilan",
    10: "sepuluh",
    11: "sebelas",
    12: "dua belas",
    13: "tiga belas",
    14: "empat belas",
    15: "lima belas",
    16: "enam belas",
    17: "tujuh belas",
    18: "lapan belas",
    19: "sembilan belas",
    20: "dua puluh",
    21: "dua puluh satu",
    22: "dua puluh dua",
    23: "dua puluh tiga",
    24: "dua puluh empat",
    25: "dua puluh lima",
    26: "dua puluh enam",
    27: "dua puluh tujuh",
    28: "dua puluh lapan",
    29: "dua puluh sembilan",
    30: "tiga puluh",
    31: "tiga puluh satu",
  };

  if (!Number.isFinite(n) || n <= 0) {
    return "";
  }

  return map[Math.trunc(n)] || String(Math.trunc(n));
};

const normalizeWritFormData = (formData) => {
  const safeFormData = formData && typeof formData === "object" ? formData : {};
  const hasExplicitDefendants = Array.isArray(safeFormData.Defendants);
  const defendants = normalizeDefendantsArray(safeFormData.Defendants);
  const firstDefendant = defendants[0] || { name: "", nric: "", address: "" };
  const secondDefendant = defendants[1] || { name: "", nric: "", address: "" };

  const output = {
    ...safeFormData,
    Defendants: defendants,
    Defendant1Name: String(
      hasExplicitDefendants
        ? (firstDefendant.name || "")
        : (safeFormData.Defendant1Name || firstDefendant.name || "")
    ),
    Defendant1NRIC: String(
      hasExplicitDefendants
        ? (firstDefendant.nric || "")
        : (safeFormData.Defendant1NRIC || firstDefendant.nric || "")
    ),
    Defendant1Address: String(
      hasExplicitDefendants
        ? (firstDefendant.address || "")
        : (safeFormData.Defendant1Address || firstDefendant.address || "")
    ),
    Defendant2Name: String(
      hasExplicitDefendants
        ? (secondDefendant.name || "")
        : (safeFormData.Defendant2Name || secondDefendant.name || "")
    ),
    Defendant2NRIC: String(
      hasExplicitDefendants
        ? (secondDefendant.nric || "")
        : (safeFormData.Defendant2NRIC || secondDefendant.nric || "")
    ),
    Defendant2Address: String(
      hasExplicitDefendants
        ? (secondDefendant.address || "")
        : (safeFormData.Defendant2Address || secondDefendant.address || "")
    ),
    WritCaseNoLabel: String(safeFormData.WritCaseNoLabel || "GUAMAN NO:"),
  };

  const appearanceDays = String(output.AppearanceDays || "14").trim() || "14";
  const writCaseNumber = String(output.WritCaseNumber || output.CaseNumber || "").trim();
  const writCaseYear = String(output.WritCaseYear || output.CaseYear || "").trim();
  const lawyerName = String(output.LawyerName || output.PlaintiffSolicitor || "").trim();
  const plaintiffFirmAddress = String(output.PlaintiffFirmAddress || output.FilingFirmAddress || "").trim();

  output.AppearanceDays = appearanceDays;
  output.AppearanceDaysWord = String(output.AppearanceDaysWord || toMalayDayWord(appearanceDays));
  output.CaseNoReference = String(output.CaseNoReference || writCaseNumber);
  output.CaseYear = String(output.CaseYear || writCaseYear);
  output.DamagesAmount = String(output.DamagesAmount || output.GeneralDamagesAmount || output.ClaimAmount || "");
  output.SDamagesText = String(output.SDamagesText || output.SpecialDamagesText || "");
  output.FirmAddress = String(output.FirmAddress || plaintiffFirmAddress);
  output.LawyerName = String(output.LawyerName || lawyerName);
  output.InterestFromText = String(output.InterestFromText || "dari tarikh penghakiman sehingga penyelesaian penuh");
  output.CostsActionText = String(output.CostsActionText || "Kos tindakan");
  output.OtherReliefText = String(output.OtherReliefText || "Apa-apa relif yang difikirkan sesuai dan adil oleh mahkamah");
  output.InitialCostsAmount = String(output.InitialCostsAmount || "225.00");
  output.SubstitutedServiceCostsAmount = String(output.SubstitutedServiceCostsAmount || "60.00");
  output.PostagePrice = String(output.PostagePrice || "");
  output.OpponentLawyer = String(output.OpponentLawyer || "");
  output.Place = String(output.Place || output.CourtPlace2 || "");
  output.CourtPlace2 = String(output.CourtPlace2 || output.Place || "");

  const dateInput = String(output.Date || "").trim();
  if (dateInput) {
    output.EndorsementDate = String(output.EndorsementDate || dateInput);
  }

  return output;
};

const normalizeCaseTypeFeeJsonCandidate = (candidate) => {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === "string") {
    try {
      const parsed = JSON.parse(candidate);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  return typeof candidate === "object" ? candidate : null;
};

const resolveCaseTypeFeeJson = (prefillData, currentCase) => {
  const candidates = [
    prefillData?.case_type_fee_json,
    prefillData?.caseTypeFeeJson,
    prefillData?.case_data?.case_type_fee_json,
    prefillData?.case_data?.caseTypeFeeJson,
    currentCase?.case_type_fee_json,
    currentCase?.caseTypeFeeJson,
    null,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCaseTypeFeeJsonCandidate(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

const getStageFeeItems = (caseTypeFeeJson, stage) => {
  const value = caseTypeFeeJson?.[stage];
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
};

const getStageTypeOfWorkOptions = (caseTypeFeeJson, stage) => {
  const seen = new Set();
  return getStageFeeItems(caseTypeFeeJson, stage)
    .map((item) => String(item.typeOfWork || item.type_of_work || "").trim())
    .filter((typeOfWork) => {
      if (!typeOfWork) {
        return false;
      }
      const normalized = typeOfWork.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
};

const computeExpectedForTypeOfWork = (caseTypeFeeJson, stage, typeOfWork) => {
  const normalizedTypeOfWork = String(typeOfWork || "").trim().toLowerCase();
  if (!normalizedTypeOfWork) {
    return null;
  }

  const items = getStageFeeItems(caseTypeFeeJson, stage).filter(
    (item) =>
      String(item.typeOfWork || item.type_of_work || "").trim().toLowerCase() ===
      normalizedTypeOfWork
  );

  if (items.length === 0) {
    return null;
  }

  return items.reduce((total, item) => total + resolveItemAmount(item), 0);
};

const extractInvoiceDocuments = (...sources) => {
  const collected = [];

  sources.forEach((source) => {
    if (!Array.isArray(source)) {
      return;
    }

    source.forEach((item) => {
      if (item && typeof item === "object") {
        collected.push(item);
      }
    });
  });

  return collected;
};

const resolveInvoiceStage = (value) => {
  const stage = String(value || "initial").toLowerCase();
  return ["initial", "first", "second", "third", "final"].includes(stage) ? stage : "initial";
};

const computePaidForTypeOfWork = (invoiceDocuments, stage, typeOfWork) => {
  const normalizedStage = resolveInvoiceStage(stage);
  const normalizedTypeOfWork = String(typeOfWork || "").trim().toLowerCase();

  if (!normalizedTypeOfWork || !Array.isArray(invoiceDocuments)) {
    return 0;
  }

  return invoiceDocuments.reduce((total, document) => {
    const category = String(document?.category || "").toLowerCase();
    const status = String(document?.status || "").toLowerCase();
    const documentStage = resolveInvoiceStage(document?.invoice_stage ?? document?.payment_stage);
    const documentType = String(document?.type_of_work ?? document?.typeOfWork ?? "").trim().toLowerCase();
    const paidAmount = Number(document?.paid_amount ?? 0);

    if (category !== "invoices" || status === "deleted") {
      return total;
    }

    if (documentStage !== normalizedStage || documentType !== normalizedTypeOfWork) {
      return total;
    }

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return total;
    }

    return total + paidAmount;
  }, 0);
};

const computeRemainingForTypeOfWork = (caseTypeFeeJson, invoiceDocuments, stage, typeOfWork) => {
  const expectedAmount = computeExpectedForTypeOfWork(caseTypeFeeJson, stage, typeOfWork);
  if (expectedAmount === null) {
    return null;
  }

  const paidAmount = computePaidForTypeOfWork(invoiceDocuments, stage, typeOfWork);
  return Math.max(expectedAmount - paidAmount, 0);
};

const computeStageRemainingTotal = (caseTypeFeeJson, invoiceDocuments, stage) => {
  const items = getStageFeeItems(caseTypeFeeJson, stage);
  if (items.length === 0) {
    return null;
  }

  const dedupedTypes = new Set();
  let total = 0;

  items.forEach((item) => {
    const rawType = String(item?.typeOfWork || item?.type_of_work || "").trim();
    const normalizedType = rawType.toLowerCase();
    if (!normalizedType || dedupedTypes.has(normalizedType)) {
      return;
    }

    dedupedTypes.add(normalizedType);
    const remaining = computeRemainingForTypeOfWork(caseTypeFeeJson, invoiceDocuments, stage, rawType);
    total += Number.isFinite(remaining) ? Number(remaining) : 0;
  });

  return Number(total.toFixed(2));
};

const resolveInvoicePhaseSnapshot = ({ stage, currentCase, prefillData }) => {
  const resolvedStage = resolveInvoiceStage(stage);
  const expectedPhases =
    prefillData?.expected_payment_phases || prefillData?.case_data?.expected_payment_phases || currentCase?.expected_payment_phases || null;
  const invoicePhases =
    prefillData?.invoice_payment_phases || prefillData?.case_data?.invoice_payment_phases || currentCase?.invoice_payment_phases || null;

  const invoiceStageSnapshot = invoicePhases?.[resolvedStage] || null;
  const phaseExpected = toPositiveNumber(invoiceStageSnapshot?.expected);
  const phasePaid = toPositiveNumber(invoiceStageSnapshot?.paid);
  const phaseBalance = toPositiveNumber(invoiceStageSnapshot?.balance);
  const expectedFallback = toPositiveNumber(expectedPhases?.[resolvedStage]);
  const baseExpectedAmount = phaseExpected ?? expectedFallback ?? 0;
  const paidAmount = phasePaid ?? 0;
  const balanceAmount = phaseBalance ?? Math.max(baseExpectedAmount - paidAmount, 0);

  // For new invoices, prefill expected_amount with the remaining amount due for that stage.
  const expectedAmount = balanceAmount;

  return {
    stage: resolvedStage,
    expectedAmount,
    paidAmount,
    balanceAmount,
  };
};

const normalizeBlobFolderPath = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  return raw.endsWith("/") ? raw : `${raw}/`;
};

const resolveFieldPrefillValue = ({ fieldName, prefillData, currentCase, currentCaseId }) => {
  if (!fieldName) return undefined;

  if (hasOwn(prefillData, fieldName)) {
    return prefillData[fieldName];
  }

  const aliasByFieldName = {
    recipientName: ["client_name", "ClientName", "case_data.clientName", "case_data.client_name", "case_data.clientName", "case_data.client_name"],
    companyName: ["RecipientCompanyName", "case_data.clientFirmID", "case_data.client_firm_id", "case_data.clientId", "clientID"],
    subject: ["case_title", "caseTitle", "case_data.title", "title"],
    message: ["case_data.description", "description", "case_data.title", "case_title"],
    senderName: ["LawyerName", "YourSignerName", "case_data.lawyerName", "lawyerName", "preparedBy"],
    senderTitle: ["YourSignerTitle"],
    managerName: ["LawyerName", "YourSignerName", "case_data.lawyerName", "lawyerName"],
    reason: ["case_data.description", "description", "BackgroundFacts", "case_data.title", "case_title"],
    meetingTitle: ["case_data.title", "case_title", "title", "Reference"],
    agenda: ["case_data.description", "description", "BackgroundFacts", "case_data.title", "case_title"],
    projectName: ["case_data.title", "case_title", "title", "Reference"],
    progress: ["case_data.description", "description", "case_data.title", "case_title"],
    reportTitle: ["case_data.title", "case_title", "title", "Reference"],
    preparedBy: ["LawyerName", "YourSignerName", "case_data.lawyerName", "lawyerName"],
    objective: ["case_data.description", "description", "BackgroundFacts", "case_data.title", "case_title"],
    CaseNumber: ["case_id", "caseId", "case_data.caseId", "case_data.case_id"],
    WritCaseNumber: ["CaseNumber", "case_id", "caseId", "case_data.caseId", "case_data.case_id", "case_data.caseNumber", "caseNumber"],
    WritCaseYear: ["case_data.year", "year"],
    CaseNoReference: ["WritCaseNumber", "CaseNumber", "case_data.caseNumber", "caseNumber"],
    CaseYear: ["WritCaseYear", "case_data.year", "year"],
    PlaintiffName: ["client_name", "ClientName", "case_data.clientName", "case_data.client_name"],
    Defendant1Name: ["DefendantName"],
    Defendant1NRIC: ["DefendantNRIC"],
    PlaintiffFirmName: ["LawFirmName", "YourCompanyName", "LawyerName", "case_data.lawyerName", "lawyerName"],
    PlaintiffSolicitor: ["LawyerName", "YourSignerName", "case_data.lawyerName", "lawyerName"],
    FilingFirmAddress: ["PlaintiffFirmAddress", "LawFirmAddress", "case_data.lawyerAddress", "lawyerAddress"],
    FilingFirmTel: ["LawyerPhone", "ContactPhone", "case_data.lawyerPhone", "lawyerPhone"],
    FilingFirmEmail: ["LawyerEmail", "ContactEmail", "case_data.lawyerEmail", "lawyerEmail"],
    FilingReference: ["CourtSealReference", "Reference", "case_data.title", "case_title", "title"],
    FirmAddress: ["FilingFirmAddress", "PlaintiffFirmAddress", "LawFirmAddress", "case_data.lawyerAddress", "lawyerAddress"],
    RegistrarCourt: ["CourtName", "CourtLocation"],
    Place: ["CourtLocation", "CourtPlace2"],
    CourtPlace2: ["CourtLocation", "Place"],
    AppearanceDays: ["AppearanceDays"],
    AppearanceDaysWord: ["AppearanceDaysWord"],
    WitnessYear: ["WitnessYear", "year", "case_data.year"],
    DamagesAmount: ["GeneralDamagesAmount", "ClaimAmount"],
    SDamagesText: ["SpecialDamagesText", "SDamagesText"],
    InterestRate: ["InterestRate"],
    InterestFromText: ["InterestFromText"],
    CostsActionText: ["CostsActionText"],
    OtherReliefText: ["OtherReliefText"],
    InitialCostsAmount: ["InitialCostsAmount"],
    SubstitutedServiceCostsAmount: ["SubstitutedServiceCostsAmount"],
    OpponentLawyer: ["OpponentLawyer"],
    PostagePrice: ["PostagePrice"],
    GeneralDamagesAmount: ["ClaimAmount"],
    Defendant1Address: ["DefendantAddressLine1", "DefendantAddressLine2"],
    ClaimDescription: ["case_data.description", "description", "BackgroundFacts", "case_data.title", "case_title"],
    BreachDetails: ["case_data.description", "description", "BackgroundFacts", "case_data.title", "case_title"],
    LawFirmName: ["YourCompanyName", "LawyerName", "case_data.lawyerName", "lawyerName"],
    LawyerName: ["LawyerName", "YourSignerName", "case_data.lawyerName", "lawyerName"],
    ContactPhone: ["LawyerPhone", "case_data.lawyerPhone", "lawyerPhone"],
    ContactEmail: ["LawyerEmail", "case_data.lawyerEmail", "lawyerEmail"],
    YourSignerName: ["LawyerName", "case_data.lawyerName", "lawyerName"],
    CaseDescription: ["case_data.description", "description", "BackgroundFacts", "case_data.title", "case_title"],
    Reference: ["case_data.title", "case_title", "title"],
    GoodsOrServices: ["case_data.description", "description", "case_data.title", "case_title"],
    ClientName: ["client_name", "case_data.clientName", "case_data.client_name"],
    case_id: ["case_id", "caseId", "case_data.caseId", "case_data.case_id", "case_data.caseNumber", "caseNumber"],
    case_title: ["case_title", "caseTitle", "case_data.title", "title"],
    clientID: ["clientID", "case_data.clientFirmID", "clientFirmID", "case_data.clientID", "case_data.clientId"],
    lawyerID: ["lawyerID", "case_data.lawyerFirmID", "lawyerFirmID", "case_data.lawyerID", "case_data.lawyerId"],
  };

  const aliases = aliasByFieldName[fieldName] || [];
  const fromAliases = firstDefined(...aliases.map((path) => readPath(prefillData, path)));
  if (fromAliases !== undefined) {
    return fromAliases;
  }

  const caseFallbackByFieldName = {
    recipientName: () => currentCase?.clientName,
    companyName: () => currentCase?.clientFirmID || currentCase?.clientId,
    subject: () => currentCase?.title,
    message: () => currentCase?.description || currentCase?.title,
    senderName: () => currentCase?.lawyerName,
    managerName: () => currentCase?.lawyerName,
    reason: () => currentCase?.description || currentCase?.title,
    meetingTitle: () => currentCase?.title,
    agenda: () => currentCase?.description || currentCase?.title,
    projectName: () => currentCase?.title,
    progress: () => currentCase?.description || currentCase?.title,
    reportTitle: () => currentCase?.title,
    preparedBy: () => currentCase?.lawyerName,
    objective: () => currentCase?.description || currentCase?.title,
    CaseNumber: () => currentCase?.caseId || currentCaseId,
    WritCaseNumber: () => currentCase?.caseId || currentCaseId,
    WritCaseYear: () => new Date().getFullYear(),
    CaseNoReference: () => currentCase?.caseNumber || currentCase?.caseId || currentCaseId,
    CaseYear: () => new Date().getFullYear(),
    PlaintiffName: () => currentCase?.clientName,
    PlaintiffFirmName: () => currentCase?.lawyerName,
    PlaintiffSolicitor: () => currentCase?.lawyerName,
    FilingReference: () => currentCase?.title,
    FirmAddress: () => currentCase?.lawyerAddress,
    FilingFirmAddress: () => currentCase?.lawyerAddress,
    FilingFirmTel: () => currentCase?.lawyerPhone,
    FilingFirmEmail: () => currentCase?.lawyerEmail,
    GeneralDamagesAmount: () => undefined,
    ClaimDescription: () => currentCase?.description || currentCase?.title,
    BreachDetails: () => currentCase?.description || currentCase?.title,
    LawFirmName: () => currentCase?.lawyerName,
    LawyerName: () => currentCase?.lawyerName,
    Place: () => currentCase?.courtLocation,
    CourtPlace2: () => currentCase?.courtLocation,
    WitnessYear: () => new Date().getFullYear(),
    AppearanceDays: () => 14,
    DamagesAmount: () => undefined,
    SDamagesText: () => "Gantirugi Khas",
    InterestRate: () => "5",
    InterestFromText: () => "dari tarikh penghakiman sehingga penyelesaian penuh",
    CostsActionText: () => "Kos tindakan",
    OtherReliefText: () => "Apa-apa relif yang difikirkan sesuai dan adil oleh mahkamah",
    InitialCostsAmount: () => "225.00",
    SubstitutedServiceCostsAmount: () => "60.00",
    OpponentLawyer: () => "",
    PostagePrice: () => "",
    ContactPhone: () => currentCase?.lawyerPhone,
    ContactEmail: () => currentCase?.lawyerEmail,
    YourSignerName: () => currentCase?.lawyerName,
    Reference: () => currentCase?.title,
    GoodsOrServices: () => currentCase?.description || currentCase?.title,
    ClientName: () => currentCase?.clientName,
    case_id: () => currentCase?.caseId || currentCase?.id || currentCaseId,
    case_title: () => currentCase?.title,
    clientID: () => currentCase?.clientFirmID || currentCase?.clientID || currentCase?.clientId,
    lawyerID: () => currentCase?.lawyerFirmID || currentCase?.lawyerID || currentCase?.lawyerId,
  };

  const resolver = caseFallbackByFieldName[fieldName];
  if (typeof resolver === "function") {
    return resolver();
  }

  return undefined;
};

const emitCaseProgressUpdate = (caseId, caseProgress) => {
  if (!window.parent || window.parent === window) {
    return;
  }

  const parsedProgress = Number(caseProgress);
  if (!Number.isFinite(parsedProgress)) {
    return;
  }

  window.parent.postMessage(
    {
      type: "ASLAW_CASE_PROGRESS_UPDATED",
      case_id: Number(caseId || 0),
      case_progress: parsedProgress,
    },
    "*"
  );
};

const sanitizeUploadTitle = (rawTitle) => {
  const normalized = String(rawTitle || "").trim();
  if (!normalized) {
    return "";
  }

  const withoutControlChars = Array.from(normalized)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 0 && code <= 31 ? " " : char;
    })
    .join("");

  return withoutControlChars
    .replace(/[<>:"/\\|?*]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();
};

const resolveFileExtension = (fileName, fallback = "pdf") => {
  const source = String(fileName || "").trim();
  const dotIndex = source.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === source.length - 1) {
    return fallback;
  }

  return source.slice(dotIndex + 1).toLowerCase();
};

const resolveUploadFileName = ({ templateId, uploadTitle, invoiceNumber, sourceFileName }) => {
  const extension = resolveFileExtension(sourceFileName, "pdf");

  if (templateId === "invoice") {
    const invoiceStem = sanitizeInvoiceFileStem(invoiceNumber);
    if (invoiceStem) {
      return `${invoiceStem}.${extension}`;
    }

    const fallbackStem = sanitizeUploadTitle(String(sourceFileName || "").replace(/\.[^.]+$/, ""));
    if (fallbackStem) {
      return `${fallbackStem}.${extension}`;
    }

    return `invoice-${Date.now()}.${extension}`;
  }

  return `${uploadTitle}.${extension}`;
};

const TemplateForm = () => {
  const { id } = useParams();
  const template = templates.find((t) => t.id === id);

  const [formData, setFormData] = useState({});
  const [generatedContent, setGeneratedContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncStatusMessage, setSyncStatusMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [uploadingToCase, setUploadingToCase] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState("");
  const [showUploadPlaceholderModal, setShowUploadPlaceholderModal] = useState(false);
  const [uploadDocumentPlaceholder, setUploadDocumentPlaceholder] = useState(DEFAULT_DOCUMENT_PLACEHOLDER);
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [fetchedCaseTypeFeeJson, setFetchedCaseTypeFeeJson] = useState(null);
  const [fetchedCaseInvoiceDocuments, setFetchedCaseInvoiceDocuments] = useState([]);

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const prefillData = useMemo(() => parsePrefillData(searchParams.get("prefill")), [searchParams]);
  const currentCaseId = Number(searchParams.get("case_id") || searchParams.get("caseId") || 0);
  const queryCaseStatus = (searchParams.get("case_status") || "").toLowerCase();
  const queryBlobFolderPath = searchParams.get("blob_folder_path") || "";
  const queryAccessToken = searchParams.get("access_token") || "";
  const returnToUrl = searchParams.get("return_to") || "";

  const templateCategory = (() => {
    const normalized = String(template?.category || "").toLowerCase();
    if (normalized === "documents" || normalized === "reports" || normalized === "invoices") {
      return normalized;
    }
    return "documents";
  })();

  const prefilledCase = useMemo(() => {
    const fromPrefill = prefillData?.case_data;
    if (fromPrefill && (fromPrefill.caseId || fromPrefill.case_id)) {
      return fromPrefill;
    }

    if (!currentCaseId) {
      return null;
    }

    return {
      caseId: currentCaseId,
      case_id: currentCaseId,
      caseNumber: prefillData?.case_data?.caseNumber ?? prefillData?.caseNumber ?? "",
      title: prefillData?.case_title || "",
      status: queryCaseStatus || "",
      blob_folder_path: queryBlobFolderPath || "",
      clientId: prefillData?.case_data?.clientId ?? prefillData?.case_data?.clientID ?? prefillData?.clientID,
      clientID: prefillData?.case_data?.clientID ?? prefillData?.case_data?.clientId ?? prefillData?.clientID,
      lawyerId: prefillData?.case_data?.lawyerId ?? prefillData?.case_data?.lawyerID ?? prefillData?.lawyerID,
      lawyerID: prefillData?.case_data?.lawyerID ?? prefillData?.case_data?.lawyerId ?? prefillData?.lawyerID,
      case_type_fee_json:
        prefillData?.case_type_fee_json ??
        prefillData?.caseTypeFeeJson ??
        prefillData?.case_data?.case_type_fee_json ??
        prefillData?.case_data?.caseTypeFeeJson ??
        null,
      expected_payment_phases: prefillData?.expected_payment_phases || null,
    };
  }, [currentCaseId, prefillData, queryBlobFolderPath, queryCaseStatus]);

  const currentCase = useMemo(() => {
    const fallbackCase = prefilledCase;
    if (!currentCaseId) return null;

    try {
      const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!rawUser) return fallbackCase;
      const parsedUser = JSON.parse(rawUser);

      const cases = Array.isArray(parsedUser?.cases) ? parsedUser.cases : [];
      return cases.find((c) => Number(c.caseId) === Number(currentCaseId)) || fallbackCase;
    } catch {
      return fallbackCase;
    }
  }, [currentCaseId, prefilledCase]);

  const prefilledCaseTypeFeeJson = useMemo(
    () => resolveCaseTypeFeeJson(prefillData, currentCase),
    [prefillData, currentCase]
  );

  const invoiceCaseTypeFeeJson = useMemo(
    () => prefilledCaseTypeFeeJson || fetchedCaseTypeFeeJson,
    [prefilledCaseTypeFeeJson, fetchedCaseTypeFeeJson]
  );

  const invoiceCaseDocuments = useMemo(
    () =>
      extractInvoiceDocuments(
        prefillData?.encrypted_documents,
        prefillData?.case_data?.encrypted_documents,
        currentCase?.encrypted_documents,
        fetchedCaseInvoiceDocuments
      ),
    [prefillData, currentCase, fetchedCaseInvoiceDocuments]
  );

  useEffect(() => {
    if (template?.id !== "invoice") {
      return;
    }

    const resolvedCaseId = resolveFirstPositiveInteger(
      currentCaseId,
      currentCase?.caseId,
      prefillData?.case_data?.caseId,
      prefillData?.case_data?.case_id,
      prefillData?.caseId,
      prefillData?.case_id,
      formData.case_id
    );

    if (!Number.isFinite(resolvedCaseId) || resolvedCaseId <= 0) {
      return;
    }

    const token = queryAccessToken || localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      return;
    }

    let isCancelled = false;

    const loadCaseFeeJson = async () => {
      try {
        const response = await fetch(`${MAIN_API_URL}/cases/${resolvedCaseId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "include",
        });

        if (!response.ok || isCancelled) {
          return;
        }

        const payload = await response.json();
        const apiFeeJson = resolveCaseTypeFeeJson(payload, payload?.case);
        if (!isCancelled && apiFeeJson) {
          setFetchedCaseTypeFeeJson(apiFeeJson);
        }
        if (!isCancelled) {
          const apiDocuments = extractInvoiceDocuments(payload?.encrypted_documents, payload?.case?.encrypted_documents);
          setFetchedCaseInvoiceDocuments(apiDocuments);
        }
      } catch {
        // Keep form usable even if fallback fetch fails.
      }
    };

    void loadCaseFeeJson();

    return () => {
      isCancelled = true;
    };
  }, [
    template?.id,
    currentCaseId,
    currentCase,
    prefillData,
    formData.case_id,
    queryAccessToken,
  ]);

  const resolvedTemplate = useMemo(() => {
    if (!template || template.id !== "invoice") {
      return template;
    }

    const stage = resolveInvoiceStage(formData.payment_stage);
    const typeOfWorkOptions = getStageTypeOfWorkOptions(invoiceCaseTypeFeeJson, stage);

    return {
      ...template,
      fields: template.fields.map((field) => {
        if (field.name !== "type_of_work") {
          return field;
        }

        return {
          ...field,
          required: false,
          options: typeOfWorkOptions.map((item) => ({ value: item, label: item })),
        };
      }),
    };
  }, [template, formData.payment_stage, invoiceCaseTypeFeeJson]);

  const isArchivedCase =
    (queryCaseStatus || String(currentCase?.status || "").toLowerCase()) === "archived";
  const canUploadToCase = !isArchivedCase;

  const caseInfoSummary = useMemo(() => {
    const resolvedCaseId = String(
      firstDefined(
        prefillData?.case_id,
        prefillData?.caseId,
        prefillData?.case_data?.case_id,
        prefillData?.case_data?.caseId,
        currentCase?.caseId,
        currentCaseId || ""
      ) || ""
    );

    const resolvedTitle = String(
      firstDefined(
        prefillData?.case_title,
        prefillData?.caseTitle,
        prefillData?.case_data?.title,
        currentCase?.title,
        ""
      ) || ""
    );

    const resolvedStatus = String(
      firstDefined(
        prefillData?.case_status,
        prefillData?.case_data?.status,
        currentCase?.status,
        ""
      ) || ""
    );

    const resolvedClient = String(
      firstDefined(
        prefillData?.client_name,
        prefillData?.ClientName,
        prefillData?.recipientName,
        prefillData?.RecipientName,
        prefillData?.case_data?.clientName,
        currentCase?.clientName,
        ""
      ) || ""
    );

    const resolvedLawyer = String(
      firstDefined(
        prefillData?.senderName,
        prefillData?.LawyerName,
        prefillData?.YourSignerName,
        prefillData?.case_data?.lawyerName,
        currentCase?.lawyerName,
        ""
      ) || ""
    );

    const resolvedDescription = String(
      firstDefined(
        prefillData?.message,
        prefillData?.BackgroundFacts,
        prefillData?.case_data?.description,
        currentCase?.description,
        ""
      ) || ""
    );

    return {
      caseId: resolvedCaseId,
      title: resolvedTitle,
      status: resolvedStatus,
      clientName: resolvedClient,
      lawyerName: resolvedLawyer,
      description: resolvedDescription,
    };
  }, [prefillData, currentCase, currentCaseId]);

  const resolvedBlobFolderPath = queryBlobFolderPath || currentCase?.blob_folder_path || "";

  // Initialize form data with basic fields and case_id from URL
  useEffect(() => {
    if (!template) return;

    setPrefillLoading(true);

    const initialData = {};
    template.fields.forEach((field) => {
      const resolvedPrefillValue = resolveFieldPrefillValue({
        fieldName: field.name,
        prefillData,
        currentCase,
        currentCaseId,
      });

      if (field.type === "checkbox") {
        initialData[field.name] = Boolean(resolvedPrefillValue ?? field.defaultValue);
      } else if (field.type === "defendants") {
        initialData[field.name] = [];
      } else if (field.type === "date") {
        initialData[field.name] = resolvedPrefillValue || new Date().toISOString().slice(0, 10);
      } else {
        initialData[field.name] = resolvedPrefillValue ?? field.defaultValue ?? "";
      }
    });

    if (template.id === "writ-of-summons") {
      const defendantCandidates = [
        {
          name: String(initialData.Defendant1Name || "").trim(),
          nric: String(initialData.Defendant1NRIC || "").trim(),
          address: String(initialData.Defendant1Address || "").trim(),
        },
        {
          name: String(initialData.Defendant2Name || "").trim(),
          nric: String(initialData.Defendant2NRIC || "").trim(),
          address: String(initialData.Defendant2Address || "").trim(),
        },
      ].filter((item) => item.name || item.nric || item.address);

      initialData.Defendants = defendantCandidates.length > 0 ? defendantCandidates : [{ name: "", nric: "", address: "" }];

      const normalizedDate = String(initialData.Date || "").trim();
      if (normalizedDate && String(initialData.EndorsementDate || "").trim() === "") {
        initialData.EndorsementDate = normalizedDate;
      }
    }

    if (initialData.upload_title === undefined) {
      initialData.upload_title = "";
    }

    setFormData(initialData);
    setPrefillLoading(false);
  }, [template, prefillData, currentCase, currentCaseId]);

  useEffect(() => {
    if (template?.id !== "writ-of-summons") {
      return;
    }

    setFormData((prev) => {
      const normalizedDate = String(prev.Date || "").trim();
      const appearanceDays = String(prev.AppearanceDays || "14").trim() || "14";
      const next = {
        ...prev,
        EndorsementDate: normalizedDate || prev.EndorsementDate || "",
        CaseNoReference: String(prev.CaseNoReference || prev.WritCaseNumber || "").trim(),
        CaseYear: String(prev.CaseYear || prev.WritCaseYear || "").trim(),
        AppearanceDaysWord: String(prev.AppearanceDaysWord || toMalayDayWord(appearanceDays)).trim(),
        FirmAddress: String(prev.FirmAddress || prev.FilingFirmAddress || prev.PlaintiffFirmAddress || "").trim(),
        LawyerName: String(prev.LawyerName || prev.PlaintiffSolicitor || "").trim(),
      };

      const changed =
        next.EndorsementDate !== prev.EndorsementDate ||
        next.CaseNoReference !== prev.CaseNoReference ||
        next.CaseYear !== prev.CaseYear ||
        next.AppearanceDaysWord !== prev.AppearanceDaysWord ||
        next.FirmAddress !== prev.FirmAddress ||
        next.LawyerName !== prev.LawyerName;

      return changed ? next : prev;
    });
  }, [
    template?.id,
    formData.Date,
    formData.AppearanceDays,
    formData.WritCaseNumber,
    formData.WritCaseYear,
    formData.FilingFirmAddress,
    formData.PlaintiffFirmAddress,
    formData.PlaintiffSolicitor,
  ]);

  const handleDefendantsChange = (nextDefendants) => {
    const normalized = normalizeDefendantsArray(nextDefendants, { dropEmpty: false });
    const bounded = normalized.length > 0 ? normalized : [{ name: "", nric: "", address: "" }];
    const first = bounded[0] || { name: "", nric: "", address: "" };
    const second = bounded[1] || { name: "", nric: "", address: "" };

    setFormData((prev) => ({
      ...prev,
      Defendants: bounded,
      Defendant1Name: first.name,
      Defendant1NRIC: first.nric,
      Defendant1Address: first.address,
      Defendant2Name: second.name,
      Defendant2NRIC: second.nric,
      Defendant2Address: second.address,
    }));
  };

  useEffect(() => {
    if (template?.id !== "invoice") {
      return;
    }

    setFormData((prev) => {
      const stageSnapshot = resolveInvoicePhaseSnapshot({
        stage: prev.payment_stage,
        currentCase,
        prefillData,
      });
      const stage = stageSnapshot.stage;
      const stageTypeOfWorkOptions = getStageTypeOfWorkOptions(invoiceCaseTypeFeeJson, stage);
      const currentTypeOfWork = String(prev.type_of_work || "").trim();
      const nextTypeOfWork =
        currentTypeOfWork && stageTypeOfWorkOptions.includes(currentTypeOfWork)
          ? currentTypeOfWork
          : stageTypeOfWorkOptions[0] || "";
      const typeOfWorkRemainingAmount = computeRemainingForTypeOfWork(
        invoiceCaseTypeFeeJson,
        invoiceCaseDocuments,
        stage,
        nextTypeOfWork
      );
      const resolvedExpectedAmount =
        typeOfWorkRemainingAmount !== null
          ? Number(typeOfWorkRemainingAmount.toFixed(2))
          : stageSnapshot.expectedAmount;
      const resolvedBalanceAmount = resolvedExpectedAmount;
      const stageRemainingTotal = computeStageRemainingTotal(
        invoiceCaseTypeFeeJson,
        invoiceCaseDocuments,
        stage
      );
      const resolvedPhaseBalanceBase =
        stageRemainingTotal !== null ? stageRemainingTotal : Number(stageSnapshot.balanceAmount || 0);
      const didStageOrTypeChange =
        stage !== prev.payment_stage ||
        nextTypeOfWork !== prev.type_of_work;

      const resolvedClientId = firstDefined(
        prev.clientID,
        prefillData?.case_data?.clientFirmID,
        prefillData?.clientFirmID,
        prefillData?.clientID,
        prefillData?.case_data?.clientID,
        prefillData?.case_data?.clientId,
        currentCase?.clientFirmID,
        currentCase?.clientID,
        currentCase?.clientId,
        ""
      );

      const resolvedLawyerId = firstDefined(
        prev.lawyerID,
        prefillData?.case_data?.lawyerFirmID,
        prefillData?.lawyerFirmID,
        prefillData?.lawyerID,
        prefillData?.case_data?.lawyerID,
        prefillData?.case_data?.lawyerId,
        currentCase?.lawyerFirmID,
        currentCase?.lawyerID,
        currentCase?.lawyerId,
        ""
      );

      const next = {
        ...prev,
        payment_stage: stage,
        type_of_work: nextTypeOfWork,
        clientID: resolvedClientId,
        lawyerID: resolvedLawyerId,
        expected_amount: String(resolvedExpectedAmount),
        balance: String(resolvedBalanceAmount),
        phase_balance_base: String(resolvedPhaseBalanceBase),
        phase_balance: String(resolvedPhaseBalanceBase),
        paid_amount: didStageOrTypeChange ? "" : prev.paid_amount,
        blob_path:
          String(prev.blob_path || "").trim() ||
          String(prefillData?.blob_path || "").trim() ||
          `${normalizeBlobFolderPath(
            firstDefined(
              prefillData?.case_data?.blob_folder_path,
              queryBlobFolderPath,
              currentCase?.blob_folder_path,
              ""
            )
          )}invoices/`,
      };

      const isChanged =
        next.payment_stage !== prev.payment_stage ||
        next.type_of_work !== prev.type_of_work ||
        next.clientID !== prev.clientID ||
        next.lawyerID !== prev.lawyerID ||
        next.expected_amount !== prev.expected_amount ||
        next.balance !== prev.balance ||
        next.phase_balance_base !== prev.phase_balance_base ||
        next.phase_balance !== prev.phase_balance ||
        next.paid_amount !== prev.paid_amount ||
        next.blob_path !== prev.blob_path;

      return isChanged ? next : prev;
    });
  }, [
    template?.id,
    currentCase,
    prefillData,
    invoiceCaseTypeFeeJson,
    invoiceCaseDocuments,
    formData.payment_stage,
    formData.type_of_work,
    queryBlobFolderPath,
  ]);

  useEffect(() => {
    if (template?.id !== "invoice") {
      return;
    }

    if (String(formData.invoice_number || "").trim() !== "") {
      return;
    }

    const resolvedCaseId = resolveFirstPositiveInteger(
      currentCaseId,
      currentCase?.caseId,
      prefillData?.case_data?.caseId,
      prefillData?.case_data?.case_id,
      prefillData?.caseId,
      prefillData?.case_id,
      formData.case_id
    );

    if (!Number.isFinite(resolvedCaseId) || resolvedCaseId <= 0) {
      return;
    }

    let isCancelled = false;

    const generateInvoiceNumber = async () => {
      try {
        const response = await fetch(`${MAIN_API_URL}/invoices/generate-number`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ case_id: resolvedCaseId }),
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const nextInvoiceNumber = String(payload?.invoice_number || "").trim();
        if (!nextInvoiceNumber || isCancelled) {
          return;
        }

        setFormData((prev) => {
          if (String(prev.invoice_number || "").trim() !== "") {
            return prev;
          }

          return {
            ...prev,
            invoice_number: nextInvoiceNumber,
          };
        });
      } catch {
        // Keep form usable even if the helper endpoint is unavailable.
      }
    };

    void generateInvoiceNumber();

    return () => {
      isCancelled = true;
    };
  }, [template?.id, formData.invoice_number, formData.case_id, prefillData, currentCase, currentCaseId]);

  useEffect(() => {
    if (template?.id !== "invoice") {
      return;
    }

    setFormData((prev) => {
      const expectedAmount = Number(prev.expected_amount || 0);
      const paidAmount = Number(prev.paid_amount || 0);
      const phaseBalanceBase = Number(prev.phase_balance_base || 0);

      const safeExpected = Number.isFinite(expectedAmount) ? expectedAmount : 0;
      const safePaidRaw = Number.isFinite(paidAmount) ? paidAmount : 0;
      const safePaid = Math.max(safePaidRaw, 0);
      const computedTypeOfWorkBalance = Math.max(safeExpected - safePaid, 0);
      const safePhaseBalanceBase = Number.isFinite(phaseBalanceBase) ? phaseBalanceBase : 0;
      const phaseBalanceFromTypeOfWork = Math.max(safePhaseBalanceBase - safePaid, 0);
      const nextBalance = String(computedTypeOfWorkBalance);
      const nextPhaseBalance = String(phaseBalanceFromTypeOfWork);
      const nextPaid = String(safePaid);

      if (
        String(prev.balance || "") === nextBalance &&
        String(prev.phase_balance || "") === nextPhaseBalance &&
        String(prev.paid_amount || "") === nextPaid
      ) {
        return prev;
      }

      return {
        ...prev,
        paid_amount: nextPaid,
        balance: nextBalance,
        phase_balance: nextPhaseBalance,
      };
    });
  }, [
    template?.id,
    formData.expected_amount,
    formData.paid_amount,
    formData.phase_balance_base,
    formData.payment_stage,
  ]);

  useEffect(() => {
    if (template?.id !== "invoice") {
      return;
    }

    setFormData((prev) => {
      const paidAmount = Number(prev.paid_amount || 0);
      const taxAmount = Number(prev.tax || 0);
      const discountAmount = Number(prev.discount || 0);

      const safePaid = Number.isFinite(paidAmount) ? paidAmount : 0;
      const safeTaxPercent = Number.isFinite(taxAmount) ? taxAmount : 0;
      const safeDiscountPercent = Number.isFinite(discountAmount) ? discountAmount : 0;

      const computedTotal =
        safePaid +
        (safePaid * safeTaxPercent) / 100 +
        -((safePaid * safeDiscountPercent) / 100);
      const nextTotal = String(computedTotal);

      if (String(prev.total_amount || "") === nextTotal) {
        return prev;
      }

      return {
        ...prev,
        total_amount: nextTotal,
      };
    });
  }, [template?.id, formData.paid_amount, formData.tax, formData.discount]);

  if (!template) {
    return (
      <div className="p-8 text-center">
        Template not found. <Link to={`/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} className="text-blue-600">Go Home</Link>
      </div>
    );
  }

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : "");
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file."));
      };
      reader.readAsDataURL(file);
    });

  const loadImageFromDataUrl = (dataUrl) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load image."));
      image.src = dataUrl;
    });

  const removeSignatureBackgroundFromDataUrl = async (dataUrl) => {
    if (!dataUrl.startsWith("data:image/")) {
      return dataUrl;
    }

    const image = await loadImageFromDataUrl(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, image.width);
    canvas.height = Math.max(1, image.height);

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return dataUrl;
    }

    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    const getPixelOffset = (x, y) => ((y * width + x) * 4);

    const luminance = new Uint8Array(width * height);
    let borderR = 0;
    let borderG = 0;
    let borderB = 0;
    let borderL = 0;
    let borderCount = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = getPixelOffset(x, y);
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const l = Math.max(0, Math.min(255, Math.round(0.299 * r + 0.587 * g + 0.114 * b)));
        const idx = y * width + x;
        luminance[idx] = l;

        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          borderR += r;
          borderG += g;
          borderB += b;
          borderL += l;
          borderCount += 1;
        }
      }
    }

    const backgroundR = borderCount > 0 ? borderR / borderCount : 255;
    const backgroundG = borderCount > 0 ? borderG / borderCount : 255;
    const backgroundB = borderCount > 0 ? borderB / borderCount : 255;
    const backgroundL = borderCount > 0 ? borderL / borderCount : 245;

    const visited = new Uint8Array(width * height);
    const backgroundMask = new Uint8Array(width * height);
    const queueX = new Int32Array(width * height);
    const queueY = new Int32Array(width * height);
    let head = 0;
    let tail = 0;

    const enqueue = (x, y) => {
      queueX[tail] = x;
      queueY[tail] = y;
      tail += 1;
    };

    const trySeed = (x, y) => {
      const idx = y * width + x;
      if (visited[idx]) {
        return;
      }

      const offset = getPixelOffset(x, y);
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const l = luminance[idx];
      const colorDistance = Math.sqrt(
        (r - backgroundR) ** 2 +
          (g - backgroundG) ** 2 +
          (b - backgroundB) ** 2
      );

      if (l >= Math.max(170, backgroundL - 35) || colorDistance <= 65) {
        visited[idx] = 1;
        backgroundMask[idx] = 1;
        enqueue(x, y);
      }
    };

    for (let x = 0; x < width; x += 1) {
      trySeed(x, 0);
      trySeed(x, height - 1);
    }

    for (let y = 0; y < height; y += 1) {
      trySeed(0, y);
      trySeed(width - 1, y);
    }

    while (head < tail) {
      const x = queueX[head];
      const y = queueY[head];
      head += 1;

      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];

      neighbors.forEach(([nx, ny]) => {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
          return;
        }

        const nIdx = ny * width + nx;
        if (visited[nIdx]) {
          return;
        }

        const offset = getPixelOffset(nx, ny);
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const l = luminance[nIdx];
        const colorDistance = Math.sqrt(
          (r - backgroundR) ** 2 +
            (g - backgroundG) ** 2 +
            (b - backgroundB) ** 2
        );

        if (l >= Math.max(160, backgroundL - 45) || colorDistance <= 58) {
          visited[nIdx] = 1;
          backgroundMask[nIdx] = 1;
          enqueue(nx, ny);
        }
      });
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = y * width + x;
        const offset = getPixelOffset(x, y);
        const l = luminance[idx];

        if (backgroundMask[idx]) {
          data[offset + 3] = 0;
          continue;
        }

        if (l >= 205) {
          data[offset + 3] = Math.min(data[offset + 3], 0);
          continue;
        }

        if (l >= 165) {
          const soft = 1 - ((l - 165) / 40);
          data[offset + 3] = Math.round(data[offset + 3] * Math.max(0, Math.min(1, soft)));
        }

        // Darken surviving strokes slightly so signatures stay visible after transparency processing.
        data[offset] = Math.max(0, Math.round(data[offset] * 0.7));
        data[offset + 1] = Math.max(0, Math.round(data[offset + 1] * 0.7));
        data[offset + 2] = Math.max(0, Math.round(data[offset + 2] * 0.7));
      }
    }

    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const selectedFile = files?.[0] || null;

      if (!selectedFile) {
        setFormData((prev) => ({
          ...prev,
          [name]: "",
        }));
        return;
      }

      (async () => {
        try {
          const rawDataUrl = await readFileAsDataUrl(selectedFile);
          const processedDataUrl =
            name === "SignedImageDataUrl"
              ? await removeSignatureBackgroundFromDataUrl(rawDataUrl)
              : rawDataUrl;

          setFormData((prev) => ({
            ...prev,
            [name]: processedDataUrl,
          }));
        } catch {
          setError("Failed to process selected signature image.");
        }
      })();

      return;
    }

    let finalValue = type === "checkbox" ? checked : value;

    if ((name === "tax" || name === "discount" || name === "paid_amount") && type === "number") {
      const num = parseFloat(value);
      if (!isNaN(num) && num < 0) finalValue = "0";
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const syncTemplateWorkbook = async (endpointPath, payload) => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}${endpointPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Optional sync: do not block user flow.
        return false;
      }

      await response.json();
      return true;
    } catch {
      return false;
    }
  };

  const requestInvoicePdfBlob = async () => {
    const normalizedInvoiceFormData = normalizeInvoiceApiFormData({
      formData,
      currentCaseId,
      currentCase,
      prefillData,
    });

    if (!normalizedInvoiceFormData) {
      return null;
    }

    const response = await fetch(`${BACKEND_BASE_URL}/generate-invoice-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData: normalizedInvoiceFormData, language: selectedLanguage }),
    });

    if (!response.ok) {
      return null;
    }

    const debugSource = response.headers.get("X-Document-Generator-Source") || "";
    const debugPdfBytes = response.headers.get("X-Document-Generator-PDF-Bytes") || "";
    const debugHtmlBytes = response.headers.get("X-Document-Generator-HTML-Bytes") || "";

    if (debugSource || debugPdfBytes || debugHtmlBytes) {
      console.debug("Invoice PDF debug metadata", {
        source: debugSource,
        pdfBytes: debugPdfBytes,
        htmlBytes: debugHtmlBytes,
      });
    }

    const blob = await response.blob();
    const contentType = String(response.headers.get("Content-Type") || "").toLowerCase();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const hasPdfMagic =
      bytes.length >= 4 &&
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46;   // F

    if (!contentType.includes("application/pdf") && !hasPdfMagic) {
      return null;
    }

    const normalizedBlob = blob.type === "application/pdf" ? blob : new Blob([buffer], { type: "application/pdf" });
    const fileName = resolveInvoicePdfFilename(response, normalizedInvoiceFormData, "Invoice_Template.pdf");

    return { blob: normalizedBlob, fileName };
  };

  const requestLodPdfBlob = async () => {
    const lodPdfConfig = templatePdfEndpointById["formal-letter"];
    if (!lodPdfConfig) {
      return null;
    }

    const response = await fetch(lodPdfConfig.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData, language: selectedLanguage }),
    });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const contentType = String(response.headers.get("Content-Type") || "").toLowerCase();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const hasPdfMagic =
      bytes.length >= 4 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46;

    if (!contentType.includes("application/pdf") && !hasPdfMagic) {
      return null;
    }

    const normalizedBlob = blob.type === "application/pdf" ? blob : new Blob([buffer], { type: "application/pdf" });
    const contentDisposition = response.headers.get("Content-Disposition");
    const fileName = getFileNameFromContentDisposition(
      contentDisposition,
      lodPdfConfig.fallbackFilename,
    );

    return { blob: normalizedBlob, fileName };
  };

  const requestWritPdfBlob = async () => {
    const writPdfConfig = templatePdfEndpointById["writ-of-summons"];
    if (!writPdfConfig) {
      return null;
    }

    const response = await fetch(writPdfConfig.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData: normalizeWritFormData(formData), language: selectedLanguage }),
    });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const contentType = String(response.headers.get("Content-Type") || "").toLowerCase();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const hasPdfMagic =
      bytes.length >= 4 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46;

    if (!contentType.includes("application/pdf") && !hasPdfMagic) {
      return null;
    }

    const normalizedBlob = blob.type === "application/pdf" ? blob : new Blob([buffer], { type: "application/pdf" });
    const contentDisposition = response.headers.get("Content-Disposition");
    const fileName = getFileNameFromContentDisposition(
      contentDisposition,
      writPdfConfig.fallbackFilename,
    );

    return { blob: normalizedBlob, fileName };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSyncStatusMessage("");
    setUploadStatusMessage("");

    try {
      const updatePreviewFromContent = (content, options = {}) => {
        const { createPdfPreview = true } = options;
        setGeneratedContent(content);

        if (!createPdfPreview) {
          return;
        }

        try {
          const previewPdf = buildPdfDocument(content);
          const previewBlob = previewPdf.output("blob");
          setPdfPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(previewBlob);
          });
        } catch {
          setPdfPreviewUrl("");
        }
      };

      const deterministicBuilder = deterministicTemplateBuilders[template.id];
      if (deterministicBuilder) {
        const isInvoiceTemplate = template.id === "invoice";
        const isLodTemplate = template.id === "formal-letter";
        const isWritTemplate = template.id === "writ-of-summons";
        const builtContent = deterministicBuilder(formData, selectedLanguage);
        updatePreviewFromContent(builtContent, {
          createPdfPreview: !isInvoiceTemplate && !isLodTemplate && !isWritTemplate,
        });

        if (!isInvoiceTemplate) {
          setShowPreview(true);
        }

        if (shouldRefineDeterministicTranslation(template.id, selectedLanguage)) {
          try {
            const translationPrompt = buildMalayDeterministicTranslationPrompt(builtContent);
            const translationResponse = await fetch(`${BACKEND_BASE_URL}/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: translationPrompt, language: "malay" }),
            });

            if (translationResponse.ok) {
              const translationPayload = await translationResponse.json();
              const translatedContent = String(translationPayload?.output || "").trim();
              if (translatedContent) {
                updatePreviewFromContent(translatedContent, {
                  createPdfPreview: !isInvoiceTemplate && !isLodTemplate && !isWritTemplate,
                });
              }
            }
          } catch {
            // Keep the deterministic Malay-labelled version if translation is unavailable.
          }
        }

        if (isInvoiceTemplate) {
          try {
            const invoicePdf = await requestInvoicePdfBlob();

            if (invoicePdf?.blob) {
              setPdfPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(invoicePdf.blob);
              });
            } else {
              // Fallback to local rendering when backend invoice preview is unavailable.
              updatePreviewFromContent(builtContent, { createPdfPreview: true });
            }
          } catch {
            // Fallback to local rendering when backend invoice preview is unavailable.
            updatePreviewFromContent(builtContent, { createPdfPreview: true });
          } finally {
            setShowPreview(true);
          }
        }

        if (isLodTemplate) {
          let hasBackendPreview = false;

          try {
            const lodPdf = await requestLodPdfBlob();

            if (lodPdf?.blob) {
              hasBackendPreview = true;
              setPdfPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(lodPdf.blob);
              });
            }
          } catch {
            // Handled below with an explicit message.
          } finally {
            if (hasBackendPreview) {
              setShowPreview(true);
            } else {
              setShowPreview(false);
              setError("Unable to load LOD template preview from backend. Please check /generate-lod-pdf.");
            }
          }

          return;
        }

        if (isWritTemplate) {
          let hasBackendPreview = false;

          try {
            const writPdf = await requestWritPdfBlob();

            if (writPdf?.blob) {
              hasBackendPreview = true;
              setPdfPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(writPdf.blob);
              });
            }
          } catch {
            // Handled below with an explicit message.
          } finally {
            if (hasBackendPreview) {
              setShowPreview(true);
            } else {
              setShowPreview(false);
              setError("Unable to load Writ template preview from backend. Please check /generate-writ-pdf.");
            }
          }

          return;
        }

        const silentDataSyncEndpointByTemplateId = {
          "writ-of-summons": "/generate-writ-data-xlsx",
        };

        const syncEndpoint = silentDataSyncEndpointByTemplateId[template.id];
        if (syncEndpoint) {
          void syncTemplateWorkbook(syncEndpoint, { formData }).then((syncSuccess) => {
            if (!syncSuccess) {
              setSyncStatusMessage(
                "Workbook sync is unavailable right now. Continue using preview/export as usual."
              );
            }
          });
        }

        return;
      }

      const languageInstruction =
        selectedLanguage === "malay"
          ? "Write the output in formal Malay (Bahasa Melayu) with professional grammar and vocabulary."
          : "Write the output in formal English with professional grammar and vocabulary.";

      const prompt = `${template.generate(
        formData
      )}\n\n${languageInstruction}\nMaintain a professional and formal tone throughout.`;

      const res = await fetch(`${BACKEND_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language: selectedLanguage }),
      });

      if (!res.ok) {
        let backendError = "AI generation failed";
        try {
          const errorPayload = await res.json();
          if (errorPayload?.error) {
            backendError = errorPayload.error;
          }
        } catch {
          // fallback message
        }

        throw new Error(backendError);
      }

      const data = await res.json();
      const aiContent = data.output;
      updatePreviewFromContent(aiContent);
      setShowPreview(true);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to generate content. Make sure backend & Ollama are running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildPdfDocument = (content = generatedContent) => {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setFont("times", "normal");
    pdf.setFontSize(12);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const lineHeight = 6;
    const maxLineWidth = pageWidth - margin * 2;
    const maxY = pageHeight - margin;

    const paragraphs = content.split("\n");
    let cursorY = margin;

    paragraphs.forEach((paragraph, paragraphIndex) => {
      const lines = paragraph.trim().length > 0 ? pdf.splitTextToSize(paragraph, maxLineWidth) : [""];

      lines.forEach((line) => {
        if (cursorY > maxY) {
          pdf.addPage();
          cursorY = margin;
        }

        pdf.text(line, margin, cursorY);
        cursorY += lineHeight;
      });

      if (paragraphIndex < paragraphs.length - 1) {
        if (cursorY > maxY) {
          pdf.addPage();
          cursorY = margin;
        } else {
          cursorY += lineHeight;
        }
      }
    });

    return pdf;
  };

  const handleExportPDF = () => {
    const templatePdfConfig = templatePdfEndpointById[template.id];

    if (templatePdfConfig) {
      (async () => {
        try {
          const payloadFormData =
            template.id === "invoice"
              ? normalizeInvoiceApiFormData({
                  formData,
                  currentCaseId,
                  currentCase,
                  prefillData,
                })
              : template.id === "writ-of-summons"
                ? normalizeWritFormData(formData)
                : formData;

          if (template.id === "invoice" && !payloadFormData) {
            throw new Error("Case ID is missing. Open this template from a valid case and try again.");
          }

          const response = await fetch(templatePdfConfig.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formData: payloadFormData, language: selectedLanguage }),
          });

          if (!response.ok) {
            const responseMessage = await resolveResponseErrorMessage(
              response,
              "Failed to generate template PDF"
            );
            throw new Error(responseMessage);
          }

          const blob = await response.blob();
          const contentDisposition = response.headers.get("Content-Disposition");
          const fileName = getFileNameFromContentDisposition(
            contentDisposition,
            templatePdfConfig.fallbackFilename,
          );
          saveAs(blob, fileName);
        } catch (err) {
          console.error(err);
          if (err?.message === INVOICE_NUMBER_CONFLICT_MESSAGE) {
            setError(INVOICE_NUMBER_CONFLICT_MESSAGE);
          } else {
            setError(templatePdfConfig.errorText);
          }
        }
      })();

      return;
    }

    const pdf = buildPdfDocument();
    pdf.save(`${template.id}.pdf`);
  };

  const handleUploadPdfToCase = async () => {
    if (!currentCaseId) {
      setUploadStatusMessage("This upload is available when opened from Update Case.");
      return;
    }

    if (isArchivedCase) {
      setUploadStatusMessage("This case is archived. Upload is locked.");
      return;
    }

    if (!generatedContent.trim()) {
      setUploadStatusMessage("Generate a document first before uploading.");
      return;
    }

    const token = queryAccessToken || localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      setUploadStatusMessage("Authentication token is missing. Reopen from Update Case and try again.");
      return;
    }

    if (!resolvedBlobFolderPath) {
      setUploadStatusMessage("Case folder path is missing. Please refresh Update Case and try again.");
      return;
    }

    const uploadTitle = sanitizeUploadTitle(formData.upload_title);
    const requiresUploadTitle = template.id !== "invoice";
    if (requiresUploadTitle && !uploadTitle) {
      setUploadStatusMessage("Please enter Upload Title before uploading.");
      return;
    }

    setUploadingToCase(true);
    setUploadStatusMessage("Uploading PDF to case...");

    try {
      let file;

      if (template.id === "invoice") {
        const invoicePdf = await requestInvoicePdfBlob();
        if (!invoicePdf?.blob) {
          throw new Error("Failed to generate invoice PDF for upload.");
        }

        file = new File([invoicePdf.blob], invoicePdf.fileName, {
          type: invoicePdf.blob.type || "application/pdf",
        });
      } else if (template.id === "formal-letter") {
        const lodPdfConfig = templatePdfEndpointById["formal-letter"];
        const pdfResponse = await fetch(lodPdfConfig.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData, language: selectedLanguage }),
        });

        if (!pdfResponse.ok) {
          throw new Error("Failed to generate LOD PDF for upload.");
        }

        const pdfBlob = await pdfResponse.blob();
        const contentDisposition = pdfResponse.headers.get("Content-Disposition");
        const pdfFileName = getFileNameFromContentDisposition(
          contentDisposition,
          lodPdfConfig.fallbackFilename,
        );
        file = new File(
          [pdfBlob],
          pdfFileName,
          {
            type: pdfBlob.type || "application/pdf",
          },
        );
      } else if (template.id === "writ-of-summons") {
        const writPdfConfig = templatePdfEndpointById["writ-of-summons"];
        const normalizedWritFormData = normalizeWritFormData(formData);
        const pdfResponse = await fetch(writPdfConfig.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData: normalizedWritFormData, language: selectedLanguage }),
        });

        if (!pdfResponse.ok) {
          throw new Error("Failed to generate Writ PDF for upload.");
        }

        const pdfBlob = await pdfResponse.blob();
        const contentDisposition = pdfResponse.headers.get("Content-Disposition");
        const pdfFileName = getFileNameFromContentDisposition(
          contentDisposition,
          writPdfConfig.fallbackFilename,
        );
        file = new File(
          [pdfBlob],
          pdfFileName,
          {
            type: pdfBlob.type || "application/pdf",
          },
        );
      } else {
        const pdf = buildPdfDocument();
        const pdfBlob = pdf.output("blob");
        const safeTemplateId = String(template.id || "generated-document").replace(/[^a-zA-Z0-9-_]/g, "-");
        const fileName = `${safeTemplateId}-${Date.now()}.pdf`;
        file = new File([pdfBlob], fileName, { type: "application/pdf" });
      }

      const uploadFileName = resolveUploadFileName({
        templateId: template.id,
        uploadTitle,
        invoiceNumber: formData.invoice_number,
        sourceFileName: file?.name,
      });
      file = new File([file], uploadFileName, { type: file.type || "application/pdf" });

      const form = new FormData();
      form.append("file", file);
      form.append("case_id", String(currentCaseId));
      form.append("folder_path", `${resolvedBlobFolderPath}${templateCategory}/`);
      form.append("category", templateCategory);
      if (templateCategory !== "invoices") {
        form.append("document_placeholder", uploadDocumentPlaceholder || "other");
      }

      if (templateCategory === "invoices") {
        const invoiceStage = resolveInvoiceStage(formData.payment_stage);
        form.append("invoice_stage", invoiceStage);

        const appendIfPresent = (key, value) => {
          if (value === undefined || value === null) {
            return;
          }

          const normalized = String(value).trim();
          if (normalized === "") {
            return;
          }

          form.append(key, normalized);
        };

        appendIfPresent("invoice_number", formData.invoice_number);
        appendIfPresent("issue_date", formData.issue_date);
        appendIfPresent("due_date", formData.due_date);
        appendIfPresent("bank_name", formData.bank_name);
        appendIfPresent("bank_account_no", formData.bank_account_no);
        appendIfPresent("client_name", formData.client_name || caseInfoSummary?.clientName);
        appendIfPresent("case_title", formData.case_title || caseInfoSummary?.title);
        appendIfPresent("expected_amount", formData.expected_amount);
        appendIfPresent("paid_amount", formData.paid_amount);
        appendIfPresent("tax", formData.tax);
        appendIfPresent("discount", formData.discount);
        appendIfPresent("total_amount", formData.total_amount);
        appendIfPresent("balance", formData.balance);
        appendIfPresent("clientID", formData.clientID);
        appendIfPresent("lawyerID", formData.lawyerID);
        appendIfPresent("payment_stage", formData.payment_stage);
        appendIfPresent("type_of_work", formData.type_of_work);
        appendIfPresent("blob_path", formData.blob_path);
      }

      const res = await fetch(`${MAIN_API_URL}/encrypted-documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
        body: form,
      });

      if (res.redirected && res.url.includes("localhost:5173")) {
        throw new Error("Upload request was redirected. Please log in again and reopen from Update Case.");
      }

      if (!res.ok) {
        let message = "Failed to upload PDF to case.";
        try {
          const payload = await res.json();
          if (payload?.message) {
            message = payload.message;
          }
        } catch {
          // ignore non-json error body
        }
        // --- NEW: After failed upload, reload latest invoice/case data ---
        if (templateCategory === "invoices") {
          await reloadInvoiceCaseData();
        }
        throw new Error(message);
      }

      let uploadPayload = null;
      try {
        uploadPayload = await res.json();
      } catch {
        uploadPayload = null;
      }

      if (templateCategory === "invoices") {
        const currentStage = resolveInvoiceStage(formData.payment_stage);
        const refreshedInvoicePhases = uploadPayload?.case_financials?.invoice_payment_phases || null;
        const refreshedBalancePhases = uploadPayload?.case_financials?.balance_payment_phases || null;
        const refreshedStage = refreshedInvoicePhases?.[currentStage] || null;
        const refreshedBalance =
          toPositiveNumber(refreshedStage?.balance) ??
          toPositiveNumber(refreshedBalancePhases?.[currentStage]);

        if (refreshedBalance !== null) {
          setFormData((prev) => {
            const nextExpected = String(Math.max(Number(prev.balance || 0), 0));

            return {
              ...prev,
              expected_amount: nextExpected,
              balance: nextExpected,
              phase_balance_base: String(refreshedBalance),
              phase_balance: String(refreshedBalance),
              paid_amount: "",
            };
          });
        }
      }

      emitCaseProgressUpdate(currentCaseId, uploadPayload?.case_progress);

      setUploadStatusMessage(`Uploaded to ${templateCategory} successfully.`);

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "ASLAW_DOCUMENT_UPLOADED",
            case_id: currentCaseId,
            category: templateCategory,
            case_progress: uploadPayload?.case_progress,
          },
          "*"
        );
      }

      if (returnToUrl && (!window.parent || window.parent === window)) {
        window.location.href = returnToUrl;
        return;
      }

      if (!window.parent || window.parent === window) {
        window.location.reload();
      }
    } catch (err) {
      const message = err?.message || "Failed to upload PDF to case.";
      if (message === "Failed to fetch") {
        setUploadStatusMessage(
          "Unable to reach API. Check that backend is running and CORS allows this origin."
        );
      } else {
        setUploadStatusMessage(message);
      }
    } finally {
      setUploadingToCase(false);
    }
  };

  // --- NEW: Helper to reload latest invoice/case data after failed upload ---
  const reloadInvoiceCaseData = async () => {
    try {
      const resolvedCaseId = resolveFirstPositiveInteger(
        currentCaseId,
        currentCase?.caseId,
        prefillData?.case_data?.caseId,
        prefillData?.case_data?.case_id,
        prefillData?.caseId,
        prefillData?.case_id,
        formData.case_id
      );
      if (!Number.isFinite(resolvedCaseId) || resolvedCaseId <= 0) {
        return;
      }
      const token = queryAccessToken || localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      const response = await fetch(`${MAIN_API_URL}/cases/${resolvedCaseId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
      });
      if (!response.ok) return;
      const payload = await response.json();
      // Reset form fields with latest backend data
      const phases = payload?.invoice_payment_phases || payload?.case?.invoice_payment_phases || null;
      const latestDocuments = extractInvoiceDocuments(payload?.encrypted_documents, payload?.case?.encrypted_documents);
      setFetchedCaseInvoiceDocuments(latestDocuments);
      const stage = resolveInvoiceStage(formData.payment_stage);
      const refreshed = phases?.[stage] || {};
      setFormData((prev) => {
        const refreshedStageBalance = String(refreshed.balance ?? "");
        const selectedTypeOfWork = String(prev.type_of_work || "").trim();
        const expectedByType = computeRemainingForTypeOfWork(
          invoiceCaseTypeFeeJson,
          latestDocuments,
          stage,
          selectedTypeOfWork
        );
        const nextExpected = expectedByType !== null ? String(expectedByType) : refreshedStageBalance;

        return {
          ...prev,
          expected_amount: nextExpected,
          balance: nextExpected,
          phase_balance_base: refreshedStageBalance,
          phase_balance: refreshedStageBalance,
          paid_amount: "",
        };
      });
    } catch {
      // Ignore reload errors
    }
  };

  const handleExportDOCX = async () => {
    if (template.id === "invoice") {
      const invoicePdfConfig = templatePdfEndpointById.invoice;

      try {
        const payloadFormData = normalizeInvoiceApiFormData({
          formData,
          currentCaseId,
          currentCase,
          prefillData,
        });

        if (!payloadFormData) {
          throw new Error("Case ID is missing. Open this template from a valid case and try again.");
        }

        const response = await fetch(invoicePdfConfig.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData: payloadFormData, language: selectedLanguage }),
        });

        if (!response.ok) {
          const responseMessage = await resolveResponseErrorMessage(
            response,
            "Failed to generate invoice PDF"
          );
          throw new Error(responseMessage);
        }

        const blob = await response.blob();
        const fileName = resolveInvoicePdfFilename(
          response,
          payloadFormData,
          invoicePdfConfig.fallbackFilename,
        );

        saveAs(blob, fileName);
      } catch (err) {
        console.error(err);
        if (err?.message === INVOICE_NUMBER_CONFLICT_MESSAGE) {
          setError(INVOICE_NUMBER_CONFLICT_MESSAGE);
        } else {
          setError(invoicePdfConfig.errorText);
        }
      }

      return;
    }

    const templateDocxConfig = templateDocxEndpointById[template.id];
    if (templateDocxConfig) {
      try {
        const response = await fetch(templateDocxConfig.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData: template.id === "writ-of-summons" ? normalizeWritFormData(formData) : formData,
            language: selectedLanguage,
          }),
        });

        if (!response.ok) {
          const responseMessage = await resolveResponseErrorMessage(
            response,
            "Failed to generate template DOCX"
          );
          throw new Error(responseMessage);
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get("Content-Disposition");
        const fileName = getFileNameFromContentDisposition(
          contentDisposition,
          templateDocxConfig.fallbackFilename,
        );

        saveAs(blob, fileName);
      } catch (err) {
        console.error(err);
        if (err?.message === INVOICE_NUMBER_CONFLICT_MESSAGE) {
          setError(INVOICE_NUMBER_CONFLICT_MESSAGE);
        } else {
          setError(templateDocxConfig.errorText);
        }
      }

      return;
    }

    const doc = new Document({
      sections: [
        {
          children: generatedContent.split("\n").map((line) => new Paragraph(line)),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${template.id}.docx`);
  };

  if (showPreview) {
    return (
      <>
        <TemplatePreviewCard
          copied={copied}
            onBackToEdit={() => {
              if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
              setPdfPreviewUrl("");
              setShowPreview(false);
            }}
          onCopy={handleCopy}
          onExportPDF={handleExportPDF}
          onExportDOCX={handleExportDOCX}
          uploadToCaseLabel={`Upload to Case (${templateCategory})`}
          uploadToCaseDisabled={uploadingToCase || !canUploadToCase}
          uploadToCaseLoading={uploadingToCase}
          uploadStatusMessage={uploadStatusMessage}
          syncStatusMessage={syncStatusMessage}
          onOpenUploadPlaceholderModal={
            canUploadToCase && templateCategory !== "invoices"
              ? () => {
                  if (!generatedContent.trim()) {
                    setUploadStatusMessage("Generate a document first before uploading.");
                    return;
                  }
                  setShowUploadPlaceholderModal(true);
                }
              : undefined
          }
          onUploadToCasePdf={canUploadToCase ? handleUploadPdfToCase : undefined}
          pdfPreviewUrl={pdfPreviewUrl}
          preferContentPreview={false}
        >
          {renderGeneratedPreview(template.id, generatedContent, {
            formData,
            language: selectedLanguage,
          })}
        </TemplatePreviewCard>

        {showUploadPlaceholderModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3000,
              padding: "1rem",
            }}
            onClick={() => {
              if (!uploadingToCase) {
                setShowUploadPlaceholderModal(false);
              }
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                width: "min(94vw, 520px)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
                overflow: "hidden",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.9rem 1rem",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <strong>Select Placeholder</strong>
                <button
                  type="button"
                  disabled={uploadingToCase}
                  onClick={() => setShowUploadPlaceholderModal(false)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: "1.25rem",
                    lineHeight: 1,
                    cursor: uploadingToCase ? "not-allowed" : "pointer",
                  }}
                >
                  x
                </button>
              </div>

              <div style={{ padding: "1rem", display: "grid", gap: "0.8rem" }}>
                <p style={{ margin: 0, color: "#334155" }}>
                  Choose where this generated document should be categorized.
                </p>
                <select
                  value={uploadDocumentPlaceholder}
                  onChange={(event) => setUploadDocumentPlaceholder(event.target.value)}
                  disabled={uploadingToCase}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.65rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                  }}
                >
                  {DOCUMENT_PLACEHOLDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.6rem",
                }}
              >
                <button
                  type="button"
                  className="dg-btn"
                  disabled={uploadingToCase}
                  onClick={() => setShowUploadPlaceholderModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dg-btn dg-btn-primary"
                  disabled={uploadingToCase}
                  onClick={async () => {
                    setShowUploadPlaceholderModal(false);
                    await handleUploadPdfToCase();
                  }}
                >
                  {uploadingToCase ? "Uploading..." : "Upload to Case"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (prefillLoading) {
    return (
      <div className="dg-page">
        <div className="dg-container" style={{ maxWidth: 900 }}>
          <div className="dg-shell">
            <div className="dg-prefill-loading">
              <div className="dg-prefill-spinner" aria-hidden="true" />
              <p>Prefilling document data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TemplateEditorCard
      template={resolvedTemplate || template}
      formData={formData}
      caseInfoSummary={caseInfoSummary}
      selectedLanguage={selectedLanguage}
      loading={loading}
      error={error}
      onChange={handleChange}
      onDefendantsChange={handleDefendantsChange}
      uploadTitle={formData.upload_title}
      onUploadTitleChange={handleChange}
      onLanguageChange={setSelectedLanguage}
      onSubmit={handleSubmit}
    />
  );
};

export default TemplateForm;
