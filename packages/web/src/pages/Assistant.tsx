import { PageHeader } from "../components/PageHeader";
import { MessageSquare, Send, ChevronDown } from "lucide-react";

export default function Assistant() {
  return (
    <div className="animate-fade-up flex flex-col h-full">
      <PageHeader title="Assistant" />

      <div className="flex-1 flex flex-col glass-card rounded-xl overflow-hidden min-h-[500px]">
        {/* Chat area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-up">
            <div className="stagger-1 w-16 h-16 rounded-full glass-card border border-[#34d399]/15 flex items-center justify-center mb-5 mx-auto shadow-[0_0_20px_rgba(52,211,153,0.06)]">
              <MessageSquare size={24} className="text-[#64748b]" />
            </div>
            <h3 className="stagger-2 text-lg font-semibold text-[#e2e8f0] mb-2">
              Start a conversation with Claude
            </h3>
            <p className="stagger-3 text-sm text-[#64748b] max-w-sm leading-relaxed">
              Built-in AI chatbot powered by Claude. Coming soon.
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-[#1e293b] px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Model selector */}
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#151a25] text-[#64748b] text-xs font-mono cursor-not-allowed opacity-60"
            >
              Claude Sonnet
              <ChevronDown size={12} />
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <input
                type="text"
                disabled
                placeholder="Type a message..."
                className="w-full bg-[#151a25] text-[#e2e8f0] placeholder-[#475569] text-sm rounded-lg px-4 py-2.5 pr-10 border border-[#1e293b] focus:outline-none cursor-not-allowed opacity-60"
              />
              <button
                disabled
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#64748b] cursor-not-allowed opacity-60"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
