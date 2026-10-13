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
  const [mode, setMode] = useState("text");
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isLlmModalOpen, setIsLlmModalOpen] = useState(false);
  const [customLlmConfig, setCustomLlmConfig] = useState(getCustomLLMConfig());

  // Dynamic countdown timer when provider cooldown is active
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          // Cooldown finished: clear rate limit status so user can retry immediately
          setResult((r) => (r?.isRateLimit ? null : r));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  async function run() {
    if (cooldownSeconds > 0) return;
    setIsLoading(true);
    setResult(null);

    try {
      let response;
      if (mode === "urls") {
        response = await urlCheck(query);
      } else if (mode === "images") {
        if (!file) {
          alert("Upload image first!");
          setIsLoading(false);
          return;
        }
        response = await imageCheckFile(file);
      } else if (mode === "chat") {
        response = await chatMultipart(query, file);
      } else if (mode === "script") {
        response = await textCheck(query);
      } else {
        response = await textCheck(query);
      }

      console.log("API Response:", response);
      console.log("Response Data:", response.data);
      setResult(response.data);
    } catch (err) {
      console.error("API Error:", err);
      const rateLimit = parseRateLimitError(err);
      if (rateLimit) {
        setCooldownSeconds(rateLimit.cooldownSeconds);
        setResult(rateLimit);
      } else {
        const errData = err?.response?.data;
        const msg =
          typeof errData?.detail === "string"
            ? errData.detail
            : typeof errData?.error === "string"
            ? errData.error
            : err.message;
        setResult({ error: msg });
      }
    } finally {
      setIsLoading(false);
    }
  }

  const clearResults = () => {
    setResult(null);
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
                data={result}
                loading={isLoading}
                mode={mode}
                onClear={clearResults}
                cooldownSeconds={cooldownSeconds}
                onOpenLlmSettings={() => setIsLlmModalOpen(true)}
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
