import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Github,
  Instagram,
  Linkedin,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import LegalModal from "./LegalModal";

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [initialLegalTab, setInitialLegalTab] = useState("privacy");

  const openLegal = (tab) => {
    setInitialLegalTab(tab);
    setLegalModalOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <footer className="border-t border-slate-200/80 bg-slate-50/80 text-slate-600">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-slate-200">
            {/* Brand Column - Big Monogram Logo */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo.png"
                  alt="PH5 Logo"
                  className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
                />
                <div>
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    PH5
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                    Multimodal Phishing Defense
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
                Next-generation threat detection engine. Detects credential harvesting, deceptive links, and social engineering coercion across text, URLs, and image screenshots with hybrid AI inference.
              </p>
            </div>

            {/* Navigation Column 1: Detection Modes */}
            <div className="md:col-span-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Detection Suite
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#modes"
                    onClick={scrollToTop}
                    className="text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    Text & Message Scanner
                  </a>
                </li>
                <li>
                  <a
                    href="#modes"
                    onClick={scrollToTop}
                    className="text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    URL Threat Classification
                  </a>
                </li>
                <li>
                  <a
                    href="#modes"
                    onClick={scrollToTop}
                    className="text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    Screenshot & Vision OCR
                  </a>
                </li>
                <li>
                  <a
                    href="#modes"
                    onClick={scrollToTop}
                    className="text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    Multimodal Late Fusion
                  </a>
                </li>
                <li>
                  <a
                    href="#modes"
                    onClick={scrollToTop}
                    className="text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    Interactive Security Chat
                  </a>
                </li>
              </ul>
            </div>

            {/* Navigation Column 2: Developers & Resources */}
            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Developers
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/docs"
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    <span>REST API Docs</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/XynaxDev/multimodal-phishing-detector"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    <span>GitHub Repo</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="/api/v1/health"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    Health Probes
                  </a>
                </li>
                <li>
                  <a
                    href="/api/v1/status"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    System Diagnostics
                  </a>
                </li>
              </ul>
            </div>

            {/* Navigation Column 3: Trust & Legal */}
            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Compliance
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal("privacy")}
                    className="text-slate-600 hover:text-orange-600 transition-colors text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal("terms")}
                    className="text-slate-600 hover:text-orange-600 transition-colors text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <a
                    href="https://github.com/XynaxDev/multimodal-phishing-detector/blob/main/LICENSE"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    MIT License
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Socials */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © {year} <span className="font-semibold text-slate-700">PH5</span>. Built for precision cybersecurity defense.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://github.com/XynaxDev"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com/xynaxhere"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-pink-600 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/in/akass7"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={initialLegalTab}
      />
    </>
  );
}
