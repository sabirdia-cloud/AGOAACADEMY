import React, { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import {
  Users, Search, Plus, Phone, Mail, Award, Shield, Star, Activity, Heart,
  User, ChevronRight, Edit3, Trash2, CreditCard, X, Check, Loader2,
  LogOut, Home, UserCheck, ArrowRight, Camera, Upload, AlertCircle,
  ChevronLeft, Building, Lock
} from "lucide-react";

// ─── Image Compression ────────────────────────────────────────────────────────
const compressImage = (base64Str: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const max = 200;
      let w = img.width, h = img.height;
      if (w > h) { if (w > max) { h *= max / w; w = max; } }
      else { if (h > max) { w *= max / h; h = max; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => resolve(base64Str);
  });

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { color: string; bg: string; badge: string; icon: React.ReactNode; label: string; emoji: string }> = {
  "مدير فني / مدرب رئيسي": {
    color: "#d97706", bg: "rgba(217,119,6,0.12)", badge: "rgba(217,119,6,0.18)",
    icon: <Award size={14} />, label: "مدير فني", emoji: "👑"
  },
  "مساعد مدرب": {
    color: "#059669", bg: "rgba(5,150,105,0.12)", badge: "rgba(5,150,105,0.18)",
    icon: <Users size={14} />, label: "مساعد مدرب", emoji: "📋"
  },
  "مدرب حراس مرمى": {
    color: "#0891b2", bg: "rgba(8,145,178,0.12)", badge: "rgba(8,145,178,0.18)",
    icon: <Shield size={14} />, label: "حراس مرمى", emoji: "🧤"
  },
  "معد بدني": {
    color: "#ea580c", bg: "rgba(234,88,12,0.12)", badge: "rgba(234,88,12,0.18)",
    icon: <Activity size={14} />, label: "معد بدني", emoji: "⚡"
  },
  "محلل أداء": {
    color: "#7c3aed", bg: "rgba(124,58,237,0.12)", badge: "rgba(124,58,237,0.18)",
    icon: <Star size={14} />, label: "محلل أداء", emoji: "📊"
  },
  "طبيب / معالج طبيعي": {
    color: "#e11d48", bg: "rgba(225,29,72,0.12)", badge: "rgba(225,29,72,0.18)",
    icon: <Heart size={14} />, label: "طبيب", emoji: "🩺"
  },
};
const getRoleConfig = (role: string) =>
  ROLE_CONFIG[role] ?? {
    color: "#71717a", bg: "rgba(113,113,122,0.12)", badge: "rgba(113,113,122,0.18)",
    icon: <User size={14} />, label: role || "طاقم فني", emoji: "🏛️"
  };

// ─── Types ────────────────────────────────────────────────────────────────────
type View = "login" | "home" | "list" | "detail" | "add" | "edit";

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
    setIsLoading(true);
    setError("");
    try {
      const user = await api.login(username, password);
      if (user && (user.role === "admin" || user.role === "coach")) {
        localStorage.setItem("coaches_app_user", JSON.stringify(user));
        onLogin(user);
      } else if (user) {
        setError("هذا الحساب لا يملك صلاحية الوصول لتطبيق المدربين");
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
    <div style={{ minHeight: "100dvh", background: "linear-gradient(160deg,#09090b 0%,#111827 50%,#0a0f1a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Tajawal',sans-serif", direction: "rtl" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg,#059669,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 20px 60px rgba(16,185,129,0.35)" }}>
          <span style={{ fontSize: 38 }}>⚽</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: 0 }}>الطاقم الفني</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>تطبيق إدارة المدربين</p>
      </div>

      {/* Form */}
      <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.04)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", padding: "28px 24px", backdropFilter: "blur(20px)" }}>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>اسم المستخدم</label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#4b5563" }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 42px 12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
          </div>
          <div>
            <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>كلمة المرور</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#4b5563" }} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 42px 12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 11 }}>
                {showPass ? "إخفاء" : "عرض"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={15} color="#f87171" />
              <span style={{ color: "#fca5a5", fontSize: 12 }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{ background: isLoading ? "rgba(16,185,129,0.5)" : "linear-gradient(135deg,#059669,#10b981)", border: "none", borderRadius: 14, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 800, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", marginTop: 4 }}
          >
            {isLoading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <ChevronLeft size={18} />}
            {isLoading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
      <p style={{ color: "#374151", fontSize: 11, marginTop: 24, textAlign: "center" }}>AGOA Coaches App v1.0</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Home Dashboard ───────────────────────────────────────────────────────────
function HomeScreen({ coaches, user, onNavigate }: { coaches: any[]; user: any; onNavigate: (v: View, data?: any) => void }) {
  const roleGroups = coaches.reduce((acc: any, c: any) => {
    const r = c.specialization || "أخرى";
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const topRoles = Object.entries(roleGroups).slice(0, 4);

  return (
    <div style={{ padding: "20px 16px 100px", fontFamily: "'Tajawal',sans-serif", direction: "rtl" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>مرحباً بك 👋</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "4px 0 0" }}>{user?.username || "المدير"}</h1>
      </div>

      {/* Stats Banner */}
      <div style={{ background: "linear-gradient(135deg,#059669 0%,#047857 100%)", borderRadius: 20, padding: "20px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", left: -10, bottom: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "0 0 4px", fontWeight: 700 }}>إجمالي الطاقم الفني</p>
        <p style={{ color: "#fff", fontSize: 48, fontWeight: 900, margin: 0, lineHeight: 1 }}>{coaches.length}</p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 }}>عضو في الطاقم الفني والتدريبي</p>
      </div>

      {/* Role Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {topRoles.map(([role, count]) => {
          const cfg = getRoleConfig(role);
          return (
            <div key={role} onClick={() => onNavigate("list")} style={{ background: cfg.bg, borderRadius: 16, padding: "16px 14px", border: `1px solid ${cfg.color}30`, cursor: "pointer" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{cfg.emoji}</div>
              <p style={{ color: cfg.color, fontSize: 22, fontWeight: 900, margin: "0 0 2px" }}>{String(count)}</p>
              <p style={{ color: "#9ca3af", fontSize: 11, margin: 0, fontWeight: 700 }}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", padding: 16, marginBottom: 16 }}>
        <h3 style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 800, margin: "0 0 12px" }}>إجراءات سريعة</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ActionRow icon={<Users size={18} color="#10b981" />} label="عرض جميع المدربين" sub={`${coaches.length} عضو`} onClick={() => onNavigate("list")} color="#10b981" />
          <ActionRow icon={<Plus size={18} color="#6366f1" />} label="إضافة إطار فني جديد" sub="توظيف عضو جديد" onClick={() => onNavigate("add")} color="#6366f1" />
        </div>
      </div>

      {/* Recent Coaches */}
      {coaches.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 800, margin: 0 }}>أحدث الأعضاء</h3>
            <button onClick={() => onNavigate("list")} style={{ background: "none", border: "none", color: "#10b981", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>عرض الكل</button>
          </div>
          {coaches.slice(0, 3).map((c: any) => (
            <MiniCoachRow key={c.coach_id} coach={c} onClick={() => onNavigate("detail", c)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionRow({ icon, label, sub, onClick, color }: any) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", width: "100%", textAlign: "right", fontFamily: "'Tajawal',sans-serif" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 700, margin: 0 }}>{label}</p>
        <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>{sub}</p>
      </div>
      <ChevronLeft size={16} color="#4b5563" />
    </button>
  );
}

function MiniCoachRow({ coach, onClick }: { coach: any; onClick: () => void }) {
  const cfg = getRoleConfig(coach.specialization);
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", border: "none", background: "none", width: "100%", textAlign: "right", cursor: "pointer", fontFamily: "inherit", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, border: `1.5px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
        {coach.photo_url ? <img src={coach.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={18} color={cfg.color} />}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: "#f3f4f6", fontSize: 13, fontWeight: 700, margin: 0 }}>{coach.name}</p>
        <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>{cfg.label}</p>
      </div>
      <ChevronLeft size={14} color="#4b5563" />
    </button>
  );
}

// ─── Coach List Screen ────────────────────────────────────────────────────────
function CoachListScreen({ coaches, onNavigate, onAdd }: { coaches: any[]; onNavigate: (v: View, data?: any) => void; onAdd: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("الكل");

  const roles = ["الكل", ...Array.from(new Set(coaches.map((c: any) => c.specialization || "أخرى")))];
  const filtered = coaches.filter((c: any) => {
    const matchQuery = !query || c.name?.toLowerCase().includes(query.toLowerCase()) || c.phone?.includes(query);
    const matchRole = selectedRole === "الكل" || c.specialization === selectedRole;
    return matchQuery && matchRole;
  });

  return (
    <div style={{ fontFamily: "'Tajawal',sans-serif", direction: "rtl" }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#09090b", padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: 0 }}>الطاقم الفني ({coaches.length})</h2>
          <button onClick={onAdd} style={{ background: "linear-gradient(135deg,#059669,#10b981)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Plus size={18} color="#fff" />
          </button>
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 38px 10px 14px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
          {query && <button onClick={() => setQuery("")} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={14} /></button>}
        </div>
      </div>

      {/* Role filter chips */}
      <div style={{ display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto", scrollbarWidth: "none" }}>
        {roles.map(r => {
          const active = r === selectedRole;
          const cfg = r === "الكل" ? { color: "#10b981", bg: "rgba(16,185,129,0.15)" } : getRoleConfig(r);
          return (
            <button key={r} onClick={() => setSelectedRole(r)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: `1px solid ${active ? cfg.color : "rgba(255,255,255,0.1)"}`, background: active ? cfg.bg : "transparent", color: active ? cfg.color : "#6b7280", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {r}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ padding: "4px 16px 100px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4b5563" }}>
            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ margin: 0 }}>لا توجد نتائج</p>
          </div>
        ) : (
          filtered.map((coach: any) => <CoachCard key={coach.coach_id} coach={coach} onClick={() => onNavigate("detail", coach)} />)
        )}
      </div>
    </div>
  );
}

function CoachCard({ coach, onClick }: { coach: any; onClick: () => void }) {
  const cfg = getRoleConfig(coach.specialization);
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "right", background: `linear-gradient(135deg,${cfg.bg},rgba(0,0,0,0))`,
        border: `1px solid ${cfg.color}25`, borderRadius: 16, padding: "14px",
        marginBottom: 10, cursor: "pointer", fontFamily: "inherit", display: "block",
        transition: "transform 0.15s"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Avatar */}
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(0,0,0,0.4)", border: `2px solid ${cfg.color}50`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {coach.photo_url
            ? <img src={coach.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <User size={22} color={cfg.color} />
          }
        </div>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ background: cfg.badge, color: cfg.color, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
          <p style={{ color: "#f3f4f6", fontSize: 15, fontWeight: 800, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{coach.name}</p>
          {coach.phone && <p style={{ color: "#6b7280", fontSize: 12, margin: 0, direction: "ltr", textAlign: "right" }}>{coach.phone}</p>}
        </div>
        <ChevronLeft size={16} color="#4b5563" />
      </div>
      {/* License */}
      {coach.license && (
        <div style={{ marginTop: 10, padding: "6px 10px", background: "rgba(0,0,0,0.25)", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Award size={12} color={cfg.color} />
          <span style={{ color: "#9ca3af", fontSize: 11 }}>{coach.license}</span>
        </div>
      )}
    </button>
  );
}

// ─── Coach Detail Screen ──────────────────────────────────────────────────────
function CoachDetailScreen({ coach, teams, onBack, onEdit, onDelete }: { coach: any; teams: any[]; onBack: () => void; onEdit: () => void; onDelete: () => void }) {
  const cfg = getRoleConfig(coach.specialization);
  const getTeamName = (c: any) => {
    if (c.team_id) {
      const t = teams.find((t: any) => t.team_id === c.team_id);
      return t ? `${t.category} - ${t.team_name}` : c.category || "غير محدد";
    }
    return c.category || "غير محدد";
  };

  return (
    <div style={{ fontFamily: "'Tajawal',sans-serif", direction: "rtl", paddingBottom: 100 }}>
      {/* Hero Header */}
      <div style={{ background: `linear-gradient(160deg,${cfg.bg},rgba(9,9,11,0.8))`, borderBottom: `1px solid ${cfg.color}20`, padding: "20px 16px 24px" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#9ca3af", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontFamily: "inherit" }}>
          <ChevronRight size={16} /> رجوع
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(0,0,0,0.5)", border: `2.5px solid ${cfg.color}60`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {coach.photo_url
              ? <img src={coach.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <User size={32} color={cfg.color} />
            }
          </div>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: cfg.badge, color: cfg.color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, marginBottom: 6 }}>
              {cfg.emoji} {cfg.label}
            </div>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0 }}>{coach.name}</h2>
            {coach.license && <p style={{ color: "#9ca3af", fontSize: 12, margin: "4px 0 0" }}>{coach.license}</p>}
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <InfoCard label="الفئة / الفريق" value={getTeamName(coach)} icon={<Users size={16} />} color={cfg.color} />
        {coach.phone && <InfoCard label="رقم الهاتف" value={coach.phone} icon={<Phone size={16} />} color={cfg.color} dir="ltr" />}
        {coach.email && <InfoCard label="البريد الإلكتروني" value={coach.email} icon={<Mail size={16} />} color={cfg.color} dir="ltr" />}
        {coach.username && <InfoCard label="اسم المستخدم" value={coach.username} icon={<UserCheck size={16} />} color={cfg.color} />}
        {coach.salary_per_session && <InfoCard label="الراتب لكل حصة" value={`${coach.salary_per_session} دج`} icon={<CreditCard size={16} />} color={cfg.color} />}
      </div>

      {/* Actions */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onEdit} style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, borderRadius: 14, padding: "14px", color: cfg.color, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
          <Edit3 size={16} /> تعديل البيانات
        </button>
        <button onClick={onDelete} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "14px", color: "#f87171", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
          <Trash2 size={16} /> حذف من الطاقم
        </button>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon, color, dir }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, margin: "0 0 2px" }}>{label}</p>
        <p style={{ color: "#f3f4f6", fontSize: 14, fontWeight: 700, margin: 0, direction: dir || "rtl" }}>{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Add / Edit Form ──────────────────────────────────────────────────────────
function CoachFormScreen({ editingCoach, teams, categories, onSave, onBack }: { editingCoach?: any; teams: any[]; categories: any[]; onSave: () => void; onBack: () => void }) {
  const isEdit = !!editingCoach;
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(editingCoach?.photo_url || null);
  const [photoBase64, setPhotoBase64] = useState<string>(editingCoach?.photo_url || "");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: editingCoach?.name || "",
    phone: editingCoach?.phone || "",
    email: editingCoach?.email || "",
    license: editingCoach?.license || "",
    specialization: editingCoach?.specialization || "مدير فني / مدرب رئيسي",
    username: editingCoach?.username || "",
    password: "",
    salary_per_session: String(editingCoach?.salary_per_session || 1000),
    team_id: editingCoach?.team_id ? String(editingCoach.team_id) : (editingCoach?.category ? `cat:${editingCoach.category}` : ""),
  });

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setPhotoPreview(compressed);
      setPhotoBase64(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.name) { alert("الرجاء إدخال اسم المدرب"); return; }
    setIsSaving(true);
    try {
      let selectedTeamId: number | null = null;
      let selectedCategory: string | null = null;
      if (form.team_id.startsWith("cat:")) {
        selectedCategory = form.team_id.replace("cat:", "");
      } else if (form.team_id) {
        selectedTeamId = Number(form.team_id);
        const team = teams.find((t: any) => t.team_id === selectedTeamId);
        selectedCategory = team?.category || null;
      }

      const coachData: any = {
        name: form.name, phone: form.phone, email: form.email,
        license: form.license, specialty: form.specialization,
        team_id: selectedTeamId, category: selectedCategory,
        username: form.username || null,
        salary_per_session: Number(form.salary_per_session) || 1000,
      };
      if (form.password) coachData.password = form.password;

      let savedCoach: any;
      if (isEdit) {
        savedCoach = await api.updateCoach(editingCoach.coach_id, coachData);
      } else {
        if (!form.password) coachData.password = "coach123";
        savedCoach = await api.addCoach(coachData);
      }

      const targetId = isEdit ? editingCoach.coach_id : savedCoach?.coach_id;
      if (targetId && photoBase64) localStorage.setItem(`coach_photo_${targetId}`, photoBase64);

      onSave();
    } catch (err: any) {
      alert("فشل الحفظ: " + (err.message || "خطأ غير معروف"));
    } finally {
      setIsSaving(false);
    }
  };

  const ROLES = ["مدير فني / مدرب رئيسي", "مساعد مدرب", "مدرب حراس مرمى", "معد بدني", "محلل أداء", "طبيب / معالج طبيعي"];

  return (
    <div style={{ fontFamily: "'Tajawal',sans-serif", direction: "rtl", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9ca3af" }}>
          <ChevronRight size={18} />
        </button>
        <div>
          <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 900, margin: 0 }}>{isEdit ? "تعديل بيانات المدرب" : "إضافة إطار فني جديد"}</h2>
          <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>{isEdit ? editingCoach.name : "أدخل بيانات العضو الجديد"}</p>
        </div>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Photo Upload */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 90, height: 90, borderRadius: 24, background: "rgba(255,255,255,0.06)", border: "2px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
            {photoPreview ? <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={28} color="#4b5563" />}
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 16px", color: "#9ca3af", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <Upload size={14} /> {photoPreview ? "تغيير الصورة" : "رفع صورة"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        {/* Form Fields */}
        <FormField label="الاسم الكامل *" value={form.name} onChange={v => setField("name", v)} placeholder="أدخل اسم المدرب" />
        
        {/* Role Selector */}
        <div>
          <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8 }}>التخصص الفني</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ROLES.map(r => {
              const cfg = getRoleConfig(r);
              const active = form.specialization === r;
              return (
                <button key={r} type="button" onClick={() => setField("specialization", r)} style={{ background: active ? cfg.bg : "rgba(255,255,255,0.04)", border: `1px solid ${active ? cfg.color : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "10px 8px", color: active ? cfg.color : "#6b7280", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                  <span>{cfg.emoji}</span> {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <FormField label="رقم الهاتف" value={form.phone} onChange={v => setField("phone", v)} placeholder="0555 000 000" type="tel" />
        <FormField label="البريد الإلكتروني" value={form.email} onChange={v => setField("email", v)} placeholder="email@example.com" type="email" dir="ltr" />
        <FormField label="رقم الرخصة" value={form.license} onChange={v => setField("license", v)} placeholder="رخصة UEFA / CAF..." />

        {/* Team */}
        <div>
          <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>الفئة / الفريق</label>
          <select value={form.team_id} onChange={e => setField("team_id", e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#f3f4f6", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
            <option value="">— غير محدد —</option>
            {categories.map((cat: any) => <option key={`cat:${cat.name}`} value={`cat:${cat.name}`}>{cat.name}</option>)}
            {teams.map((t: any) => <option key={t.team_id} value={String(t.team_id)}>{t.category} - {t.team_name}</option>)}
          </select>
        </div>

        <FormField label="اسم المستخدم (للدخول)" value={form.username} onChange={v => setField("username", v)} placeholder="username" dir="ltr" />
        <FormField label={isEdit ? "كلمة مرور جديدة (اتركها فارغة للإبقاء)" : "كلمة المرور (افتراضي: coach123)"} value={form.password} onChange={v => setField("password", v)} placeholder="••••••••" type="password" />
        <FormField label="الراتب لكل حصة (دج)" value={form.salary_per_session} onChange={v => setField("salary_per_session", v)} placeholder="1000" type="number" />

        {/* Save Button */}
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSubmit}
          style={{ background: isSaving ? "rgba(16,185,129,0.5)" : "linear-gradient(135deg,#059669,#10b981)", border: "none", borderRadius: 16, padding: "16px", color: "#fff", fontSize: 15, fontWeight: 800, cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", marginTop: 8 }}
        >
          {isSaving ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={18} />}
          {isSaving ? "جاري الحفظ..." : isEdit ? "حفظ التغييرات" : "إضافة للطاقم الفني"}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text", dir }: any) {
  return (
    <div>
      <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#f3f4f6", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", direction: dir || "rtl" }}
      />
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function BottomNav({ active, onChange }: { active: View; onChange: (v: View) => void }) {
  const items = [
    { view: "home" as View, label: "الرئيسية", icon: <Home size={20} /> },
    { view: "list" as View, label: "المدربون", icon: <Users size={20} /> },
    { view: "add" as View, label: "إضافة", icon: <Plus size={20} /> },
  ];

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(9,9,11,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", paddingBottom: "env(safe-area-inset-bottom)", backdropFilter: "blur(20px)", zIndex: 100 }}>
      {items.map(item => {
        const isActive = active === item.view || (active === "detail" && item.view === "list") || (active === "edit" && item.view === "list");
        return (
          <button key={item.view} onClick={() => onChange(item.view)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0 12px", background: "none", border: "none", cursor: "pointer", color: isActive ? "#10b981" : "#4b5563", position: "relative", fontFamily: "inherit" }}>
            {isActive && <div style={{ position: "absolute", top: 0, width: 30, height: 3, background: "#10b981", borderRadius: "0 0 4px 4px" }} />}
            <div style={{ color: isActive ? "#10b981" : "#4b5563", marginBottom: 3 }}>{item.icon}</div>
            <span style={{ fontSize: 10, fontWeight: 800 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────────
function ConfirmDelete({ coach, onConfirm, onCancel }: { coach: any; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#18181b", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480, border: "1px solid rgba(255,255,255,0.1)", fontFamily: "'Tajawal',sans-serif", direction: "rtl" }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Trash2 size={22} color="#f87171" />
        </div>
        <h3 style={{ color: "#fff", fontSize: 17, fontWeight: 900, textAlign: "center", margin: "0 0 8px" }}>حذف {coach?.name}؟</h3>
        <p style={{ color: "#6b7280", fontSize: 13, textAlign: "center", margin: "0 0 24px" }}>هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات هذا العضو نهائياً.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px", color: "#9ca3af", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
          <button onClick={onConfirm} style={{ flex: 1, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: "14px", color: "#f87171", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>حذف نهائياً</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export function CoachesMobileApp() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<View>("home");
  const [coaches, setCoaches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [coachToDelete, setCoachToDelete] = useState<any>(null);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem("coaches_app_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [coachesData, teamsData, catsData] = await Promise.all([
        api.getCoaches().catch(() => []),
        api.getTeams().catch(() => []),
        api.getCategories().catch(() => []),
      ]);
      const enriched = (coachesData || []).map((c: any) => ({
        ...c,
        specialization: c.specialty || c.specialization || "مدير فني / مدرب رئيسي",
        photo_url: localStorage.getItem(`coach_photo_${c.coach_id}`) || null,
      }));
      setCoaches(enriched);
      setTeams(teamsData || []);
      setCategories(catsData || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("coaches_app_user");
    setUser(null);
    setView("home");
  };

  const handleNavigate = (v: View, data?: any) => {
    if (data) setSelectedCoach(data);
    setView(v);
  };

  const handleDelete = async () => {
    if (!coachToDelete) return;
    try {
      await api.deleteCoach(coachToDelete.coach_id);
      localStorage.removeItem(`coach_photo_${coachToDelete.coach_id}`);
      setCoachToDelete(null);
      setView("list");
      await loadData();
    } catch (err: any) {
      alert("فشل الحذف: " + (err.message || "خطأ"));
    }
  };

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div style={{ minHeight: "100dvh", background: "#09090b", color: "#fff", overflowY: "auto" }}>
      {/* Top Bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(9,9,11,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Tajawal',sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#059669,#10b981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16 }}>⚽</span>
          </div>
          <div>
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 900, margin: 0 }}>الطاقم الفني</p>
            <p style={{ color: "#4b5563", fontSize: 10, margin: 0 }}>AGOA Coaches</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "7px 12px", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
          <LogOut size={13} /> خروج
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(9,9,11,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Tajawal',sans-serif" }}>
          <Loader2 size={36} color="#10b981" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#6b7280", fontSize: 14 }}>جاري التحميل...</p>
        </div>
      )}

      {/* Screen Router */}
      {view === "home" && <HomeScreen coaches={coaches} user={user} onNavigate={handleNavigate} />}
      {view === "list" && <CoachListScreen coaches={coaches} onNavigate={handleNavigate} onAdd={() => { setSelectedCoach(null); setView("add"); }} />}
      {view === "detail" && selectedCoach && (
        <CoachDetailScreen
          coach={selectedCoach}
          teams={teams}
          onBack={() => setView("list")}
          onEdit={() => setView("edit")}
          onDelete={() => setCoachToDelete(selectedCoach)}
        />
      )}
      {view === "add" && (
        <CoachFormScreen
          teams={teams}
          categories={categories}
          onSave={async () => { await loadData(); setView("list"); }}
          onBack={() => setView("list")}
        />
      )}
      {view === "edit" && selectedCoach && (
        <CoachFormScreen
          editingCoach={selectedCoach}
          teams={teams}
          categories={categories}
          onSave={async () => { await loadData(); setView("list"); }}
          onBack={() => setView("detail")}
        />
      )}

      {/* Bottom Navigation */}
      {view !== "login" && <BottomNav active={view} onChange={v => { setSelectedCoach(null); setView(v); }} />}

      {/* Delete Confirm */}
      {coachToDelete && <ConfirmDelete coach={coachToDelete} onConfirm={handleDelete} onCancel={() => setCoachToDelete(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input, select, button { font-family: 'Tajawal', sans-serif; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
