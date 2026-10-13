import { ArrowUpRight, Sparkles } from "lucide-react";

export default function AnnouncementBanner({ onOpenLlmSettings }) {
  return (
    <button
      type="button"
      onClick={onOpenLlmSettings}
      className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/70 hover:bg-orange-100/70 px-2.5 sm:px-3.5 py-1.5 text-xs text-orange-950 max-w-full transition-colors cursor-pointer group shadow-2xs"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E83C00] text-[10px] font-bold text-white flex-shrink-0 shadow-2xs">
        <Sparkles className="h-2.5 w-2.5" />
      </span>
      <span className="truncate">
        <strong>New:</strong> Bring Your Own LLM (Gemini, OpenAI, Groq) for unlimited queries
      </span>
      <ArrowUpRight className="h-3 w-3 text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" />
    </button>
  );
}
