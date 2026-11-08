import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Star, Zap, Target, Activity, Brain, Search, QrCode } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { useAuth } from "@/services/AuthContext";
import { QRScannerModal } from "@/components/QRScannerModal";

export function Evaluations() {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach';
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<any>(null);
  const [evalToDelete, setEvalToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamForFiltering, setSelectedTeamForFiltering] = useState<string>("");
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    let evalsData: any[] = [], playersData: any[] = [], coachesData: any[] = [], teamsData: any[] = [], catsData: any[] = [];

    try { evalsData = await api.getEvaluations(); } catch (e) { console.error('evals:', e); }
    try { coachesData = await api.getCoaches(); setCoaches(coachesData); } catch (e) { console.error('coaches:', e); }
    try { teamsData = await api.getTeams(); setTeams(teamsData); } catch (e) { console.error('teams:', e); }
    try { playersData = await api.getPlayers(); } catch (e) { console.error('players:', e); }
    try { catsData = await api.getCategories(); setCategories(catsData); } catch (e) { console.error('categories:', e); }

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

      const coachPlayers = playersData.filter(p =>
        coachTeamIds.includes(Number(p.team_id)) ||
        (user.category && p.category === user.category)
      );
      const coachPlayerIds = coachPlayers.map(p => Number(p.player_id));

      setEvaluations(evalsData.filter(e => coachPlayerIds.includes(Number(e.player_id))));
      setPlayers(coachPlayers);
      setTeams(coachTeams);
      setCategories(catsData.filter(c => uniqueCoachCats.includes(c.name)));
      setSelectedCoachId(Number(user.coach_id));
    } else {
      setEvaluations(evalsData);
      setPlayers(playersData);
      setTeams(teamsData);
      setCategories(catsData);
    }
    setIsLoading(false);
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTeamForFiltering(val);

    if (!val) { setSelectedCoachId(null); return; }

    if (val.startsWith('cat:')) {
      const catName = val.replace('cat:', '');
      const coach = coaches.find(c => c.category === catName);
      if (coach) setSelectedCoachId(Number(coach.coach_id));
    } else if (val.startsWith('team:')) {
      const tId = Number(val.replace('team:', ''));
      const team = teams.find(t => t.team_id === tId);
      if (team?.coach_id) {
        setSelectedCoachId(Number(team.coach_id));
      } else if (team?.category) {
        const coach = coaches.find(c => c.category === team.category);
        if (coach) setSelectedCoachId(Number(coach.coach_id));
      }
    }
  };

  const handleAddEvaluation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const technical = Number(formData.get("technical"));
    const tactical = Number(formData.get("tactical"));
    const physical = Number(formData.get("physical"));
    const mental = Number(formData.get("mental"));
    const shooting = Number(formData.get("shooting")) || 5;
    const passing = Number(formData.get("passing")) || 5;
    const dribbling = Number(formData.get("dribbling")) || 5;
    const defending = Number(formData.get("defending")) || 5;

    const evalData = {
      player_id: Number(formData.get("player_id")),
      coach_id: Number(formData.get("coach_id")),
      date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      technical,
      tactical,
      physical,
      mental,
      shooting,
      passing,
      dribbling,
      defending,
      notes: formData.get("notes") as string,
    };

    try {
      if (editingEvaluation) {
        await api.updateEvaluation(editingEvaluation.evaluation_id, evalData);
      } else {
        await api.addEvaluation(evalData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingEvaluation(null);
    } catch (error) {
      console.error("Failed to save evaluation:", error);
    }
  };

  const handleDeleteEvaluation = async (id: number) => {
    setEvalToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (evalToDelete) {
      setIsDeleting(true);
      try {
        await api.deleteEvaluation(evalToDelete);
        await loadData();
        setIsConfirmOpen(false);
      } catch (error) {
        console.error("Failed to delete evaluation:", error);
      } finally {
        setIsDeleting(false);
        setEvalToDelete(null);
      }
    }
  };

  const handleEditEvaluation = (evaluation: any) => {
    setEditingEvaluation(evaluation);
    setSelectedCoachId(Number(evaluation.coach_id));
    setIsModalOpen(true);
  };

  const handleOpenAddEvaluation = () => {
    setEditingEvaluation(null);
    setSelectedCoachId(null);
    setIsModalOpen(true);
  };

  const getPlayerName = (id: number) => {
    const player = players.find(p => p.player_id === id);
    return player ? player.name : "غير محدد";
  };

  const getCoachName = (id: number) => {
    const coach = coaches.find(c => c.coach_id === id);
    return coach ? coach.name : "غير محدد";
  };

  const filteredEvaluations = evaluations.filter(e => {
    const player = players.find(p => p.player_id === e.player_id);
    const playerName = player ? player.name.toLowerCase() : "غير محدد";
    return playerName.includes(searchTerm.toLowerCase()) ||
      String(e.player_id).includes(searchTerm) ||
      (player?.qr_code || "").includes(searchTerm);
  });

  const calculateOverall = (evalData: any) => {
    const sum = (evalData.technical || 0) + (evalData.tactical || 0) + (evalData.physical || 0) + (evalData.mental || 0) +
      (evalData.shooting || 0) + (evalData.passing || 0) + (evalData.dribbling || 0) + (evalData.defending || 0);
    // If we only have the old 4 fields, we should handle that, but for new ones we divide by 8
    const count = evalData.shooting !== undefined ? 8 : 4;
    return (sum / count).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">تقييم اللاعبين</h2>
          <p className="text-zinc-400 mt-1">عرض وتحليل تقييمات اللاعبين الفنية والبدنية.</p>
        </div>
        {isCoach && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsQrScannerOpen(true)}
              className="border-zinc-800 text-zinc-400 hover:text-emerald-500"
            >
              <QrCode className="h-4 w-4" />
            </Button>
            <Button onClick={() => { setEditingEvaluation(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              إضافة تقييم
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-zinc-900/40 p-3 sm:p-4 rounded-xl border border-zinc-800/50">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="بحث عن تقييم لاعب (اسم أو QR)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-10 pl-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        {!isCoach && (
          <Button variant="outline" onClick={() => setIsQrScannerOpen(true)} className="h-10 border-zinc-800 text-zinc-400 hover:text-emerald-500">
            <QrCode className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-zinc-500">جاري التحميل...</div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 italic border-2 border-dashed border-zinc-800 rounded-xl">لا توجد تقييمات تطابق البحث</div>
        ) : filteredEvaluations.map((evalData) => (
          <Card key={evalData.evaluation_id} className="bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 transition-all duration-200">
            <CardHeader className="flex flex-row items-start justify-between pb-2 border-b border-zinc-800/50">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-50">{getPlayerName(evalData.player_id)}</CardTitle>
                <p className="text-sm text-zinc-400 mt-1">المُقيّم: {getCoachName(evalData.coach_id)}</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                <span className="text-xs font-medium text-emerald-500 mb-1">التقييم العام</span>
                <span className="text-xl font-black text-emerald-400">{calculateOverall(evalData)}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Radar Chart Visualization */}
                <div className="h-48 w-full -mt-2 mb-4 bg-zinc-950/30 rounded-xl overflow-hidden pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'فني', A: evalData.technical, fullMark: 10 },
                      { subject: 'تكتيكي', A: evalData.tactical, fullMark: 10 },
                      { subject: 'بدني', A: evalData.physical, fullMark: 10 },
                      { subject: 'ذهني', A: evalData.mental, fullMark: 10 },
                      { subject: 'تسديد', A: evalData.shooting || 5, fullMark: 10 },
                      { subject: 'تـمرير', A: evalData.passing || 5, fullMark: 10 },
                      { subject: 'مـراوغة', A: evalData.dribbling || 5, fullMark: 10 },
                      { subject: 'دفـاع', A: evalData.defending || 5, fullMark: 10 },
                    ]}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#52525b', fontSize: 8 }} />
                      <Radar
                        name="مستوى اللاعب"
                        dataKey="A"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 mb-2 border-t border-zinc-800/30 pt-3">
                  <span>تاريخ التقييم: {evalData.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center text-zinc-300"><Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> فني</span>
                      <span className="font-bold text-zinc-50">{evalData.technical}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${evalData.technical * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center text-zinc-300"><Brain className="mr-1.5 h-3.5 w-3.5 text-indigo-500" /> تكتيكي</span>
                      <span className="font-bold text-zinc-50">{evalData.tactical}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${evalData.tactical * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center text-zinc-300"><Activity className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> بدني</span>
                      <span className="font-bold text-zinc-50">{evalData.physical}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evalData.physical * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center text-zinc-300"><Brain className="mr-1.5 h-3.5 w-3.5 text-purple-500" /> ذهني</span>
                      <span className="font-bold text-zinc-50">{evalData.mental}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${evalData.mental * 10}%` }}></div>
                    </div>
                  </div>

                  {/* New Advanced Skills Bars */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-rose-400 font-bold">تسديد</span>
                      <span className="text-zinc-50">{evalData.shooting || 5}/10</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${(evalData.shooting || 5) * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-blue-400 font-bold">تـمرير</span>
                      <span className="text-zinc-50">{evalData.passing || 5}/10</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(evalData.passing || 5) * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-amber-400 font-bold">مراوغة</span>
                      <span className="text-zinc-50">{evalData.dribbling || 5}/10</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(evalData.dribbling || 5) * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-emerald-400 font-bold">دفاع</span>
                      <span className="text-zinc-50">{evalData.defending || 5}/10</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(evalData.defending || 5) * 10}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-2">
                  {isCoach && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleEditEvaluation(evalData)} className="flex-1 text-zinc-400 hover:text-zinc-50">
                        تعديل
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEvaluation(evalData.evaluation_id)} className="flex-1 text-zinc-400 hover:text-rose-500">
                        حذف
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEvaluation(null); setSelectedCoachId(null); }} title={editingEvaluation ? "تعديل تقييم اللاعب" : "إضافة تقييم جديد"}>
        <form onSubmit={handleAddEvaluation} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الفئة / الفوج لفلترة اللاعبين</label>
              <select
                onChange={handleTeamChange}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">كل الفئات</option>
                {categories.map(cat => (
                  <optgroup key={cat.category_id} label={cat.name}>
                    <option value={`cat:${cat.name}`}>{cat.name} (كل اللاعبين)</option>
                    {teams.filter(t => t.category === cat.name).map(t => (
                      <option key={t.team_id} value={`team:${t.team_id}`}>{t.team_name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">اللاعب</label>
              <select required name="player_id" defaultValue={editingEvaluation?.player_id} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="">اختر اللاعب</option>
                {players
                  .filter(p => {
                    if (!selectedTeamForFiltering) return true;
                    if (selectedTeamForFiltering.startsWith('cat:')) {
                      return p.category === selectedTeamForFiltering.replace('cat:', '');
                    }
                    if (selectedTeamForFiltering.startsWith('team:')) {
                      return Number(p.team_id) === Number(selectedTeamForFiltering.replace('team:', ''));
                    }
                    return true;
                  })
                  .map(p => (
                    <option key={p.player_id} value={p.player_id}>{p.name}</option>
                  ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">المدرب المُقيم</label>
              <select
                required
                name="coach_id"
                value={selectedCoachId || (editingEvaluation?.coach_id || "")}
                onChange={(e) => setSelectedCoachId(Number(e.target.value))}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">اختر المدرب</option>
                {coaches.map(c => (
                  <option key={c.coach_id} value={c.coach_id}>{c.name} {c.category ? `(${c.category})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">التاريخ</label>
              <input required name="date" defaultValue={editingEvaluation?.date || new Date().toISOString().split('T')[0]} type="date" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/50">
            <p className="text-sm font-medium text-zinc-300 mb-4">التقييم الفني والبدني (من 1 إلى 10)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-bold">فني (Technical)</label>
                <input required name="technical" defaultValue={editingEvaluation?.technical || 5} type="number" min="1" max="10" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-bold">تكتيكي (Tactical)</label>
                <input required name="tactical" defaultValue={editingEvaluation?.tactical || 5} type="number" min="1" max="10" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-bold">بدني (Physical)</label>
                <input required name="physical" defaultValue={editingEvaluation?.physical || 5} type="number" min="1" max="10" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-bold">ذهني (Mental)</label>
                <input required name="mental" defaultValue={editingEvaluation?.mental || 5} type="number" min="1" max="10" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-rose-400 font-bold">التسديد (Shooting)</label>
                <input required name="shooting" defaultValue={editingEvaluation?.shooting || 5} type="number" min="1" max="10" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-blue-400 font-bold">التمرير (Passing)</label>
                <input required name="passing" defaultValue={editingEvaluation?.passing || 5} type="number" min="1" max="10" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-amber-400 font-bold">المراوغة (Dribbling)</label>
                <input required name="dribbling" defaultValue={editingEvaluation?.dribbling || 5} type="number" min="1" max="10" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-emerald-400 font-bold">الدفاع (Defending)</label>
                <input required name="defending" defaultValue={editingEvaluation?.defending || 5} type="number" min="1" max="10" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">ملاحظات</label>
            <textarea name="notes" defaultValue={editingEvaluation?.notes} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="أي ملاحظات إضافية..." />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingEvaluation(null); }} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">{editingEvaluation ? "تحديث التقييم" : "حفظ التقييم"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="حذف التقييم"
        message="هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء."
      />

      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScan={(code) => {
          const cleanCode = code.startsWith("PLAYER:") ? code.split(":")[1] : code;
          setSearchTerm(cleanCode);
        }}
        players={players}
      />
    </div>
  );
}
