import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, CreditCard, Download, CheckCircle, XCircle, AlertCircle, 
  Printer, ArrowRight, X, User, Phone, MessageSquare, Plus, Filter, 
  CheckCircle2, DollarSign, Wallet, RefreshCw, Send, Users, ShieldAlert, 
  Sparkles, ExternalLink 
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { SubscriptionReceiptTemplate, PaidSubscribersA4SheetTemplate } from "@/components/PrintTemplates";
import { PrintPortal } from "@/components/PrintPortal";
import { exportToPDF } from "@/lib/pdf-export";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ─── Filter Types ─────────────────────────────────────────────────────────────
type PaymentFilterTab = 'all' | 'full_first' | 'half_first' | 'exempt' | 'unpaid' | 'all_players';

// ─── Player Search Dropdown ────────────────────────────────────────────────────
function PlayerSearchSelect({
  players,
  value,
  onChange,
  getPlayerPaymentInfo,
}: {
  players: any[];
  value: number | null;
  onChange: (id: number, name: string) => void;
  getPlayerPaymentInfo?: (id: number) => any;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedPlayer = players.find(p => p.player_id === value || p.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = players.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase()) ||
    String(p.player_id).includes(query) ||
    (p.phone && p.phone.includes(query))
  ).slice(0, 20);

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name="player_id" value={value ?? ""} required />

      <div
        className={`w-full flex items-center gap-2 rounded-xl border px-4 py-3 text-sm cursor-pointer transition ${
          open ? "border-emerald-500 ring-1 ring-emerald-500/30" : "border-zinc-800 hover:border-zinc-700"
        } bg-zinc-950 text-zinc-50`}
        onClick={() => { setOpen(v => !v); setQuery(""); }}
      >
        <User className="h-4 w-4 text-zinc-500 shrink-0" />
        <span className={selectedPlayer ? "text-zinc-50 font-semibold" : "text-zinc-500"}>
          {selectedPlayer ? selectedPlayer.name : "اختر اللاعب..."}
        </span>
        {selectedPlayer && (
          <button
            type="button"
            className="mr-auto text-zinc-500 hover:text-rose-400 transition"
            onClick={(e) => { e.stopPropagation(); onChange(0, ""); setQuery(""); }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                autoFocus
                type="text"
                placeholder="ابحث بالاسم، الفئة أو الهاتف..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-zinc-500 text-xs">لا يوجد لاعب مطابق</div>
            ) : (
              filtered.map(p => {
                const info = getPlayerPaymentInfo ? getPlayerPaymentInfo(p.player_id) : null;
                return (
                  <div
                    key={p.player_id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition hover:bg-zinc-800/60 ${
                      value === p.player_id ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-100"
                    }`}
                    onClick={() => { onChange(p.player_id, p.name); setOpen(false); setQuery(""); }}
                  >
                    <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-400">
                      {p.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold truncate">{p.name}</span>
                        {info && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            info.status === 'full_first' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            info.status === 'half_first' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {info.status === 'full_first' ? 'مشترك مسدد' :
                             info.status === 'half_first' ? 'نصف دفعة' :
                             'غير مسدد'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500">{p.category || "—"} • #{p.player_id} {p.phone ? `• ${p.phone}` : ''}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Subscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [subToDelete, setSubToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [printData, setPrintData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [academySettings, setAcademySettings] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [parents, setParents] = useState<any[]>([]);

  // ─── Paid Subscribers A4 Sheet Modal States ───────────────────────────────
  const [isPaidSheetOpen, setIsPaidSheetOpen] = useState(false);
  const [sheetCategory, setSheetCategory] = useState<string>("all");
  const [sheetPaymentType, setSheetPaymentType] = useState<"all_paid" | "full" | "half">("all_paid");

  // ─── Filter States ─────────────────────────────────────────────────────────
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<'unpaid' | 'half_first' | 'expired'>('unpaid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subsData, playersData, settingsData, plansData, parentsData] = await Promise.all([
        api.getSubscriptions(),
        api.getPlayers(),
        api.getAcademySettings(),
        api.getSubscriptionPlans(),
        api.getParents().catch(() => [])
      ]);
      // Sort subscriptions strictly by ID ascending to preserve the original registered receipt sequence
      const sortedSubs = (subsData || []).slice().sort((a: any, b: any) => {
        const idA = Number(a.id || a.subscription_id || 0);
        const idB = Number(b.id || b.subscription_id || 0);
        return idA - idB;
      });
      setSubscriptions(sortedSubs);
      setPlayers(playersData || []);
      setAcademySettings(settingsData);
      setPlans(plansData || []);
      setParents(parentsData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPaidSheetModal = (type: "all_paid" | "full" | "half" = "all_paid") => {
    setSheetPaymentType(type);
    if (selectedCategory && selectedCategory !== 'all') {
      setSheetCategory(selectedCategory);
    }
    setIsPaidSheetOpen(true);
  };

  // ─── Export Paid Players to Excel ──────────────────────────────────────────
  const handleExportPaidPlayersExcel = () => {
    const parseBirthTime = (d?: string | Date): number => {
      if (!d) return Infinity;
      if (d instanceof Date) return isNaN(d.getTime()) ? Infinity : d.getTime();
      let clean = String(d).trim();
      if (clean.includes('T')) clean = clean.split('T')[0];
      if (clean.includes(' ')) clean = clean.split(' ')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const t = new Date(clean).getTime();
        return isNaN(t) ? Infinity : t;
      }
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
        const parts = clean.split(/[\/\-]/);
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        const t = new Date(`${year}-${month}-${day}`).getTime();
        return isNaN(t) ? Infinity : t;
      }
      const t = new Date(clean).getTime();
      return isNaN(t) ? Infinity : t;
    };

    const resolveGuardianName = (p: any): string => {
      if (p.father_name && String(p.father_name).trim() !== '') return p.father_name;
      const matchedParent = parents.find((pr: any) =>
        (p.parent_id && pr.id === p.parent_id) ||
        (p.parent_username && pr.username === p.parent_username) ||
        (p.phone && pr.phone === p.phone)
      );
      if (matchedParent?.full_name) return matchedParent.full_name;
      if (p.guardian_name) return p.guardian_name;
      if (p.parent_name) return p.parent_name;
      return 'غير مسجل';
    };

    const resolveGuardianPhone = (p: any): string => {
      if (p.phone && String(p.phone).trim() !== '') return p.phone;
      const matchedParent = parents.find((pr: any) =>
        (p.parent_id && pr.id === p.parent_id) ||
        (p.parent_username && pr.username === p.parent_username)
      );
      if (matchedParent?.phone) return matchedParent.phone;
      if (p.guardian_phone) return p.guardian_phone;
      if (p.parent_phone) return p.parent_phone;
      if (p.emergency_contact) return p.emergency_contact;
      return '—';
    };

    const filtered = players.filter((p: any) => {
      if (sheetCategory !== 'all' && p.category !== sheetCategory) return false;
      const pSubs = subscriptions.filter((s: any) => s.player_id === p.player_id);
      const totalPaid = pSubs.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
      const hasActiveSub = pSubs.some((s: any) => s.status === 'active' || s.status === 'نشط' || s.status === 'paid');
      const isExempt = pSubs.some((s: any) => 
        (s.plan_name && (s.plan_name.includes('معفى') || s.plan_name.includes('خاصة') || s.plan_name.includes('إعفاء'))) ||
        s.status === 'معفى'
      );
      const isPaid = totalPaid > 0 || hasActiveSub;
      if (!isPaid && !isExempt) return false;

      const hasHalfPlan = pSubs.some((s: any) => (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000);
      const isFullPaid = totalPaid >= 10000 && !hasHalfPlan;
      const isHalfPaid = (hasHalfPlan || totalPaid === 5000) && !isFullPaid;

      if (sheetPaymentType === 'full' && !isFullPaid) return false;
      if (sheetPaymentType === 'half' && !isHalfPaid) return false;

      return true;
    }).sort((a: any, b: any) => parseBirthTime(a.birth_date) - parseBirthTime(b.birth_date));

    const rows = filtered.map((p, idx) => {
      const pSubs = subscriptions.filter((s: any) => s.player_id === p.player_id);
      const totalPaid = pSubs.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
      const hasHalfPlan = pSubs.some((s: any) => (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000);
      const isExempt = pSubs.some((s: any) => 
        (s.plan_name && (s.plan_name.includes('معفى') || s.plan_name.includes('خاصة') || s.plan_name.includes('إعفاء'))) ||
        s.status === 'معفى'
      );
      const isFull = totalPaid >= 10000 && !hasHalfPlan;
      const isHalf = (hasHalfPlan || totalPaid === 5000) && !isFull;
      const paymentStatus = isExempt ? 'معفى' : isFull ? `دفعة كاملة (${totalPaid} دج)` : isHalf ? `نصف دفعة (${totalPaid} دج)` : `${totalPaid} دج`;

      return {
        "ت": idx + 1,
        "اسم ولقب اللاعب": p.name || '---',
        "تاريخ الميلاد": p.birth_date || '---',
        "الفئة": p.category || '---',
        "اسم ولي الأمر": resolveGuardianName(p),
        "رقم هاتف الولي": resolveGuardianPhone(p),
        "حالة السداد": paymentStatus,
        "المبلغ المسدد (دج)": totalPaid
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "اللاعبين المسددين للاشتراكات");
    const fileName = `كشف_اللاعبين_المسددين_${sheetCategory !== 'all' ? sheetCategory + '_' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(blob, fileName);
  };

  const handleExportPDF = (sub: any) => {
    setPrintData(sub);
  };

  // ─── Player Payment Classification Helper ──────────────────────────────────
  const getPlayerPaymentInfo = (playerId: number) => {
    const playerSubs = subscriptions.filter(s => Number(s.player_id) === Number(playerId));
    const totalPaid = playerSubs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const latestSub = playerSubs.length > 0 
      ? [...playerSubs].sort((a, b) => Number(b.id || b.subscription_id || 0) - Number(a.id || a.subscription_id || 0))[0] 
      : null;

    // Check if player has special exempt status (حالة خاصة معفى من الدفع)
    const isExempt = playerSubs.some(s => 
      (s.plan_name && (s.plan_name.includes('معفى') || s.plan_name.includes('خاصة') || s.plan_name.includes('إعفاء') || s.plan_name.includes('منحة'))) ||
      s.status === 'معفى'
    );

    if (isExempt) {
      return {
        status: 'exempt' as const,
        statusLabel: 'حالة خاصة (معفى)',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        totalPaid: totalPaid || 0,
        remaining: 0,
        subs: playerSubs,
        latestSub
      };
    }

    if (playerSubs.length === 0 || totalPaid === 0) {
      return {
        status: 'unpaid' as const,
        statusLabel: 'لم يدفع نهائياً',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        totalPaid: 0,
        remaining: 10000,
        subs: [],
        latestSub: null
      };
    }

    const hasHalfPlan = playerSubs.some(s => 
      (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000
    );

    if (totalPaid >= 10000 && !hasHalfPlan) {
      return {
        status: 'full_first' as const,
        statusLabel: 'الدفعة الأولى كاملة',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        totalPaid,
        remaining: 0,
        subs: playerSubs,
        latestSub
      };
    }

    if (hasHalfPlan || totalPaid === 5000) {
      return {
        status: 'half_first' as const,
        statusLabel: 'نصف الدفعة الأولى',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        totalPaid,
        remaining: Math.max(0, 10000 - totalPaid),
        subs: playerSubs,
        latestSub
      };
    }

    return {
      status: 'full_first' as const,
      statusLabel: 'الدفعة الأولى كاملة',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      totalPaid,
      remaining: 0,
      subs: playerSubs,
      latestSub
    };
  };

  // ─── Computed Statistics ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    let fullCount = 0;
    let halfCount = 0;
    let exemptCount = 0;
    let unpaidCount = 0;
    let fullRevenue = 0;
    let halfRevenue = 0;

    players.forEach(p => {
      const info = getPlayerPaymentInfo(p.player_id);
      if (info.status === 'full_first') {
        fullCount++;
        fullRevenue += info.totalPaid;
      } else if (info.status === 'half_first') {
        halfCount++;
        halfRevenue += info.totalPaid;
      } else if (info.status === 'exempt') {
        exemptCount++;
      } else {
        unpaidCount++;
      }
    });

    const totalRevenue = subscriptions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return {
      totalPlayers: players.length,
      totalSubscriptions: subscriptions.length,
      fullCount,
      halfCount,
      exemptCount,
      unpaidCount,
      fullRevenue,
      halfRevenue,
      totalRevenue
    };
  }, [players, subscriptions]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = new Set<string>();
    players.forEach(p => {
      if (p.category) cats.add(p.category.trim());
    });
    return Array.from(cats).sort();
  }, [players]);

  const getPlayerName = (id: number) => {
    const player = players.find(p => p.player_id === id);
    return player?.name || "غير محدد";
  };

  const getPlayer = (id: number) => {
    return players.find(p => p.player_id === id);
  };

  // Helper: Detect if a subscription is a special exempt case
  const isSubscriptionExempt = (s: any) => {
    if (!s) return false;
    const plan = String(s.plan_name || '').toLowerCase();
    const status = String(s.status || '').toLowerCase();
    const amount = Number(s.amount);
    return plan.includes('معفى') || 
           plan.includes('خاصة') || 
           plan.includes('إعفاء') || 
           plan.includes('منحة') || 
           status === 'معفى' || 
           (amount === 0 && (plan.includes('خاصة') || plan.includes('إعفاء') || plan.includes('معفى')));
  };

  // Only paid subscriptions consume sequential receipt numbers so exempt players don't disrupt receipt sequence
  const paidSubscriptions = useMemo(() => {
    return subscriptions.filter(s => !isSubscriptionExempt(s) && Number(s.amount || 0) > 0);
  }, [subscriptions]);

  // ─── Filtered Lists ────────────────────────────────────────────────────────
  // 1. Players view filtered by plan status and category and query
  const filteredPlayersList = useMemo(() => {
    return players.filter(player => {
      const info = getPlayerPaymentInfo(player.player_id);

      // Category filter
      if (selectedCategory !== 'all' && player.category !== selectedCategory) {
        return false;
      }

      // Payment plan filter
      if (paymentFilter === 'full_first' && info.status !== 'full_first') return false;
      if (paymentFilter === 'half_first' && info.status !== 'half_first') return false;
      if (paymentFilter === 'exempt' && info.status !== 'exempt') return false;
      if (paymentFilter === 'unpaid' && info.status !== 'unpaid') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = (player.name || '').toLowerCase();
        const pPhone = String(player.phone || '');
        const pCat = (player.category || '').toLowerCase();
        const pId = String(player.player_id);
        return pName.includes(q) || pPhone.includes(q) || pCat.includes(q) || pId.includes(q);
      }

      return true;
    });
  }, [players, subscriptions, paymentFilter, selectedCategory, searchQuery]);

  // 2. Subscriptions view filtered
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const player = players.find(p => p.player_id === sub.player_id);
      const info = player ? getPlayerPaymentInfo(player.player_id) : null;

      // Category filter
      if (selectedCategory !== 'all' && player && player.category !== selectedCategory) {
        return false;
      }

      // Payment plan filter
      if (paymentFilter === 'full_first') {
        const isHalf = (sub.plan_name && sub.plan_name.includes('نصف')) || Number(sub.amount) === 5000;
        const isExempt = (sub.plan_name && (sub.plan_name.includes('معفى') || sub.plan_name.includes('خاصة') || sub.plan_name.includes('إعفاء') || sub.plan_name.includes('منحة'))) || sub.status === 'معفى';
        if (isHalf || isExempt || Number(sub.amount) < 10000) return false;
      } else if (paymentFilter === 'half_first') {
        const isHalf = (sub.plan_name && sub.plan_name.includes('نصف')) || Number(sub.amount) === 5000;
        if (!isHalf) return false;
      } else if (paymentFilter === 'exempt') {
        const isExempt = (sub.plan_name && (sub.plan_name.includes('معفى') || sub.plan_name.includes('خاصة') || sub.plan_name.includes('إعفاء') || sub.plan_name.includes('منحة'))) || sub.status === 'معفى';
        if (!isExempt) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const playerName = player ? player.name.toLowerCase() : "غير محدد";
        return playerName.includes(q) || String(sub.player_id).includes(q) || String(sub.plan_name || '').toLowerCase().includes(q);
      }

      return true;
    });
  }, [subscriptions, players, paymentFilter, selectedCategory, searchQuery]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleOpenAddForPlayer = (player: any, presetType: 'full' | 'half' | 'second_half' | 'exempt' = 'full') => {
    setEditingSubscription(null);
    setSelectedPlayerId(player.player_id);

    let chosenPlan: any = null;
    let chosenAmount = 10000;

    if (presetType === 'half') {
      chosenPlan = plans.find(p => p.name.includes('نصف') || Number(p.price) === 5000) || { name: 'دفعة أولى نصفها', price: 5000 };
      chosenAmount = 5000;
    } else if (presetType === 'second_half') {
      chosenPlan = plans.find(p => p.name.includes('ثانية') || Number(p.price) === 5000) || { name: 'دفعة ثانية (تكملة)', price: 5000 };
      chosenAmount = 5000;
    } else if (presetType === 'exempt') {
      chosenPlan = plans.find(p => p.name.includes('معفى') || p.name.includes('خاصة') || Number(p.price) === 0) || { name: 'حالة خاصة (معفى من الاشتراك)', price: 0 };
      chosenAmount = 0;
    } else {
      chosenPlan = plans.find(p => (p.name.includes('دفعة أولى') && !p.name.includes('نصف')) || Number(p.price) === 10000) || plans[0] || { name: 'دفعة أولى', price: 10000 };
      chosenAmount = 10000;
    }

    setSelectedPlan(chosenPlan);
    setIsModalOpen(true);
  };

  const handleAddSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const playerId = Number(formData.get("player_id"));
    if (!playerId) { alert("يرجى اختيار لاعب"); return; }

    const subData = {
      player_id: playerId,
      plan_name: formData.get("plan_name") as string,
      amount: Number(formData.get("amount")),
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      status: editingSubscription ? editingSubscription.status : "نشط",
    };

    if (!editingSubscription) {
      const existingInfo = getPlayerPaymentInfo(playerId);
      const isSecondHalfPlan = subData.plan_name?.includes('ثانية') || subData.plan_name?.includes('تكملة');

      // Prevent adding a new subscription for a player that already paid full or is exempt
      if (existingInfo.status === 'full_first') {
        alert(`تنبيه: اللاعب "${getPlayerName(playerId)}" مسجل بالفعل كمشترك ومسدد لاشتراكه بالكامل.\nلا يمكن إعادة تسجيل نفس المشترك مرتين.`);
        return;
      }
      if (existingInfo.status === 'exempt') {
        alert(`تنبيه: اللاعب "${getPlayerName(playerId)}" مسجل بالفعل كـ "حالة خاصة (معفى من الاشتراك)" ومستوفٍ لكافة الصلاحيات.`);
        return;
      }

      // Check for exact duplicate active subscription
      const hasDuplicateActive = subscriptions.some(s => 
        Number(s.player_id) === playerId && 
        s.status === 'نشط' && 
        s.plan_name === subData.plan_name &&
        s.start_date === subData.start_date
      );
      if (hasDuplicateActive) {
        alert(`تنبيه: يوجد اشتراك نشط مسجل مسبقاً بنفس التفاصيل لهذا اللاعب.\nلا يمكن تكرار تسجيل نفس الاشتراك مرتين.`);
        return;
      }
    }

    try {
      if (editingSubscription) {
        await api.updateSubscription(editingSubscription.subscription_id, subData);
      } else {
        await api.addSubscription(subData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingSubscription(null);
      setSelectedPlan(null);
      setSelectedPlayerId(null);
    } catch (error) {
      console.error("Failed to save subscription:", error);
      alert("حدث خطأ أثناء حفظ الاشتراك.");
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    setSubToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (subToDelete) {
      try {
        await api.deleteSubscription(subToDelete);
        await loadData();
      } catch (error) {
        console.error("Failed to delete subscription:", error);
      } finally {
        setSubToDelete(null);
        setIsConfirmOpen(false);
      }
    }
  };

  const handleEditSubscription = (sub: any) => {
    setEditingSubscription(sub);
    setSelectedPlayerId(sub.player_id);
    setIsModalOpen(true);
  };

  // ─── Individual WhatsApp Reminder ──────────────────────────────────────────
  const handleSendSingleWhatsApp = (player: any, type: 'unpaid' | 'half_first') => {
    const phone = player.phone || player.guardian_phone;
    if (!phone) {
      alert(`اللاعب ${player.name} لا يملك رقم هاتف مسجل في قاعدة البيانات.`);
      return;
    }

    const academyName = academySettings?.name || 'أكاديمية كرة القدم';
    let message = '';

    if (type === 'unpaid') {
      message = `السلام عليكم ورحمة الله،\nسيد(ة) ولي أمر اللاعب: *${player.name}* (${player.category || ''})\n\nتحية طيبة من إدارة *${academyName}*.\nنود تذكيركم بلطف بضرورة تسوية اشتراك اللاعب وتسديد *الدفعة الأولى* (10,000 دج) لضمان استمرارية برنامج التدريب وحجز مكان اللاعب.\n\nشاكرين لكم حسن تعاونكم.`;
    } else {
      message = `السلام عليكم ورحمة الله،\nسيد(ة) ولي أمر اللاعب: *${player.name}* (${player.category || ''})\n\nتحية طيبة من إدارة *${academyName}*.\nنحيطكم علماً بأنكم قمتم بتسديد *نصف الدفعة الأولى (5,000 دج)*، والمبلغ المتبقي لتسوية الدفعة الأولى هو: *5,000 دج*.\nيرجى تسويته لدى إدارة الأكاديمية في أقرب وقت.\n\nشكراً لتفهمكم وتعاونكم الدائم.`;
    }

    const encoded = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\D/g, '');
    const internationalPhone = cleanPhone.startsWith('0') ? `213${cleanPhone.slice(1)}` : cleanPhone;
    window.open(`https://wa.me/${internationalPhone}?text=${encoded}`, '_blank');
  };

  // ─── Batch WhatsApp Reminders ──────────────────────────────────────────────
  const handleExecuteBatchReminders = (target: 'unpaid' | 'half_first' | 'expired') => {
    let targetList: any[] = [];
    let msgTemplate: (p: any) => string = () => '';
    const academyName = academySettings?.name || 'أكاديمية كرة القدم';

    if (target === 'unpaid') {
      targetList = players.filter(p => getPlayerPaymentInfo(p.player_id).status === 'unpaid' && (p.phone || p.guardian_phone));
      msgTemplate = (p: any) => `السلام عليكم، ولي أمر اللاعب *${p.name}*، نذكركم بلطف بتسوية *الدفعة الأولى* في *${academyName}*. شكراً لكم.`;
    } else if (target === 'half_first') {
      targetList = players.filter(p => getPlayerPaymentInfo(p.player_id).status === 'half_first' && (p.phone || p.guardian_phone));
      msgTemplate = (p: any) => `السلام عليكم، ولي أمر اللاعب *${p.name}*، نذكركم بتسوية النصف الثاني المتبقي (5,000 دج) في *${academyName}*. شكراً لكم.`;
    } else {
      targetList = subscriptions.filter(s => s.status === 'منتهي' || s.status === 'معلق')
        .map(s => players.find(p => p.player_id === s.player_id))
        .filter(p => p && (p.phone || p.guardian_phone));
      msgTemplate = (p: any) => `السلام عليكم، ولي أمر اللاعب *${p.name}*، نذكركم بتجديد اشتراك اللاعب في *${academyName}*. شكراً لكم.`;
    }

    if (targetList.length === 0) {
      alert("لا يوجد أرقام هواتف مسجلة للفئة المحددة لإرسال التنبيهات.");
      return;
    }

    if (confirm(`سيتم فتح محادثات واتساب لـ ${targetList.length} لاعب مسجلين بأرقام هواتف. هل تود الاستمرار؟`)) {
      targetList.forEach((player, idx) => {
        const phone = player.phone || player.guardian_phone;
        const cleanPhone = phone.replace(/\D/g, '');
        const internationalPhone = cleanPhone.startsWith('0') ? `213${cleanPhone.slice(1)}` : cleanPhone;
        const msg = encodeURIComponent(msgTemplate(player));
        setTimeout(() => {
          window.open(`https://wa.me/${internationalPhone}?text=${msg}`, '_blank');
        }, idx * 1200);
      });
      setIsReminderModalOpen(false);
    }
  };

  // ─── Inline Form ───────────────────────────────────────────────────────────
  if (isModalOpen) {
    return (
      <Card className="bg-zinc-900/60 border-zinc-800 animate-in fade-in zoom-in duration-300 shadow-2xl">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-zinc-800/80 pb-4">
          <Button variant="ghost" size="icon" onClick={() => { setIsModalOpen(false); setEditingSubscription(null); setSelectedPlayerId(null); }} className="text-zinc-400 hover:text-white shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-zinc-50 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              {editingSubscription ? "تعديل بيانات الاشتراك" : "تسجيل اشتراك / دفعة جديدة"}
            </CardTitle>
            <p className="text-zinc-400 text-xs mt-1">اختر الخطة ومبلغ الدفعة، وسيتم إصدار وصل السداد الرسمي تلقائياً.</p>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Quick Installment Buttons */}
          {!editingSubscription && (
            <div className="mb-6 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
              <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                تحديد سريع لنوع الدفعة:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = plans.find(x => x.name.includes('دفعة أولى') && !x.name.includes('نصف')) || { name: 'دفعة أولى  ', price: 10000 };
                    setSelectedPlan(p);
                    const el = document.querySelector('input[name="amount"]') as HTMLInputElement;
                    if (el) el.value = "10000";
                    const pSelect = document.querySelector('select[name="plan_name"]') as HTMLSelectElement;
                    if (pSelect) pSelect.value = p.name;
                  }}
                  className="p-2.5 rounded-xl text-right border transition-all text-xs font-bold bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                >
                  <div>الدفعة الأولى كاملة</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">10,000 د.ج</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = plans.find(x => x.name.includes('نصف')) || { name: 'دفعة أولى نصفها ', price: 5000 };
                    setSelectedPlan(p);
                    const el = document.querySelector('input[name="amount"]') as HTMLInputElement;
                    if (el) el.value = "5000";
                    const pSelect = document.querySelector('select[name="plan_name"]') as HTMLSelectElement;
                    if (pSelect) pSelect.value = p.name;
                  }}
                  className="p-2.5 rounded-xl text-right border transition-all text-xs font-bold bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                >
                  <div>نصف الدفعة الأولى</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">5,000 د.ج</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = plans.find(x => x.name.includes('ثانية')) || { name: 'دفعة ثانية ', price: 5000 };
                    setSelectedPlan(p);
                    const el = document.querySelector('input[name="amount"]') as HTMLInputElement;
                    if (el) el.value = "5000";
                    const pSelect = document.querySelector('select[name="plan_name"]') as HTMLSelectElement;
                    if (pSelect) pSelect.value = p.name;
                  }}
                  className="p-2.5 rounded-xl text-right border transition-all text-xs font-bold bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                >
                  <div>الدفعة الثانية (تكملة)</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">5,000 د.ج</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = plans.find(x => x.name.includes('سنوي')) || { name: 'سنوي ', price: 15000 };
                    setSelectedPlan(p);
                    const el = document.querySelector('input[name="amount"]') as HTMLInputElement;
                    if (el) el.value = "15000";
                    const pSelect = document.querySelector('select[name="plan_name"]') as HTMLSelectElement;
                    if (pSelect) pSelect.value = p.name;
                  }}
                  className="p-2.5 rounded-xl text-right border transition-all text-xs font-bold bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
                >
                  <div>اشتراك سنوي كامل</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">15,000 د.ج</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = plans.find(x => x.name.includes('معفى') || x.name.includes('خاصة') || Number(x.price) === 0) || { name: 'حالة خاصة (معفى من الاشتراك)', price: 0 };
                    setSelectedPlan(p);
                    const el = document.querySelector('input[name="amount"]') as HTMLInputElement;
                    if (el) el.value = "0";
                    const pSelect = document.querySelector('select[name="plan_name"]') as HTMLSelectElement;
                    if (pSelect) pSelect.value = p.name;
                  }}
                  className="p-2.5 rounded-xl text-right border transition-all text-xs font-bold bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 col-span-2 sm:col-span-1"
                >
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-purple-400 shrink-0" />
                    <span>حالة خاصة (معفى)</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">0 د.ج (كامل الصلاحيات)</div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleAddSubscription} className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-400" /> اللاعب *
              </label>
              <PlayerSearchSelect
                players={players}
                value={selectedPlayerId}
                onChange={(id) => setSelectedPlayerId(id || null)}
                getPlayerPaymentInfo={getPlayerPaymentInfo}
              />
              {selectedPlayerId && !editingSubscription && (() => {
                const info = getPlayerPaymentInfo(selectedPlayerId);
                if (info.status === 'full_first') {
                  return (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                      <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold text-rose-200">تنبيه: اللاعب مسجل كمشترك مسبقاً ومسدد لاشتراكه بالكامل!</strong>
                        <span>تم تسديد مبلغ ({info.totalPaid.toLocaleString('fr-FR')} د.ج) مسبقاً. لا يمكن إضافة نفس المشترك مرتين لتفادي التكرار.</span>
                      </div>
                    </div>
                  );
                } else if (info.status === 'half_first') {
                  return (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300">
                      <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold text-amber-200">اللاعب مسجل مسبقاً ومسدد لنصف الدفعة (5,000 د.ج)</strong>
                        <span>المبلغ المتبقي هو 5,000 د.ج. يرجى اختيار خطة "دفعة ثانية (تكملة)" لتسجيل النصف الثاني.</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">خطة الدفعة / الاشتراك *</label>
              <select
                required
                name="plan_name"
                defaultValue={editingSubscription?.plan_name || selectedPlan?.name || "دفعة أولى  "}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
                onChange={(e) => {
                  const plan = plans.find(p => p.name === e.target.value);
                  if (plan) {
                    setSelectedPlan(plan);
                    if (!editingSubscription) {
                      const amountInput = document.querySelector('input[name="amount"]') as HTMLInputElement;
                      if (amountInput) amountInput.value = (plan.price || plan.amount || 10000).toString();
                    }
                  }
                }}
              >
                <option value="">اختر خطة</option>
                <option value="حالة خاصة (معفى من الاشتراك)">حالة خاصة (معفى من الاشتراك) (0 د.ج)</option>
                {plans.map(p => (
                  <option key={p.plan_id} value={p.name}>
                    {p.name} ({p.price || p.amount} د.ج)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">المبلغ المدفوع (د.ج) *</label>
              <input
                required
                name="amount"
                defaultValue={editingSubscription?.amount ?? selectedPlan?.price ?? 10000}
                type="number"
                min="0"
                step="any"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none font-mono font-bold"
                placeholder="مثال: 10000 أو 0 للمعفى"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">الحالة</label>
              <select
                name="status"
                defaultValue={editingSubscription?.status || "نشط"}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
              >
                <option value="نشط">نشط</option>
                <option value="منتهي">منتهي</option>
                <option value="معلق">معلق</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">تاريخ بدء الاشتراك</label>
              <input
                required
                name="start_date"
                defaultValue={editingSubscription?.start_date || new Date().toISOString().split('T')[0]}
                type="date"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">تاريخ نهاية الصلاحية</label>
              <input
                required
                name="end_date"
                defaultValue={editingSubscription?.end_date || "2026-06-30"}
                type="date"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 sm:col-span-2 border-t border-zinc-800/50">
              <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingSubscription(null); setSelectedPlayerId(null); }} className="border-zinc-800 text-zinc-300 w-full sm:w-auto h-12 rounded-xl">
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={!editingSubscription && !!selectedPlayerId && getPlayerPaymentInfo(selectedPlayerId).status === 'full_first'}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-full sm:w-auto h-12 rounded-xl font-bold"
              >
                {editingSubscription ? "تحديث البيانات" : "تسجيل الدفعة وحفظ الاشتراك"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Determine which list to render:
  // If paymentFilter === 'unpaid' or 'all_players', we render from filteredPlayersList.
  // Otherwise, we render from filteredSubscriptions.
  const isPlayerTableMode = paymentFilter === 'unpaid' || paymentFilter === 'exempt' || paymentFilter === 'all_players';

  return (
    <div className="space-y-6 pb-20 font-tajawal" dir="rtl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-50">
              الاشتراكات والمدفوعات
            </h2>
          </div>
          <p className="text-zinc-400 mt-1.5 text-sm">
            إدارة دفعات المشتركين ومتابعة مسددي الدفعة الأولى كاملة أو نصفها والمتأخرين عن السداد.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Button
            onClick={() => handleOpenPaidSheetModal("all_paid")}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-700/25 border border-emerald-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            <span>كشف المسددين A4 (40 لاعب)</span>
          </Button>

          <Button
            onClick={() => navigate('/admin/coach-payroll')}
            variant="outline"
            className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10 h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm"
          >
            <Users className="h-4 w-4" />
            مستحقات وتقارير حضور المدربين
          </Button>

          <Button
            onClick={() => setIsReminderModalOpen(true)}
            variant="outline"
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            تنبيهات واتساب
          </Button>

          <Button
            onClick={() => { setEditingSubscription(null); setSelectedPlayerId(null); setSelectedPlan(null); setIsModalOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white h-11 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            تسجيل دفعة / اشتراك جديد
          </Button>
        </div>
      </div>

      {/* ── Interactive KPI Cards (Quick Filters) ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: الدفعة الأولى كاملة */}
        <Card 
          onClick={() => setPaymentFilter(paymentFilter === 'full_first' ? 'all' : 'full_first')}
          className={`cursor-pointer transition-all duration-300 relative overflow-hidden group border ${
            paymentFilter === 'full_first'
              ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10 scale-[1.02]'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4 sm:p-5">
            <span className="text-xs font-bold text-zinc-400">الدفعة الأولى كاملة</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.fullCount}</span>
              <span className="text-xs text-zinc-400 font-semibold">لاعب مسدد</span>
            </div>
            <div className="mt-2 text-xs font-bold text-emerald-400 font-mono">
              {stats.fullRevenue.toLocaleString('fr-FR')} د.ج
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
              <span>(10,000 د.ج للوصل)</span>
              <span className="text-emerald-400 font-bold group-hover:underline">انقر للتصفية ←</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: نصف الدفعة الأولى */}
        <Card 
          onClick={() => setPaymentFilter(paymentFilter === 'half_first' ? 'all' : 'half_first')}
          className={`cursor-pointer transition-all duration-300 relative overflow-hidden group border ${
            paymentFilter === 'half_first'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10 scale-[1.02]'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4 sm:p-5">
            <span className="text-xs font-bold text-zinc-400">نصف الدفعة الأولى</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.halfCount}</span>
              <span className="text-xs text-zinc-400 font-semibold">لاعبين (مسدد 50%)</span>
            </div>
            <div className="mt-2 text-xs font-bold text-amber-400 font-mono">
              {stats.halfRevenue.toLocaleString('fr-FR')} د.ج محصلة
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
              <span>متبقي: {(stats.halfCount * 5000).toLocaleString('fr-FR')} د.ج</span>
              <span className="text-amber-400 font-bold group-hover:underline">انقر للتصفية ←</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: حالات خاصة (معفى من الاشتراك) */}
        <Card 
          onClick={() => setPaymentFilter(paymentFilter === 'exempt' ? 'all' : 'exempt')}
          className={`cursor-pointer transition-all duration-300 relative overflow-hidden group border ${
            paymentFilter === 'exempt'
              ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10 scale-[1.02]'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4 sm:p-5">
            <span className="text-xs font-bold text-zinc-400">حالات خاصة (معفى)</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">{stats.exemptCount}</span>
              <span className="text-xs text-zinc-400 font-semibold">لاعب معفى</span>
            </div>
            <div className="mt-2 text-xs font-bold text-purple-300/90 font-mono">
              كامل الصلاحيات (معفى 100%)
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
              <span>0 د.ج مطلوب</span>
              <span className="text-purple-400 font-bold group-hover:underline">انقر للتصفية ←</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: لم يدفع نهائياً */}
        <Card 
          onClick={() => setPaymentFilter(paymentFilter === 'unpaid' ? 'all' : 'unpaid')}
          className={`cursor-pointer transition-all duration-300 relative overflow-hidden group border ${
            paymentFilter === 'unpaid'
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/10 scale-[1.02]'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-rose-500/50 hover:bg-zinc-900'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4 sm:p-5">
            <span className="text-xs font-bold text-zinc-400">لم يدفع نهائياً</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">{stats.unpaidCount}</span>
              <span className="text-xs text-zinc-400 font-semibold">لاعب غير مسدد</span>
            </div>
            <div className="mt-2 text-xs font-bold text-rose-400/90 font-mono">
              متأخرون عن السداد
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
              <span>غير مسجلين في الوصولات</span>
              <span className="text-rose-400 font-bold group-hover:underline">انقر للتصفية ←</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: إجمالي المداخيل المحصلة */}
        <Card 
          onClick={() => setPaymentFilter('all')}
          className={`cursor-pointer transition-all duration-300 relative overflow-hidden group border ${
            paymentFilter === 'all'
              ? 'bg-zinc-900 border-zinc-700 ring-1 ring-zinc-700 shadow-lg scale-[1.02]'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4 sm:p-5">
            <span className="text-xs font-bold text-zinc-400">إجمالي المداخيل</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.totalRevenue.toLocaleString('fr-FR')}</span>
              <span className="text-xs text-zinc-400 font-bold">د.ج</span>
            </div>
            <div className="mt-2 text-xs font-bold text-blue-400 font-mono">
              {stats.totalSubscriptions} اشتراك مسجل
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
              <span>من أصل {stats.totalPlayers} لاعب</span>
              <span className="text-zinc-400 font-bold group-hover:underline">عرض الكل ←</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter Controls & Search Bar ─────────────────────────────────── */}
      <div className="bg-zinc-900/60 p-4 sm:p-5 rounded-3xl border border-zinc-800/80 space-y-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 ml-1 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-emerald-500" />
            تصفية الخطة:
          </span>

          <button
            onClick={() => setPaymentFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              paymentFilter === 'all'
                ? 'bg-zinc-100 text-zinc-950 shadow-md font-black'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white'
            }`}
          >
            <span>جميع الاشتراكات</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
              {stats.totalSubscriptions}
            </span>
          </button>

          <button
            onClick={() => setPaymentFilter('full_first')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              paymentFilter === 'full_first'
                ? 'bg-emerald-500 text-black shadow-md font-black'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>الدفعة الأولى كاملة</span>
            <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${paymentFilter === 'full_first' ? 'bg-black/20 text-black font-black' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {stats.fullCount}
            </span>
          </button>

          <button
            onClick={() => setPaymentFilter('half_first')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              paymentFilter === 'half_first'
                ? 'bg-amber-500 text-black shadow-md font-black'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-amber-500/50 hover:text-amber-400'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>نصف الدفعة الأولى</span>
            <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${paymentFilter === 'half_first' ? 'bg-black/20 text-black font-black' : 'bg-amber-500/10 text-amber-400'}`}>
              {stats.halfCount}
            </span>
          </button>

          <button
            onClick={() => setPaymentFilter('exempt')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              paymentFilter === 'exempt'
                ? 'bg-purple-600 text-white shadow-md font-black'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-purple-500/50 hover:text-purple-400'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>حالات خاصة (معفى)</span>
            <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${paymentFilter === 'exempt' ? 'bg-black/20 text-white font-black' : 'bg-purple-500/10 text-purple-400'}`}>
              {stats.exemptCount}
            </span>
          </button>

          <button
            onClick={() => setPaymentFilter('unpaid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              paymentFilter === 'unpaid'
                ? 'bg-rose-500 text-white shadow-md font-black'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-rose-500/50 hover:text-rose-400'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>لم يدفعوا نهائياً</span>
            <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${paymentFilter === 'unpaid' ? 'bg-black/20 text-white font-black' : 'bg-rose-500/10 text-rose-400'}`}>
              {stats.unpaidCount}
            </span>
          </button>

          <button
            onClick={() => setPaymentFilter('all_players')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              paymentFilter === 'all_players'
                ? 'bg-blue-600 text-white shadow-md font-black'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-blue-500/50 hover:text-blue-400'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>سجل جميع اللاعبين</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
              {stats.totalPlayers}
            </span>
          </button>

          {(paymentFilter !== 'all' || selectedCategory !== 'all' || searchQuery) && (
            <button
              onClick={() => { setPaymentFilter('all'); setSelectedCategory('all'); setSearchQuery(''); }}
              className="mr-auto text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              إلغاء التصفية
            </button>
          )}
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-zinc-800/80">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder={isPlayerTableMode ? "بحث عن لاعب باسمه، هاتفه، فئته أو رقمه..." : "بحث في الاشتراكات..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 pr-10 pl-4 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="sm:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">كل الفئات (الجميع)</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>فئة: {cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Banner */}
        {paymentFilter !== 'all' && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-300">التصفية النشطة:</span>
              <span className={`px-2.5 py-0.5 rounded-lg font-bold ${
                paymentFilter === 'full_first' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                paymentFilter === 'half_first' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                paymentFilter === 'exempt' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                paymentFilter === 'unpaid' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {paymentFilter === 'full_first' ? 'الدفعة الأولى كاملة (10,000 د.ج)' :
                 paymentFilter === 'half_first' ? 'مسددو نصف الدفعة الأولى (5,000 د.ج)' :
                 paymentFilter === 'exempt' ? 'حالات خاصة (معفى من الاشتراك - كامل الصلاحيات)' :
                 paymentFilter === 'unpaid' ? 'اللاعبون المتأخرون (لم يدفعوا نهائياً)' :
                 'سجل جميع لاعبي الأكاديمية'}
              </span>
              {selectedCategory !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 font-bold">
                  فئة: {selectedCategory}
                </span>
              )}
            </div>

            <div className="text-zinc-400 font-mono">
              النتائج المعروضة: <strong className="text-white font-bold">{isPlayerTableMode ? filteredPlayersList.length : filteredSubscriptions.length}</strong>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Data Table ──────────────────────────────────────────────── */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 overflow-hidden rounded-3xl shadow-2xl">
        <CardContent className="p-0">
          {/* MODE 1: Players Ledger (Unpaid / Full / Half / All Players) */}
          {isPlayerTableMode ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-zinc-400 bg-zinc-950/80 border-b border-zinc-800/80">
                  <tr>
                    <th className="px-6 py-4 font-bold text-center w-12">#</th>
                    <th className="px-6 py-4 font-bold">اللاعب</th>
                    <th className="px-6 py-4 font-bold">الفئة</th>
                    <th className="px-6 py-4 font-bold">رقم الهاتف</th>
                    <th className="px-6 py-4 font-bold">حالة الدفعة الأولى</th>
                    <th className="px-6 py-4 font-bold">المبلغ المسدد</th>
                    <th className="px-6 py-4 font-bold">المتبقي</th>
                    <th className="px-6 py-4 font-bold text-left">إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {isLoading ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-500 font-bold">جاري تحميل البيانات...</td></tr>
                  ) : filteredPlayersList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                        لا يوجد لاعبون مطابقون لشروط التصفية الحالية
                      </td>
                    </tr>
                  ) : (
                    filteredPlayersList.map((player, idx) => {
                      const info = getPlayerPaymentInfo(player.player_id);
                      return (
                        <tr key={player.player_id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4 text-center font-mono font-bold text-zinc-500">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 shrink-0 border border-zinc-700">
                                {player.name?.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-zinc-50">{player.name}</div>
                                <div className="text-[11px] text-zinc-500 font-mono">#{player.player_id} {player.father_name ? `• ابن ${player.father_name}` : ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-300 font-bold">
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                              {player.category || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-zinc-300">
                            {player.phone ? (
                              <a href={`tel:${player.phone}`} className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-zinc-500" />
                                {player.phone}
                              </a>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${info.badgeColor}`}>
                              {info.status === 'full_first' && <CheckCircle2 className="h-3.5 w-3.5" />}
                              {info.status === 'half_first' && <AlertCircle className="h-3.5 w-3.5" />}
                              {info.status === 'exempt' && <Sparkles className="h-3.5 w-3.5" />}
                              {info.status === 'unpaid' && <XCircle className="h-3.5 w-3.5" />}
                              {info.statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-black text-zinc-50">
                            {info.status === 'exempt' ? (
                              <span className="text-purple-400">0 د.ج</span>
                            ) : info.totalPaid > 0 ? (
                              <span className="text-emerald-400">{info.totalPaid.toLocaleString('fr-FR')} د.ج</span>
                            ) : (
                              <span className="text-zinc-600">0 د.ج</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold">
                            {info.status === 'exempt' ? (
                              <span className="text-purple-400 text-xs font-bold">0 د.ج (معفى معتمد)</span>
                            ) : info.remaining > 0 ? (
                              <span className="text-rose-400">{info.remaining.toLocaleString('fr-FR')} د.ج</span>
                            ) : (
                              <span className="text-emerald-500 text-xs font-bold">مسدد بالكامل</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="flex items-center justify-end gap-2">
                              {info.status === 'unpaid' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenAddForPlayer(player, 'full')}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3 rounded-lg"
                                  >
                                    تسجيل الدفعة
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenAddForPlayer(player, 'exempt')}
                                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-bold text-xs h-8 px-2.5 rounded-lg flex items-center gap-1"
                                    title="تسجيل كحالة خاصة (إعفاء معتمد بكامل الصلاحيات)"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>إعفاء</span>
                                  </Button>
                                  {(player.phone || player.guardian_phone) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSendSingleWhatsApp(player, 'unpaid')}
                                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-8 px-2 rounded-lg"
                                      title="إرسال تنبيه واتساب للولي"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </>
                              )}

                              {info.status === 'half_first' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenAddForPlayer(player, 'second_half')}
                                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-8 px-3 rounded-lg"
                                  >
                                    تكملة النصف (5,000)
                                  </Button>
                                  {info.latestSub && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleExportPDF(info.latestSub)}
                                      className="text-zinc-400 hover:text-blue-400 h-8 px-2"
                                      title="وصل الدفعة"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {(player.phone || player.guardian_phone) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSendSingleWhatsApp(player, 'half_first')}
                                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-8 px-2 rounded-lg"
                                      title="تنبيه واتساب لتكملة النصف"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </>
                              )}

                              {info.status === 'exempt' && (
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-purple-400" />
                                    <span>كامل الصلاحيات</span>
                                  </span>
                                  {info.latestSub && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleExportPDF(info.latestSub)}
                                      className="text-zinc-400 hover:text-purple-400 h-8 px-2 rounded-lg"
                                      title="وصل الإعفاء المعتمد"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}

                              {info.status === 'full_first' && info.latestSub && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleExportPDF(info.latestSub)}
                                  className="text-zinc-400 hover:text-blue-400 h-8 px-2.5 rounded-lg flex items-center gap-1.5"
                                >
                                  <Printer className="h-4 w-4" />
                                  <span>وصل السداد</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* MODE 2: Subscriptions Table (All / Full First / Half First) */
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-zinc-400 bg-zinc-950/80 border-b border-zinc-800/80">
                  <tr>
                    <th className="px-6 py-4 font-bold text-center w-12">#</th>
                    <th className="px-6 py-4 font-bold">اللاعب</th>
                    <th className="px-6 py-4 font-bold">نوع الدفعة / الخطة</th>
                    <th className="px-6 py-4 font-bold">المبلغ المسدد</th>
                    <th className="px-6 py-4 font-bold">تاريخ البدء</th>
                    <th className="px-6 py-4 font-bold">تاريخ الانتهاء</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {isLoading ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-500 font-bold">جاري تحميل الاشتراكات...</td></tr>
                  ) : filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                        لا يوجد اشتراكات مطابقة للتصفية المحددة
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub, idx) => {
                      const player = getPlayer(sub.player_id);
                      const isExempt = isSubscriptionExempt(sub);
                      const isHalf = !isExempt && ((sub.plan_name && sub.plan_name.includes('نصف')) || Number(sub.amount) === 5000);
                      const paidReceiptIndex = paidSubscriptions.findIndex(s => (s.subscription_id || s.id) === (sub.subscription_id || sub.id));
                      const receiptSeqNum = paidReceiptIndex !== -1 ? paidReceiptIndex + 1 : null;
                      return (
                        <tr key={sub.subscription_id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4 text-center font-mono font-bold" title={isExempt ? "حالة خاصة (معفى من الاشتراك) - لا يسجل له رقم وصل مالي للحفاظ على تسلسل وصولات الدفع" : `وصل مسجل رقم #${receiptSeqNum}`}>
                            {isExempt ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap">
                                معفى (بدون وصل)
                              </span>
                            ) : (
                              <span className="text-zinc-300">
                                #{receiptSeqNum}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-zinc-50">{getPlayerName(sub.player_id)}</div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              {player?.category || '—'} • #{sub.player_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              isExempt ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              isHalf ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {isExempt && <Sparkles className="h-3 w-3" />}
                              {sub.plan_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono font-black text-zinc-50">
                            <span className={isExempt ? 'text-purple-400 font-bold' : isHalf ? 'text-amber-400' : 'text-emerald-400'}>
                              {isExempt ? '0 د.ج (معفى)' : `${Number(sub.amount || 0).toLocaleString('fr-FR')} د.ج`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-mono">{sub.start_date || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-mono">{sub.end_date || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isExempt || sub.status === 'معفى' ? 'bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/20' :
                              sub.status === 'نشط' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20' :
                              sub.status === 'منتهي' ? 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20'
                            }`}>
                              {isExempt ? 'معفى (كامل الصلاحيات)' : sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {isHalf && player && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenAddForPlayer(player, 'second_half')}
                                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg"
                                  title="تسجيل النصف الثاني"
                                >
                                  تكملة 5,000
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportPDF(sub)}
                                className="text-zinc-400 hover:text-blue-400"
                                title="تصدير وصل PDF"
                                disabled={isExporting}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSubscription(sub)}
                                className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                              >
                                تعديل
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubscription(sub.subscription_id)}
                                className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                              >
                                حذف
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
          )}
        </CardContent>
      </Card>

      {/* ── WhatsApp Reminders Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="إرسال تنبيهات واتساب للمشتركين"
      >
        <div className="space-y-4 pt-2 font-tajawal text-right" dir="rtl">
          <p className="text-zinc-400 text-sm">
            اختر الفئة التي تود مراسلتها عبر تطبيق واتساب لتذكيرهم بتسوية وضعيتهم المالية:
          </p>

          <div className="space-y-3">
            {/* Option 1: المتأخرون نهائياً */}
            <div 
              onClick={() => handleExecuteBatchReminders('unpaid')}
              className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-bold text-white group-hover:text-rose-400 transition-colors">
                    تنبيه المتأخرين عن دفع الدفعة الأولى
                  </div>
                  <div className="text-xs text-zinc-500">
                    {stats.unpaidCount} لاعب لم يسددوا الدفعة الأولى نهائياً
                  </div>
                </div>
              </div>
              <Send className="h-4 w-4 text-zinc-500 group-hover:text-rose-400 transition-colors" />
            </div>

            {/* Option 2: مسددو نصف الدفعة */}
            <div 
              onClick={() => handleExecuteBatchReminders('half_first')}
              className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                    تنبيه مسددي نصف الدفعة الأولى
                  </div>
                  <div className="text-xs text-zinc-500">
                    {stats.halfCount} لاعبين لتكملة النصف الثاني المتبقي (5,000 د.ج)
                  </div>
                </div>
              </div>
              <Send className="h-4 w-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
            </div>

            {/* Option 3: الاشتراكات المنتهية */}
            <div 
              onClick={() => handleExecuteBatchReminders('expired')}
              className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <RefreshCw className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                    تنبيه الاشتراكات المنتهية لتجديدها
                  </div>
                  <div className="text-xs text-zinc-500">
                    تذكير أصحاب الاشتراكات المنتهية أو المعلقة
                  </div>
                </div>
              </div>
              <Send className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </div>
          </div>

          <div className="pt-2 text-left">
            <Button variant="ghost" onClick={() => setIsReminderModalOpen(false)} className="text-zinc-400">
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Paid Subscribers A4 Sheet Print Portal (40 Players Per Page) ── */}
      {isPaidSheetOpen && (
        <PrintPortal
          isOpen={isPaidSheetOpen}
          onClose={() => setIsPaidSheetOpen(false)}
          title="كشف اللاعبين المسددين للاشتراكات (A4 - 40 لاعب بالورقة مرتبين حسب السن)"
          fileName={`كشف_المسددين_${sheetCategory === 'all' ? 'جميع_الفئات' : sheetCategory}_${new Date().toISOString().split('T')[0]}`}
          id="paid-subscribers-sheet-portal"
        >
          {/* Top Filter Controls inside modal (Hidden during printing) */}
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 no-print" dir="rtl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-400 px-2 font-bold">نوع السداد:</span>
                <button
                  type="button"
                  onClick={() => setSheetPaymentType('all_paid')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    sheetPaymentType === 'all_paid'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  جميع المسددين
                </button>
                <button
                  type="button"
                  onClick={() => setSheetPaymentType('full')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    sheetPaymentType === 'full'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  دفعة كاملة (10,000 دج)
                </button>
                <button
                  type="button"
                  onClick={() => setSheetPaymentType('half')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    sheetPaymentType === 'half'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  نصف دفعة (5,000 دج)
                </button>
              </div>

              <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-400 font-bold">الفئة:</span>
                <select
                  value={sheetCategory}
                  onChange={(e) => setSheetCategory(e.target.value)}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900 text-white">جميع الفئات</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-zinc-900 text-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportPaidPlayersExcel}
              className="flex items-center gap-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="تصدير كشف إكسل بنفس البيانات والترتيب"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تصدير ملف Excel</span>
            </button>
          </div>

          <PaidSubscribersA4SheetTemplate
            players={players}
            subscriptions={subscriptions}
            parents={parents}
            academySettings={academySettings}
            categoryFilter={sheetCategory}
            paymentTypeFilter={sheetPaymentType}
            containerId="paid-subscribers-sheet-portal-content"
          />
        </PrintPortal>
      )}

      {/* ── Export Receipt Portal ─────────────────────────────────────────── */}
      {printData && (
        <PrintPortal
          onClose={() => setPrintData(null)}
          title={`وصل اشتراك - ${getPlayerName(printData.player_id)}`}
          fileName={`Receipt-${getPlayerName(printData.player_id)}-${printData.start_date}`}
          id="subscription-receipt"
        >
          <div className="bg-white p-4">
            <SubscriptionReceiptTemplate
              sub={printData}
              playerName={getPlayerName(printData.player_id)}
              academySettings={academySettings}
              receiptNumber={
                isSubscriptionExempt(printData)
                  ? undefined
                  : (printData.receipt_number || (paidSubscriptions.findIndex(s => (s.subscription_id || s.id) === (printData.subscription_id || printData.id)) + 1))
              }
            />
          </div>
        </PrintPortal>
      )}

      {/* ── Confirm Delete Modal ──────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف سجل الاشتراك"
        message="هل أنت متأكد من حذف هذا السجل؟ سيؤدي هذا الإجراء إلى حذف كافة البيانات المرتبطة به بشكل دائم."
      />
    </div>
  );
}
export default Subscriptions;
