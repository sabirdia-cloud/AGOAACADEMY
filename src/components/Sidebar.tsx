import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../services/AuthContext";
import { api } from "../services/api";
import { useAcademy } from "../services/AcademyContext";
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  Trophy,
  Activity,
  CreditCard,
  FileText,
  Stethoscope,
  Star,
  BookOpen,
  TrendingUp,
  UserCheck,
  ClipboardCheck,
  Wallet,
  LogOut,
  Package,
  PackagePlus,
  PackageMinus,
  Settings,
  Award,
  UserPlus,
  Shirt,
  X,
  Swords,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const APP_MODE = (import.meta.env.VITE_APP_MODE || 'ADMIN') as 'ADMIN' | 'COACH' | 'REGISTRATION';

const navigationGroupsRaw = [
  {
    title: "sidebar.control_center",
    Icon: LayoutDashboard,
    roles: ['admin', 'coach'],
    items: [
      { name: "sidebar.dashboard", href: "/dashboard", Icon: LayoutDashboard, roles: ['admin', 'coach'] },
      { name: "sidebar.attendance", href: "/academy/attendance", Icon: UserCheck, roles: ['admin', 'coach'] },
      { name: "sidebar.training", href: "/academy/training", Icon: Calendar, roles: ['admin', 'coach'] },
      { name: "sidebar.coach_notebook", href: "/academy/notebook", Icon: BookOpen, roles: ['admin', 'coach'] },
    ]
  },
  {
    title: "sidebar.member_management",
    Icon: Users,
    roles: ['admin'],
    items: [
      { name: "sidebar.players", href: "/admin/players", Icon: Users, roles: ['admin'] },
      { name: "sidebar.registration_requests", href: "/admin/player-requests", Icon: UserPlus, roles: ['admin'], badge: true },
      { name: "sidebar.parents", href: "/admin/parents", Icon: Users, roles: ['admin'] },
      { name: "sidebar.categories_teams", href: "/admin/categories", Icon: Shield, roles: ['admin'] },
      { name: "sidebar.coaches", href: "/admin/coaches", Icon: UserCheck, roles: ['admin'] },
    ]
  },
  {
    title: "sidebar.technical_performance",
    Icon: Activity,
    roles: ['admin', 'coach', 'staff_doctor'],
    items: [
      { name: "sidebar.match_center", href: "/academy/matches", Icon: Swords, roles: ['admin', 'coach'] },
      { name: "sidebar.performance", href: "/academy/player-stats", Icon: Activity, roles: ['admin', 'coach'] },
      { name: "sidebar.physical_metrics", href: "/academy/physical-metrics", Icon: TrendingUp, roles: ['admin', 'coach'] },
      { name: "sidebar.injuries", href: "/academy/injuries", Icon: Stethoscope, roles: ['admin', 'coach', 'staff_doctor'] },
      { name: "sidebar.evaluations", href: "/academy/evaluations", Icon: Star, roles: ['admin', 'coach'] },
      { name: "sidebar.leaderboard", href: "/academy/leaderboard", Icon: Trophy, roles: ['admin', 'coach', 'parent'] },
    ]
  },
  {
    title: "sidebar.finance_resources",
    Icon: Wallet,
    roles: ['admin', 'staff_storekeeper'],
    items: [
      { name: "sidebar.financial_management", href: "/admin/finances", Icon: Wallet, roles: ['admin'] },
      { name: "sidebar.subscriptions", href: "/admin/subscriptions", Icon: CreditCard, roles: ['admin'] },
      { name: "sidebar.inventory", href: "/admin/inventory", Icon: Package, roles: ['admin', 'staff_storekeeper'] },
      { name: "sidebar.kit_management", href: "/admin/kits", Icon: Shirt, roles: ['admin'] },
      { name: "sidebar.coach_payroll", href: "/admin/coach-payroll", Icon: UserCheck, roles: ['admin'] },
    ]
  },
  {
    title: "sidebar.tools_admin",
    Icon: Settings,
    roles: ['admin'],
    items: [
      { name: "sidebar.tournament_pro", href: "/admin/tournament-pro", Icon: Award, roles: ['admin'] },
      { name: "sidebar.reports", href: "/admin/reports", Icon: FileText, roles: ['admin'] },
      { name: "sidebar.settings", href: "/academy/settings", Icon: Settings, roles: ['admin'] },
    ]
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { settings: academySettings } = useAcademy();
  const { t } = useTranslation();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['sidebar.control_center']);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) 
        ? prev.filter(g => g !== title)
        : [...prev, title]
    );
  };

  const academyLogo = academySettings?.logo_url?.includes('agoa_academy_logo')
    ? 'https://ouskqpcmsldrzgjkksju.supabase.co/storage/v1/object/public/photos/agoa_shield_badge_1791590773652.png'
    : (academySettings?.logo_url || '/academy-badge.png');
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const currentSeason = academySettings?.current_season || "";

  useEffect(() => {
    if (user?.role === 'admin') {
      const loadRequests = async () => {
        try {
          const requests = await api.getPlayerRequests();
          if (requests) {
            setPendingRequestsCount(requests.filter((r: any) => r.status === 'pending').length);
          }
        } catch (error) {
          console.warn("Could not load pending requests count:", error);
        }
      };
      loadRequests();
    }
  }, [user]);

  const filteredGroups = navigationGroupsRaw
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        // First check user roles
        const roleAllowed = user && item.roles.includes(user.role);
        if (!roleAllowed) return false;

        // Then check if the item is relevant for the current APP_MODE
        if (APP_MODE === 'COACH') {
          return item.roles.includes('coach');
        }
        return true; // Admin mode shows everything the user's role allows
      })
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-900/80 border-l border-zinc-800 backdrop-blur-md">
      <div className="flex h-20 items-center justify-between border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center gap-3 w-full justify-center lg:justify-start">
          {academyLogo ? (
            <img src={academyLogo} alt="Logo" className="h-10 w-10 object-contain" />
          ) : (
            <Trophy className="h-8 w-8 text-emerald-500" />
          )}
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-zinc-50 leading-tight">
              {academyName}
            </h1>
            {currentSeason && (
              <span className="text-[10px] font-medium text-emerald-500/80">
                {t('sidebar.season')} {currentSeason}
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 -ml-2 text-zinc-400 hover:text-zinc-50 lg:hidden rounded-md focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-6 px-3 py-6 overflow-y-auto custom-scrollbar">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.title);
          return (
            <div key={group.title} className="space-y-1 mb-2">
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-md hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {group.Icon && <group.Icon className="h-4 w-4 text-emerald-500/70" />}
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                    {t(group.title)}
                  </h3>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-zinc-500 transition-transform duration-200",
                    isExpanded ? "transform rotate-180" : ""
                  )}
                />
              </button>
              
              <div
                className={cn(
                  "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                  isExpanded ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
                )}
              >
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50"
                      )
                    }
                  >
                    <item.Icon className="mr-3 ml-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span className="flex-1">{t(item.name)}</span>
                    {item.badge && (
                      <span className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white transition-all",
                        pendingRequestsCount > 0 ? "bg-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-zinc-800 text-zinc-500"
                      )}>
                        {pendingRequestsCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-500 font-bold">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-50">{user?.username}</p>
              <p className="text-xs text-zinc-400">
                {user?.role === 'admin' ? t('common.system_manager') : 
                 user?.role === 'coach' ? t('common.coach') : 
                 user?.role === 'staff_storekeeper' ? t('common.storekeeper') :
                 user?.role === 'staff_doctor' ? t('common.doctor') :
                 user?.role === 'staff_assistant' ? t('common.assistant') :
                 t('common.parent')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10"
            title={t('sidebar.logout')}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
