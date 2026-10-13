import axios from "axios";

// In development, Vite proxies /api to http://localhost:8000
// In production on Vercel, set VITE_API_BASE=https://<your-render-service>.onrender.com/api/v1
const RAW_API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const LLM_STORAGE_KEY = "ph5_custom_llm_config";

export function getCustomLLMConfig() {
  try {
    const raw = localStorage.getItem(LLM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCustomLLMConfig(config) {
  try {
    if (!config || !config.apiKey) {
      localStorage.removeItem(LLM_STORAGE_KEY);
    } else {
      localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(config));
    }
  } catch (e) {
    console.error("Failed to save LLM config", e);
  }
}

export function clearCustomLLMConfig() {
  try {
    localStorage.removeItem(LLM_STORAGE_KEY);
  } catch {}
}

const BYOK_SELECTION_KEY = "ph5_byok_selection";

export function getByokSelection() {
  try {
    const raw = localStorage.getItem(BYOK_SELECTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setByokSelection(selection) {
  try {
    if (!selection) {
      localStorage.removeItem(BYOK_SELECTION_KEY);
    } else {
      localStorage.setItem(BYOK_SELECTION_KEY, JSON.stringify(selection));
    }
  } catch (e) {
    console.error("Failed to save BYOK selection", e);
  }
}

export function clearByokSelection() {
  try {
    localStorage.removeItem(BYOK_SELECTION_KEY);
  } catch {}
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
});

// Auto-attach custom BYO-LLM credentials to outgoing requests
api.interceptors.request.use((config) => {
  const custom = getCustomLLMConfig();
  if (custom && custom.apiKey) {
    if (custom.provider) config.headers["X-LLM-Provider"] = custom.provider;
    if (custom.apiKey) config.headers["X-LLM-Api-Key"] = custom.apiKey;
    if (custom.model) config.headers["X-LLM-Model"] = custom.model;
    if (custom.baseUrl) config.headers["X-LLM-Base-Url"] = custom.baseUrl;
  }
  return config;
});

function bareHeaders({ apiKey, baseUrl }) {
  const h = { "X-LLM-Api-Key": apiKey };
  if (baseUrl) h["X-LLM-Base-Url"] = baseUrl;
  return h;
}

function readError(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  return err?.message || "Request failed";
}

// Uses a bare axios call so the stored BYO-LLM interceptor can't override the key being tested.
export async function fetchProviderModels({ provider, apiKey, baseUrl }) {
  try {
    const res = await axios.get(`${API_BASE}/llm/models`, {
      params: { provider },
      headers: bareHeaders({ apiKey, baseUrl }),
      timeout: 30_000,
    });
    return { ok: true, models: res.data.models || [] };
  } catch (err) {
    return { ok: false, reason: readError(err) };
  }
}

export async function verifyProviderKey({ provider, model, apiKey, baseUrl }) {
  try {
    const res = await axios.post(`${API_BASE}/llm/verify`, null, {
      params: { provider, model },
      headers: bareHeaders({ apiKey, baseUrl }),
      timeout: 60_000,
    });
    return res.data;
  } catch (err) {
    return { ok: false, status: err?.response?.status || 0, reason: readError(err) };
  }
}

export function parseRateLimitError(err) {
  const status = err?.response?.status;
  if (status !== 429) return null;

  const data = err?.response?.data || {};
  let retryAfter = data.retry_after || data.cooldown_seconds;
  if (!retryAfter) {
    const headerVal = err?.response?.headers?.["retry-after"];
    if (headerVal) retryAfter = parseInt(headerVal, 10);
  }
  if (!retryAfter && typeof data.detail === "string") {
    const match = data.detail.match(/(\d+(?:\.\d+)?)\s*s/i);
    if (match) retryAfter = Math.round(parseFloat(match[1]));
  }

  return {
    isRateLimit: true,
    status: 429,
    cooldownSeconds: Math.max(1, Math.round(retryAfter || 15)),
    provider: data.provider || "groq",
    detail: data.detail || "Rate limit reached. Provider is cooling down.",
    suggestion:
      data.suggestion ||
      "Bring your own free API key (Gemini, Groq, OpenAI, OpenRouter) to bypass community limits.",
  };
}

export async function textCheck(text) {
  return api.post("/analyze/text", { text });
}

export async function urlCheck(url) {
  return api.post("/analyze/url", { url });
}

export async function imageCheckFile(file) {
  const form = new FormData();
  form.append("file", file);
  return api.post("/analyze/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function multimodalCheck({ text, url, file } = {}) {
  const form = new FormData();
  if (text) form.append("text", text);
  if (url) form.append("url", url);
  if (file) form.append("file", file);
  return api.post("/analyze/multimodal", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function chatMultipart(query, file) {
  const form = new FormData();
  form.append("query", query || "");
  if (file) form.append("file", file);
  return api.post("/chat", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function getSystemStatus() {
  return api.get("/status");
}

export async function getHealth() {
  return api.get("/health");
}

export { API_BASE };
export default api;
