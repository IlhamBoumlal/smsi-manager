// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API = 'http://localhost:5006';
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const normalizeRoleKey = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) return null;
    
    try {
      const parsed = JSON.parse(storedUser);
      if (!parsed || typeof parsed !== 'object') return null;

      if (!parsed.role && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const tokenRole = payload?.[ROLE_CLAIM] || payload?.role || null;
          if (tokenRole) {
            parsed.role = tokenRole;
            parsed.roleName = parsed.roleName || tokenRole;
          }
        } catch {
          // Ignore parse errors and keep stored user as-is.
        }
      }

      return parsed;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [permissions, setPermissions] = useState({ modules: [] });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);

  const refreshTimerRef = useRef(null);

  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  };

  const extractRoleFromPayload = (payload) => {
    if (!payload || typeof payload !== 'object') return null;
    return payload[ROLE_CLAIM] || payload.role || payload.Role || null;
  };

  const normalizeUserData = (rawUser) => {
    if (!rawUser || typeof rawUser !== 'object') return null;

    const token = rawUser.token || rawUser.Token || null;
    const payload = token ? decodeToken(token) : null;
    const roleFromToken = extractRoleFromPayload(payload);
    const role = rawUser.role ?? rawUser.roleName ?? rawUser.Role ?? roleFromToken ?? null;

    return {
      ...rawUser,
      token,
      role,
      roleName: rawUser.roleName ?? role,
      societeId: rawUser.societeId ?? payload?.societeId ?? null,
      societeNom: rawUser.societeNom ?? payload?.societeNom ?? null,
    };
  };

  const getMsUntilExpiry = (token) => {
    const payload = decodeToken(token);
    if (!payload?.exp) return null;
    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    return expiresAt - now;
  };

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

      const updatedUser = normalizeUserData({ ...JSON.parse(localStorage.getItem('user')), token });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      scheduleRefresh(token);
      await loadUserPermissions(token);
    } catch (err) {
      console.warn('Refresh token échoué, déconnexion.', err);
      logoutUser();
    }
  };

  const scheduleRefresh = (token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const msLeft = getMsUntilExpiry(token);
    if (!msLeft) return;
    const delay = Math.max(msLeft - 60_000, 5_000);
    console.log(`[Auth] Token refresh planifié dans ${Math.round(delay / 1000)}s`);
    refreshTimerRef.current = setTimeout(() => {
      refreshToken();
    }, delay);
  };

  const checkUserStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return true;
    try {
      const response = await axios.get(`${API}/api/auth/check-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data && response.data.isActive === false) {
        console.log('[Auth] Compte désactivé, déconnexion forcée');
        logoutUser();
        window.location.href = '/login?message=account_disabled';
        return false;
      }
      return true;
    } catch (error) {
      console.error('[Auth] Erreur vérification statut:', error);
      return true;
    }
  }, []);

  const loadUserPermissions = useCallback(async (token = null) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      setPermissions({ modules: [] });
      setPermissionsLoaded(false);
      return;
    }
    try {
      const response = await axios.get(`${API}/api/User/me/permissions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.data) {
        console.log('[Permissions] Chargées avec succès:', response.data);
        setPermissions(response.data);
        setPermissionsLoaded(true);
      }
    } catch (error) {
      console.error('[Permissions] Erreur chargement:', error.response?.status, error.response?.data);
      setPermissions({ modules: [] });
      setPermissionsLoaded(false);
    }
  }, []);

  const can = useCallback((moduleCode, actionCode) => {
    if (!permissions.modules || permissions.modules.length === 0) return false;
    const module = permissions.modules.find(m => m.moduleCode === moduleCode);
    if (!module) return false;
    return module.actions.some(a => a.actionCode === actionCode);
  }, [permissions]);

  const canRead = useCallback((moduleCode) => can(moduleCode, 'view'), [can]);
  const canWrite = useCallback((moduleCode) => can(moduleCode, 'create'), [can]);
  const canEdit = useCallback((moduleCode) => can(moduleCode, 'edit'), [can]);
  const canDelete = useCallback((moduleCode) => can(moduleCode, 'delete'), [can]);
  const canExport = useCallback((moduleCode) => can(moduleCode, 'export'), [can]);

  const loginUser = async (data) => {
    if (!data?.token) return;
    if (data.isActive === false) {
      console.error('[Auth] Tentative de connexion avec compte désactivé');
      throw new Error("Compte désactivé");
    }
    const normalizedUser = normalizeUserData(data);
    localStorage.setItem('token', normalizedUser.token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    setUser(normalizedUser);
    scheduleRefresh(normalizedUser.token);
    await loadUserPermissions(normalizedUser.token);
    startStatusCheck();
  };

  const startStatusCheck = () => {
    if (statusCheckInterval) clearInterval(statusCheckInterval);
    const interval = setInterval(() => {
      checkUserStatus();
    }, 60000);
    setStatusCheckInterval(interval);
  };

  const stopStatusCheck = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
  };

  const logoutUser = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    stopStatusCheck();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions({ modules: [] });
    setPermissionsLoaded(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      if (token && !storedUser) localStorage.removeItem('token');
      setUser(null);
      setPermissions({ modules: [] });
      setPermissionsLoaded(false);
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed && typeof parsed === 'object') {
        const normalizedUser = normalizeUserData(parsed);
        setUser(normalizedUser);
        const msLeft = getMsUntilExpiry(token);
        if (!msLeft || msLeft <= 0) {
          refreshToken();
        } else {
          scheduleRefresh(token);
          loadUserPermissions(token);
          checkUserStatus();
          startStatusCheck();
        }
      }
    } catch {
      localStorage.removeItem('user');
      setUser(null);
    }
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      stopStatusCheck();
    };
  }, []);

  const currentRole = user?.role || user?.roleName || '';
  const isSuperAdmin = normalizeRoleKey(currentRole) === 'super admin';
  const isAdminSociete = normalizeRoleKey(currentRole) === 'admin societe';

  return (
    <AuthContext.Provider value={{ 
      user, 
      isSuperAdmin,
      isAdminSociete,
      loginUser, 
      logoutUser,
      permissions,
      permissionsLoaded,
      can,
      canRead,
      canWrite,
      canEdit,
      canDelete,
      canExport,
      checkUserStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);