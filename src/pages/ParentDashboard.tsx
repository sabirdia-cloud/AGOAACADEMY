import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/services/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    User, Users, Calendar, Trophy, Bell, Archive,
    ArrowLeft, LogOut, ChevronRight, Star,
    CheckCircle2, AlertCircle, Clock, Plus, Phone, Printer, Check, Trash2,
    Smartphone, Wallet, Loader2, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EventsManagement } from "@/components/EventsManagement";
import { MatchLineupBuilder } from "@/components/MatchLineupBuilder";
import { Player, Notification, FormattedNotification } from "@/types";
import { Modal } from "@/components/ui/modal";
import { PlayerCardTemplate, PlayerApplicationTemplate } from "@/components/PrintTemplates";
import { PrintPortal } from "@/components/PrintPortal";
import { exportToPDF, exportToPNG } from "@/lib/pdf-export";

export function ParentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [children, setChildren] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<FormattedNotification[]>([]);
    const [personalMessages, setPersonalMessages] = useState<FormattedNotification[]>([]);
    const [isMessageViewOpen, setIsMessageViewOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [activeModalTab, setActiveModalTab] = useState<'card' | 'application'>('card');
    const [showArchived, setShowArchived] = useState(false);
    const [academySettings, setAcademySettings] = useState<any>(null);
    const [showPrintPortal, setShowPrintPortal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    const [selectedChildForPayment, setSelectedChildForPayment] = useState<any>(null);
    const [view, setView] = useState<'dashboard' | 'events' | 'matches'>('dashboard');

    // ... existing loadData and effect ...

    const handleDirectDownload = async () => {
        if (!selectedChild) return;
        setIsDownloading(true);
        const elementId = activeModalTab === 'card' ? "player-card" : "player-application";
        const fileName = activeModalTab === 'card' ? `Card-${selectedChild.name}` : `App-${selectedChild.name}`;

        try {
            await exportToPDF(elementId, fileName);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePNGDownload = async () => {
        if (!selectedChild) return;
        setIsDownloading(true);
        try {
            await exportToPNG("player-card", `Card-${selectedChild.name}`);
        } finally {
            setIsDownloading(false);
        }
    };

    // ... keep the rest of the component but update the Modal part ...

    // Updating the Modal buttons
    const renderModalButtons = () => (
        <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
                onClick={handleDirectDownload}
                disabled={isDownloading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black px-8 py-6 rounded-xl shadow-lg flex-1"
            >
                <Printer className="h-5 w-5 ml-2" />
                تحميل PDF المباشر
            </Button>

            {activeModalTab === 'card' && (
                <Button
                    onClick={handlePNGDownload}
                    disabled={isDownloading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-6 rounded-xl shadow-lg flex-1"
                >
                    <Plus className="h-5 w-5 ml-2" />
                    تحميل بصيغة PNG
                </Button>
            )}
        </div>
    );


    useEffect(() => {
        if (!user || user.role !== 'parent') {
            navigate('/login');
            return;
        }
        loadData();
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const parentKey = user?.parent_id || user?.parent_username;
            if (parentKey) {
                const kidsList = await api.getParentPlayers(parentKey);
                setChildren(kidsList);

                const attendancePromises = kidsList.map((k: any) => api.getPlayerAttendanceHistory(k.player_id).catch(() => []));

                const [allAttendance, allTrainings, personalMessages, settingsData] = await Promise.all([
                    Promise.all(attendancePromises),
                    api.getTraining().catch(() => []),
                    api.getParentNotifications(user.parent_id || user.parent_username).catch(() => []),
                    api.getAcademySettings().catch(() => null)
                ]);

                if (settingsData) setAcademySettings(settingsData);

                const formattedAttendance = allAttendance.flat().slice(0, 5).map((a: any) => {
                    const time = new Date(a.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
                    const notesText = a.notes ? `\nملاحظة المدرب: ${a.notes}` : '';
                    return {
                        id: `att-${a.attendance_id}`,
                        original_id: a.attendance_id,
                        title: `تسجيل حضور: ${kidsList.find(k => k.player_id === a.player_id)?.name}`,
                        body: `تم تسجيل حالة اللاعب كـ (${a.status}) يوم ${a.training?.date || ''} على الساعة ${time}.${notesText}`,
                        type: a.status === 'حاضر' ? 'match' : 'alert',
                        date: a.training?.date || 'اليوم',
                        timestamp: new Date(a.created_at).getTime(),
                        is_read: true
                    };
                });

                // Get upcoming trainings for children's teams (disappear after training ends)
                const childTeamIds = Array.from(new Set(kidsList.map((k: any) => k.team_id)));
                const upcomingTrainings = allTrainings
                    .filter((t: any) => {
                        if (!childTeamIds.includes(t.team_id)) return false;
                        const endTime = t.end_time || '23:59:00';
                        const trainingEndObj = new Date(`${t.date}T${endTime}`);
                        return trainingEndObj > new Date();
                    })
                    .slice(0, 3)
                    .map((t: any) => ({
                        id: `trn-${t.training_id}`,
                        original_id: t.training_id,
                        title: "موعد تدريب جديد",
                        body: `حصة تدريبية يوم ${t.date} على الساعة ${t.start_time} في ${t.location}`,
                        type: "training",
                        date: t.date,
                        timestamp: new Date(t.date).getTime(),
                        is_read: false
                    }));

                const formattedPersonalMessages = personalMessages.map((m: any) => ({
                    id: `pmsg-${m.notification_id}`,
                    original_id: m.notification_id,
                    title: m.title || `رسالة من الإدارة`,
                    body: m.message,
                    type: m.type || 'alert',
                    date: new Date(m.created_at).toLocaleDateString('en-CA'),
                    timestamp: new Date(m.created_at).getTime(),
                    is_read: m.is_read
                }));

                setPersonalMessages(formattedPersonalMessages);
                setUnreadCount(formattedPersonalMessages.filter((m: any) => !m.is_read).length);

                // Combined list for dashboard feed - Only show UNREAD personal messages
                const allNotifications = [
                    ...formattedPersonalMessages.filter((m: any) => !m.is_read), 
                    ...formattedAttendance, 
                    ...upcomingTrainings
                ]
                    .sort((a: any, b: any) => b.timestamp - a.timestamp)
                    .slice(0, 10);

                setNotifications(allNotifications);
            }
        } catch (error) {
            console.error("Failed to load parent data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenMessages = (isArchive: boolean = false) => {
        setShowArchived(isArchive);
        setIsMessageViewOpen(true);
        if (!isArchive && unreadCount > 0) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.log("Audio blocked", e));
        }

        const unreadIds = personalMessages.filter((m: any) => !m.is_read).map((m: any) => m.original_id);
        if (unreadIds.length > 0) {
            setPersonalMessages((prev: any[]) => prev.map((m: any) => ({ ...m, is_read: true })));
            setUnreadCount(0);

            // Update in DB asynchronously
            unreadIds.forEach((id: number) => {
                api.markNotificationAsRead(id).catch(console.error);
            });
        }
    };

    const handleDeleteMessage = async (msgId: number) => {
        try {
            await api.deleteParentNotification(msgId);
            setPersonalMessages((prev: any[]) => prev.filter((m: any) => m.original_id !== msgId));
            // Update dashboard feed
            setNotifications((prev: any[]) => prev.filter((n: any) => n.original_id !== msgId));
        } catch (error) {
            console.error("Failed to delete notification:", error);
            alert("حدث خطأ أثناء الحذف");
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
        <div className="min-h-screen bg-zinc-950 font-tajawal rtl" dir="rtl">
            {/* Top Bar */}
            <div className="bg-zinc-900/50 border-b border-zinc-800 p-4 sticky top-0 z-50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Trophy className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-zinc-50 leading-none">فضاء الأولياء</h1>
                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Academy Management System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleOpenMessages(false)}
                            className="relative h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 transition-all group"
                            title="التنبيهات الجديدة"
                        >
                            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 border-2 border-zinc-950 text-[10px] font-black text-white flex items-center justify-center animate-bounce">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => handleOpenMessages(true)}
                            className="h-10 w-10 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-emerald-500 transition-all group"
                            title="الأرشيف"
                        >
                            <Archive className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        </button>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-rose-500" onClick={() => { logout(); navigate('/login'); }}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* Welcome Section */}
                <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mt-32 blur-3xl opacity-50" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-50 mb-2">مرحباً بك، {user?.username}</h2>
                            <p className="text-zinc-400">تابع مسيرة أبنائك الرياضية وإحصائياتهم بكل سهولة.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <Button 
                                onClick={() => setView('dashboard')} 
                                variant={view === 'dashboard' ? 'default' : 'outline'}
                                className={cn("px-8 py-6 rounded-2xl font-black", view === 'dashboard' ? 'bg-emerald-600' : 'border-zinc-800 text-zinc-400')}
                            >
                                <Users className="ml-2 w-5 h-5" /> أبنائي
                            </Button>
                            <Button 
                                onClick={() => setView('events')} 
                                variant={view === 'events' ? 'default' : 'outline'}
                                className={cn("px-8 py-6 rounded-2xl font-black", view === 'events' ? 'bg-blue-600' : 'border-zinc-800 text-zinc-400')}
                            >
                                <Calendar className="ml-2 w-5 h-5" /> الأحداث
                            </Button>
                            <a
                                href="#/player-register"
                                className="bg-zinc-800 hover:bg-zinc-700 text-white font-black px-8 py-6 rounded-2xl shadow-xl border border-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="h-5 w-5" />
                                <span>تسجيل لاعب جديد</span>
                            </a>
                        </div>
                    </div>
                </div>

                {view === 'events' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="bg-zinc-900 border-zinc-800 p-8 rounded-3xl shadow-2xl">
                            <EventsManagement isParent={true} playerId={children[0]?.player_id?.toString()} />
                        </Card>
                    </div>
                )}

                {view === 'dashboard' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Children List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-zinc-50 flex items-center gap-2">
                                <Users className="h-5 w-5 text-emerald-500" />
                                أبنائي اللاعبين
                            </h3>
                            <span className="text-xs bg-zinc-900 text-zinc-500 px-3 py-1 rounded-full border border-zinc-800 font-bold">
                                {children.length} لاعب
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {children.map((child) => (
                                <Card
                                    key={child.player_id}
                                    className={cn(
                                        "bg-zinc-900 border-zinc-800 transition-all group overflow-hidden",
                                        child.status === 'active' ? "hover:border-emerald-500/50 cursor-pointer" : "opacity-75 cursor-not-allowed grayscale-[0.5]"
                                    )}
                                    onClick={() => {
                                        if (child.status === 'active') {
                                            setSelectedChild(child);
                                            setActiveModalTab('card');
                                        } else {
                                            alert("هذا الطلب قيد المراجعة حالياً. ستتمكن من رؤية البطاقة والاستمارة فور قبول طلبك من طرف الإدارة.");
                                        }
                                    }}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 rounded-2xl bg-zinc-800 border-2 border-zinc-950 overflow-hidden shrink-0">
                                                {child.photo_url ? (
                                                    <img src={child.photo_url} alt={child.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-zinc-700">
                                                        <User className="h-8 w-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-zinc-50 truncate group-hover:text-emerald-500 transition-colors">{child.name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-xs text-zinc-500 font-bold flex items-center gap-1">
                                                        <Star className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                                                        {child.category}
                                                    </p>
                                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-black border border-blue-500/20">
                                                        LEVEL {child.level_score || '75'}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-zinc-700 group-hover:text-emerald-500 transition-all transform group-hover:translate-x-1" />
                                        </div>
                                    </CardContent>
                                    <div className="px-6 py-3 bg-zinc-950/50 border-t border-zinc-800 flex justify-between items-center">
                                        <div className="flex gap-4">
                                            <div className="text-center">
                                                <p className="text-[8px] text-zinc-500 font-black uppercase mb-0.5 tracking-tighter">الحالة</p>
                                                <p className={cn(
                                                    "text-[10px] font-bold uppercase",
                                                    child.status === 'active' ? "text-emerald-500" : "text-amber-500"
                                                )}>
                                                    {child.status === 'active' ? 'نشط' : 'تحت المراجعة'}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[8px] text-zinc-500 font-black uppercase mb-0.5 tracking-tighter">الفئة / الفوج</p>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase">{child.category || 'بانتظار التوجيه'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedChildForPayment(child);
                                                    setIsPaymentModalOpen(true);
                                                }}
                                                title="دفع الاشتراك"
                                            >
                                                <Smartphone className="h-4 w-4" />
                                            </Button>
                                            {child.status === 'active' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedChild(child);
                                                            setActiveModalTab('card');
                                                        }}
                                                        title="طباعة البطاقة"
                                                    >
                                                        <User className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedChild(child);
                                                            setActiveModalTab('application');
                                                        }}
                                                        title="طباعة الاستمارة"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {children.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
                                    <AlertCircle className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-500 font-bold">لا يوجد لاعبون مرتبطون بهذا الحساب.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Baridimob Modal */}
                    <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`دفع الاشتراك - ${selectedChildForPayment?.name} 💳`}>
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
                                                            player_id: selectedChildForPayment.player_id,
                                                            amount: 3000, 
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

                    {/* Notifications / Side Panel */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-zinc-50 flex items-center gap-2">
                                <Bell className="h-5 w-5 text-amber-500" />
                                آخر الإشعارات
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                                    <p className="text-zinc-600 text-xs font-bold">لا توجد إشعارات جديدة</p>
                                </div>
                            ) : (
                                notifications.map(notif => {
                                    if (notif.type === 'training') {
                                        return (
                                            <div key={notif.id} className="relative overflow-hidden bg-gradient-to-r from-blue-900/40 to-blue-950 border border-blue-500/30 p-4 rounded-2xl group hover:border-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                                <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 animate-pulse" />
                                                <div className="absolute -left-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />

                                                <div className="flex gap-3 relative z-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shrink-0">
                                                        <Calendar className="h-5 w-5 text-blue-400 animate-bounce" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-black text-blue-100 text-sm">{notif.title}</h4>
                                                            <span className="text-[10px] text-blue-300 font-bold bg-blue-500/20 px-2 py-0.5 rounded-full">{notif.date}</span>
                                                        </div>
                                                        <p className="text-xs text-blue-200/80 leading-relaxed font-medium whitespace-pre-wrap">{notif.body}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={notif.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all">
                                            <div className={cn(
                                                "absolute top-0 right-0 w-1 h-full",
                                                notif.type === 'match' ? "bg-emerald-500" : "bg-amber-500"
                                            )} />
                                            <div className="flex justify-between items-start mb-1 pr-2">
                                                <h4 className="font-bold text-zinc-50 text-sm">{notif.title}</h4>
                                                <span className="text-[10px] text-zinc-500">{notif.date}</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 leading-relaxed pr-2 whitespace-pre-wrap">{notif.body}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Academy Contact Info */}
                        <div className="bg-emerald-600 rounded-3xl p-6 text-white text-center shadow-lg shadow-emerald-900/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <Star className="h-8 w-8 mx-auto mb-3 opacity-50 relative z-10" />
                            <h4 className="font-black text-lg mb-2 relative z-10">تواصل مع الأكاديمية</h4>
                            <p className="text-xs text-emerald-100/90 mb-4 line-clamp-2 relative z-10 font-medium">لأية استفسارات أو مشاكل تقنية، نحن هنا للمساعدة عبر واتساب.</p>
                            <Button
                                onClick={() => window.open(`https://wa.me/213668729828`, '_blank')}
                                className="w-full bg-white text-emerald-600 font-black hover:bg-zinc-100 rounded-xl py-6 relative z-10"
                            >
                                <Phone className="h-4 w-4 ml-2" />
                                واتساب الإدارة
                            </Button>
                        </div>

                        {/* APK / Mobile App Section */}
                        <div className="bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-3xl p-6 text-center group hover:border-emerald-500/30 transition-all">
                            <div className="h-12 w-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                                <Plus className="h-6 w-6" />
                            </div>
                            <h4 className="font-black text-zinc-50 mb-2">تطبيق أجيال (نسخة الـ APK)</h4>
                            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">قم بتثبيت التطبيق على هاتفك لتصلك التنبيهات فوراً كما في واتساب وفايسبوك.</p>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const url = academySettings?.public_url || window.location.origin;
                                        navigator.clipboard.writeText(url);
                                        alert(`تم نسخ رابط فضاء الأولياء (${url})! يمكنك الآن إرساله للأولياء عبر واتساب. اطلب منهم فتحه في متصفح Chrome ثم الضغط على 'إضافة إلى الشاشة الرئيسية' (Add to Home Screen) لتثبيت التطبيق وتفعيل التنبيهات.`);
                                    }}
                                    className="border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-xl"
                                >
                                    نسخ رابط المنصة للأولياء
                                </Button>
                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                    <p className="text-[10px] text-emerald-500 font-bold mb-1">💡 ملاحظة للمسؤول:</p>
                                    <p className="text-[9px] text-zinc-400 leading-tight">للحصول على ملف APK أصلي، يمكنك استخدام خدمة (Web2APK) بعد رفع الموقع على استضافة حقيقية، أو استخدام الرابط أعلاه كـ PWA وهو الأنسب لإرسال التنبيهات.</p>
                                </div>
                                <p className="text-[10px] text-zinc-600 font-bold">بواسطة: ULTRA DIGITAL SOLUTIONS 2026</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>

            {/* Messages Modal */}
            {isMessageViewOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                            <h3 className="text-xl font-black text-zinc-50 flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl",
                                    showArchived ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                )}>
                                    {showArchived ? <Archive className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                                </div>
                                {showArchived ? "أرشيف الرسائل" : "التنبيهات الجديدة"}
                            </h3>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setShowArchived(!showArchived)} className={cn("text-xs font-bold px-3 py-1.5 rounded-full border transition-all", showArchived ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700")}>
                                    الأرشيف {showArchived ? <Check className="h-3 w-3 inline ml-1" /> : ""}
                                </button>
                                <button onClick={() => setIsMessageViewOpen(false)} className="text-zinc-500 hover:text-zinc-50 transition-colors p-2 lg:-mr-2">
                                    <ArrowLeft className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {personalMessages.filter(m => showArchived ? m.is_read : !m.is_read).length === 0 ? (
                                <div className="py-12 text-center text-zinc-500 font-bold">
                                    {showArchived ? "لا توجد رسائل في الأرشيف" : "لا توجد رسائل جديدة حالياً"}
                                </div>
                            ) : (
                                personalMessages.filter(m => showArchived ? m.is_read : !m.is_read).map((m: any) => (
                                    <div key={m.id} className={cn(
                                        "p-5 rounded-2xl border transition-all duration-700",
                                        m.is_read
                                            ? "bg-zinc-900/40 border-zinc-800 shadow-none text-zinc-300 opacity-80"
                                            : "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] text-amber-50"
                                    )}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-2">
                                                <span className={cn(
                                                    "text-[10px] items-center gap-1 font-black uppercase tracking-widest flex px-2 py-0.5 rounded-full",
                                                    m.is_read ? "text-zinc-500 bg-zinc-800" : "text-amber-500 bg-amber-500/10"
                                                )}>
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(m.timestamp).toLocaleDateString('en-CA')}
                                                </span>
                                                {m.is_read && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(m.original_id)}
                                                        className="text-zinc-600 hover:text-rose-500 transition-colors"
                                                        title="حذف الرسالة"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            {m.is_read ? (
                                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    قرئت
                                                </span>
                                            ) : (
                                                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse ring-4 ring-rose-500/20"></span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed font-tajawal break-words">{m.body}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 shrink-0">
                            <Button onClick={() => setIsMessageViewOpen(false)} className="w-full bg-zinc-50 text-zinc-950 font-black hover:bg-zinc-200 rounded-xl h-12">
                                إغلاق
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Card Modal */}
            <Modal isOpen={!!selectedChild} onClose={() => setSelectedChild(null)} title={`ملف اللاعب: ${selectedChild?.name}`} size="xl">
                {selectedChild && (
                    <div className="space-y-6 pt-4">
                        <div className="flex justify-center gap-4 border-b border-zinc-800 pb-4">
                            <Button
                                variant={activeModalTab === 'card' ? "default" : "outline"}
                                className={cn("flex-1 font-bold", activeModalTab === 'card' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-zinc-400 border-zinc-800 hover:text-zinc-50")}
                                onClick={() => setActiveModalTab('card')}
                            >
                                بطاقة اللاعب الميدانية
                            </Button>
                            <Button
                                variant={activeModalTab === 'application' ? "default" : "outline"}
                                className={cn("flex-1 font-bold", activeModalTab === 'application' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-zinc-400 border-zinc-800 hover:text-zinc-50")}
                                onClick={() => setActiveModalTab('application')}
                            >
                                استمارة التسجيل الرسمية
                            </Button>
                        </div>
                        <div className="flex justify-center bg-white p-8 rounded-2xl overflow-x-auto">
                            <div id={activeModalTab === 'card' ? "player-card" : "player-application"}>
                                {activeModalTab === 'card' ? (
                                    <PlayerCardTemplate player={selectedChild} academySettings={academySettings || { academy_name: 'أكاديمية كرة القدم', logo_url: '' }} teamName={selectedChild.category || ''} />
                                ) : (
                                    <PlayerApplicationTemplate player={selectedChild} academySettings={academySettings || { academy_name: 'أكاديمية كرة القدم', logo_url: '' }} teamName={selectedChild.category || ''} />
                                )}
                            </div>
                        </div>
                        {renderModalButtons()}
                    </div>
                )}
            </Modal>

            {showPrintPortal && selectedChild && (
                <PrintPortal
                    isOpen={showPrintPortal}
                    onClose={() => setShowPrintPortal(false)}
                    title={activeModalTab === 'card' ? `بطاقة اللاعب - ${selectedChild.name}` : `استمارة اللاعب - ${selectedChild.name}`}
                    id={activeModalTab === 'card' ? "player-card" : "player-application"}
                >
                    <div className="p-4 bg-white flex justify-center">
                        {activeModalTab === 'card' ? (
                            <PlayerCardTemplate
                                player={selectedChild}
                                academySettings={academySettings}
                                teamName={selectedChild.category || ''}
                            />
                        ) : (
                            <PlayerApplicationTemplate
                                player={selectedChild}
                                academySettings={academySettings}
                                teamName={selectedChild.category || ''}
                            />
                        )}
                    </div>
                </PrintPortal>
            )}
        </div>
    );
}
