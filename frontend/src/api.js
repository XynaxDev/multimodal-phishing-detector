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
  timeout: 120_000,
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

export function formatErrorMessage(raw) {
  if (!raw) return "Request failed";
  if (typeof raw !== "string") {
    try {
      if (Array.isArray(raw) && raw.length > 0) {
        return formatErrorMessage(raw[0]);
      }
      if (typeof raw === "object") {
        if (raw.error) return formatErrorMessage(raw.error);
        if (raw.message) return String(raw.message);
        if (raw.detail) return formatErrorMessage(raw.detail);
      }
    } catch (_) {}
  }

  let str = String(raw).trim();

  // If str is a JSON string e.g. '[{"error": ...}]' or '{"error": ...}'
  if ((str.startsWith("[") && str.endsWith("]")) || (str.startsWith("{") && str.endsWith("}"))) {
    try {
      const parsed = JSON.parse(str);
      return formatErrorMessage(parsed);
    } catch (_) {}
  }

  // Common timeout strings
  if (/timeout of \d+ms exceeded/i.test(str) || /ECONNABORTED/i.test(str)) {
    return "Request timed out. The server or AI provider took too long to respond. Please check your network and retry.";
  }

  // Upstream 503 high demand friendly message
  if (str.includes("experiencing high demand") || str.includes("UNAVAILABLE")) {
    return "This model is currently experiencing high demand upstream. Spikes in demand are usually temporary. Please try another model or retry in a few moments.";
  }

  return str;
}

function readError(err) {
  if (err?.code === "ECONNABORTED" || /timeout/i.test(err?.message || "")) {
    return "Request timed out. The server or AI provider took too long to respond. Please check your network and retry.";
  }
  const detail = err?.response?.data?.detail;
  if (detail) return formatErrorMessage(detail);
  const data = err?.response?.data;
  if (data) return formatErrorMessage(data);
  return formatErrorMessage(err?.message || "Request failed");
}

// Uses a bare axios call so the stored BYO-LLM interceptor can't override the key being tested.
export async function fetchProviderModels({ provider, apiKey, baseUrl }) {
  try {
    const res = await axios.get(`${API_BASE}/llm/models`, {
      params: { provider },
      headers: bareHeaders({ apiKey, baseUrl }),
      timeout: 90_000,
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
      timeout: 90_000,
    });
    if (res.data && res.data.reason) {
      res.data.reason = formatErrorMessage(res.data.reason);
    }
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

/**
 * Automatically optimizes images before upload to prevent high-resolution mobile
 * camera photos (often 12MP-48MP / 2MB-15MB) from crashing low-memory cloud hosts (512MB RAM OOM).
 * Resizes down to max 1280px on the longest dimension, preserving 100% of OCR and ResNet visual fidelity.
 */
export async function optimizeImageForUpload(file, maxDimension = 1280, quality = 0.88) {
  if (!file || !(file instanceof File || file instanceof Blob) || !file.type?.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width <= maxDimension && height <= maxDimension && file.size < 400 * 1024) {
          resolve(file);
          return;
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const origName = file.name || "upload.jpg";
            const safeName = origName.replace(/\.[^/.]+$/, "") + ".jpg";
            const optimizedFile = new File([blob], safeName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            console.log(
              `[PH5 Optimization] Scaled ${file.name} from ${(file.size / 1024).toFixed(0)}KB to ${(optimizedFile.size / 1024).toFixed(0)}KB (${width}x${height})`
            );
            resolve(optimizedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    } catch {
      resolve(file);
    }
  });
}

export async function textCheck(text) {
  return api.post("/analyze/text", { text });
}

export async function urlCheck(url) {
  return api.post("/analyze/url", { url });
}

export async function imageCheckFile(file) {
  const safeFile = await optimizeImageForUpload(file);
  const form = new FormData();
  form.append("file", safeFile);
  return api.post("/analyze/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function multimodalCheck({ text, url, file } = {}) {
  const form = new FormData();
  if (text) form.append("text", text);
  if (url) form.append("url", url);
  if (file) {
    const safeFile = await optimizeImageForUpload(file);
    form.append("file", safeFile);
  }
  return api.post("/analyze/multimodal", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function chatMultipart(query, file) {
  const form = new FormData();
  form.append("query", query || "");
  if (file) {
    const safeFile = await optimizeImageForUpload(file);
    form.append("file", safeFile);
  }
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
