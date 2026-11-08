import React from "react";

export interface CoachAttendanceSession {
  training_id: number | string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
  category?: string;
  team_id?: number | string;
  team_name?: string;
}

export interface CoachAttendanceReportProps {
  coach: {
    coach_id: number | string;
    name: string;
    category?: string;
    phone?: string;
    salary_per_session?: number;
    license?: string;
  };
  sessions: CoachAttendanceSession[];
  periodDescription: string;
  monthsList: string[];
  academySettings?: any;
  paymentInfo?: {
    isPaid: boolean;
    amount?: number;
    payment_date?: string;
    notes?: string;
  };
}

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const getArabicDayName = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return daysOfWeek[d.getDay()] || '';
};

export const getDurationText = (start?: string, end?: string) => {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '';
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return '';
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours} سا ${mins} د`;
  if (hours > 0) return `${hours} سا`;
  return `${mins} دقيقة`;
};

export const parseThemeAndNotes = (notes?: string) => {
  if (!notes) return { theme: 'تدريب عام', realNotes: '—' };
  const parts = notes.split('|');
  const themeLabels: Record<string, string> = {
    technical: 'تقني (Technical)',
    tactical: 'تكتيكي (Tactical)',
    physical: 'بدني (Physical)',
    mental: 'ذهني (Mental)',
    match: 'مباراة تطبيقية (Match)'
  };
  const rawTheme = parts[0]?.trim();
  const theme = themeLabels[rawTheme] || rawTheme || 'تدريب عام';
  const realNotes = parts[1]?.trim() || (parts.length === 1 && !themeLabels[rawTheme] ? parts[0]?.trim() : '') || '—';
  return { theme, realNotes };
};

export function CoachAttendanceReportTemplate({
  coach,
  sessions,
  periodDescription,
  monthsList,
  academySettings,
  paymentInfo
}: CoachAttendanceReportProps) {
  const academyLogo = academySettings?.logo_url?.includes('agoa_academy_logo')
    ? 'https://ouskqpcmsldrzgjkksju.supabase.co/storage/v1/object/public/photos/agoa_shield_badge_1791590773652.png'
    : (academySettings?.logo_url || '/academy-badge.png');
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const ratePerSession = Number(coach.salary_per_session) || 1000;
  const totalDue = sessions.length * ratePerSession;
  const isPaid = paymentInfo?.isPaid || false;
  const today = new Date().toLocaleDateString('ar-DZ');

  // Chunking sessions to fit A4 pages cleanly
  // Page 1 has header and summary cards, so fits ~14 rows
  // Subsequent pages fit ~22 rows
  const PAGE1_CAPACITY = 13;
  const SUBSEQUENT_CAPACITY = 20;

  const pages: CoachAttendanceSession[][] = [];
  if (sessions.length <= PAGE1_CAPACITY) {
    pages.push(sessions);
  } else {
    pages.push(sessions.slice(0, PAGE1_CAPACITY));
    let remaining = sessions.slice(PAGE1_CAPACITY);
    while (remaining.length > 0) {
      pages.push(remaining.slice(0, SUBSEQUENT_CAPACITY));
      remaining = remaining.slice(SUBSEQUENT_CAPACITY);
    }
  }

  const totalPages = pages.length;

  return (
    <div className="coach-attendance-report-container" style={{ direction: 'rtl', fontFamily: "'Tajawal', 'Cairo', Arial, sans-serif", color: '#0f172a' }}>
      {pages.map((pageSessions, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const startIndex = isFirstPage ? 0 : PAGE1_CAPACITY + (pageIdx - 1) * SUBSEQUENT_CAPACITY;

        return (
          <div
            key={pageIdx}
            className="print-page"
            style={{
              width: '210mm',
              height: '297mm',
              maxHeight: '297mm',
              padding: '8mm 10mm',
              margin: '0 auto 20px',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              pageBreakAfter: isLastPage ? 'auto' : 'always',
              breakAfter: isLastPage ? 'auto' : 'page',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header with Academy Logo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2.5px solid #0f172a',
              paddingBottom: '4mm',
              marginBottom: '3.5mm'
            }}>
              {/* Right: Academy info */}
              <div style={{ width: '38%', textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '9pt', fontWeight: 'bold', color: '#64748b' }}>الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <h1 style={{ margin: '2px 0 0', fontSize: '13pt', fontWeight: '900', color: '#0f172a' }}>{academyName}</h1>
                <p style={{ margin: '2px 0 0', fontSize: '8pt', color: '#475569' }}>
                  {academySettings?.address || 'وادي العثمانية — ولاية ميلة'}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '7.5pt', color: '#64748b' }}>
                  {academySettings?.phone ? `الهاتف: ${academySettings.phone}` : ''} {academySettings?.current_season ? `| الموسم: ${academySettings.current_season}` : ''}
                </p>
              </div>

              {/* Center: Official Logo */}
              <div style={{ width: '24%', textAlign: 'center' }}>
                <img
                  src={academyLogo}
                  alt={academyName}
                  style={{
                    width: '68px',
                    height: '68px',
                    objectFit: 'contain',
                    margin: '0 auto',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
                  }}
                  onError={(e) => {
                    // Fallback to placeholder if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Left: Document Metadata */}
              <div style={{ width: '38%', textAlign: 'left', direction: 'ltr' }}>
                <div style={{
                  display: 'inline-block',
                  textAlign: 'right',
                  direction: 'rtl',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '7.5pt'
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a' }}>وثيقة إدارية رسمية</p>
                  <p style={{ margin: '2px 0 0', color: '#475569' }}>تاريخ الاستخراج: <strong>{today}</strong></p>
                  <p style={{ margin: '2px 0 0', color: '#64748b' }}>صفحة <strong>{pageIdx + 1}</strong> من <strong>{totalPages}</strong></p>
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div style={{
              background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4mm'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '12pt', fontWeight: '900', letterSpacing: '-0.3px' }}>
                  كشف الحضور والحصص التدريبية المنفذة
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '7.5pt', color: '#94a3b8' }}>
                  مستخرج رسمي من سجل برنامج التدريبات والأجور
                </p>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                padding: '3px 10px',
                fontSize: '8.5pt',
                fontWeight: 'bold',
                color: '#38bdf8'
              }}>
                المدرب: {coach.name}
              </div>
            </div>

            {/* Top Cards (Only on First Page) */}
            {isFirstPage && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '4mm'
              }}>
                {/* Coach Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRight: '4px solid #0284c7',
                  borderRadius: '6px',
                  padding: '6px 8px'
                }}>
                  <p style={{ margin: 0, fontSize: '7pt', color: '#64748b', fontWeight: 'bold' }}>المدرب المسؤول</p>
                  <p style={{ margin: '2px 0 0', fontSize: '9pt', fontWeight: '900', color: '#0f172a' }}>{coach.name}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '6.5pt', color: '#0284c7' }}>
                    {coach.category ? `الفئة: ${coach.category}` : 'طاقم التدريب'} {coach.license ? `• ${coach.license}` : ''}
                  </p>
                </div>

                {/* Period & Months Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRight: '4px solid #8b5cf6',
                  borderRadius: '6px',
                  padding: '6px 8px'
                }}>
                  <p style={{ margin: 0, fontSize: '7pt', color: '#64748b', fontWeight: 'bold' }}>الفترة والأشهر</p>
                  <p style={{ margin: '2px 0 0', fontSize: '8pt', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                    {periodDescription}
                  </p>
                  {monthsList.length > 0 && (
                    <p style={{ margin: '1px 0 0', fontSize: '6.5pt', color: '#8b5cf6' }}>
                      الأشهر: {monthsList.join('، ')}
                    </p>
                  )}
                </div>

                {/* Sessions Count Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRight: '4px solid #059669',
                  borderRadius: '6px',
                  padding: '6px 8px'
                }}>
                  <p style={{ margin: 0, fontSize: '7pt', color: '#64748b', fontWeight: 'bold' }}>إجمالي الحصص المنفذة</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11pt', fontWeight: '900', color: '#059669' }}>
                    {sessions.length} <span style={{ fontSize: '7.5pt', fontWeight: 'bold' }}>حصة</span>
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: '6.5pt', color: '#64748b' }}>
                    حسب البرنامج المعتمد
                  </p>
                </div>

                {/* Total Compensation Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRight: '4px solid #eab308',
                  borderRadius: '6px',
                  padding: '6px 8px'
                }}>
                  <p style={{ margin: 0, fontSize: '7pt', color: '#64748b', fontWeight: 'bold' }}>المستحقات المالية</p>
                  <p style={{ margin: '2px 0 0', fontSize: '10pt', fontWeight: '900', color: '#0f172a' }}>
                    {totalDue.toLocaleString()} <span style={{ fontSize: '7pt' }}>دج</span>
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: '6.5pt', color: isPaid ? '#059669' : '#d97706', fontWeight: 'bold' }}>
                    {ratePerSession.toLocaleString()} دج/حصة • {isPaid ? '✅ مسدد' : '⏳ معلق'}
                  </p>
                </div>
              </div>
            )}

            {/* Table Header / Container */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'right',
                direction: 'rtl',
                fontSize: '7.5pt',
                lineHeight: '1.25'
              }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                    <th style={{ padding: '5px 4px', width: '4%', textAlign: 'center', border: '1px solid #1e293b' }}>#</th>
                    <th style={{ padding: '5px 6px', width: '16%', border: '1px solid #1e293b' }}>اليوم والتاريخ</th>
                    <th style={{ padding: '5px 6px', width: '15%', border: '1px solid #1e293b' }}>التوقيت والمدة</th>
                    <th style={{ padding: '5px 6px', width: '15%', border: '1px solid #1e293b' }}>الفئة / الفوج</th>
                    <th style={{ padding: '5px 6px', width: '14%', border: '1px solid #1e293b' }}>نوع الحصة</th>
                    <th style={{ padding: '5px 6px', width: '14%', border: '1px solid #1e293b' }}>المكان</th>
                    <th style={{ padding: '5px 6px', width: '22%', border: '1px solid #1e293b' }}>الملاحظات والتوجيهات</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '9pt', border: '1px solid #cbd5e1' }}>
                        لا توجد حصص تدريبية مسجلة لهذه الفترة للمدرب المحدد.
                      </td>
                    </tr>
                  ) : (
                    pageSessions.map((session, sIdx) => {
                      const absoluteIndex = startIndex + sIdx + 1;
                      const dayName = getArabicDayName(session.date);
                      const duration = getDurationText(session.start_time, session.end_time);
                      const { theme, realNotes } = parseThemeAndNotes(session.notes);
                      const categoryDisplay = session.team_name
                        ? `${session.category || ''} (${session.team_name})`
                        : (session.category || 'الفريق');

                      return (
                        <tr
                          key={session.training_id || sIdx}
                          style={{
                            background: sIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderBottom: '1px solid #cbd5e1'
                          }}
                        >
                          <td style={{ padding: '4px', textAlign: 'center', fontWeight: 'bold', color: '#475569', border: '1px solid #cbd5e1' }}>
                            {absoluteIndex}
                          </td>
                          <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>
                            <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{session.date}</div>
                            <div style={{ fontSize: '6.5pt', color: '#0284c7' }}>{dayName}</div>
                          </td>
                          <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>
                            <div style={{ fontWeight: 'bold', color: '#0f172a', direction: 'ltr', textAlign: 'right' }}>
                              {session.start_time} - {session.end_time}
                            </div>
                            {duration && <div style={{ fontSize: '6.5pt', color: '#64748b' }}>({duration})</div>}
                          </td>
                          <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#0f172a' }}>
                            {categoryDisplay}
                          </td>
                          <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 'bold',
                              fontSize: '6.5pt'
                            }}>
                              {theme}
                            </span>
                          </td>
                          <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', color: '#334155' }}>
                            {session.location || 'الملعب الرئيسي'}
                          </td>
                          <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', color: '#1e293b', fontSize: '7pt' }}>
                            {realNotes}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Section (Summary & Signatures on Last Page, or Continuation on earlier pages) */}
            {isLastPage ? (
              <div style={{ marginTop: 'auto', paddingTop: '3mm' }}>
                {/* Summary Strip */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f1f5f9',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  marginBottom: '4mm',
                  fontSize: '8pt'
                }}>
                  <div>
                    <span>إجمالي الحصص المنفذة: </span>
                    <strong style={{ color: '#0f172a', fontSize: '9pt' }}>{sessions.length} حصة</strong>
                  </div>
                  <div>
                    <span>سعر الحصة: </span>
                    <strong style={{ color: '#0f172a' }}>{ratePerSession.toLocaleString()} دج</strong>
                  </div>
                  <div>
                    <span>إجمالي المستحقات: </span>
                    <strong style={{ color: '#059669', fontSize: '9.5pt' }}>{totalDue.toLocaleString()} دج</strong>
                  </div>
                  <div>
                    <span>حالة التسديد: </span>
                    <strong style={{ color: isPaid ? '#059669' : '#d97706' }}>
                      {isPaid ? 'تم التسديد بنجاح' : 'معلق في انتظار الصرف'}
                    </strong>
                  </div>
                </div>

                {/* Signatures */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '15px',
                  textAlign: 'center',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '3mm',
                  marginBottom: '2mm'
                }}>
                  <div>
                    <p style={{ margin: '0 0 15px', fontSize: '7.5pt', fontWeight: 'bold', color: '#0f172a' }}>
                      توقيع المدرب ({coach.name})
                    </p>
                    <div style={{ borderBottom: '1px dashed #94a3b8', width: '100px', margin: '0 auto' }}></div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 15px', fontSize: '7.5pt', fontWeight: 'bold', color: '#0f172a' }}>
                      المشرف الفني العام
                    </p>
                    <div style={{ borderBottom: '1px dashed #94a3b8', width: '100px', margin: '0 auto' }}></div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 15px', fontSize: '7.5pt', fontWeight: 'bold', color: '#0f172a' }}>
                      ختم ومصادقة إدارة الأكاديمية
                    </p>
                    <div style={{ borderBottom: '1px dashed #94a3b8', width: '100px', margin: '0 auto' }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '7pt', color: '#64748b', paddingTop: '2mm' }}>
                <span>(تُستكمل بقية الحصص في الصفحة الموالية...)</span>
              </div>
            )}

            {/* Footer Line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #cbd5e1',
              paddingTop: '2mm',
              fontSize: '6.5pt',
              color: '#94a3b8'
            }}>
              <span>{academyName} — تقرير حصص وتدريبات المدرب</span>
              <span>صفحة {pageIdx + 1} من {totalPages}</span>
              <span>نظام إدارة الأكاديمية — {today}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
