import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { Button } from '@/components/ui/button';
import {
    UserPlus, Phone, Lock, User, CheckCircle2,
    ArrowLeft, ArrowRight, Eye, EyeOff, Loader2,
    Shield, Star
} from 'lucide-react';

const STEPS = [
    { id: 1, title: 'معلوماتك الشخصية', icon: User, desc: 'الاسم ورقم الهاتف' },
    { id: 2, title: 'كلمة المرور', icon: Lock, desc: 'أمان حسابك' },
    { id: 3, title: 'تأكيد التسجيل', icon: CheckCircle2, desc: 'مراجعة وإنشاء الحساب' },
];


export function ParentSignup() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validateStep1 = () => {
        if (!formData.full_name.trim()) {
            setError('يرجى إدخال الاسم الكامل.');
            return false;
        }
        if (!formData.phone.trim() || formData.phone.length < 9) {
            setError('يرجى إدخال رقم هاتف صحيح (9 أرقام على الأقل).');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (formData.password.length < 4) {
            setError('كلمة المرور يجب أن تحتوي على 4 أحرف على الأقل.');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('كلمتا المرور غير متطابقتين. يرجى التحقق والمحاولة مجدداً.');
            return false;
        }
        return true;
    };

    const goNext = () => {
        setError('');
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep(s => s + 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            const signupData = {
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim(),
                username: formData.phone.trim(),
                password: formData.password,
            };
            const createdParent = await api.parentSignup(signupData);
            
            // Auto login parent session
            if (createdParent) {
                login({
                    id: `parent-${createdParent.id}`,
                    username: createdParent.full_name,
                    role: 'parent',
                    parent_id: createdParent.id,
                    parent_username: createdParent.username || createdParent.phone
                });
            } else {
                const userObj = await api.login(signupData.username, signupData.password);
                if (userObj) login(userObj);
            }

            // Redirect immediately to register child (player-register)
            navigate('/player-register', { state: { justSignedUp: true } });
        } catch (err: any) {
            let msg = 'حدث خطأ أثناء إنشاء الحساب.';
            if (err.message?.includes('parents_phone_key')) {
                msg = '⚠️ رقم الهاتف هذا مسجل مسبقاً. جرّب تسجيل الدخول مباشرة.';
            } else if (err.message?.includes('parents_username_key')) {
                msg = '⚠️ هذا الحساب موجود مسبقاً. جرّب تسجيل الدخول مباشرة.';
            } else {
                msg = err.message || msg;
            }
            setError(msg);
            setStep(1);
        } finally {
            setIsLoading(false);
        }
    };

    const currentStepConfig = STEPS[step - 1];
    const StepIcon = currentStepConfig.icon;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 font-tajawal" dir="rtl">

            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-lg relative z-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <UserPlus className="h-7 w-7 text-emerald-500" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-50 tracking-tight">إنشاء حساب ولي أمر</h1>
                    <p className="text-zinc-500 mt-2 font-medium">انضم الآن لمتابعة مسيرة أبنائك الرياضية</p>
                </div>

                {/* Step Progress */}
                <div className="flex items-center justify-center gap-0 mb-8">
                    {STEPS.map((s, idx) => (
                        <React.Fragment key={s.id}>
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                                        step > s.id
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : step === s.id
                                                ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                                : 'bg-zinc-800 border border-zinc-700 text-zinc-600'
                                    }`}
                                >
                                    {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : s.id}
                                </div>
                                <span className={`text-[10px] font-bold hidden sm:block ${step === s.id ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                    {s.title}
                                </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={`h-0.5 w-16 sm:w-24 mx-1 transition-all duration-500 ${step > s.id ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Main Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">

                    {/* Card Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <StepIcon className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-zinc-50">{currentStepConfig.title}</h2>
                                <p className="text-xs text-zinc-500 font-medium">{currentStepConfig.desc}</p>
                            </div>
                            <span className="mr-auto text-xs text-zinc-600 font-bold bg-zinc-800 px-2 py-1 rounded-lg">
                                {step} / {STEPS.length}
                            </span>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-8">

                        {/* ── Step 1: Personal Info ── */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                                        <User className="h-4 w-4 text-emerald-500" />
                                        الاسم الكامل
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        name="full_name"
                                        type="text"
                                        required
                                        autoFocus
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        onKeyDown={(e) => e.key === 'Enter' && goNext()}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-base text-zinc-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-zinc-700 font-medium"
                                        placeholder="مثال: أحمد بن يوسف"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-emerald-500" />
                                        رقم الهاتف
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        name="phone"
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onKeyDown={(e) => e.key === 'Enter' && goNext()}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-base text-zinc-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-zinc-700 font-mono"
                                        placeholder="06XXXXXXXX"
                                        inputMode="tel"
                                    />
                                    <p className="text-xs text-zinc-600 font-medium pr-1">
                                        📌 سيُستخدم رقم هاتفك لتسجيل الدخول لاحقاً
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Password ── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-emerald-500" />
                                        كلمة المرور
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoFocus
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 pl-12 text-base text-zinc-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-zinc-700"
                                            placeholder="أدخل كلمة مرور سهلة التذكر"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-600 font-medium pr-1">
                                        ✅ يمكن استخدام أي أحرف أو أرقام (عربية أو إنجليزية)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-emerald-500" />
                                        تأكيد كلمة المرور
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            name="confirmPassword"
                                            type={showConfirm ? 'text' : 'password'}
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            onKeyDown={(e) => e.key === 'Enter' && goNext()}
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 pl-12 text-base text-zinc-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-zinc-700"
                                            placeholder="أعد كتابة كلمة المرور"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                        >
                                            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {formData.confirmPassword && (
                                        <p className={`text-xs font-bold pr-1 flex items-center gap-1 ${formData.password === formData.confirmPassword ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {formData.password === formData.confirmPassword
                                                ? <><CheckCircle2 className="h-3.5 w-3.5" /> كلمتا المرور متطابقتان</>
                                                : '⚠️ كلمتا المرور غير متطابقتين'
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Review & Confirm ── */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="p-5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl space-y-3">
                                    <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3">ملخص البيانات</p>

                                    <div className="flex justify-between items-center py-2.5 border-b border-zinc-800">
                                        <span className="text-sm text-zinc-500 font-medium">الاسم الكامل</span>
                                        <span className="text-sm font-black text-zinc-100">{formData.full_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-zinc-800">
                                        <span className="text-sm text-zinc-500 font-medium">رقم الهاتف</span>
                                        <span className="text-sm font-black text-zinc-100 font-mono">{formData.phone}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-zinc-800">
                                        <span className="text-sm text-zinc-500 font-medium">اسم الدخول</span>
                                        <span className="text-sm font-black text-emerald-400 font-mono">{formData.phone}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5">
                                        <span className="text-sm text-zinc-500 font-medium">كلمة المرور</span>
                                        <span className="text-sm font-black text-zinc-100 tracking-widest">{'•'.repeat(Math.min(formData.password.length, 8))}</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl">
                                    <Star className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-blue-200/80 leading-relaxed font-medium">
                                        بعد إنشاء حسابك، ستتمكن من متابعة أداء وحضور ابنك وتلقي الإشعارات مباشرة.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mt-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold text-center">
                                {error}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-3 mt-8">
                            {step > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setStep(s => s - 1); setError(''); }}
                                    className="flex-1 h-14 rounded-2xl border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold text-base"
                                >
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                    رجوع
                                </Button>
                            )}

                            {step < 3 ? (
                                <Button
                                    type="button"
                                    onClick={goNext}
                                    className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-950/30 active:scale-[0.98] transition-all"
                                >
                                    التالي
                                    <ArrowLeft className="h-5 w-5 mr-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-950/30 active:scale-[0.98] transition-all"
                                >
                                    {isLoading
                                        ? <><Loader2 className="h-5 w-5 ml-2 animate-spin" /> جاري الإنشاء...</>
                                        : <><CheckCircle2 className="h-5 w-5 ml-2" /> إنشاء الحساب الآن</>
                                    }
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-zinc-500 font-medium">
                        لديك حساب بالفعل؟{' '}
                        <Link
                            to="/login/parent"
                            className="text-emerald-500 hover:text-emerald-400 font-black transition-colors"
                        >
                            تسجيل الدخول
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
