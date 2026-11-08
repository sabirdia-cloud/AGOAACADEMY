import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus, TrendingUp, TrendingDown, Wallet, Filter,
    Trash2, Edit, Printer, FileText, Package, ChevronDown,
    ChevronUp, Hash, User, Calendar, X, Receipt,
    CreditCard, Coins, Users, Scale
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { format, eachMonthOfInterval, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import { PrintPortal } from "@/components/PrintPortal";
import { FinancialReportTemplate } from "@/components/PrintTemplates";
import { startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface InvoiceItem {
    id?: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    total: number;
}

interface ExpenseInvoice {
    id?: number;
    invoice_number: string;
    supplier_name: string;
    invoice_date: string;
    category: string;
    notes?: string;
    total_amount: number;
    items: InvoiceItem[];
}

// ─── Empty item helper ─────────────────────────────────────────────────────────
const emptyItem = (): InvoiceItem => ({
    item_name: "",
    quantity: 1,
    unit_price: 0,
    total: 0,
});

// ─── Invoice Modal ─────────────────────────────────────────────────────────────
function ExpenseInvoiceModal({
    isOpen,
    onClose,
    onSave,
    editingInvoice,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoice: any, items: InvoiceItem[]) => Promise<void>;
    editingInvoice: ExpenseInvoice | null;
}) {
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [supplierName, setSupplierName] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
    const [category, setCategory] = useState("مشتريات");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingInvoice) {
                setInvoiceNumber(editingInvoice.invoice_number || "");
                setSupplierName(editingInvoice.supplier_name || "");
                setInvoiceDate(editingInvoice.invoice_date || new Date().toISOString().split("T")[0]);
                setCategory(editingInvoice.category || "مشتريات");
                setNotes(editingInvoice.notes || "");
                setItems(editingInvoice.items?.length ? editingInvoice.items.map(i => ({ ...i })) : [emptyItem()]);
            } else {
                setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
                setSupplierName("");
                setInvoiceDate(new Date().toISOString().split("T")[0]);
                setCategory("مشتريات");
                setNotes("");
                setItems([emptyItem()]);
            }
        }
    }, [isOpen, editingInvoice]);

    const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
        setItems(prev => {
            const updated = [...prev];
            const item = { ...updated[index], [field]: value };
            if (field === "quantity" || field === "unit_price") {
                item.total = Number(item.quantity) * Number(item.unit_price);
            }
            updated[index] = item;
            return updated;
        });
    };

    const addItem = () => setItems(prev => [...prev, emptyItem()]);
    const removeItem = (index: number) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const grandTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierName.trim()) { alert("يرجى إدخال اسم المورد"); return; }
        const validItems = items.filter(i => i.item_name.trim());
        if (validItems.length === 0) { alert("يرجى إدخال سلعة واحدة على الأقل"); return; }

        setIsSaving(true);
        try {
            const invoiceData = {
                invoice_number: invoiceNumber,
                supplier_name: supplierName,
                invoice_date: invoiceDate,
                category,
                notes,
                total_amount: grandTotal,
                type: "expense",
            };
            await onSave(invoiceData, validItems.map(i => ({
                item_name: i.item_name,
                quantity: Number(i.quantity),
                unit_price: Number(i.unit_price),
                total: Number(i.total),
            })));
            onClose();
        } catch (err: any) {
            console.error(err);
            alert("حدث خطأ أثناء الحفظ: " + (err?.message || ""));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-xl">
                            <Receipt className="h-5 w-5 text-rose-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-50">
                                {editingInvoice ? "تعديل فاتورة المصاريف" : "فاتورة مصاريف جديدة"}
                            </h2>
                            <p className="text-xs text-zinc-500">أدخل بيانات الفاتورة والسلع</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Invoice header info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5 text-rose-400" /> رقم الفاتورة
                                </label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                    placeholder="INV-000001"
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-rose-400" /> اسم المورد *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={supplierName}
                                    onChange={e => setSupplierName(e.target.value)}
                                    placeholder="اسم الشركة أو المورد"
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-rose-400" /> تاريخ الفاتورة *
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={invoiceDate}
                                    onChange={e => setInvoiceDate(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-50 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400">الفئة</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-50 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition"
                                >
                                    <option value="مشتريات">مشتريات</option>
                                    <option value="معدات رياضية">معدات رياضية</option>
                                    <option value="أدوات مكتبية">أدوات مكتبية</option>
                                    <option value="صيانة">صيانة</option>
                                    <option value="خدمات">خدمات</option>
                                    <option value="كراء">كراء</option>
                                    <option value="نقل">نقل</option>
                                    <option value="أخرى">أخرى</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400">ملاحظات</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="ملاحظات اختيارية..."
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition"
                                />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-rose-400" />
                                    تفاصيل السلع
                                </h3>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-xs flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition"
                                >
                                    <Plus className="h-3.5 w-3.5" /> إضافة سلعة
                                </button>
                            </div>

                            <div className="rounded-xl border border-zinc-800 overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-zinc-900/80 text-xs font-semibold text-zinc-400 border-b border-zinc-800">
                                    <div className="col-span-5">تعيين السلعة</div>
                                    <div className="col-span-2 text-center">الكمية</div>
                                    <div className="col-span-3 text-center">سعر الوحدة (دج)</div>
                                    <div className="col-span-1 text-center">المجموع</div>
                                    <div className="col-span-1"></div>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-zinc-800/50">
                                    {items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 px-3 py-2.5 bg-zinc-950/30 hover:bg-zinc-900/20 transition-colors items-center">
                                            <div className="col-span-5">
                                                <input
                                                    type="text"
                                                    value={item.item_name}
                                                    onChange={e => updateItem(index, "item_name", e.target.value)}
                                                    placeholder={`سلعة ${index + 1}...`}
                                                    className="w-full bg-transparent border-b border-zinc-700 focus:border-rose-500 text-sm text-zinc-100 placeholder-zinc-600 py-1 outline-none transition"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(index, "quantity", e.target.value)}
                                                    className="w-full bg-transparent border-b border-zinc-700 focus:border-rose-500 text-sm text-zinc-100 text-center py-1 outline-none transition"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={e => updateItem(index, "unit_price", e.target.value)}
                                                    className="w-full bg-transparent border-b border-zinc-700 focus:border-rose-500 text-sm text-zinc-100 text-center py-1 outline-none transition"
                                                />
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <span className="text-sm font-bold text-rose-400">
                                                    {(Number(item.total) || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    disabled={items.length === 1}
                                                    className="text-zinc-600 hover:text-rose-400 disabled:opacity-20 disabled:cursor-not-allowed transition p-1 rounded"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Grand Total */}
                                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-t border-zinc-700">
                                    <span className="text-sm font-semibold text-zinc-400">المجموع العام للفاتورة</span>
                                    <span className="text-xl font-black text-rose-400">{grandTotal.toLocaleString()} دج</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-900/30"
                        >
                            {isSaving ? "جاري الحفظ..." : editingInvoice ? "تحديث الفاتورة" : "حفظ الفاتورة"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Income Modal ──────────────────────────────────────────────────────────────
function IncomeModal({
    isOpen,
    onClose,
    onSave,
    editingTransaction,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    editingTransaction: any;
}) {
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setIsSaving(true);
        try {
            await onSave({
                type: "income",
                category: formData.get("category") as string,
                amount: Number(formData.get("amount")),
                date: formData.get("date") as string,
                notes: formData.get("notes") as string,
            });
            onClose();
        } catch (err: any) {
            console.error(err);
            alert("حدث خطأ: " + (err?.message || ""));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-50">
                            {editingTransaction ? "تعديل المداخيل" : "تسجيل مداخيل"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-400">المصدر / الفئة</label>
                            <input
                                required
                                name="category"
                                defaultValue={editingTransaction?.category}
                                placeholder="مثل: منحة، دخل آخر..."
                                type="text"
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-400">التاريخ</label>
                            <input
                                required
                                name="date"
                                defaultValue={editingTransaction?.date || new Date().toISOString().split("T")[0]}
                                type="date"
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none transition"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400">المبلغ (دج)</label>
                        <input
                            required
                            name="amount"
                            defaultValue={editingTransaction?.amount}
                            type="number"
                            step="0.01"
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400">ملاحظات</label>
                        <textarea
                            name="notes"
                            defaultValue={editingTransaction?.notes}
                            placeholder="تفاصيل..."
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition h-20 resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">إلغاء</Button>
                        <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/30">
                            {isSaving ? "جاري الحفظ..." : editingTransaction ? "تحديث" : "حفظ"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Invoice Row ───────────────────────────────────────────────────────────────
function InvoiceRow({ invoice, onEdit, onDelete }: { invoice: ExpenseInvoice; onEdit: () => void; onDelete: () => void; }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <>
            <tr className="hover:bg-zinc-900/60 transition-colors group cursor-pointer" onClick={() => setExpanded(v => !v)}>
                <td className="px-4 py-3">
                    <span className="text-xs font-mono text-rose-300 bg-rose-500/10 px-2 py-1 rounded-md">{invoice.invoice_number}</span>
                </td>
                <td className="px-4 py-3">
                    <div className="font-semibold text-zinc-100 text-sm">{invoice.supplier_name}</div>
                    <div className="text-[10px] text-zinc-500">{invoice.category}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-sm">{invoice.invoice_date}</td>
                <td className="px-4 py-3">
                    <span className="font-black text-rose-400 text-sm">{(invoice.total_amount || 0).toLocaleString()} دج</span>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10">
                            <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10">
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="flex justify-center group-hover:hidden">
                        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={5} className="px-4 pb-4 bg-zinc-950/40">
                        <div className="rounded-xl border border-zinc-800 overflow-hidden mx-2">
                            <table className="w-full text-xs text-right">
                                <thead className="bg-zinc-900 text-zinc-500">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">تعيين السلعة</th>
                                        <th className="px-4 py-2 font-medium text-center">الكمية</th>
                                        <th className="px-4 py-2 font-medium text-center">سعر الوحدة</th>
                                        <th className="px-4 py-2 font-medium text-center">المجموع</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {(invoice.items || []).map((item, i) => (
                                        <tr key={i} className="hover:bg-zinc-900/30">
                                            <td className="px-4 py-2 text-zinc-200">{item.item_name}</td>
                                            <td className="px-4 py-2 text-center text-zinc-400">{item.quantity}</td>
                                            <td className="px-4 py-2 text-center text-zinc-400">{Number(item.unit_price).toLocaleString()} دج</td>
                                            <td className="px-4 py-2 text-center font-bold text-rose-400">{Number(item.total).toLocaleString()} دج</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-zinc-900/60">
                                        <td colSpan={3} className="px-4 py-2 text-right font-bold text-zinc-400">المجموع العام</td>
                                        <td className="px-4 py-2 text-center font-black text-rose-400">{(invoice.total_amount || 0).toLocaleString()} دج</td>
                                    </tr>
                                </tfoot>
                            </table>
                            {invoice.notes && (
                                <div className="px-4 py-2 border-t border-zinc-800 text-xs text-zinc-500 italic">
                                    ملاحظة: {invoice.notes}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function Finances() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [expenseInvoices, setExpenseInvoices] = useState<ExpenseInvoice[]>([]);

    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [editingInvoice, setEditingInvoice] = useState<ExpenseInvoice | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: "transaction" | "invoice"; id: any } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [academySettings, setAcademySettings] = useState<any>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [incomeFilter, setIncomeFilter] = useState<'all' | 'subscriptions' | 'other'>('all');
    const [dateRange] = useState({
        start: startOfMonth(new Date()).toISOString().split("T")[0],
        end: endOfMonth(new Date()).toISOString().split("T")[0],
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [paymentsData, subscriptionsData, financeData, invoicesData, settings, playersData] = await Promise.all([
                api.getPayments().catch(() => []),
                api.getSubscriptions().catch(() => []),
                api.getFinances().catch(() => []),
                api.getExpenseInvoices().catch(() => []),
                api.getAcademySettings().catch(() => null),
                api.getPlayers().catch(() => []),
            ]);

            setAcademySettings(settings);
            setExpenseInvoices(invoicesData || []);

            // 1. Process completed payments recorded in the payments table
            const validPayments = (paymentsData || []).filter((p: any) => p.status === "مكتمل" && Number(p.amount) > 0);
            const paidSubIds = new Set(validPayments.map((p: any) => Number(p.subscription_id)).filter(Boolean));

            const paymentIncomes = validPayments.map((p: any) => {
                const player = (playersData || []).find((pl: any) => pl.player_id === p.player_id);
                return {
                    id: `pay-${p.payment_id}`,
                    type: "income",
                    category: "اشتراكات اللاعبين",
                    amount: Number(p.amount) || 0,
                    date: p.payment_date || new Date().toISOString().split("T")[0],
                    notes: p.notes || (player ? `دفعة اشتراك - ${player.name}` : `دفعة اشتراك`),
                    is_subscription: true,
                    is_system: true,
                };
            });

            // 2. Process subscriptions without separate payment rows (active/completed)
            const directSubIncomes = (subscriptionsData || [])
                .filter((s: any) => Number(s.amount) > 0 && s.status !== 'معلق' && !paidSubIds.has(Number(s.subscription_id || s.id)))
                .map((s: any) => {
                    const player = (playersData || []).find((pl: any) => pl.player_id === s.player_id);
                    return {
                        id: `sub-${s.subscription_id || s.id}`,
                        type: "income",
                        category: "اشتراكات اللاعبين",
                        amount: Number(s.amount) || 0,
                        date: s.start_date || s.created_at || new Date().toISOString().split("T")[0],
                        notes: `اشتراك - ${player?.name || s.player_name || '---'} (${s.plan_name || 'خطة اشتراك'})`,
                        is_subscription: true,
                        is_system: true,
                    };
                });

            const allSubIncomes = [...paymentIncomes, ...directSubIncomes];

            // 3. Other/manual finances recorded directly in finances table
            const manualFinances = (financeData || []).map((f: any) => ({
                ...f,
                amount: Number(f.amount) || 0,
                is_subscription: false,
                is_system: false,
            }));

            const allTransactions = [...allSubIncomes, ...manualFinances].sort((a, b) =>
                new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            );
            setTransactions(allTransactions);
        } catch (error) {
            console.error("Failed to load financial data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveIncome = async (data: any) => {
        if (editingTransaction) {
            await api.updateFinance(editingTransaction.id, data);
        } else {
            await api.addFinance(data);
        }
        await loadData();
        setEditingTransaction(null);
    };

    const handleSaveInvoice = async (invoice: any, items: InvoiceItem[]) => {
        if (editingInvoice?.id) {
            await api.updateExpenseInvoice(editingInvoice.id, invoice, items);
        } else {
            await api.addExpenseInvoice(invoice, items);
        }
        await loadData();
        setEditingInvoice(null);
    };

    const handleDeleteTransaction = (id: any) => {
        if (String(id).startsWith("sub-") || String(id).startsWith("pay-")) {
            alert("لا يمكن حذف اشتراكات اللاعبين من هنا. يرجى إدارتها من قسم الاشتراكات.");
            return;
        }
        setItemToDelete({ type: "transaction", id });
        setIsConfirmOpen(true);
    };

    const handleDeleteInvoice = (id: number) => {
        setItemToDelete({ type: "invoice", id });
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (itemToDelete.type === "transaction") {
                await api.deleteFinance(itemToDelete.id);
            } else {
                await api.deleteExpenseInvoice(itemToDelete.id);
            }
            await loadData();
        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setItemToDelete(null);
        }
    };

    // Separate calculations
    const subscriptionIncomeTotal = transactions
        .filter(t => t.type === "income" && (t.is_subscription || t.category === "اشتراكات اللاعبين"))
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const otherIncomeTotal = transactions
        .filter(t => t.type === "income" && !t.is_subscription && t.category !== "اشتراكات اللاعبين")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const incomeTotal = subscriptionIncomeTotal + otherIncomeTotal;
    const invoiceExpenseTotal = expenseInvoices.reduce((s, inv) => s + (Number(inv.total_amount) || 0), 0);
    const financeExpenseTotal = transactions.filter(t => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpense = invoiceExpenseTotal + financeExpenseTotal;
    const balance = incomeTotal - totalExpense;

    const allIncomeTransactions = transactions.filter(t => t.type === "income");
    const filteredIncomeTransactions = allIncomeTransactions.filter(t => {
        if (incomeFilter === 'subscriptions') return t.is_subscription || t.category === "اشتراكات اللاعبين";
        if (incomeFilter === 'other') return !t.is_subscription && t.category !== "اشتراكات اللاعبين";
        return true;
    });

    const chartData = React.useMemo(() => {
        const last6 = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
        return last6.map(month => {
            const label = format(month, "MMMM", { locale: ar });
            const monthStr = format(month, "yyyy-MM");
            const subIncome = transactions
                .filter(t => t.type === "income" && (t.is_subscription || t.category === "اشتراكات اللاعبين") && t.date?.startsWith(monthStr))
                .reduce((s, t) => s + (Number(t.amount) || 0), 0);
            const otherIncome = transactions
                .filter(t => t.type === "income" && !t.is_subscription && t.category !== "اشتراكات اللاعبين" && t.date?.startsWith(monthStr))
                .reduce((s, t) => s + (Number(t.amount) || 0), 0);
            const expense = expenseInvoices
                .filter(inv => inv.invoice_date?.startsWith(monthStr))
                .reduce((s, inv) => s + (Number(inv.total_amount) || 0), 0);
            return { name: label, "اشتراكات": subIncome, "مداخيل أخرى": otherIncome, "مصاريف": expense };
        });
    }, [transactions, expenseInvoices]);

    const allFinancialForPrint = [
        ...allIncomeTransactions,
        ...expenseInvoices.map(inv => ({
            id: `inv-${inv.id}`,
            type: "expense",
            category: `فاتورة: ${inv.supplier_name}`,
            amount: inv.total_amount,
            date: inv.invoice_date,
            notes: inv.invoice_number,
        })),
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-50">الإدارة المالية</h2>
                    <p className="text-zinc-400 mt-1">تتبع المداخيل وفواتير المصاريف.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setIsPrinting(true)} variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-800">
                        <Printer className="mr-2 h-4 w-4" /> طباعة كشف
                    </Button>
                    <Button onClick={() => { setEditingTransaction(null); setIsIncomeModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
                        <TrendingUp className="mr-2 h-4 w-4" /> تسجيل مداخيل
                    </Button>
                    <Button onClick={() => { setEditingInvoice(null); setIsExpenseModalOpen(true); }} className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20">
                        <Receipt className="mr-2 h-4 w-4" /> فاتورة مصاريف
                    </Button>
                </div>
            </div>

            {/* Print Portal */}
            <PrintPortal isOpen={isPrinting} onClose={() => setIsPrinting(false)} title="كشف الحساب المالي">
                <FinancialReportTemplate
                    transactions={allFinancialForPrint}
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    totalIncome={incomeTotal}
                    totalExpense={totalExpense}
                    balance={balance}
                    subscriptionIncome={subscriptionIncomeTotal}
                    otherIncome={otherIncomeTotal}
                    academySettings={academySettings}
                />
            </PrintPortal>

            {/* Stats - 5 Cards separating Subscriptions from Other Income */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Subscription Income */}
                <Card className="bg-emerald-950/20 border-emerald-500/30 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>مداخيل الاشتراكات</span>
                                </div>
                                <h3 className="text-xl font-black text-emerald-400 mt-1">{subscriptionIncomeTotal.toLocaleString()} دج</h3>
                                <p className="text-[11px] text-zinc-400 mt-0.5">اشتراكات وتجديدات اللاعبين</p>
                            </div>
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                                <CreditCard className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Other Incomes */}
                <Card className="bg-sky-950/20 border-sky-500/30 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-sky-500" />
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                                    <Coins className="w-3.5 h-3.5" />
                                    <span>مداخيل أخرى</span>
                                </div>
                                <h3 className="text-xl font-black text-sky-400 mt-1">{otherIncomeTotal.toLocaleString()} دج</h3>
                                <p className="text-[11px] text-zinc-400 mt-0.5">رعاية، متفرقات، مداخيل يدوية</p>
                            </div>
                            <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Total Incomes */}
                <Card className="bg-green-500/10 border-green-500/30 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-green-500" />
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-green-300">
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>إجمالي المداخيل</span>
                                </div>
                                <h3 className="text-xl font-black text-green-400 mt-1">{incomeTotal.toLocaleString()} دج</h3>
                                <p className="text-[11px] text-zinc-400 mt-0.5">الاشتراكات + مداخيل أخرى</p>
                            </div>
                            <div className="p-2.5 bg-green-500/20 rounded-xl text-green-400">
                                <Wallet className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Total Expenses */}
                <Card className="bg-rose-500/5 border-rose-500/20 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500" />
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>إجمالي المصاريف</span>
                                </div>
                                <h3 className="text-xl font-black text-rose-400 mt-1">{totalExpense.toLocaleString()} دج</h3>
                                <p className="text-[11px] text-zinc-400 mt-0.5">{expenseInvoices.length} فاتورة مسجلة</p>
                            </div>
                            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Net Balance */}
                <Card className={cn("shadow-lg relative overflow-hidden border", balance >= 0 ? "bg-blue-500/5 border-blue-500/20" : "bg-rose-500/10 border-rose-500/30")}>
                    <div className={cn("absolute top-0 right-0 w-1.5 h-full", balance >= 0 ? "bg-blue-500" : "bg-rose-500")} />
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                                    <Scale className="w-3.5 h-3.5" />
                                    <span>الرصيد الصافي</span>
                                </div>
                                <h3 className={cn("text-xl font-black mt-1", balance >= 0 ? "text-blue-400" : "text-rose-400")}>
                                    {balance.toLocaleString()} دج
                                </h3>
                                <p className="text-[11px] text-zinc-400 mt-0.5">المداخيل الكلية - المصاريف</p>
                            </div>
                            <div className={cn("p-2.5 rounded-xl", balance >= 0 ? "bg-blue-500/10 text-blue-400" : "bg-rose-500/20 text-rose-400")}>
                                <Scale className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-zinc-800/50">
                        <CardTitle className="text-lg font-bold">التحليل المالي الشهري (آخر 6 أشهر)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }} />
                                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                    <Bar dataKey="اشتراكات" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="مداخيل أخرى" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="مصاريف" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 bg-gradient-to-br from-emerald-500/10 to-transparent border-zinc-800 shadow-2xl">
                    <CardHeader className="border-b border-zinc-800/50">
                        <CardTitle className="text-lg font-bold">توزيع المداخيل حسب النوع</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {/* Subscriptions Share */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" /> اشتراكات اللاعبين
                                    </span>
                                    <span className="text-emerald-400 font-black">
                                        {incomeTotal > 0 ? ((subscriptionIncomeTotal / incomeTotal) * 100).toFixed(0) : 0}% ({subscriptionIncomeTotal.toLocaleString()} دج)
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${incomeTotal > 0 ? (subscriptionIncomeTotal / incomeTotal) * 100 : 0}%` }} />
                                </div>
                            </div>

                            {/* Other Incomes Share */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-sky-400 font-bold flex items-center gap-1">
                                        <Coins className="w-3.5 h-3.5" /> مداخيل أخرى
                                    </span>
                                    <span className="text-sky-400 font-black">
                                        {incomeTotal > 0 ? ((otherIncomeTotal / incomeTotal) * 100).toFixed(0) : 0}% ({otherIncomeTotal.toLocaleString()} دج)
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${incomeTotal > 0 ? (otherIncomeTotal / incomeTotal) * 100 : 0}%` }} />
                                </div>
                            </div>

                            {/* Detailed breakdown of other incomes if any */}
                            {allIncomeTransactions.filter(t => !t.is_subscription && t.category !== "اشتراكات اللاعبين").length > 0 && (
                                <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
                                    <p className="text-[11px] text-zinc-400 font-semibold">تفصيل المداخيل الأخرى:</p>
                                    {Array.from(new Set(allIncomeTransactions.filter(t => !t.is_subscription && t.category !== "اشتراكات اللاعبين").map(t => t.category))).slice(0, 3).map(cat => {
                                        const amount = allIncomeTransactions.filter(t => t.category === cat).reduce((s, t) => s + (t.amount || 0), 0);
                                        const pct = otherIncomeTotal > 0 ? (amount / otherIncomeTotal) * 100 : 0;
                                        return (
                                            <div key={cat} className="space-y-1">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-zinc-300">{cat}</span>
                                                    <span className="text-sky-400 font-bold">{amount.toLocaleString()} دج ({pct.toFixed(0)}%)</span>
                                                </div>
                                                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-sky-600 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expense Invoices Table */}
            <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-rose-400" /> سجل فواتير المصاريف
                    </CardTitle>
                    <span className="text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full">اضغط على الصف لعرض التفاصيل</span>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-zinc-950/50 text-zinc-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">رقم الفاتورة</th>
                                    <th className="px-4 py-3 font-medium">المورد / الفئة</th>
                                    <th className="px-4 py-3 font-medium">التاريخ</th>
                                    <th className="px-4 py-3 font-medium">المجموع العام</th>
                                    <th className="px-4 py-3 font-medium text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-500 italic">جاري تحميل البيانات...</td></tr>
                                ) : expenseInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-zinc-800/50 rounded-full">
                                                    <Receipt className="h-8 w-8 text-zinc-600" />
                                                </div>
                                                <p className="text-zinc-500 text-sm">لا توجد فواتير مصاريف مسجلة</p>
                                                <button
                                                    onClick={() => setIsExpenseModalOpen(true)}
                                                    className="text-rose-400 text-xs hover:underline"
                                                >
                                                    إضافة أول فاتورة
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : expenseInvoices.map(inv => (
                                    <InvoiceRow
                                        key={inv.id}
                                        invoice={inv}
                                        onEdit={() => { setEditingInvoice(inv); setIsExpenseModalOpen(true); }}
                                        onDelete={() => handleDeleteInvoice(inv.id!)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Income Transactions Table */}
            <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800/50 pb-4 gap-3">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-400" /> سجل المداخيل
                        </CardTitle>
                        <p className="text-xs text-zinc-400 mt-1">
                            الفصل المباشر بين مداخيل اشتراكات اللاعبين والمداخيل الأخرى (إجمالي: {allIncomeTransactions.length} عملية)
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setIncomeFilter('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                                incomeFilter === 'all'
                                    ? "bg-zinc-100 text-zinc-900 shadow"
                                    : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            )}
                        >
                            <span>جميع المداخيل</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-700/50 text-zinc-300">
                                {allIncomeTransactions.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIncomeFilter('subscriptions')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                                incomeFilter === 'subscriptions'
                                    ? "bg-emerald-600 text-white shadow"
                                    : "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-900/40"
                            )}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>اشتراكات اللاعبين</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20">
                                {allIncomeTransactions.filter(t => t.is_subscription || t.category === "اشتراكات اللاعبين").length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIncomeFilter('other')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                                incomeFilter === 'other'
                                    ? "bg-sky-600 text-white shadow"
                                    : "bg-sky-950/30 text-sky-400 border border-sky-500/20 hover:bg-sky-900/40"
                            )}
                        >
                            <Coins className="w-3.5 h-3.5" />
                            <span>مداخيل أخرى</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500/20">
                                {allIncomeTransactions.filter(t => !t.is_subscription && t.category !== "اشتراكات اللاعبين").length}
                            </span>
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-zinc-950/50 text-zinc-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">المصدر / الفئة</th>
                                    <th className="px-4 py-3 font-medium text-center">نوع المدخول</th>
                                    <th className="px-4 py-3 font-medium">المبلغ</th>
                                    <th className="px-4 py-3 font-medium">التاريخ</th>
                                    <th className="px-4 py-3 font-medium">ملاحظات</th>
                                    <th className="px-4 py-3 font-medium text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {isLoading ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-zinc-500 italic">جاري التحميل...</td></tr>
                                ) : filteredIncomeTransactions.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-zinc-500 italic">لا توجد مداخيل مطابقة للتصفية</td></tr>
                                ) : filteredIncomeTransactions.map(t => {
                                    const isSub = t.is_subscription || t.category === "اشتراكات اللاعبين";
                                    return (
                                        <tr key={t.id} className="hover:bg-zinc-900/60 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-50 font-semibold">{t.category}</span>
                                                    <span className="text-[11px] text-zinc-400">{t.notes}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isSub ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <Users className="w-3 h-3" /> اشتراك لاعب
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                                        <Coins className="w-3 h-3" /> مدخول آخر
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-black text-emerald-400 font-mono">+{Number(t.amount || 0).toLocaleString()} دج</td>
                                            <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{t.date}</td>
                                            <td className="px-4 py-3 text-zinc-500 max-w-[200px] truncate italic text-xs">{t.notes}</td>
                                            <td className="px-4 py-3">
                                                {!t.is_system ? (
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingTransaction(t); setIsIncomeModalOpen(true); }} className="h-7 w-7 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10">
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(t.id)} className="h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <span className="text-[10px] text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded border border-zinc-800">تلقائي</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            <ExpenseInvoiceModal
                isOpen={isExpenseModalOpen}
                onClose={() => { setIsExpenseModalOpen(false); setEditingInvoice(null); }}
                onSave={handleSaveInvoice}
                editingInvoice={editingInvoice}
            />

            <IncomeModal
                isOpen={isIncomeModalOpen}
                onClose={() => { setIsIncomeModalOpen(false); setEditingTransaction(null); }}
                onSave={handleSaveIncome}
                editingTransaction={editingTransaction}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="حذف العنصر"
                message="هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء."
            />
        </div>
    );
}
