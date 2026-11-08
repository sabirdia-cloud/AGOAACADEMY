import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, Search, User, Phone, Mail, Award, Users, Shield, 
  Loader2, Info, Star, Activity, Heart, Trash2, Edit, 
  CreditCard, LayoutGrid, List, Camera, Upload, Building,
  CheckCircle, FileText
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { PrintPortal } from "@/components/PrintPortal";
import { exportToPDF, exportToPNG } from "@/lib/pdf-export";
import { QRCodeSVG } from "qrcode.react";

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

export function Coaches() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<any>(null);
  const [coachToDelete, setCoachToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [academySettings, setAcademySettings] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [printCoach, setPrintCoach] = useState<any | null>(null);

  // Photo Upload States
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const categoriesData = await api.getCategories();
      setCategories(categoriesData);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }

    try {
      const teamsData = await api.getTeams();
      setTeams(teamsData);
    } catch (e) {
      console.error("Failed to load teams:", e);
    }

    try {
      const coachesData = await api.getCoaches();
      // Enrich with photo_url from local storage and map specialty -> specialization
      const enriched = coachesData.map((c: any) => ({
        ...c,
        specialization: c.specialty || c.specialization || 'مدير فني / مدرب رئيسي',
        photo_url: localStorage.getItem(`coach_photo_${c.coach_id}`) || null
      }));
      setCoaches(enriched);
    } catch (error) {
      console.error("Failed to load coaches list:", error);
    }

    try {
      const settingsData = await api.getAcademySettings();
      setAcademySettings(settingsData);
    } catch (error) {
      console.error("Failed to load settings:", error);
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

    // Map specialization to 'specialty' column in coaches table
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

      // Save photo to localStorage if available
      const targetId = editingCoach ? editingCoach.coach_id : savedCoach?.coach_id;
      if (targetId) {
        if (photoBase64) {
          localStorage.setItem(`coach_photo_${targetId}`, photoBase64);
        } else if (!photoPreview) {
          localStorage.removeItem(`coach_photo_${targetId}`);
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
          bg: 'from-amber-950/20 via-zinc-900/90 to-amber-900/10 border-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/5',
          badgeBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          text: 'text-amber-400',
          accent: 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600',
          roleName: 'مدير فني / مدرب رئيسي',
          avatarBorder: 'border-amber-400/50 shadow-amber-500/20',
          desc: 'القيادة الفنية والتخطيط الاستراتيجي العام 👑',
          color: '#d97706',
          glow: '#d97706'
        };
      case 'مساعد مدرب':
        return {
          id: 'assistant',
          bg: 'from-emerald-950/20 via-zinc-900/90 to-emerald-900/10 border-emerald-500/30 hover:border-emerald-400 hover:shadow-emerald-500/5',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          text: 'text-emerald-400',
          accent: 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600',
          roleName: 'مساعد مدرب',
          avatarBorder: 'border-emerald-400/50 shadow-emerald-500/20',
          desc: 'التنظيم الميداني وبناء وتطبيق الخطط التكتيكية 📋',
          color: '#059669',
          glow: '#059669'
        };
      case 'مدرب حراس مرمى':
        return {
          id: 'goalkeeper',
          bg: 'from-cyan-950/20 via-zinc-900/90 to-cyan-900/10 border-cyan-500/30 hover:border-cyan-400 hover:shadow-cyan-500/5',
          badgeBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
          text: 'text-cyan-400',
          accent: 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600',
          roleName: 'مدرب حراس مرمى',
          avatarBorder: 'border-cyan-400/50 shadow-cyan-500/20',
          desc: 'حماية العرين وصقل مهارات رد الفعل لحراس المرمى 🧤',
          color: '#0891b2',
          glow: '#0891b2'
        };
      case 'معد بدني':
        return {
          id: 'fitness',
          bg: 'from-orange-950/20 via-zinc-900/90 to-orange-900/10 border-orange-500/30 hover:border-orange-400 hover:shadow-orange-500/5',
          badgeBg: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
          text: 'text-orange-400',
          accent: 'bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600',
          roleName: 'معد بدني',
          avatarBorder: 'border-orange-400/50 shadow-orange-500/20',
          desc: 'رفع منسوب اللياقة والتحمل العضلي والوقاية من الإصابات ⚡',
          color: '#ea580c',
          glow: '#ea580c'
        };
      case 'محلل أداء':
        return {
          id: 'analyst',
          bg: 'from-purple-950/20 via-zinc-900/90 to-purple-900/10 border-purple-500/30 hover:border-purple-400 hover:shadow-purple-500/5',
          badgeBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
          text: 'text-purple-400',
          accent: 'bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600',
          roleName: 'محلل أداء',
          avatarBorder: 'border-purple-400/50 shadow-purple-500/20',
          desc: 'رصد البيانات الرقمية وتفكيك تحركات الخصوم بالفيديو 📊',
          color: '#7c3aed',
          glow: '#7c3aed'
        };
      case 'طبيب / معالج طبيعي':
        return {
          id: 'medical',
          bg: 'from-rose-950/20 via-zinc-900/90 to-rose-900/10 border-rose-500/30 hover:border-rose-400 hover:shadow-rose-500/5',
          badgeBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          text: 'text-rose-400',
          accent: 'bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600',
          roleName: 'طبيب / معالج طبيعي',
          avatarBorder: 'border-rose-400/50 shadow-rose-500/20',
          desc: 'الرعاية الطبية والتشخيص الفوري ومتابعة تأهيل اللاعبين 🩺',
          color: '#e11d48',
          glow: '#e11d48'
        };
      default:
        return {
          id: 'admin',
          bg: 'from-zinc-800/20 via-zinc-900/90 to-zinc-850/10 border-zinc-700/30 hover:border-zinc-500 hover:shadow-zinc-500/5',
          badgeBg: 'bg-zinc-700/10 text-zinc-300 border border-zinc-750/20',
          text: 'text-zinc-300',
          accent: 'bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-600',
          roleName: role || 'مسؤول إداري',
          avatarBorder: 'border-zinc-450/40 shadow-zinc-500/20',
          desc: 'التنسيق الإداري، اللوجستيات، وإدارة الشؤون التنظيمية للفرق 🏛️',
          color: '#4b5563',
          glow: '#4b5563'
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
        return <User className="h-4 w-4" />;
    }
  };

  const getTeamName = (coach: any) => {
    if (coach.team_id) {
      const team = teams.find(t => t.team_id === coach.team_id);
      return team ? `${team.category} - ${team.team_name}` : coach.category || "غير محدد";
    }
    return coach.category || "غير محدد";
  };

  const filteredCoaches = coaches.filter(c =>
    (c.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
    (c.phone || "").includes(searchQuery) ||
    (c.specialization || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  return (
    <div className="space-y-6 font-tajawal text-right" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-50 tracking-tight">إدارة الطاقم الفني والتدريبي</h2>
          <p className="text-zinc-400 mt-1 text-sm">هيكلة شاملة لجميع الكفاءات الفنية، القياسات، التراخيص، والبطاقات المهنية المعتمدة بترميز ذكي.</p>
        </div>
        <Button onClick={() => { setEditingCoach(null); setPhotoPreview(null); setPhotoBase64(""); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-lg shadow-emerald-950/20">
          <Plus className="ml-2 h-4 w-4" />
          إضافة إطار فني جديد
        </Button>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، الهاتف، أو التخصص الفني..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 pr-10 pl-4 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setViewMode('grid')}
            className={`h-9 w-9 border-zinc-800 ${viewMode === 'grid' ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setViewMode('table')}
            className={`h-9 w-9 border-zinc-800 ${viewMode === 'table' ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-zinc-500 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span>جاري تحميل هيكل الطاقم الفني...</span>
        </div>
      ) : filteredCoaches.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
          لا يوجد أطر فنية مطابقة للبحث
        </div>
      ) : viewMode === 'grid' ? (
        /* ROLE-SPECIFIC HIGHLY PROFESSIONAL CARD DESIGNS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach) => {
            const theme = getRoleTheme(coach.specialization);
            
            // Design 1: Royal Gold Elite Card (مدير فني)
            if (theme.id === 'director') {
              return (
                <div 
                  key={coach.coach_id}
                  className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl border transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl`}
                  style={{ boxShadow: `0 10px 30px -15px ${theme.glow}40` }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600" />
                  
                  {/* Subtle Crown Watermark */}
                  <div className="absolute -left-4 -top-4 w-28 h-28 opacity-[0.03] text-white rotate-12 pointer-events-none">
                    <Award className="w-full h-full" />
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-black border ${theme.badgeBg}`}>
                          {getRoleIcon(coach.specialization)}
                          {theme.roleName}
                        </div>
                        <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors pt-2 leading-tight flex items-center gap-1">
                          {coach.name}
                          <span className="text-[10px] text-amber-500">👑</span>
                        </h3>
                        <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-amber-500" /> {coach.license || 'رخصة معتمدة'}
                        </p>
                      </div>

                      {/* Photo Frame with glowing gold ring */}
                      <div className={`h-16 w-16 rounded-2xl bg-zinc-950 flex items-center justify-center text-zinc-400 border-2 ${theme.avatarBorder} overflow-hidden shadow-lg shadow-amber-950/30 flex-shrink-0 group-hover:scale-105 transition-all duration-300`}>
                        {coach.photo_url ? (
                          <img src={coach.photo_url} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <User className="h-7 w-7 text-amber-500/70" />
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg leading-relaxed text-right font-medium">
                      {theme.desc}
                    </div>

                    <div className="text-xs space-y-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/85">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-amber-500/70" /> الفئة الموكلة:</span>
                        <span className="font-bold text-zinc-300">{getTeamName(coach)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-amber-500/70" /> الاتصال الفوري:</span>
                        <span className="font-mono font-bold text-zinc-300">{coach.phone || '---'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-zinc-800/80">
                      <Button 
                        onClick={() => setPrintCoach(coach)}
                        variant="outline" 
                        className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 flex-1 text-xs py-1.5 h-8 font-black gap-1 rounded-lg transition-all"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        بطاقة اعتماد ملكية
                      </Button>
                      <Button onClick={() => handleEditCoach(coach)} variant="ghost" className="text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">تعديل</Button>
                      <Button onClick={() => handleDeleteCoach(coach.coach_id)} variant="ghost" className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">حذف</Button>
                    </div>
                  </div>
                </div>
              );
            }

            // Design 2: Tactical Emerald Matrix Card (مساعد مدرب)
            if (theme.id === 'assistant') {
              return (
                <div 
                  key={coach.coach_id}
                  className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl border transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl`}
                  style={{ 
                    boxShadow: `0 10px 30px -15px ${theme.glow}30`,
                    backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.04) 0%, transparent 80%)'
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500" />
                  
                  {/* Tactical Board watermark in background */}
                  <div className="absolute right-0 bottom-0 w-32 h-20 opacity-[0.05] pointer-events-none" style={{ borderLeft: '1px dashed #10b981', borderTop: '1px dashed #10b981', borderRadius: '40px 0 0 0' }} />

                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${theme.badgeBg}`}>
                          {getRoleIcon(coach.specialization)}
                          {theme.roleName}
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors pt-2 leading-tight">{coach.name}</h3>
                        <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-emerald-500" /> {coach.license || 'معتمد ميدانياً'}
                        </p>
                      </div>

                      {/* Photo Frame in Square Tactical Style */}
                      <div className={`h-16 w-16 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400 border-2 ${theme.avatarBorder} overflow-hidden shadow-lg flex-shrink-0 transition-transform duration-300`}>
                        {coach.photo_url ? (
                          <img src={coach.photo_url} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <User className="h-7 w-7 text-emerald-500/70" />
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-emerald-400/80 bg-emerald-500/5 p-2 rounded-lg leading-relaxed text-right border border-emerald-500/10">
                      {theme.desc}
                    </div>

                    <div className="text-xs space-y-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-emerald-500/70" /> الفوج:</span>
                        <span className="font-bold text-zinc-300">{getTeamName(coach)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-emerald-500/70" /> المراسلات:</span>
                        <span className="text-zinc-300 truncate max-w-[140px]">{coach.email || '---'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-zinc-800/80">
                      <Button 
                        onClick={() => setPrintCoach(coach)}
                        variant="outline" 
                        className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 flex-1 text-xs py-1.5 h-8 font-black gap-1 rounded-lg transition-all"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        بطاقة فنية
                      </Button>
                      <Button onClick={() => handleEditCoach(coach)} variant="ghost" className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">تعديل</Button>
                      <Button onClick={() => handleDeleteCoach(coach.coach_id)} variant="ghost" className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">حذف</Button>
                    </div>
                  </div>
                </div>
              );
            }

            // Design 3: Guardian Shield Cyan Card (مدرب حراس مرمى)
            if (theme.id === 'goalkeeper') {
              return (
                <div 
                  key={coach.coach_id}
                  className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl border transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl`}
                  style={{ 
                    boxShadow: `0 10px 30px -15px ${theme.glow}30`,
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 97%, 95% 100%, 0% 100%)' // Futuristic corner cut
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-cyan-500" />
                  
                  {/* Floating Hexagons */}
                  <div className="absolute -left-6 bottom-0 w-24 h-24 opacity-[0.02] border border-cyan-400 rounded-full" />

                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${theme.badgeBg}`}>
                          {getRoleIcon(coach.specialization)}
                          {theme.roleName}
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors pt-2 leading-tight">{coach.name}</h3>
                        <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                          <Shield className="h-3.5 w-3.5 text-cyan-500" /> {coach.license || 'ترخيص حراس المرمى'}
                        </p>
                      </div>

                      {/* Hexagonal Photo Frame look */}
                      <div className={`h-16 w-16 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400 border-2 ${theme.avatarBorder} overflow-hidden shadow-lg flex-shrink-0 group-hover:rotate-3 transition-all duration-300`}>
                        {coach.photo_url ? (
                          <img src={coach.photo_url} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <User className="h-7 w-7 text-cyan-500/70" />
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-cyan-400/80 bg-cyan-500/5 p-2 rounded-lg leading-relaxed text-right border border-cyan-500/10">
                      {theme.desc}
                    </div>

                    <div className="text-xs space-y-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-cyan-500/70" /> فئة التدريب:</span>
                        <span className="font-bold text-zinc-300">{getTeamName(coach)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-cyan-500/70" /> رقم التواصل:</span>
                        <span className="font-mono font-bold text-zinc-300">{coach.phone || '---'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-zinc-800/80">
                      <Button 
                        onClick={() => setPrintCoach(coach)}
                        variant="outline" 
                        className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 flex-1 text-xs py-1.5 h-8 font-black gap-1 rounded-lg transition-all"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        بطاقة حارس عرين
                      </Button>
                      <Button onClick={() => handleEditCoach(coach)} variant="ghost" className="text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">تعديل</Button>
                      <Button onClick={() => handleDeleteCoach(coach.coach_id)} variant="ghost" className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">حذف</Button>
                    </div>
                  </div>
                </div>
              );
            }

            // Design 4: Kinetic Kinetic Fire Orange Card (معد بدني)
            if (theme.id === 'fitness') {
              return (
                <div 
                  key={coach.coach_id}
                  className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl border transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl`}
                  style={{ 
                    boxShadow: `0 10px 30px -15px ${theme.glow}30`,
                    backgroundImage: 'linear-gradient(135deg, rgba(234, 88, 12, 0.05) 0%, transparent 70%)'
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-orange-500" />
                  
                  {/* Energy slashes overlay */}
                  <div className="absolute right-2 top-2 text-[50px] font-black text-orange-500/5 rotate-12 select-none pointer-events-none">⚡ SPEED</div>

                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${theme.badgeBg}`}>
                          {getRoleIcon(coach.specialization)}
                          {theme.roleName}
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors pt-2 leading-tight">{coach.name}</h3>
                        <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5 text-orange-500" /> {coach.license || 'معد بدني معتمد'}
                        </p>
                      </div>

                      {/* Photo Frame in Sporty Round Frame */}
                      <div className={`h-16 w-16 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-400 border-2 ${theme.avatarBorder} overflow-hidden shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-305`}>
                        {coach.photo_url ? (
                          <img src={coach.photo_url} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <User className="h-7 w-7 text-orange-500/70" />
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-orange-400/80 bg-orange-500/5 p-2 rounded-lg leading-relaxed text-right border border-orange-500/10">
                      {theme.desc}
                    </div>

                    <div className="text-xs space-y-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-orange-500/70" /> الجاهزية للفئة:</span>
                        <span className="font-bold text-zinc-300">{getTeamName(coach)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-orange-500/70" /> هاتف مباشر:</span>
                        <span className="font-mono font-bold text-zinc-300">{coach.phone || '---'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-zinc-800/80">
                      <Button 
                        onClick={() => setPrintCoach(coach)}
                        variant="outline" 
                        className="border-orange-500/20 text-orange-400 hover:bg-orange-500/10 flex-1 text-xs py-1.5 h-8 font-black gap-1 rounded-lg transition-all"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        بطاقة لياقة بدنية
                      </Button>
                      <Button onClick={() => handleEditCoach(coach)} variant="ghost" className="text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">تعديل</Button>
                      <Button onClick={() => handleDeleteCoach(coach.coach_id)} variant="ghost" className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">حذف</Button>
                    </div>
                  </div>
                </div>
              );
            }

            // Design 5: Hologram Cosmic Violet Card (محلل أداء)
            if (theme.id === 'analyst') {
              return (
                <div 
                  key={coach.coach_id}
                  className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl border transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl`}
                  style={{ 
                    boxShadow: `0 10px 30px -15px ${theme.glow}30`,
                    backgroundImage: 'radial-gradient(circle at 90% 90%, rgba(124, 58, 237, 0.06) 0%, transparent 60%)'
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-purple-500" />
                  
                  {/* Dot matrix texture overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${theme.badgeBg}`}>
                          {getRoleIcon(coach.specialization)}
                          {theme.roleName}
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-purple-400 transition-colors pt-2 leading-tight">{coach.name}</h3>
                        <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-purple-400" /> {coach.license || 'خبير رصد رقمي'}
                        </p>
                      </div>

                      {/* Photo Frame in Hexagonal look */}
                      <div className={`h-16 w-16 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400 border-2 ${theme.avatarBorder} overflow-hidden shadow-lg flex-shrink-0 group-hover:scale-105 transition-all duration-300`}>
                        {coach.photo_url ? (
                          <img src={coach.photo_url} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <User className="h-7 w-7 text-purple-500/70" />
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-purple-400/80 bg-purple-500/5 p-2 rounded-lg leading-relaxed text-right border border-purple-500/10">
                      {theme.desc}
                    </div>

                    <div className="text-xs space-y-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-purple-500/70" /> تحليل فئة:</span>
                        <span className="font-bold text-zinc-300">{getTeamName(coach)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-purple-500/70" /> بريد العمل:</span>
                        <span className="text-zinc-300 truncate max-w-[140px]">{coach.email || '---'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-zinc-800/80">
                      <Button 
                        onClick={() => setPrintCoach(coach)}
                        variant="outline" 
                        className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10 flex-1 text-xs py-1.5 h-8 font-black gap-1 rounded-lg transition-all"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        بطاقة تحليل رقمي
                      </Button>
                      <Button onClick={() => handleEditCoach(coach)} variant="ghost" className="text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">تعديل</Button>
                      <Button onClick={() => handleDeleteCoach(coach.coach_id)} variant="ghost" className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">حذف</Button>
                    </div>
                  </div>
                </div>
              );
            }

            // Design 6: Rose Quartz Wellness Card (طبيب / معالج طبيعي)
            if (theme.id === 'medical') {
              return (
                <div 
                  key={coach.coach_id}
                  className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl border transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl`}
                  style={{ 
                    boxShadow: `0 10px 30px -15px ${theme.glow}30`,
                    backgroundImage: 'radial-gradient(circle at 10% 90%, rgba(225, 29, 72, 0.05) 0%, transparent 60%)'
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500" />
                  
                  {/* Subtle wellness pulse wave in background */}
                  <div className="absolute right-4 top-4 w-10 h-10 border border-rose-500/10 rounded-full animate-ping pointer-events-none" />

                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${theme.badgeBg}`}>
                          {getRoleIcon(coach.specialization)}
                          {theme.roleName}
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-rose-400 transition-colors pt-2 leading-tight">{coach.name}</h3>
                        <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5 text-rose-400" /> {coach.license || 'طاقم طبي معتمد'}
                        </p>
                      </div>

                      {/* Photo Frame in Gentle Rounded Circular Shape */}
                      <div className={`h-16 w-16 rounded-2xl bg-zinc-950 flex items-center justify-center text-zinc-400 border-2 ${theme.avatarBorder} overflow-hidden shadow-lg flex-shrink-0 group-hover:rotate-1 transition-all duration-300`}>
                        {coach.photo_url ? (
                          <img src={coach.photo_url} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <User className="h-7 w-7 text-rose-500/70" />
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-rose-400/80 bg-rose-500/5 p-2 rounded-lg leading-relaxed text-right border border-rose-500/10">
                      {theme.desc}
                    </div>

                    <div className="text-xs space-y-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-500/70" /> الفئة الطبية:</span>
                        <span className="font-bold text-zinc-300">{getTeamName(coach)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-rose-500/70" /> هاتف مباشر:</span>
                        <span className="font-mono font-bold text-zinc-300">{coach.phone || '---'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-zinc-800/80">
                      <Button 
                        onClick={() => setPrintCoach(coach)}
                        variant="outline" 
                        className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10 flex-1 text-xs py-1.5 h-8 font-black gap-1 rounded-lg transition-all"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        بطاقة رعاية صحية
                      </Button>
                      <Button onClick={() => handleEditCoach(coach)} variant="ghost" className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">تعديل</Button>
                      <Button onClick={() => handleDeleteCoach(coach.coach_id)} variant="ghost" className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">حذف</Button>
                    </div>
                  </div>
                </div>
              );
            }

            // Design 7: Titanium Slate Corporate Card (مسؤول إداري / افتراضي)
            return (
              <div 
                key={coach.coach_id}
                className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl border transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl`}
                style={{ boxShadow: `0 10px 30px -15px ${theme.glow}30` }}
              >
                <div className="absolute top-0 inset-x-0 h-1.5 bg-zinc-400" />
                
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${theme.badgeBg}`}>
                        {getRoleIcon(coach.specialization)}
                        {theme.roleName}
                      </div>
                      <h3 className="text-lg font-black text-white group-hover:text-zinc-300 transition-colors pt-2 leading-tight">{coach.name}</h3>
                      <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-zinc-400" /> {coach.license || 'مسؤول إداري معتمد'}
                      </p>
                    </div>

                    {/* Photo Frame in Simple Geometric Rounded Square */}
                    <div className={`h-16 w-16 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-400 border-2 ${theme.avatarBorder} overflow-hidden shadow-lg flex-shrink-0 group-hover:scale-[1.03] transition-all duration-300`}>
                      {coach.photo_url ? (
                        <img src={coach.photo_url} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <User className="h-7 w-7 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400/80 bg-zinc-800/10 p-2 rounded-lg leading-relaxed text-right border border-zinc-800/30">
                    {theme.desc}
                  </div>

                  <div className="text-xs space-y-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-zinc-400" /> التكليف الإداري:</span>
                      <span className="font-bold text-zinc-300">{getTeamName(coach)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-zinc-400" /> رقم التواصل:</span>
                      <span className="font-mono font-bold text-zinc-300">{coach.phone || '---'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-zinc-800/80">
                    <Button 
                      onClick={() => setPrintCoach(coach)}
                      variant="outline" 
                      className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white flex-1 text-xs py-1.5 h-8 font-bold gap-1 rounded-lg transition-all"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      بطاقة إدارية مهنية
                    </Button>
                    <Button onClick={() => handleEditCoach(coach)} variant="ghost" className="text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">تعديل</Button>
                    <Button onClick={() => handleDeleteCoach(coach.coach_id)} variant="ghost" className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs py-1.5 h-8 font-bold px-3 rounded-lg">حذف</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* PREMIUM TABLE VIEW */
        <Card className="bg-zinc-900/40 border-zinc-800/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-zinc-400 bg-zinc-950/50 border-b border-zinc-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-black">الاسم والوظيفة</th>
                    <th scope="col" className="px-6 py-4 font-bold">رقم الهاتف</th>
                    <th scope="col" className="px-6 py-4 font-bold">البريد الإلكتروني</th>
                    <th scope="col" className="px-6 py-4 font-bold">الرخصة</th>
                    <th scope="col" className="px-6 py-4 font-bold">الأجر للحصة</th>
                    <th scope="col" className="px-6 py-4 font-bold">الفئة / الفوج</th>
                    <th scope="col" className="px-6 py-4 font-bold text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredCoaches.map((coach) => (
                    <tr key={coach.coach_id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400 border border-zinc-700">
                            {coach.photo_url ? (
                              <img src={coach.photo_url} className="h-full w-full object-cover" alt="" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-black text-zinc-50 block">{coach.name}</span>
                            <span className="text-[10px] text-zinc-400">{coach.specialization || 'طاقم فني'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-300 font-mono">{coach.phone || '---'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{coach.email || '---'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{coach.license || '---'}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-400">{coach.salary_per_session || 1000} دج</td>
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{getTeamName(coach)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setPrintCoach(coach)} className="text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 font-bold">
                            <CreditCard className="h-3.5 w-3.5 ml-1 inline" /> بطاقة مهنية
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditCoach(coach)} className="text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCoach(coach.coach_id)} className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADD/EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCoach(null); }} title={editingCoach ? "تعديل بيانات العضو" : "إضافة عضو جديد للطاقم"}>
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
            <span className="text-[10px] text-zinc-400 font-bold">تحميل صورة مهنية للإطار الفني (اختياري)</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-300">الاسم الكامل</label>
            <input required name="name" defaultValue={editingCoach?.name} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-300">رقم الهاتف</label>
              <input required name="phone" defaultValue={editingCoach?.phone} type="tel" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-300">البريد الإلكتروني</label>
              <input name="email" defaultValue={editingCoach?.email} type="email" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-300">الصفة / التخصص الفني</label>
              <select name="specialization" defaultValue={editingCoach?.specialization || "مدير فني / مدرب رئيسي"} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="مدير فني / مدرب رئيسي">مدير فني / مدرب رئيسي 👑</option>
                <option value="مساعد مدرب">مساعد مدرب 📋</option>
                <option value="مدرب حراس مرمى">مدرب حراس مرمى 🧤</option>
                <option value="معد بدني">معد بدني ⚡</option>
                <option value="محلل أداء">محلل أداء 📊</option>
                <option value="طبيب / معالج طبيعي">طبيب / معالج طبيعي 🩺</option>
                <option value="مسؤول إداري">مسؤول إداري 🏛️</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-300">الرخصة</label>
              <input name="license" defaultValue={editingCoach?.license} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="مثال: UEFA Pro, UEFA A" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-300">الفئة / الفوج</label>
              <select name="team_id" defaultValue={editingCoach?.team_id || (editingCoach?.category ? `cat:${editingCoach.category}` : "")} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="">غير محدد</option>
                {categories.map(cat => (
                  <optgroup key={cat.category_id} label={cat.name} className="bg-zinc-900 text-emerald-500 font-bold">
                    <option value={`cat:${cat.name}`}>{cat.name} (فئة كاملة)</option>
                    {teams.filter(t => t.category === cat.name).map(team => (
                      <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-400">أجر الحصة الواحدة (دج)</label>
              <input name="salary_per_session" defaultValue={editingCoach?.salary_per_session || 1000} type="number" step="0.01" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none placeholder-emerald-500" placeholder="1000" />
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 mt-2">
            <h4 className="text-sm font-black text-emerald-500 mb-3">بيانات الدخول للنظام</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-300">اسم المستخدم</label>
                <input name="username" defaultValue={editingCoach?.username} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder="مثال: coach_saber" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-300">كلمة المرور</label>
                <input name="password" type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" placeholder={editingCoach ? "اتركه فارغاً للإبقاء على الحالية" : "تعيين كلمة مرور"} />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2" dir="ltr">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingCoach(null); }} className="border-zinc-800 text-zinc-300" disabled={isSaving}>إلغاء</Button>
            <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px] font-bold">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
        title="حذف إطار فني"
        message="هل أنت متأكد من حذف هذا العضو من الطاقم الفني؟ سيتم إزالة حساب الدخول الخاص به وكافة بيانات التكليفات المرتبطة."
      />

      {/* DOUBLE-SIDED ID BADGE PRINT PORTAL */}
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
              
              {/* Cards row for preview & capture */}
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
                
                {/* 1. CARD FRONT SIDE */}
                <div 
                  className="print-card-page w-[90mm] h-[55mm] rounded-2xl relative overflow-hidden flex flex-col p-3 border shadow-2xl transition-transform duration-500 hover:scale-[1.02] flex-shrink-0"
                  style={{
                    boxSizing: 'border-box',
                    background: `linear-gradient(135deg, #09090b 0%, ${theme.id === 'director' ? '#271c08' : theme.id === 'assistant' ? '#0b2416' : theme.id === 'goalkeeper' ? '#08252e' : theme.id === 'fitness' ? '#2f1504' : theme.id === 'analyst' ? '#240b36' : theme.id === 'medical' ? '#2c0c16' : '#1e293b'} 100%)`,
                    borderColor: theme.color + '40',
                    color: '#ffffff'
                  }}
                >
                  {/* Top visual neon bar matching role */}
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: theme.color }} />
                  
                  {/* Corner light glowing background effects */}
                  <div className="absolute -left-10 -top-10 w-28 h-28 blur-[30px] rounded-full opacity-40" style={{ backgroundColor: theme.color }} />
                  <div className="absolute -right-10 -bottom-10 w-24 h-24 blur-[30px] rounded-full opacity-20" style={{ backgroundColor: theme.color }} />

                  {/* Header: logo and title */}
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

                  {/* Body Content */}
                  <div className="flex-1 flex gap-3.5 items-center mt-2 z-10" dir="rtl">
                    {/* Photo box in gold/role border with overlay badge */}
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

                    {/* Coach description and contact info */}
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

                  {/* Card Bottom: Serial and sign area */}
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

                {/* 2. CARD BACK SIDE */}
                <div 
                  className="print-card-page w-[90mm] h-[55mm] rounded-2xl relative overflow-hidden flex flex-col p-3 border shadow-2xl transition-transform duration-500 hover:scale-[1.02] flex-shrink-0"
                  style={{
                    boxSizing: 'border-box',
                    background: 'linear-gradient(135deg, #09090b 0%, #131316 100%)',
                    borderColor: theme.color + '30',
                    color: '#ffffff'
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: theme.color }} />
                  
                  {/* Faint Shield Watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                    <Shield className="w-28 h-28 text-white" />
                  </div>

                  {/* Back header */}
                  <div className="flex items-center justify-between border-b pb-1.5 z-10" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-[7.5px] font-bold text-zinc-400">إرشادات وأحكام الاستخدام الرسمي</span>
                    <span className="text-[7.5px] font-bold text-zinc-500">AGOA ACADEMY</span>
                  </div>

                  {/* Back body: instructions & QR */}
                  <div className="flex-1 flex gap-3 items-center mt-2 z-10" dir="rtl">
                    {/* Rules */}
                    <div className="flex-1 flex flex-col justify-between h-[30mm] text-right text-[6.5px] leading-relaxed text-zinc-400">
                      <ul className="space-y-1 pr-1.5 list-disc list-inside">
                        <li>تُستخدم هذه البطاقة لإثبات الهوية الفنية لحاملها بملاعب الأكاديمية.</li>
                        <li>البطاقة شخصية بالكامل وغير قابلة للإعارة أو الاستخدام المشترك.</li>
                        <li>في حال فقدان البطاقة يرجى إبلاغ الإدارة فوراً لاستخراج بديل.</li>
                      </ul>
                      
                      <div className="mt-1 border-t pt-1 border-zinc-800/80">
                        <p className="font-bold text-zinc-300">التحقق المهني الرقمي:</p>
                        <p className="text-[5.8px] text-zinc-500 leading-tight">يرجى مسح رمز الاستجابة السريعة (QR Code) المقابل للتحقق من هوية وصلاحية الإطار الفني.</p>
                      </div>
                    </div>

                    {/* QR Code - Formatted as complete Contact Card (vCard) */}
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

                  {/* Back footer */}
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
    </div>
  );
}
