import { motion } from "framer-motion";

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

      {/* Hugging Face Hub Models & ONNX Edge Runtime Chips */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.25 }}
        className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>ONNX INT8 Edge Engine</span>
        </span>

        <a
          href="https://huggingface.co/xynaxdev/ph5-url-distilbert"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 px-2.5 py-1 text-amber-900 transition-colors"
          title="DistilBERT URL Model on Hugging Face"
        >
          <span>🤗</span>
          <span className="font-semibold">URL DistilBERT</span>
          <span className="text-[10px] text-amber-700 font-mono">64MB ONNX</span>
        </a>

        <a
          href="https://huggingface.co/xynaxdev/ph5-text-bert"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 px-2.5 py-1 text-amber-900 transition-colors"
          title="BERT Text Model on Hugging Face"
        >
          <span>🤗</span>
          <span className="font-semibold">Text BERT</span>
          <span className="text-[10px] text-amber-700 font-mono">105MB ONNX</span>
        </a>

        <a
          href="https://huggingface.co/xynaxdev/ph5-image-resnet50"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 px-2.5 py-1 text-amber-900 transition-colors"
          title="ResNet-50 Vision Model on Hugging Face"
        >
          <span>🤗</span>
          <span className="font-semibold">Vision ResNet-50</span>
        </a>
      </motion.div>

      {/* Note about quantized ONNX edge inference */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28, duration: 0.25 }}
        className="mt-2 text-[11px] text-slate-400 max-w-xl mx-auto"
      >
        Note: Production API serves quantized INT8 ONNX models for ultra-low latency (&lt;20ms). Output probabilities may vary slightly from unquantized FP32 research weights while maintaining &gt;99.9% benchmark fidelity.
      </motion.p>
    </section>
  );
}
