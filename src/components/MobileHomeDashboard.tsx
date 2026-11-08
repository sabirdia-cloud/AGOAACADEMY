import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/services/AuthContext";
import { api } from "@/services/api";
import {
  Users, Shield, Calendar, Trophy, Stethoscope, Star,
  Wallet, Package, Settings, BookOpen, ClipboardCheck,
  Activity, TrendingUp, Award, UserCheck, Shirt,
  CreditCard, FileText, UserPlus, Swords, BarChart3,
  Bell, LogOut, ChevronLeft, User, Crown, Flame, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Data Structures ───────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  color: string;
  badge?: number;
  highlight?: boolean;
}

interface NavGroup {
  title: string;
  subtitle: string;
  theme: "gold" | "red" | "silver";
  items: NavItem[];
}

const adminGroups: NavGroup[] = [
  {
    title: "إدارة اللاعبين",
    subtitle: "قوائم الأعضاء والتسجيل",
    theme: "gold",
    items: [
      { label: "قائمة اللاعبين",   icon: Users,        href: "/admin/players",        color: "#FFD700" },
      { label: "طلبات التسجيل",   icon: UserPlus,     href: "/admin/player-requests",color: "#FFD700", highlight: true },
      { label: "أولياء الأمور",   icon: User,         href: "/admin/parents",        color: "#C0C0C0" },
      { label: "المدربين",       icon: UserCheck,    href: "/admin/coaches",        color: "#C0C0C0" },
      { label: "كادر العمل",     icon: Shield,       href: "/admin/staff",          color: "#999" },
      { label: "الفئات والأفواج",  icon: Award,        href: "/admin/categories",     color: "#FFD700" },
    ],
  },
  {
    title: "التدريب والبطولات",
    subtitle: "الأداء الفني والمباريات",
    theme: "red",
    items: [
      { label: "جدول التدريب",    icon: Calendar,     href: "/academy/training",     color: "#EF4444" },
      { label: "سجل الحضور",     icon: ClipboardCheck,href: "/academy/attendance",  color: "#EF4444" },
      { label: "مركز المباريات",  icon: Trophy,       href: "/academy/matches",      color: "#FFD700" },
      { label: "الإحصائيات",    icon: BarChart3,    href: "/academy/player-stats", color: "#EF4444" },
      { label: "التقييمات",     icon: Star,         href: "/academy/evaluations",  color: "#FFD700" },
      { label: "البدني",         icon: Activity,     href: "/academy/physical-metrics", color: "#C0C0C0" },
      { label: "الإصابات",      icon: Stethoscope,  href: "/academy/injuries",     color: "#EF4444" },
      { label: "لوحة الشرف",     icon: Crown,        href: "/academy/leaderboard",  color: "#FFD700" },
    ],
  },
  {
    title: "المالية والمخازن",
    subtitle: "الاشتراكات والمصاريف",
    theme: "silver",
    items: [
      { label: "الاشتراكات",    icon: CreditCard,   href: "/admin/subscriptions",  color: "#C0C0C0" },
      { label: "سجلات الدفع",    icon: Wallet,       href: "/admin/payments",       color: "#FFD700" },
      { label: "الإدارة المالية",  icon: FileText,     href: "/admin/finances",       color: "#C0C0C0" },
      { label: "الرواتب",        icon: UserCheck,    href: "/admin/coach-payroll",  color: "#EF4444" },
      { label: "توزيع الألبسة",   icon: Shirt,        href: "/admin/kits",           color: "#C0C0C0" },
      { label: "المخازن",        icon: Package,      href: "/admin/inventory",      color: "#C0C0C0" },
    ],
  },
];

const coachGroups: NavGroup[] = [
  {
    title: "الأدوات الفنية",
    subtitle: "إدارة الفوج والتقييم",
    theme: "red",
    items: [
      { label: "الدفتر الفني",   icon: BookOpen,     href: "/academy/notebook",     color: "#EF4444" },
      { label: "تسجيل الحضور",   icon: ClipboardCheck,href: "/academy/attendance",  color: "#EF4444" },
      { label: "المباريات",     icon: Trophy,       href: "/academy/matches",      color: "#FFD700" },
      { label: "التقييمات",     icon: Star,         href: "/academy/evaluations",  color: "#FFD700" },
      { label: "لوحة الشرف",     icon: Crown,        href: "/academy/leaderboard",  color: "#FFD700" },
    ],
  },
];

// ─── Swipable Icon Component ───────────────────────────────────────────────────
function AppIcon({ item, onClick, groupTheme }: { item: NavItem; onClick: () => void, groupTheme: string }) {
  const [isPress, setIsPress] = useState(false);
  
  const themeColors = {
    gold: "from-yellow-500/20 to-amber-600/10 border-amber-500/30 text-amber-500",
    red: "from-rose-500/20 to-red-600/10 border-rose-500/30 text-rose-500",
    silver: "from-zinc-400/20 to-zinc-600/10 border-zinc-500/30 text-zinc-400"
  };

  const activeColor = item.highlight ? "#FFD700" : (groupTheme === 'red' ? '#EF4444' : (groupTheme === 'gold' ? '#F59E0B' : '#C0C0C0'));

  return (
    <div 
      onClick={onClick}
      onTouchStart={() => setIsPress(true)} 
      onTouchEnd={() => setIsPress(false)}
      className={cn(
        "flex flex-col items-center gap-2 flex-shrink-0 transition-all duration-150 select-none",
        isPress ? "scale-90 opacity-75" : "scale-100"
      )}
      style={{ width: "88px" }}
    >
      <div className={cn(
        "h-16 w-16 rounded-2xl bg-gradient-to-br border flex items-center justify-center relative shadow-lg overflow-hidden",
        themeColors[groupTheme as keyof typeof themeColors]
      )}>
        {/* Animated Background Pulse for highlights */}
        {item.highlight && (
          <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
        )}
        
        {/* The Icon itself */}
        <item.icon className="h-7 w-7 relative z-10" strokeWidth={2} style={{ color: activeColor }} />

        {/* Badge - Number indicator */}
        {item.badge !== undefined && item.badge > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 border border-white/10 text-[10px] items-center justify-center flex font-black text-white shadow-xl">
            {item.badge}
          </div>
        )}
      </div>
      <span className="text-[10px] font-black text-zinc-400 text-center leading-tight px-1 h-8 flex items-center justify-center">
        {item.label}
      </span>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
interface MobileHomeDashboardProps {
  stats: any;
  user: any;
  isLoading: boolean;
}

export function MobileHomeDashboard({ stats, user, isLoading }: MobileHomeDashboardProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [academyName, setAcademyName] = useState("أكاديمية كرة القدم");
  const [academyLogo, setAcademyLogo] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await api.getAcademySettings().catch(() => null);
        if (settings?.name) setAcademyName(settings.name);
        if (settings?.logo_url) setAcademyLogo(settings.logo_url);
      } catch {}
    };
    load();
  }, []);

  const groups = user?.role === 'admin' ? adminGroups : coachGroups;

  return (
    <div className="min-h-screen bg-black font-tajawal pb-32 pb-safe overflow-x-hidden rtl" dir="rtl">
      
      {/* ── STUNNING TOP BAR ────────────────────────────────────────── */}
      <div className="relative h-64 overflow-hidden pt-safe">
         {/* Premium background effects */}
         <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black z-0" />
         <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
         <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
         
         <div className="relative z-10 px-6 pt-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 p-2 shadow-2xl">
                 {academyLogo ? <img src={academyLogo} className="h-full w-full object-contain" /> : <Trophy className="text-yellow-500 h-full w-full" />}
               </div>
               <div>
                  <h1 className="text-white font-black text-sm tracking-tight leading-none mb-1">{academyName}</h1>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">نظام الإدارة الشامل</span>
                  </div>
               </div>
            </div>
            <button onClick={logout} className="h-10 w-10 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center active:scale-90 transition-transform">
               <LogOut className="h-4 w-4 text-zinc-400" />
            </button>
         </div>

         <div className="relative z-10 p-6 pt-8 text-right">
            <p className="text-zinc-500 text-xs font-bold mb-1">مرحباً بكل فخر،</p>
            <h2 className="text-3xl font-black text-white mb-2 leading-none flex items-center justify-end gap-3">
               {user?.full_name || user?.username}
               <Crown className="h-6 w-6 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full">
               <span className="h-2 w-2 rounded-full bg-red-600" />
               <span className="text-[10px] font-black text-red-500 uppercase">{user?.title || "مسؤول"}</span>
            </div>
         </div>
      </div>

      {/* ── DASHBOARD GRID & SECTIONS ───────────────────────────────── */}
      <div className="px-6 -mt-10 relative z-20 space-y-10">
         
         {groups.map((group) => (
            <div key={group.title} className="space-y-4">
               
               {/* Group Header */}
               <div className="flex justify-between items-end">
                  <div className="text-right">
                    <h3 className={cn(
                      "text-xl font-black leading-tight",
                      group.theme === 'gold' ? "text-amber-500" : (group.theme === 'red' ? "text-red-500" : "text-zinc-300")
                    )}>
                      {group.title}
                    </h3>
                    <p className="text-[10px] text-zinc-600 font-bold">{group.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-zinc-700 uppercase tracking-tighter">
                     اسحب للمزيد <ChevronLeft className="h-3 w-3" />
                  </div>
               </div>

               {/* SWIPABLE GRID CONTAINER */}
               <div 
                  className="flex overflow-x-auto pb-4 gap-3 no-scrollbar snap-x snap-mandatory"
                  style={{ maskImage: "linear-gradient(to right, black 90%, transparent 100%)" }}
               >
                  {group.items.map((item) => (
                    <AppIcon 
                      key={item.href} 
                      item={item.href === '/admin/player-requests' ? { ...item, badge: stats.pendingRequests } : item} 
                      groupTheme={group.theme}
                      onClick={() => navigate(item.href)} 
                    />
                  ))}
               </div>

            </div>
         ))}

         {/* STATS QUICK OVERVIEW / HIGHLIGHTS */}
         <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between h-32">
               <TrendingUp className="h-6 w-6 text-emerald-500" />
               <div>
                  <p className="text-[10px] text-zinc-500 font-bold mb-1">النمو الشهري</p>
                  <p className="text-2xl font-black text-white leading-none">+18%</p>
               </div>
            </div>
            <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between h-32">
               <Flame className="h-6 w-6 text-amber-500" />
               <div>
                  <p className="text-[10px] text-zinc-500 font-bold mb-1">بيانات نشطة</p>
                  <p className="text-2xl font-black text-white leading-none">مُحدثة</p>
               </div>
            </div>
         </div>

      </div>

      {/* FOOTER TEXT */}
      <div className="mt-16 text-center px-6 opacity-30">
         <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[5px]">Football Academy Management</p>
      </div>

    </div>
  );
}
