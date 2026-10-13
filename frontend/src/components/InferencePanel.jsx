import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import SendMatrixIcon from "./ui/SendMatrixIcon"
import Tooltip from "./ui/tooltip"
import { cn } from "../lib/utils"
import {
  ShieldCheck,
  AlertTriangle,
  Check,
  Copy,
  Sparkles,
  FileText,
  Link2,
  MessageCircle,
  Bot,
  Clock,
  Loader2,
  ChevronDown,
  Key,
  RefreshCw,
  Cpu,
  CheckCircle2,
  Zap,
} from "lucide-react"

// Keep all the existing functions and constants from the original file
const MODE_LABELS = {
  text: "Text Message",
  url: "URL",
  image: "Image",
  fusion: "Multimodal"
}

const MODE_ICONS = {
  text: <FileText className="h-4 w-4" />,
  url: <Link2 className="h-4 w-4" />,
  image: <ShieldCheck className="h-4 w-4" />,
  fusion: <Sparkles className="h-4 w-4" />
}

// Helper functions - define before components that use them
const getClasses = (mode) => {
  if (mode === "url") return ["benign", "phishing", "malware"]
  return ["benign", "phishing"]
}

const getDisplayName = (className) => {
  return className.charAt(0).toUpperCase() + className.slice(1)
}

const getConfidenceColor = (className) => {
  switch (className.toLowerCase()) {
    case "phishing":
      return "bg-red-500"
    case "benign":
      return "bg-emerald-500"
    case "malware":
      return "bg-purple-500"
    default:
      return "bg-gray-500"
  }
}

// Dynamic loading text based on mode and intent
const getLoadingText = (mode, data) => {
  // For chat mode, check the intent from data
  if (mode === "chat" && data && data.intent) {
    switch (data.intent) {
      case "url_check":
        return "Scanning URL"
      case "text_message":
        return "Scanning Text"
      case "image_check":
        return "Scanning Image"
      case "combined":
        return "Scanning Multimodal"
      case "chat":
        return "Processing Chat"
      default:
        return "Scanning Content"
    }
  }
  
  // For regular tabs
  switch (mode) {
    case "text":
      return "Scanning Text"
    case "url":
      return "Scanning URL"
    case "image":
      return "Scanning Image"
    case "fusion":
      return "Scanning Multimodal"
    case "chat":
      return "Processing Chat"
    default:
      return "Scanning Content"
  }
}

// Get classes based on mode or intent
const getClassesForData = (mode, data) => {
  // Check if it's URL mode (either from mode prop or from intent/data)
  if (mode === "url" || data?.mode === "url" || data?.intent === "url_check") {
    return ["benign", "phishing", "malware"]
  }
  return ["benign", "phishing"]
}

const LoadingSpinner = () => {
  return (
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="h-10 w-10 rounded-full border-2 border-muted border-t-orange-500"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="h-3 w-3 rounded-full bg-orange-500" />
      </motion.div>
    </div>
  )
}

// Confidence bar component
const ConfidenceBar = ({
  className,
  value,
  index,
}) => {
  const percentage = (value * 100).toFixed(1)
  const displayName = getDisplayName(className)
  const barColor = getConfidenceColor(className)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{displayName}</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.08 + 0.2 }}
          className="font-semibold tabular-nums"
        >
          {percentage}%
        </motion.span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
          className={cn("h-full rounded-full", barColor)}
        />
      </div>
    </motion.div>
  )
}

function TimeElapsed({ startTime }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startTime || startTime <= 0) return
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime)
    }, 100)
    return () => clearInterval(interval)
  }, [startTime])

  const seconds = (elapsed / 1000).toFixed(1)

  return <span className="tabular-nums text-muted-foreground">{seconds}s</span>
}

export default function InferencePanel({ data, loading, mode, onClear, cooldownSeconds = 0, onOpenLlmSettings, onRetry }) {
  const [copied, setCopied] = useState(false)
  const [isJsonOpen, setIsJsonOpen] = useState(false)
  const [processingTime, setProcessingTime] = useState(null)
  const loadingStartRef = useRef(null)
  const [toast, setToast] = useState(null)
  const isChatMode = mode === "chat"

  // Custom toast function
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      showToast("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      showToast("Failed to copy", 'error')
    }
  }

  const handleCopyOCR = async () => {
    try {
      await navigator.clipboard.writeText(data.ocr)
      showToast("OCR text copied!")
    } catch (err) {
      showToast("Failed to copy OCR", 'error')
    }
  }

  const handleClearResults = () => {
    if (onClear) {
      onClear()
      showToast("Results cleared!")
    } else {
      showToast("Clear function not available", 'error')
    }
  }

  // Helper functions (keeping these from original)
  const getVerdictConfig = (label) => {
    const normalizedLabel = label?.toLowerCase()
    if (normalizedLabel === 'phishing') {
      return {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800/50",
        iconBg: "bg-red-100 dark:bg-red-900/50",
        text: "text-red-600 dark:text-red-400",
        badge: "bg-red-500 text-white",
        label: "Phishing Detected"
      }
    }
    if (normalizedLabel === 'malware') {
      return {
        bg: "bg-purple-50 dark:bg-purple-950/30",
        border: "border-purple-200 dark:border-purple-800/50",
        iconBg: "bg-purple-100 dark:bg-purple-900/50",
        text: "text-purple-600 dark:text-purple-400",
        badge: "bg-purple-500 text-white",
        label: "Malware Detected"
      }
    }
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800/50",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      text: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-500 text-white",
      label: "Benign Content"
    }
  }

  const getVerdictIcon = (label) => {
    const normalizedLabel = label?.toLowerCase()
    if (normalizedLabel === 'phishing') return <AlertTriangle className="h-4 w-4" />
    if (normalizedLabel === 'malware') return <AlertTriangle className="h-4 w-4" />
    return <ShieldCheck className="h-4 w-4" />
  }

  const getClasses = (mode) => {
    if (mode === "url") return ["benign", "phishing", "malware"]
    return ["benign", "phishing"]
  }

  const getDisplayName = (className) => {
    return className.charAt(0).toUpperCase() + className.slice(1)
  }

  const getClassColor = (className) => {
    const normalizedClass = className.toLowerCase()
    if (normalizedClass === "phishing") return "bg-red-100 text-red-700 border-red-200"
    if (normalizedClass === "malware") return "bg-purple-100 text-purple-700 border-purple-200"
    return "bg-emerald-100 text-emerald-700 border-emerald-200"
  }

  const getProgressColor = (className) => {
    const normalizedClass = className.toLowerCase()
    if (normalizedClass === "phishing") return "bg-red-500"
    if (normalizedClass === "malware") return "bg-purple-500"
    return "bg-emerald-500"
  }

  const getConfidenceColor = (className) => {
    switch (className.toLowerCase()) {
      case "phishing":
        return "bg-red-500"
      case "benign":
        return "bg-emerald-500"
      case "malware":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const cleanMarkdown = (text) => {
    if (!text) return ""
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^\s*[-*+]\s+/gm, "• ")
      .replace(/^\s*\d+\.\s+/gm, "• ")
      .replace(/^\s*#{1,6}\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  }

  // Track processing time
  useEffect(() => {
    if (loading && !loadingStartRef.current) {
      loadingStartRef.current = Date.now()
    } else if (!loading && loadingStartRef.current && data) {
      const time = Date.now() - loadingStartRef.current
      setProcessingTime(time)
      loadingStartRef.current = null
    }
  }, [loading, data])

  // Keep processing time updated while loading
  useEffect(() => {
    if (loading && loadingStartRef.current) {
      const interval = setInterval(() => {
        setProcessingTime(Date.now() - loadingStartRef.current)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [loading])

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-5 flex items-center gap-2 text-sm font-medium text-foreground"
            >
              {MODE_ICONS[mode]}
              <span>{getLoadingText(mode, data)}</span>
            </motion.div>
            {(loadingStartRef.current) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {loadingStartRef.current && <TimeElapsed startTime={loadingStartRef.current} />}
                </div>
                {processingTime > 5000 && (
                  <span className="text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-medium shadow-2xs">
                    Waking up cloud container on Render...
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // Empty state
  if (!data) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="rounded-2xl border border-dashed bg-card p-6">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            Detection Results
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex items-center flex-wrap gap-1">
            <span>Paste a suspicious message, URL, or upload an image above, then hit</span>
            <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#E83C00] px-1.5 py-0.5 text-white text-xs font-semibold shadow-2xs mx-1">
              <SendMatrixIcon className="w-3 h-3 text-white" />
              <span>Send</span>
            </span>
            <span>to see the detection results here.</span>
          </p>
          <div className="mt-4 space-y-2">
            {[
              { icon: ShieldCheck, text: "Classification with confidence scores" },
              { icon: Sparkles, text: "AI-powered explanation" },
              { icon: FileText, text: "Raw JSON for debugging" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <item.icon className="h-3.5 w-3.5 text-orange-500/70" />
                {item.text}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  const isError = Boolean(data.error)

  if (isChatMode && !isError && data.reply && !data.probs) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-orange-500" />
              Chat Response
            </h2>
            <div className="flex items-center gap-3">
              {processingTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {(processingTime / 1000).toFixed(2)}s
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Copy className="h-3.5 w-3.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanMarkdown(data.reply)}</p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Dynamic Provider Rate Limit Cooldown State
  if (data?.isRateLimit || data?.status === 429 || (isError && typeof data?.error === "string" && data.error.toLowerCase().includes("rate limit"))) {
    const totalDuration = data?.cooldownSeconds || 20;
    const progressPercent = Math.max(5, Math.min(100, (cooldownSeconds / totalDuration) * 100));

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 shrink-0">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-slate-900">
                    Community Free-Tier Cooldown
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white shadow-2xs">
                    {cooldownSeconds > 0 ? `${cooldownSeconds}s remaining` : "Cooldown active"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                  {data.detail || "Provider rate limit reached. The system is cooling down smoothly according to provider response headers."}
                </p>
              </div>
            </div>
            {onClear && (
              <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs text-slate-400 hover:text-slate-700">
                Dismiss
              </Button>
            )}
          </div>

          {/* Animated Countdown Progress Bar */}
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-amber-200/60 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.9, ease: "linear" }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Dynamic provider backoff</span>
              <span className="font-semibold text-amber-800">{cooldownSeconds}s</span>
            </div>
          </div>

          {/* Zero-Charge BYOK Solution Callout */}
          <div className="mt-5 rounded-xl border border-amber-200/80 bg-white/90 p-4 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-0.5">
                  Want unlimited queries without community wait times?
                </p>
                <p>
                  Bring your own free API key (Groq, Google Gemini free tier with 15 RPM / 1M TPM, OpenAI, or OpenRouter).
                  PH5 is <strong>100% free</strong> and non-custodial — we never store or charge for your API keys.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {onOpenLlmSettings && (
                    <Button
                      size="sm"
                      onClick={onOpenLlmSettings}
                      className="bg-[#E83C00] hover:bg-[#d03600] text-white text-xs font-semibold h-7 px-3 shadow-2xs cursor-pointer"
                    >
                      <Key className="h-3 w-3 mr-1" />
                      Configure Your Free Key
                    </Button>
                  )}
                  <Link
                    to="/docs"
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1 rounded-md hover:bg-slate-50 transition-colors h-7 shadow-2xs"
                  >
                    <span>View API Docs</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (isError) {
    const rawErrorStr = typeof data?.error === "string" ? data.error : "";
    const isTimeout = Boolean(
      data?.isTimeout ||
      rawErrorStr.toLowerCase().includes("timeout") ||
      rawErrorStr.toLowerCase().includes("waking up")
    );
    const isNetworkError = Boolean(
      data?.isNetworkError ||
      rawErrorStr.includes("512MB") ||
      rawErrorStr.toLowerCase().includes("network error") ||
      rawErrorStr.toLowerCase().includes("memory cap")
    );

    const title = isTimeout
      ? "Cloud Server Waking Up"
      : isNetworkError
      ? "Cloud Service Auto-Recovering"
      : "Analysis Failed";

    const badgeText = isTimeout
      ? "Render Cold Start"
      : isNetworkError
      ? "512MB RAM Limit"
      : "Error";

    const displayMessage =
      rawErrorStr && rawErrorStr.toLowerCase() !== "network error"
        ? rawErrorStr
        : isNetworkError
        ? "The free-tier cloud host (Render 512MB RAM cap) hit a momentary memory limit while processing this high-res mobile photo. The container auto-recovers in ~5–10 seconds."
        : "An unexpected error occurred during analysis. Please try again.";

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xs backdrop-blur-sm transition-all ${
            isNetworkError || isTimeout
              ? "border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-orange-50/30 to-white text-slate-800"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                  isNetworkError || isTimeout
                    ? "bg-amber-100 text-amber-700 border border-amber-300/60"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {isTimeout ? (
                  <Clock className="h-4 w-4" />
                ) : isNetworkError ? (
                  <Cpu className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
                  {title}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    isNetworkError || isTimeout
                      ? "bg-amber-100/90 text-amber-800 border-amber-200"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {badgeText}
                </span>
              </div>
            </div>

            {onRetry && (
              <Button
                size="sm"
                onClick={onRetry}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-semibold h-8 px-3.5 rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Analysis</span>
              </Button>
            )}
          </div>

          {/* Description */}
          <p
            className={`mt-3 text-xs sm:text-sm leading-relaxed ${
              isNetworkError || isTimeout ? "text-slate-700" : "text-destructive/80"
            }`}
          >
            {displayMessage}
          </p>

          {/* Feature Badges & Tip */}
          {(isNetworkError || isTimeout) && (
            <div className="mt-4 pt-3.5 border-t border-amber-200/60 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="flex items-start gap-1.5 rounded-lg bg-white/70 p-2 border border-amber-200/50">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Client-side optimization:</strong> Images are automatically scaled in your browser before upload to prevent memory spikes.
                  </span>
                </div>
                <div className="flex items-start gap-1.5 rounded-lg bg-white/70 p-2 border border-amber-200/50">
                  <Zap className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Auto-recovery:</strong> Cloud containers reboot automatically within 5–10 seconds. Click <em>Retry Analysis</em> to proceed.
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                💡 <span className="font-semibold text-slate-600">Tip:</span> Direct camera photos (12MP–48MP) are automatically compressed. Screenshots of suspicious emails or messages work with near-zero latency!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Custom Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border",
            toast.type === 'error' 
              ? "bg-red-50 border-red-200 text-red-700" 
              : "bg-green-50 border-green-200 text-green-700"
          )}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="rounded-2xl border bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {isChatMode ? (
                <MessageCircle className="h-4 w-4 text-orange-500" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-orange-500" />
              )}
              {isChatMode ? "Analysis Result" : "Detection Result"}
              {data.intent && (
                <span className="ml-1 text-xs font-normal px-2 py-1 border rounded-md bg-gray-50">
                  {data.intent.replace("_", " ")}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              {processingTime && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {(processingTime / 1000).toFixed(2)}s
                </motion.span>
              )}
              <div className="flex items-center gap-2">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-8 px-3 text-xs font-medium bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                  onClick={handleClearResults}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Results
                </Button>
                <Tooltip content="Copy response JSON" position="top">
                  <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={handleCopy}>
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        </motion.div>
                      ) : (
                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Copy className="h-3.5 w-3.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Verdict Section */}
            {data.label && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("rounded-xl p-4 border flex items-center gap-3", getVerdictConfig(data.label).bg, getVerdictConfig(data.label).border)}
              >
                <div className={cn("p-2.5 rounded-full", getVerdictConfig(data.label).iconBg)}>
                  <span className={getVerdictConfig(data.label).text}>{getVerdictIcon(data.label)}</span>
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium border-0", getVerdictConfig(data.label).badge)}>
                  {getVerdictConfig(data.label).label}
                </span>
              </motion.div>
            )}

            {/* Confidence Scores */}
            {data.probs && (
              <div className="rounded-xl border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Confidence Analysis
                </h3>
                <div className="space-y-3">
                  {getClassesForData(mode, data).map((className, index) => (
                    <ConfidenceBar
                      key={className}
                      className={className}
                      value={data.probs[className] || 0}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            {data.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 p-4"
              >
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Analysis
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200/80 leading-relaxed whitespace-pre-wrap">
                  {cleanMarkdown(data.explanation)}
                </p>
              </motion.div>
            )}

            {/* OCR Text */}
            {data.ocr && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    Extracted Text (OCR)
                  </h3>
                  <Tooltip content="Copy extracted OCR text" position="left">
                    <Button variant="ghost" size="sm" className="h-7 w-7 cursor-pointer" onClick={handleCopyOCR}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {data.ocr}
                </p>
              </motion.div>
            )}

            {/* Analyzed URL */}
            {data.url && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border bg-muted/20 p-4"
              >
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-orange-500" />
                  Analyzed URL
                </h3>
                <p className="text-sm text-muted-foreground break-all font-mono">{data.url}</p>
              </motion.div>
            )}

            {/* Raw JSON Collapsible */}
            <div>
              <button
                onClick={() => setIsJsonOpen(!isJsonOpen)}
                className={cn(
                  "w-full flex items-center justify-between py-3 px-4 rounded-xl border bg-muted/20",
                  "hover:bg-muted/40 transition-colors text-sm font-medium",
                )}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  View Raw Response
                </span>
                <motion.div animate={{ rotate: isJsonOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>
              {isJsonOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 rounded-xl border bg-muted/10 p-4 relative"
                >
                  <Tooltip content="Copy raw response JSON" position="left">
                    <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 cursor-pointer" onClick={handleCopy}>
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </Tooltip>
                  <pre className="max-h-56 overflow-auto text-xs leading-relaxed font-mono pr-10 text-muted-foreground">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
