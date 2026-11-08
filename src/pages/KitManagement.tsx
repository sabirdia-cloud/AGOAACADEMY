import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, Search, Shirt, CheckCircle, Clock, Trash2, Filter, 
  User, QrCode, Wallet, PackageCheck, History, Hash, Tag,
  Clock3, ShieldCheck, AlertCircle, X, Check, ChevronDown, Sparkles,
  ShoppingBag, FileDown, Edit3, Printer
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { QRScannerModal } from "@/components/QRScannerModal";
import { cn } from "@/lib/utils";
import { PrintPortal } from "@/components/PrintPortal";
import { KitReceiptTemplate } from "@/components/PrintTemplates";
import { PaidPlayersKitReportTemplate } from "@/components/PaidPlayersKitReportTemplate";

// ─── Player Quick Search & Selection Component ─────────────────────────────
interface PlayerKitSearchSelectProps {
  players: any[];
  value: number | null;
  onChange: (id: number | null) => void;
  checkPaymentStatus: (id: number) => boolean;
  filterPaidOnly: boolean;
  onToggleFilterPaidOnly: () => void;
  editingPlayerId?: number | null;
}

function PlayerKitSearchSelect({
  players,
  value,
  onChange,
  checkPaymentStatus,
  filterPaidOnly,
  onToggleFilterPaidOnly,
  editingPlayerId
}: PlayerKitSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPlayer = players.find(p => p.player_id === value);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter players based on payment status rule and search query
  const eligiblePlayers = players.filter(p => {
    if (filterPaidOnly) {
      const isPaid = checkPaymentStatus(p.player_id);
      const isEditing = editingPlayerId && p.player_id === editingPlayerId;
      if (!isPaid && !isEditing) return false;
    }
    return true;
  });

  const filteredList = eligiblePlayers.filter(p => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.uniform_size && p.uniform_size.toLowerCase().includes(q)) ||
      String(p.player_id).includes(q)
    );
  });

  const totalPaidCount = players.filter(p => checkPaymentStatus(p.player_id)).length;

  return (
    <div ref={containerRef} className="relative space-y-2">
      <input type="hidden" name="player_id" value={value ?? ""} required />

      {/* Header Info & Filter Toggle */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-black text-zinc-400 uppercase flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-emerald-400" />
          اختيار اللاعب
          <span className="text-[10px] text-zinc-500 font-normal">
            ({filterPaidOnly ? "اللاعبون المسددون فقط" : "جميع اللاعبين"})
          </span>
        </label>

        <button
          type="button"
          onClick={onToggleFilterPaidOnly}
          className={cn(
            "text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5",
            filterPaidOnly 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
          )}
          title={filterPaidOnly ? "انقر لعرض كافة اللاعبين كاستثناء" : "انقر لاقتصار القائمة على المسددين فقط"}
        >
          <CheckCircle className="h-3 w-3" />
          {filterPaidOnly ? `المسددون فقط (${totalPaidCount})` : `عرض الكل (${players.length})`}
        </button>
      </div>

      {/* Selected Box / Dropdown Trigger */}
      <div
        onClick={() => { setIsOpen(prev => !prev); setQuery(""); }}
        className={cn(
          "w-full flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition bg-zinc-950",
          isOpen ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-800 hover:border-zinc-700"
        )}
      >
        {selectedPlayer ? (
          <div className="flex items-center gap-3 overflow-hidden text-right">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-zinc-100">{selectedPlayer.name}</span>
                {checkPaymentStatus(selectedPlayer.player_id) ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2 py-0.5 rounded-full">
                    تم دفع الاشتراك ✓
                  </span>
                ) : (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2 py-0.5 rounded-full">
                    غير مسدد
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                الفئة: <span className="text-zinc-300 font-bold">{selectedPlayer.category || 'غير محددة'}</span>
                {" • "}
                المقاس: <span className="text-emerald-400 font-bold">{selectedPlayer.uniform_size || 'غير مسجل'}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Search className="h-4 w-4 text-zinc-600" />
            <span>ابحث بالاسم أو اختر لاعباً مسدداً للاشتراك...</span>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {selectedPlayer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setQuery("");
              }}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition"
              title="إلغاء الاختيار"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {/* Suggested Kit Size Preview */}
      {selectedPlayer && (
        <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
          <span className="text-zinc-400">مقاس اللباس المسجل في بطاقة اللاعب:</span>
          <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
            {selectedPlayer.uniform_size || "غير محدد"}
          </span>
        </div>
      )}

      {/* Dropdown Menu with Live Search */}
      {isOpen && (
        <div className="absolute z-50 right-0 left-0 mt-1 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Search Input */}
          <div className="p-2.5 border-b border-zinc-800/80 bg-zinc-950/70">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              <input
                autoFocus
                type="text"
                placeholder="بحث سريع بالاسم، الفئة، أو مقاس اللباس..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/70 rounded-xl pr-9 pl-8 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Player Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/40">
            {filteredList.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 space-y-2">
                <AlertCircle className="h-6 w-6 text-amber-500/60 mx-auto" />
                <p className="font-medium">
                  {filterPaidOnly && totalPaidCount === 0
                    ? "لا يوجد أي لاعب مسجل كمسدد لاشتراكه حالياً!"
                    : `لا توجد نتائج مطابقة لبحثك "${query}"`}
                </p>
                {filterPaidOnly && (
                  <button
                    type="button"
                    onClick={onToggleFilterPaidOnly}
                    className="text-[11px] text-emerald-400 hover:underline font-bold"
                  >
                    عرض جميع اللاعبين المسجلين كاستثناء
                  </button>
                )}
              </div>
            ) : (
              filteredList.map(p => {
                const isPaid = checkPaymentStatus(p.player_id);
                const isSelected = value === p.player_id;
                return (
                  <div
                    key={p.player_id}
                    onClick={() => {
                      onChange(p.player_id);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors",
                      isSelected 
                        ? "bg-emerald-500/15 text-emerald-300" 
                        : "hover:bg-zinc-800/70 text-zinc-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 shrink-0">
                        {p.name?.charAt(0) || "ل"}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                          {p.name}
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          الفئة: {p.category || 'غير محددة'} • مقاس: {p.uniform_size || '---'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      {isPaid ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2 py-0.5 rounded-full">
                          مسدد الاشتراك ✓
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2 py-0.5 rounded-full">
                          غير مسدد
                        </span>
                      )}
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

// ─── Main Kit Management Component ──────────────────────────────────────────
export function KitManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [bagSearchTerm, setBagSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

    // Data States
    const [kits, setKits] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);

    // Modal States
    const [isDistModalOpen, setIsDistModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Form States
    const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
    const [filterPaidOnly, setFilterPaidOnly] = useState(true);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [modalBagNumber, setModalBagNumber] = useState("");
    const [editDist, setEditDist] = useState<any>(null);
    const [printData, setPrintData] = useState<any>(null);

    const [academySettings, setAcademySettings] = useState<any>(null);

    // Equipment items including "واقي الرجل"
    const kitItemsList = [
        { id: 'suit', name: 'بدلة رياضية' },
        { id: 'tshirt', name: 'تيشرت' },
        { id: 'socks', name: 'جوارب' },
        { id: 'shin_guards', name: 'واقي الرجل' },
        { id: 'bag', name: 'حقيبة' },
    ];

    const extractKitNumber = (notes: string) => {
        if (!notes) return "";
        const match = notes.match(/\[(?:رقم الحقيبة|رقم القطعة|رقم الحقيبة \/ القطعة):\s*([^\]]+)\]/i);
        if (match) return match[1].trim();
        const fallbackMatch = notes.match(/\[حقيبة:\s*([^\]]+)\]/i);
        return fallbackMatch ? fallbackMatch[1].trim() : "";
    };

    const cleanNotes = (notes: string) => {
        if (!notes) return "";
        return notes
            .replace(/\[(?:رقم الحقيبة|رقم القطعة|رقم الحقيبة \/ القطعة|حقيبة):\s*[^\]]+\]\s*-?\s*/gi, "")
            .trim();
    };

    const handleOpenNewDist = (initialBagNum: string = "") => {
        setEditDist(null);
        setSelectedPlayerId(null);
        setSelectedItems([]);
        setModalBagNumber(initialBagNum);
        setIsDistModalOpen(true);
    };

    const handleOpenEditDist = (kit: any) => {
        setEditDist(kit);
        setSelectedPlayerId(kit.player_id);
        setSelectedItems(kit.items?.split(", ") || []);
        setModalBagNumber(extractKitNumber(kit.notes));
        setIsDistModalOpen(true);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [kData, pData, payData, subsData, sData] = await Promise.all([
              api.getKits(),
              api.getPlayers(),
              api.getPayments().catch(() => []),
              api.getSubscriptions().catch(() => []),
              api.getAcademySettings().catch(() => null)
            ]);
            setKits(kData || []);
            setPlayers(pData || []);
            setPayments(payData || []);
            setSubscriptions(subsData || []);
            setAcademySettings(sData);
        } catch (error) {
            console.error("Failed to load kit management data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Determine if player has paid their subscription
    const checkPaymentStatus = (playerId: number) => {
        const pIdNum = Number(playerId);

        // 1. Direct payment registered for this player with status 'مكتمل' or valid amount
        const hasDirectPayment = payments.some((p: any) => 
            Number(p.player_id) === pIdNum && (p.status === 'مكتمل' || (!p.status && Number(p.amount) > 0))
        );
        if (hasDirectPayment) return true;

        // 2. Payments linked to subscriptions belonging to this player
        const playerSubscriptions = subscriptions.filter((s: any) => Number(s.player_id) === pIdNum);
        const playerSubIds = playerSubscriptions.map((s: any) => Number(s.subscription_id || s.id));
        const hasSubPayment = payments.some((p: any) => 
            (p.status === 'مكتمل' || (!p.status && Number(p.amount) > 0)) && 
            playerSubIds.includes(Number(p.subscription_id))
        );
        if (hasSubPayment) return true;

        // 3. Active subscription status ("نشط")
        const hasActiveSub = playerSubscriptions.some((s: any) => s.status === 'نشط');
        if (hasActiveSub) return true;

        // 4. Exempt / special case ("حالة خاصة")
        const isExempt = playerSubscriptions.some((s: any) => 
            (s.plan_name && (s.plan_name.includes('معفى') || s.plan_name.includes('خاصة') || s.plan_name.includes('إعفاء') || s.plan_name.includes('منحة'))) ||
            s.status === 'معفى'
        );
        if (isExempt) return true;

        return false;
    };

    const getPlayerInfo = (playerId: number) => {
        const player = players.find((p: any) => p.player_id === playerId);
        return player ? {
            name: player.name,
            kit_size: player.uniform_size || "غير محدد",
            category: player.category
        } : { name: "غير معروف", kit_size: "---", category: "---" };
    };

    // Conflict detection: bag numbers must be unique across all kits (رقم الحقيبة فريد ولا يتكرر)
    const bagNumberConflict = useMemo(() => {
        const trimmed = modalBagNumber.trim();
        if (!trimmed) return null;
        const existing = kits.find((k: any) => 
            k.id !== editDist?.id && 
            extractKitNumber(k.notes).toLowerCase() === trimmed.toLowerCase()
        );
        if (!existing) return null;
        const player = players.find(p => p.player_id === existing.player_id);
        return {
            playerName: player?.name || "لاعب مسجل",
            category: player?.category || "غير محدد",
            items: existing.items || "عتاد"
        };
    }, [modalBagNumber, kits, editDist, players]);

    // Live bag number lookup: "عند كتابة رقمها يظهر اسم اللاعب ونوع اللباس الذي استلمه"
    const bagSearchResult = useMemo(() => {
        const term = bagSearchTerm.trim().toLowerCase();
        if (!term) return null;
        
        // Exact match first, followed by substring match
        let match = kits.find((k: any) => {
            const num = extractKitNumber(k.notes).toLowerCase();
            return num && num === term;
        });

        if (!match) {
            match = kits.find((k: any) => {
                const num = extractKitNumber(k.notes).toLowerCase();
                return num && num.includes(term);
            });
        }

        if (!match) {
            return { found: false as const, term: bagSearchTerm.trim() };
        }

        const pInfo = getPlayerInfo(match.player_id);
        const player = players.find((p: any) => p.player_id === match.player_id);
        const isPaid = checkPaymentStatus(match.player_id);
        const bagNum = extractKitNumber(match.notes);

        return {
            found: true as const,
            kit: match,
            player,
            playerInfo: pInfo,
            isPaid,
            bagNumber: bagNum,
            items: match.items?.split(", ") || [],
            date: match.distributed_at,
            status: match.status,
            notes: cleanNotes(match.notes)
        };
    }, [bagSearchTerm, kits, players, payments, subscriptions]);

    // Print report states for paid players kit distribution (40 per A4 page)
    const [isKitReportOpen, setIsKitReportOpen] = useState(false);
    const [reportCategory, setReportCategory] = useState("all");
    const [reportPaymentType, setReportPaymentType] = useState("all");
    const [reportDeliveryStatus, setReportDeliveryStatus] = useState("all");

    // Comprehensive payment status check: full, half, exempt, or unpaid
    const getPlayerPaymentDetails = (playerId: number) => {
        const pIdNum = Number(playerId);
        const playerSubscriptions = (subscriptions || []).filter((s: any) => Number(s.player_id) === pIdNum);
        const playerSubIds = playerSubscriptions.map((s: any) => Number(s.subscription_id || s.id));

        // 1. Check if player has special exempt status (حالة خاصة معفى)
        const isExempt = playerSubscriptions.some((s: any) => 
            (s.plan_name && (s.plan_name.includes('معفى') || s.plan_name.includes('خاصة') || s.plan_name.includes('إعفاء') || s.plan_name.includes('منحة'))) ||
            s.status === 'معفى'
        );

        if (isExempt) {
            return {
                isEligible: true,
                type: 'exempt' as const,
                label: 'حالة خاصة (معفى)',
                amount: 0,
                color: '#9333ea',
                bgColor: '#faf5ff',
                borderColor: '#e9d5ff'
            };
        }
        
        const playerPayments = (payments || []).filter((p: any) => 
            Number(p.player_id) === pIdNum || playerSubIds.includes(Number(p.subscription_id))
        );
        
        const totalPaidFromPayments = playerPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        const totalPaidFromSubs = playerSubscriptions.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
        const totalPaid = Math.max(totalPaidFromPayments, totalPaidFromSubs);

        const hasHalfPlan = playerSubscriptions.some((s: any) => 
            (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000
        ) || playerPayments.some((p: any) => Number(p.amount) === 5000);

        const hasFullPlan = playerSubscriptions.some((s: any) => 
            (s.plan_name && s.plan_name.includes('كامل')) || Number(s.amount) >= 10000
        ) || playerPayments.some((p: any) => Number(p.amount) >= 10000);

        if (totalPaid >= 10000 || hasFullPlan) {
            return {
                isEligible: true,
                type: 'full' as const,
                label: 'كاملة',
                amount: totalPaid || 10000,
                color: '#059669',
                bgColor: '#ecfdf5',
                borderColor: '#a7f3d0'
            };
        }

        if (hasHalfPlan || totalPaid === 5000 || (totalPaid > 0 && totalPaid < 10000)) {
            return {
                isEligible: true,
                type: 'half' as const,
                label: 'نصفها',
                amount: totalPaid || 5000,
                color: '#b45309',
                bgColor: '#fffbeb',
                borderColor: '#fde68a'
            };
        }

        const activeSub = playerSubscriptions.find((s: any) => s.status === 'نشط');
        if (activeSub) {
            const isHalf = activeSub.plan_name?.includes('نصف') || Number(activeSub.amount) === 5000;
            return {
                isEligible: true,
                type: isHalf ? 'half' as const : 'full' as const,
                label: isHalf ? 'نصفها' : 'كاملة',
                amount: Number(activeSub.amount) || (isHalf ? 5000 : 10000),
                color: isHalf ? '#b45309' : '#059669',
                bgColor: isHalf ? '#fffbeb' : '#ecfdf5',
                borderColor: isHalf ? '#fde68a' : '#a7f3d0'
            };
        }

        if (checkPaymentStatus(playerId)) {
            return {
                isEligible: true,
                type: 'full' as const,
                label: 'كاملة',
                amount: totalPaid || 10000,
                color: '#059669',
                bgColor: '#ecfdf5',
                borderColor: '#a7f3d0'
            };
        }

        return {
            isEligible: false,
            type: 'unpaid' as const,
            label: 'غير مسدد',
            amount: 0,
            color: '#dc2626',
            bgColor: '#fef2f2',
            borderColor: '#fecaca'
        };
    };

    const paidPlayersForReport = useMemo(() => {
        return (players || []).map((p: any) => {
            const payInfo = getPlayerPaymentDetails(p.player_id);
            const kit = (kits || []).find((k: any) => Number(k.player_id) === Number(p.player_id));
            const isDelivered = kit && (kit.status === 'delivered' || kit.status === 'تم الاستلام' || !kit.status);

            return {
                player_id: p.player_id,
                name: p.name,
                category: p.category || 'غير محدد',
                uniform_size: p.uniform_size || 'غير محدد',
                paymentType: payInfo.type,
                paymentLabel: payInfo.label,
                paymentAmount: payInfo.amount,
                paymentColor: payInfo.color,
                paymentBg: payInfo.bgColor,
                paymentBorder: payInfo.borderColor,
                isEligible: payInfo.isEligible,
                isDelivered: !!isDelivered,
                deliveryStatusLabel: isDelivered ? 'تم الاستلام' : 'لم يستلم',
                kitItems: kit?.items || '',
                kitNumber: extractKitNumber(kit?.notes || ''),
                notes: cleanNotes(kit?.notes || p.notes || '')
            };
        })
        .filter((p: any) => p.isEligible)
        .filter((p: any) => {
            if (reportCategory !== 'all' && p.category !== reportCategory) return false;
            if (reportPaymentType === 'full' && p.paymentType !== 'full') return false;
            if (reportPaymentType === 'half' && p.paymentType !== 'half') return false;
            if (reportPaymentType === 'exempt' && p.paymentType !== 'exempt') return false;
            if (reportDeliveryStatus === 'delivered' && !p.isDelivered) return false;
            if (reportDeliveryStatus === 'pending' && p.isDelivered) return false;
            return true;
        })
        .sort((a: any, b: any) => {
            const catComp = (a.category || '').localeCompare(b.category || '');
            if (catComp !== 0) return catComp;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [players, kits, payments, subscriptions, reportCategory, reportPaymentType, reportDeliveryStatus]);

    const availableCategories = useMemo(() => {
        const set = new Set<string>();
        (players || []).forEach((p: any) => {
            if (p.category) set.add(p.category.trim());
        });
        return Array.from(set).sort();
    }, [players]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        (kits || []).forEach((k: any) => {
            const p = (players || []).find((pl: any) => pl.player_id === k.player_id);
            const cat = p?.category?.trim() || "غير محدد";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [kits, players]);

    const handleSaveDistribution = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const kitNum = modalBagNumber.trim() || ((formData.get("kit_number") as string)?.trim() || "");
        const baseNotes = (formData.get("notes") as string) || "";
        const targetPlayerId = selectedPlayerId || Number(formData.get("player_id"));
        
        if (!targetPlayerId) {
            alert("يرجى اختيار اللاعب أولاً من القائمة!");
            return;
        }

        if (selectedItems.length === 0) {
            alert("يرجى تحديد قطعة واحدة على الأقل من العتاد المسلم!");
            return;
        }

        if (kitNum) {
            const isUsed = kits.some((k: any) => 
                k.id !== editDist?.id && 
                extractKitNumber(k.notes).toLowerCase() === kitNum.toLowerCase()
            );
            if (isUsed) {
                const conflict = kits.find((k: any) => 
                    k.id !== editDist?.id && 
                    extractKitNumber(k.notes).toLowerCase() === kitNum.toLowerCase()
                );
                const p = players.find((player: any) => player.player_id === conflict?.player_id);
                alert(`عذراً، رقم الحقيبة (${kitNum}) محجوز ومستخدم مسبقاً من طرف اللاعب: ${p?.name || 'لاعب آخر'}! رقم الحقيبة يجب أن يكون فريداً ولا يتكرر.`);
                return;
            }
        }
        
        let finalNotes = baseNotes;
        if (kitNum) {
            finalNotes = `[رقم الحقيبة: ${kitNum}] - ${baseNotes || ''}`;
        }

        const kitData = {
            player_id: targetPlayerId,
            distributed_at: new Date().toISOString().split('T')[0],
            status: formData.get("status") as string,
            notes: finalNotes,
            items: selectedItems.join(", "),
        };

        try {
            if (editDist) {
                await api.updateKit(editDist.id, kitData);
                alert('تم تحديث عملية التوزيع بنجاح!');
            } else {
                await api.addKit(kitData);
                alert('تم تسجيل عملية التوزيع بنجاح!');
            }
            await loadData();
            setIsDistModalOpen(false);
            setEditDist(null);
            setSelectedPlayerId(null);
            setSelectedItems([]);
            setModalBagNumber("");
        } catch (error: any) {
            alert(`خطأ: ${error.message}`);
        }
    };

    const handleDelete = (id: number) => {
        setItemToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.deleteKit(itemToDelete);
            await loadData();
        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setIsConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const filteredKits = kits.filter((k: any) => {
        const player = players.find((p: any) => p.player_id === k.player_id);
        const kitNum = extractKitNumber(k.notes);
        if (!player) return false;

        if (selectedCategory !== "all") {
            const playerCat = (player.category || "").trim();
            if (playerCat !== selectedCategory) return false;
        }

        const term = searchTerm.toLowerCase().trim();
        const bagTerm = bagSearchTerm.toLowerCase().trim();

        const matchesGeneral = !term || (
            player.name.toLowerCase().includes(term) || 
            kitNum.toLowerCase().includes(term) ||
            (k.items && k.items.toLowerCase().includes(term))
        );

        const matchesBagSearch = !bagTerm || (
            kitNum.toLowerCase() === bagTerm || kitNum.toLowerCase().includes(bagTerm)
        );

        return matchesGeneral && matchesBagSearch;
    });

    return (
        <div className="space-y-6 pb-20 font-tajawal" dir="rtl">
            {/* Header section with Stats */}
            <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-white flex items-center gap-3">
                           <Shirt className="h-8 w-8 text-emerald-500" />
                           إدارة وتتبع العتاد الرياضي
                        </h2>
                        <p className="text-zinc-400 mt-2 font-medium">نظام متكامل لتوزيع الألبسة وتتبع حياة العتاد لكل لاعب بوضوح واحترافية.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button 
                          onClick={() => setIsKitReportOpen(true)}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-black px-5 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            طباعة كشف المسددين ومقاسات الألبسة (40 بالورقة)
                        </Button>

                        <Button 
                          onClick={() => handleOpenNewDist()} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
                        >
                            <Plus className="ml-2 h-4 w-4" />
                            تسجيل توزيع جديد
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 relative z-10">
                   <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">إجمالي التوزيعات</p>
                      <p className="text-2xl font-black text-white">{kits.length}</p>
                   </div>
                   <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">الحقائب المرقمة</p>
                      <p className="text-2xl font-black text-emerald-400 flex items-center gap-1.5 font-mono">
                        <ShoppingBag className="h-5 w-5 text-emerald-400" />
                        {kits.filter((a: any) => extractKitNumber(a.notes)).length}
                      </p>
                   </div>
                   <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">لاعبين استلموا</p>
                      <p className="text-2xl font-black text-white">{new Set(kits.map((k: any) => k.player_id)).size}</p>
                   </div>
                   <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">قطع محجوزة</p>
                      <p className="text-2xl font-black text-blue-500">{kits.filter((a: any) => a.status === 'reserved').length}</p>
                   </div>
                </div>
            </div>

            {/* Quick Search by Bag Number (الخاصية المطلوبة: البحث برقم الحقيبة فريد ولا يتكرر) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900/95 to-zinc-950 border border-emerald-500/30 p-6 rounded-3xl shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                البحث السريع برقم الحقيبة
                                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    رقم فريد لا يتكرر
                                </span>
                            </h3>
                            <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                اكتب رقم الحقيبة ليظهر لك اسم اللاعب فوراً ونوع اللباس الذي استلمه.
                            </p>
                        </div>
                    </div>

                    {bagSearchTerm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBagSearchTerm("")}
                            className="text-xs text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-1.5"
                        >
                            <X className="h-3.5 w-3.5 ml-1 text-rose-400" />
                            مسح بحث الحقيبة
                        </Button>
                    )}
                </div>

                {/* Bag Search Input Bar */}
                <div className="relative max-w-2xl">
                    <ShoppingBag className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 pointer-events-none" />
                    <input 
                        type="text" 
                        placeholder="اكتب رقم الحقيبة هنا (مثلاً: 10، 07، 15)..."
                        value={bagSearchTerm}
                        onChange={(e) => setBagSearchTerm(e.target.value)}
                        className="w-full bg-zinc-950 border-2 border-emerald-500/40 focus:border-emerald-500 rounded-2xl py-3 pr-12 pl-12 text-base text-zinc-100 placeholder-zinc-500 font-mono font-bold outline-none shadow-lg shadow-emerald-950/20 transition-all"
                    />
                    {bagSearchTerm && (
                        <button
                            type="button"
                            onClick={() => setBagSearchTerm("")}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Instant Result Box */}
                {bagSearchResult && (
                    <div className="pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {bagSearchResult.found ? (
                            <div className="bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-950 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-xl space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm flex items-center gap-2 shadow-md shadow-emerald-500/20 font-mono">
                                            <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
                                            حقيبة رقم: #{bagSearchResult.bagNumber}
                                        </span>
                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-2.5 py-1 rounded-lg">
                                            رقم معتمد ومخصص للاعب ✓
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {bagSearchResult.isPaid ? (
                                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                مسدد الاشتراك
                                            </span>
                                        ) : (
                                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                غير مسدد
                                            </span>
                                        )}

                                        <span className={cn(
                                            "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg",
                                            bagSearchResult.status === 'delivered' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                        )}>
                                            {bagSearchResult.status === 'delivered' ? 'تم التسليم' : 'محجوز'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    {/* Player Info */}
                                    <div className="flex items-center gap-3.5 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/70">
                                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 font-black text-lg">
                                            {bagSearchResult.playerInfo.name?.charAt(0) || <User className="h-6 w-6" />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">اللاعب المستلم:</p>
                                            <h4 className="text-base font-black text-white">
                                                {bagSearchResult.playerInfo.name}
                                            </h4>
                                            <p className="text-xs text-zinc-400 font-medium">
                                                الفئة: <span className="text-zinc-200 font-bold">{bagSearchResult.playerInfo.category || 'غير محددة'}</span>
                                                {" • "}
                                                المقاس: <span className="text-emerald-400 font-bold font-mono">{bagSearchResult.playerInfo.kit_size || 'غير مسجل'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Kit Items */}
                                    <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/70 space-y-2">
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <Shirt className="h-3.5 w-3.5 text-emerald-400" />
                                            نوع اللباس والعتاد المستلم:
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {bagSearchResult.items.map((item: string, idx: number) => (
                                                <span 
                                                    key={idx}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-xs font-black border flex items-center gap-1",
                                                        item === 'حقيبة'
                                                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                                            : item === 'واقي الرجل'
                                                            ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                                                            : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                                                    )}
                                                >
                                                    <Check className="h-3 w-3 stroke-[3]" />
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                        {bagSearchResult.notes && (
                                            <p className="text-[11px] text-zinc-400 italic pt-1 border-t border-zinc-800/40">
                                                ملاحظات: {bagSearchResult.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs">
                                    <span className="text-zinc-500 font-medium">
                                        تاريخ التسليم: <strong className="text-zinc-300">{bagSearchResult.date || 'غير محدد'}</strong>
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => setPrintData({
                                                type: 'distribution',
                                                playerInfo: bagSearchResult.playerInfo,
                                                kit: bagSearchResult.kit
                                            })}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 rounded-xl text-xs font-black"
                                        >
                                            <Printer className="h-3.5 w-3.5 ml-1.5 text-emerald-400" />
                                            طباعة وصل الاستلام
                                        </Button>

                                        <Button
                                            size="sm"
                                            onClick={() => handleOpenEditDist(bagSearchResult.kit)}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20"
                                        >
                                            <Edit3 className="h-3.5 w-3.5 ml-1.5" />
                                            تعديل التوزيع
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5 text-amber-300 font-bold">
                                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                                    <div>
                                        <p className="text-sm">لم يتم العثور على أي لاعب استلم الحقيبة رقم <span className="font-mono underline font-black">#{bagSearchResult.term}</span></p>
                                        <p className="text-[11px] text-zinc-400 font-normal mt-0.5">هذا الرقم متاح ويمكن تخصيصه الآن للاعب دون تكرار.</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleOpenNewDist(bagSearchResult.term)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shrink-0"
                                >
                                    <Plus className="h-3.5 w-3.5 ml-1" />
                                    تسجيل توزيع جديد بالحقيبة #{bagSearchResult.term}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Search & Category Filter Section */}
            <div className="space-y-3">
                <div className="flex flex-col md:flex-row gap-3.5 items-start md:items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                            <PackageCheck className="h-5 w-5 text-emerald-500" />
                            قائمة التوزيعات
                        </h3>
                        <span className="text-xs text-zinc-400 font-bold bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl">
                            {filteredKits.length} من {kits.length} توزيع
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        {/* Category Dropdown Filter */}
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 shadow-sm">
                            <Filter className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="text-xs text-zinc-400 font-bold">الفئة:</span>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-transparent text-xs font-black text-zinc-200 outline-none cursor-pointer"
                            >
                                <option value="all" className="bg-zinc-900 text-zinc-200">جميع الفئات ({kits.length})</option>
                                {availableCategories.map((cat: string) => (
                                    <option key={cat} value={cat} className="bg-zinc-900 text-zinc-200">
                                        فئة {cat} ({categoryCounts[cat] || 0})
                                    </option>
                                ))}
                            </select>
                            {selectedCategory !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory('all')}
                                    className="text-zinc-500 hover:text-rose-400 transition mr-0.5"
                                    title="إلغاء فلتر الفئة"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Search Input Bar */}
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input 
                              type="text" 
                              placeholder="البحث باسم اللاعب، رقم الحقيبة..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pr-9 pl-8 text-sm text-zinc-200 focus:border-emerald-500 outline-none"
                            />
                            {searchTerm && (
                                <button
                                  type="button"
                                  onClick={() => setSearchTerm("")}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <Button 
                            variant="outline" 
                            onClick={() => setIsQrScannerOpen(true)} 
                            className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-emerald-500 h-9 px-3 rounded-xl"
                            title="مسح رمز الاستجابة السريعة QR"
                        >
                            <QrCode className="h-4 w-4" />
                        </Button>

                        {(selectedCategory !== 'all' || searchTerm || bagSearchTerm) && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setSearchTerm('');
                                    setBagSearchTerm('');
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl h-9 px-3 font-bold"
                            >
                                مسح الفلاتر
                            </Button>
                        )}
                    </div>
                </div>

                {/* Quick Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 border flex items-center gap-2",
                            selectedCategory === 'all'
                                ? "bg-emerald-500 border-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                                : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                        )}
                    >
                        <span>جميع الفئات</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black",
                            selectedCategory === 'all' ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                        )}>
                            {kits.length}
                        </span>
                    </button>

                    {availableCategories.map((cat: string) => {
                        const count = categoryCounts[cat] || 0;
                        const isSelected = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 border flex items-center gap-2",
                                    isSelected
                                        ? "bg-emerald-500 border-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                                        : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                                )}
                            >
                                <span>فئة {cat}</span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black",
                                    isSelected ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content: Distribution Table */}
            <Card className="bg-zinc-900/40 border-zinc-800/50 overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-zinc-950/80 text-zinc-500 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-black uppercase text-[10px]">اللاعب والفئة</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px]">رقم الحقيبة</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px]">العتاد المسلم</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px]">حالة دفع الاشتراك</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px]">التاريخ</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px]">الحالة</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {isLoading ? (
                                <tr><td colSpan={7} className="py-20 text-center"><Shirt className="h-10 w-10 text-zinc-800 animate-bounce mx-auto" /></td></tr>
                            ) : filteredKits.length === 0 ? (
                                <tr><td colSpan={7} className="py-20 text-center text-zinc-600 italic">لا توجد سجلات توزيع متوفرة</td></tr>
                            ) : (
                                filteredKits.map((kit: any) => {
                                    const pInfo = getPlayerInfo(kit.player_id);
                                    const isPaid = checkPaymentStatus(kit.player_id);
                                    const bagNum = extractKitNumber(kit.notes);
                                    return (
                                        <tr key={kit.id} className="hover:bg-zinc-800/20 group transition-all">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center">
                                                       <User className="h-5 w-5 text-emerald-500/50" />
                                                    </div>
                                                    <div>
                                                       <p className="font-black text-zinc-100">{pInfo.name}</p>
                                                       <p className="text-[10px] text-zinc-500 font-bold">{pInfo.category} • مقاس {pInfo.kit_size}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {bagNum ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-black text-xs shadow-sm">
                                                        <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                                                        #{bagNum}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-600 font-mono text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1">
                                                    {kit.items?.split(", ").map((item: string, idx: number) => (
                                                        <span key={idx} className={cn(
                                                            "px-2 py-0.5 rounded text-[9px] font-black border",
                                                            item === 'حقيبة'
                                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                                : item === 'واقي الرجل' 
                                                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30" 
                                                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                        )}>
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                               {isPaid ? (
                                                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20 inline-flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    مسدد الاشتراك
                                                  </span>
                                               ) : (
                                                  <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black border border-amber-500/20 inline-flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    غير مسدد
                                                  </span>
                                               )}
                                            </td>
                                            <td className="px-6 py-5 text-zinc-400 text-xs font-bold">{kit.distributed_at}</td>
                                            <td className="px-6 py-5">
                                               <span className={cn(
                                                  "text-[9px] font-black uppercase px-2 py-1 rounded",
                                                  kit.status === 'delivered' ? "bg-zinc-800 text-emerald-500" : "bg-zinc-800 text-blue-400"
                                               )}>{kit.status === 'delivered' ? 'DISTRIBUTED' : 'PENDING'}</span>
                                            </td>
                                            <td className="px-6 py-5 flex items-center justify-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={() => setPrintData({
                                                    type: 'distribution',
                                                    playerInfo: pInfo,
                                                    kit
                                                  })}
                                                  className="h-8 w-8 text-zinc-400 hover:text-emerald-500 rounded-lg"
                                                  title="طباعة وصل التوزيع"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={() => handleOpenEditDist(kit)} 
                                                  className="h-8 w-8 text-zinc-400 hover:text-blue-500 rounded-lg"
                                                  title="تعديل السجل"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={() => handleDelete(kit.id)} 
                                                  className="h-8 w-8 text-zinc-400 hover:text-rose-500 rounded-lg"
                                                  title="حذف"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Distribution Modal */}
            <Modal 
              isOpen={isDistModalOpen} 
              onClose={() => setIsDistModalOpen(false)} 
              title={editDist ? "تعديل عملية توزيع العتاد" : "تسجيل توزيع سريع للألبسة والعتاد"}
              size="lg"
            >
                <form onSubmit={handleSaveDistribution} className="space-y-5 pt-2">
                    {/* Quick Search Player Selector with Subscription Filter */}
                    <PlayerKitSearchSelect 
                        players={players}
                        value={selectedPlayerId}
                        onChange={(id) => setSelectedPlayerId(id)}
                        checkPaymentStatus={checkPaymentStatus}
                        filterPaidOnly={filterPaidOnly}
                        onToggleFilterPaidOnly={() => setFilterPaidOnly(prev => !prev)}
                        editingPlayerId={editDist?.player_id}
                    />

                    {/* Equipment Kit Items Selection */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-zinc-400 uppercase flex items-center gap-1.5">
                                <PackageCheck className="h-3.5 w-3.5 text-emerald-400" />
                                تحديد قطع العتاد المسلمة
                            </label>
                            <span className="text-[11px] text-zinc-500">
                                {selectedItems.length} قطع محددة
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {kitItemsList.map(item => {
                                const isSelected = selectedItems.includes(item.name);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItems(prev => 
                                            prev.includes(item.name) 
                                                ? prev.filter(i => i !== item.name) 
                                                : [...prev, item.name]
                                        )}
                                        className={cn(
                                            "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all select-none",
                                            isSelected 
                                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-black shadow-sm shadow-emerald-500/5" 
                                                : "bg-zinc-950 border-zinc-800/80 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-5 w-5 rounded-lg flex items-center justify-center shrink-0 text-xs border",
                                            isSelected 
                                                ? "bg-emerald-500 border-emerald-500 text-zinc-950" 
                                                : "border-zinc-700 bg-zinc-900"
                                        )}>
                                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                        </div>
                                        <span className="text-xs">{item.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-zinc-400 uppercase">حالة التسليم</label>
                            <select 
                                name="status" 
                                defaultValue={editDist?.status || "delivered"}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-50 outline-none focus:border-emerald-500"
                            >
                                <option value="delivered">تم التسليم النهائي</option>
                                <option value="reserved">محجوز بالتخزين</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-zinc-400 uppercase flex items-center gap-1.5">
                                    <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                                    رقم الحقيبة (فريد - لا يتكرر)
                                </label>
                                {modalBagNumber.trim() && !bagNumberConflict && (
                                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                        <Check className="h-3 w-3 stroke-[3]" /> متاح
                                    </span>
                                )}
                            </div>
                            <input 
                              type="text" 
                              name="kit_number"
                              value={modalBagNumber}
                              onChange={(e) => setModalBagNumber(e.target.value)}
                              placeholder="مثال: 10، 07، A-1..."
                              className={cn(
                                "w-full bg-zinc-950 border rounded-xl px-4 py-2 text-zinc-50 text-center font-black font-mono outline-none transition-all",
                                bagNumberConflict 
                                  ? "border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20" 
                                  : "border-zinc-800 focus:border-emerald-500"
                              )}
                            />
                            {bagNumberConflict && (
                                <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5 mt-1 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>
                                        محجوز مسبقاً للاعب: <strong>{bagNumberConflict.playerName}</strong> ({bagNumberConflict.category}). أرقام الحقائب لا تتكرر!
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-zinc-400 uppercase">ملاحظات إضافية</label>
                        <input 
                           type="text" 
                           name="notes"
                           defaultValue={editDist ? cleanNotes(editDist.notes) : ""}
                           placeholder="أي تفاصيل أخرى حول حالة الاستلام..."
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="pt-4 flex gap-3 border-t border-zinc-800/60">
                        <Button 
                          type="submit" 
                          disabled={Boolean(bagNumberConflict)}
                          className={cn(
                            "flex-1 font-black py-5 rounded-xl shadow-xl transition-all",
                            bagNumberConflict
                              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10"
                          )}
                        >
                          {editDist ? "حفظ التعديلات" : "تأكيد التوزيع"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => {
                            setIsDistModalOpen(false);
                            setModalBagNumber("");
                          }} 
                          className="px-6 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl"
                        >
                          إلغاء
                        </Button>
                    </div>
                </form>
            </Modal>

            <QRScannerModal
                isOpen={isQrScannerOpen}
                onClose={() => setIsQrScannerOpen(false)}
                onScan={(code) => setSearchTerm(code)}
                players={players}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="تأكيد حذف السجل"
                message="هل أنت متأكد من حذف هذا السجل؟ لن يؤثر هذا على مخزون المستودع، بل فقط على سجلات عتاد هذا اللاعب."
            />

            {printData && (
              <PrintPortal
                isOpen={true}
                onClose={() => setPrintData(null)}
                title={'وصل توزيع ألبسة'}
              >
                  <KitReceiptTemplate 
                    player={printData.playerInfo} 
                    items={printData.kit.items?.split(", ") || []} 
                    date={printData.kit.distributed_at} 
                    type="distribution"
                    notes={cleanNotes(printData.kit.notes)}
                    kitNumber={extractKitNumber(printData.kit.notes)}
                    academySettings={academySettings}
                  />
              </PrintPortal>
            )}

            {isKitReportOpen && (
              <PrintPortal
                isOpen={true}
                onClose={() => setIsKitReportOpen(false)}
                title="كشف تسليم الألبسة والعتاد للمسددين (40 بالورقة)"
                fileName={`كشف_تسليم_الالبسة_للمسددين_${reportCategory}`}
              >
                {/* Interactive Controls Bar - visible on screen, hidden in print */}
                <div className="print:hidden mb-4 p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs w-full max-w-5xl mx-auto shadow-xl">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 font-bold">الفئة:</span>
                      <select
                        value={reportCategory}
                        onChange={(e) => setReportCategory(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-100 font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">جميع الفئات</option>
                        {availableCategories.map(cat => (
                          <option key={cat} value={cat}>فئة {cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Type Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 font-bold">نوع السداد:</span>
                      <select
                        value={reportPaymentType}
                        onChange={(e) => setReportPaymentType(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-100 font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">الكل (كاملة + نصفها + حالات خاصة)</option>
                        <option value="full">الدفعة كاملة فقط</option>
                        <option value="half">نصف الدفعة فقط</option>
                        <option value="exempt">حالات خاصة (معفى) فقط</option>
                      </select>
                    </div>

                    {/* Delivery Status Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 font-bold">استلام اللباس:</span>
                      <select
                        value={reportDeliveryStatus}
                        onChange={(e) => setReportDeliveryStatus(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-100 font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">الكل (استلموا + لم يستلموا)</option>
                        <option value="pending">لم يستلموا بعد (قيد الانتظار)</option>
                        <option value="delivered">استلموا العتاد</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                    عدد المسددين المعروضين: {paidPlayersForReport.length} لاعب
                  </div>
                </div>

                <PaidPlayersKitReportTemplate
                  players={paidPlayersForReport}
                  selectedCategory={reportCategory}
                  academySettings={academySettings}
                />
              </PrintPortal>
            )}
        </div>
    );
}
