import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, Download, Calendar, Users, Activity, CreditCard, 
  Wallet, ClipboardCheck, Trophy, Stethoscope, Printer, Shield, 
  User, Filter, X, Eye, Loader2, CheckCircle2, AlertCircle 
} from "lucide-react";
import { api } from "@/services/api";
import { useAcademy } from "@/services/AcademyContext";
import { exportToPDF } from "@/lib/pdf-export";
import { PrintPortal } from "@/components/PrintPortal";
import { tafqeetDinar } from "@/lib/tafqeet";
import { 
  PlayerCardsBatchTemplate, 
  AdministrativeActivityReportTemplate, 
  FinancialStatementTemplate,
  PaidSubscribersA4SheetTemplate
} from "@/components/PrintTemplates";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from "motion/react";

const reports = [
  { id: 1, type: "players", title: "تقرير اللاعبين", description: "تقرير مفصل لـ 40 لاعب بالورقة مرتبين حسب السن مع الفئة، الفوج، المدرب، وهاتف الولي.", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: 2, type: "administrative_report", title: "التقرير الأدبي (النشاط)", description: "تقرير شامل عن نشاط الأكاديمية، الفئات، والحضور.", icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: 3, type: "financial_statement", title: "التقرير المالي الشامل", description: "الميزانية العامة: المداخيل، المصاريف، والرصيد الحالي.", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: 4, type: "subscriptions", title: "تقرير اشتراكات اللاعبين", description: "ملخص اشتراكات اللاعبين (40 لاعب في الصفحة) والمبالغ المحصورة حسب التاريخ مع الإيقاف المالي والتفقيد بالدينار الجزائري.", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: 5, type: "evaluations", title: "تقرير تقييم اللاعبين", description: "تقييمات المدربين لأداء اللاعبين (40 لاعب في الصفحة).", icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: 6, type: "trainings", title: "تقرير التدريبات", description: "سجل حصص التدريب المنفذة والمواقيت والملاعب (40 حصة في الصفحة).", icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: 7, type: "attendance", title: "تقرير الحضور", description: "سجل حضور وغياب اللاعبين (40 لاعب في الصفحة).", icon: ClipboardCheck, color: "text-blue-400", bg: "bg-blue-400/10" },
  { id: 8, type: "matches", title: "تقرير المباريات", description: "سجل المباريات والنتائج (40 مباراة في الصفحة).", icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10" },
  { id: 9, type: "injuries", title: "تقرير الإصابات", description: "سجل إصابات اللاعبين وحالات التعافي (40 لاعب في الصفحة).", icon: Stethoscope, color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: 10, type: "player_cards", title: "بطاقات اللاعبين", description: "طباعة بطاقات اللاعبين المسددين للاشتراكات (دفعة كاملة أو نصفها) مع فلترة حسب الفئة والفوج (10 بطاقات في الصفحة).", icon: Shield, color: "text-zinc-500", bg: "bg-zinc-500/10" },
  { id: 11, type: "paid_players_a4", title: "كشف اللاعبين المسددين (A4)", description: "كشف رسمي معتمد لجميع اللاعبين الذين سددو اشتراكاتهم (40 لاعب بالورقة) مرتبين من الأكبر إلى الأصغر سناً مع بيانات ولي الأمر والهاتف.", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const formatDateDisplay = (dateStr?: string): string => {
  if (!dateStr) return '';
  let clean = String(dateStr).trim();
  if (clean.includes('T')) clean = clean.split('T')[0];
  if (clean.includes(' ')) clean = clean.split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    return `${d}/${m}/${y}`;
  }
  return clean;
};

export const isDateInRange = (dateVal?: string, start?: string, end?: string): boolean => {
  if (!start && !end) return true;
  if (!dateVal) return false;
  let d = String(dateVal).trim();
  if (d.includes('T')) d = d.split('T')[0];
  if (d.includes(' ')) d = d.split(' ')[0];
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [day, m, y] = d.split('/');
    d = `${y}-${m}-${day}`;
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
    const [day, m, y] = d.split('/');
    d = `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

// ─── Shared styles for printable A4 ──────────────────────────────────────────
const A4_PAGE: React.CSSProperties = {
  width: '210mm',
  height: '297mm',
  maxHeight: '297mm',
  padding: '4mm',
  backgroundColor: '#ffffff',
  direction: 'rtl',
  fontFamily: "'Tajawal', 'Cairo', 'Segoe UI', sans-serif",
  color: '#0f172a',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  pageBreakAfter: 'always',
  breakAfter: 'page',
};

const TABLE_STYLE: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '7.5pt',
  textAlign: 'right',
  lineHeight: '1.25',
};

const TH_STYLE: React.CSSProperties = {
  backgroundColor: '#0f172a',
  color: '#ffffff',
  padding: '3.5px 5px',
  textAlign: 'center',
  fontWeight: '800',
  fontSize: '7.5pt',
  border: '1px solid #1e293b',
  boxSizing: 'border-box',
};

const TD_STYLE_EVEN: React.CSSProperties = {
  padding: '2.5px 5px',
  border: '1px solid #cbd5e1',
  color: '#1e293b',
  fontSize: '7.5pt',
  boxSizing: 'border-box',
  verticalAlign: 'middle',
};

const TD_STYLE_ODD: React.CSSProperties = {
  ...TD_STYLE_EVEN,
  backgroundColor: '#f8fafc',
};

// ─── Generic Report Template ──────────────────────────────────────────────────
export const GenericReportTemplate = ({ 
  title, 
  dateRange, 
  data, 
  columns, 
  academySettings,
  isSubscriptionReport = false,
  isPlayersReport = false,
  totalAmount = 0,
  subscribersCount
}: {
  title: string;
  dateRange: { start: string; end: string };
  data: any[];
  columns: { key: string; label: string }[];
  academySettings?: any;
  isSubscriptionReport?: boolean;
  isPlayersReport?: boolean;
  totalAmount?: number;
  subscribersCount?: number;
}) => {
  const academyName = academySettings?.name || 'أكاديمية أجيال وادي العثمانية';
  const academyLogo = academySettings?.logo_url || '/academy-logo.png';
  const today = new Date().toLocaleDateString('fr-FR');
  const season = academySettings?.current_season || '2025/2026';

  // Holds 40 records/players per A4 sheet across ALL reports
  const rowsPerPage = 40;

  // Split data into pages
  const pages: any[][] = [];
  if (data.length === 0) {
    pages.push([]);
  } else {
    for (let i = 0; i < data.length; i += rowsPerPage) {
      pages.push(data.slice(i, i + rowsPerPage));
    }
  }
  const totalPages = pages.length;

  const renderHeader = (pageNum: number) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '2px solid #0f172a',
      paddingBottom: '1.8mm',
      marginBottom: '1.5mm',
    }}>
      <div style={{ textAlign: 'right', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5px' }}>
          <h1 style={{ margin: 0, fontSize: '11pt', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px' }}>
            {academyName}
          </h1>
          {isSubscriptionReport && (
            <span style={{ fontSize: '6.8pt', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
              سجل اشتراكات اللاعبين المعتمد (40 مشترك بالورقة)
            </span>
          )}
          {isPlayersReport && (
            <span style={{ fontSize: '6.8pt', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
              سجل اللاعبين الرسمي (40 لاعب بالورقة مرتبين حسب السن)
            </span>
          )}
          {!isSubscriptionReport && !isPlayersReport && (
            <span style={{ fontSize: '6.8pt', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
              كشف رسمي معتمد (40 سجل بالورقة)
            </span>
          )}
        </div>
        <h2 style={{ margin: '0 0 2px 0', fontSize: '9.5pt', fontWeight: '900', color: '#059669' }}>
          {title}
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '6.8pt', color: '#475569' }}>
          <span>الموسم: <strong style={{ color: '#0f172a' }}>{season}</strong></span>
          {dateRange.start && <span>من تاريخ: <strong style={{ color: '#0f172a' }}>{dateRange.start}</strong></span>}
          {dateRange.end && <span>إلى تاريخ: <strong style={{ color: '#0f172a' }}>{dateRange.end}</strong></span>}
          {!dateRange.start && !dateRange.end && <span>الفترة: <strong style={{ color: '#0f172a' }}>كامل المدة</strong></span>}
          <span>إجمالي السجلات: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{data.length}</strong></span>
          {isPlayersReport && <span>الترتيب: <strong style={{ color: '#0f172a' }}>من الأكبر إلى الأصغر سناً</strong></span>}
        </div>
      </div>
      <div style={{ marginRight: '5mm', textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {academyLogo ? (
          <img src={academyLogo} crossOrigin="anonymous" alt="logo" style={{ height: '54px', maxWidth: '170px', objectFit: 'contain' }} />
        ) : (
          <div style={{
            width: '54px', height: '54px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22pt', color: '#fff', fontWeight: '900'
          }}>
            {academyName.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );

  const renderTable = (rows: any[], startIdx: number) => {
    const getColWidth = (key: string) => {
      if (isPlayersReport) {
        switch (key) {
          case 'name': return '150px';
          case 'birth_date': return '72px';
          case 'category': return '52px';
          case 'group_name': return '58px';
          case 'coach_name': return '105px';
          case 'phone': return '90px';
          case 'status': return '46px';
          default: return undefined;
        }
      }
      if (isSubscriptionReport) {
        switch (key) {
          case 'receipt_no': return '92px';
          case 'player_name': return '155px';
          case 'plan_name': return '105px';
          case 'start_date': return '70px';
          case 'end_date': return '70px';
          case 'amount_formatted': return '85px';
          case 'status_display': return '55px';
          default: return undefined;
        }
      }
      switch (key) {
        case 'receipt_no': return '90px';
        case 'player_name': return '150px';
        case 'name': return '150px';
        case 'date': return '75px';
        case 'match_date': return '75px';
        case 'injury_date': return '75px';
        case 'return_date': return '75px';
        case 'start_date': return '70px';
        case 'end_date': return '70px';
        case 'time_range': return '80px';
        case 'duration': return '55px';
        case 'category': return '80px';
        case 'status': return '55px';
        case 'technical': return '50px';
        case 'tactical': return '50px';
        case 'physical': return '50px';
        case 'mental': return '50px';
        case 'home_score': return '60px';
        case 'away_score': return '60px';
        default: return undefined;
      }
    };

    const getColAlign = (key: string) => {
      switch (key) {
        case 'name':
        case 'player_name':
        case 'coach_name':
        case 'notes':
        case 'home_team':
        case 'away_team':
        case 'venue':
        case 'competition':
          return 'right';
        default:
          return 'center';
      }
    };

    const tableStyle: React.CSSProperties = {
      ...TABLE_STYLE,
      fontSize: '6.8pt',
      tableLayout: 'fixed',
    };

    const thStyle: React.CSSProperties = {
      ...TH_STYLE,
      fontSize: '6.8pt',
      padding: '2px 3px',
    };

    return (
      <table style={tableStyle}>
        <thead>
          <tr style={{ height: '5.5mm' }}>
            <th style={{ ...thStyle, width: '26px', textAlign: 'center', color: '#86efac' }}>ت</th>
            {columns.map((col) => (
              <th key={col.key} style={{
                ...thStyle,
                textAlign: getColAlign(col.key),
                width: getColWidth(col.key)
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} style={{ ...TD_STYLE_ODD, textAlign: 'center', padding: '14px', color: '#64748b' }}>
                لا توجد سجلات مسجلة في هذا النطاق الزمني
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const isEven = i % 2 === 0;
              const baseTd = isEven ? TD_STYLE_EVEN : TD_STYLE_ODD;
              const tdStyle: React.CSSProperties = {
                ...baseTd,
                fontSize: '6.8pt',
                padding: '1px 3px',
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              };
              const rowHeight = '5.65mm';

              return (
                <tr key={i} style={{ height: rowHeight }}>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b', fontWeight: '800', fontFamily: 'monospace' }}>
                    {startIdx + i + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col.key];
                    const displayVal = (val == null || val === '' || val === 'null' || val === 'undefined') ? '—' :
                      typeof val === 'object' ? JSON.stringify(val) : String(val);

                    if (col.key === 'receipt_no') {
                      return (
                        <td key={col.key} style={{ ...tdStyle, textAlign: 'center', fontWeight: '800', color: '#047857', fontFamily: 'monospace' }}>
                          <span style={{ backgroundColor: '#ecfdf5', padding: '1px 5px', borderRadius: '3px', border: '1px solid #a7f3d0', fontSize: '6.8pt' }}>
                            {displayVal}
                          </span>
                        </td>
                      );
                    }

                    if (col.key === 'name' || col.key === 'player_name') {
                      return (
                        <td key={col.key} style={{ ...tdStyle, textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                          {displayVal}
                        </td>
                      );
                    }

                    if (col.key === 'birth_date') {
                      return (
                        <td key={col.key} style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: '#1e293b', fontFamily: 'monospace' }}>
                          {displayVal}
                        </td>
                      );
                    }

                    if (col.key === 'category') {
                      return (
                        <td key={col.key} style={{ ...tdStyle, textAlign: 'center', fontWeight: '800', color: '#1d4ed8' }}>
                          <span style={{ backgroundColor: '#eff6ff', padding: '0.5px 5px', borderRadius: '3px', border: '1px solid #bfdbfe', fontSize: '6.5pt' }}>
                            {displayVal}
                          </span>
                        </td>
                      );
                    }

                    if (col.key === 'group_name') {
                      return (
                        <td key={col.key} style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: '#334155' }}>
                          {displayVal}
                        </td>
                      );
                    }

                    if (col.key === 'coach_name') {
                      return (
                        <td key={col.key} style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                          {displayVal}
                        </td>
                      );
                    }

                    if (col.key === 'phone') {
                      return (
                        <td key={col.key} style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace', direction: 'ltr', color: '#0f172a', fontWeight: '700' }}>
                          {displayVal}
                        </td>
                      );
                    }

                    if (col.key === 'amount_formatted') {
                      return (
                        <td key={col.key} style={{ ...tdStyle, textAlign: 'center', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                          {displayVal}
                        </td>
                      );
                    }

                    if (col.key === 'status' || col.key === 'status_display') {
                      const isAct = displayVal === 'نشط' || displayVal === 'active';
                      return (
                        <td key={col.key} style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{
                            padding: '0.5px 4px',
                            borderRadius: '3px',
                            fontSize: '6.5pt',
                            fontWeight: '800',
                            backgroundColor: isAct ? '#ecfdf5' : '#f1f5f9',
                            color: isAct ? '#047857' : '#64748b',
                            border: `1px solid ${isAct ? '#a7f3d0' : '#cbd5e1'}`
                          }}>
                            {displayVal}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={col.key} style={{
                        ...tdStyle,
                        textAlign: getColAlign(col.key),
                        fontFamily: (col.key === 'start_date' || col.key === 'end_date' || col.key === 'date' || col.key === 'match_date' || col.key === 'injury_date' || col.key === 'return_date') ? 'monospace' : undefined,
                        color: (col.key === 'start_date' || col.key === 'end_date' || col.key === 'date' || col.key === 'match_date' || col.key === 'injury_date' || col.key === 'return_date') ? '#475569' : undefined
                      }}>
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div id="generic-report" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {pages.map((pageRows, pageIdx) => (
        <div key={pageIdx} style={A4_PAGE}>
          {/* Outer Frame Border on all sides */}
          <div style={{
            flex: 1,
            border: '2px solid #0f172a',
            borderRadius: '4px',
            padding: '2.5mm 3.5mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            height: '100%',
            position: 'relative',
            backgroundColor: '#ffffff'
          }}>
            {/* Header and Table */}
            <div>
              {renderHeader(pageIdx + 1)}
              <div style={{ overflow: 'hidden' }}>
                {renderTable(pageRows, pageIdx * rowsPerPage)}
              </div>
            </div>
            
            {/* Bottom Section on the last page */}
            {pageIdx === pages.length - 1 ? (
              <div style={{ marginTop: 'auto', paddingTop: '1.5mm' }}>
                {isPlayersReport ? (
                  <div style={{
                    border: '1.5px solid #0f172a',
                    borderRadius: '4px',
                    backgroundColor: '#f8fafc',
                    padding: '1.5mm 3.5mm',
                    direction: 'rtl',
                    textAlign: 'right'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '6.8pt',
                      color: '#334155'
                    }}>
                      <div style={{ lineHeight: '1.5' }}>
                        <div>• إجمالي اللاعبين المسجلين في القائمة: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{data.length} لاعب</strong></div>
                        <div>• الترتيب المعتمد: <strong style={{ color: '#0f172a' }}>مرتبة تصاعدياً من الأكبر سناً إلى الأصغر سناً</strong></div>
                        <div>• تاريخ استخراج القائمة: <strong style={{ color: '#0f172a' }}>{today}</strong></div>
                      </div>
                      
                      <div style={{
                        border: '1.5px dashed #475569',
                        borderRadius: '4px',
                        padding: '1.5mm 4mm',
                        textAlign: 'center',
                        minWidth: '150px',
                        backgroundColor: '#ffffff'
                      }}>
                        <div style={{ fontWeight: '900', color: '#0f172a', marginBottom: '8px', fontSize: '7pt' }}>
                          ختم وتأشيرة الإدارة الفنية والبيداغوجية
                        </div>
                        <div style={{ fontSize: '6pt', color: '#94a3b8', borderTop: '1px dotted #cbd5e1', paddingTop: '1.5px' }}>
                          المصادقة الرسمية / المدير الفني
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isSubscriptionReport ? (
                  <div style={{
                    border: '1.5px solid #0f172a',
                    borderRadius: '4px',
                    backgroundColor: '#f8fafc',
                    padding: '1.5mm 3.5mm',
                    direction: 'rtl',
                    textAlign: 'right'
                  }}>
                    {/* The Arrêt Statement as requested */}
                    <div style={{
                      fontSize: '8.2pt',
                      fontWeight: '900',
                      color: '#0f172a',
                      lineHeight: '1.4',
                      textAlign: 'right',
                      borderBottom: '1px solid #cbd5e1',
                      paddingBottom: '1.5mm',
                      marginBottom: '1.5mm'
                    }}>
                      أُوقِف هذا التقرير بمجموع مبالغ المشتركين بـ:{' '}
                      <span style={{ color: '#047857', fontSize: '10pt', fontWeight: '900', fontFamily: 'monospace' }}>
                        {Number(totalAmount || 0).toLocaleString('fr-FR')} دج
                      </span>
                      {' '}
                      <span style={{ color: '#065f46', fontWeight: '800' }}>
                        ({tafqeetDinar(totalAmount || 0, { withPrefixSuffix: true })})
                      </span>
                    </div>

                    {/* Summary row & Admin signature */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '6.8pt',
                      color: '#334155'
                    }}>
                      <div style={{ lineHeight: '1.5' }}>
                        <div>• مجموع مبالغ المشتركين المحصورين بالتاريخ: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{Number(totalAmount || 0).toLocaleString('fr-FR')} دج</strong></div>
                        <div>• عدد المشتركين في هذه الفترة: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{subscribersCount ?? data.length} لاعب</strong></div>
                        <div>• العملة الرسمية المعتمدة: <strong style={{ color: '#0f172a' }}>الدينار الجزائري (DZD)</strong></div>
                        <div>• تاريخ التحرير: <strong style={{ color: '#0f172a' }}>{today}</strong></div>
                      </div>
                      
                      <div style={{
                        border: '1.5px dashed #475569',
                        borderRadius: '4px',
                        padding: '1.5mm 3.5mm',
                        textAlign: 'center',
                        minWidth: '150px',
                        backgroundColor: '#ffffff'
                      }}>
                        <div style={{ fontWeight: '900', color: '#0f172a', marginBottom: '8px', fontSize: '7pt' }}>
                          ختم ومصادقة إدارة الأكاديمية
                        </div>
                        <div style={{ fontSize: '6pt', color: '#94a3b8', borderTop: '1px dotted #cbd5e1', paddingTop: '1.5px' }}>
                          المصادقة والتوقيع الرسمي / أمين المال
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '2.5px 6px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '4px',
                    border: '1px solid #d1fae5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '7.5pt',
                    fontWeight: '700'
                  }}>
                    <span style={{ color: '#065f46' }}>إجمالي السجلات: <span style={{ fontFamily: 'monospace' }}>{data.length}</span></span>
                    <span style={{ color: '#10b981' }}>نهاية التقرير</span>
                  </div>
                )}

                {/* Page Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.5mm',
                  marginTop: '1.5mm',
                  fontSize: '7pt',
                  color: '#94a3b8'
                }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>{academyName} — {title} (40 سجل في الصفحة)</span>
                  <span style={{ fontWeight: '800', color: '#0f172a' }}>صفحة {pageIdx + 1} من {totalPages}</span>
                  <span>تاريخ الاستخراج: {today}</span>
                </div>
              </div>
            ) : (
              /* Non-last page bottom & footer */
              <div style={{ marginTop: 'auto', paddingTop: '1.5mm' }}>
                {isPlayersReport && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1mm 3mm',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                    fontSize: '6.8pt',
                    fontWeight: '700',
                    color: '#475569',
                    marginBottom: '1mm'
                  }}>
                    <span>عدد اللاعبين في هذه الصفحة: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{pageRows.length} لاعب</strong></span>
                    <span style={{ color: '#2563eb' }}>يتبع قائمة اللاعبين في الصفحة الموالية ({pageIdx + 2}) ...</span>
                  </div>
                )}
                {isSubscriptionReport && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1mm 3mm',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    fontSize: '6.8pt',
                    fontWeight: '700',
                    color: '#334155',
                    marginBottom: '1mm'
                  }}>
                    <span>مجموع جزئي لهذه الصفحة: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{pageRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toLocaleString('fr-FR')} دج</strong> ({pageRows.length} مشترك)</span>
                    <span style={{ color: '#0284c7' }}>يتبع في الصفحة الموالية ({pageIdx + 2}) ...</span>
                  </div>
                )}
                {!isPlayersReport && !isSubscriptionReport && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1mm 3mm',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                    fontSize: '6.8pt',
                    fontWeight: '700',
                    color: '#475569',
                    marginBottom: '1mm'
                  }}>
                    <span>عدد السجلات في هذه الصفحة: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{pageRows.length}</strong></span>
                    <span style={{ color: '#2563eb' }}>يتبع في الصفحة الموالية ({pageIdx + 2}) ...</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.5mm',
                  fontSize: '7pt',
                  color: '#94a3b8'
                }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>{academyName} — {title} (40 سجل في الصفحة)</span>
                  <span style={{ fontWeight: '800', color: '#0f172a' }}>صفحة {pageIdx + 1} من {totalPages}</span>
                  <span>تاريخ الاستخراج: {today}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};


export function Reports() {
  const { settings: academySettings } = useAcademy();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subscriptionPlanFilter, setSubscriptionPlanFilter] = useState<'all' | 'full_first' | 'half_first'>('all');
  
  // Card Filters State (سددو الاشتراكات فقط: كاملة / نصفها، وكل فئة وفوج)
  const [cardPaymentFilter, setCardPaymentFilter] = useState<'all_paid' | 'full' | 'half'>('all_paid');
  const [cardCategoryFilter, setCardCategoryFilter] = useState<string>('all');
  const [cardGroupFilter, setCardGroupFilter] = useState<string>('all');
  
  // Loading & export states
  const [isExporting, setIsExporting] = useState(false);
  const [directDownloadType, setDirectDownloadType] = useState<string | null>(null);
  
  // Modal preview / PrintPortal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeModalReport, setActiveModalReport] = useState<any>(null);
  
  // Off-screen rendering container for direct downloads
  const [offscreenReport, setOffscreenReport] = useState<any>(null);

  const [playerBatches, setPlayerBatches] = useState<any[][]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [stars, setStars] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    api.getTeams().then(setTeams);
    api.getCoaches().then(setCoaches);
    api.getCategories().then(setCategories).catch(() => []);
    api.getSubscriptions().then(setAllSubscriptions).catch(() => []);
    
    Promise.all([
      api.getPlayers(),
      api.getEvaluations(),
      api.getAttendance(),
      api.getTrainings()
    ]).then(([players, evals, attn, trn]) => {
      setAllPlayers(players || []);
      if (evals && evals.length > 0) {
        const playerScores = evals.reduce((acc: any, e: any) => {
          const score = (Number(e.technical) + Number(e.tactical) + Number(e.physical) + Number(e.mental)) / 4;
          if (!acc[e.player_id] || acc[e.player_id].date < e.date) {
            acc[e.player_id] = { score, date: e.date };
          }
          return acc;
        }, {});

        const top3 = Object.entries(playerScores)
          .map(([pid, data]: [string, any]) => ({
            ...players.find(p => p.player_id === Number(pid)),
            score: data.score
          }))
          .filter(p => p.name)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        setStars(top3);
      }

      if (attn && attn.length > 0) {
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const hData = last7Days.map(date => {
          const dayTrainings = trn.filter(t => t.date === date);
          const dayAttendance = attn.filter(a => dayTrainings.some(t => t.training_id === a.training_id));
          return {
            name: new Date(date).toLocaleDateString('ar-DZ', { weekday: 'short' }),
            count: dayAttendance.filter(a => a.status === 'حاضر').length
          };
        });
        setHeatmapData(hData);
      }
    });
  }, []);

  // Derived Categories for Cards Filtering
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c: any) => { if (c.name) set.add(c.name.trim()); });
    teams.forEach((t: any) => { if (t.category) set.add(t.category.trim()); });
    allPlayers.forEach((p: any) => { if (p.category) set.add(p.category.trim()); });
    return Array.from(set).sort();
  }, [categories, teams, allPlayers]);

  // Derived Groups for Cards Filtering (optionally filtered by selected category)
  const availableGroups = useMemo(() => {
    if (cardCategoryFilter === 'all') {
      return teams;
    }
    return teams.filter((t: any) => t.category === cardCategoryFilter);
  }, [teams, cardCategoryFilter]);

  const handleCategoryChange = (cat: string) => {
    setCardCategoryFilter(cat);
    if (cat !== 'all') {
      const groupStillValid = teams.some(
        (t: any) => t.category === cat && (String(t.team_id) === String(cardGroupFilter) || t.team_name === cardGroupFilter)
      );
      if (!groupStillValid) {
        setCardGroupFilter('all');
      }
    }
  };

  // Helper to determine payment classification for a player: 'full' | 'half' | 'unpaid'
  const getPlayerPaymentClassification = (player: any, subs: any[]): 'full' | 'half' | 'unpaid' => {
    const pSubs = (subs || []).filter((s: any) => 
      (s.player_id === player.player_id || s.player_id === player.id) &&
      s.status !== 'معلق' && 
      s.status !== 'pending'
    );
    const totalPaid = pSubs.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);

    if (pSubs.length === 0 && !player.is_paid && player.subscription_status !== 'مدفوع' && totalPaid === 0) {
      return 'unpaid';
    }

    const hasHalfPlan = pSubs.some((s: any) => 
      (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000
    );
    const hasFullPlan = pSubs.some((s: any) => 
      (s.plan_name && (s.plan_name.includes('كاملة') || (!s.plan_name.includes('نصف') && Number(s.amount) >= 10000)))
    );

    if ((totalPaid >= 10000 && !hasHalfPlan) || hasFullPlan) {
      return 'full';
    }

    if (hasHalfPlan || totalPaid === 5000 || (totalPaid > 0 && totalPaid < 10000)) {
      return 'half';
    }

    if (totalPaid > 0 || player.is_paid || player.subscription_status === 'مدفوع') {
      return 'full';
    }

    return 'unpaid';
  };

  // Filter players strictly for cards: ONLY paid players (full or half), plus category & group
  const filterPlayersForCards = (
    playersList: any[],
    subsList: any[],
    teamsList: any[],
    paymentPlan: 'all_paid' | 'full' | 'half' = cardPaymentFilter,
    catFilter: string = cardCategoryFilter,
    grpFilter: string = cardGroupFilter
  ) => {
    return (playersList || []).filter((player: any) => {
      // 1. Resolve Team / Group
      const team = (teamsList || []).find((t: any) => 
        (player.team_id != null && (String(t.team_id) === String(player.team_id) || String(t.id) === String(player.team_id))) ||
        (player.category && t.category === player.category)
      );

      // 2. Category Filter
      const playerCat = player.category || team?.category || '';
      if (catFilter !== 'all' && playerCat !== catFilter) {
        return false;
      }

      // 3. Group Filter
      if (grpFilter !== 'all') {
        const matchesTeamId = player.team_id != null && (
          String(player.team_id) === String(grpFilter) || 
          (team && (String(team.team_id) === String(grpFilter) || String(team.id) === String(grpFilter)))
        );
        const matchesTeamName = team && (
          team.team_name === grpFilter || 
          `فوج ${team.team_name}` === grpFilter ||
          team.team_name === `فوج ${grpFilter}`
        );
        const matchesPlayerGroup = (
          player.group === grpFilter || 
          player.group_name === grpFilter ||
          `فوج ${player.group}` === grpFilter ||
          `فوج ${player.group_name}` === grpFilter
        );
        if (!matchesTeamId && !matchesTeamName && !matchesPlayerGroup) {
          return false;
        }
      }

      // 4. Payment status (STRICT: ONLY paid players - full or half!)
      const paymentStatus = getPlayerPaymentClassification(player, subsList);
      if (paymentStatus === 'unpaid') {
        return false;
      }
      if (paymentPlan === 'full' && paymentStatus !== 'full') {
        return false;
      }
      if (paymentPlan === 'half' && paymentStatus !== 'half') {
        return false;
      }

      return true;
    });
  };

  // Live matching cards for UI preview badge
  const matchingCardPlayers = useMemo(() => {
    return filterPlayersForCards(allPlayers, allSubscriptions, teams, cardPaymentFilter, cardCategoryFilter, cardGroupFilter);
  }, [allPlayers, allSubscriptions, teams, cardPaymentFilter, cardCategoryFilter, cardGroupFilter]);

  // Dynamic Title generator for Card Report
  const getCardReportTitle = (
    paymentPlan: 'all_paid' | 'full' | 'half' = cardPaymentFilter,
    catFilter: string = cardCategoryFilter,
    grpFilter: string = cardGroupFilter
  ) => {
    let t = "بطاقات اللاعبين المسددين";
    if (catFilter !== 'all') {
      t += ` - فئة ${catFilter}`;
    }
    if (grpFilter !== 'all') {
      const grpObj = teams.find(x => String(x.team_id) === String(grpFilter) || x.team_name === grpFilter);
      const grpName = grpObj?.team_name || grpFilter;
      t += ` - فوج ${grpName.replace(/^فوج\s*/, '')}`;
    }
    if (paymentPlan === 'full') {
      t += " (دفعة كاملة)";
    } else if (paymentPlan === 'half') {
      t += " (نصف دفعة)";
    } else {
      t += " (دفعة كاملة ونصفها)";
    }
    return t;
  };

  // Preset Date Handlers
  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  };

  const handleSetLast7Days = () => {
    const end = new Date().toISOString().split('T')[0];
    const startD = new Date();
    startD.setDate(startD.getDate() - 7);
    setStartDate(startD.toISOString().split('T')[0]);
    setEndDate(end);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const startD = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endD = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(startD);
    setEndDate(endD);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  // Build report payload filtered by startDate and endDate
  const buildReportPayload = async (type: string, title: string) => {
    switch (type) {
      case "players": {
        const [rawPlayers, teamsAll, coachesAll] = await Promise.all([
          api.getPlayers(),
          api.getTeams().catch(() => []),
          api.getCoaches().catch(() => [])
        ]);

        let playersList = rawPlayers || [];
        if (startDate || endDate) {
          playersList = playersList.filter((p: any) => {
            const d = (p.created_at || p.registration_date || p.join_date || '').split('T')[0];
            return d ? isDateInRange(d, startDate, endDate) : true;
          });
        }

        // Helper to parse birth dates reliably for age sorting (oldest first to youngest last)
        const parseBirthTime = (d?: string): number => {
          if (!d) return Infinity; // Put unknown birth dates at the end
          let clean = String(d).trim();
          if (clean.includes('T')) clean = clean.split('T')[0];
          if (clean.includes(' ')) clean = clean.split(' ')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
            const t = new Date(clean).getTime();
            return isNaN(t) ? Infinity : t;
          }
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
            const [day, month, year] = clean.split('/');
            const t = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).getTime();
            return isNaN(t) ? Infinity : t;
          }
          const t = new Date(clean).getTime();
          return isNaN(t) ? Infinity : t;
        };

        // Sort: From oldest to youngest (earliest birth date to latest birth date)
        playersList.sort((a: any, b: any) => parseBirthTime(a.birth_date) - parseBirthTime(b.birth_date));

        // Format data with category, group, coach name, guardian phone
        const data = playersList.map((p: any) => {
          // Resolve group / team
          const team = (teamsAll || []).find((t: any) => 
            (p.team_id && (t.team_id === p.team_id || t.id === p.team_id)) ||
            (p.category && t.category === p.category)
          );

          let groupName = '—';
          if (team?.team_name) {
            groupName = team.team_name.startsWith('فوج') ? team.team_name : `فوج ${team.team_name}`;
          } else if (team?.name) {
            groupName = team.name;
          } else if (p.group || p.group_name) {
            groupName = p.group || p.group_name;
          } else {
            groupName = 'فوج أ';
          }

          // Resolve coach
          const coach = (coachesAll || []).find((c: any) => 
            (team?.coach_id && (c.coach_id === team.coach_id || c.id === team.coach_id)) ||
            (p.team_id && c.team_id === p.team_id) ||
            (p.category && c.category === p.category)
          );

          let coachName = '—';
          if (coach?.name) {
            coachName = (coach.name.startsWith('ك.') || coach.name.startsWith('المدرب')) ? coach.name : `ك. ${coach.name}`;
          } else if (p.coach_name) {
            coachName = p.coach_name;
          }

          // Resolve guardian phone
          const guardianPhone = p.guardian_phone || p.phone || p.parent_phone || p.emergency_contact || p.contact_phone || '—';

          return {
            ...p,
            name: p.name || '---',
            birth_date: formatDateDisplay(p.birth_date) || '—',
            category: p.category || team?.category || '—',
            group_name: groupName,
            coach_name: coachName,
            phone: guardianPhone,
            status: p.status === 'نشط' || p.status === 'active' ? 'نشط' : (p.status || 'نشط')
          };
        });

        const columns = [
          { key: "name", label: "اسم اللاعب" },
          { key: "birth_date", label: "تاريخ الميلاد" },
          { key: "category", label: "نوع الفئة" },
          { key: "group_name", label: "الفوج" },
          { key: "coach_name", label: "اسم المدرب" },
          { key: "phone", label: "رقم هاتف الولي" },
          { key: "status", label: "الحالة" }
        ];

        return {
          type: 'standard',
          title: 'تقرير قائمة اللاعبين (مرتبة حسب السن)',
          data,
          columns,
          isSubscriptionReport: false,
          isPlayersReport: true
        };
      }

      case "administrative_report": {
        const [playersAll, trainingsAll, matchesAll, summaryData] = await Promise.all([
          api.getPlayers(),
          api.getTrainings(),
          api.getEMSMatches(),
          api.getAcademyDashboard()
        ]);

        const filteredTrainings = (trainingsAll || []).filter((t: any) => 
          isDateInRange(t.date || t.training_date, startDate, endDate)
        );
        const filteredMatches = (matchesAll || []).filter((m: any) => 
          isDateInRange(m.match_date || m.date, startDate, endDate)
        );

        return { 
          type: 'administrative',
          title,
          players: playersAll, 
          trainings: filteredTrainings, 
          matches: filteredMatches, 
          summary: summaryData 
        };
      }

      case "financial_statement": {
        const [financesRaw, subscriptionsRaw, expenseInvoicesRaw, playersRaw] = await Promise.all([
          api.getFinances(),
          api.getSubscriptions(),
          api.getExpenseInvoices().catch(() => []),
          api.getPlayers().catch(() => [])
        ]);

        const subscriptionIncomes = (subscriptionsRaw || [])
          .filter((s: any) => Number(s.amount) > 0 && s.status !== 'معلق')
          .map((s: any) => {
            const player = playersRaw.find((p: any) => p.player_id === s.player_id);
            return {
              id: `sub-${s.subscription_id || s.id}`,
              type: 'income',
              category: 'اشتراكات اللاعبين',
              amount: Number(s.amount) || 0,
              date: s.start_date || s.created_at || new Date().toISOString().split('T')[0],
              notes: `اشتراك - ${player?.name || s.player_name || '---'} (${s.plan_name || ''})`,
              module: 'subscription'
            };
          });

        const manualIncomes = (financesRaw || []).filter((f: any) => f.type === 'income');
        const manualExpenses = (financesRaw || []).filter((f: any) => f.type === 'expense');

        const invoiceExpenses = (expenseInvoicesRaw || []).map((inv: any) => ({
          id: `inv-${inv.id}`,
          type: 'expense',
          category: `فاتورة: ${inv.supplier_name || ''}`,
          amount: Number(inv.total_amount) || 0,
          date: inv.invoice_date,
          notes: `${inv.invoice_number || ''} - ${inv.category || ''}`,
          module: 'invoice'
        }));

        let allTransactions = [
          ...subscriptionIncomes,
          ...manualIncomes,
          ...manualExpenses,
          ...invoiceExpenses
        ].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

        // Apply bounded date filter to transactions
        if (startDate || endDate) {
          allTransactions = allTransactions.filter((t: any) => isDateInRange(t.date, startDate, endDate));
        }

        const subscriptionIncomeTotal = allTransactions
          .filter(t => t.type === 'income' && (t.module === 'subscription' || t.category?.includes('اشتراك')))
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        const manualIncomeTotal = allTransactions
          .filter(t => t.type === 'income' && t.module !== 'subscription' && !t.category?.includes('اشتراك'))
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        const totalIncome = subscriptionIncomeTotal + manualIncomeTotal;
        const totalExpense = allTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        return {
          type: 'financial',
          title,
          transactions: allTransactions,
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          subscriptionIncomeTotal,
          manualIncomeTotal
        };
      }

      case "subscriptions": {
        const [subsRaw, playersRaw, paymentsRaw] = await Promise.all([
          api.getSubscriptions(),
          api.getPlayers().catch(() => []),
          api.getPayments().catch(() => [])
        ]);

        // Filter subscriptions strictly bounded by start_date / created_at / payment_date
        let filteredSubs = (subsRaw || []).filter((s: any) => {
          const d = s.start_date || s.payment_date || (s.created_at ? s.created_at.split('T')[0] : '');
          return isDateInRange(d, startDate, endDate);
        });

        // Filter by installment plan (full first installment vs half first installment)
        if (subscriptionPlanFilter === 'full_first') {
          filteredSubs = filteredSubs.filter((s: any) => {
            const isHalf = (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000;
            return !isHalf && Number(s.amount) >= 10000;
          });
        } else if (subscriptionPlanFilter === 'half_first') {
          filteredSubs = filteredSubs.filter((s: any) => {
            return (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000;
          });
        }

        // Helper to check if a subscription is exempt
        const isSubExempt = (s: any) => {
          if (!s) return false;
          const plan = String(s.plan_name || '').toLowerCase();
          const status = String(s.status || '').toLowerCase();
          return plan.includes('معفى') || 
                 plan.includes('خاصة') || 
                 plan.includes('إعفاء') || 
                 plan.includes('منحة') || 
                 status === 'معفى' || 
                 (Number(s.amount) === 0 && (plan.includes('خاصة') || plan.includes('معفى') || plan.includes('إعفاء')));
        };

        // Filter paid subscriptions from subsRaw for sequential receipt numbering
        const paidSubsRaw = (subsRaw || []).filter((s: any) => !isSubExempt(s) && Number(s.amount || 0) > 0);

        // Helper to extract the EXACT receipt number matching Subscriptions.tsx when registering
        const getReceiptNumber = (s: any) => {
          if (isSubExempt(s)) {
            return '';
          }

          if (s.receipt_number != null && s.receipt_number !== '') {
            const str = String(s.receipt_number).trim();
            return /^\d+$/.test(str) ? str.padStart(6, '0') : str;
          }

          // Sequential index only among paid subscriptions
          const fullIndex = paidSubsRaw.findIndex((x: any) => 
            (x.subscription_id != null && s.subscription_id != null && String(x.subscription_id) === String(s.subscription_id)) ||
            (x.id != null && s.id != null && String(x.id) === String(s.id))
          );

          const receiptNum = (fullIndex !== -1) ? (fullIndex + 1) : 1;
          return String(receiptNum).padStart(6, '0');
        };

        // Sort subscriptions by receipt number ascending so they are in order
        const sortedSubs = [...filteredSubs].sort((a: any, b: any) => {
          const numA = Number(getReceiptNumber(a).replace(/\D/g, '')) || 0;
          const numB = Number(getReceiptNumber(b).replace(/\D/g, '')) || 0;
          return numA - numB;
        });

        // Calculate sum of subscriptions for players bounded by date
        const totalAmount = sortedSubs.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);

        const formattedData = sortedSubs.map((s: any) => {
          const player = (playersRaw || []).find((p: any) => p.player_id === s.player_id);
          const pName = s.player_name || player?.name || (s.players?.name) || '---';
          const actualReceiptNo = getReceiptNumber(s);

          return {
            ...s,
            receipt_no: isSubExempt(s) ? 'معفى (بدون وصل)' : `وصل رقم ${actualReceiptNo}`,
            player_name: pName,
            plan_name: s.plan_name || 'اشتراك شهري',
            start_date: formatDateDisplay(s.start_date) || '—',
            end_date: formatDateDisplay(s.end_date) || '—',
            amount_formatted: `${Number(s.amount || 0).toLocaleString('fr-FR')} دج`,
            status_display: s.status === 'نشط' || s.status === 'active' ? 'نشط' :
                            s.status === 'منتهي' || s.status === 'expired' ? 'منتهي' :
                            s.status === 'معلق' || s.status === 'pending' ? 'معلق' :
                            (s.status || 'نشط')
          };
        });

        const columns = [
          { key: "receipt_no", label: "رقم الوصل" },
          { key: "player_name", label: "اسم اللاعب" },
          { key: "plan_name", label: "نوع الاشتراك / الخطة" },
          { key: "start_date", label: "تاريخ البداية" },
          { key: "end_date", label: "تاريخ الانتهاء" },
          { key: "amount_formatted", label: "المبلغ (دج)" },
          { key: "status_display", label: "الحالة" }
        ];

        const dynamicTitle = subscriptionPlanFilter === 'full_first' 
          ? 'تقرير اشتراكات اللاعبين (الدفعة الأولى كاملة)'
          : subscriptionPlanFilter === 'half_first'
          ? 'تقرير اشتراكات اللاعبين (نصف الدفعة الأولى)'
          : 'تقرير اشتراكات اللاعبين';

        return {
          type: 'standard',
          title: dynamicTitle,
          data: formattedData,
          columns,
          isSubscriptionReport: true,
          totalAmount,
          subscribersCount: sortedSubs.length
        };
      }

      case "evaluations": {
        const evalsRaw = await api.getEvaluations();
        const filtered = (evalsRaw || []).filter((e: any) => isDateInRange(e.date, startDate, endDate));
        const data = filtered.map((e: any) => ({
          ...e,
          date: formatDateDisplay(e.date) || e.date
        }));
        const columns = [
          { key: "player_name", label: "اللاعب" },
          { key: "date", label: "التاريخ" },
          { key: "technical", label: "تقني" },
          { key: "tactical", label: "تكتيكي" },
          { key: "physical", label: "بدني" },
          { key: "mental", label: "ذهني" },
          { key: "notes", label: "ملاحظات" }
        ];
        return { type: 'standard', title, data, columns, isSubscriptionReport: false };
      }

      case "trainings": {
        const [trainingsRaw, coachesAll, teamsAll] = await Promise.all([
          api.getTrainings(),
          api.getCoaches(),
          api.getTeams()
        ]);
        const filteredTrainings = (trainingsRaw || []).filter((s: any) => 
          isDateInRange(s.date || s.training_date, startDate, endDate)
        );
        const data = filteredTrainings.map((s: any) => {
          const team = (teamsAll || []).find((t: any) => 
            (s.team_id != null && (String(t.team_id) === String(s.team_id) || String(t.id) === String(s.team_id))) ||
            (s.category && (t.category === s.category || t.team_name === s.category))
          );
          const coach = (coachesAll || []).find((c: any) => 
            (s.coach_id != null && (String(c.coach_id) === String(s.coach_id) || String(c.id) === String(s.coach_id))) ||
            (s.coach_name && c.name === s.coach_name) ||
            (s.coach && c.name === s.coach)
          );

          const cleanTime = (t: string) => t ? String(t).slice(0, 5) : '';
          const startTime = cleanTime(s.start_time || s.time || s.session_time);
          const endTime = cleanTime(s.end_time);
          const timeRange = (startTime && endTime) ? `${startTime} - ${endTime}` : (startTime || '---');

          let duration = '---';
          if (startTime && endTime && startTime.includes(':') && endTime.includes(':')) {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            const diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff > 0) duration = `${diff} دقيقة`;
          }

          const parts = (s.notes || '').split('|');
          const themeId = parts[0] || '';
          const realNotes = parts[1] || (parts.length === 1 ? s.notes : '') || '';
          const themeLabels: Record<string, string> = {
            technical: 'تقني', tactical: 'تكتيكي', physical: 'بدني',
            mental: 'ذهني', match: 'مباراة'
          };

          const categoryName = team 
            ? `${team.category}${team.team_name ? ' - ' + team.team_name : ''}`
            : (s.category || s.team_name || s.team || '---');

          const coachName = coach 
            ? coach.name 
            : (s.coach_name || s.coach || (s.coach_id ? `مدرب #${s.coach_id}` : '---'));

          const sessionDate = s.date ? String(s.date).split('T')[0] : (s.training_date || '---');

          return {
            ...s,
            date: formatDateDisplay(sessionDate),
            title: themeLabels[themeId] || themeId || 'تدريب عام',
            category: categoryName,
            coach_name: coachName,
            time_range: timeRange,
            duration,
            location: s.location || 'الملعب الرئيسي',
            notes: realNotes || '—'
          };
        });
        const columns = [
          { key: "date", label: "التاريخ" },
          { key: "title", label: "نوع الحصة" },
          { key: "category", label: "الفئة / الفوج" },
          { key: "coach_name", label: "المدرب" },
          { key: "time_range", label: "الوقت" },
          { key: "duration", label: "المدة" },
          { key: "location", label: "المكان" },
          { key: "notes", label: "ملاحظات" }
        ];
        return { type: 'standard', title, data, columns, isSubscriptionReport: false };
      }

      case "attendance": {
        const attendanceData = await api.getAttendance();
        const filtered = (attendanceData || []).filter((a: any) => 
          isDateInRange(a.date || a.attendance_date || a.created_at, startDate, endDate)
        );
        const data = filtered.map((a: any) => ({
          ...a,
          player_name: a.players?.name || a.player_name || '---',
          date: formatDateDisplay(a.date || a.attendance_date) || '---'
        }));
        const columns = [
          { key: "player_name", label: "اللاعب" },
          { key: "date", label: "التاريخ" },
          { key: "status", label: "الحالة" },
          { key: "notes", label: "ملاحظات" }
        ];
        return { type: 'standard', title, data, columns, isSubscriptionReport: false };
      }

      case "matches": {
        const matchesData = await api.getEMSMatches();
        const filtered = (matchesData || []).filter((m: any) => 
          isDateInRange(m.match_date || m.date, startDate, endDate)
        );
        const data = filtered.map((m: any) => ({
          ...m,
          match_date: formatDateDisplay(m.match_date) || m.match_date
        }));
        const columns = [
          { key: "match_date", label: "التاريخ" },
          { key: "home_team", label: "الفريق المضيف" },
          { key: "away_team", label: "الفريق الضيف" },
          { key: "home_score", label: "أهداف المضيف" },
          { key: "away_score", label: "أهداف الضيف" },
          { key: "venue", label: "الملعب" },
          { key: "competition", label: "المسابقة" }
        ];
        return { type: 'standard', title, data, columns, isSubscriptionReport: false };
      }

      case "injuries": {
        const injuriesData = await api.getInjuries();
        const filtered = (injuriesData || []).filter((i: any) => 
          isDateInRange(i.injury_date || i.date, startDate, endDate)
        );
        const data = filtered.map((i: any) => ({
          ...i,
          player_name: i.players?.name || i.player_name || '---',
          injury_date: formatDateDisplay(i.injury_date) || '---',
          return_date: formatDateDisplay(i.return_date) || '---'
        }));
        const columns = [
          { key: "player_name", label: "اللاعب" },
          { key: "injury_type", label: "نوع الإصابة" },
          { key: "injury_date", label: "تاريخ الإصابة" },
          { key: "return_date", label: "تاريخ العودة" },
          { key: "status", label: "الحالة" },
          { key: "notes", label: "ملاحظات" }
        ];
        return { type: 'standard', title, data, columns, isSubscriptionReport: false };
      }

      case "player_cards": {
        const [pCards, sCards, tCards] = await Promise.all([
          allPlayers.length > 0 ? allPlayers : api.getPlayers(),
          allSubscriptions.length > 0 ? allSubscriptions : api.getSubscriptions(),
          teams.length > 0 ? teams : api.getTeams().catch(() => [])
        ]);

        const filtered = filterPlayersForCards(
          pCards,
          sCards,
          tCards,
          cardPaymentFilter,
          cardCategoryFilter,
          cardGroupFilter
        );

        const batches = [];
        for (let i = 0; i < filtered.length; i += 10) {
          batches.push(filtered.slice(i, i + 10));
        }
        return {
          type: 'player_cards',
          title: getCardReportTitle(),
          batches,
          totalCount: filtered.length
        };
      }

      case "paid_players_a4": {
        const [pAll, sAll, parentsAll] = await Promise.all([
          allPlayers.length > 0 ? allPlayers : api.getPlayers(),
          allSubscriptions.length > 0 ? allSubscriptions : api.getSubscriptions(),
          api.getParents().catch(() => [])
        ]);

        return {
          type: 'paid_players_a4',
          title: 'كشف اللاعبين المسددين للاشتراكات (مرتبين حسب السن)',
          players: pAll,
          subscriptions: sAll,
          parents: parentsAll
        };
      }

      default:
        return { type: 'standard', title, data: [], columns: [], isSubscriptionReport: false };
    }
  };

  // 1. Direct PDF Download
  const handleDirectDownload = async (type: string, title: string) => {
    setIsExporting(true);
    setDirectDownloadType(type);
    try {
      if (type === "player_cards") {
        const [pCards, sCards, tCards] = await Promise.all([
          allPlayers.length > 0 ? allPlayers : api.getPlayers(),
          allSubscriptions.length > 0 ? allSubscriptions : api.getSubscriptions(),
          teams.length > 0 ? teams : api.getTeams().catch(() => [])
        ]);

        const filtered = filterPlayersForCards(
          pCards,
          sCards,
          tCards,
          cardPaymentFilter,
          cardCategoryFilter,
          cardGroupFilter
        );

        if (filtered.length === 0) {
          alert("لا يوجد لاعبون مسددون مطابقون لهذه الفلاتر (الفئة / الفوج / الدفعة).");
          setIsExporting(false);
          setDirectDownloadType(null);
          return;
        }

        const batches = [];
        for (let i = 0; i < filtered.length; i += 10) {
          batches.push(filtered.slice(i, i + 10));
        }

        const reportTitle = getCardReportTitle();
        setPlayerBatches(batches);
        setTimeout(async () => {
          try {
            await exportToPDF('player-sheets-container', reportTitle.replace(/[\s\/\\]+/g, '_'));
          } finally {
            setIsExporting(false);
            setDirectDownloadType(null);
            setPlayerBatches([]);
          }
        }, 1500);
        return;
      }

      const payload = await buildReportPayload(type, title);
      setOffscreenReport(payload);

      const elementId = payload.type === 'administrative' ? 'administrative-report' : 
                        payload.type === 'financial' ? 'financial-statement' : 
                        payload.type === 'paid_players_a4' ? 'paid-subscribers-a4-report' :
                        'generic-report';
      
      const delay = (payload.type === 'administrative' || payload.type === 'financial') ? 1500 : 900;
      const dateSuffix = startDate || endDate ? `_${startDate || 'بداية'}_إلى_${endDate || 'نهاية'}` : '';

      setTimeout(async () => {
        try {
          await exportToPDF(elementId, `${title}${dateSuffix}`);
        } catch (err) {
          console.error("PDF Export error:", err);
        } finally {
          setIsExporting(false);
          setDirectDownloadType(null);
          setOffscreenReport(null);
        }
      }, delay);

    } catch (error) {
      console.error("Direct download failed:", error);
      setIsExporting(false);
      setDirectDownloadType(null);
      setOffscreenReport(null);
    }
  };

  // 2. Open Print & Preview Modal (PrintPortal)
  const handleOpenPrintPreview = async (type: string, title: string) => {
    setIsExporting(true);
    setDirectDownloadType(type);
    try {
      if (type === "player_cards") {
        const [pCards, sCards, tCards] = await Promise.all([
          allPlayers.length > 0 ? allPlayers : api.getPlayers(),
          allSubscriptions.length > 0 ? allSubscriptions : api.getSubscriptions(),
          teams.length > 0 ? teams : api.getTeams().catch(() => [])
        ]);

        const filtered = filterPlayersForCards(
          pCards,
          sCards,
          tCards,
          cardPaymentFilter,
          cardCategoryFilter,
          cardGroupFilter
        );

        const batches = [];
        for (let i = 0; i < filtered.length; i += 10) {
          batches.push(filtered.slice(i, i + 10));
        }

        const reportTitle = getCardReportTitle();
        setPlayerBatches(batches);
        setActiveModalReport({ 
          type: 'player_cards', 
          title: reportTitle,
          batches,
          totalCount: filtered.length
        });
        setIsPrintModalOpen(true);
        return;
      }

      const payload = await buildReportPayload(type, title);
      setActiveModalReport(payload);
      setIsPrintModalOpen(true);
    } catch (error) {
      console.error("Failed to prepare report for preview:", error);
    } finally {
      setIsExporting(false);
      setDirectDownloadType(null);
    }
  };

  // 3. Dynamic filter updater inside Modal
  const handleModalCardFilterChange = async (
    payment: 'all_paid' | 'full' | 'half',
    cat: string,
    grp: string
  ) => {
    setCardPaymentFilter(payment);
    setCardCategoryFilter(cat);
    setCardGroupFilter(grp);

    const [pCards, sCards, tCards] = await Promise.all([
      allPlayers.length > 0 ? allPlayers : api.getPlayers(),
      allSubscriptions.length > 0 ? allSubscriptions : api.getSubscriptions(),
      teams.length > 0 ? teams : api.getTeams().catch(() => [])
    ]);

    const filtered = filterPlayersForCards(pCards, sCards, tCards, payment, cat, grp);
    const batches = [];
    for (let i = 0; i < filtered.length; i += 10) {
      batches.push(filtered.slice(i, i + 10));
    }

    const reportTitle = getCardReportTitle(payment, cat, grp);
    setPlayerBatches(batches);
    setActiveModalReport((prev: any) => ({
      ...prev,
      title: reportTitle,
      batches,
      totalCount: filtered.length
    }));
  };

  const hasDateFilter = Boolean(startDate || endDate);

  return (
    <div className="space-y-8 pb-20 font-tajawal" dir="rtl">
      {/* 1. Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">إجمالي اللاعبين</p>
                  <h3 className="text-3xl font-black text-white">{teams.reduce((acc, t) => acc + (t.player_count || 0), 0)}</h3>
               </div>
               <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <Users className="h-5 w-5 text-emerald-500" />
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">الفئات النشطة</p>
                  <h3 className="text-3xl font-black text-white">{teams.length}</h3>
               </div>
               <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Activity className="h-5 w-5 text-blue-500" />
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">المدربون</p>
                  <h3 className="text-3xl font-black text-white">{coaches.length}</h3>
               </div>
               <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <Trophy className="h-5 w-5 text-amber-500" />
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">موسم التشغيل</p>
                  <h3 className="text-xl font-black text-emerald-500">{academySettings?.current_season || "2025/2026"}</h3>
               </div>
               <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <Calendar className="h-5 w-5 text-emerald-500" />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Academy Stars */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              نجوم الأسبوع (Academy Stars)
            </CardTitle>
            <p className="text-xs text-zinc-500">أفضل اللاعبين أداءً بناءً على التقييمات الأخيرة</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {stars.map((star, idx) => (
              <motion.div 
                key={star.player_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 relative group overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-zinc-400' : 'bg-orange-600'}`}></div>
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-zinc-800 overflow-hidden bg-zinc-900 flex items-center justify-center">
                    {star.photo_url ? (
                      <img src={star.photo_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <User className="h-6 w-6 text-zinc-700" />
                    )}
                  </div>
                  <div className={`absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black text-black shadow-lg ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-zinc-400' : 'bg-orange-600'}`}>
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-white truncate">{star.name}</h4>
                  <p className="text-[10px] text-zinc-500">{star.category}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-500">{Math.round(star.score)}%</span>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2 overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-black text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              خريطة الحضور والنشاط (Heatmap)
            </CardTitle>
            <p className="text-xs text-zinc-500">معدل حضور اللاعبين خلال آخر 7 أيام</p>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                  {heatmapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 10 ? '#10b981' : entry.count > 5 ? '#3b82f6' : '#3f3f46'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 2. Unified Reports Center & Date Range Selector */}
      <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-emerald-500" />
              مركز التقارير والإحصائيات الموحد
            </h2>
            <p className="text-zinc-400 mt-2 font-medium">
              طباعة وتحميل تقارير رسمية واحترافية لكافة نشاطات واشتراكات الأكاديمية محصورة بين تاريخين محددين.
            </p>
          </div>
          
          {/* Date Picker Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto">
            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="text-[11px] text-zinc-400 font-bold uppercase flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                من تاريخ
              </label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="w-full sm:w-40 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-sans" 
              />
            </div>

            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="text-[11px] text-zinc-400 font-bold uppercase flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                إلى تاريخ
              </label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="w-full sm:w-40 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-sans" 
              />
            </div>
          </div>
        </div>

        {/* Quick Date Presets & Filter Status */}
        <div className="relative z-10 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500 font-bold ml-1">تحديد سريع:</span>
            <button
              onClick={handleSetToday}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
            >
              اليوم
            </button>
            <button
              onClick={handleSetLast7Days}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
            >
              آخر 7 أيام
            </button>
            <button
              onClick={handleSetThisMonth}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
            >
              هذا الشهر
            </button>
            {hasDateFilter && (
              <button
                onClick={handleClearDates}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                إلغاء التصفية (عرض الكل)
              </button>
            )}
          </div>

          {/* Active Period Indicator Badge */}
          {hasDateFilter ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                التقارير محصورة بين:{' '}
                <strong className="text-white underline underline-offset-4">
                  {formatDateDisplay(startDate) || 'البداية'}
                </strong>
                {' '}إلى{' '}
                <strong className="text-white underline underline-offset-4">
                  {formatDateDisplay(endDate) || 'الآن'}
                </strong>
              </span>
            </div>
          ) : (
            <div className="text-xs text-zinc-500">
              * لم يتم تحديد تواريخ؛ سيتم استخراج التقارير لكامل الفترات المسجلة.
            </div>
          )}
        </div>
      </div>

      {/* 3. Reports Grid with Dual Actions: [طباعة ومعاينة] & [تحميل PDF] */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const isCurrentlyDownloading = isExporting && directDownloadType === report.type;

          return (
            <Card 
              key={report.id} 
              className="bg-zinc-900/60 border-zinc-800 hover:border-emerald-500/50 transition-all group rounded-3xl flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-emerald-500/5"
            >
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-4 rounded-2xl ${report.bg} transition-all group-hover:scale-110 shadow-sm`}>
                      <report.icon className={`h-6 w-6 ${report.color}`} />
                    </div>

                    {report.type === 'subscriptions' && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        إيقاف مالي + تفقيد
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4 font-normal">
                    {report.description}
                  </p>

                  {/* Subscriptions Installment Plan Selector */}
                  {report.type === 'subscriptions' && (
                    <div className="mb-4 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                        <span>تصفية نوع الدفعة:</span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {subscriptionPlanFilter === 'full_first' ? 'الدفعة الأولى كاملة' :
                           subscriptionPlanFilter === 'half_first' ? 'نصف الدفعة الأولى' : 'جميع المشتركين'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSubscriptionPlanFilter('all')}
                          className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                            subscriptionPlanFilter === 'all'
                              ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                          }`}
                        >
                          الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubscriptionPlanFilter('full_first')}
                          className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                            subscriptionPlanFilter === 'full_first'
                              ? 'bg-emerald-500 text-black shadow-sm font-black'
                              : 'bg-zinc-900 text-zinc-400 hover:text-emerald-400 border border-zinc-800'
                          }`}
                        >
                          كاملة
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubscriptionPlanFilter('half_first')}
                          className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                            subscriptionPlanFilter === 'half_first'
                              ? 'bg-amber-500 text-black shadow-sm font-black'
                              : 'bg-zinc-900 text-zinc-400 hover:text-amber-400 border border-zinc-800'
                          }`}
                        >
                          نصفها
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Player Cards Filtering Controls */}
                  {report.type === 'player_cards' && (
                    <div className="mb-4 p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3 shadow-inner">
                      {/* 1. Payment Plan Filter */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                            سداد الاشتراكات (المسددون فقط):
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            {cardPaymentFilter === 'full' ? 'دفعة كاملة' :
                             cardPaymentFilter === 'half' ? 'نصف دفعة' : 'كاملة ونصفها'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCardPaymentFilter('all_paid')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                              cardPaymentFilter === 'all_paid'
                                ? 'bg-zinc-100 text-zinc-950 shadow-sm font-black'
                                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                            }`}
                          >
                            كاملة ونصفها
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardPaymentFilter('full')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                              cardPaymentFilter === 'full'
                                ? 'bg-emerald-500 text-black shadow-sm font-black'
                                : 'bg-zinc-900 text-zinc-400 hover:text-emerald-400 border border-zinc-800'
                            }`}
                          >
                            كاملة فقط
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardPaymentFilter('half')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                              cardPaymentFilter === 'half'
                                ? 'bg-amber-500 text-black shadow-sm font-black'
                                : 'bg-zinc-900 text-zinc-400 hover:text-amber-400 border border-zinc-800'
                            }`}
                          >
                            نصف دفعة
                          </button>
                        </div>
                      </div>

                      {/* 2. Category & Group Selectors */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                        {/* Category Filter */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 block">
                            الفئة:
                          </label>
                          <select
                            value={cardCategoryFilter}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans cursor-pointer"
                          >
                            <option value="all">جميع الفئات</option>
                            {availableCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Group Filter */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 block">
                            الفوج:
                          </label>
                          <select
                            value={cardGroupFilter}
                            onChange={(e) => setCardGroupFilter(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans cursor-pointer"
                          >
                            <option value="all">جميع الأفواج</option>
                            {availableGroups.map((g) => {
                              const displayName = g.team_name ? (g.team_name.startsWith('فوج') ? g.team_name : `فوج ${g.team_name}`) : (g.name || `فوج ${g.team_id}`);
                              return (
                                <option key={g.team_id || g.id} value={g.team_id || g.team_name}>
                                  {displayName} {cardCategoryFilter === 'all' && g.category ? `(${g.category})` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* 3. Live Card Ready Stats */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">البطاقات الجاهزة:</span>
                        {matchingCardPlayers.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold font-mono">
                            {matchingCardPlayers.length} بطاقة ({Math.ceil(matchingCardPlayers.length / 10)} صفحة A4)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[10px]">
                            لا يوجد لاعبون مسددون
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-2">
                  {/* Print & Preview Button */}
                  <Button
                    onClick={() => handleOpenPrintPreview(report.type, report.title)}
                    disabled={isExporting}
                    variant="outline"
                    className="flex-1 bg-zinc-950/80 hover:bg-zinc-800 border-zinc-700/80 text-zinc-100 font-bold text-xs h-10 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="h-4 w-4 text-emerald-400" />
                    <span>طباعة ومعاينة</span>
                  </Button>

                  {/* Direct PDF Download Button */}
                  <Button
                    onClick={() => handleDirectDownload(report.type, report.title)}
                    disabled={isExporting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl transition-all shadow-md shadow-emerald-950/40 active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {isCurrentlyDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>{isCurrentlyDownloading ? 'جاري التحميل...' : 'تحميل PDF'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 4. Interactive Print & Preview Portal (Modal with direct printing and PDF/PNG download) */}
      {isPrintModalOpen && activeModalReport && (
        <PrintPortal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setActiveModalReport(null);
            setPlayerBatches([]);
          }}
          title={activeModalReport.title}
          fileName={`${activeModalReport.title}${startDate || endDate ? `_${startDate || 'بداية'}_إلى_${endDate || 'نهاية'}` : ''}`}
        >
          {activeModalReport.type === 'standard' && (
            <GenericReportTemplate 
              title={activeModalReport.title} 
              dateRange={{ start: formatDateDisplay(startDate), end: formatDateDisplay(endDate) }} 
              data={activeModalReport.data} 
              columns={activeModalReport.columns} 
              academySettings={academySettings} 
              isSubscriptionReport={activeModalReport.isSubscriptionReport}
              isPlayersReport={activeModalReport.isPlayersReport}
              totalAmount={activeModalReport.totalAmount}
              subscribersCount={activeModalReport.subscribersCount}
            />
          )}

          {activeModalReport.type === 'administrative' && (
            <AdministrativeActivityReportTemplate 
              title={activeModalReport.title} 
              players={activeModalReport.players} 
              trainings={activeModalReport.trainings} 
              matches={activeModalReport.matches} 
              summary={activeModalReport.summary} 
              academySettings={academySettings} 
              fromDate={formatDateDisplay(startDate)} 
              toDate={formatDateDisplay(endDate)} 
            />
          )}

          {activeModalReport.type === 'financial' && (
            <FinancialStatementTemplate 
              title={activeModalReport.title} 
              transactions={activeModalReport.transactions} 
              totalIncome={activeModalReport.totalIncome} 
              totalExpense={activeModalReport.totalExpense} 
              balance={activeModalReport.balance} 
              academySettings={academySettings} 
              fromDate={formatDateDisplay(startDate)} 
              toDate={formatDateDisplay(endDate)} 
              subscriptionIncomeTotal={activeModalReport.subscriptionIncomeTotal} 
              manualIncomeTotal={activeModalReport.manualIncomeTotal} 
            />
          )}

          {activeModalReport.type === 'paid_players_a4' && (
            <PaidSubscribersA4SheetTemplate
              players={activeModalReport.players}
              subscriptions={activeModalReport.subscriptions}
              parents={activeModalReport.parents}
              academySettings={academySettings}
              title={activeModalReport.title}
              containerId="paid-subscribers-a4-report"
            />
          )}

          {activeModalReport.type === 'player_cards' && (
            <div>
              {/* Interactive Toolbar Inside Modal (Hidden when printing) */}
              <div className="print:hidden mb-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-sm shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base">فلترة ومعاينة بطاقات اللاعبين المسددين</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">يمكنك تغيير الفئة، الفوج، ونوع الدفعة مباشرة لتحديث المعاينة فورياً.</p>
                  </div>
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Selector */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 font-bold">الفئة:</span>
                    <select
                      value={cardCategoryFilter}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        let newGrp = cardGroupFilter;
                        if (newCat !== 'all') {
                          const groupStillValid = teams.some(
                            (t: any) => t.category === newCat && (String(t.team_id) === String(cardGroupFilter) || t.team_name === cardGroupFilter)
                          );
                          if (!groupStillValid) newGrp = 'all';
                        }
                        handleModalCardFilterChange(cardPaymentFilter, newCat, newGrp);
                      }}
                      className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-zinc-900">جميع الفئات</option>
                      {availableCategories.map((c) => (
                        <option key={c} value={c} className="bg-zinc-900">{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Group Selector */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 font-bold">الفوج:</span>
                    <select
                      value={cardGroupFilter}
                      onChange={(e) => handleModalCardFilterChange(cardPaymentFilter, cardCategoryFilter, e.target.value)}
                      className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-zinc-900">جميع الأفواج</option>
                      {availableGroups.map((g) => {
                        const displayName = g.team_name ? (g.team_name.startsWith('فوج') ? g.team_name : `فوج ${g.team_name}`) : (g.name || `فوج ${g.team_id}`);
                        return (
                          <option key={g.team_id || g.id} value={g.team_id || g.team_name} className="bg-zinc-900">
                            {displayName} {cardCategoryFilter === 'all' && g.category ? `(${g.category})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Payment Filter */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleModalCardFilterChange('all_paid', cardCategoryFilter, cardGroupFilter)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        cardPaymentFilter === 'all_paid'
                          ? 'bg-zinc-100 text-zinc-950 font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      كاملة ونصفها
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModalCardFilterChange('full', cardCategoryFilter, cardGroupFilter)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        cardPaymentFilter === 'full'
                          ? 'bg-emerald-500 text-black font-black'
                          : 'text-zinc-400 hover:text-emerald-400'
                      }`}
                    >
                      كاملة فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModalCardFilterChange('half', cardCategoryFilter, cardGroupFilter)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        cardPaymentFilter === 'half'
                          ? 'bg-amber-500 text-black font-black'
                          : 'text-zinc-400 hover:text-amber-400'
                      }`}
                    >
                      نصف دفعة
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {playerBatches.reduce((acc, b) => acc + b.length, 0)} بطاقة
                    </span>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {playerBatches.length} صفحة A4
                    </span>
                  </div>
                </div>
              </div>

              {playerBatches.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-2xl border border-zinc-200 shadow-sm max-w-lg mx-auto my-8">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-lg font-black text-zinc-800">لا يوجد لاعبون مسددون مطابقون للفلاتر</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    لم يتم العثور على لاعبين سددوا اشتراكاتهم وفق الفئة أو الفوج أو نوع الدفعة المحدد. يمكنك تعديل الخيارات من الأعلى لمعاينة بطاقات الفئات الأخرى.
                  </p>
                </div>
              ) : (
                <div id="player-sheets-container">
                  {playerBatches.map((batch, idx) => (
                    <PlayerCardsBatchTemplate 
                      key={idx} 
                      players={batch} 
                      teams={teams}
                      coaches={coaches}
                      academySettings={academySettings} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </PrintPortal>
      )}

      {/* 5. Offscreen Containers for Direct PDF Downloads */}
      {offscreenReport && (
        <div style={{ position: 'fixed', left: -9999, top: 0, width: '210mm', zIndex: -999, pointerEvents: 'none', background: '#ffffff' }}>
          {offscreenReport.type === 'standard' && (
            <GenericReportTemplate 
              title={offscreenReport.title} 
              dateRange={{ start: formatDateDisplay(startDate), end: formatDateDisplay(endDate) }} 
              data={offscreenReport.data} 
              columns={offscreenReport.columns} 
              academySettings={academySettings}
              isSubscriptionReport={offscreenReport.isSubscriptionReport}
              isPlayersReport={offscreenReport.isPlayersReport}
              totalAmount={offscreenReport.totalAmount}
              subscribersCount={offscreenReport.subscribersCount}
            />
          )}
          {offscreenReport.type === 'administrative' && (
            <AdministrativeActivityReportTemplate 
              title={offscreenReport.title} 
              players={offscreenReport.players} 
              trainings={offscreenReport.trainings} 
              matches={offscreenReport.matches} 
              summary={offscreenReport.summary} 
              academySettings={academySettings} 
              fromDate={formatDateDisplay(startDate)} 
              toDate={formatDateDisplay(endDate)} 
            />
          )}
          {offscreenReport.type === 'financial' && (
            <FinancialStatementTemplate 
              title={offscreenReport.title} 
              transactions={offscreenReport.transactions} 
              totalIncome={offscreenReport.totalIncome} 
              totalExpense={offscreenReport.totalExpense} 
              balance={offscreenReport.balance} 
              academySettings={academySettings} 
              fromDate={formatDateDisplay(startDate)} 
              toDate={formatDateDisplay(endDate)} 
              subscriptionIncomeTotal={offscreenReport.subscriptionIncomeTotal} 
              manualIncomeTotal={offscreenReport.manualIncomeTotal} 
            />
          )}
          {offscreenReport.type === 'paid_players_a4' && (
            <PaidSubscribersA4SheetTemplate 
              players={offscreenReport.players} 
              subscriptions={offscreenReport.subscriptions} 
              parents={offscreenReport.parents} 
              academySettings={academySettings} 
              title={offscreenReport.title} 
              containerId="paid-subscribers-a4-report"
            />
          )}
        </div>
      )}

      {playerBatches.length > 0 && !isPrintModalOpen && (
        <div id="player-sheets-container" style={{ position: 'fixed', left: -9999, top: 0, width: '210mm', zIndex: -999, pointerEvents: 'none', background: '#ffffff' }}>
          {playerBatches.map((batch, idx) => (
            <PlayerCardsBatchTemplate 
              key={idx} 
              players={batch} 
              teams={teams}
              coaches={coaches}
              academySettings={academySettings} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default Reports;
