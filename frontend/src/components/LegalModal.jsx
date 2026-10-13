import React, { useState } from "react";
import { X, Shield, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

export default function LegalModal({ isOpen, onClose, initialTab = "privacy" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("privacy")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "privacy"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-orange-600" />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "terms"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>Terms of Service</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto dark-scrollbar space-y-5 text-sm text-slate-600 leading-relaxed">
          {activeTab === "privacy" ? (
            <>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Privacy Policy
                </h3>
                <p className="text-xs text-slate-400">
                  Last updated: October 2026 • PH5 Security Protocol
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Zero Data Retention Policy</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Your submitted message text, URLs, and screenshot uploads are processed strictly in volatile memory (RAM) for real-time model inference. We do not store, archive, or resell your inspected data.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>In-Memory Image & OCR Processing</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Uploaded screenshots are inspected using ResNet-50 and optional OCR text extraction in memory. Files are instantly discarded after inference is computed.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Private LLM Guardrails</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    User explanations are generated via an isolated Groq LLM inference layer constrained strictly to model probability outputs, with no cross-user data retention or AI training on your inputs.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Terms of Service
                </h3>
                <p className="text-xs text-slate-400">
                  Last updated: October 2026 • Open Research Edition
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Intended Cybersecurity Use</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    PH5 is provided for defensive cybersecurity analysis, incident triage, and educational safety research. You agree not to use the service for reverse-engineering malicious payloads.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Probabilistic Advisory Disclaimer</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    While our models maintain high accuracy across BERT, DistilBERT, and ResNet-50, machine learning predictions are probabilistic risk estimates. PH5 is designed as an advisory tool and does not replace human verification on sensitive financial operations.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Fair Usage & Availability</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Automated abusive traffic, denial-of-service attempts, and adversarial model extraction attacks are prohibited. Standard rate limiting applies to public endpoints.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end">
          <Button
            size="sm"
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-4 cursor-pointer"
          >
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
}
