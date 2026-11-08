import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Shield, Trophy, FolderPlus, Trash2, Edit2, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";

export function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, type: 'group' | 'category' } | null>(null);
  const [defaultCategoryForNewGroup, setDefaultCategoryForNewGroup] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [teamsData, coachesData, categoriesData] = await Promise.all([
        api.getTeams(),
        api.getCoaches(),
        api.getCategories()
      ]);
      setTeams(teamsData);
      setCoaches(coachesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const groupData = {
      team_name: formData.get("team_name") as string,
      coach_id: Number(formData.get("coach_id")),
      category: formData.get("category") as string || "غير محدد",
      players_count: Number(formData.get("players_count")) || 0,
    };

    try {
      if (editingGroup) {
        await api.updateTeam(editingGroup.team_id, groupData);
      } else {
        await api.addTeam(groupData);
      }
      await loadData();
      setIsGroupModalOpen(false);
      setEditingGroup(null);
    } catch (error) {
      console.error("Failed to save group:", error);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryData = {
      name: formData.get("name") as string,
      age_group: formData.get("age_group") as string,
      color: formData.get("color") as string || "#10b981",
    };

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.category_id, categoryData);
      } else {
        await api.addCategory(categoryData);
      }
      await loadData();
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const handleDelete = (id: number, type: 'group' | 'category') => {
    setItemToDelete({ id, type });
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        if (itemToDelete.type === 'group') {
          await api.deleteTeam(itemToDelete.id);
        } else {
          await api.deleteCategory(itemToDelete.id);
        }
        await loadData();
      } catch (error) {
        console.error("Failed to delete:", error);
      } finally {
        setItemToDelete(null);
        setIsConfirmOpen(false);
      }
    }
  };

  const getCoachName = (id: number) => {
    const coach = coaches.find(c => c.coach_id === id);
    return coach ? coach.name : "غير محدد";
  };

  if (isGroupModalOpen) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800/50 animate-in fade-in zoom-in duration-300">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-zinc-800/50 pb-4">
          <Button variant="ghost" size="icon" onClick={() => { setIsGroupModalOpen(false); setEditingGroup(null); }} className="text-zinc-400 hover:text-white shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-zinc-50">{editingGroup ? "تعديل الفوج" : "إضافة فوج جديد"}</CardTitle>
            <p className="text-zinc-400 text-sm">أدخل تفاصيل الفوج بدقة.</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
        <form onSubmit={handleSaveGroup} className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">اسم الفوج</label>
            <input required name="team_name" defaultValue={editingGroup?.team_name} type="text" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none transition-all" placeholder="مثال: فوج أ" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">الفئة</label>
            <select required name="category" defaultValue={editingGroup?.category || defaultCategoryForNewGroup} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
              <option value="">اختر الفئة</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">المدرب</label>
            <select required name="coach_id" defaultValue={editingGroup?.coach_id} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
              <option value="">اختر المدرب</option>
              {coaches.map(coach => (
                <option key={coach.coach_id} value={coach.coach_id}>
                  {coach.name} {coach.category ? `(${coach.category})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">عدد اللاعبين الحالي</label>
            <input name="players_count" defaultValue={editingGroup?.players_count || 0} type="number" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="pt-4 flex justify-end gap-3 sm:col-span-2 border-t border-zinc-800/50">
            <Button type="button" variant="outline" onClick={() => { setIsGroupModalOpen(false); setEditingGroup(null); }} className="border-zinc-800 text-zinc-300 w-full sm:w-auto h-12 rounded-xl">إلغاء</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 rounded-xl font-bold">
              {editingGroup ? "تحديث الفوج" : "حفظ الفوج"}
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    );
  }

  if (isCategoryModalOpen) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800/50 animate-in fade-in zoom-in duration-300">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-zinc-800/50 pb-4">
          <Button variant="ghost" size="icon" onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} className="text-zinc-400 hover:text-white shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-zinc-50">{editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}</CardTitle>
            <p className="text-zinc-400 text-sm">حدد اسم الفئة وعمرها واللون المميز لها.</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
        <form onSubmit={handleSaveCategory} className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">اسم الفئة</label>
            <input required name="name" defaultValue={editingCategory?.name} type="text" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="مثال: U17" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">الفئة العمرية (وصف)</label>
            <input required name="age_group" defaultValue={editingCategory?.age_group} type="text" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="مثال: 16-17 سنة" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-zinc-400">لون الوسم</label>
            <div className="flex gap-4 items-center border border-zinc-800 bg-zinc-950 p-2 rounded-xl">
              <input name="color" defaultValue={editingCategory?.color || "#10b981"} type="color" className="h-14 w-14 rounded-lg bg-transparent cursor-pointer focus:outline-none" />
              <p className="text-xs font-bold text-zinc-300">سيظهر هذا اللون في شريط الفوج الجانبي.</p>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 sm:col-span-2 border-t border-zinc-800/50">
            <Button type="button" variant="outline" onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} className="border-zinc-800 text-zinc-300 w-full sm:w-auto h-12 rounded-xl">إلغاء</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 rounded-xl font-bold">
              {editingCategory ? "تحديث الفئة" : "إضافة الفئة"}
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">إدارة الفئات والأفواج</h2>
          <p className="text-zinc-400 mt-1 text-sm font-medium">نظم اللاعبين حسب الفئات العمرية والأفواج التدريبية.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }} variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex-1 sm:flex-none">
            <Plus className="ml-2 h-4 w-4" />
            إضافة فئة
          </Button>
          <Button onClick={() => { setEditingGroup(null); setDefaultCategoryForNewGroup(""); setIsGroupModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none">
            <FolderPlus className="ml-2 h-4 w-4" />
            إضافة فوج
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-zinc-500 font-bold">جاري تحميل البيانات...</div>
      ) : categories.length === 0 ? (
        <Card className="bg-zinc-900 border-dashed border-zinc-800 p-12 text-center text-zinc-500">
          لا توجد فئات حالياً. ابدأ بإضافة أول فئة.
        </Card>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.category_id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: category.color }} />
                  <h3 className="text-lg font-black text-zinc-100">{category.name} ({category.age_group || 'غير محدد'})</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingGroup(null); setDefaultCategoryForNewGroup(category.name); setIsGroupModalOpen(true); }}
                    className="text-emerald-500 hover:bg-emerald-500/10 text-xs gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة فوج
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingCategory(category); setIsCategoryModalOpen(true); }}
                    className="text-zinc-500 hover:bg-zinc-800 p-1 h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.category_id, 'category')}
                    className="text-zinc-500 hover:bg-rose-950/30 hover:text-rose-500 p-1 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {teams.filter(t => t.category === category.name).length === 0 ? (
                  <div className="col-span-full py-4 text-center text-zinc-600 border border-dashed border-zinc-800 rounded-xl text-xs font-medium italic">
                    لا توجد أفواج حالياً لهذه الفئة.
                  </div>
                ) : (
                  teams.filter(t => t.category === category.name).map((group) => (
                    <Card key={group.team_id} className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-all group overflow-hidden">
                      <div className="h-1 w-full" style={{ backgroundColor: category.color }} />
                      <CardHeader className="p-4 flex flex-row justify-between items-start space-y-0">
                        <div>
                          <CardTitle className="text-sm font-black text-white">{group.team_name}</CardTitle>
                          <p className="text-[10px] text-zinc-500 mt-1 font-bold">المدرب: {getCoachName(group.coach_id)}</p>
                        </div>
                        <Shield className="h-4 w-4 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center justify-between mt-1 pt-3 border-t border-zinc-800/50">
                          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold">
                            <Users className="h-3 w-3" />
                            <span>{group.players_count} لاعب</span>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingGroup(group); setIsGroupModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(group.team_id, 'group')} className="p-1.5 rounded-lg hover:bg-rose-950/30 text-zinc-400 hover:text-rose-500 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals removed and replaced with inline forms */}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={itemToDelete?.type === 'group' ? "حذف الفوج" : "حذف الفئة"}
        message={itemToDelete?.type === 'group' ? "هل أنت متأكد من حذف هذا الفوج؟" : "هل أنت متأكد من حذف الفئة؟ سيتم حذف جميع الأفواج التابعة لها (ملاحظة: تأكد من نقل اللاعبين أولاً)."}
      />
    </div>
  );
}
