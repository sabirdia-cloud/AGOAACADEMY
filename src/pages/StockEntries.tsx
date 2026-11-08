import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Printer, Edit, Trash2, PackagePlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { exportToPDF } from "@/lib/pdf-export";
import { StockReceiptTemplate } from "@/components/PrintTemplates";
import { PrintPortal } from "@/components/PrintPortal";

export function StockEntries() {
  const [entries, setEntries] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([{ id: Date.now(), product_name: "", quantity: 1, unit_price: 0 }]);
  const [printingEntry, setPrintingEntry] = useState<any>(null);
  const [academySettings, setAcademySettings] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [data, settingsData] = await Promise.all([
        api.getStockEntries(),
        api.getAcademySettings()
      ]);
      setEntries(data || []);
      setAcademySettings(settingsData);
    } catch (error) {
      console.error("Failed to load stock entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), product_name: "", quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSaveEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const finalItems = items.map(item => ({
      product_name: item.product_name,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total_price: Number(item.quantity) * Number(item.unit_price)
    }));

    const totalAmount = finalItems.reduce((sum, item) => sum + item.total_price, 0);

    const entryData = {
      receipt_number: formData.get("receipt_number") as string,
      entry_date: formData.get("entry_date") as string,
      items: finalItems,
      total_amount: totalAmount,
      product_name: finalItems[0]?.product_name,
      quantity: finalItems[0]?.quantity,
      unit_price: finalItems[0]?.unit_price,
      total_price: totalAmount,
      purchase_date: formData.get("purchase_date") as string,
      source: formData.get("source") as string,
      notes: formData.get("notes") as string,
    };

    try {
      if (editingEntry) {
        await api.updateStockEntry(editingEntry.entry_id, entryData);
      } else {
        await api.addStockEntry(entryData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingEntry(null);
      setItems([{ id: Date.now(), product_name: "", quantity: 1, unit_price: 0 }]);
    } catch (error: any) {
      console.error("Failed to save stock entry:", error);
      alert(`حدث خطأ أثناء حفظ الوصل: ${error.message || "خطأ غير معروف"}`);
    }
  };

  const handleDelete = async (id: number) => {
    setEntryToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      try {
        await api.deleteStockEntry(entryToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete stock entry:", error);
      } finally {
        setEntryToDelete(null);
      }
    }
  };

  const handlePrint = (entry: any) => {
    setPrintingEntry(entry);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">وصول الإدخال (Bon d'entrée)</h2>
          <p className="text-zinc-400 mt-1">إدارة وصول إدخال العتاد والمنتجات.</p>
        </div>
        <Button onClick={() => { setEditingEntry(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          إضافة وصل جديد
        </Button>
      </div>

      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-zinc-900/60 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">الرقم</th>
                  <th className="px-4 py-3 font-medium">رقم الوصل</th>
                  <th className="px-4 py-3 font-medium">تاريخ الوصل</th>
                  <th className="px-4 py-3 font-medium">اسم المنتوج</th>
                  <th className="px-4 py-3 font-medium">الكمية</th>
                  <th className="px-4 py-3 font-medium">سعر الوحدة</th>
                  <th className="px-4 py-3 font-medium">الإجمالي</th>
                  <th className="px-4 py-3 font-medium">تاريخ الشراء</th>
                  <th className="px-4 py-3 font-medium">المصدر</th>
                  <th className="px-4 py-3 font-medium">ملاحظة</th>
                  <th className="px-4 py-3 font-medium text-center">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-500">جاري التحميل...</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-500">لا توجد وصول إدخال مسجلة</td></tr>
                ) : (
                  entries.map((entry, index) => {
                    const total = entry.items && Array.isArray(entry.items)
                      ? entry.items.reduce((sum: number, it: any) => sum + it.total_price, 0)
                      : (entry.total_price || (entry.quantity * (entry.unit_price || 0)));

                    return (
                      <tr key={entry.entry_id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-4 py-3 text-zinc-300">{index + 1}</td>
                        <td className="px-4 py-3 text-zinc-50 font-medium">{entry.receipt_number}</td>
                        <td className="px-4 py-3 text-zinc-300">{entry.entry_date}</td>
                        <td className="px-4 py-3 text-zinc-300">
                          {entry.items && entry.items.length > 1
                            ? `${entry.items[0].product_name} (+${entry.items.length - 1} أصناف)`
                            : (entry.product_name || entry.items?.[0]?.product_name)}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">
                          {entry.items && Array.isArray(entry.items)
                            ? entry.items.reduce((sum: number, it: any) => sum + it.quantity, 0)
                            : entry.quantity}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {entry.items && entry.items.length === 1
                            ? entry.items[0].unit_price.toFixed(2).replace('.', ',')
                            : entry.unit_price?.toFixed(2).replace('.', ',') || "---"} دج
                        </td>
                        <td className="px-4 py-3 text-zinc-50 font-bold">
                          {total.toFixed(2).replace('.', ',')} دج
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{entry.purchase_date}</td>
                        <td className="px-4 py-3 text-zinc-400">{entry.source}</td>
                        <td className="px-4 py-3 text-zinc-500 truncate max-w-[150px]">{entry.notes}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handlePrint(entry)} className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 h-8 w-8">
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingEntry(entry);
                              if (entry.items && Array.isArray(entry.items)) {
                                setItems(entry.items.map((it: any, idx: number) => ({ ...it, id: Date.now() + idx })));
                              } else {
                                setItems([{ id: Date.now(), product_name: entry.product_name, quantity: entry.quantity, unit_price: entry.unit_price }]);
                              }
                              setIsModalOpen(true);
                            }} className="text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.entry_id)} className="text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEntry(null); }} title={editingEntry ? "تعديل وصل إدخال" : "إضافة وصل إدخال جديد"}>
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">رقم الوصل</label>
              <input required name="receipt_number" defaultValue={editingEntry?.receipt_number} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">تاريخ الوصل</label>
              <input required name="entry_date" defaultValue={editingEntry?.entry_date} type="date" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div className="space-y-4 border-y border-zinc-800 py-4 my-2">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-emerald-400">قائمة المواد المشتراة</h3>
              <Button type="button" onClick={handleAddItem} size="sm" className="h-7 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/50">
                <Plus className="mr-1 h-3 w-3" /> إضافة صنف
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-zinc-900/30 p-2 rounded-lg border border-zinc-800/50">
                  <div className="col-span-5 space-y-1">
                    <label className="text-[10px] text-zinc-500">اسم المنتج</label>
                    <input required value={item.product_name} onChange={(e) => handleItemChange(item.id, 'product_name', e.target.value)} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1.5 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-zinc-500">الكمية</label>
                    <input required value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} type="number" min="1" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1.5 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] text-zinc-500">سعر الوحدة</label>
                    <input required value={item.unit_price} onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)} type="number" step="0.01" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1.5 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button type="button" variant="ghost" onClick={() => handleRemoveItem(item.id)} disabled={items.length === 1} className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end px-3 py-2 bg-emerald-500/5 rounded border border-emerald-500/20">
              <span className="text-xs text-zinc-400 ml-3 self-center">الإجمالي الكلي للوصل:</span>
              <span className="text-base font-black text-emerald-400">
                {items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unit_price)), 0).toFixed(2).replace('.', ',')} دج
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">تاريخ الشراء</label>
              <input name="purchase_date" defaultValue={editingEntry?.purchase_date} type="date" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">المصدر</label>
              <input name="source" defaultValue={editingEntry?.source} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">ملاحظة</label>
            <textarea name="notes" defaultValue={editingEntry?.notes} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none h-20" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingEntry(null); }} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">{editingEntry ? "تحديث" : "حفظ"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف وصل إدخال"
        message="هل أنت متأكد من حذف هذا الوصل؟ سيؤثر هذا على المخزون."
      />

      {printingEntry && (
        <PrintPortal
          onClose={() => setPrintingEntry(null)}
          title={`وصل إدخال - ${printingEntry.receipt_number}`}
          fileName={`StockEntry-${printingEntry.receipt_number}`}
          id="stock-receipt"
        >
          <div className="bg-white p-4">
            <StockReceiptTemplate data={printingEntry} type="entry" academySettings={academySettings} />
          </div>
        </PrintPortal>
      )
      }
    </div >
  );
}
