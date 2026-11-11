import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Calendar, Trophy, Star, ClipboardCheck, 
  User, Activity, Download, ChevronLeft, Shield, FileText,
  Stethoscope, LayoutDashboard, Sparkles, QrCode, Swords, Phone,
  ShoppingBag, Search, X, CheckCircle, TrendingUp, Dumbbell,
  Clock, DollarSign, Award, Eye, Printer, ChevronDown, Check,
  MessageCircle, ExternalLink, LogOut, ArrowRight
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
import { QRCodeSVG } from "qrcode.react";

const MATCH_MULTIPLIERS: Record<string, number> = { friendly: 1, official: 1.5, cup: 2 };

export function CoachNotebook() {
  const { user, logout } = useAuth();
  const { settings } = useAcademy();
  const navigate = useNavigate();

  const [players, setPlayers] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [assignedTeams, setAssignedTeams] = useState<any[]>([]);
  const [allCoachTrainings, setAllCoachTrainings] = useState<any[]>([]);
  const [allCoachMatches, setAllCoachMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'players' | 'sessions' | 'tools'>('players');

  // Player modals & search
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [bagSearch, setBagSearch] = useState("");
  const [searchPlayer, setSearchPlayer] = useState("");
  const [futModalPlayer, setFutModalPlayer] = useState<any | null>(null);

  // Month selection for sessions and finances (defaults to current month)
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Print Portals
  const [printData, setPrintData] = useState<any>(null);
  const [batchPrintData, setBatchPrintData] = useState<any[] | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isStatementPrintOpen, setIsStatementPrintOpen] = useState(false);
  const [isBadgePrintOpen, setIsBadgePrintOpen] = useState(false);

  const [stats, setStats] = useState({
    totalPlayers: 0,
    nextTraining: null as any,
    weeklyAttendance: 0,
    lastMatch: null as any,
    completedTrainingsCount: 0,
    completedMatchesCount: 0
  });

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

  // Bag search result for quick read-only inspection
  const bagSearchResult = useMemo(() => {
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
      const [pData, tData, mData, aData, kData, coachesList] = await Promise.all([
        api.getPlayers().catch(() => []),
        api.getTrainings().catch(() => []),
        api.getMatches().catch(() => []),
        api.getAttendance().catch(() => []),
        api.getKits().catch(() => []),
        api.getCoaches().catch(() => [])
      ]);

      setKits(kData || []);

      // Find current coach profile
      const currentCoach = (coachesList || []).find((c: any) => 
        (user?.coach_id && Number(c.coach_id) === Number(user.coach_id)) ||
        (user?.username && c.username === user.username) ||
        (user?.name && c.name === user.name)
      );

      const enrichedProfile = currentCoach ? {
        ...currentCoach,
        specialization: currentCoach.specialty || currentCoach.specialization || 'مدير فني / مدرب رئيسي',
        photo_url: localStorage.getItem(`coach_photo_${currentCoach.coach_id}`) || null
      } : {
        name: user?.name || user?.username || 'كوتش الأكاديمية',
        specialization: 'طاقم فني وتدريبي',
        license: 'معتمد رسمياً',
        category: user?.category || 'الفريق الأول',
        salary_per_session: 1000
      };
      setCoachProfile(enrichedProfile);

      let filteredPlayers = pData || [];
      let filteredTrainings = tData || [];
      let filteredMatches = mData || [];
      let resolvedCoachTeams: any[] = [];

      if (user?.role === 'coach') {
        const coachId = user.coach_id || currentCoach?.coach_id;
        const coachCategory = user.category || currentCoach?.category;
        const coachTeamId = user.team_id || currentCoach?.team_id;

        const { data: teamsData } = await supabase.from('teams').select('*');
        const allTeams = teamsData || [];

        // STRICT MATCHING: Find teams explicitly assigned to this coach (by coach_id or team_id)
        resolvedCoachTeams = allTeams.filter((t: any) => 
          (coachId && Number(t.coach_id) === Number(coachId)) || 
          (coachTeamId && Number(t.team_id) === Number(coachTeamId))
        );

        // Fallback only if no team is assigned to this coach at all:
        // check if there's a team in their category that has no coach assigned
        if (resolvedCoachTeams.length === 0 && coachCategory) {
          const categoryTeams = allTeams.filter((t: any) => t.category === coachCategory);
          const unassigned = categoryTeams.filter((t: any) => !t.coach_id || Number(t.coach_id) === Number(coachId));
          if (unassigned.length > 0) {
            resolvedCoachTeams = [unassigned[0]];
          }
        }

        setAssignedTeams(resolvedCoachTeams);
        const coachTeamIds = resolvedCoachTeams.map((t: any) => Number(t.team_id));

        if (coachTeamIds.length > 0) {
          // STRICT RULE: Only players belonging to this coach's specific team/squad (الفوج الموكل)!
          // Never mix with other teams/squads of the same category!
          filteredPlayers = (pData || []).filter((p: any) => 
            p.team_id && coachTeamIds.includes(Number(p.team_id))
          );

          // STRICT RULE: Only trainings for this coach or this coach's specific team/squad!
          filteredTrainings = (tData || []).filter((t: any) => {
            if (t.coach_id && Number(t.coach_id) === Number(coachId)) return true;
            if (t.team_id && coachTeamIds.includes(Number(t.team_id))) return true;
            return false;
          });

          // STRICT RULE: Only matches for this coach or this coach's specific team/squad!
          filteredMatches = (mData || []).filter((m: any) => {
            if (m.coach_id && Number(m.coach_id) === Number(coachId)) return true;
            if (m.team_id && coachTeamIds.includes(Number(m.team_id))) return true;
            return false;
          });
        } else if (coachCategory) {
          // Fallback only if category has no teams at all: unassigned players of this category
          filteredPlayers = (pData || []).filter((p: any) => 
            p.category === coachCategory && !p.team_id
          );
          filteredTrainings = (tData || []).filter((t: any) => 
            (t.coach_id && Number(t.coach_id) === Number(coachId)) ||
            (!t.coach_id && !t.team_id && t.category === coachCategory)
          );
          filteredMatches = (mData || []).filter((m: any) => 
            (m.coach_id && Number(m.coach_id) === Number(coachId)) ||
            (!m.coach_id && !m.team_id && m.category === coachCategory)
          );
        }
      }

      setPlayers(filteredPlayers);
      setAllCoachTrainings(filteredTrainings);
      setAllCoachMatches(filteredMatches);

      const today = new Date();
      const nextT = filteredTrainings
        .filter((t: any) => new Date(t.date) >= today)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
      
      const lastM = filteredMatches
        .filter((m: any) => new Date(m.match_date || m.date) <= today)
        .sort((a: any, b: any) => new Date(b.match_date || b.date).getTime() - new Date(a.match_date || a.date).getTime())[0];

      const filteredPlayerIds = filteredPlayers.map((p: any) => p.player_id);
      const categoryAttendance = (aData || []).filter((a: any) => filteredPlayerIds.includes(a.player_id));
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
      console.error("Coach notebook load failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Monthly stats calculations for selectedMonth
  const monthlyStats = useMemo(() => {
    const monthTrainings = allCoachTrainings.filter(t => (t.date || "").startsWith(selectedMonth));
    const monthMatches = allCoachMatches.filter(m => (m.match_date || m.date || "").startsWith(selectedMonth));

    const matchEquiv = monthMatches.reduce((sum, m) => sum + (MATCH_MULTIPLIERS[m.match_type || 'official'] ?? 1), 0);
    const totalSessions = monthTrainings.length + matchEquiv;
    const rate = Number(coachProfile?.salary_per_session) || 1000;
    const monthlyAmount = totalSessions * rate;

    return {
      monthTrainings,
      monthMatches,
      trainingCount: monthTrainings.length,
      matchCount: monthMatches.length,
      matchEquiv,
      totalSessions,
      rate,
      monthlyAmount
    };
  }, [allCoachTrainings, allCoachMatches, selectedMonth, coachProfile]);

  const handlePlayerClick = async (player: any) => {
    setSelectedPlayer(player);
    setIsPlayerModalOpen(true);
  };

  const handlePrintPlayerReport = async (player: any) => {
    setIsExporting(true);
    try {
      const [evals, metrics, attHistory] = await Promise.all([
        api.getEvaluationsByPlayer(player.player_id).catch(() => []),
        api.getPhysicalMetrics(player.player_id).catch(() => []),
        api.getPlayerAttendanceHistory(player.player_id).catch(() => [])
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
          api.getEvaluationsByPlayer(player.player_id).catch(() => []),
          api.getPhysicalMetrics(player.player_id).catch(() => []),
          api.getPlayerAttendanceHistory(player.player_id).catch(() => [])
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
          await exportToPDF('batch-pedagogical-reports', `الدفاتر_البيداغوجية_لفئة_${coachProfile?.category || user?.category}`);
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

  // Filtered Players list
  const filteredPlayersList = useMemo(() => {
    if (!searchPlayer.trim()) return players;
    const q = searchPlayer.toLowerCase();
    return players.filter(p => 
      (p.name || "").toLowerCase().includes(q) ||
      (p.position || "").toLowerCase().includes(q) ||
      getPlayerBagNumber(p.player_id, p.notes).toLowerCase().includes(q)
    );
  }, [players, searchPlayer, kits]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 font-tajawal text-zinc-400">
        <div className="h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="font-bold text-sm">جاري تهيئة فضاء الطاقم الفني وتكليفات الفوج...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto font-tajawal text-right rtl animate-in fade-in duration-300" dir="rtl">
      
      {/* 1. EXECUTIVE COACH HERO BANNER (واجهة فضاء الطاقم الفني الاحترافية) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Identity & Role info */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-zinc-950 border-2 border-emerald-500/40 p-1 flex items-center justify-center shadow-xl shadow-emerald-950/40 overflow-hidden flex-shrink-0">
              {coachProfile?.photo_url ? (
                <img src={coachProfile.photo_url} className="h-full w-full object-cover rounded-xl" alt="" />
              ) : settings?.logo_url ? (
                <img src={settings.logo_url} className="h-full w-full object-contain p-1" alt="" />
              ) : (
                <Shield className="h-9 w-9 text-emerald-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-0.5 rounded-full font-black">
                  👑 {coachProfile?.specialization || 'طاقم فني وتدريبي'}
                </span>
                <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {assignedTeams.length > 0 
                    ? assignedTeams.map(t => `فئة ${t.category} (${t.team_name})`).join(" • ")
                    : `فئة ${coachProfile?.category || user?.category || 'غير محدد'}`}
                </span>
                {coachProfile?.license && (
                  <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] px-2.5 py-0.5 rounded-full font-mono">
                    {coachProfile.license}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                فضاء الكوتش: {coachProfile?.name}
              </h1>

              <p className="text-xs text-zinc-400 font-medium">
                مرحباً بك في فضائك الرقمي الخاص. تظهر لك هنا بيانات فئتك فقط، لاعبيك، وحصصك المنجزة.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons in Banner */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Month Picker */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-xs">
              <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-400 font-bold">الشهر:</span>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              />
            </div>

            {/* Quick statement print */}
            <Button
              onClick={() => setIsStatementPrintOpen(true)}
              variant="outline"
              className="border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-100 text-xs font-bold h-10 px-3.5 rounded-xl gap-1.5"
            >
              <Printer className="h-4 w-4 text-amber-400" />
              كشف مستحقاتي
            </Button>

            {/* Attendance QR Shortcut */}
            <Button
              onClick={() => navigate('/academy/attendance')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black h-10 px-4 rounded-xl shadow-lg shadow-emerald-950/40 gap-1.5"
            >
              <QrCode className="h-4 w-4" />
              مسح الحضور بالـ QR
            </Button>
          </div>

        </div>
      </div>

      {/* 2. EXECUTIVE LIVE STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Squad players count */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-1 text-center shadow-lg">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="h-4.5 w-4.5 text-blue-400" />
          </div>
          <span className="text-2xl font-black text-white">{players.length}</span>
          <span className="text-[11px] text-zinc-400 font-bold">لاعبي فوجه فقط</span>
        </div>

        {/* Trainings this month */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-1 text-center shadow-lg">
          <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Dumbbell className="h-4.5 w-4.5 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-cyan-300">{monthlyStats.trainingCount}</span>
          <span className="text-[11px] text-zinc-400 font-bold">تدريبات ({selectedMonth})</span>
        </div>

        {/* Matches this month */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-1 text-center shadow-lg">
          <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Trophy className="h-4.5 w-4.5 text-purple-400" />
          </div>
          <span className="text-2xl font-black text-purple-300">
            {monthlyStats.matchCount}
            <span className="text-xs text-zinc-500 font-normal mr-1">
              (={monthlyStats.matchEquiv} ح)
            </span>
          </span>
          <span className="text-[11px] text-zinc-400 font-bold">مباريات معتمدة</span>
        </div>

        {/* Attendance Rate */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-1 text-center shadow-lg">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ClipboardCheck className="h-4.5 w-4.5 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-300">{stats.weeklyAttendance}%</span>
          <span className="text-[11px] text-zinc-400 font-bold">نسبة انضباط الفوج</span>
        </div>

        {/* Accrued earnings */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-zinc-900 to-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl flex flex-col items-center gap-1 text-center shadow-lg">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <span className="text-xl font-black text-emerald-400">
            {monthlyStats.monthlyAmount.toLocaleString()} دج
          </span>
          <span className="text-[11px] text-zinc-400 font-bold">مستحقات ({monthlyStats.totalSessions} حصة)</span>
        </div>
      </div>

      {/* 3. BAG NUMBER SEARCH BOX (استعلام فوري برقم الحقيبة - للقراءة فقط) */}
      <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-amber-500/30 p-4 sm:p-5 rounded-3xl shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                البحث السريع برقم الحقيبة
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  خاص بلاعبيك 🔒
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                اكتب رقم الحقيبة (مثال: 7 أو 14) لمعاينة اسم اللاعب صاحب الحقيبة فوراً دون إمكانية التعديل.
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-500 font-mono bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-800">
            وضع القراءة فقط
          </span>
        </div>

        <div className="relative">
          <ShoppingBag className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
          <input
            type="text"
            value={bagSearch}
            onChange={(e) => setBagSearch(e.target.value)}
            placeholder="اكتب رقم الحقيبة هنا للبحث الفوري..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pr-10 pl-9 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {bagSearch && (
            <button
              onClick={() => setBagSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Result Display */}
        {bagSearchResult && (
          <div className="pt-1">
            {bagSearchResult.player ? (
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-emerald-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                    {bagSearchResult.player.photo_url ? (
                      <img src={bagSearchResult.player.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white flex items-center gap-2">
                      {bagSearchResult.player.name}
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold">
                        حقيبة #{bagSearchResult.bagNumber}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      الفئة: <span className="text-emerald-400 font-bold">{bagSearchResult.player.category}</span>
                      <span className="mx-1.5 text-zinc-600">•</span>
                      المركز: <span className="text-zinc-300">{bagSearchResult.player.position || 'غير محدد'}</span>
                      {bagSearchResult.player.birth_date && (
                        <>
                          <span className="mx-1.5 text-zinc-600">•</span>
                          <span>مواليد: {bagSearchResult.player.birth_date}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {bagSearchResult.player.parent_phone && (
                    <a
                      href={`tel:${bagSearchResult.player.parent_phone}`}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                    >
                      <Phone className="h-3.5 w-3.5 text-cyan-400" />
                      اتصال بالولي
                    </a>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handlePlayerClick(bagSearchResult.player)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3.5 rounded-xl"
                  >
                    معاينة الملف 👁️
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-2xl text-center font-bold">
                ❌ لا يوجد لاعب برقم الحقيبة «{bagSearchResult.query}» ضمن لاعبيك في الفئة {coachProfile?.category || user?.category}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4. WORKSPACE TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('players')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'players' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' 
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Users className="h-4 w-4" />
          قائمة لاعبي الفوج ({players.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'sessions' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' 
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Activity className="h-4 w-4" />
          سجل الحصص والمباريات ({monthlyStats.totalSessions})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'tools' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' 
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Swords className="h-4 w-4" />
          الأدوات الميدانية السريعة
        </button>
      </div>

      {/* TAB 1: SQUAD PLAYERS LIST */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
                placeholder="بحث في لاعبي فوجك: بالاسم، المركز، أو رقم الحقيبة..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
              <span className="text-zinc-400 font-bold">
                المعروض: {filteredPlayersList.length} من {players.length} لاعب
              </span>
              <Button
                size="sm"
                onClick={handleBatchExportReports}
                disabled={isExporting}
                variant="outline"
                className="border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-bold rounded-xl"
              >
                <Download className="h-3.5 w-3.5 ml-1 text-emerald-400" />
                دفاتر الفئة (PDF)
              </Button>
            </div>
          </div>

          {filteredPlayersList.length === 0 ? (
            <div className="py-12 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs space-y-1">
              <Users className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
              <p className="font-bold">لا يوجد لاعبين مطابقين للبحث في فئتك</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPlayersList.map((p) => {
                const bag = getPlayerBagNumber(p.player_id, p.notes);

                return (
                  <Card
                    key={p.player_id}
                    onClick={() => handlePlayerClick(p)}
                    className="bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-emerald-500/40 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-md flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-14 w-14 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:border-emerald-500/40 transition-colors">
                        {p.photo_url ? (
                          <img src={p.photo_url} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <User className="h-7 w-7 text-zinc-700" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                          {p.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] bg-zinc-950 text-zinc-300 px-2 py-0.5 rounded-md font-bold">
                            {p.position || 'لاعب'}
                          </span>
                          {bag && (
                            <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                              <ShoppingBag className="h-2.5 w-2.5" /> #{bag}
                            </span>
                          )}
                          {p.blood_type && (
                            <span className="text-[9px] text-rose-400 font-bold font-mono">
                              {p.blood_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.parent_phone && (
                        <a
                          href={`tel:${p.parent_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-cyan-400 flex items-center justify-center border border-zinc-800 transition-colors"
                          title={`اتصال بولي الأمر: ${p.parent_phone}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <div className="h-8 w-8 rounded-xl bg-zinc-950 group-hover:bg-emerald-600 text-zinc-500 group-hover:text-white flex items-center justify-center border border-zinc-800 group-hover:border-emerald-600 transition-all">
                        <ChevronLeft className="h-4 w-4" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SESSIONS & MATCHES BREAKDOWN */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Month Financial Summary Card */}
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-5 rounded-3xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400">ملخص نشاط الشهر المرجعي:</span>
              <h3 className="text-xl font-black text-white">
                شهر {selectedMonth}: {monthlyStats.totalSessions} حصة معتمدة
              </h3>
              <p className="text-xs text-zinc-400">
                معدل الأجر: <span className="text-emerald-400 font-bold">{monthlyStats.rate} دج</span> لكل حصة تدريبية أو نقطة مباراة.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-emerald-950/40 border border-emerald-500/30 px-5 py-3 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-emerald-400 block">إجمالي المستحق للشهر</span>
                <span className="text-2xl font-black text-emerald-300">
                  {monthlyStats.monthlyAmount.toLocaleString()} دج
                </span>
              </div>
              <Button
                onClick={() => setIsStatementPrintOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-12 px-4 rounded-2xl gap-1.5 shadow-lg"
              >
                <Printer className="h-4 w-4" />
                طباعة الكشف الرسمي
              </Button>
            </div>
          </div>

          {/* Conducted Trainings Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-200 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-emerald-400" />
                التدريبات المنجزة ({monthlyStats.trainingCount} حصة)
              </h3>
              <span className="text-xs text-zinc-500 font-mono">1 حصة لكل موعد</span>
            </div>

            {monthlyStats.monthTrainings.length === 0 ? (
              <div className="p-6 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
                لا توجد حصص تدريبية مسجلة لهذا المدرب في شهر {selectedMonth}
              </div>
            ) : (
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-bold">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">تاريخ التدريب</th>
                      <th className="px-4 py-3">المكان والوقت</th>
                      <th className="px-4 py-3">الموضوع / التركيز الفني</th>
                      <th className="px-4 py-3 text-center">الاعتماد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {monthlyStats.monthTrainings.map((t: any, idx: number) => (
                      <tr key={t.training_id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-zinc-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono font-bold text-zinc-200">{t.date}</td>
                        <td className="px-4 py-3 text-zinc-300">{t.location || 'الملعب الرئيسي'} {t.start_time ? `(${t.start_time})` : ''}</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{t.topic || t.notes || 'حصة تدريبية مبرمجة'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                            1 حصة
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Supervised Matches Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-200 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-purple-400" />
                المباريات المشرف عليها ({monthlyStats.matchCount} مباراة = {monthlyStats.matchEquiv} حصة)
              </h3>
              <span className="text-xs text-zinc-500">
                (ودية: 1 • رسمية: 1.5 • كأس: 2)
              </span>
            </div>

            {monthlyStats.monthMatches.length === 0 ? (
              <div className="p-6 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
                لا توجد مباريات مسجلة لهذا الفوج في شهر {selectedMonth}
              </div>
            ) : (
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-bold">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">تاريخ المباراة</th>
                      <th className="px-4 py-3">الخصم المنافس</th>
                      <th className="px-4 py-3">نوع اللقاء</th>
                      <th className="px-4 py-3 text-center">النتيجة</th>
                      <th className="px-4 py-3 text-center">الحصص المكافئة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {monthlyStats.monthMatches.map((m: any, idx: number) => {
                      const mult = MATCH_MULTIPLIERS[m.match_type || 'official'] ?? 1;
                      return (
                        <tr key={m.match_id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-zinc-500">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono font-bold text-zinc-200">{m.match_date || m.date}</td>
                          <td className="px-4 py-3 font-bold text-white">{m.opponent_name || m.opponent || 'خصم'}</td>
                          <td className="px-4 py-3">
                            <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-300">
                              {m.match_type === 'official' ? 'مباراة رسمية' : m.match_type === 'cup' ? 'مباراة كأس' : 'مباراة ودية'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-amber-400">
                            {m.score_academy ?? '-'} : {m.score_opponent ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-black">
                              {mult} حصة
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FIELD QUICK TOOLS */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/academy/attendance')}
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-105 group shadow-lg"
          >
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md">
              <QrCode className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-black text-white">تسجيل الحضور بالـ QR</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">مسح البطاقات أو يدوي</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/academy/squad-builder')}
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-105 group shadow-lg"
          >
            <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-md">
              <Swords className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-black text-white">الخطة والتشكيلة ⚽</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">رسم التكتيك الميداني</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/academy/evaluations')}
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-105 group shadow-lg"
          >
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-md">
              <Star className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-black text-white">تقييمات اللاعبين ⭐</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">رصد المستوى الفني</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/academy/matches')}
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/40 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-105 group shadow-lg"
          >
            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
              <Trophy className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-black text-white">مركز المباريات 🏆</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">النتائج والروزنامة</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/academy/physical-metrics')}
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-rose-500/40 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-105 group shadow-lg"
          >
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all shadow-md">
              <Activity className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-black text-white">القياسات البدنية ⚡</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">السرعة والتحمل والوزن</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/academy/injuries')}
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/40 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-105 group shadow-lg"
          >
            <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-md">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-black text-white">سجل الإصابات 🩺</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">متابعة تأهيل اللاعبين</p>
            </div>
          </button>

          <button
            onClick={handleBatchExportReports}
            disabled={isExporting}
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/40 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-105 group shadow-lg"
          >
            <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-md">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-black text-white">دفاتر الفئة (PDF) 📄</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">استخراج جماعي للتقارير</p>
            </div>
          </button>

          <button
            onClick={() => setIsBadgePrintOpen(true)}
            className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-105 group shadow-lg"
          >
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-md">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-black text-white">بطاقتي المهنية 🪪</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">عرض وطباعة الاعتماد</p>
            </div>
          </button>
        </div>
      )}

      {/* PLAYER DETAIL MODAL */}
      <Modal isOpen={isPlayerModalOpen} onClose={() => setIsPlayerModalOpen(false)} title={`ملف اللاعب: ${selectedPlayer?.name}`} size="lg">
        <div className="space-y-6 pt-2 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2 font-tajawal text-right" dir="rtl">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 rounded-3xl flex items-center gap-5 border border-zinc-800/80 shadow-lg">
            <div className="h-20 w-20 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-inner flex items-center justify-center">
              {selectedPlayer?.photo_url ? (
                <img src={selectedPlayer.photo_url} className="h-full w-full object-cover" alt="" />
              ) : (
                <User className="h-10 w-10 text-zinc-700" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">{selectedPlayer?.name}</h3>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md">{selectedPlayer?.category}</span>
                <span className="text-[10px] font-bold bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">{selectedPlayer?.position || 'مركز غير محدد'}</span>
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

          <div className="grid grid-cols-2 gap-3 pb-2">
            <Button 
              onClick={() => {
                const p = selectedPlayer;
                setIsPlayerModalOpen(false);
                setFutModalPlayer(p);
              }} 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-zinc-950 font-black rounded-2xl h-12 col-span-2 shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              بطاقة EA FC / FIFA الرقمية ⭐
            </Button>
            <Button 
              onClick={() => {
                setIsPlayerModalOpen(false);
                navigate('/academy/evaluations');
              }} 
              className="bg-emerald-600 hover:bg-emerald-700 font-black rounded-2xl h-12 shadow-lg shadow-emerald-600/20"
            >
              تقييم اللاعب
            </Button>
            <Button 
              onClick={() => handlePrintPlayerReport(selectedPlayer)} 
              disabled={isExporting}
              variant="outline" 
              className="border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-black rounded-2xl h-12"
            >
              {isExporting ? "جاري الاستخراج..." : "تصدير التقرير الفردي (PDF)"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* FUT EA SPORTS FC CARD MODAL */}
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

      {/* COACH OFFICIAL MONTHLY STATEMENT PRINT PORTAL */}
      {isStatementPrintOpen && coachProfile && (
        <PrintPortal
          id="coach-statement-print"
          title="كشف المستحقات والنشاط الفردي للمدرب"
          fileName={`كشف_مستحقات_${coachProfile.name.replace(/\s+/g, '_')}_${selectedMonth}`}
          onClose={() => setIsStatementPrintOpen(false)}
        >
          <div className="p-8 bg-white text-zinc-900 font-tajawal max-w-4xl mx-auto space-y-6" dir="rtl">
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
              <div className="space-y-1">
                <h1 className="text-xl font-black text-emerald-800">أكاديمية أجيال وادي العثمانية (AGOA)</h1>
                <h2 className="text-sm font-bold text-zinc-700">كشف النشاط التدريبي والمستحقات الشهرية للمدرب</h2>
                <p className="text-xs text-zinc-500">موسم 2026 / 2027</p>
              </div>
              <div className="text-left text-xs font-mono text-zinc-700 space-y-0.5">
                <p><span className="font-bold">الشهر:</span> {selectedMonth}</p>
                <p><span className="font-bold">تاريخ الكشف:</span> {new Date().toLocaleDateString('ar-DZ')}</p>
                <p><span className="font-bold">معرف المدرب:</span> AGOA-STF-{coachProfile.coach_id || user?.coach_id || '01'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-100 p-4 rounded-xl border border-zinc-300 text-xs">
              <div>
                <span className="text-zinc-500 block">اسم المدرب:</span>
                <span className="font-black text-sm text-zinc-900">{coachProfile.name}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">الصفة الفنية:</span>
                <span className="font-bold text-zinc-900">{coachProfile.specialization}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">الفئة المكلف بها:</span>
                <span className="font-bold text-zinc-900">{coachProfile.category || user?.category}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">الرخصة:</span>
                <span className="font-mono font-bold text-zinc-900">{coachProfile.license || 'معتمد'}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="border border-zinc-300 p-3 rounded-lg">
                <span className="text-zinc-600 block">التدريبات المنفذة</span>
                <span className="font-black text-lg text-zinc-900">{monthlyStats.trainingCount} حصة</span>
              </div>
              <div className="border border-zinc-300 p-3 rounded-lg">
                <span className="text-zinc-600 block">المباريات الرسمية والودية</span>
                <span className="font-black text-lg text-zinc-900">
                  {monthlyStats.matchCount} مباراة ({monthlyStats.matchEquiv} حصة)
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg">
                <span className="text-emerald-800 font-bold block">إجمالي المستحق المالي</span>
                <span className="font-black text-xl text-emerald-800">
                  {monthlyStats.monthlyAmount.toLocaleString()} دج
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-black text-zinc-800">تفاصيل الحصص المنفذة خلال شهر {selectedMonth}:</h3>
              <table className="w-full text-xs text-right border-collapse border border-zinc-300">
                <thead className="bg-zinc-200 font-bold text-zinc-800">
                  <tr>
                    <th className="border border-zinc-300 px-3 py-1.5 w-10 text-center">#</th>
                    <th className="border border-zinc-300 px-3 py-1.5">التاريخ</th>
                    <th className="border border-zinc-300 px-3 py-1.5">النوع</th>
                    <th className="border border-zinc-300 px-3 py-1.5">الفئة / التفاصيل</th>
                    <th className="border border-zinc-300 px-3 py-1.5 text-center">معامل الحصة</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.monthTrainings.map((t: any, i: number) => (
                    <tr key={`t-${t.training_id}`} className="bg-white">
                      <td className="border border-zinc-200 px-2 py-1 text-center font-mono">{i + 1}</td>
                      <td className="border border-zinc-200 px-3 py-1 font-mono">{t.date}</td>
                      <td className="border border-zinc-200 px-3 py-1 font-bold text-zinc-700">حصة تدريبية</td>
                      <td className="border border-zinc-200 px-3 py-1">{t.topic || t.notes || coachProfile.category}</td>
                      <td className="border border-zinc-200 px-3 py-1 text-center font-bold">1</td>
                    </tr>
                  ))}
                  {monthlyStats.monthMatches.map((m: any, i: number) => {
                    const mult = MATCH_MULTIPLIERS[m.match_type || 'official'] ?? 1;
                    return (
                      <tr key={`m-${m.match_id}`} className="bg-amber-50/50">
                        <td className="border border-zinc-200 px-2 py-1 text-center font-mono">{monthlyStats.monthTrainings.length + i + 1}</td>
                        <td className="border border-zinc-200 px-3 py-1 font-mono">{m.match_date || m.date}</td>
                        <td className="border border-zinc-200 px-3 py-1 font-bold text-amber-800">
                          مباراة ({m.match_type === 'official' ? 'رسمية' : m.match_type === 'cup' ? 'كأس' : 'ودية'})
                        </td>
                        <td className="border border-zinc-200 px-3 py-1">ضد: {m.opponent_name || m.opponent || 'خصم'}</td>
                        <td className="border border-zinc-200 px-3 py-1 text-center font-black text-amber-900">{mult}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-zinc-50 border border-zinc-300 p-3 rounded-lg text-xs leading-relaxed text-zinc-700">
              أنا الموقع أسفله، السيد(ة): <span className="font-black text-zinc-900">{coachProfile.name}</span>، 
              أشهد أنني استلمت كامل مستحقاتي المالية عن شهر <span className="font-bold text-zinc-900">{selectedMonth}</span> 
              المقدرة بـ: <span className="font-black text-emerald-800">{monthlyStats.monthlyAmount.toLocaleString()} دج</span> 
              (عن إجمالي {monthlyStats.totalSessions} حصة تدريبية ومباراة).
            </div>

            <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs font-bold text-zinc-800">
              <div>
                <p className="border-b border-zinc-400 pb-1 mb-12">توقيع واستلام المدرب</p>
                <span>التوقيع مع عبارة "قرئ وصودق عليه"</span>
              </div>
              <div>
                <p className="border-b border-zinc-400 pb-1 mb-12">رئيس الأكاديمية / أمين المال</p>
                <span>التوقيع والختم الرسمي</span>
              </div>
            </div>
          </div>
        </PrintPortal>
      )}

      {/* BATCH REPORTS PRINT PORTAL */}
      {batchPrintData && (
        <PrintPortal 
          isOpen={!!batchPrintData} 
          onClose={() => setBatchPrintData(null)}
          title={`تقارير فئة ${coachProfile?.category || user?.category}`}
          fileName={`تقارير_الفئة_${coachProfile?.category || user?.category}`}
          id="batch-reports-portal"
        >
          <BatchPedagogicalReportsTemplate 
            playersData={batchPrintData}
            academySettings={settings}
          />
        </PrintPortal>
      )}

      {/* INDIVIDUAL PLAYER PRINT PORTAL */}
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
