import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { api, supabase } from "@/services/api";
import jsQR from "jsqr";
import {
  Users, Search, Phone, Mail, Award, Shield, Star, Activity, Heart,
  User, ChevronRight, Edit3, CreditCard, X, Check, Loader2,
  LogOut, Home, UserCheck, AlertCircle, ChevronLeft, Lock,
  Calendar, CheckSquare, XSquare, MinusSquare, BarChart2,
  Clock, Target, Zap, TrendingUp, Bell, BookOpen, Dumbbell,
  ClipboardCheck, Play, ChevronDown, ChevronUp, QrCode, Camera,
  Trophy, Swords, FileText, Stethoscope, Plus, Save, Trash2,
  LayoutDashboard, MapPin, CheckCircle, XCircle, RefreshCw,
  Menu, ArrowLeft, Flashlight, Send, Sparkles
} from "lucide-react";
import { FUTPlayerCard } from "@/components/FUTPlayerCard";

// ─── Google Font ───────────────────────────────────────────────────────────────
const FONT_LINK = `@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');`;

// ─── Types ────────────────────────────────────────────────────────────────────
type View =
  | "login" | "dashboard" | "players" | "player_detail"
  | "attendance" | "training" | "notebook" | "matches"
  | "performance" | "physical" | "medical" | "evaluations"
  | "leaderboard" | "profile";

// ─── Colors & Config ──────────────────────────────────────────────────────────
const C = {
  bg: "#060810",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  green: "#10b981",
  greenDark: "#059669",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#ef4444",
  text: "#f3f4f6",
  muted: "#6b7280",
  dim: "#374151",
};

const POS_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  "حارس مرمى": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "حارس مرمى", emoji: "🧤" },
  "مدافع": { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "مدافع", emoji: "🛡️" },
  "وسط": { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", label: "وسط", emoji: "⚡" },
  "مهاجم": { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "مهاجم", emoji: "⚽" },
  "جناح": { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "جناح", emoji: "💨" },
};
const getPosConfig = (pos: string) =>
  POS_CONFIG[pos] ?? { color: "#71717a", bg: "rgba(113,113,122,0.12)", label: pos || "لاعب", emoji: "⚽" };

const statusColors: Record<string, string> = {
  active: "#10b981", inactive: "#6b7280", suspended: "#ef4444", injured: "#f59e0b"
};
const statusLabel: Record<string, string> = {
  active: "نشط", inactive: "غير نشط", suspended: "موقوف", injured: "مصاب"
};

const getAge = (dob: string) => {
  if (!dob) return "—";
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
};

const fmt = (d: string) => d ? new Date(d).toLocaleDateString("ar-DZ") : "—";

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    ${FONT_LINK}
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body { background: ${C.bg}; font-family: 'Tajawal', sans-serif; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    input, select, textarea { font-family: 'Tajawal', sans-serif !important; }
    input::placeholder { color: ${C.muted}; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.5; } }
    @keyframes pulseBorder { 0%,100%{ box-shadow:0 0 0 0 rgba(16,185,129,0.4); } 50%{ box-shadow:0 0 0 8px rgba(16,185,129,0); } }
    @keyframes scanLine {
      0% { top: 10%; }
      50% { top: 85%; }
      100% { top: 10%; }
    }
    @keyframes ripple {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    .fade-in { animation: fadeIn 0.25s ease; }
    .slide-up { animation: slideUp 0.3s ease; }
    .spin { animation: spin 1s linear infinite; }
    .pulse-border { animation: pulseBorder 1.5s ease infinite; }
    .btn-press:active { transform: scale(0.96); }
    .scroll-hide { scrollbar-width: none; -ms-overflow-style: none; }
    .scroll-hide::-webkit-scrollbar { display: none; }
  `}</style>
);

// ─── Reusable Components ──────────────────────────────────────────────────────
function Card({ children, style, className }: any) {
  return (
    <div className={className} style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 18, ...style
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <h3 style={{ color: C.text, fontSize: 14, fontWeight: 800 }}>{children}</h3>
      {action}
    </div>
  );
}

function StatBadge({ label, value, color, icon }: any) {
  return (
    <div style={{ flex: 1, background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
      {icon && <div style={{ color, marginBottom: 4, display: "flex", justifyContent: "center" }}>{icon}</div>}
      <p style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>{value ?? "—"}</p>
      <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, marginTop: 2 }}>{label}</p>
    </div>
  );
}

function InfoRow({ label, value, icon, color = C.muted }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 13, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{label}</p>
        <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{value || "—"}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 0", color: C.muted }}>
      <div style={{ opacity: 0.4, marginBottom: 12, display: "flex", justifyContent: "center" }}>{icon}</div>
      <p style={{ fontSize: 14 }}>{text}</p>
    </div>
  );
}

function PageHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  return (
    <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}`, background: "rgba(6,8,16,0.98)", position: "sticky", top: 57, zIndex: 40 }}>
      {onBack && (
        <button onClick={onBack} className="btn-press" style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 14px", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <ChevronRight size={15} /> رجوع
        </button>
      )}
      <h2 style={{ color: "#fff", fontSize: 19, fontWeight: 900 }}>{title}</h2>
      {subtitle && <p style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{subtitle}</p>}
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("أدخل اسم المستخدم وكلمة المرور"); return; }
    setIsLoading(true); setError("");
    try {
      const user = await api.login(username, password);
      if (user && (user.role === "coach" || user.role === "admin")) {
        localStorage.setItem("coach_mobile_user", JSON.stringify(user));
        onLogin(user);
      } else if (user) {
        setError("هذا التطبيق مخصص للمدربين فقط.");
      } else {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    } catch {
      setError("حدث خطأ في الاتصال، تحقق من الإنترنت");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh", background: `radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(99,102,241,0.1) 0%, transparent 60%), ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, direction: "rtl", position: "relative", overflow: "hidden"
    }}>
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: -100, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 36 }} className="fade-in">
        <div style={{
          width: 90, height: 90, borderRadius: 28, margin: "0 auto 18px",
          background: "linear-gradient(135deg,#059669,#10b981,#34d399)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 1px rgba(16,185,129,0.25), 0 20px 60px rgba(16,185,129,0.35)",
          fontSize: 40, position: "relative"
        }}>
          ⚽
          <div style={{ position: "absolute", bottom: -6, right: -6, width: 26, height: 26, borderRadius: 9, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
            <User size={13} color="#fff" />
          </div>
        </div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px" }}>بوابة المدرب</h1>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>أكاديمية أجيال وادي العثمانية</p>
        <div style={{ width: 40, height: 3, borderRadius: 2, background: "linear-gradient(to left,#059669,#6366f1)", margin: "10px auto 0" }} />
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.04)",
        borderRadius: 28, border: `1px solid rgba(255,255,255,0.08)`,
        padding: "32px 24px", backdropFilter: "blur(30px)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)"
      }} className="fade-in">
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Username */}
          <div>
            <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 8, letterSpacing: 0.5 }}>اسم المستخدم</label>
            <div style={{ position: "relative" }}>
              <User size={15} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: C.dim }} />
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "13px 42px 13px 14px", color: "#fff", fontSize: 14, outline: "none" }}
                onFocus={e => e.target.style.borderColor = "rgba(16,185,129,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
              />
            </div>
          </div>
          {/* Password */}
          <div>
            <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 8, letterSpacing: 0.5 }}>كلمة المرور</label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: C.dim }} />
              <input
                type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "13px 42px 13px 60px", color: "#fff", fontSize: 14, outline: "none" }}
                onFocus={e => e.target.style.borderColor = "rgba(16,185,129,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: C.muted, cursor: "pointer", fontSize: 10, padding: "4px 8px" }}>
                {showPass ? "إخفاء" : "عرض"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={14} color="#f87171" />
              <span style={{ color: "#fca5a5", fontSize: 12 }}>{error}</span>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-press"
            style={{
              background: isLoading ? "rgba(16,185,129,0.4)" : "linear-gradient(135deg,#059669,#10b981)",
              border: "none", borderRadius: 16, padding: 16, color: "#fff", fontSize: 15, fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
              boxShadow: isLoading ? "none" : "0 8px 24px rgba(16,185,129,0.35)",
              transition: "all 0.2s"
            }}>
            {isLoading ? <Loader2 size={18} className="spin" /> : <ChevronLeft size={18} />}
            {isLoading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
      <p style={{ color: "#1f2937", fontSize: 11, marginTop: 20 }}>Coach Portal v3.0 • AGOA Academy</p>
    </div>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
function DashboardScreen({ user, players, trainings, coachData, selectedTeam, coachTeams = [], onSelectTeam, onNavigate }: any) {
  const activePlayers = players.filter((p: any) => p.status === "active" || !p.status);
  const injuredPlayers = players.filter((p: any) => p.status === "injured");
  const today = new Date();
  const upcoming = trainings
    .filter((t: any) => new Date(t.date) >= today)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const lastTraining = trainings
    .filter((t: any) => new Date(t.date) < today)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const quickActions = [
    { icon: <QrCode size={20} color={C.green} />, label: "تسجيل الحضور بـ QR", sub: "مسح رمز اللاعبين", view: "attendance" as View, color: C.green },
    { icon: <Users size={20} color={C.purple} />, label: "لاعبي", sub: `${players.length} لاعب مسجل`, view: "players" as View, color: C.purple },
    { icon: <Calendar size={20} color={C.blue} />, label: "برنامج التدريبات", sub: upcoming ? `التدريب: ${fmt(upcoming.date)}` : "لا يوجد تدريب قادم", view: "training" as View, color: C.blue },
    { icon: <BookOpen size={20} color={C.amber} />, label: "الدفتر البيداغوجي", sub: "ملاحظات وتقارير اللاعبين", view: "notebook" as View, color: C.amber },
    { icon: <Swords size={20} color="#e11d48" />, label: "مركز المنافسات", sub: "المباريات والنتائج", view: "matches" as View, color: "#e11d48" },
    { icon: <BarChart2 size={20} color={C.purple} />, label: "تحليل الأداء", sub: "إحصائيات اللاعبين", view: "performance" as View, color: C.purple },
    { icon: <Dumbbell size={20} color={C.amber} />, label: "القياسات البدنية", sub: "الطول والوزن والسرعة", view: "physical" as View, color: C.amber },
    { icon: <Stethoscope size={20} color="#f43f5e" />, label: "المتابعة الطبية", sub: "الإصابات والعلاج", view: "medical" as View, color: "#f43f5e" },
    { icon: <Star size={20} color={C.amber} />, label: "تقييمات اللاعبين", sub: "تقييم المهارات", view: "evaluations" as View, color: C.amber },
    { icon: <Trophy size={20} color={C.green} />, label: "ترتيب نجوم الأكاديمية", sub: "أفضل اللاعبين", view: "leaderboard" as View, color: C.green },
  ];

  return (
    <div style={{ padding: "20px 16px 110px", direction: "rtl" }} className="fade-in">
      {/* Welcome & Coach Identity */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ color: C.muted, fontSize: 12 }}>مرحباً بك كابتن 👋</p>
            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginTop: 3 }}>
              {coachData?.name || user?.username || "المدرب"}
            </h1>
            {coachData?.specialty && (
              <p style={{ color: C.green, fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                {coachData.specialty}
              </p>
            )}
          </div>
          <div style={{ textAlign: "left" }}>
            <span style={{
              display: "inline-block",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: C.green,
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 12
            }}>
              حساب مدرب خاص 🔒
            </span>
          </div>
        </div>
      </div>

      {/* Team & Category Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
        borderRadius: 22,
        padding: "20px 18px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(16,185,129,0.35)",
        boxShadow: "0 12px 30px rgba(6,95,70,0.25)"
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", left: -20, bottom: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 11, fontWeight: 900, padding: "4px 10px", borderRadius: 10 }}>
                الفئة: {selectedTeam?.category || coachData?.category || user?.category || "فئة عامة"}
              </span>
              {selectedTeam?.name && (
                <span style={{ background: "rgba(16,185,129,0.4)", border: "1px solid rgba(255,255,255,0.25)", color: "#ecfdf5", fontSize: 11, fontWeight: 900, padding: "4px 10px", borderRadius: 10 }}>
                  الفوج: {selectedTeam.name}
                </span>
              )}
            </div>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 700 }}>
              بياناتك خاصة ومحمية
            </span>
          </div>

          <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: "4px 0" }}>
            {selectedTeam ? `فوج ${selectedTeam.name}` : (coachData?.category || user?.category || "فريقك المخصص")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>
            يظهر لك فقط لاعبو هذا الفوج وبرامج تدريباتك ومبارياتك
          </p>

          {/* Teams switcher if coach has multiple assigned teams */}
          {coachTeams.length > 1 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>تبديل الفوج:</p>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {coachTeams.map((tm: any) => {
                  const isSel = selectedTeam?.team_id === tm.team_id;
                  return (
                    <button
                      key={tm.team_id}
                      onClick={() => onSelectTeam && onSelectTeam(tm)}
                      style={{
                        background: isSel ? "#fff" : "rgba(255,255,255,0.18)",
                        color: isSel ? "#064e3b" : "#fff",
                        border: isSel ? "none" : "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 10,
                        padding: "5px 12px",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: isSel ? "0 2px 8px rgba(0,0,0,0.2)" : "none"
                      }}>
                      {tm.name} ({tm.category})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 10 }}>
            {upcoming ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={13} color="rgba(255,255,255,0.85)" />
                <span style={{ color: "#ecfdf5", fontSize: 11, fontWeight: 700 }}>
                  التدريب القادم: {fmt(upcoming.date)}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={13} color="rgba(255,255,255,0.5)" />
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>لا توجد تدريبات قادمة مجدولة</span>
              </div>
            )}
            {lastTraining && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} color="rgba(255,255,255,0.6)" />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                  آخر تدريب: {fmt(lastTraining.date)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
        <StatBadge label="لاعبي الفوج" value={players.length} icon={<Users size={16} />} color={C.green} />
        <StatBadge label="النشطون" value={activePlayers.length} icon={<Activity size={16} />} color={C.purple} />
        <StatBadge label="المصابون" value={injuredPlayers.length} icon={<Heart size={16} />} color={C.red} />
      </div>

      {/* Quick Actions Grid */}
      <SectionTitle>الأقسام الرياضية</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {quickActions.map((a, i) => (
          <button key={i} onClick={() => onNavigate(a.view)} className="btn-press"
            style={{ background: `${a.color}10`, border: `1px solid ${a.color}25`, borderRadius: 16, padding: "16px 12px", cursor: "pointer", textAlign: "right", display: "flex", flexDirection: "column", gap: 8, transition: "all 0.2s" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.icon}</div>
            <div>
              <p style={{ color: C.text, fontSize: 12, fontWeight: 800, margin: 0 }}>{a.label}</p>
              <p style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{a.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Players Screen ───────────────────────────────────────────────────────────
function PlayersScreen({ players, coachTeams = [], selectedTeam, onSelectTeam, onNavigate }: any) {
  const [query, setQuery] = useState("");
  const [posFilter, setPosFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");

  const positions = ["الكل", ...Array.from(new Set(players.map((p: any) => p.position || "لاعب")))];
  const filtered = players.filter((p: any) => {
    const mTeam = !selectedTeam || !p.team_id || Number(p.team_id) === Number(selectedTeam.team_id);
    const mQ = !query || p.name?.toLowerCase().includes(query.toLowerCase()) || p.jersey_number?.toString().includes(query);
    const mP = posFilter === "الكل" || (p.position || "لاعب") === posFilter;
    const mS = statusFilter === "الكل" || p.status === statusFilter;
    return mTeam && mQ && mP && mS;
  });

  return (
    <div style={{ direction: "rtl" }} className="fade-in">
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>لاعبي ({filtered.length})</h2>
          {selectedTeam && (
            <span style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: C.green, fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 10 }}>
              فوج {selectedTeam.name}
            </span>
          )}
        </div>

        {/* Coach Teams Switcher if more than 1 team */}
        {coachTeams.length > 1 && (
          <div className="scroll-hide" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10 }}>
            <button
              onClick={() => onSelectTeam && onSelectTeam(null)}
              style={{
                flexShrink: 0, padding: "4px 12px", borderRadius: 12,
                border: `1px solid ${!selectedTeam ? C.green : "rgba(255,255,255,0.1)"}`,
                background: !selectedTeam ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                color: !selectedTeam ? C.green : C.muted, fontSize: 11, fontWeight: 800, cursor: "pointer"
              }}>
              كل أفواجي ({players.length})
            </button>
            {coachTeams.map((tm: any) => {
              const isSel = selectedTeam?.team_id === tm.team_id;
              const teamPlayerCount = players.filter((p: any) => Number(p.team_id) === Number(tm.team_id)).length;
              return (
                <button
                  key={tm.team_id}
                  onClick={() => onSelectTeam && onSelectTeam(tm)}
                  style={{
                    flexShrink: 0, padding: "4px 12px", borderRadius: 12,
                    border: `1px solid ${isSel ? C.green : "rgba(255,255,255,0.1)"}`,
                    background: isSel ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                    color: isSel ? C.green : C.muted, fontSize: 11, fontWeight: 800, cursor: "pointer"
                  }}>
                  {tm.name} ({teamPlayerCount})
                </button>
              );
            })}
          </div>
        )}

        <div style={{ position: "relative", marginBottom: 8 }}>
          <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث بالاسم أو الرقم..."
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 36px 9px 14px", color: "#fff", fontSize: 13, outline: "none" }} />
          {query && <button onClick={() => setQuery("")} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={14} /></button>}
        </div>
        <div className="scroll-hide" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {(positions as string[]).map((p: string) => {
            const active = p === posFilter;
            const cfg = p === "الكل" ? { color: C.green } : getPosConfig(p);
            return (
              <button key={p} onClick={() => setPosFilter(p)}
                style={{ flexShrink: 0, padding: "4px 12px", borderRadius: 20, border: `1px solid ${active ? cfg.color : "rgba(255,255,255,0.1)"}`, background: active ? `${cfg.color}18` : "transparent", color: active ? cfg.color : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {p}
              </button>
            );
          })}
        </div>
        <div className="scroll-hide" style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 6 }}>
          {["الكل", "active", "injured", "inactive", "suspended"].map(s => {
            const active = s === statusFilter;
            const color = s === "الكل" ? C.muted : (statusColors[s] || C.muted);
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ flexShrink: 0, padding: "3px 10px", borderRadius: 20, border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`, background: active ? `${color}18` : "transparent", color: active ? color : C.muted, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {s === "الكل" ? "الكل" : statusLabel[s] || s}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "10px 16px 110px" }}>
        {filtered.length === 0 ? <EmptyState icon={<Users size={40} />} text="لا توجد نتائج" /> : (
          filtered.map((p: any) => {
            const cfg = getPosConfig(p.position);
            return (
              <button key={p.player_id} onClick={() => onNavigate("player_detail", p)} className="btn-press"
                style={{ width: "100%", textAlign: "right", background: `${cfg.bg}`, border: `1px solid ${cfg.color}22`, borderRadius: 18, padding: 14, marginBottom: 10, cursor: "pointer", display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(0,0,0,0.4)", border: `2px solid ${cfg.color}50`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                    {p.photo_url ? <img src={p.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>{cfg.emoji}</span>}
                    {p.jersey_number && <div style={{ position: "absolute", bottom: 0, right: 0, background: cfg.color, color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: "5px 0 0 0", padding: "1px 4px" }}>#{p.jersey_number}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ background: `${cfg.color}20`, color: cfg.color, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{cfg.emoji} {cfg.label}</span>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColors[p.status] || C.green }} />
                    </div>
                    <p style={{ color: C.text, fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                      {p.date_of_birth && <span style={{ color: C.muted, fontSize: 11 }}>{getAge(p.date_of_birth)} سنة</span>}
                      {p.nationality && <span style={{ color: C.muted, fontSize: 11 }}>• {p.nationality}</span>}
                    </div>
                  </div>
                  <ChevronLeft size={16} color={C.dim} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Player Detail Screen ─────────────────────────────────────────────────────
function PlayerDetailScreen({ player, onBack, user }: any) {
  const cfg = getPosConfig(player.position);
  const [stats, setStats] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [evals, setEvals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"info" | "stats" | "att" | "injuries" | "physical" | "evals" | "fut">("info");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [s, a, i, m, e] = await Promise.all([
          supabase.from("player_stats").select("*").eq("player_id", player.player_id).maybeSingle().then(r => r.data),
          supabase.from("attendance").select("*, training(date,notes)").eq("player_id", player.player_id).order("created_at", { ascending: false }).limit(30).then(r => r.data || []),
          supabase.from("injuries").select("*").eq("player_id", player.player_id).order("injury_date", { ascending: false }).then(r => r.data || []),
          supabase.from("physical_metrics").select("*").eq("player_id", player.player_id).order("record_date", { ascending: false }).limit(5).then(r => r.data || []),
          supabase.from("evaluations").select("*").eq("player_id", player.player_id).order("evaluation_date", { ascending: false }).limit(10).then(r => r.data || []),
        ]);
        setStats(s); setAttendance(a); setInjuries(i); setMetrics(m); setEvals(e);
      } catch { }
      setIsLoading(false);
    };
    load();
  }, [player.player_id]);

  const present = attendance.filter((a: any) => a.status === "present").length;
  const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;

  const TABS = [
    { id: "info", label: "معلومات", icon: <User size={13} /> },
    { id: "stats", label: "إحصائيات", icon: <BarChart2 size={13} /> },
    { id: "att", label: "الحضور", icon: <ClipboardCheck size={13} /> },
    { id: "injuries", label: "الإصابات", icon: <Heart size={13} /> },
    { id: "physical", label: "البدني", icon: <Dumbbell size={13} /> },
    { id: "evals", label: "التقييم", icon: <Star size={13} /> },
    { id: "fut", label: "بطاقة FIFA ⭐", icon: <Sparkles size={13} /> },
  ];

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      {/* Hero */}
      <div style={{ background: `linear-gradient(160deg,${cfg.bg},rgba(6,8,16,0.95))`, borderBottom: `1px solid ${cfg.color}20`, padding: "20px 16px" }}>
        <button onClick={onBack} className="btn-press" style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, padding: "7px 14px", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, marginBottom: 16 }}>
          <ChevronRight size={15} /> رجوع
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(0,0,0,0.5)", border: `2.5px solid ${cfg.color}60`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, position: "relative" }}>
            {player.photo_url ? <img src={player.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32 }}>{cfg.emoji}</span>}
            {player.jersey_number && <div style={{ position: "absolute", bottom: 0, right: 0, background: cfg.color, color: "#fff", fontSize: 10, fontWeight: 900, borderRadius: "7px 0 0 0", padding: "2px 6px" }}>#{player.jersey_number}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${cfg.color}20`, color: cfg.color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, marginBottom: 5 }}>{cfg.emoji} {cfg.label}</div>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>{player.name}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
              <span style={{ color: C.muted, fontSize: 11 }}>{getAge(player.date_of_birth)} سنة</span>
              {player.nationality && <span style={{ color: C.dim, fontSize: 11 }}>• {player.nationality}</span>}
            </div>
          </div>
          <div style={{ background: `${statusColors[player.status] || C.green}18`, border: `1px solid ${statusColors[player.status] || C.green}40`, borderRadius: 20, padding: "5px 12px", color: statusColors[player.status] || C.green, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
            {statusLabel[player.status] || "نشط"}
          </div>
        </div>
        {/* Mini stats */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {[{ v: stats?.goals ?? 0, l: "أهداف", c: C.green }, { v: stats?.assists ?? 0, l: "تمريرات", c: C.purple }, { v: `${attRate}%`, l: "حضور", c: C.amber }, { v: injuries.length, l: "إصابات", c: C.red }].map(s => (
            <div key={s.l} style={{ flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "8px 4px", textAlign: "center" }}>
              <p style={{ color: s.c, fontSize: 18, fontWeight: 900 }}>{s.v}</p>
              <p style={{ color: C.muted, fontSize: 9, fontWeight: 700 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="scroll-hide" style={{ display: "flex", overflowX: "auto", borderBottom: `1px solid ${C.border}`, background: "rgba(6,8,16,0.98)", position: "sticky", top: 57, zIndex: 38 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 4, padding: "11px 13px", border: "none", background: "none", cursor: "pointer", fontSize: 11, fontWeight: 800, color: tab === t.id ? C.green : C.muted, borderBottom: tab === t.id ? `2px solid ${C.green}` : "2px solid transparent", whiteSpace: "nowrap" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={30} color={C.green} className="spin" style={{ display: "block", margin: "0 auto" }} /></div>
        ) : (
          <>
            {tab === "info" && (
              <div>
                <InfoRow label="تاريخ الميلاد" value={player.date_of_birth ? `${fmt(player.date_of_birth)} (${getAge(player.date_of_birth)} سنة)` : null} icon={<Calendar size={15} />} color={cfg.color} />
                <InfoRow label="الجنسية" value={player.nationality} icon={<Shield size={15} />} color={cfg.color} />
                <InfoRow label="الولاية" value={player.wilaya} icon={<MapPin size={15} />} color={cfg.color} />
                <InfoRow label="رقم القميص" value={player.jersey_number ? `#${player.jersey_number}` : null} icon={<Award size={15} />} color={cfg.color} />
                {player.phone && <InfoRow label="الهاتف" value={player.phone} icon={<Phone size={15} />} color={cfg.color} />}
                <InfoRow label="اسم الأب" value={player.father_name} icon={<User size={15} />} color={cfg.color} />
                <InfoRow label="تاريخ الالتحاق" value={fmt(player.join_date)} icon={<Calendar size={15} />} color={cfg.color} />
              </div>
            )}
            {tab === "stats" && (
              <div>
                {!stats ? <EmptyState icon={<BarChart2 size={36} />} text="لا توجد إحصائيات" /> : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { l: "المباريات", v: stats.matches_played, c: C.purple },
                      { l: "الأهداف", v: stats.goals, c: C.green },
                      { l: "التمريرات الحاسمة", v: stats.assists, c: C.blue },
                      { l: "البطاقات الصفراء", v: stats.yellow_cards, c: C.amber },
                      { l: "البطاقات الحمراء", v: stats.red_cards, c: C.red },
                      { l: "دقائق اللعب", v: stats.minutes_played, c: "#8b5cf6" },
                    ].map(s => <StatBadge key={s.l} label={s.l} value={s.v ?? 0} color={s.c} />)}
                  </div>
                )}
              </div>
            )}
            {tab === "att" && (
              <div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, marginBottom: 14, display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, textAlign: "center" }}><p style={{ color: attRate >= 75 ? C.green : C.red, fontSize: 26, fontWeight: 900 }}>{attRate}%</p><p style={{ color: C.muted, fontSize: 10 }}>نسبة الحضور</p></div>
                  <div style={{ width: 1, background: C.border }} />
                  <div style={{ flex: 1, textAlign: "center" }}><p style={{ color: C.green, fontSize: 20, fontWeight: 900 }}>{present}</p><p style={{ color: C.muted, fontSize: 10 }}>حاضر</p></div>
                  <div style={{ width: 1, background: C.border }} />
                  <div style={{ flex: 1, textAlign: "center" }}><p style={{ color: C.red, fontSize: 20, fontWeight: 900 }}>{attendance.length - present}</p><p style={{ color: C.muted, fontSize: 10 }}>غائب</p></div>
                </div>
                {attendance.length === 0 ? <EmptyState icon={<ClipboardCheck size={36} />} text="لا توجد سجلات حضور" /> : (
                  attendance.slice(0, 20).map((a: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                      {a.status === "present" ? <CheckSquare size={18} color={C.green} /> : a.status === "absent" ? <XSquare size={18} color={C.red} /> : <MinusSquare size={18} color={C.amber} />}
                      <div style={{ flex: 1 }}>
                        <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{a.training?.date ? fmt(a.training.date) : "تدريب"}</p>
                        {a.training?.notes && <p style={{ color: C.muted, fontSize: 11 }}>{a.training.notes.split('|')[1] || a.training.notes}</p>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: a.status === "present" ? C.green : a.status === "absent" ? C.red : C.amber }}>
                        {a.status === "present" ? "حاضر" : a.status === "absent" ? "غائب" : "متأخر"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === "injuries" && (
              injuries.length === 0 ? <EmptyState icon={<Heart size={36} />} text="لا توجد إصابات مسجلة ✅" /> : (
                injuries.map((inj: any) => (
                  <div key={inj.injury_id} style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <p style={{ color: C.text, fontSize: 14, fontWeight: 800 }}>{inj.injury_type || "إصابة"}</p>
                      <span style={{ color: "#f87171", fontSize: 11 }}>{fmt(inj.injury_date)}</span>
                    </div>
                    {inj.description && <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{inj.description}</p>}
                    {inj.return_date && <p style={{ color: C.amber, fontSize: 11, marginTop: 6 }}>العودة المتوقعة: {fmt(inj.return_date)}</p>}
                  </div>
                ))
              )
            )}
            {tab === "physical" && (
              metrics.length === 0 ? <EmptyState icon={<Dumbbell size={36} />} text="لا توجد قياسات بدنية" /> : (
                <div>
                  <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>آخر قياس: {fmt(metrics[0].record_date)}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { l: "الطول", v: metrics[0].height, u: "سم", c: C.purple },
                      { l: "الوزن", v: metrics[0].weight, u: "كغ", c: C.green },
                      { l: "عدو 40م", v: metrics[0].sprint_40m, u: "ث", c: C.amber },
                      { l: "عدو 100م", v: metrics[0].sprint_100m, u: "ث", c: C.red },
                      { l: "القفز العمودي", v: metrics[0].vertical_jump, u: "سم", c: "#8b5cf6" },
                      { l: "VO₂ Max", v: metrics[0].vo2_max, u: "", c: C.blue },
                    ].filter(m => m.v).map(m => (
                      <div key={m.l} style={{ background: `${m.c}10`, border: `1px solid ${m.c}25`, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                        <p style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>{m.v}<span style={{ fontSize: 11, color: C.muted }}> {m.u}</span></p>
                        <p style={{ color: C.muted, fontSize: 10, marginTop: 3, fontWeight: 700 }}>{m.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
            {tab === "evals" && (
              evals.length === 0 ? <EmptyState icon={<Star size={36} />} text="لا توجد تقييمات مسجلة" /> : (
                evals.map((ev: any, i: number) => (
                  <div key={i} style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 800 }}>تقييم #{i + 1}</p>
                      <span style={{ color: C.muted, fontSize: 11 }}>{fmt(ev.evaluation_date)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[
                        { l: "التقنية", v: ev.technical_score },
                        { l: "التكتيك", v: ev.tactical_score },
                        { l: "اللياقة", v: ev.physical_score },
                        { l: "الذهني", v: ev.mental_score },
                      ].filter(s => s.v != null).map(s => (
                        <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: C.muted, fontSize: 11 }}>{s.l}</span>
                          <span style={{ color: C.amber, fontSize: 13, fontWeight: 800 }}>{s.v}/10</span>
                        </div>
                      ))}
                    </div>
                    {ev.notes && <p style={{ color: C.muted, fontSize: 12, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>{ev.notes}</p>}
                  </div>
                ))
              )
            )}
            {tab === "fut" && (
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
                <FUTPlayerCard
                  player={{
                    name: player.name,
                    category: player.category || "U13",
                    position: player.position || "FWD",
                    jerseyNumber: player.jersey_number,
                    photoUrl: player.photo_url,
                    rating: player.level_score || 85,
                    stats: {
                      pac: evals[0]?.pace || 82,
                      sho: evals[0]?.shooting || 80,
                      pas: evals[0]?.passing || 78,
                      dri: evals[0]?.dribbling || 83,
                      def: evals[0]?.defending || 65,
                      phy: evals[0]?.physical_status || 77,
                    },
                    academyName: "أكاديمية أجيال وادي العثمانية",
                  }}
                  cardTheme="gold"
                  showActions={true}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── QR Scanner Component (jsQR - works in Android WebView) ──────────────────
function playBeepSound(success = true) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 1200 : 400;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch { /* ignore if audio not available */ }
}

function getAsciiTime(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

interface ScanEntry {
  playerId: number;
  name: string;
  position?: string;
  jerseyNumber?: string;
  photoUrl?: string;
  time: string; // HH:MM:SS
  timestamp: number;
}

function QRScannerView({
  onScanComplete,
  onClose,
  players = [],
  sessionPlayers = [],
  trainingInfo = "",
  selectedTraining = null
}: {
  onScanComplete: (entries: ScanEntry[]) => void;
  onClose: () => void;
  players?: any[];
  sessionPlayers?: any[];
  trainingInfo?: string;
  selectedTraining?: any;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const lastScanTime = useRef(0);

  const [status, setStatus] = useState<"requesting" | "active" | "error">("requesting");
  const [error, setError] = useState("");
  const [localScanLog, setLocalScanLog] = useState<ScanEntry[]>([]);
  const localScanLogRef = useRef<ScanEntry[]>([]);
  const [flashEntry, setFlashEntry] = useState<ScanEntry | null>(null);
  const [showList, setShowList] = useState(false);
  const [listTab, setListTab] = useState<"present" | "absent">("present");
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const relevantPlayers = (sessionPlayers && sessionPlayers.length > 0) ? sessionPlayers : players;

  useEffect(() => {
    requestCameraAndStart();
    return () => {
      stopCamera();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const addToLocalLog = (entry: ScanEntry) => {
    const prev = localScanLogRef.current;
    const exists = prev.findIndex(e => e.playerId === entry.playerId && entry.playerId > 0);
    let next: ScanEntry[];
    if (exists >= 0) {
      next = [...prev];
      next[exists] = entry;
    } else {
      next = [entry, ...prev];
    }
    localScanLogRef.current = next;
    setLocalScanLog(next);

    // Immediate background persist if a training session is active
    if (selectedTraining?.training_id && entry.playerId > 0) {
      (async () => {
        try {
          await supabase.from("attendance").delete()
            .eq("training_id", selectedTraining.training_id)
            .eq("player_id", entry.playerId);

          await supabase.from("attendance").insert([{
            training_id: selectedTraining.training_id,
            player_id: entry.playerId,
            status: "حاضر",
            check_in_time: entry.time,
            notes: "تم التسجيل بمسح QR من تطبيق المدرب"
          }]);
        } catch (err) {
          console.warn("Live scan save error:", err);
        }
      })();
    }
  };

  const handleFinishAndReview = () => {
    stopCamera();
    onScanComplete(localScanLogRef.current.filter(e => e.playerId > 0));
    onClose();
  };

  const handleManualMark = (p: any) => {
    const time = getAsciiTime();
    const entry: ScanEntry = {
      playerId: p.player_id,
      name: p.name,
      position: p.position,
      jerseyNumber: p.jersey_number,
      photoUrl: p.photo_url,
      time,
      timestamp: Date.now()
    };
    addToLocalLog(entry);
    playBeepSound(true);
    if (navigator.vibrate) navigator.vibrate(80);
    setFlashEntry(entry);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashEntry(null), 2500);
  };

  const resolvePlayer = (rawText: string): ScanEntry | null => {
    const trimmed = rawText.trim();
    let found: any = null;

    if (trimmed.startsWith("ULTRA-")) {
      const idNum = parseInt(trimmed.replace("ULTRA-", ""));
      if (!isNaN(idNum)) found = players.find((p: any) => p.player_id === idNum);
    }
    if (!found) {
      const numId = parseInt(trimmed);
      if (!isNaN(numId)) found = players.find((p: any) => p.player_id === numId);
    }
    if (!found && trimmed.includes("player/")) {
      const parts = trimmed.split("player/")[1]?.split("/");
      const idPart = parts?.[0]?.replace(/\D/g, "");
      if (idPart) found = players.find((p: any) => String(p.player_id) === idPart);
    }
    if (!found) {
      found = players.find((p: any) =>
        p.name === trimmed ||
        p.qr_code === trimmed ||
        trimmed.includes(String(p.player_id))
      );
    }
    if (!found) return null;

    const time = getAsciiTime();
    return {
      playerId: found.player_id,
      name: found.name,
      position: found.position,
      jerseyNumber: found.jersey_number,
      photoUrl: found.photo_url,
      time,
      timestamp: Date.now()
    };
  };

  const requestCameraAndStart = async () => {
    setStatus("requesting");
    setError("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("الكاميرا غير مدعومة في هذا المتصفح. تأكد من أن التطبيق يعمل على HTTPS أو تطبيق الهاتف.");
      setStatus("error");
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("autoplay", "true");
        videoRef.current.muted = true;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play().then(() => {
            setStatus("active");
            requestAnimationFrame(scanLoop);
          }).catch(e => {
            setError("فشل تشغيل الكاميرا: " + e.message);
            setStatus("error");
          });
        };
        videoRef.current.onerror = () => {
          setError("خطأ في تشغيل الكاميرا.");
          setStatus("error");
        };
      }
    } catch (e: any) {
      const msg = e?.name || e?.message || "";
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        setError("تم رفض إذن الكاميرا. يرجى تفعيل إذن الكاميرا من إعدادات التطبيق.");
      } else if (msg.includes("NotFoundError") || msg.includes("DevicesNotFoundError")) {
        setError("لم يتم العثور على كاميرا في هذا الجهاز.");
      } else if (msg.includes("NotReadableError")) {
        setError("الكاميرا مستخدمة من تطبيق آخر.");
      } else {
        setError("تعذر الوصول إلى الكاميرا: " + (e?.message || ""));
      }
      setStatus("error");
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
          });
          if (code?.data) {
            const now = Date.now();
            if (now - lastScanTime.current > 1800) {
              lastScanTime.current = now;
              const entry = resolvePlayer(code.data);
              const isKnown = entry !== null;
              playBeepSound(isKnown);
              if (navigator.vibrate) navigator.vibrate(isKnown ? 100 : [50, 50, 50]);
              const finalEntry: ScanEntry = entry || {
                playerId: -1,
                name: code.data.substring(0, 20),
                time: getAsciiTime(),
                timestamp: now
              };
              addToLocalLog(finalEntry);
              if (entry) {
                setFlashEntry(entry);
                if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                flashTimerRef.current = setTimeout(() => setFlashEntry(null), 2500);
              }
            }
          }
        } catch { }
      }
    }

    animRef.current = requestAnimationFrame(scanLoop);
  };

  const scannedPlayerIds = new Set(localScanLog.filter(e => e.playerId > 0).map(e => e.playerId));
  const presentScannedPlayers = localScanLog.filter(e => e.playerId > 0);
  const absentPlayersList = relevantPlayers.filter((p: any) => !scannedPlayerIds.has(p.player_id));
  const cfg = flashEntry ? getPosConfig(flashEntry.position || "") : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 200, display: "flex", flexDirection: "column", direction: "rtl" }}>
      {/* Top Bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 40,
        background: "linear-gradient(to bottom, rgba(6,8,16,0.95), rgba(6,8,16,0))",
        padding: "16px 16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => { stopCamera(); onScanComplete(localScanLogRef.current.filter(e => e.playerId > 0)); onClose(); }}
            style={{
              width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
          <div>
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>مسح حضور اللاعبين</p>
            {trainingInfo && <p style={{ color: C.green, fontSize: 10, fontWeight: 700 }}>{trainingInfo}</p>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ background: "rgba(16,185,129,0.25)", border: `1px solid ${C.green}50`, color: C.green, fontSize: 11, fontWeight: 800, padding: "4px 8px", borderRadius: 8 }}>
            ✅ {presentScannedPlayers.length} حاضر
          </span>
          <span style={{ background: "rgba(239,68,68,0.25)", border: `1px solid ${C.red}50`, color: "#fca5a5", fontSize: 11, fontWeight: 800, padding: "4px 8px", borderRadius: 8 }}>
            ❌ {absentPlayersList.length} غائب
          </span>
        </div>
      </div>

      {/* Camera View */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden", background: "#111" }}>
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: status === "active" ? "block" : "none" }}
          playsInline autoPlay muted
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Status overlays */}
        {status === "requesting" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Loader2 size={40} color={C.green} className="spin" />
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>جاري تشغيل الكاميرا...</p>
            <p style={{ color: C.muted, fontSize: 11, textAlign: "center", padding: "0 30px" }}>
              إذا ظهر مربع الإذن يرجى الضغط على "السماح"
            </p>
          </div>
        )}

        {status === "error" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 30px" }}>
            <div style={{ width: 70, height: 70, borderRadius: 22, background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={32} color="#f87171" />
            </div>
            <p style={{ color: "#f87171", fontSize: 14, fontWeight: 800, textAlign: "center" }}>تعذر تشغيل الكاميرا</p>
            <p style={{ color: C.muted, fontSize: 12, textAlign: "center", lineHeight: 1.7 }}>{error}</p>
            <button onClick={requestCameraAndStart} className="btn-press"
              style={{ background: `${C.green}18`, border: `1px solid ${C.green}40`, borderRadius: 14, padding: "12px 28px", color: C.green, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <RefreshCw size={15} /> إعادة المحاولة
            </button>
          </div>
        )}

        {/* Active Scan Elements */}
        {status === "active" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />

            {/* Flash Banner for Scanned Player */}
            {flashEntry && cfg && (
              <div
                className="fade-in"
                style={{
                  position: "absolute", top: 75, left: 16, right: 16, zIndex: 35,
                  background: "rgba(6,8,16,0.96)",
                  border: `2px solid ${C.green}`,
                  borderRadius: 20,
                  padding: "14px 16px",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 0 35px rgba(16,185,129,0.35)",
                  display: "flex", alignItems: "center", gap: 14
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                  background: cfg.bg, border: `2px solid ${cfg.color}60`,
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  boxShadow: `0 0 16px ${C.green}50`
                }}>
                  {flashEntry.photoUrl
                    ? <img src={flashEntry.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 24 }}>{cfg.emoji}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
                    <span style={{ color: C.green, fontSize: 11, fontWeight: 900 }}>حاضر الآن ✓</span>
                    {flashEntry.jerseyNumber && (
                      <span style={{ background: cfg.color, color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: 6, padding: "1px 6px" }}>
                        #{flashEntry.jerseyNumber}
                      </span>
                    )}
                  </div>
                  <p style={{ color: "#fff", fontSize: 16, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {flashEntry.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Clock size={12} color={C.green} />
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }} dir="ltr">{flashEntry.time}</span>
                    {flashEntry.position && (
                      <span style={{ color: cfg.color, fontSize: 10, fontWeight: 700, background: `${cfg.color}15`, borderRadius: 6, padding: "1px 6px" }}>
                        {cfg.emoji} {flashEntry.position}
                      </span>
                    )}
                  </div>
                </div>
                <CheckCircle size={26} color={C.green} style={{ flexShrink: 0 }} />
              </div>
            )}

            {/* QR Target Frame */}
            <div style={{ position: "relative", width: 230, height: 230, zIndex: 10, marginTop: flashEntry ? 70 : 0, transition: "margin 0.3s" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 32, height: 32, borderTop: `3px solid ${C.green}`, borderRight: `3px solid ${C.green}` }} />
              <div style={{ position: "absolute", top: 0, left: 0, width: 32, height: 32, borderTop: `3px solid ${C.green}`, borderLeft: `3px solid ${C.green}` }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderBottom: `3px solid ${C.green}`, borderRight: `3px solid ${C.green}` }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, width: 32, height: 32, borderBottom: `3px solid ${C.green}`, borderLeft: `3px solid ${C.green}` }} />
              <div style={{ position: "absolute", left: 4, right: 4, height: 2, background: `linear-gradient(to left,transparent,${C.green},transparent)`, animation: "scanLine 2s ease-in-out infinite", top: "10%" }} />
            </div>

            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, marginTop: 18, zIndex: 10 }}>
              وجّه الكاميرا نحو رمز QR الخاص باللاعب
            </p>

            {/* Toggle live report drawer button */}
            <button
              onClick={() => setShowList(prev => !prev)}
              style={{
                background: "rgba(6,8,16,0.85)", backdropFilter: "blur(12px)",
                border: `1.5px solid ${showList ? C.green : "rgba(255,255,255,0.15)"}`,
                borderRadius: 14, padding: "8px 16px", marginTop: 12, zIndex: 10,
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#fff"
              }}
            >
              <ClipboardCheck size={15} color={C.green} />
              <span style={{ fontSize: 12, fontWeight: 800 }}>
                تقرير الحضور الحي ({presentScannedPlayers.length} حاضر / {absentPlayersList.length} غائب)
              </span>
              <span style={{ color: C.muted, fontSize: 10 }}>{showList ? "▲ إخفاء" : "▼ تفاصيل"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Scanned / Absent Live Bottom Drawer */}
      {showList && (
        <div style={{
          background: "rgba(6,8,16,0.98)",
          borderTop: `1px solid ${C.green}40`,
          maxHeight: "45%",
          display: "flex",
          flexDirection: "column",
          padding: "12px 14px 4px"
        }}>
          {/* Drawer Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              onClick={() => setListTab("present")}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 10,
                background: listTab === "present" ? `${C.green}25` : "rgba(255,255,255,0.05)",
                border: `1px solid ${listTab === "present" ? C.green : "transparent"}`,
                color: listTab === "present" ? C.green : C.muted,
                fontSize: 12, fontWeight: 800, cursor: "pointer"
              }}
            >
              🟢 الحاضرون ({presentScannedPlayers.length})
            </button>
            <button
              onClick={() => setListTab("absent")}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 10,
                background: listTab === "absent" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${listTab === "absent" ? C.red : "transparent"}`,
                color: listTab === "absent" ? "#fca5a5" : C.muted,
                fontSize: 12, fontWeight: 800, cursor: "pointer"
              }}
            >
              🔴 الغائبون ({absentPlayersList.length})
            </button>
          </div>

          {/* List Content */}
          <div style={{ overflowY: "auto", flex: 1 }} className="scroll-hide">
            {listTab === "present" && (
              presentScannedPlayers.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: "16px 0" }}>لم يتم مسح أي لاعب بعد</p>
              ) : (
                presentScannedPlayers.map((entry, idx) => {
                  const pcfg = getPosConfig(entry.position || "");
                  return (
                    <div key={idx} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)"
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, background: pcfg.bg,
                        border: `1px solid ${pcfg.color}40`, display: "flex", alignItems: "center",
                        justifyContent: "center", overflow: "hidden", flexShrink: 0
                      }}>
                        {entry.photoUrl ? <img src={entry.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{pcfg.emoji}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "#fff", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {entry.name} {entry.jerseyNumber ? `#${entry.jerseyNumber}` : ""}
                        </p>
                      </div>
                      <span style={{ color: C.green, fontSize: 11, fontWeight: 800 }} dir="ltr">{entry.time}</span>
                      <span style={{ color: C.green, fontSize: 10, fontWeight: 900 }}>✓</span>
                    </div>
                  );
                })
              )
            )}

            {listTab === "absent" && (
              absentPlayersList.length === 0 ? (
                <p style={{ color: C.green, fontSize: 12, textAlign: "center", padding: "16px 0" }}>🎉 تم تسجيل حضور جميع اللاعبين!</p>
              ) : (
                absentPlayersList.map((p: any) => {
                  const pcfg = getPosConfig(p.position || "");
                  return (
                    <div key={p.player_id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)"
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, background: pcfg.bg,
                        border: `1px solid ${pcfg.color}40`, display: "flex", alignItems: "center",
                        justifyContent: "center", overflow: "hidden", flexShrink: 0
                      }}>
                        {p.photo_url ? <img src={p.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{pcfg.emoji}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "#fff", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.name} {p.jersey_number ? `#${p.jersey_number}` : ""}
                        </p>
                        <p style={{ color: C.muted, fontSize: 10 }}>{p.position || "لاعب"}</p>
                      </div>
                      <button
                        onClick={() => handleManualMark(p)}
                        style={{
                          background: `${C.green}20`, border: `1px solid ${C.green}50`,
                          color: C.green, borderRadius: 8, padding: "4px 10px", fontSize: 11,
                          fontWeight: 800, cursor: "pointer"
                        }}
                      >
                        تسجيل حاضر ➕
                      </button>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      )}

      {/* Bottom Bar Actions */}
      <div style={{ background: "#09090b", borderTop: `1px solid ${C.border}`, padding: "12px 16px 24px", display: "flex", gap: 10, flexDirection: "column" }}>
        <button
          onClick={handleFinishAndReview}
          className="btn-press"
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #059669, #10b981)",
            border: "none", borderRadius: 16, padding: "14px 0",
            color: "#fff", fontSize: 14, fontWeight: 900,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 8px 24px rgba(16,185,129,0.35)"
          }}
        >
          <ClipboardCheck size={18} />
          إنهاء المسح ومراجعة التقرير ({presentScannedPlayers.length} حاضر)
        </button>

        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="btn-press"
          style={{
            width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "11px 0", color: C.muted, fontSize: 13, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          <X size={15} /> إغلاق الكاميرا
        </button>
      </div>
    </div>
  );
}

// ─── Attendance Screen ────────────────────────────────────────────────────────
function AttendanceScreen({ players, coachData, user, onNavigate }: any) {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [scanTimes, setScanTimes] = useState<Record<number, string>>({});
  const [scanLog, setScanLog] = useState<ScanEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [tab, setTab] = useState<"report" | "qr" | "manual">("report");
  const [filterMode, setFilterMode] = useState<"all" | "present" | "absent">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadTrainings = async () => {
    setIsLoading(true);
    try {
      const [{ data: trData }, { data: teamsData }] = await Promise.all([
        supabase.from("training").select("*").order("date", { ascending: false }).limit(30),
        supabase.from("teams").select("*")
      ]);

      const coachId = coachData?.coach_id || user?.coach_id;
      const coachCat = coachData?.category || user?.category;
      const coachTeamId = coachData?.team_id || user?.team_id;

      const myTeams = (teamsData || []).filter((t: any) =>
        (coachId && Number(t.coach_id) === Number(coachId)) ||
        (coachTeamId && Number(t.team_id) === Number(coachTeamId)) ||
        (coachCat && t.category === coachCat)
      );
      const myTeamIds = myTeams.map((t: any) => Number(t.team_id));
      const teamsMap = new Map((teamsData || []).map((tm: any) => [Number(tm.team_id), tm]));

      const list = (trData || [])
        .filter((tr: any) =>
          (tr.team_id && myTeamIds.includes(Number(tr.team_id))) ||
          (coachCat && tr.category === coachCat) ||
          (coachId && Number(tr.coach_id) === Number(coachId))
        )
        .map((tr: any) => ({
          ...tr,
          teams: teamsMap.get(Number(tr.team_id)) || null
        }));

      setTrainings(list);
      if (list.length > 0) {
        const current = selectedTraining && list.find((t: any) => Number(t.training_id) === Number(selectedTraining.training_id));
        const toSelect = current || list[0];
        setSelectedTraining(toSelect);
        loadExisting(toSelect.training_id);
      }
    } catch (e) {
      console.error("Attendance training load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, [user, coachData]);

  const loadExisting = async (trainingId: number) => {
    try {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("training_id", trainingId);

      if (data && data.length > 0) {
        const map: Record<number, string> = {};
        const times: Record<number, string> = {};
        data.forEach((a: any) => {
          map[a.player_id] = a.status || "حاضر";
          if (a.check_in_time || a.time_recorded) {
            times[a.player_id] = a.check_in_time || a.time_recorded;
          }
        });
        setAttendance(map);
        setScanTimes(times);
      }
    } catch (e) {
      console.error("Failed to load existing attendance:", e);
    }
  };

  const handleSelectTraining = (t: any) => {
    setSelectedTraining(t);
    setAttendance({});
    setScanTimes({});
    setScanLog([]);
    setReportSent(false);
    setSavedMsg("");
    loadExisting(t.training_id);
  };

  // Players belonging to the currently selected training session
  const sessionPlayers = useMemo(() => {
    if (!selectedTraining) return players || [];
    const cat = selectedTraining.teams?.category || selectedTraining.category;
    const teamId = selectedTraining.team_id ? Number(selectedTraining.team_id) : null;

    const matched = (players || []).filter((p: any) => {
      if (teamId && Number(p.team_id) === teamId) return true;
      if (cat && p.category === cat) return true;
      return false;
    });

    return matched.length > 0 ? matched : (players || []);
  }, [players, selectedTraining]);

  const toggleStatus = (playerId: number) => {
    setAttendance(prev => {
      const cur = prev[playerId];
      let next = "حاضر";
      if (cur === "حاضر") next = "غائب";
      else if (cur === "غائب") next = "متأخر";
      else if (cur === "متأخر") next = "مبرر";
      else if (cur === "مبرر") next = "حاضر";

      if (next === "حاضر" && !scanTimes[playerId]) {
        setScanTimes(t => ({ ...t, [playerId]: getAsciiTime() }));
      }
      return { ...prev, [playerId]: next };
    });
  };

  const setPlayerStatus = (playerId: number, status: string) => {
    setAttendance(prev => ({ ...prev, [playerId]: status }));
    if (status === "حاضر" || status === "متأخر") {
      setScanTimes(t => ({ ...t, [playerId]: t[playerId] || getAsciiTime() }));
    }
  };

  // Callback when scanner completes
  const handleScanComplete = async (entries: ScanEntry[]) => {
    if (!entries || entries.length === 0) return;
    const newAttendance: Record<number, string> = {};
    const newTimes: Record<number, string> = {};
    entries.forEach(entry => {
      newAttendance[entry.playerId] = "حاضر";
      newTimes[entry.playerId] = entry.time;
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
    setScanTimes(prev => ({ ...prev, ...newTimes }));
    setScanLog(entries);
    setTab("report");

    // Automatically persist to Supabase in background
    if (selectedTraining?.training_id) {
      try {
        for (const entry of entries) {
          if (entry.playerId > 0) {
            await supabase.from("attendance").delete()
              .eq("training_id", selectedTraining.training_id)
              .eq("player_id", entry.playerId);

            await supabase.from("attendance").insert([{
              training_id: selectedTraining.training_id,
              player_id: entry.playerId,
              status: "حاضر",
              check_in_time: entry.time,
              notes: "تم التسجيل بمسح QR من تطبيق المدرب"
            }]);
          }
        }
        setSavedMsg(`✅ تم حفظ حضور ${entries.length} لاعب تلقائياً`);
        setTimeout(() => setSavedMsg(""), 5000);
      } catch (err) {
        console.error("Auto save scanned error:", err);
      }
    }

    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 100);
  };

  // Save to DB and Send Report to Admin
  const handleSave = async () => {
    if (!selectedTraining) {
      alert("يرجى اختيار حصة تدريبية أولاً");
      return;
    }

    const targetList = sessionPlayers.length > 0 ? sessionPlayers : players;
    // CRITICAL: also include any player who was scanned or marked present even if not in targetList
    const extraPlayerIds = Object.keys(attendance).map(Number).filter(id => !targetList.some((p: any) => Number(p.player_id) === id));
    const extraPlayers = extraPlayerIds.map(id => (players || []).find((p: any) => Number(p.player_id) === id)).filter(Boolean);
    const allToSave = [...targetList, ...extraPlayers];

    if (allToSave.length === 0) {
      alert("لا يوجد لاعبون مسجلون في هذا الفريق");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    try {
      // 1. Delete previous attendance for this session
      await supabase.from("attendance").delete().eq("training_id", selectedTraining.training_id);

      // 2. Prepare attendance records for ALL session players
      const nowTime = getAsciiTime();
      const records = allToSave.map((p: any) => {
        const status = attendance[p.player_id] || "غائب";
        const isPresent = status === "حاضر" || status === "متأخر";
        const checkInTime = isPresent ? (scanTimes[p.player_id] || nowTime) : null;
        const notes = scanTimes[p.player_id]
          ? "تم التسجيل بمسح QR من تطبيق المدرب"
          : (status === "حاضر" ? "تم التسجيل يدوياً" : status === "غائب" ? "غائب" : status);

        return {
          training_id: selectedTraining.training_id,
          player_id: p.player_id,
          status,
          check_in_time: checkInTime,
          notes
        };
      });

      // 3. Insert into Supabase attendance table
      const { error: insertError } = await supabase.from("attendance").insert(records);
      if (insertError) throw insertError;

      // 4. Send structured report to Admin via academy_notifications
      const presentList = targetList.filter((p: any) => (attendance[p.player_id] || "غائب") === "حاضر");
      const absentList = targetList.filter((p: any) => (attendance[p.player_id] || "غائب") === "غائب");
      const lateList = targetList.filter((p: any) => attendance[p.player_id] === "متأخر");
      const excusedList = targetList.filter((p: any) => attendance[p.player_id] === "مبرر");

      const coachName = coachData?.name || user?.username || "المدرب";
      const teamName = selectedTraining?.teams?.team_name || coachData?.category || "الفريق";
      const trainingDate = selectedTraining?.date ? fmt(selectedTraining.date) : new Date().toLocaleDateString("ar-DZ");
      const trainingTime = selectedTraining?.start_time || nowTime;

      const presentLines = presentList.map((p: any) => {
        const t = scanTimes[p.player_id] ? ` [${scanTimes[p.player_id]}]` : "";
        return `• ${p.name}${t}`;
      }).join("\n");

      const absentLines = absentList.map((p: any) => `• ${p.name}`).join("\n");
      const lateLines = lateList.map((p: any) => `• ${p.name} [${scanTimes[p.player_id] || ""}]`).join("\n");
      const excusedLines = excusedList.map((p: any) => `• ${p.name}`).join("\n");

      const messageContent = [
        `👨‍🏫 المدرب: ${coachName}`,
        `🏆 الفريق: ${teamName}`,
        `📅 التاريخ: ${trainingDate}  🕐 التوقيت: ${trainingTime}`,
        ``,
        `✅ الحاضرون (${presentList.length}):`,
        presentLines || "لا يوجد",
        ``,
        `❌ الغائبون (${absentList.length}):`,
        absentLines || "لا يوجد",
        lateList.length > 0 ? `\n⏱ المتأخرون (${lateList.length}):\n${lateLines}` : "",
        excusedList.length > 0 ? `\n📝 بعذر (${excusedList.length}):\n${excusedLines}` : "",
        ``,
        `📊 ملخص الحضور: ${presentList.length} حاضر من أصل ${targetList.length} لاعب (${Math.round((presentList.length / targetList.length) * 100)}%)`,
      ].filter(Boolean).join("\n");

      await supabase.from("academy_notifications").insert([{
        recipient_role: "admin",
        title: `📋 تقرير حضور: ${teamName} — ${trainingDate}`,
        message: messageContent,
        data: {
          training_id: selectedTraining.training_id,
          team_name: teamName,
          present_count: presentList.length,
          absent_count: absentList.length,
          total_count: targetList.length,
          date: trainingDate
        },
        created_at: new Date().toISOString()
      }]);

      setReportSent(true);
      setSavedMsg(`✅ تم حفظ الحضور وإرسال التقرير للإدارة بنجاح (${presentList.length} حاضر / ${absentList.length} غائب)`);
      setTimeout(() => setSavedMsg(""), 8000);
    } catch (err: any) {
      console.error("Attendance save failed:", err);
      setSaveError("❌ فشل الحفظ: " + (err.message || "تأكد من الاتصال بالإنترنت"));
    } finally {
      setIsSaving(false);
    }
  };

  const currentTargetList = sessionPlayers.length > 0 ? sessionPlayers : players;
  const presentCount = currentTargetList.filter((p: any) => attendance[p.player_id] === "حاضر").length;
  const absentCount = currentTargetList.filter((p: any) => (attendance[p.player_id] || "غائب") === "غائب").length;
  const lateCount = currentTargetList.filter((p: any) => attendance[p.player_id] === "متأخر").length;
  const excusedCount = currentTargetList.filter((p: any) => attendance[p.player_id] === "مبرر").length;
  const qrScannedCount = scanLog.filter(e => e.playerId > 0).length;

  const filteredPlayers = currentTargetList.filter((p: any) => {
    const status = attendance[p.player_id] || "غائب";
    if (filterMode === "present") return status === "حاضر" || status === "متأخر";
    if (filterMode === "absent") return status === "غائب" || status === "مبرر";
    return true;
  });

  return (
    <div ref={scrollRef} style={{ direction: "rtl", paddingBottom: 110, overflowY: "auto", height: "100%" }} className="fade-in">
      {/* QR Scanner Full Modal */}
      {showQR && (
        <QRScannerView
          onScanComplete={handleScanComplete}
          onClose={() => setShowQR(false)}
          players={players}
          sessionPlayers={sessionPlayers}
          trainingInfo={selectedTraining ? `${selectedTraining.teams?.team_name || "الفريق"} — ${fmt(selectedTraining.date)}` : ""}
          selectedTraining={selectedTraining}
        />
      )}

      {/* Saving Overlay */}
      {isSaving && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(6,8,16,0.88)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16
        }}>
          <Loader2 size={44} color={C.green} className="spin" />
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 900 }}>جاري الحفظ وإرسال التقرير للأدمن...</p>
          <p style={{ color: C.muted, fontSize: 12 }}>يتم تسجيل الحضور في قاعدة البيانات وإشعار الإدارة</p>
        </div>
      )}

      {/* Sticky Header */}
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>تسجيل الحضور</h2>
          <button
            onClick={() => setShowQR(true)}
            style={{
              background: "linear-gradient(135deg, #059669, #10b981)",
              border: "none", borderRadius: 12, padding: "7px 14px",
              color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
            }}
          >
            <Camera size={15} /> فتح كاميرا QR
          </button>
        </div>

        {/* Training Selector */}
        {trainings.length > 0 ? (
          <select
            value={selectedTraining?.training_id || ""}
            onChange={e => {
              const t = trainings.find(t => t.training_id === Number(e.target.value));
              if (t) handleSelectTraining(t);
            }}
            style={{
              width: "100%", background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "11px 14px", color: "#fff", fontSize: 13, outline: "none",
              cursor: "pointer", marginBottom: 10
            }}
          >
            {trainings.map(t => {
              const teamName = t.teams?.team_name || "فريق";
              return (
                <option key={t.training_id} value={t.training_id} style={{ background: "#18181b" }}>
                  {fmt(t.date)} — {teamName} {t.start_time ? `(${t.start_time})` : ""}
                </option>
              );
            })}
          </select>
        ) : (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#fca5a5", fontSize: 12 }}>لا توجد حصص تدريبية مبرمجة</span>
            <button
              onClick={() => onNavigate && onNavigate("training")}
              style={{ background: C.green, border: "none", borderRadius: 8, padding: "5px 12px", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
            >
              برمجة تدريب ➕
            </button>
          </div>
        )}

        {/* Attendance Stats Cards */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { v: presentCount, l: "حاضر", c: C.green },
            { v: absentCount, l: "غائب", c: C.red },
            { v: lateCount, l: "متأخر", c: C.amber },
            { v: excusedCount, l: "مبرر", c: C.blue },
            { v: currentTargetList.length, l: "الإجمالي", c: C.muted }
          ].map(s => (
            <div key={s.l} style={{ flex: 1, textAlign: "center", background: `${s.c}12`, borderRadius: 10, padding: "6px 0", border: `1px solid ${s.c}20` }}>
              <p style={{ color: s.c, fontSize: 15, fontWeight: 900 }}>{s.v}</p>
              <p style={{ color: C.muted, fontSize: 9, marginTop: 1 }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* View Mode Tabs */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={() => setTab("report")}
            className="btn-press"
            style={{
              flex: 1,
              background: tab === "report" ? `${C.green}20` : "transparent",
              border: `1px solid ${tab === "report" ? C.green : C.border}`,
              borderRadius: 10, padding: "9px 0",
              color: tab === "report" ? C.green : C.muted,
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            <FileText size={15} /> تقرير الحصة
          </button>
          <button
            onClick={() => { setTab("qr"); setShowQR(true); }}
            className="btn-press"
            style={{
              flex: 1,
              background: tab === "qr" ? "rgba(99,102,241,0.18)" : "transparent",
              border: `1px solid ${tab === "qr" ? C.purple : C.border}`,
              borderRadius: 10, padding: "9px 0",
              color: tab === "qr" ? C.purple : C.muted,
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              position: "relative"
            }}
          >
            <QrCode size={15} /> مسح QR
            {qrScannedCount > 0 && (
              <span style={{
                position: "absolute", top: -5, left: -5,
                background: C.green, color: "#fff", fontSize: 9, fontWeight: 900,
                borderRadius: "50%", width: 18, height: 18,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>{qrScannedCount}</span>
            )}
          </button>
          <button
            onClick={() => setTab("manual")}
            className="btn-press"
            style={{
              flex: 1,
              background: tab === "manual" ? `${C.blue}20` : "transparent",
              border: `1px solid ${tab === "manual" ? C.blue : C.border}`,
              borderRadius: 10, padding: "9px 0",
              color: tab === "manual" ? C.blue : C.muted,
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            <ClipboardCheck size={15} /> تحضير يدوي
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: "12px 16px" }}>
        {/* Success Banner */}
        {savedMsg && (
          <div style={{
            background: "rgba(16,185,129,0.14)", border: "1.5px solid rgba(16,185,129,0.5)",
            borderRadius: 16, padding: "16px", marginBottom: 14, textAlign: "center"
          }} className="slide-up">
            <CheckCircle size={30} color={C.green} style={{ display: "block", margin: "0 auto 8px" }} />
            <p style={{ color: C.green, fontSize: 14, fontWeight: 900 }}>{savedMsg}</p>
            <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>وصل التقرير إلى قسم الإدارة والأدمن بنجاح ✓</p>
          </div>
        )}

        {/* Error Banner */}
        {saveError && (
          <div style={{
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: 14, padding: "12px 14px", marginBottom: 14,
            color: "#f87171", fontSize: 12, fontWeight: 700
          }}>
            {saveError}
            <button onClick={handleSave} style={{ marginRight: 10, background: "none", border: "none", color: C.green, fontSize: 12, fontWeight: 800, cursor: "pointer", textDecoration: "underline" }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* ══════════ TAB: REPORT VIEW ══════════ */}
        {tab === "report" && (
          <div>
            {/* Session Summary Card */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
              borderRadius: 18, padding: 14, marginBottom: 14
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: C.green, fontSize: 13, fontWeight: 900 }}>
                  📋 تقرير الحصة: {selectedTraining?.teams?.team_name || "الفريق"}
                </span>
                <span style={{ color: C.muted, fontSize: 11 }}>
                  {selectedTraining?.date ? fmt(selectedTraining.date) : ""}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden", margin: "10px 0 6px" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${currentTargetList.length > 0 ? (presentCount / currentTargetList.length) * 100 : 0}%`,
                  background: "linear-gradient(to right, #10b981, #059669)",
                  transition: "width 0.4s ease"
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted }}>
                <span>نسبة الحضور: {currentTargetList.length > 0 ? Math.round((presentCount / currentTargetList.length) * 100) : 0}%</span>
                <span>{presentCount} حاضر / {currentTargetList.length} إجمالي</span>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setFilterMode("all")}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 10,
                  background: filterMode === "all" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${filterMode === "all" ? "#fff" : C.border}`,
                  color: filterMode === "all" ? "#fff" : C.muted,
                  fontSize: 11, fontWeight: 800, cursor: "pointer"
                }}
              >
                الكل ({currentTargetList.length})
              </button>
              <button
                onClick={() => setFilterMode("present")}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 10,
                  background: filterMode === "present" ? `${C.green}20` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${filterMode === "present" ? C.green : C.border}`,
                  color: filterMode === "present" ? C.green : C.muted,
                  fontSize: 11, fontWeight: 800, cursor: "pointer"
                }}
              >
                ✅ الحاضرون ({presentCount})
              </button>
              <button
                onClick={() => setFilterMode("absent")}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 10,
                  background: filterMode === "absent" ? `${C.red}20` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${filterMode === "absent" ? C.red : C.border}`,
                  color: filterMode === "absent" ? "#fca5a5" : C.muted,
                  fontSize: 11, fontWeight: 800, cursor: "pointer"
                }}
              >
                ❌ الغائبون ({absentCount})
              </button>
            </div>

            {/* Scanned / Players List */}
            {filteredPlayers.map((p: any) => {
              const cfg = getPosConfig(p.position);
              const status = attendance[p.player_id] || "غائب";
              const time = scanTimes[p.player_id];
              const isPresent = status === "حاضر";
              const isAbsent = status === "غائب";

              return (
                <div
                  key={p.player_id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${
                      isPresent ? "rgba(16,185,129,0.3)" :
                      isAbsent ? "rgba(239,68,68,0.25)" :
                      status === "متأخر" ? "rgba(245,158,11,0.25)" : C.border
                    }`,
                    borderRadius: 16, padding: "10px 14px", marginBottom: 8
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, background: cfg.bg,
                    border: `1.5px solid ${cfg.color}40`, display: "flex", alignItems: "center",
                    justifyContent: "center", overflow: "hidden", flexShrink: 0
                  }}>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.name}
                      </p>
                      {p.jersey_number && (
                        <span style={{ background: `${cfg.color}20`, color: cfg.color, fontSize: 9, fontWeight: 800, borderRadius: 5, padding: "1px 5px" }}>
                          #{p.jersey_number}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      <span style={{ color: C.muted, fontSize: 10 }}>{p.position || "لاعب"}</span>
                      {time && isPresent && (
                        <span style={{ color: C.green, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }} dir="ltr">
                          <Clock size={10} /> {time}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Status badges */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {isPresent ? (
                      <div style={{ background: "rgba(16,185,129,0.18)", border: `1px solid ${C.green}40`, color: C.green, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 800 }}>
                        حاضر ✓
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => setPlayerStatus(p.player_id, "حاضر")}
                          style={{ background: `${C.green}18`, border: `1px solid ${C.green}40`, color: C.green, borderRadius: 8, padding: "5px 8px", fontSize: 10, fontWeight: 800, cursor: "pointer" }}
                        >
                          حاضر
                        </button>
                        <button
                          onClick={() => setPlayerStatus(p.player_id, "متأخر")}
                          style={{ background: `${C.amber}18`, border: `1px solid ${C.amber}40`, color: C.amber, borderRadius: 8, padding: "5px 8px", fontSize: 10, fontWeight: 800, cursor: "pointer" }}
                        >
                          متأخر
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Big Action Button to Save & Send to Admin */}
            {currentTargetList.length > 0 && selectedTraining && (
              <div style={{ marginTop: 18 }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-press"
                  style={{
                    width: "100%",
                    background: isSaving ? "rgba(16,185,129,0.5)" : "linear-gradient(135deg, #059669, #10b981)",
                    border: "none", borderRadius: 16, padding: "16px 0",
                    color: "#fff", fontSize: 15, fontWeight: 900,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 8px 24px rgba(16,185,129,0.35)"
                  }}
                >
                  {isSaving ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                  {isSaving
                    ? "جاري الحفظ وإرسال التقرير..."
                    : `حفظ الحضور وإرسال التقرير للإدارة (${presentCount} حاضر / ${currentTargetList.length} إجمالي)`
                  }
                </button>
                <p style={{ color: C.muted, fontSize: 11, textAlign: "center", marginTop: 8 }}>
                  سيتم حفظ السجل في قاعدة البيانات وإرسال التقرير فوراً للوحة تحكم الأدمن
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB: MANUAL VIEW ══════════ */}
        {tab === "manual" && (
          <div>
            <p style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
              💡 اضغط على بطاقة اللاعب لتبديل الحالة (حاضر → غائب → متأخر → مبرر)
            </p>

            {currentTargetList.map((p: any) => {
              const cfg = getPosConfig(p.position);
              const status = attendance[p.player_id] || "غائب";
              return (
                <button
                  key={p.player_id}
                  onClick={() => toggleStatus(p.player_id)}
                  className="btn-press"
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${
                      status === "حاضر" ? "rgba(16,185,129,0.35)" :
                      status === "غائب" ? "rgba(239,68,68,0.25)" :
                      status === "متأخر" ? "rgba(245,158,11,0.25)" :
                      status === "مبرر" ? "rgba(59,130,246,0.25)" : C.border
                    }`,
                    borderRadius: 16, padding: "12px 14px", marginBottom: 8,
                    cursor: "pointer", textAlign: "right"
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, background: cfg.bg,
                    border: `1.5px solid ${cfg.color}40`, display: "flex", alignItems: "center",
                    justifyContent: "center", overflow: "hidden", flexShrink: 0
                  }}>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 800 }}>{p.name}</p>
                    <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{p.position || "لاعب"}{p.jersey_number ? ` • #${p.jersey_number}` : ""}</p>
                  </div>
                  <div>
                    {status === "حاضر" && <div style={{ background: "rgba(16,185,129,0.2)", color: C.green, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800 }}>حاضر ✓</div>}
                    {status === "غائب" && <div style={{ background: "rgba(239,68,68,0.2)", color: C.red, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800 }}>غائب ✗</div>}
                    {status === "متأخر" && <div style={{ background: "rgba(245,158,11,0.2)", color: C.amber, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800 }}>متأخر ~</div>}
                    {status === "مبرر" && <div style={{ background: "rgba(59,130,246,0.2)", color: C.blue, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800 }}>عذر 📝</div>}
                  </div>
                </button>
              );
            })}

            {currentTargetList.length > 0 && selectedTraining && (
              <div style={{ marginTop: 18 }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-press"
                  style={{
                    width: "100%",
                    background: isSaving ? "rgba(16,185,129,0.5)" : "linear-gradient(135deg,#059669,#10b981)",
                    border: "none", borderRadius: 16, padding: 16,
                    color: "#fff", fontSize: 15, fontWeight: 900,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 8px 24px rgba(16,185,129,0.3)"
                  }}
                >
                  {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                  {isSaving ? "جاري الحفظ والإرسال..." : `حفظ الحضور وإرسال للإدارة (${presentCount} حاضر)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Training Screen ──────────────────────────────────────────────────────────
function TrainingScreen({ coachData, user, onNavigate }: any) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    team_id: "",
    date: todayStr,
    start_time: "17:00",
    end_time: "18:30",
    location: "ملعب الأكاديمية",
    theme: "technical",
    notes: "",
  });

  const themes = [
    { id: "technical", label: "تقني (Technical)", icon: "⚽", color: C.blue },
    { id: "tactical", label: "تكتيكي (Tactical)", icon: "📋", color: C.purple },
    { id: "physical", label: "بدني (Physical)", icon: "⚡", color: "#f43f5e" },
    { id: "mental", label: "ذهني (Mental)", icon: "🧠", color: C.green },
    { id: "match", label: "مباراة (Match)", icon: "🏆", color: C.amber },
  ];

  const daysOfWeek = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const getDayName = (dStr: string) => {
    if (!dStr) return "";
    const day = new Date(dStr).getDay();
    return daysOfWeek[day] || "";
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load teams
      const { data: teamsData } = await supabase.from("teams").select("*");
      const coachId = coachData?.coach_id || user?.coach_id;
      const coachCategory = coachData?.category || user?.category;
      const coachTeamId = coachData?.team_id || user?.team_id;

      let myTeams = teamsData || [];
      if (coachId || coachCategory) {
        const filtered = myTeams.filter((t: any) =>
          (coachId && Number(t.coach_id) === Number(coachId)) ||
          (coachTeamId && Number(t.team_id) === Number(coachTeamId)) ||
          (coachCategory && t.category === coachCategory)
        );
        if (filtered.length > 0) myTeams = filtered;
      }
      setTeams(myTeams);

      if (myTeams.length > 0 && !formData.team_id) {
        setFormData(prev => ({ ...prev, team_id: String(myTeams[0].team_id) }));
      }

      // 2. Load trainings
      const { data: rawTrainings } = await supabase
        .from("training")
        .select("*")
        .order("date", { ascending: false })
        .limit(50);

      const myTeamIds = myTeams.map((t: any) => Number(t.team_id));
      const teamsMap = new Map((teamsData || []).map((tm: any) => [Number(tm.team_id), tm]));
      const enrichedTrainings = (rawTrainings || [])
        .filter((tr: any) =>
          (tr.team_id && myTeamIds.includes(Number(tr.team_id))) ||
          (coachCategory && tr.category === coachCategory) ||
          (coachId && Number(tr.coach_id) === Number(coachId))
        )
        .map((tr: any) => ({
          ...tr,
          teams: teamsMap.get(Number(tr.team_id)) || null
        }));
      setSessions(enrichedTrainings);
    } catch (err) {
      console.error("Failed to load training data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, coachData]);

  const handleSaveSession = async () => {
    if (!formData.date) {
      alert("يرجى تحديد تاريخ الحصة التدريبية");
      return;
    }

    let teamId: number | null = null;
    if (formData.team_id) {
      teamId = Number(formData.team_id);
    } else if (teams.length > 0) {
      teamId = teams[0].team_id;
    }

    if (!teamId) {
      alert("يرجى اختيار الفريق/الفئة للحصة التدريبية");
      return;
    }

    setIsSaving(true);
    try {
      const coachId = coachData?.coach_id || user?.coach_id || null;
      const notesPayload = `${formData.theme}|${formData.notes || ""}`;

      const payload: any = {
        team_id: teamId,
        coach_id: coachId,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location || "ملعب الأكاديمية",
        notes: notesPayload,
      };

      if (editingSession) {
        const { error } = await supabase
          .from("training")
          .update(payload)
          .eq("training_id", editingSession.training_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("training").insert([payload]);
        if (error) throw error;
      }

      await loadData();
      setShowAdd(false);
      setEditingSession(null);
      setFormData({
        team_id: teams.length > 0 ? String(teams[0].team_id) : "",
        date: todayStr,
        start_time: "17:00",
        end_time: "18:30",
        location: "ملعب الأكاديمية",
        theme: "technical",
        notes: "",
      });
    } catch (e: any) {
      console.error("Save training error:", e);
      alert("خطأ أثناء حفظ الحصة التدريبية: " + (e.message || "تأكد من صحة البيانات"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (trainingId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحصة التدريبية؟")) return;
    try {
      // First delete any linked attendance records
      await supabase.from("attendance").delete().eq("training_id", trainingId);
      const { error } = await supabase.from("training").delete().eq("training_id", trainingId);
      if (error) throw error;
      await loadData();
    } catch (e: any) {
      alert("فشل الحذف: " + (e.message || "خطأ"));
    }
  };

  const handleEditClick = (s: any) => {
    setEditingSession(s);
    const parts = (s.notes || "").split("|");
    const theme = parts[0] || "technical";
    const notes = parts.slice(1).join("|") || (parts.length === 1 ? parts[0] : "");
    setFormData({
      team_id: String(s.team_id || ""),
      date: s.date || todayStr,
      start_time: s.start_time || "17:00",
      end_time: s.end_time || "18:30",
      location: s.location || "ملعب الأكاديمية",
      theme: themes.some(t => t.id === theme) ? theme : "technical",
      notes: notes,
    });
    setShowAdd(true);
  };

  const getTheme = (notes: string) => {
    const id = (notes || "").split("|")[0];
    return themes.find(t => t.id === id) || themes[0];
  };

  const getCleanNotes = (notes: string) => {
    if (!notes) return "";
    const parts = notes.split("|");
    if (parts.length > 1) return parts.slice(1).join("|");
    if (themes.some(t => t.id === parts[0])) return "";
    return notes;
  };

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      {/* Top Header */}
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>برنامج التدريبات</h2>
            <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{sessions.length} حصة مسجلة</p>
          </div>
          <button
            onClick={() => {
              if (showAdd) {
                setShowAdd(false);
                setEditingSession(null);
              } else {
                setEditingSession(null);
                setShowAdd(true);
              }
            }}
            className="btn-press"
            style={{
              background: showAdd ? "rgba(239,68,68,0.15)" : `${C.green}18`,
              border: `1px solid ${showAdd ? "rgba(239,68,68,0.3)" : `${C.green}40`}`,
              borderRadius: 12,
              padding: "8px 16px",
              color: showAdd ? C.red : C.green,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            {showAdd ? <X size={15} /> : <Plus size={15} />}
            {showAdd ? "إلغاء" : "برمجة تدريب"}
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Add/Edit Modal Form */}
        {showAdd && (
          <div style={{ background: "rgba(16,185,129,0.06)", border: `1px solid ${C.green}30`, borderRadius: 20, padding: 18, marginBottom: 18, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }} className="fade-in">
            <p style={{ color: C.green, fontSize: 14, fontWeight: 900, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              {editingSession ? "✏️ تعديل حصة تدريبية" : "➕ برمجة حصة تدريبية جديدة"}
            </p>

            {/* Team selection */}
            {teams.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: "#d1d5db", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>الفريق / الفئة *</label>
                <select
                  value={formData.team_id}
                  onChange={e => setFormData(p => ({ ...p, team_id: e.target.value }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", color: "#fff", fontSize: 13, outline: "none" }}
                >
                  {teams.map(t => (
                    <option key={t.team_id} value={t.team_id} style={{ background: "#18181b" }}>
                      {t.team_name} {t.category ? `(${t.category})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date & Time Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ color: "#d1d5db", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>التاريخ *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }}
                />
              </div>
              <div>
                <label style={{ color: "#d1d5db", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>وقت البداية</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }}
                />
              </div>
            </div>

            {/* Location & End time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ color: "#d1d5db", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>وقت النهاية</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }}
                />
              </div>
              <div>
                <label style={{ color: "#d1d5db", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>المكان / الملعب</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                  placeholder="ملعب الأكاديمية"
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }}
                />
              </div>
            </div>

            {/* Theme Selector */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#d1d5db", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 8 }}>محور التدريب (Theme)</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {themes.map(t => {
                  const active = formData.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, theme: t.id }))}
                      className="btn-press"
                      style={{
                        padding: "6px 12px",
                        borderRadius: 20,
                        border: `1.5px solid ${active ? t.color : "rgba(255,255,255,0.1)"}`,
                        background: active ? `${t.color}22` : "rgba(255,255,255,0.04)",
                        color: active ? t.color : C.muted,
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      {t.icon} {t.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#d1d5db", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>أهداف ومحتوى الحصة</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="مثال: تمارين الاستحواذ والضغط العالي، إنهاء الهجمات..."
                style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", resize: "vertical", minHeight: 70 }}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSaveSession}
              disabled={isSaving}
              className="btn-press"
              style={{
                width: "100%",
                background: isSaving ? "rgba(16,185,129,0.5)" : "linear-gradient(135deg,#059669,#10b981)",
                border: "none",
                borderRadius: 14,
                padding: 14,
                color: "#fff",
                fontSize: 14,
                fontWeight: 900,
                cursor: isSaving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 8px 24px rgba(16,185,129,0.3)"
              }}
            >
              {isSaving ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
              {isSaving ? "جاري الحفظ..." : editingSession ? "حفظ التعديلات" : "تأكيد وبرمجة الحصة"}
            </button>
          </div>
        )}

        {/* List of sessions */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 50 }}>
            <Loader2 size={32} color={C.green} className="spin" style={{ display: "block", margin: "0 auto" }} />
            <p style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>جاري تحميل جدول التدريبات...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Calendar size={32} color={C.muted} />
            </div>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>لا توجد تدريبات مسجلة</p>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>اضغط على "برمجة تدريب" لإضافة أول حصة تدريبية</p>
          </div>
        ) : (
          sessions.map(s => {
            const theme = getTheme(s.notes);
            const notesText = getCleanNotes(s.notes);
            const isUpcoming = new Date(s.date) >= new Date(new Date().setHours(0, 0, 0, 0));
            const dayName = getDayName(s.date);
            const teamDisplay = s.teams?.team_name || (teams.find(t => t.team_id === s.team_id)?.team_name) || "الفريق";

            return (
              <div
                key={s.training_id}
                style={{
                  background: `${theme.color}07`,
                  border: `1px solid ${theme.color}25`,
                  borderRadius: 18,
                  padding: "16px 16px",
                  marginBottom: 12,
                  position: "relative"
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ background: `${theme.color}18`, color: theme.color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>
                        {theme.icon} {theme.label.split(" ")[0]}
                      </span>
                      <span style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8 }}>
                        {teamDisplay}
                      </span>
                    </div>
                    <p style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 6 }}>
                      {dayName} {fmt(s.date)}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ background: isUpcoming ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)", border: `1px solid ${isUpcoming ? C.green : C.muted}40`, borderRadius: 10, padding: "4px 10px" }}>
                      <span style={{ color: isUpcoming ? C.green : C.muted, fontSize: 10, fontWeight: 800 }}>
                        {isUpcoming ? "قادمة ⏳" : "منتهية ✓"}
                      </span>
                    </div>
                    {/* Action buttons */}
                    <button
                      onClick={() => handleEditClick(s)}
                      className="btn-press"
                      style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 8, padding: 6, color: C.muted, cursor: "pointer" }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(s.training_id)}
                      className="btn-press"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 6, color: C.red, cursor: "pointer" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Timing & Location */}
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: notesText ? 8 : 0 }}>
                  {(s.start_time || s.time) && (
                    <span style={{ color: "#9ca3af", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                      <Clock size={13} color={C.green} />
                      {s.start_time || s.time} {s.end_time ? `→ ${s.end_time}` : ""}
                    </span>
                  )}
                  {s.location && (
                    <span style={{ color: "#9ca3af", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={13} color={C.blue} />
                      {s.location}
                    </span>
                  )}
                </div>

                {/* Notes content */}
                {notesText && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ color: "#d1d5db", fontSize: 12, lineHeight: 1.5 }}>{notesText}</p>
                  </div>
                )}

                {/* Quick Attendance action */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate("attendance");
                    }}
                    className="btn-press"
                    style={{
                      background: `${C.green}15`,
                      border: `1px solid ${C.green}35`,
                      borderRadius: 10,
                      padding: "6px 14px",
                      color: C.green,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <QrCode size={13} /> تسجيل حضور هذه الحصة
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Notebook Screen ──────────────────────────────────────────────────────────
function NotebookScreen({ players, coachData }: any) {
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("technical");
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");

  const noteTypes = [
    { id: "technical", label: "تقني", color: C.blue, icon: "⚽" },
    { id: "tactical", label: "تكتيكي", color: C.purple, icon: "📋" },
    { id: "behavior", label: "سلوك", color: C.green, icon: "🧠" },
    { id: "improvement", label: "تطوير", color: C.amber, icon: "📈" },
  ];

  const filtered = players.filter((p: any) => !query || p.name?.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (selectedPlayer) loadNotes();
  }, [selectedPlayer]);

  const loadNotes = async () => {
    if (!selectedPlayer) return;
    const { data } = await supabase.from("coach_notes").select("*").eq("player_id", selectedPlayer.player_id).order("created_at", { ascending: false });
    setNotes(data || []);
  };

  const saveNote = async () => {
    if (!newNote.trim() || !selectedPlayer) return;
    setIsSaving(true);
    try {
      await supabase.from("coach_notes").insert([{
        player_id: selectedPlayer.player_id,
        note_type: noteType,
        content: newNote,
        coach_id: coachData?.coach_id,
      }]);
      setNewNote("");
      loadNotes();
    } catch { }
    setIsSaving(false);
  };

  if (selectedPlayer) {
    const cfg = getPosConfig(selectedPlayer.position);
    return (
      <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
        <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => setSelectedPlayer(null)} className="btn-press" style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: "6px 14px", color: C.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <ChevronRight size={15} /> رجوع
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cfg.emoji}</div>
            <div>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>{selectedPlayer.name}</p>
              <p style={{ color: C.muted, fontSize: 11 }}>الدفتر البيداغوجي • {notes.length} ملاحظة</p>
            </div>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {/* Add note */}
          <div style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}25`, borderRadius: 16, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {noteTypes.map(t => (
                <button key={t.id} onClick={() => setNoteType(t.id)} className="btn-press"
                  style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${noteType === t.id ? t.color : C.border}`, background: noteType === t.id ? `${t.color}18` : "transparent", color: noteType === t.id ? t.color : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="أضف ملاحظة عن اللاعب..."
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", resize: "vertical", minHeight: 80 }} />
            <button onClick={saveNote} disabled={isSaving || !newNote.trim()} className="btn-press"
              style={{ marginTop: 10, background: "linear-gradient(135deg,#b45309,#f59e0b)", border: "none", borderRadius: 12, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} حفظ الملاحظة
            </button>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? <EmptyState icon={<BookOpen size={36} />} text="لا توجد ملاحظات بعد" /> : (
            notes.map((n: any, i: number) => {
              const t = noteTypes.find(nt => nt.id === n.note_type) || noteTypes[0];
              return (
                <div key={i} style={{ background: `${t.color}08`, border: `1px solid ${t.color}20`, borderRadius: 14, padding: 13, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ background: `${t.color}18`, color: t.color, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{t.icon} {t.label}</span>
                    <span style={{ color: C.muted, fontSize: 10 }}>{fmt(n.created_at)}</span>
                  </div>
                  <p style={{ color: C.text, fontSize: 13 }}>{n.content}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginBottom: 10 }}>الدفتر البيداغوجي</h2>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث عن لاعب..."
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 36px 9px 14px", color: "#fff", fontSize: 13, outline: "none" }} />
        </div>
      </div>
      <div style={{ padding: "10px 16px" }}>
        {filtered.map((p: any) => {
          const cfg = getPosConfig(p.position);
          return (
            <button key={p.player_id} onClick={() => setSelectedPlayer(p)} className="btn-press"
              style={{ width: "100%", textAlign: "right", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cfg.emoji}</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{p.name}</p>
                <p style={{ color: C.muted, fontSize: 11 }}>{cfg.label}{p.jersey_number ? ` • #${p.jersey_number}` : ""}</p>
              </div>
              <BookOpen size={16} color={C.amber} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Matches Screen ───────────────────────────────────────────────────────────
function MatchesScreen({ coachData, user, coachTeams }: any) {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.from("matches").select("*").order("match_date", { ascending: false });
        const coachId = coachData?.coach_id || user?.coach_id;
        const coachCat = coachData?.category || user?.category;
        const myTeamIds = (coachTeams || []).map((t: any) => Number(t.team_id));

        const myMatches = (data || []).filter((m: any) =>
          (m.team_id && myTeamIds.includes(Number(m.team_id))) ||
          (coachCat && m.category === coachCat) ||
          (coachId && Number(m.coach_id) === Number(coachId))
        );
        setMatches(myMatches);
      } catch { }
      setIsLoading(false);
    };
    load();
  }, [coachData, user, coachTeams]);

  const now = new Date();
  const filtered = matches.filter(m => {
    if (filter === "upcoming") return new Date(m.match_date) >= now;
    if (filter === "past") return new Date(m.match_date) < now;
    return true;
  });

  const getResult = (m: any) => {
    if (m.home_score == null || m.away_score == null) return null;
    if (m.home_score > m.away_score) return { text: "فوز", color: C.green };
    if (m.home_score < m.away_score) return { text: "خسارة", color: C.red };
    return { text: "تعادل", color: C.amber };
  };

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginBottom: 10 }}>مركز المنافسات</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "upcoming", "past"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn-press"
              style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: `1px solid ${filter === f ? "#e11d48" : C.border}`, background: filter === f ? "rgba(225,29,72,0.15)" : "transparent", color: filter === f ? "#e11d48" : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {f === "all" ? "الكل" : f === "upcoming" ? "القادمة" : "المنتهية"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={30} color="#e11d48" className="spin" style={{ display: "block", margin: "0 auto" }} /></div>
        ) : filtered.length === 0 ? <EmptyState icon={<Swords size={36} />} text="لا توجد مباريات" /> : (
          filtered.map(m => {
            const result = getResult(m);
            const isUpcoming = new Date(m.match_date) >= now;
            return (
              <div key={m.match_id || m.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${result ? (result.color + "30") : C.border}`, borderRadius: 18, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={13} color={C.muted} />
                    <span style={{ color: C.muted, fontSize: 11 }}>{fmt(m.match_date)}</span>
                  </div>
                  {result ? (
                    <span style={{ background: `${result.color}18`, color: result.color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>{result.text}</span>
                  ) : (
                    <span style={{ background: "rgba(99,102,241,0.15)", color: C.purple, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>قادمة</span>
                  )}
                </div>

                {/* Score display */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <p style={{ color: C.text, fontSize: 14, fontWeight: 800 }}>{m.home_team || "الفريق الرئيسي"}</p>
                    <p style={{ color: C.muted, fontSize: 10 }}>استضافة</p>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: "10px 20px", textAlign: "center", minWidth: 80 }}>
                    {m.home_score != null ? (
                      <p style={{ color: "#fff", fontSize: 24, fontWeight: 900 }}>{m.home_score} - {m.away_score}</p>
                    ) : (
                      <p style={{ color: C.muted, fontSize: 18, fontWeight: 700 }}>VS</p>
                    )}
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={{ color: C.text, fontSize: 14, fontWeight: 800 }}>{m.away_team || "الخصم"}</p>
                    <p style={{ color: C.muted, fontSize: 10 }}>زيارة</p>
                  </div>
                </div>

                {m.venue && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                    <MapPin size={11} color={C.muted} />
                    <span style={{ color: C.muted, fontSize: 11 }}>{m.venue}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Performance Screen ───────────────────────────────────────────────────────
function PerformanceScreen({ players }: any) {
  const [statsData, setStatsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<"goals" | "assists" | "matches">("goals");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (players.length > 0) {
          const ids = players.map((p: any) => p.player_id);
          const { data } = await supabase.from("player_stats").select("*").in("player_id", ids);
          setStatsData(data || []);
        }
      } catch { }
      setIsLoading(false);
    };
    load();
  }, [players]);

  const merged = players.map((p: any) => ({
    ...p,
    ...(statsData.find(s => s.player_id === p.player_id) || {})
  })).sort((a: any, b: any) => (b[sort] || 0) - (a[sort] || 0));

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginBottom: 10 }}>تحليل الأداء</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {(["goals", "assists", "matches"] as const).map(s => (
            <button key={s} onClick={() => setSort(s)} className="btn-press"
              style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: `1px solid ${sort === s ? C.purple : C.border}`, background: sort === s ? "rgba(139,92,246,0.15)" : "transparent", color: sort === s ? C.purple : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {s === "goals" ? "🎯 أهداف" : s === "assists" ? "🔗 تمريرات" : "⚽ مباريات"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 16px" }}>
        {isLoading ? <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={30} color={C.purple} className="spin" style={{ display: "block", margin: "0 auto" }} /></div> : (
          merged.map((p: any, i: number) => {
            const cfg = getPosConfig(p.position);
            const val = p[sort] || 0;
            const max = Math.max(...merged.map((x: any) => x[sort] || 0), 1);
            return (
              <div key={p.player_id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 10, background: i < 3 ? `${C.amber}20` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: i < 3 ? C.amber : C.muted, fontSize: 12, fontWeight: 900 }}>#{i + 1}</span>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{cfg.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{p.name}</p>
                    <p style={{ color: C.muted, fontSize: 10 }}>{cfg.label}</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: C.purple, fontSize: 20, fontWeight: 900 }}>{val}</p>
                    <p style={{ color: C.muted, fontSize: 9 }}>{sort === "goals" ? "هدف" : sort === "assists" ? "تمريرة" : "مباراة"}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(val / max) * 100}%`, background: `linear-gradient(to left,${C.purple},${C.blue})`, borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Physical Screen ──────────────────────────────────────────────────────────
function PhysicalScreen({ players, coachData }: any) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ height: "", weight: "", sprint_40m: "", sprint_100m: "", vertical_jump: "", vo2_max: "", record_date: new Date().toISOString().split("T")[0] });
  const [isSaving, setIsSaving] = useState(false);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      if (players.length > 0) {
        const ids = players.map((p: any) => p.player_id);
        const { data } = await supabase.from("physical_metrics").select("*, players(name)").in("player_id", ids).order("record_date", { ascending: false });
        setMetrics(data || []);
      }
    } catch { }
    setIsLoading(false);
  };

  useEffect(() => { loadMetrics(); }, [players]);

  const handleSave = async () => {
    if (!selectedPlayer) return;
    setIsSaving(true);
    try {
      await supabase.from("physical_metrics").insert([{ player_id: selectedPlayer.player_id, ...form, height: Number(form.height) || null, weight: Number(form.weight) || null, sprint_40m: Number(form.sprint_40m) || null, sprint_100m: Number(form.sprint_100m) || null, vertical_jump: Number(form.vertical_jump) || null, vo2_max: Number(form.vo2_max) || null }]);
      loadMetrics();
      setShowAdd(false);
      setSelectedPlayer(null);
    } catch (e: any) { alert("فشل: " + e.message); }
    setIsSaving(false);
  };

  const playerMetrics = (pid: number) => metrics.filter(m => m.player_id === pid)[0];

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>القياسات البدنية</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-press"
            style={{ background: showAdd ? "rgba(239,68,68,0.15)" : `${C.amber}18`, border: `1px solid ${showAdd ? "rgba(239,68,68,0.3)" : `${C.amber}40`}`, borderRadius: 12, padding: "7px 14px", color: showAdd ? C.red : C.amber, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            {showAdd ? <X size={14} /> : <Plus size={14} />} {showAdd ? "إلغاء" : "إضافة"}
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* Add form */}
        {showAdd && (
          <div style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}25`, borderRadius: 18, padding: 16, marginBottom: 16 }} className="fade-in">
            <p style={{ color: C.amber, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>📏 إضافة قياس بدني</p>
            <select value={selectedPlayer?.player_id || ""} onChange={e => setSelectedPlayer(players.find((p: any) => p.player_id === Number(e.target.value)))}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 10 }}>
              <option value="">اختر اللاعب</option>
              {players.map((p: any) => <option key={p.player_id} value={p.player_id} style={{ background: "#18181b" }}>{p.name}</option>)}
            </select>
            <input type="date" value={form.record_date} onChange={e => setForm(prev => ({ ...prev, record_date: e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 10 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[{ k: "height", l: "الطول (سم)" }, { k: "weight", l: "الوزن (كغ)" }, { k: "sprint_40m", l: "عدو 40م (ث)" }, { k: "sprint_100m", l: "عدو 100م (ث)" }, { k: "vertical_jump", l: "القفز (سم)" }, { k: "vo2_max", l: "VO₂ Max" }].map(f => (
                <div key={f.k}>
                  <label style={{ color: C.muted, fontSize: 10, display: "block", marginBottom: 4 }}>{f.l}</label>
                  <input type="number" value={(form as any)[f.k]} onChange={e => setForm(prev => ({ ...prev, [f.k]: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 10px", color: "#fff", fontSize: 13, outline: "none" }} />
                </div>
              ))}
            </div>
            <button onClick={handleSave} disabled={isSaving || !selectedPlayer} className="btn-press"
              style={{ marginTop: 12, background: "linear-gradient(135deg,#b45309,#f59e0b)", border: "none", borderRadius: 12, padding: "11px 0", width: "100%", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} حفظ
            </button>
          </div>
        )}

        {isLoading ? <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={30} color={C.amber} className="spin" style={{ display: "block", margin: "0 auto" }} /></div> : (
          players.map((p: any) => {
            const m = playerMetrics(p.player_id);
            const cfg = getPosConfig(p.position);
            return (
              <div key={p.player_id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: m ? 10 : 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{cfg.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{p.name}</p>
                    <p style={{ color: C.muted, fontSize: 10 }}>{m ? `آخر قياس: ${fmt(m.record_date)}` : "لا توجد قياسات"}</p>
                  </div>
                  {!m && <span style={{ color: C.dim, fontSize: 11 }}>—</span>}
                </div>
                {m && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {[{ l: "الطول", v: m.height, u: "سم" }, { l: "الوزن", v: m.weight, u: "كغ" }, { l: "40م", v: m.sprint_40m, u: "ث" }].filter(x => x.v).map(x => (
                      <div key={x.l} style={{ background: `${C.amber}10`, borderRadius: 10, padding: "6px 8px", textAlign: "center" }}>
                        <p style={{ color: C.amber, fontSize: 14, fontWeight: 900 }}>{x.v}<span style={{ fontSize: 9, color: C.muted }}>{x.u}</span></p>
                        <p style={{ color: C.muted, fontSize: 9 }}>{x.l}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Medical Screen ───────────────────────────────────────────────────────────
function MedicalScreen({ players }: any) {
  const [injuries, setInjuries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "history">("active");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (players.length > 0) {
          const ids = players.map((p: any) => p.player_id);
          const { data } = await supabase.from("injuries").select("*, players(name,position)").in("player_id", ids).order("injury_date", { ascending: false });
          setInjuries(data || []);
        }
      } catch { }
      setIsLoading(false);
    };
    load();
  }, [players]);

  const active = injuries.filter(i => i.status === "active" || !i.return_date || new Date(i.return_date) > new Date());
  const history = injuries.filter(i => i.return_date && new Date(i.return_date) <= new Date());
  const list = tab === "active" ? active : history;

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginBottom: 10 }}>المتابعة الطبية</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("active")} className="btn-press"
            style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${tab === "active" ? "#f43f5e" : C.border}`, background: tab === "active" ? "rgba(244,63,94,0.12)" : "transparent", color: tab === "active" ? "#f43f5e" : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            🚑 نشطة ({active.length})
          </button>
          <button onClick={() => setTab("history")} className="btn-press"
            style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${tab === "history" ? C.green : C.border}`, background: tab === "history" ? `${C.green}12` : "transparent", color: tab === "history" ? C.green : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ✅ تعافي ({history.length})
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* Injured players summary */}
        {tab === "active" && active.length > 0 && (
          <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 14, padding: 12, marginBottom: 14 }}>
            <p style={{ color: "#f43f5e", fontSize: 12, fontWeight: 700 }}>⚠️ {active.length} لاعب مصاب حالياً</p>
          </div>
        )}

        {isLoading ? <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={30} color="#f43f5e" className="spin" style={{ display: "block", margin: "0 auto" }} /></div> :
          list.length === 0 ? <EmptyState icon={<Stethoscope size={36} />} text={tab === "active" ? "لا توجد إصابات نشطة ✅" : "لا يوجد سجل إصابات"} /> : (
            list.map(inj => {
              const playerName = inj.players?.name || "لاعب";
              const isActive = !inj.return_date || new Date(inj.return_date) > new Date();
              return (
                <div key={inj.injury_id} style={{ background: `rgba(${isActive ? "244,63,94" : "16,185,129"},0.05)`, border: `1px solid rgba(${isActive ? "244,63,94" : "16,185,129"},0.2)`, borderRadius: 16, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <p style={{ color: C.text, fontSize: 14, fontWeight: 800 }}>{playerName}</p>
                      <p style={{ color: isActive ? "#f43f5e" : C.green, fontSize: 12, fontWeight: 700, marginTop: 2 }}>{inj.injury_type || "إصابة"}</p>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ color: C.muted, fontSize: 10 }}>{fmt(inj.injury_date)}</p>
                      {inj.return_date && <p style={{ color: C.amber, fontSize: 10, marginTop: 3 }}>العودة: {fmt(inj.return_date)}</p>}
                    </div>
                  </div>
                  {inj.description && <p style={{ color: C.muted, fontSize: 12, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>{inj.description}</p>}
                  {inj.treatment && <p style={{ color: C.blue, fontSize: 11, marginTop: 5 }}>العلاج: {inj.treatment}</p>}
                </div>
              );
            })
          )
        }
      </div>
    </div>
  );
}

// ─── Evaluations Screen ───────────────────────────────────────────────────────
function EvaluationsScreen({ players, coachData }: any) {
  const [evals, setEvals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [scores, setScores] = useState({ technical_score: 5, tactical_score: 5, physical_score: 5, mental_score: 5 });
  const [evalNotes, setEvalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (players.length > 0) {
          const ids = players.map((p: any) => p.player_id);
          const { data } = await supabase.from("evaluations").select("*, players(name,position)").in("player_id", ids).order("evaluation_date", { ascending: false });
          setEvals(data || []);
        }
      } catch { }
      setIsLoading(false);
    };
    load();
  }, [players]);

  const handleSave = async () => {
    if (!selectedPlayer) return;
    setIsSaving(true);
    try {
      await supabase.from("evaluations").insert([{
        player_id: selectedPlayer.player_id,
        ...scores,
        notes: evalNotes,
        evaluation_date: new Date().toISOString().split("T")[0],
        coach_id: coachData?.coach_id,
      }]);
      const ids = players.map((p: any) => p.player_id);
      const { data } = await supabase.from("evaluations").select("*, players(name,position)").in("player_id", ids).order("evaluation_date", { ascending: false });
      setEvals(data || []);
      setShowAdd(false);
      setSelectedPlayer(null);
      setEvalNotes("");
      setScores({ technical_score: 5, tactical_score: 5, physical_score: 5, mental_score: 5 });
    } catch (e: any) { alert("فشل: " + e.message); }
    setIsSaving(false);
  };

  const ScoreSlider = ({ label, key, color }: { label: string; key: keyof typeof scores; color: string }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <label style={{ color: C.muted, fontSize: 12 }}>{label}</label>
        <span style={{ color, fontSize: 14, fontWeight: 900 }}>{scores[key]}/10</span>
      </div>
      <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${scores[key] * 10}%`, background: color, borderRadius: 3, transition: "width 0.2s" }} />
        <input type="range" min={1} max={10} value={scores[key]} onChange={e => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
      </div>
    </div>
  );

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>تقييمات اللاعبين</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-press"
            style={{ background: showAdd ? "rgba(239,68,68,0.15)" : `${C.amber}18`, border: `1px solid ${showAdd ? "rgba(239,68,68,0.3)" : `${C.amber}40`}`, borderRadius: 12, padding: "7px 14px", color: showAdd ? C.red : C.amber, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            {showAdd ? <X size={14} /> : <Plus size={14} />} {showAdd ? "إلغاء" : "تقييم جديد"}
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* Add form */}
        {showAdd && (
          <div style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}25`, borderRadius: 18, padding: 16, marginBottom: 16 }} className="fade-in">
            <select value={selectedPlayer?.player_id || ""} onChange={e => setSelectedPlayer(players.find((p: any) => p.player_id === Number(e.target.value)))}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 14 }}>
              <option value="">اختر اللاعب</option>
              {players.map((p: any) => <option key={p.player_id} value={p.player_id} style={{ background: "#18181b" }}>{p.name}</option>)}
            </select>
            <ScoreSlider label="التقنية" key="technical_score" color={C.blue} />
            <ScoreSlider label="التكتيك" key="tactical_score" color={C.purple} />
            <ScoreSlider label="اللياقة البدنية" key="physical_score" color={C.red} />
            <ScoreSlider label="القوة الذهنية" key="mental_score" color={C.green} />
            <textarea value={evalNotes} onChange={e => setEvalNotes(e.target.value)} placeholder="ملاحظات التقييم..."
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", resize: "vertical", minHeight: 70, marginTop: 4 }} />
            <button onClick={handleSave} disabled={isSaving || !selectedPlayer} className="btn-press"
              style={{ marginTop: 12, background: "linear-gradient(135deg,#b45309,#f59e0b)", border: "none", borderRadius: 12, padding: "11px 0", width: "100%", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {isSaving ? <Loader2 size={14} className="spin" /> : <Star size={14} />} حفظ التقييم
            </button>
          </div>
        )}

        {isLoading ? <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={30} color={C.amber} className="spin" style={{ display: "block", margin: "0 auto" }} /></div> :
          evals.length === 0 ? <EmptyState icon={<Star size={36} />} text="لا توجد تقييمات بعد" /> : (
            evals.map((ev: any, i: number) => {
              const avg = Math.round(((ev.technical_score || 0) + (ev.tactical_score || 0) + (ev.physical_score || 0) + (ev.mental_score || 0)) / 4 * 10) / 10;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <p style={{ color: C.text, fontSize: 14, fontWeight: 800 }}>{ev.players?.name || "لاعب"}</p>
                      <p style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{fmt(ev.evaluation_date)}</p>
                    </div>
                    <div style={{ textAlign: "center", background: `${C.amber}15`, border: `1px solid ${C.amber}30`, borderRadius: 12, padding: "6px 14px" }}>
                      <p style={{ color: C.amber, fontSize: 18, fontWeight: 900 }}>{avg}</p>
                      <p style={{ color: C.muted, fontSize: 9 }}>متوسط</p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[{ l: "تقني", v: ev.technical_score, c: C.blue }, { l: "تكتيكي", v: ev.tactical_score, c: C.purple }, { l: "بدني", v: ev.physical_score, c: C.red }, { l: "ذهني", v: ev.mental_score, c: C.green }].filter(s => s.v != null).map(s => (
                      <div key={s.l} style={{ background: `${s.c}10`, borderRadius: 10, padding: "7px 10px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: C.muted, fontSize: 11 }}>{s.l}</span>
                        <span style={{ color: s.c, fontWeight: 800, fontSize: 12 }}>{s.v}/10</span>
                      </div>
                    ))}
                  </div>
                  {ev.notes && <p style={{ color: C.muted, fontSize: 12, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>{ev.notes}</p>}
                </div>
              );
            })
          )
        }
      </div>
    </div>
  );
}

// ─── Leaderboard Screen ───────────────────────────────────────────────────────
function LeaderboardScreen({ players }: any) {
  const [statsData, setStatsData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<"goals" | "attendance" | "rating">("goals");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (players.length > 0) {
          const ids = players.map((p: any) => p.player_id);
          const [{ data: s }, { data: a }] = await Promise.all([
            supabase.from("player_stats").select("*").in("player_id", ids),
            supabase.from("attendance").select("player_id, status").in("player_id", ids),
          ]);
          setStatsData(s || []);
          setAttendanceData(a || []);
        }
      } catch { }
      setIsLoading(false);
    };
    load();
  }, [players]);

  const getAttRate = (pid: number) => {
    const recs = attendanceData.filter(a => a.player_id === pid);
    if (!recs.length) return 0;
    return Math.round((recs.filter(a => a.status === "present").length / recs.length) * 100);
  };

  const merged = players.map((p: any) => ({
    ...p,
    ...(statsData.find(s => s.player_id === p.player_id) || {}),
    att_rate: getAttRate(p.player_id),
  })).sort((a: any, b: any) => {
    if (sort === "goals") return (b.goals || 0) - (a.goals || 0);
    if (sort === "attendance") return b.att_rate - a.att_rate;
    return (b.rating || 0) - (a.rating || 0);
  });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      <div style={{ position: "sticky", top: 57, zIndex: 40, background: "rgba(6,8,16,0.98)", padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginBottom: 10 }}>ترتيب نجوم الأكاديمية</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {(["goals", "attendance", "rating"] as const).map(s => (
            <button key={s} onClick={() => setSort(s)} className="btn-press"
              style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: `1px solid ${sort === s ? C.amber : C.border}`, background: sort === s ? `${C.amber}15` : "transparent", color: sort === s ? C.amber : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {s === "goals" ? "⚽ أهداف" : s === "attendance" ? "📋 حضور" : "⭐ تقييم"}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {!isLoading && merged.length >= 3 && (
        <div style={{ padding: "20px 16px 4px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16 }}>
            {[merged[1], merged[0], merged[2]].map((p: any, i) => {
              const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
              const heights = [100, 130, 85];
              const cfg = getPosConfig(p?.position);
              return (
                <div key={p?.player_id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 22 }}>{medals[rank - 1]}</div>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: cfg.bg, border: `2px solid ${cfg.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "4px 0" }}>{cfg.emoji}</div>
                  <p style={{ color: C.text, fontSize: 10, fontWeight: 800, textAlign: "center", marginBottom: 4, lineHeight: 1.2 }}>{p?.name}</p>
                  <div style={{ width: "100%", height: heights[i], background: `linear-gradient(to top,${rank === 1 ? "#b8860b" : rank === 2 ? "#888" : "#8B4513"}40,${rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#cd7f32"}20)`, border: `1px solid ${rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#cd7f32"}40`, borderRadius: "10px 10px 0 0", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 8 }}>
                    <p style={{ color: rank === 1 ? C.amber : C.muted, fontSize: 13, fontWeight: 900 }}>
                      {sort === "goals" ? (p?.goals || 0) : sort === "attendance" ? `${p?.att_rate}%` : (p?.rating || "—")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding: "4px 16px" }}>
        {isLoading ? <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={30} color={C.amber} className="spin" style={{ display: "block", margin: "0 auto" }} /></div> : (
          merged.map((p: any, i: number) => {
            const cfg = getPosConfig(p.position);
            const val = sort === "goals" ? (p.goals || 0) : sort === "attendance" ? `${p.att_rate}%` : (p.rating || "—");
            return (
              <div key={p.player_id} style={{ display: "flex", alignItems: "center", gap: 12, background: i < 3 ? `${C.amber}08` : "rgba(255,255,255,0.02)", border: `1px solid ${i < 3 ? `${C.amber}20` : C.border}`, borderRadius: 14, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: i < 3 ? `${C.amber}20` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {i < 3 ? <span style={{ fontSize: 16 }}>{medals[i]}</span> : <span style={{ color: C.muted, fontSize: 12, fontWeight: 900 }}>{i + 1}</span>}
                </div>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{cfg.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{p.name}</p>
                  <p style={{ color: C.muted, fontSize: 10 }}>{cfg.label}</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: i < 3 ? C.amber : C.muted, fontSize: 18, fontWeight: 900 }}>{val}</p>
                  <p style={{ color: C.dim, fontSize: 9 }}>{sort === "goals" ? "هدف" : sort === "attendance" ? "حضور" : "تقييم"}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
function ProfileScreen({ user, coachData, onLogout }: any) {
  const coach = coachData;
  const ROLE_CONFIG: Record<string, { color: string; emoji: string }> = {
    "مدير فني / مدرب رئيسي": { color: "#d97706", emoji: "👑" },
    "مساعد مدرب": { color: "#059669", emoji: "📋" },
    "مدرب حراس مرمى": { color: "#0891b2", emoji: "🧤" },
    "معد بدني": { color: "#ea580c", emoji: "⚡" },
    "محلل أداء": { color: "#7c3aed", emoji: "📊" },
    "طبيب / معالج طبيعي": { color: "#e11d48", emoji: "🩺" },
  };
  const roleCfg = ROLE_CONFIG[coach?.specialty] || { color: C.green, emoji: "👨‍🏫" };

  return (
    <div style={{ direction: "rtl", paddingBottom: 110 }} className="fade-in">
      {/* Hero */}
      <div style={{ background: `linear-gradient(160deg,rgba(16,185,129,0.1),rgba(6,8,16,0.9))`, borderBottom: `1px solid ${C.border}`, padding: "30px 20px 24px", textAlign: "center" }}>
        <div style={{ width: 90, height: 90, borderRadius: 28, background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 42 }}>
          {roleCfg.emoji}
        </div>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>{coach?.name || user?.username}</h2>
        <p style={{ color: roleCfg.color, fontSize: 13, marginTop: 5, fontWeight: 700 }}>{coach?.specialty || "مدرب"}</p>
        {coach?.license && <p style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>🏅 {coach.license}</p>}
        {coach?.category && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${C.green}12`, border: `1px solid ${C.green}25`, borderRadius: 20, padding: "5px 14px", marginTop: 10 }}>
            <Users size={12} color={C.green} />
            <span style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>{coach.category}</span>
          </div>
        )}
      </div>

      <div style={{ padding: "20px 16px" }}>
        {coach?.phone && <InfoRow label="رقم الهاتف" value={coach.phone} icon={<Phone size={16} />} color={C.green} />}
        {coach?.email && <InfoRow label="البريد الإلكتروني" value={coach.email} icon={<Mail size={16} />} color={C.purple} />}
        {coach?.category && <InfoRow label="الفئة / الفريق" value={coach.category} icon={<Users size={16} />} color={C.amber} />}
        {coach?.salary_per_session && <InfoRow label="الراتب / الحصة" value={`${coach.salary_per_session} دج`} icon={<CreditCard size={16} />} color={C.green} />}
        <InfoRow label="اسم المستخدم" value={coach?.username || user?.username} icon={<UserCheck size={16} />} color="#8b5cf6" />

        <div style={{ marginTop: 20, padding: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 16 }}>
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>إحصائيات التطبيق</p>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ color: C.green, fontSize: 20, fontWeight: 900 }}>v3.0</p>
              <p style={{ color: C.muted, fontSize: 10 }}>الإصدار</p>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ color: C.blue, fontSize: 20, fontWeight: 900 }}>10</p>
              <p style={{ color: C.muted, fontSize: 10 }}>الأقسام</p>
            </div>
          </div>
        </div>

        <button onClick={onLogout} className="btn-press"
          style={{ width: "100%", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 16, padding: 16, color: "#f87171", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <LogOut size={16} /> تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function BottomNav({ active, onChange, onMenu }: { active: View; onChange: (v: View) => void; onMenu: () => void }) {
  const items = [
    { view: "dashboard" as View, label: "الرئيسية", icon: <LayoutDashboard size={22} /> },
    { view: "players" as View, label: "لاعبي", icon: <Users size={22} /> },
    { view: "attendance" as View, label: "الحضور", icon: <QrCode size={22} /> },
    { view: "training" as View, label: "تدريب", icon: <Calendar size={22} /> },
    { view: "profile" as View, label: "حسابي", icon: <User size={22} /> },
  ];

  const isActive = (v: View) => {
    if (v === "players" && active === "player_detail") return true;
    return active === v;
  };

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(6,8,16,0.98)", borderTop: `1px solid ${C.border}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom)", backdropFilter: "blur(30px)", zIndex: 100 }}>
      {items.map(item => {
        const act = isActive(item.view);
        return (
          <button key={item.view} onClick={() => onChange(item.view)} className="btn-press"
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0 13px", background: "none", border: "none", cursor: "pointer", color: act ? C.green : C.dim, position: "relative" }}>
            {act && <div style={{ position: "absolute", top: 0, width: 28, height: 3, background: `linear-gradient(to left,#059669,#10b981)`, borderRadius: "0 0 4px 4px" }} />}
            <div style={{ color: act ? C.green : C.dim, marginBottom: 3, transform: act ? "scale(1.1)" : "scale(1)", transition: "all 0.2s" }}>{item.icon}</div>
            <span style={{ fontSize: 10, fontWeight: 800 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Side Menu ────────────────────────────────────────────────────────────────
function SideMenu({ onNavigate, onClose, active }: { onNavigate: (v: View) => void; onClose: () => void; active: View }) {
  const sections = [
    {
      title: "مركز التحكم والعمليات",
      icon: "🎛️",
      items: [
        { view: "dashboard" as View, label: "لوحة القيادة الذكية", icon: <LayoutDashboard size={16} />, color: C.green },
        { view: "attendance" as View, label: "تسجيل الحضور (QR)", icon: <QrCode size={16} />, color: C.purple },
        { view: "training" as View, label: "برنامج التدريبات", icon: <Calendar size={16} />, color: C.blue },
        { view: "notebook" as View, label: "الدفتر البيداغوجي", icon: <BookOpen size={16} />, color: C.amber },
      ]
    },
    {
      title: "الأداء الفني والتقييم",
      icon: "📊",
      items: [
        { view: "matches" as View, label: "مركز المنافسات", icon: <Swords size={16} />, color: "#e11d48" },
        { view: "performance" as View, label: "تحليل الأداء", icon: <BarChart2 size={16} />, color: C.purple },
        { view: "physical" as View, label: "القياسات البدنية", icon: <Dumbbell size={16} />, color: C.amber },
        { view: "medical" as View, label: "المتابعة الطبية", icon: <Stethoscope size={16} />, color: "#f43f5e" },
        { view: "evaluations" as View, label: "تقييمات اللاعبين", icon: <Star size={16} />, color: C.amber },
        { view: "leaderboard" as View, label: "ترتيب نجوم الأكاديمية", icon: <Trophy size={16} />, color: C.green },
      ]
    }
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 200 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "78%", maxWidth: 320, background: "linear-gradient(160deg,#0d1117,#060810)", borderLeft: `1px solid ${C.border}`, zIndex: 201, overflowY: "auto", direction: "rtl", paddingBottom: 40 }} className="fade-in">
        {/* Header */}
        <div style={{ padding: "60px 20px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>⚽ أكاديمية أجيال وادي العثمانية</p>
              <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 4 }}>قائمة الأقسام</h3>
            </div>
            <button onClick={onClose} className="btn-press" style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, padding: 8, cursor: "pointer", color: C.muted }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sections */}
        <div style={{ padding: "16px 16px" }}>
          {sections.map(sec => (
            <div key={sec.title} style={{ marginBottom: 24 }}>
              <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                {sec.icon} {sec.title}
              </p>
              {sec.items.map(item => {
                const isAct = active === item.view;
                return (
                  <button key={item.view} onClick={() => { onNavigate(item.view); onClose(); }} className="btn-press"
                    style={{ width: "100%", textAlign: "right", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 4, background: isAct ? `${item.color}15` : "transparent", border: `1px solid ${isAct ? `${item.color}30` : "transparent"}`, borderRadius: 14, cursor: "pointer" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>{item.icon}</div>
                    <span style={{ color: isAct ? item.color : C.text, fontSize: 13, fontWeight: isAct ? 800 : 600 }}>{item.label}</span>
                    {isAct && <div style={{ marginRight: "auto", width: 6, height: 6, borderRadius: "50%", background: item.color }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ user, coachData, selectedTeam, isLoading, onMenu, onLogout }: any) {
  const viewTitles: Partial<Record<View, string>> = {
    dashboard: "لوحة القيادة",
    players: "لاعبي",
    player_detail: "ملف اللاعب",
    attendance: "تسجيل الحضور",
    training: "التدريبات",
    notebook: "الدفتر البيداغوجي",
    matches: "مركز المنافسات",
    performance: "تحليل الأداء",
    physical: "القياسات البدنية",
    medical: "المتابعة الطبية",
    evaluations: "التقييمات",
    leaderboard: "نجوم الأكاديمية",
    profile: "حسابي",
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,8,16,0.97)", backdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}`, height: 57, display: "flex", alignItems: "center", padding: "0 14px", direction: "rtl" }}>
      {/* Logo */}
      <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#059669,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(16,185,129,0.3)", flexShrink: 0, fontSize: 18 }}>⚽</div>
      <div style={{ flex: 1, marginRight: 10 }}>
        <p style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>{coachData?.name || user?.username || "بوابة المدرب"}</p>
        <p style={{ color: C.green, fontSize: 10, fontWeight: 800 }}>
          {coachData?.category || user?.category || "فئة عامة"} {selectedTeam?.name ? `• ${selectedTeam.name}` : ""}
        </p>
      </div>
      {isLoading && <Loader2 size={16} color={C.green} className="spin" style={{ marginLeft: 8 }} />}
      <button onClick={onMenu} className="btn-press" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 10px", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
        <Menu size={16} />
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export function CoachPlayerApp() {
  const [user, setUser] = useState<any>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const [coachTeams, setCoachTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [view, setView] = useState<View>("dashboard");
  const [players, setPlayers] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem("coach_mobile_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { }
    }
  }, []);

  const loadData = async (u: any) => {
    setIsLoading(true);
    try {
      const coachId = u.coach_id;
      let coachCategory = u.category;
      let coachTeamId = u.team_id;

      let coachRec: any = null;
      if (coachId) {
        coachRec = await api.getCoachById(Number(coachId)).catch(() => null);
        if (coachRec) {
          setCoachData(coachRec);
          if (coachRec.category) coachCategory = coachRec.category;
          if (coachRec.team_id) coachTeamId = coachRec.team_id;
        }
      }

      // 1. Fetch teams strictly belonging to this coach
      const { data: teamsData } = await supabase.from("teams").select("*");
      const matchedTeams = (teamsData || []).filter((t: any) =>
        (coachId && Number(t.coach_id) === Number(coachId)) ||
        (coachTeamId && Number(t.team_id) === Number(coachTeamId)) ||
        (coachCategory && t.category === coachCategory)
      );

      setCoachTeams(matchedTeams);
      const activeTeam = matchedTeams.length > 0 ? matchedTeams[0] : null;
      setSelectedTeam(activeTeam);

      const myTeamIds = matchedTeams.map((t: any) => Number(t.team_id));
      const myCategories = Array.from(new Set([
        ...matchedTeams.map((t: any) => t.category),
        ...(coachCategory ? [coachCategory] : [])
      ].filter(Boolean)));

      // 2. Fetch players STRICTLY FOR THIS COACH'S TEAM & CATEGORY
      const { data: allPlayers } = await supabase
        .from("players")
        .select("*")
        .not("name", "ilike", "[REQ]%");

      const myPlayers = (allPlayers || []).filter((p: any) => {
        // If player has a team_id and coach has assigned teams, strictly match team_id!
        if (p.team_id && myTeamIds.length > 0) {
          return myTeamIds.includes(Number(p.team_id));
        }
        // Otherwise match category
        if (p.category && myCategories.length > 0) {
          return myCategories.includes(p.category);
        }
        return false;
      });
      setPlayers(myPlayers);

      // 3. Fetch trainings strictly for this coach's team and category
      const { data: allTrainings } = await supabase
        .from("training")
        .select("*")
        .order("date", { ascending: false })
        .limit(40);

      const myTrainings = (allTrainings || []).filter((t: any) =>
        (t.team_id && myTeamIds.includes(Number(t.team_id))) ||
        (t.category && myCategories.includes(t.category)) ||
        (coachId && Number(t.coach_id) === Number(coachId))
      );
      setTrainings(myTrainings);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData(user);
  }, [user]);

  const handleLogin = (u: any) => { setUser(u); setView("dashboard"); };
  const handleLogout = () => {
    localStorage.removeItem("coach_mobile_user");
    setUser(null); setView("dashboard"); setPlayers([]); setCoachData(null);
  };
  const handleNavigate = (v: View, data?: any) => {
    if (data) setSelectedPlayer(data);
    setView(v);
    window.scrollTo(0, 0);
  };

  if (!user) return (<><GlobalStyles /><LoginScreen onLogin={handleLogin} /></>);

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100dvh", background: C.bg, color: "#fff", overflowX: "hidden" }}>
        <TopBar user={user} coachData={coachData} selectedTeam={selectedTeam} isLoading={isLoading} onMenu={() => setShowMenu(true)} onLogout={handleLogout} />

        {showMenu && <SideMenu onNavigate={handleNavigate} onClose={() => setShowMenu(false)} active={view} />}

        {/* Loading overlay */}
        {isLoading && view === "dashboard" && (
          <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(6,8,16,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, direction: "rtl" }}>
            <div style={{ width: 72, height: 72, borderRadius: 24, background: "linear-gradient(135deg,#059669,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(16,185,129,0.4)", fontSize: 34 }}>⚽</div>
            <Loader2 size={28} color={C.green} className="spin" />
            <p style={{ color: C.muted, fontSize: 14 }}>جاري تحميل البيانات...</p>
          </div>
        )}

        {/* Screen content */}
        <div style={{ paddingTop: 57 }}>
          {view === "dashboard" && !isLoading && (
            <DashboardScreen
              user={user}
              players={players}
              trainings={trainings}
              coachData={coachData}
              selectedTeam={selectedTeam}
              coachTeams={coachTeams}
              onSelectTeam={setSelectedTeam}
              onNavigate={handleNavigate}
            />
          )}
          {view === "players" && (
            <PlayersScreen
              players={players}
              coachTeams={coachTeams}
              selectedTeam={selectedTeam}
              onSelectTeam={setSelectedTeam}
              onNavigate={handleNavigate}
            />
          )}
          {view === "player_detail" && selectedPlayer && <PlayerDetailScreen player={selectedPlayer} onBack={() => setView("players")} user={user} />}
          {view === "attendance" && <AttendanceScreen players={players} coachData={coachData} user={user} onNavigate={handleNavigate} />}
          {view === "training" && <TrainingScreen coachData={coachData} user={user} onNavigate={handleNavigate} />}
          {view === "notebook" && <NotebookScreen players={players} coachData={coachData} />}
          {view === "matches" && <MatchesScreen coachData={coachData} user={user} coachTeams={coachTeams} />}
          {view === "performance" && <PerformanceScreen players={players} />}
          {view === "physical" && <PhysicalScreen players={players} coachData={coachData} />}
          {view === "medical" && <MedicalScreen players={players} />}
          {view === "evaluations" && <EvaluationsScreen players={players} coachData={coachData} />}
          {view === "leaderboard" && <LeaderboardScreen players={players} />}
          {view === "profile" && <ProfileScreen user={user} coachData={coachData} onLogout={handleLogout} />}
        </div>

        <BottomNav active={view} onChange={handleNavigate} onMenu={() => setShowMenu(true)} />
      </div>
    </>
  );
}
