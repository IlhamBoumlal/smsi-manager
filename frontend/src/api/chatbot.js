const CHATBOT_BASE_URL = (process.env.REACT_APP_CHATBOT_API_URL || "http://localhost:5055").replace(/\/+$/, "");

function buildUrl(path) {
  return `${CHATBOT_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parsePayload(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeError(response, payload) {
  const error = new Error(payload?.error || "Impossible de contacter le chatbot local.");
  error.code = payload?.code || "CHATBOT_REQUEST_FAILED";
  error.status = response.status;
  error.details = payload?.details || null;
  return error;
}

function parseSseBlock(block) {
  const lines = String(block || "").replace(/\r/g, "").split("\n");
  let event = "message";
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim() || "message";
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  const rawData = dataLines.join("\n");
  if (!rawData) return { event, payload: null };

  try {
    return { event, payload: JSON.parse(rawData) };
  } catch {
    return { event, payload: { raw: rawData } };
  }
}

export async function createConversation(title = "") {
  const response = await fetch(buildUrl("/api/chatbot/conversations"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });

  const payload = await parsePayload(response);
  if (!response.ok) throw normalizeError(response, payload);
  return payload?.conversation || null;
}

export async function listConversations() {
  const response = await fetch(buildUrl("/api/chatbot/conversations"), {
    method: "GET",
    headers: authHeaders(),
  });

  const payload = await parsePayload(response);
  if (!response.ok) throw normalizeError(response, payload);
  return Array.isArray(payload?.conversations) ? payload.conversations : [];
}

export async function getConversationMessages(conversationId) {
  const response = await fetch(buildUrl(`/api/chatbot/conversations/${conversationId}/messages`), {
    method: "GET",
    headers: authHeaders(),
  });

  const payload = await parsePayload(response);
  if (!response.ok) throw normalizeError(response, payload);
  return {
    conversation: payload?.conversation || null,
    messages: Array.isArray(payload?.messages) ? payload.messages : [],
  };
}

export async function sendConversationMessage(conversationId, message) {
  const response = await fetch(buildUrl(`/api/chatbot/conversations/${conversationId}/messages`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });

  const payload = await parsePayload(response);
  if (!response.ok) throw normalizeError(response, payload);
  return payload;
}

export async function streamConversationMessage(conversationId, message, handlers = {}) {
  const response = await fetch(buildUrl(`/api/chatbot/conversations/${conversationId}/messages/stream`), {
    method: "POST",
    headers: {
      ...authHeaders(),
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ message }),
    signal: handlers.signal,
  });

  if (!response.ok) {
    const payload = await parsePayload(response);
    throw normalizeError(response, payload);
  }

  if (!response.body) {
    const error = new Error("Flux de streaming indisponible.");
    error.code = "CHATBOT_STREAM_UNAVAILABLE";
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload = null;

  const processBlock = (block) => {
    const parsed = parseSseBlock(block);
    const payload = parsed.payload;

    if (parsed.event === "started") handlers.onStarted?.(payload);
    else if (parsed.event === "heartbeat") handlers.onHeartbeat?.(payload);
    else if (parsed.event === "token") handlers.onToken?.(payload);
    else if (parsed.event === "done") {
      donePayload = payload;
      handlers.onDone?.(payload);
    } else if (parsed.event === "error") {
      const err = new Error(payload?.error || "Erreur pendant le streaming du chatbot.");
      err.code = payload?.code || "CHATBOT_STREAM_ERROR";
      err.details = payload?.details || null;
      throw err;
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let delimiterIndex = buffer.indexOf("\n\n");
      while (delimiterIndex >= 0) {
        const block = buffer.slice(0, delimiterIndex);
        buffer = buffer.slice(delimiterIndex + 2);
        if (block.trim()) processBlock(block);
        delimiterIndex = buffer.indexOf("\n\n");
      }
    }

    const tail = buffer.trim();
    if (tail) processBlock(tail);

    return donePayload;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // noop
    }
  }
}

export async function deleteConversation(conversationId) {
  const response = await fetch(buildUrl(`/api/chatbot/conversations/${conversationId}`), {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (response.status === 204) return true;
  const payload = await parsePayload(response);
  if (!response.ok) throw normalizeError(response, payload);
  return true;
}
