// context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Role = "admin" | "client" | "lawyer" | null;
const USER_KEY = "user";
const ROLE_KEY = "role";
const STORAGE_MODE_KEY = "auth_storage_mode";
type StorageMode = "local" | "session";

const getStorageByMode = (mode: StorageMode): Storage =>
  mode === "local" ? localStorage : sessionStorage;

const resolveInitialStorage = (): Storage => {
  const mode = localStorage.getItem(STORAGE_MODE_KEY) as StorageMode | null;
  if (mode === "local" || mode === "session") {
    return getStorageByMode(mode);
  }

  if (localStorage.getItem(USER_KEY) || localStorage.getItem(ROLE_KEY)) {
    return localStorage;
  }

  return sessionStorage;
};

interface AuthContextType {
  role: Role;
  user: any | null;
  loading: boolean; // ✅ Added loading state
  isArchived: boolean; // ✅ Track if user is archived
  isInactive: boolean; // ✅ Track if user is inactive
  login: (role: Role, user?: any | null, persist?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Auth loading state
  const [isArchived, setIsArchived] = useState(false); // ✅ Track archived status
  const [isInactive, setIsInactive] = useState(false); // ✅ Track inactive status

  // Load role from localStorage on mount
  useEffect(() => {
    const storage = resolveInitialStorage();
    const savedRole = storage.getItem(ROLE_KEY);
    const savedUser = storage.getItem(USER_KEY);
    let parsedUser: any | null = null;

    if (savedRole) {
      setRole(savedRole as Role);
    }

    if (savedUser) {
      try {
        parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Check if user is archived or inactive
        const status = parsedUser?.status ? String(parsedUser.status).toLowerCase() : '';
        setIsArchived(status === 'archived');
        setIsInactive(status === 'inactive');
      } catch {
        setUser(null);
        setIsArchived(false);
        setIsInactive(false);
      }
    }

    // Fallback: recover role from saved user payload if role key is missing.
    if (!savedRole && parsedUser?.role) {
      const possibleRole = String(parsedUser.role).toLowerCase();
      if (possibleRole === "admin" || possibleRole === "client" || possibleRole === "lawyer") {
        const validRole = possibleRole as Exclude<Role, null>;
        setRole(validRole);
        storage.setItem(ROLE_KEY, validRole);
      }
    }

    setLoading(false); // ✅ Auth ready
  }, []);

  const login = (newRole: Role, userData: any | null = null, persist: boolean = true) => {
    const storageMode: StorageMode = persist ? "local" : "session";
    const targetStorage = getStorageByMode(storageMode);

    localStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(ROLE_KEY);

    setRole(newRole);
    if (newRole) {
      targetStorage.setItem(ROLE_KEY, newRole);
      localStorage.setItem(STORAGE_MODE_KEY, storageMode);
    } else {
      localStorage.removeItem(STORAGE_MODE_KEY);
    }

    setUser(userData);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);

    if (userData) {
      targetStorage.setItem(USER_KEY, JSON.stringify(userData));
      // Check if user is archived or inactive
      const status = userData?.status ? String(userData.status).toLowerCase() : '';
      setIsArchived(status === 'archived');
      setIsInactive(status === 'inactive');
    } else {
      setIsArchived(false);
      setIsInactive(false);
    }
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    setIsArchived(false);
    setIsInactive(false);
    localStorage.removeItem(STORAGE_MODE_KEY);
    localStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ role, user, loading, isArchived, isInactive, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

// Export for consumption
export default AuthContext;