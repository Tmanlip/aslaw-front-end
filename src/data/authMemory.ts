import { ClientFullData, LawyerFullData } from "./userInfo";

let _token: string | null = null;
let _user: any = null; // could be AuthUser or ClientFullData.client
let _clientFullData: ClientFullData | null = null;
let _lawyerFullData: LawyerFullData | null = null;

const AuthMemory = {
  setAuth: (token: string, user: any) => {
    _token = token;
    _user = user;
  },

  getToken: (): string | null => _token,

  getUser: (): any | null => _user,

  setClientFullData: (data: ClientFullData) => {
    _clientFullData = data;
  },

  getClientFullData: (): ClientFullData | null => _clientFullData,

   // --- Lawyer Data ---
  setLawyerFullData: (data: LawyerFullData) => {
    _lawyerFullData = data;
  },

  getLawyerFullData: (): LawyerFullData | null => _lawyerFullData,

    // --- Clear All ---
  clear: () => {
    _token = null;
    _user = null;
    _clientFullData = null;
    _lawyerFullData = null;
  },

  isLoggedIn: (): boolean => !!_token && !!_user,
};

export default AuthMemory;