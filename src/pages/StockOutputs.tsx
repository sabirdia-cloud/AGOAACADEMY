import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Printer, Edit, Trash2, PackageMinus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { exportToPDF } from "@/lib/pdf-export";
import { StockReceiptTemplate } from "@/components/PrintTemplates";
import { PrintPortal } from "@/components/PrintPortal";

export function StockOutputs() {
  const [outputs, setOutputs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingOutput, setEditingOutput] = useState<any>(null);
  const [outputToDelete, setOutputToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([{ id: Date.now(), product_name: "", quantity: 1 }]);
  const [printingOutput, setPrintingOutput] = useState<any>(null);
  const [academySettings, setAcademySettings] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [data, settingsData, invData] = await Promise.all([
        api.getStockOutputs(),
        api.getAcademySettings(),
        api.getInventory()
      ]);
      setOutputs(data || []);
      setAcademySettings(settingsData);
      setInventory(invData || []);
    } catch (error) {
      console.error("Failed to load stock outputs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), product_name: "", quantity: 1 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSaveOutput = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const finalItems = items.map(item => ({
      product_name: item.product_name,
      quantity: Number(item.quantity),
    }));

    // Stock validation
    for (const item of finalItems) {
      const invItem = inventory.find(i => i.product_name === item.product_name);

      // If we are editing, we should ideally account for the previous quantity,
      // but for simplicity, we check if requested quantity exceeds (available + previous output quantity)
      let available = invItem ? invItem.remaining_stock : 0;
      if (editingOutput) {
        let prevItemQty = 0;
        if (editingOutput.items && Array.isArray(editingOutput.items)) {
          const prevItem = editingOutput.items.find((i: any) => i.product_name === item.product_name);
          if (prevItem) prevItemQty = Number(prevItem.quantity);
        } else if (editingOutput.product_name === item.product_name) {
          prevItemQty = Number(editingOutput.quantity);
        }
        available += prevItemQty;
      }

      if (!invItem || item.quantity > available) {
        alert(`خطأ: الكمية المطلوبة من ${item.product_name} غير متوفرة في المخزن. المتوفر حالياً: ${available}`);
        return;
      }
    }

    const outputData = {
      receipt_number: formData.get("receipt_number") as string,
      output_date: formData.get("output_date") as string,
      items: finalItems,
      // Fallback
      product_name: finalItems[0]?.product_name,
      quantity: finalItems.reduce((sum, it) => sum + it.quantity, 0),
      beneficiary: formData.get("beneficiary") as string,
      notes: formData.get("notes") as string,
    };

    try {
      if (editingOutput) {
        await api.updateStockOutput(editingOutput.output_id, outputData);
      } else {
        await api.addStockOutput(outputData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingOutput(null);
      setItems([{ id: Date.now(), product_name: "", quantity: 1 }]);
    } catch (error) {
      console.error("Failed to save stock output:", error);
      alert("حدث خطأ أثناء حفظ الوصل.");
    }
  };

  const handleDelete = async (id: number) => {
    setOutputToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (outputToDelete) {
      try {
        await api.deleteStockOutput(outputToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete stock output:", error);
      } finally {
        setOutputToDelete(null);
      }
    }
  };

  const handlePrint = (output: any) => {
    setPrintingOutput(output);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">وصول الإخراج (Bon de sortie)</h2>
          <p className="text-zinc-400 mt-1">إدارة وصول إخراج العتاد والمنتجات.</p>
        </div>
        <Button onClick={() => { setEditingOutput(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
                  <th className="px-4 py-3 font-medium">الجهة المستفيدة</th>
                  <th className="px-4 py-3 font-medium">ملاحظة</th>
                  <th className="px-4 py-3 font-medium text-center">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">جاري التحميل...</td></tr>
                ) : outputs.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">لا توجد وصول إخراج مسجلة</td></tr>
                ) : (
                  outputs.map((output, index) => (
                    <tr key={output.output_id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-3 text-zinc-300">{index + 1}</td>
                      <td className="px-4 py-3 text-zinc-50 font-medium">{output.receipt_number}</td>
                      <td className="px-4 py-3 text-zinc-300">{output.output_date}</td>
                      <td className="px-4 py-3 text-zinc-300">
                        {output.items && output.items.length > 1
                          ? `${output.items[0].product_name} (+${output.items.length - 1} أصناف)`
                          : (output.product_name || output.items?.[0]?.product_name)}
                      </td>
                      <td className="px-4 py-3 text-rose-400 font-bold">
                        {output.items && Array.isArray(output.items)
                          ? output.items.reduce((sum: number, it: any) => sum + it.quantity, 0)
                          : output.quantity}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{output.beneficiary}</td>
                      <td className="px-4 py-3 text-zinc-500 truncate max-w-[150px]">{output.notes}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handlePrint(output)} className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 h-8 w-8">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingOutput(output);
                            if (output.items && Array.isArray(output.items)) {
                              setItems(output.items.map((it: any, idx: number) => ({ ...it, id: Date.now() + idx })));
                            } else {
                              setItems([{ id: Date.now(), product_name: output.product_name, quantity: output.quantity }]);
                            }
                            setIsModalOpen(true);
                          }} className="text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(output.output_id)} className="text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingOutput(null); }} title={editingOutput ? "تعديل وصل إخراج" : "إضافة وصل إخراج جديد"}>
        <form onSubmit={handleSaveOutput} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">رقم الوصل</label>
              <input required name="receipt_number" defaultValue={editingOutput?.receipt_number} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">تاريخ الوصل</label>
              <input required name="output_date" defaultValue={editingOutput?.output_date} type="date" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="space-y-4 border-y border-zinc-800 py-4 my-2">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-rose-400">قائمة المواد المراد إخراجها</h3>
              <Button type="button" onClick={handleAddItem} size="sm" className="h-7 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-600/50">
                <Plus className="mr-1 h-3 w-3" /> إضافة صنف
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-zinc-900/30 p-2 rounded-lg border border-zinc-800/50">
                  <div className="col-span-7 space-y-1">
                    <label className="text-[10px] text-zinc-500">اسم المنتج</label>
                    <select required value={item.product_name} onChange={(e) => handleItemChange(item.id, 'product_name', e.target.value)} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1.5 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none">
                      <option value="">-- اختر المنتج --</option>
                      {inventory.map(inv => {
                        // Calculate available including current editing amounts
                        let available = inv.remaining_stock;
                        if (editingOutput) {
                          let prevItemQty = 0;
                          if (editingOutput.items && Array.isArray(editingOutput.items)) {
                            const prevItem = editingOutput.items.find((i: any) => i.product_name === inv.product_name);
                            if (prevItem) prevItemQty = Number(prevItem.quantity);
                          } else if (editingOutput.product_name === inv.product_name) {
                            prevItemQty = Number(editingOutput.quantity);
                          }
                          available += prevItemQty;
                        }
                        return (
                          <option key={inv.product_name} value={inv.product_name} disabled={available <= 0 && item.product_name !== inv.product_name}>
                            {inv.product_name} (متوفر: {available})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] text-zinc-500">الكمية</label>
                    <input required value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} type="number" min="1" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1.5 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button type="button" variant="ghost" onClick={() => handleRemoveItem(item.id)} disabled={items.length === 1} className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">الجهة المستفيدة</label>
            <input name="beneficiary" defaultValue={editingOutput?.beneficiary} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">ملاحظة</label>
            <textarea name="notes" defaultValue={editingOutput?.notes} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none h-20" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingOutput(null); }} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">{editingOutput ? "تحديث" : "حفظ"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف وصل إخراج"
        message="هل أنت متأكد من حذف هذا الوصل؟ سيؤثر هذا على المخزون."
      />

      {printingOutput && (
        <PrintPortal
          onClose={() => setPrintingOutput(null)}
          title={`وصل إخراج - ${printingOutput.receipt_number}`}
          fileName={`StockOutput-${printingOutput.receipt_number}`}
          id="stock-receipt"
        >
          <div className="bg-white p-4">
            <StockReceiptTemplate data={printingOutput} type="output" academySettings={academySettings} />
          </div>
        </PrintPortal>
      )}
    </div>
  );
}
