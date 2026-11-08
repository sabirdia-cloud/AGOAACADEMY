import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus, Trophy, Calendar, MapPin, Users, Edit, Trash2,
    FileText, CheckCircle2, Clock, AlertCircle, ChevronLeft,
    Printer, Shield, MoreVertical, LayoutGrid, List as ListIcon,
    MessageCircle
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MatchCallListTemplate } from "@/components/PrintTemplates";
import { PrintPortal } from "@/components/PrintPortal";
import { exportToPDF } from "@/lib/pdf-export";
import { Search, Loader2, ChevronRight, X as CloseIcon } from "lucide-react";

export function MatchCenter() {
    const { user } = useAuth();
    const isCoach = user?.role === 'coach';
    const navigate = useNavigate();
    const [matches, setMatches] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<any>(null);
    const [matchToDelete, setMatchToDelete] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'finished'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [coaches, setCoaches] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [allPlayers, setAllPlayers] = useState<any[]>([]);
    const [academySettings, setAcademySettings] = useState<any>(null);
    const [isSummonModalOpen, setIsSummonModalOpen] = useState(false);
    const [selectedMatchForSummon, setSelectedMatchForSummon] = useState<any>(null);
    const [summonedPlayerIds, setSummonedPlayerIds] = useState<number[]>([]);
    const [isSavingSummon, setIsSavingSummon] = useState(false);
    const [summonSearchQuery, setSummonSearchQuery] = useState("");
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCoachName, setSelectedCoachName] = useState<string>("");
    const [printData, setPrintData] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load essential tables first
            const [matchesData, coachesData, catsData] = await Promise.all([
                api.getEMSMatches().catch(e => { console.error("Matches load failed:", e); return []; }),
                api.getCoaches().catch(e => { console.error("Coaches load failed:", e); return []; }),
                api.getCategories().catch(e => { console.error("Cats load failed:", e); return []; })
            ]);

            setMatches(matchesData);
            setCoaches(coachesData);
            setCategories(catsData);

            // Load secondary tables
            const [teamsData, playersData, settingsData] = await Promise.all([
                api.getTeams().catch(e => { console.error("Teams load failed:", e); return []; }),
                api.getPlayers().catch(e => { console.error("Players load failed:", e); return []; }),
                api.getAcademySettings().catch(e => { console.error("Settings load failed:", e); return null; })
            ]);

            setAcademySettings(settingsData);

            setMatches(matchesData || []);
            setTeams(teamsData || []);
            setAllPlayers(playersData || []);
            setCategories(catsData || []);
            
            if (user?.role === 'coach') {
                setSelectedCoachName(user.username);
            }
        } catch (error) {
            console.error("Critical failure in loadData:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val) { setSelectedCoachName(""); return; }

        if (val.includes('cat:')) {
            const catName = val.replace('cat:', '');
            const coach = coaches.find(c => c.category === catName);
            setSelectedCoachName(coach?.name || "");
        } else {
            const team = teams.find(t => `${t.category} - ${t.team_name}` === val);
            if (team?.coach_id) {
                const coach = coaches.find(c => c.coach_id === team.coach_id);
                setSelectedCoachName(coach?.name || "");
            } else if (team?.category) {
                const coach = coaches.find(c => c.category === team.category);
                setSelectedCoachName(coach?.name || "");
            } else {
                setSelectedCoachName("");
            }
        }
    };

    const handleOpenAddMatch = () => {
        setEditingMatch(null);
        setSelectedCoachName("");
        setIsModalOpen(true);
    };

    const handleEditMatch = (match: any) => {
        setEditingMatch(match);
        setSelectedCoachName(match.coach_name || "");
        setIsModalOpen(true);
    };

    const handleSaveMatch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const matchData = {
            match_date: formData.get("match_date") as string,
            competition: formData.get("competition") as string,
            home_team: formData.get("home_team") as string,
            away_team: formData.get("away_team") as string,
            stadium: formData.get("stadium") as string,
            category: formData.get("category") as string,
            coach_name: formData.get("coach_name") as string,
            assistant_coach: formData.get("assistant_coach") as string,
            score: formData.get("score") as string || '- - -',
            status: formData.get("status") as string || 'قادمة',
            result: formData.get("result") as string || 'لم تلعب بعد',
            match_type: formData.get("match_type") as string || 'ودية',
            time: formData.get("time") as string || '00:00',
            notes: formData.get("notes") as string,
        };

        try {
            if (editingMatch) {
                await api.updateEMSMatch(editingMatch.id || editingMatch.match_id, matchData);
            } else {
                await api.addEMSMatch(matchData);
            }
            await loadData();
            setIsModalOpen(false);
            setEditingMatch(null);
            setSelectedCoachName("");
        } catch (error) {
            console.error("Failed to save match:", error);
            alert("حدث خطأ أثناء الحفظ. تأكد من تحديث قاعدة البيانات.");
        }
    };

    const handleDeleteMatch = (id: number) => {
        setMatchToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (matchToDelete) {
            setIsDeleting(true);
            try {
                await api.deleteEMSMatch(matchToDelete);
                await loadData();
                setIsConfirmOpen(false);
                alert("تم حذف المباراة بنجاح.");
            } catch (error: any) {
                console.error("Failed to delete match:", error);
                alert("حدث خطأ أثناء حذف المباراة. قد يكون هناك بيانات مرتبطة بها تمنع الحذف أو مشكلة في اسم العمود (ID/Match_ID).");
            } finally {
                setIsDeleting(false);
                setMatchToDelete(null);
            }
        }
    };

    const handleOpenSummonModal = async (match: any) => {
        setSelectedMatchForSummon(match);
        const mId = match.id || match.match_id;
        try {
            const currentSquad = await api.getMatchSheetPlayers(mId);
            setSummonedPlayerIds(currentSquad ? currentSquad.map((p: any) => p.player_id) : []);
            setIsSummonModalOpen(true);
        } catch (error) {
            console.error("Failed to load current squad:", error);
        }
    };

    const toggleSummon = (playerId: number) => {
        setSummonedPlayerIds(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    const saveSummonedPlayers = async () => {
        if (!selectedMatchForSummon) return;
        setIsSavingSummon(true);
        try {
            // Convert IDs to match_players format (defaulting as not yet starters or subs)
            const squadData = summonedPlayerIds.map(id => ({
                match_id: selectedMatchForSummon.id || selectedMatchForSummon.match_id,
                player_id: id,
                jersey_number: 0,
                position: 'غير محدد',
                is_starting: false,
                is_substitute: false
            }));

            await api.saveMatchSheetPlayers(selectedMatchForSummon.id, squadData);
            setIsSummonModalOpen(false);
            await loadData();
        } catch (error) {
            console.error("Failed to save summons:", error);
            alert("حدث خطأ أثناء حفظ القائمة.");
        } finally {
            setIsSavingSummon(false);
        }
    };

    const handlePrintCallList = async (match: any) => {
        const mId = match.id || match.match_id;
        try {
            const squad = await api.getMatchSheetPlayers(mId);
            if (!squad || squad.length === 0) {
                alert("يرجى استدعاء اللاعبين أولاً قبل الطباعة.");
                return;
            }

            // Map back to full player data for printing
            const squadWithDetails = squad.map((sp: any) => {
                const fullPlayer = allPlayers.find(p => p.player_id === sp.player_id);
                return {
                    ...sp,
                    name: fullPlayer?.name || 'مجهول'
                };
            });

            setPrintData({ match, players: squadWithDetails });
        } catch (error) {
            console.error("Error preparing print:", error);
        }
    };
    const handleNotifyMatch = async (match: any) => {
        try {
            const players = await api.getPlayers();
            const matchCategory = match.category?.startsWith('cat:') ? match.category.replace('cat:', '') : match.category;
            const categoryPlayers = players.filter((p: any) => p.category === matchCategory);

            const msg = `إشعار بمباراة جديدة:\n\nالمسابقة: ${match.competition}\nالفئة: ${match.category}\nاللقاء: ${match.home_team} VS ${match.away_team}\nالتاريخ: ${match.match_date}\nالمكان: ${match.stadium}\n\nيرجى من اللاعبين المعنيين الحضور وفق البرنامج.`;

            if (categoryPlayers.length > 0 && categoryPlayers[0].phone) {
                api.sendWhatsAppNotification(categoryPlayers[0].phone, msg);
            } else {
                alert("لا يوجد أرقام هواتف مسجلة لهذه الفئة.");
            }
        } catch (error) {
            console.error("Failed to notify match:", error);
        }
    };

    const filteredMatches = matches.filter(m => {
        if (filter === 'upcoming') return m.status === 'قادمة' || m.status === 'جارية';
        if (filter === 'finished') return m.status === 'منتهية';
        return true;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-tajawal rtl">
            {/* Header section with Stats */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-50 flex items-center gap-3">
                            <Trophy className="h-8 w-8 text-emerald-500" />
                            مركز إدارة المباريات
                        </h1>
                        <p className="text-zinc-400 mt-2 text-lg">تحضير اللقاءات، استدعاء اللاعبين، وإدارة أوراق المباراة الإلكترونية في مكان واحد.</p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        {(user?.role === 'admin' || user?.role === 'coach') && (
                            <Button onClick={handleOpenAddMatch} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]">
                                <Plus className="ml-2 h-5 w-5" />
                                إضافة مباراة جديدة
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-800/50">
                    <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-800">
                        <p className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-tighter">إجمالي المباريات</p>
                        <p className="text-2xl font-black text-emerald-500">{matches.length}</p>
                    </div>
                    <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-800">
                        <p className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-tighter">مباريات قادمة</p>
                        <p className="text-2xl font-black text-blue-500">{matches.filter(m => m.status === 'قادمة').length}</p>
                    </div>
                    <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-800">
                        <p className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-tighter">مباريات منتهية</p>
                        <p className="text-2xl font-black text-amber-500">{matches.filter(m => m.status === 'منتهية').length}</p>
                    </div>
                    <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-800">
                        <p className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-tighter">نسبة الفوز</p>
                        <p className="text-2xl font-black text-zinc-50">
                            {matches.filter(m => m.status === 'منتهية').length > 0
                                ? Math.round((matches.filter(m => m.result === 'فوز').length / matches.filter(m => m.status === 'منتهية').length) * 100)
                                : 0}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/20 p-2 rounded-xl border border-zinc-800">
                <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800 w-full sm:w-auto">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-bold transition-all", filter === 'all' ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                    >الكل</button>
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-bold transition-all", filter === 'upcoming' ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                    >القادمة</button>
                    <button
                        onClick={() => setFilter('finished')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-bold transition-all", filter === 'finished' ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                    >المنتهية</button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn("p-2 rounded-lg border transition-all", viewMode === 'grid' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-500")}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn("p-2 rounded-lg border transition-all", viewMode === 'list' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-500")}
                    >
                        <ListIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Matches List */}
            {isLoading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold">جاري تحميل البيانات...</p>
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="py-20 text-center bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                    <AlertCircle className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold text-lg">لا توجد مباريات تطابق البحث حالياً.</p>
                </div>
            ) : (
                <div className={cn(
                    "grid gap-6",
                    viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}>
                    {filteredMatches.map((match) => {
                        const mId = match.id ?? match.match_id;
                        return (
                            <Card key={mId || Math.random()} className="bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60 transition-all group overflow-hidden flex flex-col">
                                {/* Match Card Header */}
                                <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex justify-between items-center">
                                    <span className={cn(
                                        "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                                        match.status === 'قادمة' ? "bg-blue-500/10 text-blue-500" :
                                            match.status === 'جارية' ? "bg-emerald-500/10 text-emerald-500 animate-pulse" :
                                                "bg-zinc-800 text-zinc-400"
                                    )}>
                                        {match.status}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                                        <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                                        {match.competition}
                                    </div>
                                </div >

                                <CardContent className="p-6 flex-1">
                                    {/* Score section */}
                                    <div className="flex justify-between items-center mb-8 relative">
                                        <div className="text-center flex-1">
                                            <div className="h-14 w-14 mx-auto rounded-xl bg-emerald-500/5 flex items-center justify-center mb-3 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                                                <span className="text-emerald-500 font-black text-xl">{match.home_team?.charAt(0) || '?'}</span>
                                            </div>
                                            <p className="font-black text-zinc-50 text-sm truncate">{match.home_team}</p>
                                        </div>

                                        <div className="px-4 text-center">
                                            <div className="text-2xl font-black text-zinc-50 tracking-widest mb-1 italic">
                                                {match.score}
                                            </div>
                                            <div className="h-px bg-zinc-800 w-full mb-1" />
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase">{match.match_type}</div>
                                        </div>

                                        <div className="text-center flex-1">
                                            <div className="h-14 w-14 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center mb-3 border border-zinc-700 group-hover:scale-105 transition-transform">
                                                <span className="text-zinc-400 font-black text-xl">{match.away_team?.charAt(0) || '?'}</span>
                                            </div>
                                            <p className="font-black text-zinc-400 text-sm truncate">{match.away_team}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50">
                                        <div className="flex items-center text-xs text-zinc-400 font-bold">
                                            <Calendar className="ml-2 h-3.5 w-3.5 text-zinc-600" />
                                            {match.match_date}
                                            {match.time && <span className="mr-2 text-zinc-600 font-mono">[{match.time}]</span>}
                                        </div>
                                        <div className="flex items-center text-xs text-zinc-400 font-bold truncate">
                                            <MapPin className="ml-2 h-3.5 w-3.5 text-zinc-600" />
                                            {match.stadium}
                                        </div>
                                        <div className="flex items-center text-xs text-zinc-400 font-bold">
                                            <Users className="ml-2 h-3.5 w-3.5 text-zinc-600" />
                                            {match.category} • {match.coach_name || 'مدرب غير محدد'}
                                        </div>
                                    </div>
                                </CardContent>

                                {/* Action Buttons */}
                                <div className="p-4 bg-zinc-900/60 border-t border-zinc-800 grid grid-cols-2 gap-2 mt-auto">
                                    <Button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleOpenSummonModal(match); }}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold h-9"
                                    >
                                        <Users className="ml-1.5 h-3.5 w-3.5" />
                                        استدعاء اللاعبين
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/matches/${mId}/squad`); }}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold h-9"
                                    >
                                        <Trophy className="ml-1.5 h-3.5 w-3.5" />
                                        القائمة الرسمية
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/matches/${mId}/sheet`); }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 shadow-lg shadow-emerald-900/20"
                                    >
                                        <FileText className="ml-1.5 h-3.5 w-3.5" />
                                        فتح ورقة اللقاء
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handlePrintCallList(match); }}
                                        variant="outline"
                                        className="border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold h-9"
                                    >
                                        <Printer className="ml-1.5 h-3.5 w-3.5" />
                                        طباعة
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleNotifyMatch(match); }}
                                        className="bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 text-xs font-bold h-9"
                                    >
                                        <MessageCircle className="ml-1.5 h-3.5 w-3.5" />
                                        تذكير الوالدين
                                    </Button>

                                    {(user?.role === 'admin' || user?.role === 'coach') && (
                                        <div className="col-span-2 flex gap-2 mt-1 pt-2 border-t border-zinc-800/50">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleEditMatch(match); }}
                                                className="flex-1 text-[10px] text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700"
                                            >
                                                <Edit className="ml-1.5 h-3 w-3" />
                                                تعديل المعلومات
                                            </Button>
                                            
                                            {user?.role === 'admin' && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteMatch(mId); }}
                                                    className="flex-1 text-[10px] text-rose-500/70 hover:text-rose-500 border border-transparent hover:border-rose-900/20"
                                                >
                                                    <Trash2 className="ml-1.5 h-3 w-3" />
                                                    حذف
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Match Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingMatch(null); }}
                title={editingMatch ? "تعديل تفاصيل المباراة" : "إنشاء مباراة جديدة"}
            >
                <form onSubmit={handleSaveMatch} className="space-y-4 font-tajawal rtl" dir="rtl">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">تاريخ المباراة</label>
                            <input required name="match_date" defaultValue={editingMatch?.match_date} type="date" className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">الوقت</label>
                            <input name="time" defaultValue={editingMatch?.time || '18:00'} type="time" className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300">المنافسة / البطولة</label>
                        <input required name="competition" defaultValue={editingMatch?.competition} type="text" className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 outline-none transition-all" placeholder="مثال: البطولة الوطنية U17" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">الفريق المستضيف</label>
                            <input required name="home_team" defaultValue={editingMatch?.home_team} type="text" className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 outline-none transition-all" placeholder="صاحب الأرض" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">الفريق الضيف</label>
                            <input required name="away_team" defaultValue={editingMatch?.away_team} type="text" className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 outline-none transition-all" placeholder="الفريق الخصم" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">الملعب</label>
                            <input required name="stadium" defaultValue={editingMatch?.stadium} type="text" className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 outline-none transition-all" placeholder="اسم الملعب" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">الفئة / الفوج</label>
                            <select required name="category" defaultValue={editingMatch?.category} onChange={handleTeamChange} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 outline-none focus:border-emerald-500 transition-all">
                                <option value="">اختر الفئة</option>
                                {categories.map(cat => (
                                    <optgroup key={cat.category_id} label={cat.name}>
                                        <option value={`cat:${cat.name}`}>{cat.name} (فئة كاملة)</option>
                                        {teams.filter(t => t.category === cat.name).map(team => (
                                            <option key={team.team_id} value={`${team.category} - ${team.team_name}`}>{team.team_name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                                {teams.filter(t => !t.category || !categories.find(c => c.name === t.category)).map(team => (
                                    <option key={team.team_id} value={`${team.category} - ${team.team_name}`}>{team.team_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">النتيجة</label>
                            <input name="score" defaultValue={editingMatch?.score || '- - -'} type="text" className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 outline-none transition-all text-center font-mono" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">الحالة</label>
                            <select name="status" defaultValue={editingMatch?.status || 'قادمة'} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 outline-none focus:border-emerald-500 transition-all">
                                <option value="قادمة">قادمة</option>
                                <option value="جارية">جارية</option>
                                <option value="منتهية">منتهية</option>
                                <option value="ملغاة">ملغاة</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">النتيجة النهائية</label>
                            <select name="result" defaultValue={editingMatch?.result || 'لم تلعب بعد'} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 outline-none focus:border-emerald-500 transition-all">
                                <option value="لم تلعب بعد">لم تلعب بعد</option>
                                <option value="فوز">فوز</option>
                                <option value="تعادل">تعادل</option>
                                <option value="خسارة">خسارة</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">المدرب الرئيسي</label>
                            <select
                                required
                                name="coach_name"
                                value={selectedCoachName || (editingMatch?.coach_name || "")}
                                onChange={(e) => setSelectedCoachName(e.target.value)}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 outline-none focus:border-emerald-500 transition-all font-bold"
                            >
                                <option value="">اختر المدرب المتاح</option>
                                {coaches && coaches.length > 0 ? coaches.map(coach => (
                                    <option key={coach.coach_id} value={coach.name}>
                                        {coach.name} {coach.category ? `(${coach.category})` : ''}
                                    </option>
                                )) : (
                                    <option disabled>لا يوجد مدربين مسجلين</option>
                                )}
                            </select>
                            {coaches.length === 0 && (
                                <p className="text-[10px] text-amber-500 mt-1">تأكد من إضافة مدربين في قسم المدربين أولاً.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">نوع المباراة</label>
                            <select name="match_type" defaultValue={editingMatch?.match_type || 'ودية'} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-50 outline-none focus:border-emerald-500 transition-all">
                                <option value="ودية">ودية</option>
                                <option value="رسمية">رسمية</option>
                                <option value="بطولة">بطولة</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingMatch(null); }} className="border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-xl px-6">إلغاء</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-10 shadow-lg shadow-emerald-900/20">
                            {editingMatch ? "تحديث البيانات" : "حفظ المباراة"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title="حذف المباراة"
                message="هل أنت متأكد من حذف هذه المباراة نهائياً؟ سيتم حذف جميع القوائم والأحداث المرتبطة بها."
            />

            {/* Summon Players Modal */}
            <Modal
                isOpen={isSummonModalOpen}
                onClose={() => setIsSummonModalOpen(false)}
                title={`استدعاء اللاعبين لمباراة ضد ${selectedMatchForSummon?.away_team}`}
                size="xl"
            >
                <div className="space-y-4 font-tajawal rtl" dir="rtl">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="بحث عن لاعب بالاسم، الفئة أو الفوج..."
                            value={summonSearchQuery}
                            onChange={(e) => setSummonSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 pr-10 pl-4 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar p-1">
                        {allPlayers
                            .filter(p =>
                                p.name.toLowerCase().includes(summonSearchQuery.toLowerCase()) ||
                                (p.category && p.category.includes(summonSearchQuery))
                            )
                            .map(player => {
                                const isSelected = summonedPlayerIds.includes(player.player_id);
                                return (
                                    <div
                                        key={player.player_id}
                                        onClick={() => toggleSummon(player.player_id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                                            isSelected
                                                ? "bg-emerald-500/10 border-emerald-500/50"
                                                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center font-black",
                                                isSelected ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
                                            )}>
                                                {isSelected ? <CheckCircle2 className="h-6 w-6" /> : player.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-50">{player.name}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase">{player.category || 'بدون فئة'}</p>
                                            </div>
                                        </div>
                                        {isSelected && <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-tighter">مختار</span>}
                                    </div>
                                );
                            })}
                    </div>

                    <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-sm text-zinc-400 font-bold">تم اختيار {summonedPlayerIds.length} لاعب</span>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsSummonModalOpen(false)} className="border-zinc-800 text-zinc-400 rounded-xl">إلغاء</Button>
                            <Button
                                onClick={saveSummonedPlayers}
                                disabled={isSavingSummon}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-10 shadow-lg shadow-emerald-900/20"
                            >
                                {isSavingSummon ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الحفظ...</> : "حفظ قائمة الاستدعاء"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Print Portal */}
            {
                printData && (
                    <PrintPortal
                        id="print-match-call"
                        title={`استدعاء - ${printData.match.away_team}`}
                        onClose={() => setPrintData(null)}
                    >
                        <MatchCallListTemplate
                            match={{
                                opponent: printData.match.away_team === printData.match.home_team ? "داخلي" : (printData.match.home_team.includes("أكاديمية") ? printData.match.away_team : printData.match.home_team),
                                time: printData.match.time,
                                location: printData.match.stadium,
                                match_date: printData.match.match_date
                            }}
                            players={printData.players}
                            teamName={printData.match.category}
                            coachName={printData.match.coach_name}
                            academySettings={academySettings}
                        />
                    </PrintPortal>
                )
            }
        </div >
    );
}

// Helper functions for Summon Logic outside the component or inside
// I'll put them inside the component for simplicity as they need state
