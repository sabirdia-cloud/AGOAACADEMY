import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, User, Phone, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";

const STAFF_ROLES = [
  { id: 'staff_storekeeper', name: 'أمين مخزن' },
  { id: 'staff_doctor', name: 'طبيب الأكاديمية' },
  { id: 'staff_assistant', name: 'مساعد إداري' }
];

export function StaffManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const staffData = await api.getStaff();
      setStaffList(staffData);
    } catch (error) {
      console.error("Failed to load staff list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);

    const staffData: any = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      username: formData.get("username") as string,
      role: formData.get("role") as string,
    };

    const password = formData.get("password") as string;
    if (password) {
      staffData.password = password;
    }

    try {
      if (editingStaff) {
        await api.updateStaff(editingStaff.staff_id, staffData);
        alert("تم تحديث بيانات الموظف بنجاح");
      } else {
        if (!password) {
          staffData.password = 'staff123';
        }
        await api.addStaff(staffData);
        alert("تم إضافة الموظف بنجاح");
      }
      await loadData();
      setIsModalOpen(false);
      setEditingStaff(null);
    } catch (error: any) {
      console.error("Failed to save staff:", error);
      alert("فشل الحفظ: يرجى التأكد من تشغيل ملف staff.sql في قاعدة البيانات أولاً. " + (error.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    setStaffToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (staffToDelete) {
      try {
        await api.deleteStaff(staffToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete staff:", error);
      } finally {
        setStaffToDelete(null);
      }
    }
  };

  const handleEditStaff = (staff: any) => {
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const getRoleName = (roleId: string) => {
    return STAFF_ROLES.find(r => r.id === roleId)?.name || roleId;
  };

  const filteredStaff = staffList.filter(s =>
    (s.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
    (s.phone || "").includes(searchQuery) ||
    (s.username || "").includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">الموظفين والصلاحيات</h2>
          <p className="text-zinc-400 mt-1 text-sm">إدارة الموظفين الإضافيين وصلاحياتهم (أمين مخزن، طبيب...).</p>
        </div>
        <Button onClick={() => { setEditingStaff(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          إضافة موظف
        </Button>
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 border-b border-zinc-800/50 gap-3">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو اسم المستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-950/50 pr-10 pl-4 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="sm:hidden divide-y divide-zinc-800/50">
            {isLoading ? (
              <div className="py-10 text-center text-zinc-500">جاري التحميل...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-10 text-center text-zinc-500">لا يوجد موظفين</div>
            ) : filteredStaff.map((staff) => (
              <div key={staff.staff_id} className="p-3 flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-50">{staff.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{staff.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/50">
                      {getRoleName(staff.role)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditStaff(staff)} className="text-zinc-400 hover:text-emerald-500 h-8 px-2 text-xs">تعديل</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteStaff(staff.staff_id)} className="text-zinc-400 hover:text-rose-500 h-8 px-2 text-xs">حذف</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-zinc-400 bg-zinc-950/50 border-b border-zinc-800/50">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">الاسم</th>
                  <th scope="col" className="px-6 py-4 font-medium">اسم المستخدم</th>
                  <th scope="col" className="px-6 py-4 font-medium">رقم الهاتف</th>
                  <th scope="col" className="px-6 py-4 font-medium text-emerald-500">الصلاحية (الدور)</th>
                  <th scope="col" className="px-6 py-4 font-medium text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">جاري التحميل...</td></tr>
                ) : filteredStaff.map((staff) => (
                  <tr key={staff.staff_id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-50 flex items-center gap-2">
                       <User className="w-4 h-4 text-zinc-400" /> {staff.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{staff.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{staff.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          {getRoleName(staff.role)}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditStaff(staff)} className="text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10">تعديل</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteStaff(staff.staff_id)} className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10">حذف</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingStaff(null); }} title={editingStaff ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}>
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الاسم الكامل *</label>
              <input required name="name" defaultValue={editingStaff?.name} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الدور / الصلاحية *</label>
              <select required name="role" defaultValue={editingStaff?.role || ""} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="" disabled>اختر الدور</option>
                {STAFF_ROLES.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">رقم الهاتف</label>
            <input name="phone" defaultValue={editingStaff?.phone} type="tel" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
          </div>

          <div className="border-t border-zinc-800 pt-4 mt-2">
            <h4 className="text-sm font-semibold text-emerald-500 mb-3">بيانات الدخول للنظام</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">اسم المستخدم (للتسجيل) *</label>
                <input required name="username" defaultValue={editingStaff?.username} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">كلمة المرور *</label>
                <input name="password" type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder={editingStaff ? "اتركه فارغاً للإبقاء على الحالية" : "تعيين كلمة مرور"} required={!editingStaff} />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingStaff(null); }} className="border-zinc-800 text-zinc-300" disabled={isSaving}>إلغاء</Button>
            <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  جاري الحفظ...
                </span>
              ) : (editingStaff ? "تحديث" : "حفظ الموظف")}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف الموظف"
        message="هل أنت متأكد من حذف هذا الموظف؟ لن يتمكن من الدخول للنظام بعد الآن."
      />
    </div>
  );
}
