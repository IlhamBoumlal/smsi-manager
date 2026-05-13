import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  PanelLeft,
  Plus,
  Search,
  Send,
  Sparkles,
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
  if (error?.code === "CHATBOT_SUPERADMIN_FORBIDDEN") {
    return "Le Super Admin n'a pas acces au chatbot SMSI.";
  }
  if (error?.code === "CHATBOT_PERMISSION_DENIED") {
    return "Acces refuse: votre role ne dispose pas de la permission chatbot.";
  }
  if (error?.code === "CHATBOT_COMPANY_SCOPE_REQUIRED") {
    return "Acces refuse: ce compte doit etre rattache a une societe pour utiliser le chatbot.";
  }
  if (error?.code === "CHATBOT_SMSI_AUTH_ERROR") {
    return "Session invalide pour lire les donnees SMSI. Reconnectez-vous puis reessayez.";
  }
  if (error?.code === "CHATBOT_RBAC_NO_SOURCE_ACCESS") {
    return "Aucune source SMSI autorisee pour votre profil. Contactez votre Admin societe.";
  }
  if (error?.code === "CHATBOT_SMSI_NO_SOURCE_ACCESS") {
    return "Votre profil n'a pas acces aux sources SMSI necessaires. Verifiez les permissions de modules.";
  }
  if (error?.code === "CHATBOT_SMSI_CONTEXT_UNAVAILABLE") {
    return "Le chatbot ne peut pas joindre l'API SMSI pour lire les donnees applicatives.";
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

function normalizeAssistantDisplayContent(value) {
  return String(value || "").replace(/\r/g, "").trim();
}

function renderAssistantContent(value) {
  const text = normalizeAssistantDisplayContent(value);
  if (!text) return null;

  const blocks = text.split("```");
  return blocks.map((block, index) => {
    const trimmed = String(block || "").trim();
    if (!trimmed) return null;

    if (index % 2 === 1) {
      return (
        <pre
          key={`assistant-code-${index}`}
          className="mt-1 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 text-[12px] leading-5 text-slate-100"
        >
          <code>{trimmed}</code>
        </pre>
      );
    }

    const cleaned = trimmed
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "");

    return (
      <div key={`assistant-text-${index}`} className="whitespace-pre-wrap">
        {cleaned}
      </div>
    );
  });
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState("");
  const [mode, setMode] = useState("guide_smsi");
  const [missingSources, setMissingSources] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const sendingRef = useRef(false);
  const streamAbortRef = useRef(null);
  const copyTimerRef = useRef(null);

  const quickPrompts = useMemo(
    () => [
      "Donne-moi un resume de mes risques critiques.",
      "Propose un plan d'action ISO 27001 pour ce mois.",
      "Quels controles dois-je prioriser pour l'audit ?",
      "Explique la difference entre risque et incident.",
    ],
    []
  );

  useEffect(
    () => () => {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const filteredConversations = useMemo(() => {
    const query = String(conversationQuery || "").trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const title = String(conversation?.title || "").toLowerCase();
      const date = formatDate(conversation?.updatedAt).toLowerCase();
      return title.includes(query) || date.includes(query);
    });
  }, [conversations, conversationQuery]);

  const resizeInput = useCallback(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "44px";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages, sending]);

  useEffect(() => {
    resizeInput();
  }, [input, resizeInput]);

  useEffect(
    () => () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    setSidebarOpen(false);
    setShowPrompts(false);
    setConversationQuery("");
  }, [open]);

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

  function handleSelectConversation(conversationId) {
    setActiveConversationId(conversationId);
    setSidebarOpen(false);
  }

  function handlePromptClick(prompt) {
    if (sending) return;
    setInput((prev) => {
      const base = String(prev || "").trim();
      return base ? `${base}\n${prompt}` : prompt;
    });
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function handleCopyMessage(messageId, content) {
    if (!messageId || !content) return;
    try {
      await navigator.clipboard.writeText(String(content));
      setCopiedMessageId(messageId);
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedMessageId("");
        copyTimerRef.current = null;
      }, 1800);
    } catch {
      setNotice("Impossible de copier automatiquement ce message.");
    }
  }

  async function handleNewConversation() {
    setError("");
    try {
      const conversation = await createConversation();
      if (!conversation?.id) return;
      setConversations((prev) => [conversation, ...prev.filter((row) => row.id !== conversation.id)]);
      setActiveConversationId(conversation.id);
      setMessages([]);
      setSidebarOpen(false);
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
    setSidebarOpen(false);
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

      await Promise.all([loadMessagesState(conversationId), loadConversationsState(conversationId)]);
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

  function handleInputKeyDown(event) {
    if (event.key !== "Enter") return;
    if (event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  const statusLabel = mode === "analyse_smsi" ? "Mode analyse SMSI" : "Mode guide SMSI";
  const statusTone =
    mode === "analyse_smsi"
      ? "border-cyan-200 bg-cyan-50 text-cyan-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const overlayMotion = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.14, ease: "easeIn" } },
  };
  const panelMotion = {
    hidden: { opacity: 0, y: 14, scale: 0.988 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      y: 12,
      scale: 0.988,
      transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
    },
  };
  const desktopPanelSizeClass = expanded
    ? "md:h-[640px] md:w-[900px]"
    : "md:h-[72vh] md:min-h-[500px] md:max-h-[620px] md:w-[420px]";

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-0"
            onClick={() => setOpen(false)}
            variants={overlayMotion}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className={`fixed inset-0 flex overflow-hidden bg-white md:inset-auto md:bottom-24 md:right-4 ${desktopPanelSizeClass} md:max-w-[calc(100vw-1rem)] md:rounded-3xl md:border md:border-slate-200/80 md:shadow-[0_24px_60px_rgba(15,23,42,.24)]`}
              onClick={(event) => event.stopPropagation()}
              variants={panelMotion}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <section className="relative flex min-w-0 flex-1 flex-col bg-gradient-to-b from-slate-50 via-white to-white">
                <div className="flex items-center justify-between border-b border-slate-200/80 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      aria-label="Ouvrir les conversations"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_8px_24px_rgba(8,145,178,.35)]">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold tracking-wide text-slate-900">
                        Assistant SMSI Local
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone}`}
                        >
                          <Sparkles className="h-3 w-3" />
                          {statusLabel}
                        </span>
                        <span className="truncate text-[10px] text-slate-500">
                          {activeConversation?.title || "Conversation"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => !prev)}
                      className="hidden h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 md:inline-flex"
                      aria-label={expanded ? "Mode compact" : "Mode etendu"}
                      title={expanded ? "Mode compact" : "Mode etendu"}
                    >
                      {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      aria-label="Fermer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {missingSources.length > 0 ? (
                  <div className="mx-3 mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Sources indisponibles: {missingSources.join(", ")}.</span>
                  </div>
                ) : null}

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                  {!activeConversationId ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm text-slate-600">
                      Creez une conversation pour demarrer.
                    </div>
                  ) : loadingMessages ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm text-slate-600">
                      Conversation vide. Posez votre premiere question SMSI.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message, index) => {
                        const isUser = message.role === "user";
                        return (
                          <motion.div
                            key={message.id}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.2,
                              ease: [0.22, 1, 0.36, 1],
                              delay: Math.min(index * 0.018, 0.12),
                            }}
                            className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                                isUser
                                  ? "order-2 bg-slate-900 text-slate-100"
                                  : "order-1 bg-blue-100 text-blue-700"
                              }`}
                            >
                              {isUser ? "U" : <Bot className="h-4 w-4" />}
                            </div>

                            <div
                              className={`group relative max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-5 shadow-sm ${
                                isUser
                                  ? "order-1 bg-gradient-to-br from-blue-600 to-cyan-600 text-white"
                                  : "order-2 border border-slate-200 bg-white text-slate-800"
                              } ${message.error ? "ring-1 ring-red-200" : ""}`}
                            >
                              {isUser ? (
                                <div className="whitespace-pre-wrap">{message.content}</div>
                              ) : (
                                <div>{renderAssistantContent(message.content)}</div>
                              )}

                              {!isUser && message.content ? (
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(message.id, message.content)}
                                  className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
                                  title="Copier"
                                  aria-label="Copier la reponse"
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              ) : null}

                              <div
                                className={`mt-1 text-[10px] ${
                                  isUser ? "text-cyan-100/90" : "text-slate-400"
                                }`}
                              >
                                {formatDate(message.createdAt)}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {sending ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          className="flex justify-start"
                        >
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Analyse des donnees SMSI en cours...
                            <span className="ml-1 inline-flex items-center gap-1">
                              {[0, 1, 2].map((dot) => (
                                <motion.span
                                  key={dot}
                                  className="h-1.5 w-1.5 rounded-full bg-cyan-500"
                                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                                  transition={{
                                    duration: 0.9,
                                    repeat: Infinity,
                                    delay: dot * 0.15,
                                    ease: "easeInOut",
                                  }}
                                />
                              ))}
                            </span>
                          </div>
                        </motion.div>
                      ) : null}
                      <div ref={endRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200/80 bg-white/90 px-3 pb-3 pt-2">
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

                  <div className="mb-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPrompts((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                    >
                      Suggestions
                      {showPrompts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <span className="text-[10px] text-slate-500">Enter pour envoyer - Shift+Enter pour ligne</span>
                  </div>

                  <AnimatePresence>
                    {showPrompts ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.16 }}
                        className="mb-2 flex gap-2 overflow-x-auto pb-1"
                      >
                        {quickPrompts.map((prompt, index) => (
                          <motion.button
                            key={prompt}
                            type="button"
                            onClick={() => handlePromptClick(prompt)}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, delay: Math.min(index * 0.04, 0.14) }}
                            whileHover={{ y: -1, scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                          >
                            {prompt}
                          </motion.button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleInputKeyDown}
                      placeholder={
                        activeConversation
                          ? `Ecrire dans: ${activeConversation.title || "Conversation"}`
                          : "Posez une question SMSI..."
                      }
                      className="min-h-[40px] max-h-[120px] flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !input.trim()}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-[0_10px_24px_rgba(2,132,199,.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                      aria-label="Envoyer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </section>

              <AnimatePresence>
                {sidebarOpen ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="absolute inset-0 z-30 flex"
                  >
                    <button
                      type="button"
                      className="hidden bg-slate-950/15 backdrop-blur-[1px] md:block md:flex-1"
                      onClick={() => setSidebarOpen(false)}
                      aria-label="Fermer la liste des conversations"
                    />
                    <motion.aside
                      initial={{ x: -18, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -18, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="relative flex w-full shrink-0 flex-col border-r border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/70 md:w-[290px]"
                    >
                      <div className="flex items-center justify-between px-4 pb-2 pt-4">
                        <div>
                          <div className="text-sm font-semibold tracking-wide text-slate-900">Conversations</div>
                          <div className="text-[11px] text-slate-500">
                            {filteredConversations.length} / {conversations.length}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleNewConversation}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700"
                            title="Nouvelle conversation"
                            aria-label="Nouvelle conversation"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                            aria-label="Fermer les conversations"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="px-3 pb-2">
                        <label className="relative block">
                          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            value={conversationQuery}
                            onChange={(event) => setConversationQuery(event.target.value)}
                            placeholder="Rechercher..."
                            className="h-9 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-2 text-xs outline-none transition focus:border-blue-500"
                          />
                        </label>
                      </div>

                      <div className="flex-1 overflow-y-auto px-2 pb-2">
                        {loadingConversations ? (
                          <div className="mx-1 mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Chargement...
                          </div>
                        ) : filteredConversations.length === 0 ? (
                          <div className="mx-1 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-xs text-slate-500">
                            Aucune conversation trouvee.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {filteredConversations.map((conversation) => {
                              const isActive = conversation.id === activeConversationId;
                              return (
                                <div
                                  key={conversation.id}
                                  className={`group rounded-xl border px-2 py-2 text-xs transition ${
                                    isActive
                                      ? "border-blue-300 bg-blue-50/80"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleSelectConversation(conversation.id)}
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
                    </motion.aside>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={
          open
            ? { opacity: 0, scale: 0.92 }
            : {
                opacity: 1,
                scale: 1,
                boxShadow: [
                  "0 14px 36px rgba(2,132,199,.28)",
                  "0 18px 44px rgba(2,132,199,.42)",
                  "0 14px 36px rgba(2,132,199,.28)",
                ],
              }
        }
        transition={{
          opacity: { duration: 0.16 },
          scale: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
          boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className={`fixed bottom-6 right-4 z-[80] inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white transition hover:brightness-105 ${
          open ? "pointer-events-none" : "pointer-events-auto"
        }`}
        aria-label="Ouvrir le chatbot SMSI"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </>
  );
}
