import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Award, Star, Trophy, Calendar, Target, Zap, Trash2, User, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";

export function PlayerBadges() {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach';
  const [playerBadges, setPlayerBadges] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pbData, bData, pData] = await Promise.all([
        api.getPlayerBadges(),
        api.getBadges(),
        api.getPlayers()
      ]);
      setPlayerBadges(pbData);
      setBadges(bData);
      setPlayers(pData);
    } catch (error) {
      console.error("Failed to load badges data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAwardBadge = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const award = {
      player_id: Number(formData.get("player_id")),
      badge_id: Number(formData.get("badge_id")),
      awarded_by: user?.username || "Admin",
      notes: formData.get("notes") as string,
      awarded_date: new Date().toISOString().split('T')[0]
    };

    try {
      await api.awardBadge(award);
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to award badge:", error);
    }
  };

  const deleteAward = (id: number) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await api.deletePlayerBadge(itemToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete badge award:", error);
      } finally {
        setItemToDelete(null);
        setIsConfirmOpen(false);
      }
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return <Trophy className="h-5 w-5 text-amber-500" />;
      case 'Calendar': return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'Target': return <Target className="h-5 w-5 text-rose-500" />;
      case 'Star': return <Star className="h-5 w-5 text-yellow-500" />;
      case 'Zap': return <Zap className="h-5 w-5 text-emerald-500" />;
      default: return <Award className="h-5 w-5 text-zinc-400" />;
    }
  };

  const filteredAwards = playerBadges.filter(pb => {
      const playerName = players.find(p => p.player_id === pb.player_id)?.name || "";
      return playerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 font-tajawal">شارات التميز 🏅</h2>
          <p className="text-zinc-400 mt-1">تكريم اللاعبين المتميزين ومنحهم شارات الاستحقاق.</p>
        </div>
        {isCoach && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            منح شارة تميز
          </Button>
        )}
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader className="border-b border-zinc-800/50">
           <div className="relative max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                 type="text" 
                 placeholder="بحث عن لاعب..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-10 pl-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 font-tajawal"
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right font-tajawal">
              <thead className="text-xs text-zinc-400 bg-zinc-950/50 border-b border-zinc-800/50">
                <tr>
                  <th className="px-6 py-4 font-medium">اللاعب</th>
                  <th className="px-6 py-4 font-medium">الشارة</th>
                  <th className="px-6 py-4 font-medium">التاريخ</th>
                  <th className="px-6 py-4 font-medium">بواسطة</th>
                  <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center">جاري التحميل...</td></tr>
                ) : filteredAwards.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500 italic">لا توجد شارات ممنوحة حالياً</td></tr>
                ) : filteredAwards.map((pb) => (
                  <tr key={pb.id} className="hover:bg-zinc-800/20 transition-all group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 overflow-hidden">
                             {players.find(p => p.player_id === pb.player_id)?.photo_url ? <img src={players.find(p => p.player_id === pb.player_id)?.photo_url} className="h-full w-full object-cover" /> : <User className="h-4 w-4" />}
                          </div>
                          <span className="font-bold text-zinc-100">{players.find(p => p.player_id === pb.player_id)?.name || "غير معروف"}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
                             {getIcon(pb.badges?.icon)}
                          </span>
                          <span className="font-bold text-amber-500">{pb.badges?.name}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{pb.awarded_date}</td>
                    <td className="px-6 py-4 text-zinc-400">{pb.awarded_by}</td>
                    <td className="px-6 py-4 text-left">
                       {isCoach && (
                         <Button variant="ghost" size="icon" onClick={() => deleteAward(pb.id)} className="text-zinc-500 hover:text-rose-500">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="منح شارة تميز">
        <form onSubmit={handleAwardBadge} className="space-y-4 font-tajawal text-right">
           <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">اختر اللاعب *</label>
              <select required name="player_id" className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-zinc-100">
                 <option value="">اختر اللاعب</option>
                 {players.map(p => <option key={p.player_id} value={p.player_id}>{p.name}</option>)}
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">اختر الشارة *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 {badges.map(b => (
                    <label key={b.badge_id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-amber-500 transition-all has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/5">
                       <input required type="radio" name="badge_id" value={b.badge_id} className="hidden" />
                       {getIcon(b.icon)}
                       <div className="text-right">
                          <p className="text-sm font-black text-zinc-100">{b.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate w-32">{b.description}</p>
                       </div>
                    </label>
                 ))}
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">ملاحظات إضافية (اختياري)</label>
              <textarea name="notes" rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-zinc-100" placeholder="مثال: أداء مذهل في دورة رمضان..." />
           </div>
           <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-6">
              منح الشارة الآن 🏅
           </Button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="سحب الشارة"
        message="هل أنت متأكد من سحب هذه الشارة من اللاعب؟ سيتم إزالتها من سجل إنجازاته."
      />
    </div>
  );
}
