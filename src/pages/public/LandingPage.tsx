import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/services/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, LogIn, Trophy, Shield, Star, Users, 
  ChevronRight, ArrowLeft, Heart, Target, ClipboardCheck 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [academySettings, setAcademySettings] = useState<any>(null);
    const bgImage = "/Users/saber/.gemini/antigravity/brain/964e35c1-af49-441f-a9b4-e0e7c0fa49f4/academy_landing_bg_1778854465098.png";

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await api.getAcademySettings();
                if (settings) setAcademySettings(settings);
            } catch (error) {
                console.error("Failed to load settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const portals = [
        {
            id: 'parent',
            title: 'بوابة أولياء الأمور',
            subtitle: 'Parent Portal',
            desc: 'تابع تطور أبنائك، الحضور، والمدفوعات في مكان واحد.',
            icon: Heart,
            color: 'from-blue-500 to-indigo-600',
            path: '/login/parent',
            btnText: 'دخول الأولياء',
            secondaryBtn: { text: 'فتح حساب جديد', path: '/parent-signup' }
        },
        {
            id: 'coach',
            title: 'فضاء الطاقم الفني',
            subtitle: 'Coaching Staff',
            desc: 'إدارة التدريبات، تسجيل الحضور، وإعداد التقارير البيداغوجية.',
            icon: Target,
            color: 'from-emerald-500 to-teal-600',
            path: '/login/coach',
            btnText: 'دخول المدربين',
        },
        {
            id: 'admin',
            title: 'إدارة الأكاديمية',
            subtitle: 'Management',
            desc: 'التحكم الكامل في اللاعبين، الاشتراكات، والتقارير المالية.',
            icon: Shield,
            color: 'from-amber-500 to-orange-600',
            path: '/login/admin',
            btnText: 'دخول المسؤولين',
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-950 font-tajawal rtl overflow-x-hidden selection:bg-emerald-500/30" dir="rtl">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0">
                <img 
                    src={bgImage} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-zinc-950/40"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col min-h-screen">
                {/* Header */}
                <header className="flex justify-between items-center mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-2 flex items-center justify-center shadow-2xl">
                             {academySettings?.logo_url ? (
                                <img src={academySettings.logo_url} alt="Logo" className="h-full w-full object-contain" />
                            ) : (
                                <Trophy className="h-8 w-8 text-emerald-500" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white leading-none mb-1">{academySettings?.name || "أكاديمية كرة القدم"}</h1>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Digital Excellence in Sports</p>
                        </div>
                    </div>
                    {user && (
                        <Button 
                            onClick={() => navigate(user.role === 'parent' ? '/parent-dashboard' : '/dashboard')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-12 px-6 shadow-xl shadow-emerald-950/20"
                        >
                            لوحة التحكم
                        </Button>
                    )}
                </header>

                {/* Hero Section */}
                <main className="flex-1 flex flex-col justify-center items-center text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl space-y-6"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-widest mb-4">
                            <Star size={14} fill="currentColor" /> مستقبل كرة القدم يبدأ هنا
                        </span>
                        <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
                            بوابتكم نحو <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">الاحتراف الرقمي</span>
                        </h2>
                        <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
                            مرحباً بكم في المنصة الشاملة لإدارة الأكاديمية. نظام ذكي يجمع الإدارة والمدربين والأولياء في بيئة رقمية واحدة متكاملة.
                        </p>

                        <div className="flex justify-center gap-8 md:gap-16 pt-6">
                            <div className="text-center group">
                                <p className="text-4xl md:text-5xl font-black text-white group-hover:text-emerald-500 transition-colors">200+</p>
                                <p className="text-[10px] md:text-xs text-zinc-500 font-black uppercase tracking-widest mt-1">لاعب مسجل</p>
                                <div className="h-1 w-8 bg-emerald-500/20 mx-auto mt-2 rounded-full group-hover:w-12 group-hover:bg-emerald-500 transition-all"></div>
                            </div>
                            <div className="text-center group">
                                <p className="text-4xl md:text-5xl font-black text-white group-hover:text-blue-500 transition-colors">8+</p>
                                <p className="text-[10px] md:text-xs text-zinc-500 font-black uppercase tracking-widest mt-1">مدرب محترف</p>
                                <div className="h-1 w-8 bg-blue-500/20 mx-auto mt-2 rounded-full group-hover:w-12 group-hover:bg-blue-500 transition-all"></div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Portal Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-16">
                        {portals.map((portal, idx) => (
                            <motion.div
                                key={portal.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="group"
                            >
                                <div className="relative h-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col">
                                    <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:scale-150 bg-gradient-to-br", portal.color)} />
                                    
                                    <div className="mb-8 relative">
                                        <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-12 bg-gradient-to-br", portal.color)}>
                                            <portal.icon size={32} />
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-3 mb-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black text-white">{portal.title}</h3>
                                            <span className="text-[10px] text-zinc-500 font-black uppercase">{portal.subtitle}</span>
                                        </div>
                                        <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                                            {portal.desc}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => navigate(portal.path)}
                                            className={cn("w-full h-14 rounded-2xl text-white font-black text-lg shadow-xl active:scale-95 transition-all bg-gradient-to-r", portal.color)}
                                        >
                                            {portal.btnText}
                                        </Button>
                                        {portal.secondaryBtn && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => navigate(portal.secondaryBtn.path)}
                                                className="w-full text-zinc-400 hover:text-white hover:bg-white/5 font-bold text-sm"
                                            >
                                                {portal.secondaryBtn.text}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6 text-zinc-500">
                        <div className="flex items-center gap-2">
                            <ClipboardCheck size={18} className="text-emerald-500" />
                            <span className="text-xs font-bold">نظام بيداغوجي متكامل</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-blue-500" />
                            <span className="text-xs font-bold">تواصل فعال مع الأولياء</span>
                        </div>
                    </div>
                    
                    <div className="text-center md:text-left">
                        <p className="text-xs font-bold text-zinc-600 uppercase tracking-[0.2em]">
                             &copy; {new Date().getFullYear()} {academySettings?.name} . PROFESSIONAL SPORTS MANAGEMENT
                        </p>
                    </div>
                </footer>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.4; transform: scale(1.05); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 15s ease-in-out infinite;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
