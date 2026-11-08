import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Save, ChevronLeft, Layout, Share2, Printer, Trash2, UserPlus } from "lucide-react";
import { api } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formations: any = {
  "4-3-3": [
    { id: "gk", pos: { top: "85%", left: "50%" }, label: "GK" },
    { id: "lb", pos: { top: "65%", left: "15%" }, label: "LB" },
    { id: "cb1", pos: { top: "70%", left: "35%" }, label: "CB" },
    { id: "cb2", pos: { top: "70%", left: "65%" }, label: "CB" },
    { id: "rb", pos: { top: "65%", left: "85%" }, label: "RB" },
    { id: "cm1", pos: { top: "45%", left: "30%" }, label: "CM" },
    { id: "cm2", pos: { top: "50%", left: "50%" }, label: "CM" },
    { id: "cm3", pos: { top: "45%", left: "70%" }, label: "CM" },
    { id: "lw", pos: { top: "20%", left: "20%" }, label: "LW" },
    { id: "st", pos: { top: "15%", left: "50%" }, label: "ST" },
    { id: "rw", pos: { top: "20%", left: "80%" }, label: "RW" },
  ],
  "4-4-2": [
    { id: "gk", pos: { top: "85%", left: "50%" }, label: "GK" },
    { id: "lb", pos: { top: "65%", left: "15%" }, label: "LB" },
    { id: "cb1", pos: { top: "70%", left: "35%" }, label: "CB" },
    { id: "cb2", pos: { top: "70%", left: "65%" }, label: "CB" },
    { id: "rb", pos: { top: "65%", left: "85%" }, label: "RB" },
    { id: "lm", pos: { top: "40%", left: "15%" }, label: "LM" },
    { id: "cm1", pos: { top: "45%", left: "40%" }, label: "CM" },
    { id: "cm2", pos: { top: "45%", left: "60%" }, label: "CM" },
    { id: "rm", pos: { top: "40%", left: "85%" }, label: "RM" },
    { id: "st1", pos: { top: "15%", left: "40%" }, label: "ST" },
    { id: "st2", pos: { top: "15%", left: "60%" }, label: "ST" },
  ],
  "3-5-2": [
    { id: "gk", pos: { top: "85%", left: "50%" }, label: "GK" },
    { id: "cb1", pos: { top: "70%", left: "25%" }, label: "CB" },
    { id: "cb2", pos: { top: "75%", left: "50%" }, label: "CB" },
    { id: "cb3", pos: { top: "70%", left: "75%" }, label: "CB" },
    { id: "lm", pos: { top: "40%", left: "10%" }, label: "LM" },
    { id: "cm1", pos: { top: "50%", left: "30%" }, label: "CM" },
    { id: "cm2", pos: { top: "55%", left: "50%" }, label: "CM" },
    { id: "cm3", pos: { top: "50%", left: "70%" }, label: "CM" },
    { id: "rm", pos: { top: "40%", left: "90%" }, label: "RM" },
    { id: "st1", pos: { top: "15%", left: "40%" }, label: "ST" },
    { id: "st2", pos: { top: "15%", left: "60%" }, label: "ST" },
  ]
};

export function SquadBuilder() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [pitchPlayers, setPitchPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Apply formation template when selected
    const template = formations[selectedFormation];
    setPitchPlayers(template.map((pos: any) => ({ ...pos, player: null })));
  }, [selectedFormation]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allPlayers = await api.getPlayers();
      setPlayers(allPlayers);
    } catch (error) {
      console.error("Failed to load players:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignPlayer = (slotId: string, player: any) => {
    setPitchPlayers(prev => prev.map(slot => {
      if (slot.id === slotId) {
        return { ...slot, player };
      }
      // If player was assigned somewhere else, remove them
      if (slot.player?.player_id === player.player_id) {
        return { ...slot, player: null };
      }
      return slot;
    }));
  };

  const removePlayerFromPitch = (slotId: string) => {
    setPitchPlayers(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, player: null } : slot
    ));
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "الكل" || p.category === categoryFilter;
    const isAlreadyOnPitch = pitchPlayers.some(sp => sp.player?.player_id === p.player_id);
    return matchesSearch && matchesCategory && !isAlreadyOnPitch;
  });

  const categories = ["الكل", ...new Set(players.map(p => p.category).filter(Boolean))];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-tajawal pb-20" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-zinc-400 p-0 hover:bg-transparent">
              <ChevronLeft className="h-4 w-4" />
              العودة
            </Button>
          </div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Layout className="h-8 w-8 text-emerald-500" />
            بناء التشكيلة التكتيكية
          </h2>
          <p className="text-zinc-400 text-sm mt-1">صمم خطة اللعب، وزع اللاعبين، وشارك التشكيلة مع فريقك.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="border-zinc-800 text-zinc-300 gap-2 flex-1 md:flex-none">
            <Printer className="h-4 w-4" />
            طباعة الخطة
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 flex-1 md:flex-none">
            <Save className="h-4 w-4" />
            حفظ التشكيلة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Tactical Pitch */}
        <div className="lg:col-span-8">
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative shadow-2xl">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 uppercase">خطة اللعب:</span>
                <select 
                  value={selectedFormation}
                  onChange={(e) => setSelectedFormation(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 text-sm text-emerald-500 font-bold outline-none focus:border-emerald-500"
                >
                  {Object.keys(formations).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-500/20"></div>
              </div>
            </div>
            
            {/* The Pitch Container */}
            <div className="relative aspect-[3/4] md:aspect-[4/5] bg-emerald-900/20 p-4">
              {/* Pitch Markings */}
              <div className="absolute inset-4 border-2 border-white/20 rounded-sm pointer-events-none">
                {/* Halfway line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/20"></div>
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                {/* Penalty areas */}
                <div className="absolute top-0 left-1/2 w-64 h-32 border-2 border-white/20 border-t-0 -translate-x-1/2"></div>
                <div className="absolute bottom-0 left-1/2 w-64 h-32 border-2 border-white/20 border-b-0 -translate-x-1/2"></div>
              </div>

              {/* Player Slots on Pitch */}
              {pitchPlayers.map((slot) => (
                <div 
                  key={slot.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10"
                  style={{ top: slot.pos.top, left: slot.pos.left }}
                >
                  <AnimatePresence mode="wait">
                    {slot.player ? (
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="relative group"
                      >
                        <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-emerald-500 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden cursor-pointer ring-4 ring-emerald-500/20">
                          {slot.player.photo_url ? (
                            <img src={slot.player.photo_url} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <span className="text-white font-black text-xl">{slot.player.name[0]}</span>
                          )}
                        </div>
                        <Button 
                          size="icon" 
                          variant="destructive"
                          onClick={() => removePlayerFromPitch(slot.id)}
                          className="absolute -top-1 -right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="mt-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-3 py-1 rounded-full shadow-lg">
                          <p className="text-[10px] md:text-xs font-black text-white whitespace-nowrap">{slot.player.name}</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-12 w-12 md:h-14 md:w-14 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <span className="text-[10px] font-black text-white/30 group-hover:text-white/60">{slot.label}</span>
                        <UserPlus className="h-4 w-4 text-white/20 group-hover:text-white/50" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Player Selection Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 flex flex-col h-[600px]">
            <CardHeader className="pb-4 border-b border-zinc-800">
              <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-500" />
                قائمة اللاعبين المتاحين
              </CardTitle>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="بحث عن لاعب..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border",
                        categoryFilter === cat 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredPlayers.length > 0 ? filteredPlayers.map((player) => (
                <motion.div
                  layout
                  key={player.player_id}
                  onClick={() => {
                    // Automatically assign to first empty slot
                    const emptySlot = pitchPlayers.find(s => !s.player);
                    if (emptySlot) {
                      handleAssignPlayer(emptySlot.id, player);
                    } else {
                      alert("تم اكتمال التشكيلة الأساسية! قم بإزالة لاعب لإضافة آخر.");
                    }
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer group transition-all"
                >
                  <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center group-hover:border-emerald-500/50">
                    {player.photo_url ? (
                      <img src={player.photo_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <span className="text-zinc-700 font-bold">{player.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">{player.name}</p>
                    <p className="text-[10px] text-zinc-500">{player.category} • {player.position || 'N/A'}</p>
                  </div>
                  <UserPlus className="h-4 w-4 text-zinc-800 group-hover:text-emerald-500" />
                </motion.div>
              )) : (
                <div className="text-center py-20 text-zinc-700">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">لا يوجد لاعبين متاحين للبحث الحالي</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-600 border-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[60px] rounded-full"></div>
            <CardContent className="p-6 relative z-10">
              <h4 className="text-white font-black text-lg mb-2 flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                نصيحة تكتيكية
              </h4>
              <p className="text-emerald-100 text-xs leading-relaxed">
                استخدم التشكيلة المناسبة لمواجهة الخصم. خطة 4-3-3 تمنحك هجوماً قوياً، بينما 4-4-2 توفر توازناً دفاعياً ممتازاً.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
