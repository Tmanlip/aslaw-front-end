export interface Case {
  caseId: number;
  title: string;
  description: string;
  status: string;
  clientName: string;
  lawyerName: string;
  created_at: string;
  blob_folder_path: string;
  lawyerFirmID: string;
  clientFirmID: string;
  clientId: number;
  lawyerId: number;
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
  role: "admin" | "client" | "lawyer";
  status: "Active" | "Inactive";
  caseId?: number | null;
}

export interface CaseRecord {
  clientId: number;
  clientName?: string;
  lawyerId?: number | null;
  lawyerName?: string;
  blob_folder_path?: string;
}