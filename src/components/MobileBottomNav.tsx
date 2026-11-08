import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/services/AuthContext";
import { 
  Home, 
  Users, 
  Calendar, 
  Trophy, 
  Settings,
  BookOpen,
  User,
  Activity,
  CreditCard,
  Target,
  UserPlus,
  ClipboardCheck,
  Swords,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);

  // Monitor viewport height to hide nav when keyboard is open
  useEffect(() => {
    const handleResize = () => {
      // If height is less than 85% of initial, keyboard is probably open
      const initialHeight = window.innerHeight;
      const isKeyboardOpen = window.visualViewport ? (window.visualViewport.height < initialHeight * 0.85) : false;
      setIsVisible(!isKeyboardOpen);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      return () => window.visualViewport?.removeEventListener("resize", handleResize);
    }
  }, []);

  if (!user || !isVisible) return null;

  // Determine which links to show based on role
  let navItems: any[] = [];

  switch (user.role) {
    case 'admin':
      navItems = [
        { name: "الرئيسية", href: "/dashboard", icon: Home },
        { name: "اللاعبين", href: "/admin/players", icon: Users },
        { name: "المالية", href: "/admin/finances", icon: CreditCard },
        { name: "الطلبات", href: "/admin/player-requests", icon: UserPlus },
        { name: "المزيد", href: "/academy/settings", icon: Settings },
      ];
      break;
    case 'coach':
      navItems = [
        { name: "الرئيسية", href: "/academy/notebook", icon: BookOpen },
        { name: "الحضور", href: "/academy/attendance", icon: ClipboardCheck },
        { name: "المركز", href: "/academy/matches", icon: Swords },
        { name: "التقييم", href: "/academy/evaluations", icon: Star },
        { name: "أداء", href: "/academy/player-stats", icon: Activity },
      ];
      break;
    case 'parent':
      navItems = [
        { name: "الملف", href: "/parent-dashboard", icon: User },
        { name: "الترتيب", href: "/academy/leaderboard", icon: Trophy },
      ];
      break;
    case 'staff_storekeeper':
      navItems = [
        { name: "المخزن", href: "/admin/inventory", icon: Home },
      ];
      break;
    case 'staff_doctor':
      navItems = [
        { name: "الإصابات", href: "/academy/injuries", icon: Home },
      ];
      break;
    default:
      navItems = [
        { name: "الرئيسية", href: "/dashboard", icon: Home },
      ];
      break;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-900 pb-[env(safe-area-inset-bottom)] lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
      <nav className="flex items-center justify-around px-4 h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all relative",
                isActive
                  ? "text-emerald-500 font-bold"
                  : "text-zinc-500 active:scale-90"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-500 rounded-b-full shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-in fade-in slide-in-from-top-1 px-1" />
                )}
                <div className={cn(
                  "p-1 rounded-xl transition-all duration-300",
                  isActive ? "bg-emerald-500/10 scale-110" : ""
                )}>
                   <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-tighter transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-80 translate-y-0"
                )}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
