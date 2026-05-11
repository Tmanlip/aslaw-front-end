export interface EncryptedDocumentItem {
  document_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  category: "documents" | "reports" | "invoices";
  is_encrypted?: boolean;
  status: string;
  created_at: string;
  preview_url: string;
  download_url: string;
  delete_url: string;
}

export interface InvoicePhaseSummary {
  expected: number;
  paid: number;
  balance: number;
}

export interface Case {
  caseId: number;
  id?: number;
  caseName?: string;
  title: string;
  caseType?: "Litigation" | "Criminal" | "Corporate";
  description: string;
  status: string;
  progress?: number;
  expected_payment_phases?: {
    initial: number;
    first: number;
    second: number;
    third: number;
    final: number;
  };
  invoice_payment_phases?: {
    initial: InvoicePhaseSummary;
    first: InvoicePhaseSummary;
    second: InvoicePhaseSummary;
    third: InvoicePhaseSummary;
    final: InvoicePhaseSummary;
  };
  clientName: string;
  lawyerName: string;
  created_at: string;
  blob_folder_path: string;
  lawyerFirmID: string;
  clientFirmID: string;
  clientId: number;
  lawyerId: number;
  encrypted_documents?: EncryptedDocumentItem[];
  case_type_fee_json?: {
    initial?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    first?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    second?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    third?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    final?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
  };
}

export interface Client {
  id: number;
  firmID: string;
  name: string;
  email: string;
  username: string;
  age: number;
  ICNumber: string;
  phoneNumber: string;
  HomeAddress: string;
  gender: string;
  maritalStatus: string;
  status: string;
  created_at: string;
  photo?: string; // ✅ added optional photo field
}

export interface Lawyer {
  id: number;
  firmID: string;
  name: string;
  email: string;
  username: string;
  age: number;
  ICNumber: string;
  phoneNumber: string;
  HomeAddress: string;
  gender: string;
  maritalStatus: string;
  status: string;
  created_at: string;
  photo?: string; // ✅ added optional photo field
}

export interface ClientFullData {
  client: Client;
  cases: Case[];
}

export interface LawyerFullData {
  lawyer: Lawyer;
  cases: Case[]; // optional if you want lawyer's assigned cases
}

export interface User {
  id: number;
  firmID: string;
  name: string;
  email: string;
  role: "admin" | "junioradmin" | "client" | "lawyer";
  status: "Active" | "Inactive" | "Archived";
  caseId?: number | null;
}

export interface CaseRecord {
  clientId: number;
  clientName?: string;
  lawyerId?: number | null;
  lawyerName?: string;
  blob_folder_path?: string;
  case_type_fee_json?: {
    initial?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    first?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    second?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    third?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
    final?: Array<{ practiceArea?: string; typeOfWork?: string; selectedFee?: number; estimationFeesRange?: string }>;
  };
}