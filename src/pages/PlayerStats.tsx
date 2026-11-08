import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Star, Plus, Trash2, Edit2, Trophy, QrCode } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { QRScannerModal } from "@/components/QRScannerModal";

export function PlayerStats() {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach';
  const [stats, setStats] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<any>(null);
  const [statToDelete, setStatToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedTeamForFiltering, setSelectedTeamForFiltering] = useState<string>("");
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, playersData, matchesData, teamsData, catsData] = await Promise.all([
        api.getPlayerStats(),
        api.getPlayers(),
        api.getEMSMatches(),
        api.getTeams(),
        api.getCategories()
      ]);
      setTeams(teamsData);
      setCategories(catsData);

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

        setStats(statsData.filter(s => coachPlayerIds.includes(Number(s.player_id))));
        setPlayers(coachPlayers);
        setMatches(matchesData.filter(m => uniqueCoachCats.includes(m.category)));
        setTeams(coachTeams);
        setCategories(catsData.filter(c => uniqueCoachCats.includes(c.name)));
      } else {
        setStats(statsData);
        setPlayers(playersData);
        setMatches(matchesData);
        setTeams(teamsData);
        setCategories(catsData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleAddStat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const statData = {
      match_id: Number(formData.get("match_id")),
      player_id: Number(formData.get("player_id")),
      goals: Number(formData.get("goals")),
      assists: Number(formData.get("assists")),
      passes: Number(formData.get("passes")),
      shots: Number(formData.get("shots")),
      rating: Number(formData.get("rating")),
    };

    try {
      if (editingStat) {
        await api.updatePlayerStat(editingStat.stat_id, statData);
      } else {
        await api.addPlayerStat(statData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingStat(null);
    } catch (error: any) {
      console.error("Failed to save player stats:", error);
      alert("حدث خطأ أثناء الحفظ: " + (error.message || "تأكد من تحديث قاعدة البيانات"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStat = async (id: number) => {
    setStatToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (statToDelete) {
      try {
        await api.deletePlayerStat(statToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete player stats:", error);
      } finally {
        setStatToDelete(null);
      }
    }
  };

  const handleEditStat = (stat: any) => {
    setEditingStat(stat);
    setIsModalOpen(true);
  };

  const getPlayerName = (id: number) => {
    const player = players.find(p => p.player_id === id);
    return player?.name || "غير محدد";
  };

  const getMatchInfo = (id: number) => {
    const match = matches.find(m => m.id === id);
    return match ? `${match.home_team} vs ${match.away_team} (${match.match_date})` : "غير محدد";
  };

  const filteredStats = stats.filter(s => {
    const player = players.find(p => p.player_id === s.player_id);
    const playerName = player ? player.name.toLowerCase() : "غير محدد";
    return playerName.includes((searchQuery || "").toLowerCase()) ||
      String(s.player_id).includes(searchQuery) ||
      (player?.qr_code || "").includes(searchQuery);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">أداء اللاعبين</h2>
          <p className="text-zinc-400 mt-1">تتبع إحصائيات اللاعبين وتقييماتهم في المباريات.</p>
        </div>
        {isCoach && (
          <Button onClick={() => { setEditingStat(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            إضافة إحصائيات
          </Button>
        )}
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-0">
          <div className="flex items-center p-4 border-b border-zinc-800/50 gap-2">
            <div className="relative flex-1 sm:max-w-96">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="بحث عن لاعب أو QR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-950/50 pr-10 pl-4 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsQrScannerOpen(true)}
              className="h-10 w-10 border-zinc-800 text-zinc-400 hover:text-emerald-500"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-zinc-400 bg-zinc-950/50 border-b border-zinc-800/50">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">اللاعب</th>
                  <th scope="col" className="px-6 py-4 font-medium">المباراة</th>
                  <th scope="col" className="px-6 py-4 font-medium text-center">الأهداف</th>
                  <th scope="col" className="px-6 py-4 font-medium text-center">التمريرات الحاسمة</th>
                  <th scope="col" className="px-6 py-4 font-medium text-center">التمريرات</th>
                  <th scope="col" className="px-6 py-4 font-medium text-center">التسديدات</th>
                  <th scope="col" className="px-6 py-4 font-medium text-center">التقييم</th>
                  <th scope="col" className="px-6 py-4 font-medium text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">جاري التحميل...</td>
                  </tr>
                ) : filteredStats.map((stat) => (
                  <tr key={stat.stat_id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-zinc-50">{getPlayerName(stat.player_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">
                      <span className="inline-flex items-center rounded-md bg-zinc-800/50 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700/50">
                        {getMatchInfo(stat.match_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-zinc-50 font-bold">{stat.goals}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-zinc-50 font-bold">{stat.assists}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-zinc-300">{stat.passes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-zinc-300">{stat.shots}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-zinc-50">{stat.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {isCoach && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleEditStat(stat)} className="text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteStat(stat.stat_id)} className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingStat(null); }} title={editingStat ? "تعديل إحصائيات اللاعب" : "إضافة إحصائيات جديدة"}>
        <form onSubmit={handleAddStat} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الفئة / الفوج لفلترة اللاعبين</label>
              <select
                onChange={(e) => setSelectedTeamForFiltering(e.target.value)}
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
              <select required name="player_id" defaultValue={editingStat?.player_id} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
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
              <label className="text-sm font-medium text-zinc-300">المباراة</label>
              <select required name="match_id" defaultValue={editingStat?.match_id} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="">اختر المباراة</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>{m.home_team} vs {m.away_team} - {m.match_date}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">التقييم (من 10)</label>
              <input required name="rating" defaultValue={editingStat?.rating} type="number" step="0.1" min="1" max="10" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الأهداف</label>
              <input required name="goals" defaultValue={editingStat?.goals} type="number" min="0" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">التمريرات الحاسمة</label>
              <input required name="assists" defaultValue={editingStat?.assists} type="number" min="0" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">التمريرات</label>
              <input required name="passes" defaultValue={editingStat?.passes} type="number" min="0" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">التسديدات</label>
              <input required name="shots" defaultValue={editingStat?.shots} type="number" min="0" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingStat(null); }} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSaving ? "جاري الحفظ..." : (editingStat ? "تحديث الإحصائيات" : "حفظ الإحصائيات")}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف إحصائيات اللاعب"
        message="هل أنت متأكد من حذف إحصائيات هذا اللاعب؟ سيؤدي هذا الإجراء إلى حذف كافة البيانات المرتبطة به بشكل دائم."
      />
      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScan={(code) => {
          const cleanCode = code.startsWith("PLAYER:") ? code.split(":")[1] : code;
          setSearchQuery(cleanCode);
        }}
        players={players}
      />
    </div>
  );
}
