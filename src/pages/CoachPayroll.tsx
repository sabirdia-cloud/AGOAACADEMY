import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { 
  Users, Calendar, CheckCircle2, Clock, Printer, Edit, 
  DollarSign, FileText, Search, Filter, Download, Trophy,
  ChevronRight, CalendarRange, Eye, Plus, X, Dumbbell,
  TrendingUp, Zap, Shield, ChevronDown, ChevronUp, Loader2,
  RefreshCw, Star, Activity
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useAcademy } from "@/services/AcademyContext";
import { PrintPortal } from "@/components/PrintPortal";
import { CoachAttendanceReportTemplate } from "@/components/CoachAttendanceReportTemplate";

// Match type multiplier constants
const MATCH_MULTIPLIERS: Record<string, number> = {
  friendly: 1,
  official: 1.5,
  cup: 2,
};

const MATCH_TYPE_LABELS: Record<string, string> = {
  friendly: 'ودية',
  official: 'رسمية',
  cup: 'كأس',
};

export function CoachPayroll() {
    const { settings: academySettings } = useAcademy();
    const [coaches, setCoaches] = useState<any[]>([]);
    const [trainings, setTrainings] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter Mode
    const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    });

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Expanded row for detail view
    const [expandedCoach, setExpandedCoach] = useState<number | null>(null);

    // Processing & Modals
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    const [editModal, setEditModal] = useState<{ open: boolean; payment: any; coach: any } | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNotes, setEditNotes] = useState('');

    // Add Match Modal
    const [addMatchModal, setAddMatchModal] = useState(false);
    const [matchForm, setMatchForm] = useState({
        match_date: new Date().toISOString().split('T')[0],
        opponent: '',
        match_type: 'official',
        coach_id: '',
        category: '',
        result: '',
        location: '',
        notes: '',
    });
    const [isSavingMatch, setIsSavingMatch] = useState(false);

    // Print
    const [printCoach, setPrintCoach] = useState<any | null>(null);
    const [isPrintPortalOpen, setIsPrintPortalOpen] = useState(false);

    useEffect(() => { 
        loadData(); 
    }, [selectedMonth, filterMode, startDate, endDate]);

    const loadData = async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const [{ data: cData }, { data: tData }, { data: pData }, { data: tmData }, { data: mData }] = await Promise.all([
                supabase.from('coaches').select('*'),
                supabase.from('training').select('*').order('date', { ascending: false }),
                supabase.from('coach_payments').select('*'),
                supabase.from('teams').select('*'),
                supabase.from('ems_matches').select('*').order('match_date', { ascending: false }),
            ]);
            setCoaches(cData || []);
            setTrainings(tData || []);
            setPayments(pData || []);
            setTeams(tmData || []);
            setMatches(mData || []);
        } catch (error) {
            console.error("Load error in CoachPayroll:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Arabic Month Names
    const arabicMonths = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    const isDateInPeriod = (dateStr?: string) => {
        if (!dateStr) return false;
        const clean = dateStr.split('T')[0];
        if (filterMode === 'month') return clean.startsWith(selectedMonth);
        if (startDate && clean < startDate) return false;
        if (endDate && clean > endDate) return false;
        return true;
    };

    const getPeriodDescription = () => {
        if (filterMode === 'month') {
            const [y, m] = selectedMonth.split('-');
            return `شهر ${arabicMonths[parseInt(m, 10) - 1] || m} ${y}`;
        }
        return `الفترة من ${startDate} إلى ${endDate}`;
    };

    const getMonthsList = (sessionsList: any[]) => {
        if (filterMode === 'month') {
            const [y, m] = selectedMonth.split('-');
            return [`${arabicMonths[parseInt(m, 10) - 1] || m} ${y}`];
        }
        const mSet = new Set<string>();
        sessionsList.forEach(s => { if (s.date) mSet.add(s.date.substring(0, 7)); });
        return Array.from(mSet).sort().map(ym => {
            const [y, m] = ym.split('-');
            return `${arabicMonths[parseInt(m, 10) - 1] || m} ${y}`;
        });
    };

    // Training sessions for a coach
    const getCoachTrainingSessions = (coach: any) => {
        const coachId = Number(coach.coach_id);
        const coachTeamIds = (teams || [])
            .filter(tm => Number(tm.coach_id) === coachId)
            .map(tm => Number(tm.team_id));
        if (coach.team_id && !coachTeamIds.includes(Number(coach.team_id))) {
            coachTeamIds.push(Number(coach.team_id));
        }

        return (trainings || []).filter(t => {
            if (!t.date || !isDateInPeriod(t.date)) return false;
            // Explicit coach_id match
            if (t.coach_id && Number(t.coach_id) === coachId) return true;
            // Explicit team/squad match (الفوج الموكل)
            if (t.team_id && coachTeamIds.includes(Number(t.team_id))) return true;
            // Fallback only if neither coach nor team is set
            if (!t.coach_id && !t.team_id && coachTeamIds.length === 0 && coach.category && t.category === coach.category) return true;
            return false;
        }).map(t => {
            const tm = (teams || []).find(team => Number(team.team_id) === Number(t.team_id));
            return {
                ...t,
                session_type: 'training',
                team_name: tm?.team_name,
                category: tm?.category || t.category || coach.category || 'الفريق الأول'
            };
        }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    };

    // Match sessions for a coach (احتساب المباريات كحصص)
    const getCoachMatchSessions = (coach: any) => {
        const coachId = Number(coach.coach_id);
        const coachTeamIds = (teams || [])
            .filter(tm => Number(tm.coach_id) === coachId)
            .map(tm => Number(tm.team_id));
        if (coach.team_id && !coachTeamIds.includes(Number(coach.team_id))) {
            coachTeamIds.push(Number(coach.team_id));
        }
        const coachCategory = coach.category;

        return (matches || []).filter(m => {
            const matchDate = m.match_date || m.date;
            if (!matchDate || !isDateInPeriod(matchDate)) return false;
            // Direct coach assignment
            if (m.coach_id && Number(m.coach_id) === coachId) return true;
            // Explicit team/squad assignment (الفوج الموكل)
            if (m.team_id && coachTeamIds.includes(Number(m.team_id))) return true;
            // Fallback only if no specific team is assigned
            if (!m.coach_id && !m.team_id && coachTeamIds.length === 0 && coachCategory && m.category === coachCategory) return true;
            return false;
        }).map(m => {
            const matchType = m.match_type || 'official';
            const multiplier = MATCH_MULTIPLIERS[matchType] ?? 1;
            return {
                ...m,
                session_type: 'match',
                date: m.match_date || m.date,
                title: `مباراة ${MATCH_TYPE_LABELS[matchType] || ''} ضد ${m.opponent || m.home_team || 'خصم'}`,
                match_type: matchType,
                multiplier,
                // A match counts as `multiplier` sessions
                effective_sessions: multiplier,
            };
        }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    };

    // Combined stats: trainings + matches
    const getStats = (coach: any) => {
        const coachId = Number(coach.coach_id);
        const trainingSessions = getCoachTrainingSessions(coach);
        const matchSessions = getCoachMatchSessions(coach);
        const rate = Number(coach.salary_per_session) || 1000;

        const trainingCount = trainingSessions.length;
        const matchEquivalentSessions = matchSessions.reduce((sum, m) => sum + (m.multiplier || 1), 0);
        const totalSessions = trainingCount + matchEquivalentSessions;
        const amount = totalSessions * rate;
        const matchAmount = matchEquivalentSessions * rate;
        const trainingAmount = trainingCount * rate;

        const payment = (payments || []).find(p => {
            if (Number(p.coach_id) !== coachId) return false;
            if (filterMode === 'month') return p.month === selectedMonth;
            const pDate = (p.payment_date || p.created_at || '').split('T')[0];
            return (!startDate || pDate >= startDate) && (!endDate || pDate <= endDate);
        });

        return { 
            trainingSessions, 
            matchSessions,
            trainingCount,
            matchCount: matchSessions.length,
            matchEquivalentSessions,
            totalSessions,
            rate, 
            amount,
            trainingAmount,
            matchAmount,
            payment, 
            isPaid: !!payment 
        };
    };

    /* ---- تسديد الأجر ---- */
    const handlePay = async (coach: any) => {
        const stats = getStats(coach);
        const periodText = getPeriodDescription();

        const finalAmount = stats.totalSessions > 0
            ? stats.amount
            : Number(window.prompt(`أدخل المبلغ يدوياً (دج):`, '1000') || 0);

        if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
            alert("المبلغ غير صالح.");
            return;
        }

        const breakdown = stats.trainingCount > 0 || stats.matchCount > 0
            ? `\nتدريبات: ${stats.trainingCount} حصة (${stats.trainingAmount.toLocaleString()} دج)\nمباريات: ${stats.matchCount} مباراة = ${stats.matchEquivalentSessions} حصة (${stats.matchAmount.toLocaleString()} دج)`
            : '';

        if (!window.confirm(
            `تسديد مستحقات المدرب: ${coach.name}\n${periodText}${breakdown}\n\nإجمالي الحصص: ${stats.totalSessions}\nالمبلغ الإجمالي: ${finalAmount.toLocaleString()} دج\n\nهل أنت متأكد من تسجيل العملية؟`
        )) return;

        setIsProcessing(coach.coach_id);
        try {
            const payMonth = filterMode === 'month' ? selectedMonth : (startDate.substring(0, 7) || selectedMonth);
            const { error: payErr } = await supabase.from('coach_payments').insert([{
                coach_id: coach.coach_id,
                amount: finalAmount,
                month: payMonth,
                sessions_count: stats.totalSessions,
                payment_date: new Date().toISOString().split('T')[0],
                notes: `أجر ${periodText} - ${stats.trainingCount} تدريب + ${stats.matchCount} مباراة (${stats.totalSessions} حصة إجمالاً)`,
            }]);
            if (payErr) throw payErr;

            const { error: finErr } = await supabase.from('finances').insert([{
                type: 'expense',
                category: 'أجور المدربين',
                amount: finalAmount,
                date: new Date().toISOString().split('T')[0],
                notes: `أجر المدرب ${coach.name} - ${periodText} (${stats.trainingCount} تدريب + ${stats.matchCount} مباراة)`,
            }]);
            if (finErr) console.warn("Finance insert warning:", finErr.message);

            await loadData(true);
            alert(`✅ تم تسديد ${finalAmount.toLocaleString()} دج للمدرب ${coach.name} بنجاح.`);
        } catch (err: any) {
            console.error(err);
            alert(`❌ خطأ: ${err.message}`);
        } finally {
            setIsProcessing(null);
        }
    };

    /* ---- إضافة مباراة جديدة ---- */
    const handleSaveMatch = async () => {
        if (!matchForm.match_date) { alert("يرجى إدخال تاريخ المباراة."); return; }
        setIsSavingMatch(true);
        try {
            const payload: any = {
                match_date: matchForm.match_date,
                opponent: matchForm.opponent || 'خصم',
                match_type: matchForm.match_type,
                location: matchForm.location || '',
                result: matchForm.result || '',
                notes: matchForm.notes || '',
                status: 'completed',
            };
            if (matchForm.coach_id) payload.coach_id = Number(matchForm.coach_id);
            if (matchForm.category) payload.category = matchForm.category;

            const { error } = await supabase.from('ems_matches').insert([payload]);
            if (error) throw error;

            await loadData(true);
            setAddMatchModal(false);
            setMatchForm({
                match_date: new Date().toISOString().split('T')[0],
                opponent: '',
                match_type: 'official',
                coach_id: '',
                category: '',
                result: '',
                location: '',
                notes: '',
            });
            alert(`✅ تمت إضافة المباراة بنجاح. سيتم احتسابها ضمن حصص المدرب المحدد.`);
        } catch (err: any) {
            alert(`❌ خطأ في حفظ المباراة: ${err.message}`);
        } finally {
            setIsSavingMatch(false);
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
        await loadData(true);
        alert('✅ تم تحديث الدفعة بنجاح.');
    };

    /* ---- طباعة الوصل المالي ---- */
    const handlePrintReceipt = (coach: any) => {
        const stats = getStats(coach);
        const payDate = stats.payment?.payment_date || new Date().toISOString().split('T')[0];
        const amount = stats.payment?.amount ?? stats.amount;
        const periodText = getPeriodDescription();
        const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";

        const html = `<!DOCTYPE html><html lang="ar" dir="rtl">
<head><meta charset="UTF-8">
<title>وصل تسديد أجر - ${coach.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Tajawal', Arial, sans-serif; background: #fff; color: #000; direction: rtl; }
  .receipt { max-width: 700px; margin: 30px auto; border: 2px solid #000; border-radius: 10px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #0f172a, #1e3a5f); color: white; text-align: center; padding: 24px; }
  .header h1 { font-size: 20px; font-weight: 900; }
  .header h2 { font-size: 13px; margin-top: 6px; color: #94a3b8; }
  .body { padding: 28px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: right; }
  td { padding: 10px 14px; border: 1px solid #e2e8f0; font-size: 13px; }
  td:first-child { background: #f8fafc; font-weight: 700; width: 38%; color: #0f172a; }
  .amount-row td { font-size: 16px; font-weight: 900; color: #059669; background: #ecfdf5 !important; }
  .breakdown { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .breakdown h4 { font-size: 13px; font-weight: 900; color: #374151; margin-bottom: 10px; }
  .breakdown-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e5e7eb; font-size: 12px; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 32px; text-align: center; }
  .sig-line { border-bottom: 1px dashed #000; width: 140px; margin: 36px auto 0; }
  .sig-label { font-weight: 700; font-size: 13px; }
  .footer { background: #f8fafc; text-align: center; padding: 12px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  .badge { display: inline-block; background: #dcfce7; color: #166534; border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 700; }
</style></head><body>
<div class="receipt">
  <div class="header">
    <h1>${academyName}</h1>
    <h2>وصل تسديد أجر ومستحقات مدرب</h2>
  </div>
  <div class="body">
    <table>
      <tr><td>اسم المدرب</td><td><strong>${coach.name}</strong> ${coach.category ? `(فئة ${coach.category})` : ''}</td></tr>
      <tr><td>الفترة / الأشهر</td><td>${periodText}</td></tr>
      <tr><td>عدد التدريبات</td><td><strong>${stats.trainingCount}</strong> حصة تدريبية</td></tr>
      <tr><td>عدد المباريات</td><td><strong>${stats.matchCount}</strong> مباراة = <strong>${stats.matchEquivalentSessions}</strong> حصة مكافئة</td></tr>
      <tr><td>إجمالي الحصص المحتسبة</td><td><strong>${stats.totalSessions}</strong> حصة</td></tr>
      <tr><td>سعر الحصة الواحدة</td><td>${stats.rate.toLocaleString()} دج</td></tr>
      <tr class="amount-row"><td>المبلغ الإجمالي المسدَّد</td><td>${Number(amount).toLocaleString()} دج <span class="badge">✓ مسدد</span></td></tr>
      <tr><td>تاريخ التسديد</td><td>${payDate}</td></tr>
    </table>
    ${stats.matchCount > 0 ? `<div class="breakdown">
      <h4>📋 تفصيل احتساب المباريات:</h4>
      ${stats.matchSessions.map(m => `
        <div class="breakdown-row">
          <span>${m.title || 'مباراة'}</span>
          <span>${m.date || ''} &nbsp;•&nbsp; معامل ×${m.multiplier} = ${m.multiplier} حصة</span>
        </div>
      `).join('')}
    </div>` : ''}
    <div class="sigs">
      <div><p class="sig-label">توقيع واستلام المدرب</p><div class="sig-line"></div></div>
      <div><p class="sig-label">ختم ومصادقة إدارة الأكاديمية</p><div class="sig-line"></div></div>
    </div>
  </div>
  <div class="footer">صدر بتاريخ: ${new Date().toLocaleDateString('ar-DZ')} — ${academyName}</div>
</div>
</body></html>`;

        const w = window.open('', '_blank', 'width=800,height=700');
        if (!w) { alert("يرجى السماح بالنوافذ المنبثقة."); return; }
        w.document.write(html);
        w.document.close();
        setTimeout(() => { w.print(); }, 600);
    };

    // Filtered & sorted coaches list
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
        return Array.from(set).sort();
    }, [coaches]);

    // Global summary stats
    const summaryStats = useMemo(() => {
        let totalTraining = 0, totalMatches = 0, totalEquivalent = 0, totalPendingAmount = 0, totalPaidAmount = 0;
        filteredCoaches.forEach(c => {
            const s = getStats(c);
            totalTraining += s.trainingCount;
            totalMatches += s.matchCount;
            totalEquivalent += s.totalSessions;
            if (!s.isPaid) totalPendingAmount += s.amount;
        });
        payments.forEach(p => { totalPaidAmount += Number(p.amount || 0); });
        return { totalTraining, totalMatches, totalEquivalent, totalPendingAmount, totalPaidAmount };
    }, [filteredCoaches, payments, trainings, matches]);

    return (
        <div className="space-y-6 pb-20 font-tajawal" dir="rtl">
            {/* ─── Header ───────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 p-6 rounded-3xl border border-zinc-800/80 backdrop-blur-md">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 0px, transparent 50%)' }} />
                <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/5 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-lg shadow-emerald-950/20">
                                <DollarSign className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-50">
                                    مستحقات وأجور المدربين
                                </h2>
                                <p className="text-zinc-400 text-sm mt-0.5">
                                    تدريبات + مباريات = إجمالي الحصص المحتسبة وطباعة الوصول الرسمية
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        {/* Add Match Button */}
                        <Button
                            onClick={() => setAddMatchModal(true)}
                            className="bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-600 hover:to-indigo-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-950/30 border border-indigo-500/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Trophy className="h-4 w-4" />
                            <span>إضافة مباراة</span>
                        </Button>

                        {/* Period Selector */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-950/80 border border-zinc-800/90 p-2 rounded-2xl">
                            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                                <button type="button" onClick={() => setFilterMode('month')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'month' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}>
                                    شهري
                                </button>
                                <button type="button" onClick={() => setFilterMode('range')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'range' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}>
                                    بين تاريخين
                                </button>
                            </div>
                            {filterMode === 'month' ? (
                                <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                                    <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                                    <input type="month" value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-transparent text-zinc-100 outline-none border-none font-bold text-xs sm:text-sm cursor-pointer" />
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
                                    <CalendarRange className="h-4 w-4 text-emerald-400 shrink-0" />
                                    <span className="text-zinc-400 font-bold">من:</span>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent text-zinc-100 outline-none border-none font-bold text-xs cursor-pointer" />
                                    <span className="text-zinc-400 font-bold">إلى:</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent text-zinc-100 outline-none border-none font-bold text-xs cursor-pointer" />
                                </div>
                            )}
                            <button onClick={() => loadData(true)} className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" title="تحديث البيانات">
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Stats Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                    { label: 'المدربين', value: `${coaches.length}`, unit: 'مدرب', icon: Users, color: 'text-zinc-300', bg: 'bg-zinc-800/50 border-zinc-700/50' },
                    { label: 'حصص التدريب', value: `${summaryStats.totalTraining}`, unit: 'حصة', icon: Dumbbell, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                    { label: 'المباريات (حصص)', value: `${summaryStats.totalMatches}`, unit: `= ${summaryStats.totalEquivalent - summaryStats.totalTraining} حصة`, icon: Trophy, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                    { label: 'المستحقات المعلقة', value: summaryStats.totalPendingAmount.toLocaleString(), unit: 'دج', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    { label: 'إجمالي المسدد', value: summaryStats.totalPaidAmount.toLocaleString(), unit: 'دج', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                ].map((stat, i) => (
                    <Card key={i} className={`border ${stat.bg} transition-all`}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-tight`}>{stat.label}</span>
                                <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                            </div>
                            <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">{stat.unit}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ─── Match Multiplier Legend ──────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 text-xs bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/60">
                <span className="text-zinc-500 font-bold flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" />معامل احتساب المباريات:</span>
                <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg font-bold">مباراة ودية = ×1 حصة</span>
                <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-lg font-bold">مباراة رسمية = ×1.5 حصة</span>
                <span className="bg-amber-500/15 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg font-bold">مباراة كأس = ×2 حصة</span>
                <span className="text-zinc-600 mr-auto">الحصص × سعر الحصة = المستحق الإجمالي</span>
            </div>

            {/* ─── Search & Filter Bar ──────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-800/60">
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input type="text" placeholder="بحث باسم المدرب..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none" />
                    </div>
                    {categoriesList.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Filter className="h-4 w-4 text-zinc-500 hidden sm:block" />
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none">
                                <option value="all">كل الفئات</option>
                                {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div className="text-xs text-zinc-400 bg-zinc-950/80 px-3.5 py-2 rounded-xl border border-zinc-800 font-medium self-start sm:self-auto">
                    الفترة: <span className="font-black text-emerald-400">{getPeriodDescription()}</span>
                </div>
            </div>

            {/* ─── Coaches Payroll Cards ────────────────────────────── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <span className="text-sm">جاري تحميل بيانات التدريبات والمباريات...</span>
                </div>
            ) : filteredCoaches.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                    لا يوجد مدربون يطابقون معايير البحث.
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredCoaches.map(coach => {
                        const stats = getStats(coach);
                        const isExpanded = expandedCoach === coach.coach_id;
                        const photo = localStorage.getItem(`coach_photo_${coach.coach_id}`);

                        return (
                            <Card key={coach.coach_id} className={`bg-zinc-900/50 border-zinc-800/70 overflow-hidden transition-all duration-300 ${stats.isPaid ? 'border-l-2 border-l-emerald-500/60' : stats.totalSessions > 0 ? 'border-l-2 border-l-amber-500/60' : ''}`}>
                                {/* Main Row */}
                                <CardContent className="p-0">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5">
                                        
                                        {/* Coach Avatar + Name */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className={`h-12 w-12 rounded-2xl ${stats.isPaid ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-zinc-800 border-zinc-700'} border flex items-center justify-center overflow-hidden`}>
                                                    {photo ? (
                                                        <img src={photo} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg font-black text-zinc-400">{coach.name?.[0] || '?'}</span>
                                                    )}
                                                </div>
                                                {stats.isPaid && (
                                                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-zinc-50 text-base leading-tight truncate">ك. {coach.name}</p>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    {coach.category && (
                                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                                                            فئة {coach.category}
                                                        </span>
                                                    )}
                                                    {coach.specialty && (
                                                        <span className="text-[10px] text-zinc-500 font-medium truncate">{coach.specialty}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
                                            {/* Training sessions */}
                                            <div className="bg-sky-500/8 border border-sky-500/15 rounded-xl p-2.5 text-center min-w-[72px]">
                                                <Dumbbell className="h-3.5 w-3.5 text-sky-400 mx-auto mb-1" />
                                                <div className="text-lg font-black text-sky-300">{stats.trainingCount}</div>
                                                <div className="text-[9px] text-sky-500 font-bold">تدريب</div>
                                            </div>
                                            {/* Match sessions */}
                                            <div className="bg-violet-500/8 border border-violet-500/15 rounded-xl p-2.5 text-center min-w-[72px]">
                                                <Trophy className="h-3.5 w-3.5 text-violet-400 mx-auto mb-1" />
                                                <div className="text-lg font-black text-violet-300">{stats.matchCount}</div>
                                                <div className="text-[9px] text-violet-500 font-bold">مباراة</div>
                                            </div>
                                            {/* Total equivalent */}
                                            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-2.5 text-center min-w-[72px]">
                                                <Activity className="h-3.5 w-3.5 text-zinc-300 mx-auto mb-1" />
                                                <div className="text-lg font-black text-white">{stats.totalSessions}</div>
                                                <div className="text-[9px] text-zinc-500 font-bold">حصة إجمالاً</div>
                                            </div>
                                            {/* Amount */}
                                            <div className={`${stats.isPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/8 border-amber-500/15'} border rounded-xl p-2.5 text-center min-w-[80px]`}>
                                                <DollarSign className={`h-3.5 w-3.5 ${stats.isPaid ? 'text-emerald-400' : 'text-amber-400'} mx-auto mb-1`} />
                                                <div className={`text-sm font-black ${stats.isPaid ? 'text-emerald-300' : 'text-amber-300'} leading-tight`}>
                                                    {(stats.payment?.amount ?? stats.amount).toLocaleString()}
                                                </div>
                                                <div className={`text-[9px] ${stats.isPaid ? 'text-emerald-500' : 'text-amber-500'} font-bold`}>دج</div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex flex-col items-center gap-2 shrink-0">
                                            {stats.isPaid ? (
                                                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap">
                                                    <CheckCircle2 size={12} /> تم الدفع
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap">
                                                    <Clock size={12} /> مستحق
                                                </span>
                                            )}
                                            <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                                                {stats.rate.toLocaleString()} دج/حصة
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            <button type="button"
                                                onClick={() => { setPrintCoach(coach); setIsPrintPortalOpen(true); }}
                                                className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md active:scale-95"
                                                title="تقرير الحضور والحصص (A4)">
                                                <FileText size={13} />
                                                <span className="hidden sm:inline">تقرير A4</span>
                                            </button>

                                            {!stats.isPaid ? (
                                                <button type="button"
                                                    disabled={isProcessing === coach.coach_id}
                                                    onClick={() => handlePay(coach)}
                                                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors active:scale-95">
                                                    {isProcessing === coach.coach_id
                                                        ? <><Loader2 size={13} className="animate-spin" /> جاري...</>
                                                        : <><DollarSign size={13} /> تسديد</>
                                                    }
                                                </button>
                                            ) : (
                                                <button type="button" onClick={() => openEdit(coach)}
                                                    className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-2.5 py-2 rounded-xl transition-colors">
                                                    <Edit size={13} /> تعديل
                                                </button>
                                            )}

                                            <button type="button" onClick={() => handlePrintReceipt(coach)}
                                                className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-2.5 py-2 rounded-xl transition-colors"
                                                title="طباعة وصل تسديد الأجر">
                                                <Printer size={13} />
                                                <span className="hidden sm:inline">وصل</span>
                                            </button>

                                            <button type="button"
                                                onClick={() => setExpandedCoach(isExpanded ? null : coach.coach_id)}
                                                className="inline-flex items-center gap-1 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-bold px-2.5 py-2 rounded-xl transition-colors"
                                                title="عرض تفاصيل الحصص">
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ─── Expanded Detail Panel ─── */}
                                    {isExpanded && (
                                        <div className="border-t border-zinc-800/70 bg-zinc-950/50">
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                
                                                {/* Training Sessions List */}
                                                <div>
                                                    <h4 className="text-xs font-black text-sky-400 flex items-center gap-1.5 mb-3 pb-2 border-b border-zinc-800/60">
                                                        <Dumbbell className="h-3.5 w-3.5" />
                                                        حصص التدريب ({stats.trainingCount})
                                                    </h4>
                                                    {stats.trainingSessions.length === 0 ? (
                                                        <p className="text-xs text-zinc-600 text-center py-4">لا توجد حصص تدريبية في هذه الفترة</p>
                                                    ) : (
                                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                            {stats.trainingSessions.map((s, i) => (
                                                                <div key={i} className="flex items-center justify-between bg-zinc-900/50 rounded-lg px-3 py-2 border border-zinc-800/40">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-black text-zinc-600 w-5">{i + 1}</span>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-zinc-200 truncate max-w-[180px]">{s.title || s.theme || 'حصة تدريب'}</p>
                                                                            {s.team_name && <p className="text-[10px] text-zinc-500">{s.team_name}</p>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-left shrink-0">
                                                                        <p className="text-[11px] font-bold text-zinc-300">{s.date}</p>
                                                                        <p className="text-[10px] text-sky-500 text-left font-bold">×1 حصة</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Match Sessions List */}
                                                <div>
                                                    <h4 className="text-xs font-black text-violet-400 flex items-center gap-1.5 mb-3 pb-2 border-b border-zinc-800/60">
                                                        <Trophy className="h-3.5 w-3.5" />
                                                        المباريات ({stats.matchCount}) = {stats.matchEquivalentSessions} حصة مكافئة
                                                    </h4>
                                                    {stats.matchSessions.length === 0 ? (
                                                        <p className="text-xs text-zinc-600 text-center py-4">لا توجد مباريات في هذه الفترة</p>
                                                    ) : (
                                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                            {stats.matchSessions.map((m, i) => (
                                                                <div key={i} className="flex items-center justify-between bg-violet-500/5 border border-violet-500/15 rounded-lg px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Trophy className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                                                        <div>
                                                                            <p className="text-xs font-bold text-zinc-200 truncate max-w-[160px]">{m.opponent || 'خصم'}</p>
                                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.match_type === 'cup' ? 'bg-amber-500/15 text-amber-400' : m.match_type === 'official' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                                                                {MATCH_TYPE_LABELS[m.match_type] || m.match_type}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-left shrink-0">
                                                                        <p className="text-[11px] font-bold text-zinc-300">{m.date}</p>
                                                                        <p className="text-[10px] text-violet-400 text-left font-black">×{m.multiplier} حصة</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Summary Footer */}
                                            <div className="px-4 pb-4">
                                                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                                                    <div className="flex flex-wrap gap-4 text-xs">
                                                        <span className="flex items-center gap-1.5">
                                                            <Dumbbell className="h-3.5 w-3.5 text-sky-400" />
                                                            <span className="text-zinc-400">تدريب:</span>
                                                            <span className="font-black text-sky-300">{stats.trainingCount} × {stats.rate.toLocaleString()} = {stats.trainingAmount.toLocaleString()} دج</span>
                                                        </span>
                                                        {stats.matchCount > 0 && (
                                                            <span className="flex items-center gap-1.5">
                                                                <Trophy className="h-3.5 w-3.5 text-violet-400" />
                                                                <span className="text-zinc-400">مباريات:</span>
                                                                <span className="font-black text-violet-300">{stats.matchEquivalentSessions} حصة × {stats.rate.toLocaleString()} = {stats.matchAmount.toLocaleString()} دج</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-black">
                                                        <span className="text-zinc-400">الإجمالي: </span>
                                                        <span className="text-emerald-400">{stats.amount.toLocaleString()} دج</span>
                                                        <span className="text-zinc-500 text-xs mr-1">({stats.totalSessions} حصة)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ─── Add Match Modal ──────────────────────────────────── */}
            {addMatchModal && (
                <Modal isOpen onClose={() => setAddMatchModal(false)} title="إضافة مباراة جديدة" size="md">
                    <div className="space-y-5 font-tajawal pt-2" dir="rtl">
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3.5 text-xs text-violet-300 flex items-start gap-2.5">
                            <Trophy className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>المباراة ستُحتسب تلقائياً ضمن حصص المدرب المحدد وتُضاف إلى مستحقاته حسب نوع المباراة (ودية ×1، رسمية ×1.5، كأس ×2).</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">تاريخ المباراة *</label>
                                <input type="date" value={matchForm.match_date}
                                    onChange={e => setMatchForm(f => ({ ...f, match_date: e.target.value }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">نوع المباراة *</label>
                                <select value={matchForm.match_type}
                                    onChange={e => setMatchForm(f => ({ ...f, match_type: e.target.value }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none">
                                    <option value="friendly">ودية (×1 حصة)</option>
                                    <option value="official">رسمية (×1.5 حصة)</option>
                                    <option value="cup">كأس / بطولة (×2 حصة)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">الخصم / الفريق المنافس</label>
                                <input type="text" placeholder="اسم الفريق الخصم..."
                                    value={matchForm.opponent}
                                    onChange={e => setMatchForm(f => ({ ...f, opponent: e.target.value }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">المدرب المسؤول</label>
                                <select value={matchForm.coach_id}
                                    onChange={e => {
                                        const coach = coaches.find(c => String(c.coach_id) === e.target.value);
                                        setMatchForm(f => ({ ...f, coach_id: e.target.value, category: coach?.category || f.category }));
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none">
                                    <option value="">اختر المدرب...</option>
                                    {coaches.map(c => (
                                        <option key={c.coach_id} value={c.coach_id}>ك. {c.name} {c.category ? `(${c.category})` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">الفئة</label>
                                <select value={matchForm.category}
                                    onChange={e => setMatchForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none">
                                    <option value="">— اختر الفئة —</option>
                                    {categoriesList.map(c => <option key={c} value={c}>فئة {c}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">النتيجة</label>
                                <input type="text" placeholder="مثال: 2-1"
                                    value={matchForm.result}
                                    onChange={e => setMatchForm(f => ({ ...f, result: e.target.value }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">الملعب / الموقع</label>
                                <input type="text" placeholder="ملعب..."
                                    value={matchForm.location}
                                    onChange={e => setMatchForm(f => ({ ...f, location: e.target.value }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">ملاحظات</label>
                                <input type="text" placeholder="ملاحظات إضافية..."
                                    value={matchForm.notes}
                                    onChange={e => setMatchForm(f => ({ ...f, notes: e.target.value }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none" />
                            </div>
                        </div>

                        {/* Match Multiplier Preview */}
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                            <span className="text-sm text-zinc-400 font-bold">قيمة المباراة للمدرب المحدد:</span>
                            <div className="text-left">
                                <span className="text-xl font-black text-violet-400">×{MATCH_MULTIPLIERS[matchForm.match_type] ?? 1}</span>
                                <span className="text-sm text-zinc-500 mr-1 font-medium">حصة</span>
                                {matchForm.coach_id && (() => {
                                    const coach = coaches.find(c => String(c.coach_id) === matchForm.coach_id);
                                    const rate = Number(coach?.salary_per_session) || 1000;
                                    const equiv = (MATCH_MULTIPLIERS[matchForm.match_type] ?? 1) * rate;
                                    return <span className="text-sm font-black text-emerald-400 mr-2">= {equiv.toLocaleString()} دج</span>;
                                })()}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
                            <Button variant="outline" onClick={() => setAddMatchModal(false)}
                                className="border-zinc-700 text-zinc-300 rounded-xl">إلغاء</Button>
                            <Button onClick={handleSaveMatch} disabled={isSavingMatch}
                                className="bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-600 hover:to-indigo-600 text-white font-black rounded-xl px-6">
                                {isSavingMatch ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />جاري الحفظ...</> : <><Trophy className="h-4 w-4 mr-2" />حفظ المباراة</>}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ─── Attendance Report Print Portal ──────────────────── */}
            {isPrintPortalOpen && printCoach && (
                <PrintPortal
                    isOpen={isPrintPortalOpen}
                    onClose={() => { setIsPrintPortalOpen(false); setPrintCoach(null); }}
                    title={`كشف حضور وحصص المدرب: ${printCoach.name}`}
                    fileName={`تقرير_حضور_${printCoach.name}_${filterMode === 'month' ? selectedMonth : `${startDate}_${endDate}`}`}
                >
                    <CoachAttendanceReportTemplate
                        coach={printCoach}
                        sessions={getCoachTrainingSessions(printCoach)}
                        periodDescription={getPeriodDescription()}
                        monthsList={getMonthsList(getCoachTrainingSessions(printCoach))}
                        academySettings={academySettings}
                        paymentInfo={getStats(printCoach).payment ? {
                            isPaid: true,
                            amount: getStats(printCoach).payment.amount,
                            payment_date: getStats(printCoach).payment.payment_date,
                            notes: getStats(printCoach).payment.notes
                        } : { isPaid: false }}
                    />
                </PrintPortal>
            )}

            {/* ─── Edit Payment Modal ───────────────────────────────── */}
            {editModal?.open && (
                <Modal isOpen onClose={() => setEditModal(null)} title={`تعديل دفعة: ${editModal.coach?.name}`}>
                    <div className="space-y-4 font-tajawal" dir="rtl">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">المبلغ المسدد (دج)</label>
                            <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300">ملاحظات الدفعة</label>
                            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
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
