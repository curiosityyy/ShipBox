import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Send, ChevronDown, ChevronRight, User, Bot, Loader2,
  Terminal, FileText, Search, Pencil, FolderOpen, Plus,
  Sparkles, Copy, Check, Eye, Globe, Wrench, Zap,
  Hash, Code2, CircleDot, StopCircle, Trash2, MessageSquare,
  PanelLeftClose, PanelLeft,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

interface AssistantSession {
  id: string;
  title: string | null;
  model: string | null;
  cwd: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  lastMessage: string | null;
  messageCount: number | null;
  totalCostUsd: number | null;
}

interface ToolUseItem {
  id?: string;
  name: string;
  input?: any;
  result?: string;
  isError?: boolean;
}

interface ThinkingBlock {
  text: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: ThinkingBlock[];
  toolUses?: ToolUseItem[];
  model?: string;
  costUsd?: number;
  durationMs?: number;
}

interface SessionInfo {
  id: string | null;
  model: string;
  tools: string[];
  cwd: string;
  version?: string;
}

/* ─── Constants ─────────────────────────────────────────── */

const MODELS = [
  { id: "opus", label: "Opus", desc: "Most capable" },
  { id: "sonnet", label: "Sonnet", desc: "Balanced" },
  { id: "haiku", label: "Haiku", desc: "Fastest" },
];

const TOOL_ICONS: Record<string, typeof Terminal> = {
  Bash: Terminal,
  Read: FileText,
  Grep: Search,
  Edit: Pencil,
  Write: Pencil,
  Glob: FolderOpen,
  WebSearch: Globe,
  WebFetch: Globe,
  NotebookEdit: Code2,
  Agent: Zap,
  TodoWrite: Hash,
  ToolSearch: Search,
};

const TOOL_COLORS: Record<string, string> = {
  Bash: "#fbbf24",
  Read: "#60a5fa",
  Edit: "#34d399",
  Write: "#34d399",
  Grep: "#818cf8",
  Glob: "#38bdf8",
  WebSearch: "#fb923c",
  WebFetch: "#fb923c",
};

/* ─── localStorage key ──────────────────────────────────── */
const LS_ACTIVE_SESSION = "shipbox_assistant_active_session";

/* ─── Main Component ────────────────────────────────────── */

export default function Assistant() {
  const queryClient = useQueryClient();

  // Session list from DB
  const { data: sessionData, refetch: refetchSessions } = useQuery({
    queryKey: ["assistant-sessions"],
    queryFn: api.assistantSessions,
    refetchInterval: 10000,
  });
  const sessionList: AssistantSession[] = sessionData?.sessions || [];

  // Active session + messages per session (in-memory map)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    localStorage.getItem(LS_ACTIVE_SESSION),
  );
  const messagesMapRef = useRef<Map<string, ChatMessage[]>>(new Map());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showPanel, setShowPanel] = useState(true);

  // Chat state
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState("opus");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [session, setSession] = useState<SessionInfo>({
    id: activeSessionId, model: "", tools: [], cwd: "",
  });

  // Streaming state
  const [streamingText, setStreamingText] = useState("");
  const [streamingTools, setStreamingTools] = useState<ToolUseItem[]>([]);
  const [streamingThinking, setStreamingThinking] = useState<ThinkingBlock[]>([]);
  const [turnCount, setTurnCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persist active session
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(LS_ACTIVE_SESSION, activeSessionId);
    } else {
      localStorage.removeItem(LS_ACTIVE_SESSION);
    }
  }, [activeSessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, streamingTools]);

  // Auto-focus
  useEffect(() => { inputRef.current?.focus(); }, [activeSessionId]);

  // Close model picker on outside click
  useEffect(() => {
    if (!showModelPicker) return;
    const handler = () => setShowModelPicker(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showModelPicker]);

  const adjustTextarea = () => {
    const ta = inputRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  };

  // Load messages for a session (from cache or API)
  const loadSessionMessages = useCallback(async (id: string) => {
    const cached = messagesMapRef.current.get(id);
    if (cached && cached.length > 0) {
      setMessages(cached);
      return;
    }
    try {
      const data = await api.assistantSessionMessages(id);
      const msgs: ChatMessage[] = data.messages || [];
      if (msgs.length > 0) {
        messagesMapRef.current.set(id, msgs);
      }
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  }, []);

  // Switch to a session
  const switchSession = (id: string | null) => {
    if (isStreaming) return;
    // Save current messages
    if (session.id && messages.length > 0) {
      messagesMapRef.current.set(session.id, messages);
    }
    setActiveSessionId(id);
    setSession((s) => ({ ...s, id }));
    setStreamingText("");
    setStreamingTools([]);
    setStreamingThinking([]);
    setTurnCount(0);

    if (id) {
      loadSessionMessages(id);
    } else {
      setMessages([]);
    }
  };

  // Load messages on initial mount for persisted activeSessionId
  useEffect(() => {
    if (activeSessionId && messages.length === 0) {
      loadSessionMessages(activeSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New conversation
  const newConversation = () => {
    if (isStreaming) return;
    if (session.id && messages.length > 0) {
      messagesMapRef.current.set(session.id, messages);
    }
    setActiveSessionId(null);
    setSession({ id: null, model: "", tools: [], cwd: "" });
    setMessages([]);
    setStreamingText("");
    setStreamingTools([]);
    setStreamingThinking([]);
    setTurnCount(0);
    inputRef.current?.focus();
  };

  // Delete session
  const deleteSession = async (id: string) => {
    await api.deleteAssistantSession(id);
    refetchSessions();
    if (activeSessionId === id) {
      newConversation();
    }
    messagesMapRef.current.delete(id);
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");
    setStreamingTools([]);
    setStreamingThinking([]);

    if (inputRef.current) inputRef.current.style.height = "auto";

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          sessionId: session.id || undefined,
          model,
          cwd: session.cwd || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setMessages((prev) => [...prev, { role: "system", content: err.error || "Failed to connect" }]);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setIsStreaming(false); return; }

      let buffer = "";
      let currentText = "";
      let currentTools: ToolUseItem[] = [];
      let currentThinking: ThinkingBlock[] = [];
      let resultCost = 0;
      let resultDuration = 0;
      let resultModel = "";
      const toolIdMap = new Map<string, number>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "system" && event.subtype === "init") {
              const newId = event.session_id;
              setSession({
                id: newId,
                model: event.model || "",
                tools: event.tools || [],
                cwd: event.cwd || "",
                version: event.claude_code_version,
              });
              setActiveSessionId(newId);
              resultModel = event.model || "";
              // Session was created in DB on init — refresh sidebar immediately
              refetchSessions();
            } else if (event.type === "assistant") {
              const msg = event.message;
              if (msg?.content) {
                for (const block of msg.content) {
                  if (block.type === "text") {
                    currentText += block.text;
                    setStreamingText(currentText);
                  } else if (block.type === "thinking") {
                    currentThinking.push({ text: block.thinking || block.text || "" });
                    setStreamingThinking([...currentThinking]);
                  } else if (block.type === "tool_use") {
                    const idx = currentTools.length;
                    currentTools.push({ id: block.id, name: block.name, input: block.input });
                    if (block.id) toolIdMap.set(block.id, idx);
                    setStreamingTools([...currentTools]);
                  }
                }
              }
              if (event.session_id) {
                setSession((s) => ({ ...s, id: event.session_id }));
              }
            } else if (event.type === "tool_result") {
              const toolUseId = event.tool_use_id;
              const content = event.content;
              let resultText = "";
              if (typeof content === "string") resultText = content;
              else if (Array.isArray(content)) {
                resultText = content.map((c: any) => c.type === "text" ? c.text : `[${c.type}]`).join("\n");
              }
              if (toolUseId && toolIdMap.has(toolUseId)) {
                const idx = toolIdMap.get(toolUseId)!;
                currentTools[idx] = { ...currentTools[idx], result: resultText, isError: event.is_error === true };
                setStreamingTools([...currentTools]);
              }
            } else if (event.type === "result") {
              if (event.total_cost_usd) resultCost = event.total_cost_usd;
              if (event.duration_ms) resultDuration = event.duration_ms;
              if (event.session_id) setSession((s) => ({ ...s, id: event.session_id }));
              if (event.num_turns) setTurnCount((c) => c + event.num_turns);
            }
          } catch { /* skip */ }
        }
      }

      if (currentText || currentTools.length > 0 || currentThinking.length > 0) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: currentText,
          thinking: currentThinking.length > 0 ? currentThinking : undefined,
          toolUses: currentTools.length > 0 ? currentTools : undefined,
          model: resultModel,
          costUsd: resultCost,
          durationMs: resultDuration,
        }]);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) => [...prev, { role: "system", content: err.message || "Connection failed" }]);
      }
    }

    setStreamingText("");
    setStreamingTools([]);
    setStreamingThinking([]);
    setIsStreaming(false);
    abortRef.current = null;
    inputRef.current?.focus();
    // Refresh session list after response completes (server upserted it)
    setTimeout(() => refetchSessions(), 500);
  }, [input, isStreaming, model, session, refetchSessions]);

  const hasContent = messages.length > 0 || isStreaming;

  return (
    <div className="animate-fade-up flex" style={{ height: "calc(100vh - 48px)" }}>
      {/* ── Session Panel ── */}
      {showPanel && (
        <div className="w-[240px] shrink-0 border-r border-[#1e293b]/50 flex flex-col bg-[#0a0b0f]/40">
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-3">
            <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Conversations</span>
            <button
              onClick={newConversation}
              disabled={isStreaming}
              className="p-1 rounded-md text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e293b]/40 transition-colors disabled:opacity-40"
              title="New conversation"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {sessionList.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <MessageSquare size={20} className="text-[#1e293b] mx-auto mb-2" />
                <p className="text-[11px] text-[#334155]">No conversations yet</p>
              </div>
            ) : (
              sessionList.map((s) => (
                <SessionItem
                  key={s.id}
                  session={s}
                  isActive={activeSessionId === s.id}
                  onClick={() => switchSession(s.id)}
                  onDelete={() => deleteSession(s.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="p-1 rounded-md text-[#475569] hover:text-[#e2e8f0] hover:bg-[#1e293b]/40 transition-colors"
            >
              {showPanel ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
            {session.cwd && (
              <span className="text-[10px] font-mono text-[#334155]">
                {session.cwd.replace(/^\/Users\/[^/]+/, "~").split("/").slice(-2).join("/")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {turnCount > 0 && (
              <span className="text-[10px] font-mono text-[#334155]">
                {turnCount} turn{turnCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {!hasContent ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center animate-fade-up">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#151a25] to-[#0f1219] border border-[#1e293b] flex items-center justify-center mb-4 mx-auto">
                  <Sparkles size={22} className="text-[#34d399]/60" />
                </div>
                <h3 className="text-[15px] font-medium text-[#e2e8f0] mb-1.5 tracking-tight">
                  Claude Code
                </h3>
                <p className="text-[13px] text-[#475569] max-w-xs leading-relaxed">
                  Full CLI experience in your browser — tool use, file editing, and context preserved.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Resumed session hint */}
              {messages.length === 0 && !isStreaming && activeSessionId && (
                <div className="flex justify-center py-6">
                  <span className="text-[11px] text-[#334155] bg-[#0f1219] px-3 py-1.5 rounded-lg border border-[#1e293b]/30">
                    Session resumed — send a message to continue
                  </span>
                </div>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {isStreaming && (
                <StreamingBubble text={streamingText} tools={streamingTools} thinking={streamingThinking} />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4">
          <div className="rounded-2xl border border-[#1e293b]/70 bg-[#0f1219] focus-within:border-[#34d399]/25 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); adjustTextarea(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Ask anything..."
              disabled={isStreaming}
              rows={1}
              className="w-full bg-transparent text-[#e2e8f0] placeholder-[#334155] text-sm px-4 pt-3 pb-2 focus:outline-none disabled:opacity-50 resize-none overflow-hidden leading-relaxed"
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  disabled={isStreaming}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1e293b]/40 transition-all disabled:opacity-40"
                >
                  {MODELS.find((m) => m.id === model)?.label || "Opus"}
                  <ChevronDown size={10} className={`transition-transform ${showModelPicker ? "rotate-180" : ""}`} />
                </button>
                {showModelPicker && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-40 bg-[#0f1219] border border-[#1e293b] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-10 animate-fade-in">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setModel(m.id); setShowModelPicker(false); }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-left transition-colors ${
                          model === m.id ? "bg-[#34d399]/8 text-[#34d399]" : "text-[#c9d1d9] hover:bg-[#151a25]"
                        }`}
                      >
                        <span className="text-[12px] font-mono">{m.label}</span>
                        <span className="text-[10px] text-[#475569]">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isStreaming ? (
                <button onClick={stopStreaming} className="p-1.5 rounded-lg bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/15 transition-colors" title="Stop">
                  <StopCircle size={16} />
                </button>
              ) : (
                <button onClick={sendMessage} disabled={!input.trim()} className="p-1.5 rounded-lg bg-[#e2e8f0] text-[#0f1219] hover:bg-[#c9d1d9] transition-colors disabled:opacity-20 disabled:bg-[#334155]">
                  <Send size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Session Item ──────────────────────────────────────── */

function SessionItem({
  session,
  isActive,
  onClick,
  onDelete,
}: {
  session: AssistantSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const timeAgo = session.updatedAt ? formatTimeAgo(session.updatedAt) : "";

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left px-2.5 py-2 rounded-lg transition-colors relative ${
        isActive
          ? "bg-[#1e293b]/60 text-[#e2e8f0]"
          : "text-[#94a3b8] hover:bg-[#1e293b]/30"
      }`}
    >
      <div className="text-[12px] truncate pr-5 leading-snug">
        {session.title || "Untitled"}
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        {session.model && (
          <span className="text-[9px] font-mono text-[#475569]">
            {session.model.replace("claude-", "").split("-").slice(0, 1).join("")}
          </span>
        )}
        {timeAgo && <span className="text-[9px] text-[#334155]">{timeAgo}</span>}
        {session.totalCostUsd != null && session.totalCostUsd > 0 && (
          <span className="text-[9px] font-mono text-[#334155]">${session.totalCostUsd.toFixed(2)}</span>
        )}
      </div>
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 right-1.5 p-0.5 rounded opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#f87171] transition-all"
        title="Delete"
      >
        <Trash2 size={11} />
      </button>
    </button>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

/* ─── Streaming Bubble ──────────────────────────────────── */

function StreamingBubble({
  text,
  tools,
  thinking,
}: {
  text: string;
  tools: ToolUseItem[];
  thinking: ThinkingBlock[];
}) {
  const hasOutput = text || tools.length > 0 || thinking.length > 0;

  return (
    <div className="py-4 animate-fade-in">
      <div className="flex gap-3">
        <Avatar role="assistant" />
        <div className="min-w-0 flex-1 space-y-2">
          <RoleLabel role="assistant" />

          {/* Thinking */}
          {thinking.length > 0 && (
            <ThinkingSection blocks={thinking} isStreaming />
          )}

          {/* Tool uses */}
          {tools.length > 0 && (
            <div className="space-y-1">
              {tools.map((tool, i) => (
                <ToolCard key={i} tool={tool} />
              ))}
            </div>
          )}

          {/* Text */}
          {text ? (
            <div className="prose-chat text-[13px] text-[#c9d1d9] leading-[1.7] break-words">
              <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {text}
              </Markdown>
              <span className="inline-block w-[3px] h-[15px] bg-[#34d399] ml-0.5 animate-pulse rounded-[1px] align-text-bottom" />
            </div>
          ) : !hasOutput ? (
            <div className="flex items-center gap-2 text-[12px] text-[#475569] py-1">
              <Loader2 size={12} className="animate-spin text-[#34d399]" />
              <span>Thinking...</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─── Message Bubble ────────────────────────────────────── */

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "system") {
    return (
      <div className="flex justify-center py-3">
        <div className="flex items-center gap-2 text-[11px] text-[#f87171] bg-[#f87171]/6 border border-[#f87171]/10 px-3.5 py-1.5 rounded-lg">
          <CircleDot size={10} />
          {msg.content}
        </div>
      </div>
    );
  }

  const isUser = msg.role === "user";

  return (
    <div className={`py-4 ${isUser ? "" : "border-b border-[#1e293b]/30 last:border-0"}`}>
      <div className="flex gap-3">
        <Avatar role={msg.role} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <RoleLabel role={msg.role} />
            {msg.model && (
              <span className="text-[10px] font-mono text-[#334155] bg-[#151a25] px-1.5 py-0.5 rounded">
                {msg.model}
              </span>
            )}
            {msg.durationMs && msg.durationMs > 0 && (
              <span className="text-[10px] font-mono text-[#334155]">
                {(msg.durationMs / 1000).toFixed(1)}s
              </span>
            )}
            {msg.costUsd && msg.costUsd > 0 && (
              <span className="text-[10px] font-mono text-[#334155]">
                ${msg.costUsd.toFixed(4)}
              </span>
            )}
          </div>

          {/* Thinking */}
          {msg.thinking && msg.thinking.length > 0 && (
            <ThinkingSection blocks={msg.thinking} />
          )}

          {/* Tool uses */}
          {msg.toolUses && msg.toolUses.length > 0 && (
            <div className="space-y-1">
              {msg.toolUses.map((tool, i) => (
                <ToolCard key={i} tool={tool} />
              ))}
            </div>
          )}

          {/* Text */}
          {msg.content && (
            <TextContent text={msg.content} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-Components ────────────────────────────────────── */

function Avatar({ role }: { role: string }) {
  const isUser = role === "user";
  return (
    <div className="shrink-0 mt-1">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
        isUser
          ? "bg-[#60a5fa]/8 border border-[#60a5fa]/15"
          : "bg-[#34d399]/8 border border-[#34d399]/15"
      }`}>
        {isUser
          ? <User size={12} className="text-[#60a5fa]" />
          : <Bot size={12} className="text-[#34d399]" />
        }
      </div>
    </div>
  );
}

function RoleLabel({ role }: { role: string }) {
  return (
    <span className="text-[11px] font-medium text-[#475569] tracking-wide uppercase">
      {role === "user" ? "You" : "Claude"}
    </span>
  );
}

function TextContent({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative">
      <div className="prose-chat text-[13px] text-[#c9d1d9] leading-[1.7] break-words">
        <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {text}
        </Markdown>
      </div>
      <button
        onClick={copy}
        className="absolute top-0 right-0 p-1 rounded opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#94a3b8] hover:bg-[#1e293b]/50 transition-all"
        title="Copy"
      >
        {copied ? <Check size={12} className="text-[#34d399]" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

/* Custom markdown component overrides for dark theme */
const mdComponents = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-[#e2e8f0]">{children}</strong>,
  em: ({ children }: any) => <em className="text-[#94a3b8]">{children}</em>,
  code: ({ className, children, ...props }: any) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <div className="my-2 rounded-lg overflow-hidden border border-[#1e293b]/50">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f1219] border-b border-[#1e293b]/30">
            <span className="text-[10px] font-mono text-[#475569]">
              {className?.replace("language-", "") || "code"}
            </span>
            <CopyBtn text={String(children).replace(/\n$/, "")} />
          </div>
          <pre className="p-3 bg-[#0a0b0f] overflow-x-auto">
            <code className="text-[11px] font-mono text-[#c9d1d9] leading-relaxed" {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    }
    return (
      <code className="text-[12px] font-mono text-[#e2e8f0] bg-[#151a25] px-1.5 py-0.5 rounded border border-[#1e293b]/40" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => <>{children}</>,
  ul: ({ children }: any) => <ul className="list-disc list-outside pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-outside pl-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }: any) => <li className="text-[#c9d1d9]">{children}</li>,
  a: ({ href, children }: any) => (
    <a href={href} className="text-[#60a5fa] hover:underline" target="_blank" rel="noopener">{children}</a>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-[#34d399]/30 pl-3 my-2 text-[#94a3b8] italic">{children}</blockquote>
  ),
  table: ({ children }: any) => (
    <div className="my-2 rounded-lg border border-[#1e293b]/50 overflow-x-auto">
      <table className="w-full text-[12px]">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-[#0f1219]">{children}</thead>,
  th: ({ children }: any) => (
    <th className="px-3 py-1.5 text-left font-medium text-[#94a3b8] border-b border-[#1e293b]/50">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-1.5 text-[#c9d1d9] border-b border-[#1e293b]/30">{children}</td>
  ),
  h1: ({ children }: any) => <h1 className="text-base font-semibold text-[#e2e8f0] mt-4 mb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-[14px] font-semibold text-[#e2e8f0] mt-3 mb-1.5">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-[13px] font-semibold text-[#e2e8f0] mt-2 mb-1">{children}</h3>,
  hr: () => <hr className="border-[#1e293b]/40 my-3" />,
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-[#475569] hover:text-[#94a3b8] transition-colors p-0.5">
      {copied ? <Check size={10} className="text-[#34d399]" /> : <Copy size={10} />}
    </button>
  );
}

/* ─── Thinking Section ──────────────────────────────────── */

function ThinkingSection({ blocks, isStreaming }: { blocks: ThinkingBlock[]; isStreaming?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const fullText = blocks.map((b) => b.text).join("\n");
  const previewLen = 120;
  const preview = fullText.length > previewLen ? fullText.slice(0, previewLen) + "..." : fullText;

  return (
    <div className="rounded-lg border border-[#1e293b]/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-[#151a25]/50 transition-colors"
      >
        <Sparkles size={11} className="text-[#818cf8] shrink-0" />
        <span className="text-[11px] font-medium text-[#818cf8]">Thinking</span>
        {isStreaming && <Loader2 size={10} className="animate-spin text-[#818cf8]/50" />}
        <ChevronRight
          size={11}
          className={`text-[#475569] ml-auto transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>
      {expanded ? (
        <div className="px-3 pb-3 text-[12px] text-[#64748b] whitespace-pre-wrap leading-relaxed font-mono border-t border-[#1e293b]/30 pt-2 max-h-[300px] overflow-y-auto">
          {fullText}
        </div>
      ) : fullText && (
        <div className="px-3 pb-2 text-[11px] text-[#475569] italic truncate">
          {preview}
        </div>
      )}
    </div>
  );
}

/* ─── Tool Card ─────────────────────────────────────────── */

function ToolCard({ tool }: { tool: ToolUseItem }) {
  const [showInput, setShowInput] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const Icon = TOOL_ICONS[tool.name] || Wrench;
  const color = TOOL_COLORS[tool.name] || "#64748b";

  // Extract short summary
  let summary = "";
  if (tool.input) {
    if (tool.name === "Bash" && tool.input.command) {
      summary = tool.input.command;
    } else if (tool.name === "Read" && tool.input.file_path) {
      summary = shortenPath(tool.input.file_path);
    } else if ((tool.name === "Edit" || tool.name === "Write") && tool.input.file_path) {
      summary = shortenPath(tool.input.file_path);
    } else if (tool.name === "Grep" && tool.input.pattern) {
      summary = tool.input.pattern;
    } else if (tool.name === "Glob" && tool.input.pattern) {
      summary = tool.input.pattern;
    } else if (tool.name === "WebSearch" && tool.input.query) {
      summary = tool.input.query;
    } else if (tool.name === "Agent" && tool.input.description) {
      summary = tool.input.description;
    }
  }

  const hasResult = tool.result !== undefined;
  const resultPreview = tool.result
    ? (tool.result.length > 200 ? tool.result.slice(0, 200) + "..." : tool.result)
    : "";

  return (
    <div className="rounded-lg border border-[#1e293b]/50 overflow-hidden bg-[#0a0b0f]/40">
      {/* Tool header */}
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <div className="w-[18px] h-[18px] rounded flex items-center justify-center" style={{ background: `${color}10` }}>
          <Icon size={10} style={{ color }} />
        </div>
        <span className="text-[11px] font-mono font-medium text-[#e2e8f0]">{tool.name}</span>
        {summary && (
          <span className="text-[11px] font-mono text-[#475569] truncate flex-1 min-w-0">{summary}</span>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 ml-auto shrink-0">
          {tool.input && (
            <button
              onClick={() => setShowInput(!showInput)}
              className={`p-1 rounded transition-colors ${showInput ? "bg-[#1e293b] text-[#94a3b8]" : "text-[#334155] hover:text-[#64748b]"}`}
              title="View input"
            >
              <Code2 size={10} />
            </button>
          )}
          {hasResult && (
            <button
              onClick={() => setShowResult(!showResult)}
              className={`p-1 rounded transition-colors ${showResult ? "bg-[#1e293b] text-[#94a3b8]" : "text-[#334155] hover:text-[#64748b]"}`}
              title="View result"
            >
              <Eye size={10} />
            </button>
          )}
          {tool.isError && (
            <span className="text-[9px] font-mono text-[#f87171] bg-[#f87171]/8 px-1.5 py-0.5 rounded">error</span>
          )}
          {hasResult && !tool.isError && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]/60" />
          )}
        </div>
      </div>

      {/* Expandable input */}
      {showInput && tool.input && (
        <div className="border-t border-[#1e293b]/30">
          <pre className="text-[10px] font-mono text-[#64748b] p-2.5 overflow-x-auto max-h-[200px] overflow-y-auto leading-relaxed">
            {JSON.stringify(tool.input, null, 2)}
          </pre>
        </div>
      )}

      {/* Expandable result */}
      {showResult && hasResult && (
        <div className={`border-t border-[#1e293b]/30 ${tool.isError ? "bg-[#f87171]/3" : ""}`}>
          <pre className={`text-[10px] font-mono p-2.5 overflow-x-auto max-h-[300px] overflow-y-auto leading-relaxed ${
            tool.isError ? "text-[#f87171]/80" : "text-[#64748b]"
          }`}>
            {tool.result}
          </pre>
        </div>
      )}

      {/* Inline result preview if not expanded */}
      {!showResult && hasResult && resultPreview && (
        <div className="px-2.5 pb-1.5">
          <div className={`text-[10px] font-mono truncate ${
            tool.isError ? "text-[#f87171]/50" : "text-[#334155]"
          }`}>
            {resultPreview.split("\n")[0]}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Utilities ─────────────────────────────────────────── */

function shortenPath(p: string): string {
  const parts = p.replace(/^\/Users\/[^/]+/, "~").split("/");
  return parts.length > 3 ? ".../" + parts.slice(-2).join("/") : parts.join("/");
}
