import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus, Calendar as CalendarIcon, Clock, MapPin, MessageCircle, User, Users,
  Search, Filter, CheckCircle2, ChevronRight, Eye, Edit, Trash2,
  Award, ClipboardCheck, Sparkles, Activity, Shield, Phone, Layers,
  Dumbbell, Trophy, ChevronDown, ChevronUp, Bell, Check, X, Printer,
  FileDown, RefreshCw, Zap, Send, CheckCircle, ExternalLink, SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PrintPortal } from "@/components/PrintPortal";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { useAcademy } from "@/services/AcademyContext";

export function Training() {
  const { user } = useAuth();
  const { settings } = useAcademy();
  const navigate = useNavigate();
  const canManage = user?.role === 'coach' || user?.role === 'admin';
  const isActualCoach = user?.role === 'coach';

  // Reliable coach ID check
  const coachId = user?.coach_id || (typeof user?.id === 'string' && user.id.startsWith('coach-') ? parseInt(user.id.split('-')[1]) : null);

  // Data states
  const [sessions, setSessions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // View & Filter states
  const [viewType, setViewType] = useState<'coaches' | 'weekly' | 'list'>('weekly');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'today' | 'this_week' | 'next_week' | 'past'>('all');
  const [selectedCoachFilter, setSelectedCoachFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>('all');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [viewingSession, setViewingSession] = useState<any>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<number | string>("");

  // Quick Drill/Objective Presets
  const quickDrillObjectives = [
    "الإحماء والتحضير البدني والحركي ⚡",
    "التمرير القصير، الاستقبال والمساندة ⚽",
    "التمركز التكتيكي والضغط العالي 📋",
    "التسديد وإنهاء الهجمات أمام المرمى 🎯",
    "تنفيذ الكرات الثابتة والركنيات 📐",
    "تمارين رشاقة وسرعة رد الفعل ⚡",
    "مباراة تطبيقية بنظام مصغر (Small-sided) 🏆",
    "تدريب حراس المرمى على التصدي والانطلاق 🧤"
  ];

  // Common Pitches Presets
  const pitchPresets = [
    "الملعب الرئيسي الكبير",
    "الملعب المعشوشب (ملعب 1)",
    "ملعب الفئات الصغرى (ملعب 2)",
    "قاعة تقوية العضلات واللياقة",
    "الملعب المغطى"
  ];

  const themes = [
    { id: 'technical', label: 'تقني (Technical)', color: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', glow: 'shadow-blue-500/10', icon: '⚽' },
    { id: 'tactical', label: 'تكتيكي (Tactical)', color: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', glow: 'shadow-purple-500/10', icon: '📋' },
    { id: 'physical', label: 'بدني (Physical)', color: 'border-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', glow: 'shadow-rose-500/10', icon: '⚡' },
    { id: 'mental', label: 'ذهني (Mental)', color: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', glow: 'shadow-emerald-500/10', icon: '🧠' },
    { id: 'match', label: 'مباراة تطبيقية (Match)', color: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', glow: 'shadow-amber-500/10', icon: '🏆' },
  ];

  const daysOfWeek = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  const getDayName = (dateStr: string) => {
    if (!dateStr) return "---";
    const date = new Date(dateStr);
    const dayIndex = date.getDay(); // 0 is Sunday
    const adjustedIndex = (dayIndex + 1) % 7;
    return daysOfWeek[adjustedIndex];
  };

  const getTheme = (notes: string) => {
    const themeId = notes?.split('|')[0];
    return themes.find(t => t.id === themeId) || themes[0];
  };

  const getRealNotes = (notes: string) => {
    return notes?.split('|')[1] || notes || "";
  };

  const getSessionStatus = (dateStr: string) => {
    if (!dateStr) return 'upcoming';
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'today';
    if (dateStr > today) return 'upcoming';
    return 'past';
  };

  const getDurationText = (start: string, end: string) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours} س و ${mins} د`;
    if (hours > 0) return `${hours} ساعة`;
    return `${mins} دقيقة`;
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    let sessionsData: any[] = [], teamsData: any[] = [], coachesData: any[] = [], categoriesData: any[] = [];

    try { categoriesData = await api.getCategories(); setCategories(categoriesData || []); } catch (e) { console.error('categories:', e); }
    try { teamsData = await api.getTeams(); } catch (e) { console.error('teams:', e); }
    try { sessionsData = await api.getTraining(); } catch (e) { console.error('training:', e); }
    try { coachesData = await api.getCoaches(); setCoaches(coachesData || []); } catch (e) { console.error('coaches:', e); }

    if (user?.role === 'coach' && (coachId || user?.category)) {
      let coachTeams = teamsData.filter(t =>
        (coachId && Number(t.coach_id) === Number(coachId)) ||
        (user.team_id && Number(t.team_id) === Number(user.team_id))
      );
      if (coachTeams.length === 0 && user.category) {
        coachTeams = teamsData.filter(t => t.category === user.category && (!t.coach_id || Number(t.coach_id) === Number(coachId)));
      }
      const coachTeamIds = coachTeams.map(t => Number(t.team_id));

      setSessions((sessionsData || []).filter(s => 
        (coachId && Number(s.coach_id) === Number(coachId)) ||
        (coachTeamIds.length > 0 && s.team_id && coachTeamIds.includes(Number(s.team_id)))
      ));
      setTeams(coachTeams);

      const coachCategories = (categoriesData || []).filter(c =>
        coachTeams.some(ct => ct.category === c.name) ||
        (user.category && c.name === user.category)
      );
      setCategories(coachCategories);
      if (coachId) {
        setSelectedCoachId(String(coachId));
        setSelectedCoachFilter(String(coachId));
      }
    } else {
      setSessions(sessionsData || []);
      setTeams(teamsData || []);
      setCategories(categoriesData || []);
    }
    setIsLoading(false);
  };

  // Helper to reliably find the coach for any session
  const getSessionCoach = (session: any) => {
    if (session.coach_id) {
      const coach = coaches.find(c => Number(c.coach_id) === Number(session.coach_id));
      if (coach) return coach;
    }
    const team = teams.find(t => Number(t.team_id) === Number(session.team_id));
    if (team?.coach_id) {
      const coach = coaches.find(c => Number(c.coach_id) === Number(team.coach_id));
      if (coach) return coach;
    }
    if (team?.category) {
      const coach = coaches.find(c => c.category === team.category);
      if (coach) return coach;
    }
    return null;
  };

  const getCoachName = (sessionOrId: any) => {
    if (typeof sessionOrId === 'object' && sessionOrId !== null) {
      const coach = getSessionCoach(sessionOrId);
      return coach ? coach.name : "المدرب الرئيسي";
    }
    const coach = coaches.find(c => Number(c.coach_id) === Number(sessionOrId));
    return coach ? coach.name : "المدرب الرئيسي";
  };

  const getTeamObj = (id: number) => {
    return teams.find(t => Number(t.team_id) === Number(id));
  };

  const getTeamName = (id: number) => {
    const team = getTeamObj(id);
    return team ? `${team.category} - ${team.team_name}` : "الفوج التدريبي";
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) { setSelectedCoachId(""); return; }

    if (val.startsWith('cat:')) {
      const catName = val.replace('cat:', '');
      const coach = coaches.find(c => c.category === catName);
      setSelectedCoachId(coach?.coach_id || "");
    } else {
      const team = teams.find(t => t.team_id === Number(val));
      if (team?.coach_id) {
        setSelectedCoachId(team.coach_id);
      } else if (team?.category) {
        const coach = coaches.find(c => c.category === team.category);
        setSelectedCoachId(coach?.coach_id || "");
      } else {
        setSelectedCoachId("");
      }
    }
  };

  const handleAddSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const teamVal = formData.get("team_id") as string;

    let teamId: number | null = null;
    if (teamVal && !teamVal.startsWith('cat:')) {
      teamId = Number(teamVal);
    } else if (teamVal?.startsWith('cat:')) {
      const catName = teamVal.replace('cat:', '');
      const firstTeam = teams.find(t => t.category === catName);
      teamId = firstTeam?.team_id || null;
    }

    if (!teamId) {
      alert('يرجى اختيار فوج محدد أو إضافة فوج للفئة المختارة أولاً');
      return;
    }

    const assignedCoachId = Number(formData.get("coach_id")) || (selectedCoachId ? Number(selectedCoachId) : null);

    const sessionData = {
      team_id: teamId,
      coach_id: assignedCoachId,
      date: formData.get("date") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      location: formData.get("location") as string,
      notes: `${formData.get("theme")}|${formData.get("notes")}`,
    };

    try {
      if (editingSession) {
        await api.updateTraining(editingSession.training_id, sessionData);
      } else {
        const newSession = await api.addTraining(sessionData);
        if (newSession && teamId) {
          const team = teams.find(t => t.team_id === teamId);
          const coachName = getCoachName(assignedCoachId);
          const msg = `تذكير بحصة تدريبية:\nتم برمجة حصة تدريبية لفريق ${team?.category || ''} (${team?.team_name || ''}) مع المدرب ${coachName} يوم ${sessionData.date} من الساعة ${sessionData.start_time} إلى ${sessionData.end_time} في ${sessionData.location}.`;
          api.notifyParentsOfTeam(teamId, msg, 'تدريب').catch(console.error);
        }
      }
      await loadData();
      setIsModalOpen(false);
      setEditingSession(null);
      setSelectedCoachId("");
    } catch (error: any) {
      console.error("Failed to save session:", error);
      alert(`خطأ في الحفظ: ${error.message || 'تحقق من البيانات'}`);
    }
  };

  const handleDeleteSession = async (id: number) => {
    setSessionToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      setIsDeleting(true);
      try {
        await api.deleteTraining(sessionToDelete);
        if (viewingSession?.training_id === sessionToDelete) {
          setViewingSession(null);
        }
        await loadData();
        setIsConfirmOpen(false);
      } catch (error: any) {
        console.error("Failed to delete session:", error);
        alert(`❌ خطأ أثناء الحذف: ${error.message || 'حاول مرة أخرى'}`);
      } finally {
        setIsDeleting(false);
        setSessionToDelete(null);
      }
    }
  };

  const handleEditSession = (session: any) => {
    setEditingSession(session);
    const resolvedCoach = getSessionCoach(session);
    setSelectedCoachId(resolvedCoach ? String(resolvedCoach.coach_id) : "");
    setIsModalOpen(true);
  };

  const handleOpenAddSession = (presetCoachId?: number | string) => {
    setEditingSession(null);
    if (presetCoachId) {
      setSelectedCoachId(String(presetCoachId));
    } else {
      setSelectedCoachId(isActualCoach && coachId ? String(coachId) : "");
    }
    setIsModalOpen(true);
  };

  const handleNotifyParents = async (session: any) => {
    try {
      const team = teams.find(t => t.team_id === session.team_id);
      if (!team) return;

      const coach = getSessionCoach(session);
      const duration = getDurationText(session.start_time, session.end_time);
      const academyTitle = settings?.name || "أكاديمية كرة القدم";
      const msg = `📢 *تذكير بحصة تدريبية - ${academyTitle}*\n\n⚽ *الفريق:* ${team.category} (${team.team_name})\n👨‍🏫 *المدرب المشرف:* الكابتن ${coach?.name || 'مدرب الفوج'}\n📅 *اليوم:* ${getDayName(session.date)} (${session.date})\n⏰ *التوقيت:* من ${session.start_time} إلى ${session.end_time} ${duration ? `(${duration})` : ''}\n📍 *المكان:* ${session.location || "الملعب الرئيسي"}\n\nيرجى التواجد بالزي الرياضي الكامل قبل بداية الحصة بـ 15 دقيقة مع إحضار قارورة ماء شخصية. نتمنى لكم حصة موفقة وممتعة! 🌟`;

      // 1. Direct system notification to parents table
      await api.notifyParentsOfTeam(session.team_id, msg, 'تدريب');

      // 2. Open WhatsApp Web / App share option for coach
      const encodedMsg = encodeURIComponent(msg);
      const whatsappUrl = `https://wa.me/?text=${encodedMsg}`;
      window.open(whatsappUrl, '_blank');

      alert("✅ تم إعداد رسالة الواتساب وإرسال التنبيه للأولياء عبر المنصة بنجاح.");
    } catch (error) {
      console.error("Failed to notify parents:", error);
      alert("❌ حدث خطأ أثناء إرسال التنبيهات.");
    }
  };

  // Helper date filters
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered Sessions logic
  const filteredSessions = useMemo(() => {
    const now = new Date();
    // Calculate week range (Sat to Fri in Algeria)
    const dayOfWeek = (now.getDay() + 1) % 7; // 0 for Sat
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfNextWeek = new Date(endOfWeek);
    startOfNextWeek.setDate(endOfWeek.getDate() + 1);
    startOfNextWeek.setHours(0, 0, 0, 0);

    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    return sessions.filter(s => {
      const sDate = s.date ? new Date(s.date) : null;

      // 1. Timeframe Filter
      if (timeframeFilter === 'today') {
        if (s.date !== todayStr) return false;
      } else if (timeframeFilter === 'this_week') {
        if (!sDate || sDate < startOfWeek || sDate > endOfWeek) return false;
      } else if (timeframeFilter === 'next_week') {
        if (!sDate || sDate < startOfNextWeek || sDate > endOfNextWeek) return false;
      } else if (timeframeFilter === 'past') {
        if (!s.date || s.date >= todayStr) return false;
      }

      // 2. Coach Filter
      if (selectedCoachFilter !== 'all') {
        const coach = getSessionCoach(s);
        if (!coach || String(coach.coach_id) !== String(selectedCoachFilter)) {
          return false;
        }
      }

      // 3. Category Filter
      if (selectedCategoryFilter !== 'all') {
        const team = getTeamObj(s.team_id);
        if (team?.category !== selectedCategoryFilter) {
          return false;
        }
      }

      // 4. Theme Filter
      if (selectedThemeFilter !== 'all') {
        const theme = getTheme(s.notes);
        if (theme.id !== selectedThemeFilter) {
          return false;
        }
      }

      // 5. Location Filter
      if (selectedLocationFilter !== 'all') {
        if (s.location !== selectedLocationFilter) return false;
      }

      // 6. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const teamName = getTeamName(s.team_id).toLowerCase();
        const coachName = getCoachName(s).toLowerCase();
        const location = (s.location || "").toLowerCase();
        const notes = (s.notes || "").toLowerCase();
        const date = (s.date || "").toLowerCase();
        if (!teamName.includes(q) && !coachName.includes(q) && !location.includes(q) && !notes.includes(q) && !date.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, teams, coaches, timeframeFilter, selectedCoachFilter, selectedCategoryFilter, selectedThemeFilter, selectedLocationFilter, searchQuery, todayStr]);

  // Unique locations from data
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    sessions.forEach(s => { if (s.location) locs.add(s.location); });
    pitchPresets.forEach(p => locs.add(p));
    return Array.from(locs);
  }, [sessions]);

  // Grouped coaches data for "عرض حسب المدربين"
  const coachGroups = useMemo(() => {
    let targetCoaches = coaches;
    if (selectedCoachFilter !== 'all') {
      targetCoaches = coaches.filter(c => String(c.coach_id) === String(selectedCoachFilter));
    }

    return targetCoaches.map(coach => {
      const coachSessions = filteredSessions.filter(s => {
        const sessionCoach = getSessionCoach(s);
        return sessionCoach && Number(sessionCoach.coach_id) === Number(coach.coach_id);
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const todayCount = coachSessions.filter(s => getSessionStatus(s.date) === 'today').length;
      const upcomingCount = coachSessions.filter(s => getSessionStatus(s.date) === 'upcoming').length;

      return {
        coach,
        sessions: coachSessions,
        totalSessions: coachSessions.length,
        todayCount,
        upcomingCount,
      };
    }).sort((a, b) => b.totalSessions - a.totalSessions);
  }, [coaches, filteredSessions, selectedCoachFilter]);

  // KPI Statistics
  const todaySessions = useMemo(() => {
    return sessions.filter(s => getSessionStatus(s.date) === 'today');
  }, [sessions]);

  const activeCoachesCount = useMemo(() => {
    const activeCoachIds = new Set();
    sessions.forEach(s => {
      const c = getSessionCoach(s);
      if (c?.coach_id) activeCoachIds.add(c.coach_id);
    });
    return activeCoachIds.size;
  }, [sessions, coaches]);

  return (
    <div className="space-y-6 font-tajawal" dir="rtl">
      {/* ─── Top Premium Header Banner ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8 border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-16 w-16 bg-gradient-to-br from-emerald-500/25 via-emerald-600/15 to-teal-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/40 shadow-xl shadow-emerald-950/40 shrink-0">
              <CalendarIcon size={34} className="drop-shadow-md" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  برنامج الحصص والتدريبات
                </h1>
                <span className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-black flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  النظام الفني الميداني
                </span>
              </div>
              <p className="text-zinc-400 mt-1.5 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
                جدولة الحصص الأسبوعية، توزيع الملاعب، متابعة أهداف المدربين البيداغوجية وتنبيه الأولياء فورياً.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Button
              onClick={() => setIsPrintModalOpen(true)}
              variant="outline"
              className="bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-zinc-100 hover:text-white font-black h-11 px-4 rounded-xl shadow-md gap-2 flex-1 sm:flex-initial"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>طباعة البرنامج الأسبوعي A4</span>
            </Button>

            {canManage && (
              <Button
                onClick={() => handleOpenAddSession()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black h-11 px-5 rounded-xl shadow-lg shadow-emerald-950/40 gap-2 flex-1 sm:flex-initial"
              >
                <Plus className="w-4 h-4" />
                <span>برمجة حصة جديدة</span>
              </Button>
            )}

            <Button
              onClick={loadData}
              variant="ghost"
              size="icon"
              title="تحديث البيانات"
              className="h-11 w-11 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-emerald-400")} />
            </Button>
          </div>
        </div>

        {/* Live today bar pill if sessions exist */}
        {todaySessions.length > 0 && (
          <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-black text-emerald-300">
                حصص اليوم المبرمجة ({todaySessions.length} حصص):
              </span>
              <span className="text-zinc-400 hidden sm:inline">
                {todaySessions.map(s => `${getTeamName(s.team_id)} (${s.start_time})`).slice(0, 2).join(' | ')}
                {todaySessions.length > 2 ? ' ...' : ''}
              </span>
            </div>
            <button
              onClick={() => { setTimeframeFilter('today'); setViewType('list'); }}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              عرض حصص اليوم الميدانية <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* ─── KPI Executive Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
          <CardContent className="p-4 sm:p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs text-zinc-400 font-bold">إجمالي الحصص</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{sessions.length}</h3>
              <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">حصة تدريبية مبرمجة</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-inner">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border shadow-lg relative overflow-hidden transition-all group",
          todaySessions.length > 0
            ? "bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-950 border-emerald-500/40"
            : "bg-gradient-to-br from-zinc-900/90 to-zinc-950 border-zinc-800/80"
        )}>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-zinc-400 font-bold">حصص اليوم</p>
                {todaySessions.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{todaySessions.length}</h3>
              <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">
                {todaySessions.length > 0 ? "جاهزة للتحضير والحضور" : "لا توجد حصص اليوم"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs text-zinc-400 font-bold">المدربون المبرمجون</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {activeCoachesCount} <span className="text-xs text-zinc-500 font-normal">من {coaches.length}</span>
              </h3>
              <p className="text-[11px] text-teal-400 font-semibold mt-0.5">طاقم فني نشط ميدانياً</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shadow-inner">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs text-zinc-400 font-bold">الملاعب المستغلة</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{uniqueLocations.length}</h3>
              <p className="text-[11px] text-sky-400 font-semibold mt-0.5">مساحات تدريب معتمدة</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shadow-inner">
              <MapPin className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Control Center: Timeframes, Filters & View Switcher ─────────── */}
      <div className="bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        {/* Row 1: Timeframes & View Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-4">
          {/* Timeframe Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-zinc-400 text-xs font-bold ml-1 hidden sm:inline-flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" /> الفترة:
            </span>
            {[
              { id: 'all', label: 'جميع الحصص' },
              { id: 'today', label: 'حصص اليوم 🟢' },
              { id: 'this_week', label: 'هذا الأسبوع 📅' },
              { id: 'next_week', label: 'الأسبوع القادم ⚡' },
              { id: 'past', label: 'السابقة ⚪' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTimeframeFilter(t.id as any)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                  timeframeFilter === t.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center gap-1 w-full md:w-auto shadow-inner">
            <button
              onClick={() => setViewType('weekly')}
              className={cn(
                "flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                viewType === 'weekly'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>مخطط أسبوعي</span>
            </button>
            <button
              onClick={() => setViewType('coaches')}
              className={cn(
                "flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                viewType === 'coaches'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>حسب المدربين</span>
            </button>
            <button
              onClick={() => setViewType('list')}
              className={cn(
                "flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                viewType === 'list'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>قائمة الحصص</span>
            </button>
          </div>
        </div>

        {/* Row 2: Detailed Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="بحث بالمدرب، الفئة، الملعب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Coach Filter */}
          <div>
            <select
              value={selectedCoachFilter}
              onChange={(e) => setSelectedCoachFilter(e.target.value)}
              disabled={isActualCoach}
              className={cn(
                "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500",
                isActualCoach && "opacity-75 cursor-not-allowed"
              )}
            >
              <option value="all">👨‍🏫 كل المدربين ({coaches.length})</option>
              {coaches.map(c => (
                <option key={c.coach_id} value={String(c.coach_id)}>
                  {c.name} {c.category ? `(${c.category})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">🛡️ كل الفئات والأفواج</option>
              {categories.map(c => (
                <option key={c.category_id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocationFilter}
              onChange={(e) => setSelectedLocationFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">📍 كل الملاعب والمقرات</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs scrollbar-none">
          <span className="text-zinc-500 text-[11px] font-bold ml-1 shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-emerald-400" /> موضوع الحصة:
          </span>
          <button
            onClick={() => setSelectedThemeFilter('all')}
            className={cn(
              "px-3 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer",
              selectedThemeFilter === 'all'
                ? "bg-zinc-100 text-zinc-900 font-black shadow-sm"
                : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            )}
          >
            الكل ({filteredSessions.length})
          </button>
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedThemeFilter(t.id)}
              className={cn(
                "px-3 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                selectedThemeFilter === t.id
                  ? cn(t.badge, "border font-black shadow-sm")
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              )}
            >
              <span>{t.icon}</span>
              <span>{t.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Content Views ───────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-24 text-center space-y-4 bg-zinc-900/30 rounded-3xl border border-zinc-800">
          <div className="h-12 w-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-400 font-bold text-sm">جاري مزامنة وتحميل البرنامج التدريبي...</p>
        </div>
      ) : (
        <>
          {/* VIEW 1: WEEKLY PLANNER GRID (المخطط الأسبوعي التفاعلي) */}
          {viewType === 'weekly' && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3.5">
              {daysOfWeek.map((day) => {
                const daySessions = filteredSessions
                  .filter(s => getDayName(s.date) === day)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));
                const isToday = getDayName(new Date().toISOString()) === day;

                return (
                  <div
                    key={day}
                    className={cn(
                      "flex flex-col rounded-2xl overflow-hidden border transition-all duration-200",
                      isToday
                        ? "bg-zinc-900/80 border-emerald-500/50 shadow-xl shadow-emerald-950/20"
                        : "bg-zinc-900/40 border-zinc-800/80"
                    )}
                  >
                    {/* Day Column Header */}
                    <div
                      className={cn(
                        "p-3.5 text-center border-b transition-all",
                        isToday
                          ? "bg-gradient-to-b from-emerald-500/25 to-emerald-900/10 border-emerald-500/30 text-emerald-400"
                          : "bg-zinc-950/60 border-zinc-800 text-zinc-300"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-sm font-black">{day}</span>
                        {isToday && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold block mt-1",
                        isToday ? "text-emerald-300 font-black" : "text-zinc-500"
                      )}>
                        {daySessions.length} {daySessions.length === 1 ? "حصة" : "حصص"}
                      </span>
                    </div>

                    {/* Day Sessions List */}
                    <div className="p-2.5 flex-1 space-y-2.5 min-h-[140px]">
                      {daySessions.length > 0 ? (
                        daySessions.map(session => {
                          const theme = getTheme(session.notes);
                          const coach = getSessionCoach(session);
                          const duration = getDurationText(session.start_time, session.end_time);
                          const teamObj = getTeamObj(session.team_id);
                          const status = getSessionStatus(session.date);

                          return (
                            <div
                              key={session.training_id}
                              onClick={() => setViewingSession(session)}
                              className={cn(
                                "group p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95 flex flex-col justify-between relative overflow-hidden",
                                theme.bg, theme.color, theme.glow,
                                status === 'today' && "ring-1 ring-emerald-500/40"
                              )}
                            >
                              <div className="space-y-1.5">
                                {/* Theme & Time Header */}
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className={cn("font-bold flex items-center gap-1", theme.text)}>
                                    <span>{theme.icon}</span>
                                    <span>{theme.label.split(' ')[0]}</span>
                                  </span>
                                  <span className="font-mono text-zinc-300 font-bold bg-zinc-950/60 px-1.5 py-0.5 rounded border border-zinc-800/80">
                                    {session.start_time}
                                  </span>
                                </div>

                                {/* Team Name */}
                                <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors line-clamp-1 leading-snug">
                                  {teamObj ? `${teamObj.category} (${teamObj.team_name})` : getTeamName(session.team_id)}
                                </h4>

                                {/* Coach & Pitch details */}
                                <div className="pt-1 border-t border-zinc-800/60 text-[10px] space-y-1">
                                  <div className="flex items-center justify-between text-zinc-300">
                                    <span className="truncate font-semibold flex items-center gap-1">
                                      <User className="w-2.5 h-2.5 text-emerald-400" />
                                      {coach ? coach.name : "المدرب"}
                                    </span>
                                    {duration && <span className="text-zinc-500 font-mono text-[9px]">{duration}</span>}
                                  </div>
                                  <div className="flex items-center gap-1 text-zinc-400 truncate text-[9px]">
                                    <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                    <span className="truncate">{session.location || "الملعب الرئيسي"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Hover Quick Action Bar */}
                              <div className="mt-2.5 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                                  <Eye className="w-2.5 h-2.5" /> تفاصيل
                                </span>
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => navigate('/attendance')}
                                    title="تسجيل الحضور"
                                    className="p-1 rounded bg-teal-500/10 text-teal-300 hover:bg-teal-500/20"
                                  >
                                    <ClipboardCheck className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleNotifyParents(session)}
                                    title="تنبيه بالواتساب"
                                    className="p-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                  >
                                    <Bell className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-28 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/20 flex flex-col items-center justify-center text-zinc-600 gap-1">
                          <CalendarIcon className="w-5 h-5 opacity-40" />
                          <span className="text-[11px] font-medium">راحة</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: COACHES ROSTER VIEW (عرض فضاء المدربين) */}
          {viewType === 'coaches' && (
            <div className="space-y-6">
              {coachGroups.length === 0 ? (
                <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-12 text-center">
                  <User className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-zinc-300">لا يوجد مدربون مطابقون للتصفية</h3>
                  <p className="text-xs text-zinc-500 mt-1">يرجى تعديل معايير البحث أو اختيار جميع المدربين</p>
                </div>
              ) : (
                coachGroups.map(({ coach, sessions: coachSessions, totalSessions, todayCount, upcomingCount }) => (
                  <div
                    key={coach.coach_id}
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl transition-all"
                  >
                    {/* Coach Header Banner */}
                    <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 sm:p-6 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-lg border border-emerald-400/30 shrink-0">
                          {coach.name ? coach.name.substring(0, 2) : "م"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-black text-white">{coach.name}</h3>
                            {coach.category && (
                              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg font-bold">
                                {coach.category}
                              </span>
                            )}
                            {coach.role && (
                              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-lg font-medium">
                                {coach.role}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1.5 flex-wrap">
                            {coach.phone && (
                              <span className="flex items-center gap-1 font-mono text-zinc-300">
                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                {coach.phone}
                              </span>
                            )}
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-200 font-bold">
                              {totalSessions} حصة مسجلة
                            </span>
                            {todayCount > 0 && (
                              <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                {todayCount} اليوم
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            onClick={() => handleOpenAddSession(coach.coach_id)}
                            size="sm"
                            className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold h-9 px-4 rounded-xl gap-1.5 shadow-md shadow-emerald-950"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>برمجة حصة للمدرب</span>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Coach Sessions Grid */}
                    <div className="p-4 sm:p-6">
                      {coachSessions.length === 0 ? (
                        <div className="py-10 text-center bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800">
                          <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                          <p className="text-xs font-bold text-zinc-400">لا توجد حصص تدريبية مجدولة لهذا المدرب حالياً</p>
                          {canManage && (
                            <button
                              onClick={() => handleOpenAddSession(coach.coach_id)}
                              className="text-xs text-emerald-400 hover:underline mt-1 font-bold inline-block cursor-pointer"
                            >
                              + اضغط هنا لبرمجة أول حصة تدريبية
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {coachSessions.map(session => {
                            const theme = getTheme(session.notes);
                            const status = getSessionStatus(session.date);
                            const duration = getDurationText(session.start_time, session.end_time);
                            const teamObj = getTeamObj(session.team_id);

                            return (
                              <div
                                key={session.training_id}
                                className={cn(
                                  "bg-zinc-950/80 border rounded-2xl p-4 sm:p-5 transition-all hover:border-zinc-700 flex flex-col justify-between group relative overflow-hidden shadow-lg",
                                  status === 'today' ? "border-emerald-500/50 shadow-emerald-950/20" : "border-zinc-800/80"
                                )}
                              >
                                {status === 'today' && (
                                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                                )}

                                <div>
                                  {/* Top Row: Theme & Status */}
                                  <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border", theme.badge)}>
                                      <span>{theme.icon}</span>
                                      <span>{theme.label.split(' ')[0]}</span>
                                    </span>

                                    {status === 'today' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        اليوم
                                      </span>
                                    ) : status === 'upcoming' ? (
                                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                        قادمة
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400">
                                        مكتملة
                                      </span>
                                    )}
                                  </div>

                                  {/* Team & Category */}
                                  <h4 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                                    {teamObj ? `${teamObj.category} - ${teamObj.team_name}` : getTeamName(session.team_id)}
                                  </h4>

                                  {/* Details */}
                                  <div className="space-y-2 mt-3.5 text-xs text-zinc-300">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                                      <span className="font-bold">{getDayName(session.date)}</span>
                                      <span className="text-zinc-400 font-mono text-xs">{session.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                                      <span className="font-mono font-bold text-xs">{session.start_time} - {session.end_time}</span>
                                      {duration && (
                                        <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                          {duration}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                                      <span className="truncate text-zinc-300">{session.location || "الملعب الرئيسي"}</span>
                                    </div>
                                  </div>

                                  {getRealNotes(session.notes) && (
                                    <div className="mt-3.5 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/60 text-xs text-zinc-400 line-clamp-2">
                                      💬 {getRealNotes(session.notes)}
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewingSession(session)}
                                    className="h-8 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 px-2.5 gap-1.5 rounded-lg"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>التفاصيل</span>
                                  </Button>

                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate('/attendance')}
                                      className="h-8 text-xs text-teal-400 hover:bg-teal-500/15 px-2.5 gap-1.5 rounded-lg font-bold"
                                    >
                                      <ClipboardCheck className="w-3.5 h-3.5" />
                                      <span>الحضور</span>
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleNotifyParents(session)}
                                      title="تنبيه بالواتساب"
                                      className="h-8 w-8 text-amber-400 hover:bg-amber-400/15 rounded-lg"
                                    >
                                      <Bell className="w-4 h-4" />
                                    </Button>

                                    {canManage && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditSession(session)}
                                          title="تعديل الحصة"
                                          className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/15 rounded-lg"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteSession(session.training_id)}
                                          title="حذف الحصة"
                                          className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/15 rounded-lg"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW 3: TIMELINE / ROSTER LIST VIEW (قائمة الحصص التفصيلية) */}
          {viewType === 'list' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSessions.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
                  <CalendarIcon className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-zinc-300">لا توجد حصص تدريبية مطابقة للتصفية</h3>
                  <p className="text-xs text-zinc-500 mt-1">جرب تغيير شروط البحث أو الضغط على جميع الحصص</p>
                </div>
              ) : (
                filteredSessions.map(session => {
                  const theme = getTheme(session.notes);
                  const coach = getSessionCoach(session);
                  const status = getSessionStatus(session.date);
                  const duration = getDurationText(session.start_time, session.end_time);

                  return (
                    <Card
                      key={session.training_id}
                      className={cn(
                        "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90 transition-all duration-200 border-r-4 flex flex-col justify-between shadow-xl rounded-2xl",
                        theme.color
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border", theme.badge)}>
                            <span>{theme.icon}</span>
                            <span>{theme.label.split(' ')[0]}</span>
                          </div>
                          {status === 'today' ? (
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                              اليوم
                            </span>
                          ) : status === 'upcoming' ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400">
                              قادمة
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-lg">
                              مكتملة
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-white leading-snug">{getTeamName(session.team_id)}</h3>
                        
                        {/* Coach Name Banner */}
                        <div className="mt-2.5 p-2 bg-zinc-950/70 rounded-xl border border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                              {coach ? coach.name.substring(0, 1) : "م"}
                            </div>
                            <span className="font-bold text-zinc-200">{coach ? coach.name : "المدرب المشرف"}</span>
                          </div>
                          {coach?.category && (
                            <span className="text-[10px] text-emerald-400 font-bold">{coach.category}</span>
                          )}
                        </div>

                        <div className="space-y-2 mt-4 text-xs text-zinc-300">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="font-bold">{session.date}</span>
                            <span className="text-[11px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded font-bold">
                              {getDayName(session.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-sky-400 shrink-0" />
                            <span className="font-mono font-bold text-xs">{session.start_time} - {session.end_time}</span>
                            {duration && <span className="text-[10px] text-zinc-500 font-mono">({duration})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                            <span className="truncate text-zinc-400">{session.location || "الملعب الرئيسي"}</span>
                          </div>
                        </div>

                        {getRealNotes(session.notes) && (
                          <div className="mt-3.5 p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60 text-xs text-zinc-400 line-clamp-2">
                            💬 {getRealNotes(session.notes)}
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between pt-3 border-t border-zinc-800/80">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingSession(session)}
                            className="h-8 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 px-2.5 gap-1.5 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>التفاصيل</span>
                          </Button>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate('/attendance')}
                              className="h-8 text-xs text-teal-400 hover:bg-teal-500/15 px-2.5 gap-1 rounded-lg font-bold"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>الحضور</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleNotifyParents(session)}
                              title="تنبيه بالواتساب"
                              className="h-8 w-8 text-amber-400 hover:bg-amber-400/15 rounded-lg"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </Button>
                            {canManage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSession(session)}
                                  className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/15 rounded-lg"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSession(session.training_id)}
                                  className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/15 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ─── Detailed Technical Session Card Modal ───────────────────────── */}
      {viewingSession && (
        <Modal
          isOpen={!!viewingSession}
          onClose={() => setViewingSession(null)}
          title="البطاقة الفنية للحصة التدريبية"
        >
          {(() => {
            const s = viewingSession;
            const theme = getTheme(s.notes);
            const coach = getSessionCoach(s);
            const status = getSessionStatus(s.date);
            const duration = getDurationText(s.start_time, s.end_time);
            const team = getTeamObj(s.team_id);

            return (
              <div className="space-y-5 font-tajawal text-right" dir="rtl">
                {/* Header Banner */}
                <div className={cn("p-4 sm:p-5 rounded-2xl border flex items-center justify-between", theme.bg, theme.color)}>
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl">{theme.icon}</span>
                    <div>
                      <span className={cn("text-xs font-black uppercase tracking-wider block", theme.text)}>
                        {theme.label}
                      </span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {team ? `${team.category} (${team.team_name})` : getTeamName(s.team_id)}
                      </h3>
                    </div>
                  </div>

                  <div>
                    {status === 'today' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        حصة اليوم
                      </span>
                    ) : status === 'upcoming' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        حصة قادمة
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400">
                        حصة مكتملة
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Coach Card */}
                  <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-400" /> المدرب المشرف
                    </p>
                    <p className="text-sm font-black text-white">{coach ? coach.name : "المدرب الرئيسي"}</p>
                    {coach?.category && (
                      <p className="text-xs text-emerald-400 font-bold">{coach.category}</p>
                    )}
                    {coach?.phone && (
                      <a href={`tel:${coach.phone}`} className="text-xs text-zinc-400 hover:text-emerald-400 font-mono flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-zinc-500" /> {coach.phone}
                      </a>
                    )}
                  </div>

                  {/* Timing & Duration */}
                  <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-sky-400" /> التوقيت والمدة
                    </p>
                    <p className="text-sm font-black text-white font-mono">{s.start_time} إلى {s.end_time}</p>
                    {duration && (
                      <p className="text-xs text-sky-400 font-bold">المدة المقررة: {duration}</p>
                    )}
                  </div>

                  {/* Date & Day */}
                  <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-amber-400" /> اليوم والتاريخ
                    </p>
                    <p className="text-sm font-black text-white">{getDayName(s.date)}</p>
                    <p className="text-xs text-zinc-400 font-mono">{s.date}</p>
                  </div>

                  {/* Location */}
                  <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-400" /> الملعب والمقر
                    </p>
                    <p className="text-sm font-black text-white">{s.location || "الملعب الرئيسي"}</p>
                    <p className="text-xs text-zinc-500">حصة تدريبية ميدانية</p>
                  </div>
                </div>

                {/* Pedagogical Objectives & Notes */}
                <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-2">
                  <p className="text-xs font-black text-zinc-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-400" />
                    الأهداف الفنية والملاحظات البيداغوجية للحصة
                  </p>
                  <div className="p-3.5 bg-zinc-950/70 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed min-h-[60px] whitespace-pre-wrap">
                    {getRealNotes(s.notes) || "لا توجد أهداف إضافية مسجلة لهذه الحصة."}
                  </div>
                </div>

                {/* Actions in Modal */}
                <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => { setViewingSession(null); navigate('/attendance'); }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-10 px-4 rounded-xl shadow-md"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>تسجيل حضور اللاعبين</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleNotifyParents(s)}
                      className="border-zinc-700 hover:bg-zinc-800 text-amber-400 text-xs font-bold gap-1.5 h-10 px-3.5 rounded-xl"
                    >
                      <Bell className="w-4 h-4" />
                      <span>واتساب الأولياء</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <Button
                        variant="outline"
                        onClick={() => { const target = s; setViewingSession(null); handleEditSession(target); }}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs h-10 rounded-xl font-bold"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1 text-blue-400" />
                        <span>تعديل</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => setViewingSession(null)}
                      className="text-zinc-400 text-xs h-10 rounded-xl"
                    >
                      إغلاق
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ─── Add/Edit Session Modal with Quick Objectives & Pitch Presets ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSession(null); }}
        title={editingSession ? "تعديل بيانات الحصة التدريبية" : "برمجة حصة تدريبية جديدة"}
      >
        <form onSubmit={handleAddSession} className="space-y-4 font-tajawal text-right" dir="rtl">
          {/* Team / Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">
              الفئة / الفوج المستهدف <span className="text-rose-400">*</span>
            </label>
            <select
              required
              name="team_id"
              defaultValue={editingSession?.team_id}
              onChange={handleTeamChange}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">اختر الفوج أو الفئة...</option>
              {categories.map(cat => (
                <optgroup key={cat.category_id || cat.name} label={cat.name}>
                  <option value={`cat:${cat.name}`}>{cat.name} (كامل الفئة)</option>
                  {teams.filter(t => t.category === cat.name).map(team => (
                    <option key={team.team_id} value={team.team_id}>{team.team_name} ({cat.name})</option>
                  ))}
                </optgroup>
              ))}
              {teams.filter(t => !t.category || !categories.find(c => c.name === t.category)).map(team => (
                <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
              ))}
            </select>
          </div>

          {/* Coach & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">المدرب المشرف</label>
              <select
                name="coach_id"
                disabled={isActualCoach}
                value={selectedCoachId !== "" ? selectedCoachId : (editingSession?.coach_id || "")}
                onChange={(e) => setSelectedCoachId(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none",
                  isActualCoach && "opacity-75 cursor-not-allowed bg-zinc-800/50"
                )}
              >
                <option value="">اختر المدرب المشرف...</option>
                {coaches.map(coach => (
                  <option key={coach.coach_id} value={coach.coach_id}>
                    {coach.name}{coach.category ? ` — (${coach.category})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">نوع وطابع الحصة</label>
              <select
                name="theme"
                defaultValue={getTheme(editingSession?.notes).id}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              >
                {themes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                تاريخ الحصة <span className="text-rose-400">*</span>
              </label>
              <input
                required
                name="date"
                defaultValue={editingSession?.date || new Date().toISOString().split('T')[0]}
                type="date"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                الملعب / المقر التدريبي <span className="text-rose-400">*</span>
              </label>
              <input
                required
                name="location"
                list="pitch-presets"
                defaultValue={editingSession?.location || "الملعب الرئيسي الكبير"}
                type="text"
                placeholder="الملعب الرئيسي، القاعة..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
              <datalist id="pitch-presets">
                {pitchPresets.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">وقت البدء</label>
              <input
                required
                name="start_time"
                defaultValue={editingSession?.start_time || "16:30"}
                type="time"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">وقت الانتهاء</label>
              <input
                required
                name="end_time"
                defaultValue={editingSession?.end_time || "18:00"}
                type="time"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Pedagogical Objectives & Quick Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300">الأهداف الفنية والملاحظات البيداغوجية</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {quickDrillObjectives.slice(0, 4).map(obj => (
                <button
                  key={obj}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("notes-textarea") as HTMLTextAreaElement;
                    if (el) {
                      const cur = el.value.trim();
                      el.value = cur ? `${cur}\n- ${obj}` : `- ${obj}`;
                    }
                  }}
                  className="text-[10px] bg-zinc-800/80 hover:bg-emerald-500/20 hover:text-emerald-300 text-zinc-400 border border-zinc-700/60 rounded-lg px-2.5 py-1 transition-all cursor-pointer"
                >
                  + {obj.split(' ')[0]} {obj.split(' ')[1]}
                </button>
              ))}
            </div>
            <textarea
              id="notes-textarea"
              name="notes"
              rows={3}
              defaultValue={getRealNotes(editingSession?.notes)}
              placeholder="اكتب التمارين والأهداف الفنية المقررة للحصة..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsModalOpen(false); setEditingSession(null); }}
              className="border-zinc-800 text-zinc-400 text-xs rounded-xl h-10 px-4"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-5 shadow-lg shadow-emerald-950/40"
            >
              {editingSession ? "تحديث الحصة" : "برمجة وحفظ الحصة"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Official Printable Timetable Modal (PrintPortal) ─────────────── */}
      {isPrintModalOpen && (
        <PrintPortal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={`البرنامج_الأسبوعي_للتدريبات_${new Date().toISOString().split('T')[0]}`}
          id="weekly-training-schedule"
        >
          <div id="weekly-training-schedule-content" className="p-6 bg-white text-zinc-950 max-w-5xl mx-auto font-tajawal text-right" dir="rtl">
            {/* Header */}
            <div className="border-b-2 border-zinc-900 pb-4 mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-zinc-900">{settings?.name || "أكاديمية وداد أجيال وادي العثمانية"}</h1>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">الإدارة الفنية • البرنامج الأسبوعي العام للتدريبات الميدانية</p>
                <p className="text-xs text-zinc-500 mt-1">تاريخ الإصدار: {new Date().toLocaleDateString('ar-DZ')}</p>
              </div>
              <div className="text-left font-mono text-xs text-zinc-500 border border-zinc-200 p-2 rounded-lg">
                <p className="font-bold text-zinc-900">الموسم الرياضي: {settings?.season || "2026 / 2027"}</p>
                <p>عدد الحصص: {filteredSessions.length}</p>
              </div>
            </div>

            {/* Timetable Matrix */}
            <div className="space-y-4">
              <table className="w-full border-collapse border border-zinc-300 text-xs text-center">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-800 font-black">
                    <th className="p-2.5 border border-zinc-300 w-24">اليوم والتاريخ</th>
                    <th className="p-2.5 border border-zinc-300 w-28">التوقيت</th>
                    <th className="p-2.5 border border-zinc-300">الفئة / الفوج</th>
                    <th className="p-2.5 border border-zinc-300">المدرب المشرف</th>
                    <th className="p-2.5 border border-zinc-300">الملعب والمقر</th>
                    <th className="p-2.5 border border-zinc-300">نوع الحصة والأهداف</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-zinc-500 italic">لا توجد حصص مسجلة في هذا البرنامج</td>
                    </tr>
                  ) : (
                    filteredSessions.map((session, idx) => {
                      const theme = getTheme(session.notes);
                      const coach = getSessionCoach(session);
                      const team = getTeamObj(session.team_id);
                      return (
                        <tr key={session.training_id} className={idx % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                          <td className="p-2 border border-zinc-300 font-bold">
                            <div>{getDayName(session.date)}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{session.date}</div>
                          </td>
                          <td className="p-2 border border-zinc-300 font-mono font-bold text-zinc-900">
                            {session.start_time} - {session.end_time}
                          </td>
                          <td className="p-2 border border-zinc-300 font-bold text-zinc-900">
                            {team ? `${team.category} (${team.team_name})` : getTeamName(session.team_id)}
                          </td>
                          <td className="p-2 border border-zinc-300 font-bold text-emerald-800">
                            {coach ? coach.name : "المدرب الرئيسي"}
                          </td>
                          <td className="p-2 border border-zinc-300 font-medium">
                            {session.location || "الملعب الرئيسي"}
                          </td>
                          <td className="p-2 border border-zinc-300 text-right text-[11px] text-zinc-700">
                            <span className="font-bold text-zinc-900 block">{theme.label.split(' ')[0]}</span>
                            <span className="text-[10px] text-zinc-500">{getRealNotes(session.notes) || "---"}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Footer */}
            <div className="mt-10 pt-6 border-t border-zinc-300 flex justify-between items-center text-xs font-bold text-zinc-700">
              <div className="text-center w-48">
                <p className="mb-8">المدير الفني للأكاديمية</p>
                <div className="border-b border-dashed border-zinc-400 w-32 mx-auto" />
              </div>
              <div className="text-center w-48">
                <p className="mb-8">إدارة الأكاديمية والاعتماد</p>
                <div className="border-b border-dashed border-zinc-400 w-32 mx-auto" />
              </div>
            </div>
          </div>
        </PrintPortal>
      )}

      {/* ─── Confirm Delete Modal ────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="حذف جلسة التدريب"
        message="هل أنت متأكد من حذف هذه الجلسة التدريبية؟ سيتم إزالتها من جدول المدرب وجداول الحضور بشكل نهائي."
      />
    </div>
  );
}
