import React, { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  id: number;
  firmID: string;
  name: string;
  email: string;
  username?: string;
  age?: number;
  ICNumber?: string;
  phoneNumber?: string;
  HomeAddress?: string;
  gender?: string;
  maritalStatus?: string;
  status?: string;
  role?: "admin" | "client" | "lawyer";
  created_at?: string;
}

export interface Case {
  caseId: number;
  title: string;
  caseType?: "Litigation" | "Criminal" | "Corporate";
  description?: string;
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
    initial: { expected: number; paid: number; balance: number };
    first: { expected: number; paid: number; balance: number };
    second: { expected: number; paid: number; balance: number };
    third: { expected: number; paid: number; balance: number };
    final: { expected: number; paid: number; balance: number };
  };
  clientName: string;
  clientFirmID?: string;
  lawyerFirmID?: string;
  lawyerName: string;
  created_at?: string;
  updated_at?: string;
  blob_folder_path: string;
}

interface ClientDataContextType {
  authUser: User | null;   // logged-in user
  cases: Case[];           // cases related to the user
  setUserData: (user: User, cases: Case[]) => void;
  setCasesData: (cases: Case[]) => void;
  upsertCase: (updatedCase: Case) => void;
  clearUserData: () => void;
}

const ClientDataContext = createContext<ClientDataContextType | undefined>(undefined);

export const ClientDataProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [cases, setCases] = useState<Case[]>([]);

  const setUserData = (user: User, cases: Case[]) => {
    setAuthUser(user);
    setCases(cases);
  };

  const setCasesData = (nextCases: Case[]) => {
    setCases(nextCases);
  };

  const upsertCase = (updatedCase: Case) => {
    const updatedCaseId = Number((updatedCase as any)?.caseId ?? (updatedCase as any)?.id);
    if (!Number.isFinite(updatedCaseId) || updatedCaseId <= 0) return;

    setCases((prevCases) => {
      const existingIndex = prevCases.findIndex(
        (item) => Number((item as any)?.caseId ?? (item as any)?.id) === updatedCaseId
      );

      if (existingIndex === -1) {
        return [updatedCase, ...prevCases];
      }

      const nextCases = [...prevCases];
      nextCases[existingIndex] = {
        ...nextCases[existingIndex],
        ...updatedCase,
      };
      return nextCases;
    });
  };

  const clearUserData = () => {
    setAuthUser(null);
    setCases([]);
  };

  return (
    <ClientDataContext.Provider value={{ authUser, cases, setUserData, setCasesData, upsertCase, clearUserData }}>
      {children}
    </ClientDataContext.Provider>
  );
};

export const useClientData = () => {
  const context = useContext(ClientDataContext);
  if (!context) throw new Error("useClientData must be used within ClientDataProvider");
  return context;
};
