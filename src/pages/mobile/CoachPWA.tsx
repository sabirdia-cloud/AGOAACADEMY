import React, { useState, useEffect } from "react";
import { CoachPlayerApp } from "./CoachPlayerApp";
import { pwaService } from "@/services/pwa";
import { Download, Share2, PlusSquare, X, RefreshCw, Smartphone, ShieldCheck } from "lucide-react";

export function CoachPWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Dynamic Head configuration for AGOA Coach PWA
    document.title = "AGOA Coach - أكاديمية أجيال وادي العثمانية";

    // Switch manifest to coach-specific manifest
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.href = "/manifest-coach.json";
    } else {
      manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      manifestLink.href = "/manifest-coach.json";
      document.head.appendChild(manifestLink);
    }

    // Switch apple touch icon
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleIcon) {
      appleIcon.href = "/icons/apple-touch-icon.png";
    }

    // 2. Standalone detection
    const standalone = pwaService.isStandalone();
    setIsStandalone(standalone);

    // 3. Listen for Android install prompt
    if (pwaService.getInstallPrompt()) {
      setCanInstall(true);
    }
    const handleCanInstall = () => setCanInstall(true);
    window.addEventListener("agoa-pwa-can-install", handleCanInstall);

    // 4. Listen for PWA updates
    const handleUpdate = () => setHasUpdate(true);
    window.addEventListener("agoa-pwa-update-available", handleUpdate);

    return () => {
      window.removeEventListener("agoa-pwa-can-install", handleCanInstall);
      window.removeEventListener("agoa-pwa-update-available", handleUpdate);
    };
  }, []);

  const handleInstallClick = async () => {
    if (pwaService.isIOS()) {
      setShowIosGuide(true);
    } else {
      const accepted = await pwaService.promptInstall();
      if (accepted) setCanInstall(false);
    }
  };

  const reloadApp = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });
    }
    window.location.reload();
  };

  return (
    <div className="relative w-full min-h-screen bg-[#060810] text-zinc-100 font-tajawal antialiased">
      {/* ─── Top Update Notification Bar ─── */}
      {hasUpdate && (
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg text-sm font-semibold animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin" />
            <span>يتوفر تحديث جديد لتطبيق المدربين!</span>
          </div>
          <button
            onClick={reloadApp}
            className="px-3 py-1 bg-white text-emerald-800 rounded-lg text-xs font-bold shadow hover:bg-zinc-100 transition"
          >
            تحديث الآن
          </button>
        </div>
      )}

      {/* ─── Install Prompt Header (Visible if not standalone) ─── */}
      {!isStandalone && (canInstall || pwaService.isIOS()) && (
        <div className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-3.5 py-2 flex items-center justify-between text-xs z-40">
          <div className="flex items-center gap-2">
            <img src="/icons/coach-icon-192.png" alt="AGOA" className="w-6 h-6 rounded-md shadow" />
            <span className="text-zinc-300 font-medium">تثبيت AGOA Coach على الشاشة الرئيسية</span>
          </div>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-md shadow-sm transition"
          >
            <Download size={13} />
            <span>تثبيت التطبيق</span>
          </button>
        </div>
      )}

      {/* ─── iOS Step-by-Step Install Modal ─── */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 left-4 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img src="/icons/coach-icon-192.png" alt="AGOA Logo" className="w-12 h-12 rounded-xl shadow border border-amber-500/30" />
              <div>
                <h3 className="font-bold text-white text-base">تثبيت تطبيق AGOA Coach</h3>
                <p className="text-zinc-400 text-xs">لهواتف iPhone و iPad</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-300 mb-5">
              <div className="flex items-start gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/40">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                <div>
                  اضغط على زر <strong className="text-white">المشاركة</strong> في أسفل متصفح Safari <Share2 size={16} className="inline text-blue-400 mx-1" />
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/40">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                <div>
                  مرر للأسفل واختر <strong className="text-white">إضافة إلى الصفحة الرئيسية</strong> <PlusSquare size={16} className="inline text-emerald-400 mx-1" />
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/40">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                <div>
                  اضغط على <strong className="text-white">إضافة (Add)</strong> بالأعلى ليظهر التطبيق بشعار الأكاديمية على شاشتك.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-center text-sm transition"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Coach Mobile Application ─── */}
      <CoachPlayerApp />
    </div>
  );
}
