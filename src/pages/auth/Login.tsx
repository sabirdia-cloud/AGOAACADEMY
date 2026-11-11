import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/services/AuthContext';
import { useAcademy } from '@/services/AcademyContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Shield, UserCheck, ArrowRight, Lock, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export function Login() {
  const { type } = useParams<{ type: string }>();
  const [role, setRole] = useState<'admin' | 'coach' | 'parent'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { settings } = useAcademy();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegisteredSuccess = (location.state as any)?.registered;
  const bgImage = "/Users/saber/.gemini/antigravity/brain/964e35c1-af49-441f-a9b4-e0e7c0fa49f4/academy_landing_bg_1778854465098.png";

  const academyLogo = settings?.logo_url;
  const academyName = settings?.name || 'نظام إدارة الأكاديمية';

  useEffect(() => {
    if (type === 'admin' || type === 'coach' || type === 'parent') {
      setRole(type as 'admin' | 'coach' | 'parent');
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const trimmedUsername = username.replace(/\s+/g, '');
      const trimmedPassword = password.replace(/\s+/g, '');
      const user = await api.login(trimmedUsername, trimmedPassword);

      if (user) {
        if (role === 'admin' && user.role !== 'admin') {
          setError('هذا الحساب ليس لديه صلاحيات المسؤول');
          setIsLoading(false);
          return;
        }
        if (role === 'coach' && user.role !== 'coach') {
          setError('هذا الحساب ليس لديه صلاحيات مدرب');
          setIsLoading(false);
          return;
        }
        if (role === 'parent' && user.role !== 'parent') {
          setError('هذا الحساب ليس لديه صلاحيات ولي أمر');
          setIsLoading(false);
          return;
        }

        login(user);
        if (user.role === 'parent') {
          navigate('/parent-dashboard');
        } else if (user.role === 'coach') {
          navigate('/academy/notebook');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('بيانات الدخول غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع أثناء تسجيل الدخول. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfig = {
    admin: { label: 'الإدارة', icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    coach: { label: 'المدربين', icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    parent: { label: 'الأولياء', icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 font-tajawal rtl overflow-hidden" dir="rtl">
      {/* Left Side: Branding & Image (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-900">
        <img 
          src={bgImage} 
          alt="Academy" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/20 to-transparent"></div>
        <div className="relative z-10 p-16 flex flex-col justify-between h-full">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-2 flex items-center justify-center">
                    {academyLogo ? <img src={academyLogo} className="h-full w-full object-contain" alt="" /> : <Trophy className="text-emerald-500" />}
                </div>
                <h1 className="text-2xl font-black text-white">{academyName}</h1>
            </div>
            
            <div className="space-y-6 max-w-lg">
                <h2 className="text-6xl font-black text-white leading-tight">
                    مرحباً بك في <span className="text-emerald-500">مستقبل</span> التدريب الرياضي
                </h2>
                <p className="text-xl text-zinc-400 font-medium leading-relaxed">
                    نظام متكامل يربط بين الإدارة، المدربين والأولياء لتوفير أفضل بيئة لتطوير مواهب الغد.
                </p>
            </div>

            <div className="flex gap-12">
                <div>
                    <p className="text-3xl font-black text-white">200+</p>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">لاعب مسجل</p>
                </div>
                <div>
                    <p className="text-3xl font-black text-white">8+</p>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">مدرب محترف</p>
                </div>
            </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 lg:hidden">
            <img src={bgImage} className="w-full h-full object-cover opacity-20" alt="" />
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="mb-12 text-center lg:text-right">
             <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 font-bold text-sm">
                <ArrowRight size={16} /> العودة للرئيسية
             </Link>
             <h3 className="text-4xl font-black text-white mb-4">تسجيل الدخول</h3>
             <p className="text-zinc-400 font-medium">اختر هويتك وادخل بيانات الحساب للمتابعة.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection (Only if not fixed by URL) */}
            {!type && (
                <div className="grid grid-cols-3 gap-3 p-1.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                    {(['parent', 'coach', 'admin'] as const).map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => { setRole(r); setError(''); }}
                            className={cn(
                                "flex flex-col items-center gap-2 py-4 rounded-xl transition-all",
                                role === r ? "bg-zinc-800 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {React.createElement(roleConfig[r].icon, { size: 20 })}
                            <span className="text-[10px] font-black">{roleConfig[r].label}</span>
                        </button>
                    ))}
                </div>
            )}

            {type && (
                 <div className={cn("p-4 rounded-2xl border flex items-center justify-between", roleConfig[role].bg, roleConfig[role].color.replace('text', 'border'))}>
                    <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white", roleConfig[role].color.replace('text', 'bg'))}>
                            {React.createElement(roleConfig[role].icon, { size: 20 })}
                        </div>
                        <span className="font-black text-sm">بوابة {roleConfig[role].label}</span>
                    </div>
                    <Link to="/login" className="text-xs font-bold underline opacity-50 hover:opacity-100">تغيير</Link>
                 </div>
            )}

            <div className="space-y-4">
                <div className="relative group">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pr-12 pl-4 text-white outline-none focus:border-emerald-500 transition-all font-medium"
                        placeholder={role === 'admin' ? 'اسم المستخدم' : role === 'coach' ? 'رقم الهاتف' : 'البريد أو الهاتف'}
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pr-12 pl-4 text-white outline-none focus:border-emerald-500 transition-all font-medium"
                        placeholder="كلمة المرور"
                        required
                    />
                </div>
            </div>

            {isRegisteredSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول برقم هاتفك.
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-16 rounded-2xl text-lg font-black shadow-2xl shadow-emerald-950/20 active:scale-[0.98] transition-all"
            >
              {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
            </Button>

            {role === 'parent' && (
                <div className="text-center pt-4">
                    <p className="text-sm text-zinc-500 font-bold">
                        ليس لديك حساب؟{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/parent-signup')}
                            className="text-emerald-500 hover:text-emerald-400 font-black"
                        >
                            إنشاء حساب جديد
                        </button>
                    </p>
                </div>
            )}
          </form>

          <div className="mt-12 pt-8 border-t border-zinc-900 text-center">
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                &copy; {new Date().getFullYear()} {academyName} • Digital Management System
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
