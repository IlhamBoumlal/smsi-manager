import { REQUEST_TIMEOUT_MS, SMSI_API_BASE_URL } from "../config.js";
import { ChatbotServiceError } from "../services/chatbotService.js";

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) return "";
  const [scheme, token] = String(authorizationHeader).split(" ");
  if (!scheme || !token) return "";
  return scheme.toLowerCase() === "bearer" ? token.trim() : "";
}

function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function isConnectionError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("econnrefused") ||
    message.includes("fetch failed") ||
    message.includes("networkerror") ||
    message.includes("socket") ||
    message.includes("connect")
  );
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s\-_.]/g, "")
    .trim();
}

function canonicalModuleCode(value) {
  const key = normalizeKey(value);
  if (key === "audits") return "audit";
  if (key === "tableaudebord" || key === "tableaubord") return "dashboard";
  return key;
}

function canonicalActionCode(value) {
  const key = normalizeKey(value);
  if (!key) return "";
  if (key === "l" || key === "lecture" || key === "view") return "read";
  if (key === "u" || key === "use" || key === "utiliser" || key === "usage") return "use";
  if (key === "c" || key === "creation" || key === "write") return "create";
  if (key === "m" || key === "update" || key === "modification") return "edit";
  if (key === "s" || key === "remove" || key === "suppression") return "delete";
  if (key === "i" || key === "importer") return "import";
  if (key === "e") return "export";
  if (key === "a" || key === "approve" || key === "approbation") return "approve";
  if (key === "adm" || key === "admin" || key === "manage" || key === "gestion") {
    return "administer";
  }
  return key;
}

function decodeJwtPayload(token) {
  try {
    const [, payloadPart] = String(token || "").split(".");
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const parsed = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function extractRolesFromPayload(payload) {
  const values = [];
  const candidates = [
    payload?.[ROLE_CLAIM],
    payload?.role,
    payload?.roles,
    payload?.Role,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      values.push(...candidate);
      continue;
    }
    if (candidate !== null && candidate !== undefined && String(candidate).trim()) {
      values.push(candidate);
    }
  }

  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function isSuperAdminRole(roles = []) {
  return roles.some((role) => normalizeKey(role) === "superadmin");
}

function parseSocieteId(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function buildPermissionScope(payload) {
  const modules = Array.isArray(payload?.modules) ? payload.modules : [];
  const byModule = new Map();

  for (const moduleRow of modules) {
    const moduleCode = canonicalModuleCode(
      moduleRow?.moduleCode ?? moduleRow?.moduleName ?? moduleRow?.code ?? ""
    );
    if (!moduleCode) continue;

    if (!byModule.has(moduleCode)) {
      byModule.set(moduleCode, new Set());
    }

    const actionSet = byModule.get(moduleCode);
    const actions = Array.isArray(moduleRow?.actions) ? moduleRow.actions : [];
    for (const actionRow of actions) {
      const actionCode = canonicalActionCode(
        actionRow?.actionCode ?? actionRow?.actionName ?? actionRow?.code ?? ""
      );
      if (actionCode) {
        actionSet.add(actionCode);
      }
    }
  }

  return {
    modules: byModule,
    can(moduleCode, actionCode = "read") {
      const moduleKey = canonicalModuleCode(moduleCode);
      const actionKey = canonicalActionCode(actionCode);
      if (!moduleKey || !actionKey) return false;
      const actions = byModule.get(moduleKey);
      if (!actions || actions.size === 0) return false;
      if (actions.has(actionKey)) return true;
      return actions.has("administer");
    },
    canRead(moduleCode) {
      return this.can(moduleCode, "read");
    },
  };
}

async function fetchUserPermissions(token) {
  let response;
  try {
    response = await fetchWithTimeout(`${SMSI_API_BASE_URL}/api/User/me/permissions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ChatbotServiceError(
        "Verification des permissions expiree (timeout).",
        504,
        "CHATBOT_AUTH_TIMEOUT"
      );
    }

    if (isConnectionError(error)) {
      throw new ChatbotServiceError(
        "Service des permissions indisponible.",
        503,
        "CHATBOT_AUTH_PROVIDER_UNAVAILABLE"
      );
    }

    throw new ChatbotServiceError(
      "Erreur lors de la verification des permissions.",
      503,
      "CHATBOT_AUTH_PROVIDER_FAILED"
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new ChatbotServiceError(
      "Acces chatbot refuse pour votre role/perimetre.",
      403,
      "CHATBOT_PERMISSION_DENIED"
    );
  }

  if (!response.ok) {
    throw new ChatbotServiceError(
      "Impossible de recuperer les permissions utilisateur.",
      503,
      "CHATBOT_AUTH_PROVIDER_FAILED",
      { status: response.status }
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return buildPermissionScope(payload);
}

export async function requireAuthenticatedUser(req, _res, next) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    next(
      new ChatbotServiceError(
        "Token manquant. Connectez-vous a l'application.",
        401,
        "CHATBOT_AUTH_REQUIRED"
      )
    );
    return;
  }

  const tokenPayload = decodeJwtPayload(token);
  const tokenRoles = extractRolesFromPayload(tokenPayload);
  const tokenIsSuperAdmin = isSuperAdminRole(tokenRoles);

  let response;
  try {
    response = await fetchWithTimeout(`${SMSI_API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      next(
        new ChatbotServiceError(
          "Verification d'identite expiree (timeout).",
          504,
          "CHATBOT_AUTH_TIMEOUT"
        )
      );
      return;
    }

    if (isConnectionError(error)) {
      next(
        new ChatbotServiceError(
          "Service d'authentification indisponible.",
          503,
          "CHATBOT_AUTH_PROVIDER_UNAVAILABLE"
        )
      );
      return;
    }

    next(
      new ChatbotServiceError(
        "Erreur lors de la verification d'identite.",
        503,
        "CHATBOT_AUTH_PROVIDER_FAILED"
      )
    );
    return;
  }

  if (response.status === 401 || response.status === 403) {
    next(
      new ChatbotServiceError(
        "Session invalide ou expiree. Reconnectez-vous.",
        401,
        "CHATBOT_AUTH_REQUIRED"
      )
    );
    return;
  }

  if (!response.ok) {
    next(
      new ChatbotServiceError(
        "Impossible de verifier l'utilisateur authentifie.",
        503,
        "CHATBOT_AUTH_PROVIDER_FAILED",
        { status: response.status }
      )
    );
    return;
  }

  let userData = null;
  try {
    userData = await response.json();
  } catch {
    userData = null;
  }

  const userId = String(userData?.id || "").trim();
  if (!userId) {
    next(
      new ChatbotServiceError(
        "Utilisateur authentifie introuvable.",
        401,
        "CHATBOT_AUTH_REQUIRED"
      )
    );
    return;
  }

  if (tokenIsSuperAdmin) {
    next(
      new ChatbotServiceError(
        "Le Super Admin n'a pas acces au chatbot SMSI.",
        403,
        "CHATBOT_SUPERADMIN_FORBIDDEN"
      )
    );
    return;
  }

  let permissionScope;
  try {
    permissionScope = await fetchUserPermissions(token);
  } catch (error) {
    next(error);
    return;
  }

  const societeId = parseSocieteId(userData?.societeId);

  req.auth = {
    token,
    user: {
      id: userId,
      email: String(userData?.email || "").trim(),
      nomComplet: String(userData?.nomComplet || "").trim(),
      societeId,
      roles: tokenRoles,
      isSuperAdmin: tokenIsSuperAdmin,
    },
    permissions: permissionScope,
  };

  next();
}
