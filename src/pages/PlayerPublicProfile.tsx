import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, supabase } from '@/services/api';
import { SkillRadarChart } from '@/components/SkillRadarChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Activity, Heart, Calendar, MapPin, Award, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FUTPlayerCard } from '@/components/FUTPlayerCard';

export function PlayerPublicProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState<any>(null);
  const [latestEval, setLatestEval] = useState<any>(null);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardTab, setActiveCardTab] = useState<'fut' | 'radar'>('fut');

  useEffect(() => {
    if (id) {
      loadPlayerData();
    }
  }, [id]);

  const loadPlayerData = async () => {
    setLoading(true);
    try {
      const pid = Number(id);
      const [p, evals, inj] = await Promise.all([
        api.getPlayerById(pid),
        api.getEvaluationsByPlayer(pid),
        supabase.from('injuries').select('*').eq('player_id', pid).order('date_occurred', { ascending: false })
      ]);
      
      setPlayer(p);
      setInjuries(inj.data || []);
      
      if (evals && evals.length > 0) {
        // Sort by date and get latest
        const latest = [...evals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        setLatestEval(latest);
      }
    } catch (error) {
      console.error("Error loading player data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        <div>اللاعب غير موجود</div>
      </div>
    );
  }

  const defaultSkills = {
    pace: latestEval?.pace || 50,
    shooting: latestEval?.shooting || 50,
    passing: latestEval?.passing || 50,
    dribbling: latestEval?.dribbling || 50,
    defending: latestEval?.defending || 50,
    physical: latestEval?.physical_status || 50,
  };

  const overall = Math.round(
    Object.values(defaultSkills).reduce((a, b) => a + b, 0) / 6
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-tajawal p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Block / HUD */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-800"></div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-emerald-500/20 overflow-hidden shadow-2xl">
                {player.photo_url ? (
                  <img src={player.photo_url} className="h-full w-full object-cover" alt={player.name} />
                ) : (
                  <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                    <User className="h-20 w-20 text-zinc-700" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-600 px-3 py-1 rounded-full text-sm font-black text-white shadow-lg border border-emerald-400/30">
                {overall} OVR
              </div>
            </div>

            <div className="flex-1 text-center md:text-right space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-white">{player.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-zinc-400">
                <span className="flex items-center gap-1 bg-zinc-800/50 px-3 py-1 rounded-lg text-sm">
                  <Award className="h-4 w-4 text-emerald-500" /> {player.category}
                </span>
                <span className="flex items-center gap-1 bg-zinc-800/50 px-3 py-1 rounded-lg text-sm">
                  <Activity className="h-4 w-4 text-blue-500" /> {player.position || 'N/A'}
                </span>
                <span className="flex items-center gap-1 bg-zinc-800/50 px-3 py-1 rounded-lg text-sm">
                  <Shield className="h-4 w-4 text-amber-500" /> #{player.jersey_number || '--'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Skills Card / FUT Card with Switcher */}
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-zinc-950 border-b border-zinc-800 py-3 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setActiveCardTab('fut')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 font-tajawal",
                    activeCardTab === 'fut'
                      ? "bg-amber-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" /> بطاقة EA FC ⭐
                </button>
                <button
                  onClick={() => setActiveCardTab('radar')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 font-tajawal",
                    activeCardTab === 'radar'
                      ? "bg-emerald-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Activity className="h-3.5 w-3.5" /> رادار المهارات
                </button>
              </div>
              <span className="text-xs font-bold text-zinc-500">
                {activeCardTab === 'fut' ? 'بطاقة اللاعب الرقمية' : 'التحليل البياني'}
              </span>
            </CardHeader>

            <CardContent className="p-6">
              {activeCardTab === 'fut' ? (
                <div className="flex justify-center py-2">
                  <FUTPlayerCard
                    player={{
                      name: player.name,
                      category: player.category,
                      position: player.position || 'FWD',
                      photoUrl: player.photo_url,
                      jerseyNumber: player.jersey_number,
                      rating: overall,
                      stats: {
                        pac: defaultSkills.pace,
                        sho: defaultSkills.shooting,
                        pas: defaultSkills.passing,
                        dri: defaultSkills.dribbling,
                        def: defaultSkills.defending,
                        phy: defaultSkills.physical,
                      },
                      academyName: "أكاديمية أجيال وادي العثمانية",
                      preferredFoot: player.preferred_foot,
                    }}
                    cardTheme="gold"
                    showActions={true}
                  />
                </div>
              ) : (
                <>
                  <SkillRadarChart skills={defaultSkills} />
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {Object.entries({
                      'السرعة': defaultSkills.pace,
                      'التسديد': defaultSkills.shooting,
                      'التمرير': defaultSkills.passing,
                      'المراوغة': defaultSkills.dribbling,
                      'الدفاع': defaultSkills.defending,
                      'البدني': defaultSkills.physical
                    }).map(([label, value]) => (
                      <div key={label} className="bg-zinc-950 p-3 rounded-2xl flex items-center justify-between border border-zinc-800/50 hover:border-emerald-500/30 transition-all">
                        <span className="text-zinc-500 text-xs font-bold uppercase">{label}</span>
                        <span className="text-zinc-100 font-black">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Physical & Biometric */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
              <CardHeader className="bg-zinc-950 border-b border-zinc-800 py-4">
                <CardTitle className="text-lg font-black text-blue-500 flex items-center gap-2">
                  <Activity className="h-5 w-5" /> القياسات الحيوية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">الطول (سم)</p>
                  <p className="text-xl font-black text-white">{player.height || '--'}</p>
                </div>
                <div className="text-center p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">الوزن (كغ)</p>
                  <p className="text-xl font-black text-white">{player.weight || '--'}</p>
                </div>
                <div className="text-center p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">فصيلة الدم</p>
                  <p className="text-xl font-black text-white">{player.blood_type || '--'}</p>
                </div>
                <div className="text-center p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">القدم المفضلة</p>
                  <p className="text-sm font-black text-white">{player.preferred_foot === 'right' ? 'اليمنى' : player.preferred_foot === 'left' ? 'اليسرى' : 'كلتاهما'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
               <CardHeader className="bg-zinc-950 border-b border-zinc-800 py-4">
                 <CardTitle className="text-lg font-black text-rose-500 flex items-center gap-2">
                   <Heart className="h-5 w-5" /> السجل الطبي والإصابات
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-4">
                  {player.medical_notes && (
                    <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl mb-4 text-xs italic text-zinc-400">
                      <span className="font-bold text-rose-500 block mb-1">ملاحظات طبية:</span>
                      {player.medical_notes}
                    </div>
                  )}

                  <div className="space-y-3">
                    {injuries.length === 0 ? (
                      <div className="text-center py-4 text-zinc-600 text-sm italic">لا يوجد سجل إصابات مسجل.</div>
                    ) : injuries.map(inj => (
                      <div key={inj.injury_id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/50 flex flex-col gap-1">
                         <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-zinc-200">{inj.injury_type}</span>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded uppercase font-black",
                              inj.status === 'نشط' || inj.status === 'قيد العلاج' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>{inj.status}</span>
                         </div>
                         <div className="flex gap-4 text-[10px] text-zinc-500">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {inj.date_occurred}</span>
                            {inj.expected_return && <span className="flex items-center gap-1">العودة: {inj.expected_return}</span>}
                         </div>
                      </div>
                    ))}
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer / Branding */}
        <div className="text-center py-8">
           <img src="/logo.png" className="h-10 mx-auto grayscale opacity-30 mb-2" alt="Academy Logo" />
           <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Widad Ousmaniya Academy • Elite Performance Passport</p>
        </div>
      </div>
    </div>
  );
}
