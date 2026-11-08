import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    Users, Search, MessageCircle, Send,
    Phone, Mail, User, Shield, Info,
    Loader2, CheckCircle2, Edit, Trash2, Key, Eye, EyeOff, ExternalLink,
    FileSpreadsheet, Download, Copy, Check, Filter, CheckSquare, Square,
    X, Sparkles, Smartphone
} from "lucide-react";
import { api } from "@/services/api";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/services/AuthContext";
import { useAcademy } from "@/services/AcademyContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function Parents() {
    const { settings: academySettings } = useAcademy();
    const [parents, setParents] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedTeamId, setSelectedTeamId] = useState("all");

    // Multi-Selection
    const [selectedParentIds, setSelectedParentIds] = useState<Set<number>>(new Set());

    // Modals
    const [selectedParent, setSelectedParent] = useState<any>(null);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Single-click Direct WhatsApp & In-app Modal
    const [directMsgParent, setDirectMsgParent] = useState<any>(null);
    const [directMsgTemplate, setDirectMsgTemplate] = useState<"subscription" | "training" | "praise" | "custom">("subscription");
    const [customDirectMsg, setCustomDirectMsg] = useState("");

    // WhatsApp Group Export Modal
    const [isWhatsAppGroupModalOpen, setIsWhatsAppGroupModalOpen] = useState(false);
    const [copiedWhatsAppFormat, setCopiedWhatsAppFormat] = useState(false);
    const [copiedListFormat, setCopiedListFormat] = useState(false);

    // Bulk Modal
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkMessage, setBulkMessage] = useState("");
    const [sendViaApp, setSendViaApp] = useState(true);
    const [sendViaWhatsapp, setSendViaWhatsapp] = useState(false);
    const [bulkSending, setBulkSending] = useState(false);

    // Edit Modal
    const [editingParent, setEditingParent] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});

    const navigate = useNavigate();
    const { impersonateParent } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [parentsData, playersData, teamsData] = await Promise.all([
                api.getParents(),
                api.getPlayers(),
                api.getTeams().catch(() => [])
            ]);
            setParents(parentsData || []);
            setPlayers(playersData || []);
            setTeams(teamsData || []);
        } catch (error) {
            console.error("Failed to load parents data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: Map player to parent
    const getParentChildren = (parent: any) => {
        return players.filter(
            p => p.parent_id === parent.id ||
                 p.parent_username === parent.username ||
                 (p.phone && parent.phone && p.phone === parent.phone)
        );
    };

    // Helper: Get categories and teams list
    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        players.forEach(p => { if (p.category) cats.add(p.category); });
        return Array.from(cats);
    }, [players]);

    const filteredTeams = useMemo(() => {
        if (selectedCategory === "all") return teams;
        return teams.filter(t => t.category === selectedCategory);
    }, [teams, selectedCategory]);

    // Format Algerian Phone for WhatsApp
    const formatAlgerianPhone = (phoneStr: string) => {
        if (!phoneStr) return "";
        let clean = phoneStr.replace(/\D/g, "");
        if (clean.startsWith("0")) clean = clean.substring(1);
        if (!clean.startsWith("213")) clean = "213" + clean;
        return clean;
    };

    // Filter parents based on search, category, and team/group
    const filteredParents = useMemo(() => {
        return parents.filter(parent => {
            const children = getParentChildren(parent);

            // Search query filter (parent name, phone, username, or child name)
            const matchesSearch =
                (parent.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (parent.phone || "").includes(searchQuery) ||
                (parent.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                children.some(c => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            // Category filter
            if (selectedCategory !== "all") {
                const hasCategory = children.some(c => c.category === selectedCategory);
                if (!hasCategory) return false;
            }

            // Team/Group filter
            if (selectedTeamId !== "all") {
                const targetTeamId = Number(selectedTeamId);
                const hasTeam = children.some(c => c.team_id === targetTeamId);
                if (!hasTeam) return false;
            }

            return true;
        });
    }, [parents, players, searchQuery, selectedCategory, selectedTeamId]);

    // Multi-selection handlers
    const toggleSelectParent = (id: number) => {
        setSelectedParentIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedParentIds.size === filteredParents.length) {
            setSelectedParentIds(new Set());
        } else {
            setSelectedParentIds(new Set(filteredParents.map(p => p.id)));
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // EXPORT TO EXCEL (Categorized per Category & Team/Group)
    // ─────────────────────────────────────────────────────────────────────────────
    const handleExportExcel = (onlySelected = false) => {
        const targetParents = onlySelected
            ? filteredParents.filter(p => selectedParentIds.has(p.id))
            : filteredParents;

        if (targetParents.length === 0) {
            alert("لا توجد بيانات أولياء لتصديرها.");
            return;
        }

        const wb = XLSX.utils.book_new();

        // Build Master List rows
        const masterRows = targetParents.map((parent, idx) => {
            const children = getParentChildren(parent);
            const childNames = children.map(c => c.name).join(" - ") || "غير محدد";
            const childCats = Array.from(new Set(children.map(c => c.category).filter(Boolean))).join("، ") || "غير محدد";
            const childTeams = Array.from(
                new Set(
                    children
                        .map(c => teams.find(t => t.team_id === c.team_id)?.name)
                        .filter(Boolean)
                )
            ).join("، ") || "فوج عام";

            return {
                "الرقم": idx + 1,
                "اسم ولقب الولي": parent.full_name || "غير محدد",
                "رقم الهاتف": parent.phone || "غير مسجل",
                "اسم اللاعب (الابن)": childNames,
                "الفئة العمرية": childCats,
                "الفوج / الفريق": childTeams,
                "اسم المستخدم": parent.username || "--",
                "البريد الإلكتروني": parent.email || "--",
            };
        });

        // 1. Add Master Sheet
        const wsMaster = XLSX.utils.json_to_sheet(masterRows);
        XLSX.utils.book_append_sheet(wb, wsMaster, "قائمة الأولياء الشاملة");

        // 2. Separate Sheets per Category if exporting all
        if (selectedCategory === "all" && !onlySelected) {
            const groupedByCat: Record<string, any[]> = {};

            targetParents.forEach(parent => {
                const children = getParentChildren(parent);
                children.forEach(child => {
                    const catKey = child.category || "فئات أخرى";
                    if (!groupedByCat[catKey]) groupedByCat[catKey] = [];

                    const teamName = teams.find(t => t.team_id === child.team_id)?.name || "فوج عام";
                    groupedByCat[catKey].push({
                        "اسم ولقب الولي": parent.full_name || "غير محدد",
                        "رقم الهاتف": parent.phone || "غير مسجل",
                        "اسم اللاعب": child.name,
                        "الفوج / الفريق": teamName,
                        "اسم المستخدم": parent.username || "--",
                    });
                });
            });

            Object.entries(groupedByCat).forEach(([catName, rows]) => {
                const sheetName = catName.substring(0, 30);
                const wsCat = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, wsCat, sheetName);
            });
        }

        // Generate and Download File
        const fileName = `قائمة_أولياء_الأمور_${selectedCategory !== "all" ? selectedCategory + "_" : ""}${new Date().toISOString().split("T")[0]}.xlsx`;
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(blob, fileName);
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // WHATSAPP GROUP FORMAT GENERATOR
    // ─────────────────────────────────────────────────────────────────────────────
    const whatsAppData = useMemo(() => {
        const targetParents = selectedParentIds.size > 0
            ? filteredParents.filter(p => selectedParentIds.has(p.id))
            : filteredParents;

        // Comma separated clean phones for pasting into WhatsApp group member invite
        const cleanPhones = targetParents
            .map(p => formatAlgerianPhone(p.phone))
            .filter(p => p.length >= 9)
            .map(p => "+" + p);

        const commaSeparated = Array.from(new Set(cleanPhones)).join(", ");

        // Formatted named list
        const namedList = targetParents.map((p, i) => {
            const children = getParentChildren(p);
            const childInfo = children.map(c => `${c.name} (${c.category})`).join("، ");
            return `${i + 1}. ${p.full_name}: ${p.phone} ${childInfo ? `[ولي ${childInfo}]` : ""}`;
        }).join("\n");

        return {
            total: targetParents.length,
            cleanPhonesCount: cleanPhones.length,
            commaSeparated,
            namedList
        };
    }, [filteredParents, selectedParentIds, players]);

    const handleCopyWhatsAppComma = () => {
        navigator.clipboard.writeText(whatsAppData.commaSeparated);
        setCopiedWhatsAppFormat(true);
        setTimeout(() => setCopiedWhatsAppFormat(false), 2500);
    };

    const handleCopyNamedList = () => {
        navigator.clipboard.writeText(whatsAppData.namedList);
        setCopiedListFormat(true);
        setTimeout(() => setCopiedListFormat(false), 2500);
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // SINGLE-CLICK DIRECT MESSAGE TEMPLATES
    // ─────────────────────────────────────────────────────────────────────────────
    const getGeneratedMessage = (parent: any, templateType: string) => {
        if (!parent) return "";
        const children = getParentChildren(parent);
        const childName = children[0]?.name || "ابنكم";
        const category = children[0]?.category || "";
        const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
        const rip = academySettings?.baridi_rip || "00799999000000000000";
        const baridiName = academySettings?.baridi_name || academyName;

        switch (templateType) {
            case "subscription":
                return `السلام عليكم ولي أمر اللاعب المحترم السيد *${parent.full_name}*،\n\nنود تذكيركم بتسديد اشتراك الشهر الحالي الخاص باللاعب *${childName}* في *${academyName}*.\n\n💳 *بيانات الدفع عبر بريدي موب (BaridiMob RIP):*\n*${rip}*\nباسم: ${baridiName}\n\nشاكرين لكم حسن تعاونكم الدائم وثقتكم بنا. ⚽`;

            case "training":
                return `تحية طيبة السيد *${parent.full_name}*،\n\nنذكركم بموعد التدريب / المباراة القادمة للاعب *${childName}* ضمن فئة *${category}*.\nيرجى التواجد بالملعب في الموعد المحدد مع الزي الرياضي الكامل.\n\nبالتوفيق لبطلنا! 🏃‍♂️⚽`;

            case "praise":
                return `مرحباً السيد *${parent.full_name}*،\n\nيسر الطاقم الفني في *${academyName}* أن يحيطكم علماً بالمستوى الرائع والالتزام المميز الذي أظهره اللاعب *${childName}* في الحصص التدريبية الأخيرة. 🌟\n\nيمكنكم معاينة بطاقته الرقمية وتقييماته عبر فضاء الأولياء.\nمع تحيات إدارة الأكاديمية.`;

            default:
                return customDirectMsg;
        }
    };

    const handleSendDirectWhatsApp = (parent: any) => {
        const text = getGeneratedMessage(parent, directMsgTemplate);
        const phone = formatAlgerianPhone(parent.phone);
        if (!phone) {
            alert("رقم هاتف الولي غير صالح.");
            return;
        }
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
        setDirectMsgParent(null);
    };

    const handleSendDirectInApp = async (parent: any) => {
        const text = getGeneratedMessage(parent, directMsgTemplate);
        setIsSending(true);
        try {
            await api.addParentNotification({
                parent_id: parent.id,
                parent_identifier: parent.username || parent.phone,
                title: directMsgTemplate === "subscription" ? "تذكير بالاشتراك الشهري" : "إشعار إداري",
                message: text,
                type: "عام"
            });
            alert("تم إرسال الإشعار بنجاح إلى فضاء الولي.");
            setDirectMsgParent(null);
        } catch (e: any) {
            alert("فشل الإرسال: " + (e.message || "خطأ غير معروف"));
        } finally {
            setIsSending(false);
        }
    };

    const handleEditParent = (parent: any) => {
        setEditingParent(parent);
        setIsEditModalOpen(true);
    };

    const handleUpdateParent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const rawEmail = (formData.get("email") as string) || "";
        const data = {
            full_name: ((formData.get("full_name") as string) || "").trim(),
            phone: ((formData.get("phone") as string) || "").trim(),
            username: ((formData.get("username") as string) || "").trim(),
            password: ((formData.get("password") as string) || "").trim(),
            email: rawEmail.trim() !== "" ? rawEmail.trim() : null,
        };

        try {
            await api.updateParent(editingParent.id, data);
            await loadData();
            setIsEditModalOpen(false);
            setEditingParent(null);
            alert("تم تحديث بيانات الولي بنجاح!");
        } catch (error: any) {
            console.error("Failed to update parent:", error);
            alert("فشل تحديث بيانات الولي: " + (error?.message || "خطأ غير معروف"));
        }
    };

    const handleDeleteParent = async (parent: any) => {
        if (!confirm(`هل أنت متأكد من حذف حساب الولي: ${parent.full_name}؟`)) return;
        try {
            await api.deleteParent(parent.id);
            await loadData();
        } catch (error: any) {
            console.error("Delete parent error:", error);
            alert("فشل حذف حساب الولي: " + (error?.message || "خطأ غير معروف"));
        }
    };

    const handleImpersonate = (parent: any) => {
        impersonateParent(parent);
        navigate("/parent-dashboard");
    };

    const togglePassword = (id: number) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-6 pb-24" dir="rtl">
            {/* Header with Title and Main Action Buttons */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-white font-tajawal flex items-center gap-3">
                        <Users className="h-7 w-7 text-emerald-500" />
                        إدارة وتواصل أولياء الأمور
                    </h2>
                    <p className="text-zinc-400 mt-1 text-sm font-tajawal">
                        تصدير القوائم، مجموعات واتساب، والإرسال الفردي والجماعي بنقرة واحدة.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Export Excel Button */}
                    <Button
                        onClick={() => handleExportExcel(false)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-5 rounded-2xl shadow-lg shadow-emerald-950/40 text-xs font-tajawal"
                    >
                        <FileSpreadsheet className="h-4 w-4 ml-2" />
                        تصدير Excel مصنف 📊
                    </Button>

                    {/* WhatsApp Group Generator Button */}
                    <Button
                        onClick={() => setIsWhatsAppGroupModalOpen(true)}
                        className="bg-[#25D366] hover:bg-[#1ebd5a] text-zinc-950 font-black h-11 px-5 rounded-2xl shadow-lg shadow-green-950/40 text-xs font-tajawal"
                    >
                        <MessageCircle className="h-4 w-4 ml-2 text-zinc-950" />
                        أرقام مجموعة واتساب 💬
                    </Button>

                    {/* Bulk In-App Notification Button */}
                    <Button
                        onClick={() => setIsBulkModalOpen(true)}
                        variant="outline"
                        className="border-zinc-700 hover:border-zinc-600 bg-zinc-800 text-zinc-200 font-bold h-11 px-4 rounded-2xl text-xs font-tajawal"
                    >
                        <Send className="h-4 w-4 ml-2" />
                        إرسال تنبيه عام 📢
                    </Button>
                </div>
            </div>

            {/* Filters Bar: Search + Category + Team/Group */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Search Input */}
                    <div className="relative md:col-span-5">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="بحث بالاسم، رقم الهاتف، أو اسم اللاعب..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-10 pl-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-tajawal"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="md:col-span-3">
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setSelectedTeamId("all");
                            }}
                            className="h-11 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-tajawal"
                        >
                            <option value="all">كل الفئات العمرية ({availableCategories.length})</option>
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>فئة {cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Team / Group Filter */}
                    <div className="md:col-span-4">
                        <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="h-11 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-tajawal"
                        >
                            <option value="all">كل الأفواج والفرق ({filteredTeams.length})</option>
                            {filteredTeams.map(t => (
                                <option key={t.team_id} value={t.team_id}>{t.name} ({t.category})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Status Bar & Select All Toggle */}
                <div className="flex justify-between items-center text-xs text-zinc-400 pt-2 border-t border-zinc-800/60 font-tajawal">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 font-bold transition-all"
                        >
                            {selectedParentIds.size === filteredParents.length && filteredParents.length > 0 ? (
                                <CheckSquare className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <Square className="h-4 w-4 text-zinc-500" />
                            )}
                            تحديد الكل ({filteredParents.length})
                        </button>

                        <span>النتائج المعروضة: <strong className="text-white">{filteredParents.length}</strong> ولي أمر</span>
                    </div>

                    {(selectedCategory !== "all" || selectedTeamId !== "all" || searchQuery) && (
                        <button
                            onClick={() => {
                                setSelectedCategory("all");
                                setSelectedTeamId("all");
                                setSearchQuery("");
                            }}
                            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                        >
                            <X className="h-3.5 w-3.5" /> إعادة ضبط الفلاتر
                        </button>
                    )}
                </div>
            </div>

            {/* Parents Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center text-zinc-500 font-tajawal flex flex-col items-center justify-center">
                        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-3" />
                        <span>جاري تحميل بيانات أولياء الأمور والأفواج...</span>
                    </div>
                ) : filteredParents.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
                        <Users className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500 font-bold font-tajawal">لا يوجد أولياء يطابقون خيارات البحث أو الفلترة الحالية.</p>
                    </div>
                ) : filteredParents.map((parent) => {
                    const children = getParentChildren(parent);
                    const isSelected = selectedParentIds.has(parent.id);

                    return (
                        <Card
                            key={parent.id}
                            className={`bg-zinc-900 border transition-all group overflow-hidden relative ${
                                isSelected ? "border-emerald-500 bg-emerald-950/10 shadow-lg shadow-emerald-950/20" : "border-zinc-800 hover:border-zinc-700"
                            }`}
                        >
                            {/* Checkbox Selector at Top-Right */}
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={() => toggleSelectParent(parent.id)}
                                    className="p-1 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 transition-all"
                                    title="تحديد"
                                >
                                    {isSelected ? (
                                        <CheckSquare className="h-5 w-5 text-emerald-500" />
                                    ) : (
                                        <Square className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400" />
                                    )}
                                </button>
                            </div>

                            {/* Admin Controls at Top-Left */}
                            <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); handleEditParent(parent); }}
                                    className="h-8 px-2.5 bg-zinc-900/90 border-zinc-700 text-zinc-300 hover:text-emerald-400 hover:bg-emerald-500/10 font-tajawal text-xs rounded-lg"
                                >
                                    <Edit className="h-3 w-3 ml-1" />
                                    تعديل
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteParent(parent); }}
                                    className="h-8 px-2 bg-zinc-900/90 border-zinc-700 text-zinc-300 hover:text-rose-400 hover:bg-rose-500/10 font-tajawal text-xs rounded-lg"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>

                            <CardContent className="p-6 pt-12">
                                <div className="flex items-center gap-3.5 mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-black">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="font-black text-white text-base truncate font-tajawal">{parent.full_name}</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                            معرف الولي: #{parent.id}
                                        </p>
                                    </div>
                                </div>

                                {/* Registered Children & Category/Team */}
                                <div className="space-y-1.5 mb-4 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80">
                                    <p className="text-[10px] text-zinc-400 font-black uppercase mb-1 flex items-center justify-between">
                                        <span>الأبناء المسجلين:</span>
                                        <span className="text-emerald-500 font-bold">{children.length} لاعب</span>
                                    </p>
                                    {children.length === 0 ? (
                                        <p className="text-xs text-zinc-600 font-bold italic">لم يتم ربط لاعبين بهذا الحساب</p>
                                    ) : (
                                        children.map((child, idx) => {
                                            const teamName = teams.find(t => t.team_id === child.team_id)?.name || "فوج عام";
                                            return (
                                                <div key={idx} className="flex justify-between items-center text-xs py-1 px-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-emerald-100 font-tajawal">
                                                    <span className="font-bold truncate">{child.name}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md font-bold">{teamName}</span>
                                                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-bold">{child.category}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Phone & Contact */}
                                <div className="space-y-2 text-xs text-zinc-400 mb-5 font-tajawal">
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800/60">
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <Phone className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="font-mono text-sm">{parent.phone || "غير مسجل"}</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-500 font-mono">@{parent.username}</span>
                                    </div>
                                </div>

                                {/* Action Buttons: Single-click WhatsApp & In-app Message */}
                                <div className="space-y-2">
                                    {/* Direct WhatsApp Quick Button */}
                                    <button
                                        onClick={() => {
                                            setDirectMsgParent(parent);
                                            setDirectMsgTemplate("subscription");
                                        }}
                                        className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-zinc-950 font-black h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-tajawal shadow-md shadow-green-950/20 transition-all active:scale-95"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        مراسلة فورية بنقرة واحدة (WhatsApp)
                                    </button>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            onClick={() => { setSelectedParent(parent); setIsMessageModalOpen(true); }}
                                            variant="outline"
                                            className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700 font-bold h-9 rounded-xl font-tajawal text-xs"
                                        >
                                            <Send className="h-3.5 w-3.5 ml-1.5" />
                                            إشعار داخلي
                                        </Button>

                                        <Button
                                            onClick={() => handleImpersonate(parent)}
                                            variant="outline"
                                            className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700 font-bold h-9 rounded-xl font-tajawal text-xs"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                                            معاينة حسابه
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Floating Selection Action Bar */}
            {selectedParentIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-950/95 border-2 border-emerald-500/80 p-3 px-6 rounded-3xl shadow-2xl backdrop-blur-xl flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-2 pl-4 border-l border-zinc-800">
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 font-black text-xs flex items-center justify-center">
                            {selectedParentIds.size}
                        </span>
                        <span className="text-xs font-bold text-white font-tajawal">ولي أمر محدد</span>
                    </div>

                    <div className="flex items-center gap-2 font-tajawal">
                        {/* Export Selected to Excel */}
                        <button
                            onClick={() => handleExportExcel(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            تصدير Excel للمحددين
                        </button>

                        {/* WhatsApp Group Copy for Selected */}
                        <button
                            onClick={() => setIsWhatsAppGroupModalOpen(true)}
                            className="bg-[#25D366] hover:bg-[#1ebd5a] text-zinc-950 font-black h-9 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                            <MessageCircle className="h-3.5 w-3.5" />
                            أرقام واتساب للمحددين
                        </button>

                        {/* Cancel Selection */}
                        <button
                            onClick={() => setSelectedParentIds(new Set())}
                            className="p-2 text-zinc-400 hover:text-rose-400 rounded-xl transition-all"
                            title="إلغاء التحديد"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* SINGLE-CLICK DIRECT MESSAGE MODAL (WhatsApp + In-App) */}
            <Modal
                isOpen={!!directMsgParent}
                onClose={() => setDirectMsgParent(null)}
                title={`رسالة فورية لولي الأمر: ${directMsgParent?.full_name || ""}`}
                size="lg"
            >
                {directMsgParent && (
                    <div className="space-y-4 pt-3 font-tajawal text-right" dir="rtl">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white">{directMsgParent.full_name}</p>
                                    <p className="text-xs text-zinc-400 font-mono">الهاتف: {directMsgParent.phone}</p>
                                </div>
                            </div>
                            <span className="text-xs text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full font-bold">
                                بضغطة زر واحدة ⚡
                            </span>
                        </div>

                        {/* Template Selector Pills */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-zinc-300">اختر نموذج الرسالة السريع:</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <button
                                    onClick={() => setDirectMsgTemplate("subscription")}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                                        directMsgTemplate === "subscription"
                                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md"
                                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                                    }`}
                                >
                                    💳 تذكير اشتراك + BaridiMob
                                </button>

                                <button
                                    onClick={() => setDirectMsgTemplate("training")}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                                        directMsgTemplate === "training"
                                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md"
                                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                                    }`}
                                >
                                    ⚽ تذكير تدريب / مباراة
                                </button>

                                <button
                                    onClick={() => setDirectMsgTemplate("praise")}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                                        directMsgTemplate === "praise"
                                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md"
                                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                                    }`}
                                >
                                    🌟 تهنئة وتقرير فني
                                </button>

                                <button
                                    onClick={() => setDirectMsgTemplate("custom")}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                                        directMsgTemplate === "custom"
                                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md"
                                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                                    }`}
                                >
                                    ✍️ رسالة حرة مخصصة
                                </button>
                            </div>
                        </div>

                        {/* Message Preview Box */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-zinc-300">معاينة الرسالة الجاهزة للإرسال:</label>
                            {directMsgTemplate === "custom" ? (
                                <textarea
                                    value={customDirectMsg}
                                    onChange={(e) => setCustomDirectMsg(e.target.value)}
                                    placeholder="اكتب رسالتك لولي الأمر هنا..."
                                    className="w-full h-36 rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-tajawal"
                                />
                            ) : (
                                <div className="w-full h-36 rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs text-zinc-200 overflow-y-auto whitespace-pre-wrap leading-relaxed font-tajawal">
                                    {getGeneratedMessage(directMsgParent, directMsgTemplate)}
                                </div>
                            )}
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                            <Button
                                variant="outline"
                                onClick={() => setDirectMsgParent(null)}
                                className="border-zinc-800 text-zinc-400 h-10 rounded-xl w-full sm:w-auto"
                            >
                                إلغاء
                            </Button>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button
                                    onClick={() => handleSendDirectInApp(directMsgParent)}
                                    disabled={isSending}
                                    variant="outline"
                                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold h-10 px-4 rounded-xl text-xs flex-1 sm:flex-none"
                                >
                                    <Send className="h-3.5 w-3.5 ml-1.5" />
                                    إشعار بالمنصة
                                </Button>

                                <button
                                    onClick={() => handleSendDirectWhatsApp(directMsgParent)}
                                    className="bg-[#25D366] hover:bg-[#1ebd5a] text-zinc-950 font-black h-10 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-950/40 flex-1 sm:flex-none transition-all active:scale-95"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    إرسال عبر WhatsApp الآن 🚀
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* WHATSAPP GROUP EXPORTER MODAL */}
            <Modal
                isOpen={isWhatsAppGroupModalOpen}
                onClose={() => setIsWhatsAppGroupModalOpen(false)}
                title="تصدير قائمة أرقام الأولياء لمجموعة واتساب (WhatsApp Group)"
                size="lg"
            >
                <div className="space-y-4 pt-3 font-tajawal text-right" dir="rtl">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
                        <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-200/90 leading-relaxed space-y-1">
                            <p className="font-bold">
                                جاهزة للصق في واتساب: تم استخراج {whatsAppData.cleanPhonesCount} رقم هاتف صحيح بتنسيق دولي (+213).
                            </p>
                            <p className="text-zinc-400">
                                يمكنك نسخ الأرقام بنقرة واحدة ولصقها مباشرة في حقل "إضافة مشاركين" بمجموعة واتساب أو قائمة الرسائل الجماعية (Broadcast).
                            </p>
                        </div>
                    </div>

                    {/* Format 1: Comma-Separated for Group Invite */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-zinc-300">
                                1. صيغة إضافة الأعضاء (مفصولة بفواصل):
                            </label>
                            <button
                                onClick={handleCopyWhatsAppComma}
                                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-lg flex items-center gap-1 transition-all"
                            >
                                {copiedWhatsAppFormat ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copiedWhatsAppFormat ? "تم نسخ الأرقام!" : "نسخ أرقام الهواتف"}
                            </button>
                        </div>
                        <textarea
                            readOnly
                            value={whatsAppData.commaSeparated}
                            className="w-full h-24 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 font-mono focus:outline-none select-all"
                        />
                    </div>

                    {/* Format 2: Named List */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-zinc-300">
                                2. القائمة الاسمية المنظمة (اسم الولي واللاعب):
                            </label>
                            <button
                                onClick={handleCopyNamedList}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1 rounded-lg flex items-center gap-1 transition-all"
                            >
                                {copiedListFormat ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copiedListFormat ? "تم نسخ القائمة!" : "نسخ القائمة الاسمية"}
                            </button>
                        </div>
                        <textarea
                            readOnly
                            value={whatsAppData.namedList}
                            className="w-full h-32 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 font-mono focus:outline-none select-all"
                        />
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                        <span className="text-xs text-zinc-500 font-bold">
                            إجمالي الأولياء: {whatsAppData.total}
                        </span>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsWhatsAppGroupModalOpen(false)}
                                className="border-zinc-800 text-zinc-400 h-10 rounded-xl"
                            >
                                إغلاق
                            </Button>

                            <button
                                onClick={() => window.open("https://web.whatsapp.com", "_blank")}
                                className="bg-[#25D366] hover:bg-[#1ebd5a] text-zinc-950 font-black h-10 px-5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
                            >
                                <Smartphone className="h-4 w-4" />
                                فتح واتساب ويب 🌐
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* In-App Private Message Modal */}
            <Modal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} title={`إرسال إشعار لمنصة: ${selectedParent?.full_name}`} size="md">
                <div className="space-y-4 pt-4" dir="rtl">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                        <p className="text-xs text-blue-200/80 leading-relaxed font-tajawal">
                            ستظهر هذه الرسالة لولي الأمر في "فضاء الأولياء" تحت قسم الإشعارات الخاصة.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 font-tajawal">محتوى الإشعار</label>
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="اكتب رسالتك لولي الأمر هنا..."
                            className="w-full h-32 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-blue-500 focus:outline-none placeholder:text-zinc-700 font-tajawal"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsMessageModalOpen(false)} className="border-zinc-800 text-zinc-300 font-tajawal">إلغاء</Button>
                        <Button onClick={async () => {
                            if (!selectedParent || !messageText.trim()) return;
                            setIsSending(true);
                            try {
                                await api.addParentNotification({
                                    parent_id: selectedParent.id,
                                    parent_identifier: selectedParent.username || selectedParent.phone,
                                    title: "رسالة إدارية",
                                    message: messageText,
                                    type: "عام"
                                });
                                setIsMessageModalOpen(false);
                                setMessageText("");
                                alert("تم إرسال الرسالة بنجاح لمنصة الولي.");
                            } catch (e: any) {
                                alert("فشل الإرسال: " + (e.message || "خطأ غير معروف"));
                            } finally {
                                setIsSending(false);
                            }
                        }} disabled={isSending || !messageText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 font-tajawal">
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 ml-2" /> إرسال الآن</>}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Bulk Notification Modal */}
            <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="📢 إرسال تنبيه عام للأولياء" size="md">
                <div className="space-y-4 pt-4" dir="rtl">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                        <Info className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <p className="text-xs text-emerald-200/80 leading-relaxed font-tajawal">
                            سيتم إرسال هذا التنبيه لـ ({filteredParents.length}) ولي أمر في القائمة المفلترة حالياً.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 font-tajawal">محتوى التنبيه</label>
                        <textarea
                            value={bulkMessage}
                            onChange={(e) => setBulkMessage(e.target.value)}
                            placeholder="مثال: نذكركم بأن موعد التدريب غداً قد تم تقديمه إلى الساعة 4:30 مساءً."
                            className="w-full h-32 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-700 font-tajawal"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                        <Button variant="outline" onClick={() => setIsBulkModalOpen(false)} className="border-zinc-800 text-zinc-300 font-tajawal">إلغاء</Button>
                        <Button
                            onClick={async () => {
                                if (!bulkMessage.trim()) return;
                                setBulkSending(true);
                                try {
                                    const promises = filteredParents.map(p =>
                                        api.addParentNotification({
                                            parent_id: p.id,
                                            parent_identifier: p.username || p.phone,
                                            title: "إشعار عام من الأكاديمية",
                                            message: bulkMessage,
                                            type: "عام"
                                        })
                                    );
                                    await Promise.allSettled(promises);
                                    alert("تم إرسال الإشعار لجميع الأولياء بنجاح.");
                                    setIsBulkModalOpen(false);
                                    setBulkMessage("");
                                } catch (e) {
                                    alert("حدث خطأ أثناء الإرسال الجماعي.");
                                } finally {
                                    setBulkSending(false);
                                }
                            }}
                            disabled={bulkSending || !bulkMessage.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 font-tajawal"
                        >
                            {bulkSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 ml-2" /> إرسال للكل</>}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Parent Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تعديل بيانات الولي" size="md">
                <form key={editingParent?.id} onSubmit={handleUpdateParent} className="space-y-4 pt-4" dir="rtl">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 font-tajawal">الاسم الكامل</label>
                            <input required name="full_name" defaultValue={editingParent?.full_name} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 font-tajawal">رقم الهاتف</label>
                            <input required name="phone" defaultValue={editingParent?.phone} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 font-tajawal">اسم المستخدم</label>
                            <input required name="username" defaultValue={editingParent?.username} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 font-tajawal">كلمة المرور</label>
                            <input required name="password" defaultValue={editingParent?.password} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 font-tajawal">البريد الإلكتروني (اختياري)</label>
                        <input name="email" type="email" defaultValue={editingParent?.email || ""} placeholder="example@email.com" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-zinc-800 text-zinc-300 font-tajawal">إلغاء</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 font-tajawal">حفظ التغييرات</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
