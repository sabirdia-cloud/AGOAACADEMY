import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { Bell, Search, Menu, Globe, ChevronRight, LogOut } from "lucide-react";
import { api } from "@/services/api";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/services/AuthContext";
import { cn } from "@/lib/utils";

// Map pathname to page title
const pageTitles: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/admin/players": "اللاعبين",
  "/admin/parents": "الأولياء",
  "/admin/player-requests": "طلبات التسجيل",
  "/admin/categories": "الفئات والفرق",
  "/admin/coaches": "المدربين",
  "/admin/staff": "كادر العمل",
  "/admin/subscriptions": "الاشتراكات",
  "/admin/payments": "سجلات الدفع",
  "/admin/finances": "الإدارة المالية",
  "/admin/coach-payroll": "رواتب المدربين",
  "/admin/kits": "توزيع الألبسة",
  "/admin/inventory": "المخزن",
  "/admin/stock-entries": "دخول المخزن",
  "/admin/stock-outputs": "خروج المخزن",
  "/admin/reports": "التقارير",
  "/admin/tournament-pro": "البطولات",
  "/academy/notebook": "الدفتر البيداغوجي",
  "/academy/training": "جدول التدريب",
  "/academy/attendance": "سجل الحضور",
  "/academy/matches": "مركز المباريات",
  "/academy/player-stats": "الإحصائيات",
  "/academy/physical-metrics": "القياسات البدنية",
  "/academy/leaderboard": "الترتيب",
  "/academy/badges": "الشارات",
  "/academy/injuries": "الإصابات",
  "/academy/evaluations": "التقييمات",
  "/academy/settings": "الإعدادات",
};

export function Layout() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, logout } = useAuth();

  const [academyName, setAcademyName] = useState("الأكاديمية");
  const [academyLogo, setAcademyLogo] = useState<string | null>(null);

  const pageTitle = pageTitles[location.pathname] || "الأكاديمية";
  const isHome = location.pathname === "/dashboard" || location.pathname === "/academy/notebook";

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const settings = await api.getAcademySettings();
        if (settings?.name) setAcademyName(settings.name);
        if (settings?.logo_url) setAcademyLogo(settings.logo_url);
      } catch (e) {}

      try {
        const [injuries, notifs] = await Promise.all([
          api.getInjuries().catch(() => []),
          api.getNotifications('admin').catch(() => [])
        ]);
        const activeInjuries = (injuries || []).filter((i: any) => i.status === "قيد العلاج").map((i: any) => ({
          id: `injury-${i.id}`,
          title: `⚠️ إصابة لاعب: ${i.players?.name || 'لاعب'}`,
          message: i.injury_type ? `نوع الإصابة: ${i.injury_type}` : 'حالة إصابة قيد العلاج',
          created_at: i.created_at || new Date().toISOString(),
          is_read: false
        }));
        const realNotifs = (notifs || []).filter((n: any) => n.title !== "ترحيب");
        setNotifications([...realNotifs, ...activeInjuries]);
      } catch (error) {}
    };
    loadData();
    const interval = setInterval(loadData, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ar" ? "fr" : i18n.language === "fr" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 overflow-hidden text-zinc-50 font-tajawal">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed on mobile, static on desktop */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col w-full min-w-0 overflow-hidden">
        {/* ======== MOBILE HEADER (App-style) ======== */}
        <header className="lg:hidden relative flex items-center h-16 px-4 border-b border-zinc-900 bg-zinc-950/95 backdrop-blur-xl z-30 transition-all duration-300" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {/* Left: Back / Menu */}
          <div className="flex items-center gap-2 w-20">
            {!isHome ? (
              <button
                onClick={() => navigate(-1)}
                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 active:scale-90 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 active:scale-90 transition-all"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Center: Page title or logo on home */}
          <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden px-2 text-center">
            {isHome ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-700">
                {academyLogo ? (
                  <img src={academyLogo} alt="Logo" className="h-9 w-9 object-contain rounded-xl shadow-lg shadow-emerald-900/20" />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg">ULTRA</div>
                )}
                <span className="text-sm font-black text-white truncate max-w-[120px] tracking-tight">{academyName}</span>
              </div>
            ) : (
              <span className="text-base font-black text-zinc-50 truncate animate-in slide-in-from-top-4 duration-500 select-none tracking-tight">{pageTitle}</span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 w-20 justify-end">
            <button
              onClick={toggleLanguage}
              className="h-10 w-10 flex items-center justify-center rounded-2xl text-zinc-400 bg-zinc-900/50 border border-zinc-800 active:scale-90 transition-all uppercase text-[9px] font-black"
            >
              <span>{i18n.language}</span>
            </button>
            <button
              onClick={() => setIsNotifOpen(prev => !prev)}
              className="relative h-10 w-10 flex items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 active:scale-90 transition-all cursor-pointer"
            >
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-zinc-950" />
              )}
              <Bell className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* ======== DESKTOP HEADER ======== */}
        <header className="hidden lg:flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className={`absolute ${i18n.language === "ar" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400`} />
              <input
                type="text"
                placeholder="بحث..."
                className={`h-10 w-full rounded-md border border-zinc-800 bg-zinc-950/50 ${i18n.language === "ar" ? "pr-10 pl-4" : "pl-10 pr-4"} text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 transition-colors uppercase"
            >
              <Globe className="h-4 w-4" />
              <span>{i18n.language}</span>
            </button>
            <button 
              onClick={() => setIsNotifOpen(prev => !prev)}
              className="relative rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 transition-colors cursor-pointer"
            >
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Notifications Dropdown Modal */}
        {isNotifOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:p-6 sm:pt-20 bg-black/40 backdrop-blur-sm" onClick={() => setIsNotifOpen(false)}>
            <div 
              className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-zinc-100">الإشعارات والتقارير</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    {notifications.length}
                  </span>
                </div>
                <button 
                  onClick={() => setIsNotifOpen(false)}
                  className="text-zinc-400 hover:text-white text-xs p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-800/50">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-sm">
                    لا توجد إشعارات جديدة
                  </div>
                ) : (
                  notifications.map((n: any, idx: number) => (
                    <div key={idx} className="p-3.5 hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-400 truncate">{n.title}</span>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 whitespace-pre-line line-clamp-3 leading-relaxed">
                        {n.message}
                      </p>
                      {n.title?.includes("حضور") && (
                        <button
                          onClick={() => {
                            setIsNotifOpen(false);
                            navigate("/attendance");
                          }}
                          className="mt-2 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                        >
                          الانتقال إلى سجل الحضور ←
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2.5 bg-zinc-950/40 border-t border-zinc-800 text-center">
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      navigate("/attendance");
                    }}
                    className="text-xs text-zinc-400 hover:text-emerald-400 font-medium cursor-pointer"
                  >
                    عرض كافة تقارير الحضور
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main 
          key={location.pathname} 
          className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-32 lg:p-6 lg:pb-6 bg-zinc-950/50 w-full animate-slide-in"
        >
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav for mobile */}
      <MobileBottomNav />
    </div>
  );
}
