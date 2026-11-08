import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus, Calendar as CalendarIcon, Clock, MapPin, MessageCircle, User, Users,
  Search, Filter, CheckCircle2, ChevronRight, Eye, Edit, Trash2,
  Award, ClipboardCheck, Sparkles, Activity, Shield, Phone, Layers,
  Dumbbell, Trophy, ChevronDown, ChevronUp, Bell, Check, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";

export function Training() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.role === 'coach' || user?.role === 'admin';
  const isActualCoach = user?.role === 'coach';

  // Data states
  const [sessions, setSessions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // View & Filter states
  const [viewType, setViewType] = useState<'coaches' | 'weekly' | 'list'>('coaches');
  const [selectedCoachFilter, setSelectedCoachFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [viewingSession, setViewingSession] = useState<any>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<number | string>("");

  const themes = [
    { id: 'technical', label: 'تقني (Technical)', color: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '⚽' },
    { id: 'tactical', label: 'تكتيكي (Tactical)', color: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '📋' },
    { id: 'physical', label: 'بدني (Physical)', color: 'border-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: '⚡' },
    { id: 'mental', label: 'ذهني (Mental)', color: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: '🧠' },
    { id: 'match', label: 'مباراة تطبيقية (Match)', color: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '🏆' },
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
    if (hours > 0 && mins > 0) return `${hours} ساعة و ${mins} دقيقة`;
    if (hours > 0) return `${hours} ساعة`;
    return `${mins} دقيقة`;
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    let sessionsData: any[] = [], teamsData: any[] = [], coachesData: any[] = [], categoriesData: any[] = [];

    try { categoriesData = await api.getCategories(); setCategories(categoriesData); } catch (e) { console.error('categories:', e); }
    try { teamsData = await api.getTeams(); } catch (e) { console.error('teams:', e); }
    try { sessionsData = await api.getTraining(); } catch (e) { console.error('training:', e); }
    try { coachesData = await api.getCoaches(); setCoaches(coachesData); } catch (e) { console.error('coaches:', e); }

    if (user?.role === 'coach' && user.coach_id) {
      const coachTeams = teamsData.filter(t =>
        Number(t.coach_id) === Number(user.coach_id) ||
        (user.category && t.category === user.category)
      );
      const coachTeamIds = coachTeams.map(t => Number(t.team_id));

      setSessions(sessionsData.filter(s => coachTeamIds.includes(Number(s.team_id)) || Number(s.coach_id) === Number(user.coach_id)));
      setTeams(coachTeams);

      const coachCategories = categoriesData.filter(c =>
        coachTeams.some(ct => ct.category === c.name) ||
        (user.category && c.name === user.category)
      );
      setCategories(coachCategories);
      setSelectedCoachId(String(user.coach_id));
      setSelectedCoachFilter(String(user.coach_id));
    } else {
      setSessions(sessionsData);
      setTeams(teamsData);
      setCategories(categoriesData);
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
    return team ? `${team.category} - ${team.team_name}` : "الفريق العام";
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
      setSelectedCoachId(isActualCoach ? String(user?.coach_id) : "");
    }
    setIsModalOpen(true);
  };

  const handleNotifyParents = async (session: any) => {
    try {
      const team = teams.find(t => t.team_id === session.team_id);
      if (!team) return;

      const coach = getSessionCoach(session);
      const duration = getDurationText(session.start_time, session.end_time);
      const msg = `تذكير بحصة تدريبية:\n\nالفئة: ${team.category} - ${team.team_name}\nالمدرب المشرف: ${coach?.name || 'مدرب الفئة'}\nاليوم: ${getDayName(session.date)} (${session.date})\nالتوقيت: من ${session.start_time} إلى ${session.end_time} ${duration ? `(${duration})` : ''}\nالمكان: ${session.location}\n\nيرجى من جميع اللاعبين الحضور بالزي الرياضي قبل الموعد بـ 15 دقيقة.`;

      await api.notifyParentsOfTeam(session.team_id, msg, 'تدريب');
      alert("✅ تم إرسال الإشعار والتذكير لجميع أولياء أمور هذا الفريق عبر المنصة بنجاح.");
    } catch (error) {
      console.error("Failed to notify parents:", error);
      alert("❌ حدث خطأ أثناء إرسال التنبيهات.");
    }
  };

  // Filtered Sessions logic
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // 1. Coach Filter
      if (selectedCoachFilter !== 'all') {
        const coach = getSessionCoach(s);
        if (!coach || String(coach.coach_id) !== String(selectedCoachFilter)) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategoryFilter !== 'all') {
        const team = getTeamObj(s.team_id);
        if (team?.category !== selectedCategoryFilter) {
          return false;
        }
      }

      // 3. Theme Filter
      if (selectedThemeFilter !== 'all') {
        const theme = getTheme(s.notes);
        if (theme.id !== selectedThemeFilter) {
          return false;
        }
      }

      // 4. Status Filter
      if (selectedStatusFilter !== 'all') {
        const status = getSessionStatus(s.date);
        if (status !== selectedStatusFilter) {
          return false;
        }
      }

      // 5. Search Query
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
    });
  }, [sessions, teams, coaches, selectedCoachFilter, selectedCategoryFilter, selectedThemeFilter, selectedStatusFilter, searchQuery]);

  // Grouped coaches data for "عرض حسب المدربين"
  const coachGroups = useMemo(() => {
    // If a specific coach filter is chosen, show only that coach, else all
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

  // Overall KPI statistics
  const todaySessionsCount = useMemo(() => {
    return sessions.filter(s => getSessionStatus(s.date) === 'today').length;
  }, [sessions]);

  const activeCoachesCount = useMemo(() => {
    const activeCoachIds = new Set();
    sessions.forEach(s => {
      const c = getSessionCoach(s);
      if (c?.coach_id) activeCoachIds.add(c.coach_id);
    });
    return activeCoachIds.size;
  }, [sessions, coaches, teams]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Top Header Banner ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-950 p-6 rounded-2xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-14 w-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner">
            <CalendarIcon size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">برامج وحصص التدريبات</h1>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                احترافي
              </span>
            </div>
            <p className="text-zinc-400 mt-1 text-xs sm:text-sm font-medium">
              متابعة كل مدرب وحصصه التدريبية، توزيع الملاعب، والأهداف الفنية والبيداغوجية.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto relative z-10">
          {/* View Switchers */}
          <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex gap-1 flex-1 sm:flex-initial shadow-inner">
            <button
              onClick={() => setViewType('coaches')}
              className={cn(
                "flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                viewType === 'coaches'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>حسب المدربين</span>
            </button>
            <button
              onClick={() => setViewType('weekly')}
              className={cn(
                "flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                viewType === 'weekly'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>مخطط أسبوعي</span>
            </button>
            <button
              onClick={() => setViewType('list')}
              className={cn(
                "flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                viewType === 'list'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>قائمة الحصص</span>
            </button>
          </div>

          {canManage && (
            <Button
              onClick={() => handleOpenAddSession()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-10 px-5 rounded-xl shadow-lg shadow-emerald-900/30 flex-1 sm:flex-initial gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>برمجة حصة جديدة</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─── Top KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-zinc-900/50 border-zinc-800/80 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-semibold">إجمالي الحصص المبرمجة</p>
              <h3 className="text-2xl font-black text-white mt-1">{sessions.length}</h3>
              <p className="text-[11px] text-emerald-400 mt-0.5">حصة تدريبية مسجلة</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800/80 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-semibold">المدربون النشطون</p>
              <h3 className="text-2xl font-black text-white mt-1">{activeCoachesCount} <span className="text-xs text-zinc-500 font-normal">من {coaches.length}</span></h3>
              <p className="text-[11px] text-teal-400 mt-0.5">لديهم حصص مجدولة</p>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border shadow-md transition-all", todaySessionsCount > 0 ? "bg-emerald-950/20 border-emerald-500/40" : "bg-zinc-900/50 border-zinc-800/80")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400 font-semibold">حصص اليوم</span>
                {todaySessionsCount > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{todaySessionsCount}</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">{todaySessionsCount > 0 ? "جاهزة للتنفيذ والحضور" : "لا توجد حصص اليوم"}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800/80 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-semibold">الفئات المستفيدة</p>
              <h3 className="text-2xl font-black text-white mt-1">{categories.length}</h3>
              <p className="text-[11px] text-sky-400 mt-0.5">فئات وأفواج تدريبية</p>
            </div>
            <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search & Filters Bar ────────────────────────────────────────── */}
      <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="بحث باسم المدرب، الفئة، الملعب، أو التاريخ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pr-9 pl-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
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
                "w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500",
                isActualCoach && "opacity-75 cursor-not-allowed"
              )}
            >
              <option value="all">👨‍🏫 جميع المدربين ({coaches.length})</option>
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
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">🛡️ جميع الفئات</option>
              {categories.map(c => (
                <option key={c.category_id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">⏱️ كل الأوقات</option>
              <option value="today">🟢 حصص اليوم فقط</option>
              <option value="upcoming">🔵 الحصص القادمة</option>
              <option value="past">⚪ الحصص السابقة</option>
            </select>
          </div>
        </div>

        {/* Theme pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
          <span className="text-zinc-500 text-[11px] font-bold ml-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> نوع الحصة:
          </span>
          <button
            onClick={() => setSelectedThemeFilter('all')}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer",
              selectedThemeFilter === 'all'
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            الكل
          </button>
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedThemeFilter(t.id)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer",
                selectedThemeFilter === t.id
                  ? cn(t.badge, "border font-black")
                  : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
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
        <div className="py-24 text-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-400 font-bold text-sm">جاري تحميل برامج وتفاصيل التدريبات...</p>
        </div>
      ) : (
        <>
          {/* VIEW 1: BY COACH VIEW (عرض حسب المدربين) */}
          {viewType === 'coaches' && (
            <div className="space-y-6">
              {coachGroups.length === 0 ? (
                <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-12 text-center">
                  <User className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-zinc-300">لا يوجد مدربون مطابقون للتصفية</h3>
                  <p className="text-xs text-zinc-500 mt-1">يرجى تعديل معايير البحث أو اختيار جميع المدربين</p>
                </div>
              ) : (
                coachGroups.map(({ coach, sessions: coachSessions, totalSessions, todayCount, upcomingCount }) => (
                  <div
                    key={coach.coach_id}
                    className="bg-zinc-900/40 border border-zinc-800/70 rounded-2xl overflow-hidden shadow-xl"
                  >
                    {/* Coach Header Banner */}
                    <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 sm:p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        {/* Coach Avatar */}
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-md border border-emerald-400/20 shrink-0">
                          {coach.name ? coach.name.substring(0, 2) : "م"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-white">{coach.name}</h3>
                            {coach.category && (
                              <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-bold">
                                {coach.category}
                              </span>
                            )}
                            {coach.role && (
                              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-medium">
                                {coach.role}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                            {coach.phone && (
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                {coach.phone}
                              </span>
                            )}
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-300 font-bold">
                              {totalSessions} حصص تدريبية
                            </span>
                            {todayCount > 0 && (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {todayCount} حصة اليوم
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
                            className="bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white text-xs font-bold transition-all gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>برمجة حصة لهذا المدرب</span>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Coach Sessions Grid */}
                    <div className="p-4 sm:p-5">
                      {coachSessions.length === 0 ? (
                        <div className="py-8 text-center bg-zinc-950/30 rounded-xl border border-dashed border-zinc-800/80">
                          <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-zinc-400">لا توجد حصص تدريبية مجدولة لهذا المدرب حالياً</p>
                          {canManage && (
                            <button
                              onClick={() => handleOpenAddSession(coach.coach_id)}
                              className="text-xs text-emerald-400 hover:underline mt-1 inline-block"
                            >
                              + اضغط هنا لبرمجة أول حصة
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {coachSessions.map(session => {
                            const theme = getTheme(session.notes);
                            const status = getSessionStatus(session.date);
                            const duration = getDurationText(session.start_time, session.end_time);
                            const teamObj = getTeamObj(session.team_id);

                            return (
                              <div
                                key={session.training_id}
                                className={cn(
                                  "bg-zinc-950/70 border rounded-xl p-4 transition-all hover:border-zinc-700 flex flex-col justify-between group relative overflow-hidden",
                                  status === 'today' ? "border-emerald-500/40 shadow-lg shadow-emerald-950/20" : "border-zinc-800/80"
                                )}
                              >
                                {status === 'today' && (
                                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                                )}

                                <div>
                                  {/* Top Row: Theme & Status */}
                                  <div className="flex items-center justify-between gap-2 mb-2.5">
                                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border", theme.badge)}>
                                      <span>{theme.icon}</span>
                                      <span>{theme.label.split(' ')[0]}</span>
                                    </span>

                                    {status === 'today' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        اليوم
                                      </span>
                                    ) : status === 'upcoming' ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                        قادمة
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-500">
                                        مكتملة
                                      </span>
                                    )}
                                  </div>

                                  {/* Target Team & Category */}
                                  <h4 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                                    {teamObj ? `${teamObj.category} - ${teamObj.team_name}` : getTeamName(session.team_id)}
                                  </h4>

                                  {/* Timing and Location */}
                                  <div className="space-y-1.5 mt-3 text-xs text-zinc-300">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span className="font-bold">{getDayName(session.date)}</span>
                                      <span className="text-zinc-500 font-mono text-[11px]">{session.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                      <span className="font-mono text-xs">{session.start_time} - {session.end_time}</span>
                                      {duration && (
                                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                                          {duration}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                      <span className="truncate text-zinc-400">{session.location || "الملعب الرئيسي"}</span>
                                    </div>
                                  </div>

                                  {/* Notes Snippet */}
                                  {getRealNotes(session.notes) && (
                                    <div className="mt-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/50 text-[11px] text-zinc-400 line-clamp-2 italic">
                                      {getRealNotes(session.notes)}
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewingSession(session)}
                                    className="h-7 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 px-2 gap-1"
                                  >
                                    <Eye className="w-3 h-3 text-emerald-400" />
                                    <span>التفاصيل</span>
                                  </Button>

                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate('/attendance')}
                                      title="تسجيل الحضور"
                                      className="h-7 text-xs text-teal-400 hover:bg-teal-500/10 px-2 gap-1"
                                    >
                                      <ClipboardCheck className="w-3.5 h-3.5" />
                                      <span>الحضور</span>
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleNotifyParents(session)}
                                      title="إرسال تنبيه للأولياء"
                                      className="h-7 w-7 text-amber-400 hover:bg-amber-400/10"
                                    >
                                      <Bell className="w-3.5 h-3.5" />
                                    </Button>

                                    {canManage && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditSession(session)}
                                          title="تعديل الحصة"
                                          className="h-7 w-7 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteSession(session.training_id)}
                                          title="حذف الحصة"
                                          className="h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10"
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

          {/* VIEW 2: WEEKLY SCHEDULE VIEW (مخطط أسبوعي) */}
          {viewType === 'weekly' && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {daysOfWeek.map((day) => {
                const daySessions = filteredSessions
                  .filter(s => getDayName(s.date) === day)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));
                const isToday = getDayName(new Date().toISOString()) === day;

                return (
                  <div key={day} className={cn("space-y-2.5 flex flex-col", isToday ? "opacity-100" : "opacity-90")}>
                    {/* Day Header */}
                    <div
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all shadow-sm",
                        isToday
                          ? "bg-gradient-to-b from-emerald-500/20 to-emerald-950/30 border-emerald-500 text-emerald-400"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400"
                      )}
                    >
                      <span className="text-sm font-black block">{day}</span>
                      {isToday ? (
                        <span className="inline-block text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.2 rounded-full mt-1">
                          اليوم
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-bold block mt-0.5">
                          {daySessions.length} حصص
                        </span>
                      )}
                    </div>

                    {/* Day Sessions Column */}
                    <div className="flex-1 space-y-2">
                      {daySessions.length > 0 ? (
                        daySessions.map(session => {
                          const theme = getTheme(session.notes);
                          const coach = getSessionCoach(session);

                          return (
                            <Card
                              key={session.training_id}
                              onClick={() => setViewingSession(session)}
                              className={cn(
                                "relative overflow-hidden cursor-pointer group border-r-4 transition-all hover:scale-[1.02] active:scale-95 shadow-md",
                                theme.bg, theme.color
                              )}
                            >
                              <CardContent className="p-3 space-y-1.5">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className={cn("font-bold flex items-center gap-1", theme.text)}>
                                    <span>{theme.icon}</span>
                                    <span>{theme.label.split(' ')[0]}</span>
                                  </span>
                                  <span className="text-zinc-400 font-mono font-bold">{session.start_time}</span>
                                </div>

                                <h4 className="text-xs font-black text-white leading-tight truncate">
                                  {getTeamName(session.team_id)}
                                </h4>

                                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                                  <span className="flex items-center gap-1 truncate text-emerald-300 font-medium">
                                    <User className="w-2.5 h-2.5" />
                                    {coach ? coach.name : "المدرب"}
                                  </span>
                                  <span className="truncate text-zinc-500 text-[9px]">{session.location}</span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="h-24 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/20 flex flex-col items-center justify-center text-zinc-700">
                          <span className="text-[11px] font-medium">لا توجد حصص</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: LIST VIEW (قائمة الحصص) */}
          {viewType === 'list' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSessions.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                  <CalendarIcon className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-zinc-300">لا توجد حصص تدريبية مطابقة للتصفية</h3>
                  <p className="text-xs text-zinc-500 mt-1">جرب تغيير شروط البحث أو إعادة التعيين</p>
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
                        "bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 transition-all duration-200 border-r-4 flex flex-col justify-between shadow-lg",
                        theme.color
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold border", theme.badge)}>
                            <span>{theme.icon}</span>
                            <span>{theme.label}</span>
                          </div>
                          {status === 'today' ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              اليوم
                            </span>
                          ) : status === 'upcoming' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400">
                              قادمة
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                              مكتملة
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-white leading-snug">{getTeamName(session.team_id)}</h3>
                        
                        {/* Coach Name Banner */}
                        <div className="mt-2.5 p-2 bg-zinc-950/60 rounded-lg border border-zinc-800/60 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                              {coach ? coach.name.substring(0, 1) : "م"}
                            </div>
                            <span className="font-bold text-zinc-200">{coach ? coach.name : "المدرب المشرف"}</span>
                          </div>
                          {coach?.category && (
                            <span className="text-[10px] text-emerald-400 font-semibold">{coach.category}</span>
                          )}
                        </div>

                        <div className="space-y-2 mt-4 text-xs text-zinc-300">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="font-bold">{session.date}</span>
                            <span className="text-xs text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded font-mono">
                              {getDayName(session.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-sky-400 shrink-0" />
                            <span className="font-mono text-xs">{session.start_time} - {session.end_time}</span>
                            {duration && <span className="text-[10px] text-zinc-500 font-mono">({duration})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                            <span className="truncate text-zinc-400">{session.location || "الملعب الرئيسي"}</span>
                          </div>
                        </div>

                        {getRealNotes(session.notes) && (
                          <div className="mt-3 p-2.5 bg-zinc-950/50 rounded-lg border border-zinc-800/50 text-[11px] text-zinc-400 line-clamp-2 italic">
                            {getRealNotes(session.notes)}
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between pt-3 border-t border-zinc-800/70">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingSession(session)}
                            className="h-8 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 px-2 gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>التفاصيل</span>
                          </Button>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate('/attendance')}
                              className="h-8 text-xs text-teal-400 hover:bg-teal-500/10 px-2 gap-1"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>الحضور</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleNotifyParents(session)}
                              title="تنبيه الأولياء"
                              className="h-8 w-8 text-amber-400 hover:bg-amber-400/10"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </Button>
                            {canManage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSession(session)}
                                  className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSession(session.training_id)}
                                  className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10"
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

      {/* ─── Detailed Session View Modal ─────────────────────────────────── */}
      {viewingSession && (
        <Modal
          isOpen={!!viewingSession}
          onClose={() => setViewingSession(null)}
          title="تفاصيل الحصة التدريبية الكاملة"
        >
          {(() => {
            const s = viewingSession;
            const theme = getTheme(s.notes);
            const coach = getSessionCoach(s);
            const status = getSessionStatus(s.date);
            const duration = getDurationText(s.start_time, s.end_time);
            const team = getTeamObj(s.team_id);

            return (
              <div className="space-y-5" dir="rtl">
                {/* Header Banner */}
                <div className={cn("p-4 rounded-xl border flex items-center justify-between", theme.bg, theme.color)}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{theme.icon}</span>
                    <div>
                      <span className={cn("text-xs font-black uppercase tracking-wider block", theme.text)}>
                        نوع الحصة: {theme.label}
                      </span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {team ? `${team.category} - ${team.team_name}` : getTeamName(s.team_id)}
                      </h3>
                    </div>
                  </div>

                  <div>
                    {status === 'today' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        حصة اليوم
                      </span>
                    ) : status === 'upcoming' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
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
                  <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" /> المدرب المشرف
                    </p>
                    <p className="text-sm font-black text-white">{coach ? coach.name : "المدرب الرئيسي للأكاديمية"}</p>
                    {coach?.category && (
                      <p className="text-xs text-emerald-400 font-medium">{coach.category}</p>
                    )}
                    {coach?.phone && (
                      <p className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" /> {coach.phone}
                      </p>
                    )}
                  </div>

                  {/* Timing & Duration */}
                  <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" /> التوقيت والمدة
                    </p>
                    <p className="text-sm font-black text-white font-mono">{s.start_time} إلى {s.end_time}</p>
                    {duration && (
                      <p className="text-xs text-sky-400 font-semibold">المدة التقديرية: {duration}</p>
                    )}
                  </div>

                  {/* Date & Day */}
                  <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-400" /> التاريخ واليوم
                    </p>
                    <p className="text-sm font-black text-white">{getDayName(s.date)}</p>
                    <p className="text-xs text-zinc-400 font-mono">{s.date}</p>
                  </div>

                  {/* Location */}
                  <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> الملعب / مكان الحصة
                    </p>
                    <p className="text-sm font-black text-white">{s.location || "الملعب الرئيسي"}</p>
                    <p className="text-xs text-zinc-500">حصة تدريبية مبرمجة</p>
                  </div>
                </div>

                {/* Pedagogical Notes & Objectives */}
                <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-1.5">
                  <p className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-400" />
                    الأهداف الفنية والملاحظات البيداغوجية
                  </p>
                  <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed min-h-[60px] whitespace-pre-wrap">
                    {getRealNotes(s.notes) || "لا توجد ملاحظات أو تعليمات خاصة لهذه الحصة."}
                  </div>
                </div>

                {/* Action Buttons in Modal */}
                <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => { setViewingSession(null); navigate('/attendance'); }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-9"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>تسجيل حضور اللاعبين</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleNotifyParents(s)}
                      className="border-zinc-700 hover:bg-zinc-800 text-amber-400 text-xs font-bold gap-1.5 h-9"
                    >
                      <Bell className="w-4 h-4" />
                      <span>تنبيه الأولياء</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <Button
                        variant="outline"
                        onClick={() => { const target = s; setViewingSession(null); handleEditSession(target); }}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs h-9"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        <span>تعديل الحصة</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => setViewingSession(null)}
                      className="text-zinc-400 text-xs h-9"
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

      {/* ─── Add/Edit Session Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSession(null); }}
        title={editingSession ? "تعديل بيانات الحصة التدريبية" : "برمجة حصة تدريبية جديدة"}
      >
        <form onSubmit={handleAddSession} className="space-y-4" dir="rtl">
          {/* Team / Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">الفئة / الفوج المستهدف</label>
            <select
              required
              name="team_id"
              defaultValue={editingSession?.team_id}
              onChange={handleTeamChange}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">اختر الفوج أو الفئة</option>
              {categories.map(cat => (
                <optgroup key={cat.category_id || cat.name} label={cat.name}>
                  <option value={`cat:${cat.name}`}>{cat.name} (فئة كاملة)</option>
                  {teams.filter(t => t.category === cat.name).map(team => (
                    <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
                  ))}
                </optgroup>
              ))}
              {teams.filter(t => !t.category || !categories.find(c => c.name === t.category)).map(team => (
                <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
              ))}
            </select>
          </div>

          {/* Coach & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">المدرب المشرف</label>
              <select
                name="coach_id"
                disabled={isActualCoach}
                value={selectedCoachId !== "" ? selectedCoachId : (editingSession?.coach_id || "")}
                onChange={(e) => setSelectedCoachId(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none",
                  isActualCoach && "opacity-75 cursor-not-allowed bg-zinc-800/50"
                )}
              >
                <option value="">اختر المدرب المشرف</option>
                {coaches.map(coach => (
                  <option key={coach.coach_id} value={coach.coach_id}>
                    {coach.name}{coach.category ? ` — (${coach.category})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">نوع الحصة (Theme)</label>
              <select
                name="theme"
                defaultValue={getTheme(editingSession?.notes).id}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">تاريخ الحصة</label>
              <input
                required
                name="date"
                defaultValue={editingSession?.date || new Date().toISOString().split('T')[0]}
                type="date"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">الملعب / مكان التدريب</label>
              <input
                required
                name="location"
                defaultValue={editingSession?.location || "الملعب الرئيسي"}
                type="text"
                placeholder="مثال: الملعب الرئيسي - القاعة 1"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">وقت البدء</label>
              <input
                required
                name="start_time"
                defaultValue={editingSession?.start_time || "16:30"}
                type="time"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">وقت الانتهاء</label>
              <input
                required
                name="end_time"
                defaultValue={editingSession?.end_time || "18:00"}
                type="time"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Pedagogical Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">الأهداف الفنية والملاحظات البيداغوجية</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={getRealNotes(editingSession?.notes)}
              placeholder="اكتب الأهداف الفنية للحصة (مثلاً: التحول السريع، التمرير القصير، اللياقة البدنية...)"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsModalOpen(false); setEditingSession(null); }}
              className="border-zinc-800 text-zinc-400 text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              {editingSession ? "تحديث الحصة" : "برمجة وحفظ الحصة"}
            </Button>
          </div>
        </form>
      </Modal>

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
