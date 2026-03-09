import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { MessageSquare, Send, ChevronDown, User, Bot, Key, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MODELS = [
  { id: "claude-opus-4-6", label: "Opus" },
  { id: "claude-sonnet-4-6", label: "Sonnet" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku" },
];

export default function Assistant() {
  const queryClient = useQueryClient();
  const { data: status } = useQuery({ queryKey: ["chat-status"], queryFn: api.chatStatus });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState("claude-opus-4-6");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKeySetup, setShowKeySetup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasKey = status?.hasKey || false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (hasKey && !showKeySetup) {
      inputRef.current?.focus();
    }
  }, [hasKey, showKeySetup]);

  const saveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    await api.chatSetKey(apiKeyInput.trim());
    setApiKeyInput("");
    setShowKeySetup(false);
    queryClient.invalidateQueries({ queryKey: ["chat-status"] });
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await api.chatStream(newMessages, model);

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Error: ${err.error || "Failed to connect"}`,
          };
          return updated;
        });
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setIsStreaming(false);
        return;
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "text") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + data.text,
                };
                return updated;
              });
            } else if (data.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: `Error: ${data.error}`,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Error: ${err.message || "Connection failed"}`,
        };
        return updated;
      });
    }

    setIsStreaming(false);
  }, [input, isStreaming, messages, model]);

  // API key setup screen
  if (!hasKey || showKeySetup) {
    return (
      <div className="animate-fade-up flex flex-col h-full">
        <PageHeader title="Assistant" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full glass-card border border-[#34d399]/15 flex items-center justify-center mb-5 mx-auto shadow-[0_0_20px_rgba(52,211,153,0.06)]">
              <Key size={24} className="text-[#64748b]" />
            </div>
            <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">
              {hasKey ? "Update API Key" : "Add API Key"}
            </h3>
            <p className="text-sm text-[#64748b] mb-6 leading-relaxed">
              Enter your Anthropic API key to chat with Claude.
            </p>
            <div className="flex gap-2">
              <input
                autoFocus
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveApiKey();
                  if (e.key === "Escape" && hasKey) setShowKeySetup(false);
                }}
                placeholder="sk-ant-..."
                className="flex-1 bg-[#0f1219] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm font-mono text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#34d399]/40 transition-colors"
              />
              <button
                onClick={saveApiKey}
                className="px-5 py-2.5 bg-[#34d399] text-[#08090d] font-semibold text-sm rounded-lg hover:brightness-110 transition-all"
              >
                Save
              </button>
            </div>
            {hasKey && (
              <button
                onClick={() => setShowKeySetup(false)}
                className="mt-3 text-xs text-[#64748b] hover:text-[#e2e8f0] transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="Assistant" />
        <button
          onClick={() => setShowKeySetup(true)}
          className="text-[10px] text-[#475569] hover:text-[#64748b] transition-colors font-mono"
        >
          API Key
        </button>
      </div>

      <div className="flex-1 flex flex-col glass-card rounded-xl overflow-hidden min-h-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center animate-fade-up">
                <div className="w-16 h-16 rounded-full glass-card border border-[#34d399]/15 flex items-center justify-center mb-5 mx-auto shadow-[0_0_20px_rgba(52,211,153,0.06)]">
                  <MessageSquare size={24} className="text-[#64748b]" />
                </div>
                <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-[#64748b] max-w-sm leading-relaxed">
                  Chat with Claude using {MODELS.find((m) => m.id === model)?.label || "Opus"}.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="flex gap-3 animate-fade-in">
                <div className="shrink-0 mt-0.5">
                  {msg.role === "user" ? (
                    <div className="w-7 h-7 rounded-full bg-[#1e293b] flex items-center justify-center">
                      <User size={13} className="text-[#60a5fa]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#1e293b] flex items-center justify-center">
                      <Bot size={13} className="text-[#34d399]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-[#475569] mb-1">
                    {msg.role === "user" ? "You" : MODELS.find((m) => m.id === model)?.label || "Claude"}
                  </div>
                  <div className="text-sm text-[#c9d1d9] whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                    {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                      <span className="inline-block w-1.5 h-4 bg-[#34d399] ml-0.5 animate-pulse rounded-sm" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-[#1e293b] px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#151a25] text-[#e2e8f0] text-xs font-mono hover:bg-[#1c2333] transition-colors"
              >
                {MODELS.find((m) => m.id === model)?.label || "Opus"}
                <ChevronDown size={12} className="text-[#64748b]" />
              </button>
              {showModelPicker && (
                <div className="absolute bottom-full left-0 mb-1 bg-[#151a25] border border-[#1e293b] rounded-lg shadow-lg overflow-hidden z-10">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModel(m.id);
                        setShowModelPicker(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-xs font-mono transition-colors ${
                        model === m.id
                          ? "bg-[#1e2433] text-[#34d399]"
                          : "text-[#e2e8f0] hover:bg-[#1c2333]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                disabled={isStreaming}
                className="w-full bg-[#151a25] text-[#e2e8f0] placeholder-[#475569] text-sm rounded-lg px-4 py-2.5 pr-10 border border-[#1e293b] focus:outline-none focus:border-[#34d399]/40 transition-colors disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#64748b] hover:text-[#34d399] transition-colors disabled:opacity-40 disabled:hover:text-[#64748b]"
              >
                {isStreaming ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
