import React, { useRef, useState } from "react";
import { Download, Share2, Sparkles, Trophy, Shield, Zap, Check, Eye } from "lucide-react";
import * as htmlToImage from "html-to-image";

export interface FUTCardData {
  name: string;
  category: string;
  position?: string;
  jerseyNumber?: number | string;
  photoUrl?: string;
  rating?: number;
  stats?: {
    pac: number; // Pace / السرعة
    sho: number; // Shooting / التسديد
    pas: number; // Passing / التمرير
    dri: number; // Dribbling / المراوغة
    def: number; // Defending / الدفاع
    phy: number; // Physical / اللياقة والقوة
  };
  preferredFoot?: string;
  teamName?: string;
  academyName?: string;
  academyLogo?: string;
}

interface FUTPlayerCardProps {
  player: FUTCardData;
  cardTheme?: "gold" | "future" | "totw";
  showActions?: boolean;
}

export function FUTPlayerCard({
  player,
  cardTheme: initialTheme = "gold",
  showActions = true,
}: FUTPlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"gold" | "future" | "totw">(initialTheme);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Derive stats if not provided
  const position = player.position || "FWD";
  const stats = player.stats || {
    pac: 84,
    sho: 82,
    pas: 79,
    dri: 85,
    def: 62,
    phy: 78,
  };

  const calculatedOvr =
    player.rating ||
    Math.round(
      (stats.pac + stats.sho + stats.pas + stats.dri + stats.def + stats.phy) / 6
    );

  // Themes styling
  const themes = {
    gold: {
      name: "ذهب نادر (Gold Rare)",
      cardBg:
        "bg-gradient-to-b from-[#f9df7b] via-[#d4af37] to-[#aa7c11] text-[#2b1f00]",
      border: "border-[#ffe58f]",
      overlay: "from-amber-400/20 via-transparent to-amber-950/40",
      accent: "#785303",
      glow: "shadow-[0_0_35px_rgba(212,175,55,0.45)]",
      badgeBg: "bg-[#2b1f00] text-[#f9df7b]",
      statLabel: "text-[#4a3600]",
      statVal: "text-[#1d1300]",
      separator: "border-[#785303]/30",
    },
    future: {
      name: "نجوم المستقبل (Future Star)",
      cardBg:
        "bg-gradient-to-b from-[#ec4899] via-[#8b5cf6] to-[#3b82f6] text-white",
      border: "border-fuchsia-300",
      overlay: "from-cyan-400/20 via-transparent to-purple-950/50",
      accent: "#a855f7",
      glow: "shadow-[0_0_35px_rgba(236,72,153,0.45)]",
      badgeBg: "bg-zinc-950 text-cyan-300",
      statLabel: "text-zinc-200",
      statVal: "text-white",
      separator: "border-white/30",
    },
    totw: {
      name: "نخبة الأسبوع (TOTW Black)",
      cardBg:
        "bg-gradient-to-b from-[#222222] via-[#141414] to-[#0a0a0a] text-[#f1c40f]",
      border: "border-amber-400/70",
      overlay: "from-amber-500/10 via-transparent to-black/80",
      accent: "#f59e0b",
      glow: "shadow-[0_0_35px_rgba(245,158,11,0.35)]",
      badgeBg: "bg-amber-400 text-black",
      statLabel: "text-zinc-400",
      statVal: "text-amber-300",
      separator: "border-amber-500/30",
    },
  };

  const currentStyle = themes[theme];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `EA_FC_Card_${player.name.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate card image:", err);
      alert("حدث خطأ أثناء تحميل صورة البطاقة. يرجى المحاولة مجدداً.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🌟 بطاقة نجم الأكاديمية: *${player.name}*\n🏆 التقييم العام (OVR): *${calculatedOvr}*\n⚽ الفئة: *${player.category}*\n📊 الإحصائيات: PAC: ${stats.pac} | SHO: ${stats.sho} | PAS: ${stats.pas} | DRI: ${stats.dri} | DEF: ${stats.def} | PHY: ${stats.phy}\n\n📍 أكاديمية أجيال وادي العثمانية (AGOA)`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center gap-5 select-none" dir="ltr">
      {/* Theme Switcher Pills */}
      {showActions && (
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-2xl shadow-lg">
          {(["gold", "future", "totw"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all font-tajawal ${
                theme === t
                  ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {themes[t].name}
            </button>
          ))}
        </div>
      )}

      {/* The FIFA / EA FC Card Container */}
      <div
        ref={cardRef}
        className={`relative w-[310px] h-[460px] rounded-[32px] p-3.5 border-2 ${currentStyle.border} ${currentStyle.cardBg} ${currentStyle.glow} overflow-hidden transition-all duration-300`}
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 100% 88%, 85% 100%, 15% 100%, 0 88%)",
        }}
      >
        {/* Subtle geometric pattern overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${currentStyle.overlay} pointer-events-none`}
        />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Top Header Row: Rating & Pos on Left, Photo & Club on Right */}
        <div className="relative z-10 flex justify-between items-start pt-3 px-3">
          {/* Left Column: Overall, Position, Flag, Academy */}
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black tracking-tighter leading-none drop-shadow-md">
              {calculatedOvr}
            </span>
            <span className="text-xl font-black uppercase tracking-wider mt-1 drop-shadow-sm">
              {position}
            </span>

            {/* Separator Line */}
            <div
              className={`w-8 h-[2px] ${currentStyle.separator} my-2 border-t`}
            />

            {/* Algerian Flag */}
            <div className="w-8 h-5 rounded overflow-hidden shadow-md border border-black/20 flex mb-2" title="الجزائر">
              <div className="w-1/2 h-full bg-[#006633] flex items-center justify-end">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 -mr-1" />
              </div>
              <div className="w-1/2 h-full bg-white flex items-center justify-start">
                <div className="w-2 h-2 text-red-600 text-[10px] leading-none -ml-0.5 font-black">★</div>
              </div>
            </div>

            {/* Academy Shield / Logo */}
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm bg-black/20 p-0.5 border border-white/20 flex items-center justify-center">
              {player.academyLogo ? (
                <img
                  src={player.academyLogo}
                  alt="Academy"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Shield className="w-5 h-5 text-amber-300" />
              )}
            </div>
          </div>

          {/* Player Photo Cutout */}
          <div className="relative -mr-2 w-48 h-56 flex items-end justify-center overflow-hidden">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top drop-shadow-2xl scale-105"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-36 h-48 rounded-2xl bg-black/20 border border-white/20 flex flex-col items-center justify-center text-center p-3">
                <Trophy className="w-16 h-16 opacity-40 mb-2" />
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {player.category}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Player Name Banner */}
        <div className="relative z-10 text-center mt-1 px-2">
          <div
            className={`w-full py-1.5 border-y ${currentStyle.separator} backdrop-blur-sm`}
          >
            <h3
              className="text-lg font-black uppercase tracking-wider truncate font-tajawal drop-shadow-sm"
              dir="auto"
            >
              {player.name}
            </h3>
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-80">
              {player.academyName || "AGOA ACADEMY"} • {player.category}
            </p>
          </div>
        </div>

        {/* The 6 Iconic FIFA Stats Grid */}
        <div className="relative z-10 px-4 pt-3.5 pb-2">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-center">
            {/* Column 1: PAC, SHO, PAS */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-black text-lg ${currentStyle.statVal}`}>
                  {stats.pac}
                </span>
                <span className={`font-black text-xs uppercase tracking-wider ${currentStyle.statLabel}`}>
                  PAC
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`font-black text-lg ${currentStyle.statVal}`}>
                  {stats.sho}
                </span>
                <span className={`font-black text-xs uppercase tracking-wider ${currentStyle.statLabel}`}>
                  SHO
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`font-black text-lg ${currentStyle.statVal}`}>
                  {stats.pas}
                </span>
                <span className={`font-black text-xs uppercase tracking-wider ${currentStyle.statLabel}`}>
                  PAS
                </span>
              </div>
            </div>

            {/* Column 2: DRI, DEF, PHY */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-black text-lg ${currentStyle.statVal}`}>
                  {stats.dri}
                </span>
                <span className={`font-black text-xs uppercase tracking-wider ${currentStyle.statLabel}`}>
                  DRI
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`font-black text-lg ${currentStyle.statVal}`}>
                  {stats.def}
                </span>
                <span className={`font-black text-xs uppercase tracking-wider ${currentStyle.statLabel}`}>
                  DEF
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`font-black text-lg ${currentStyle.statVal}`}>
                  {stats.phy}
                </span>
                <span className={`font-black text-xs uppercase tracking-wider ${currentStyle.statLabel}`}>
                  PHY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sparkle Emblem */}
        <div className="relative z-10 flex justify-center items-center pb-2">
          <div className="flex items-center gap-1.5 opacity-60">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black tracking-widest uppercase">
              ELITE TALENT PASSPORT
            </span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Action Buttons: Download PNG & Share to WhatsApp */}
      {showActions && (
        <div className="flex items-center gap-3 w-full max-w-[310px]" dir="rtl">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black h-11 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs font-tajawal transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "جاري الحفظ..." : "تحميل كصورة (PNG)"}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold h-11 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 text-xs font-tajawal transition-all active:scale-95"
            title="مشاركة عبر واتساب"
          >
            <Share2 className="w-4 h-4" />
            واتساب
          </button>
        </div>
      )}
    </div>
  );
}

