import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  id: number;
  email: string;
  password: string;
  credits: number;
  name?: string;
  username?: string;
  phone?: string;
  imageUrl?: string;
  paidMiTienda?: boolean;
  paidMiTiendaDate?: string;
}

interface SignUpUserInfo {
  email: string | null;
  password: string | null;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  register: (info: SignUpUserInfo) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginOrRegister: (email: string, password: string) => Promise<boolean>;
  signUpInfo: SignUpUserInfo;
  setSignUpInfo: React.Dispatch<React.SetStateAction<SignUpUserInfo>>;
  showPaymentModal: boolean;
  setShowPaymentModal: React.Dispatch<React.SetStateAction<boolean>>;
}
 
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("There is no Auth provider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signUpInfo, setSignUpInfo] = useState<SignUpUserInfo>({
    email: null,
    password: null,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const url = "https://api.tiendia.app/api";

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(url + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(error);
        throw new Error(error.message);
      }

      const data = await response.json();
      setUser({
        id: data.user[0].id,
        email: data.user[0].email,
        password: data.user[0].password,
        credits: data.user[0].credits,
        name: data.user[0].name,
        username: data.user[0].username,
        phone: data.user[0].phone,
        imageUrl: data.user[0].imageUrl,
        paidMiTienda: data.user[0].paidMiTienda,
        paidMiTiendaDate: data.user[0].paidMiTiendaDate,
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (info: SignUpUserInfo) => {
    setLoading(true);
    try {
      const response = await fetch(url + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(error);
        throw new Error(error.message);
      }

      const data = await response.json();
      setUser({
        id: data.user[0].id,
        email: data.user[0].email,
        password: data.user[0].password,
        credits: data.user[0].credits,
        name: data.user[0].name,
        username: data.user[0].username,
        phone: data.user[0].phone,
        imageUrl: data.user[0].imageUrl,
        paidMiTienda: data.user[0].paidMiTienda,
        paidMiTiendaDate: data.user[0].paidMiTiendaDate,
      });
      return true;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const response = await fetch(url + "/auth/logout", {
        method: "DELETE",
        credentials: "include",
      });
      console.log(response)
      if (!response.ok) {
        const error = await response.json();
        console.log(error);
        throw new Error(error.message);
      }

      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loginOrRegister = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(url + "/auth/login-or-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      const data = await response.json();
      // The user may be in data.user or data.user[0]
      const userData = data.user[0] || data.user;
      setUser({
        id: userData.id,
        email: userData.email,
        password: userData.password,
        credits: userData.credits,
        name: userData.name,
        username: userData.username,
        phone: userData.phone,
        imageUrl: userData.imageUrl,
        paidMiTienda: userData.paidMiTienda,
        paidMiTiendaDate: userData.paidMiTiendaDate,
      });
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(url + "/auth/profile", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.user) {
          setUser({
            id: data.user[0].id,
            email: data.user[0].email,
            password: data.user[0].password,
            credits: data.user[0].credits,
            name: data.user[0].name,
            username: data.user[0].username,
            phone: data.user[0].phone,
            imageUrl: data.user[0].imageUrl,
            paidMiTienda: data.user[0].paidMiTienda,
            paidMiTiendaDate: data.user[0].paidMiTiendaDate,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        register,
        login,
        logout,
        loginOrRegister,
        signUpInfo,
        setSignUpInfo,
        showPaymentModal,
        setShowPaymentModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}