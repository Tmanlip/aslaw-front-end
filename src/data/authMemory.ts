import { ClientFullData, LawyerFullData } from "./userInfo";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const STORAGE_MODE_KEY = "auth_storage_mode";
type StorageMode = "local" | "session";

const getStorageByMode = (mode: StorageMode): Storage =>
  mode === "local" ? localStorage : sessionStorage;

const clearPersistedAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

const resolveInitialAuth = () => {
  const preferredMode = localStorage.getItem(STORAGE_MODE_KEY) as StorageMode | null;

  // Respect the last selected persistence mode first.
  if (preferredMode === "local" || preferredMode === "session") {
    const preferredStorage = getStorageByMode(preferredMode);
    const token = preferredStorage.getItem(TOKEN_KEY);
    const rawUser = preferredStorage.getItem(USER_KEY);
    if (token || rawUser) {
      return { token, rawUser };
    }
  }

  // Backward compatibility for older saved auth (localStorage only).
  const localToken = localStorage.getItem(TOKEN_KEY);
  const localUser = localStorage.getItem(USER_KEY);
  if (localToken || localUser) {
    return { token: localToken, rawUser: localUser };
  }

  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  const sessionUser = sessionStorage.getItem(USER_KEY);
  return { token: sessionToken, rawUser: sessionUser };
};

const initialAuth = resolveInitialAuth();
let _token: string | null = initialAuth.token;
let _user: any = null; // could be AuthUser or ClientFullData.client
let _clientFullData: ClientFullData | null = null;
let _lawyerFullData: LawyerFullData | null = null;

try {
  _user = initialAuth.rawUser ? JSON.parse(initialAuth.rawUser) : null;
} catch {
  _user = null;
}

const AuthMemory = {
  setAuth: (token: string | null, user: any, persist: boolean = true) => {
    _token = token;
    _user = user;

    const storageMode: StorageMode = persist ? "local" : "session";
    const targetStorage = getStorageByMode(storageMode);

    clearPersistedAuth();

    if (token) {
      targetStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(STORAGE_MODE_KEY, storageMode);
    } else {
      localStorage.removeItem(STORAGE_MODE_KEY);
    }

    if (user) {
      targetStorage.setItem(USER_KEY, JSON.stringify(user));
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
    localStorage.removeItem(STORAGE_MODE_KEY);
    clearPersistedAuth();
  },

  isLoggedIn: (): boolean => !!_user,
};

export default AuthMemory;