import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Medal, Target, Zap, Activity, Shield, Search, Filter } from "lucide-react";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [data, cats] = await Promise.all([
        api.getAcademyLeaderboard(),
        api.getCategories()
      ]);
      setLeaderboard(data);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeaderboard = selectedCategory === "all" 
    ? leaderboard 
    : leaderboard.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white font-tajawal">لوحة الشرف (Leaderboard) 🏆</h2>
          <p className="text-zinc-500 mt-1 text-sm font-tajawal">أفضل اللاعبين أداءً في الأكاديمية بناءً على التقييمات الفنية.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
          <button 
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black transition-all",
              selectedCategory === "all" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            الكل
          </button>
          {categories.map(cat => (
            <button 
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all",
                selectedCategory === cat.name ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 3 Podium */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {filteredLeaderboard.slice(0, 3).map((player, index) => (
            <Card key={player.player_id} className={cn(
              "relative overflow-hidden border-2 transition-all hover:scale-105 duration-300",
              index === 0 ? "bg-emerald-600/10 border-emerald-500/30 ultra-glow-emerald" : 
              index === 1 ? "bg-blue-600/10 border-blue-500/30" : "bg-amber-600/10 border-amber-500/30"
            )}>
              <div className="absolute top-4 left-4">
                {index === 0 ? <Trophy className="h-10 w-10 text-emerald-500" /> : 
                 index === 1 ? <Medal className="h-10 w-10 text-blue-500" /> : 
                 <Medal className="h-10 w-10 text-amber-500" />}
              </div>
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-24 w-24 rounded-full border-4 border-zinc-950 shadow-2xl overflow-hidden mb-4 ring-2 ring-emerald-500/20">
                    {player.photo_url ? (
                        <img src={player.photo_url} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                            <Star className="h-10 w-10" />
                        </div>
                    )}
                </div>
                <h3 className="text-xl font-black text-white mb-1">{player.name}</h3>
                <p className="text-xs font-bold text-zinc-500 mb-4">{player.category}</p>
                
                <div className="bg-zinc-950/50 px-6 py-2 rounded-2xl border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">المستوى الإجمالي</p>
                    <p className={cn(
                        "text-3xl font-black",
                        index === 0 ? "text-emerald-500" : index === 1 ? "text-blue-500" : "text-amber-500"
                    )}>{player.overall}%</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full List */}
        <Card className="lg:col-span-3 bg-zinc-900/50 border-zinc-800 overflow-hidden">
          <CardHeader className="border-b border-zinc-800 bg-zinc-900/80">
            <CardTitle className="text-sm font-black flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> الترتيب العام للأكاديمية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
                <div className="p-20 text-center text-zinc-500 italic">جاري تحميل البيانات...</div>
            ) : filteredLeaderboard.length === 0 ? (
                <div className="p-20 text-center text-zinc-500 italic">لا توجد تقييمات مسجلة لهذه الفئة حتى الآن.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right font-tajawal">
                        <thead>
                            <tr className="text-[10px] text-zinc-500 border-b border-zinc-800 bg-zinc-950/30 uppercase tracking-widest">
                                <th className="px-6 py-4">الترتيب</th>
                                <th className="px-6 py-4">اللاعب</th>
                                <th className="px-6 py-4">الفئة</th>
                                <th className="px-6 py-4">المهارات</th>
                                <th className="px-6 py-4 text-center">المستوى</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {filteredLeaderboard.map((player, idx) => (
                                <tr key={player.player_id} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center justify-center h-8 w-8 rounded-lg font-black text-sm",
                                            idx === 0 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/40" : 
                                            idx === 1 ? "bg-blue-500 text-white" : 
                                            idx === 2 ? "bg-amber-500 text-white" : "bg-zinc-800 text-zinc-400"
                                        )}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-zinc-800 overflow-hidden border border-zinc-700">
                                                 {player.photo_url ? <img src={player.photo_url} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-zinc-600"><Star className="h-4 w-4" /></div>}
                                            </div>
                                            <span className="font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">{player.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 font-bold text-xs">{player.category}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {/* Skill dots */}
                                            <div className="flex flex-col gap-1 w-20">
                                                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-rose-500" style={{ width: `${player.skills.shooting * 10}%` }}></div>
                                                </div>
                                                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${player.skills.passing * 10}%` }}></div>
                                                </div>
                                                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${player.skills.technical * 10}%` }}></div>
                                                </div>
                                            </div>
                                            <span className="text-[8px] text-zinc-600 font-black self-center mr-2">SH/PA/TE</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xl font-black text-zinc-100">{player.overall}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
