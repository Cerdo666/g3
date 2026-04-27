import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string;
  userName: string;
  userId: string;
  userRole: string;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (email: string, name: string, id: string, role: string, token: string, refreshToken?: string) => void;
  updateAccessToken: (token: string) => void;
  logout: () => void;
  restoreSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const setAuth = (email: string, name: string, id: string, role: string, token: string, refreshTokenParam?: string) => {
    setUserEmail(email);
    setUserName(name);
    setUserId(id);
    setUserRole(role);
    setAccessToken(token);
    setIsAuthenticated(true);
    
    // Store in sessionStorage
    sessionStorage.setItem('authToken', JSON.stringify({
      email,
      name,
      id,
      role,
      token,
      refreshToken: refreshTokenParam || null,
    }));
    
    if (refreshTokenParam) {
      setRefreshToken(refreshTokenParam);
    }
  };

  const updateAccessToken = (token: string) => {
    setAccessToken(token);
    const saved = sessionStorage.getItem('authToken');
    if (saved) {
      const auth = JSON.parse(saved);
      auth.token = token;
      sessionStorage.setItem('authToken', JSON.stringify(auth));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setUserName('');
    setUserId('');
    setUserRole('');
    setAccessToken(null);
    setRefreshToken(null);
    sessionStorage.removeItem('authToken');
  };

  const restoreSession = async (): Promise<boolean> => {
    const saved = sessionStorage.getItem('authToken');
    if (!saved) return false;

    try {
      const auth = JSON.parse(saved);
      setUserEmail(auth.email);
      setUserName(auth.name);
      setUserId(auth.id);
      setUserRole(auth.role);
      setAccessToken(auth.token);
      if (auth.refreshToken) {
        setRefreshToken(auth.refreshToken);
      }
      setIsAuthenticated(true);
      return true;
    } catch {
      sessionStorage.removeItem('authToken');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userEmail,
      userName,
      userId,
      userRole,
      accessToken,
      refreshToken,
      setAuth,
      updateAccessToken,
      logout,
      restoreSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
