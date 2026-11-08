import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, MapPin, Users, FileText, Printer, Plus, Trash2, Shield, ArrowRight, User, Settings, Scale } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { Modal } from "@/components/ui/modal";
import { exportToPDF } from "@/lib/pdf-export";
import { PrintPortal } from "@/components/PrintPortal";

export function EMSMatchSheet() {
    const { user } = useAuth();
    const { matchId } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState<any>(null);
    const [squad, setSquad] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
    const [printData, setPrintData] = useState<any>(null);
    const [academySettings, setAcademySettings] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [matchId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [m, s, e, settings] = await Promise.all([
                api.getEMSMatch(Number(matchId)),
                api.getMatchSheetPlayers(Number(matchId)),
                api.getMatchEvents(Number(matchId)),
                api.getAcademySettings()
            ]);
            setMatch(m);
            setSquad(s);
            setEvents(e);
            setAcademySettings(settings);
        } catch (error) {
            console.error("Failed to load match sheet data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const eventData = {
            match_id: Number(matchId),
            player_id: formData.get("player_id") ? Number(formData.get("player_id")) : null,
            event_type: formData.get("event_type") as string,
            minute: Number(formData.get("minute")),
            notes: formData.get("notes") as string,
        };

        try {
            await api.addMatchEvent(eventData);
            await loadData();
            setIsEventModalOpen(false);
        } catch (error) {
            console.error("Failed to add event:", error);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        try {
            await api.deleteMatchEvent(id);
            await loadData();
        } catch (error) {
            console.error("Failed to delete event:", error);
        }
    };

    const handleScoreUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const score = formData.get("score") as string;
        try {
            await api.updateEMSMatch(Number(matchId), { score });
            await loadData();
            setIsScoreModalOpen(false);
        } catch (error) {
            console.error("Failed to update score:", error);
        }
    };

    const handleExportPDF = () => {
        setPrintData({ match, starters, subs, events });
    };

    const starters = squad.filter(p => p.is_starting).sort((a, b) => a.jersey_number - b.jersey_number);
    const subs = squad.filter(p => p.is_substitute).sort((a, b) => a.jersey_number - b.jersey_number);

    if (isLoading) return <div className="p-8 text-center text-zinc-500 font-tajawal">جاري التحميل...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto font-tajawal rtl py-4">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'admin' ? `/matches/${matchId}/squad` : "/matches")} className="text-zinc-400 group h-8">
                        <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1" />
                        {user?.role === 'admin' ? "تعديل القائمة" : "العودة"}
                    </Button>
                    <div className="h-4 w-px bg-zinc-800" />
                    <h2 className="text-lg font-bold text-zinc-50 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-500" />
                        ورقة اللقاء الرسمية
                    </h2>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {(user?.role === 'admin' || user?.role === 'coach') && (
                        <>
                            <Button
                                onClick={() => setIsScoreModalOpen(true)}
                                className="flex-1 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-600/20 font-bold"
                            >
                                <Trophy className="ml-2 h-4 w-4" />
                                تحديث النتيجة
                            </Button>
                            <Button
                                onClick={() => setIsEventModalOpen(true)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold"
                            >
                                <Plus className="ml-2 h-4 w-4" />
                                تسجيل حدث
                            </Button>
                        </>
                    )}
                    <Button
                        onClick={handleExportPDF}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                        <Printer className="ml-2 h-4 w-4" />
                        تحميل PDF
                    </Button>
                </div>
            </div>

            {/* Official Match Sheet Design */}
            <div id="match-sheet-content" className="space-y-6">
                {/* Match Identity */}
                <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full -ml-16 -mb-16 blur-3xl" />

                    <CardHeader className="text-center border-b border-zinc-800 py-6">
                        <div className="text-xs text-emerald-500 font-black uppercase tracking-[0.2em] mb-2">{match.competition}</div>
                        <div className="flex justify-center items-center gap-8 md:gap-16">
                            <div className="flex flex-col items-center">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-xl mb-3 rotate-3 transform transition hover:rotate-0">
                                    <Shield className="h-8 md:h-10 w-8 md:w-10 text-emerald-500" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-zinc-50">{match.home_team}</h3>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="text-3xl md:text-4xl font-black text-zinc-600 mb-2 italic">VS</div>
                                <div className="text-xs font-mono text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">{match.category}</div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-xl mb-3 -rotate-3 transform transition hover:rotate-0">
                                    <Shield className="h-8 md:h-10 w-8 md:w-10 text-zinc-400" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-zinc-400">{match.away_team}</h3>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-black">تاريخ اللقاء</p>
                                <p className="text-sm font-bold text-zinc-200">{match.match_date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-black">الملعب</p>
                                <p className="text-sm font-bold text-zinc-200">{match.stadium}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-black">المدرب</p>
                                <p className="text-sm font-bold text-zinc-200">{match.coach_name}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Players Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Starters */}
                    <Card className="bg-zinc-900/40 border-zinc-800">
                        <CardHeader className="border-b border-zinc-800 bg-emerald-500/5">
                            <CardTitle className="text-sm font-black flex items-center gap-2 text-emerald-500">
                                <Trophy className="h-4 w-4" />
                                التشكيلة الأساسية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-right">
                                <thead className="bg-zinc-950/50 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase font-black">
                                    <tr>
                                        <th className="p-3">#</th>
                                        <th className="p-3 text-right">إسم اللاعب</th>
                                        <th className="p-3 text-center">المركز</th>
                                        <th className="p-3 text-center">أحداث</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {starters.map(player => (
                                        <tr key={player.id} className="hover:bg-zinc-800/20 transition-colors group">
                                            <td className="p-3 font-mono font-bold text-emerald-500">{player.jersey_number}</td>
                                            <td className="p-3 text-sm font-bold text-zinc-200">{player.players?.name}</td>
                                            <td className="p-3 text-center text-xs font-mono text-zinc-500">{player.position}</td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center gap-1">
                                                    {events.filter(e => e.player_id === player.player_id).map(e => (
                                                        <span key={e.id} className="text-xs" title={`${e.event_type} - ${e.minute}'`}>
                                                            {e.event_type === 'goal' ? '⚽' : e.event_type === 'yellow_card' ? '🟨' : e.event_type === 'red_card' ? '🟥' : '🔄'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {starters.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-zinc-600 text-sm">لا توجد تشكيلة أساسية حالياً</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Substitutes */}
                    <Card className="bg-zinc-900/40 border-zinc-800">
                        <CardHeader className="border-b border-zinc-800 bg-amber-500/5">
                            <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-500">
                                <Users className="h-4 w-4" />
                                اللاعبون الاحتياط
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-right">
                                <thead className="bg-zinc-950/50 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase font-black">
                                    <tr>
                                        <th className="p-3">#</th>
                                        <th className="p-3 text-right">إسم اللاعب</th>
                                        <th className="p-3 text-center">المركز</th>
                                        <th className="p-3 text-center">أحداث</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {subs.map(player => (
                                        <tr key={player.id} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="p-3 font-mono font-bold text-amber-500">{player.jersey_number}</td>
                                            <td className="p-3 text-sm font-bold text-zinc-200">{player.players?.name}</td>
                                            <td className="p-3 text-center text-xs font-mono text-zinc-500">{player.position}</td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center gap-1">
                                                    {events.filter(e => e.player_id === player.player_id).map(e => (
                                                        <span key={e.id} className="text-xs" title={`${e.event_type} - ${e.minute}'`}>
                                                            {e.event_type === 'goal' ? '⚽' : e.event_type === 'yellow_card' ? '🟨' : e.event_type === 'red_card' ? '🟥' : '🔄'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {subs.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-zinc-600 text-sm">لا يوجد لاعبون احتياط حالياً</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Match Events Timeline */}
                <Card className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader className="border-b border-zinc-800">
                        <CardTitle className="text-sm font-black flex items-center gap-2 text-zinc-300">
                            أحداث المباراة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            {events.length === 0 && <p className="text-center py-4 text-zinc-600 text-sm">لم يتم تسجيل أي أحداث في المباراة بعد.</p>}
                            {events.map((event, idx) => (
                                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-900 group">
                                    <div className="flex items-center gap-4">
                                        <span className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-black text-emerald-500 text-xs">
                                            {event.minute}'
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">
                                                {event.event_type === 'goal' ? '⚽' :
                                                    event.event_type === 'assist' ? '👟' :
                                                        event.event_type === 'yellow_card' ? '🟨' :
                                                            event.event_type === 'red_card' ? '🟥' :
                                                                event.event_type === 'substitution_in' ? '🔼' : '🔽'}
                                            </span>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-200">{event.players?.name || 'حدث عام'}</p>
                                                <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
                                                    {event.event_type === 'goal' ? 'هدف' :
                                                        event.event_type === 'assist' ? 'تمريرة حاسمة' :
                                                            event.event_type === 'yellow_card' ? 'بطاقة صفراء' :
                                                                event.event_type === 'red_card' ? 'بطاقة حمراء' :
                                                                    event.event_type === 'substitution_in' ? 'دخول لاعب' : 'خروج لاعب'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {user?.role === 'admin' && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="h-8 w-8 text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Score Update Modal */}
            <Modal isOpen={isScoreModalOpen} onClose={() => setIsScoreModalOpen(false)} title="تحديث نتيجة اللقاء">
                <form onSubmit={handleScoreUpdate} className="space-y-4 font-tajawal">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center gap-4 bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800">
                            <div className="flex-1 text-center font-black text-xl text-zinc-50">{match.home_team}</div>
                            <div className="text-zinc-500 font-bold italic">VS</div>
                            <div className="flex-1 text-center font-black text-xl text-zinc-400">{match.away_team}</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">النتيجة الحالية</label>
                            <input
                                required
                                name="score"
                                defaultValue={match.score}
                                type="text"
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-2xl font-black text-zinc-50 focus:border-emerald-500 outline-none transition-all text-center tracking-[0.5em]"
                                placeholder="0 - 0"
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsScoreModalOpen(false)} className="border-zinc-800 text-zinc-300 rounded-xl px-6">إلغاء</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-10 shadow-lg shadow-emerald-900/20">حفظ النتيجة</Button>
                    </div>
                </form>
            </Modal>

            {/* Event Registration Modal */}
            <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="تسجيل حدث في المباراة">
                <form onSubmit={handleAddEvent} className="space-y-4 font-tajawal">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">نوع الحدث</label>
                        <select required name="event_type" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-emerald-500">
                            <option value="goal">⚽ هدف</option>
                            <option value="assist">👟 تمريرة حاسمة</option>
                            <option value="yellow_card">🟨 بطاقة صفراء</option>
                            <option value="red_card">🟥 بطاقة حمراء</option>
                            <option value="substitution_in">🔼 دخول لاعب</option>
                            <option value="substitution_out">🔽 خروج لاعب</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">اللاعب المعني</label>
                        <select name="player_id" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-emerald-500">
                            <option value="">بدون تحديد (حدث عام)</option>
                            {squad.map(p => (
                                <option key={p.player_id} value={p.player_id}>
                                    ({p.jersey_number}) {p.players?.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">الدقيقة</label>
                        <input required name="minute" type="number" min="0" max="120" defaultValue="1" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-emerald-500" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">ملاحظات</label>
                        <textarea name="notes" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-emerald-500 h-20" placeholder="مثال: ركلة جزاء، استبدال اضطراري..." />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)} className="border-zinc-800 text-zinc-300">إلغاء</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6">حفظ الحدث</Button>
                    </div>
                </form>
            </Modal>

            {/* Print Template Section */}
            {printData && (
                <PrintPortal
                    id="match-sheet"
                    isOpen={!!printData}
                    title={`ورقة لقاء - ${match.home_team} vs ${match.away_team}`}
                    onClose={() => setPrintData(null)}
                >
                    <MatchSheetPrintTemplate
                        match={match}
                        starters={starters}
                        subs={subs}
                        events={events}
                        settings={academySettings}
                    />
                </PrintPortal>
            )}
        </div>
    );
}

// Print Template Component (Hidden in UI, used for PDF export)
function MatchSheetPrintTemplate({ match, starters, subs, events, settings }: any) {
    return (
        <div id="match-sheet-print" className="bg-white p-8 font-tajawal text-zinc-950 w-[210mm] min-h-[297mm] mx-auto rtl" dir="rtl">
            {/* Header */}
            <div className="border-b-2 border-zinc-900 pb-6 mb-8 flex items-center justify-between">
                <div className="w-24 h-24 bg-zinc-100 rounded-lg flex items-center justify-center border border-zinc-200">
                    {settings?.logo_url ? <img src={settings.logo_url} className="w-20 h-20 object-contain" alt="Logo" /> : <div className="text-xs text-zinc-400">شعار الأكاديمية</div>}
                </div>
                <div className="text-center flex-1 mx-4">
                    <h1 className="text-2xl font-black mb-1">{settings?.name || "أكاديمية كرة القدم"}</h1>
                    <p className="text-sm font-bold text-zinc-500 mb-2 uppercase tracking-widest">{match.competition}</p>
                    <div className="inline-block px-4 py-1 bg-zinc-900 text-white rounded text-lg font-black tracking-widest">
                        ورقة اللقاء الرسمية
                    </div>
                </div>
                <div className="w-24 h-24 bg-zinc-100 rounded-lg flex items-center justify-center border border-zinc-200">
                    <div className="text-xs text-zinc-400 font-bold uppercase">FIFA / FAF</div>
                </div>
            </div>

            {/* Match Details Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-10 text-sm">
                <div className="flex border-b border-zinc-100 pb-2">
                    <span className="font-bold w-24">تاريخ اللقاء:</span>
                    <span className="flex-1">{match.match_date}</span>
                </div>
                <div className="flex border-b border-zinc-100 pb-2">
                    <span className="font-bold w-24">الفئة:</span>
                    <span className="flex-1">{match.category}</span>
                </div>
                <div className="flex border-b border-zinc-100 pb-2">
                    <span className="font-bold w-24">الملعب:</span>
                    <span className="flex-1">{match.stadium}</span>
                </div>
                <div className="flex border-b border-zinc-100 pb-2">
                    <span className="font-bold w-24">المدرب:</span>
                    <span className="flex-1">{match.coach_name}</span>
                </div>
            </div>

            {/* Teams Header */}
            <div className="flex items-center justify-between mb-8 pb-4">
                <div className="flex-1 text-center font-black text-2xl px-4 py-3 bg-zinc-100 rounded-l border-r-2 border-zinc-900">{match.home_team}</div>
                <div className="px-6 italic font-black text-zinc-400">VS</div>
                <div className="flex-1 text-center font-black text-2xl px-4 py-3 bg-zinc-50 rounded-r border-l-2 border-zinc-200 text-zinc-500">{match.away_team}</div>
            </div>

            {/* Tables Container */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                    <h3 className="bg-zinc-900 text-white px-3 py-1.5 text-xs font-black mb-2 text-center rounded">التشكيلة الأساسية</h3>
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-900 font-black">
                                <th className="p-2 text-center w-8">#</th>
                                <th className="p-2 text-right">إسم اللاعب</th>
                                <th className="p-2 text-center">المركز</th>
                            </tr>
                        </thead>
                        <tbody>
                            {starters.map(p => (
                                <tr key={p.id} className="border-b border-zinc-100">
                                    <td className="p-2 text-center font-bold">{p.jersey_number}</td>
                                    <td className="p-2 font-bold">{p.players?.name}</td>
                                    <td className="p-2 text-center">{p.position}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div>
                    <h3 className="bg-zinc-200 text-zinc-900 px-3 py-1.5 text-xs font-black mb-2 text-center rounded">اللاعبون الاحتياط</h3>
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-300 font-black">
                                <th className="p-2 text-center w-8">#</th>
                                <th className="p-2 text-right">إسم اللاعب</th>
                                <th className="p-2 text-center">المركز</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subs.map(p => (
                                <tr key={p.id} className="border-b border-zinc-100">
                                    <td className="p-2 text-center font-bold">{p.jersey_number}</td>
                                    <td className="p-2 font-bold">{p.players?.name}</td>
                                    <td className="p-2 text-center">{p.position}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Events Log in Print */}
            <div className="mb-10">
                <h3 className="bg-zinc-100 border border-zinc-200 text-zinc-900 px-3 py-1.5 text-xs font-black mb-4 flex items-center gap-2">
                    وقائع المباراة (الأحداث المسجلة)
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[10px]">
                    {events.map((e, idx) => (
                        <div key={idx} className="flex items-center gap-3 border-b border-zinc-50 pb-1">
                            <span className="font-bold min-w-[25px]">{e.minute}'</span>
                            <span className="w-4 text-center">
                                {e.event_type === 'goal' ? '⚽' : e.event_type === 'yellow_card' ? '🟨' : e.event_type === 'red_card' ? '🟥' : '🔄'}
                            </span>
                            <span className="font-bold flex-1">{e.players?.name}</span>
                            <span className="text-zinc-500 italic">
                                {e.event_type === 'goal' ? 'هدف' : e.event_type === 'yellow_card' ? 'تحذير' : e.event_type === 'red_card' ? 'طرد' : 'تبديل'}
                            </span>
                        </div>
                    ))}
                    {events.length === 0 && <p className="col-span-2 text-zinc-400 italic">لا توجد أحداث مسجلة</p>}
                </div>
            </div>

            {/* Footer Signatures */}
            <div className="mt-auto pt-16 grid grid-cols-3 gap-8 text-center text-[10px] font-bold">
                <div className="space-y-12">
                    <div className="h-px bg-zinc-200" />
                    <p>توقيع المدرب</p>
                </div>
                <div className="space-y-12">
                    <div className="h-px bg-zinc-200" />
                    <p>توقيع الكاتب العام</p>
                </div>
                <div className="space-y-12">
                    <div className="h-px bg-zinc-200" />
                    <p>ختم الأكاديمية</p>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-dotted border-zinc-200 text-center text-[8px] text-zinc-400 uppercase tracking-widest">
                Generated by Academy Management System • Official Match Sheet Document • FAF Compatible
            </div>
        </div>
    );
}
