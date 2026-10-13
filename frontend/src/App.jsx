import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import AnnouncementBanner from "./components/AnnouncementBanner";
import PremiumHero from "./components/PremiumHero";
import PremiumSearchBar from "./components/PremiumSearchBar";
import InferencePanel from "./components/InferencePanel";
import FaqSection from "./components/FaqSection";
import SiteFooter from "./components/SiteFooter";
import LlmSettingsModal from "./components/LlmSettingsModal";
import {
  textCheck,
  urlCheck,
  imageCheckFile,
  chatMultipart,
  parseRateLimitError,
  getCustomLLMConfig,
} from "./api";
import DocsPage from "./pages/DocsPage";
import NotFoundPage from "./pages/NotFoundPage";

// Home Page Component
function HomePage() {
  const [mode, setMode] = useState("emails");
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);
  const [resultsByMode, setResultsByMode] = useState({
    sms: null,
    emails: null,
    urls: null,
    script: null,
    images: null,
    chat: null,
    text: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isLlmModalOpen, setIsLlmModalOpen] = useState(false);
  const [customLlmConfig, setCustomLlmConfig] = useState(getCustomLLMConfig());

  // Active result strictly isolated to the currently selected mode
  const activeResult = resultsByMode[mode] || null;

  // Dynamic countdown timer when provider cooldown is active
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          // Cooldown finished: clear rate limit status across modes so user can retry immediately
          setResultsByMode((prevResults) => {
            const next = { ...prevResults };
            for (const m of Object.keys(next)) {
              if (next[m]?.isRateLimit) next[m] = null;
            }
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Proactive background ping to wake up free-tier cloud container on page load
  useEffect(() => {
    fetch("/api/v1/health").catch(() => {});
  }, []);

  async function run() {
    if (cooldownSeconds > 0) return;
    const currentMode = mode;
    setIsLoading(true);
    setResultsByMode((prev) => ({ ...prev, [currentMode]: null }));

    try {
      let response;
      if (currentMode === "urls") {
        response = await urlCheck(query);
      } else if (currentMode === "images") {
        if (!file) {
          alert("Upload image first!");
          setIsLoading(false);
          return;
        }
        response = await imageCheckFile(file);
      } else if (currentMode === "chat") {
        response = await chatMultipart(query, file);
      } else if (currentMode === "script") {
        response = await textCheck(query);
      } else {
        response = await textCheck(query);
      }

      console.log("API Response:", response);
      console.log("Response Data:", response.data);
      setResultsByMode((prev) => ({ ...prev, [currentMode]: response.data }));
    } catch (err) {
      console.error("API Error:", err);
      const rateLimit = parseRateLimitError(err);
      if (rateLimit) {
        setCooldownSeconds(rateLimit.cooldownSeconds);
        setResultsByMode((prev) => ({ ...prev, [currentMode]: rateLimit }));
      } else {
        const errData = err?.response?.data;
        let msg =
          typeof errData?.detail === "string"
            ? errData.detail
            : typeof errData?.error === "string"
            ? errData.error
            : err.message;
        const status = err?.response?.status;
        const isGatewayError = status === 502 || status === 503 || status === 504;
        const isTimeout =
          err.code === "ECONNABORTED" ||
          (typeof msg === "string" && msg.toLowerCase().includes("timeout"));
        const isNetworkError =
          err.code === "ERR_NETWORK" ||
          err.message === "Network Error" ||
          isGatewayError ||
          (!err.response && Boolean(err.request));

        if (isTimeout) {
          msg =
            "Backend was waking up from free-tier sleep (Render cold start). The service is now warm! Click Retry to get results in <400ms.";
        } else if (isNetworkError) {
          msg =
            "The free-tier cloud host (Render 512MB RAM cap) hit a momentary memory limit while processing this image and is auto-recovering (~5-10s). Images are automatically optimized before upload. Click Retry Analysis below!";
        }
        setResultsByMode((prev) => ({
          ...prev,
          [currentMode]: { error: msg, isTimeout, isNetworkError },
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }

  const clearResults = () => {
    setResultsByMode((prev) => ({ ...prev, [mode]: null }));
    setQuery("");
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="relative z-10 flex min-h-screen flex-col">
        <NavBar onOpenLlmSettings={() => setIsLlmModalOpen(true)} customLlmConfig={customLlmConfig} />

        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-16 pt-8 md:pb-20">
            <AnnouncementBanner onOpenLlmSettings={() => setIsLlmModalOpen(true)} />
            <PremiumHero />

            <section id="modes" className="mt-6">
              <PremiumSearchBar
                baseQuery={query}
                setBaseQuery={setQuery}
                mode={mode}
                setMode={setMode}
                baseFile={file}
                setBaseFile={setFile}
                run={run}
                loading={isLoading}
                onClearResults={clearResults}
                cooldownSeconds={cooldownSeconds}
                onOpenLlmSettings={() => setIsLlmModalOpen(true)}
                customLlmConfig={customLlmConfig}
              />
            </section>

            <section className="mt-10">
              <InferencePanel
                data={activeResult}
                loading={isLoading}
                mode={mode}
                onClear={clearResults}
                cooldownSeconds={cooldownSeconds}
                onOpenLlmSettings={() => setIsLlmModalOpen(true)}
                onRetry={run}
              />
            </section>

            <FaqSection />
          </div>
        </main>

        <SiteFooter />

        {/* Bring Your Own LLM (BYOK) Modal */}
        <LlmSettingsModal
          isOpen={isLlmModalOpen}
          onClose={() => setIsLlmModalOpen(false)}
          onConfigSaved={() => setCustomLlmConfig(getCustomLLMConfig())}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
