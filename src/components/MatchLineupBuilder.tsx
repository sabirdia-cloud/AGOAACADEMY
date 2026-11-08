import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, Layout, Save, Share2, Plus, Trash2, 
  ChevronRight, Info, Shield, Target, MousePointer2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface MatchLineupBuilderProps {
  eventId: string;
  category: string;
  isCoach?: boolean;
}

export const MatchLineupBuilder: React.FC<MatchLineupBuilderProps> = ({ eventId, category, isCoach }) => {
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [lineup, setLineup] = useState<any>({
    formation: '4-3-3',
    starters: [],
    subs: []
  });
  const [activeTab, setActiveTab] = useState<'pitch' | 'bench' | 'available'>('pitch');

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      const details = await api.getMatchDetails(eventId);
      if (details) {
        setMatchDetails(details);
        if (details.lineup_json) setLineup(details.lineup_json);
      }
      
      const allPlayers = await api.getPlayers();
      setPlayers(allPlayers.filter((p: any) => p.category === category));
    } catch (error) {
      console.error("Error loading match data:", error);
    }
  };

  const handleSave = async () => {
    try {
      await api.upsertMatchDetails({
        event_id: eventId,
        lineup_json: lineup
      });
      alert("✅ تم حفظ التشكيلة بنجاح");
    } catch (error) {
      alert("❌ خطأ في حفظ البيانات");
    }
  };

  const togglePlayer = (player: any) => {
    if (!isCoach) return;
    const isStarter = lineup.starters.some((p: any) => p.id === player.id || p.player_id === player.player_id);
    const isSub = lineup.subs.some((p: any) => p.id === player.id || p.player_id === player.player_id);

    if (isStarter) {
      setLineup({ ...lineup, starters: lineup.starters.filter((p: any) => (p.id || p.player_id) !== (player.id || player.player_id)) });
    } else if (isSub) {
      setLineup({ 
        ...lineup, 
        subs: lineup.subs.filter((p: any) => (p.id || p.player_id) !== (player.id || player.player_id)), 
        starters: [...lineup.starters, player] 
      });
    } else {
      if (lineup.starters.length < 11) {
        setLineup({ ...lineup, starters: [...lineup.starters, player] });
      } else {
        setLineup({ ...lineup, subs: [...lineup.subs, player] });
      }
    }
  };

  const formations = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Layout className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">مخطط التشكيلة</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{category}</p>
            </div>
          </div>
          {isCoach && (
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-10 px-6 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
              <Save className="ml-2 w-4 h-4" /> حفظ
            </Button>
          )}
        </div>

        {/* Mobile Tabs */}
        <div className="flex overflow-x-auto pb-2 no-scrollbar gap-2">
          {[
            { id: 'pitch', label: 'الملعب', icon: Target },
            { id: 'bench', label: 'البدلاء', icon: Users },
            ...(isCoach ? [{ id: 'available', label: 'المتاحين', icon: Plus }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all",
                activeTab === tab.id 
                  ? "bg-emerald-600 text-white shadow-lg" 
                  : "bg-zinc-900 text-zinc-500 border border-zinc-800"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'pitch' && (
            <div className="space-y-6">
              <div className="relative aspect-[4/5] md:aspect-[16/10] bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl group">
                {/* Visual Pitch */}
                <div className="absolute inset-4 border-2 border-emerald-500/20 rounded-2xl pointer-events-none">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500/20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-emerald-500/20 rounded-full" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-t-0 border-emerald-500/20" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-b-0 border-emerald-500/20" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500/20 rounded-full mt-2" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500/20 rounded-full mb-2" />
                </div>

                <div className="relative h-full w-full p-8 flex flex-wrap justify-center content-center gap-4 md:gap-8 overflow-y-auto">
                  <AnimatePresence>
                    {lineup.starters.map((p: any, idx: number) => (
                      <motion.div 
                        key={p.player_id || p.id}
                        layout
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="flex flex-col items-center gap-2 group/player relative"
                      >
                        <div className="relative">
                          <div className="w-14 h-14 md:w-20 md:h-20 rounded-3xl bg-zinc-900 border-2 border-emerald-500 shadow-xl overflow-hidden transform group-hover/player:-translate-y-1 transition-transform">
                            {p.photo_url ? (
                              <img src={p.photo_url} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <Users className="text-zinc-600 w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                            {idx + 1}
                          </div>
                        </div>
                        <span className="bg-zinc-900/80 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-xl border border-zinc-800 backdrop-blur-sm whitespace-nowrap">
                          {p.name.split(' ')[0]}
                        </span>
                        {isCoach && (
                          <button 
                            onClick={() => togglePlayer(p)}
                            className="absolute -top-3 -left-3 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-opacity shadow-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {lineup.starters.length === 0 && (
                    <div className="flex flex-col items-center gap-4 opacity-20 py-20">
                      <MousePointer2 className="w-16 h-16 text-emerald-500 animate-pulse" />
                      <p className="text-xl font-black text-white text-center">قم باختيار اللاعبين من القائمة</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">عدد اللاعبين في الملعب: {lineup.starters.length} / 11</p>
              </div>
            </div>
          )}

          {activeTab === 'bench' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-zinc-400 px-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> قائمة البدلاء والاحتياط
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {lineup.subs.map((p: any) => (
                  <Card key={p.id} className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-blue-500/30 transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden border border-zinc-700">
                          {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" /> : <Users className="p-2 text-zinc-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{p.name}</p>
                          <p className="text-[10px] text-zinc-500 font-bold">{p.position || 'بديل'}</p>
                        </div>
                      </div>
                      {isCoach && (
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => togglePlayer(p)}
                            className="h-8 px-2 text-[10px] font-black bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white"
                          >
                            ترقية للأساسي
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setLineup({ ...lineup, subs: lineup.subs.filter((lp: any) => lp.id !== p.id) })}
                            className="h-8 w-8 p-0 text-rose-500 bg-rose-500/10 rounded-lg hover:bg-rose-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {lineup.subs.length === 0 && (
                  <div className="py-20 text-center bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-3xl">
                    <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-600 font-bold">لا يوجد لاعبين في الاحتياط</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'available' && isCoach && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-sm font-black text-zinc-400">اختر اللاعبين لإضافتهم</h3>
                <p className="text-[10px] text-zinc-600 font-bold uppercase">{players.length} لاعب متاح</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {players.map((p: any) => {
                  const isInStarters = lineup.starters.some((lp: any) => (lp.id || lp.player_id) === (p.id || p.player_id));
                  const isInSubs = lineup.subs.some((lp: any) => (lp.id || lp.player_id) === (p.id || p.player_id));
                  const isSelected = isInStarters || isInSubs;
                  
                  return (
                    <button 
                      key={p.id || p.player_id}
                      disabled={isSelected}
                      onClick={() => togglePlayer(p)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-right",
                        isSelected 
                          ? "bg-zinc-800 border-zinc-700 opacity-50 cursor-not-allowed" 
                          : "bg-zinc-900 border-zinc-800 hover:border-emerald-500/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden border border-zinc-700">
                          {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" /> : <Users className="p-2 text-zinc-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{p.name}</p>
                          <p className="text-[10px] text-zinc-500 font-bold">{p.position || 'لاعب'}</p>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                          {isInStarters ? 'أساسي' : 'احتياط'}
                        </div>
                      ) : (
                        <Plus className="w-5 h-5 text-zinc-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
