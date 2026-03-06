import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { FileText, Search, User, Bot, ChevronDown, ChevronRight } from "lucide-react";

const TIME_FILTERS = [
  { label: "All Time", value: "" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

export default function Transcripts() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce search
  const debounceRef = useMemo(() => {
    let timer: ReturnType<typeof setTimeout>;
    return (val: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => setDebouncedSearch(val), 300);
    };
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    debounceRef(val);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["transcripts", debouncedSearch, timeFilter],
    queryFn: () => api.transcripts(debouncedSearch || undefined, timeFilter || undefined),
  });

  const transcripts = data?.transcripts || [];

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <PageHeader title="Transcripts" count={data?.total || 0} />
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 animate-fade-up stagger-1">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search transcripts..."
            className="w-full bg-[#0f1219] border border-[#1e293b] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#34d399]/40 transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTimeFilter(f.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                timeFilter === f.value
                  ? "bg-[#1e2433] text-[#e2e8f0]"
                  : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#151a25]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-[#64748b] text-sm">Searching...</div>
      ) : transcripts.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No transcripts found"
          description={search ? `No results for "${search}". Try a different search.` : "Search across all your session transcripts."}
        />
      ) : (
        <div className="space-y-2 animate-fade-up stagger-2">
          {transcripts.map((t: any) => {
            const isExpanded = expandedId === t.sessionId;
            const firstUserMsg = t.messages.find((m: any) => m.role === "user");
            return (
              <div key={t.sessionId} className="glass-card rounded-xl overflow-hidden">
                {/* Header - clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : t.sessionId)}
                  className="w-full px-5 py-4 flex items-center gap-3 hover:bg-[#1c2333]/40 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-[#64748b] shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-[#64748b] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#e2e8f0] truncate">
                      {firstUserMsg?.text?.slice(0, 100) || "Empty session"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#64748b] mt-1">
                      <span className="text-[#34d399]">{t.projectPath?.split("/").pop() || "unknown"}</span>
                      <span>{formatTimeAgo(t.startedAt)}</span>
                      <span>{t.messages.length} messages</span>
                    </div>
                  </div>
                </button>

                {/* Expanded transcript */}
                {isExpanded && (
                  <div className="border-t border-[#1e293b] px-5 py-4 space-y-3 max-h-[500px] overflow-y-auto">
                    {t.messages.map((msg: any, i: number) => (
                      <div key={i} className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          {msg.role === "user" ? (
                            <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center">
                              <User size={12} className="text-[#60a5fa]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center">
                              <Bot size={12} className="text-[#34d399]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-[#475569] mb-0.5">
                            {msg.role === "user" ? "You" : msg.model ? formatModel(msg.model) : "Claude"}
                          </div>
                          <div className="text-sm text-[#c9d1d9] whitespace-pre-wrap break-words leading-relaxed">
                            {highlightText(msg.text, debouncedSearch)}
                          </div>
                          {msg.toolUse && msg.toolUse.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {msg.toolUse.map((tool: string, ti: number) => (
                                <span
                                  key={ti}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151a25] text-[#64748b]"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function highlightText(text: string, query: string) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#fbbf24]/20 text-[#fbbf24] rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function formatModel(model: string): string {
  return model.replace("claude-", "").replace(/-\d{8}$/, "").replace(/-/g, " ");
}

function formatTimeAgo(ts: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
