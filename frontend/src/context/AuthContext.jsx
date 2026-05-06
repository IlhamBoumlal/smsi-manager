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

  // Nouveaux états pour les permissions
  const [permissions, setPermissions] = useState({ modules: [] });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

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
      roleName: rawUser.roleName ?? role
    };
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
      const updatedUser = normalizeUserData({ ...JSON.parse(localStorage.getItem('user')), token });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Replanifie le prochain refresh
      scheduleRefresh(token);
      
      // Recharge les permissions avec le nouveau token
      await loadUserPermissions(token);
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

  /* ─── Charger les permissions de l'utilisateur ──────────────── */
 const loadUserPermissions = useCallback(async (token = null) => {
  const authToken = token || localStorage.getItem('token');
  if (!authToken) {
    setPermissions({ modules: [] });
    setPermissionsLoaded(false);
    return;
  }

  try {
    const response = await axios.get(`${API}/api/User/me/permissions`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
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
  /* ─── Vérifier si l'utilisateur a une permission ───────────── */
  const can = useCallback((moduleCode, actionCode) => {
    if (!permissions.modules || permissions.modules.length === 0) return false;
    
    const module = permissions.modules.find(m => m.moduleCode === moduleCode);
    if (!module) return false;
    
    return module.actions.some(a => a.actionCode === actionCode);
  }, [permissions]);

  /* ─── Vérifier si l'utilisateur peut lire un module ─────────── */
  const canRead = useCallback((moduleCode) => can(moduleCode, 'view'), [can]);

  /* ─── Vérifier si l'utilisateur peut écrire ─────────────────── */
  const canWrite = useCallback((moduleCode) => can(moduleCode, 'create'), [can]);

  /* ─── Vérifier si l'utilisateur peut modifier ───────────────── */
  const canEdit = useCallback((moduleCode) => can(moduleCode, 'edit'), [can]);

  /* ─── Vérifier si l'utilisateur peut supprimer ──────────────── */
  const canDelete = useCallback((moduleCode) => can(moduleCode, 'delete'), [can]);

  /* ─── Vérifier si l'utilisateur peut exporter ───────────────── */
  const canExport = useCallback((moduleCode) => can(moduleCode, 'export'), [can]);

  /* ─── Login ─────────────────────────────────────────────────── */
  const loginUser = async (data) => {
    if (!data?.token) return;
    const normalizedUser = normalizeUserData(data);

    localStorage.setItem('token', normalizedUser.token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    setUser(normalizedUser);
    scheduleRefresh(normalizedUser.token);
    
    // Charger les permissions après connexion
    await loadUserPermissions(normalizedUser.token);
  };

  /* ─── Logout ────────────────────────────────────────────────── */
  const logoutUser = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions({ modules: [] });
    setPermissionsLoaded(false);
  };

  /* ─── Au démarrage : si token déjà en storage, planifie refresh et charge permissions */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      if (token && !storedUser) {
        localStorage.removeItem('token');
      }
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
          // Token déjà expiré → tente refresh direct
          refreshToken();
        } else {
          scheduleRefresh(token);
          // Charger les permissions au démarrage
          loadUserPermissions(token);
        }
      }
    } catch {
      localStorage.removeItem('user');
      setUser(null);
    }
    
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
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
      canExport
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
