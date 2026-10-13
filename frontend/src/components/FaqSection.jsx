import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, Shield, Zap, Globe, Brain, Lock, Sparkles, ArrowRight } from "lucide-react";
import SendMatrixIcon from "./ui/SendMatrixIcon";
import ModelPillsSection from "./ModelPillsSection";

const faqs = [
  {
    q: "What types of content can PH5 analyze?",
    a: "PH5 can analyze text messages, emails, URLs, chat conversations, and screenshots of potential phishing content. Simply upload an image or paste raw text to get an instant verdict with confidence scores.",
  },
  {
    q: "How accurate is PH5's phishing detection?",
    a: "PH5 uses advanced multimodal AI models trained on millions of phishing examples. Our system achieves over 95% accuracy in detecting sophisticated phishing attempts, with real-time analysis and confidence scoring.",
  },
  {
    q: "Does PH5 store my data or protect my privacy?",
    a: "Your privacy is our priority. All content is processed in-memory for inference only and is never persisted to databases or shared with third parties. We don't store or analyze your personal data.",
  },
  {
    q: "Can I integrate PH5 into my own application?",
    a: "Yes! PH5 provides a comprehensive REST API that you can integrate into your applications. The same backend endpoints powering this UI are available for developers to build custom solutions.",
  },
  {
    q: "What makes PH5 different from other phishing detectors?",
    a: "PH5 uses multimodal AI analysis, combining text, image, and URL analysis in real-time. Unlike traditional tools that check single data types, PH5 provides comprehensive detection across all communication channels.",
  },
  {
    q: "Is PH5 suitable for enterprise use?",
    a: "Absolutely. PH5 is designed for both individual users and enterprise deployments. We offer scalable solutions with batch processing, API access, and customizable detection parameters for business needs.",
  },
];

const features = [
  {
    id: "ai-powered",
    icon: <Brain className="h-5 w-5 sm:h-6 sm:w-6" />,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning models for intelligent phishing detection",
    tag: "Deep Learning",
    colorFamily: "purple",
    iconBox: "bg-purple-100 text-purple-600",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    selectedBg: "bg-purple-50/95",
    selectedBorder: "border-purple-400",
    selectedRing: "ring-1 ring-purple-300",
    selectedShadow: "shadow-purple-100/60",
    hoverBg: "hover:bg-purple-50/60 hover:border-purple-300",
  },
  {
    id: "real-time",
    icon: <Zap className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />,
    title: "Real-Time Results",
    description: "Get instant analysis with sub-second response times",
    tag: "< 500ms",
    colorFamily: "orange",
    iconBox: "bg-orange-100 text-orange-600",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    selectedBg: "bg-orange-50/95",
    selectedBorder: "border-orange-400",
    selectedRing: "ring-1 ring-orange-300",
    selectedShadow: "shadow-orange-100/60",
    hoverBg: "hover:bg-orange-50/60 hover:border-orange-300",
  },
  {
    id: "multimodal",
    icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6" />,
    title: "Multimodal Detection",
    description: "Analyze text, images, URLs, and chat simultaneously",
    tag: "Vision + Text",
    colorFamily: "sky",
    iconBox: "bg-sky-100 text-sky-600",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    selectedBg: "bg-sky-50/95",
    selectedBorder: "border-sky-400",
    selectedRing: "ring-1 ring-sky-300",
    selectedShadow: "shadow-sky-100/60",
    hoverBg: "hover:bg-sky-50/60 hover:border-sky-300",
  },
  {
    id: "privacy",
    icon: <Lock className="h-5 w-5 sm:h-6 sm:w-6" />,
    title: "Privacy First",
    description: "Your data is processed in-memory with zero storage",
    tag: "Zero Storage",
    colorFamily: "emerald",
    iconBox: "bg-emerald-100 text-emerald-600",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    selectedBg: "bg-emerald-50/95",
    selectedBorder: "border-emerald-400",
    selectedRing: "ring-1 ring-emerald-300",
    selectedShadow: "shadow-emerald-100/60",
    hoverBg: "hover:bg-emerald-50/60 hover:border-emerald-300",
  },
  {
    id: "global",
    icon: <Globe className="h-5 w-5 sm:h-6 sm:w-6" />,
    title: "Global Coverage",
    description: "Detect phishing attempts in multiple languages and formats",
    tag: "Multilingual",
    colorFamily: "indigo",
    iconBox: "bg-indigo-100 text-indigo-600",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    selectedBg: "bg-indigo-50/95",
    selectedBorder: "border-indigo-400",
    selectedRing: "ring-1 ring-indigo-300",
    selectedShadow: "shadow-indigo-100/60",
    hoverBg: "hover:bg-indigo-50/60 hover:border-indigo-300",
  },
  {
    id: "scoring",
    icon: <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />,
    title: "Smart Scoring",
    description: "Confidence scores and detailed threat analysis",
    tag: "Explainable",
    colorFamily: "rose",
    iconBox: "bg-rose-100 text-rose-600",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    selectedBg: "bg-rose-50/95",
    selectedBorder: "border-rose-400",
    selectedRing: "ring-1 ring-rose-300",
    selectedShadow: "shadow-rose-100/60",
    hoverBg: "hover:bg-rose-50/60 hover:border-rose-300",
  },
];

function FeaturesSection() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <section className="relative mt-20">
      {/* Ambient Gradient Glows */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-orange-300 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-300 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 inline-flex items-center justify-center flex-wrap">
            <span>Why Choose</span>
            <img
              src="/logo.png"
              alt="PH5"
              className="inline-block h-[1.15em] w-auto object-contain align-middle -mt-1 mx-2"
            />
            <span>?</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto px-4">
            Experience the future of phishing detection with our cutting-edge multimodal AI technology
          </p>
        </motion.div>

        {/* Uniform Equal-Sized Feature Cards with Distinct Color Families */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
          {features.map((feature, index) => {
            const isSelected = selectedIndex === index;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                viewport={{ once: true }}
                onClick={() => setSelectedIndex(index)}
                className={`relative h-[210px] w-full flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden select-none ${
                  isSelected
                    ? `${feature.selectedBg} ${feature.selectedBorder} ${feature.selectedRing} shadow-md ${feature.selectedShadow} scale-[1.01]`
                    : `border-slate-200/90 bg-white/90 text-slate-700 ${feature.hoverBg} hover:shadow-sm`
                }`}
              >

                {/* Top Row: Icon + Badge */}
                <div className="relative z-10 flex items-center justify-between gap-2 w-full">
                  <div
                    className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-transform duration-200 ${
                      isSelected ? `${feature.iconBox} shadow-xs scale-105` : `${feature.iconBox}`
                    }`}
                  >
                    {feature.icon}
                  </div>

                  <span
                    className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wide ${
                      isSelected ? feature.badge : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {feature.tag}
                  </span>
                </div>

                {/* Middle: Title & Description */}
                <div className="relative z-10 flex-1 flex flex-col justify-center my-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-snug">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Row: Active Indicator */}
                <div className="relative z-10 pt-2 border-t border-slate-100/90 flex items-center justify-between text-[11px]">
                  <span className={`font-semibold ${isSelected ? "text-slate-800" : "text-slate-400"}`}>
                    {isSelected ? "Active Feature" : "Click to view"}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      isSelected ? "bg-slate-800 scale-125" : "bg-slate-300"
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Open Source Model Hub & Edge Architecture Section (Apple Style) */}
        <ModelPillsSection />
      </div>
    </section>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      <FeaturesSection />
      
      <section className="relative mt-20 mb-12">
        {/* Background Graphics */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-orange-400 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-orange-300 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Frequently Asked <span className="text-orange-500">Questions</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 px-4">
              Everything you need to know about PH5's phishing detection capabilities
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={item.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  viewport={{ once: true }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full text-left group"
                  >
                    <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 bg-white hover:border-orange-200 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between gap-2 sm:gap-4">
                        <p className="font-semibold text-slate-900 text-sm sm:text-base pr-2">{item.q}</p>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-200 transition-colors"
                        >
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        </motion.div>
                      </div>
                      
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ 
                          height: isOpen ? "auto" : 0, 
                          opacity: isOpen ? 1 : 0 
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 sm:pt-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3 sm:mt-4">
                          {item.a}
                        </p>
                      </motion.div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-sm sm:text-base text-slate-600 mb-4">Still have questions?</p>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base group"
            >
              <span>Visit Documentation</span>
              <SendMatrixIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
