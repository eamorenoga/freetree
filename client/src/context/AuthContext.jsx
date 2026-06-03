import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("terrabiocol_token");
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("terrabiocol_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier, password) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    });
    localStorage.setItem("terrabiocol_token", data.token);
    setUser(data.user);
  }

  async function register(name, username, email, password) {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, username, email, password })
    });
    localStorage.setItem("terrabiocol_token", data.token);
    setUser(data.user);
  }

  async function updateProfile(profile) {
    const data = await apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profile)
    });
    setUser(data.user);
    return data.user;
  }

  async function forgotPassword(identifier) {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier })
    });
  }

  async function resetPassword(token, password) {
    return apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password })
    });
  }

  function logout() {
    localStorage.removeItem("terrabiocol_token");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, updateProfile, forgotPassword, resetPassword, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
