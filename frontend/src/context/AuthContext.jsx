import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser || isTokenExpired(token)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }

    try {
      const parsed = JSON.parse(storedUser);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const loginUser = (data) => {
    if (!data?.token) return;
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      logoutUser();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
