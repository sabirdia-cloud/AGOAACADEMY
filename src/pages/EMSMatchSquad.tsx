import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Check, Save, ArrowRight, Shield, User, ChevronLeft } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";

export function EMSMatchSquad() {
    const { user } = useAuth();
    const { matchId } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState<any>(null);
    const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, [matchId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const matchData = await api.getEMSMatch(Number(matchId));
            setMatch(matchData);

            const allPlayers = await api.getPlayers();
            setAvailablePlayers(allPlayers);

            const savedSquad = await api.getMatchSheetPlayers(Number(matchId));
            setSelectedPlayers(savedSquad || []);
        } catch (error) {
            console.error("Failed to load squad data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTogglePlayer = (player: any) => {
        const isSelected = selectedPlayers.find(p => p.player_id === player.player_id);

        if (isSelected) {
            setSelectedPlayers(prev => prev.filter(p => p.player_id !== player.player_id));
        } else {
            // Check limits
            const totalSelected = selectedPlayers.length;
            if (totalSelected >= 18) {
                alert("لا يمكن إضافة أكثر من 18 لاعباً (11 أساسي + 7 احتياط)");
                return;
            }

            // 11 starters limit
            const startersCount = selectedPlayers.filter(p => p.is_starting).length;
            const isSub = startersCount >= 11;

            setSelectedPlayers(prev => [
                ...prev,
                {
                    player_id: player.player_id,
                    jersey_number: (prev.length + 1),
                    position: "غير محدد",
                    is_starting: !isSub,
                    is_substitute: isSub,
                    name: player.name // Just for temporary display
                }
            ]);
        }
    };

    const updatePlayerData = (playerId: number, field: string, value: any) => {
        setSelectedPlayers(prev => prev.map(p => {
            if (p.player_id === playerId) {
                // Handle mutual exclusivity for starter/sub
                if (field === 'is_starting' && value === true) {
                    return { ...p, is_starting: true, is_substitute: false };
                }
                if (field === 'is_substitute' && value === true) {
                    return { ...p, is_starting: false, is_substitute: true };
                }
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const handleSaveSquad = async () => {
        setIsSaving(true);
        try {
            // Clean up for API (remove extra display fields like name)
            const cleanedSquad = selectedPlayers.map(p => ({
                match_id: Number(matchId),
                player_id: p.player_id,
                jersey_number: p.jersey_number,
                position: p.position,
                is_starting: p.is_starting,
                is_substitute: p.is_substitute
            }));

            await api.saveMatchSheetPlayers(Number(matchId), cleanedSquad);
            navigate(`/matches/${matchId}/sheet`);
        } catch (error) {
            console.error("Failed to save squad:", error);
            alert("حدث خطأ أثناء حفظ القائمة.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredAvailable = availablePlayers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.includes(searchTerm))
    );

    const starters = selectedPlayers.filter(p => p.is_starting);
    const subs = selectedPlayers.filter(p => p.is_substitute);

    if (isLoading) return <div className="p-8 text-center text-zinc-500">جاري التحميل...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-tajawal rtl">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/matches")} className="text-zinc-400 group">
                        <ChevronLeft className="mr-2 h-4 w-4 transform group-hover:-translate-x-1" />
                        العودة للمباريات
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-50">اختيار قائمة اللاعبين</h2>
                        <p className="text-zinc-400 text-sm">مباراة {match?.home_team} ضد {match?.away_team}</p>
                    </div>
                </div>
                {user?.role === 'admin' && (
                    <Button
                        onClick={handleSaveSquad}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-8"
                    >
                        {isSaving ? "جاري الحفظ..." : "حفظ القائمة والانتقال لورقة اللقاء"}
                        <Save className="mr-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Selection Pool */}
                <Card className="bg-zinc-900/40 border-zinc-800 lg:col-span-1 h-[calc(100vh-200px)] flex flex-col">
                    <CardHeader className="pb-3 border-b border-zinc-800">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>اختر اللاعبين</span>
                            <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full">{selectedPlayers.length}/18</span>
                        </CardTitle>
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="بحث عن لاعب..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {filteredAvailable.map(player => {
                            const isSelected = selectedPlayers.some(p => p.player_id === player.player_id);
                            return (
                                <div
                                    key={player.player_id}
                                    onClick={() => handleTogglePlayer(player)}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-emerald-500/20 border-emerald-500/50 border' : 'bg-transparent border border-transparent hover:bg-zinc-800/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                            <User className={`h-4 w-4 ${isSelected ? 'text-emerald-500' : 'text-zinc-500'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{player.name}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase">{player.category || 'بدون فئة'}</p>
                                        </div>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-emerald-500" />}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Selected List - Configuration */}
                <Card className="bg-zinc-900/40 border-zinc-800 lg:col-span-2 h-[calc(100vh-200px)] flex flex-col">
                    <CardHeader className="border-b border-zinc-800 bg-zinc-900/60">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            <CardTitle className="text-lg">تخصيص القائمة (الأرقام والمراكز)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                        {/* Starters Section */}
                        <div className="p-4 bg-emerald-500/5 border-b border-emerald-500/10">
                            <h3 className="text-sm font-bold text-emerald-500 flex items-center gap-2 mb-4">
                                <span>التشكيلة الأساسية</span>
                                <span className="h-px bg-emerald-500/20 flex-1" />
                                <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded uppercase">{starters.length}/11</span>
                            </h3>
                            <div className="space-y-2">
                                {starters.length === 0 && <p className="text-center py-4 text-zinc-500 text-sm">لا يوجد لاعبين أساسيين حالياً.</p>}
                                {starters.map(p => (
                                    <SquadPlayerRow
                                        key={p.player_id}
                                        player={p}
                                        onUpdate={updatePlayerData}
                                        allPlayers={availablePlayers}
                                        onRemove={() => handleTogglePlayer({ player_id: p.player_id })}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Substitutes Section */}
                        <div className="p-4 bg-amber-500/5">
                            <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-4">
                                <span>اللاعبون الاحتياط</span>
                                <span className="h-px bg-amber-500/20 flex-1" />
                                <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded uppercase">{subs.length}/7</span>
                            </h3>
                            <div className="space-y-2">
                                {subs.length === 0 && <p className="text-center py-4 text-zinc-500 text-sm">لا يوجد لاعبين احتياط حالياً.</p>}
                                {subs.map(p => (
                                    <SquadPlayerRow
                                        key={p.player_id}
                                        player={p}
                                        onUpdate={updatePlayerData}
                                        allPlayers={availablePlayers}
                                        onRemove={() => handleTogglePlayer({ player_id: p.player_id })}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function SquadPlayerRow({ player, onUpdate, allPlayers, onRemove }: any) {
    const playerData = allPlayers.find((ap: any) => ap.player_id === player.player_id);

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-zinc-950/40 p-3 rounded border border-zinc-800 hover:border-zinc-700 group transition-all">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-5 w-5 rounded-full border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                    {playerData?.player_id}
                </div>
                <div className="truncate">
                    <p className="text-sm font-bold text-zinc-200">{playerData?.name || player.name}</p>
                    <p className="text-[10px] text-zinc-500">{playerData?.category}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:w-20">
                    <label className="text-[10px] text-zinc-500 block mb-1">الرقم</label>
                    <input
                        type="number"
                        value={player.jersey_number}
                        onChange={(e) => onUpdate(player.player_id, 'jersey_number', parseInt(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:border-emerald-500 outline-none"
                    />
                </div>
                <div className="flex-1 sm:w-32">
                    <label className="text-[10px] text-zinc-500 block mb-1">المركز</label>
                    <select
                        value={player.position}
                        onChange={(e) => onUpdate(player.player_id, 'position', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:border-emerald-500 outline-none"
                    >
                        <option value="GK">GK</option>
                        <option value="CB">CB</option>
                        <option value="LB">LB</option>
                        <option value="RB">RB</option>
                        <option value="CM">CM</option>
                        <option value="RM">RM</option>
                        <option value="LM">LM</option>
                        <option value="ST">ST</option>
                        <option value="LW">LW</option>
                        <option value="RW">RW</option>
                        <option value="غير محدد">غير محدد</option>
                    </select>
                </div>
                <div className="flex items-center gap-1 mt-4 sm:mt-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate(player.player_id, player.is_starting ? 'is_substitute' : 'is_starting', true)}
                        className={`text-[9px] h-7 px-2 border ${player.is_starting ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            }`}
                    >
                        {player.is_starting ? 'أساسي' : 'احتياط'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-7 w-7 text-zinc-500 hover:text-rose-500"
                    >
                        <Users className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
