import React, { useState, useEffect, useRef } from "react";
import type { AcademySettings as AcademySettingsType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import { Building2, Users, CreditCard, Shield, Printer, Settings as SettingsIcon, Save, Plus, Trash2, Edit2, Check, Camera, Loader2, Database, Download, Upload, AlertTriangle, Lock, Eye, EyeOff, FileSpreadsheet, Smartphone, Globe, Share2, Sun, Moon, Paintbrush } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Modal } from "@/components/ui/modal";
import { useAcademy } from "@/services/AcademyContext";

// --- Academy Settings Component ---
function AcademySettings() {
  const { settings: globalSettings, updateSettings } = useAcademy();
  const [settings, setSettings] = useState<AcademySettingsType>({
    name: "",
    logo_url: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    public_url: "",
    description: "",
    current_season: "",
    theme: "dark",
    baridi_rip: "",
    baridi_name: "",
    notify_whatsapp: false,
    admin_notification_phone: "",
    notify_email: false,
    admin_notification_email: "",
    emailjs_service_id: "",
    emailjs_template_id: "",
    emailjs_public_key: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (globalSettings) {
      setSettings(globalSettings);
      setLoading(false);
    }
  }, [globalSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      alert("تم حفظ الإعدادات بنجاح وتطبيقها في جميع الأقسام");
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      alert(`فشل حفظ الإعدادات: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setSaving(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max size 300px for logo to keep the payload very small
          const MAX_SIZE = 300;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          resolve(dataUrl);
        };
        img.onerror = (e) => reject(e);
        img.src = event.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      try {
        const file = e.target.files[0];
        const compressedBase64 = await compressImage(file);
        setSettings(prev => ({ ...prev, logo_url: compressedBase64 }));
      } catch (error: any) {
        console.error("Logo upload failed:", error);
        alert("فشل رفع أو ضغط الشعار.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // Helper to parse current theme string into Mode & Color
  const themeVal = settings.theme || "dark";
  const isLightMode = themeVal.startsWith("light");
  
  let activeColor = "green"; // Default
  if (themeVal.endsWith("red") || themeVal === "red") activeColor = "red";
  else if (themeVal.endsWith("gold") || themeVal === "amber") activeColor = "gold";
  else if (themeVal.endsWith("white") || themeVal === "dark") activeColor = "white";
  else if (themeVal.endsWith("green") || themeVal === "emerald" || themeVal === "light") activeColor = "green";

  const handleThemeModeChange = (mode: 'dark' | 'light') => {
    const newThemeStr = `${mode}-${activeColor}`;
    setSettings(prev => ({ ...prev, theme: newThemeStr }));
    // Live update document attribute for preview
    document.documentElement.setAttribute('data-theme', newThemeStr);
  };

  const handleThemeColorChange = (color: string) => {
    const mode = isLightMode ? 'light' : 'dark';
    const newThemeStr = `${mode}-${color}`;
    setSettings(prev => ({ ...prev, theme: newThemeStr }));
    // Live update document attribute for preview
    document.documentElement.setAttribute('data-theme', newThemeStr);
  };

  if (loading) return <div className="text-zinc-400 py-10 text-center">جاري تحميل إعدادات الأكاديمية...</div>;

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/50 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/20">
        <CardTitle className="text-zinc-50 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-500" />
          معلومات الأكاديمية
        </CardTitle>
        <CardDescription className="text-zinc-400 font-medium">قم بتحديث المعلومات الأساسية والشعار الخاص بالأكاديمية.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="flex flex-col items-center gap-6 pb-6 pt-2 border-b border-zinc-800/50">
          <div className="relative group">
            <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/50 shadow-inner">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Academy Logo" className="h-full w-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-600">
                  <Building2 className="h-12 w-12" />
                  <span className="text-[10px] font-black uppercase">NO LOGO</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Uploading</span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xl hover:bg-emerald-700 transition-all hover:scale-110 active:scale-95 z-10"
              title="تغيير الشعار"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            className="hidden"
            accept="image/*"
          />
          <div className="text-center space-y-1">
            <p className="text-sm font-black text-zinc-300">شعار الأكاديمية الرسمي</p>
            <p className="text-[11px] text-zinc-500 font-medium">يدعم PNG, JPG, WEBP (يفضل خلفية شفافة)</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">اسم الأكاديمية</label>
            <input
              name="name"
              value={settings.name}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">رابط الشعار (URL)</label>
            <input
              name="logo_url"
              value={settings.logo_url || ''}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">رقم الهاتف</label>
            <input
              name="phone"
              value={settings.phone || ''}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">البريد الإلكتروني</label>
            <input
              name="email"
              value={settings.email || ''}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-400">العنوان</label>
            <input
              name="address"
              value={settings.address || ''}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-amber-500">رابط المنصة النهائي (Public App URL)</label>
            <input
              name="public_url"
              value={settings.public_url || ''}
              onChange={handleChange}
              placeholder="مثال: https://ajyal-academy.netlify.app"
              className="w-full rounded-md border border-amber-500/30 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-amber-500 focus:outline-none"
            />
            <p className="text-[10px] text-zinc-500 font-medium">هذا الرابط سيظهر للأولياء لتحميل التطبيق ومتابعة أبنائهم.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">الموسم الرياضي الحالي</label>
            <input
              name="current_season"
              value={settings.current_season || ''}
              onChange={handleChange}
              placeholder="مثال: 2025/2026"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="space-y-4 md:col-span-2 p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 shadow-inner">
            <label className="text-sm font-black text-zinc-300 font-tajawal flex items-center gap-2">
              <Paintbrush className="h-4 w-4 text-emerald-500 animate-pulse" />
              تخصيص مظهر البرنامج (App Theme Customizer)
            </label>
            <p className="text-[11px] text-zinc-500 font-medium -mt-2">اختر الوضع المفضل لديك ولون الطابع العام المنسق لكامل أقسام الأكاديمية.</p>

            <div className="grid gap-6 sm:grid-cols-2 pt-2">
              {/* 1. App Mode Selection */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">1. وضع الشاشة (App Mode)</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('dark')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all active:scale-95",
                      !isLightMode
                        ? "border-emerald-500 bg-emerald-500/10 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-400 font-medium"
                    )}
                  >
                    <Moon className={cn("h-4 w-4", !isLightMode ? "text-emerald-400" : "")} />
                    <span className="text-xs">الوضع الداكن 🌙</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('light')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all active:scale-95",
                      isLightMode
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-400 font-medium"
                    )}
                  >
                    <Sun className={cn("h-4 w-4", isLightMode ? "text-emerald-500" : "")} />
                    <span className="text-xs">الوضع الفاتح ☀️</span>
                  </button>
                </div>
              </div>

              {/* 2. Accent Color Selection */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">2. لون المظهر العام (Branding Accent)</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'green', name: 'أخضر', color: 'bg-emerald-500' },
                    { id: 'red', name: 'أحمر', color: 'bg-rose-500' },
                    { id: 'gold', name: 'ذهبي', color: 'bg-amber-500' },
                    { id: 'white', name: 'أبيض', color: isLightMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-white' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleThemeColorChange(c.id)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all active:scale-95",
                        activeColor === c.id
                          ? "border-emerald-500 bg-emerald-500/5 shadow-md"
                          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                      )}
                    >
                      <div className={cn("h-6 w-6 rounded-full shadow-md flex items-center justify-center", c.color)}>
                        {activeColor === c.id && <Check className={cn("h-3.5 w-3.5 font-black stroke-[3px]", c.id === 'white' && !isLightMode ? 'text-zinc-950' : 'text-white')} />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold",
                        activeColor === c.id ? "text-zinc-100" : "text-zinc-500"
                      )}>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-400">وصف الأكاديمية</label>
            <textarea
              name="description"
              value={settings.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800/50">
          <h3 className="text-sm font-black text-blue-500 flex items-center gap-2 mb-4 uppercase tracking-widest font-tajawal">
            <Share2 className="h-4 w-4" />
            تنبيهات التسجيل الجديد
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-500" /> تنبيه الواتساب
                  </label>
                  <p className="text-[10px] text-zinc-500">تلقي تنبيه عند كل طلب تسجيل جديد.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notify_whatsapp || false}
                  onChange={(e) => setSettings({ ...settings, notify_whatsapp: e.target.checked })}
                  className="h-5 w-5 rounded border-zinc-800 bg-zinc-900 text-emerald-600 focus:ring-emerald-600"
                />
              </div>
              {settings.notify_whatsapp && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">رقم الهاتف للتنبيهات</label>
                  <input
                    name="admin_notification_phone"
                    value={settings.admin_notification_phone || ""}
                    onChange={handleChange}
                    placeholder="مثال: 213661XXXXXX"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" /> تنبيه البريد الإلكتروني
                  </label>
                  <p className="text-[10px] text-zinc-500">تلقي رسالة بريد إلكتروني عند كل طلب.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notify_email || false}
                  onChange={(e) => setSettings({ ...settings, notify_email: e.target.checked })}
                  className="h-5 w-5 rounded border-zinc-800 bg-zinc-900 text-blue-600 focus:ring-blue-600"
                />
              </div>
              {settings.notify_email && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">البريد الإلكتروني للتلقي</label>
                    <input
                      name="admin_notification_email"
                      value={settings.admin_notification_email || ""}
                      onChange={handleChange}
                      placeholder="admin@example.com"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-50 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase">EmailJS Service ID</label>
                      <input name="emailjs_service_id" value={settings.emailjs_service_id || ""} onChange={handleChange} className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase">EmailJS Template ID</label>
                      <input name="emailjs_template_id" value={settings.emailjs_template_id || ""} onChange={handleChange} className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase">EmailJS Public Key</label>
                    <input name="emailjs_public_key" value={settings.emailjs_public_key || ""} onChange={handleChange} className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 focus:outline-none" />
                  </div>
                  <p className="text-[9px] text-zinc-600 italic leading-relaxed">استخدم خدمة EmailJS (مجانية) لإرسال التنبيهات برمجياً من المتصفح.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800/50">
          <h3 className="text-sm font-black text-emerald-500 flex items-center gap-2 mb-4 uppercase tracking-widest font-tajawal">
            <Smartphone className="h-4 w-4" />
            إعدادات الدفع (بريدي موب)
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">رقم الحساب (RIP)</label>
              <input
                name="baridi_rip"
                value={settings.baridi_rip || ""}
                onChange={handleChange}
                placeholder="0079999900XXXXXXXXXX"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none font-tajawal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">اسم صاحب الحساب</label>
              <input
                name="baridi_name"
                value={settings.baridi_name || ""}
                onChange={handleChange}
                placeholder="BARIDI MOB USER"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none font-tajawal"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2 rounded-xl"
          >
            {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Categories Settings Component ---
function CategoriesSettings() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", age_group: "", color: "#059669" });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, age_group: category.age_group, color: category.color });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", age_group: "", color: "#059669" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      if (editingCategory && editingCategory.category_id > 0) {
        await api.updateCategory(editingCategory.category_id, formData);
      } else {
        await api.addCategory(formData);
      }
      await loadCategories();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save category:", error);
      alert(`فشل حفظ الفئة: ${error.message || 'خطأ غير معروف'}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      try {
        await api.deleteCategory(id);
        await loadCategories();
      } catch (error) {
        console.error("Failed to delete category:", error);
        alert("فشل حذف الفئة");
      }
    }
  };

  if (isModalOpen) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800/50 animate-in fade-in zoom-in duration-300">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-zinc-800/50 pb-4">
          <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white shrink-0">
            <SettingsIcon className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-zinc-50">{editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}</CardTitle>
            <CardDescription className="text-zinc-400">يرجى ملء جميع الحقول لتسجيل الفئة بشكل صحيح.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">اسم الفئة</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: U13"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">العمر</label>
              <input
                required
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: 12-13 سنة"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-400">لون الفئة</label>
              <div className="flex items-center gap-4 border border-zinc-800 bg-zinc-950 p-2 rounded-xl">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-14 h-14 rounded-lg bg-transparent cursor-pointer"
                />
                <span className="text-zinc-50 font-bold uppercase">{formData.color}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 sm:col-span-2 pt-4 border-t border-zinc-800/50">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-zinc-800 text-zinc-300 w-full sm:w-auto h-12 rounded-xl">إلغاء</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 rounded-xl">حفظ التغييرات</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-zinc-50">الفئات العمرية</CardTitle>
          <CardDescription className="text-zinc-400">إدارة الفئات العمرية للأكاديمية.</CardDescription>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          إضافة فئة
        </Button>
      </CardHeader>
      <CardContent>
        {/* Mobile View Card List */}
        <div className="sm:hidden divide-y divide-zinc-800/50 border-t border-zinc-800/50">
          {categories.map((cat) => (
            <div key={cat.category_id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full ring-1 ring-zinc-700" style={{ backgroundColor: cat.color }}></div>
                <div>
                  <p className="text-sm font-medium text-zinc-50">{cat.name}</p>
                  <p className="text-[10px] text-zinc-400">{cat.age_group}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cat)} className="text-zinc-400 hover:text-emerald-500 h-8 w-8">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.category_id)} className="text-zinc-400 hover:text-rose-500 h-8 w-8">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">اسم الفئة</th>
                <th className="px-4 py-3 font-medium">العمر</th>
                <th className="px-4 py-3 font-medium">اللون</th>
                <th className="px-4 py-3 font-medium text-left">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {categories.map((cat) => (
                <tr key={cat.category_id} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3 text-zinc-50">{cat.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{cat.age_group}</td>
                  <td className="px-4 py-3">
                    <div className="h-6 w-6 rounded-full border border-zinc-700" style={{ backgroundColor: cat.color }}></div>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cat)} className="text-zinc-400 hover:text-emerald-500">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.category_id)} className="text-zinc-400 hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Subscription Settings Component ---
function SubscriptionSettings() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", price: "", duration: "شهر", description: "" });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getSubscriptionPlans();
      setPlans(data || []);
    } catch (error) {
      console.error("Failed to load plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ name: plan.name, price: plan.price, duration: plan.duration, description: plan.description });
    } else {
      setEditingPlan(null);
      setFormData({ name: "", price: "", duration: "شهر", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      if (editingPlan) {
        await api.updateSubscriptionPlan(editingPlan.plan_id, formData);
      } else {
        await api.addSubscriptionPlan(formData);
      }
      await loadPlans();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save plan:", error);
      alert("فشل حفظ خطة الاشتراك");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الخطة؟")) {
      try {
        await api.deleteSubscriptionPlan(id);
        await loadPlans();
      } catch (error) {
        console.error("Failed to delete plan:", error);
        alert("فشل حذف خطة الاشتراك");
      }
    }
  };

  if (isModalOpen) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800/50 animate-in fade-in zoom-in duration-300">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-zinc-800/50 pb-4">
          <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white shrink-0">
            <SettingsIcon className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-zinc-50">{editingPlan ? "تعديل الاشتراك" : "إضافة اشتراك جديد"}</CardTitle>
            <CardDescription className="text-zinc-400">إدخال تفاصيل الاشتراك بدقة وتوضيح المميزات.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">اسم الاشتراك</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: اشتراك شهري"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">السعر (دج)</label>
              <input
                required
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-400">المدة</label>
              <select
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
              >
                <option value="شهر">شهر</option>
                <option value="3 أشهر">3 أشهر</option>
                <option value="6 أشهر">6 أشهر</option>
                <option value="سنة">سنة</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-400">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 sm:col-span-2 pt-4 border-t border-zinc-800/50">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-zinc-800 text-zinc-300 w-full sm:w-auto h-12 rounded-xl">إلغاء</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-12 rounded-xl">حفظ التغييرات</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-zinc-50">خطط الاشتراك</CardTitle>
          <CardDescription className="text-zinc-400">إدارة خطط الاشتراك والأسعار.</CardDescription>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          إضافة اشتراك
        </Button>
      </CardHeader>
      <CardContent>
        {/* Mobile View Card List */}
        <div className="sm:hidden divide-y divide-zinc-800/50 border-t border-zinc-800/50">
          {plans.map((plan) => (
            <div key={plan.plan_id} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-zinc-50">{plan.name}</p>
                <p className="text-xs text-emerald-400 font-bold">{plan.price} دج</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-zinc-500">{plan.duration}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(plan)} className="text-zinc-400 hover:text-emerald-500 h-8 w-8">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.plan_id)} className="text-zinc-400 hover:text-rose-500 h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">اسم الاشتراك</th>
                <th className="px-4 py-3 font-medium">السعر</th>
                <th className="px-4 py-3 font-medium">المدة</th>
                <th className="px-4 py-3 font-medium">الوصف</th>
                <th className="px-4 py-3 font-medium text-left">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {plans.map((plan) => (
                <tr key={plan.plan_id} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3 text-zinc-50">{plan.name}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">{plan.price} دج</td>
                  <td className="px-4 py-3 text-zinc-400">{plan.duration}</td>
                  <td className="px-4 py-3 text-zinc-400">{plan.description}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(plan)} className="text-zinc-400 hover:text-emerald-500">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.plan_id)} className="text-zinc-400 hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Print Settings Component ---
function PrintSettings() {
  const [settings, setSettings] = useState({
    print_logo: true,
    print_qr: true,
    print_color: 'color',
    print_size: 'A4'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getAcademySettings();
      if (data) setSettings({
        print_logo: data.print_logo,
        print_qr: data.print_qr,
        print_color: data.print_color || 'color',
        print_size: data.print_size || 'A4'
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateAcademySettings(settings);
      alert("تم حفظ إعدادات الطباعة");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/50">
      <CardHeader>
        <CardTitle className="text-zinc-50">إعدادات الطباعة</CardTitle>
        <CardDescription className="text-zinc-400">تخصيص مظهر الوثائق المطبوعة.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/20">
          <div className="space-y-0.5">
            <label className="text-base font-medium text-zinc-50">شعار الأكاديمية</label>
            <p className="text-sm text-zinc-400">إظهار شعار الأكاديمية في رأس الصفحة للوثائق.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.print_logo}
            onChange={(e) => setSettings({ ...settings, print_logo: e.target.checked })}
            className="h-5 w-5 rounded border-zinc-700 bg-zinc-800 text-emerald-600 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/20">
          <div className="space-y-0.5">
            <label className="text-base font-medium text-zinc-50">رمز الاستجابة السريعة (QR Code)</label>
            <p className="text-sm text-zinc-400">إضافة QR Code للتحقق من صحة الوثائق والبطاقات.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.print_qr}
            onChange={(e) => setSettings({ ...settings, print_qr: e.target.checked })}
            className="h-5 w-5 rounded border-zinc-700 bg-zinc-800 text-emerald-600 focus:ring-emerald-600"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">لون الوثائق</label>
            <select
              value={settings.print_color}
              onChange={(e) => setSettings({ ...settings, print_color: e.target.value })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            >
              <option value="color">ملون</option>
              <option value="grayscale">أبيض وأسود</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">حجم الورق الافتراضي</label>
            <select
              value={settings.print_size}
              onChange={(e) => setSettings({ ...settings, print_size: e.target.value })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- System Settings Component ---
function SystemSettings() {
  const [settings, setSettings] = useState({
    language: 'ar',
    currency: 'DZD',
    date_format: 'DD/MM/YYYY',
    notifications_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getAcademySettings();
      if (data) setSettings({
        language: data.language || 'ar',
        currency: data.currency || 'DZD',
        date_format: data.date_format || 'DD/MM/YYYY',
        notifications_enabled: data.notifications_enabled
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateAcademySettings(settings);
      alert("تم حفظ إعدادات النظام");
      window.location.reload();
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/50">
      <CardHeader>
        <CardTitle className="text-zinc-50">إعدادات النظام</CardTitle>
        <CardDescription className="text-zinc-400">تخصيص الإعدادات العامة للنظام.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">اللغة</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">العملة</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            >
              <option value="DZD">دينار جزائري (DZD)</option>
              <option value="USD">دولار أمريكي (USD)</option>
              <option value="EUR">يورو (EUR)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">تنسيق التاريخ</label>
            <select
              value={settings.date_format}
              onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/20">
          <div className="space-y-0.5">
            <label className="text-base font-medium text-zinc-50">الإشعارات</label>
            <p className="text-sm text-zinc-400">تفعيل الإشعارات داخل النظام.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.notifications_enabled}
            onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
            className="h-5 w-5 rounded border-zinc-700 bg-zinc-800 text-emerald-600 focus:ring-emerald-600"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Backup Settings Component ---
function BackupSettings() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await api.getAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `academy_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("فشل تصدير النسخة الاحتياطية");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      // Dynamic import to prevent build issues and white screen
      const XLSX = await import('xlsx');
      const data = await api.getAllData();
      const wb = XLSX.utils.book_new();

      // Add each table as a sheet
      Object.keys(data).forEach(tableName => {
        if (Array.isArray(data[tableName]) && data[tableName].length > 0) {
          const ws = XLSX.utils.json_to_sheet(data[tableName]);
          XLSX.utils.book_append_sheet(wb, ws, tableName.substring(0, 31)); // Excel sheet names max 31 chars
        }
      });

      XLSX.writeFile(wb, `academy_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Excel Export failed:", error);
      alert("فشل تصدير ملف إكسل");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("تحذير: استيراد البيانات سيقوم بحذف كافة البيانات الحالية واستبدالها بالبيانات الموجودة في الملف. هل تريد الاستمرار؟")) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);

          // Import in specific order to handle dependencies (roughly)
          const tableOrder = [
            'academy_settings', 'categories', 'subscription_plans', 'coaches',
            'teams', 'parents', 'players', 'training', 'attendance', 'ems_matches',
            'ems_match_players', 'ems_match_events', 'stock_entries', 'stock_outputs',
            'player_stats', 'subscriptions', 'payments', 'injuries', 'evaluations',
            'finances', 'kits', 'parent_players', 'parent_notifications'
          ];

          for (const table of tableOrder) {
            if (data[table]) {
              await api.restoreData(table, data[table]);
            }
          }

          alert("تم استيراد البيانات بنجاح. سيتم إعادة تحميل الصفحة.");
          window.location.reload();
        } catch (err) {
          console.error("Parse/Restore error:", err);
          alert("فشل تحليل ملف النسخة الاحتياطية");
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Import failed:", error);
      alert("فشل استيراد النسخة الاحتياطية");
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/50">
      <CardHeader>
        <CardTitle className="text-zinc-50">النسخ الاحتياطي واستعادة البيانات</CardTitle>
        <CardDescription className="text-zinc-400">قم بتصدير نسخة من قاعدة البيانات أو استعادتها من ملف سابق.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Download className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-50">تصدير البيانات</h3>
              <p className="text-sm text-zinc-400 mt-1">تحميل كافة بيانات الأكاديمية في ملف JSON واحد للحتفاظ به كنسخة احتياطية.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleExport} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <Download className="mr-2 h-4 w-4" />
                {loading ? "جاري التصدير..." : "تصدير نسخة احتياطية (JSON)"}
              </Button>
              <Button onClick={handleExportExcel} disabled={loading} variant="outline" className="w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 font-bold">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                تصدير ملف إكسل (Excel)
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-50">استيراد البيانات</h3>
              <p className="text-sm text-zinc-400 mt-1">رفع ملف نسخة احتياطية سابقة لاستعادة كافة البيانات. سيتم حذف البيانات الحالية!</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
              accept=".json"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={importing} variant="outline" className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              {importing ? "جاري الاستيراد..." : "استيراد من ملف"}
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <div className="text-sm text-rose-200">
            <p className="font-bold">تنبيه هام:</p>
            <p>عملية استيراد البيانات نهائية ولا يمكن التراجع عنها. تأكد من أن الملف الذي تقوم برفعه هو نسخة احتياطية صحيحة تم تصديرها من هذا النظام.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FactoryReset() {
  const [password, setPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const tables = [
    { id: 'players', name: 'اللاعبين وطلبات التسجيل' },
    { id: 'categories', name: 'الفئات العمرية' },
    { id: 'teams', name: 'الفرق الرياضية' },
    { id: 'coaches', name: 'المدربين' },
    { id: 'finances', name: 'الحركات المالية (مداخيل/مصاريف)' },
    { id: 'payments', name: 'سجلات الدفع' },
    { id: 'subscriptions', name: 'اشتراكات اللاعبين' },
    { id: 'subscription_plans', name: 'خطط الاشتراك' },
    { id: 'stock_entries', name: 'المخزن - دخول' },
    { id: 'stock_outputs', name: 'المخزن - خروج' },
    { id: 'training', name: 'حصص التدريب' },
    { id: 'attendance', name: 'سجلات التحضير' },
    { id: 'ems_matches', name: 'المباريات (EMS)' },
    { id: 'ems_match_players', name: 'قوائم اللاعبين المستدعين' },
    { id: 'ems_match_events', name: 'أحداث المباريات' },
    { id: 'kits', name: 'سجلات توزيع الألبسة' },
    { id: 'evaluations', name: 'تقييمات اللاعبين' },
    { id: 'player_stats', name: 'إحصائيات اللاعبين' },
    { id: 'injuries', name: 'سجلات الإصابات' },
    { id: 'parents', name: 'حسابات الأولياء' },
    { id: 'parent_players', name: 'ربط الأولياء باللاعبين' },
    { id: 'parent_notifications', name: 'إشعارات الأولياء' },
  ];

  const handleToggleTable = (id: string) => {
    setSelectedTables(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleStartReset = () => {
    if (selectedTables.length === 0) {
      alert("يرجى اختيار جدول واحد على الأقل");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmReset = async () => {
    if (password !== "admin") {
      alert("كلمة المرور غير صحيحة");
      return;
    }

    setIsClearing(true);
    try {
      for (const table of selectedTables) {
        await api.clearTable(table);
      }
      alert("تم تفريغ الجداول المختارة بنجاح");
      window.location.reload();
    } catch (error) {
      console.error("Reset failed:", error);
      alert("حدث خطأ أثناء محاولة تفريغ البيانات");
    } finally {
      setIsClearing(false);
      setShowConfirm(false);
      setPassword("");
    }
  };

  return (
    <Card className="bg-zinc-900/40 border-rose-900/20">
      <CardHeader>
        <CardTitle className="text-rose-500 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          إعادة ضبط المصنع
        </CardTitle>
        <CardDescription className="text-zinc-400">
          تفريغ البيانات من الجداول المختارة بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tables.map(table => (
            <div
              key={table.id}
              onClick={() => handleToggleTable(table.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTables.includes(table.id)
                ? 'bg-rose-500/10 border-rose-500/40'
                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${selectedTables.includes(table.id) ? 'text-rose-400' : 'text-zinc-300'}`}>
                  {table.name}
                </span>
                <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${selectedTables.includes(table.id) ? 'bg-rose-500 border-rose-500 text-white' : 'border-zinc-700'
                  }`}>
                  {selectedTables.includes(table.id) && <Check className="h-3 w-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-start">
          <Button
            onClick={() => setSelectedTables(tables.map(t => t.id))}
            variant="ghost"
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            تحديد الكل
          </Button>
          <Button
            onClick={() => setSelectedTables([])}
            variant="ghost"
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            إلغاء التحديد
          </Button>
        </div>

        <div className="pt-4 border-t border-zinc-800/50 flex justify-end">
          <Button
            onClick={handleStartReset}
            disabled={selectedTables.length === 0}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 shadow-lg shadow-rose-900/20"
          >
            تفريغ البيانات المحددة
          </Button>
        </div>

        <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="تأكيد عملية المسح">
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <p className="text-sm text-rose-300 font-bold mb-2">تحذير أمني:</p>
              <p className="text-sm text-rose-200/80">
                سيتم مسح كافة البيانات من الجداول التالية:
                <span className="font-bold"> {selectedTables.map(id => tables.find(t => t.id === id)?.name).join('، ')}</span>.
                يرجى إدخال كلمة المرور "admin" للمتابعة.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">كلمة مرور المدير (admin)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                placeholder="أدخل admin"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)} className="border-zinc-800 text-zinc-300">إلغاء</Button>
              <Button
                onClick={handleConfirmReset}
                disabled={isClearing || password !== 'admin'}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isClearing ? "جاري المسح..." : "تأكيد المسح النهائي"}
              </Button>
            </div>
          </div>
        </Modal>
      </CardContent>
    </Card>
  );
}

// --- Mobile App Settings Component ---
function MobileAppSettings() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    api.getAcademySettings().then(s => setUrl(s?.public_url || window.location.origin));
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/40 border-zinc-800/50 shadow-xl overflow-hidden">
        <CardHeader className="bg-zinc-900/20 border-b border-zinc-800/50">
          <CardTitle className="text-zinc-50 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" />
            تطبيق الهاتف (APK & PWA)
          </CardTitle>
          <CardDescription className="text-zinc-400">دليل تشغيل التطبيق وإرساله للأولياء.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-zinc-50">1. رابط المنصة الحالي</h3>
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between group">
                <code className="text-emerald-500 text-sm font-mono truncate">{url}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(url);
                    alert("تم نسخ الرابط بنجاح!");
                  }}
                  className="text-zinc-500 hover:text-emerald-500"
                >
                  نسخ الرابط
                </Button>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                هذا هو الرابط الذي تستخدمه حالياً. بمجرد رفع الموقع على استضافة (مثل Netlify أو Vercel)، قم بتحديث "رابط المنصة النهائي" في تبويب إعدادات الأكاديمية.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-zinc-50">2. كيفية إنشاء تطبيق APK</h3>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  لتحويل الموقع إلى ملف APK حقيقي يمكنك إرساله للأولياء:
                </p>
                <ol className="text-[11px] text-zinc-300 space-y-2 list-decimal list-inside">
                  <li>قم برفع موقعك على استضافة حقيقية (Netlify أو Vercel مجاناً).</li>
                  <li>استخدم خدمة مثل <a href="https://web2apk.com" target="_blank" className="text-emerald-500 underline">Web2APK</a> أو <a href="https://pwabuilder.com" target="_blank" className="text-emerald-500 underline">PWA Builder</a>.</li>
                  <li>أدخل رابط موقعك النهائي وقم بتوليد ملف الـ APK.</li>
                  <li>ارفع الملف على Google Drive أو Github وأضف الرابط هنا.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 border-dashed text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="text-zinc-50 font-black">حل بديل وسريع (PWA)</h4>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
              لا تحتاج لإنشاء APK بالضرورة! اطلب من الأولياء فتح الرابط في متصفح Chrome ثم اختيار <strong>"إضافة إلى الشاشة الرئيسية"</strong>.
              سيظهر شعار الأكاديمية على هواتفهم كأنه تطبيق تماماً وسيحصلون على التنبيهات فورياً.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// --- Admins (Security) Settings Component ---
function SecuritySettings() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [formData, setFormData] = useState({ username: "", password: "", full_name: "", role_title: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const data = await api.getAdmins();
      setAdmins(data || []);
    } catch (error) {
      console.error("Failed to load admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (admin?: any) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({ username: admin.username, password: admin.password, full_name: admin.full_name, role_title: admin.role_title });
    } else {
      setEditingAdmin(null);
      setFormData({ username: "", password: "", full_name: "", role_title: "" });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.username || !formData.password || !formData.full_name || !formData.role_title) {
      alert("الرجاء تعبئة جميع الحقول المطلوبة.");
      return;
    }

    try {
      if (editingAdmin) {
        await api.updateAdmin(editingAdmin.id, formData);
      } else {
        await api.addAdmin(formData);
      }
      loadAdmins();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save admin:", error);
      alert(`فشل الحفظ: ${error.message || "تأكد من إدخال اسم مستخدم فريد وتشغيل ملف التحديث SQL."}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف حساب الإدارة هذا؟ الإجراء نهائي ولا يمكن التراجع عنه.")) {
      try {
        await api.deleteAdmin(id);
        loadAdmins();
      } catch (error) {
        console.error("Failed to delete admin:", error);
        alert("فشل الحذف");
      }
    }
  };

  if (loading) return <div className="text-zinc-400 py-10 text-center font-tajawal">جاري تحميل إعدادات الأمان...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdmin ? "تعديل حساب مسؤول" : "إضافة حساب مسؤول جديد"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-zinc-700 text-zinc-300">إلغاء</Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 shadow-lg shadow-amber-900/20">حفظ المسؤول</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-300">الاسم واللقب</label>
              <input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="مثال: أحمد محمد"
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-300">الصفة (المنصب)</label>
              <input
                value={formData.role_title}
                onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                placeholder="مثال: رئيس الأكاديمية"
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-300">اسم المستخدم (للتسجيل)</label>
            <div className="relative">
              <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 pr-10 pl-4 py-3 text-sm text-zinc-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none font-mono transition-all"
                placeholder="admin_ahmed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-300">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 pr-10 pl-12 py-3 text-sm text-zinc-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none font-mono transition-all"
                placeholder="أدخل كلمة مرور قوية"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Card className="bg-zinc-900/40 border-zinc-800/50 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-50 flex items-center gap-2 font-tajawal">
              <Shield className="h-5 w-5 text-amber-500" />
              إدارة الحسابات (المسؤولين)
            </CardTitle>
            <CardDescription className="text-zinc-400 font-tajawal">
              يمكنك إضافة أكثر من مسؤول (رئيس الأكاديمية، الأمين العام، أمين المال...) وكل شخص يدخل بحسابه الخاص ويتم طباعة اسمه وصفته في الوثائق.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            إضافة مسؤول جديد
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-zinc-900/60 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">الاسم الكامل</th>
                  <th className="px-4 py-3 font-medium">الصفة (المنصب)</th>
                  <th className="px-4 py-3 font-medium">اسم المستخدم</th>
                  <th className="px-4 py-3 font-medium">كلمة المرور</th>
                  <th className="px-4 py-3 font-medium text-left">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3 text-zinc-50 font-bold">{admin.full_name}</td>
                    <td className="px-4 py-3 text-amber-500 font-bold">{admin.role_title}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono text-xs">{admin.username}</td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">••••••••</td>
                    <td className="px-4 py-3 flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(admin)} className="text-zinc-400 hover:text-amber-500">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(admin.id)} className="text-zinc-400 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      لم يتم العثور على مسؤولين في هذه القائمة. يُرجى إضافة مسؤول وتشغيل ملف ADMINS_SYSTEM.sql في قاعدة البيانات.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Settings Page ---
export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-50">الإعدادات</h2>
        <p className="text-zinc-400 mt-1">إدارة إعدادات الأكاديمية والنظام.</p>
      </div>

      <Tabs defaultValue="academy" className="space-y-6">
        <div className="bg-zinc-900/60 border border-zinc-800/50 p-1 rounded-2xl w-full overflow-x-auto no-scrollbar">
          <TabsList className="bg-transparent border-none p-0 flex h-auto justify-start lg:justify-center gap-1 flex-nowrap whitespace-nowrap">
            <TabsTrigger value="academy" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shrink-0">
              الأكاديمية
            </TabsTrigger>
            <TabsTrigger value="print" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shrink-0">
              الطباعة
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shrink-0">
              الفئات
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shrink-0">
              الاشتراكات
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shrink-0">
              الأمان
            </TabsTrigger>
            <TabsTrigger value="backup" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shrink-0">
              البيانات
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shrink-0">
              النظام
            </TabsTrigger>
            <TabsTrigger value="reset" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shrink-0">
              المصنع
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="academy">
          <AcademySettings />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesSettings />
        </TabsContent>
        <TabsContent value="subscriptions">
          <SubscriptionSettings />
        </TabsContent>
        <TabsContent value="print">
          <PrintSettings />
        </TabsContent>
        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="backup">
          <BackupSettings />
        </TabsContent>
        <TabsContent value="deployment">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-500" />
                تحويل الموقع إلى تطبيق هاتف (APK)
              </CardTitle>
              <CardDescription>اتبع هذه الخطوات لتحويل منصة الأكاديمية إلى تطبيق أندرويد حقيقي للأولياء والمدربين.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-zinc-50 text-sm">1. الرفع والاستضافة</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    قم برفع موقعك على استضافة حقيقية (مثل Netlify أو Vercel) للحصول على رابط ثابت يبدأ بـ https.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-zinc-50 text-sm">2. توليد ملف APK</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    استخدم خدمة مثل <span className="text-emerald-500">Web2APK</span> أو <span className="text-emerald-500">PWA Builder</span>، وأدخل رابط موقعك النهائي.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="font-bold text-zinc-50 text-sm">3. النشر للأولياء</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    ارفع ملف الـ APK الناتج على Google Drive أو Github وأرسل الرابط للأولياء لتحميله وتثبيته.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  ملاحظة هامة للأولياء
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  عند إرسال التطبيق للأولياء، يرجى إرشادهم لتفعيل خيار "تثبيت تطبيقات من مصادر غير معروفة" في إعدادات الهاتف ليتمكنوا من تثبيت ملف الـ APK مباشرة.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() => window.open('https://www.pwabuilder.com/', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Globe className="ml-2 h-4 w-4" />
                  ابدأ استخدام PWA Builder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reset">
          <FactoryReset />
        </TabsContent>
        <TabsContent value="mobile">
          <MobileAppSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
