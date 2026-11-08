import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, Calendar, MapPin, Users, Printer, FileText, Edit } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { MatchCallListTemplate } from "@/components/PrintTemplates";
import { exportToPDF } from "@/lib/pdf-export";
import { PrintPortal } from "@/components/PrintPortal";

export function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [matchesWithSquads, setMatchesWithSquads] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [matchToDelete, setMatchToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [academySettings, setAcademySettings] = useState<any>(null);

  // Call Players State
  const [isCallPlayersModalOpen, setIsCallPlayersModalOpen] = useState(false);
  const [selectedMatchForCall, setSelectedMatchForCall] = useState<any>(null);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [isSavingSquad, setIsSavingSquad] = useState(false);
  const [showCallListPortal, setShowCallListPortal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [matchesData, teamsData, coachesData, squadsData, settingsData] = await Promise.all([
        api.getMatches(),
        api.getTeams(),
        api.getCoaches(),
        api.getMatchesWithSquads(),
        api.getAcademySettings()
      ]);

      if (user?.role === 'coach' && user.coach_id) {
        const coachTeams = teamsData.filter(t => t.coach_id === user.coach_id);
        const coachTeamIds = coachTeams.map(t => t.team_id);
        setMatches(matchesData.filter(m => coachTeamIds.includes(m.team_id)));
        setTeams(coachTeams);
      } else {
        setMatches(matchesData);
        setTeams(teamsData);
      }
      setCoaches(coachesData);
      setMatchesWithSquads(squadsData);
      setAcademySettings(settingsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const matchData = {
      team_id: Number(formData.get("team_id")),
      opponent: formData.get("opponent") as string,
      match_date: formData.get("match_date") as string,
      time: formData.get("time") as string,
      location: formData.get("location") as string,
      type: formData.get("type") as string || "ودية",
      score: formData.get("score") as string || "- - -",
      status: formData.get("status") as string || "قادمة",
      result: formData.get("result") as string || "لم تلعب بعد",
      notes: formData.get("notes") as string,
    };

    try {
      if (editingMatch) {
        await api.updateMatch(editingMatch.match_id, matchData);
      } else {
        await api.addMatch(matchData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingMatch(null);
    } catch (error) {
      console.error("Failed to save match:", error);
    }
  };

  const handleDeleteMatch = async (id: number) => {
    setMatchToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (matchToDelete) {
      try {
        await api.deleteMatch(matchToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete match:", error);
      } finally {
        setMatchToDelete(null);
      }
    }
  };

  const handleEditMatch = (match: any) => {
    setEditingMatch(match);
    setIsModalOpen(true);
  };

  const getTeamName = (id: number) => {
    const team = teams.find(t => t.team_id === id);
    return team ? team.team_name : "غير محدد";
  };

  // Call Players Functions
  const handleOpenCallPlayers = async (match: any) => {
    setSelectedMatchForCall(match);
    setSelectedPlayerIds([]);
    setIsCallPlayersModalOpen(true);

    try {
      const allPlayers = await api.getPlayers();
      const team = teams.find(t => t.team_id === match.team_id);

      if (team) {
        const category = team.category || team.team_name.split(' ')[0];

        const filteredPlayers = allPlayers.filter(p => {
          return p.category === team.category ||
            (team.category && p.category.includes(team.category)) ||
            (p.category && team.category && team.category.includes(p.category));
        });

        if (filteredPlayers.length > 0) {
          setAvailablePlayers(filteredPlayers);
        } else {
          setAvailablePlayers(allPlayers.sort((a, b) => a.category.localeCompare(b.category)));
        }
      } else {
        setAvailablePlayers(allPlayers);
      }

      // Load saved squad
      try {
        const savedSquad = await api.getMatchSquad(match.match_id);
        if (savedSquad && savedSquad.length > 0) {
          setSelectedPlayerIds(savedSquad);
        }
      } catch (err) {
        console.error("Failed to load saved squad:", err);
      }

    } catch (error) {
      console.error("Failed to fetch players:", error);
    }
  };

  const handleTogglePlayerSelection = (playerId: number) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAllPlayers = () => {
    if (selectedPlayerIds.length === availablePlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(availablePlayers.map(p => p.player_id));
    }
  };

  const handleSaveSquad = async () => {
    if (!selectedMatchForCall) return;
    setIsSavingSquad(true);
    try {
      await api.saveMatchSquad(selectedMatchForCall.match_id, selectedPlayerIds);

      // Notify parents of selected players
      const matchLabel = `${selectedMatchForCall.opponent} (${selectedMatchForCall.match_date})`;
      for (const playerId of selectedPlayerIds) {
        await api.notifyParentOfPlayer(playerId, `تم استدعاء اللاعب للمشاركة في مباراة ضد ${matchLabel}. يرجى الحضور في الوقت المحدد.`, 'مباراة');
      }

      alert("تم حفظ قائمة اللاعبين وإرسال التنبيهات للأولياء بنجاح");
    } catch (error: any) {
      console.error("Failed to save squad:", error);
      if (error.code === 'PGRST205' || error.code === '42P01') {
        alert("عذراً، جدول 'match_squads' غير موجود في قاعدة البيانات. يرجى من المسؤول تشغيل ملف SQL المرفق لإنشاء الجدول.");
      } else if (error.code === '42501') {
        alert("عذراً، ليس لديك صلاحية لحفظ القائمة. يرجى من المسؤول تحديث سياسات الأمان (RLS) باستخدام ملف SQL المرفق.");
      } else {
        alert("حدث خطأ أثناء حفظ القائمة. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsSavingSquad(false);
    }
  };

  const handlePrintCallList = () => {
    if (!selectedMatchForCall) return;
    setShowCallListPortal(true);
  };

  const getSelectedPlayersData = () => {
    return availablePlayers.filter(p => selectedPlayerIds.includes(p.player_id));
  };

  const getSelectedTeam = () => {
    if (!selectedMatchForCall) return null;
    return teams.find(t => t.team_id === selectedMatchForCall.team_id);
  };

  const getCoachNameForMatch = (match: any) => {
    if (!match) return 'غير محدد';
    const team = teams.find(t => t.team_id === match.team_id);
    if (!team) return 'غير محدد';
    const coach = coaches.find(c => c.coach_id === team.coach_id);
    return coach ? coach.name : 'غير محدد';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">إدارة المباريات</h2>
          <p className="text-zinc-400 mt-1">جدولة المباريات وتسجيل النتائج والإحصائيات.</p>
        </div>
        <Button onClick={() => { setEditingMatch(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          إضافة مباراة جديدة
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-zinc-500">جاري التحميل...</div>
        ) : matches.map((match) => (
          <Card key={match.match_id} className="bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800/50">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-lg font-bold text-zinc-50">{getTeamName(match.team_id)}</CardTitle>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${match.result === 'لم تلعب بعد' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-300'
                }`}>
                {match.result === 'لم تلعب بعد' ? 'قادمة' : 'مكتملة'}
              </span>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <div className="text-center flex-1">
                  <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-2 border-2 border-emerald-500/20">
                    <Shield className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="font-bold text-zinc-50">الأكاديمية</p>
                </div>

                <div className="flex-1 text-center px-4">
                  <div className="text-sm text-zinc-400 mb-2">{match.type || 'ودية'}</div>
                  <div className="text-3xl font-black text-zinc-50 tracking-widest mb-1">
                    {match.score || 'VS'}
                  </div>
                  {match.result && match.result !== 'لم تلعب بعد' && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${match.result === 'فوز' ? 'bg-emerald-500/20 text-emerald-500' :
                      match.result === 'تعادل' ? 'bg-amber-500/20 text-amber-500' :
                        match.result === 'خسارة' ? 'bg-rose-500/20 text-rose-500' :
                          'bg-zinc-800 text-zinc-400'
                      }`}>
                      {match.result}
                    </span>
                  )}
                </div>

                <div className="text-center flex-1">
                  <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-2 border-2 border-zinc-700">
                    <Shield className="h-8 w-8 text-zinc-400" />
                  </div>
                  <p className="font-bold text-zinc-400">{match.opponent}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-800/50">
                <div className="flex items-center text-sm text-zinc-400">
                  <Calendar className="mr-2 h-4 w-4 text-zinc-500" />
                  {match.match_date}
                  <span className="mr-2 text-xs text-zinc-500">({match.time || '00:00'})</span>
                </div>
                <div className="flex items-center text-sm text-zinc-400">
                  <MapPin className="mr-2 h-4 w-4 text-zinc-500" />
                  {match.location}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {matchesWithSquads.includes(match.match_id) ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenCallPlayers(match)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      عرض القائمة
                    </Button>
                    <Button
                      onClick={() => handleOpenCallPlayers(match)}
                      variant="outline"
                      className="flex-1 border-emerald-600 text-emerald-500 hover:bg-emerald-600/10"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      تعديل
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleOpenCallPlayers(match)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    استدعاء اللاعبين
                  </Button>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => handleEditMatch(match)} className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50">
                    تعديل
                  </Button>
                  <Button variant="outline" onClick={() => handleDeleteMatch(match.match_id)} className="flex-1 border-zinc-800 text-zinc-300 hover:bg-rose-900/20 hover:text-rose-400 hover:border-rose-900/50">
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingMatch(null); }} title={editingMatch ? "تعديل بيانات المباراة" : "إضافة مباراة جديدة"}>
        <form onSubmit={handleAddMatch} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">الفئة / الفوج</label>
            <select required name="team_id" defaultValue={editingMatch?.team_id} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
              <option value="">اختر الفئة / الفوج</option>
              {teams.map(team => (
                <option key={team.team_id} value={team.team_id}>{team.category} - {team.team_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">الفريق الخصم</label>
            <input required name="opponent" defaultValue={editingMatch?.opponent} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="اسم الفريق الخصم" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">التاريخ</label>
              <input required name="match_date" defaultValue={editingMatch?.match_date} type="date" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الوقت</label>
              <input required name="time" defaultValue={editingMatch?.time || '00:00'} type="time" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">نوع المباراة</label>
              <select name="type" defaultValue={editingMatch?.type || 'ودية'} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="ودية">ودية</option>
                <option value="رسمية">رسمية</option>
                <option value="بطولة">بطولة</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الملعب</label>
              <input required name="location" defaultValue={editingMatch?.location} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="مثال: الملعب الرئيسي" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">النتيجة (أهداف)</label>
              <input name="score" defaultValue={editingMatch?.score || '- - -'} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="مثال: 2 - 1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">النتيجة النهائية</label>
              <select name="result" defaultValue={editingMatch?.result || 'لم تلعب بعد'} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="لم تلعب بعد">لم تلعب بعد</option>
                <option value="فوز">فوز</option>
                <option value="تعادل">تعادل</option>
                <option value="خسارة">خسارة</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الحالة</label>
              <select name="status" defaultValue={editingMatch?.status || 'قادمة'} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="قادمة">قادمة</option>
                <option value="جارية">جارية</option>
                <option value="منتهية">منتهية</option>
                <option value="ملغاة">ملغاة</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">ملاحظات</label>
            <textarea name="notes" defaultValue={editingMatch?.notes} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="أي ملاحظات إضافية..." />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingMatch(null); }} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">{editingMatch ? "تحديث المباراة" : "حفظ المباراة"}</Button>
          </div>
        </form>
      </Modal>

      {/* Call Players Modal */}
      <Modal
        isOpen={isCallPlayersModalOpen}
        onClose={() => setIsCallPlayersModalOpen(false)}
        title="استدعاء اللاعبين للمباراة"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-zinc-400">
              حدد اللاعبين الذين سيشاركون في المباراة ضد
              <span className="text-emerald-500 font-bold mx-1">{selectedMatchForCall?.opponent}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllPlayers}
              className="text-xs border-zinc-700 text-zinc-300"
            >
              {selectedPlayerIds.length === availablePlayers.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-zinc-800 rounded-md p-2 space-y-1 bg-zinc-900/30">
            {availablePlayers.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">لا يوجد لاعبين متاحين لهذه الفئة</p>
            ) : (
              availablePlayers.map(player => (
                <div
                  key={player.player_id}
                  onClick={() => handleTogglePlayerSelection(player.player_id)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedPlayerIds.includes(player.player_id)
                    ? 'bg-emerald-500/20 border border-emerald-500/50'
                    : 'hover:bg-zinc-800 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedPlayerIds.includes(player.player_id)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600'
                      }`}>
                      {selectedPlayerIds.includes(player.player_id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-200">{player.name}</p>
                      <p className="text-xs text-zinc-500">{player.category}</p>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    {player.phone}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-zinc-800">
            <div className="flex-1 flex items-center text-sm text-zinc-400">
              تم تحديد <span className="text-emerald-500 font-bold mx-1">{selectedPlayerIds.length}</span> لاعب
            </div>
            <Button variant="outline" onClick={() => setIsCallPlayersModalOpen(false)} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button
              onClick={handleSaveSquad}
              disabled={isSavingSquad}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSavingSquad ? 'جاري الحفظ...' : 'حفظ القائمة'}
            </Button>
            <Button
              onClick={handlePrintCallList}
              disabled={selectedPlayerIds.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Printer className="mr-2 h-4 w-4" />
              معاينة وطباعة القائمة
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف المباراة"
        message="هل أنت متأكد من حذف هذه المباراة؟ سيؤدي هذا الإجراء إلى حذف كافة البيانات المرتبطة بها بشكل دائم."
      />

      {selectedMatchForCall && showCallListPortal && (
        <PrintPortal
          onClose={() => setShowCallListPortal(false)}
          title={`قائمة استدعاء - ${getTeamName(selectedMatchForCall.team_id)}`}
          fileName={`MatchCall-${getTeamName(selectedMatchForCall.team_id)}-${selectedMatchForCall.match_date}`}
          id="match-call-list"
        >
          <div className="bg-white p-4">
            <MatchCallListTemplate
              match={selectedMatchForCall}
              players={getSelectedPlayersData()}
              teamName={getSelectedTeam()?.team_name || ''}
              coachName={getCoachNameForMatch(selectedMatchForCall)}
              academySettings={academySettings}
            />
          </div>
        </PrintPortal>
      )}
    </div>
  );
}

function Shield(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}
