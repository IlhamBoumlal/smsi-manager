import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
  streamConversationMessage,
} from "../api/chatbot";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildErrorMessage(error) {
  if (error?.code === "OLLAMA_UNAVAILABLE") {
    return "Ollama n'est pas lance. Lancez `ollama serve` puis reessayez.";
  }
  if (error?.code === "OLLAMA_MODEL_NOT_FOUND") {
    const requestedModel = String(error?.details?.model || "").trim();
    if (requestedModel) {
      return `Modele Ollama absent: ${requestedModel}. Lancez \`ollama pull ${requestedModel}\`.`;
    }
    return "Modele Ollama absent. Verifiez la variable OLLAMA_MODEL puis lancez ollama pull <modele>.";
  }
  if (error?.code === "CHATBOT_AUTH_REQUIRED") {
    return "Session invalide. Reconnectez-vous.";
  }
  if (error?.code === "CHATBOT_FORBIDDEN") {
    return "Acces refuse: cette conversation n'appartient pas a votre compte.";
  }
  if (error?.code === "CHATBOT_CONVERSATION_NOT_FOUND") {
    return "Conversation introuvable.";
  }
  if (error?.code === "CHATBOT_STREAM_IN_PROGRESS") {
    return "Un traitement est deja en cours pour cette conversation. Patientez quelques secondes.";
  }
  if (error?.code === "CHATBOT_STREAM_ABORTED") {
    return "Le traitement precedent a ete interrompu. Reessayez votre question.";
  }
  return error?.message || "Erreur pendant la communication avec le chatbot.";
}

function mapServerMessage(raw) {
  return {
    id: String(raw?.id || ""),
    role: String(raw?.role || "assistant"),
    content: String(raw?.content || ""),
    createdAt: raw?.createdAt || new Date().toISOString(),
  };
}

function sanitizeAssistantDisplayContent(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/```/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .trim();
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("guide_smsi");
  const [missingSources, setMissingSources] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const sendingRef = useRef(false);
  const streamAbortRef = useRef(null);

  useEffect(() => () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
  }, []);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages, sending]);

  const loadConversationsState = useCallback(async (preferredConversationId = null) => {
    setLoadingConversations(true);
    setError("");
    try {
      const rows = await listConversations();
      setConversations(rows);

      const currentActiveId = activeConversationIdRef.current;
      const preferredExists = rows.some((conversation) => conversation.id === preferredConversationId);
      const currentExists = rows.some((conversation) => conversation.id === currentActiveId);

      const nextActiveId = preferredExists
        ? preferredConversationId
        : currentExists
        ? currentActiveId
        : rows[0]?.id || null;

      setActiveConversationId(nextActiveId || null);
      if (!nextActiveId) {
        setMessages([]);
      }
    } catch (err) {
      setError(buildErrorMessage(err));
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadConversationsState();
  }, [open, loadConversationsState]);

  const loadMessagesState = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setError("");
    try {
      const response = await getConversationMessages(conversationId);
      const rows = Array.isArray(response.messages) ? response.messages.map(mapServerMessage) : [];
      setMessages(rows);
    } catch (err) {
      setError(buildErrorMessage(err));
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!activeConversationId) return;
    loadMessagesState(activeConversationId);
  }, [open, activeConversationId, loadMessagesState]);

  async function handleNewConversation() {
    setError("");
    try {
      const conversation = await createConversation();
      if (!conversation?.id) return;
      setConversations((prev) => [conversation, ...prev.filter((row) => row.id !== conversation.id)]);
      setActiveConversationId(conversation.id);
      setMessages([]);
    } catch (err) {
      setError(buildErrorMessage(err));
    }
  }

  async function handleDeleteConversation(conversationId) {
    if (!conversationId) return;
    const ok = window.confirm("Voulez-vous vraiment supprimer cette conversation ?");
    if (!ok) return;

    setError("");
    try {
      await deleteConversation(conversationId);
      const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
      const nextActiveId = remaining[0]?.id || null;
      setConversations(remaining);

      if (activeConversationId === conversationId) {
        setActiveConversationId(nextActiveId);
        if (!nextActiveId) setMessages([]);
      }
    } catch (err) {
      setError(buildErrorMessage(err));
    }
  }

  async function ensureConversation() {
    if (activeConversationId) return activeConversationId;
    const conversation = await createConversation();
    if (!conversation?.id) {
      throw new Error("Impossible de creer une conversation.");
    }

    setConversations((prev) => [conversation, ...prev]);
    setActiveConversationId(conversation.id);
    setMessages([]);
    return conversation.id;
  }

  async function handleSend(event) {
    event.preventDefault();
    const text = String(input || "").trim();
    if (!text || sendingRef.current) return;

    setError("");
    setNotice("");
    setInput("");
    sendingRef.current = true;
    setSending(true);

    const optimistic = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    const streamingAssistantId = `tmp-assistant-${Date.now()}`;
    const streamingAssistant = {
      id: streamingAssistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      optimistic: true,
      streaming: true,
    };

    setMessages((prev) => [...prev, optimistic, streamingAssistant]);

    try {
      const conversationId = await ensureConversation();
      const abortController = new AbortController();
      streamAbortRef.current = abortController;

      let donePayload = null;
      await streamConversationMessage(conversationId, text, {
        signal: abortController.signal,
        onToken(payload) {
          const chunk = String(payload?.content || "");
          if (!chunk) return;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === streamingAssistantId
                ? { ...message, content: `${message.content || ""}${chunk}` }
                : message
            )
          );
        },
        onDone(payload) {
          donePayload = payload;
        },
      });

      setMode(donePayload?.mode || "guide_smsi");
      setMissingSources(Array.isArray(donePayload?.missingSources) ? donePayload.missingSources : []);
      if (donePayload?.metrics?.doneReason === "length") {
        setNotice("Reponse tronquee: limite de generation atteinte. Vous pouvez demander: 'continue'.");
      }

      await Promise.all([
        loadMessagesState(conversationId),
        loadConversationsState(conversationId),
      ]);
    } catch (err) {
      if (err?.name === "AbortError") {
        setMessages((prev) =>
          prev.filter((message) => message.id !== optimistic.id && message.id !== streamingAssistantId)
        );
        return;
      }

      setError(buildErrorMessage(err));
      setMessages((prev) =>
        prev.filter((message) => message.id !== optimistic.id && message.id !== streamingAssistantId)
      );
    } finally {
      if (streamAbortRef.current) {
        streamAbortRef.current = null;
      }
      sendingRef.current = false;
      setSending(false);
    }
  }

  const statusLabel = mode === "analyse_smsi" ? "Mode analyse SMSI" : "Mode guide SMSI";

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-4 z-[80] flex h-[560px] w-[760px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <aside className="flex w-[245px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between px-3 py-3">
              <div className="text-sm font-bold text-slate-800">Mes conversations</div>
              <button
                type="button"
                onClick={handleNewConversation}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {loadingConversations ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Chargement...
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-xs text-slate-500">
                  Aucune conversation.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {conversations.map((conversation) => {
                    const isActive = conversation.id === activeConversationId;
                    return (
                      <div
                        key={conversation.id}
                        className={`group rounded-lg border px-2 py-2 text-xs transition ${
                          isActive
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveConversationId(conversation.id)}
                          className="w-full text-left"
                        >
                          <div className="line-clamp-2 font-semibold text-slate-800">
                            {conversation.title || "Nouvelle conversation"}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {formatDate(conversation.updatedAt)}
                          </div>
                        </button>
                        <div className="mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteConversation(conversation.id)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Supprimer"
                            aria-label="Supprimer la conversation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Assistant SMSI Local</div>
                  <div className="text-[11px] text-slate-500">{statusLabel}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {missingSources.length > 0 ? (
              <div className="mx-3 mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Sources indisponibles: {missingSources.join(", ")}.</span>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {!activeConversationId ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                  Creez une conversation pour demarrer.
                </div>
              ) : loadingMessages ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                  Conversation vide. Posez votre premiere question SMSI.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    const displayContent = isUser
                      ? message.content
                      : sanitizeAssistantDisplayContent(message.content);
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[86%] rounded-2xl px-3 py-2 text-[13px] leading-5 shadow-sm ${
                            isUser
                              ? "bg-blue-600 text-white"
                              : "border border-slate-200 bg-slate-50 text-slate-800"
                          } ${message.error ? "ring-1 ring-red-200" : ""}`}
                        >
                          <div className="whitespace-pre-wrap">{displayContent}</div>
                          <div className={`mt-1 text-[10px] ${isUser ? "text-blue-100" : "text-slate-400"}`}>
                            {formatDate(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {sending ? (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Analyse des donnees SMSI...
                      </div>
                    </div>
                  ) : null}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-3 pb-3 pt-2">
              {error ? (
                <div className="mb-2 rounded-lg bg-red-50 px-2 py-1 text-[11px] text-red-700">
                  {error}
                </div>
              ) : null}
              {notice && !error ? (
                <div className="mb-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                  {notice}
                </div>
              ) : null}

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={
                    activeConversation
                      ? `Ecrire dans: ${activeConversation.title || "Conversation"}`
                      : "Posez une question SMSI..."
                  }
                  className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  aria-label="Envoyer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </section>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-[80] inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,.35)] transition hover:scale-[1.02] hover:bg-blue-700"
        aria-label="Ouvrir le chatbot SMSI"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  );
}
