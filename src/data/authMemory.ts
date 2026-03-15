import { ClientFullData, LawyerFullData } from "./userInfo";

const TOKEN_KEY = "token";
const USER_KEY = "user";

let _token: string | null = localStorage.getItem(TOKEN_KEY);
let _user: any = null; // could be AuthUser or ClientFullData.client
let _clientFullData: ClientFullData | null = null;
let _lawyerFullData: LawyerFullData | null = null;

try {
  const rawUser = localStorage.getItem(USER_KEY);
  _user = rawUser ? JSON.parse(rawUser) : null;
} catch {
  _user = null;
}

const AuthMemory = {
  setAuth: (token: string | null, user: any) => {
    _token = token;
    _user = user;

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isLoggedIn: (): boolean => !!_user,
};

export default AuthMemory;