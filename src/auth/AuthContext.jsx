import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import client, {
  getToken,
  setToken,
} from "../api/client";

const AuthContext = createContext(null);

const USER_KEY = "bitcoin_forensics_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await client.get("/auth/me");

        setUser(data.user);

        localStorage.setItem(
          USER_KEY,
          JSON.stringify(data.user)
        );
      } catch {
        setToken(null);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();

    const handleExpired = () => {
      setToken(null);
      localStorage.removeItem(USER_KEY);
      setUser(null);
    };

    window.addEventListener(
      "auth-expired",
      handleExpired
    );

    return () => {
      window.removeEventListener(
        "auth-expired",
        handleExpired
      );
    };
  }, []);

  async function login(email, password) {
    try {
      const data = await client.post("/auth/login", {
        email,
        password,
      });

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(data.user)
      );

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.message || "Unable to sign in.",
      };
    }
  }

  async function register(name, email, password) {
    try {
      const data = await client.post("/auth/register", {
        name,
        email,
        password,
      });

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(data.user)
      );

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.message ||
          "Unable to create account.",
      };
    }
  }

  function logout() {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}