import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, CreditCard, DollarSign, Calendar, CheckCircle, XCircle, Printer, Edit, Trash2, QrCode, Smartphone, Eye, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { PrintPortal } from "@/components/PrintPortal";
import { SubscriptionReceiptTemplate } from "@/components/PrintTemplates";
import { QRScannerModal } from "@/components/QRScannerModal";

export function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedPaymentForPrint, setSelectedPaymentForPrint] = useState<any>(null);
  const [academySettings, setAcademySettings] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const handleVerifyPayment = async (paymentId: number) => {
      if(!confirm("هل أنت متأكد من تأكيد هذا الدفع؟ سيتم تفعيل اشتراك اللاعب.")) return;
      setVerifyingId(paymentId);
      try {
          await api.updatePayment(paymentId, { status: 'مكتمل' });
          await loadData();
          alert("تم تأكيد الدفع بنجاح");
      } catch (err) {
          console.error(err);
          alert("فشل تأكيد الدفع");
      } finally {
          setVerifyingId(null);
      }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [paymentsData, subsData, playersData, settings] = await Promise.all([
        api.getPayments(),
        api.getSubscriptions(),
        api.getPlayers(),
        api.getAcademySettings().catch(() => null)
      ]);
      setPayments(paymentsData);
      setSubscriptions(subsData);
      setPlayers(playersData);
      setAcademySettings(settings);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subId = Number(formData.get("subscription_id"));
    const sub = subscriptions.find(s => s.subscription_id === subId);

    const paymentData = {
      subscription_id: subId,
      player_id: sub ? sub.player_id : null,
      amount: Number(formData.get("amount")),
      payment_date: formData.get("payment_date") as string,
      payment_method: formData.get("payment_method") as string,
      status: formData.get("status") as string,
      notes: formData.get("notes") as string,
    };

    try {
      if (editingPayment) {
        await api.updatePayment(editingPayment.payment_id, paymentData);
      } else {
        await api.addPayment(paymentData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingPayment(null);
    } catch (error: any) {
      console.error("Failed to save payment:", error);
      alert(`خطأ في الحفظ: ${error.message || 'يرجى التحقق من المدخلات أو قاعدة البيانات'}`);
    }
  };

  const handleDeletePayment = async (id: number) => {
    setPaymentToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (paymentToDelete) {
      try {
        await api.deletePayment(paymentToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete payment:", error);
      } finally {
        setPaymentToDelete(null);
        setIsConfirmOpen(false);
      }
    }
  };

  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const getPlayerNameBySubId = (subId: number) => {
    const sub = subscriptions.find(s => s.subscription_id === subId);
    if (!sub) return "غير محدد";
    const player = players.find(p => p.player_id === sub.player_id);
    return player ? player.name : "غير محدد";
  };

  const getSubPlanName = (subId: number) => {
    const sub = subscriptions.find(s => s.subscription_id === subId);
    return sub ? sub.plan_name : "غير محدد";
  };

  const handlePrint = (payment: any) => {
    setSelectedPaymentForPrint(payment);
    setIsPrinting(true);
  };

  const filteredPayments = payments.filter(p => {
    const sub = subscriptions.find(s => s.subscription_id === p.subscription_id);
    const player = sub ? players.find(pl => pl.player_id === sub.player_id) : null;
    const playerName = player ? player.name.toLowerCase() : "غير محدد";
    return playerName.includes(searchTerm.toLowerCase()) ||
      String(p.payment_id).includes(searchTerm) ||
      (player?.qr_code || "").includes(searchTerm);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">المدفوعات</h2>
          <p className="text-zinc-400 mt-1 text-sm">إدارة سجلات الدفع والتحصيل المالي من المشتركين.</p>
        </div>
        <Button onClick={() => { setEditingPayment(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto text-sm font-bold">
          <Plus className="mr-2 h-4 w-4" />
          تسجيل دفعة جديدة
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-zinc-900/40 p-3 sm:p-4 rounded-xl border border-zinc-800/50">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="بحث عن دفعة (اسم اللاعب أو QR)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-10 pl-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <Button variant="outline" onClick={() => setIsQrScannerOpen(true)} className="h-10 border-zinc-800 text-zinc-400 hover:text-emerald-500">
          <QrCode className="h-4 w-4" />
        </Button>
      </div>

      <PrintPortal
        isOpen={isPrinting}
        onClose={() => setIsPrinting(false)}
        title="وصل اشتراك"
      >
        {selectedPaymentForPrint && (
          <SubscriptionReceiptTemplate
            sub={{
              ...subscriptions.find(s => s.subscription_id === selectedPaymentForPrint.subscription_id),
              subscription_id: selectedPaymentForPrint.payment_id,
              amount: selectedPaymentForPrint.amount,
              start_date: subscriptions.find(s => s.subscription_id === selectedPaymentForPrint.subscription_id)?.start_date,
              end_date: subscriptions.find(s => s.subscription_id === selectedPaymentForPrint.subscription_id)?.end_date,
            }}
            playerName={getPlayerNameBySubId(selectedPaymentForPrint.subscription_id)}
            academySettings={academySettings}
            receiptNumber={payments.findIndex(p => p.payment_id === selectedPaymentForPrint.payment_id) + 1}
          />
        )}
      </PrintPortal>

      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-0">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-zinc-400 bg-zinc-950/50 border-b border-zinc-800/50">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">اللاعب</th>
                  <th scope="col" className="px-6 py-4 font-medium">الاشتراك</th>
                  <th scope="col" className="px-6 py-4 font-medium">المبلغ</th>
                  <th scope="col" className="px-6 py-4 font-medium">تاريخ الدفع</th>
                  <th scope="col" className="px-6 py-4 font-medium">طريقة الدفع</th>
                  <th scope="col" className="px-6 py-4 font-medium">الحالة</th>
                  <th scope="col" className="px-6 py-4 font-medium text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500">جاري التحميل...</td></tr>
                ) : filteredPayments.map((payment) => (
                  <tr key={payment.payment_id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-50">{getPlayerNameBySubId(payment.subscription_id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{getSubPlanName(payment.subscription_id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-50">{payment.amount} د.ج</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400">{payment.payment_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">
                      <div className="flex items-center gap-2">
                        {payment.payment_method === 'baridimob' && <Smartphone className="h-3 w-3 text-emerald-500" />}
                        {payment.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${payment.status === 'مكتمل' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20' :
                        payment.status === 'فاشل' ? 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20'
                        }`}>{payment.status || 'معلق'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {payment.proof_image_url && (
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => setProofPreview(payment.proof_image_url)}
                             className="h-8 w-8 text-amber-500 hover:bg-amber-500/10"
                             title="عرض الوصل"
                           >
                              <Eye className="h-4 w-4" />
                           </Button>
                        )}
                        {(payment.status === 'معلق' || (payment.payment_method === 'baridimob' && payment.status !== 'مكتمل')) && (
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => handleVerifyPayment(payment.payment_id)}
                             disabled={verifyingId === payment.payment_id}
                             className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                             title="تأكيد الدفع"
                           >
                              {verifyingId === payment.payment_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                           </Button>
                        )}
                        {payment.status === 'مكتمل' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePrint(payment)}
                              className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10"
                              title="طباعة الوصل"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const sub = subscriptions.find(s => s.subscription_id === payment.subscription_id);
                                const player = players.find(p => p.player_id === sub?.player_id);
                                const msg = `وصل استلام مالي من ${academySettings?.name || 'أكاديمية كرة القدم'}\n\nاللاعب: ${player?.name}\nالاشتراك: ${getSubPlanName(payment.subscription_id)}\nالمبلغ: ${payment.amount} د.ج\nالتاريخ: ${payment.payment_date}\nرقم الوصل: #${payment.payment_id}\n\nشكراً لثقتكم بنا! ⚽`;
                                api.sendWhatsAppNotification(player?.phone || '', msg);
                              }}
                              className="h-8 w-8 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                              title="إرسال عبر واتساب"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEditPayment(payment)} className="h-8 w-8 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(payment.payment_id)} className="h-8 w-8 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredPayments.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500">لا يوجد سجلات تطابق البحث</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingPayment(null); }} title={editingPayment ? "تعديل سجل الدفع" : "تسجيل دفعة جديدة"}>
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">الاشتراك</label>
            <select required name="subscription_id" defaultValue={editingPayment?.subscription_id} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
              <option value="">اختر الاشتراك</option>
              {subscriptions.map(s => (
                <option key={s.subscription_id} value={s.subscription_id}>{getPlayerNameBySubId(s.subscription_id)} - {s.plan_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">المبلغ</label>
              <input required name="amount" defaultValue={editingPayment?.amount} type="number" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">تاريخ الدفع</label>
              <input required name="payment_date" defaultValue={editingPayment?.payment_date} type="date" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">طريقة الدفع</label>
              <select required name="payment_method" defaultValue={editingPayment?.payment_method || "نقداً"} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="نقداً">نقداً</option>
                <option value="بريدي موب">بريدي موب (تحويل)</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الحالة</label>
              <select required name="status" defaultValue={editingPayment?.status || "مكتمل"} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="مكتمل">مكتمل</option>
                <option value="معلق">معلق</option>
                <option value="فاشل">فاشل</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">ملاحظات</label>
            <textarea name="notes" defaultValue={editingPayment?.notes} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="أي ملاحظات إضافية..." />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingPayment(null); }} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">{editingPayment ? "تحديث" : "حفظ"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!proofPreview} onClose={() => setProofPreview(null)} title="وصل الدفع (بريدي موب) 🧾">
          <div className="space-y-4">
              <div className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 p-2">
                  <img src={proofPreview || ''} alt="Payment Proof" className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-2xl" />
              </div>
              <Button onClick={() => setProofPreview(null)} className="w-full bg-zinc-800 text-white font-bold h-12 rounded-xl">إغلاق</Button>
          </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف سجل الدفع"
        message="هل أنت متأكد من حذف هذا السجل؟ سيؤدي هذا الإجراء إلى حذف كافة البيانات المرتبطة به بشكل دائم."
      />
      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScan={(code) => {
          const cleanCode = code.startsWith("PLAYER:") ? code.split(":")[1] : code;
          setSearchTerm(cleanCode);
        }}
        players={players}
      />
    </div>
  );
}
