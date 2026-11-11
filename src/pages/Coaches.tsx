import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, Search, User, Phone, Mail, Award, Users, Shield, 
  Loader2, Info, Star, Activity, Heart, Trash2, Edit, 
  CreditCard, LayoutGrid, List, Camera, Upload, Building,
  CheckCircle, FileText, TrendingUp, Dumbbell, Trophy, Filter,
  MessageCircle, ExternalLink, Calendar, DollarSign, Clock, Eye, 
  Printer, ChevronDown, Check, AlertCircle, Sparkles, X, ArrowUpRight
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { supabase } from "@/services/supabaseClient";
import { PrintPortal } from "@/components/PrintPortal";
import { QRCodeSVG } from "qrcode.react";

const MATCH_MULTIPLIERS: Record<string, number> = { friendly: 1, official: 1.5, cup: 2 };

// Image compression helper to store compact base64 profile pictures in localStorage
const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const max_size = 150; // Ultra compact width/height for database/localStorage safety
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > max_size) {
          height *= max_size / width;
          width = max_size;
        }
      } else {
        if (height > max_size) {
          width *= max_size / height;
          height = max_size;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7)); // High compression Jpeg
    };
    img.onerror = () => resolve(base64Str);
  });
};

// Bag number extraction helper
const extractBagNumber = (notes?: string) => {
  if (!notes) return "";
  const match = notes.match(/\[(?:رقم الحقيبة|رقم القطعة|رقم الحقيبة \/ القطعة):\s*([^\]]+)\]/i);
  return match ? match[1].trim() : "";
};

// WhatsApp clean link builder
const getWhatsAppUrl = (phone?: string, coachName?: string) => {
  if (!phone) return null;
  let clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('0')) {
    clean = '213' + clean.slice(1);
  } else if (clean.startsWith('+213')) {
    clean = clean.slice(1);
  } else if (!clean.startsWith('213')) {
    clean = '213' + clean;
  }
  const text = encodeURIComponent(`السلام عليكم كوتش ${coachName || ''}، تحيات إدارة أكاديمية أجيال وادي العثمانية AGOA.`);
  return `https://wa.me/${clean}?text=${text}`;
};

export function Coaches() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  
  // Modals & Navigation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<any>(null);
  const [coachToDelete, setCoachToDelete] = useState<number | null>(null);
  const [selectedCoachDetails, setSelectedCoachDetails] = useState<any | null>(null);
  const [coachModalTab, setCoachModalTab] = useState<'activity' | 'players' | 'account'>('activity');
  const [playerSearchInModal, setPlayerSearchInModal] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<'name' | 'sessions' | 'payout' | 'role'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Month selector (default current month)
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Print Portals
  const [printCoach, setPrintCoach] = useState<any | null>(null);
  const [printStaffRoster, setPrintStaffRoster] = useState(false);
  const [printCoachStatement, setPrintCoachStatement] = useState<any | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [academySettings, setAcademySettings] = useState<any>(null);

  // Photo Upload States
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const [categoriesData, teamsData, coachesData, playersData, kitsData, settingsData] = await Promise.all([
        api.getCategories().catch(() => []),
        api.getTeams().catch(() => []),
        api.getCoaches().catch(() => []),
        api.getPlayers().catch(() => []),
        api.getKits().catch(() => []),
        api.getAcademySettings().catch(() => null),
      ]);

      setCategories(categoriesData || []);
      setTeams(teamsData || []);
      setPlayers(playersData || []);
      setKits(kitsData || []);
      setAcademySettings(settingsData);

      const enriched = (coachesData || []).map((c: any) => ({
        ...c,
        specialization: c.specialty || c.specialization || 'مدير فني / مدرب رئيسي',
        photo_url: localStorage.getItem(`coach_photo_${c.coach_id}`) || null
      }));
      setCoaches(enriched);
    } catch (e) {
      console.error("Failed to load initial coaches data:", e);
    }

    // Load trainings for selected month
    try {
      const { data: tData } = await supabase
        .from('training')
        .select('*')
        .like('date', `${selectedMonth}%`);
      setTrainings(tData || []);
    } catch (e) {
      console.error("Failed to load trainings:", e);
    }

    // Load matches for selected month
    try {
      const { data: mData } = await supabase
        .from('ems_matches')
        .select('*')
        .like('match_date', `${selectedMonth}%`);
      setMatches(mData || []);
    } catch (e) {
      console.error("Failed to load matches:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const compressed = await compressImage(rawBase64);
        setPhotoPreview(compressed);
        setPhotoBase64(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCoach = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const teamIdVal = formData.get("team_id") as string;
    let selectedTeamId: number | null = null;
    let selectedCategory: string | null = null;

    if (teamIdVal && teamIdVal.startsWith('cat:')) {
      selectedCategory = teamIdVal.replace('cat:', '');
    } else if (teamIdVal) {
      selectedTeamId = Number(teamIdVal);
      const team = teams.find(t => t.team_id === selectedTeamId);
      selectedCategory = team?.category || null;
    }

    const coachData: any = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      license: formData.get("license") as string,
      specialty: formData.get("specialization") as string || 'مدير فني / مدرب رئيسي',
      team_id: selectedTeamId,
      category: selectedCategory,
      username: formData.get("username") as string || null,
      salary_per_session: Number(formData.get("salary_per_session")) || 1000,
    };

    const password = formData.get("password") as string;
    if (password) {
      coachData.password = password;
    }

    try {
      let savedCoach: any = null;
      if (editingCoach) {
        savedCoach = await api.updateCoach(editingCoach.coach_id, coachData);
        alert("تم تحديث بيانات المدرب بنجاح");
      } else {
        if (!password) {
          coachData.password = 'coach123';
        }
        savedCoach = await api.addCoach(coachData);
        alert("تم إضافة المدرب بنجاح");
      }

      // Save photo to localStorage
      const targetId = editingCoach ? editingCoach.coach_id : savedCoach?.coach_id;
      if (targetId) {
        if (photoBase64) {
          localStorage.setItem(`coach_photo_${targetId}`, photoBase64);
        } else if (!photoPreview) {
          localStorage.removeItem(`coach_photo_${targetId}`);
        }

        // Sync with teams table so the specific squad/team points to this coach
        if (selectedTeamId) {
          try {
            await supabase.from('teams').update({ coach_id: targetId }).eq('team_id', selectedTeamId);
          } catch (te) {
            console.warn("Could not sync team coach_id:", te);
          }
        }
      }

      await loadData();
      setIsModalOpen(false);
      setEditingCoach(null);
      setPhotoPreview(null);
      setPhotoBase64("");
    } catch (error: any) {
      console.error("Failed to save coach:", error);
      alert("فشل حفظ بيانات المدرب: " + (error.message || "خطأ غير معروف"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoach = async (id: number) => {
    setCoachToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (coachToDelete) {
      try {
        await api.deleteCoach(coachToDelete);
        localStorage.removeItem(`coach_photo_${coachToDelete}`);
        if (selectedCoachDetails?.coach_id === coachToDelete) {
          setSelectedCoachDetails(null);
        }
        await loadData();
        alert("تم حذف العضو من الطاقم الفني بنجاح");
      } catch (error: any) {
        console.error("Failed to delete coach:", error);
        alert("فشل حذف العضو: " + (error.message || "خطأ غير معروف"));
      } finally {
        setCoachToDelete(null);
        setIsConfirmOpen(false);
      }
    }
  };

  const handleEditCoach = (coach: any) => {
    setEditingCoach(coach);
    setPhotoPreview(coach.photo_url || null);
    setPhotoBase64(coach.photo_url || "");
    setIsModalOpen(true);
  };

  // Ultra custom styling details for each role
  const getRoleTheme = (role: string) => {
    switch (role) {
      case 'مدير فني / مدرب رئيسي':
        return {
          id: 'director',
          bg: 'from-amber-950/30 via-zinc-900/95 to-amber-900/15 border-amber-500/35 hover:border-amber-400 hover:shadow-amber-500/10',
          badgeBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          text: 'text-amber-400',
          accent: 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600',
          roleName: 'مدير فني / مدرب رئيسي',
          avatarBorder: 'border-amber-400/50 shadow-amber-500/25',
          desc: 'القيادة الفنية والتخطيط الاستراتيجي العام للأكاديمية 👑',
          color: '#d97706',
          glow: '#d97706'
        };
      case 'مساعد مدرب':
        return {
          id: 'assistant',
          bg: 'from-emerald-950/30 via-zinc-900/95 to-emerald-900/15 border-emerald-500/35 hover:border-emerald-400 hover:shadow-emerald-500/10',
          badgeBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          text: 'text-emerald-400',
          accent: 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600',
          roleName: 'مساعد مدرب',
          avatarBorder: 'border-emerald-400/50 shadow-emerald-500/25',
          desc: 'التنظيم الميداني وبناء وتطبيق الخطط التكتيكية 📋',
          color: '#059669',
          glow: '#059669'
        };
      case 'مدرب حراس مرمى':
        return {
          id: 'goalkeeper',
          bg: 'from-cyan-950/30 via-zinc-900/95 to-cyan-900/15 border-cyan-500/35 hover:border-cyan-400 hover:shadow-cyan-500/10',
          badgeBg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
          text: 'text-cyan-400',
          accent: 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600',
          roleName: 'مدرب حراس مرمى',
          avatarBorder: 'border-cyan-400/50 shadow-cyan-500/25',
          desc: 'حماية العرين وصقل مهارات رد الفعل لحراس المرمى 🧤',
          color: '#0891b2',
          glow: '#0891b2'
        };
      case 'معد بدني':
        return {
          id: 'fitness',
          bg: 'from-orange-950/30 via-zinc-900/95 to-orange-900/15 border-orange-500/35 hover:border-orange-400 hover:shadow-orange-500/10',
          badgeBg: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
          text: 'text-orange-400',
          accent: 'bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600',
          roleName: 'معد بدني',
          avatarBorder: 'border-orange-400/50 shadow-orange-500/25',
          desc: 'رفع منسوب اللياقة والتحمل العضلي والوقاية من الإصابات ⚡',
          color: '#ea580c',
          glow: '#ea580c'
        };
      case 'محلل أداء':
        return {
          id: 'analyst',
          bg: 'from-purple-950/30 via-zinc-900/95 to-purple-900/15 border-purple-500/35 hover:border-purple-400 hover:shadow-purple-500/10',
          badgeBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
          text: 'text-purple-400',
          accent: 'bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600',
          roleName: 'محلل أداء',
          avatarBorder: 'border-purple-400/50 shadow-purple-500/25',
          desc: 'رصد البيانات الرقمية وتفكيك تحركات الخصوم بالفيديو 📊',
          color: '#7c3aed',
          glow: '#7c3aed'
        };
      case 'طبيب / معالج طبيعي':
        return {
          id: 'medical',
          bg: 'from-rose-950/30 via-zinc-900/95 to-rose-900/15 border-rose-500/35 hover:border-rose-400 hover:shadow-rose-500/10',
          badgeBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
          text: 'text-rose-400',
          accent: 'bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600',
          roleName: 'طبيب / معالج طبيعي',
          avatarBorder: 'border-rose-400/50 shadow-rose-500/25',
          desc: 'الرعاية الطبية والتشخيص الفوري ومتابعة تأهيل اللاعبين 🩺',
          color: '#e11d48',
          glow: '#e11d48'
        };
      default:
        return {
          id: 'admin',
          bg: 'from-zinc-800/25 via-zinc-900/95 to-zinc-850/15 border-zinc-700/35 hover:border-zinc-500 hover:shadow-zinc-500/10',
          badgeBg: 'bg-zinc-700/20 text-zinc-300 border border-zinc-700/30',
          text: 'text-zinc-300',
          accent: 'bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-600',
          roleName: role || 'مسؤول إداري',
          avatarBorder: 'border-zinc-600/40 shadow-zinc-500/25',
          desc: 'التنسيق الإداري، اللوجستيات، وإدارة الشؤون التنظيمية للفرق 🏛️',
          color: '#71717a',
          glow: '#71717a'
        };
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'مدير فني / مدرب رئيسي':
        return <Award className="h-4 w-4" />;
      case 'مساعد مدرب':
        return <Users className="h-4 w-4" />;
      case 'مدرب حراس مرمى':
        return <Shield className="h-4 w-4" />;
      case 'معد بدني':
        return <Activity className="h-4 w-4" />;
      case 'محلل أداء':
        return <Star className="h-4 w-4" />;
      case 'طبيب / معالج طبيعي':
        return <Heart className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  const getTeamName = (coach: any) => {
    const coachId = Number(coach.coach_id);
    let team = coach.team_id ? teams.find(t => t.team_id === coach.team_id) : null;
    if (!team) {
      team = teams.find(t => Number(t.coach_id) === coachId);
    }
    if (team) {
      return `فئة ${team.category} (${team.team_name})`;
    }
    return coach.category ? `فئة ${coach.category}` : "غير محدد";
  };

  // Returns session stats and records for a given coach for the selected month
  const getCoachMonthStats = (coach: any) => {
    const coachId = Number(coach.coach_id);
    const coachTeamIds = teams
      .filter(tm => Number(tm.coach_id) === coachId)
      .map(tm => Number(tm.team_id));
    if (coach.team_id && !coachTeamIds.includes(Number(coach.team_id))) {
      coachTeamIds.push(Number(coach.team_id));
    }

    const coachTrainings = trainings.filter(t => {
      if (t.coach_id && Number(t.coach_id) === coachId) return true;
      if (t.team_id && coachTeamIds.includes(Number(t.team_id))) return true;
      if (!t.coach_id && !t.team_id && coachTeamIds.length === 0 && coach.category && t.category === coach.category) return true;
      return false;
    });

    const coachMatches = matches.filter(m => {
      if (m.coach_id && Number(m.coach_id) === coachId) return true;
      if (m.team_id && coachTeamIds.includes(Number(m.team_id))) return true;
      if (!m.coach_id && !m.team_id && coachTeamIds.length === 0 && coach.category && m.category === coach.category) return true;
      return false;
    });

    const matchEquivSessions = coachMatches.reduce((sum, m) => sum + (MATCH_MULTIPLIERS[m.match_type || 'official'] ?? 1), 0);
    const totalSessions = coachTrainings.length + matchEquivSessions;
    const rate = Number(coach.salary_per_session) || 1000;

    return {
      trainingCount: coachTrainings.length,
      matchCount: coachMatches.length,
      matchEquivSessions,
      totalSessions,
      monthlyAmount: totalSessions * rate,
      rate,
      coachTrainings,
      coachMatches,
    };
  };

  // Returns players assigned STRICTLY to the coach's specific team/squad (فوج)
  const getCoachPlayers = (coach: any) => {
    if (!coach) return [];
    const coachId = Number(coach.coach_id);
    const coachTeamIds = teams
      .filter(tm => Number(tm.coach_id) === coachId)
      .map(tm => Number(tm.team_id));
    if (coach.team_id && !coachTeamIds.includes(Number(coach.team_id))) {
      coachTeamIds.push(Number(coach.team_id));
    }

    if (coachTeamIds.length > 0) {
      // STRICT RULE: Only players of this coach's specific squad (e.g. فوج A)
      return players.filter(p => p.team_id && coachTeamIds.includes(Number(p.team_id)));
    }
    if (coach.category) {
      return players.filter(p => p.category === coach.category && !p.team_id);
    }
    return [];
  };

  // Helper to extract bag number from player notes or kits
  const getPlayerBagNumber = (playerId: number, playerNotes?: string) => {
    const k = kits.find((item: any) => Number(item.player_id) === Number(playerId));
    if (k) {
      const bn = extractBagNumber(k.notes);
      if (bn) return bn;
    }
    return extractBagNumber(playerNotes) || "";
  };

  // Global stats
  const globalStats = useMemo(() => {
    const totalCoaches = coaches.length;
    const licensed = coaches.filter(c => c.license && c.license.trim()).length;
    const specializations = new Set(coaches.map(c => c.specialization)).size;
    const totalSessions = coaches.reduce((sum, c) => sum + getCoachMonthStats(c).totalSessions, 0);
    const totalPending = coaches.reduce((sum, c) => sum + getCoachMonthStats(c).monthlyAmount, 0);
    const assignedCategories = new Set(coaches.map(c => c.category).filter(Boolean)).size;
    return { totalCoaches, licensed, specializations, totalSessions, totalPending, assignedCategories };
  }, [coaches, trainings, matches]);

  const uniqueRoles = useMemo(() => Array.from(new Set(coaches.map(c => c.specialization))).sort(), [coaches]);
  const uniqueCategories = useMemo(() => Array.from(new Set(categories.map(c => c.name))).sort(), [categories]);

  // Filtered and Sorted Coaches
  const filteredCoaches = useMemo(() => {
    let result = coaches.filter(c => {
      const q = (searchQuery || "").toLowerCase();
      const matchesSearch =
        (c.name || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.license || "").toLowerCase().includes(q) ||
        (c.specialization || "").toLowerCase().includes(q);
      const matchesRole = filterRole === 'all' || c.specialization === filterRole;
      const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
      return matchesSearch && matchesRole && matchesCategory;
    });

    return result.sort((a, b) => {
      if (sortBy === 'name') return (a.name || "").localeCompare(b.name || "", 'ar');
      if (sortBy === 'sessions') return getCoachMonthStats(b).totalSessions - getCoachMonthStats(a).totalSessions;
      if (sortBy === 'payout') return getCoachMonthStats(b).monthlyAmount - getCoachMonthStats(a).monthlyAmount;
      if (sortBy === 'role') return (a.specialization || "").localeCompare(b.specialization || "", 'ar');
      return 0;
    });
  }, [coaches, searchQuery, filterRole, filterCategory, sortBy, trainings, matches]);

  // Coach Details in Modal
  const activeCoachDetailsStats = useMemo(() => {
    if (!selectedCoachDetails) return null;
    return getCoachMonthStats(selectedCoachDetails);
  }, [selectedCoachDetails, trainings, matches]);

  const activeCoachPlayers = useMemo(() => {
    if (!selectedCoachDetails) return [];
    const list = getCoachPlayers(selectedCoachDetails);
    if (!playerSearchInModal) return list;
    const q = playerSearchInModal.toLowerCase();
    return list.filter(p => 
      (p.name || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      getPlayerBagNumber(p.player_id, p.notes).toLowerCase().includes(q)
    );
  }, [selectedCoachDetails, players, kits, playerSearchInModal]);

  return (
    <div className="space-y-6 font-tajawal text-right" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">إدارة الطاقم الفني والتدريبي</h2>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
              موسم 2026 / 2027
            </span>
          </div>
          <p className="text-zinc-400 mt-1 text-xs sm:text-sm">
            لوحة قيادة تنفيذية شاملة لكافة الأطر الفنية: التراخيص، إنجاز الحصص والمباريات، كشوف المستحقات، وبطاقات الاعتماد.
          </p>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span className="text-zinc-400 font-medium">الشهر:</span>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="bg-transparent text-zinc-100 font-bold focus:outline-none cursor-pointer"
            />
          </div>

          {/* Quick link to Coach Payroll */}
          <Button 
            variant="outline"
            onClick={() => window.location.hash = '#/coach-payroll'}
            className="border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold gap-1.5 rounded-xl h-9"
          >
            <DollarSign className="h-4 w-4 text-emerald-400" />
            سجل المستحقات والمباريات
            <ArrowUpRight className="h-3 w-3 opacity-60" />
          </Button>

          {/* Staff Roster Print */}
          <Button 
            variant="outline"
            onClick={() => setPrintStaffRoster(true)}
            className="border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold gap-1.5 rounded-xl h-9"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            دليل الطاقم الفني (PDF)
          </Button>

          {/* Add Coach Button */}
          <Button 
            onClick={() => { setEditingCoach(null); setPhotoPreview(null); setPhotoBase64(""); setIsModalOpen(true); }} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 h-9 shadow-lg shadow-emerald-950/30 text-xs rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" />
            إضافة إطار فني جديد
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/40 border border-zinc-800 rounded-xl p-3.5 flex flex-col items-center gap-1 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-zinc-800/80 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-white">{globalStats.totalCoaches}</span>
            <span className="text-[11px] text-zinc-400 font-medium">إجمالي الأطر المسجلة</span>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-amber-950/20 border border-amber-800/30 rounded-xl p-3.5 flex flex-col items-center gap-1 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Award className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-2xl font-black text-amber-300">
              {globalStats.licensed}
              <span className="text-xs text-zinc-400 font-normal mr-1">
                ({globalStats.totalCoaches ? Math.round((globalStats.licensed / globalStats.totalCoaches) * 100) : 0}%)
              </span>
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">أطر مرخصة ومعتمدة</span>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-purple-950/20 border border-purple-800/30 rounded-xl p-3.5 flex flex-col items-center gap-1 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Star className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-2xl font-black text-purple-300">{globalStats.specializations}</span>
            <span className="text-[11px] text-zinc-400 font-medium">تخصصات رياضية وفنية</span>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-cyan-950/20 border border-cyan-800/30 rounded-xl p-3.5 flex flex-col items-center gap-1 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-2xl font-black text-cyan-300">{Math.round(globalStats.totalSessions)}</span>
            <span className="text-[11px] text-zinc-400 font-medium">حصص منجزة ({selectedMonth})</span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-zinc-900 to-emerald-950/25 border border-emerald-800/30 rounded-xl p-3.5 flex flex-col items-center gap-1 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-xl font-black text-emerald-400">{globalStats.totalPending.toLocaleString()} دج</span>
            <span className="text-[11px] text-zinc-400 font-medium">المستحقات المقدرة لشهر {selectedMonth}</span>
          </div>
        </div>
      )}

      {/* Advanced Filters & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="بحث فوري: بالاسم، الهاتف، البريد، الرخصة أو التخصص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 pr-10 pl-4 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs font-medium text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">جميع التخصصات ({coaches.length})</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs font-medium text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">جميع الفئات</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>فئة {cat}</option>
            ))}
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs font-medium text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="name">ترتيب: أبجدياً (أ-ي)</option>
            <option value="sessions">ترتيب: الأكثر حصصاً</option>
            <option value="payout">ترتيب: الأعلى مستحقات</option>
            <option value="role">ترتيب: حسب التخصص</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              title="عرض البطاقات"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              title="عرض الجدول"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-500 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="font-bold text-sm">جاري تحميل بيانات وتكليفات الطاقم الفني...</span>
        </div>
      ) : filteredCoaches.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 space-y-2">
          <Info className="h-8 w-8 text-zinc-500 mx-auto" />
          <p className="font-bold">لا يوجد أطر فنية مطابقة لمعايير البحث</p>
          <p className="text-xs text-zinc-500">جرب تغيير فلتر التخصص، الفئة أو كلمة البحث.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* PROFESSIONAL HIGH-UTILITY CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach) => {
            const theme = getRoleTheme(coach.specialization);
            const stats = getCoachMonthStats(coach);
            const coachPlayers = getCoachPlayers(coach);
            const waUrl = getWhatsAppUrl(coach.phone, coach.name);

            return (
              <div 
                key={coach.coach_id}
                className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl flex flex-col justify-between`}
                style={{ boxShadow: `0 10px 30px -15px ${theme.glow}30` }}
              >
                {/* Top Role Indicator Bar */}
                <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: theme.color }} />

                <div className="p-5 space-y-4">
                  {/* Card Header: Avatar & Info */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${theme.badgeBg}`}>
                        {getRoleIcon(coach.specialization)}
                        <span className="truncate">{theme.roleName}</span>
                      </div>
                      <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors leading-tight truncate">
                        {coach.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-zinc-400">
                        <span className="flex items-center gap-1 text-zinc-300">
                          <Award className="h-3.5 w-3.5" style={{ color: theme.color }} />
                          {coach.license || 'معتمد رسمياً'}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400">
                          {coach.salary_per_session || 1000} دج / حصة
                        </span>
                      </div>
                    </div>

                    {/* Photo with Custom Border */}
                    <div className={`h-16 w-16 rounded-2xl bg-zinc-950 flex items-center justify-center text-zinc-400 border-2 ${theme.avatarBorder} overflow-hidden shadow-lg flex-shrink-0 group-hover:scale-105 transition-all duration-300`}>
                      {coach.photo_url ? (
                        <img src={coach.photo_url} className="h-full w-full object-cover" alt={coach.name} />
                      ) : (
                        <User className="h-8 w-8 text-zinc-600" />
                      )}
                    </div>
                  </div>

                  {/* Role Brief */}
                  <div className="text-[11px] p-2 rounded-xl leading-relaxed text-right font-medium border"
                    style={{ 
                      backgroundColor: theme.color + '0c', 
                      borderColor: theme.color + '25',
                      color: theme.color 
                    }}
                  >
                    {theme.desc}
                  </div>

                  {/* Category & Assignment Details */}
                  <div className="text-xs space-y-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 flex items-center gap-1.5 text-[11px]">
                        <Users className="h-3.5 w-3.5" style={{ color: theme.color }} /> الفئة المكلفة:
                      </span>
                      <span className="font-bold text-zinc-200 text-xs truncate max-w-[150px]">
                        {getTeamName(coach)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 flex items-center gap-1.5 text-[11px]">
                        <Trophy className="h-3.5 w-3.5" style={{ color: theme.color }} /> تعداد الفوج:
                      </span>
                      <span className="font-bold text-zinc-300 text-xs">
                        {coachPlayers.length} لاعب مسجل
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60">
                      <span className="text-zinc-500 flex items-center gap-1.5 text-[11px]">
                        <Phone className="h-3.5 w-3.5" style={{ color: theme.color }} /> رقم الهاتف:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-300 text-xs">{coach.phone || '---'}</span>
                        {waUrl && (
                          <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 p-1 rounded-md transition-colors"
                            title="محادثة واتساب مباشرة"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {coach.phone && (
                          <a 
                            href={`tel:${coach.phone}`}
                            className="bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-400 p-1 rounded-md transition-colors"
                            title="اتصال هاتفي مباشر"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LIVE PRACTICAL MONTHLY PERFORMANCE BADGE STRIP */}
                  <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 font-bold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        حصص شهر {selectedMonth}:
                      </span>
                      <span className="font-black text-white bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                        {stats.totalSessions} حصة
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-400">🏋️ تدريبات:</span>
                        <span className="font-bold text-zinc-200">{stats.trainingCount}</span>
                      </div>
                      <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-400">⚽ مباريات:</span>
                        <span className="font-bold text-zinc-200">{stats.matchCount} ({stats.matchEquivSessions} ح)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                      <span className="text-[10px] font-bold text-emerald-400">المستحق للشهر:</span>
                      <span className="font-black text-emerald-300 text-xs">{stats.monthlyAmount.toLocaleString()} دج</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons Footer */}
                <div className="p-5 pt-0">
                  <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-zinc-800/80">
                    {/* View Full Profile Modal */}
                    <Button 
                      onClick={() => { setSelectedCoachDetails(coach); setCoachModalTab('activity'); }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex-1 text-xs py-1.5 h-8 font-black gap-1 rounded-xl transition-all"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-400" />
                      الملف الشامل
                    </Button>

                    {/* Print ID Badge */}
                    <Button 
                      onClick={() => setPrintCoach(coach)}
                      variant="outline" 
                      className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs py-1.5 h-8 font-bold gap-1 rounded-xl transition-all px-2.5"
                      title="طباعة بطاقة مهنية معتمدة"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-amber-400" />
                      بطاقة
                    </Button>

                    {/* Edit */}
                    <Button 
                      onClick={() => handleEditCoach(coach)} 
                      variant="ghost" 
                      className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 text-xs py-1.5 h-8 font-bold px-2 rounded-xl"
                      title="تعديل بيانات المدرب"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>

                    {/* Delete */}
                    <Button 
                      onClick={() => handleDeleteCoach(coach.coach_id)} 
                      variant="ghost" 
                      className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs py-1.5 h-8 font-bold px-2 rounded-xl"
                      title="حذف من الطاقم"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* PREMIUM PRACTICAL TABLE VIEW */
        <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-zinc-400 bg-zinc-950/70 border-b border-zinc-800">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-black">الاسم والوظيفة</th>
                    <th scope="col" className="px-4 py-4 font-bold">الهاتف والتواصل</th>
                    <th scope="col" className="px-4 py-4 font-bold">الرخصة</th>
                    <th scope="col" className="px-4 py-4 font-bold">الفئة المكلفة</th>
                    <th scope="col" className="px-4 py-4 font-bold">حصص شهر {selectedMonth}</th>
                    <th scope="col" className="px-4 py-4 font-bold">المستحق المالي</th>
                    <th scope="col" className="px-5 py-4 font-bold text-left">إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredCoaches.map((coach) => {
                    const stats = getCoachMonthStats(coach);
                    const waUrl = getWhatsAppUrl(coach.phone, coach.name);

                    return (
                      <tr key={coach.coach_id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400 border border-zinc-700 flex-shrink-0">
                              {coach.photo_url ? (
                                <img src={coach.photo_url} className="h-full w-full object-cover" alt="" />
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <span className="font-black text-white block text-sm">{coach.name}</span>
                              <span className="text-[11px] text-zinc-400">{coach.specialization || 'طاقم فني'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-300 font-mono text-xs">{coach.phone || '---'}</span>
                            {waUrl && (
                              <a 
                                href={waUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 p-1 rounded-md"
                                title="واتساب"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-zinc-300 text-xs">
                          <span className="bg-zinc-800/80 px-2 py-1 rounded-lg border border-zinc-700/50">
                            {coach.license || 'معتمد'}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-zinc-300 text-xs font-bold">
                          {getTeamName(coach)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-xs">
                            <span className="font-black text-zinc-100">{stats.totalSessions} حصة</span>
                            <span className="text-[10px] text-zinc-500 block">
                              ({stats.trainingCount} تدريب • {stats.matchCount} مباراة)
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-black text-emerald-400 text-xs">
                            {stats.monthlyAmount.toLocaleString()} دج
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            @{stats.rate} دج
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-left text-xs font-medium">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => { setSelectedCoachDetails(coach); setCoachModalTab('activity'); }}
                              className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 h-8 font-bold gap-1 rounded-lg"
                            >
                              <Eye className="h-3.5 w-3.5 text-emerald-400" /> الملف
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setPrintCoach(coach)} 
                              className="text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 h-8 rounded-lg"
                              title="بطاقة مهنية"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditCoach(coach)} 
                              className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 h-8 rounded-lg"
                              title="تعديل"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteCoach(coach.coach_id)} 
                              className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 h-8 rounded-lg"
                              title="حذف"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
      )}

      {/* FULL COMPREHENSIVE COACH PROFILE MODAL (الملف الفني الشامل للمدرب) */}
      {selectedCoachDetails && activeCoachDetailsStats && (
        <Modal 
          isOpen={!!selectedCoachDetails} 
          onClose={() => setSelectedCoachDetails(null)} 
          title="الملف الفني والتنفيذي الشامل للمدرب"
        >
          <div className="space-y-5 font-tajawal text-right" dir="rtl">
            
            {/* Header Hero Card */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-right">
                <div className="h-20 w-20 rounded-2xl bg-zinc-950 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center text-zinc-500 flex-shrink-0 shadow-lg">
                  {selectedCoachDetails.photo_url ? (
                    <img src={selectedCoachDetails.photo_url} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <User className="h-10 w-10 text-zinc-600" />
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-1">
                    {getRoleIcon(selectedCoachDetails.specialization)}
                    {selectedCoachDetails.specialization}
                  </div>
                  <h3 className="text-xl font-black text-white">{selectedCoachDetails.name}</h3>
                  <p className="text-xs text-zinc-400 font-bold mt-0.5">
                    الفئة المكلفة: <span className="text-emerald-400">{getTeamName(selectedCoachDetails)}</span>
                    <span className="mx-2 text-zinc-600">|</span>
                    الرخصة: <span className="text-amber-400">{selectedCoachDetails.license || 'معتمد'}</span>
                  </p>
                </div>
              </div>

              {/* Direct Quick Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                {getWhatsAppUrl(selectedCoachDetails.phone, selectedCoachDetails.name) && (
                  <a 
                    href={getWhatsAppUrl(selectedCoachDetails.phone, selectedCoachDetails.name)!}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-md"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    واتساب
                  </a>
                )}
                {selectedCoachDetails.phone && (
                  <a 
                    href={`tel:${selectedCoachDetails.phone}`}
                    className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Phone className="h-3.5 w-3.5 text-cyan-400" />
                    اتصال
                  </a>
                )}
                <Button 
                  onClick={() => setPrintCoachStatement(selectedCoachDetails)}
                  variant="outline"
                  className="border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-bold h-8 px-3 rounded-xl gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5 text-amber-400" />
                  كشف المستحقات
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <button
                type="button"
                onClick={() => setCoachModalTab('activity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${coachModalTab === 'activity' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/30' : 'text-zinc-400 hover:text-white bg-zinc-900/40'}`}
              >
                <Activity className="h-3.5 w-3.5" />
                سجل النشاط والمستحقات ({selectedMonth})
              </button>

              <button
                type="button"
                onClick={() => setCoachModalTab('players')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${coachModalTab === 'players' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/30' : 'text-zinc-400 hover:text-white bg-zinc-900/40'}`}
              >
                <Users className="h-3.5 w-3.5" />
                قائمة لاعبي الفوج ({activeCoachPlayers.length})
              </button>

              <button
                type="button"
                onClick={() => setCoachModalTab('account')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${coachModalTab === 'account' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/30' : 'text-zinc-400 hover:text-white bg-zinc-900/40'}`}
              >
                <Shield className="h-3.5 w-3.5" />
                بيانات الدخول والنظام
              </button>
            </div>

            {/* TAB 1: Activity & Payroll Breakdown */}
            {coachModalTab === 'activity' && (
              <div className="space-y-4">
                
                {/* Financial & Sessions Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                    <span className="text-[11px] text-zinc-400 font-bold block">التدريبات المنفذة</span>
                    <span className="text-xl font-black text-cyan-400">{activeCoachDetailsStats.trainingCount}</span>
                  </div>

                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                    <span className="text-[11px] text-zinc-400 font-bold block">المباريات المشرف عليها</span>
                    <span className="text-xl font-black text-amber-400">
                      {activeCoachDetailsStats.matchCount}
                      <span className="text-xs text-zinc-500 font-normal mr-1">
                        (= {activeCoachDetailsStats.matchEquivSessions} ح)
                      </span>
                    </span>
                  </div>

                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                    <span className="text-[11px] text-zinc-400 font-bold block">إجمالي الحصص المعتمدة</span>
                    <span className="text-xl font-black text-white">{activeCoachDetailsStats.totalSessions}</span>
                  </div>

                  <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30 text-center">
                    <span className="text-[11px] text-emerald-400 font-bold block">إجمالي المستحق المالي</span>
                    <span className="text-xl font-black text-emerald-300">
                      {activeCoachDetailsStats.monthlyAmount.toLocaleString()} دج
                    </span>
                  </div>
                </div>

                {/* Conducted Trainings List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                    <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                    التدريبات المسجلة خلال شهر {selectedMonth} ({activeCoachDetailsStats.coachTrainings.length})
                  </h4>
                  {activeCoachDetailsStats.coachTrainings.length === 0 ? (
                    <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/80 text-center text-zinc-500 text-xs">
                      لا توجد حصص تدريبية مسجلة لهذا المدرب في هذا الشهر
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {activeCoachDetailsStats.coachTrainings.map((t: any) => (
                        <div key={t.training_id} className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-zinc-300">{t.date}</span>
                            <span className="text-zinc-500">•</span>
                            <span className="font-bold text-emerald-400">{t.category || getTeamName(selectedCoachDetails)}</span>
                            {t.topic && <span className="text-zinc-400 truncate max-w-[200px]">({t.topic})</span>}
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">1 حصة</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Supervised Matches List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    المباريات المشرف عليها ({activeCoachDetailsStats.coachMatches.length})
                  </h4>
                  {activeCoachDetailsStats.coachMatches.length === 0 ? (
                    <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/80 text-center text-zinc-500 text-xs">
                      لا توجد مباريات مسجلة لهذا المدرب في هذا الشهر
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {activeCoachDetailsStats.coachMatches.map((m: any) => {
                        const mult = MATCH_MULTIPLIERS[m.match_type || 'official'] ?? 1;
                        return (
                          <div key={m.match_id} className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-zinc-300">{m.match_date}</span>
                              <span className="text-zinc-500">•</span>
                              <span className="font-bold text-white">ضد: {m.opponent_name || 'خصم'}</span>
                              <span className="text-amber-400 text-[11px]">({m.match_type === 'official' ? 'رسمية' : m.match_type === 'cup' ? 'كأس' : 'ودية'})</span>
                            </div>
                            <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">
                              {mult} حصة
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: Assigned Squad Players List */}
            {coachModalTab === 'players' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                    <input 
                      type="text" 
                      placeholder="بحث عن لاعب بالاسم أو رقم الحقيبة..."
                      value={playerSearchInModal}
                      onChange={(e) => setPlayerSearchInModal(e.target.value)}
                      className="h-9 w-full rounded-xl border border-zinc-800 bg-zinc-950 pr-9 pl-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-xs text-zinc-400 font-bold flex-shrink-0">
                    الإجمالي: {activeCoachPlayers.length} لاعب
                  </span>
                </div>

                {activeCoachPlayers.length === 0 ? (
                  <div className="bg-zinc-950/40 p-6 rounded-xl border border-zinc-800/80 text-center text-zinc-500 text-xs">
                    لا يوجد لاعبين مقيدين في هذه الفئة حالياً
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {activeCoachPlayers.map((player: any) => {
                      const bagNo = getPlayerBagNumber(player.player_id, player.notes);

                      return (
                        <div key={player.player_id} className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-xs">
                              {player.position || 'لاعب'}
                            </div>
                            <div>
                              <span className="font-bold text-zinc-100 block">{player.name}</span>
                              <span className="text-[11px] text-zinc-400">
                                {player.category} {player.birth_date ? `• تولد ${player.birth_date}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {bagNo ? (
                              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                حقيبة: {bagNo}
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-600">بدون حقيبة</span>
                            )}
                            {player.parent_phone && (
                              <a 
                                href={`tel:${player.parent_phone}`}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded-lg"
                                title={`ولي الأمر: ${player.parent_phone}`}
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Account & Credentials */}
            {coachModalTab === 'account' && (
              <div className="space-y-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-emerald-400">بيانات الحساب الشخصي للمدرب</h4>
                  <p className="text-xs text-zinc-400">
                    تُستخدم هذه البيانات لتسجيل الدخول في تطبيق المدرب المستقل أو دفتر التحضير البيداغوجي.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-500 block">اسم المستخدم (Username):</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {selectedCoachDetails.username || 'لم يتم تعيين اسم مستخدم'}
                    </span>
                  </div>

                  <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-500 block">كلمة المرور:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      •••••••• (مشفرة ومحمية)
                    </span>
                  </div>

                  <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-500 block">معرف النظام (Coach ID):</span>
                    <span className="font-mono font-bold text-zinc-300">
                      COACH-{selectedCoachDetails.coach_id}
                    </span>
                  </div>

                  <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-500 block">البريد الإلكتروني المسجل:</span>
                    <span className="font-bold text-zinc-300 truncate block">
                      {selectedCoachDetails.email || 'غير مسجل'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    onClick={() => {
                      const c = selectedCoachDetails;
                      setSelectedCoachDetails(null);
                      handleEditCoach(c);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                  >
                    <Edit className="h-3.5 w-3.5 ml-1.5" />
                    تعديل كلمة المرور أو البيانات
                  </Button>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex justify-between items-center border-t border-zinc-800 pt-3">
              <span className="text-[11px] text-zinc-500 font-mono">
                كود الطاقم: AGOA-STF-{selectedCoachDetails.coach_id}
              </span>
              <Button 
                variant="outline" 
                onClick={() => setSelectedCoachDetails(null)} 
                className="border-zinc-800 text-zinc-300 text-xs font-bold"
              >
                إغلاق
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* ADD / EDIT COACH MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingCoach(null); }} 
        title={editingCoach ? "تعديل بيانات العضو الفني" : "إضافة عضو جديد للطاقم الفني"}
      >
        <form onSubmit={handleAddCoach} className="space-y-4 font-tajawal text-right" dir="rtl">
          
          {/* Circular Photo Upload Selector */}
          <div className="flex flex-col items-center justify-center gap-3 p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/80 mb-2">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden shadow-lg group-hover:border-emerald-500 transition-colors">
                {photoPreview ? (
                  <img src={photoPreview} className="h-full w-full object-cover" alt="Preview" />
                ) : (
                  <Camera className="h-8 w-8 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                )}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="تحميل صورة شخصية"
              />
              {photoPreview && (
                <button 
                  type="button" 
                  onClick={() => { setPhotoPreview(null); setPhotoBase64(""); }}
                  className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-md z-20"
                  title="حذف الصورة"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 font-bold">تحميل صورة شخصية مهنية (اختياري)</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">الاسم الكامل *</label>
            <input 
              required 
              name="name" 
              defaultValue={editingCoach?.name} 
              type="text" 
              placeholder="مثال: صابر بلقاسم"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">رقم الهاتف *</label>
              <input 
                required 
                name="phone" 
                defaultValue={editingCoach?.phone} 
                type="tel" 
                placeholder="05 / 06 / 07 ..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none font-mono" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">البريد الإلكتروني</label>
              <input 
                name="email" 
                defaultValue={editingCoach?.email} 
                type="email" 
                placeholder="coach@example.com"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">الصفة / التخصص الفني *</label>
              <select 
                name="specialization" 
                defaultValue={editingCoach?.specialization || "مدير فني / مدرب رئيسي"} 
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none"
              >
                <option value="مدير فني / مدرب رئيسي">مدير فني / مدرب رئيسي 👑</option>
                <option value="مساعد مدرب">مساعد مدرب 📋</option>
                <option value="مدرب حراس مرمى">مدرب حراس مرمى 🧤</option>
                <option value="معد بدني">معد بدني ⚡</option>
                <option value="محلل أداء">محلل أداء 📊</option>
                <option value="طبيب / معالج طبيعي">طبيب / معالج طبيعي 🩺</option>
                <option value="مسؤول إداري">مسؤول إداري 🏛️</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">الرخصة أو الشهادة</label>
              <input 
                name="license" 
                defaultValue={editingCoach?.license} 
                type="text" 
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none" 
                placeholder="مثال: CAF A, CAF B, FAF 2" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">الفئة / الفوج الموكل</label>
              <select 
                name="team_id" 
                defaultValue={editingCoach?.team_id || (editingCoach?.category ? `cat:${editingCoach.category}` : "")} 
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">غير محدد</option>
                {categories.map(cat => (
                  <optgroup key={cat.category_id} label={`فئة ${cat.name}`} className="bg-zinc-900 text-emerald-400 font-bold">
                    <option value={`cat:${cat.name}`}>فئة {cat.name} (كاملة)</option>
                    {teams.filter(t => t.category === cat.name).map(team => (
                      <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-400">أجر الحصة الواحدة (دج) *</label>
              <input 
                name="salary_per_session" 
                defaultValue={editingCoach?.salary_per_session || 1000} 
                type="number" 
                step="50" 
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none font-bold" 
                placeholder="1000" 
              />
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3 mt-2">
            <h4 className="text-xs font-black text-emerald-400 mb-2.5">بيانات الدخول للنظام وتطبيق الهاتف</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">اسم المستخدم</label>
                <input 
                  name="username" 
                  defaultValue={editingCoach?.username} 
                  type="text" 
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none font-mono" 
                  placeholder="مثال: coach_saber" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">كلمة المرور</label>
                <input 
                  name="password" 
                  type="text" 
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none font-mono" 
                  placeholder={editingCoach ? "اتركه فارغاً للإبقاء عليها" : "مثال: coach123"} 
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2" dir="ltr">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { setIsModalOpen(false); setEditingCoach(null); }} 
              className="border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl" 
              disabled={isSaving}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[110px] text-xs font-bold rounded-xl"
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  جاري الحفظ...
                </span>
              ) : (editingCoach ? "تحديث البيانات" : "إضافة للطاقم")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف عضو من الطاقم الفني"
        message="هل أنت متأكد من حذف هذا العضو من الطاقم الفني؟ سيتم إزالة حسابه وكافة بيانات التكليف المرتبطة به."
      />

      {/* 1. DOUBLE-SIDED ID BADGE PRINT PORTAL */}
      {printCoach && (() => {
        const theme = getRoleTheme(printCoach.specialization);
        return (
          <PrintPortal 
            id="staff-card-print"
            title="طباعة بطاقة مهنية مزدوجة احترافية" 
            fileName={`بطاقة_${printCoach.name.replace(/\s+/g, '_')}`}
            onClose={() => setPrintCoach(null)}
          >
            <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 rounded-2xl border border-zinc-800 gap-6 select-none font-tajawal max-w-4xl w-full">
              
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
                
                {/* 1. FRONT SIDE */}
                <div 
                  className="print-card-page w-[90mm] h-[55mm] rounded-2xl relative overflow-hidden flex flex-col p-3 border shadow-2xl flex-shrink-0"
                  style={{
                    boxSizing: 'border-box',
                    background: `linear-gradient(135deg, #09090b 0%, ${theme.id === 'director' ? '#271c08' : theme.id === 'assistant' ? '#0b2416' : theme.id === 'goalkeeper' ? '#08252e' : theme.id === 'fitness' ? '#2f1504' : theme.id === 'analyst' ? '#240b36' : theme.id === 'medical' ? '#2c0c16' : '#1e293b'} 100%)`,
                    borderColor: theme.color + '40',
                    color: '#ffffff'
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: theme.color }} />
                  
                  <div className="flex items-center justify-between border-b pb-1.5 z-10" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-1.5">
                      {academySettings?.logo_url ? (
                        <img src={academySettings.logo_url} crossOrigin="anonymous" className="h-5 w-5 object-contain" alt="L" />
                      ) : (
                        <Shield className="h-4.5 w-4.5 text-emerald-500" />
                      )}
                      <span className="text-[8px] font-black tracking-wider text-zinc-100 truncate max-w-[170px]">
                        أكاديمية أجيال وادي العثمانية AGOA
                      </span>
                    </div>
                    <span className="text-[8px] tracking-widest font-black uppercase" style={{ color: theme.color }}>
                      بطاقة اعتماد فني
                    </span>
                  </div>

                  <div className="flex-1 flex gap-3.5 items-center mt-2 z-10" dir="rtl">
                    <div 
                      className="h-20 w-[18mm] rounded-xl border flex items-center justify-center bg-zinc-950 overflow-hidden relative shadow-lg flex-shrink-0"
                      style={{ borderColor: theme.color + '60' }}
                    >
                      {printCoach.photo_url ? (
                        <img src={printCoach.photo_url} className="h-full w-full object-cover" alt="Profile" />
                      ) : (
                        <User className="h-8 w-8 text-zinc-700" />
                      )}
                      <div className="absolute bottom-0 inset-x-0 py-0.5 bg-black/60 text-[6px] text-center text-zinc-300 font-bold truncate">
                        {printCoach.license || 'معتمد'}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between h-20 text-right">
                      <div>
                        <span className="text-[7px] text-zinc-400 block tracking-wider font-bold">الإطار الفني المسجل</span>
                        <h2 className="text-sm font-black text-white leading-tight truncate max-w-[160px]">{printCoach.name}</h2>
                        
                        <div 
                          className="inline-flex text-[8px] px-2 py-0.2 rounded-full font-black border mt-1"
                          style={{
                            backgroundColor: theme.color + '15',
                            borderColor: theme.color + '35',
                            color: theme.color
                          }}
                        >
                          {printCoach.specialization || 'طاقم فني'}
                        </div>
                      </div>

                      <div className="text-[7.5px] text-zinc-400 space-y-0.5 border-t border-zinc-800/80 pt-1">
                        <p className="flex items-center gap-1">
                          <span className="text-zinc-500 font-bold">الموسم:</span> <span className="font-bold text-zinc-200">2026 / 2027</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <span className="text-zinc-500 font-bold">الهاتف:</span> <span className="font-mono text-zinc-200">{printCoach.phone || '---'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-1 mt-1 z-10" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-[6.5px] font-mono text-zinc-500">ID: STF-00{printCoach.coach_id}</span>
                    <div className="flex items-center gap-1.5 opacity-80">
                      <span className="text-[5.5px] text-zinc-400 font-bold">توقيع رئيس الجمعية</span>
                      <div className="h-3 w-12 border-b border-dashed border-zinc-700 relative">
                        <span className="absolute bottom-0 left-1 font-serif text-[7.5px] italic text-emerald-500 opacity-60">Athmania.W</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BACK SIDE */}
                <div 
                  className="print-card-page w-[90mm] h-[55mm] rounded-2xl relative overflow-hidden flex flex-col p-3 border shadow-2xl flex-shrink-0"
                  style={{
                    boxSizing: 'border-box',
                    background: 'linear-gradient(135deg, #09090b 0%, #131316 100%)',
                    borderColor: theme.color + '30',
                    color: '#ffffff'
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: theme.color }} />
                  
                  <div className="flex items-center justify-between border-b pb-1.5 z-10" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-[7.5px] font-bold text-zinc-400">إرشادات وأحكام الاستخدام الرسمي</span>
                    <span className="text-[7.5px] font-bold text-zinc-500">AGOA ACADEMY</span>
                  </div>

                  <div className="flex-1 flex gap-3 items-center mt-2 z-10" dir="rtl">
                    <div className="flex-1 flex flex-col justify-between h-[30mm] text-right text-[6.5px] leading-relaxed text-zinc-400">
                      <ul className="space-y-1 pr-1.5 list-disc list-inside">
                        <li>تُستخدم هذه البطاقة لإثبات الهوية الفنية لحاملها بملاعب الأكاديمية.</li>
                        <li>البطاقة شخصية بالكامل وغير قابلة للإعارة أو الاستخدام المشترك.</li>
                        <li>في حال فقدان البطاقة يرجى إبلاغ الإدارة فوراً لاستخراج بديل.</li>
                      </ul>
                      
                      <div className="mt-1 border-t pt-1 border-zinc-800/80">
                        <p className="font-bold text-zinc-300">التحقق المهني الرقمي:</p>
                        <p className="text-[5.8px] text-zinc-500 leading-tight">يرجى مسح رمز الاستجابة السريعة (QR Code) للتحقق من هوية الإطار الفني.</p>
                      </div>
                    </div>

                    <div className="w-[30mm] flex flex-col items-center justify-center pl-1 border-r border-zinc-800/80 gap-1 flex-shrink-0">
                      <div className="bg-white p-1 rounded-xl shadow-lg border" style={{ borderColor: theme.color + '40' }}>
                        <QRCodeSVG
                          value={`BEGIN:VCARD
VERSION:3.0
N:${printCoach.name}
FN:${printCoach.name}
ORG:أكاديمية أجيال وادي العثمانية AGOA
TITLE:${printCoach.specialization || 'طاقم فني'}
TEL:${printCoach.phone || '---'}
EMAIL:${printCoach.email || '---'}
NOTE:الترخيص: ${printCoach.license || 'بدون رخصة'} | الأجر للحصة: ${printCoach.salary_per_session || '1000'} دج
END:VCARD`}
                          size={76}
                          bgColor="#ffffff"
                          fgColor="#09090b"
                          level="Q"
                          includeMargin={false}
                        />
                      </div>
                      <span className="text-[6.5px] tracking-wider font-bold uppercase mt-0.5" style={{ color: theme.color }}>
                        رمز تحقق معتمد
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-1 mt-1 z-10" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-[6.5px] text-zinc-500 font-mono">الإصدار: 2026/05</span>
                    <span className="text-[6.5px] text-zinc-500 font-mono">طوارئ: {academySettings?.phone || '---'}</span>
                  </div>
                </div>

              </div>

            </div>
          </PrintPortal>
        );
      })()}

      {/* 2. PRINT STAFF ROSTER DIRECTORY (دليل الطاقم الفني الرسمي) */}
      {printStaffRoster && (
        <PrintPortal
          id="coaching-staff-roster"
          title="طباعة الدليل الرسمي لكافة الأطر الفنية"
          fileName={`دليل_الطاقم_الفني_${selectedMonth}`}
          onClose={() => setPrintStaffRoster(false)}
        >
          <div className="p-8 bg-white text-zinc-900 font-tajawal max-w-5xl mx-auto space-y-6" dir="rtl">
            
            {/* Formal Header */}
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
              <div className="space-y-1">
                <h1 className="text-xl font-black text-zinc-900">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
                <h2 className="text-lg font-black text-emerald-800">أكاديمية أجيال وادي العثمانية الرياضية (AGOA)</h2>
                <p className="text-xs text-zinc-600">دليل الأطر الفنية والتدريبية المعتمدة - موسم 2026 / 2027</p>
              </div>
              <div className="text-left space-y-1 text-xs text-zinc-700">
                <p><span className="font-bold">الشهر المرجعي:</span> {selectedMonth}</p>
                <p><span className="font-bold">تاريخ الطباعة:</span> {new Date().toLocaleDateString('ar-DZ')}</p>
                <p><span className="font-bold">إجمالي الأطر:</span> {filteredCoaches.length} عضو</p>
              </div>
            </div>

            {/* KPI Summary Strip in Print */}
            <div className="grid grid-cols-4 gap-3 bg-zinc-100 p-3 rounded-lg border border-zinc-300 text-center text-xs">
              <div>
                <span className="text-zinc-600 block">إجمالي الطاقم الفني</span>
                <span className="font-black text-base text-zinc-900">{globalStats.totalCoaches}</span>
              </div>
              <div>
                <span className="text-zinc-600 block">الأطر المرخصة</span>
                <span className="font-black text-base text-zinc-900">{globalStats.licensed}</span>
              </div>
              <div>
                <span className="text-zinc-600 block">إجمالي الحصص المنفذة</span>
                <span className="font-black text-base text-zinc-900">{globalStats.totalSessions}</span>
              </div>
              <div>
                <span className="text-zinc-600 block">المستحقات الإجمالية</span>
                <span className="font-black text-base text-emerald-700">{globalStats.totalPending.toLocaleString()} دج</span>
              </div>
            </div>

            {/* Coaches Table */}
            <table className="w-full text-xs text-right border-collapse border border-zinc-400">
              <thead className="bg-zinc-200 text-zinc-900 font-black">
                <tr>
                  <th className="border border-zinc-400 px-3 py-2 text-center w-10">#</th>
                  <th className="border border-zinc-400 px-3 py-2">الاسم واللقب</th>
                  <th className="border border-zinc-400 px-3 py-2">الصفة / التخصص</th>
                  <th className="border border-zinc-400 px-3 py-2">الرخصة</th>
                  <th className="border border-zinc-400 px-3 py-2">الفئة المكلفة</th>
                  <th className="border border-zinc-400 px-3 py-2 text-center">الهاتف</th>
                  <th className="border border-zinc-400 px-3 py-2 text-center">الحصص</th>
                  <th className="border border-zinc-400 px-3 py-2 text-center">أجر الحصة</th>
                  <th className="border border-zinc-400 px-3 py-2 text-center">المستحق (دج)</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoaches.map((c, idx) => {
                  const s = getCoachMonthStats(c);
                  return (
                    <tr key={c.coach_id} className={idx % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                      <td className="border border-zinc-300 px-2 py-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-zinc-300 px-3 py-1.5 font-bold text-zinc-900">{c.name}</td>
                      <td className="border border-zinc-300 px-3 py-1.5">{c.specialization}</td>
                      <td className="border border-zinc-300 px-3 py-1.5 font-mono">{c.license || 'معتمد'}</td>
                      <td className="border border-zinc-300 px-3 py-1.5">{getTeamName(c)}</td>
                      <td className="border border-zinc-300 px-2 py-1.5 text-center font-mono">{c.phone || '---'}</td>
                      <td className="border border-zinc-300 px-2 py-1.5 text-center font-bold">{s.totalSessions}</td>
                      <td className="border border-zinc-300 px-2 py-1.5 text-center font-mono">{s.rate}</td>
                      <td className="border border-zinc-300 px-3 py-1.5 text-center font-black text-emerald-800">
                        {s.monthlyAmount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Official Signatures & Stamp */}
            <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs font-bold text-zinc-800">
              <div>
                <p className="border-b border-zinc-400 pb-1 mb-10">المشرف العام للطاقم الفني</p>
                <span>التوقيع والختم</span>
              </div>
              <div>
                <p className="border-b border-zinc-400 pb-1 mb-10">المسؤول المالي والمحاسب</p>
                <span>التوقيع والختم</span>
              </div>
              <div>
                <p className="border-b border-zinc-400 pb-1 mb-10">رئيس الأكاديمية</p>
                <span>التوقيع والختم</span>
              </div>
            </div>

          </div>
        </PrintPortal>
      )}

      {/* 3. PRINT INDIVIDUAL COACH MONTHLY ACTIVITY & PAYROLL STATEMENT (كشف النشاط الفردي) */}
      {printCoachStatement && (() => {
        const stats = getCoachMonthStats(printCoachStatement);
        return (
          <PrintPortal
            id="coach-monthly-statement"
            title="طباعة كشف النشاط والمستحقات الفردي"
            fileName={`كشف_مستحقات_${printCoachStatement.name.replace(/\s+/g, '_')}_${selectedMonth}`}
            onClose={() => setPrintCoachStatement(null)}
          >
            <div className="p-8 bg-white text-zinc-900 font-tajawal max-w-4xl mx-auto space-y-6" dir="rtl">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-emerald-800">أكاديمية أجيال وادي العثمانية (AGOA)</h1>
                  <h2 className="text-sm font-bold text-zinc-700">كشف النشاط التدريبي والمستحقات الشهرية للمدرب</h2>
                  <p className="text-xs text-zinc-500">موسم 2026 / 2027</p>
                </div>
                <div className="text-left text-xs font-mono text-zinc-700 space-y-0.5">
                  <p><span className="font-bold">الشهر:</span> {selectedMonth}</p>
                  <p><span className="font-bold">تاريخ الكشف:</span> {new Date().toLocaleDateString('ar-DZ')}</p>
                  <p><span className="font-bold">معرف المدرب:</span> AGOA-STF-{printCoachStatement.coach_id}</p>
                </div>
              </div>

              {/* Coach Profile Card in Statement */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-100 p-4 rounded-xl border border-zinc-300 text-xs">
                <div>
                  <span className="text-zinc-500 block">اسم المدرب:</span>
                  <span className="font-black text-sm text-zinc-900">{printCoachStatement.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">الصفة الفنية:</span>
                  <span className="font-bold text-zinc-900">{printCoachStatement.specialization}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">الفئة الموكلة:</span>
                  <span className="font-bold text-zinc-900">{getTeamName(printCoachStatement)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">الرخصة:</span>
                  <span className="font-mono font-bold text-zinc-900">{printCoachStatement.license || 'معتمد'}</span>
                </div>
              </div>

              {/* Sessions breakdown summary */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="border border-zinc-300 p-3 rounded-lg">
                  <span className="text-zinc-600 block">التدريبات المنفذة</span>
                  <span className="font-black text-lg text-zinc-900">{stats.trainingCount} حصة</span>
                </div>
                <div className="border border-zinc-300 p-3 rounded-lg">
                  <span className="text-zinc-600 block">المباريات الرسمية والودية</span>
                  <span className="font-black text-lg text-zinc-900">
                    {stats.matchCount} مباراة ({stats.matchEquivSessions} حصة)
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg">
                  <span className="text-emerald-800 font-bold block">إجمالي المستحق المالي</span>
                  <span className="font-black text-xl text-emerald-800">
                    {stats.monthlyAmount.toLocaleString()} دج
                  </span>
                </div>
              </div>

              {/* Conducted Sessions Detail Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-zinc-800">تفاصيل الحصص المنفذة خلال الشهر:</h3>
                <table className="w-full text-xs text-right border-collapse border border-zinc-300">
                  <thead className="bg-zinc-200 font-bold text-zinc-800">
                    <tr>
                      <th className="border border-zinc-300 px-3 py-1.5 w-10 text-center">#</th>
                      <th className="border border-zinc-300 px-3 py-1.5">التاريخ</th>
                      <th className="border border-zinc-300 px-3 py-1.5">النوع</th>
                      <th className="border border-zinc-300 px-3 py-1.5">الفئة / التفاصيل</th>
                      <th className="border border-zinc-300 px-3 py-1.5 text-center">معامل الحصة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.coachTrainings.map((t: any, i: number) => (
                      <tr key={`t-${t.training_id}`} className="bg-white">
                        <td className="border border-zinc-200 px-2 py-1 text-center font-mono">{i + 1}</td>
                        <td className="border border-zinc-200 px-3 py-1 font-mono">{t.date}</td>
                        <td className="border border-zinc-200 px-3 py-1 font-bold text-zinc-700">حصة تدريبية</td>
                        <td className="border border-zinc-200 px-3 py-1">{t.topic || t.category || getTeamName(printCoachStatement)}</td>
                        <td className="border border-zinc-200 px-3 py-1 text-center font-bold">1</td>
                      </tr>
                    ))}
                    {stats.coachMatches.map((m: any, i: number) => {
                      const mult = MATCH_MULTIPLIERS[m.match_type || 'official'] ?? 1;
                      return (
                        <tr key={`m-${m.match_id}`} className="bg-amber-50/50">
                          <td className="border border-zinc-200 px-2 py-1 text-center font-mono">{stats.coachTrainings.length + i + 1}</td>
                          <td className="border border-zinc-200 px-3 py-1 font-mono">{m.match_date}</td>
                          <td className="border border-zinc-200 px-3 py-1 font-bold text-amber-800">
                            مباراة ({m.match_type === 'official' ? 'رسمية' : m.match_type === 'cup' ? 'كأس' : 'ودية'})
                          </td>
                          <td className="border border-zinc-200 px-3 py-1">ضد: {m.opponent_name || 'خصم'}</td>
                          <td className="border border-zinc-200 px-3 py-1 text-center font-black text-amber-900">{mult}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Receipt Declaration */}
              <div className="bg-zinc-50 border border-zinc-300 p-3 rounded-lg text-xs leading-relaxed text-zinc-700">
                أنا الموقع أسفله، السيد(ة): <span className="font-black text-zinc-900">{printCoachStatement.name}</span>، 
                أشهد أنني استلمت كامل مستحقاتي المالية عن شهر <span className="font-bold text-zinc-900">{selectedMonth}</span> 
                المقدرة بـ: <span className="font-black text-emerald-800">{stats.monthlyAmount.toLocaleString()} دج</span> 
                (عن إجمالي {stats.totalSessions} حصة تدريبية ومباراة).
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs font-bold text-zinc-800">
                <div>
                  <p className="border-b border-zinc-400 pb-1 mb-12">توقيع واستلام المدرب</p>
                  <span>التوقيع مع عبارة "قرئ وصودق عليه"</span>
                </div>
                <div>
                  <p className="border-b border-zinc-400 pb-1 mb-12">رئيس الأكاديمية / أمين المال</p>
                  <span>التوقيع والختم الرسمي</span>
                </div>
              </div>

            </div>
          </PrintPortal>
        );
      })()}

    </div>
  );
}
