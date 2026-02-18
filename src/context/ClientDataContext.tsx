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
  description?: string;
  status: string;
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

  const clearUserData = () => {
    setAuthUser(null);
    setCases([]);
  };

  return (
    <ClientDataContext.Provider value={{ authUser, cases, setUserData, clearUserData }}>
      {children}
    </ClientDataContext.Provider>
  );
};

export const useClientData = () => {
  const context = useContext(ClientDataContext);
  if (!context) throw new Error("useClientData must be used within ClientDataProvider");
  return context;
};
