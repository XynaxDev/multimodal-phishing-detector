import React from "react";
import { motion } from "framer-motion";
import Tooltip from "./ui/tooltip";
import {
  Zap,
  Shield,
  Layers,
  Globe,
  Scale,
  Sparkles,
  ExternalLink,
  Cpu,
  FileText,
  Lock,
} from "lucide-react";

export default function PremiumHero() {
  return (
    <section className="mx-auto mt-10 w-full max-w-3xl px-4 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-4xl font-black tracking-tight text-black sm:text-5xl md:text-6xl"
      >
        Detect Phishing Across{" "}
        <span className="text-orange-500">Text, URLs, and Images</span>.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.25 }}
        className="mt-3 text-sm text-gray-600 md:text-base max-w-2xl mx-auto"
      >
        Analyze suspicious messages, links, and screenshots using multimodal deep learning and AI reasoning to verify threats in real time.
      </motion.p>

      {/* Hugging Face Developer Tag Bar Style */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.25 }}
        className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs"
      >
        {/* ONNX Engine Tag */}
        <Tooltip
          content="Hardware-accelerated edge inference engine utilizing CPU-quantized INT8 tensors"
          position="top"
        >
          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-[#0B0F19] px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-300 shadow-2xs hover:border-slate-700 hover:text-white transition-colors cursor-default">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-semibold">ONNX Runtime</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono text-[10px]">INT8</span>
          </div>
        </Tooltip>

        {/* URL DistilBERT Hugging Face Tag */}
        <Tooltip
          content="Open xynaxdev/ph5-url-distilbert on Hugging Face (64.2 MB INT8 ONNX checkpoint)"
          position="top"
        >
          <a
            href="https://huggingface.co/xynaxdev/ph5-url-distilbert"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-[#0B0F19] px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-300 shadow-2xs hover:border-amber-500/60 hover:text-white hover:bg-slate-900 transition-all cursor-pointer group"
          >
            <span className="text-xs">🤗</span>
            <span className="text-amber-400 font-medium">ph5-url-distilbert</span>
            <span className="rounded bg-slate-800/80 px-1 py-0.2 font-mono text-[9px] text-amber-300 border border-slate-700/60">
              64MB
            </span>
            <ExternalLink className="h-2.5 w-2.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </a>
        </Tooltip>

        {/* Text BERT Hugging Face Tag */}
        <Tooltip
          content="Open xynaxdev/ph5-text-bert on Hugging Face (105.2 MB INT8 ONNX checkpoint)"
          position="top"
        >
          <a
            href="https://huggingface.co/xynaxdev/ph5-text-bert"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-[#0B0F19] px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-300 shadow-2xs hover:border-amber-500/60 hover:text-white hover:bg-slate-900 transition-all cursor-pointer group"
          >
            <span className="text-xs">🤗</span>
            <span className="text-amber-400 font-medium">ph5-text-bert</span>
            <span className="rounded bg-slate-800/80 px-1 py-0.2 font-mono text-[9px] text-amber-300 border border-slate-700/60">
              105MB
            </span>
            <ExternalLink className="h-2.5 w-2.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </a>
        </Tooltip>

        {/* Vision ResNet-50 Hugging Face Tag */}
        <Tooltip
          content="Open xynaxdev/ph5-image-resnet50 on Hugging Face (94.0 MB PyTorch checkpoint)"
          position="top"
        >
          <a
            href="https://huggingface.co/xynaxdev/ph5-image-resnet50"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-[#0B0F19] px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-300 shadow-2xs hover:border-amber-500/60 hover:text-white hover:bg-slate-900 transition-all cursor-pointer group"
          >
            <span className="text-xs">🤗</span>
            <span className="text-amber-400 font-medium">ph5-image-resnet50</span>
            <span className="rounded bg-slate-800/80 px-1 py-0.2 font-mono text-[9px] text-slate-400 border border-slate-700/60">
              PyTorch
            </span>
            <ExternalLink className="h-2.5 w-2.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </a>
        </Tooltip>

        {/* Hugging Face Taxonomy Tags */}
        <Tooltip content="Domain Task: Multi-vector text and lexical threat classification" position="top">
          <div className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-[#0B0F19] px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-default">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
            <span>Text Classification</span>
          </div>
        </Tooltip>

        <Tooltip content="Hugging Face Transformers architecture with PyTorch / ONNX graph export" position="top">
          <div className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-[#0B0F19] px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-default">
            <Layers className="h-3 w-3 text-yellow-500" />
            <span>Transformers</span>
          </div>
        </Tooltip>

        <Tooltip content="Permissive open-source license for academic, research, and production use" position="top">
          <div className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-[#0B0F19] px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-default">
            <Scale className="h-3 w-3 text-slate-400" />
            <span>MIT License</span>
          </div>
        </Tooltip>
      </motion.div>

      {/* Enhanced Note Pill with Highlighted Text Decor & Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.25 }}
        className="mt-3.5 mx-auto max-w-2xl"
      >
        <Tooltip
          content="Dynamic 8-bit integer quantization preserves transformer attention weights while reducing container memory from >530 MB to ~35 MB on cloud edge instances."
          position="bottom"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-orange-200/90 bg-orange-50/80 hover:bg-orange-100/90 px-3.5 py-1.5 text-[11px] sm:text-xs text-slate-700 shadow-2xs transition-all cursor-default">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white flex-shrink-0 shadow-2xs">
              <Zap className="h-2.5 w-2.5" />
            </span>
            <span className="font-semibold text-orange-950">Edge Notice:</span>
            <span className="text-slate-600">
              Serving quantized <span className="font-semibold text-orange-700">INT8 ONNX</span> for edge latency (
              <code className="rounded bg-white/90 px-1 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-orange-800 border border-orange-300/80 shadow-2xs">
                &lt;20ms
              </code>
              ). Benchmark concordance matches FP32 weights with{" "}
              <code className="rounded bg-emerald-50 px-1 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-emerald-800 border border-emerald-300/80 shadow-2xs">
                &gt;99.9%
              </code>{" "}
              accuracy.
            </span>
          </div>
        </Tooltip>
      </motion.div>
    </section>
  );
}
