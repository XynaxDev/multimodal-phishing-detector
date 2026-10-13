import { Github, Zap, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import Tooltip from "./ui/tooltip";

export default function NavBar({ onOpenLlmSettings }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 hover:opacity-90 transition-opacity">
            <img
              src="/logo.png"
              alt="PH5 Logo"
              className="h-7 w-7 sm:h-9 sm:w-9 object-contain shrink-0"
            />
            <div className="leading-tight">
              <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">PH5</div>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-1.5 sm:gap-3 text-xs text-slate-500 md:text-sm shrink-0">
          {/* BYOK Pill with Clean Tooltip */}
          <Tooltip
            content="Bring Your Own LLM — Connect free Gemini, Groq, or OpenAI API key"
            position="bottom"
          >
            <button
              type="button"
              onClick={onOpenLlmSettings}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/90 bg-orange-50 px-2.5 sm:px-3 py-1 text-xs font-bold text-orange-800 shadow-2xs hover:bg-orange-100 hover:border-orange-300 transition-all cursor-pointer group"
            >
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current text-orange-600 shrink-0" fill="currentColor" />
              <span>BYOK</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-orange-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
            </button>
          </Tooltip>

          <Link
            to="/docs"
            className="rounded-full px-2 sm:px-3 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors inline-block font-medium text-xs sm:text-sm shrink-0"
          >
            Docs
          </Link>

          <a
            href="https://huggingface.co/xynaxdev"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/70 hover:bg-amber-100/70 px-2 sm:px-3 py-1 text-xs font-medium text-amber-950 shadow-2xs hover:border-amber-300 transition-all shrink-0"
            title="View Hugging Face Models"
          >
            <span className="text-sm leading-none">🤗</span>
            <span className="hidden sm:inline font-semibold">Models</span>
          </a>

          <a
            href="https://github.com/XynaxDev/multimodal-phishing-detector"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-slate-200 bg-white px-2 sm:px-3 py-1 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 shrink-0"
          >
            <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
