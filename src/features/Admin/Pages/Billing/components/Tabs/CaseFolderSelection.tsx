import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import ConfirmModal from "../../../../../../components/Modals/ConfirmModal";
import AuthMemory from "../../../../../../data/authMemory";
import axiosUser from "../../../../../../api/axiosUser";
import { EncryptedDocumentItem } from "../../../../../../data/userInfo";
import LoadingSpinner from "../../../../../../components/ui/Spinner";
import InvoicePhaseSummary from "../../../../../../shared/components/InvoicePhaseSummary";

interface CaseInfo {
  lawyerFirmID: string;
  clientFirmID?: string;
  id?: number;
  caseId?: string;
  blob_folder_path?: string;
  encrypted_documents?: EncryptedDocumentItem[];
  expected_payment_phases?: {
    initial: number;
    first: number;
    second: number;
    third: number;
    final: number;
  };
  invoice_payment_phases?: {
    initial: { expected: number; paid: number; balance: number };
    first: { expected: number; paid: number; balance: number };
    second: { expected: number; paid: number; balance: number };
    third: { expected: number; paid: number; balance: number };
    final: { expected: number; paid: number; balance: number };
  };
  case_type_fee_json?: {
    initial?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    first?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    second?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    third?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    final?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
  };
}

interface CaseFolderSectionProps {
  selectedCase?: CaseInfo;
  folderName: string; // e.g., "documents" or "invoices"
  sectionOptions?: string[]; // optional section dropdown
  renameFileWithSection?: boolean; // if true, adds section prefix on upload
  title: string; // Header title
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onUploadingChange?: (uploading: boolean) => void;
  onCreateDocument?: (category: string) => void;
  onCaseProgressUpdate?: (caseId: number, progress: number) => void;
  onPhaseSnapshotChange?: (snapshot: {
    expected_payment_phases?: CaseInfo["expected_payment_phases"];
    invoice_payment_phases?: CaseInfo["invoice_payment_phases"];
  }) => void;
}

type DisplayFile = {
  id?: string;
  fileName: string;
  encrypted: boolean;
};

type CaseApiItem = {
  id?: number;
  caseId?: number;
  encrypted_documents?: EncryptedDocumentItem[];
  expected_payment_phases?: {
    initial: number;
    first: number;
    second: number;
    third: number;
    final: number;
  };
  invoice_payment_phases?: {
    initial: { expected: number; paid: number; balance: number };
    first: { expected: number; paid: number; balance: number };
    second: { expected: number; paid: number; balance: number };
    third: { expected: number; paid: number; balance: number };
    final: { expected: number; paid: number; balance: number };
  };
};

type InvoiceStageKey = "initial" | "first" | "second" | "third" | "final";

const INVOICE_STAGES: InvoiceStageKey[] = ["initial", "first", "second", "third", "final"];

const normalizeInvoiceStage = (value: any): InvoiceStageKey => {
  const candidate = String(value || "").toLowerCase();
  return INVOICE_STAGES.includes(candidate as InvoiceStageKey) ? (candidate as InvoiceStageKey) : "initial";
};

const parseCaseTypeFeeJson = (candidate: any): Record<string, any> | null => {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === "string") {
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  if (typeof candidate === "object") {
    return candidate;
  }

  return null;
};

const resolveTypeOfWorkLabel = (invoice: any, caseTypeFeeJson: Record<string, any> | null): string => {
  const directTypeOfWork = String(invoice?.type_of_work || invoice?.typeOfWork || "").trim();
  if (directTypeOfWork) {
    return directTypeOfWork;
  }

  const stage = normalizeInvoiceStage(invoice?.payment_stage);
  const stageItems = Array.isArray(caseTypeFeeJson?.[stage]) ? caseTypeFeeJson?.[stage] : [];
  if (!stageItems.length) {
    return "-";
  }

  if (stageItems.length === 1) {
    return String(stageItems[0]?.typeOfWork || stageItems[0]?.type_of_work || "-").trim() || "-";
  }

  const expectedAmount = Number(invoice?.expected_amount || 0);
  if (expectedAmount > 0) {
    const matched = stageItems.find((item: any) => Number(item?.selectedFee || 0) === expectedAmount);
    if (matched) {
      return String(matched?.typeOfWork || matched?.type_of_work || "-").trim() || "-";
    }
  }

  const firstType = String(stageItems[0]?.typeOfWork || stageItems[0]?.type_of_work || "").trim();
  return firstType ? `${firstType} (+${stageItems.length - 1} more)` : "-";
};

const resolvePhaseBalanceValue = (
  invoice: any,
  caseFinancials: any,
  invoicePaymentPhases?: CaseInfo["invoice_payment_phases"]
): number => {
  const stage = normalizeInvoiceStage(invoice?.payment_stage);
  const resolved =
    invoice?.phase_balance ??
    caseFinancials?.balance_payment_phases?.[stage] ??
    invoicePaymentPhases?.[stage]?.balance ??
    0;

  const numericValue = Number(resolved);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const buildInvoicePhasesFromCaseFinancials = (caseFinancials: any): CaseInfo["invoice_payment_phases"] => {
  const expected = caseFinancials?.expected_payment_phases || {};
  const balance = caseFinancials?.balance_payment_phases || {};

  const toNumber = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  return {
    initial: {
      expected: toNumber(expected.initial),
      balance: toNumber(balance.initial),
      paid: Math.max(toNumber(expected.initial) - toNumber(balance.initial), 0),
    },
    first: {
      expected: toNumber(expected.first),
      balance: toNumber(balance.first),
      paid: Math.max(toNumber(expected.first) - toNumber(balance.first), 0),
    },
    second: {
      expected: toNumber(expected.second),
      balance: toNumber(balance.second),
      paid: Math.max(toNumber(expected.second) - toNumber(balance.second), 0),
    },
    third: {
      expected: toNumber(expected.third),
      balance: toNumber(balance.third),
      paid: Math.max(toNumber(expected.third) - toNumber(balance.third), 0),
    },
    final: {
      expected: toNumber(expected.final),
      balance: toNumber(balance.final),
      paid: Math.max(toNumber(expected.final) - toNumber(balance.final), 0),
    },
  };
};

const formatStageLabel = (stage: string) => stage.charAt(0).toUpperCase() + stage.slice(1);

const resolveInvoiceConflictMessage = (error: any): string | null => {
  const status = Number(error?.response?.status || 0);
  const backendMessage =
    error?.response?.data?.created_invoice_error ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "";

  if (status === 409) {
    return "Unable to generate a unique invoice number right now. Please try again.";
  }

  if (
    String(backendMessage)
      .toLowerCase()
      .includes("unique invoice number")
  ) {
    return "Unable to generate a unique invoice number right now. Please try again.";
  }

  return null;
};

const CaseFolderSection: React.FC<CaseFolderSectionProps> = ({
  selectedCase,
  folderName,
  sectionOptions = [],
  renameFileWithSection = false,
  title,
  onUploadSuccess,
  onDeleteSuccess,
  onUploadingChange,
  onCreateDocument,
  onCaseProgressUpdate,
  onPhaseSnapshotChange,
}) => {
  const currentUser = AuthMemory.getUser();
  const token = AuthMemory.getToken();
  const isAdmin = (currentUser?.role || "").toLowerCase() === "admin";

  const mutationHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-User-Role": currentUser?.role || "",
      "X-User-FirmID": currentUser?.firmID || "",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, [currentUser?.role, currentUser?.firmID, token]);

  const selectedCaseRef = useRef(selectedCase);
  useEffect(() => { selectedCaseRef.current = selectedCase; });

  const onPhaseSnapshotChangeRef = useRef(onPhaseSnapshotChange);
  useEffect(() => { onPhaseSnapshotChangeRef.current = onPhaseSnapshotChange; });

  const [files, setFiles] = useState<DisplayFile[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadSection, setUploadSection] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<"download" | "delete" | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<DisplayFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpdateInfoModal, setShowUpdateInfoModal] = useState(false);
  const [updateInfoPayload, setUpdateInfoPayload] = useState<{
    documentId: string;
    fileName: string;
    invoice: any | null;
    caseFinancials: any | null;
  } | null>(null);
  const [updatePaidAmount, setUpdatePaidAmount] = useState<string>("");
  const [isSavingInvoiceUpdate, setIsSavingInvoiceUpdate] = useState(false);
  const [updateReplacementInfo, setUpdateReplacementInfo] = useState<{
    oldDocumentId: string;
    newDocumentId: string;
    newFileName: string;
  } | null>(null);
  const [pendingInvoiceUploadFile, setPendingInvoiceUploadFile] = useState<File | null>(null);
  const [resolvedExpectedPaymentPhases, setResolvedExpectedPaymentPhases] = useState<CaseInfo["expected_payment_phases"]>(selectedCase?.expected_payment_phases);
  const [resolvedInvoicePaymentPhases, setResolvedInvoicePaymentPhases] = useState<CaseInfo["invoice_payment_phases"]>(selectedCase?.invoice_payment_phases);

  const alertVariant = useMemo(() => {
    if (!successMessage) {
      return "success";
    }

    const normalized = successMessage.toLowerCase();
    if (normalized.includes("failed") || normalized.includes("invalid") || normalized.includes("required") || normalized.includes("no case selected")) {
      return "danger";
    }

    return "success";
  }, [successMessage]);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const isInvoiceFolder = folderName === "invoices";
  const canMutateInvoiceFiles = !isInvoiceFolder || isAdmin;

  const getLegacyFilePath = useCallback(
    (fileName: string) => `${selectedCase?.blob_folder_path ?? ""}${folderName}/${fileName}`,
    [selectedCase?.blob_folder_path, folderName]
  );

  const getPreviewUrl = useCallback(
    (file: DisplayFile): string | null => {
      if (file.encrypted && file.id) {
        return `${process.env.REACT_APP_API_URL}/encrypted-documents/${file.id}/preview`;
      }

      const legacyPath = getLegacyFilePath(file.fileName);
      if (!legacyPath) {
        return null;
      }

      return `${process.env.REACT_APP_API_URL}/read/${encodeURI(legacyPath)}`;
    },
    [getLegacyFilePath]
  );

  const getDownloadUrl = useCallback(
    (file: DisplayFile): string | null => {
      if (file.encrypted && file.id) {
        return `${process.env.REACT_APP_API_URL}/encrypted-documents/${file.id}/download`;
      }

      const legacyPath = getLegacyFilePath(file.fileName);
      if (!legacyPath) {
        return null;
      }

      return `${process.env.REACT_APP_API_URL}/download/${encodeURI(legacyPath)}`;
    },
    [getLegacyFilePath]
  );

  const getActionKey = useCallback((action: "preview" | "download" | "delete" | "update", file: DisplayFile) => {
    return `${action}:${file.id || file.fileName}`;
  }, []);

  const handleInvoiceUpdateClick = useCallback(
    async (file: DisplayFile) => {
      const resolvedDocumentId =
        file.id ||
        selectedCase?.encrypted_documents
          ?.filter((item) => item.category === "invoices" && item.status !== "deleted")
          .find((item) => item.file_name === file.fileName)?.document_id;

      if (!resolvedDocumentId) {
        setSuccessMessage("Unable to resolve invoice document ID for update.");
        return;
      }

      const actionKey = getActionKey("update", file);
      setLoadingAction(actionKey);

      try {
        const res = await axiosUser.get(
          `${process.env.REACT_APP_API_URL}/encrypted-documents/${resolvedDocumentId}/invoice`,
          { headers: mutationHeaders }
        );

        console.log("[Invoice Update Debug]", {
          document_id: resolvedDocumentId,
          file_name: file.fileName,
          invoice_table: res?.data?.invoice ?? null,
          law_cases_expected_and_balance: res?.data?.case_financials ?? null,
        });

        const resolvedInvoice = res?.data?.invoice ?? res?.data?.invoice_table ?? res?.data?.data?.invoice ?? null;
        const resolvedCaseFinancials =
          res?.data?.case_financials ??
          res?.data?.law_cases_expected_and_balance ??
          res?.data?.law_cases ??
          res?.data?.data?.case_financials ??
          null;

        setUpdateInfoPayload({
          documentId: String(resolvedDocumentId),
          fileName: file.fileName,
          invoice: resolvedInvoice,
          caseFinancials: resolvedCaseFinancials,
        });
        setUpdateReplacementInfo(null);
        setUpdatePaidAmount(String(resolvedInvoice?.paid_amount ?? ""));
        setShowUpdateInfoModal(true);

        setSuccessMessage("Invoice data logged and displayed.");
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
        setSuccessMessage(`Failed to load invoice data: ${message}`);
      } finally {
        setLoadingAction((current) => (current === actionKey ? null : current));
      }
    },
    [getActionKey, mutationHeaders, selectedCase?.encrypted_documents]
  );

  const handleSaveInvoiceUpdate = async () => {
    if (!updateInfoPayload?.documentId) {
      setSuccessMessage("Invoice update context is missing.");
      return;
    }

    const numericPaidAmount = Number(updatePaidAmount);
    if (!Number.isFinite(numericPaidAmount) || numericPaidAmount < 0) {
      setSuccessMessage("Paid Amount must be a valid number greater than or equal to 0.");
      return;
    }

    const invoice = updateInfoPayload.invoice;
    const caseId = invoice?.case_id ?? selectedCase?.caseId;
    const resolvedCaseTypeFeeJson =
      parseCaseTypeFeeJson(invoice?.case_type_fee_json) ||
      parseCaseTypeFeeJson(selectedCase?.case_type_fee_json);
    const resolvedTypeOfWork = resolveTypeOfWorkLabel(invoice, resolvedCaseTypeFeeJson);
    const resolvedPhaseBalance = resolvePhaseBalanceValue(
      invoice,
      updateInfoPayload.caseFinancials,
      selectedCase?.invoice_payment_phases
    );
    if (!caseId) {
      setSuccessMessage("Case ID is missing. Cannot generate invoice.");
      return;
    }

    setIsSavingInvoiceUpdate(true);
    try {
      // Step 1: Generate PDF via document-generator (updates existing invoice in DB, no LibreOffice needed)
      const generateRes = await axiosUser.post(
        `${process.env.REACT_APP_API_URL}/document-generator/generate-invoice-pdf`,
        {
          formData: {
            invoice_id: invoice?.id ?? null,
            invoice_number: invoice?.invoice_number ?? null,
            case_id: caseId,
            payment_stage: invoice?.payment_stage ?? "initial",
            issue_date: invoice?.issue_date ?? new Date().toISOString().split("T")[0],
            due_date: invoice?.due_date ?? null,
            expected_amount: invoice?.expected_amount ?? null,
            paid_amount: numericPaidAmount,
            tax: invoice?.tax ?? null,
            discount: invoice?.discount ?? null,
            type_of_work: resolvedTypeOfWork === "-" ? null : resolvedTypeOfWork,
            phase_balance: resolvedPhaseBalance,
            client_name: invoice?.client_name ?? null,
            case_title: invoice?.case_title ?? null,
          },
        },
        { headers: mutationHeaders, responseType: "arraybuffer" }
      );

      const xInvoiceNumber = (generateRes.headers as Record<string, string>)["x-invoice-number"] || invoice?.invoice_number || "invoice";
      const xInvoiceBalance = (generateRes.headers as Record<string, string>)["x-invoice-balance"] || "0";

      // Step 2: Upload the generated PDF as the new invoice document
      const pdfBlob = new Blob([generateRes.data as ArrayBuffer], {
        type: "application/pdf",
      });
      const safeBase = (invoice?.invoice_number || "invoice").replace(/[^a-zA-Z0-9\-_]/g, "_");
      const pdfFile = new File(
        [pdfBlob],
        `${safeBase}-updated-${Date.now()}.pdf`,
        { type: "application/pdf" }
      );

      const uploadFormData = new FormData();
      uploadFormData.append("file", pdfFile);
      uploadFormData.append("case_id", String(caseId));
      uploadFormData.append("category", "invoices");
      uploadFormData.append("invoice_stage", invoice?.payment_stage || "initial");
      uploadFormData.append("invoice_number", xInvoiceNumber);
      uploadFormData.append("paid_amount", String(numericPaidAmount));
      uploadFormData.append("expected_amount", String(invoice?.expected_amount ?? ""));
      uploadFormData.append("balance", xInvoiceBalance);
      if (invoice?.tax != null) uploadFormData.append("tax", String(invoice.tax));
      if (invoice?.discount != null) uploadFormData.append("discount", String(invoice.discount));
      if (invoice?.client_name) uploadFormData.append("client_name", invoice.client_name);
      if (invoice?.case_title) uploadFormData.append("case_title", invoice.case_title);
      if (invoice?.issue_date) uploadFormData.append("issue_date", invoice.issue_date);
      if (invoice?.due_date) uploadFormData.append("due_date", invoice.due_date);

      const uploadRes = await axiosUser.post(
        `${process.env.REACT_APP_API_URL}/encrypted-documents/upload`,
        uploadFormData,
        { headers: mutationHeaders as Record<string, string> }
      );

      const newDocumentId: string =
        String(uploadRes.data?.document_id || uploadRes.data?.data?.document_id || "");
      const newFileName: string =
        String(uploadRes.data?.file_name || uploadRes.data?.data?.file_name || pdfFile.name);

      // Step 3: Cleanup old document, sync invoice DB, link new document
      const cleanupRes = await axiosUser.put(
        `${process.env.REACT_APP_API_URL}/encrypted-documents/${updateInfoPayload.documentId}/invoice`,
        { paid_amount: numericPaidAmount, new_document_id: newDocumentId },
        { headers: mutationHeaders }
      );

      const updatedInvoice = cleanupRes?.data?.invoice ?? null;
      const updatedCaseFinancials = cleanupRes?.data?.case_financials ?? null;
      const updatedProgress = Number(cleanupRes?.data?.case_progress ?? 0);
      const updatedDocument = cleanupRes?.data?.updated_document ?? null;

      const resolvedCaseId = Number(invoice?.case_id ?? selectedCase?.caseId ?? selectedCase?.id ?? 0);

      setUpdateReplacementInfo({
        oldDocumentId: String(updatedDocument?.old_document_id ?? updateInfoPayload.documentId),
        newDocumentId: String(updatedDocument?.new_document_id ?? newDocumentId),
        newFileName: String(updatedDocument?.new_file_name ?? newFileName),
      });

      setUpdateInfoPayload((current) => {
        if (!current) return current;
        return {
          ...current,
          documentId: String(updatedDocument?.new_document_id ?? newDocumentId ?? current.documentId),
          fileName: String(updatedDocument?.new_file_name ?? newFileName),
          invoice: updatedInvoice || current.invoice,
          caseFinancials: updatedCaseFinancials || current.caseFinancials,
        };
      });
      setUpdatePaidAmount(String(updatedInvoice?.paid_amount ?? numericPaidAmount));

      if (Number.isFinite(resolvedCaseId) && resolvedCaseId > 0 && Number.isFinite(updatedProgress)) {
        onCaseProgressUpdate?.(resolvedCaseId, updatedProgress);
      }

      if (updatedCaseFinancials?.expected_payment_phases) {
        const refreshedExpected = updatedCaseFinancials.expected_payment_phases;
        const refreshedInvoice = buildInvoicePhasesFromCaseFinancials(updatedCaseFinancials);
        setResolvedExpectedPaymentPhases(refreshedExpected);
        setResolvedInvoicePaymentPhases(refreshedInvoice);
        onPhaseSnapshotChange?.({
          expected_payment_phases: refreshedExpected,
          invoice_payment_phases: refreshedInvoice,
        });
      }

      await fetchFiles();
      onUploadSuccess?.();

      console.log("[Invoice Update Saved]", {
        updated_progress_percentage: updatedProgress,
        regenerated_invoice_document: updatedDocument,
      });

      setSuccessMessage("Invoice saved. New invoice document generated and uploaded successfully.");
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setSuccessMessage(`Failed to save invoice update: ${message}`);
    } finally {
      setIsSavingInvoiceUpdate(false);
    }
  };

  const openPreview = useCallback(
    async (file: DisplayFile) => {
      const actionKey = getActionKey("preview", file);
      setLoadingAction(actionKey);

      try {
        const url = getPreviewUrl(file);
        if (!url) {
          setSuccessMessage("Invalid file path for preview.");
          return;
        }

        const response = await axiosUser.get(url, {
          responseType: "blob",
          headers: mutationHeaders as Record<string, string>,
        });

        if (previewFile) {
          URL.revokeObjectURL(previewFile);
        }

        const objectUrl = URL.createObjectURL(response.data as Blob);
        setPreviewFile(objectUrl);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
        setSuccessMessage(`Preview failed: ${message}`);
      } finally {
        setLoadingAction((current) => (current === actionKey ? null : current));
      }
    },
    [getActionKey, getPreviewUrl, mutationHeaders, previewFile]
  );

  const downloadFile = useCallback(
    async (file: DisplayFile) => {
      const actionKey = getActionKey("download", file);
      setLoadingAction(actionKey);

      try {
        const url = getDownloadUrl(file);
        if (!url) {
          setSuccessMessage("Invalid file path for download.");
          return;
        }

        const response = await axiosUser.get(url, {
          responseType: "blob",
          headers: mutationHeaders as Record<string, string>,
        });

        const objectUrl = URL.createObjectURL(response.data as Blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
        setSuccessMessage(`Download failed: ${message}`);
      } finally {
        setLoadingAction((current) => (current === actionKey ? null : current));
      }
    },
    [getActionKey, getDownloadUrl, mutationHeaders]
  );

  const buildEncryptedDisplayFiles = useCallback(
    (encryptedDocs: EncryptedDocumentItem[] = []): DisplayFile[] => {
      return encryptedDocs
        .filter((item) => item.category === folderName && item.status !== "deleted")
        .map((item) => ({
          id: item.document_id,
          fileName: item.file_name,
          encrypted: true,
        }));
    },
    [folderName]
  );

  const selectedFileItems = useMemo(
    () => files.filter((file) => selectedFiles.includes(file.fileName)),
    [files, selectedFiles]
  );

  /* ================= FETCH FILES ================= */
  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);

    const sc = selectedCaseRef.current;
    // First, refresh encrypted docs for the selected case from backend.
    const selectedCaseId = Number(sc?.caseId ?? sc?.id);
    if (Number.isFinite(selectedCaseId) && selectedCaseId > 0) {
      try {
        const casesResponse = await axiosUser.get(`${process.env.REACT_APP_API_URL}/cases`, {
          headers: mutationHeaders,
        });

        const cases: CaseApiItem[] = Array.isArray(casesResponse.data) ? casesResponse.data : [];
        const matchedCase = cases.find((c) => Number(c.caseId ?? c.id) === selectedCaseId);
        if (matchedCase?.expected_payment_phases) {
          setResolvedExpectedPaymentPhases(matchedCase.expected_payment_phases);
        }
        if (matchedCase?.invoice_payment_phases) {
          setResolvedInvoicePaymentPhases(matchedCase.invoice_payment_phases);
        }
        if (matchedCase?.expected_payment_phases || matchedCase?.invoice_payment_phases) {
          onPhaseSnapshotChangeRef.current?.({
            expected_payment_phases: matchedCase?.expected_payment_phases,
            invoice_payment_phases: matchedCase?.invoice_payment_phases,
          });
        }
        const encryptedFiles = buildEncryptedDisplayFiles(matchedCase?.encrypted_documents ?? []);
        if (encryptedFiles.length > 0) {
          setFiles(encryptedFiles);
          setLoadingFiles(false);
          return;
        }
      } catch (err) {
        console.error(`Failed to refresh encrypted ${folderName} for case ${selectedCaseId}:`, err);
      }
    } else {
      // Fallback to locally available case data.
      const encryptedFiles = buildEncryptedDisplayFiles(sc?.encrypted_documents ?? []);
      if (encryptedFiles.length > 0) {
        setFiles(encryptedFiles);
        setLoadingFiles(false);
        return;
      }
    }

    if (!sc?.blob_folder_path) {
      setLoadingFiles(false);
      return;
    }

    try {
      const folderPath = `${sc.blob_folder_path}${folderName}/`;
      const response = await axiosUser.get(
        `${process.env.REACT_APP_API_URL}/files?folder=${encodeURIComponent(folderPath)}`,
        { headers: mutationHeaders }
      );
      const data = response.data;
      const rawFiles: unknown[] = Array.isArray(data.files) ? data.files : [];
      const legacyFiles = rawFiles
        .filter((file): file is string => {
          if (typeof file !== "string") {
            return false;
          }

          const normalized = file.toLowerCase();
          return (
            !normalized.startsWith("encrypted/") &&
            !normalized.includes("/encrypted/")
          );
        })
        .map((fileName: string) => ({
          fileName,
          encrypted: false,
        }));

      setFiles(legacyFiles);
    } catch (err) {
      console.error(`Failed to fetch ${folderName}:`, err);
    } finally {
      setLoadingFiles(false);
    }
  }, [
    buildEncryptedDisplayFiles,
    folderName,
    mutationHeaders,
  ]);

  const submitUpload = async (finalFile: File) => {
    if (!selectedCase?.blob_folder_path) {
      setSuccessMessage("No case selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", finalFile);
    formData.append("case_id", String(selectedCase.caseId || ""));
    formData.append("category", folderName);

    if (isInvoiceFolder) {
      formData.append("invoice_stage", uploadSection || "initial");
      formData.append("paid_amount", paidAmount === "" ? "0" : paidAmount);
    }

    setUploading(true);

    try {
      await axiosUser.post(`${process.env.REACT_APP_API_URL}/encrypted-documents/upload`, formData, {
        headers: mutationHeaders as Record<string, string>,
      });

      setSuccessMessage(`File "${finalFile.name}" uploaded successfully!`);
      if (isInvoiceFolder) {
        setPaidAmount("");
        setInvoiceNumber("");
      }
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      fetchFiles();
    } catch (err: any) {
      const conflictMessage = resolveInvoiceConflictMessage(err);
      const message =
        conflictMessage || err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setSuccessMessage(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
      setPendingInvoiceUploadFile(null);
    }
  };

  useEffect(() => {
    fetchFiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCase?.caseId, selectedCase?.id, folderName, mutationHeaders]);

  useEffect(() => {
    setResolvedExpectedPaymentPhases(selectedCase?.expected_payment_phases);
    setResolvedInvoicePaymentPhases(selectedCase?.invoice_payment_phases);
  }, [selectedCase?.caseId, selectedCase?.expected_payment_phases, selectedCase?.invoice_payment_phases]);

  /* ================= DELETE ================= */
  const handleDelete = (file: DisplayFile) => {
    if (isInvoiceFolder && !canMutateInvoiceFiles) {
      setSuccessMessage("Only admin can delete invoice files.");
      return;
    }

    if (!selectedCase?.blob_folder_path && !file.encrypted) return;

    setPendingDeleteFile(file);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteFile) {
      return;
    }

    const file = pendingDeleteFile;
    const actionKey = getActionKey("delete", file);
    setIsDeleting(true);
    setLoadingAction(actionKey);

    if (file.encrypted && file.id) {
      try {
        await axiosUser.delete(`${process.env.REACT_APP_API_URL}/encrypted-documents/${file.id}`, {
          headers: mutationHeaders as Record<string, string>,
        });

        setSuccessMessage(`File "${file.fileName}" deleted successfully!`);
        if (isInvoiceFolder && onDeleteSuccess) {
          onDeleteSuccess();
        }
        fetchFiles();
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
        setSuccessMessage(`Delete failed: ${message}`);
      } finally {
        setLoadingAction((current) => (current === actionKey ? null : current));
      }

      setIsDeleting(false);
      setPendingDeleteFile(null);
      return;
    }

    // For legacy files, use the blob delete endpoint
    if (!file.encrypted) {
      const filePath = `${selectedCase?.blob_folder_path}${folderName}/${file.fileName}`;
      try {
        await axiosUser.delete(`${process.env.REACT_APP_API_URL}/delete/${filePath}`, {
          headers: mutationHeaders as Record<string, string>,
        });

        setSuccessMessage(`File "${file.fileName}" deleted successfully!`);
        if (isInvoiceFolder && onDeleteSuccess) {
          onDeleteSuccess();
        }
        fetchFiles();
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
        setSuccessMessage(`Delete failed: ${message}`);
      } finally {
        setLoadingAction((current) => (current === actionKey ? null : current));
      }
    }

    setIsDeleting(false);
    setPendingDeleteFile(null);
  };

  /* ================= SELECTION ================= */
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedFiles([]);
  };

  const toggleCheckbox = (fileName: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileName) ? prev.filter((f) => f !== fileName) : [...prev, fileName]
    );
  };

  const handleBulkDownload = async () => {
    if (selectedFileItems.length === 0) {
      setSuccessMessage("Please choose at least one file first.");
      return;
    }

    setBulkAction("download");
    try {
      for (const file of selectedFileItems) {
        await downloadFile(file);
      }
    } finally {
      setBulkAction(null);
    }
  };

  const handleBulkDelete = async () => {
    if (isInvoiceFolder && !canMutateInvoiceFiles) {
      setSuccessMessage("Only admin can delete invoice files.");
      return;
    }

    if (selectedFileItems.length === 0) {
      setSuccessMessage("Please choose at least one file first.");
      return;
    }

    setBulkAction("delete");
    try {
      for (const file of selectedFileItems) {
        if (file.encrypted && file.id) {
          await axiosUser.delete(`${process.env.REACT_APP_API_URL}/encrypted-documents/${file.id}`, {
            headers: mutationHeaders as Record<string, string>,
          });
        } else {
          const filePath = `${selectedCase?.blob_folder_path}${folderName}/${file.fileName}`;
          await axiosUser.delete(`${process.env.REACT_APP_API_URL}/delete/${filePath}`, {
            headers: mutationHeaders as Record<string, string>,
          });
        }
      }

      setSuccessMessage(`${selectedFileItems.length} file(s) deleted successfully!`);
      setSelectedFiles([]);
      if (isInvoiceFolder && onDeleteSuccess) {
        onDeleteSuccess();
      }
      fetchFiles();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setSuccessMessage(`Delete failed: ${message}`);
    } finally {
      setBulkAction(null);
    }
  };

  /* ================= RENDER FILE ================= */
  return (
    <>
      {/* Alert */}
      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(92vw, 600px)",
            zIndex: 2000,
          }}
        >
          <Alert variant={alertVariant} onClose={() => setSuccessMessage(null)} dismissible>
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="admin-billing-files-header">
        <h2 className="admin-billing-files-title">{title}</h2>

        <div className="admin-billing-files-actions">
          {sectionOptions.length > 0 && !isInvoiceFolder && (
            <DropdownButton
              id="dropdown-upload"
              title={
                isInvoiceFolder
                  ? uploadSection
                    ? `${canMutateInvoiceFiles ? "Upload to" : "Phase"} ${formatStageLabel(uploadSection)}`
                    : canMutateInvoiceFiles
                      ? "Select upload phase"
                      : "Phase progression"
                  : `Upload to ${uploadSection.toUpperCase()}`
              }
              variant="warning"
              onSelect={(key) => {
                if (key === "__cancel_upload__") {
                  setUploadSection("");
                  setInvoiceNumber("");
                  setPaidAmount("");
                  return;
                }

                setUploadSection(key || "");
              }}
            >
              {sectionOptions.map((section) => (
                <Dropdown.Item key={section} eventKey={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </Dropdown.Item>
              ))}
              {isInvoiceFolder && canMutateInvoiceFiles && (
                <>
                  <Dropdown.Divider />
                  <Dropdown.Item eventKey="__cancel_upload__" className="text-danger">
                    Cancel Upload Selection
                  </Dropdown.Item>
                </>
              )}
            </DropdownButton>
          )}

          <button
            type="button"
            className="admin-billing-file-btn admin-billing-file-btn-delete"
            onClick={() => onCreateDocument?.(folderName)}
          >
            Create
          </button>

          {!isInvoiceFolder && (
            <>
              <button
                type="button"
                className="admin-billing-file-btn admin-billing-file-btn-download"
                onClick={toggleSelectionMode}
              >
                Select
              </button>
            </>
          )}
        </div>
      </div>

      {selectionMode && (!isInvoiceFolder || canMutateInvoiceFiles) && (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <button
            type="button"
            className="admin-billing-file-btn admin-billing-file-btn-download"
            onClick={() => void handleBulkDownload()}
            disabled={selectedFileItems.length === 0 || bulkAction !== null}
            style={{
              opacity: selectedFileItems.length === 0 || bulkAction !== null ? 0.6 : 1,
              cursor: selectedFileItems.length === 0 || bulkAction !== null ? "not-allowed" : "pointer",
            }}
          >
            {bulkAction === "download" ? (
              <>
                <LoadingSpinner size={16} color="#ffffff" />
                Downloading...
              </>
            ) : (
              `Download Selected (${selectedFileItems.length})`
            )}
          </button>

          <button
            type="button"
            className="admin-billing-file-btn admin-billing-file-btn-delete"
                    onClick={() => handleBulkDelete()}
            disabled={selectedFileItems.length === 0 || bulkAction !== null}
            style={{
              opacity: selectedFileItems.length === 0 || bulkAction !== null ? 0.6 : 1,
              cursor: selectedFileItems.length === 0 || bulkAction !== null ? "not-allowed" : "pointer",
            }}
          >
            {bulkAction === "delete" ? (
              <>
                <LoadingSpinner size={16} color="#ffffff" />
                Deleting...
              </>
            ) : (
              `Delete Selected (${selectedFileItems.length})`
            )}
          </button>
        </div>
      )}

      {isInvoiceFolder && (
        <InvoicePhaseSummary
          expectedPaymentPhases={resolvedExpectedPaymentPhases || selectedCase?.expected_payment_phases || null}
          invoicePaymentPhases={resolvedInvoicePaymentPhases || selectedCase?.invoice_payment_phases || null}
          selectedStage={uploadSection}
          accentColor={colors.red}
          caseTypeFeeJson={selectedCase?.case_type_fee_json || null}
        />
      )}

      {isInvoiceFolder && canMutateInvoiceFiles && uploadSection && (
        <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem", maxWidth: "440px" }}>
          <input
            type="text"
            placeholder="Invoice Number (required)"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%" }}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Paid Amount (optional)"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%" }}
          />
        </div>
      )}

      <hr className="admin-billing-files-divider" />

      {loadingFiles && (
        <div className="admin-billing-files-loading">
          <LoadingSpinner size={44} color={colors.red} />
          <span style={{ color: "#475569", fontWeight: 600 }}>Loading documents...</span>
        </div>
      )}

      {!loadingFiles && (
        <ul className="admin-billing-file-list">
          {files.length === 0 && <p className="admin-billing-empty-list">No files found</p>}
          {files.map((file, idx) => (
          <li key={file.id || idx} className="admin-billing-file-row">
            <div className="admin-billing-file-main">
              <strong className="admin-billing-file-name">{file.fileName}</strong>
              {file.encrypted && (
                <span className="admin-billing-file-badge-encrypted">
                  ENCRYPTED
                </span>
              )}
            </div>
            <div className="admin-billing-file-actions">
              {!selectionMode && (
                <>
                  <button
                    type="button"
                    disabled={loadingAction === getActionKey("preview", file)}
                    className="admin-billing-file-btn admin-billing-file-btn-preview"
                    style={{ cursor: loadingAction === getActionKey("preview", file) ? "not-allowed" : "pointer" }}
                    onClick={() => openPreview(file)}
                  >
                    {loadingAction === getActionKey("preview", file) ? (
                      <>
                        <LoadingSpinner size={16} color="#ffffff" />
                        Previewing
                      </>
                    ) : (
                      "Preview"
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={loadingAction === getActionKey("download", file)}
                    onClick={() => downloadFile(file)}
                    className="admin-billing-file-btn admin-billing-file-btn-download"
                    style={{ cursor: loadingAction === getActionKey("download", file) ? "not-allowed" : "pointer" }}
                  >
                    {loadingAction === getActionKey("download", file) ? (
                      <>
                        <LoadingSpinner size={16} color="#ffffff" />
                        Downloading
                      </>
                    ) : (
                      "Download"
                    )}
                  </button>
                  {isInvoiceFolder && canMutateInvoiceFiles && (
                    <button
                      type="button"
                      disabled={loadingAction === getActionKey("update", file)}
                      className="admin-billing-file-btn admin-billing-file-btn-download"
                      style={{
                        opacity: loadingAction === getActionKey("update", file) ? 0.5 : 1,
                        cursor: loadingAction === getActionKey("update", file) ? "not-allowed" : "pointer",
                      }}
                      onClick={() => void handleInvoiceUpdateClick(file)}
                    >
                      {loadingAction === getActionKey("update", file) ? (
                        <>
                          <LoadingSpinner size={16} color="#ffffff" />
                          Loading
                        </>
                      ) : (
                        "Update"
                      )}
                    </button>
                  )}
                  {!isInvoiceFolder && (
                    <button
                      type="button"
                      disabled={loadingAction === getActionKey("delete", file)}
                      className="admin-billing-file-btn admin-billing-file-btn-delete"
                      style={{
                        opacity: loadingAction === getActionKey("delete", file) ? 0.5 : 1,
                        cursor: loadingAction === getActionKey("delete", file) ? "not-allowed" : "pointer",
                      }}
                      onClick={() => handleDelete(file)}
                    >
                      {loadingAction === getActionKey("delete", file) ? (
                        <>
                          <LoadingSpinner size={16} color="#ffffff" />
                          Deleting
                        </>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  )}
                </>
              )}

              {selectionMode && (!isInvoiceFolder || canMutateInvoiceFiles) && (
                <label className="admin-billing-file-select">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.fileName)}
                    onChange={() => toggleCheckbox(file.fileName)}
                  />
                  Choose
                </label>
              )}
            </div>
          </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        show={pendingDeleteFile !== null}
        title="Delete File"
        confirmText="Delete"
        confirmingText="Deleting..."
        isConfirming={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDeleteFile(null)}
      >
        {pendingDeleteFile ? (
          <p style={{ marginBottom: 0 }}>
            Are you sure you want to delete "{pendingDeleteFile.fileName}"? This action cannot be undone.
          </p>
        ) : null}
      </ConfirmModal>

      <ConfirmModal
        show={pendingInvoiceUploadFile !== null}
        title="Confirm Invoice Upload"
        confirmText="Upload"
        confirmingText="Uploading..."
        isConfirming={uploading}
        onConfirm={() => {
          if (pendingInvoiceUploadFile) {
            void submitUpload(pendingInvoiceUploadFile);
          }
        }}
        onCancel={() => setPendingInvoiceUploadFile(null)}
      >
        {pendingInvoiceUploadFile ? (
          <p style={{ marginBottom: 0 }}>
            Upload "{pendingInvoiceUploadFile.name}" to {formatStageLabel(uploadSection)} phase?
          </p>
        ) : null}
      </ConfirmModal>

      {showUpdateInfoModal && updateInfoPayload && (
        (() => {
          const resolvedCaseTypeFeeJson =
            parseCaseTypeFeeJson(updateInfoPayload.invoice?.case_type_fee_json) ||
            parseCaseTypeFeeJson(selectedCase?.case_type_fee_json);
          const resolvedTypeOfWork = resolveTypeOfWorkLabel(updateInfoPayload.invoice, resolvedCaseTypeFeeJson);
          const resolvedPhaseBalance = resolvePhaseBalanceValue(
            updateInfoPayload.invoice,
            updateInfoPayload.caseFinancials,
            selectedCase?.invoice_payment_phases
          );

          return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2800,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowUpdateInfoModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "min(96vw, 840px)",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.9rem 1rem",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontWeight: 700, color: colors.red }}>
                Invoice Update Data
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUpdateInfoModal(false);
                  setUpdateReplacementInfo(null);
                }}
                style={{
                  background: colors.red,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: "1rem", display: "grid", gap: "0.85rem" }}>
              {updateReplacementInfo && (
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #86efac",
                    color: "#14532d",
                    borderRadius: "10px",
                    padding: "0.75rem",
                    fontSize: "0.86rem",
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Invoice Regenerated</div>
                  <div><strong>Old Document ID:</strong> {updateReplacementInfo.oldDocumentId}</div>
                  <div><strong>New Document ID:</strong> {updateReplacementInfo.newDocumentId}</div>
                  <div><strong>New File Name:</strong> {updateReplacementInfo.newFileName}</div>
                </div>
              )}

              <div style={{ color: "#334155", fontSize: "0.9rem" }}>
                <strong>Document ID:</strong> {updateInfoPayload.documentId}<br />
                <strong>File Name:</strong> {updateInfoPayload.fileName}
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.35rem", color: "#1e293b" }}>Invoice Table Data</div>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "0.65rem 1rem",
                    fontSize: "0.86rem",
                  }}
                >
                  {[
                    { label: "Invoice ID", value: updateInfoPayload.invoice?.id ?? "" },
                    { label: "Invoice Number", value: updateInfoPayload.invoice?.invoice_number ?? "" },
                    { label: "Payment Stage", value: updateInfoPayload.invoice?.payment_stage ?? "" },
                    { label: "Type of Work", value: resolvedTypeOfWork },
                    { label: "Issue Date", value: updateInfoPayload.invoice?.issue_date ?? "" },
                    { label: "Due Date", value: updateInfoPayload.invoice?.due_date ?? "" },
                    { label: "Expected Amount", value: updateInfoPayload.invoice?.expected_amount ?? "" },
                    { label: "Balance", value: updateInfoPayload.invoice?.balance ?? "" },
                    { label: "Phase Balance", value: resolvedPhaseBalance },
                    { label: "Tax", value: updateInfoPayload.invoice?.tax ?? "" },
                    { label: "Discount", value: updateInfoPayload.invoice?.discount ?? "" },
                    { label: "Total Amount", value: updateInfoPayload.invoice?.total_amount ?? "" },
                  ].map((field) => (
                    <label key={field.label} style={{ display: "grid", gap: "0.25rem" }}>
                      <span style={{ fontWeight: 700, color: "#334155" }}>{field.label}</span>
                      <input
                        type="text"
                        value={String(field.value || "")}
                        readOnly
                        style={{
                          width: "100%",
                          padding: "0.45rem 0.6rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          background: "#f1f5f9",
                          color: "#334155",
                        }}
                      />
                    </label>
                  ))}

                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span style={{ fontWeight: 700, color: "#334155" }}>Paid Amount (Editable)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={updatePaidAmount}
                      onChange={(event) => setUpdatePaidAmount(event.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.6rem",
                        borderRadius: "8px",
                        border: `1px solid ${colors.red}`,
                        background: "#ffffff",
                        color: "#0f172a",
                      }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => void handleSaveInvoiceUpdate()}
                  disabled={isSavingInvoiceUpdate}
                  style={{
                    background: colors.red,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.55rem 1rem",
                    cursor: isSavingInvoiceUpdate ? "not-allowed" : "pointer",
                    opacity: isSavingInvoiceUpdate ? 0.65 : 1,
                    minWidth: "130px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                  }}
                >
                  {isSavingInvoiceUpdate ? (
                    <>
                      <LoadingSpinner size={14} color="#ffffff" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
          );
        })()
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2600,
          }}
          onClick={() => {
            if (previewFile) {
              URL.revokeObjectURL(previewFile);
            }
            setPreviewFile(null);
          }}
        >
          <div
            style={{
              width: "min(95vw, 1100px)",
              height: "min(90vh, 900px)",
              background: "white",
              borderRadius: "10px",
              overflow: "hidden",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                if (previewFile) {
                  URL.revokeObjectURL(previewFile);
                }
                setPreviewFile(null);
              }}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: colors.red,
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              Close
            </button>
            <iframe
              src={previewFile}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Preview"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CaseFolderSection;