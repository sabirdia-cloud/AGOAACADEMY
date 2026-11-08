import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuth } from "@/services/AuthContext";
import { Trophy, User, Calendar, Phone, Users, CheckCircle2, Loader2, MapPin, Scale, Ruler, Droplets, Shirt, FileText, Shield, ArrowRight, ArrowLeft, Camera, Check, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { wilayas, algeriaCities } from "@/data/algeria";
import { cn } from "@/lib/utils";

export function PlayerRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isJustSignedUp = (location.state as any)?.justSignedUp;
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [academyName, setAcademyName] = useState("أكاديمية أجيال وادي العثمانية");
  const [academyLogo, setAcademyLogo] = useState<string | null>("/academy-logo.png");
  const [selectedWilaya, setSelectedWilaya] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [agreedToRules, setAgreedToRules] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    birth_date: "",
    birth_state: "",
    birth_city: "",
    weight: "",
    height: "",
    blood_type: "",
    uniform_size: "",
    father_name: "",
    phone: "",
    address: "",
    id_card_number: "",
    id_card_issue_date: "",
    parent_username: "",
    parent_password: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "birth_state") setSelectedWilaya(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settings = await api.getAcademySettings().catch(() => null);
        if (settings) {
          setAcademyName(settings.name || "أكاديمية كرة القدم");
          setAcademyLogo(settings.logo_url);
        }
      } catch (error) { }
    };
    fetchData();
  }, []);

  const totalSteps = user?.role === 'parent' ? 7 : 8; // Steps including rules

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!agreedToRules) return;
    setIsLoading(true);

    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await api.uploadPlayerPhoto(photoFile);
      }

      const requestData = {
        name: formData.name,
        birth_date: formData.birth_date,
        birth_state: formData.birth_state,
        birth_city: formData.birth_city,
        category: "بانتظار التوجيه",
        weight: formData.weight ? Number(formData.weight) : null,
        height: formData.height ? Number(formData.height) : null,
        blood_type: formData.blood_type,
        uniform_size: formData.uniform_size,
        father_name: formData.father_name,
        phone: formData.phone,
        address: formData.address,
        id_card_issue_date: formData.id_card_issue_date || null,
        photo_url: photoUrl,
        parent_id: user?.parent_id || null,
        parent_username: user?.parent_username || formData.parent_username || formData.phone,
        parent_password: user?.role === 'parent' ? 'LOGGED_IN' : formData.parent_password
      };

      await api.addPlayerRequest(requestData);
      setIsSubmitted(true);
    } catch (error: any) {
      alert(`حدث خطأ أثناء إرسال الطلب: ${error.message || "فشل الاتصال"}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 content-fade-in" dir="rtl">
        <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 text-center p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center ring-4 ring-emerald-500/5 animate-pulse">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-zinc-50 mb-4">تم إرسال الطلب!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">شكراً لتقديم طلب الانضمام. يرجى مراجعة الإدارة في أقرب وقت لإكمال الملف.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="w-full bg-emerald-600 hover:bg-emerald-700">تقديم طلب جديد</Button>
            {user?.role === 'parent' && (
              <Button onClick={() => navigate('/parent-dashboard')} variant="outline" className="w-full border-zinc-800 text-zinc-400">العودة للوحة التحكم</Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const renderProgress = () => (
    <div className="flex justify-between items-center mb-10 w-full px-2" dir="ltr">
      {[...Array(totalSteps)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full mx-0.5 transition-all duration-500",
            step > i ? "bg-emerald-500" : "bg-zinc-800"
          )}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4 font-tajawal rtl pb-32" dir="rtl">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 relative">
          {user?.role === 'parent' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/parent-dashboard')}
              className="absolute top-0 right-0 text-zinc-500 hover:text-white hover:bg-zinc-900 gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              العودة لفضاء الأولياء
            </Button>
          )}
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-zinc-900 border border-zinc-800 mb-4 shadow-xl">
            {academyLogo ? <img src={academyLogo} className="h-14 w-14 object-contain" /> : <Trophy className="h-10 w-10 text-emerald-500" />}
          </div>
          <h1 className="text-2xl font-black text-white">{academyName}</h1>
          <p className="text-zinc-500 text-sm mt-1">بوابة التسجيل الإلكتروني</p>
        </div>

        {/* Welcome Message Banner */}
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border border-emerald-500/30 text-emerald-300 shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-top-4 duration-500 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-black text-base text-zinc-50 flex items-center gap-2">
              🎉 مرحباً بك! أدخل معلومات ابنك لتسجيله
            </h3>
            <p className="text-xs text-zinc-300 font-medium mt-1 leading-relaxed">
              {isJustSignedUp
                ? "تم إنشاء حسابك بنجاح! يرجى إدخال بيانات ابنك الآن لإكمال تسجيله في الأكاديمية."
                : "قم بملء البيانات التالية لتسجيل لاعب جديد بالأكاديمية."}
            </p>
          </div>
        </div>

        {renderProgress()}

        <div className="relative min-h-[400px]">

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">الاسم الكامل للاعب</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                    <input
                      name="name" value={formData.name} onChange={handleInputChange}
                      placeholder="مثال: بحري محمد"
                      className="w-full h-12 bg-transparent border-0 pr-11 text-lg text-white focus:ring-0 placeholder:text-zinc-700"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">تاريخ الميلاد</label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                    <input
                      name="birth_date" type="date" value={formData.birth_date} onChange={handleInputChange}
                      className="w-full h-12 bg-transparent border-0 pr-11 text-lg text-white focus:ring-0 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Address */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">الولاية</label>
                  <select
                    name="birth_state" value={formData.birth_state} onChange={handleInputChange}
                    className="w-full h-12 bg-transparent border-0 text-lg text-white focus:ring-0 appearance-none shadow-none"
                  >
                    <option value="">اختر الولاية</option>
                    {wilayas.map(w => <option key={w.id} value={w.name}>{w.id} - {w.name}</option>)}
                  </select>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">البلدية</label>
                  <select
                    name="birth_city" value={formData.birth_city} onChange={handleInputChange}
                    className="w-full h-12 bg-transparent border-0 text-lg text-white focus:ring-0 appearance-none shadow-none"
                  >
                    <option value="">اختر البلدية</option>
                    {selectedWilaya && wilayas.find(w => w.name === selectedWilaya) && algeriaCities[wilayas.find(w => w.name === selectedWilaya)!.id]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Physical Stats */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">الوزن (كغ)</label>
                  <input name="weight" type="number" value={formData.weight} onChange={handleInputChange} placeholder="00" className="w-full h-12 bg-transparent border-0 text-xl font-bold text-white focus:ring-0" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">الطول (سم)</label>
                  <input name="height" type="number" value={formData.height} onChange={handleInputChange} placeholder="000" className="w-full h-12 bg-transparent border-0 text-xl font-bold text-white focus:ring-0" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">زمرة الدم</label>
                  <select name="blood_type" value={formData.blood_type} onChange={handleInputChange} className="w-full h-12 bg-transparent border-0 text-lg text-white focus:ring-0">
                    <option value="">A+, O+, ...</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">مقياس البدلة</label>
                  <input name="uniform_size" value={formData.uniform_size} onChange={handleInputChange} placeholder="مثال: 32" className="w-full h-12 bg-transparent border-0 text-lg text-white focus:ring-0" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Parent Info */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">اسم الولي الكامل</label>
                  <input name="father_name" value={formData.father_name} onChange={handleInputChange} placeholder="اسم الأب أو الولي" className="w-full h-12 bg-transparent border-0 text-lg text-white focus:ring-0" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                    <input
                      name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="0XXXXXXXXX"
                      className="w-full h-12 bg-transparent border-0 pr-11 text-lg text-white focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ID Info */}
          {step === 5 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">رقم بطاقة التعريف</label>
                  <input name="id_card_number" value={formData.id_card_number} onChange={handleInputChange} placeholder="اختياري" className="w-full h-12 bg-transparent border-0 text-lg text-white focus:ring-0" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">عنوان السكن</label>
                  <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full bg-transparent border-0 text-lg text-white focus:ring-0 resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PHOTO */}
          {step === 6 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <div className="flex flex-col items-center">
                <div className="h-48 w-48 rounded-3xl bg-zinc-900 border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden mb-6 group transition-colors hover:border-emerald-500/50">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-12 w-12 text-zinc-800" />
                  )}
                </div>
                <div className="grid grid-cols-1 w-full gap-3">
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
                  }} id="file-up" className="hidden" />
                  <Button onClick={() => document.getElementById('file-up')?.click()} variant="outline" className="h-14 rounded-2xl border-zinc-800 text-zinc-400">اختر صورة</Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7 / End: Parent Login or Rules */}
          {user?.role !== 'parent' && step === 7 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 mb-6">
                <h3 className="text-amber-500 font-bold mb-2 flex items-center gap-2"><Shield className="h-5 w-5" /> إنشاء حساب ولي الأمر</h3>
                <p className="text-xs text-amber-500/70">هذه البيانات ستستخدمها للدخول لاحقاً ومتابعة مستوى ابنك.</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block tracking-widest">اسم المستخدم</label>
                  <input name="parent_username" value={formData.parent_username} onChange={handleInputChange} placeholder="حروف وأرقام فقط" className="w-full h-12 bg-transparent border-0 text-lg text-white focus:ring-0" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 mb-2 block tracking-widest">كلمة المرور</label>
                  <input name="parent_password" type="password" value={formData.parent_password} onChange={handleInputChange} placeholder="********" className="w-full h-12 bg-transparent border-0 text-lg text-white focus:ring-0" />
                </div>
              </div>
            </div>
          )}

          {/* LAST STEP: Rules */}
          {step === totalSteps && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300 mb-20">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-black text-emerald-500 uppercase flex items-center gap-2">
                    <Scale className="h-4 w-4" /> القانون الداخلي للأكاديمية
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-64 sm:h-80 overflow-y-auto bg-zinc-950 p-4 rounded-xl text-xs text-zinc-400 leading-relaxed custom-scrollbar text-right">
                    <h3 className="text-md font-black text-emerald-500 mb-4 text-center underline">القانون الداخلي لأكاديمية أجيال وادي العثمانية</h3>

                    <p className="mb-4 text-zinc-300 font-bold">بمتابعة التسجيل فأنت تلتزم بكافة البنود التالية:</p>

                    <div className="space-y-4">
                      <section>
                        <h4 className="font-black text-emerald-500 mb-1">1. الانضباط والسلوك:</h4>
                        <p>يلتزم اللاعب ووليّه باحترام المواعيد المحددة للتدريبات والمباريات. والتحلي بالروح الرياضية هو شرط أساسي للبقاء.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-emerald-500 mb-1">2. الصحة والوقاية:</h4>
                        <p>يجب التصريح بكل حالة صحية خاصة. تلتزم الأكاديمية بتوفير الإسعافات الأولية وتأمين اللاعبين حسب القوانين.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-emerald-500 mb-1">3. المستلزمات الرياضية:</h4>
                        <p>ارتداء البذلة الرسمية إلزامي. يتحمل اللاعب مسؤولية الحفاظ على عتاده ومنشآت الأكاديمية.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-emerald-500 mb-1">4. الجانب المالي:</h4>
                        <p>يلتزم الولي بتسديد حقوق الانخراط والاشتراكات الشهرية في مواعيدها المحددة لضمان استمرارية تكوين اللاعب.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-emerald-500 mb-1">5. احترام الطاقم الفني:</h4>
                        <p>يُمنع التدخل في القرارات الفنية للمدربين. جميع الأمور التقنية هي من صلاحيات المختصين فقط.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-emerald-500 mb-1">6. الحقوق والواجبات:</h4>
                        <p>للأكاديمية الحق في اتخاذ إجراءات تأديبية في حال الإخلال بالنظام، تصل إلى الإقصاء النهائي في الحالات الخطيرة.</p>
                      </section>
                    </div>

                    <div className="mt-6 p-3 rounded-lg bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 font-bold text-center italic">
                      أقر أنا ولي أمر اللاعب بأنني اطلعت على كافة بنود القانون الداخلي وأتعهد باحترامها.
                    </div>
                  </div>
                  <div className="mt-4 mb-2 flex items-center gap-3 p-3 cursor-pointer group bg-emerald-500/5 rounded-xl border border-emerald-500/10" onClick={() => setAgreedToRules(!agreedToRules)}>
                    <div className={cn("h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all", agreedToRules ? "bg-emerald-500 border-emerald-500" : "border-zinc-800 bg-zinc-950")}>
                      {agreedToRules && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-sm font-bold text-zinc-400 group-hover:text-emerald-500">أوافق على كافة الشروط والبنود</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>

        {/* BOTTOM NAV BUTTONS */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 pb-safe z-50">
          <div className="max-w-xl mx-auto flex gap-4">

            {/* PREVIOUS (RIGHT) */}
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={cn(
                "flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-black transition-all",
                step === 1 ? "opacity-0 pointer-events-none" : "bg-zinc-900 text-zinc-400 border border-zinc-800 active:scale-95"
              )}
            >
              السابق
              <ArrowRight className="h-5 w-5" />
            </button>

            {/* NEXT / SUBMIT (LEFT) */}
            <button
              onClick={step === totalSteps ? handleSubmit : nextStep}
              disabled={isLoading || (step === totalSteps && (!agreedToRules || !formData.name))}
              className={cn(
                "flex-[2_2_0%] h-14 rounded-2xl flex items-center justify-center gap-2 font-black transition-all shadow-xl",
                step === totalSteps
                  ? (agreedToRules ? "bg-emerald-600 text-white shadow-emerald-900/40" : "bg-zinc-800 text-zinc-500 cursor-not-allowed")
                  : "bg-white text-black active:scale-95"
              )}
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <>
                  <ArrowLeft className="h-5 w-5" />
                  {step === totalSteps ? "إرسال طلب الانضمام" : "التالي"}
                </>
              )}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
