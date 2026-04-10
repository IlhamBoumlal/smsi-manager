import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API = 'http://localhost:5006';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? JSON.parse(localStorage.getItem('user')) : null;
  });

  const refreshTimerRef = useRef(null);

  /* ─── Décode le JWT pour lire l'expiration ─────────────────── */
  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  };

  /* ─── Calcule le délai avant expiration (en ms) ────────────── */
  const getMsUntilExpiry = (token) => {
    const payload = decodeToken(token);
    if (!payload?.exp) return null;
    const expiresAt = payload.exp * 1000; // exp est en secondes
    const now = Date.now();
    return expiresAt - now;
  };

  /* ─── Rafraîchit le token ───────────────────────────────────── */
  const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      logoutUser();
      return;
    }
    try {
      const res = await axios.post(`${API}/api/auth/refresh`, {
        refreshToken: storedRefreshToken,
      });
      const { token, refreshToken: newRefreshToken } = res.data;
      localStorage.setItem('token', token);
      if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

      // Met à jour user avec le nouveau token
      const updatedUser = { ...JSON.parse(localStorage.getItem('user')), token };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Replanifie le prochain refresh
      scheduleRefresh(token);
    } catch (err) {
      console.warn('Refresh token échoué, déconnexion.', err);
      logoutUser();
    }
  };

  /* ─── Planifie le refresh 1 min avant expiration ───────────── */
  const scheduleRefresh = (token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const msLeft = getMsUntilExpiry(token);
    if (!msLeft) return;

    // Rafraîchit 60 secondes avant l'expiration (minimum 5s)
    const delay = Math.max(msLeft - 60_000, 5_000);
    console.log(`[Auth] Token refresh planifié dans ${Math.round(delay / 1000)}s`);

    refreshTimerRef.current = setTimeout(() => {
      refreshToken();
    }, delay);
  };

  /* ─── Login ─────────────────────────────────────────────────── */
  const loginUser = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    setUser(data);
    scheduleRefresh(data.token);
  };

  /* ─── Logout ────────────────────────────────────────────────── */
  const logoutUser = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  /* ─── Au démarrage : si token déjà en storage, planifie refresh */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const msLeft = getMsUntilExpiry(token);
      if (!msLeft || msLeft <= 0) {
        // Token déjà expiré → tente refresh direct
        refreshToken();
      } else {
        scheduleRefresh(token);
      }
    }
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);