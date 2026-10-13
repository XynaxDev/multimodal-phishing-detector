import React from "react";
import { motion } from "framer-motion";

export default function PremiumHero() {
  return (
    <section className="mx-auto mt-6 sm:mt-10 w-full max-w-3xl px-4 text-center">
      {/* Sleek Apple-style Hero Top Pill */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 transition-all cursor-default"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-slate-800">Multimodal Edge AI</span>
        <span className="text-slate-300">•</span>
        <span className="text-orange-600 font-bold">Production v2.0</span>
      </motion.div>

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
    </section>
  );
}
