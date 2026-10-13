import React from "react";
import { motion } from "framer-motion";
import Tooltip from "./ui/tooltip";
import {
  Zap,
  Layers,
  Scale,
  ExternalLink,
} from "lucide-react";

export default function ModelPillsSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="mt-12 text-center"
    >
      {/* Apple-style Section Header Badge */}
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-xl px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs">
        <span className="text-sm leading-none">🤗</span>
        <span>Hugging Face Model Hub &amp; Edge Engine</span>
      </div>

      <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mb-6 px-4 leading-relaxed">
        Pretrained checkpoints hosted on Hugging Face Hub, optimized with ONNX Runtime for ultra-low latency CPU execution.
      </p>

      {/* Apple-style Frosted Glass Pills Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-xs px-2 mb-6">
        {/* ONNX Engine Pill */}
        <Tooltip
          content="Hardware-accelerated edge engine running INT8 quantized tensors (<20ms latency)"
          position="top"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/80 backdrop-blur-xl px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-slate-700 shadow-2xs hover:border-emerald-300 hover:bg-white hover:shadow-xs transition-all cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-800">ONNX Runtime</span>
            <span className="text-slate-300">•</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 border border-emerald-200/70">
              INT8
            </span>
          </div>
        </Tooltip>

        {/* URL DistilBERT Hugging Face Pill */}
        <Tooltip
          content="Open xynaxdev/ph5-url-distilbert on Hugging Face (64.2 MB INT8 ONNX)"
          position="top"
        >
          <a
            href="https://huggingface.co/xynaxdev/ph5-url-distilbert"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 backdrop-blur-xl px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-slate-700 shadow-2xs hover:border-amber-400/90 hover:bg-white hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-sm leading-none">🤗</span>
            <span className="font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
              ph5-url-distilbert
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700 border border-amber-200/70">
              64MB
            </span>
            <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </a>
        </Tooltip>

        {/* Text BERT Hugging Face Pill */}
        <Tooltip
          content="Open xynaxdev/ph5-text-bert on Hugging Face (105.2 MB INT8 ONNX)"
          position="top"
        >
          <a
            href="https://huggingface.co/xynaxdev/ph5-text-bert"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 backdrop-blur-xl px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-slate-700 shadow-2xs hover:border-amber-400/90 hover:bg-white hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-sm leading-none">🤗</span>
            <span className="font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
              ph5-text-bert
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700 border border-amber-200/70">
              105MB
            </span>
            <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </a>
        </Tooltip>

        {/* Vision ResNet-50 Hugging Face Pill */}
        <Tooltip
          content="Open xynaxdev/ph5-image-resnet50 on Hugging Face (94.0 MB PyTorch)"
          position="top"
        >
          <a
            href="https://huggingface.co/xynaxdev/ph5-image-resnet50"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 backdrop-blur-xl px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-slate-700 shadow-2xs hover:border-amber-400/90 hover:bg-white hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-sm leading-none">🤗</span>
            <span className="font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
              ph5-image-resnet50
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600 border border-slate-200/70">
              PyTorch
            </span>
            <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </a>
        </Tooltip>

        {/* Taxonomy Tags */}
        <Tooltip content="Task: Multi-vector text and lexical threat classification" position="top">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/80 backdrop-blur-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-2xs hover:border-pink-300 hover:text-slate-800 hover:bg-white transition-all cursor-default">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
            <span>Text Classification</span>
          </div>
        </Tooltip>

        <Tooltip content="Architecture: Hugging Face Transformers with ONNX export" position="top">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/80 backdrop-blur-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-2xs hover:border-indigo-300 hover:text-slate-800 hover:bg-white transition-all cursor-default">
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            <span>Transformers</span>
          </div>
        </Tooltip>

        <Tooltip content="Permissive MIT open-source license for research and production" position="top">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/80 backdrop-blur-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-2xs hover:border-slate-300 hover:text-slate-800 hover:bg-white transition-all cursor-default">
            <Scale className="h-3.5 w-3.5 text-slate-400" />
            <span>MIT License</span>
          </div>
        </Tooltip>
      </div>

      {/* Edge Notice Section: Pill in Middle Above, Text Below */}
      <div className="mt-4 max-w-2xl mx-auto px-4 text-center flex flex-col items-center">
        {/* Centered Edge Notice Pill in Middle Above */}
        <div className="mb-2">
          <Tooltip
            content="Dynamic INT8 quantization reduces container memory from >530 MB to ~35 MB on edge instances"
            position="top"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/90 px-3 py-1 font-semibold text-xs text-amber-800 shadow-2xs hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer">
              <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-400/40" />
              <span>Edge Notice</span>
            </div>
          </Tooltip>
        </div>

        {/* Notice Text Below in Middle */}
        <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed max-w-xl mx-auto">
          Serving quantized{" "}
          <span className="font-semibold text-slate-800 bg-amber-50/90 px-1.5 py-0.5 rounded-md border border-amber-200/70 text-amber-900">
            INT8 ONNX
          </span>{" "}
          for edge latency{" "}
          <code className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
            &lt;20ms
          </code>
          . Benchmark concordance matches FP32 weights with{" "}
          <code className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
            &gt;99.9%
          </code>{" "}
          accuracy.
        </p>
      </div>
    </motion.section>
  );
}
