import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { 
  Users, Calendar, CheckCircle2, Clock, Printer, Edit, 
  DollarSign, FileText, Search, Filter, Sparkles, Download, 
  ChevronRight, CalendarRange, Eye
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useAcademy } from "@/services/AcademyContext";
import { PrintPortal } from "@/components/PrintPortal";
import { CoachAttendanceReportTemplate } from "@/components/CoachAttendanceReportTemplate";

export function CoachPayroll() {
    const { settings: academySettings } = useAcademy();
    const [coaches, setCoaches] = useState<any[]>([]);
    const [trainings, setTrainings] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter Mode: 'month' | 'range'
    const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');

    // Month mode state (YYYY-MM)
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    // Date range mode state
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        // Last day of current month
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    });

    // Search and filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Processing & Modals
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    const [editModal, setEditModal] = useState<{ open: boolean; payment: any; coach: any } | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNotes, setEditNotes] = useState('');

    // Attendance Report Print State
    const [printCoach, setPrintCoach] = useState<any | null>(null);
    const [isPrintPortalOpen, setIsPrintPortalOpen] = useState(false);

    useEffect(() => { 
        loadData(); 
    }, [selectedMonth, filterMode, startDate, endDate]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [{ data: cData }, { data: tData }, { data: pData }, { data: tmData }] = await Promise.all([
                supabase.from('coaches').select('*'),
                supabase.from('training').select('*').order('date', { ascending: false }),
                supabase.from('coach_payments').select('*'),
                supabase.from('teams').select('*'),
            ]);
            setCoaches(cData || []);
            setTrainings(tData || []);
            setPayments(pData || []);
            setTeams(tmData || []);
        } catch (error) {
            console.error("Load error in CoachPayroll:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Arabic Month Names
    const arabicMonths = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    // Helper: Is date within selected period
    const isDateInPeriod = (dateStr?: string) => {
        if (!dateStr) return false;
        const clean = dateStr.split('T')[0];
        if (filterMode === 'month') {
            return clean.startsWith(selectedMonth);
        } else {
            if (startDate && clean < startDate) return false;
            if (endDate && clean > endDate) return false;
            return true;
        }
    };

    // Period Description for printing and headers
    const getPeriodDescription = () => {
        if (filterMode === 'month') {
            const [y, m] = selectedMonth.split('-');
            const mIdx = parseInt(m, 10) - 1;
            return `شهر ${arabicMonths[mIdx] || m} ${y}`;
        }
        return `الفترة من ${startDate} إلى ${endDate}`;
    };

    // Distinct Months list in Arabic for given sessions
    const getMonthsList = (sessionsList: any[]) => {
        if (filterMode === 'month') {
            const [y, m] = selectedMonth.split('-');
            const mIdx = parseInt(m, 10) - 1;
            return [`${arabicMonths[mIdx] || m} ${y}`];
        }
        const mSet = new Set<string>();
        sessionsList.forEach(s => {
            if (s.date) {
                const ym = s.date.substring(0, 7);
                mSet.add(ym);
            }
        });
        return Array.from(mSet).sort().map(ym => {
            const [y, m] = ym.split('-');
            const mIdx = parseInt(m, 10) - 1;
            return `${arabicMonths[mIdx] || m} ${y}`;
        });
    };

    // Helper to extract coach sessions
    const getCoachSessions = (coach: any) => {
        const coachId = Number(coach.coach_id);
        const coachTeamIds = (teams || [])
            .filter(tm => Number(tm.coach_id) === coachId)
            .map(tm => Number(tm.team_id));
        if (coach.team_id) coachTeamIds.push(Number(coach.team_id));

        const categoryTeamIds = (teams || [])
            .filter(tm => coach.category && tm.category === coach.category)
            .map(tm => Number(tm.team_id));

        return (trainings || []).filter(t => {
            if (!t.date || !isDateInPeriod(t.date)) return false;
            // Direct assignment
            if (t.coach_id && Number(t.coach_id) === coachId) return true;
            // Team assignment fallback
            if (!t.coach_id && t.team_id && coachTeamIds.includes(Number(t.team_id))) return true;
            // Category match fallback
            if (!t.coach_id && t.team_id && categoryTeamIds.includes(Number(t.team_id))) return true;
            return false;
        }).map(t => {
            const tm = (teams || []).find(team => Number(team.team_id) === Number(t.team_id));
            return {
                ...t,
                team_name: tm?.team_name,
                category: tm?.category || t.category || coach.category || 'الفريق الأول'
            };
        }).sort((a, b) => {
            const dateComp = (a.date || '').localeCompare(b.date || '');
            if (dateComp !== 0) return dateComp;
            return (a.start_time || '').localeCompare(b.start_time || '');
        });
    };

    const getStats = (coach: any) => {
        const coachId = Number(coach.coach_id);
        const sessions = getCoachSessions(coach);
        const rate = Number(coach.salary_per_session) || 1000;
        const amount = sessions.length * rate;

        // Find payment for this coach
        const payment = (payments || []).find(p => {
            if (Number(p.coach_id) !== coachId) return false;
            if (filterMode === 'month') {
                return p.month === selectedMonth;
            } else {
                const pDate = p.payment_date || p.created_at;
                if (!pDate) return false;
                const clean = pDate.split('T')[0];
                return (!startDate || clean >= startDate) && (!endDate || clean <= endDate);
            }
        });

        return { 
            sessions, 
            sessionsCount: sessions.length, 
            rate, 
            amount, 
            payment, 
            isPaid: !!payment 
        };
    };

    /* ---- تسديد الأجر ---- */
    const handlePay = async (coach: any) => {
        const stats = getStats(coach);
        const periodText = getPeriodDescription();

        const finalAmount = stats.sessionsCount > 0
            ? stats.amount
            : Number(window.prompt(`أدخل المبلغ يدوياً (دج):`, '1000') || 0);

        if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
            alert("المبلغ غير صالح.");
            return;
        }

        if (!window.confirm(
            `تسديد مستحقات المدرب: ${coach.name}\n${periodText}\nعدد الحصص: ${stats.sessionsCount}\nالمبلغ: ${finalAmount.toLocaleString()} دج\n\nهل أنت متأكد من تسجيل العملية؟`
        )) return;

        setIsProcessing(coach.coach_id);
        try {
            const payMonth = filterMode === 'month' ? selectedMonth : (startDate.substring(0, 7) || selectedMonth);
            // 1️⃣ تسجيل في coach_payments
            const { error: payErr } = await supabase.from('coach_payments').insert([{
                coach_id: coach.coach_id,
                amount: finalAmount,
                month: payMonth,
                sessions_count: stats.sessionsCount,
                payment_date: new Date().toISOString().split('T')[0],
                notes: `أجر ${periodText} - ${stats.sessionsCount} حصة تدريبية`,
            }]);
            if (payErr) throw payErr;

            // 2️⃣ تسجيل في المصاريف (finances)
            const { error: finErr } = await supabase.from('finances').insert([{
                type: 'expense',
                category: 'أجور المدربين',
                amount: finalAmount,
                date: new Date().toISOString().split('T')[0],
                notes: `أجر المدرب ${coach.name} - ${periodText} (${stats.sessionsCount} حصة)`,
            }]);
            if (finErr) console.warn("Finance insert warning:", finErr.message);

            await loadData();
            alert(`✅ تم تسديد ${finalAmount.toLocaleString()} دج للمدرب ${coach.name} بنجاح.\nتم تسجيله في المصاريف.`);
        } catch (err: any) {
            console.error(err);
            alert(`❌ خطأ: ${err.message}`);
        } finally {
            setIsProcessing(null);
        }
    };

    /* ---- تعديل الدفعة ---- */
    const openEdit = (coach: any) => {
        const { payment } = getStats(coach);
        if (!payment) return;
        setEditModal({ open: true, payment, coach });
        setEditAmount(String(payment.amount));
        setEditNotes(payment.notes || '');
    };

    const handleSaveEdit = async () => {
        if (!editModal?.payment) return;
        const { error } = await supabase.from('coach_payments')
            .update({ amount: Number(editAmount), notes: editNotes })
            .eq('id', editModal.payment.id);
        if (error) { alert(`❌ ${error.message}`); return; }
        setEditModal(null);
        await loadData();
        alert('✅ تم تحديث الدفعة بنجاح.');
    };

    /* ---- فتح تقرير الحضور المفصل A4 ---- */
    const handleOpenAttendanceReport = (coach: any) => {
        setPrintCoach(coach);
        setIsPrintPortalOpen(true);
    };

    /* ---- طباعة الوصل المالي البسيط ---- */
    const handlePrintReceipt = (coach: any) => {
        const stats = getStats(coach);
        const payDate = stats.payment?.payment_date || new Date().toISOString().split('T')[0];
        const amount = stats.payment?.amount ?? stats.amount;
        const periodText = getPeriodDescription();
        const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";

        const html = `
<!DOCTYPE html><html lang="ar" dir="rtl">
<head><meta charset="UTF-8">
<title>وصل تسديد أجر - ${coach.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Tajawal', Arial, sans-serif; background: #fff; color: #000; direction: rtl; }
  .receipt { max-width: 680px; margin: 30px auto; border: 2px solid #000; border-radius: 8px; overflow: hidden; }
  .header { background: #0f172a; color: white; text-align: center; padding: 20px; }
  .header h1 { font-size: 18px; font-weight: 900; }
  .header h2 { font-size: 13px; margin-top: 4px; color: #94a3b8; }
  .body { padding: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; text-align: right; }
  td { padding: 10px 14px; border: 1px solid #ccc; font-size: 13px; }
  td:first-child { background: #f8fafc; font-weight: 700; width: 38%; color: #0f172a; }
  .amount-row td { font-size: 15px; font-weight: 900; color: #059669; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 30px; text-align: center; }
  .sig-line { border-bottom: 1px dashed #000; width: 120px; margin: 30px auto 0; }
  .sig-label { font-weight: 700; font-size: 13px; }
  .footer { background: #f8fafc; text-align: center; padding: 10px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
</style></head><body>
<div class="receipt">
  <div class="header">
    <h1>${academyName}</h1>
    <h2>وصل تسديد أجر ومستحقات مدرب</h2>
  </div>
  <div class="body">
    <table>
      <tr><td>اسم المدرب</td><td><strong>${coach.name}</strong> (${coach.category || 'عام'})</td></tr>
      <tr><td>الفترة / الأشهر</td><td>${periodText}</td></tr>
      <tr><td>عدد الحصص المنفذة</td><td><strong>${stats.sessionsCount}</strong> حصة تدريبية</td></tr>
      <tr><td>سعر الحصة الواحدة</td><td>${stats.rate.toLocaleString()} دج</td></tr>
      <tr class="amount-row"><td>المبلغ الإجمالي المسدَّد</td><td>${Number(amount).toLocaleString()} دج</td></tr>
      <tr><td>تاريخ التسديد</td><td>${payDate}</td></tr>
    </table>
    <div class="sigs">
      <div><p class="sig-label">توقيع واستلام المدرب</p><div class="sig-line"></div></div>
      <div><p class="sig-label">ختم ومصادقة إدارة الأكاديمية</p><div class="sig-line"></div></div>
    </div>
  </div>
  <div class="footer">صدر بتاريخ: ${new Date().toLocaleDateString('ar-DZ')} — ${academyName}</div>
</div>
</body></html>`;

        const w = window.open('', '_blank', 'width=750,height=600');
        if (!w) { alert("يرجى السماح بالنوافذ المنبثقة لطباعة الوصل."); return; }
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 500);
    };

    // Filtered Coaches List
    const filteredCoaches = useMemo(() => {
        return coaches.filter(c => {
            const matchesSearch = !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [coaches, searchQuery, selectedCategory]);

    const categoriesList = useMemo(() => {
        const set = new Set<string>();
        coaches.forEach(c => { if (c.category) set.add(c.category); });
        return Array.from(set);
    }, [coaches]);

    /* ---- الإجماليات ---- */
    const totalSessionsAll = filteredCoaches.reduce((s, c) => s + getStats(c).sessionsCount, 0);
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalPending = filteredCoaches.reduce((s, c) => {
        const { isPaid, amount } = getStats(c);
        return !isPaid ? s + amount : s;
    }, 0);

    return (
        <div className="space-y-6 pb-20 font-tajawal" dir="rtl">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800/80 backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Users className="h-5 w-5" />
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-50">
                            مستحقات وأجور المدربين (تقارير الحضور والحصص)
                        </h2>
                    </div>
                    <p className="text-zinc-400 mt-1.5 text-sm">
                        احتساب المستحقات من سجل برنامج التدريبات وطباعة كشوف الحضور والحصص الرسمية A4 لكل مدرب.
                    </p>
                </div>

                {/* Period Selector Card */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-zinc-950/80 border border-zinc-800/90 p-2.5 rounded-2xl w-full lg:w-auto">
                    {/* Toggle Mode */}
                    <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setFilterMode('month')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                filterMode === 'month'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            شهري
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode('range')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                filterMode === 'range'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            بين تاريخين
                        </button>
                    </div>

                    {/* Inputs */}
                    {filterMode === 'month' ? (
                        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                            <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-transparent text-zinc-100 outline-none border-none font-bold text-xs sm:text-sm cursor-pointer"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
                            <CalendarRange className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="text-zinc-400 font-bold">من:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-zinc-100 outline-none border-none font-bold text-xs cursor-pointer"
                            />
                            <span className="text-zinc-400 font-bold">إلى:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-zinc-100 outline-none border-none font-bold text-xs cursor-pointer"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-zinc-900/60 border-zinc-800/80">
                    <CardHeader className="pb-1 pt-4 px-5">
                        <CardTitle className="text-xs font-bold text-zinc-400">إجمالي المدربين</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5">
                        <div className="text-2xl font-black text-white">{coaches.length} مدرب</div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/60 border-zinc-800/80">
                    <CardHeader className="pb-1 pt-4 px-5">
                        <CardTitle className="text-xs font-bold text-zinc-400">مجموع الحصص المنفذة</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5">
                        <div className="text-2xl font-black text-sky-400">{totalSessionsAll} حصة</div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/60 border-zinc-800/80">
                    <CardHeader className="pb-1 pt-4 px-5">
                        <CardTitle className="text-xs font-bold text-zinc-400">المستحقات المعلقة</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5">
                        <div className="text-2xl font-black text-amber-400">{totalPending.toLocaleString()} دج</div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/60 border-zinc-800/80">
                    <CardHeader className="pb-1 pt-4 px-5">
                        <CardTitle className="text-xs font-bold text-zinc-400">إجمالي المسدد</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-5">
                        <div className="text-2xl font-black text-emerald-400">{totalPaid.toLocaleString()} دج</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60">
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="بحث باسم المدرب..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    {categoriesList.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Filter className="h-4 w-4 text-zinc-500 hidden sm:block" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="all">كل الفئات</option>
                                {categoriesList.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="text-xs text-zinc-400 bg-zinc-950/80 px-3.5 py-2 rounded-xl border border-zinc-800 self-start sm:self-auto font-medium">
                    الفترة الحالية: <span className="font-bold text-emerald-400">{getPeriodDescription()}</span>
                </div>
            </div>

            {/* Coaches Table */}
            <Card className="bg-zinc-900/40 border-zinc-800/60 overflow-hidden shadow-xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-zinc-950/80 text-zinc-400 text-xs uppercase tracking-wide border-b border-zinc-800">
                                <tr>
                                    <th className="px-5 py-4 font-bold">المدرب</th>
                                    <th className="px-5 py-4 font-bold text-center">الحصص المنفذة</th>
                                    <th className="px-5 py-4 font-bold text-center">سعر الحصة</th>
                                    <th className="px-5 py-4 font-bold">المستحقات الإجمالية</th>
                                    <th className="px-5 py-4 font-bold text-center">حالة الصرف</th>
                                    <th className="px-5 py-4 font-bold text-center">الإجراءات والطباعة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                                            جاري تحميل بيانات التدريبات والمدربين...
                                        </td>
                                    </tr>
                                ) : filteredCoaches.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                                            لا يوجد مدربون يطابقون معايير البحث.
                                        </td>
                                    </tr>
                                ) : filteredCoaches.map(coach => {
                                    const stats = getStats(coach);
                                    return (
                                        <tr key={coach.coach_id} className="hover:bg-zinc-900/50 transition-colors">
                                            {/* Coach Info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
                                                        {coach.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-zinc-50">{coach.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {coach.category && (
                                                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                                                                    {coach.category}
                                                                </span>
                                                            )}
                                                            {coach.phone && (
                                                                <span className="text-[10px] text-zinc-500 font-mono">
                                                                    {coach.phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Sessions Count */}
                                            <td className="px-5 py-4 text-center">
                                                <span className="font-black text-zinc-100 text-base">{stats.sessionsCount}</span>
                                                <span className="text-zinc-500 text-xs mr-1">حصة</span>
                                            </td>

                                            {/* Rate */}
                                            <td className="px-5 py-4 text-center text-zinc-300 font-medium">
                                                {stats.rate.toLocaleString()} دج
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4">
                                                <span className="font-black text-emerald-400 text-base">
                                                    {stats.amount.toLocaleString()}
                                                </span>
                                                <span className="text-zinc-500 text-xs mr-1">دج</span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 text-center">
                                                {stats.isPaid ? (
                                                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-black">
                                                        <CheckCircle2 size={12} /> تم الدفع
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-black">
                                                        <Clock size={12} /> معلق
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    {/* زر تقرير الحضور المفصل A4 */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenAttendanceReport(coach)}
                                                        className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-md active:scale-95"
                                                        title="طباعة تقرير الحضور والحصص المفصل (A4)"
                                                    >
                                                        <FileText size={13} />
                                                        تقرير الحضور (A4)
                                                    </button>

                                                    {/* زر التسديد */}
                                                    {!stats.isPaid && (
                                                        <button
                                                            type="button"
                                                            disabled={isProcessing === coach.coach_id}
                                                            onClick={() => handlePay(coach)}
                                                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors active:scale-95"
                                                        >
                                                            <DollarSign size={13} />
                                                            {isProcessing === coach.coach_id ? 'جاري...' : 'تسديد'}
                                                        </button>
                                                    )}

                                                    {/* زر التعديل */}
                                                    {stats.isPaid && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(coach)}
                                                            className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors"
                                                            title="تعديل الدفعة"
                                                        >
                                                            <Edit size={13} />
                                                            تعديل
                                                        </button>
                                                    )}

                                                    {/* زر الوصل المالي */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrintReceipt(coach)}
                                                        className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors"
                                                        title="طباعة وصل تسديد الأجر"
                                                    >
                                                        <Printer size={13} />
                                                        وصل
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Report Printable Modal via PrintPortal */}
            {isPrintPortalOpen && printCoach && (
                <PrintPortal
                    isOpen={isPrintPortalOpen}
                    onClose={() => {
                        setIsPrintPortalOpen(false);
                        setPrintCoach(null);
                    }}
                    title={`كشف حضور وحصص المدرب: ${printCoach.name}`}
                    fileName={`تقرير_حضور_المدرب_${printCoach.name}_${filterMode === 'month' ? selectedMonth : `${startDate}_${endDate}`}`}
                >
                    <CoachAttendanceReportTemplate
                        coach={printCoach}
                        sessions={getCoachSessions(printCoach)}
                        periodDescription={getPeriodDescription()}
                        monthsList={getMonthsList(getCoachSessions(printCoach))}
                        academySettings={academySettings}
                        paymentInfo={getStats(printCoach).payment ? {
                            isPaid: true,
                            amount: getStats(printCoach).payment.amount,
                            payment_date: getStats(printCoach).payment.payment_date,
                            notes: getStats(printCoach).payment.notes
                        } : {
                            isPaid: false
                        }}
                    />
                </PrintPortal>
            )}

            {/* Edit Modal */}
            {editModal?.open && (
                <Modal isOpen onClose={() => setEditModal(null)} title={`تعديل دفعة: ${editModal.coach?.name}`}>
                    <div className="space-y-4 font-tajawal" dir="rtl">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">المبلغ المسدد (دج)</label>
                            <input
                                type="number"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">ملاحظات الدفعة</label>
                            <textarea
                                value={editNotes}
                                onChange={e => setEditNotes(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setEditModal(null)} className="border-zinc-800 text-zinc-300 rounded-xl">إلغاء</Button>
                            <Button onClick={handleSaveEdit} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">حفظ التغييرات</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
