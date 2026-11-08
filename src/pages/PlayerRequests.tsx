import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, User, Calendar, Phone, Users, Search, Loader2, Shield } from "lucide-react";
import { api } from "@/services/api";
import { supabase } from "@/services/supabaseClient";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function PlayerRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [requestsData, teamsData] = await Promise.all([
        api.getPlayerRequests(),
        api.getTeams()
      ]);
      setRequests(requestsData);
      setTeams(teamsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveClick = (request: any) => {
    setSelectedRequest(request);
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest || !selectedTeamId) return;

    setIsProcessing(true);
    try {
      const selectedTeam = teams.find(t => t.team_id === Number(selectedTeamId));

      // 1. Update existing player to remove [REQ] (if present) and assign team
      const playerData = {
        name: selectedRequest.name.replace('[REQ] ', '').trim(),
        category: selectedTeam?.category || selectedRequest.category,
        team_id: Number(selectedTeamId),
        status: 'active', // Mark as active after approval
        join_date: new Date().toISOString().split('T')[0],
      };

      await api.updatePlayer(selectedRequest.player_id, playerData);

      // 2. Link to parent (Smarter Linkage)
      let parentIdToLink = selectedRequest.parent_id;

      // If no parent_id, try to find parent by username or phone
      if (!parentIdToLink) {
        const identifier = selectedRequest.parent_username || selectedRequest.phone;
        const { data: foundParent } = await supabase
          .from('parents')
          .select('id')
          .or(`username.eq.${identifier},phone.eq.${identifier}`)
          .maybeSingle();

        if (foundParent) {
          parentIdToLink = foundParent.id;
        }
      }

      if (parentIdToLink) {
        const { data: existingLink } = await supabase
          .from('parent_players')
          .select('*')
          .eq('parent_id', parentIdToLink)
          .eq('player_id', selectedRequest.player_id)
          .maybeSingle();

        if (!existingLink) {
          await supabase.from('parent_players').insert([
            { parent_id: parentIdToLink, player_id: selectedRequest.player_id }
          ]);
        }
      }

      // 3. Notify Parent
      const msg = `تهانينا! تم قبول طلب تسجيل اللاعب (${playerData.name}) في الفئة (${playerData.category}). يمكنكم الآن تسجيل الدخول لمتابعة التفاصيل.`;
      await api.addParentNotification({
        parent_id: selectedRequest.parent_id,
        parent_identifier: selectedRequest.parent_username || selectedRequest.phone,
        title: 'تم قبول طلب التسجيل ✨',
        message: msg,
        type: 'alert'
      });

      // offer whatsapp
      if (selectedRequest.phone) {
        api.sendWhatsAppNotification(selectedRequest.phone, msg);
      }

      await loadData();
      setIsApproveModalOpen(false);
      setSelectedRequest(null);
      setSelectedTeamId("");
    } catch (error) {
      console.error("Failed to approve request:", error);
      alert("حدث خطأ أثناء معالجة الطلب.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (request: any) => {
    setSelectedRequest(request);
    setIsRejectConfirmOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      // 1. Notify Parent before deletion if we have info
      const msg = `نعتذر منكم، لقد تم رفض طلب تسجيل اللاعب (${selectedRequest.name.replace('[REQ] ', '')}) للأكاديمية حالياً. للمزيد من التفاصيل يرجى التواصل مع الإدارة.`;

      try {
        await api.addParentNotification({
          parent_id: selectedRequest.parent_id,
          parent_identifier: selectedRequest.parent_username || selectedRequest.phone,
          title: 'تحديث بشأن طلب التسجيل',
          message: msg,
          type: 'alert'
        });
      } catch (e) { /* ignore if notification fails due to missing parent link */ }

      // 2. Delete the player record
      await api.deletePlayer(selectedRequest.player_id);

      await loadData();
      setIsRejectConfirmOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Failed to reject request:", error);
      alert("حدث خطأ أثناء معالجة الطلب.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r =>
    (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.phone || "").includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">طلبات التسجيل</h2>
          <p className="text-zinc-400 mt-1 text-sm">مراجعة ومعالجة طلبات الانضمام الجديدة للأكاديمية.</p>
        </div>
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-0">
          <div className="p-3 sm:p-4 border-b border-zinc-800/50">
            <div className="relative w-full max-w-md">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-950/50 pr-10 pl-4 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-zinc-800/50">
            {isLoading ? (
              <div className="py-10 text-center text-zinc-500">جاري التحميل...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-10 text-center text-zinc-500">لا توجد طلبات معلقة</div>
            ) : filteredRequests.map((request) => (
              <div key={request.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-500 flex-shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-50">{request.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{request.category} • {request.birth_date}</p>
                    <p className="text-xs text-zinc-500 mt-1">{request.father_name} - {request.phone}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">تاريخ الطلب: {new Date(request.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => handleApproveClick(request)}
                    className="flex-1 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 h-9 text-xs"
                  >
                    <Check className="ml-1 h-3.5 w-3.5" /> قبول
                  </Button>
                  <Button
                    onClick={() => handleRejectClick(request)}
                    className="flex-1 bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-500/20 h-9 text-xs"
                  >
                    <X className="ml-1 h-3.5 w-3.5" /> رفض
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-zinc-400 bg-zinc-950/50 border-b border-zinc-800/50">
                <tr>
                  <th className="px-6 py-4 font-medium">اللاعب</th>
                  <th className="px-6 py-4 font-medium">تاريخ الميلاد</th>
                  <th className="px-6 py-4 font-medium">الفئة المقترحة</th>
                  <th className="px-6 py-4 font-medium">ولي الأمر</th>
                  <th className="px-6 py-4 font-medium">الهاتف</th>
                  <th className="px-6 py-4 font-medium">تاريخ الطلب</th>
                  <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500">جاري التحميل...</td></tr>
                ) : filteredRequests.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500">لا توجد طلبات معلقة حالياً</td></tr>
                ) : filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-500">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-zinc-50">{request.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{request.birth_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{request.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{request.father_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{request.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400 text-xs">
                      {new Date(request.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleApproveClick(request)}
                          className="bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 h-8 px-3 text-xs"
                        >
                          <Check className="ml-1 h-3 w-3" /> قبول
                        </Button>
                        <Button
                          onClick={() => handleRejectClick(request)}
                          className="bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-500/20 h-8 px-3 text-xs"
                        >
                          <X className="ml-1 h-3 w-3" /> رفض
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="قبول طلب التسجيل"
      >
        <div className="space-y-6 pt-4">
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">سيتم إضافة اللاعب</p>
            <p className="text-xl font-black text-emerald-500">{selectedRequest?.name}</p>
            <p className="text-sm text-zinc-400">الفئة المطلوبة من الولي: <span className="text-zinc-50 font-bold">{selectedRequest?.category}</span></p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" /> تعيين الفئة / الفوج الرسمي *
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none transition-all"
            >
              <option value="">اختر الفئة / الفوج المناسب</option>
              {teams.map(team => (
                <option key={team.team_id} value={team.team_id}>{team.category} - {team.team_name}</option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 italic">يتم اختيار الفئة وفقاً للعمر والنتائج الفنية.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)} className="border-zinc-800 text-zinc-400 hover:text-white rounded-xl">إلغاء</Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={!selectedTeamId || isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-emerald-900/20"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : "تأكيد القبال وإضافة اللاعب"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isRejectConfirmOpen}
        onClose={() => setIsRejectConfirmOpen(false)}
        onConfirm={handleConfirmReject}
        title="رفض طلب التسجيل"
        message={`هل أنت متأكد من رفض طلب التسجيل الخاص بـ ${selectedRequest?.name}؟`}
        confirmLabel="نعم، رفض الطلب"
        cancelLabel="إلغاء"
      />
    </div>
  );
}

