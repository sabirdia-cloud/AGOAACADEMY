import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Calendar, Trophy, Star, ClipboardCheck,
  User, Activity, Download, ChevronLeft, Shield, FileText,
  Stethoscope, LayoutDashboard, Sparkles, QrCode, Swords, Phone,
  ShoppingBag, Search, X, CheckCircle, TrendingUp, Dumbbell,
  Clock, DollarSign, Award, Eye, Printer, ChevronDown, Check,
  MessageCircle, ExternalLink, LogOut, ArrowRight, Plus, Trash2,
  Save, AlertTriangle, AlertCircle, Share2, Medal, Edit3, Flag, CheckSquare
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
import { coachAbsenceService, CoachAbsence } from "@/services/coachAbsences";

const MATCH_MULTIPLIERS: Record<string, number> = {
  friendly: 1,
  'ودية': 1,
  official: 1.5,
  'رسمية': 1.5,
  cup: 2,
  'كأس': 2
};

export function CoachNotebook() {
  const { user } = useAuth();
  const { settings } = useAcademy();
  const navigate = useNavigate();

  const [players, setPlayers] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [assignedTeams, setAssignedTeams] = useState<any[]>([]);
  const [allCoachTrainings, setAllCoachTrainings] = useState<any[]>([]);
  const [allCoachMatches, setAllCoachMatches] = useState<any[]>([]);
  const [coachAbsences, setCoachAbsences] = useState<CoachAbsence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab: players | matches | sessions | tools
  const [activeTab, setActiveTab] = useState<'players' | 'matches' | 'sessions' | 'tools'>('players');

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

  // --- MATCHES & CONVOCATION STATE ---
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [newMatchForm, setNewMatchForm] = useState({
    match_date: new Date().toISOString().split('T')[0],
    time: "15:00",
    opponent: "",
    stadium: "الملعب البلدي - وادي العثمانية",
    match_type: "official",
    notes: ""
  });

  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [isConvocationOpen, setIsConvocationOpen] = useState(false);
  const [convocationSquad, setConvocationSquad] = useState<any[]>([]);
  const [isSavingSquad, setIsSavingSquad] = useState(false);

  const [isMatchSheetOpen, setIsMatchSheetOpen] = useState(false);
  const [matchSheetEvents, setMatchSheetEvents] = useState<any[]>([]);
  const [matchScoreInput, setMatchScoreInput] = useState("");
  const [newEventForm, setNewEventForm] = useState({
    player_id: "",
    event_type: "goal",
    minute: "15",
    notes: ""
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // In-Match Player Performance Ratings & Stats
  const [playerRatings, setPlayerRatings] = useState<Record<number, {
    rating: number;
    minutes: number;
    goals: number;
    assists: number;
    notes: string;
    saved?: boolean;
  }>>({});
  const [isSavingRatings, setIsSavingRatings] = useState(false);

  // Official Match Sheet Printable State
  const [printMatchData, setPrintMatchData] = useState<any | null>(null);

  // --- COACH ABSENCE STATE ---
  const [isAddAbsenceOpen, setIsAddAbsenceOpen] = useState(false);
  const [absenceForm, setAbsenceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: "ظرف شخصي مبرر",
    type: "training" as "training" | "match" | "other",
    deducted_sessions: 1
  });

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
        api.getEMSMatches().catch(() => []),
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

      const coachId = user?.coach_id || currentCoach?.coach_id || 1;
      const loadedAbsences = coachAbsenceService.getAbsences(Number(coachId));
      setCoachAbsences(loadedAbsences);

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
        const coachCategory = user.category || currentCoach?.category;
        const coachTeamId = user.team_id || currentCoach?.team_id;

        const { data: teamsData } = await supabase.from('teams').select('*');
        const allTeams = teamsData || [];

        // STRICT MATCHING: Find teams explicitly assigned to this coach
        resolvedCoachTeams = allTeams.filter((t: any) =>
          (coachId && Number(t.coach_id) === Number(coachId)) ||
          (coachTeamId && Number(t.team_id) === Number(coachTeamId))
        );

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
          filteredPlayers = (pData || []).filter((p: any) =>
            p.team_id && coachTeamIds.includes(Number(p.team_id))
          );

          filteredTrainings = (tData || []).filter((t: any) => {
            if (t.coach_id && Number(t.coach_id) === Number(coachId)) return true;
            if (t.team_id && coachTeamIds.includes(Number(t.team_id))) return true;
            return false;
          });

          filteredMatches = (mData || []).filter((m: any) => {
            if (m.coach_id && Number(m.coach_id) === Number(coachId)) return true;
            if (m.team_id && coachTeamIds.includes(Number(m.team_id))) return true;
            if (!m.coach_id && !m.team_id && coachCategory && m.category === coachCategory) return true;
            return false;
          });
        } else if (coachCategory) {
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

  // Precise Session & Financial Accounting (Trainings + Matches Multipliers - Coach Absences)
  const monthlyStats = useMemo(() => {
    const monthTrainings = allCoachTrainings.filter(t => (t.date || "").startsWith(selectedMonth));
    const monthMatches = allCoachMatches.filter(m => (m.match_date || m.date || "").startsWith(selectedMonth));

    const friendlyMatches = monthMatches.filter(m => !m.match_type || m.match_type === 'friendly' || m.match_type === 'ودية');
    const officialMatches = monthMatches.filter(m => m.match_type === 'official' || m.match_type === 'رسمية');
    const cupMatches = monthMatches.filter(m => m.match_type === 'cup' || m.match_type === 'كأس');

    const matchEquiv = (friendlyMatches.length * 1.0) + (officialMatches.length * 1.5) + (cupMatches.length * 2.0);
    const totalEarnedSessions = monthTrainings.length + matchEquiv;

    // Absences for this coach in selected month
    const monthAbsences = coachAbsences.filter(a => (a.date || "").startsWith(selectedMonth));
    const absencesCount = monthAbsences.reduce((sum, a) => sum + (Number(a.deducted_sessions) || 1), 0);

    const netSessions = Math.max(0, totalEarnedSessions - absencesCount);
    const rate = Number(coachProfile?.salary_per_session) || 1000;
    const monthlyAmount = netSessions * rate;
    const grossAmount = totalEarnedSessions * rate;
    const deductedAmount = absencesCount * rate;

    // Unified itemized ledger list (sorted by date)
    const ledgerItems: any[] = [];
    monthTrainings.forEach((t: any) => {
      ledgerItems.push({
        id: `t_${t.training_id}`,
        date: t.date,
        type: 'training',
        title: 'حصة تدريبية مبرمجة',
        details: t.topic || t.notes || 'تركيز بدني وتكتيكي',
        multiplier: 1.0,
        isCredit: true,
        amount: rate * 1.0
      });
    });

    monthMatches.forEach((m: any) => {
      const mType = m.match_type || 'official';
      const mult = MATCH_MULTIPLIERS[mType] ?? 1.0;
      const typeLabel = mType === 'official' || mType === 'رسمية' ? 'مباراة رسمية (×1.5)' : mType === 'cup' || mType === 'كأس' ? 'مباراة كأس (×2.0)' : 'مباراة ودية (×1.0)';
      ledgerItems.push({
        id: `m_${m.match_id || m.id}`,
        date: m.match_date || m.date,
        type: 'match',
        title: typeLabel,
        details: `ضد: ${m.away_team || m.opponent || m.home_team || 'خصم'} (${m.score || '- - -'})`,
        multiplier: mult,
        isCredit: true,
        amount: rate * mult
      });
    });

    monthAbsences.forEach((a: CoachAbsence) => {
      const deduction = Number(a.deducted_sessions) || 1;
      ledgerItems.push({
        id: `a_${a.id}`,
        date: a.date,
        type: 'absence',
        title: 'غياب مسجل للمدرب',
        details: a.reason || 'غياب غير مبرر',
        multiplier: -deduction,
        isCredit: false,
        amount: -(rate * deduction),
        rawAbsence: a
      });
    });

    ledgerItems.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return {
      monthTrainings,
      monthMatches,
      friendlyMatches,
      officialMatches,
      cupMatches,
      trainingCount: monthTrainings.length,
      matchCount: monthMatches.length,
      matchEquiv,
      totalEarnedSessions,
      monthAbsences,
      absencesCount,
      netSessions,
      rate,
      monthlyAmount,
      grossAmount,
      deductedAmount,
      ledgerItems
    };
  }, [allCoachTrainings, allCoachMatches, coachAbsences, selectedMonth, coachProfile]);

  // Handle adding coach absence
  const handleAddAbsence = () => {
    if (!absenceForm.date) {
      alert("يرجى تحديد تاريخ الغياب");
      return;
    }
    const cId = coachProfile?.coach_id || user?.coach_id || 1;
    coachAbsenceService.addAbsence(Number(cId), {
      date: absenceForm.date,
      reason: absenceForm.reason,
      type: absenceForm.type,
      deducted_sessions: Number(absenceForm.deducted_sessions) || 1
    });

    const updated = coachAbsenceService.getAbsences(Number(cId));
    setCoachAbsences(updated);
    setIsAddAbsenceOpen(false);
  };

  // Handle deleting coach absence
  const handleDeleteAbsence = (absenceId: string) => {
    if (!window.confirm("هل أنت متأكد من إلغاء قيد هذا الغياب؟")) return;
    const cId = coachProfile?.coach_id || user?.coach_id || 1;
    coachAbsenceService.deleteAbsence(Number(cId), absenceId);
    const updated = coachAbsenceService.getAbsences(Number(cId));
    setCoachAbsences(updated);
  };

  // Handle adding new match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchForm.opponent) {
      alert("يرجى كتابة اسم الفريق الخصم");
      return;
    }
    setIsSavingMatch(true);
    try {
      const coachCat = coachProfile?.category || user?.category || 'الفريق الأول';
      const cId = coachProfile?.coach_id || user?.coach_id;
      const primaryTeam = assignedTeams.length > 0 ? assignedTeams[0].team_id : null;

      const payload = {
        match_date: newMatchForm.match_date,
        time: newMatchForm.time,
        home_team: settings?.name || "أكاديمية أجيال وادي العثمانية",
        away_team: newMatchForm.opponent,
        stadium: newMatchForm.stadium,
        category: coachCat,
        coach_name: coachProfile?.name || user?.name || "كوتش",
        coach_id: cId ? Number(cId) : null,
        team_id: primaryTeam ? Number(primaryTeam) : null,
        match_type: newMatchForm.match_type,
        competition: newMatchForm.match_type === 'official' ? 'البطولة الولائية الرسمية' : newMatchForm.match_type === 'cup' ? 'كأس الرابطة' : 'مباراة ودية تحضيرية',
        score: "- - -",
        status: "قادمة",
        notes: newMatchForm.notes
      };

      await api.addEMSMatch(payload);
      setIsAddMatchOpen(false);
      setNewMatchForm({
        match_date: new Date().toISOString().split('T')[0],
        time: "15:00",
        opponent: "",
        stadium: "الملعب البلدي - وادي العثمانية",
        match_type: "official",
        notes: ""
      });
      await loadData();
      alert("تمت برمجة المباراة بنجاح!");
    } catch (err: any) {
      console.error("Match create failed:", err);
      alert("حدث خطأ أثناء إضافة المباراة: " + (err.message || ''));
    } finally {
      setIsSavingMatch(false);
    }
  };

  // Open Convocation Modal for Match
  const handleOpenConvocation = async (match: any) => {
    setSelectedMatch(match);
    const mId = match.match_id || match.id;
    try {
      const existingSquad = await api.getMatchSheetPlayers(Number(mId));

      // Merge with coach's squad players
      const squadMap = new Map();
      (existingSquad || []).forEach((item: any) => {
        squadMap.set(Number(item.player_id), item);
      });

      const initialSquad = players.map(p => {
        const found = squadMap.get(Number(p.player_id));
        return {
          player_id: p.player_id,
          name: p.name,
          photo_url: p.photo_url,
          position: found?.position || p.position || 'وسط',
          jersey_number: found?.jersey_number ?? (p.jersey_number || 0),
          is_starting: found ? !!found.is_starting : false,
          is_substitute: found ? !!found.is_substitute : false,
          isSelected: !!found
        };
      });

      setConvocationSquad(initialSquad);
      setIsConvocationOpen(true);
    } catch (e) {
      console.error("Failed to load convocation squad:", e);
      alert("فشل تحميل قائمة الاستدعاءات.");
    }
  };

  // Toggle Convocation Status
  const handleTogglePlayerSquadRole = (playerId: number, role: 'starter' | 'bench' | 'none') => {
    setConvocationSquad(prev => prev.map(item => {
      if (item.player_id === playerId) {
        if (role === 'starter') {
          return { ...item, is_starting: true, is_substitute: false, isSelected: true };
        } else if (role === 'bench') {
          return { ...item, is_starting: false, is_substitute: true, isSelected: true };
        } else {
          return { ...item, is_starting: false, is_substitute: false, isSelected: false };
        }
      }
      return item;
    }));
  };

  // Save Convocation
  const handleSaveConvocation = async () => {
    if (!selectedMatch) return;
    const mId = selectedMatch.match_id || selectedMatch.id;
    setIsSavingSquad(true);

    try {
      const selectedOnly = convocationSquad
        .filter(item => item.isSelected)
        .map(item => ({
          match_id: Number(mId),
          player_id: item.player_id,
          jersey_number: Number(item.jersey_number) || 0,
          position: item.position || 'وسط',
          is_starting: !!item.is_starting,
          is_substitute: !!item.is_substitute
        }));

      await api.saveMatchSheetPlayers(Number(mId), selectedOnly);
      setIsConvocationOpen(false);
      await loadData();
      alert(`تم بنجاح حفظ استدعاء ${selectedOnly.length} لاعب للمباراة!`);
    } catch (e: any) {
      console.error("Save convocation error:", e);
      alert("فشل حفظ الاستدعاءات: " + (e.message || ''));
    } finally {
      setIsSavingSquad(false);
    }
  };

  // WhatsApp Convocation Announcement Generator
  const handleSendWhatsAppConvocation = () => {
    if (!selectedMatch) return;
    const starters = convocationSquad.filter(p => p.is_starting);
    const bench = convocationSquad.filter(p => p.is_substitute);

    const matchDate = selectedMatch.match_date || selectedMatch.date;
    const opponent = selectedMatch.away_team || selectedMatch.opponent || 'الخصم';
    const venue = selectedMatch.stadium || 'الملعب البلدي';
    const category = coachProfile?.category || user?.category || 'الفريق الأول';

    let msg = `🟢 *استدعاء رسمي للمباراة - أكاديمية أجيال وادي العثمانية*\n`;
    msg += `⚽ *الفئة:* ${category}\n`;
    msg += `🏆 *المقابلة:* ضد *${opponent}*\n`;
    msg += `📅 *الموعد:* ${matchDate} على الساعة ${selectedMatch.time || '15:00'}\n`;
    msg += `📍 *المكان:* ${venue}\n`;
    msg += `👤 *المدرب المسؤول:* ${coachProfile?.name || 'كوتش الأكاديمية'}\n\n`;

    msg += `📋 *التشكيلة الأساسية (11 لاعباً):*\n`;
    starters.forEach((p, idx) => {
      msg += `${idx + 1}. #${p.jersey_number || '-'} ${p.name} (${p.position})\n`;
    });

    if (bench.length > 0) {
      msg += `\n🔄 *دكة الاحتياط (${bench.length} لاعبين):*\n`;
      bench.forEach((p, idx) => {
        msg += `${idx + 1}. #${p.jersey_number || '-'} ${p.name} (${p.position})\n`;
      });
    }

    msg += `\n⚠️ *تنبيه مهم:* يرجى الحضور قبل الموعد بـ 45 دقيقة مع الزي الرسمي والحذاء المناسب وبطاقة اللاعب.`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Open Match Sheet & Ratings
  const handleOpenMatchSheet = async (match: any) => {
    setSelectedMatch(match);
    setMatchScoreInput(match.score || "");
    const mId = match.match_id || match.id;
    try {
      const [squad, events, allStats] = await Promise.all([
        api.getMatchSheetPlayers(Number(mId)).catch(() => []),
        api.getMatchEvents(Number(mId)).catch(() => []),
        api.getPlayerStats().catch(() => [])
      ]);

      setConvocationSquad(squad || []);
      setMatchSheetEvents(events || []);

      // Build existing ratings map from player_stats for this match
      const ratingsMap: Record<number, any> = {};
      (squad || []).forEach((sp: any) => {
        const foundStat = (allStats || []).find((st: any) =>
          Number(st.match_id) === Number(mId) && Number(st.player_id) === Number(sp.player_id)
        );

        ratingsMap[Number(sp.player_id)] = {
          rating: foundStat ? Number(foundStat.rating) || 7.0 : 7.0,
          minutes: foundStat ? Number(foundStat.minutes_played) || (sp.is_starting ? 90 : 25) : (sp.is_starting ? 90 : 25),
          goals: foundStat ? Number(foundStat.goals) || 0 : 0,
          assists: foundStat ? Number(foundStat.assists) || 0 : 0,
          notes: foundStat?.notes || '',
          saved: !!foundStat
        };
      });

      setPlayerRatings(ratingsMap);
      setIsMatchSheetOpen(true);
    } catch (e) {
      console.error("Match sheet load error:", e);
      alert("فشل تحميل ورقة اللقاء.");
    }
  };

  // Update Score in Match Sheet
  const handleSaveScore = async () => {
    if (!selectedMatch) return;
    const mId = selectedMatch.match_id || selectedMatch.id;
    try {
      await api.updateEMSMatch(Number(mId), {
        score: matchScoreInput,
        status: 'مكتملة',
        result: 'تمت المقابلة'
      });
      await loadData();
      alert("تم تحديث نتيجة المباراة بنجاح!");
    } catch (e: any) {
      console.error("Score update failed:", e);
      alert("فشل تحديث النتيجة: " + (e.message || ''));
    }
  };

  // Add Match Event
  const handleAddMatchEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    const mId = selectedMatch.match_id || selectedMatch.id;
    setIsSavingEvent(true);
    try {
      await api.addMatchEvent({
        match_id: Number(mId),
        player_id: newEventForm.player_id ? Number(newEventForm.player_id) : null,
        event_type: newEventForm.event_type,
        minute: Number(newEventForm.minute) || 0,
        notes: newEventForm.notes
      });
      const updatedEvents = await api.getMatchEvents(Number(mId));
      setMatchSheetEvents(updatedEvents || []);
      setNewEventForm({ player_id: "", event_type: "goal", minute: "15", notes: "" });
    } catch (err: any) {
      console.error("Failed to add event:", err);
      alert("فشل تسجيل الحدث: " + (err.message || ''));
    } finally {
      setIsSavingEvent(false);
    }
  };

  // Delete Match Event
  const handleDeleteMatchEvent = async (id: number) => {
    if (!selectedMatch) return;
    const mId = selectedMatch.match_id || selectedMatch.id;
    try {
      await api.deleteMatchEvent(id);
      const updatedEvents = await api.getMatchEvents(Number(mId));
      setMatchSheetEvents(updatedEvents || []);
    } catch (e: any) {
      console.error("Delete event failed:", e);
    }
  };

  // Save Player Rating & In-Match Performance
  const handleSaveSinglePlayerRating = async (playerId: number) => {
    if (!selectedMatch) return;
    const mId = selectedMatch.match_id || selectedMatch.id;
    const current = playerRatings[playerId];
    if (!current) return;

    try {
      const payload = {
        player_id: Number(playerId),
        match_id: Number(mId),
        rating: Number(current.rating) || 7.0,
        minutes_played: Number(current.minutes) || 0,
        goals: Number(current.goals) || 0,
        assists: Number(current.assists) || 0,
        notes: current.notes || ''
      };

      // Check if stat row already exists
      const { data: existing } = await supabase
        .from('player_stats')
        .select('stat_id')
        .eq('match_id', Number(mId))
        .eq('player_id', Number(playerId))
        .maybeSingle();

      if (existing) {
        await supabase.from('player_stats').update(payload).eq('stat_id', existing.stat_id);
      } else {
        await supabase.from('player_stats').insert([payload]);
      }

      setPlayerRatings(prev => ({
        ...prev,
        [playerId]: { ...prev[playerId], saved: true }
      }));
      alert("تم حفظ التقييم الفني للاعب بنجاح!");
    } catch (e: any) {
      console.error("Save rating failed:", e);
      alert("فشل حفظ التقييم: " + (e.message || ''));
    }
  };

  // Save All Ratings
  const handleSaveAllRatings = async () => {
    if (!selectedMatch) return;
    const mId = selectedMatch.match_id || selectedMatch.id;
    setIsSavingRatings(true);
    try {
      for (const [pIdStr, data] of Object.entries(playerRatings)) {
        const pId = Number(pIdStr);
        const payload = {
          player_id: pId,
          match_id: Number(mId),
          rating: Number(data.rating) || 7.0,
          minutes_played: Number(data.minutes) || 0,
          goals: Number(data.goals) || 0,
          assists: Number(data.assists) || 0,
          notes: data.notes || ''
        };

        const { data: existing } = await supabase
          .from('player_stats')
          .select('stat_id')
          .eq('match_id', Number(mId))
          .eq('player_id', pId)
          .maybeSingle();

        if (existing) {
          await supabase.from('player_stats').update(payload).eq('stat_id', existing.stat_id);
        } else {
          await supabase.from('player_stats').insert([payload]);
        }
      }

      setPlayerRatings(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[Number(k)] = { ...next[Number(k)], saved: true };
        });
        return next;
      });

      alert("تم بنجاح حفظ تقييمات جميع اللاعبين في المباراة!");
    } catch (e: any) {
      console.error("Save all ratings error:", e);
      alert("حدث خطأ أثناء حفظ التقييمات: " + (e.message || ''));
    } finally {
      setIsSavingRatings(false);
    }
  };

  // Print Match Sheet Preparation
  const handlePrintOfficialMatchSheet = async (match: any) => {
    const mId = match.match_id || match.id;
    try {
      const [squad, events] = await Promise.all([
        api.getMatchSheetPlayers(Number(mId)).catch(() => []),
        api.getMatchEvents(Number(mId)).catch(() => [])
      ]);

      const starters = (squad || []).filter((s: any) => s.is_starting);
      const subs = (squad || []).filter((s: any) => s.is_substitute);

      setPrintMatchData({
        match,
        starters,
        subs,
        events: events || []
      });
    } catch (e) {
      alert("فشل تحضير ورقة اللقاء للطباعة.");
    }
  };

  // Player report print
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

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player);
    setIsPlayerModalOpen(true);
  };

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
                فضاء القيادة الفنية الخاص بفوجك. إدارة اللاعبين، أوراق اللقاءات، استدعاء التشكيلة، وحساب الحصص والغيابات بدقة.
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
          <span className="text-[11px] text-zinc-400 font-bold">لاعبو فوجك الموكل</span>
        </div>

        {/* Trainings this month */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-1 text-center shadow-lg">
          <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Dumbbell className="h-4.5 w-4.5 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-cyan-300">{monthlyStats.trainingCount}</span>
          <span className="text-[11px] text-zinc-400 font-bold">تدريبات الشهر ({selectedMonth})</span>
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

        {/* Coach Absences this month */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-rose-500/30 p-4 rounded-2xl flex flex-col items-center gap-1 text-center shadow-lg">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle className="h-4.5 w-4.5 text-rose-400" />
          </div>
          <span className="text-2xl font-black text-rose-300">
            {monthlyStats.absencesCount}
            <span className="text-xs text-rose-400/80 font-normal mr-1">
              (-{monthlyStats.deductedAmount.toLocaleString()} دج)
            </span>
          </span>
          <span className="text-[11px] text-rose-400/90 font-bold">غيابات المدرب المخصومة</span>
        </div>

        {/* Accrued net earnings */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-zinc-900 to-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl flex flex-col items-center gap-1 text-center shadow-lg">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <span className="text-xl font-black text-emerald-400">
            {monthlyStats.monthlyAmount.toLocaleString()} دج
          </span>
          <span className="text-[11px] text-zinc-400 font-bold">صافي المستحق ({monthlyStats.netSessions} حصة)</span>
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
        {bagSearch.trim() && bagSearchResult && (
          <div className="mt-2 animate-in fade-in duration-200">
            {bagSearchResult.player ? (
              <div
                onClick={() => handlePlayerClick(bagSearchResult.player)}
                className="bg-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:bg-emerald-950/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
                    {bagSearchResult.player.photo_url ? (
                      <img src={bagSearchResult.player.photo_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <User className="h-6 w-6 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      {bagSearchResult.player.name}
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                        حقيبة #{bagSearchResult.bagNumber}
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      الفئة: {bagSearchResult.player.category} • المركز: {bagSearchResult.player.position || 'لاعب'} • حالة العتاد: {bagSearchResult.kitStatus}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-8 px-3">
                  فتح الملف الفني
                </Button>
              </div>
            ) : (
              <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-2xl text-xs text-rose-300 font-bold text-center">
                ❌ لا يوجد لاعب برقم الحقيبة «{bagSearchResult.query}» ضمن لاعبيك في الفئة {coachProfile?.category || user?.category}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4. WORKSPACE TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('players')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${activeTab === 'players'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
        >
          <Users className="h-4 w-4" />
          قائمة لاعبي الفوج ({players.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${activeTab === 'matches'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/40'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
        >
          <Trophy className="h-4 w-4" />
          المباريات وورقة اللقاء ({allCoachMatches.length}) 🏆
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${activeTab === 'sessions'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
        >
          <Activity className="h-4 w-4" />
          الحصص ومستحقات الشهر والغيابات ({monthlyStats.netSessions} حصة) 💰
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${activeTab === 'tools'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
        >
          <Swords className="h-4 w-4" />
          الأدوات البيداغوجية 🛠️
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

      {/* TAB 2: MATCHES, SQUAD CONVOCATIONS & MATCH SHEET (ورقة اللقاء واستدعاء اللاعبين) */}
      {activeTab === 'matches' && (
    <div className="space-y-6">
      {/* Header Action & Metrics */}
      <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-950 p-5 rounded-3xl border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            مركز مباريات فوجك وورقة اللقاء الرسمية
          </span>
          <h3 className="text-xl font-black text-white">
            مباريات فئة {coachProfile?.category || user?.category} ({allCoachMatches.length} مقابلة)
          </h3>
          <p className="text-xs text-zinc-400">
            استدعاء التشكيلة (11 أساسي + 7 احتياط)، توليد ورقة اللقاء الرسمية للطباعة، ورصد تقييم أداء اللاعبين ميدانياً.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddMatchOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs h-11 px-4 rounded-2xl gap-2 shadow-lg shadow-purple-950/50"
          >
            <Plus className="h-4 w-4" />
            برمجة مباراة للفوج
          </Button>
        </div>
      </div>

      {/* Match Cards List */}
      {allCoachMatches.length === 0 ? (
        <div className="py-14 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs space-y-2">
          <Trophy className="h-10 w-10 mx-auto text-zinc-600 mb-1" />
          <p className="font-bold text-sm text-zinc-300">لا توجد مباريات مسجلة لهذا الفوج حتى الآن</p>
          <p className="text-zinc-500">اضغط على زر «برمجة مباراة للفوج» لإضافة لقاء ودي أو رسمي جديد.</p>
          <Button
            onClick={() => setIsAddMatchOpen(true)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl mt-2"
          >
            + إضافة أول مباراة
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allCoachMatches.map((m: any) => {
            const mType = m.match_type || 'official';
            const mult = MATCH_MULTIPLIERS[mType] ?? 1.0;
            const opponentName = m.away_team || m.opponent || m.home_team || 'فريق منافس';
            const hasScore = m.score && m.score !== "- - -" && m.score !== "-";

            return (
              <Card
                key={m.match_id || m.id}
                className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 hover:border-purple-500/40 p-4 sm:p-5 rounded-3xl shadow-xl space-y-4 group transition-all"
              >
                {/* Top Row: Type & Date */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${mType === 'official' || mType === 'رسمية'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : mType === 'cup' || mType === 'كأس'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}>
                      {mType === 'official' || mType === 'رسمية' ? 'مباراة رسمية' : mType === 'cup' || mType === 'كأس' ? 'مباراة كأس' : 'مباراة ودية'}
                    </span>
                    <span className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded-md text-[10px] font-mono">
                      +{mult} حصة
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-purple-400" />
                    <span>{m.match_date || m.date}</span>
                    {m.time && <span>• {m.time}</span>}
                  </div>
                </div>

                {/* Middle Row: Match Teams & Score */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex-1 text-right">
                    <span className="text-[11px] text-zinc-500 block">فريق الأكاديمية:</span>
                    <h4 className="text-sm font-black text-white">
                      {settings?.name || "أجيال وادي العثمانية"}
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      فئة {m.category || coachProfile?.category}
                    </span>
                  </div>

                  <div className="bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800 text-center min-w-[70px]">
                    <span className="text-base font-black text-amber-400 font-mono">
                      {hasScore ? m.score : "VS"}
                    </span>
                    <span className="text-[9px] text-zinc-500 block">
                      {hasScore ? "النتيجة" : "لم تلعب"}
                    </span>
                  </div>

                  <div className="flex-1 text-left">
                    <span className="text-[11px] text-zinc-500 block">الخصم المنافس:</span>
                    <h4 className="text-sm font-black text-white">
                      {opponentName}
                    </h4>
                    <span className="text-[10px] text-zinc-400 truncate block">
                      {m.stadium || 'الملعب البلدي'}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons: Convocations, Sheet, Print */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
                  <Button
                    size="sm"
                    onClick={() => handleOpenConvocation(m)}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-purple-300 hover:text-white text-[11px] font-bold h-9 rounded-xl gap-1"
                  >
                    <Users className="h-3.5 w-3.5 text-purple-400" />
                    استدعاء اللاعبين
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleOpenMatchSheet(m)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-9 rounded-xl gap-1 shadow-md shadow-emerald-950/40"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    ورقة اللقاء والتقييم ⭐
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handlePrintOfficialMatchSheet(m)}
                    variant="outline"
                    className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold h-9 rounded-xl gap-1"
                  >
                    <Printer className="h-3.5 w-3.5 text-amber-400" />
                    طباعة A4
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  )
}

{/* TAB 3: SESSIONS, ACCOUNTING & COACH ABSENCES (الحصص ومستحقات الشهر والغيابات) */ }
{
  activeTab === 'sessions' && (
    <div className="space-y-6">
      {/* Month Financial Summary Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-5 sm:p-6 rounded-3xl border border-zinc-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-0.5 rounded-full font-black">
              كشف الحساب الرسمي: شهر {selectedMonth}
            </span>
            <span className="text-xs text-zinc-400">
              سعر الحصة: <b className="text-white font-mono">{monthlyStats.rate} دج</b>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            صافي الحصص المعتمدة: {monthlyStats.netSessions} حصة
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
            <span className="bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
              تدريبات: <b className="text-cyan-400">+{monthlyStats.trainingCount}</b>
            </span>
            <span className="bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
              مباريات ودية (×1): <b className="text-blue-400">+{monthlyStats.friendlyMatches.length}</b>
            </span>
            <span className="bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
              مباريات رسمية (×1.5): <b className="text-amber-400">+{monthlyStats.officialMatches.length * 1.5}</b>
            </span>
            <span className="bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
              مباريات كؤوس (×2): <b className="text-purple-400">+{monthlyStats.cupMatches.length * 2}</b>
            </span>
            <span className="bg-rose-950/40 px-2.5 py-1 rounded-xl border border-rose-500/30 text-rose-300">
              خصم الغيابات: <b className="text-rose-400">-{monthlyStats.absencesCount}</b>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-emerald-950/50 border border-emerald-500/40 px-6 py-3.5 rounded-2xl text-center shadow-lg shadow-emerald-950/30 flex-1 lg:flex-initial">
            <span className="text-[10px] font-bold text-emerald-400 block">صافي المبلغ المستحق</span>
            <span className="text-2xl font-black text-emerald-300 font-mono">
              {monthlyStats.monthlyAmount.toLocaleString()} دج
            </span>
          </div>

          <div className="flex flex-col gap-2 flex-1 lg:flex-initial">
            <Button
              onClick={() => setIsAddAbsenceOpen(true)}
              variant="outline"
              className="border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-bold h-10 px-3.5 rounded-xl gap-1.5"
            >
              <AlertCircle className="h-4 w-4 text-rose-400" />
              تسجيل غياب للمدرب
            </Button>
            <Button
              onClick={() => setIsStatementPrintOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 px-4 rounded-xl gap-1.5 shadow-lg"
            >
              <Printer className="h-4 w-4" />
              طباعة الكشف الرسمي
            </Button>
          </div>
        </div>
      </div>

      {/* Coach Recorded Absences Table */}
      {monthlyStats.monthAbsences.length > 0 && (
        <div className="space-y-3 bg-rose-950/15 border border-rose-500/30 p-4 rounded-3xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              سجل غيابات المدرب لشهر {selectedMonth} (يتم خصمها من صافي المستحقات)
            </h4>
            <span className="text-xs text-rose-400 font-bold font-mono">
              إجمالي الخصم: {monthlyStats.absencesCount} حصة (-{monthlyStats.deductedAmount.toLocaleString()} دج)
            </span>
          </div>

          <div className="bg-zinc-950/80 rounded-2xl border border-rose-500/20 overflow-hidden">
            <table className="w-full text-xs text-right">
              <thead className="bg-rose-950/30 border-b border-rose-500/20 text-rose-300 font-bold">
                <tr>
                  <th className="px-4 py-2.5">تاريخ الغياب</th>
                  <th className="px-4 py-2.5">السبب / الملاحظة</th>
                  <th className="px-4 py-2.5">النوع</th>
                  <th className="px-4 py-2.5 text-center">الحصص المخصومة</th>
                  <th className="px-4 py-2.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {monthlyStats.monthAbsences.map((ab: CoachAbsence) => (
                  <tr key={ab.id} className="hover:bg-rose-950/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-zinc-200">{ab.date}</td>
                    <td className="px-4 py-2.5 text-zinc-300">{ab.reason}</td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {ab.type === 'match' ? 'غياب عن مباراة' : 'غياب عن حصة تدريبية'}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold font-mono text-rose-400">
                      -{ab.deducted_sessions} حصة
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleDeleteAbsence(ab.id)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        title="إلغاء قيد الغياب"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unified Ledger: Chronological Activities Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-zinc-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            دفتر الحصص والأنشطة الميدانية المعتمدة لشهر {selectedMonth} ({monthlyStats.ledgerItems.length} بند)
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            حساب دقيق لكل حصة وكل غياب
          </span>
        </div>

        {monthlyStats.ledgerItems.length === 0 ? (
          <div className="p-8 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
            لا توجد أنشطة تدريبية أو مباريات أو غيابات مسجلة لشهر {selectedMonth}
          </div>
        ) : (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden shadow-lg">
            <table className="w-full text-xs text-right">
              <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-bold">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">نوع النشاط</th>
                  <th className="px-4 py-3">التفاصيل الفنية</th>
                  <th className="px-4 py-3 text-center">المعامل</th>
                  <th className="px-4 py-3 text-center">المستحق / الخصم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {monthlyStats.ledgerItems.map((item: any, idx: number) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-800/30 transition-colors ${item.type === 'absence' ? 'bg-rose-950/10' : item.type === 'match' ? 'bg-purple-950/10' : ''
                      }`}
                  >
                    <td className="px-4 py-3 font-mono text-zinc-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-zinc-200">{item.date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.type === 'training'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : item.type === 'match'
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                        {item.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-medium">
                      {item.details}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-zinc-300">
                      {item.multiplier > 0 ? `+${item.multiplier}` : item.multiplier}
                    </td>
                    <td className={`px-4 py-3 text-center font-mono font-bold ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                      {item.amount >= 0 ? `+${item.amount.toLocaleString()}` : item.amount.toLocaleString()} دج
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-950 border-t border-zinc-800 text-xs font-black">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-zinc-200">
                    صافي الإجمالي المستحق عن شهر {selectedMonth} ({monthlyStats.netSessions} حصة معتمدة بعد خصم الغيابات):
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-emerald-400">
                    {monthlyStats.netSessions} ح
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-emerald-300 text-sm">
                    {monthlyStats.monthlyAmount.toLocaleString()} دج
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

{/* TAB 4: FIELD QUICK TOOLS */ }
{
  activeTab === 'tools' && (
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
        onClick={() => setActiveTab('matches')}
        className="bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/40 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-105 group shadow-lg"
      >
        <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
          <Trophy className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-black text-white">ورقة اللقاء والمباريات 🏆</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">استدعاء وتقييم اللقاء</p>
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
  )
}

{/* ========================================================================= */ }
{/* MODALS & PORTALS                                                         */ }
{/* ========================================================================= */ }

{/* 1. ADD NEW MATCH MODAL */ }
<Modal isOpen={isAddMatchOpen} onClose={() => setIsAddMatchOpen(false)} title="برمجة مباراة جديدة لفوجك" size="md">
  <form onSubmit={handleCreateMatch} className="space-y-4 pt-2 font-tajawal text-right" dir="rtl">
    <div>
      <label className="text-xs font-bold text-zinc-300 block mb-1">الفريق المنافس (الخصم) *</label>
      <input
        type="text"
        required
        value={newMatchForm.opponent}
        onChange={(e) => setNewMatchForm({ ...newMatchForm, opponent: e.target.value })}
        placeholder="مثال: شبيبة تاجنانت / وفاق شلغوم العيد"
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-1">تاريخ المقابلة *</label>
        <input
          type="date"
          required
          value={newMatchForm.match_date}
          onChange={(e) => setNewMatchForm({ ...newMatchForm, match_date: e.target.value })}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-1">توقيت الانطلاق</label>
        <input
          type="time"
          value={newMatchForm.time}
          onChange={(e) => setNewMatchForm({ ...newMatchForm, time: e.target.value })}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-1">نوع اللقاء والمعامل</label>
        <select
          value={newMatchForm.match_type}
          onChange={(e) => setNewMatchForm({ ...newMatchForm, match_type: e.target.value })}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
        >
          <option value="official">مباراة رسمية (1.5 حصة)</option>
          <option value="cup">مباراة كأس (2.0 حصة)</option>
          <option value="friendly">مباراة ودية تحضيرية (1.0 حصة)</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-1">الفئة المكلف بها</label>
        <input
          type="text"
          disabled
          value={`فئة ${coachProfile?.category || user?.category}`}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
        />
      </div>
    </div>

    <div>
      <label className="text-xs font-bold text-zinc-300 block mb-1">الملعب / مكان المقابلة</label>
      <input
        type="text"
        value={newMatchForm.stadium}
        onChange={(e) => setNewMatchForm({ ...newMatchForm, stadium: e.target.value })}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
      />
    </div>

    <div>
      <label className="text-xs font-bold text-zinc-300 block mb-1">ملاحظات فنية أو تعليمات</label>
      <textarea
        rows={2}
        value={newMatchForm.notes}
        onChange={(e) => setNewMatchForm({ ...newMatchForm, notes: e.target.value })}
        placeholder="مثال: ارتداء الزي الأبيض، الاجتماع الفني قبل المقابلة بـ 45 دقيقة..."
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
      />
    </div>

    <div className="flex justify-end gap-2 pt-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsAddMatchOpen(false)}
        className="border-zinc-800 text-zinc-400 text-xs h-10 px-4 rounded-xl"
      >
        إلغاء
      </Button>
      <Button
        type="submit"
        disabled={isSavingMatch}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-10 px-6 rounded-xl"
      >
        {isSavingMatch ? "جاري الحفظ..." : "تأكيد وبرمجة المباراة"}
      </Button>
    </div>
  </form>
</Modal>

{/* 2. SQUAD CONVOCATION MODAL (استدعاء اللاعبين للتشكيلة) */ }
<Modal
  isOpen={isConvocationOpen}
  onClose={() => setIsConvocationOpen(false)}
  title={`استدعاء التشكيلة: ${selectedMatch?.away_team || selectedMatch?.opponent || 'المباراة'}`}
  size="lg"
>
  <div className="space-y-4 pt-2 font-tajawal text-right max-h-[80vh] overflow-y-auto custom-scrollbar pr-1" dir="rtl">
    {/* Top Banner with Stats & WhatsApp */}
    <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-white">
            الأساسيون (11): <b className="text-emerald-400 font-mono">{convocationSquad.filter(p => p.is_starting).length} / 11</b>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-xs font-black text-white">
            الاحتياط (7): <b className="text-blue-400 font-mono">{convocationSquad.filter(p => p.is_substitute).length} / 7</b>
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          إجمالي اللاعبين المستدعين: {convocationSquad.filter(p => p.isSelected).length} من {players.length} لاعب في فوجك
        </p>
      </div>

      <Button
        onClick={handleSendWhatsAppConvocation}
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl h-9 px-3 gap-1.5 shadow-md shadow-emerald-950/40"
      >
        <MessageCircle className="h-4 w-4" />
        إرسال الاستدعاء عبر واتساب
      </Button>
    </div>

    {/* Player Selection List */}
    <div className="space-y-2">
      {convocationSquad.map((player) => (
        <div
          key={player.player_id}
          className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${player.is_starting
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : player.is_substitute
                ? 'bg-blue-950/20 border-blue-500/40'
                : 'bg-zinc-900/40 border-zinc-800/80 opacity-70 hover:opacity-100'
            }`}
        >
          {/* Identity & Current Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
              {player.photo_url ? (
                <img src={player.photo_url} className="h-full w-full object-cover" alt="" />
              ) : (
                <User className="h-5 w-5 text-zinc-600" />
              )}
            </div>
            <div>
              <h5 className="text-xs font-black text-white flex items-center gap-2">
                {player.name}
                {player.is_starting && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    أساسي 🟢
                  </span>
                )}
                {player.is_substitute && (
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                    احتياط 🔵
                  </span>
                )}
              </h5>
              <span className="text-[10px] text-zinc-400">
                المركز المسجل: {player.position}
              </span>
            </div>
          </div>

          {/* Jersey & Custom Position Inputs */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {player.isSelected && (
              <>
                <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-bold">رقم:</span>
                  <input
                    type="number"
                    value={player.jersey_number || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConvocationSquad(prev => prev.map(p =>
                        p.player_id === player.player_id ? { ...p, jersey_number: Number(val) } : p
                      ));
                    }}
                    placeholder="القميص"
                    className="w-12 bg-transparent text-center text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>

                <select
                  value={player.position}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConvocationSquad(prev => prev.map(p =>
                      p.player_id === player.player_id ? { ...p, position: val } : p
                    ));
                  }}
                  className="bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-200 rounded-xl px-2 py-1 focus:outline-none"
                >
                  <option value="حارس مرمى">حارس مرمى</option>
                  <option value="مدافع">مدافع</option>
                  <option value="ظهير أيمن">ظهير أيمن</option>
                  <option value="ظهير أيسر">ظهير أيسر</option>
                  <option value="وسط دفاعي">وسط دفاعي</option>
                  <option value="وسط ميدان">وسط ميدان</option>
                  <option value="وسط هجومي">وسط هجومي</option>
                  <option value="جناح أيمن">جناح أيمن</option>
                  <option value="جناح أيسر">جناح أيسر</option>
                  <option value="مهاجم صريح">مهاجم صريح</option>
                </select>
              </>
            )}

            {/* Toggle Role Buttons */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => handleTogglePlayerSquadRole(player.player_id, 'starter')}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all ${player.is_starting
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                  }`}
              >
                أساسي
              </button>
              <button
                type="button"
                onClick={() => handleTogglePlayerSquadRole(player.player_id, 'bench')}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all ${player.is_substitute
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                  }`}
              >
                احتياط
              </button>
              {player.isSelected && (
                <button
                  type="button"
                  onClick={() => handleTogglePlayerSquadRole(player.player_id, 'none')}
                  className="text-[10px] text-zinc-500 hover:text-rose-400 px-1.5 py-1"
                  title="إلغاء الاستدعاء"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Modal Footer */}
    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
      <span className="text-xs text-zinc-400 font-bold">
        المستدعون: {convocationSquad.filter(p => p.is_starting).length} أساسي • {convocationSquad.filter(p => p.is_substitute).length} احتياط
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setIsConvocationOpen(false)}
          className="border-zinc-800 text-zinc-400 text-xs h-10 px-4 rounded-xl"
        >
          إغلاق
        </Button>
        <Button
          onClick={handleSaveConvocation}
          disabled={isSavingSquad}
          className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs h-10 px-6 rounded-xl shadow-lg"
        >
          {isSavingSquad ? "جاري الحفظ..." : "حفظ قائمة الاستدعاءات"}
        </Button>
      </div>
    </div>
  </div>
</Modal>

{/* 3. MATCH SHEET & PLAYER EVALUATION MODAL (ورقة اللقاء وتقييم أداء اللاعبين) */ }
<Modal
  isOpen={isMatchSheetOpen}
  onClose={() => setIsMatchSheetOpen(false)}
  title={`ورقة اللقاء والتقييم الفني: ${selectedMatch?.away_team || selectedMatch?.opponent || ''}`}
  size="lg"
>
  <div className="space-y-6 pt-2 font-tajawal text-right max-h-[82vh] overflow-y-auto custom-scrollbar pr-1" dir="rtl">
    {/* Match Score Banner */}
    <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-4 sm:p-5 rounded-3xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="space-y-1 text-center sm:text-right">
        <span className="text-xs text-zinc-400">تسجيل وتثبيت النتيجة النهائية:</span>
        <h4 className="text-base font-black text-white">
          {settings?.name || "أجيال وادي العثمانية"} ضد {selectedMatch?.away_team || selectedMatch?.opponent}
        </h4>
        <p className="text-[11px] text-zinc-500">
          {selectedMatch?.match_date} • {selectedMatch?.stadium} • {selectedMatch?.competition || 'مباراة الفوج'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={matchScoreInput}
          onChange={(e) => setMatchScoreInput(e.target.value)}
          placeholder="مثال: 3 - 1"
          className="w-28 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-center text-sm font-black font-mono text-amber-400 focus:outline-none focus:border-amber-500"
        />
        <Button
          size="sm"
          onClick={handleSaveScore}
          className="bg-amber-600 hover:bg-amber-700 text-zinc-950 font-black text-xs h-10 px-4 rounded-xl"
        >
          حفظ النتيجة
        </Button>
      </div>
    </div>

    {/* Match Events Section (أهداف، بطاقات، تبديلات) */}
    <div className="space-y-3 bg-zinc-900/40 p-4 rounded-3xl border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-white flex items-center gap-2">
          <Flag className="h-4 w-4 text-purple-400" />
          وقائع وأحداث المباراة (Match Events)
        </h4>
        <span className="text-[11px] text-zinc-500 font-mono">
          {matchSheetEvents.length} حدث مسجل
        </span>
      </div>

      {/* Add Event Form */}
      <form onSubmit={handleAddMatchEvent} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
        <select
          value={newEventForm.event_type}
          onChange={(e) => setNewEventForm({ ...newEventForm, event_type: e.target.value })}
          className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none"
        >
          <option value="goal">⚽ هدف (Goal)</option>
          <option value="assist">🎯 تمريرة حاسمة (Assist)</option>
          <option value="yellow_card">🟨 بطاقة صفراء</option>
          <option value="red_card">🟥 بطاقة حمراء</option>
          <option value="sub">🔄 تبديل لاعب</option>
        </select>

        <select
          value={newEventForm.player_id}
          onChange={(e) => setNewEventForm({ ...newEventForm, player_id: e.target.value })}
          className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none"
        >
          <option value="">اختر اللاعب المعني...</option>
          {convocationSquad.map((p: any) => (
            <option key={p.player_id} value={p.player_id}>
              #{p.jersey_number || '-'} {p.players?.name || p.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
          <span className="text-[10px] text-zinc-500 font-bold">دقيقة:</span>
          <input
            type="number"
            min="1"
            max="120"
            value={newEventForm.minute}
            onChange={(e) => setNewEventForm({ ...newEventForm, minute: e.target.value })}
            className="w-12 bg-transparent text-center text-xs font-mono text-white focus:outline-none"
          />
        </div>

        <Button
          type="submit"
          disabled={isSavingEvent}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 rounded-xl"
        >
          + تسجيل الحدث
        </Button>
      </form>

      {/* Events Timeline */}
      {matchSheetEvents.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {matchSheetEvents.map((ev: any) => (
            <span
              key={ev.id}
              className="inline-flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-xl text-xs font-bold text-zinc-200"
            >
              <span>
                {ev.event_type === 'goal' ? '⚽ هدف' : ev.event_type === 'assist' ? '🎯 أسيست' : ev.event_type === 'yellow_card' ? '🟨 إنذار' : '🟥 طرد'}
              </span>
              <span className="text-purple-400 font-mono">({ev.minute}')</span>
              <span className="text-white">{ev.players?.name || 'لاعب'}</span>
              <button
                onClick={() => handleDeleteMatchEvent(ev.id)}
                className="text-zinc-600 hover:text-rose-400 mr-1"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>

    {/* PLAYER PERFORMANCE RATINGS & COACH TECHNICAL REMARKS */}
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black text-white flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            تقييم الأداء الفني للاعبي المقابلة (Player In-Match Ratings)
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            تقييم كل لاعب من 1 إلى 10، دقائق اللعب، والملاحظات الفنية للمدرب، تسجل رسمياً في ملف اللاعب.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSaveAllRatings}
          disabled={isSavingRatings}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-9 px-4 rounded-xl gap-1.5 shadow-md shadow-emerald-950/40"
        >
          <Save className="h-3.5 w-3.5" />
          {isSavingRatings ? "جاري الحفظ..." : "حفظ كل التقييمات"}
        </Button>
      </div>

      {convocationSquad.length === 0 ? (
        <div className="p-6 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
          لم يتم استدعاء لاعبين بعد لهذه المباراة. استخدم زر «استدعاء اللاعبين» أولاً.
        </div>
      ) : (
        <div className="space-y-2">
          {convocationSquad.map((sp: any) => {
            const pId = Number(sp.player_id);
            const pName = sp.players?.name || sp.name;
            const current = playerRatings[pId] || { rating: 7.0, minutes: 90, goals: 0, assists: 0, notes: '', saved: false };

            return (
              <div
                key={pId}
                className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-2xl space-y-2.5 hover:border-amber-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="h-7 w-7 rounded-lg bg-zinc-950 border border-zinc-800 font-mono font-bold text-xs text-amber-400 flex items-center justify-center">
                      #{sp.jersey_number || '-'}
                    </span>
                    <div>
                      <h5 className="text-xs font-black text-white flex items-center gap-2">
                        {pName}
                        <span className="text-[10px] text-zinc-400 font-normal">
                          ({sp.position || 'وسط'}) • {sp.is_starting ? 'أساسي' : 'احتياط'}
                        </span>
                        {current.saved && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            تم الحفظ ✓
                          </span>
                        )}
                      </h5>
                    </div>
                  </div>

                  {/* Rating, Minutes & Quick Save */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-[10px] text-zinc-400 font-bold">التقييم:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="10"
                        value={current.rating}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPlayerRatings(prev => ({
                            ...prev,
                            [pId]: { ...prev[pId], rating: val, saved: false }
                          }));
                        }}
                        className="w-12 bg-transparent text-center font-mono font-bold text-amber-400 text-xs focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-600">/10</span>
                    </div>

                    <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[10px] text-zinc-400 font-bold">دقائق:</span>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={current.minutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setPlayerRatings(prev => ({
                            ...prev,
                            [pId]: { ...prev[pId], minutes: val, saved: false }
                          }));
                        }}
                        className="w-12 bg-transparent text-center font-mono font-bold text-cyan-300 text-xs focus:outline-none"
                      />
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSaveSinglePlayerRating(pId)}
                      className="bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white text-[10px] font-bold h-7 px-2.5 rounded-lg transition-colors"
                    >
                      حفظ
                    </Button>
                  </div>
                </div>

                {/* Coach Technical Remarks */}
                <div>
                  <input
                    type="text"
                    value={current.notes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlayerRatings(prev => ({
                        ...prev,
                        [pId]: { ...prev[pId], notes: val, saved: false }
                      }));
                    }}
                    placeholder="ملاحظات المدرب الفنية: (مثال: انضباط تكتيكي عالي، سرعة في استرجاع الكرة، تمريرات دقيقة...)"
                    className="w-full bg-zinc-950 border border-zinc-800/90 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    <div className="flex justify-end pt-2 border-t border-zinc-800">
      <Button
        variant="outline"
        onClick={() => setIsMatchSheetOpen(false)}
        className="border-zinc-800 text-zinc-400 text-xs h-10 px-6 rounded-xl"
      >
        إغلاق ورقة اللقاء
      </Button>
    </div>
  </div>
</Modal>

{/* 4. ADD COACH ABSENCE MODAL */ }
<Modal isOpen={isAddAbsenceOpen} onClose={() => setIsAddAbsenceOpen(false)} title="تسجيل غياب للمدرب (خصم من المستحقات)" size="sm">
  <div className="space-y-4 pt-2 font-tajawal text-right" dir="rtl">
    <div>
      <label className="text-xs font-bold text-zinc-300 block mb-1">تاريخ الغياب *</label>
      <input
        type="date"
        value={absenceForm.date}
        onChange={(e) => setAbsenceForm({ ...absenceForm, date: e.target.value })}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
      />
    </div>

    <div>
      <label className="text-xs font-bold text-zinc-300 block mb-1">نوع الغياب</label>
      <select
        value={absenceForm.type}
        onChange={(e: any) => setAbsenceForm({ ...absenceForm, type: e.target.value })}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
      >
        <option value="training">غياب عن حصة تدريبية</option>
        <option value="match">غياب عن إشراف على مباراة</option>
        <option value="other">غياب آخر</option>
      </select>
    </div>

    <div>
      <label className="text-xs font-bold text-zinc-300 block mb-1">سبب أو عذر الغياب</label>
      <input
        type="text"
        value={absenceForm.reason}
        onChange={(e) => setAbsenceForm({ ...absenceForm, reason: e.target.value })}
        placeholder="مثال: ظرف عائلي طارئ / عذر صحي / التزام دراسي..."
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
      />
    </div>

    <div>
      <label className="text-xs font-bold text-zinc-300 block mb-1">عدد الحصص المخصومة</label>
      <input
        type="number"
        min="1"
        max="5"
        value={absenceForm.deducted_sessions}
        onChange={(e) => setAbsenceForm({ ...absenceForm, deducted_sessions: Number(e.target.value) || 1 })}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
      />
    </div>

    <div className="flex justify-end gap-2 pt-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsAddAbsenceOpen(false)}
        className="border-zinc-800 text-zinc-400 text-xs h-9 px-4 rounded-xl"
      >
        إلغاء
      </Button>
      <Button
        type="button"
        onClick={handleAddAbsence}
        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-5 rounded-xl"
      >
        تأكيد تسجيل الغياب
      </Button>
    </div>
  </div>
</Modal>

{/* 5. OFFICIAL PRINTABLE MATCH SHEET (FEUILLE DE MATCH OFFICIELLE A4) */ }
{
  printMatchData && (
    <PrintPortal
      id="official-match-sheet-portal"
      title={`ورقة المقابلة الرسمية: ${printMatchData.match.away_team || printMatchData.match.opponent || ''}`}
      fileName={`ورقة_لقاء_${(printMatchData.match.away_team || printMatchData.match.opponent || 'مباراة').replace(/\s+/g, '_')}_${printMatchData.match.match_date}`}
      onClose={() => setPrintMatchData(null)}
    >
      <div className="p-8 bg-white text-zinc-900 font-tajawal max-w-4xl mx-auto space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-emerald-800">{settings?.name || "أكاديمية أجيال وادي العثمانية (AGOA)"}</h1>
            <h2 className="text-sm font-bold text-zinc-800">ورقة التحكيم والمقابلة الرسمية (Feuille de Match Officielle)</h2>
            <p className="text-xs text-zinc-500">الموسم الرياضي: {settings?.current_season || '2026/2027'}</p>
          </div>
          <div className="text-left text-xs font-mono text-zinc-700 space-y-0.5">
            <p><span className="font-bold">المسابقة:</span> {printMatchData.match.competition || 'البطولة الرسمية'}</p>
            <p><span className="font-bold">التاريخ:</span> {printMatchData.match.match_date}</p>
            <p><span className="font-bold">الملعب:</span> {printMatchData.match.stadium || 'الملعب البلدي'}</p>
          </div>
        </div>

        {/* Match Teams & Category Overview */}
        <div className="grid grid-cols-3 gap-3 bg-zinc-100 p-4 rounded-xl border border-zinc-300 text-center">
          <div>
            <span className="text-xs text-zinc-500 block">الفريق المضيف</span>
            <span className="text-sm font-black text-zinc-900">{settings?.name || "أجيال وادي العثمانية"}</span>
            <span className="text-[11px] text-emerald-700 block font-bold">فئة {printMatchData.match.category}</span>
          </div>
          <div className="border-x border-zinc-300 flex flex-col items-center justify-center">
            <span className="text-xs text-zinc-500">النتيجة النهائية</span>
            <span className="text-xl font-black font-mono text-zinc-900">{printMatchData.match.score || "- - -"}</span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block">الفريق الضيف</span>
            <span className="text-sm font-black text-zinc-900">{printMatchData.match.away_team || printMatchData.match.opponent}</span>
            <span className="text-[11px] text-zinc-600 block">المدرب: {printMatchData.match.coach_name}</span>
          </div>
        </div>

        {/* Starting XI Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-zinc-800 flex items-center justify-between border-b border-zinc-300 pb-1">
            <span>التشكيلة الأساسية (Starting XI - 11 لاعباً):</span>
            <span className="text-[11px] text-zinc-500 font-normal">عدد المستدعين أساسيين: {printMatchData.starters.length}</span>
          </h3>
          <table className="w-full text-xs text-right border-collapse border border-zinc-300">
            <thead className="bg-zinc-200 font-bold text-zinc-800">
              <tr>
                <th className="border border-zinc-300 px-3 py-1.5 w-12 text-center">رقم</th>
                <th className="border border-zinc-300 px-3 py-1.5">اسم ولقب اللاعب</th>
                <th className="border border-zinc-300 px-3 py-1.5">المركز التكتيكي</th>
                <th className="border border-zinc-300 px-3 py-1.5 text-center">الصفة</th>
                <th className="border border-zinc-300 px-3 py-1.5 text-center">تأشيرة الحكم</th>
              </tr>
            </thead>
            <tbody>
              {printMatchData.starters.map((p: any, idx: number) => (
                <tr key={p.player_id || idx} className="bg-white">
                  <td className="border border-zinc-200 px-2 py-1 text-center font-mono font-bold text-zinc-900">
                    {p.jersey_number || idx + 1}
                  </td>
                  <td className="border border-zinc-200 px-3 py-1 font-bold text-zinc-900">
                    {p.players?.name || p.name}
                  </td>
                  <td className="border border-zinc-200 px-3 py-1 text-zinc-700">
                    {p.position || 'وسط'}
                  </td>
                  <td className="border border-zinc-200 px-3 py-1 text-center font-bold text-emerald-800">
                    {idx === 0 ? 'قائد الفريق (C)' : 'أساسي'}
                  </td>
                  <td className="border border-zinc-200 px-3 py-1 text-center text-zinc-400 font-mono">
                    مؤهل ✓
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Substitutes Bench Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-zinc-800 flex items-center justify-between border-b border-zinc-300 pb-1">
            <span>قائمة الاحتياط (Substitutes Bench - حتى 7 لاعبين):</span>
            <span className="text-[11px] text-zinc-500 font-normal">عدد الاحتياط: {printMatchData.subs.length}</span>
          </h3>
          <table className="w-full text-xs text-right border-collapse border border-zinc-300">
            <thead className="bg-zinc-200 font-bold text-zinc-800">
              <tr>
                <th className="border border-zinc-300 px-3 py-1.5 w-12 text-center">رقم</th>
                <th className="border border-zinc-300 px-3 py-1.5">اسم ولقب اللاعب البديل</th>
                <th className="border border-zinc-300 px-3 py-1.5">المركز التكتيكي</th>
                <th className="border border-zinc-300 px-3 py-1.5 text-center">الصفة</th>
                <th className="border border-zinc-300 px-3 py-1.5 text-center">تأشيرة الحكم</th>
              </tr>
            </thead>
            <tbody>
              {printMatchData.subs.map((p: any, idx: number) => (
                <tr key={p.player_id || idx} className="bg-zinc-50">
                  <td className="border border-zinc-200 px-2 py-1 text-center font-mono font-bold text-zinc-900">
                    {p.jersey_number || idx + 12}
                  </td>
                  <td className="border border-zinc-200 px-3 py-1 font-bold text-zinc-900">
                    {p.players?.name || p.name}
                  </td>
                  <td className="border border-zinc-200 px-3 py-1 text-zinc-700">
                    {p.position || 'احتياط'}
                  </td>
                  <td className="border border-zinc-200 px-3 py-1 text-center font-bold text-blue-800">
                    بديل
                  </td>
                  <td className="border border-zinc-200 px-3 py-1 text-center text-zinc-400 font-mono">
                    مؤهل ✓
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Events Timeline Summary */}
        {printMatchData.events && printMatchData.events.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-black text-zinc-800 border-b border-zinc-300 pb-1">
              سجل الأهداف والإنذارات في المقابلة:
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {printMatchData.events.map((ev: any, idx: number) => (
                <div key={idx} className="border border-zinc-200 p-1.5 rounded bg-zinc-50 flex items-center justify-between">
                  <span className="font-bold">
                    {ev.event_type === 'goal' ? '⚽ هدف' : ev.event_type === 'yellow_card' ? '🟨 إنذار' : '🟥 طرد'} - {ev.players?.name || 'لاعب'}
                  </span>
                  <span className="font-mono text-zinc-600">الدقيقة {ev.minute}'</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Signatures */}
        <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs font-bold text-zinc-800">
          <div>
            <p className="border-b border-zinc-400 pb-1 mb-12">قائد الفريق (Capitaine)</p>
            <span>التوقيع</span>
          </div>
          <div>
            <p className="border-b border-zinc-400 pb-1 mb-12">مدرب الفئة (Entraîneur)</p>
            <span>السيد: {coachProfile?.name}</span>
          </div>
          <div>
            <p className="border-b border-zinc-400 pb-1 mb-12">حكم المقابلة الرئيسي (Arbitre)</p>
            <span>الاسم، التوقيع والختم</span>
          </div>
        </div>
      </div>
    </PrintPortal>
  )
}

{/* 6. PLAYER DETAIL MODAL */ }
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
        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-zinc-950 font-black rounded-2xl h-12 shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2"
      >
        <Sparkles className="h-5 w-5" />
        بطاقة EA FC / FIFA ⭐
      </Button>
      <Button
        onClick={() => {
          setIsPlayerModalOpen(false);
          navigate('/academy/injuries');
        }}
        className="bg-rose-600/90 hover:bg-rose-700 text-white font-black rounded-2xl h-12 shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
      >
        <Stethoscope className="h-5 w-5" />
        المعاينة الطبية 🩺
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

{/* 7. FUT EA SPORTS FC CARD MODAL */ }
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

{/* 8. COACH OFFICIAL MONTHLY STATEMENT PRINT PORTAL */ }
{
  isStatementPrintOpen && coachProfile && (
    <PrintPortal
      id="coach-statement-print"
      title="كشف المستحقات والنشاط الفردي للمدرب"
      fileName={`كشف_مستحقات_${coachProfile.name.replace(/\s+/g, '_')}_${selectedMonth}`}
      onClose={() => setIsStatementPrintOpen(false)}
    >
      <div className="p-8 bg-white text-zinc-900 font-tajawal max-w-4xl mx-auto space-y-6" dir="rtl">
        <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-emerald-800">{settings?.name || "أكاديمية أجيال وادي العثمانية (AGOA)"}</h1>
            <h2 className="text-sm font-bold text-zinc-700">كشف النشاط التدريبي والمستحقات الشهرية للمدرب</h2>
            <p className="text-xs text-zinc-500">موسم {settings?.current_season || '2026 / 2027'}</p>
          </div>
          <div className="text-left text-xs font-mono text-zinc-700 space-y-0.5">
            <p><span className="font-bold">الشهر المرجعي:</span> {selectedMonth}</p>
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

        <div className="grid grid-cols-4 gap-3 text-center text-xs">
          <div className="border border-zinc-300 p-3 rounded-lg">
            <span className="text-zinc-600 block">التدريبات المنجزة</span>
            <span className="font-black text-base text-zinc-900">+{monthlyStats.trainingCount} حصة</span>
          </div>
          <div className="border border-zinc-300 p-3 rounded-lg">
            <span className="text-zinc-600 block">مكافئ المباريات</span>
            <span className="font-black text-base text-zinc-900">
              +{monthlyStats.matchEquiv} حصة ({monthlyStats.matchCount} م)
            </span>
          </div>
          <div className="border border-rose-300 bg-rose-50 p-3 rounded-lg">
            <span className="text-rose-700 block font-bold">غيابات المدرب المخصومة</span>
            <span className="font-black text-base text-rose-700">
              -{monthlyStats.absencesCount} حصة
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg">
            <span className="text-emerald-800 font-bold block">صافي المستحق المالي</span>
            <span className="font-black text-lg text-emerald-800 font-mono">
              {monthlyStats.monthlyAmount.toLocaleString()} دج
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-black text-zinc-800">بيان تفصيلي للحصص والأنشطة والغيابات المنفذة:</h3>
          <table className="w-full text-xs text-right border-collapse border border-zinc-300">
            <thead className="bg-zinc-200 font-bold text-zinc-800">
              <tr>
                <th className="border border-zinc-300 px-3 py-1.5 w-10 text-center">#</th>
                <th className="border border-zinc-300 px-3 py-1.5">التاريخ</th>
                <th className="border border-zinc-300 px-3 py-1.5">النوع</th>
                <th className="border border-zinc-300 px-3 py-1.5">الفئة / التفاصيل الفنية</th>
                <th className="border border-zinc-300 px-3 py-1.5 text-center">المعامل</th>
                <th className="border border-zinc-300 px-3 py-1.5 text-center">القيمة (دج)</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats.ledgerItems.map((item: any, i: number) => (
                <tr key={`item-${i}`} className={item.type === 'absence' ? 'bg-rose-50' : item.type === 'match' ? 'bg-amber-50/40' : 'bg-white'}>
                  <td className="border border-zinc-200 px-2 py-1 text-center font-mono">{i + 1}</td>
                  <td className="border border-zinc-200 px-3 py-1 font-mono">{item.date}</td>
                  <td className="border border-zinc-200 px-3 py-1 font-bold text-zinc-800">{item.title}</td>
                  <td className="border border-zinc-200 px-3 py-1">{item.details}</td>
                  <td className="border border-zinc-200 px-3 py-1 text-center font-mono font-bold">
                    {item.multiplier > 0 ? `+${item.multiplier}` : item.multiplier}
                  </td>
                  <td className={`border border-zinc-200 px-3 py-1 text-center font-mono font-bold ${item.amount >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {item.amount >= 0 ? `+${item.amount.toLocaleString()}` : item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-50 border border-zinc-300 p-3 rounded-lg text-xs leading-relaxed text-zinc-700">
          أنا الموقع أسفله، السيد(ة): <span className="font-black text-zinc-900">{coachProfile.name}</span>،
          أشهد أنني استلمت كامل مستحقاتي المالية الصافية عن شهر <span className="font-bold text-zinc-900">{selectedMonth}</span>
          المقدرة بـ: <span className="font-black text-emerald-800">{monthlyStats.monthlyAmount.toLocaleString()} دج</span>
          (عن صافي {monthlyStats.netSessions} حصة معتمدة بعد خصم الغيابات).
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
  )
}

{/* 9. BATCH REPORTS PRINT PORTAL */ }
{
  batchPrintData && (
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
  )
}

{/* 10. INDIVIDUAL PLAYER PRINT PORTAL */ }
{
  printData && (
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
  )
}
    </div >
  );
}
