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

interface AuthContextType {
  role: Role;
  user: any | null;
  loading: boolean; // ✅ Added loading state
  login: (role: Role, user?: any | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Auth loading state

  // Load role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedRole) {
      setRole(savedRole as Role);
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }

    setLoading(false); // ✅ Auth ready
  }, []);

  const login = (newRole: Role, userData: any | null = null) => {
    setRole(newRole);
    if (newRole) {
      localStorage.setItem("role", newRole);
    } else {
      localStorage.removeItem("role");
    }

    setUser(userData);
    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    localStorage.removeItem("role");
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ role, user, loading, login, logout }}>
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