// Single source of truth for BYO-LLM providers (used by the modal and the docs page).
// "free" lists only contain models that were verified to respond on a free-tier key via the
// provider's own endpoint. Paid models are shown only as suggestions; users load their real
// list with "Load my models" and every key/model pair is verified before activation.

export const DEFAULT_PROVIDER_ID = "groq";

export const LLM_PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    tag: "Free tier",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    freeGroupLabel: "Free tier models",
    freeModels: [
      { id: "qwen/qwen3.8-27b", badge: "Default" },
      { id: "openai/gpt-oss-120b", badge: "Largest" },
      { id: "openai/gpt-oss-20b", badge: "Fast" },
      { id: "allam-2-7b", badge: "Small" },
    ],
    paidGroupLabel: "",
    paidModels: [],
    keyPlaceholder: "gsk_...",
    keyUrl: "https://console.groq.com/keys",
    keyUrlText: "Get free key",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    tag: "Free tier",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    freeGroupLabel: "Free tier models",
    freeModels: [
      { id: "gemini-flash-lite-latest", badge: "Default" },
      { id: "gemini-flash-latest", badge: "Balanced" },
      { id: "gemini-3.8-flash", badge: "Newest" },
      { id: "gemini-3.5-flash", badge: "" },
      { id: "gemini-3.1-flash-lite", badge: "Light" },
      { id: "gemma-4-31b-it", badge: "Open" },
      { id: "gemma-4-26b-a4b-it", badge: "Open" },
    ],
    paidGroupLabel: "Paid (billing required)",
    paidModels: [
      { id: "gemini-pro-latest", badge: "Pro" },
      { id: "gemini-3.1-pro-preview", badge: "Pro" },
    ],
    keyPlaceholder: "AIzaSy...",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyUrlText: "Get free key",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tag: "Free models",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    freeGroupLabel: "Free models (:free)",
    freeModels: [
      { id: "google/gemma-4-31b-it:free", badge: "Default" },
      { id: "google/gemma-4-26b-a4b-it:free", badge: "" },
      { id: "nvidia/nemotron-3-super-120b-a12b:free", badge: "Largest" },
      { id: "nvidia/nemotron-3.5-lightning:free", badge: "Fast" },
      { id: "liquid/lfm-2.5-2.6b:free", badge: "Small" },
      { id: "openrouter/free", badge: "Auto" },
    ],
    paidGroupLabel: "Paid (credits required)",
    paidModels: [],
    keyPlaceholder: "sk-or-v1-...",
    keyUrl: "https://openrouter.ai/keys",
    keyUrlText: "Get key",
  },
  {
    id: "openai",
    name: "OpenAI",
    tag: "Paid only",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    freeGroupLabel: "",
    freeModels: [],
    paidGroupLabel: "Paid (credits required)",
    paidModels: [
      { id: "gpt-4o-mini", badge: "Cheapest" },
      { id: "gpt-4.1-mini", badge: "" },
      { id: "gpt-5-mini", badge: "" },
      { id: "gpt-4o", badge: "" },
    ],
    keyPlaceholder: "sk-proj-...",
    keyUrl: "https://platform.openai.com/api-keys",
    keyUrlText: "Get key",
  },
  {
    id: "custom",
    name: "Custom / Ollama",
    tag: "Self-hosted",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    freeGroupLabel: "Local models",
    freeModels: [
      { id: "llama3.2", badge: "Default" },
      { id: "llama3.1:8b", badge: "" },
      { id: "mistral", badge: "" },
      { id: "phi3", badge: "" },
    ],
    paidGroupLabel: "",
    paidModels: [],
    defaultBaseUrl: "http://localhost:11434/v1",
    keyPlaceholder: "ollama (any value)",
    keyUrl: "https://ollama.com",
    keyUrlText: "Ollama docs",
  },
];

export const DEFAULT_SHARED_CONFIG = {
  provider: "groq",
  providerName: "Groq",
  model: "qwen/qwen3.8-27b",
  isShared: true,
};

export function getProviderMeta(providerId) {
  return LLM_PROVIDERS.find((p) => p.id === providerId) || LLM_PROVIDERS[0];
}

/**
 * Returns true if a model or provider requires paid credits or paid billing.
 * - OpenAI is paid-only.
 * - Any model listed in paidModels is paid.
 * - Custom / Ollama is self-hosted (free).
 * - OpenRouter free models end with :free, other models require OpenRouter credits.
 * - Google Gemini pro models require billing (e.g. gemini-pro-latest).
 */
export function isPaidModelOrProvider(providerId, modelId) {
  if (providerId === "openai") return true;
  if (providerId === "custom") return false;
  const p = getProviderMeta(providerId);
  if (!p) return false;
  if (p.paidModels?.some((m) => m.id === modelId)) return true;
  if (p.freeModels?.length === 0) return true;
  const inFree = p.freeModels?.some((m) => m.id === modelId);
  if (inFree) return false;
  if (providerId === "openrouter") {
    return !modelId?.endsWith(":free");
  }
  return true;
}

export const PROVIDER_THEMES = {
  shared: {
    id: "shared",
    name: "Shared Community",
    bgLight: "bg-emerald-50/70",
    border: "border-emerald-200/90",
    borderActive: "border-emerald-500",
    text: "text-emerald-900",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pillBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500",
    iconColor: "text-emerald-600",
  },
  groq: {
    id: "groq",
    name: "Groq",
    bgLight: "bg-orange-50/70",
    border: "border-orange-200/90",
    borderActive: "border-orange-500",
    text: "text-orange-950",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    pillBg: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    ring: "ring-orange-500",
    iconColor: "text-orange-600",
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    bgLight: "bg-sky-50/70",
    border: "border-sky-200/90",
    borderActive: "border-sky-500",
    text: "text-sky-950",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    pillBg: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    ring: "ring-sky-500",
    iconColor: "text-sky-600",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    bgLight: "bg-purple-50/70",
    border: "border-purple-200/90",
    borderActive: "border-purple-500",
    text: "text-purple-950",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    pillBg: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    ring: "ring-purple-500",
    iconColor: "text-purple-600",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    bgLight: "bg-emerald-50/70",
    border: "border-emerald-200/90",
    borderActive: "border-emerald-500",
    text: "text-emerald-950",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pillBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500",
    iconColor: "text-emerald-600",
  },
  custom: {
    id: "custom",
    name: "Custom / Ollama",
    bgLight: "bg-slate-100/70",
    border: "border-slate-200/90",
    borderActive: "border-slate-500",
    text: "text-slate-900",
    badge: "bg-slate-200 text-slate-800 border-slate-300",
    pillBg: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-500",
    ring: "ring-slate-500",
    iconColor: "text-slate-600",
  },
};

export function getProviderTheme(providerId, isShared = false) {
  if (isShared || !providerId) return PROVIDER_THEMES.shared;
  return PROVIDER_THEMES[providerId] || PROVIDER_THEMES.shared;
}
