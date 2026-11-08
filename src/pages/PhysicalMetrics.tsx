import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, Trash2, Activity, Ruler, Weight, TrendingUp, QrCode } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { useSearchParams } from "react-router-dom";
import { QRScannerModal } from "@/components/QRScannerModal";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from "recharts";

export function PhysicalMetrics() {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach';
  const [searchParams] = useSearchParams();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [metricToDelete, setMetricToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [selectedPlayerForChart, setSelectedPlayerForChart] = useState<number | null>(
    searchParams.get('player_id') ? Number(searchParams.get('player_id')) : null
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamForFiltering, setSelectedTeamForFiltering] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metricsData, playersData, teamsData, catsData] = await Promise.all([
        api.getPhysicalMetrics(),
        api.getPlayers(),
        api.getTeams(),
        api.getCategories()
      ]);
      setMetrics(metricsData);
      setTeams(teamsData);
      setCategories(catsData);

      if (user?.role === 'coach' && user.coach_id) {
        const coachTeams = teamsData.filter((t: any) =>
          Number(t.coach_id) === Number(user.coach_id) ||
          (user.category && t.category === user.category)
        );
        const coachTeamIds = coachTeams.map((t: any) => Number(t.team_id));
        const coachPlayers = playersData.filter((p: any) =>
          coachTeamIds.includes(Number(p.team_id)) ||
          (user.category && p.category === user.category)
        );
        const coachPlayerIds = coachPlayers.map((p: any) => Number(p.player_id));
        
        setMetrics(metricsData.filter((m: any) => coachPlayerIds.includes(Number(m.player_id))));
        setPlayers(coachPlayers);
      } else {
        setPlayers(playersData);
      }
    } catch (error) {
      console.error("Failed to load metrics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleAddMetric = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const height = Number(formData.get("height"));
    const weight = Number(formData.get("weight"));
    const bmi = height > 0 ? (weight / ((height / 100) ** 2)).toFixed(1) : 0;

    const metricData = {
      player_id: Number(formData.get("player_id")),
      record_date: formData.get("record_date") as string,
      height,
      weight,
      bmi: Number(bmi),
      notes: formData.get("notes") as string,
    };

    try {
      await api.addPhysicalMetric(metricData);
      await loadData();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save metric:", error);
      alert("خطأ أثناء الحفظ. تأكد من إعداد جدول physical_metrics");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMetric = async (id: number) => {
    setMetricToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (metricToDelete) {
      try {
        await api.deletePhysicalMetric(metricToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete metric:", error);
      } finally {
        setMetricToDelete(null);
      }
    }
  };

  const getPlayerName = (id: number) => {
    return players.find(p => p.player_id === id)?.name || "غير محدد";
  };

  const filteredMetrics = metrics.filter(m => {
    const player = players.find(p => p.player_id === m.player_id);
    const playerName = player ? player.name.toLowerCase() : "غير محدد";
    return playerName.includes(searchQuery.toLowerCase()) || 
           String(m.player_id).includes(searchQuery);
  });

  const chartData = selectedPlayerForChart 
    ? metrics
        .filter(m => m.player_id === selectedPlayerForChart)
        .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime())
        .map(m => ({
          date: m.record_date,
          height: m.height,
          weight: m.weight,
          bmi: m.bmi
        }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 font-tajawal">القياسات البدنية</h2>
          <p className="text-zinc-400 mt-1 text-sm font-tajawal">متابعة الطول، الوزن، ومؤشر كتلة الجسم لتطور نمو اللاعبين.</p>
        </div>
        {isCoach && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-tajawal">
            <Plus className="ml-2 h-4 w-4" />
            تسجيل قياس جديد
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics & Chart Section */}
        <Card className="lg:col-span-2 bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50">
            <CardTitle className="text-lg font-bold text-zinc-50 flex items-center gap-2 font-tajawal">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              منحنى التطور البدني
            </CardTitle>
            <select 
              className="bg-zinc-950 border border-zinc-800 rounded-md text-xs p-2 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              onChange={(e) => setSelectedPlayerForChart(Number(e.target.value))}
              value={selectedPlayerForChart || ""}
            >
              <option value="">اختر لاعباً للمتابعة</option>
              {players.map(p => (
                <option key={p.player_id} value={p.player_id}>{p.name}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="pt-6 h-[350px]">
            {selectedPlayerForChart ? (
              chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Area name="الطول (سم)" type="monotone" dataKey="height" stroke="#10b981" fillOpacity={1} fill="url(#colorHeight)" strokeWidth={2} />
                    <Area name="الوزن (كغ)" type="monotone" dataKey="weight" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <Activity className="h-12 w-12 opacity-20" />
                  <p className="font-tajawal">يحتاج اللاعب إلى تسجيلين على الأقل لإظهار المنحنى</p>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 font-tajawal italic">
                يرجى اختيار لاعب من القائمة لعرض منحنى تطوره
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Summary Cards */}
        <div className="space-y-4">
          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Ruler className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider font-tajawal">متوسط الطول</p>
                <p className="text-2xl font-black text-white">
                  {(metrics.reduce((acc, m) => acc + m.height, 0) / (metrics.length || 1)).toFixed(1)} <span className="text-sm font-normal text-zinc-400">سم</span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                <Weight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider font-tajawal">متوسط الوزن</p>
                <p className="text-2xl font-black text-white">
                  {(metrics.reduce((acc, m) => acc + m.weight, 0) / (metrics.length || 1)).toFixed(1)} <span className="text-sm font-normal text-zinc-400">كغ</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-0">
          <div className="flex items-center p-4 border-b border-zinc-800/50 gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="بحث عن لاعب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-10 pl-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-tajawal"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right font-tajawal">
              <thead className="text-xs text-zinc-400 bg-zinc-950/50 border-b border-zinc-800/50">
                <tr>
                  <th className="px-6 py-4 font-medium">اللاعب</th>
                  <th className="px-6 py-4 font-medium">التاريخ</th>
                  <th className="px-6 py-4 font-medium text-center">الطول (سم)</th>
                  <th className="px-6 py-4 font-medium text-center">الوزن (كغ)</th>
                  <th className="px-6 py-4 font-medium text-center">BMI</th>
                  <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">جاري التحميل...</td></tr>
                ) : filteredMetrics.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">لا توجد سجلات قياس</td></tr>
                ) : filteredMetrics.map((m) => (
                  <tr key={m.metric_id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-50">{getPlayerName(m.player_id)}</td>
                    <td className="px-6 py-4 text-zinc-400">{m.record_date}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-500">{m.height}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-500">{m.weight}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${m.bmi < 18.5 ? 'bg-amber-500/10 text-amber-500' : m.bmi < 25 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {m.bmi}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      {isCoach && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMetric(m.metric_id)} className="text-zinc-500 hover:text-rose-500">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تسجيل قياس بدني جديد">
        <form onSubmit={handleAddMetric} className="space-y-4 font-tajawal text-right">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الفئة للمساعدة</label>
              <select 
                onChange={(e) => setSelectedTeamForFiltering(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-zinc-100"
              >
                <option value="">كل الفئات</option>
                {categories.map(c => <option key={c.category_id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">اللاعب *</label>
              <select required name="player_id" className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-zinc-100">
                <option value="">اختر اللاعب</option>
                {players.filter(p => !selectedTeamForFiltering || p.category === selectedTeamForFiltering).map(p => (
                  <option key={p.player_id} value={p.player_id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الطول (سم) *</label>
              <input required name="height" type="number" step="0.1" className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-zinc-100" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الوزن (كغ) *</label>
              <input required name="weight" type="number" step="0.1" className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-zinc-100" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">تاريخ القياس *</label>
            <input required name="record_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-zinc-100 text-right" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">ملاحظات (اختياري)</label>
            <textarea name="notes" rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-zinc-100" />
          </div>
          <div className="pt-4 flex justify-start gap-2">
             <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
               {isSaving ? "جاري الحفظ..." : "حفظ القياس"}
             </Button>
             <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-zinc-800 text-zinc-400">إلغاء</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف السجل"
        message="هل أنت متأكد من حذف هذا السجل؟"
      />
    </div>
  );
}
