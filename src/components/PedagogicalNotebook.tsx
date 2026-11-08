import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/services/AuthContext';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area 
} from 'recharts';
import { 
  ClipboardList, TrendingUp, Save, Star, LayoutDashboard, History, 
  MessageSquare, UserCircle, Activity, Target, ShieldCheck, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface PedagogicalNotebookProps {
  player: any;
  isCoach?: boolean;
}

type TabType = 'overview' | 'progress' | 'history' | 'add';

export const PedagogicalNotebook: React.FC<PedagogicalNotebookProps> = ({ player, isCoach }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // New report form state
  const [formData, setFormData] = useState({
    technical_level: 5,
    tactical_level: 5,
    physical_level: 5,
    discipline_level: 5,
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
    notes: ''
  });

  useEffect(() => {
    if (player?.player_id || player?.id) {
      loadReports();
    }
  }, [player?.player_id, player?.id]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.getPedagogicalReports(player.player_id || player.id);
      setReports(data || []);
    } catch (error) {
      console.error("Error loading pedagogical reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      let finalCoachId = null;
      if (user?.role === 'coach') {
        finalCoachId = user.coach_id || (typeof user.id === 'string' && user.id.startsWith('coach-') ? parseInt(user.id.split('-')[1]) : null);
      }

      await api.createPedagogicalReport({
        player_id: player.player_id || player.id,
        coach_id: finalCoachId,
        ...formData
      });
      setActiveTab('overview');
      loadReports();
    } catch (error) {
      console.error("Save error:", error);
      alert("خطأ في حفظ التقييم");
    }
  };

  const getOverallRating = () => {
    if (reports.length === 0) return 0;
    const latest = reports[0];
    const total = (latest.technical_level + latest.tactical_level + latest.physical_level + latest.discipline_level) / 4;
    return Math.round(total * 10);
  };

  const getDetailedStats = (report = reports[0]) => {
    if (!report) return { pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0 };
    return {
      notes: report.notes,
      // Use provided FIFA-style stats or calculate from levels
      pace: report.pace ?? (report.physical_level * 10),
      shooting: report.shooting ?? (report.technical_level * 10),
      passing: report.passing ?? (report.technical_level * 10),
      dribbling: report.dribbling ?? (report.technical_level * 10),
      defending: report.defending ?? (report.tactical_level * 10),
      physical_status: report.physical ?? (report.physical_level * 10)
    };
  };

  const getRadarData = () => {
    const stats = getDetailedStats();
    return [
      { subject: 'السرعة', A: stats.pace / 10, fullMark: 10 },
      { subject: 'التسديد', A: stats.shooting / 10, fullMark: 10 },
      { subject: 'التمرير', A: stats.passing / 10, fullMark: 10 },
      { subject: 'المراوغة', A: stats.dribbling / 10, fullMark: 10 },
      { subject: 'الدفاع', A: stats.defending / 10, fullMark: 10 },
      { subject: 'البدني', A: stats.physical / 10, fullMark: 10 },
    ];
  };

  const getLineData = () => {
    return [...reports].reverse().map(r => ({
      date: new Date(r.created_at).toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' }),
      بدني: r.physical_level,
      تقني: r.technical_level,
      تكتيكي: r.tactical_level,
      انضباط: r.discipline_level,
    }));
  };

  const tabs = [
    { id: 'overview', label: 'الإحصائيات', icon: LayoutDashboard },
    { id: 'progress', label: 'التطور', icon: TrendingUp },
    { id: 'history', label: 'السجل', icon: History },
    ...(isCoach ? [{ id: 'add', label: 'تقييم جديد', icon: Save }] : []),
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-bold">جاري تحميل البيانات البيداغوجية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Card Header - EA FC Style */}
      <div className="relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-zinc-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Card Visual */}
          <div className="relative w-48 h-64 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-2xl border-2 border-emerald-500/30 p-1 flex flex-col items-center justify-center shadow-xl group hover:scale-105 transition-transform duration-500">
            <div className="absolute top-4 left-4 text-center">
              <p className="text-4xl font-black text-white leading-none">{getOverallRating() || '--'}</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{player?.position || 'OVR'}</p>
            </div>
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-zinc-800 mb-2 mt-4">
              {player?.photo_url ? (
                <img src={player.photo_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <UserCircle className="w-full h-full p-4 text-zinc-700" />
              )}
            </div>
            <p className="text-sm font-black text-white text-center uppercase tracking-tighter">{player?.name?.split(' ')[0]}</p>
            <div className="flex gap-1 mt-2">
              <div className="w-4 h-2.5 bg-emerald-500/20 rounded-sm"></div>
              <div className="w-4 h-2.5 bg-emerald-500/20 rounded-sm"></div>
              <div className="w-4 h-2.5 bg-emerald-500/20 rounded-sm"></div>
            </div>
          </div>

          {/* Info & Badges */}
          <div className="flex-1 space-y-6 text-center md:text-right">
            <div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                {getOverallRating() > 80 && <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black rounded-full border border-yellow-500/20 flex items-center gap-1"><Star size={10} fill="currentColor" /> لاعب متميز</span>}
                {reports.length > 5 && <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black rounded-full border border-blue-500/20 flex items-center gap-1"><ShieldCheck size={10} /> جدار دفاعي</span>}
                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-black rounded-full border border-zinc-700 flex items-center gap-1 capitalize">{player?.category || 'بدون فئة'}</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-2">{player?.name}</h2>
              <p className="text-zinc-500 font-bold flex items-center justify-center md:justify-start gap-2">
                <Target size={16} className="text-emerald-500" /> {player?.position || 'مركز غير محدد'} • {player?.age || '--'} سنة
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-zinc-800/50 p-3 px-6 rounded-2xl border border-zinc-700/50">
                <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">القدم المفضلة</p>
                <p className="text-lg font-black text-white">{player?.preferred_foot === 'right' ? 'اليمنى' : (player?.preferred_foot === 'left' ? 'اليسرى' : 'كلتا القدمين')}</p>
              </div>
              <div className="bg-zinc-800/50 p-3 px-6 rounded-2xl border border-zinc-700/50">
                <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">عدد التقييمات</p>
                <p className="text-lg font-black text-white">{reports.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-4 no-scrollbar gap-2 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all duration-300",
              activeTab === tab.id 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 scale-105" 
                : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700"
            )}
          >
            <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-zinc-500")} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart Section */}
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden group">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Star className="text-yellow-500 w-5 h-5" /> البصمة الفنية
                  </h3>
                  <div className="text-[10px] text-zinc-500 font-bold px-2 py-1 bg-zinc-800 rounded-lg">آخر تحديث</div>
                </div>
                <CardContent className="h-[350px] p-0 relative">
                  {reports.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                        <PolarGrid stroke="#27272a" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                        <Radar 
                          name="المستوى" 
                          dataKey="A" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.5} 
                          className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <ClipboardList className="w-12 h-12 text-zinc-800" />
                      <p className="text-zinc-600 text-sm">لا توجد بيانات متاحة</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats Grid - Detailed 6 Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'السرعة', val: getDetailedStats().pace, icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                  { label: 'التسديد', val: getDetailedStats().shooting, icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                  { label: 'التمرير', val: getDetailedStats().passing, icon: UserCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'المراوغة', val: getDetailedStats().dribbling, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                  { label: 'الدفاع', val: getDetailedStats().defending, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'البدني', val: getDetailedStats().physical, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((item, idx) => (
                  <Card key={idx} className="bg-zinc-900 border-zinc-800 group hover:border-zinc-700 transition-all overflow-hidden relative">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-all", item.bg, item.color)}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-black mb-1">{item.label}</p>
                      <span className="text-xl font-black text-white">{item.val}</span>
                      <div className="absolute bottom-0 left-0 h-1 bg-zinc-800 w-full">
                        <div className={cn("h-full transition-all duration-1000", item.color.replace('text', 'bg'))} style={{ width: `${item.val}%` }}></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Latest Notes - Full Width on Mobile */}
              <div className="lg:col-span-2">
                <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-500" /> آخر ملاحظات المدرب
                    </h3>
                  </div>
                  <CardContent className="p-0">
                    {reports.length > 0 ? (
                      <div className="divide-y divide-zinc-800">
                        {reports.slice(0, 3).map((report, i) => (
                          <div key={i} className="p-6 hover:bg-zinc-800/20 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                  <UserCircle className="w-5 h-5 text-zinc-500" />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-white">{report.coach?.username || 'مدرب الأكاديمية'}</p>
                                  <p className="text-[10px] text-zinc-500 font-bold">{new Date(report.created_at).toLocaleDateString('ar-DZ')}</p>
                                </div>
                              </div>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed text-right">{report.notes || "لا توجد ملاحظات تقنية مكتوبة."}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-zinc-600 text-xs font-bold">لا توجد ملاحظات مسجلة بعد</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <TrendingUp className="text-emerald-500 w-5 h-5" /> مسار التطور التقني والبدني
                </h3>
              </div>
              <CardContent className="h-[400px] p-4 pt-12">
                {reports.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getLineData()}>
                      <defs>
                        <linearGradient id="colorTech" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                      <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="تقني" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTech)" />
                      <Area type="monotone" dataKey="بدني" stroke="#3b82f6" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <Activity className="w-12 h-12 text-zinc-800" />
                    <p className="text-zinc-600 text-sm font-bold">نحتاج إلى تقييمين على الأقل لإظهار منحنى التطور</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {reports.map((report, idx) => (
                <Card key={idx} className="bg-zinc-900 border-zinc-800 group hover:border-emerald-500/30 transition-all overflow-hidden">
                  <div className="p-5 flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 flex md:flex-col gap-2 md:w-32 border-b md:border-b-0 md:border-l border-zinc-800 pb-4 md:pb-0 md:pl-4">
                      <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{new Date(report.created_at).toLocaleDateString('ar-DZ')}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-black text-white">{( (report.technical_level + report.physical_level + report.tactical_level + report.discipline_level) / 4 ).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { l: 'تقني', v: report.technical_level, c: 'bg-blue-500' },
                          { l: 'بدني', v: report.physical_level, c: 'bg-emerald-500' },
                          { l: 'تكتيكي', v: report.tactical_level, c: 'bg-purple-500' },
                          { l: 'انضباط', v: report.discipline_level, c: 'bg-amber-500' },
                        ].map((s, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[8px] text-zinc-500 font-black text-center">{s.l}</p>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-1000", s.c)} style={{ width: `${s.v * 10}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">{report.notes || "لا توجد ملاحظات."}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {reports.length === 0 && (
                <div className="py-20 text-center bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-3xl">
                  <History className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-600 font-bold">لا يوجد سجل تقييمات لهذا اللاعب</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && isCoach && (
            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Save className="text-emerald-500 w-5 h-5" /> إضافة تقييم بيداغوجي جديد
                </h3>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { key: 'pace', label: 'السرعة (Pace)', icon: Activity, color: 'accent-rose-500', max: 100, step: 1 },
                    { key: 'shooting', label: 'التسديد (Shooting)', icon: Target, color: 'accent-orange-500', max: 100, step: 1 },
                    { key: 'passing', label: 'التمرير (Passing)', icon: UserCircle, color: 'accent-blue-500', max: 100, step: 1 },
                    { key: 'dribbling', label: 'المراوغة (Dribbling)', icon: Star, color: 'accent-yellow-500', max: 100, step: 1 },
                    { key: 'defending', label: 'الدفاع (Defending)', icon: ShieldCheck, color: 'accent-emerald-500', max: 100, step: 1 },
                    { key: 'physical', label: 'البدني (Physical)', icon: Activity, color: 'accent-purple-500', max: 100, step: 1 },
                  ].map((field) => (
                    <div key={field.key} className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-black text-zinc-300 flex items-center gap-2">
                          <field.icon className="w-4 h-4 text-zinc-500" /> {field.label}
                        </label>
                        <span className="text-lg font-black text-emerald-500">{(formData as any)[field.key]}</span>
                      </div>
                      <input 
                        type="range" min="1" max={field.max} step={field.step}
                        value={(formData as any)[field.key]} 
                        onChange={(e) => setFormData({...formData, [field.key]: parseFloat(e.target.value)})}
                        className={cn("w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer", field.color)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-zinc-800">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6">التقييم السلوكي والانضباط</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { key: 'discipline_level', label: 'الانضباط والسلوك', icon: ShieldCheck, color: 'accent-amber-500', max: 10, step: 0.5 },
                      { key: 'tactical_level', label: 'الوعي التكتيكي', icon: LayoutDashboard, color: 'accent-purple-500', max: 10, step: 0.5 },
                    ].map((field) => (
                      <div key={field.key} className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-sm font-black text-zinc-300 flex items-center gap-2">
                            <field.icon className="w-4 h-4 text-zinc-500" /> {field.label}
                          </label>
                          <span className="text-lg font-black text-amber-500">{(formData as any)[field.key]}/10</span>
                        </div>
                        <input 
                          type="range" min="1" max={field.max} step={field.step}
                          value={(formData as any)[field.key]} 
                          onChange={(e) => setFormData({...formData, [field.key]: parseFloat(e.target.value)})}
                          className={cn("w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer", field.color)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-zinc-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-zinc-500" /> ملاحظات المدرب التقنية
                  </label>
                  <textarea 
                    placeholder="اكتب ملاحظاتك حول نقاط القوة والضعف..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-emerald-500 transition-colors min-h-[120px] text-right"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-16 rounded-2xl shadow-xl shadow-emerald-950/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Save className="w-6 h-6" />
                  <span>حفظ وإرسال التقييم للأولياء</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
};
