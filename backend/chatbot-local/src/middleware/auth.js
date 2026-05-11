import { REQUEST_TIMEOUT_MS, SMSI_API_BASE_URL } from "../config.js";
import { ChatbotServiceError } from "../services/chatbotService.js";

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
    message.includes("socket")
  );
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

  req.auth = {
    token,
    user: {
      id: userId,
      email: String(userData?.email || "").trim(),
      nomComplet: String(userData?.nomComplet || "").trim(),
      societeId: userData?.societeId ?? null,
    },
  };

  next();
}
