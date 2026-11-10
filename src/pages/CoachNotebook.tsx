import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Calendar, Trophy, Star, ClipboardCheck, 
  User, Activity, Download, ChevronLeft, Shield, FileText,
  Stethoscope, LayoutDashboard, Sparkles, QrCode, Swords, Phone,
  ShoppingBag, Search, X, CheckCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { api, supabase } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { useAcademy } from "@/services/AcademyContext";
import { cn } from "@/lib/utils";
import { PrintPortal } from "@/components/PrintPortal";
import { PedagogicalNotebookTemplate, BatchPedagogicalReportsTemplate } from "@/components/PrintTemplates";
import { exportToPDF } from "@/lib/pdf-export";
import { PedagogicalNotebook } from "@/components/PedagogicalNotebook";
import { FUTPlayerCard } from "@/components/FUTPlayerCard";

export function CoachNotebook() {
  const { user } = useAuth();
  const { settings } = useAcademy();
  const navigate = useNavigate();

  const [players, setPlayers] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [bagSearch, setBagSearch] = useState("");
  const [searchPlayer, setSearchPlayer] = useState("");
  const [stats, setStats] = useState({
    totalPlayers: 0,
    nextTraining: null as any,
    weeklyAttendance: 0,
    lastMatch: null as any,
    completedTrainingsCount: 0,
    completedMatchesCount: 0
  });

  const [printData, setPrintData] = useState<any>(null);
  const [batchPrintData, setBatchPrintData] = useState<any[] | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [futModalPlayer, setFutModalPlayer] = useState<any | null>(null);

  const themes = [
    { id: 'technical', label: 'تقني', color: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', icon: '⚽' },
    { id: 'tactical', label: 'تكتيكي', color: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500', icon: '📋' },
    { id: 'physical', label: 'بدني', color: 'border-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-500', icon: '⚡' },
    { id: 'mental', label: 'ذهني', color: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: '🧠' },
    { id: 'match', label: 'مباراة', color: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500', icon: '🏆' },
  ];

  const getTheme = (notes: string) => {
    const themeId = notes?.split('|')[0];
    return themes.find(t => t.id === themeId) || themes[0];
  };

  const extractBagNumber = (notes?: string) => {
    if (!notes) return "";
    const match = notes.match(/\[(?:رقم الحقيبة|رقم القطعة|رقم الحقيبة \/ القطعة):\s*([^\]]+)\]/i);
    if (match) return match[1].trim();
    const fallback = notes.match(/\[حقيبة:\s*([^\]]+)\]/i);
    return fallback ? fallback[1].trim() : "";
  };

  const getPlayerBagNumber = (playerId: number, notes?: string) => {
    const k = kits.find((item: any) => Number(item.player_id) === Number(playerId));
    if (k) {
      const bn = extractBagNumber(k.notes);
      if (bn) return bn;
    }
    return extractBagNumber(notes) || "";
  };

  // Bag search result for quick inspection
  const bagSearchResult = React.useMemo(() => {
    const q = bagSearch.trim().toLowerCase();
    if (!q) return null;

    // Search in kits first
    const matchedKit = kits.find((k: any) => {
      const bn = extractBagNumber(k.notes).toLowerCase();
      return bn === q;
    });

    if (matchedKit) {
      const p = players.find((pl: any) => Number(pl.player_id) === Number(matchedKit.player_id));
      if (p) {
        return {
          player: p,
          bagNumber: extractBagNumber(matchedKit.notes),
          kitStatus: matchedKit.status === 'delivered' ? 'مستلم' : 'قيد التجهيز'
        };
      }
    }

    // Search in players
    const matchedPlayer = players.find((pl: any) => {
      const bn = extractBagNumber(pl.notes).toLowerCase();
      return bn === q || (pl.bag_number && String(pl.bag_number).toLowerCase() === q);
    });

    if (matchedPlayer) {
      return {
        player: matchedPlayer,
        bagNumber: bagSearch.trim(),
        kitStatus: 'مسجل'
      };
    }

    return { notFound: true, query: bagSearch.trim() };
  }, [bagSearch, kits, players]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pData, tData, mData, aData, kData] = await Promise.all([
        api.getPlayers(),
        api.getTrainings(),
        api.getMatches(),
        api.getAttendance(),
        api.getKits().catch(() => [])
      ]);
      setKits(kData || []);

      let filteredPlayers = pData;
      let filteredTrainings = tData;
      let filteredMatches = mData;

      if (user?.role === 'coach') {
        const coachId = user.coach_id;
        const coachCategory = user.category;
        const coachTeamId = user.team_id;

        const { data: teamsData } = await supabase.from('teams').select('*');
        const coachTeams = (teamsData || []).filter((t: any) => 
          (coachId && Number(t.coach_id) === Number(coachId)) || 
          (coachTeamId && Number(t.team_id) === Number(coachTeamId)) ||
          (coachCategory && t.category === coachCategory)
        );
        const coachTeamIds = coachTeams.map((t: any) => Number(t.team_id));
        const coachCategories = Array.from(new Set(coachTeams.map((t: any) => t.category).concat(coachCategory ? [coachCategory] : [])));

        if (coachTeamIds.length > 0) {
          filteredPlayers = pData.filter((p: any) => 
            coachTeamIds.includes(Number(p.team_id)) || 
            (!p.team_id && p.category && coachCategories.includes(p.category))
          );
          filteredTrainings = tData.filter((t: any) => 
            coachTeamIds.includes(Number(t.team_id)) || 
            (!t.team_id && t.category && coachCategories.includes(t.category)) ||
            (coachId && Number(t.coach_id) === Number(coachId))
          );
          filteredMatches = mData.filter((m: any) => 
            coachTeamIds.includes(Number(m.team_id)) || 
            (!m.team_id && m.category && coachCategories.includes(m.category)) ||
            (coachId && Number(m.coach_id) === Number(coachId))
          );
        } else {
          filteredPlayers = pData.filter((p: any) => 
            p.category && coachCategories.includes(p.category)
          );
          filteredTrainings = tData.filter((t: any) => 
            (t.category && coachCategories.includes(t.category)) ||
            (coachId && Number(t.coach_id) === Number(coachId))
          );
          filteredMatches = mData.filter((m: any) => 
            (m.category && coachCategories.includes(m.category)) ||
            (coachId && Number(m.coach_id) === Number(coachId))
          );
        }
      }

      setPlayers(filteredPlayers);

      const today = new Date();
      const nextT = filteredTrainings
        .filter((t: any) => new Date(t.date) >= today)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
      
      const lastM = filteredMatches
        .filter((m: any) => new Date(m.match_date) <= today)
        .sort((a: any, b: any) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())[0];

      const filteredPlayerIds = filteredPlayers.map((p: any) => p.player_id);
      const categoryAttendance = aData.filter((a: any) => filteredPlayerIds.includes(a.player_id));
      const presentCount = categoryAttendance.filter((a: any) => a.status === 'حاضر').length;
      const totalCount = categoryAttendance.length || 1;
      const attRate = Math.round((presentCount / totalCount) * 100);

      const todayStr = new Date().toISOString().split('T')[0];
      const completedTrainings = filteredTrainings.filter((t: any) => (t.date || "").split('T')[0] <= todayStr);
      const completedMatches = filteredMatches.filter((m: any) => (m.match_date || m.date || "").split('T')[0] <= todayStr);

      setStats({
        totalPlayers: filteredPlayers.length,
        nextTraining: nextT,
        weeklyAttendance: attRate,
        lastMatch: lastM,
        completedTrainingsCount: completedTrainings.length,
        completedMatchesCount: completedMatches.length
      });

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerClick = async (player: any) => {
    setSelectedPlayer(player);
    setIsPlayerModalOpen(true);
  };

  const handlePrintPlayerReport = async (player: any) => {
    setIsExporting(true);
    try {
      const [evals, metrics, attHistory] = await Promise.all([
        api.getEvaluationsByPlayer(player.player_id),
        api.getPhysicalMetrics(player.player_id),
        api.getPlayerAttendanceHistory(player.player_id)
      ]);

      const attStats = {
        total: attHistory.length,
        present: attHistory.filter((a: any) => a.status === 'حاضر').length,
        excused: attHistory.filter((a: any) => a.status === 'مريض' || a.status === 'غائب مبرر').length,
        absent: attHistory.filter((a: any) => a.status === 'غائب').length,
        presentPercentage: attHistory.length > 0 ? Math.round((attHistory.filter((a: any) => a.status === 'حاضر').length / attHistory.length) * 100) : 0
      };

      setPrintData({ player, evaluations: evals, physicalMetrics: metrics, attendanceStats: attStats });

      setTimeout(async () => {
        try {
          await exportToPDF('pedagogical-notebook', `الدفتر_البيداغوجي_${player.name}`);
        } catch (err) {
          alert("فشل استخراج التقرير. يرجى المحاولة مرة أخرى.");
        } finally {
          setIsExporting(false);
          setPrintData(null);
        }
      }, 1500);
    } catch (error) {
      setIsExporting(false);
      alert("فشل استخراج التقرير.");
    }
  };

  const handleBatchExportReports = async () => {
    setIsExporting(true);
    try {
      const allPlayersData = [];
      for (const player of players) {
        const [evals, metrics, attHistory] = await Promise.all([
          api.getEvaluationsByPlayer(player.player_id),
          api.getPhysicalMetrics(player.player_id),
          api.getPlayerAttendanceHistory(player.player_id)
        ]);

        const attStats = {
          total: attHistory.length,
          present: attHistory.filter((a: any) => a.status === 'حاضر').length,
          excused: attHistory.filter((a: any) => a.status === 'مريض' || a.status === 'غائب مبرر').length,
          absent: attHistory.filter((a: any) => a.status === 'غائب').length,
          presentPercentage: attHistory.length > 0 ? Math.round((attHistory.filter((a: any) => a.status === 'حاضر').length / attHistory.length) * 100) : 0
        };

        allPlayersData.push({ player, evaluations: evals, physicalMetrics: metrics, attendanceStats: attStats });
      }
      setBatchPrintData(allPlayersData);

      setTimeout(async () => {
        try {
          await exportToPDF('batch-pedagogical-reports', `الدفاتر_البيداغوجية_لفئة_${user?.category}`);
        } catch (err) {
          alert("فشل استخراج التقارير المجمعة.");
        } finally {
          setIsExporting(false);
          setBatchPrintData(null);
        }
      }, 1500);

    } catch (error) {
      setIsExporting(false);
      alert("فشل استخراج التقارير.");
    }
  };

  const menuItems = [
    { id: 'training', label: 'التدريبات', icon: Calendar, color: 'bg-amber-500', route: '/academy/training' },
    { id: 'attendance', label: 'التحضير', icon: ClipboardCheck, color: 'bg-emerald-500', route: '/academy/attendance' },
    { id: 'matches', label: 'المباريات', icon: Trophy, color: 'bg-purple-500', route: '/academy/matches' },
    { id: 'evaluations', label: 'التقييمات', icon: Star, color: 'bg-blue-600', route: '/academy/evaluations' },
    { id: 'physical', label: 'القياسات', icon: Activity, color: 'bg-rose-500', route: '/academy/physical-metrics' },
    { id: 'injuries', label: 'الإصابات', icon: Stethoscope, color: 'bg-red-500', route: '/academy/injuries' },
  ];

  if (isLoading) return <div className="h-screen flex items-center justify-center font-tajawal">جاري التحميل...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto pb-6 font-tajawal rtl" dir="rtl">
      {/* Modern Dashboard Header matching Layout */}
      <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 shadow-xl shadow-black/20">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden border border-zinc-800/80 bg-zinc-950">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Academy Logo" className="h-full w-full object-contain p-1" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Shield className="text-white h-7 w-7" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-black text-white">الدفتر البيداغوجي</h1>
          <p className="text-xs text-emerald-500 font-bold tracking-widest">{user?.category || 'المدرب'} - {user?.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-zinc-800/80 p-4 rounded-3xl shadow-lg">
          <Users className="text-blue-500 h-6 w-6 mb-2" />
          <p className="text-xs text-zinc-400 font-bold mb-1">تعداد اللاعبين</p>
          <p className="text-3xl font-black text-white">{stats.totalPlayers}</p>
        </Card>
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-zinc-800/80 p-4 rounded-3xl shadow-lg">
          <ClipboardCheck className="text-emerald-500 h-6 w-6 mb-2" />
          <p className="text-xs text-zinc-400 font-bold mb-1">نسبة الحضور</p>
          <p className="text-3xl font-black text-white">{stats.weeklyAttendance}%</p>
        </Card>

        {/* Sessions & Matches counters */}
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-zinc-800/80 p-4 rounded-3xl shadow-lg">
          <Calendar className="text-cyan-400 h-6 w-6 mb-2" />
          <p className="text-xs text-zinc-400 font-bold mb-1">الحصص المنجزة</p>
          <p className="text-3xl font-black text-white">{stats.completedTrainingsCount}</p>
        </Card>
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-zinc-800/80 p-4 rounded-3xl shadow-lg">
          <Trophy className="text-purple-400 h-6 w-6 mb-2" />
          <p className="text-xs text-zinc-400 font-bold mb-1">مباريات ملعوبة</p>
          <p className="text-3xl font-black text-white">{stats.completedMatchesCount}</p>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border-zinc-800/80 p-4 col-span-2 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-amber-500 h-5 w-5" />
              <p className="text-sm font-bold text-zinc-300">التدريب القادم</p>
            </div>
            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full font-black uppercase">القادم</span>
          </div>
          {stats.nextTraining ? (
            <div className="flex justify-between items-end mt-1 bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/50">
              <div>
                <p className="text-lg font-black text-white">{stats.nextTraining.date}</p>
                <p className="text-xs font-bold text-amber-500 mt-1">{stats.nextTraining.start_time} • {stats.nextTraining.location}</p>
              </div>
              <span className={cn("text-[10px] px-2 py-1 rounded-lg font-black", getTheme(stats.nextTraining.notes).bg, getTheme(stats.nextTraining.notes).text)}>
                {getTheme(stats.nextTraining.notes).icon} {getTheme(stats.nextTraining.notes).label}
              </span>
            </div>
          ) : (
            <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50 flex flex-col items-center justify-center text-center">
              <Calendar className="h-6 w-6 text-zinc-600 mb-2" />
              <p className="text-xs font-bold text-zinc-500">لا يوجد موعد قريب مسجل</p>
            </div>
          )}
        </Card>
      </div>

      {/* Bag Number Inspection Box (Read-Only) */}
      <Card className="bg-zinc-900/60 border-zinc-800 p-4 rounded-3xl shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-black text-zinc-100">استعلام برقم الحقيبة</h4>
              <p className="text-[10px] text-zinc-500">كتابة رقم الحقيبة لمعاينة صاحبها (للقراءة فقط 🔒)</p>
            </div>
          </div>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-bold">
            للمعاينة فقط
          </span>
        </div>

        <div className="relative">
          <ShoppingBag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
          <input
            type="text"
            value={bagSearch}
            onChange={(e) => setBagSearch(e.target.value)}
            placeholder="اكتب رقم الحقيبة هنا..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
          {bagSearch && (
            <button
              onClick={() => setBagSearch("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {bagSearchResult && (
          <div className="pt-1">
            {bagSearchResult.player ? (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
                    {bagSearchResult.player.photo_url ? (
                      <img src={bagSearchResult.player.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      {bagSearchResult.player.name}
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                        حقيبة #{bagSearchResult.bagNumber}
                      </span>
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      الفئة: {bagSearchResult.player.category} • المركز: {bagSearchResult.player.position || 'غير محدد'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handlePlayerClick(bagSearchResult.player)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-8 px-3 rounded-xl"
                >
                  معاينة الملف 👁️
                </Button>
              </div>
            ) : (
              <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs p-2.5 rounded-xl text-center font-bold">
                ❌ لا يوجد لاعب برقم الحقيبة «{bagSearchResult.query}» ضمن لاعبيك
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Quick Pitch Action Buttons (Optimized for Mobile) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/academy/attendance')}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black h-14 px-4 rounded-2xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2.5 text-xs transition-all active:scale-95"
        >
          <QrCode className="h-5 w-5 shrink-0" />
          <span>مسح الحضور بالـ QR 📷</span>
        </button>

        <button
          onClick={() => navigate('/academy/squad-builder')}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black h-14 px-4 rounded-2xl shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2.5 text-xs transition-all active:scale-95"
        >
          <Swords className="h-5 w-5 shrink-0" />
          <span>الخطة والتشكيلة ⚽</span>
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {menuItems.map((item: any) => (
          <button 
            key={item.id}
            onClick={() => navigate(item.route)}
            className="flex flex-col items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl group hover:bg-zinc-800/50 hover:border-zinc-700 transition-all active:scale-95 shadow-sm"
          >
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-hover:-translate-y-1", item.color)}>
               <item.icon size={22} />
            </div>
            <span className="text-xs font-black text-zinc-300 tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>

      <Button 
        onClick={handleBatchExportReports}
        disabled={isExporting}
        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 font-black h-14 rounded-3xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <Download size={20} />
        {isExporting ? "جاري التجهيز..." : "استخراج الدفاتر البيداغوجية لكل الفئة (PDF)"}
      </Button>

      <Card className="bg-zinc-900/50 border-zinc-800/80 rounded-3xl overflow-hidden shadow-lg">
         <div className="p-4 border-b border-zinc-800/80 bg-zinc-800/20 flex justify-between items-center">
            <h3 className="text-sm font-black flex items-center gap-2 text-zinc-200">
              <Trophy size={18} className="text-purple-500" /> آخر نتيجة
            </h3>
            <span className="text-xs font-bold text-zinc-500">{stats.lastMatch?.match_date || '--'}</span>
         </div>
         <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />
           {stats.lastMatch ? (
              <div className="flex justify-around items-center relative z-10">
                 <div className="text-center">
                    <div className="h-14 w-14 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center mx-auto mb-2 shadow-inner">
                      <Shield className="h-7 w-7 text-emerald-500" />
                    </div>
                    <p className="text-xs font-black text-zinc-300">{user?.category}</p>
                 </div>
                 <div className="text-center px-4">
                    <p className="text-4xl font-black text-white tracking-widest">{stats.lastMatch.score_academy} - {stats.lastMatch.score_opponent}</p>
                    <p className="text-[10px] text-purple-400 mt-2 font-bold uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full inline-block">{stats.lastMatch.match_type}</p>
                 </div>
                 <div className="text-center">
                    <div className="h-14 w-14 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center mx-auto mb-2 shadow-inner">
                      <Shield className="h-7 w-7 text-zinc-600" />
                    </div>
                    <p className="text-xs font-black text-zinc-300 truncate max-w-[80px]">{stats.lastMatch.opponent}</p>
                 </div>
              </div>
           ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Trophy className="h-10 w-10 text-zinc-800 mb-3" />
                <p className="text-sm font-bold text-zinc-600">لا توجد بيانات مباراة سابقة</p>
              </div>
           )}
         </CardContent>
      </Card>

      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2">
            <User size={18} className="text-blue-500" />
            <h3 className="text-sm font-black text-zinc-200">لاعبي الفئة</h3>
            <span className="text-[10px] bg-blue-500/10 text-blue-500 font-black px-3 py-1 rounded-full">
              {players.length} لاعب
            </span>
          </div>

          {/* Quick player search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchPlayer}
              onChange={(e) => setSearchPlayer(e.target.value)}
              placeholder="تصفية بالاسم أو المركز..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-8 pl-7 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            />
            {searchPlayer && (
              <button
                onClick={() => setSearchPlayer("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.filter(p => !searchPlayer.trim() || p.name?.toLowerCase().includes(searchPlayer.toLowerCase()) || p.position?.toLowerCase().includes(searchPlayer.toLowerCase())).map(p => {
            const bag = getPlayerBagNumber(p.player_id, p.notes);
            return (
              <Card 
                key={p.player_id} 
                onClick={() => handlePlayerClick(p)}
                className="bg-zinc-900/40 border-zinc-800/80 p-3 hover:bg-zinc-800/60 cursor-pointer group transition-all rounded-2xl flex items-center gap-4"
              >
                <div className="h-14 w-14 rounded-xl bg-zinc-950 flex-shrink-0 overflow-hidden border border-zinc-800 shadow-inner relative">
                  {p.photo_url ? 
                    <img src={p.photo_url} className="h-full w-full object-cover" alt={p.name} /> 
                    : <User className="h-full w-full p-3 text-zinc-700" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-white truncate">{p.name}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-[10px] text-zinc-500 font-bold bg-zinc-950 px-2 py-0.5 rounded-md">{p.position || 'غير محدد'}</p>
                    {p.blood_type && <p className="text-[10px] text-rose-500 font-bold">{p.blood_type}</p>}
                    {bag && (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <ShoppingBag className="h-2.5 w-2.5" /> #{bag}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all shadow-sm">
                  <ChevronLeft size={20} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isPlayerModalOpen} onClose={() => setIsPlayerModalOpen(false)} title={`ملف: ${selectedPlayer?.name}`} size="lg">
         <div className="space-y-6 pt-4 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 rounded-3xl flex items-center gap-5 border border-zinc-800/80 shadow-lg">
               <div className="h-20 w-20 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-inner">
                  {selectedPlayer?.photo_url ? <img src={selectedPlayer.photo_url} className="h-full w-full object-cover" /> : <User className="h-full w-full p-5 text-zinc-700" />}
               </div>
               <div>
                  <h3 className="text-xl font-black text-white mb-1">{selectedPlayer?.name}</h3>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md">{selectedPlayer?.category}</span>
                    <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">{selectedPlayer?.position || 'مركز غير محدد'}</span>
                    {selectedPlayer && (() => {
                      const bag = getPlayerBagNumber(selectedPlayer.player_id, selectedPlayer.notes);
                      return bag ? (
                        <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" /> حقيبة #{bag} 🔒
                        </span>
                      ) : null;
                    })()}
                  </div>
               </div>
            </div>
            
            <div className="bg-zinc-950 rounded-3xl p-4 sm:p-6 border border-zinc-800 shadow-inner">
                <PedagogicalNotebook player={selectedPlayer} isCoach={true} />
            </div>

            {user?.role === 'coach' && (
              <div className="grid grid-cols-2 gap-3 pb-4">
                <Button 
                  onClick={() => {
                    const p = selectedPlayer;
                    setIsPlayerModalOpen(false);
                    setFutModalPlayer(p);
                  }} 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-zinc-950 font-black rounded-2xl h-14 col-span-2 shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  بطاقة EA FC / FIFA الرقمية ⭐
                </Button>
                <Button 
                  onClick={() => {
                    setIsPlayerModalOpen(false);
                    navigate('/academy/evaluations');
                  }} 
                  className="bg-emerald-600 hover:bg-emerald-700 font-black rounded-2xl h-14 shadow-lg shadow-emerald-600/20"
                >
                  تقييم اللاعب
                </Button>
                <Button 
                  onClick={() => handlePrintPlayerReport(selectedPlayer)} 
                  disabled={isExporting}
                  variant="outline" 
                  className="border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-black rounded-2xl h-14"
                >
                  {isExporting ? "جاري الاستخراج..." : "تصدير التقرير الفردي (PDF)"}
                </Button>
              </div>
            )}
         </div>
      </Modal>

      {/* EA FC / FIFA Card Modal for Coaches */}
      <Modal
        isOpen={!!futModalPlayer}
        onClose={() => setFutModalPlayer(null)}
        title={`بطاقة EA Sports FC الرقمية: ${futModalPlayer?.name || ""}`}
        size="md"
      >
        {futModalPlayer && (
          <div className="py-4 flex flex-col items-center justify-center font-tajawal">
            <FUTPlayerCard
              player={{
                name: futModalPlayer.name,
                category: futModalPlayer.category,
                position: futModalPlayer.position || "FWD",
                jerseyNumber: futModalPlayer.jersey_number,
                photoUrl: futModalPlayer.photo_url,
                rating: futModalPlayer.level_score || 85,
                academyName: settings?.name || "أكاديمية أجيال وادي العثمانية",
                academyLogo: settings?.logo_url,
              }}
              cardTheme="gold"
              showActions={true}
            />
          </div>
        )}
      </Modal>

      {batchPrintData && (
        <PrintPortal 
          isOpen={!!batchPrintData} 
          onClose={() => setBatchPrintData(null)}
          title={`تقارير فئة ${user?.category}`}
          fileName={`تقارير_الفئة_${user?.category}`}
          id="batch-reports-portal"
        >
          <BatchPedagogicalReportsTemplate 
            playersData={batchPrintData}
            academySettings={settings}
          />
        </PrintPortal>
      )}

      {printData && (
        <PrintPortal
          isOpen={!!printData}
          onClose={() => setPrintData(null)}
          title={`الدفتر البيداغوجي: ${printData.player.name}`}
          fileName={`الدفتر_البيداغوجي_${printData.player.name}`}
          id="pedagogical-notebook-portal"
        >
          <PedagogicalNotebookTemplate 
            player={printData.player}
            evaluations={printData.evaluations}
            physicalMetrics={printData.physicalMetrics}
            attendanceStats={printData.attendanceStats}
            academySettings={settings}
          />
        </PrintPortal>
      )}
    </div>
  );
}
