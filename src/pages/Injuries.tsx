import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Stethoscope, Calendar, AlertCircle, Search, QrCode } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { QRScannerModal } from "@/components/QRScannerModal";

export function Injuries() {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach';
  const isDoctor = user?.role === 'staff_doctor';
  const [injuries, setInjuries] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingInjury, setEditingInjury] = useState<any>(null);
  const [injuryToDelete, setInjuryToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamForFiltering, setSelectedTeamForFiltering] = useState<string>("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    let injuriesData: any[] = [], playersData: any[] = [], teamsData: any[] = [], catsData: any[] = [];

    try { injuriesData = await api.getInjuries(); } catch (e) { console.error('injuries:', e); }
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

      setInjuries(injuriesData.filter(i => coachPlayerIds.includes(Number(i.player_id))));
      setPlayers(coachPlayers);
      setTeams(coachTeams);
      setCategories(catsData.filter(c => uniqueCoachCats.includes(c.name)));
    } else {
      setInjuries(injuriesData);
      setPlayers(playersData);
      setTeams(teamsData);
      setCategories(catsData);
    }
    setIsLoading(false);
  };

  const handleAddInjury = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const injuryData = {
      player_id: Number(formData.get("player_id")),
      injury_type: formData.get("injury_type") as string,
      severity: formData.get("severity") as string,
      date_occurred: formData.get("date_occurred") as string,
      expected_recovery: formData.get("expected_recovery") as string,
      status: editingInjury ? editingInjury.status : "قيد العلاج",
      notes: formData.get("notes") as string,
    };

    try {
      if (editingInjury) {
        await api.updateInjury(editingInjury.injury_id, injuryData);
      } else {
        await api.addInjury(injuryData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingInjury(null);
    } catch (error) {
      console.error("Failed to save injury:", error);
    }
  };

  const handleDeleteInjury = async (id: number) => {
    setInjuryToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (injuryToDelete) {
      try {
        await api.deleteInjury(injuryToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete injury:", error);
      } finally {
        setInjuryToDelete(null);
      }
    }
  };

  const handleEditInjury = (injury: any) => {
    setEditingInjury(injury);
    setIsModalOpen(true);
  };

  const getPlayerName = (id: number) => {
    const player = players.find(p => p.player_id === id);
    return player ? player.name : "غير محدد";
  };

  const filteredInjuries = injuries.filter(i => {
    const player = players.find(p => p.player_id === i.player_id);
    const playerName = player ? player.name.toLowerCase() : "غير محدد";
    return playerName.includes(searchTerm.toLowerCase()) ||
      String(i.player_id).includes(searchTerm) ||
      (player?.qr_code || "").includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">سجل الإصابات</h2>
          <p className="text-zinc-400 mt-1">متابعة الحالة الطبية للاعبين وتواريخ التعافي المتوقعة.</p>
        </div>
        {(isCoach || isDoctor) && (
          <Button onClick={() => { setEditingInjury(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            تسجيل إصابة جديدة
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-zinc-900/40 p-3 sm:p-4 rounded-xl border border-zinc-800/50">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="بحث عن تاريخ طبي (اسم اللاعب أو QR)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-10 pl-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <Button variant="outline" onClick={() => setIsQrScannerOpen(true)} className="h-10 border-zinc-800 text-zinc-400 hover:text-emerald-500">
          <QrCode className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-zinc-500">جاري التحميل...</div>
        ) : filteredInjuries.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 italic border-2 border-dashed border-zinc-800 rounded-xl">لا توجد سجلات طبية تطابق البحث</div>
        ) : filteredInjuries.map((injury) => (
          <Card key={injury.injury_id} className="bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 transition-all duration-200">
            <CardHeader className="flex flex-row items-start justify-between pb-2 border-b border-zinc-800/50">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-50">{getPlayerName(injury.player_id)}</CardTitle>
                <p className="text-sm text-zinc-400 mt-1">{injury.severity}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${injury.status === 'جاهز' ? 'bg-emerald-500/10 text-emerald-500' :
                injury.status === 'تعافي جزئي' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20'
                }`}>
                {injury.status}
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-5 w-5 text-rose-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">نوع الإصابة</p>
                    <p className="text-base font-bold text-zinc-50">{injury.injury_type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-zinc-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-zinc-400">تاريخ الإصابة</p>
                      <p className="text-sm text-zinc-300">{injury.date_occurred}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-zinc-400">التعافي المتوقع</p>
                      <p className="text-sm text-zinc-300">{injury.expected_recovery}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/50 p-3 rounded-md border border-zinc-800/50">
                  <p className="text-xs font-medium text-zinc-400 mb-1">ملاحظات طبية:</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{injury.notes}</p>
                </div>

                {(isCoach || isDoctor) && (
                  <div className="pt-4 flex gap-2">
                    <Button variant="outline" onClick={() => handleEditInjury(injury)} className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50">
                      تعديل
                    </Button>
                    <Button variant="outline" onClick={() => handleDeleteInjury(injury.injury_id)} className="flex-1 border-zinc-800 text-zinc-300 hover:bg-rose-900/20 hover:text-rose-400 hover:border-rose-900/50">
                      حذف
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingInjury(null); }} title={editingInjury ? "تعديل بيانات الإصابة" : "تسجيل إصابة جديدة"}>
        <form onSubmit={handleAddInjury} className="space-y-4">
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
              <select required name="player_id" defaultValue={editingInjury?.player_id} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">نوع الإصابة</label>
            <input required name="injury_type" defaultValue={editingInjury?.injury_type} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="مثال: تمزق عضلي" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">الشدة</label>
            <select name="severity" defaultValue={editingInjury?.severity} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
              <option value="خفيفة">خفيفة</option>
              <option value="متوسطة">متوسطة</option>
              <option value="شديدة">شديدة</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">تاريخ الإصابة</label>
              <input required name="date_occurred" defaultValue={editingInjury?.date_occurred} type="date" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">التعافي المتوقع</label>
              <input required name="expected_recovery" defaultValue={editingInjury?.expected_recovery} type="date" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">ملاحظات طبية</label>
            <textarea required name="notes" defaultValue={editingInjury?.notes} rows={3} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="أدخل أي ملاحظات طبية أو خطة علاجية..."></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingInjury(null); }} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">{editingInjury ? "تحديث البيانات" : "تسجيل الإصابة"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف السجل الطبي"
        message="هل أنت متأكد من حذف هذا السجل الطبي؟ سيؤدي هذا الإجراء إلى حذف كافة البيانات المرتبطة به بشكل دائم."
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
