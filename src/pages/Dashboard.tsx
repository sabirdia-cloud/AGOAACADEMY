import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Activity, Shield, Trophy, Stethoscope, Star, TrendingUp, Wallet, CheckCircle2, Package,
  Bell, Goal, Medal, ListOrdered, Calendar, UserPlus, ArrowRight, MessageCircle, User,
  Swords, UserCheck, Settings, FileText, BookOpen
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { cn } from "@/lib/utils";
import { MobileHomeDashboard } from "@/components/MobileHomeDashboard";
import { Modal } from "@/components/ui/modal";

// Simple hook to detect if screen is mobile (<= 1024px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    players: 0,
    teams: 0,
    trainings: 0,
    matches: 0,
    injuries: 0,
    subscriptions: 0,
    coaches: 0,
    evaluations: 0,
    totalPaid: 0,
    totalRemaining: 0,
    netBalance: 0,
    lowStockCount: 0,
    mostPresentPlayer: { name: "---", count: 0 },
    pendingRequests: 0
  });
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [leagueTable, setLeagueTable] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'coach') {
      navigate('/academy/notebook', { replace: true });
      return;
    }
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch core data + ULTRA views
      const [
        players, teamsData, trainings, matches, injuries, subscriptions, coachesData, evaluations,
        attendance, categories, payments, finances, inventory, ultraDashboard, scorers, league,
        notifs, academyLB
      ] = await Promise.all([
        api.getPlayers().catch(() => []),
        api.getTeams().catch(() => []),
        api.getTrainings().catch(() => []),
        api.getMatches().catch(() => []),
        api.getInjuries().catch(() => []),
        api.getSubscriptions().catch(() => []),
        api.getCoaches().catch(() => []),
        api.getEvaluations().catch(() => []),
        api.getAttendance().catch(() => []),
        api.getCategories().catch(() => []),
        api.getPayments().catch(() => []),
        api.getFinances().catch(() => []),
        api.getInventory().catch(() => []),
        api.getAcademyDashboard().catch(() => null),
        api.getTopScorers().catch(() => []),
        api.getSeasonLeagueTable().catch(() => []),
        api.getNotifications(user?.role || 'admin', user?.role === 'coach' ? user.coach_id : undefined).catch(() => []),
        api.getAcademyLeaderboard().catch(() => [])
      ]);

      setTeams(teamsData);
      setCoaches(coachesData);
      setTopScorers(scorers.slice(0, 5));
      setLeagueTable(league.slice(0, 5));
      setNotifications(notifs.slice(0, 5));
      setLeaderboard(academyLB.slice(0, 3));

      // Financial Stats Logic
      const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const totalExpected = subscriptions.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
      const totalRemaining = Math.max(0, totalExpected - totalPaid);

      // Attendance Logic
      const attendanceCounts: Record<number, number> = {};
      attendance.filter((a: any) => a.status === 'حاضر').forEach((a: any) => {
        attendanceCounts[a.player_id] = (attendanceCounts[a.player_id] || 0) + 1;
      });

      let topPlayerId = null;
      let maxCount = 0;
      for (const [id, count] of Object.entries(attendanceCounts)) {
        if (count > maxCount) {
          maxCount = count;
          topPlayerId = Number(id);
        }
      }
      const topPlayer = players.find((p: any) => p.player_id === topPlayerId);

      if (user?.role === 'coach' && user.coach_id) {
        // Find assigned teams: by coach_id OR by category
        const coachTeams = teamsData.filter(t =>
          Number(t.coach_id) === Number(user.coach_id) ||
          (user.category && t.category === user.category)
        );
        const coachTeamIds = coachTeams.map(t => Number(t.team_id));
        const coachCategoriesList = coachTeams.map(t => t.category);
        if (user.category) coachCategoriesList.push(user.category);
        const uniqueCoachCats = Array.from(new Set(coachCategoriesList.filter(Boolean)));

        const filteredPlayers = players.filter(p =>
          coachTeamIds.includes(Number(p.team_id)) ||
          (user.category && p.category === user.category)
        );
        const filteredPlayerIds = filteredPlayers.map(p => p.player_id);
        const filteredTrainings = trainings.filter(t => coachTeamIds.includes(Number(t.team_id)));
        const filteredMatches = matches.filter(m =>
          coachTeamIds.includes(Number(m.team_id)) ||
          uniqueCoachCats.includes(m.category)
        );

        setStats({
          ...stats,
          players: filteredPlayers.length,
          teams: coachTeams.length,
          trainings: filteredTrainings.length,
          matches: filteredMatches.length,
          injuries: injuries.filter(i => filteredPlayerIds.includes(i.player_id)).length,
          mostPresentPlayer: topPlayer && filteredPlayerIds.includes(topPlayer.player_id)
            ? { name: topPlayer.name, count: maxCount }
            : { name: "———", count: 0 },
          pendingRequests: players.filter((p: any) => p.status === 'pending').length
        });
        setUpcomingTrainings(filteredTrainings.slice(0, 4));
        setTeams(coachTeams);
      } else {
        const totalIncome = (finances as any[]).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = (finances as any[]).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const netBalance = (totalPaid + totalIncome) - totalExpense;
        const lowStockCount = (inventory as any[]).filter(i => i.remaining_stock <= 5).length;

        // Birthday Logic
        const today = new Date();
        const bdays = players.filter((p: any) => {
          if (!p.birth_date) return false;
          const bDate = new Date(p.birth_date);
          return bDate.getMonth() === today.getMonth() && bDate.getDate() === today.getDate();
        });
        setBirthdays(bdays);

        setStats({
          players: players.filter((p: any) => p.status !== 'pending').length,
          teams: ultraDashboard?.total_teams || teamsData.length,
          trainings: trainings.length,
          matches: matches.length,
          injuries: injuries.length,
          subscriptions: subscriptions.length,
          coaches: ultraDashboard?.total_coaches || coachesData.length,
          evaluations: evaluations.length,
          totalPaid,
          totalRemaining,
          netBalance,
          lowStockCount,
          mostPresentPlayer: topPlayer ? { name: topPlayer.name, count: maxCount } : { name: "---", count: 0 },
          pendingRequests: players.filter((p: any) => p.status === 'pending').length
        });
        setUpcomingTrainings(trainings.slice(0, 4));
      }

      // Charts Processing
      const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
      const weeks = [];
      for (let i = 5; i >= 0; i--) {
        weeks.push({ name: `أسبوع ${6 - i}`, attendance: 85 + Math.floor(Math.random() * 10) });
      }
      setAttendanceTrend(weeks);

      const catStats = categories.map((cat: any, index: number) => {
        const catPlayers = players.filter((p: any) => {
          if (p.category === cat.name) return true;
          if (p.team_id) {
            const team = teamsData.find((t: any) => t.team_id === p.team_id);
            return team && team.category === cat.name;
          }
          return false;
        });
        return {
          name: cat.name,
          value: catPlayers.length,
          color: colors[index % colors.length],
          players: catPlayers
        };
      }).filter((c: any) => c.value > 0);
      setCategoryStats(catStats);

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamName = (id: number) => {
    const team = teams.find(t => t.team_id === id);
    return team ? `${team.category} - ${team.team_name}` : "غير محدد";
  };

  const statCards = [
    { title: "اللاعبين", value: stats.players, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", roles: ['admin', 'coach'] },
    { title: "الفئات والأفواج", value: stats.teams, icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", roles: ['admin', 'coach'] },
    { title: "المباريات", value: stats.matches, icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10", roles: ['admin', 'coach'] },
    { title: "الرصيد", value: `${stats.netBalance.toLocaleString()} دج`, icon: Wallet, color: "text-emerald-400", bg: "bg-emerald-500/10", roles: ['admin'] },
  ].filter(card => user && card.roles.includes(user.role));

  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileHomeDashboard stats={stats} user={user} isLoading={isLoading} />;
  }

  return (
    <div className="space-y-6 pb-10 font-tajawal rtl" dir="rtl">
      {/* Header with ULTRA Design */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/50 p-6 lg:p-10 ultra-glow-blue">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 text-right">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight ultra-gradient-text mb-2">
              إدارة الأكاديمية
            </h1>
            <p className="text-zinc-400 max-w-lg text-lg leading-relaxed">
              {user?.role === 'admin'
                ? `مرحباً بك مجدداً يا ${user.username}. الأكاديمية تسير بشكل ممتاز اليوم.`
                : `أهلاً بك كابتن ${user.username}. فرقك جاهزة للتدريب اليوم.`}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-6 py-3 text-center backdrop-blur-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">لاعبين نشطين</p>
              <p className="text-2xl font-bold text-zinc-50">{stats.players}</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-6 py-3 text-center backdrop-blur-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">طلبات التسجيل</p>
              <p className={cn("text-2xl font-bold transition-all", stats.pendingRequests > 0 ? "text-emerald-500 animate-pulse-soft" : "text-zinc-500")}>
                {stats.pendingRequests}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Hub - Premium Section Arrangement */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { name: "سجل الحضور", Icon: UserCheck, href: "/academy/attendance", color: "text-emerald-400", bg: "bg-emerald-500/10", label: "تحضير اليوم", roles: ['admin', 'coach'] },
          { name: "اللاعبين", Icon: Users, href: "/admin/players", color: "text-blue-400", bg: "bg-blue-500/10", label: "إدارة البيانات", roles: ['admin'] },
          { name: "دفتر المدرب", Icon: BookOpen, href: "/academy/notebook", color: "text-blue-400", bg: "bg-blue-500/10", label: "مذكراتي الرقمية", roles: ['coach'] },
          { name: "المصروفات", Icon: Wallet, href: "/admin/finances", color: "text-rose-400", bg: "bg-rose-500/10", label: "الخزينة", roles: ['admin'] },
          { name: "المباريات", Icon: Swords, href: "/academy/matches", color: "text-amber-400", bg: "bg-amber-500/10", label: "مركز المنافسات", roles: ['admin', 'coach'] },
          { name: "تقييم الأداء", Icon: Star, href: "/academy/evaluations", color: "text-yellow-400", bg: "bg-yellow-500/10", label: "مستوى اللاعبين", roles: ['coach'] },
          { name: "التقارير", Icon: FileText, href: "/admin/reports", color: "text-indigo-400", bg: "bg-indigo-500/10", label: "إحصائيات", roles: ['admin'] },
          { name: "الإعدادات", Icon: Settings, href: "/academy/settings", color: "text-zinc-400", bg: "bg-zinc-500/10", label: "النظام", roles: ['admin'] },
        ].filter(hub => user && hub.roles.includes(user.role)).map((hub, i) => (
          <button
            key={i}
            onClick={() => navigate(hub.href)}
            className="group glass-card p-4 flex flex-col items-center justify-center gap-3 hover:translate-y-[-4px] transition-all duration-300 hover:ultra-glow-blue border-zinc-800/50 shine-effect"
          >
            <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", hub.bg)}>
              <hub.Icon className={cn("h-6 w-6", hub.color)} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">{hub.name}</p>
              <p className="text-[10px] text-zinc-500 font-medium">{hub.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat: any) => (
          <Card key={stat.title} className="glass-card transition-all hover:translate-y-[-2px] duration-300 border-zinc-800/40">
            <CardContent className="p-5 text-right">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  +12%
                </div>
              </div>
              <p className="text-xs font-medium text-zinc-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-black text-zinc-50 tracking-tight">{isLoading ? "..." : stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Main Charts Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Categories Overview */}
          {categoryStats.length > 0 && (
            <Card className="glass-card shadow-xl border-emerald-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" /> إحصائيات الفئات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categoryStats.map((cat: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => { setSelectedCategory(cat); setIsCategoryModalOpen(true); }}
                      className="bg-zinc-900/50 p-4 rounded-xl cursor-pointer hover:bg-zinc-800 transition-all border border-zinc-800/50 hover:border-emerald-500/30 flex flex-col items-center justify-center text-center gap-2 group"
                    >
                       <div className="h-10 w-10 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
                         <Shield className="h-5 w-5" style={{ color: cat.color }} />
                       </div>
                       <h3 className="font-bold text-zinc-300 group-hover:text-emerald-400 transition-colors text-sm">{cat.name}</h3>
                       <span className="text-xl font-black text-white">{cat.value} <span className="text-[10px] text-zinc-500 font-normal">لاعب</span></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" /> مـعدل الحضور والنشاط
              </CardTitle>
              <div className="text-xs bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-400 font-medium">آخر 6 أسابيع</div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[280px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAttend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* League Table Summary */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800/50 mb-4 text-sm">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                  <ListOrdered className="h-4 w-4 text-blue-400" /> ترتيب البطولة
                </CardTitle>
                <ArrowRight className="h-4 w-4 text-zinc-600 cursor-pointer" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-800/30">
                  {leagueTable.length > 0 ? leagueTable.map((team, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-800/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 text-center font-bold ${i === 0 ? 'text-amber-400' : 'text-zinc-500'}`}>{i + 1}</span>
                        <span className="text-sm font-medium text-zinc-300">{team.team_name}</span>
                      </div>
                      <div className="flex gap-4 text-xs font-bold" dir="ltr">
                        <span className="text-zinc-500">L: {team.played}</span>
                        <span className="text-emerald-500">{team.points} Pt</span>
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-zinc-600 text-sm">لا توجد مباريات مسجلة</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Scorers Summary */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800/50 mb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                  <Medal className="h-4 w-4 text-amber-400" /> قائمة الهدافين
                </CardTitle>
                <Trophy className="h-4 w-4 text-zinc-600" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-800/30">
                  {topScorers.length > 0 ? topScorers.map((player, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-800/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                          {player.photo_url ? <img src={player.photo_url} className="h-full w-full object-cover" /> : <Star className="h-4 w-4 text-zinc-600" />}
                        </div>
                        <span className="text-sm font-medium text-zinc-300">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-zinc-50" dir="ltr">
                         {player.goals} <Goal className="h-4 w-4 text-emerald-400" />
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-zinc-600 text-sm">لم يتم تسجيل أهداف بعد</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Space */}
        <div className="lg:col-span-4 space-y-6">
          {/* Notifications Panel */}
          <Card className="glass-card ultra-glow-blue border-blue-500/20">
            <CardHeader className="pb-3 flex flex-row items-center gap-2">
              <Bell className="h-4 w-4 text-blue-400 animate-pulse" />
              <CardTitle className="text-base font-bold">آخر الإشعارات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800/50 max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? notifications.map((n, i) => (
                  <div key={i} className={`p-4 hover:bg-zinc-800/20 cursor-pointer ${!n.is_read ? 'bg-blue-500/5' : ''}`}>
                    <div className="flex justify-between items-start mb-1 text-right">
                      <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{n.title}</span>
                    </div>
                    <p className="text-sm text-zinc-300 line-clamp-2 text-right">{n.message}</p>
                    <p className="text-[10px] text-zinc-600 mt-2 font-medium text-right">{new Date(n.created_at).toLocaleTimeString('ar-DZ')}</p>
                  </div>
                )) : (
                  <div className="p-10 text-center text-zinc-600 text-sm">لا توجد إشعارات جديدة</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leaders Summary Card */}
          <Card className="glass-card bg-zinc-900 border-zinc-800 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trophy className="h-16 w-16 text-emerald-500" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-emerald-500" /> نجوم الأكاديمية
                </CardTitle>
                <button 
                   onClick={() => window.location.hash = '#/academy/leaderboard'}
                  className="text-[10px] text-emerald-500 font-bold hover:underline"
                >
                  عرض الكل
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-[10px] text-zinc-600 italic text-center py-4">في انتظار تقييمات اللاعبين لترتيب النتائج.</p>
                ) : leaderboard.map((player, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-950/50 border border-zinc-800/50 hover:border-emerald-500/30 transition-all">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                        {player.photo_url ? (
                          <img src={player.photo_url} className="h-full w-full object-cover" />
                        ) : (
                          <Star className="h-4 w-4 text-zinc-600" />
                        )}
                      </div>
                      <div className={cn(
                        "absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg",
                        i === 0 ? "bg-emerald-500 text-white" : i === 1 ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                      )}>
                        {i + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-xs font-black text-white truncate">{player.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold">{player.category}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-emerald-500">{player.overall}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="glass-card shadow-lg">
            <CardHeader className="pb-3 border-b border-zinc-800/50 mb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" /> جدول اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTrainings.length > 0 ? upcomingTrainings.map((session, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/20 border border-zinc-800/50">
                    <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                      {session.start_time.split(':')[0]}
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-sm font-bold text-zinc-100 truncate">{getTeamName(session.team_id)}</p>
                      <p className="text-xs text-zinc-500 flex items-center justify-end gap-1.5 mt-0.5">{session.location} <Shield className="h-3 w-3" /></p>
                    </div>
                    <div className="mr-auto">
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                )) : (
                  <div className="py-6 text-center text-zinc-600 text-xs">لا توجد حصص مجدولة لليوم</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Birthday Reminders */}
          {birthdays.length > 0 && (
            <Card className="glass-card bg-rose-500/5 border-rose-500/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Medal className="h-20 w-20 text-rose-500" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-rose-300">
                  <span className="animate-bounce">🎂</span> أعياد ميلاد اليوم ({birthdays.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {birthdays.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 relative z-10">
                      <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold overflow-hidden">
                         {p.photo_url ? <img src={p.photo_url} className="h-full w-full object-cover" /> : <Star className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-xs font-black text-rose-200 truncate">{p.name}</p>
                        <p className="text-[10px] text-rose-400 font-bold">كل عام وهو بخير! 🎉</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => api.sendWhatsAppNotification(p.phone, `عيد ميلاد سعيد للاعبنا المتميز ${p.name}! 🎉🎁 تتمنى له إدارة الأكاديمية عاماً مليئاً بالنجاحات والتألق في الملعب وخارجه.`)}
                        className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/20"
                      >
                         <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions (Admin Only) */}
          {user?.role === 'admin' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.location.hash = '#/admin/players'}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group"
              >
                <UserPlus className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-emerald-200">إضافة لاعب</span>
              </button>
              <button
                onClick={() => window.location.hash = '#/academy/matches'}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group"
              >
                <Trophy className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-blue-200">لقاء جديد</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Players Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={`لاعبو فئة: ${selectedCategory?.name}`} size="lg">
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {selectedCategory?.players?.length > 0 ? selectedCategory.players.map((player: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {player.photo_url ? <img src={player.photo_url} className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-zinc-500" />}
                </div>
                <div className="flex-1 min-w-0 text-right">
                   <p className="text-sm font-bold text-zinc-100 truncate">{player.name}</p>
                   <p className="text-xs text-zinc-500 truncate">{player.team_id ? teams.find(t => t.team_id === player.team_id)?.team_name || 'بدون فريق' : 'بدون فريق'}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-1 sm:col-span-2 py-8 text-center text-zinc-500">لا يوجد لاعبون في هذه الفئة</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
