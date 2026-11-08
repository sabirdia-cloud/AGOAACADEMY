import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, Calendar, MapPin, Users, Edit, Trash2, FileText, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { useNavigate } from "react-router-dom";

export function EMSMatches() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<any>(null);
    const [matchToDelete, setMatchToDelete] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await api.getEMSMatches();
            setMatches(data);
        } catch (error) {
            console.error("Failed to load matches:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveMatch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const matchData = {
            match_date: formData.get("match_date") as string,
            competition: formData.get("competition") as string,
            home_team: formData.get("home_team") as string,
            away_team: formData.get("away_team") as string,
            stadium: formData.get("stadium") as string,
            category: formData.get("category") as string,
            coach_name: formData.get("coach_name") as string,
            assistant_coach: formData.get("assistant_coach") as string,
        };

        try {
            if (editingMatch) {
                await api.updateEMSMatch(editingMatch.id || editingMatch.match_id, matchData);
            } else {
                await api.addEMSMatch(matchData);
            }
            await loadData();
            setIsModalOpen(false);
            setEditingMatch(null);
        } catch (error) {
            console.error("Failed to save match:", error);
            alert("حدث خطأ أثناء الحفظ. تأكد من إنشاء الجداول في قاعدة البيانات.");
        }
    };

    const handleDeleteMatch = (id: number) => {
        setMatchToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (matchToDelete) {
            try {
                await api.deleteEMSMatch(matchToDelete);
                await loadData();
            } catch (error) {
                console.error("Failed to delete match:", error);
            } finally {
                setMatchToDelete(null);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-50">نظام ورقة اللقاء الإلكترونية</h2>
                    <p className="text-zinc-400 mt-1">إدارة أوراق المباريات، اللاعبين والأحداث بشكل احترافي.</p>
                </div>
                {user?.role === 'admin' && (
                    <Button onClick={() => { setEditingMatch(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        إنشاء ورقة لقاء جديدة
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">جاري التحميل...</div>
                ) : matches.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800">
                        لا توجد أوراق لقاء مسجلة حالياً.
                    </div>
                ) : matches.map((match) => (
                    <Card key={match.id} className="bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 transition-all group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800/50">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-emerald-500" />
                                <CardTitle className="text-lg font-bold text-zinc-50">{match.competition}</CardTitle>
                            </div>
                            <span className="text-xs text-zinc-500 font-mono">{match.match_date}</span>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="text-center flex-1">
                                    <div className="h-12 w-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 border border-emerald-500/20">
                                        <span className="text-emerald-500 font-bold text-lg">{match.home_team.charAt(0)}</span>
                                    </div>
                                    <p className="font-bold text-zinc-50 text-sm truncate">{match.home_team}</p>
                                </div>

                                <div className="flex-1 text-center px-4">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">VS</div>
                                    <div className="h-px bg-zinc-800 w-full mb-3" />
                                    <div className="text-xs text-zinc-400 font-medium">{match.category}</div>
                                </div>

                                <div className="text-center flex-1">
                                    <div className="h-12 w-12 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-2 border border-zinc-700">
                                        <span className="text-zinc-400 font-bold text-lg">{match.away_team.charAt(0)}</span>
                                    </div>
                                    <p className="font-bold text-zinc-400 text-sm truncate">{match.away_team}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 pt-4 border-t border-zinc-800/50">
                                <div className="flex items-center text-xs text-zinc-400">
                                    <MapPin className="mr-2 ml-2 h-3.5 w-3.5 text-zinc-500" />
                                    {match.stadium}
                                </div>
                                <div className="flex items-center text-xs text-zinc-400">
                                    <Users className="mr-2 ml-2 h-3.5 w-3.5 text-zinc-500" />
                                    المدرب: {match.coach_name}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                                <Button
                                    onClick={() => navigate(`/matches/${match.id || match.match_id}/squad`)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 h-9 text-xs"
                                >
                                    <Users className="mr-2 h-3.5 w-3.5" />
                                    القائمة
                                </Button>
                                <Button
                                    onClick={() => navigate(`/matches/${match.id || match.match_id}/sheet`)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs"
                                >
                                    <FileText className="mr-2 h-3.5 w-3.5" />
                                    ورقة اللقاء
                                </Button>
                                {user?.role === 'admin' && (
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingMatch(match); setIsModalOpen(true); }} className="h-9 w-9 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMatch(match.id || match.match_id)} className="h-9 w-9 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingMatch(null); }} title={editingMatch ? "تعديل ورقة اللقاء" : "إنشاء ورقة لقاء الجديدة"}>
                <form onSubmit={handleSaveMatch} className="space-y-4 font-tajawal">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">تاريخ المباراة</label>
                            <input required name="match_date" defaultValue={editingMatch?.match_date} type="date" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">المنافسة / البطولة</label>
                            <input required name="competition" defaultValue={editingMatch?.competition} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 outline-none" placeholder="مثال: البطولة الوطنية U15" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">الفريق المستضيف (Home)</label>
                            <input required name="home_team" defaultValue={editingMatch?.home_team} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 outline-none" placeholder="اسم الفريق" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">الفريق الضيف (Away)</label>
                            <input required name="away_team" defaultValue={editingMatch?.away_team} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 outline-none" placeholder="اسم الفريق" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">الملعب</label>
                            <input required name="stadium" defaultValue={editingMatch?.stadium} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 outline-none" placeholder="اسم الملعب" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">الفئة</label>
                            <input required name="category" defaultValue={editingMatch?.category} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 outline-none" placeholder="مثال: U17" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">المدرب الرئيسي</label>
                            <input required name="coach_name" defaultValue={editingMatch?.coach_name} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 outline-none" placeholder="اسم المدرب" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">المدرب المساعد</label>
                            <input name="assistant_coach" defaultValue={editingMatch?.assistant_coach} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 outline-none" placeholder="اسم المساعد" />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingMatch(null); }} className="border-zinc-800 text-zinc-300">إلغاء</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">{editingMatch ? "تحديث البيانات" : "إنشاء المباراة"}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="حذف ورقة اللقاء"
                message="هل أنت متأكد من حذف ورقة اللقاء هذه؟ سيتم حذف جميع اللاعبين والأحداث المسجلة لها."
            />
        </div>
    );
}
