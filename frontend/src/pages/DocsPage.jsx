import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Server,
  Code2,
  CheckCircle2,
  ChevronDown,
  Layers,
  X,
  Key,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Terminal,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Button } from "../components/ui/button";
import SiteFooter from "../components/SiteFooter";
import Tooltip from "../components/ui/tooltip";
import { LLM_PROVIDERS } from "../data/llmProviders";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "../components/ui/select";

// Clean, robust token-based syntax highlighter for JSON
function HighlightedJson({ data }) {
  const jsonStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const tokenRegex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],:])/g;

  const tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(jsonStr)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(jsonStr.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (/^"/.test(token)) {
      if (/:$/.test(token)) {
        const key = token.slice(0, -1);
        tokens.push(
          <span key={match.index} className="text-sky-300 font-medium">
            {key}
          </span>
        );
        tokens.push(
          <span key={match.index + "-c"} className="text-slate-500">
            :
          </span>
        );
      } else {
        tokens.push(
          <span key={match.index} className="text-emerald-300">
            {token}
          </span>
        );
      }
    } else if (/true|false/.test(token)) {
      tokens.push(
        <span key={match.index} className="text-pink-400 font-semibold">
          {token}
        </span>
      );
    } else if (/null/.test(token)) {
      tokens.push(
        <span key={match.index} className="text-slate-500 italic">
          {token}
        </span>
      );
    } else if (/^-?\d/.test(token)) {
      tokens.push(
        <span key={match.index} className="text-purple-300 font-mono">
          {token}
        </span>
      );
    } else {
      tokens.push(
        <span key={match.index} className="text-slate-400">
          {token}
        </span>
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < jsonStr.length) {
    tokens.push(jsonStr.slice(lastIndex));
  }

  return (
    <pre className="font-mono text-xs leading-relaxed whitespace-pre font-normal text-slate-300 selection:bg-slate-800">
      <code>{tokens}</code>
    </pre>
  );
}

// Clean syntax highlighter for cURL, Python & JavaScript snippets
function HighlightedCode({ code }) {
  const lines = code.split("\n");
  const regex =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(curl|POST|GET|import|requests|const|await|fetch|method|headers|body|data|url|payload|response|print|console\.log|new|FormData|with|open|as)\b|(-[XHdF]|--\w+)|[{}[\],:]|[a-zA-Z0-9_]+|\s+|[^\s\w])/g;

  return (
    <div className="font-mono text-xs leading-relaxed table w-full">
      {lines.map((line, lineIdx) => {
        const tokens = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          const val = match[0];
          if (/^["']/.test(val)) {
            tokens.push(
              <span key={match.index} className="text-emerald-300">
                {val}
              </span>
            );
          } else if (/^(curl|import|const|await|new|with|open|as)$/.test(val)) {
            tokens.push(
              <span key={match.index} className="text-purple-400 font-semibold">
                {val}
              </span>
            );
          } else if (/^(POST|GET)$/.test(val)) {
            tokens.push(
              <span key={match.index} className="text-emerald-400 font-bold">
                {val}
              </span>
            );
          } else if (/^(requests|fetch|FormData|print|console\.log)$/.test(val)) {
            tokens.push(
              <span key={match.index} className="text-sky-400 font-semibold">
                {val}
              </span>
            );
          } else if (/^(method|headers|body|data|url|payload|response)$/.test(val)) {
            tokens.push(
              <span key={match.index} className="text-indigo-300 font-medium">
                {val}
              </span>
            );
          } else if (/^-[XHdF]/.test(val)) {
            tokens.push(
              <span key={match.index} className="text-amber-400 font-bold">
                {val}
              </span>
            );
          } else if (/^#|\/\//.test(val)) {
            tokens.push(
              <span key={match.index} className="text-slate-500 italic">
                {val}
              </span>
            );
          } else {
            tokens.push(val);
          }
        }
        return (
          <div key={lineIdx} className="table-row">
            <span className="table-cell select-none text-slate-600 pr-4 text-right opacity-60 text-[11px] w-8">
              {lineIdx + 1}
            </span>
            <span className="table-cell whitespace-pre text-slate-200">
              {tokens.length > 0 ? tokens : " "}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ProviderDocIcon({ id, className = "h-4 w-4" }) {
  if (id === "groq") return <Zap className={`${className} fill-current text-orange-600`} fill="currentColor" />;
  if (id === "gemini") return <Sparkles className={`${className} fill-current text-sky-600`} fill="currentColor" />;
  if (id === "openrouter") return <Layers className={`${className} text-purple-600`} />;
  if (id === "openai") return <Cpu className={`${className} text-emerald-600`} />;
  return <Server className={`${className} text-slate-700`} />;
}

function getProviderDocIconBg(id) {
  if (id === "groq") return "bg-orange-100/90 text-orange-600 border-orange-200/80";
  if (id === "gemini") return "bg-sky-100/90 text-sky-600 border-sky-200/80";
  if (id === "openrouter") return "bg-purple-100/90 text-purple-600 border-purple-200/80";
  if (id === "openai") return "bg-emerald-100/90 text-emerald-600 border-emerald-200/80";
  return "bg-slate-100/90 text-slate-700 border-slate-200/80";
}

const BYO_LLM_PROVIDERS = LLM_PROVIDERS.map((p) => ({
  ...p,
  badge: p.tag,
  badgeClass: `${p.badgeClass} font-medium whitespace-nowrap`,
  model: (p.freeModels[0] || p.paidModels[0]).id,
  keyDocsUrl: p.keyUrl,
  keyLinkText: p.keyUrlText,
  baseUrl: p.defaultBaseUrl,
}));

const BYOK_HEADERS_PARAMETERS = [
  {
    name: "X-LLM-Provider",
    type: "header (string)",
    required: false,
    description: "Provider key: 'gemini', 'groq', 'openai', 'openrouter', or 'custom'. Bypasses community IP limits.",
  },
  {
    name: "X-LLM-Api-Key",
    type: "header (string)",
    required: false,
    description: "Your personal API key. Non-custodial: strictly in-transit, never saved or stored.",
  },
  {
    name: "X-LLM-Model",
    type: "header (string)",
    required: false,
    description: "Model override (e.g. gemini-1.5-flash, gpt-4o-mini, llama-3.3-70b-versatile).",
  },
  {
    name: "X-LLM-Base-Url",
    type: "header (string)",
    required: false,
    description: "Custom OpenAI-compatible base URL (e.g. http://localhost:11434/v1 for Ollama).",
  },
];

const ENDPOINTS = [
  {
    id: "text",
    method: "POST",
    path: "/analyze/text",
    title: "Text & Message Analysis",
    description:
      "Classifies raw message bodies, suspicious emails, SMS messages, or chat transcripts. Powered by a fine-tuned BERT sequence classifier to detect urgency coercion, credential harvesting triggers, and spoofing signatures.",
    parameters: [
      {
        name: "text",
        type: "string",
        required: true,
        description: "The raw message text or email body to evaluate.",
      },
      ...BYOK_HEADERS_PARAMETERS,
    ],
    headers: [{ name: "Content-Type", value: "application/json" }],
    responseStatus: 200,
    responseBody: {
      mode: "text",
      label: "phishing",
      phishing_score: 0.9842,
      probs: {
        benign: 0.0158,
        phishing: 0.9842,
      },
      explanation:
        "The message contains urgency ultimatum patterns ('account closed within 24 hours') and credential verification triggers.\n• High probability of credential harvesting.\n• Recommended action: Do not click the verification link.",
      explanation_source: "llm",
      llm_provider: "gemini",
      llm_model: "gemini-1.5-flash",
      latency_ms: 18.4,
    },
    curl: (base) =>
      `curl -X POST "${base}/analyze/text" \\
  -H "Content-Type: application/json" \\
  -H "X-LLM-Provider: gemini" \\
  -H "X-LLM-Api-Key: YOUR_GEMINI_KEY" \\
  -H "X-LLM-Model: gemini-1.5-flash" \\
  -d '{"text": "URGENT: Your account has been locked. Verify immediately at http://login-verify.xyz"}'`,
    python: (base) =>
      `import requests

url = "${base}/analyze/text"
headers = {
    "Content-Type": "application/json",
    "X-LLM-Provider": "gemini",
    "X-LLM-Api-Key": "YOUR_GEMINI_KEY",
    "X-LLM-Model": "gemini-1.5-flash"
}
payload = {
    "text": "URGENT: Your account has been locked. Verify immediately at http://login-verify.xyz"
}

response = requests.post(url, headers=headers, json=payload)
data = response.json()

print(f"Verdict: {data['label']} (Score: {data['phishing_score']:.2%})")
print(f"LLM: {data.get('llm_provider')} / {data.get('llm_model')}")`,
    javascript: (base) =>
      `const response = await fetch("${base}/analyze/text", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-LLM-Provider": "gemini",
    "X-LLM-Api-Key": "YOUR_GEMINI_KEY",
    "X-LLM-Model": "gemini-1.5-flash"
  },
  body: JSON.stringify({
    text: "URGENT: Your account has been locked. Verify immediately at http://login-verify.xyz"
  })
});

const data = await response.json();
console.log(data.label, data.phishing_score);
console.log("Served by:", data.llm_provider, data.llm_model);`,
  },
  {
    id: "url",
    method: "POST",
    path: "/analyze/url",
    title: "URL Threat Classification",
    description:
      "Analyzes full URLs, domains, and suspicious hostnames across 3 distinct classes: Benign, Phishing, and Malware payloads using a fine-tuned DistilBERT classifier.",
    parameters: [
      {
        name: "url",
        type: "string",
        required: true,
        description: "The full URL or domain to evaluate (e.g. http://login.fake-bank.com).",
      },
      ...BYOK_HEADERS_PARAMETERS,
    ],
    headers: [{ name: "Content-Type", value: "application/json" }],
    responseStatus: 200,
    responseBody: {
      mode: "url",
      url: "http://paypal-verification-update.com/signin/webapps/mpp/home",
      label: "phishing",
      phishing_score: 0.9949,
      probs: {
        benign: 0.0051,
        phishing: 0.9932,
        malware: 0.0017,
      },
      explanation:
        "The URL impersonates a recognized financial brand with a mismatched top-level domain.\n• Verified as Phishing threat.\n• Do not navigate to this destination.",
      explanation_source: "llm",
      llm_provider: "groq",
      llm_model: "llama-3.3-70b-versatile",
      latency_ms: 12.1,
    },
    curl: (base) =>
      `curl -X POST "${base}/analyze/url" \\
  -H "Content-Type: application/json" \\
  -H "X-LLM-Provider: groq" \\
  -H "X-LLM-Api-Key: YOUR_GROQ_KEY" \\
  -d '{"url": "http://paypal-verification-update.com/signin/webapps/mpp/home"}'`,
    python: (base) =>
      `import requests

url = "${base}/analyze/url"
headers = {
    "Content-Type": "application/json",
    "X-LLM-Provider": "groq",
    "X-LLM-Api-Key": "YOUR_GROQ_KEY"
}
payload = {"url": "http://paypal-verification-update.com/signin/webapps/mpp/home"}

response = requests.post(url, headers=headers, json=payload)
data = response.json()

print(f"Classification: {data['label']}")
print(f"Probabilities: {data['probs']}")`,
    javascript: (base) =>
      `const response = await fetch("${base}/analyze/url", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-LLM-Provider": "groq",
    "X-LLM-Api-Key": "YOUR_GROQ_KEY"
  },
  body: JSON.stringify({
    url: "http://paypal-verification-update.com/signin/webapps/mpp/home"
  })
});

const data = await response.json();
console.log(data);`,
  },
  {
    id: "image",
    method: "POST",
    path: "/analyze/image",
    title: "Screenshot & OCR Analysis",
    description:
      "Visual phishing detection for webpage screenshots and fake login portals using ResNet-50 computer vision combined with automated OCR extraction.",
    parameters: [
      {
        name: "file",
        type: "binary (multipart/form-data)",
        required: true,
        description: "Screenshot file (PNG, JPEG, WEBP, BMP, GIF). Maximum size: 10 MB.",
      },
      ...BYOK_HEADERS_PARAMETERS,
    ],
    headers: [{ name: "Content-Type", value: "multipart/form-data" }],
    responseStatus: 200,
    responseBody: {
      mode: "image",
      label: "phishing",
      phishing_score: 0.912,
      probs: {
        benign: 0.088,
        phishing: 0.912,
      },
      ocr: "Microsoft Account\nSign in to your account\nEmail, phone or Skype",
      explanation:
        "The screenshot mimics a corporate authentication login screen.\n• OCR detected high-value login keywords.\n• Visual layout corresponds to credential collection templates.",
      explanation_source: "llm",
      llm_provider: "openai",
      llm_model: "gpt-4o-mini",
      latency_ms: 45.8,
    },
    curl: (base) =>
      `curl -X POST "${base}/analyze/image" \\
  -H "X-LLM-Provider: openai" \\
  -H "X-LLM-Api-Key: sk-proj-..." \\
  -F "file=@screenshot.png"`,
    python: (base) =>
      `import requests

url = "${base}/analyze/image"
headers = {
    "X-LLM-Provider": "openai",
    "X-LLM-Api-Key": "sk-proj-..."
}
with open("screenshot.png", "rb") as img:
    files = {"file": ("screenshot.png", img, "image/png")}
    response = requests.post(url, headers=headers, files=files)

data = response.json()
print(f"Verdict: {data['label']}")
if data.get("ocr"):
    print(f"Extracted OCR: {data['ocr']}")`,
    javascript: (base) =>
      `const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("${base}/analyze/image", {
  method: "POST",
  headers: {
    "X-LLM-Provider": "openai",
    "X-LLM-Api-Key": "sk-proj-..."
  },
  body: formData
});

const data = await response.json();
console.log(data);`,
  },
  {
    id: "multimodal",
    method: "POST",
    path: "/analyze/multimodal",
    title: "Multimodal Late Fusion",
    description:
      "Simultaneously accepts text message, destination URL, and visual screenshot. Fuses individual modality probabilities with weighted late fusion (α=0.8) into a single decision.",
    parameters: [
      {
        name: "text",
        type: "string",
        required: false,
        description: "Message body or email text.",
      },
      {
        name: "url",
        type: "string",
        required: false,
        description: "Destination URL or link found in the communication.",
      },
      {
        name: "file",
        type: "binary (multipart/form-data)",
        required: false,
        description: "Screenshot of the landing page.",
      },
      ...BYOK_HEADERS_PARAMETERS,
    ],
    headers: [{ name: "Content-Type", value: "multipart/form-data" }],
    responseStatus: 200,
    responseBody: {
      mode: "fusion",
      label: "phishing",
      phishing_score: 0.988,
      probs: {
        benign: 0.012,
        phishing: 0.988,
      },
      signals: {
        text: 0.978,
        url: 0.995,
        img: 0.912,
        ocr: 0.974,
      },
      raw: {
        text: { benign: 0.022, phishing: 0.978 },
        url: { benign: 0.005, phishing: 0.995, malware: 0.0 },
        image: { benign: 0.088, phishing: 0.912 },
      },
      explanation:
        "All active modalities align on malicious classification. Text creates artificial urgency, URL domain is flagged, and screenshot mimics trusted branding.",
      explanation_source: "llm",
      llm_provider: "openrouter",
      llm_model: "meta-llama/llama-3.3-70b-instruct",
      latency_ms: 58.2,
    },
    curl: (base) =>
      `curl -X POST "${base}/analyze/multimodal" \\
  -H "X-LLM-Provider: openrouter" \\
  -H "X-LLM-Api-Key: sk-or-v1-..." \\
  -F "text=Verify your account" \\
  -F "url=http://apple-id-verify.com/login" \\
  -F "file=@screenshot.png"`,
    python: (base) =>
      `import requests

url = "${base}/analyze/multimodal"
headers = {
    "X-LLM-Provider": "openrouter",
    "X-LLM-Api-Key": "sk-or-v1-..."
}
data = {
    "text": "Your account has been suspended",
    "url": "http://apple-id-verify.com/login"
}

with open("screenshot.png", "rb") as img:
    files = {"file": ("screenshot.png", img, "image/png")}
    response = requests.post(url, headers=headers, data=data, files=files)

result = response.json()
print("Fused Score:", result["phishing_score"])
print("Modality Signals:", result["signals"])`,
    javascript: (base) =>
      `const formData = new FormData();
formData.append("text", "Your account has been suspended");
formData.append("url", "http://apple-id-verify.com/login");
formData.append("file", screenshotFile);

const response = await fetch("${base}/analyze/multimodal", {
  method: "POST",
  headers: {
    "X-LLM-Provider": "openrouter",
    "X-LLM-Api-Key": "sk-or-v1-..."
  },
  body: formData
});

const data = await response.json();
console.log(data);`,
  },
  {
    id: "chat",
    method: "POST",
    path: "/chat",
    title: "Conversational Intent & Analysis",
    description:
      "Autonomous conversational endpoint. Automatically classifies user intent, routes URLs/text/images to the appropriate deep learning model, or answers general security inquiries.",
    parameters: [
      {
        name: "query",
        type: "string",
        required: true,
        description: "User question, message, or prompt to inspect.",
      },
      {
        name: "file",
        type: "binary (multipart/form-data)",
        required: false,
        description: "Optional screenshot accompanying the query.",
      },
      ...BYOK_HEADERS_PARAMETERS,
    ],
    headers: [{ name: "Content-Type", value: "multipart/form-data" }],
    responseStatus: 200,
    responseBody: {
      intent: "url_check",
      mode: "url",
      url: "http://secure-portal.xyz",
      label: "phishing",
      phishing_score: 0.991,
      probs: { benign: 0.009, phishing: 0.991, malware: 0.0 },
      explanation:
        "The link http://secure-portal.xyz was analyzed. The system determined with 99.1% probability that this is a phishing destination.",
      llm_provider: "gemini",
      llm_model: "gemini-1.5-flash",
      latency_ms: 22.4,
    },
    curl: (base) =>
      `curl -X POST "${base}/chat" \\
  -H "X-LLM-Provider: gemini" \\
  -H "X-LLM-Api-Key: AIzaSy..." \\
  -F "query=Is this email safe: Your invoice is attached"`,
    python: (base) =>
      `import requests

url = "${base}/chat"
headers = {
    "X-LLM-Provider": "gemini",
    "X-LLM-Api-Key": "AIzaSy..."
}
response = requests.post(url, headers=headers, data={"query": "Check this link: http://secure-portal.xyz"})
data = response.json()

print(f"Detected Intent: {data['intent']}")
print(f"Explanation: {data.get('explanation') or data.get('reply')}")`,
    javascript: (base) =>
      `const formData = new FormData();
formData.append("query", "Check this link: http://secure-portal.xyz");

const response = await fetch("${base}/chat", {
  method: "POST",
  headers: {
    "X-LLM-Provider": "gemini",
    "X-LLM-Api-Key": "AIzaSy..."
  },
  body: formData
});

const data = await response.json();
console.log(data);`,
  },
  {
    id: "health",
    method: "GET",
    path: "/health",
    title: "Health & Liveness Probe",
    description:
      "Lightweight liveness probe for container orchestrators and cloud load balancers. Returns HTTP 200 without loading model weights into memory.",
    parameters: [],
    headers: [],
    responseStatus: 200,
    responseBody: {
      status: "ok",
      version: "2.0.0",
    },
    curl: (base) => `curl -X GET "${base}/health"`,
    python: (base) =>
      `import requests
res = requests.get("${base}/health")
print(res.json())`,
    javascript: (base) =>
      `const res = await fetch("${base}/health");
console.log(await res.json());`,
  },
  {
    id: "status",
    method: "GET",
    path: "/status",
    title: "System & Model Diagnostics",
    description:
      "Returns hardware device (CUDA/CPU), loaded model artifacts, Groq LLM connectivity status, and OCR configuration.",
    parameters: [],
    headers: [],
    responseStatus: 200,
    responseBody: {
      status: "ok",
      version: "2.0.0",
      environment: "production",
      device: "cuda",
      models: {
        text: { loaded: true, available: true, error: null },
        url: { loaded: true, available: true, error: null },
        image: { loaded: true, available: true, error: null },
      },
      llm: {
        provider: "groq",
        model: "qwen/qwen3.8-27b",
        configured: true,
        use_llm_intent: false,
      },
      ocr_enabled: true,
    },
    curl: (base) => `curl -X GET "${base}/status"`,
    python: (base) =>
      `import requests
res = requests.get("${base}/status")
print(res.json())`,
    javascript: (base) =>
      `const res = await fetch("${base}/status");
console.log(await res.json());`,
  },
];

const ERROR_CODES = [
  {
    code: "200 OK",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold whitespace-nowrap",
    desc: "Request succeeded and model analysis verdict returned successfully.",
  },
  {
    code: "400 Bad Request",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 font-semibold whitespace-nowrap",
    desc: "Malformed request payload, missing mandatory parameters, or empty query.",
  },
  {
    code: "413 Payload Too Large",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200/80 font-semibold whitespace-nowrap",
    desc: "Uploaded screenshot exceeds the 10 MB maximum upload size limit.",
  },
  {
    code: "415 Unsupported Media",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80 font-semibold whitespace-nowrap",
    desc: "Uploaded file is not a supported image format (PNG, JPEG, WEBP, BMP, GIF).",
  },
  {
    code: "422 Validation Error",
    badgeClass: "bg-yellow-50 text-yellow-800 border-yellow-200/80 font-semibold whitespace-nowrap",
    desc: "Validation error on required input fields (e.g. empty string or invalid URL format).",
  },
  {
    code: "429 Rate Limit / Cooldown",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 font-semibold whitespace-nowrap",
    desc: "Provider or community rate limit active. The response contains dynamic 'retry_after' and 'cooldown_seconds' derived from provider headers. Pass 'X-LLM-Api-Key' to bypass all community limits.",
  },
  {
    code: "503 Service Unavailable",
    badgeClass: "bg-red-50 text-red-700 border-red-200/80 font-semibold whitespace-nowrap",
    desc: "AI model weights are currently downloading, uninitialized, or busy.",
  },
];

export default function DocsPage() {
  const [selectedEndpointId, setSelectedEndpointId] = useState("byo-llm");
  const [activeCodeTab, setActiveCodeTab] = useState("curl");
  const [copiedId, setCopiedId] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // BYO-LLM Interactive Selector State
  const [byokProviderId, setByokProviderId] = useState("gemini");
  const [byokModelOverride, setByokModelOverride] = useState("");
  const [byokApiKeyInput, setByokApiKeyInput] = useState("");
  const [byokEndpointTarget, setByokEndpointTarget] = useState("/analyze/url");
  const [byokCustomBaseUrl, setByokCustomBaseUrl] = useState("http://localhost:11434/v1");

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileDrawerOpen]);

  const effectiveBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/v1`
      : "http://localhost:8000/api/v1";

  const currentEndpoint =
    ENDPOINTS.find((e) => e.id === selectedEndpointId) || ENDPOINTS[0];

  const currentByokProvider =
    BYO_LLM_PROVIDERS.find((p) => p.id === byokProviderId) || BYO_LLM_PROVIDERS[0];

  const effectiveByokModel =
    byokModelOverride.trim() || currentByokProvider.model;

  const effectiveByokApiKey =
    byokApiKeyInput.trim() || currentByokProvider.keyPlaceholder;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Generate dynamic BYOK integration code snippet
  const generateByokSnippet = (tab) => {
    const isUrl = byokEndpointTarget === "/analyze/url";
    const isText = byokEndpointTarget === "/analyze/text";
    const isChat = byokEndpointTarget === "/chat";
    const isImage = byokEndpointTarget === "/analyze/image";

    const customBaseUrlHeader =
      byokProviderId === "custom"
        ? `  -H "X-LLM-Base-Url: ${byokCustomBaseUrl}" \\\n`
        : "";

    const customBaseUrlPyHeader =
      byokProviderId === "custom"
        ? `    "X-LLM-Base-Url": "${byokCustomBaseUrl}",\n`
        : "";

    const customBaseUrlJsHeader =
      byokProviderId === "custom"
        ? `    "X-LLM-Base-Url": "${byokCustomBaseUrl}",\n`
        : "";

    if (tab === "curl") {
      if (isUrl) {
        return `curl -X POST "${effectiveBaseUrl}/analyze/url" \\
  -H "Content-Type: application/json" \\
  -H "X-LLM-Provider: ${byokProviderId}" \\
  -H "X-LLM-Api-Key: ${effectiveByokApiKey}" \\
  -H "X-LLM-Model: ${effectiveByokModel}" \\
${customBaseUrlHeader}  -d '{"url": "http://paypal-verification-update.com/login"}'`;
      }
      if (isText) {
        return `curl -X POST "${effectiveBaseUrl}/analyze/text" \\
  -H "Content-Type: application/json" \\
  -H "X-LLM-Provider: ${byokProviderId}" \\
  -H "X-LLM-Api-Key: ${effectiveByokApiKey}" \\
  -H "X-LLM-Model: ${effectiveByokModel}" \\
${customBaseUrlHeader}  -d '{"text": "URGENT: Your account has been locked. Verify immediately at http://login-verify.xyz"}'`;
      }
      if (isChat) {
        return `curl -X POST "${effectiveBaseUrl}/chat" \\
  -H "X-LLM-Provider: ${byokProviderId}" \\
  -H "X-LLM-Api-Key: ${effectiveByokApiKey}" \\
  -H "X-LLM-Model: ${effectiveByokModel}" \\
${customBaseUrlHeader}  -F "query=Check this link: http://secure-portal.xyz"`;
      }
      return `curl -X POST "${effectiveBaseUrl}/analyze/image" \\
  -H "X-LLM-Provider: ${byokProviderId}" \\
  -H "X-LLM-Api-Key: ${effectiveByokApiKey}" \\
  -H "X-LLM-Model: ${effectiveByokModel}" \\
${customBaseUrlHeader}  -F "file=@screenshot.png"`;
    }

    if (tab === "python") {
      if (isUrl) {
        return `import requests

url = "${effectiveBaseUrl}/analyze/url"
headers = {
    "Content-Type": "application/json",
    "X-LLM-Provider": "${byokProviderId}",
    "X-LLM-Api-Key": "${effectiveByokApiKey}",
    "X-LLM-Model": "${effectiveByokModel}",
${customBaseUrlPyHeader}}
payload = {"url": "http://paypal-verification-update.com/login"}

response = requests.post(url, headers=headers, json=payload)
data = response.json()

print(f"Classification: {data['label']} ({data['phishing_score']:.1%})")
print(f"Explanation: {data['explanation']}")
print(f"Served by: {data.get('llm_provider')} / {data.get('llm_model')}")`;
      }
      if (isText) {
        return `import requests

url = "${effectiveBaseUrl}/analyze/text"
headers = {
    "Content-Type": "application/json",
    "X-LLM-Provider": "${byokProviderId}",
    "X-LLM-Api-Key": "${effectiveByokApiKey}",
    "X-LLM-Model": "${effectiveByokModel}",
${customBaseUrlPyHeader}}
payload = {"text": "URGENT: Your account has been suspended. Verify at http://secure-login.example"}

response = requests.post(url, headers=headers, json=payload)
data = response.json()

print(f"Classification: {data['label']}")
print(f"Explanation: {data['explanation']}")`;
      }
      if (isChat) {
        return `import requests

url = "${effectiveBaseUrl}/chat"
headers = {
    "X-LLM-Provider": "${byokProviderId}",
    "X-LLM-Api-Key": "${effectiveByokApiKey}",
    "X-LLM-Model": "${effectiveByokModel}",
${customBaseUrlPyHeader}}

response = requests.post(url, headers=headers, data={"query": "Check this link: http://secure-portal.xyz"})
data = response.json()

print(f"Intent: {data['intent']}")
print(f"Reply: {data.get('explanation') or data.get('reply')}")`;
      }
      return `import requests

url = "${effectiveBaseUrl}/analyze/image"
headers = {
    "X-LLM-Provider": "${byokProviderId}",
    "X-LLM-Api-Key": "${effectiveByokApiKey}",
    "X-LLM-Model": "${effectiveByokModel}",
${customBaseUrlPyHeader}}

with open("screenshot.png", "rb") as f:
    files = {"file": ("screenshot.png", f, "image/png")}
    response = requests.post(url, headers=headers, files=files)

data = response.json()
print(f"Verdict: {data['label']}")
print(f"OCR Text: {data.get('ocr')}")`;
    }

    // JavaScript
    if (isUrl) {
      return `const response = await fetch("${effectiveBaseUrl}/analyze/url", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-LLM-Provider": "${byokProviderId}",
    "X-LLM-Api-Key": "${effectiveByokApiKey}",
    "X-LLM-Model": "${effectiveByokModel}",
${customBaseUrlJsHeader}  },
  body: JSON.stringify({
    url: "http://paypal-verification-update.com/login"
  })
});

const data = await response.json();
console.log("Verdict:", data.label, "Score:", data.phishing_score);
console.log("Explanation:", data.explanation);
console.log("Model:", data.llm_provider, data.llm_model);`;
    }
    if (isText) {
      return `const response = await fetch("${effectiveBaseUrl}/analyze/text", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-LLM-Provider": "${byokProviderId}",
    "X-LLM-Api-Key": "${effectiveByokApiKey}",
    "X-LLM-Model": "${effectiveByokModel}",
${customBaseUrlJsHeader}  },
  body: JSON.stringify({
    text: "URGENT: Your account has been suspended. Verify at http://secure-login.example"
  })
});

const data = await response.json();
console.log(data);`;
    }
    if (isChat) {
      return `const formData = new FormData();
formData.append("query", "Check this link: http://secure-portal.xyz");

const response = await fetch("${effectiveBaseUrl}/chat", {
  method: "POST",
  headers: {
    "X-LLM-Provider": "${byokProviderId}",
    "X-LLM-Api-Key": "${effectiveByokApiKey}",
    "X-LLM-Model": "${effectiveByokModel}",
${customBaseUrlJsHeader}  },
  body: formData
});

const data = await response.json();
console.log(data);`;
    }
    return `const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("${effectiveBaseUrl}/analyze/image", {
  method: "POST",
  headers: {
    "X-LLM-Provider": "${byokProviderId}",
    "X-LLM-Api-Key": "${effectiveByokApiKey}",
    "X-LLM-Model": "${effectiveByokModel}",
${customBaseUrlJsHeader}  },
  body: formData
});

const data = await response.json();
console.log(data);`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Clean Industry Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <img
                src="/logo.png"
                alt="PH5 Logo"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
              />
              <div className="flex items-center gap-2 leading-tight">
                <span className="text-xl font-black text-slate-900 tracking-tight">PH5</span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                  Docs
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1.5 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to App</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Header & Base URL */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              API Reference & BYO-LLM
            </h1>
          </div>
          <p className="mt-1 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            Integrate multimodal phishing detection into your applications. Fast, deterministic classification for text, URLs, and screenshots with sub-second inference. Bring your own LLM key to unlock unlimited throughput.
          </p>

          {/* Minimalist Base URL Bar */}
          <div className="mt-5 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2 shadow-2xs max-w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
              Base URL
            </span>
            <code className="text-xs sm:text-sm font-mono font-semibold text-slate-800 truncate">
              {effectiveBaseUrl}
            </code>
            <Tooltip content="Copy Base API URL" position="top">
              <button
                onClick={() => copyToClipboard(effectiveBaseUrl, "base_url")}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Copy Base URL"
              >
                {copiedId === "base_url" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Mobile API Selector Bar */}
        <div className="lg:hidden sticky top-16 z-30 mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex-1 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-left hover:bg-slate-100 active:bg-slate-200/80 transition-colors shadow-2xs"
            aria-label="Open API Endpoints Menu"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold text-white shrink-0 shadow-2xs ${
                  selectedEndpointId === "byo-llm"
                    ? "bg-[#E83C00]"
                    : currentEndpoint.method === "POST"
                    ? "bg-emerald-600"
                    : "bg-blue-600"
                }`}
              >
                {selectedEndpointId === "byo-llm" ? "BYOK" : currentEndpoint.method}
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate">
                {selectedEndpointId === "byo-llm" ? "Bring Your Own LLM" : currentEndpoint.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 shrink-0 ml-2">
              <span className="text-[11px] font-medium text-slate-600">All Topics</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </button>
        </div>

        {/* Two-Column Grid: Sidebar & Content Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Navigation (Desktop only) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              {/* Highlighted BYO-LLM Nav Item */}
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                LLM Customization
              </div>
              <button
                type="button"
                onClick={() => setSelectedEndpointId("byo-llm")}
                className={`w-full text-left rounded-lg px-2.5 py-2 text-xs flex items-center justify-between transition-colors mb-3 ${
                  selectedEndpointId === "byo-llm"
                    ? "bg-[#E83C00] text-white font-semibold shadow-xs"
                    : "text-slate-700 hover:bg-orange-50 hover:text-orange-950"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Key className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Bring Your Own LLM</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                  selectedEndpointId === "byo-llm" ? "bg-white/20 text-white" : "bg-orange-100 text-orange-800"
                }`}>
                  BYOK
                </span>
              </button>

              <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 pt-3">
                Core Endpoints
              </div>
              <div className="mt-1 space-y-1">
                {ENDPOINTS.slice(0, 5).map((endpoint) => {
                  const isSelected = selectedEndpointId === endpoint.id;
                  return (
                    <button
                      key={endpoint.id}
                      onClick={() => setSelectedEndpointId(endpoint.id)}
                      className={`w-full text-left rounded-lg px-2.5 py-2 text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate mr-2">{endpoint.title}</span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold text-white tracking-wide shrink-0 shadow-2xs ${
                          endpoint.method === "POST"
                            ? "bg-emerald-600"
                            : "bg-blue-600"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                System
              </div>
              <div className="mt-1 space-y-1">
                {ENDPOINTS.slice(5).map((endpoint) => {
                  const isSelected = selectedEndpointId === endpoint.id;
                  return (
                    <button
                      key={endpoint.id}
                      onClick={() => setSelectedEndpointId(endpoint.id)}
                      className={`w-full text-left rounded-lg px-2.5 py-2 text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate mr-2">{endpoint.title}</span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold text-white tracking-wide shrink-0 shadow-2xs ${
                          endpoint.method === "POST"
                            ? "bg-emerald-600"
                            : "bg-blue-600"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Main Details Panel */}
          <div className="lg:col-span-9 space-y-6">
            {/* Conditional Display: If BYO-LLM selected vs Standard Endpoint */}
            {selectedEndpointId === "byo-llm" ? (
              /* DEDICATED INTERACTIVE BYO-LLM (BYOK) SECTION */
              <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-5 sm:p-7 shadow-xs overflow-hidden space-y-6">

                {/* Subtle Ambient Radial Glows */}
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-orange-200/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-emerald-200/25 blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-200/70">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-orange-600 text-white shadow-2xs">
                          <Zap className="h-3 w-3 fill-current" fill="currentColor" />
                          BYOK
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                          Bring Your Own LLM (BYOK)
                        </h2>
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                        Bypass community rate limits by attaching your own provider API credentials in standard request headers.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shrink-0 self-start sm:self-auto shadow-2xs">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Non-custodial: keys never stored</span>
                    </div>
                  </div>

                  {/* Step 1: Interactive Provider Selector (Same size cards with pixelated bg) */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      1. Select LLM Provider
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
                      {BYO_LLM_PROVIDERS.map((p) => {
                        const isSelected = byokProviderId === p.id;
                        const iconBg = getProviderDocIconBg(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setByokProviderId(p.id);
                              setByokModelOverride(p.model);
                            }}
                            className={`group text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-full min-h-[125px] w-full cursor-pointer ${
                              isSelected
                                ? "border-orange-500 bg-orange-50/85 shadow-md ring-2 ring-orange-400/40"
                                : "border-slate-200/90 bg-white/90 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${iconBg}`}>
                                  <ProviderDocIcon id={p.id} className="h-4 w-4" />
                                </div>
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-2xs">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-slate-300/80 group-hover:border-slate-400 transition-colors" />
                                )}
                              </div>
                              <div className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight leading-snug">
                                {p.name}
                              </div>
                            </div>

                            <div className="mt-3">
                              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${p.badgeClass}`}>
                                {p.badge}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                {/* Step 2: Custom Header Parameters Interactive Configuration */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      2. Configure Parameters ({currentByokProvider.name})
                    </h3>
                    {currentByokProvider.keyDocsUrl && (
                      <a
                        href={currentByokProvider.keyDocsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        <span>{currentByokProvider.keyLinkText || "Get API Key"}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Model Selector / Override with Radix UI Segregated Free & Paid Groups */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Model Identifier (X-LLM-Model)
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {currentByokProvider.name}
                        </span>
                      </div>
                      <Select
                        value={effectiveByokModel}
                        onValueChange={(val) => setByokModelOverride(val)}
                      >
                        <SelectTrigger className="w-full h-10 rounded-lg border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 shadow-2xs">
                          <SelectValue placeholder="Select available model..." />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[380px] max-w-[95vw] max-h-80">
                          {currentByokProvider.freeModels && currentByokProvider.freeModels.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50/80 rounded-md mx-1 mb-1 border border-emerald-100">
                                <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />
                                <span>{currentByokProvider.freeGroupLabel || "Free Tier Models"}</span>
                              </SelectLabel>
                              {currentByokProvider.freeModels.map((m) => (
                                <SelectItem
                                  key={m.id}
                                  value={m.id}
                                  badge={m.badge}
                                  badgeColor="bg-slate-50 text-slate-600 border-slate-200/80"
                                >
                                  {m.id}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}

                          {currentByokProvider.paidModels && currentByokProvider.paidModels.length > 0 && (
                            <>
                              {currentByokProvider.freeModels && currentByokProvider.freeModels.length > 0 && (
                                <SelectSeparator className="my-1" />
                              )}
                              <SelectGroup>
                                <SelectLabel className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100/80 rounded-md mx-1 mb-1 border border-slate-200/60">
                                  <Zap className="h-3 w-3 text-amber-600 shrink-0" />
                                  <span>{currentByokProvider.paidGroupLabel || "Paid / Standard Models"}</span>
                                </SelectLabel>
                                {currentByokProvider.paidModels.map((m) => (
                                  <SelectItem
                                    key={m.id}
                                    value={m.id}
                                    badge={m.badge}
                                    badgeColor="bg-slate-50 text-slate-600 border-slate-200/80"
                                  >
                                    {m.id}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* API Key Placeholder */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        API Key Header (X-LLM-Api-Key)
                      </label>
                      <input
                        type="text"
                        value={byokApiKeyInput}
                        onChange={(e) => setByokApiKeyInput(e.target.value)}
                        placeholder={currentByokProvider.keyPlaceholder}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  {byokProviderId === "custom" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Custom Base URL (X-LLM-Base-Url)
                      </label>
                      <input
                        type="text"
                        value={byokCustomBaseUrl}
                        onChange={(e) => setByokCustomBaseUrl(e.target.value)}
                        placeholder="http://localhost:11434/v1"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-orange-500"
                      />
                    </div>
                  )}

                  {/* Target Endpoint Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Target Endpoint To Generate
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "URL Check (/analyze/url)", path: "/analyze/url" },
                        { label: "Text Check (/analyze/text)", path: "/analyze/text" },
                        { label: "Screenshot (/analyze/image)", path: "/analyze/image" },
                        { label: "Chat (/chat)", path: "/chat" },
                      ].map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => setByokEndpointTarget(item.path)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            byokEndpointTarget === item.path
                              ? "bg-slate-900 text-white font-semibold shadow-xs"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100/80"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 3: Copyable Integration Code Snippet */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      3. Integration Code Sample (Live Preview)
                    </h3>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200/70">
                      {["curl", "python", "javascript"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveCodeTab(tab)}
                          className={`text-[11px] px-2.5 py-0.5 rounded font-medium transition-colors ${
                            activeCodeTab === tab
                              ? "bg-white text-slate-900 shadow-2xs font-semibold"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {tab === "curl" ? "cURL" : tab === "javascript" ? "JavaScript" : "Python"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative rounded-lg bg-slate-950 border border-slate-900 p-4 shadow-sm overflow-hidden">
                    <Tooltip content="Copy integration code snippet" position="left">
                      <button
                        onClick={() =>
                          copyToClipboard(generateByokSnippet(activeCodeTab), "byok_snippet")
                        }
                        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors z-10 cursor-pointer"
                        aria-label="Copy code"
                      >
                        {copiedId === "byok_snippet" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </Tooltip>
                    <div className="overflow-x-auto dark-scrollbar pr-6">
                      <HighlightedCode code={generateByokSnippet(activeCodeTab)} />
                    </div>
                  </div>
                </div>

                {/* Security and usage guarantee footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Non-custodial: credentials are transmitted purely in HTTPS headers and never stored.</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Bypasses shared community limits</span>
                </div>
              </div>
            </div>
          ) : (
              /* STANDARD ENDPOINT CARD */
              <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md uppercase tracking-wide text-white shadow-2xs ${
                        currentEndpoint.method === "POST"
                          ? "bg-emerald-600"
                          : "bg-blue-600"
                      }`}
                    >
                      {currentEndpoint.method}
                    </span>
                    <code className="text-sm font-mono font-semibold text-slate-800">
                      {effectiveBaseUrl}
                      {currentEndpoint.path}
                    </code>
                  </div>

                  <Tooltip content="Copy full endpoint path" position="left">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${effectiveBaseUrl}${currentEndpoint.path}`,
                          "endpoint_path"
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedId === "endpoint_path" ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Path</span>
                        </>
                      )}
                    </button>
                  </Tooltip>
                </div>

                <div className="mt-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    {currentEndpoint.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {currentEndpoint.description}
                  </p>
                </div>

                {/* Request Parameters Section */}
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Request Parameters & Headers
                  </h3>

                  {currentEndpoint.parameters.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200/80">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                          <tr>
                            <th className="py-2.5 px-3">Field</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Required</th>
                            <th className="py-2.5 px-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {currentEndpoint.parameters.map((param) => (
                            <tr key={param.name}>
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                                {param.name}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500">
                                {param.type}
                              </td>
                              <td className="py-2.5 px-3">
                                {param.required ? (
                                  <span className="font-semibold text-orange-600">Yes</span>
                                ) : (
                                  <span className="text-slate-400">Optional</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {param.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200/60 rounded-lg p-3">
                      No query or body parameters required.
                    </div>
                  )}
                </div>

                {/* Example Request with Multi-Color Syntax Highlighting */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Example Request
                    </h3>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200/70">
                      {["curl", "python", "javascript"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveCodeTab(tab)}
                          className={`text-[11px] px-2.5 py-0.5 rounded font-medium transition-colors ${
                            activeCodeTab === tab
                              ? "bg-white text-slate-900 shadow-2xs font-semibold"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {tab === "curl" ? "cURL" : tab === "javascript" ? "JavaScript" : "Python"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative rounded-lg bg-slate-950 border border-slate-900 p-4 shadow-sm overflow-hidden">
                    <Tooltip content="Copy request example code" position="left">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            currentEndpoint[activeCodeTab](effectiveBaseUrl),
                            "code_sample"
                          )
                        }
                        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors z-10 cursor-pointer"
                        aria-label="Copy code"
                      >
                        {copiedId === "code_sample" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </Tooltip>
                    <div className="overflow-x-auto dark-scrollbar pr-6">
                      <HighlightedCode
                        code={currentEndpoint[activeCodeTab](effectiveBaseUrl)}
                      />
                    </div>
                  </div>
                </div>

                {/* Response Payload with Multi-Color Token Syntax Highlighting */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Response Payload
                    </h3>
                    <div className="flex items-center gap-2">
                      <Tooltip content="Copy JSON response payload" position="top">
                        <button
                          onClick={() =>
                            copyToClipboard(
                              typeof currentEndpoint.responseBody === "string"
                                ? currentEndpoint.responseBody
                                : JSON.stringify(currentEndpoint.responseBody, null, 2),
                              "response_json"
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          aria-label="Copy JSON response"
                        >
                          {copiedId === "response_json" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedId === "response_json" ? "Copied" : "Copy JSON"}</span>
                        </button>
                      </Tooltip>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-600 text-white shadow-2xs">
                        200 OK
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-900 p-4 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto dark-scrollbar max-h-96">
                      <HighlightedJson data={currentEndpoint.responseBody} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Error Status Codes Table */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                HTTP Response Codes & Dynamic Rate Limiting
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                PH5 uses standard HTTP status codes to communicate outcome states. Dynamic cooldown headers (Retry-After) prevent crashes during traffic spikes.
              </p>

              <div className="overflow-hidden rounded-lg border border-slate-200/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-2.5 px-3 w-60 whitespace-nowrap">Status Code</th>
                      <th className="py-2.5 px-3">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {ERROR_CODES.map((err) => (
                      <tr key={err.code}>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-semibold border whitespace-nowrap shadow-2xs ${err.badgeClass}`}
                          >
                            {err.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                          {err.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Endpoints Drawer Overlay */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden"
            />

            {/* Slide-up Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] flex flex-col rounded-t-2xl bg-white border-t border-slate-200 shadow-2xl lg:hidden overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-orange-600" />
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    API Navigation
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(85vh-70px)]">
                {/* Mobile BYO-LLM option */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEndpointId("byo-llm");
                      setIsMobileDrawerOpen(false);
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    className={`w-full text-left rounded-xl px-3 py-2.5 text-xs flex items-center justify-between transition-colors ${
                      selectedEndpointId === "byo-llm"
                        ? "bg-[#E83C00] text-white font-semibold shadow-xs"
                        : "bg-orange-50/60 text-orange-950 border border-orange-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span className="font-bold">Bring Your Own LLM (BYOK)</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/20">
                      BYOK
                    </span>
                  </button>
                </div>

                <div>
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Core Endpoints
                  </div>
                  <div className="mt-1 space-y-1">
                    {ENDPOINTS.slice(0, 5).map((endpoint) => {
                      const isSelected = selectedEndpointId === endpoint.id;
                      return (
                        <button
                          key={endpoint.id}
                          onClick={() => {
                            setSelectedEndpointId(endpoint.id);
                            setIsMobileDrawerOpen(false);
                            window.scrollTo({ top: 120, behavior: "smooth" });
                          }}
                          className={`w-full text-left rounded-xl px-3 py-2.5 text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-slate-900 text-white font-semibold shadow-xs"
                              : "text-slate-700 hover:bg-slate-100/80 active:bg-slate-200"
                          }`}
                        >
                          <div className="flex flex-col min-w-0 mr-2">
                            <span className="font-medium truncate">{endpoint.title}</span>
                            <span className={`text-[11px] font-mono ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                              {endpoint.path}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold text-white tracking-wide shrink-0 shadow-2xs ${
                              endpoint.method === "POST"
                                ? "bg-emerald-600"
                                : "bg-blue-600"
                            }`}
                          >
                            {endpoint.method}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    System
                  </div>
                  <div className="mt-1 space-y-1">
                    {ENDPOINTS.slice(5).map((endpoint) => {
                      const isSelected = selectedEndpointId === endpoint.id;
                      return (
                        <button
                          key={endpoint.id}
                          onClick={() => {
                            setSelectedEndpointId(endpoint.id);
                            setIsMobileDrawerOpen(false);
                            window.scrollTo({ top: 120, behavior: "smooth" });
                          }}
                          className={`w-full text-left rounded-xl px-3 py-2.5 text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-slate-900 text-white font-semibold shadow-xs"
                              : "text-slate-700 hover:bg-slate-100/80 active:bg-slate-200"
                          }`}
                        >
                          <div className="flex flex-col min-w-0 mr-2">
                            <span className="font-medium truncate">{endpoint.title}</span>
                            <span className={`text-[11px] font-mono ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                              {endpoint.path}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold text-white tracking-wide shrink-0 shadow-2xs ${
                              endpoint.method === "POST"
                                ? "bg-emerald-600"
                                : "bg-blue-600"
                            }`}
                          >
                            {endpoint.method}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SiteFooter />
    </div>
  );
}
