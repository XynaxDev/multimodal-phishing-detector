import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Loader2,
  X,
  Globe,
  Mail,
  Smartphone,
  Code,
  Type,
  MessageSquare,
  Link,
  Image,
  MessageCircle,
  Bot,
  Clock,
  Cpu,
  ArrowUpRight,
  Zap,
  Sparkles,
  Layers,
  Server,
} from "lucide-react";
import { Button } from "./ui/button";
import SendMatrixIcon from "./ui/SendMatrixIcon";
import Tooltip from "./ui/tooltip";
import { useState, useEffect, useRef } from "react";
import { getProviderMeta, getProviderTheme } from "../data/llmProviders";

function ProviderIcon({ id, className = "h-3.5 w-3.5" }) {
  if (id === "gemini") return <Sparkles className={className} />;
  if (id === "openrouter") return <Layers className={className} />;
  if (id === "openai") return <Cpu className={className} />;
  if (id === "custom") return <Server className={className} />;
  return <Zap className={`${className} fill-current`} fill="currentColor" />;
}

export default function PremiumSearchBar({
  baseQuery,
  setBaseQuery,
  mode,
  setMode,
  baseFile,
  setBaseFile,
  run,
  loading,
  onClearResults,
  cooldownSeconds = 0,
  onOpenLlmSettings,
  customLlmConfig,
}) {
  // 🔑 ISOLATED STATE PER MODE
  const [modeQueries, setModeQueries] = useState({
    text: "",
    sms: "",
    emails: "",
    urls: "",
    images: "",
    script: "",
    chat: "",
  });

  const [modeFiles, setModeFiles] = useState({
    text: null,
    sms: null,
    emails: null,
    urls: null,
    images: null,
    script: null,
    chat: null,
  });

  const textareaRef = useRef(null);

  const query = modeQueries[mode] || "";
  const file = modeFiles[mode] || null;

  const setQuery = (value) => {
    setModeQueries((prev) => ({ ...prev, [mode]: value }));
    setBaseQuery(value);
  };

  const setFile = (value) => {
    setModeFiles((prev) => ({ ...prev, [mode]: value }));
    setBaseFile(value);
  };

  // When mode changes, immediately sync parent baseQuery and baseFile to the current mode's isolated state
  useEffect(() => {
    setBaseQuery(modeQueries[mode] || "");
    setBaseFile(modeFiles[mode] || null);
  }, [mode]);

  // Sync internal state with props when they change (for clear results)
  useEffect(() => {
    if (!baseQuery) {
      setModeQueries((prev) => ({ ...prev, [mode]: "" }));
    }
  }, [baseQuery, mode]);

  useEffect(() => {
    if (!baseFile) {
      setModeFiles((prev) => ({ ...prev, [mode]: null }));
    }
  }, [baseFile, mode]);

  // Auto-resize textarea as text grows or mode changes
  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const scrollHeight = el.scrollHeight;
      // Min single-line height ~24px, max expansion height 210px before scrolling inside
      const maxHeight = 210;
      const targetHeight = Math.min(Math.max(scrollHeight, 24), maxHeight);
      el.style.height = `${targetHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [query, mode]);

  useEffect(() => {
    window.addEventListener("resize", adjustTextareaHeight);
    return () => window.removeEventListener("resize", adjustTextareaHeight);
  }, []);

  const handleTextChange = (e) => {
    setQuery(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // In URL mode or when pressing Enter without Shift on desktop: submit
      const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
      if (mode === "urls" || (!e.shiftKey && !isMobile)) {
        e.preventDefault();
        if (!loading && (query.trim() || file)) {
          run(query, file);
        }
      }
    }
  };

  const isImageMode = mode === "images";
  const isChatMode = mode === "chat";

  const placeholder =
    mode === "urls"
      ? "Enter any suspicious URL to check for phishing..."
      : mode === "emails"
      ? "Paste email subject and body to analyze..."
      : mode === "sms"
      ? "Enter any SMS message or verification text..."
      : mode === "script"
      ? "Paste any script or code snippet to analyze..."
      : mode === "chat"
      ? "Ask anything about phishing, security, or upload content..."
      : mode === "text"
      ? "Enter any suspicious message or text..."
      : "Enter content to analyze...";

  const getModeIcon = () => {
    switch (mode) {
      case "urls":
        return <Globe className="h-4 w-4" />;
      case "emails":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <Smartphone className="h-4 w-4" />;
      case "script":
        return <Code className="h-4 w-4" />;
      case "chat":
        return <Bot className="h-4 w-4 sm:h-5 sm:w-5" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const isCustomActive = Boolean(customLlmConfig && customLlmConfig.apiKey);
  const activeMeta = isCustomActive ? getProviderMeta(customLlmConfig.provider) : null;
  const activeProviderId = isCustomActive ? customLlmConfig.provider : "groq";
  const activeProviderName = isCustomActive ? activeMeta?.name || customLlmConfig.provider : "Groq";
  const activeModel = isCustomActive ? customLlmConfig.model : "qwen/qwen3.8-27b";
  const theme = getProviderTheme(isCustomActive ? activeProviderId : "shared", !isCustomActive);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mt-4 w-full rounded-2xl sm:rounded-[28px] border border-gray-200 bg-white p-2.5 sm:px-6 sm:py-5 shadow-sm"
    >
      {/* Active Engine & Model Bar (Responsive & Themed) */}
      <div className={`mb-3 flex items-center justify-between gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs transition-colors ${theme.bgLight} ${theme.border}`}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
          <ProviderIcon id={activeProviderId} className={`h-3.5 w-3.5 ${theme.iconColor} shrink-0`} />
          <span className="font-semibold text-slate-600 text-[11px] sm:text-xs shrink-0">Engine:</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">{activeProviderName}</span>
          <span className="hidden sm:inline-block rounded bg-white/90 border border-slate-200/90 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 truncate max-w-[190px] sm:max-w-[270px]">
            {activeModel}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
              !isCustomActive
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : theme.badge
            }`}
          >
            {!isCustomActive ? "Shared Free" : "BYOK Active"}
          </span>
        </div>

        <Tooltip
          content={isCustomActive ? "Change model or API provider" : "Connect personal LLM (BYOK) for unlimited requests"}
          position="bottom"
        >
          <button
            type="button"
            onClick={onOpenLlmSettings}
            className="inline-flex items-center gap-0.5 sm:gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors shrink-0 cursor-pointer"
          >
            <span>{isCustomActive ? "Change" : "BYOK"}</span>
            <span className="hidden xs:inline"> {isCustomActive ? "Model" : "Engine"}</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </Tooltip>
      </div>

      {/* TABS - Responsive with no-scrollbar on mobile */}
      <div className="flex w-full justify-start sm:justify-center mb-3 sm:mb-5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 shadow-sm sm:shadow-md shadow-gray-200 min-w-max mx-auto sm:mx-0">
          <TabButton 
            label="Text" 
            active={mode === "text"} 
            onClick={() => setMode("text")} 
          />
          <TabButton 
            label="SMS" 
            active={mode === "sms"} 
            onClick={() => setMode("sms")} 
          />
          <TabButton 
            label="Emails" 
            active={mode === "emails"} 
            onClick={() => setMode("emails")} 
          />
          <TabButton 
            label="URLs" 
            active={mode === "urls"} 
            onClick={() => setMode("urls")} 
          />
          <TabButton 
            label="Script" 
            active={mode === "script"} 
            onClick={() => setMode("script")} 
          />
          <TabButton 
            label="Images" 
            active={mode === "images"} 
            onClick={() => setMode("images")} 
          />
          <TabButton 
            label="Chat" 
            active={mode === "chat"} 
            onClick={() => setMode("chat")} 
          />
        </div>
      </div>

      {/* Dynamic Cooldown Alert Banner */}
      <AnimatePresence>
        {cooldownSeconds > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-amber-300/80 bg-amber-50/90 px-3.5 py-2 flex items-center justify-between text-xs text-amber-900 shadow-2xs overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse shrink-0" />
              <span>
                Free tier cooling down: <strong className="font-mono text-amber-800">{cooldownSeconds}s</strong> remaining
              </span>
            </div>
            {onOpenLlmSettings && (
              <button
                type="button"
                onClick={onOpenLlmSettings}
                className="text-[11px] font-semibold text-orange-700 hover:text-orange-900 underline shrink-0 ml-2"
              >
                Bypass with API key
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview - ONLY Chat Mode */}
      <AnimatePresence>
        {file && isChatMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-3 mb-2"
          >
            <div className="relative inline-block">
              <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setFile(null)}
                className="absolute -top-1.5 -right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-900 transition-colors shadow-md cursor-pointer"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN INPUT CONTAINER */}
      <div className="mt-0">
        {!isImageMode ? (
          // Text-based modes - Auto-expanding textarea with inside scrollbar
          <div className="flex-1">
            <div className="flex items-start rounded-xl sm:rounded-2xl bg-gray-50 px-2.5 py-2 sm:px-4 sm:py-3 border border-gray-200 shadow-sm gap-2 sm:gap-3 transition-all duration-150">
              {/* Icon - Pinned near top when multiline */}
              <div className="flex shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 h-7 w-7 sm:h-8 sm:w-8 mt-1">
                {getModeIcon()}
              </div>

              {/* Auto-expanding Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={placeholder}
                className="flex-1 resize-none bg-transparent text-[15px] sm:text-base text-slate-900 placeholder:text-gray-400 border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none font-normal leading-relaxed py-1 sm:py-1.5 overflow-y-auto expandable-input-scrollbar"
                style={{
                  minHeight: "24px",
                  maxHeight: "210px",
                }}
                value={query}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
              />

              {/* Action Buttons - Pinned at bottom right when expanded */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end mb-0.5">
                {/* Attachment Button - Chat only */}
                {isChatMode && (
                  <label className="inline-flex h-8 w-8 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:border-gray-400 transition-colors">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}

                {/* Send Button or Dynamic Cooldown Pill */}
                {cooldownSeconds > 0 ? (
                  <Tooltip content="Community cooldown active — click to bypass with your personal API key" position="top">
                    <button
                      type="button"
                      onClick={onOpenLlmSettings}
                      className="rounded-[5px] sm:rounded-[6px] bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 px-2.5 h-8 sm:h-9 shadow-2xs gap-1 select-none animate-pulse transition-all cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{cooldownSeconds}s</span>
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    className="rounded-[5px] sm:rounded-[6px] bg-[#E83C00] hover:bg-[#cf3500] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 overflow-hidden w-8 h-8 sm:w-9 sm:h-9 transition-all shadow-2xs cursor-pointer"
                    onClick={() => run(query, file)}
                    disabled={loading || (!query.trim() && !file)}
                    aria-label="Send"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <SendMatrixIcon className="w-[15px] h-[15px] sm:w-[17px] sm:h-[17px]" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Image mode
          <div className="flex w-full flex-col gap-3">
            <label className="relative flex min-h-[160px] sm:min-h-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-6 sm:px-4 sm:py-8 text-center transition-colors hover:bg-gray-100 hover:border-gray-400">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />

              {file ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="mx-auto max-h-36 sm:max-h-40 rounded object-contain"
                />
              ) : (
                <>
                  <div className="mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 bg-white text-gray-500">
                    <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <p className="mb-1 text-sm sm:text-base font-semibold text-black">
                    Drop your screenshot here
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    PNG, JPG or GIF (max ~10MB)
                  </p>
                  <span className="mt-3 sm:mt-5 inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                    Select image
                  </span>
                </>
              )}
            </label>

            {file && (
              <div className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-white px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-lg bg-gray-100 border border-gray-200 shrink-0">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="truncate font-medium text-sm sm:text-base max-w-[140px] sm:max-w-[220px]">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {/* Image Send Button or Dynamic Cooldown Pill */}
                  {cooldownSeconds > 0 ? (
                    <Tooltip content="Community cooldown active — click to bypass with your personal API key" position="top">
                      <button
                        type="button"
                        onClick={onOpenLlmSettings}
                        className="rounded-[5px] sm:rounded-[6px] bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 px-2.5 h-8 sm:h-9 shadow-2xs gap-1 select-none animate-pulse transition-all cursor-pointer"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>{cooldownSeconds}s</span>
                      </button>
                    </Tooltip>
                  ) : (
                    <button
                      type="button"
                      className="rounded-[5px] sm:rounded-[6px] bg-[#E83C00] hover:bg-[#cf3500] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 overflow-hidden w-8 h-8 sm:w-9 sm:h-9 transition-all shadow-2xs cursor-pointer"
                      onClick={() => run(query, file)}
                      disabled={loading}
                      aria-label="Send"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <SendMatrixIcon className="w-[15px] h-[15px] sm:w-[17px] sm:h-[17px]" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Tab Button Component - Using React Icons from lucide-react (Clean without intrusive tooltips)
function TabButton({ label, active, onClick }) {
  const getIcon = () => {
    switch (label) {
      case "Text":
        return <Type className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case "SMS":
        return <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case "Emails":
        return <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case "URLs":
        return <Link className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case "Script":
        return <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case "Images":
        return <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case "Chat":
        return <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer ${
        active
          ? "text-orange-500 bg-white shadow-sm sm:shadow-md"
          : "bg-transparent text-gray-600 hover:text-gray-900"
      }`}
    >
      <span className={`${active ? "text-orange-500" : "text-gray-500"}`}>
        {getIcon()}
      </span>
      <span>{label}</span>
    </button>
  );
}
