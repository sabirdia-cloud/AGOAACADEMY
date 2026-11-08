import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/services/AuthContext";
import { api } from "@/services/api";
import { useAcademy } from "@/services/AcademyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    User, Calendar, Trophy, BarChart3,
    ArrowRight, MapPin, Clock, Shield,
    Activity, CheckCircle2, XCircle, AlertCircle, TrendingUp,
    Info, FileText, ImageIcon, Bell, Star, Wallet, Scale, Ruler, Weight,
    Zap, Target, Award, Smartphone, Loader2, Upload, BookOpen, Archive,
    Phone, Users, Mail, CreditCard, Flame, Sparkles, Filter, CheckCircle, IdCard, Printer, ClipboardList
} from "lucide-react";
import { PedagogicalNotebook } from "@/components/PedagogicalNotebook";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence } from "framer-motion";
import { ScoutReportTemplate, PedagogicalNotebookTemplate } from "@/components/PrintTemplates";
import { PrintPortal } from "@/components/PrintPortal";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { DigitalIDCard } from "@/components/DigitalIDCard";
import { FUTPlayerCard } from "@/components/FUTPlayerCard";

const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
        case 'Trophy': return <Trophy className="h-4 w-4 text-amber-500" />;
        case 'Calendar': return <Calendar className="h-4 w-4 text-blue-500" />;
        case 'Target': return <Target className="h-4 w-4 text-rose-500" />;
        case 'Star': return <Star className="h-4 w-4 text-yellow-500" />;
        case 'Zap': return <Zap className="h-4 w-4 text-emerald-500" />;
        default: return <Award className="h-4 w-4 text-zinc-400" />;
    }
};

export function ParentPlayerDetails() {
    const { playerId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { settings: academySettings } = useAcademy();
    const [player, setPlayer] = useState<any>(null);
    const [attendanceStats, setAttendanceStats] = useState<any>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [trainings, setTrainings] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'matches' | 'trainings' | 'messages' | 'docs' | 'physical' | 'evaluations' | 'payments' | 'nutrition'>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [adminMessages, setAdminMessages] = useState<any[]>([]);
    const [physicalMetrics, setPhysicalMetrics] = useState<any[]>([]);
    const [playerBadges, setPlayerBadges] = useState<any[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    const [printData, setPrintData] = useState<{ 
        isOpen: boolean; 
        type: 'scout' | 'pedagogical'; 
        player: any; 
        evaluation?: any;
        evaluations?: any[];
        physicalMetrics?: any[];
        attendanceStats?: any;
    } | null>(null);
    const [showArchivedMessages, setShowArchivedMessages] = useState(false);
    const [isIDCardOpen, setIsIDCardOpen] = useState(false);
    const [isFUTCardOpen, setIsFUTCardOpen] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'parent') {
            navigate('/login');
            return;
        }
        loadData();
    }, [playerId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Verify access
            const parentKey = user?.parent_id || user?.parent_username;
            if (!parentKey) {
                navigate('/login');
                return;
            }

            const kids = await api.getParentPlayers(parentKey);
            const isAuthorized = kids.some((k: any) => k.player_id === Number(playerId));

            if (!isAuthorized) {
                navigate('/parent-dashboard');
                return;
            }

            const pData = await api.getPlayerById(Number(playerId));
            if (!pData) {
                navigate('/parent-dashboard');
                return;
            }

            if (pData.status !== 'active') {
                setPlayer(pData);
                setIsLoading(false);
                return; // Stop loading other stats if not active
            }

            const [aStats, aHistory, sData, mData, tData, msgData, evalsData, paymentsData, physMetrics, pBadges] = await Promise.all([
                api.getPlayerAttendanceStats(Number(playerId)),
                api.getPlayerAttendanceHistory(Number(playerId)).catch(() => []),
                api.getPlayerPerformanceSummary(Number(playerId)),
                api.getEMSMatches().catch(() => []),
                api.getTraining().catch(() => []),
                api.getPlayerMessages(Number(playerId)).catch(() => []),
                api.getEvaluationsByPlayer(Number(playerId)).catch(() => []),
                api.getPlayerPayments(Number(playerId)).catch(() => []),
                api.getPhysicalMetrics(Number(playerId)).catch(() => []),
                api.getPlayerBadges(Number(playerId)).catch(() => [])
            ]);
            
            setPhysicalMetrics(physMetrics || []);
            setPlayerBadges(pBadges || []);

            setPlayer({ ...pData, evaluations: evalsData, payments: paymentsData });
            setAttendanceStats(aStats);
            setAttendanceHistory(aHistory);
            setStats(sData);
            setMatches(mData.filter((m: any) => m.category === pData.category).slice(0, 5));
            setTrainings(tData.filter((t: any) => t.team_id === pData.team_id));
            setAdminMessages(msgData);
        } catch (error) {
            console.error("Failed to load player details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 font-tajawal rtl pb-12" dir="rtl">
            {/* Header */}
            <div className="bg-zinc-900/50 border-b border-zinc-800 p-4 sticky top-0 z-50 backdrop-blur-md">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-zinc-400" onClick={() => navigate('/parent-dashboard')}>
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                    <div className="h-8 w-px bg-zinc-800" />
                    <h1 className="text-zinc-50 font-black truncate">{player.name}</h1>
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
                {/* Hero Profile - Premium Redesign */}
                <Card className="bg-zinc-900 border-zinc-800/50 overflow-hidden relative group shadow-2xl rounded-[2.5rem]">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-48 -mt-48 blur-[100px] transition-all group-hover:bg-emerald-500/15" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full -ml-32 -mb-32 blur-[80px]" />
                    
                    <CardContent className="p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center relative z-10">
                        <div className="relative group/photo">
                            <div className="h-44 w-44 rounded-[2.5rem] bg-zinc-800 border-8 border-zinc-950 shadow-2xl overflow-hidden ring-1 ring-zinc-700 relative transition-transform duration-500 group-hover/photo:scale-105">
                                {player.photo_url ? (
                                    <img src={player.photo_url} alt={player.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-zinc-700 bg-zinc-900">
                                        <User className="h-20 w-20" />
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-900/90 to-transparent py-2 text-center backdrop-blur-sm">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">الموسم {academySettings?.current_season || '2024'}</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-xl border-4 border-zinc-900 text-black">
                                <Trophy className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-right space-y-6">
                            <div className="space-y-2">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div>
                                        <h2 className="text-4xl font-black text-white tracking-tight">{player.name}</h2>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-zinc-400 font-bold text-sm mt-3">
                                            <span className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-zinc-700/30"><Shield className="h-4 w-4 text-emerald-500" /> {player.category}</span>
                                            <span className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-zinc-700/30"><MapPin className="h-4 w-4 text-blue-500" /> {player.birth_city}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Button 
                                            onClick={() => {
                                                const coach = player.coach_name || 'المدرب';
                                                const coachPhone = player.coach_phone || academySettings?.phone || '213668729828';
                                                const msg = `مرحباً كوتش ${coach}، أنا ولي أمر اللاعب ${player.name}. أود الاستفسار بخصوص...`;
                                                window.open(`https://wa.me/${coachPhone.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                            }}
                                            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 px-8 font-black gap-3 shadow-xl shadow-emerald-900/20 transition-all hover:translate-y-[-2px]"
                                        >
                                            <Phone className="h-5 w-5" />
                                            مراسلة المدرب
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            className="h-14 w-14 rounded-2xl border-zinc-800 bg-zinc-950 text-emerald-500 hover:text-white hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10"
                                            title="بطاقة اللاعب الرقمية"
                                            onClick={() => setIsIDCardOpen(true)}
                                        >
                                            <IdCard className="h-6 w-6" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-6 border-t border-zinc-800/50">
                                <div className="text-right">
                                    <p className="text-[10px] text-zinc-500 font-black uppercase mb-1 tracking-widest">تاريخ الميلاد</p>
                                    <p className="text-base font-black text-zinc-100">{player.birth_date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-zinc-500 font-black uppercase mb-1 tracking-widest">مركز اللعب</p>
                                    <p className="text-base font-black text-zinc-100">{player.position || 'غير محدد'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-zinc-500 font-black uppercase mb-1 tracking-widest">المستوى الفني</p>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-24 bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${player.level_score || 75}%` }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full" 
                                            />
                                        </div>
                                        <p className="text-sm font-black text-emerald-500">{player.level_score || '75'}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Coach Profile Card (Small) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="md:col-span-1 bg-zinc-900 border-zinc-800 p-4 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
                        <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                            <Users className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">مدرب الفوج</p>
                            <h4 className="text-sm font-black text-zinc-100">{player.coach_name || "كوتش الأكاديمية"}</h4>
                            <p className="text-[10px] text-amber-500 font-bold">{player.coach_specialty || "تكوين قاعدي"}</p>
                        </div>
                    </Card>
                    
                    <Card className="md:col-span-1 bg-zinc-900 border-zinc-800 p-4 flex items-center gap-4 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                         <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-emerald-500" />
                         </div>
                         <div>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">الحالة الحركية</p>
                            <h4 className="text-sm font-black text-zinc-100">{player.evaluations?.length > 0 ? "تطور مستمر" : "بانتظار التقييم"}</h4>
                            <p className="text-[10px] text-emerald-500 font-bold">آخر تحديث: {player.evaluations?.[0]?.date || "لا يوجد"}</p>
                         </div>
                    </Card>

                    <Card className="md:col-span-1 bg-zinc-900 border-zinc-800 p-4 flex items-center gap-4 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                         <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-blue-500" />
                         </div>
                         <div>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">المركز المفضل</p>
                            <h4 className="text-sm font-black text-zinc-100">{player.position || "غير محدد"}</h4>
                            <p className="text-[10px] text-blue-500 font-bold">القدم: {player.preferred_foot || "اليمنى"}</p>
                         </div>
                    </Card>
                </div>

                {player.status !== 'active' ? (
                    <div className="py-20 text-center bg-zinc-900 border border-zinc-800 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
                        <Shield className="h-16 w-16 text-amber-500 mx-auto mb-6 opacity-80" />
                        <h3 className="text-2xl font-black text-white mb-2">في انتظار المراجعة</h3>
                        <p className="text-zinc-400 max-w-md mx-auto mb-8">
                            تم استلام طلب تسجيل هذا اللاعب بنجاح. بمجرد أن تقوم الإدارة بمراجعة الطلب والموافقة عليه، ستتمكن من رؤية كافة الإحصائيات، وجدول التدريبات، وبطاقة اللاعب من هنا.
                        </p>
                        
                        <div className="max-w-xs mx-auto px-4">
                            <Button 
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl py-8 shadow-xl shadow-emerald-900/20 h-auto flex flex-col items-center gap-1 group transition-all hover:scale-105"
                            >
                                <div className="flex items-center gap-2">
                                    <Smartphone className="h-6 w-6 animate-bounce" />
                                    دفع رسوم التسجيل (بريدي موب)
                                </div>
                                <span className="text-xs opacity-80 font-medium">لتسريع عملية قبول الطلب وتأكيد الحجز</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tab Categories & Search */}
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-[2rem] backdrop-blur-xl sticky top-20 z-40 shadow-2xl">
                                {[
                                    { id: 'overview', label: 'الأداء والنتائج', icon: Trophy, color: 'text-amber-500' },
                                    { id: 'physical', label: 'الصحة والنمو', icon: Activity, color: 'text-emerald-500' },
                                    { id: 'messages', label: 'التواصل والتنبيهات', icon: Bell, color: 'text-blue-500', badge: adminMessages.filter(m => !m.is_read).length },
                                    { id: 'payments', label: 'المالية والوثائق', icon: Wallet, color: 'text-rose-500' },
                                    { id: 'trainings', label: 'البرنامج الزمني', icon: Clock, color: 'text-indigo-500' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 relative group",
                                            activeTab === tab.id
                                                ? "bg-zinc-800 text-white shadow-xl ring-1 ring-zinc-700"
                                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
                                        )}
                                    >
                                        <tab.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", activeTab === tab.id ? tab.color : "text-zinc-600")} />
                                        {tab.label}
                                        {tab.badge ? (
                                            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center border-2 border-zinc-900 animate-bounce">
                                                {tab.badge}
                                            </span>
                                        ) : null}
                                        {activeTab === tab.id && (
                                            <motion.div layoutId="activeTab" className="absolute bottom-1 left-6 right-6 h-0.5 bg-emerald-500 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Sub-Tabs (Contextual) */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {activeTab === 'overview' && [
                                    { id: 'overview', label: 'الإحصائيات العامة', icon: BarChart3 },
                                    { id: 'evaluations', label: 'التقييم الفني المفصل', icon: Star },
                                    { id: 'matches', label: 'سجل المباريات', icon: Trophy }
                                ].map(sub => (
                                    <button 
                                        key={sub.id} 
                                        onClick={() => setActiveTab(sub.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all",
                                            activeTab === sub.id ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        <sub.icon className="h-3 w-3" />
                                        {sub.label}
                                    </button>
                                ))}
                                {activeTab === 'physical' && [
                                    { id: 'physical', label: 'المقاييس البدنية', icon: TrendingUp },
                                    { id: 'nutrition', label: 'الدليل الغذائي', icon: Activity }
                                ].map(sub => (
                                    <button 
                                        key={sub.id} 
                                        onClick={() => setActiveTab(sub.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all",
                                            activeTab === sub.id ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        <sub.icon className="h-3 w-3" />
                                        {sub.label}
                                    </button>
                                ))}
                                {activeTab === 'trainings' && [
                                    { id: 'trainings', label: 'جدول التدريبات', icon: Clock },
                                    { id: 'attendance', label: 'سجل الحضور', icon: Calendar }
                                ].map(sub => (
                                    <button 
                                        key={sub.id} 
                                        onClick={() => setActiveTab(sub.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all",
                                            activeTab === sub.id ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        <sub.icon className="h-3 w-3" />
                                        {sub.label}
                                    </button>
                                ))}
                                {activeTab === 'payments' && [
                                    { id: 'payments', label: 'حالة الاشتراكات', icon: Wallet },
                                    { id: 'docs', label: 'وثائق ومرفقات', icon: FileText }
                                ].map(sub => (
                                    <button 
                                        key={sub.id} 
                                        onClick={() => setActiveTab(sub.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all",
                                            activeTab === sub.id ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        <sub.icon className="h-3 w-3" />
                                        {sub.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                {/* Tab Contents */}
                <div className="min-h-[400px]">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <StatCard label="المباريات" value={stats.matchesPlayed} icon={Trophy} color="text-amber-500" bgColor="bg-amber-500/10" />
                            <StatCard label="الأهداف" value={stats.goals} icon={Shield} color="text-emerald-500" bgColor="bg-emerald-500/10" />
                            <StatCard label="التمريرات" value={stats.assists} icon={Activity} color="text-blue-500" bgColor="bg-blue-500/10" />
                            <StatCard label="البطاقات" value={stats.yellow + stats.red} icon={AlertCircle} color="text-rose-500" bgColor="bg-rose-500/10" />

                            <Card className="md:col-span-2 lg:col-span-4 bg-zinc-900 border-zinc-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-black flex items-center gap-2 text-zinc-400">
                                        <Award className="h-4 w-4 text-amber-500" />
                                        إنجازات وشارات التميز
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-3">
                                        {playerBadges.length === 0 ? (
                                            <p className="text-zinc-600 text-[10px] italic">لم يتم الحصول على شارات بعد. الالتزام والاجتهاد هما المفتاح!</p>
                                        ) : playerBadges.map((pb: any) => (
                                            <div key={pb.id} className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/50 px-3 py-2 rounded-xl group hover:border-amber-500/50 transition-all">
                                                {getBadgeIcon(pb.badges?.icon)}
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-zinc-100 group-hover:text-amber-500 transition-colors">{pb.badges?.name}</p>
                                                    <p className="text-[8px] text-zinc-500 font-bold">{pb.awarded_date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2 lg:col-span-4 bg-zinc-900 border-zinc-800 mt-4">
                                <CardHeader>
                                    <CardTitle className="text-sm font-black flex items-center gap-2">
                                        <Info className="h-4 w-4 text-zinc-500" />
                                        ملاحظات المدرب العامة
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-zinc-400 text-sm leading-relaxed italic">
                                        "اللاعب يقدم مجهودات رائعة في التدريبات، لديه حس تهديفي عالي ويحتاج للعمل أكثر على الجانب البدني."
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'physical' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-emerald-500/5 border-emerald-500/10 p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <Scale className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-emerald-500/50 font-black uppercase">آخر وزن مسجل</p>
                                        <p className="text-lg font-black text-white">{physicalMetrics[0]?.weight || '--'} <span className="text-[10px]">كغ</span></p>
                                    </div>
                                </Card>
                                <Card className="bg-blue-500/5 border-blue-500/10 p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                        <Ruler className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-500/50 font-black uppercase">آخر طول مسجل</p>
                                        <p className="text-lg font-black text-white">{physicalMetrics[0]?.height || '--'} <span className="text-[10px]">سم</span></p>
                                    </div>
                                </Card>
                                <Card className="bg-amber-500/5 border-amber-500/10 p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-500/50 font-black uppercase">مؤشر الكتلة (BMI)</p>
                                        <p className="text-lg font-black text-white">{physicalMetrics[0]?.bmi || '--'}</p>
                                    </div>
                                </Card>
                            </div>

                            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                                <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                                    <CardTitle className="text-sm font-black flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                        منحنى النمو البدني
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 h-[300px]">
                                    {physicalMetrics.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[...physicalMetrics].reverse()}>
                                                <defs>
                                                    <linearGradient id="pColorHeight" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                <XAxis dataKey="record_date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                                                />
                                                <Area name="الطول" type="monotone" dataKey="height" stroke="#10b981" fillOpacity={1} fill="url(#pColorHeight)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
                                            <TrendingUp className="h-12 w-12 opacity-10 mb-2" />
                                            لا توجد سجلات كافية لعرض المنحنى
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Notifications Header & Controls */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40 p-4 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
                                <div>
                                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-amber-500" />
                                        مركز التنبيهات والرسائل
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-medium mt-1">تواصل مباشر من إدارة الأكاديمية والمدربين</p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button 
                                        onClick={() => setShowArchivedMessages(!showArchivedMessages)}
                                        className={cn(
                                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                                            showArchivedMessages 
                                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                                                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
                                        )}
                                    >
                                        {showArchivedMessages ? <Bell className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                        {showArchivedMessages ? "عرض الرسائل الواردة" : "عرض الأرشيف"}
                                    </button>
                                    {!showArchivedMessages && adminMessages.some(m => !m.is_read) && (
                                        <button 
                                            onClick={async () => {
                                                const unread = adminMessages.filter(m => !m.is_read);
                                                for (const m of unread) {
                                                    await api.markNotificationAsRead(m.notification_id || m.id);
                                                }
                                                setAdminMessages(prev => prev.map(m => ({ ...m, is_read: true })));
                                            }}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            تحديد الكل كمقروء
                                        </button>
                                    )}
                                </div>
                            </div>

                            {adminMessages.filter((m: any) => showArchivedMessages ? m.is_read : !m.is_read).length === 0 ? (
                                <div className="py-24 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[2.5rem] flex flex-col items-center justify-center">
                                    <div className="h-20 w-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6">
                                        {showArchivedMessages ? (
                                            <Archive className="h-10 w-10 text-zinc-700" />
                                        ) : (
                                            <Bell className="h-10 w-10 text-zinc-800 animate-pulse" />
                                        )}
                                    </div>
                                    <h4 className="text-xl font-black text-zinc-300 mb-2">
                                        {showArchivedMessages ? "الأرشيف فارغ" : "لا توجد رسائل جديدة"}
                                    </h4>
                                    <p className="text-zinc-500 font-medium max-w-xs mx-auto">
                                        {showArchivedMessages ? "لم تقم بأرشفة أي رسائل بعد." : "كل شيء على ما يرام! لا توجد تنبيهات عاجلة بانتظارك حالياً."}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {adminMessages.filter((m: any) => showArchivedMessages ? m.is_read : !m.is_read).map((msg: any, idx: number) => {
                                        // Detect message type for better icon/color
                                        const isFinancial = msg.message.includes('دفع') || msg.message.includes('اشتراك') || msg.message.includes('رسوم');
                                        const isTechnical = msg.message.includes('تقييم') || msg.message.includes('مستوى') || msg.message.includes('أداء');
                                        const isEvent = msg.message.includes('مباراة') || msg.message.includes('تدريب') || msg.message.includes('موعد');
                                        
                                        const icon = isFinancial ? <CreditCard className="h-5 w-5" /> : 
                                                    isTechnical ? <Star className="h-5 w-5" /> : 
                                                    isEvent ? <Calendar className="h-5 w-5" /> : <Mail className="h-5 w-5" />;
                                        
                                        const colorClass = isFinancial ? "text-rose-500 bg-rose-500/10 border-rose-500/20" :
                                                          isTechnical ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                                                          isEvent ? "text-blue-500 bg-blue-500/10 border-blue-500/20" :
                                                          "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";

                                        return (
                                            <motion.div 
                                                key={msg.notification_id || msg.id} 
                                                initial={false}
                                                animate={!msg.is_read ? {
                                                    boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 15px rgba(16,185,129,0.1)", "0 0 0px rgba(16,185,129,0)"],
                                                    borderColor: ["rgba(63,63,70,0.5)", "rgba(16,185,129,0.3)", "rgba(63,63,70,0.5)"]
                                                } : { boxShadow: "0 0 0px rgba(0,0,0,0)", borderColor: "rgba(39,39,42,0.6)" }}
                                                transition={{ 
                                                    repeat: Infinity, 
                                                    duration: 2,
                                                    ease: "easeInOut"
                                                }}
                                                className={cn(
                                                    "relative p-6 rounded-[2rem] border transition-all duration-300 group overflow-hidden",
                                                    msg.is_read 
                                                        ? "bg-zinc-900/50 border-zinc-800/60 opacity-80" 
                                                        : "bg-zinc-900 border-zinc-700/50 shadow-xl shadow-black/20"
                                                )}
                                            >
                                                {!msg.is_read && (
                                                    <motion.div 
                                                        initial={{ x: '-100%' }}
                                                        animate={{ x: '200%' }}
                                                        transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 1 }}
                                                        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] pointer-events-none"
                                                    />
                                                )}
                                                
                                                {!msg.is_read && (
                                                    <div className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-emerald-500 to-blue-500" />
                                                )}
                                                
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
                                                    <div className="flex gap-4">
                                                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border", colorClass)}>
                                                            {icon}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter border",
                                                                    msg.is_read ? "bg-zinc-800 text-zinc-500 border-zinc-700" : "bg-zinc-950 text-white border-zinc-800"
                                                                )}>
                                                                    {isFinancial ? "مالي" : isTechnical ? "فني" : isEvent ? "نشاط" : "إداري"}
                                                                </span>
                                                                {!msg.is_read && (
                                                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                )}
                                                            </div>
                                                            <p className={cn(
                                                                "text-sm sm:text-base leading-relaxed font-bold mt-2",
                                                                msg.is_read ? "text-zinc-400" : "text-zinc-50"
                                                            )}>
                                                                {msg.message}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-3">
                                                                <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(msg.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </span>
                                                                {msg.sender_name && (
                                                                    <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                                                                        <User className="h-3 w-3" />
                                                                        من: {msg.sender_name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {!msg.is_read && (
                                                        <button 
                                                            onClick={async () => {
                                                                await api.markNotificationAsRead(msg.notification_id || msg.id);
                                                                setAdminMessages((prev: any[]) => prev.map((m: any) => (m.notification_id || m.id) === (msg.notification_id || msg.id) ? { ...m, is_read: true } : m));
                                                            }}
                                                            className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/20 transition-all self-end sm:self-start"
                                                        >
                                                            تحديد كمقروء
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* Action Buttons for specific types */}
                                                {isFinancial && !msg.is_read && (
                                                    <div className="mt-6 pt-4 border-t border-zinc-800 flex gap-3">
                                                        <Button 
                                                            onClick={() => setActiveTab('payments')}
                                                            size="sm" 
                                                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] h-8 rounded-lg font-black"
                                                        >
                                                            <CreditCard className="h-3.5 w-3.5 ml-1.5" />
                                                            دفع المستحقات الآن
                                                        </Button>
                                                    </div>
                                                )}
                                                {isTechnical && !msg.is_read && (
                                                    <div className="mt-6 pt-4 border-t border-zinc-800 flex gap-3">
                                                        <Button 
                                                            onClick={() => setActiveTab('evaluations')}
                                                            size="sm" 
                                                            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] h-8 rounded-lg font-black"
                                                        >
                                                            <Star className="h-3.5 w-3.5 ml-1.5" />
                                                            عرض التقييم الفني
                                                        </Button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'trainings' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {trainings.length === 0 && (
                                <div className="py-12 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
                                    <Clock className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-500 font-bold">لا توجد حصص تدريبية مبرمجة حالياً.</p>
                                </div>
                            )}
                            {trainings.map((t: any) => {
                                const now = new Date();
                                const todayStr = now.toISOString().split('T')[0];
                                const isToday = t.date === todayStr;
                                const startTime = new Date(`${t.date}T${t.start_time}`);
                                const endTime = new Date(`${t.date}T${t.end_time || '23:59:00'}`);
                                const isLive = isToday && now >= startTime && now <= endTime;

                                return (
                                    <Card key={t.training_id} className={cn(
                                        "bg-zinc-900 border-zinc-800 transition-all relative overflow-hidden",
                                        isLive ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "hover:border-zinc-700"
                                    )}>
                                        {isLive && (
                                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg animate-pulse">
                                                مباشر الآن LIVE
                                            </div>
                                        )}
                                        <CardContent className="p-5 flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                                                    isLive ? "bg-emerald-500 text-white animate-pulse" : "bg-emerald-500/10 text-emerald-500"
                                                )}>
                                                    <Calendar className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-zinc-200">{isToday ? "اليوم" : t.date}</h4>
                                                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                                        <Clock className="h-3 w-3" /> {t.start_time} - {t.end_time}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-left font-bold text-zinc-400 text-xs">
                                                {t.location}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center">
                                    <p className="text-3xl font-black text-white">{attendanceStats.present}</p>
                                    <p className="text-xs text-emerald-500 font-bold mt-1 uppercase">حضور</p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center">
                                    <p className="text-3xl font-black text-white">{attendanceStats.absent}</p>
                                    <p className="text-xs text-rose-500 font-bold mt-1 uppercase">غياب</p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center">
                                    <p className="text-3xl font-black text-white">{attendanceStats.late}</p>
                                    <p className="text-xs text-amber-500 font-bold mt-1 uppercase">تأخر</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">سجل الحضور المفصل</h3>
                                {attendanceHistory.length === 0 ? (
                                    <div className="py-12 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
                                        <p className="text-zinc-500 font-bold text-sm">لا يوجد سجل حضور مسجل بعد.</p>
                                    </div>
                                ) : (
                                    attendanceHistory.map(record => (
                                        <div key={record.attendance_id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center group hover:border-zinc-700 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center",
                                                    record.status === 'حاضر' ? "bg-emerald-500/10 text-emerald-500" :
                                                        record.status === 'غائب' ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                                                )}>
                                                    {record.status === 'حاضر' ? <CheckCircle2 className="h-5 w-5" /> :
                                                        record.status === 'غائب' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-zinc-200">{record.training?.date || record.created_at?.split('T')[0]}</h4>
                                                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 mt-1 font-bold">
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {record.check_in_time || '--:--'}</span>
                                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {record.training?.location || 'غير محدد'}</span>
                                                        {record.notes && (
                                                            <span className="flex items-center gap-1 text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-full"><Info className="h-3 w-3" /> ملاحظة: {record.notes}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <span className={cn(
                                                    "text-xs font-black uppercase px-2 py-1 rounded-md",
                                                    record.status === 'حاضر' ? "bg-emerald-500/10 text-emerald-500" :
                                                        record.status === 'غائب' ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                                                )}>
                                                    {record.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'matches' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {matches.length === 0 && (
                                <div className="py-12 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
                                    <Trophy className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-500 font-bold">لا توجد مباريات مسجلة حالياً لهذه الفئة.</p>
                                </div>
                            )}
                            {matches.map(m => (
                                <Card key={m.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all">
                                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6 items-center">
                                        <div className="flex-1 text-center sm:text-right">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">{m.competition || 'لقاء ودي'}</p>
                                            <div className="flex items-center justify-center sm:justify-end gap-4">
                                                <h4 className="font-black text-lg text-white">{m.home_team}</h4>
                                                <div className="text-xs bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800 font-black text-zinc-500 italic">VS</div>
                                                <h4 className="font-black text-lg text-zinc-400">{m.away_team}</h4>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === 'evaluations' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PedagogicalNotebook player={player} isCoach={false} />
                        </div>
                    )}

                    {activeTab === 'nutrition' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-emerald-600 border-none relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                        <Activity className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="text-center md:text-right">
                                        <h3 className="text-2xl font-black text-white mb-2">الدليل الغذائي للبطل الصغير</h3>
                                        <p className="text-emerald-50/80 text-sm leading-relaxed max-w-xl">
                                            الغذاء هو الوقود الذي يحرك اللاعب. الالتزام بنظام غذائي متوازن هو نصف النجاح في الملعب. إليك أهم النصائح الموصى بها من خبراء التغذية الرياضية.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-4">
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-black text-white">وجبة ما قبل التدريب</h4>
                                    <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
                                        <li>يجب تناولها قبل 2-3 ساعات من التمرين.</li>
                                        <li>تركيز عالي على الكربوهيدرات (مكرونة، أرز).</li>
                                        <li>تجنب الأطعمة الدسمة أو الثقيلة.</li>
                                        <li>موزة أو حبة تمر قبل 30 دقيقة من البداية.</li>
                                    </ul>
                                </Card>

                                <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-4">
                                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-black text-white">ترطيب الجسم (الماء)</h4>
                                    <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
                                        <li>شرب 500 مل من الماء قبل التمرين بساعتين.</li>
                                        <li>رشفات صغيرة من الماء كل 15-20 دقيقة أثناء اللعب.</li>
                                        <li>تعويض السوائل المفقودة بعد التمرين فوراً.</li>
                                        <li>تجنب المشروبات الغازية أو المحلاة.</li>
                                    </ul>
                                </Card>

                                <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-4">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Target className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-black text-white">وجبة الاستشفاء</h4>
                                    <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
                                        <li>تناول بروتين (دجاج، بيض، سمك) لإصلاح العضلات.</li>
                                        <li>إضافة خضروات ملونة للفيتامينات والمعادن.</li>
                                        <li>شرب عصير طبيعي طازج.</li>
                                        <li>النوم المبكر (8-10 ساعات) ضروري للاستشفاء.</li>
                                    </ul>
                                </Card>
                            </div>

                            <Card className="bg-zinc-900 border-zinc-800 p-6">
                                <h4 className="font-black text-zinc-100 mb-4 flex items-center gap-2">
                                    <Info className="h-5 w-5 text-emerald-500" />
                                    طبق اللاعب المثالي
                                </h4>
                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    <div className="relative h-48 w-48 rounded-full border-4 border-emerald-500/20 p-2 shrink-0">
                                        <div className="h-full w-full rounded-full border-4 border-dashed border-emerald-500/40 flex items-center justify-center text-zinc-700 text-[10px] text-center font-black">
                                            50% خضروات<br/>25% بروتين<br/>25% كربوهيدرات
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-sm text-zinc-400">
                                        <p>نوصي الأولياء بالحرص على تنوع العناصر الغذائية في الوجبات اليومية، مع تقليل السكريات المصنعة والوجبات السريعة التي تؤثر سلباً على سرعة وتركيز اللاعب في الميدان.</p>
                                        <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                                            <p className="text-xs text-amber-500 font-black mb-1">💡 نصيحة ذهبية:</p>
                                            <p className="text-[11px] leading-relaxed italic">"اللاعب الذي يأكل جيداً، يتدرب جيداً، وينمو بشكل أفضل."</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Main Digital Dossier Header */}
                            <div className="text-right space-y-2">
                                <h3 className="text-2xl font-black text-white">الوثائق والتقارير الرسمية</h3>
                                <p className="text-zinc-500 text-sm font-medium">سجل متكامل لمسار اللاعب الرياضي والتربوي داخل الأكاديمية</p>
                            </div>

                            {/* Featured: Pedagogical Notebook */}
                            <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 overflow-hidden relative group shadow-2xl rounded-[2.5rem]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500" />
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
                                
                                <div className="p-8 md:p-12 relative z-10">
                                    <div className="flex flex-col lg:flex-row gap-10 items-start">
                                        <div className="h-32 w-32 rounded-3xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
                                            <BookOpen size={64} strokeWidth={1.5} />
                                        </div>
                                        
                                        <div className="flex-1 space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">وثيقة رسمية شاملة</span>
                                                    <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black px-3 py-1 rounded-full border border-zinc-700">نسخة 2024.1</span>
                                                </div>
                                                <h4 className="text-3xl font-black text-white tracking-tight">الدفتر البيداغوجي الموحد</h4>
                                                <p className="text-zinc-400 leading-relaxed text-sm max-w-2xl">
                                                    هذا الدفتر هو المرآة العاكسة لتطور اللاعب. يجمع بين التقارير الفنية، المتابعة الطبية، وسجل الانضباط والحضور في وثيقة واحدة من 3 صفحات منظمة بدقة.
                                                </p>
                                            </div>

                                            {/* Key Metrics Preview */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                                                    <p className="text-[10px] text-zinc-500 font-black mb-1 uppercase">نسبة الحضور</p>
                                                    <p className="text-xl font-black text-zinc-100">{attendanceStats?.percentage || '0'}%</p>
                                                </div>
                                                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                                                    <p className="text-[10px] text-zinc-500 font-black mb-1 uppercase">التقييم العام</p>
                                                    <p className="text-xl font-black text-amber-500">{player.level_score || '75'}%</p>
                                                </div>
                                                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                                                    <p className="text-[10px] text-zinc-500 font-black mb-1 uppercase">المباريات</p>
                                                    <p className="text-xl font-black text-blue-500">{matches.length}</p>
                                                </div>
                                                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                                                    <p className="text-[10px] text-zinc-500 font-black mb-1 uppercase">الحالة البدنية</p>
                                                    <p className="text-xl font-black text-emerald-500">مثالية</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 pt-4">
                                                <Button 
                                                    onClick={() => {
                                                        setPrintData({ 
                                                            isOpen: true, 
                                                            type: 'pedagogical',
                                                            player, 
                                                            evaluations: player.evaluations,
                                                            physicalMetrics,
                                                            attendanceStats
                                                        });
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-7 rounded-2xl h-auto flex items-center gap-3 shadow-2xl shadow-emerald-900/40 text-base transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <FileText className="h-6 w-6" />
                                                    عرض وتحميل الدفتر (PDF)
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Secondary Documents Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-zinc-900/50 border-zinc-800 p-8 rounded-[2rem] flex flex-col justify-between group hover:bg-zinc-900 transition-all">
                                    <div className="space-y-4">
                                        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-lg border border-amber-500/20">
                                            <Trophy size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white">بطاقة تقييم الكشاف</h4>
                                            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">تحليل تقني معمق لنقاط القوة والضعف، مصمم بطريقة البطاقات العالمية (Scout Report).</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost"
                                        onClick={() => {
                                            const latestEval = player.evaluations?.sort((a: any, b: any) => new Date(b.date || b.evaluation_date).getTime() - new Date(a.date || a.evaluation_date).getTime())[0];
                                            setPrintData({ isOpen: true, type: 'scout', player, evaluation: latestEval });
                                        }}
                                        className="mt-8 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 font-black justify-start p-0 h-auto"
                                    >
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                        فتح ملف التقييم التقني
                                    </Button>
                                </Card>

                                <Card className="bg-zinc-900/50 border-zinc-800 p-8 rounded-[2rem] flex flex-col justify-between group opacity-60">
                                    <div className="space-y-4">
                                        <div className="h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                                            <Award size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-zinc-400">شهادة التميز الرياضي</h4>
                                            <p className="text-zinc-600 text-xs mt-2 leading-relaxed">تصدر هذه الشهادة حصرياً في نهاية الموسم للاعبين المنضبطين والمتميزين.</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 text-zinc-600 font-black text-xs flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        قريباً في ختام الموسم
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-emerald-500/5 border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                                    <p className="text-xs text-emerald-500 font-black uppercase mb-1">الخطة الحالية</p>
                                    <h4 className="text-2xl font-black text-emerald-400">{player.subscription_plan || 'خطة شهرية'}</h4>
                                    <Button 
                                        onClick={() => setIsPaymentModalOpen(true)}
                                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black w-full rounded-xl py-6 shadow-lg shadow-emerald-900/20 h-auto flex flex-col items-center gap-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="h-5 w-5" />
                                            دفع الاشتراك (بريدي موب)
                                        </div>
                                        <span className="text-[10px] opacity-80 font-medium">سريع، آمن، ومباشر من هاتفك</span>
                                    </Button>
                                </Card>
                                <Card className="bg-zinc-900 border-zinc-800 p-6 rounded-2xl">
                                    <p className="text-xs text-zinc-500 font-black uppercase mb-1">تاريخ انتهاء الاشتراك</p>
                                    <h4 className="text-2xl font-black text-zinc-300">{player.subscription_end || '2026-04-01'}</h4>
                                    <div className="mt-6 p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                        <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">
                                            يرجى التأكد من تسديد المستحقات قبل تاريخ الانتهاء لتفادي تعليق مشاركة اللاعب في التدريبات والمباريات الرسمية.
                                        </p>
                                    </div>
                                </Card>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">سجل المدفوعات</h3>
                                {player.payments?.length === 0 ? (
                                    <div className="py-12 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
                                        <p className="text-zinc-500 font-bold text-sm">لا توجد دفعات مسجلة بعد.</p>
                                    </div>
                                ) : player.payments?.sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).map((pay: any) => (
                                    <div key={pay.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex justify-between items-center group hover:border-zinc-700 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                                pay.status === 'pending' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                                            )}>
                                                {pay.payment_method === 'baridimob' ? <Smartphone className="h-6 w-6" /> : <Wallet className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-zinc-100">{pay.payment_date}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{pay.payment_method === 'baridimob' ? 'بريدي موب' : 'نقداً'}</p>
                                                    {pay.status === 'pending' && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full font-black animate-pulse">في انتظار التأكيد</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-white text-lg">{pay.amount} <span className="text-[10px] text-zinc-500">دج</span></p>
                                            {pay.status === 'completed' && <span className="text-[9px] text-emerald-500 font-black flex items-center gap-1 justify-end mt-1"><CheckCircle2 className="h-3 w-3" /> مدفوع</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="الدفع عبر بريدي موب 💳">
                    <div className="space-y-6 text-right font-tajawal">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl space-y-4">
                            <h4 className="text-sm font-black text-emerald-500 mb-2">بيانات تحويل الأموال:</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                                    <button onClick={() => { navigator.clipboard.writeText(academySettings?.baridi_rip || '007'); alert('تم نسخ الرقم'); }} className="text-[10px] text-emerald-500 font-black hover:underline">نسخ الحساب</button>
                                    <div className="text-left">
                                        <p className="text-[10px] text-zinc-500 font-bold">رقم الحساب (RIP)</p>
                                        <p className="text-sm font-black text-zinc-200 tracking-widest">{academySettings?.baridi_rip || "0079999900XXXXXXXXXX"}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                                    <span className="text-zinc-500 text-[10px]">المستفيد</span>
                                    <div className="text-left">
                                        <p className="text-[10px] text-zinc-500 font-bold">الاسم الكامل</p>
                                        <p className="text-sm font-black text-zinc-200 uppercase">{academySettings?.baridi_name || "ACADEMY ADMIN"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl relative overflow-hidden">
                                <label className="flex flex-col items-center justify-center gap-3 cursor-pointer py-4">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={async (e) => {
                                            if (e.target.files?.[0]) {
                                                setIsUploadingProof(true);
                                                try {
                                                    const url = await api.uploadPlayerPhoto(e.target.files[0]);
                                                    const payment = {
                                                        player_id: Number(playerId),
                                                        amount: 3000, // Monthly fee default
                                                        payment_date: new Date().toISOString().split('T')[0],
                                                        payment_method: 'baridimob',
                                                        status: 'pending',
                                                        proof_image_url: url
                                                    };
                                                    await api.addPayment(payment);
                                                    alert("تم إرسال وصل الدفع بنجاح. سيقوم المسؤول بمراجعته وتأكيده قريباً.");
                                                    setIsPaymentModalOpen(false);
                                                    window.location.reload();
                                                } catch (err) {
                                                    console.error(err);
                                                    alert("فشل رفع الوصل، يرجى المحاولة لاحقاً.");
                                                } finally {
                                                    setIsUploadingProof(false);
                                                }
                                            }
                                        }}
                                    />
                                    {isUploadingProof ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                                            <p className="text-xs font-black text-emerald-500">جاري الرفع...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-zinc-200">ارفع صورة وصل التحويل</p>
                                                <p className="text-[10px] text-zinc-500 font-bold mt-1">Screenshot من تطبيق بريدي موب أو صورة الوصل الورقي</p>
                                            </div>
                                        </>
                                    )}
                                </label>
                            </div>
                            <Button disabled={isUploadingProof} variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="w-full border-zinc-800 text-zinc-400 py-6 rounded-xl hover:bg-zinc-800 transition-all font-black">
                                إلغاء
                            </Button>
                        </div>
                    </div>
                </Modal>

                {printData && printData.isOpen && (
                    <PrintPortal 
                        onClose={() => setPrintData(null)}
                        title={printData.type === 'scout' ? `تقرير الكشاف - ${player.name}` : `الدفتر البيداغوجي - ${player.name}`}
                        fileName={printData.type === 'scout' ? `ScoutReport-${player.name}` : `PedagogicalNotebook-${player.name}`}
                        id={printData.type === 'scout' ? "scout-doc" : "pedagogical-notebook-doc"}
                    >
                        {printData.type === 'scout' ? (
                            <ScoutReportTemplate 
                                player={player}
                                evaluation={printData.evaluation}
                                academySettings={academySettings}
                            />
                        ) : (
                            <PedagogicalNotebookTemplate 
                                player={player}
                                evaluations={printData.evaluations}
                                physicalMetrics={printData.physicalMetrics}
                                attendanceStats={printData.attendanceStats}
                                academySettings={academySettings}
                            />
                        )}
                    </PrintPortal>
                )}

                {/* Digital ID Card Modal */}
                <Modal
                    isOpen={isIDCardOpen}
                    onClose={() => setIsIDCardOpen(false)}
                    title="بطاقة العضوية الرقمية"
                    size="sm"
                >
                    <div className="py-8">
                        <DigitalIDCard player={player} academySettings={academySettings} />
                        <div className="mt-8 text-center space-y-4">
                            <p className="text-zinc-400 text-sm font-medium px-4">
                                يمكنك إظهار هذه البطاقة عند مدخل الأكاديمية لتسجيل الحضور بسرعة عبر مسح الرمز.
                            </p>
                            <Button 
                                variant="outline" 
                                className="text-zinc-400 border-zinc-800"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-4 w-4 ml-2" />
                                طباعة نسخة ورقية
                            </Button>
                        </div>
                    </div>
                </Modal>
                </>
                )}
            </main >
        </div >
    );
}

function EvalCircle({ label, value, color }: any) {
    return (
        <div className="text-center">
            <div className="relative h-16 w-16 mx-auto mb-2 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-zinc-800" />
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={175} strokeDashoffset={175 - (175 * (value || 80) / 100)} className={color} />
                </svg>
                <span className="absolute text-xs font-black text-white">{value || 80}</span>
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase">{label}</p>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="bg-zinc-900 border-zinc-800 p-6 flex items-center justify-between group hover:border-zinc-700 transition-all">
            <div>
                <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">{label}</p>
                <p className="text-2xl font-black text-white">{value}</p>
            </div>
            <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", bgColor)}>
                <Icon className={cn("h-6 w-6", color)} />
            </div>
        </Card>
    );
}
