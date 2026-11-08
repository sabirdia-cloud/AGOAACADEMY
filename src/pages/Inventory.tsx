import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { Package, ArrowDownLeft, ArrowUpRight, AlertTriangle, Search } from "lucide-react";

export function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInventory();
      setInventory(data || []);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.remaining_stock <= LOW_STOCK_THRESHOLD);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">الجرد العام ورقابة المخزون</h2>
          <p className="text-zinc-400 mt-1 text-right">تحليل شامل لحالة العتاد المتوفر في المخزن.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            className="w-full pl-3 pr-10 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Package className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-xs text-zinc-500">إجمالي الأنواع</p>
            <p className="text-xl font-bold text-zinc-100">{inventory.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <ArrowDownLeft className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-xs text-zinc-500">إجمالي الكميات الواردة</p>
            <p className="text-xl font-bold text-emerald-500">{inventory.reduce((acc, i) => acc + i.total_entries, 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-500/5 border-rose-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <ArrowUpRight className="h-5 w-5 text-rose-500 mb-2" />
            <p className="text-xs text-zinc-500">إجمالي الكميات المشطوبة</p>
            <p className="text-xl font-bold text-rose-500">{inventory.reduce((acc, i) => acc + i.total_outputs, 0)}</p>
          </CardContent>
        </Card>
        <Card className={lowStockItems.length > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-zinc-900 border-zinc-800"}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <AlertTriangle className={`h-5 w-5 ${lowStockItems.length > 0 ? 'text-amber-500' : 'text-zinc-500'} mb-2`} />
            <p className="text-xs text-zinc-500">تحذيرات (مخزون حرج)</p>
            <p className={`text-xl font-bold ${lowStockItems.length > 0 ? 'text-amber-500' : 'text-zinc-100'}`}>{lowStockItems.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-zinc-900/40 border-zinc-800/50">
          <CardHeader className="border-b border-zinc-800/50">
            <CardTitle className="text-lg font-bold">تفاصيل الجرد</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-zinc-900/60 text-zinc-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">اسم المنتوج</th>
                    <th className="px-5 py-4 font-medium text-center">الوارد / المستهلك</th>
                    <th className="px-5 py-4 font-medium">الرصيد المتاح</th>
                    <th className="px-5 py-4 font-medium text-center">مؤشر المخزون</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-zinc-500 italic">جاري جرد المحتويات...</td></tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-zinc-500 italic">لم يتم العثور على نتائج</td></tr>
                  ) : (
                    filteredInventory.map((item, index) => {
                      const percentage = Math.min((item.remaining_stock / Math.max(item.total_entries, 1)) * 100, 100);
                      return (
                        <tr key={index} className="hover:bg-zinc-900/40 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="text-zinc-50 font-bold">{item.product_name}</span>
                              {item.remaining_stock <= LOW_STOCK_THRESHOLD && (
                                <span className="text-[10px] text-rose-500 flex items-center gap-1 mt-0.5">
                                  <AlertTriangle className="h-2 w-2" /> يرجى إعادة الطلب
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-zinc-400 font-medium">
                              {item.total_entries} <span className="text-zinc-600">/</span> {item.total_outputs}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-black ${item.remaining_stock === 0 ? 'text-zinc-600' : item.remaining_stock <= LOW_STOCK_THRESHOLD ? 'text-rose-500' : 'text-emerald-400'}`}>
                                {item.remaining_stock}
                              </span>
                              <span className="text-zinc-500 text-[10px]">وحدة</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center min-w-[150px]">
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${item.remaining_stock <= LOW_STOCK_THRESHOLD ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500'}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
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

        <div className="space-y-6">
          <Card className="bg-zinc-900/60 border-zinc-800/50 shadow-xl">
            <CardHeader className="border-b border-zinc-800/50">
              <CardTitle className="text-base font-bold text-amber-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> تنبيهات النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {lowStockItems.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">لا توجد نواقص حالياً</p>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/40">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-50">{item.product_name}</span>
                        <span className="text-[10px] text-zinc-500">متبقي {item.remaining_stock} فقط</span>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_4px_#f43f5e]"></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-zinc-800 shadow-xl p-4">
            <h4 className="text-sm font-bold text-blue-400 mb-2">تعليمات المخزن</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              يتم تحديث الجرد تلقائياً عند إضافة "وصل دخول" أو "وصل خروج". يوصى بمراجعة تنبيهات النظام يومياً لتفادي نفاذ العتاد الأساسي.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
