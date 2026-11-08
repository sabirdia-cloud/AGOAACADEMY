import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Calendar, Target, Activity, Users, 
  Download, Printer, FileImage, ClipboardCheck,
  Star, Brain, Gauge, Zap
} from 'lucide-react';
import { cn } from "@/lib/utils";
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

interface WeeklyTechnicalReportProps {
  academyName: string;
  logoUrl?: string;
  category: string;
  weekNumber: string;
  trainings: any[];
  evaluationsAverage: any;
}

export const WeeklyTechnicalReport: React.FC<WeeklyTechnicalReportProps> = ({
  academyName,
  logoUrl,
  category,
  weekNumber,
  trainings,
  evaluationsAverage
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const days = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

  const exportAsImage = async () => {
    if (reportRef.current) {
      const dataUrl = await htmlToImage.toPng(reportRef.current, { quality: 1.0, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `weekly-report-${category}-${weekNumber}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const exportAsPDF = async () => {
    if (reportRef.current) {
      const canvas = await htmlToImage.toCanvas(reportRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`weekly-report-${category}-${weekNumber}.pdf`);
    }
  };

  // Helper to find training for a specific day and time slot
  const getSession = (dayName: string) => {
    return trainings.find(t => {
      const date = new Date(t.date);
      const dName = date.toLocaleDateString('ar-DZ', { weekday: 'long' });
      return dName === dayName;
    });
  };

  const themes = {
    technical: { label: 'تقني', icon: '⚽' },
    tactical: { label: 'تكتيكي', icon: '📋' },
    physical: { label: 'بدني', icon: '⚡' },
    mental: { label: 'ذهني', icon: '🧠' },
    match: { label: 'مباراة', icon: '🏆' },
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={exportAsImage} variant="outline" className="gap-2 border-zinc-800 text-zinc-400">
          <FileImage size={18} /> تصدير PNG
        </Button>
        <Button onClick={exportAsPDF} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Download size={18} /> تحميل PDF
        </Button>
      </div>

      <div 
        ref={reportRef}
        className="w-[1120px] h-[792px] bg-white p-8 relative overflow-hidden font-tajawal shadow-2xl mx-auto border-[12px] border-emerald-600/10"
        dir="rtl"
      >
        {/* Background Watermark */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
            {logoUrl && <img src={logoUrl} className="w-[500px]" alt="" />}
        </div>

        {/* Decorative Header */}
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 bg-zinc-50 rounded-2xl border-2 border-zinc-100 p-2 flex items-center justify-center shadow-sm">
                {logoUrl ? <img src={logoUrl} className="h-full w-full object-contain" alt="" /> : <Trophy size={40} className="text-emerald-600" />}
            </div>
            <div>
                <h1 className="text-5xl font-black text-zinc-900 tracking-tighter">المخطط الأسبوعي</h1>
                <p className="text-zinc-500 font-bold flex gap-4 mt-2">
                    <span>رؤية • تنظيم • أداء</span>
                </p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-zinc-50 border-2 border-zinc-100 p-3 rounded-2xl text-center min-w-[120px]">
                <p className="text-[10px] text-zinc-400 font-black mb-1">الفئة</p>
                <p className="text-lg font-black text-emerald-700">{category}</p>
             </div>
             <div className="bg-zinc-50 border-2 border-zinc-100 p-3 rounded-2xl text-center min-w-[120px]">
                <p className="text-[10px] text-zinc-400 font-black mb-1">الأسبوع</p>
                <p className="text-lg font-black text-zinc-900">{weekNumber}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 relative z-10">
          {/* Right Column: Weekly Schedule Table */}
          <div className="col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] border-2 border-zinc-100 shadow-sm overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-zinc-900 text-white">
                            <th className="p-4 text-sm font-black border-l border-zinc-800">اليوم</th>
                            <th className="p-4 text-sm font-black border-l border-zinc-800">الصباح</th>
                            <th className="p-4 text-sm font-black border-l border-zinc-800">بعد الظهر</th>
                            <th className="p-4 text-sm font-black">الأهداف / الملاحظات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {days.map((day) => {
                            const session = getSession(day);
                            const themeId = session?.notes?.split('|')[0] as keyof typeof themes;
                            const theme = themes[themeId] || null;
                            
                            return (
                                <tr key={day} className="h-16 hover:bg-zinc-50/50 transition-colors">
                                    <td className="p-4 text-sm font-black text-zinc-900 border-l border-zinc-100 bg-zinc-50/30 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div> {day}
                                    </td>
                                    <td className="p-4 text-xs font-bold text-zinc-500 border-l border-zinc-100">
                                        {session && (new Date(session.date).getHours() < 12) ? `${session.start_time}` : '-'}
                                    </td>
                                    <td className="p-4 text-xs font-bold text-zinc-500 border-l border-zinc-100">
                                        {session && (new Date(session.date).getHours() >= 12) ? `${session.start_time}` : '-'}
                                    </td>
                                    <td className="p-4 text-xs font-bold">
                                        {session ? (
                                            <div className="flex items-center gap-2">
                                                {theme && <span className="bg-emerald-50 px-2 py-0.5 rounded text-emerald-700 text-[10px] font-black">{theme.icon} {theme.label}</span>}
                                                <span className="text-zinc-600">{session.notes?.split('|')[1] || session.notes || "-"}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Bottom Row: Reminders & Important Notes */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-zinc-50 rounded-3xl p-6 border-2 border-zinc-100">
                    <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2 mb-4">
                        <ClipboardCheck className="text-emerald-600" /> تذكيرات هامة للأسبوع
                    </h3>
                    <div className="space-y-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex gap-3 items-start">
                                <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-black">{i}</span>
                                <div className="h-4 border-b border-zinc-200 border-dashed flex-1 mt-1"></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-zinc-900 rounded-3xl p-6 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={80} /></div>
                    <h3 className="text-sm font-black flex items-center gap-2 mb-4">تركيز الأسبوع الرئيسي</h3>
                    <div className="h-24 border border-white/10 rounded-xl bg-white/5 p-4 flex flex-col justify-center">
                        <div className="w-full h-[1px] bg-white/10 mb-4 border-dashed border-t"></div>
                        <div className="w-full h-[1px] bg-white/10 mb-4 border-dashed border-t"></div>
                    </div>
                </div>
            </div>
          </div>

          {/* Left Column: Goals & Monitoring */}
          <div className="col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 border-2 border-zinc-100 shadow-sm">
                <h3 className="text-lg font-black text-zinc-900 mb-6 flex items-center gap-2">
                    <Target className="text-emerald-600" /> أهداف الأسبوع
                </h3>
                <div className="space-y-6">
                    {[
                        { label: 'تعليمي', icon: Brain, color: 'text-purple-500' },
                        { label: 'ذهني', icon: Zap, color: 'text-amber-500' },
                        { label: 'مهاري', icon: Target, color: 'text-blue-500' },
                        { label: 'تكتيكي', icon: Trophy, color: 'text-rose-500' },
                        { label: 'بدني', icon: Activity, color: 'text-emerald-500' },
                    ].map((goal, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className={cn("h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center shadow-sm border border-zinc-100", goal.color)}>
                                <goal.icon size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-zinc-400 font-black mb-1 uppercase tracking-widest">{goal.label}</p>
                                <div className="h-[1px] w-full border-b border-zinc-100 border-dashed"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16 blur-2xl"></div>
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                    <Gauge className="text-emerald-200" /> المتابعة والتقييم
                </h3>
                <div className="space-y-4">
                    {[
                        { label: 'إنجازات تم تحقيقها', val: 4.5 },
                        { label: 'الأهداف المنخفضة', val: 2 },
                        { label: 'اللاعبون المتاحون', val: 5 },
                        { label: 'كثافة اللعب والشدة', val: 4 },
                        { label: 'تطور وتقدم الفريق', val: 3.5 },
                    ].map((stat, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                <span>{stat.label}</span>
                                <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(star => (
                                        <Star key={star} size={10} fill={star <= stat.val ? "currentColor" : "none"} className={star <= stat.val ? "text-amber-400" : "text-white/20"} />
                                    ))}
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                                <div className="h-full bg-white/40 transition-all duration-1000" style={{ width: `${(stat.val/5)*100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-6 border-2 border-zinc-100 text-center">
                 <img src={logoUrl} className="h-16 mx-auto opacity-10 mb-2 grayscale" alt="" />
                 <p className="text-[8px] text-zinc-400 font-black uppercase tracking-widest leading-loose">
                    نظام الإدارة الرقمية • {academyName}<br />
                    Professional Coaching Dossier v1.0
                 </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
