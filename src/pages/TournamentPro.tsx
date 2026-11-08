import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trophy, Users, LayoutGrid, Calendar, ListOrdered, Plus, 
  Trash2, Edit3, Settings, Shield, Globe, MapPin, 
  CheckCircle2, Swords, RefreshCcw, Save, Search, Camera, Printer
} from "lucide-react";
import { api } from "@/services/api";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export function TournamentPro() {
  const [activeTab, setActiveTab] = useState<'teams' | 'groups' | 'matches' | 'standings'>('teams');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [teams, setTeams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupTeams, setGroupTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [academyTeams, setAcademyTeams] = useState<any[]>([]);

  // Modal States
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isMatchEditModalOpen, setIsMatchEditModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Form States
  const [teamForm, setTeamForm] = useState({ name: "", city: "", academy_type: "external", logo_url: "" });
  const [groupForm, setGroupForm] = useState({ name: "" });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [t, g, gt, m, at] = await Promise.all([
        api.getTGTeams(),
        api.getTGGroups(),
        api.getTGGroupTeams(),
        api.getTGMatches(),
        api.getTeams() // Main academy teams
      ]);
      setTeams(t);
      setGroups(g);
      setGroupTeams(gt);
      setMatches(m);
      setAcademyTeams(at);
    } catch (error) {
      console.error("Failed to load tournament data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addTGTeam(teamForm);
      setIsTeamModalOpen(false);
      setTeamForm({ name: "", city: "", academy_type: "external", logo_url: "" });
      loadAllData();
    } catch (e) { alert("Error adding team. Check SQL."); }
  };

  const handleAddAcademyTeam = async (academyTeamId: number) => {
    const at = academyTeams.find(t => t.team_id === academyTeamId);
    if (!at) return;
    try {
      await api.addTGTeam({
        name: `${at.category} - ${at.team_name}`,
        city: "الأكاديمية",
        academy_type: "academy",
        internal_team_id: at.team_id
      });
      loadAllData();
    } catch (e) { alert("Error cloning team."); }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addTGGroup(groupForm);
      setIsGroupModalOpen(false);
      setGroupForm({ name: "" });
      loadAllData();
    } catch (e) { alert("Error adding group."); }
  };

  const handleAddTeamToGroup = async (groupId: number, teamId: number) => {
    try {
      await api.addTGGroupTeam({ group_id: groupId, team_id: teamId });
      loadAllData();
    } catch (e) { alert("Team already in a group or error."); }
  };

  const generateMatches = async (groupId: number) => {
    const teamsInGroup = groupTeams.filter(gt => gt.group_id === groupId).map(gt => gt.team_id);
    if (teamsInGroup.length < 2) {
      alert("يجب وجود فريقين على الأقل لتوليد المباريات");
      return;
    }

    const newMatches: any[] = [];
    for (let i = 0; i < teamsInGroup.length; i++) {
      for (let j = i + 1; j < teamsInGroup.length; j++) {
        newMatches.push({
          group_id: groupId,
          team1_id: teamsInGroup[i],
          team2_id: teamsInGroup[j],
          status: 'pending',
          match_date: new Date().toISOString().split('T')[0],
          match_time: "16:00"
        });
      }
    }

    try {
      await api.addTGMatchesBulk(newMatches);
      loadAllData();
      setActiveTab('matches');
    } catch (e) { alert("Error generating matches."); }
  };

  const handleUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      await api.updateTGMatch(selectedMatch.id, {
        team1_score: selectedMatch.team1_score,
        team2_score: selectedMatch.team2_score,
        status: 'finished'
      });
      setIsMatchEditModalOpen(false);
      loadAllData();
    } catch (e) { alert("Error updating score."); }
  };

  const handleDeleteTeam = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الفريق؟ سيؤدي ذلك لحذفه من المجموعات والمباريات أيضاً.")) {
      await api.deleteTGTeam(id);
      loadAllData();
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه المجموعة؟ سيتم حذف كافة مبارياتها أيضاً.")) {
      await api.deleteTGGroup(id);
      loadAllData();
    }
  };

  const handleResetTournament = async () => {
    if (confirm("⚠️ تحذير: سيتم مسح كافة بيانات الدورة الحالية (فرق، مجموعات، مباريات) للبدء من جديد. هل أنت متأكد؟")) {
      await api.resetTournamentPro();
      loadAllData();
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    try {
      await api.updateTGTeam(selectedTeam.id, selectedTeam);
      setIsEditTeamModalOpen(false);
      loadAllData();
    } catch (e) { alert("Error updating team."); }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      await api.updateTGGroup(selectedGroup.id, selectedGroup);
      setIsEditGroupModalOpen(false);
      loadAllData();
    } catch (e) { alert("Error updating group."); }
  };

  const handlePrint = () => {
    window.print();
  };

  // Standings Calculation Logic (FIFA Style Tie-breaker)
  const calculateStandings = (groupId: number) => {
    const standingsMap: Record<number, any> = {};
    const teamsInThisGroup = groupTeams.filter(gt => gt.group_id === groupId);
    const finishedMatches = matches.filter(m => m.group_id === groupId && m.status === 'finished');
    
    teamsInThisGroup.forEach(gt => {
      standingsMap[gt.team_id] = {
        team_id: gt.team_id,
        played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0
      };
    });

    finishedMatches.forEach(m => {
      const t1 = standingsMap[m.team1_id];
      const t2 = standingsMap[m.team2_id];
      if (!t1 || !t2) return;

      t1.played++; t2.played++;
      t1.gf += m.team1_score; t1.ga += m.team2_score;
      t2.gf += m.team2_score; t2.ga += m.team1_score;

      if (m.team1_score > m.team2_score) {
        t1.won++; t1.points += 3; t2.lost++;
      } else if (m.team2_score > m.team1_score) {
        t2.won++; t2.points += 3; t1.lost++;
      } else {
        t1.drawn++; t1.points += 1; t2.drawn++; t2.points += 1;
      }
    });

    const getH2HStats = (teamAId: number, teamBId: number) => {
      const h2hMatches = finishedMatches.filter(m => 
        (m.team1_id === teamAId && m.team2_id === teamBId) || 
        (m.team1_id === teamBId && m.team2_id === teamAId)
      );
      
      let points = 0, gd = 0, gf = 0;
      h2hMatches.forEach(m => {
        if (m.team1_id === teamAId) {
          gf += m.team1_score; gd += (m.team1_score - m.team2_score);
          if (m.team1_score > m.team2_score) points += 3;
          else if (m.team1_score === m.team2_score) points += 1;
        } else {
          gf += m.team2_score; gd += (m.team2_score - m.team1_score);
          if (m.team2_score > m.team1_score) points += 3;
          else if (m.team1_score === m.team2_score) points += 1;
        }
      });
      return { points, gd, gf };
    };

    return Object.values(standingsMap).sort((a, b) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      
      // 2. Overall Goal Difference
      const bGD = b.gf - b.ga;
      const aGD = a.gf - a.ga;
      if (bGD !== aGD) return bGD - aGD;
      
      // 3. Overall Goals Scored
      if (b.gf !== a.gf) return b.gf - a.gf;
      
      // 4. Head-to-Head (If only 2 teams are tied, this is simple. FIFA rules get complex for 3+ teams, but this covers the basics)
      const h2h = getH2HStats(a.team_id, b.team_id);
      if (h2h.points !== 0) return h2h.gd || h2h.gf || 0; // Simplified H2H return for sort

      return 0;
    });
  };

  const getTeamById = (id: number) => teams.find(t => t.id === id);

  return (
    <div className="space-y-6 pb-20 font-tajawal rtl" dir="rtl">
      {/* PROFESSIONAL LOGO & HEADER */}
      <div className="bg-emerald-600 rounded-3xl p-8 lg:p-12 relative overflow-hidden shadow-2xl text-right">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/football.png')]"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div>
             <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/30">Tournament Engine v2.0</span>
             </div>
             <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 shadow-sm">
               المـنظم الاحتـرافي للبطـولات
             </h1>
             <p className="text-emerald-50 text-lg font-medium opacity-90 max-w-xl">نظام متكامل لتسيير الدورات الكروية، تقسيم المجموعات، وتوليد النتائج آلياً بكل سهولة واحترافية.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl flex items-center gap-6 shadow-inner">
             <div className="text-center">
                <p className="text-[10px] text-emerald-200 font-black uppercase mb-1">الفرق</p>
                <p className="text-2xl font-black text-white">{teams.length}</p>
             </div>
             <div className="w-px h-8 bg-white/20"></div>
             <div className="text-center">
                <p className="text-[10px] text-emerald-200 font-black uppercase mb-1">المباريات</p>
                <p className="text-2xl font-black text-white">{matches.length}</p>
             </div>
             <div className="w-px h-8 bg-white/20"></div>
             <div className="text-center">
                <p className="text-[10px] text-emerald-200 font-black uppercase mb-1">المجموعات</p>
                <p className="text-2xl font-black text-white">{groups.length}</p>
             </div>
          </div>
          <div className="flex gap-3 no-print">
             <Button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black px-6 py-2 rounded-xl">
                <Printer className="ml-2 h-4 w-4" /> طباعة
             </Button>
             <Button onClick={handleResetTournament} variant="destructive" className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 font-black px-6 py-2 rounded-xl">
                <RefreshCcw className="ml-2 h-4 w-4" /> تصفير الدورة
             </Button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg sticky top-6 z-40 backdrop-blur-md bg-zinc-900/80 group">
         {[
           { id: 'teams', label: 'إدارة الفرق', icon: Users },
           { id: 'groups', label: 'المجموعات', icon: LayoutGrid },
           { id: 'matches', label: 'المباريات والنتائج', icon: Swords },
           { id: 'standings', label: 'جدول الترتيب', icon: ListOrdered }
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all",
               activeTab === tab.id 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
             )}
           >
             <tab.icon className="h-4 w-4" />
             {tab.label}
           </button>
         ))}
      </div>

      {/* CONTENT SECTIONS */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" /> الفرق المشاركة
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.length === 0 ? (
                  <div className="col-span-full py-20 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-600 italic">
                    <Users className="h-12 w-12 mb-4 opacity-20" />
                    لا يوجد فرق مسجلة. أضف فرقاً خارجية أو من الأكاديمية.
                  </div>
                ) : teams.map(t => (
                  <Card key={t.id} className="bg-zinc-900 border-zinc-800 group hover:border-emerald-500/50 transition-all shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-3xl rounded-full"></div>
                    <CardContent className="p-5 flex items-center gap-4 relative z-10">
                       <div className="h-14 w-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                          {t.logo_url ? <img src={t.logo_url} className="h-full w-full object-cover" /> : <Shield className="h-7 w-7 text-zinc-700" />}
                       </div>
                       <div className="flex-1 text-right">
                          <h4 className="font-black text-zinc-100">{t.name}</h4>
                          <div className="flex items-center justify-end gap-2 mt-1">
                             <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.city}</span>
                             <span className={cn(
                               "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                               t.academy_type === 'academy' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-800 text-zinc-500"
                             )}>
                               {t.academy_type === 'academy' ? 'داخلية' : 'خارجية'}
                             </span>
                          </div>
                       </div>
                       <div className="flex gap-1 no-print">
                          <Button 
                            onClick={() => { setSelectedTeam(t); setIsEditTeamModalOpen(true); }}
                            variant="ghost" size="icon" className="text-zinc-700 hover:text-emerald-500 hover:bg-emerald-500/10"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleDeleteTeam(t.id)} 
                            variant="ghost" size="icon" className="text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden group">
                  <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                     <h3 className="text-sm font-black text-zinc-300">إضافة فريق خارجي</h3>
                     <Globe className="h-4 w-4 text-emerald-500" />
                  </div>
                  <CardContent className="p-6">
                     <form onSubmit={handleAddTeam} className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">اسم النادي / الفريق</label>
                           <input 
                             required value={teamForm.name}
                             onChange={e => setTeamForm({...teamForm, name: e.target.value})}
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500"
                             placeholder="مثال: وفاق القل"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">المدينة</label>
                           <input 
                             value={teamForm.city}
                             onChange={e => setTeamForm({...teamForm, city: e.target.value})}
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500"
                             placeholder="القل، سكيكدة..."
                           />
                        </div>
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-xl shadow-lg shadow-emerald-500/10">سجل الفريق الآن</Button>
                     </form>
                  </CardContent>
               </Card>

               <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden relative">
                  <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                     <h3 className="text-sm font-black text-zinc-300">استيراد من الأكاديمية</h3>
                     <Shield className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardContent className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                     <div className="space-y-2">
                        {academyTeams.map(at => (
                          <div key={at.team_id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl group hover:border-blue-500/30 transition-all">
                             <div className="text-right">
                                <p className="text-sm font-bold text-zinc-200">{at.category} - {at.team_name}</p>
                                <p className="text-[10px] text-zinc-500">فوج داخلي</p>
                             </div>
                             <Button 
                               onClick={() => handleAddAcademyTeam(at.team_id)}
                               size="sm" 
                               className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] h-8"
                             >استيراد</Button>
                          </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black text-zinc-100 flex items-center gap-3"><LayoutGrid className="h-6 w-6 text-emerald-500" /> تقسيم المجموعات</h3>
             <Button onClick={() => setIsGroupModalOpen(true)} className="bg-zinc-100 hover:bg-white text-zinc-900 font-black rounded-xl">إضافة مجموعة جديدة</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {groups.length === 0 ? (
               <div className="col-span-full py-20 text-center text-zinc-600 italic border-2 border-dashed border-zinc-800 rounded-3xl">لم يتم إنشاء أي مجموعة بعد.</div>
             ) : groups.map(g => (
               <Card key={g.id} className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden group">
                  <CardHeader className="bg-zinc-950 border-b border-white/5 flex flex-row items-center justify-between text-right">
                     <div>
                        <CardTitle className="text-xl font-black text-white">{g.name}</CardTitle>
                        <CardDescription className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{groupTeams.filter(gt => gt.group_id === g.id).length} TEAMS ENROLLED</CardDescription>
                     </div>
                     <div className="flex gap-2">
                        <Button 
                          onClick={() => generateMatches(g.id)}
                          size="sm" 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] h-8 px-4"
                        >توليد المباريات</Button>
                        <Button 
                          onClick={() => { setSelectedGroup(g); setIsEditGroupModalOpen(true); }}
                          variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/10"
                        >
                           <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteGroup(g.id)}
                          variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10"
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent className="p-4">
                     <div className="space-y-2 mb-6">
                        {groupTeams.filter(gt => gt.group_id === g.id).map(gt => {
                          const t = getTeamById(gt.team_id);
                          return (
                            <div key={gt.id} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                                     {t?.logo_url ? <img src={t.logo_url} className="h-full w-full object-cover" /> : <Shield className="h-4 w-4 text-zinc-700" />}
                                  </div>
                                  <span className="text-sm font-bold text-zinc-100">{t?.name || 'Unknown'}</span>
                               </div>
                               <Trash2 className="h-3 w-3 text-zinc-700 cursor-pointer hover:text-rose-500" />
                            </div>
                          );
                        })}
                     </div>
                     
                     <div className="pt-4 border-t border-white/5">
                        <select 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-400 outline-none focus:border-emerald-500 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.value) handleAddTeamToGroup(g.id, Number(e.target.value));
                          }}
                          value=""
                        >
                           <option value="">+ إضافة فريق لهذه المجموعة</option>
                           {teams.filter(t => !groupTeams.some(gt => gt.team_id === t.id)).map(t => (
                             <option key={t.id} value={t.id}>{t.name}</option>
                           ))}
                        </select>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="text-xl font-black text-zinc-100 flex items-center gap-3"><Swords className="h-6 w-6 text-emerald-500" /> المباريات والنتائج</h3>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">بث مباشر للنتائج</span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {matches.length === 0 ? (
                <div className="py-20 text-center text-zinc-600 italic border-2 border-dashed border-zinc-800 rounded-3xl">لا توجد مباريات مسجلة حالياً.</div>
              ) : matches.map(m => {
                const t1 = getTeamById(m.team1_id);
                const t2 = getTeamById(m.team2_id);
                return (
                  <Card key={m.id} className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
                    <CardContent className="p-6">
                       <div className="flex items-center justify-between gap-4">
                          {/* TEAM 1 */}
                          <div className="flex-1 flex flex-col items-center gap-3">
                             <div className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform">
                                {t1?.logo_url ? <img src={t1.logo_url} className="h-full w-full object-cover" /> : <Shield className="h-10 w-10 text-zinc-800" />}
                             </div>
                             <h4 className="font-black text-zinc-100 text-center text-sm lg:text-base">{t1?.name}</h4>
                          </div>

                          {/* SCORE & TIME */}
                          <div className="flex flex-col items-center gap-4 px-8 min-w-[150px]">
                             <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{m.match_date} • {m.match_time}</div>
                             <div className="flex items-center gap-6">
                                <span className={cn(
                                  "text-4xl md:text-5xl lg:text-7xl font-black transition-all",
                                  m.status === 'finished' ? "text-emerald-500" : "text-zinc-700"
                                )}>{m.team1_score}</span>
                                <div className="h-px w-6 lg:w-10 bg-zinc-800"></div>
                                <span className={cn(
                                  "text-4xl md:text-5xl lg:text-7xl font-black transition-all",
                                  m.status === 'finished' ? "text-emerald-500" : "text-zinc-700"
                                )}>{m.team2_score}</span>
                             </div>
                             <div className={cn(
                               "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                               m.status === 'finished' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                             )}>
                               {m.status === 'finished' ? 'انتهت' : 'بانتظار النتيجة'}
                             </div>
                          </div>

                          {/* TEAM 2 */}
                          <div className="flex-1 flex flex-col items-center gap-3">
                             <div className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform">
                                {t2?.logo_url ? <img src={t2.logo_url} className="h-full w-full object-cover" /> : <Shield className="h-10 w-10 text-zinc-800" />}
                             </div>
                             <h4 className="font-black text-zinc-100 text-center text-sm lg:text-base">{t2?.name}</h4>
                          </div>
                       </div>
                       
                       <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <Button 
                            onClick={() => { setSelectedMatch(m); setIsMatchEditModalOpen(true); }}
                            variant="ghost" size="icon" className="h-9 w-9 bg-zinc-950/50 hover:bg-emerald-600 text-zinc-500 hover:text-white rounded-xl"
                          >
                             <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => api.deleteTGMatch(m.id).then(loadAllData)}
                            variant="ghost" size="icon" className="h-9 w-9 bg-zinc-950/50 hover:bg-rose-600 text-zinc-500 hover:text-white rounded-xl"
                          >
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
           </div>
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="space-y-8">
           {groups.map(g => {
             const standing = calculateStandings(g.id);
             return (
               <Card key={g.id} className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden rounded-3xl">
                  <CardHeader className="bg-zinc-950 px-8 py-6 border-b border-zinc-800">
                     <div className="flex justify-between items-center text-right">
                        <div>
                           <CardTitle className="text-2xl font-black text-white">{g.name}</CardTitle>
                           <p className="text-sm font-bold text-zinc-500 mt-1 uppercase tracking-widest">Tournament Standings Table</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                              <ListOrdered className="h-5 w-5 text-emerald-500" />
                           </div>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-0">
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                           <thead>
                              <tr className="bg-zinc-950 text-zinc-500 text-[11px] font-black uppercase tracking-widest">
                                 <th className="py-4 px-8">#</th>
                                 <th className="py-4 px-8">الفريق</th>
                                 <th className="py-4 px-4 text-center">لعب</th>
                                 <th className="py-4 px-4 text-center text-emerald-500">ف</th>
                                 <th className="py-4 px-4 text-center text-amber-500">ت</th>
                                 <th className="py-4 px-4 text-center text-rose-500">خ</th>
                                 <th className="py-4 px-4 text-center">له</th>
                                 <th className="py-4 px-4 text-center">عليه</th>
                                 <th className="py-4 px-4 text-center">+/-</th>
                                 <th className="py-4 px-8 text-center text-emerald-400">النقاط</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-zinc-800/30">
                              {standing.length === 0 ? (
                                <tr><td colSpan={10} className="py-12 text-center text-zinc-600 italic">بانتظار تسجيل المباريات والنتائج...</td></tr>
                              ) : standing.map((s, idx) => {
                                const t = getTeamById(s.team_id);
                                return (
                                  <tr key={s.team_id} className="hover:bg-zinc-800/20 transition-colors group">
                                     <td className="py-6 px-8">
                                        <div className={cn(
                                          "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black shadow-sm",
                                          idx === 0 ? "bg-amber-500 text-black px-4" : "bg-zinc-800 text-zinc-400"
                                        )}>{idx + 1}</div>
                                     </td>
                                     <td className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                           <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                                              {t?.logo_url ? <img src={t.logo_url} className="h-full w-full object-cover" /> : <Shield className="h-5 w-5 text-zinc-800" />}
                                           </div>
                                           <span className="font-black text-zinc-100">{t?.name || 'Unknown'}</span>
                                        </div>
                                     </td>
                                     <td className="py-6 px-4 text-center font-bold text-zinc-400">{s.played}</td>
                                     <td className="py-6 px-4 text-center font-bold text-emerald-500">{s.won}</td>
                                     <td className="py-6 px-4 text-center font-bold text-amber-500">{s.drawn}</td>
                                     <td className="py-6 px-4 text-center font-bold text-rose-500">{s.lost}</td>
                                     <td className="py-6 px-4 text-center font-mono text-zinc-400">{s.gf}</td>
                                     <td className="py-6 px-4 text-center font-mono text-zinc-400">{s.ga}</td>
                                     <td className="py-6 px-4 text-center font-bold text-zinc-500">{s.gf - s.ga}</td>
                                     <td className="py-6 px-8 text-center">
                                        <span className="bg-emerald-500 text-black px-4 py-1.5 rounded-full font-black text-xs shadow-lg shadow-emerald-500/20">
                                           {s.points} Pts
                                        </span>
                                     </td>
                                  </tr>
                                );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </CardContent>
               </Card>
             );
           })}
        </div>
      )}

      {/* MODALS */}
      
      {/* Group Modal */}
      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="إنشاء مجموعة جديدة">
         <form onSubmit={handleAddGroup} className="space-y-4">
            <div className="space-y-2">
               <label className="text-sm font-black text-zinc-500 uppercase tracking-widest">اسم المجموعة</label>
               <input 
                 required value={groupForm.name}
                 onChange={e => setGroupForm({ name: e.target.value })}
                 className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50 outline-none focus:border-emerald-500"
                 placeholder="مثال: المجموعة أ"
               />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-xl">إنشاء المجموعة</Button>
         </form>
      </Modal>

      {/* Match Score Modal */}
      <Modal isOpen={isMatchEditModalOpen} onClose={() => setIsMatchEditModalOpen(false)} title="تحديث نتيجة المباراة">
         {selectedMatch && (
           <form onSubmit={handleUpdateScore} className="space-y-10 py-6">
              <div className="flex items-center justify-between gap-12">
                 <div className="flex flex-col items-center gap-4 flex-1">
                    <div className="h-20 w-20 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl">
                       {getTeamById(selectedMatch.team1_id)?.logo_url ? <img src={getTeamById(selectedMatch.team1_id).logo_url} className="h-full w-full object-cover" /> : <Shield className="h-10 w-10 text-zinc-800" />}
                    </div>
                    <span className="font-black text-zinc-100 text-center">{getTeamById(selectedMatch.team1_id)?.name}</span>
                    <input 
                      type="number" min="0" value={selectedMatch.team1_score}
                      onChange={e => setSelectedMatch({...selectedMatch, team1_score: Number(e.target.value)})}
                      className="w-20 bg-zinc-900 border-2 border-zinc-800 rounded-2xl py-4 text-center text-3xl font-black text-emerald-500 focus:border-emerald-500 outline-none"
                    />
                 </div>

                 <div className="font-black text-zinc-700 text-5xl">VS</div>

                 <div className="flex flex-col items-center gap-4 flex-1">
                    <div className="h-20 w-20 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl">
                       {getTeamById(selectedMatch.team2_id)?.logo_url ? <img src={getTeamById(selectedMatch.team2_id).logo_url} className="h-full w-full object-cover" /> : <Shield className="h-10 w-10 text-zinc-800" />}
                    </div>
                    <span className="font-black text-zinc-100 text-center">{getTeamById(selectedMatch.team2_id)?.name}</span>
                    <input 
                      type="number" min="0" value={selectedMatch.team2_score}
                      onChange={e => setSelectedMatch({...selectedMatch, team2_score: Number(e.target.value)})}
                      className="w-20 bg-zinc-900 border-2 border-zinc-800 rounded-2xl py-4 text-center text-3xl font-black text-emerald-500 focus:border-emerald-500 outline-none"
                    />
                 </div>
              </div>

              <div className="flex gap-4">
                 <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-8 rounded-2xl shadow-xl shadow-emerald-500/20">حفظ النتيجة النهائية</Button>
                 <Button type="button" variant="ghost" onClick={() => setIsMatchEditModalOpen(false)} className="flex-1 border border-zinc-800 text-zinc-500 py-8 rounded-2xl">إلغاء</Button>
              </div>
           </form>
         )}
      </Modal>

      {/* Edit Team Modal */}
      <Modal isOpen={isEditTeamModalOpen} onClose={() => setIsEditTeamModalOpen(false)} title="تعديل بيانات الفريق">
         {selectedTeam && (
           <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-black text-zinc-500 uppercase">اسم الفريق</label>
                 <input 
                   required value={selectedTeam.name}
                   onChange={e => setSelectedTeam({...selectedTeam, name: e.target.value})}
                   className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-50 outline-none focus:border-emerald-500"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-black text-zinc-500 uppercase">المدينة</label>
                 <input 
                   value={selectedTeam.city}
                   onChange={e => setSelectedTeam({...selectedTeam, city: e.target.value})}
                   className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-50 outline-none focus:border-emerald-500"
                 />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg">حفظ التعديلات</Button>
           </form>
         )}
      </Modal>

      {/* Edit Group Modal */}
      <Modal isOpen={isEditGroupModalOpen} onClose={() => setIsEditGroupModalOpen(false)} title="تعديل اسم المجموعة">
         {selectedGroup && (
           <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div className="space-y-2">
                 <label className="text-sm font-black text-zinc-500 uppercase">اسم المجموعة</label>
                 <input 
                   required value={selectedGroup.name}
                   onChange={e => setSelectedGroup({...selectedGroup, name: e.target.value})}
                   className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50 outline-none focus:border-emerald-500"
                 />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg">تحديث الاسم</Button>
           </form>
         )}
      </Modal>

    </div>
  );
}
