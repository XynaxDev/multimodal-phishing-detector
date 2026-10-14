import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Key,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Server,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  getCustomLLMConfig,
  setCustomLLMConfig,
  clearCustomLLMConfig,
  getByokSelection,
  setByokSelection,
  fetchProviderModels,
  verifyProviderKey,
  formatErrorMessage,
} from "../api";
import {
  LLM_PROVIDERS as PROVIDERS,
  DEFAULT_PROVIDER_ID,
  isPaidModelOrProvider,
  getProviderMeta,
  getProviderTheme,
} from "../data/llmProviders";

function ProviderIcon({ id, className = "h-3.5 w-3.5" }) {
  if (id === "gemini") return <Sparkles className={className} />;
  if (id === "openrouter") return <Layers className={className} />;
  if (id === "openai") return <Cpu className={className} />;
  if (id === "custom") return <Server className={className} />;
  return <Zap className={`${className} fill-current`} fill="currentColor" />;
}
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "./ui/select";

const BADGE = "bg-slate-50 text-slate-600 border-slate-200/80";
const firstModel = (p) => (p.freeModels[0] || p.paidModels[0])?.id || "";

const PROVIDER_SELECTED_STYLES = {
  groq: {
    selectedBg: "bg-orange-50",
    selectedBorder: "border-orange-500 ring-1 ring-orange-400",
    selectedText: "text-orange-950",
    iconColor: "text-orange-600",
    badgeSelected: "bg-orange-100 text-orange-900 border-orange-300",
  },
  gemini: {
    selectedBg: "bg-sky-50",
    selectedBorder: "border-sky-500 ring-1 ring-sky-400",
    selectedText: "text-sky-950",
    iconColor: "text-sky-600",
    badgeSelected: "bg-sky-100 text-sky-900 border-sky-300",
  },
  openrouter: {
    selectedBg: "bg-purple-50",
    selectedBorder: "border-purple-500 ring-1 ring-purple-400",
    selectedText: "text-purple-950",
    iconColor: "text-purple-600",
    badgeSelected: "bg-purple-100 text-purple-900 border-purple-300",
  },
  openai: {
    selectedBg: "bg-emerald-50",
    selectedBorder: "border-emerald-500 ring-1 ring-emerald-400",
    selectedText: "text-emerald-950",
    iconColor: "text-emerald-600",
    badgeSelected: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  custom: {
    selectedBg: "bg-slate-100",
    selectedBorder: "border-slate-500 ring-1 ring-slate-400",
    selectedText: "text-slate-900",
    iconColor: "text-slate-700",
    badgeSelected: "bg-slate-200 text-slate-900 border-slate-300",
  },
};

export default function LlmSettingsModal({ isOpen, onClose, onConfigSaved }) {
  const [provider, setProvider] = useState(DEFAULT_PROVIDER_ID);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(firstModel(PROVIDERS[0]));
  const [baseUrl, setBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [fetched, setFetched] = useState(null); // models returned for the user's key
  const [fetching, setFetching] = useState(false);
  const [check, setCheck] = useState({ state: "idle", reason: "" }); // idle | checking | ok | fail
  const [done, setDone] = useState(false);
  const [activeConfig, setActiveConfig] = useState(getCustomLLMConfig());

  const meta = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];
  const isPaid = isPaidModelOrProvider(provider, model);
  const isCustomConfigActive = Boolean(activeConfig && activeConfig.apiKey);
  const activeMeta = isCustomConfigActive ? getProviderMeta(activeConfig.provider) : null;

  // Lock page scroll on mobile and desktop while open, and close on Escape.
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const existing = getCustomLLMConfig();
    setActiveConfig(existing);
    const draft = getByokSelection();
    // Prioritize active verified config; fall back to remembered panel selection
    const saved = existing || draft;
    const pid = saved?.provider || DEFAULT_PROVIDER_ID;
    const p = PROVIDERS.find((x) => x.id === pid) || PROVIDERS[0];
    setProvider(p.id);
    setApiKey(saved?.apiKey || "");
    setModel(saved?.model || firstModel(p));
    setBaseUrl(saved?.baseUrl || p.defaultBaseUrl || "");
    const known = [...p.freeModels, ...p.paidModels].map((m) => m.id);
    setIsCustomModel(Boolean(saved?.isCustomModel || (saved?.model && !known.includes(saved.model))));
    setFetched(null);
    setCheck({ state: "idle", reason: "" });
    setDone(false);
  }, [isOpen]);

  const changeProvider = (id) => {
    const p = PROVIDERS.find((x) => x.id === id) || PROVIDERS[0];
    const newModel = firstModel(p);
    const newBaseUrl = p.defaultBaseUrl || "";
    setProvider(id);
    setModel(newModel);
    setBaseUrl(newBaseUrl);
    setIsCustomModel(false);
    setFetched(null);
    setCheck({ state: "idle", reason: "" });
    setByokSelection({
      provider: id,
      model: newModel,
      baseUrl: newBaseUrl,
      apiKey,
      isCustomModel: false,
    });
  };

  const onKeyChange = (v) => {
    setApiKey(v);
    setFetched(null);
    setCheck({ state: "idle", reason: "" });
    setByokSelection({
      provider,
      model,
      baseUrl,
      apiKey: v,
      isCustomModel,
    });
  };

  const onModelChange = (v) => {
    setModel(v);
    setCheck({ state: "idle", reason: "" });
    setByokSelection({
      provider,
      model: v,
      baseUrl,
      apiKey,
      isCustomModel,
    });
  };

  const onCustomModelToggle = () => {
    const nextVal = !isCustomModel;
    setIsCustomModel(nextVal);
    setByokSelection({
      provider,
      model,
      baseUrl,
      apiKey,
      isCustomModel: nextVal,
    });
  };

  const onBaseUrlChange = (v) => {
    setBaseUrl(v);
    setByokSelection({
      provider,
      model,
      baseUrl: v,
      apiKey,
      isCustomModel,
    });
  };

  const loadModels = async () => {
    if (!apiKey.trim()) return;
    setFetching(true);
    setCheck({ state: "idle", reason: "" });
    const res = await fetchProviderModels({ provider, apiKey: apiKey.trim(), baseUrl: baseUrl.trim() });
    setFetching(false);
    if (res.ok) setFetched(res.models);
    else setCheck({ state: "fail", reason: formatErrorMessage(res.reason) });
  };

  // Models shown after the user's key is loaded: everything their account can list,
  // minus the verified-free ones that are already pinned at the top.
  const accountModels = useMemo(() => {
    if (!fetched) return null;
    const freeIds = new Set(meta.freeModels.map((m) => m.id));
    return fetched.filter((m) => !freeIds.has(m.id));
  }, [fetched, meta]);

  const paidList = accountModels
    ? accountModels.map((m) => ({ id: m.id, badge: m.free ? "Free" : undefined }))
    : meta.paidModels;

  const handleSave = async () => {
    // 1. Mandatory validation for API Key on paid models and cloud providers
    if (!apiKey.trim()) {
      if (isPaid || provider !== "custom") {
        setCheck({
          state: "fail",
          reason: isPaid
            ? `API key is required for ${meta.name} (${model || "selected model"}) — paid models require an API key with active credits.`
            : `Please enter an API key for ${meta.name} to activate your custom engine. (To use the shared community engine, click "Use shared" below).`,
        });
        return;
      }
    }

    // 2. Validation for Model
    if (!model.trim()) {
      setCheck({ state: "fail", reason: "Please choose or enter a model ID first." });
      return;
    }

    // 3. Verification test against backend
    setCheck({ state: "checking", reason: "" });
    const res = await verifyProviderKey({
      provider,
      model: model.trim(),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
    });

    if (!res.ok) {
      setCheck({ state: "fail", reason: formatErrorMessage(res.reason || "Verification failed. Check your API key.") });
      return;
    }

    setCheck({ state: "ok", reason: formatErrorMessage(res.reason) });
    const newConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim() || undefined,
    };
    setCustomLLMConfig(newConfig);
    setByokSelection({
      ...newConfig,
      isCustomModel,
    });
    setActiveConfig(newConfig);
    finish();
  };

  const finish = () => {
    setDone(true);
    if (onConfigSaved) onConfigSaved();
    setTimeout(onClose, 700);
  };

  const handleReset = () => {
    clearCustomLLMConfig();
    setActiveConfig(null);
    setApiKey("");
    setFetched(null);
    setCheck({ state: "ok", reason: "Reverted to shared community engine (Groq)." });
    finish();
  };

  const saving = check.state === "checking";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs sm:backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative z-10 isolate flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl my-auto max-h-[calc(100dvh-1.25rem)] sm:max-h-[min(88dvh,42rem)]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="rounded-xl border border-orange-200/60 bg-orange-50 p-1.5 sm:p-2 text-orange-600 shrink-0">
                  <Key className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Bring Your Own LLM</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">Configure or verify your personal provider key</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer shrink-0 ml-2"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 space-y-3 sm:space-y-4 overflow-y-auto overscroll-contain touch-pan-y p-3.5 sm:p-6 bg-white">
              {/* Currently Active Engine Status Bar */}
              {(() => {
                const activeTheme = getProviderTheme(
                  isCustomConfigActive ? activeConfig.provider : "shared",
                  !isCustomConfigActive
                );
                return (
                  <div className={`rounded-xl border p-2.5 sm:p-3 transition-colors ${activeTheme.bgLight} ${activeTheme.border}`}>
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
                      {/* Active Status Badge in front of the text */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 border shadow-2xs ${
                          !isCustomConfigActive
                            ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                            : activeTheme.badge
                        }`}
                      >
                        <Zap className="h-3 w-3 fill-current" fill="currentColor" />
                        {isCustomConfigActive ? "BYOK Active" : "Shared Free"}
                      </span>

                      {/* Currently Active Text & Details */}
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                        <span className="text-[11px] font-medium text-slate-500 shrink-0">Currently Active:</span>
                        <span className="text-xs font-bold text-slate-900 shrink-0">
                          {isCustomConfigActive ? activeMeta?.name || activeConfig.provider : "Groq"}
                        </span>
                        <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] text-slate-700 border border-slate-200/90 truncate max-w-[140px] xs:max-w-[190px] sm:max-w-[260px]">
                          {isCustomConfigActive ? activeConfig.model : "qwen/qwen3.8-27b"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Provider Selection (Uniform cards + Tooltips) */}
              <div>
                <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Provider
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    Select AI provider
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:p-3 shadow-2xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                    {PROVIDERS.map((p) => {
                      const selected = provider === p.id;
                      const style = PROVIDER_SELECTED_STYLES[p.id] || PROVIDER_SELECTED_STYLES.groq;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => changeProvider(p.id)}
                          className={`h-[72px] sm:h-[78px] w-full flex flex-col justify-between rounded-xl border p-2 sm:p-2.5 text-left transition-all cursor-pointer ${
                            selected
                              ? `${style.selectedBg} ${style.selectedBorder} ${style.selectedText} font-bold shadow-xs`
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <ProviderIcon
                                id={p.id}
                                className={`h-3.5 w-3.5 shrink-0 ${selected ? style.iconColor : "text-slate-500"}`}
                              />
                              <span className="font-bold text-[11px] sm:text-xs tracking-tight truncate">{p.name}</span>
                            </div>
                            {selected && (
                              <Check className={`h-3.5 w-3.5 shrink-0 stroke-[2.5] ${style.iconColor}`} />
                            )}
                          </div>
                          <div>
                            <span
                              className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                                selected ? style.badgeSelected : p.badgeClass
                              }`}
                            >
                              {p.tag}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* API key */}
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">API Key</label>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        <Zap className="h-2.5 w-2.5 text-amber-600 fill-current" fill="currentColor" />
                        API key required (paid)
                      </span>
                    ) : meta.id !== "custom" ? (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                        Free key eligible
                      </span>
                    ) : null}
                  </div>
                  {meta.keyUrl && (
                    <a
                      href={meta.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700"
                    >
                      <span>{meta.keyUrlText}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => onKeyChange(e.target.value)}
                    placeholder={meta.keyPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    className={`w-full rounded-xl border py-2 sm:py-2.5 pl-3.5 pr-10 font-mono text-xs text-slate-900 outline-none placeholder:text-slate-400 transition-colors ${
                      check.state === "fail" && !apiKey.trim()
                        ? "border-red-400 bg-red-50/20 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 bg-slate-50 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500"
                    }`}
                  />
                  <div className="absolute right-3 top-2 sm:top-2.5">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Model */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Model</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={loadModels}
                      disabled={!apiKey.trim() || fetching}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 disabled:cursor-not-allowed disabled:text-slate-300 cursor-pointer"
                    >
                      {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      <span>{fetched ? "Reload my models" : "Load my models"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onCustomModelToggle}
                      className="text-[11px] font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      {isCustomModel ? "Pick from list" : "Custom ID"}
                    </button>
                  </div>
                </div>

                {isCustomModel ? (
                  <div className="relative">
                    <Cpu className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => onModelChange(e.target.value)}
                      placeholder={firstModel(meta)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 sm:py-2.5 pl-9 pr-3.5 font-mono text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                ) : (
                  <Select
                    value={model}
                    onValueChange={onModelChange}
                  >
                    <SelectTrigger className="h-9.5 sm:h-10 w-full rounded-xl border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 w-[var(--radix-select-trigger-width)] min-w-[340px] max-w-[90vw]">
                      {meta.freeModels.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="mx-1 mb-1 flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50/80 px-2.5 py-1.5 text-[11px] font-bold normal-case tracking-normal text-emerald-800">
                            <Sparkles className="h-3 w-3 shrink-0 text-emerald-600" />
                            <span>{meta.freeGroupLabel}</span>
                          </SelectLabel>
                          {meta.freeModels.map((m) => (
                            <SelectItem key={m.id} value={m.id} badge={m.badge} badgeColor={BADGE}>
                              {m.id}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {paidList.length > 0 && (
                        <>
                          {meta.freeModels.length > 0 && <SelectSeparator className="my-1" />}
                          <SelectGroup>
                            <SelectLabel className="mx-1 mb-1 flex items-center gap-1.5 rounded-md border border-slate-200/60 bg-slate-100/80 px-2.5 py-1.5 text-[11px] font-bold normal-case tracking-normal text-slate-700">
                              <Zap className="h-3 w-3 shrink-0 text-amber-600 fill-current" fill="currentColor" />
                              <span>{accountModels ? "Available with your key" : meta.paidGroupLabel}</span>
                            </SelectLabel>
                            {paidList.map((m) => (
                              <SelectItem key={m.id} value={m.id} badge={m.badge} badgeColor={BADGE}>
                                {m.id}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {(provider === "custom" || baseUrl) && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => onBaseUrlChange(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 sm:py-2.5 font-mono text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Status line: fixed slot so layout never jumps */}
              <div className="min-h-[2.25rem]">
                {check.state === "fail" && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{check.reason}</span>
                  </div>
                )}
                {check.state === "ok" && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{check.reason}</span>
                  </div>
                )}
                {check.state === "idle" && fetched && (
                  <p className="text-[11px] text-slate-500">{fetched.length} chat models available to this key.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between gap-2 sm:gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-3.5">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 sm:gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-800 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span>Use shared</span>
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="h-8.5 px-3 text-xs cursor-pointer">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || done}
                  className="h-8.5 min-w-[7.5rem] sm:min-w-[8.5rem] bg-[#E83C00] px-3 sm:px-4 text-xs font-semibold text-white hover:bg-[#d03600] cursor-pointer"
                >
                  {done ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5" />
                      <span>Activated</span>
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      <span>Verifying</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                      <span>Verify &amp; Activate</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
