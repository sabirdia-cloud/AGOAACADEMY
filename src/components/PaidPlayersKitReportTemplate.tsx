import React from "react";

export interface PaidPlayerKitData {
  player_id: number;
  name: string;
  category: string;
  uniform_size: string;
  paymentType: 'full' | 'half' | 'exempt' | 'unpaid';
  paymentLabel: string;
  paymentAmount?: number;
  paymentColor: string;
  paymentBg: string;
  paymentBorder: string;
  isDelivered: boolean;
  deliveryStatusLabel: string;
  kitItems?: string;
  kitNumber?: string;
  notes?: string;
  isEligible?: boolean;
}

export interface PaidPlayersKitReportProps {
  players: PaidPlayerKitData[];
  selectedCategory?: string;
  academySettings?: any;
}

export function PaidPlayersKitReportTemplate({
  players,
  selectedCategory = 'all',
  academySettings
}: PaidPlayersKitReportProps) {
  const academyLogo = academySettings?.logo_url?.includes('agoa_academy_logo')
    ? 'https://ouskqpcmsldrzgjkksju.supabase.co/storage/v1/object/public/photos/agoa_shield_badge_1791590773652.png'
    : (academySettings?.logo_url || '/academy-badge.png');
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const currentSeason = academySettings?.current_season || "2024 / 2025";
  const today = new Date().toLocaleDateString('ar-DZ');

  // Stats
  const totalEligible = players.length;
  const fullCount = players.filter(p => p.paymentType === 'full').length;
  const halfCount = players.filter(p => p.paymentType === 'half').length;
  const exemptCount = players.filter(p => p.paymentType === 'exempt').length;
  const deliveredCount = players.filter(p => p.isDelivered).length;
  const pendingDeliveryCount = totalEligible - deliveredCount;

  // Chunk players into pages of exactly 40 per page
  const ROWS_PER_PAGE = 40;
  const pages: PaidPlayerKitData[][] = [];
  if (players.length === 0) {
    pages.push([]);
  } else {
    for (let i = 0; i < players.length; i += ROWS_PER_PAGE) {
      pages.push(players.slice(i, i + ROWS_PER_PAGE));
    }
  }
  const totalPages = pages.length;

  const categoryDisplay = selectedCategory === 'all' ? 'جميع الفئات' : `فئة ${selectedCategory}`;

  const thStyle: React.CSSProperties = {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '2px 4px',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: '6.4pt',
    border: '1px solid #1e293b',
    boxSizing: 'border-box',
    lineHeight: 1.2
  };

  const tdBase: React.CSSProperties = {
    padding: '1px 3.5px',
    border: '1px solid #cbd5e1',
    fontSize: '6.4pt',
    color: '#1e293b',
    verticalAlign: 'middle',
    boxSizing: 'border-box',
    lineHeight: 1.15
  };

  return (
    <div id="paid-players-kit-report" style={{ direction: 'rtl', fontFamily: "'Tajawal', 'Cairo', Arial, sans-serif", color: '#0f172a' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .a4-kit-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          .a4-kit-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}} />

      {pages.map((pagePlayers, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const pageStartIdx = pageIdx * ROWS_PER_PAGE;

        // Pad to exactly 40 rows on each page so the lines remain neat and aligned
        const paddedRows: Array<PaidPlayerKitData | { isPlaceholder: true }> = [...pagePlayers];
        while (paddedRows.length < ROWS_PER_PAGE) {
          paddedRows.push({ isPlaceholder: true } as any);
        }

        return (
          <div
            key={pageIdx}
            className="a4-kit-page"
            style={{
              width: '210mm',
              height: '297mm',
              maxHeight: '297mm',
              padding: '6mm 8mm',
              margin: '0 auto 20px',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Page Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2.5px solid #059669',
              paddingBottom: '2mm',
              marginBottom: '2mm',
              flexShrink: 0
            }}>
              {/* Right: Academy details */}
              <div style={{ flex: 1, textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '7pt', color: '#64748b', fontWeight: 'bold' }}>
                  الجمهورية الجزائرية الديمقراطية الشعبية — وزارة الشباب والرياضة
                </p>
                <h1 style={{ margin: '1px 0 0', fontSize: '12pt', fontWeight: '900', color: '#0f172a', lineHeight: 1.15 }}>
                  {academyName}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <h2 style={{ margin: 0, fontSize: '9pt', fontWeight: '800', color: '#059669' }}>
                    كشف تسليم الألبسة والعتاد الرياضي للاعبين المسددين
                  </h2>
                  <span style={{
                    fontSize: '6.5pt',
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    padding: '1px 7px',
                    borderRadius: '4px',
                    fontWeight: '800'
                  }}>
                    {categoryDisplay}
                  </span>
                  <span style={{
                    fontSize: '6.5pt',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    padding: '1px 7px',
                    borderRadius: '4px',
                    fontWeight: '800'
                  }}>
                    (40 لاعب في الورقة)
                  </span>
                </div>
                {/* Stats line */}
                <div style={{ marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '6.4pt', color: '#64748b' }}>
                  <span>الموسم: <strong style={{ color: '#0f172a' }}>{currentSeason}</strong></span>
                  <span>المؤهلون: <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{totalEligible}</strong></span>
                  <span>دفعة كاملة: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{fullCount}</strong></span>
                  <span>نصف دفعة: <strong style={{ color: '#b45309', fontFamily: 'monospace' }}>{halfCount}</strong></span>
                  {exemptCount > 0 && <span>حالات خاصة (معفى): <strong style={{ color: '#9333ea', fontFamily: 'monospace' }}>{exemptCount}</strong></span>}
                  <span>تم الاستلام: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{deliveredCount}</strong></span>
                  <span>قيد الانتظار: <strong style={{ color: '#dc2626', fontFamily: 'monospace' }}>{pendingDeliveryCount}</strong></span>
                </div>
              </div>

              {/* Left / Center: Academy Logo */}
              <div style={{ marginRight: '5mm', textAlign: 'center', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={academyLogo}
                  alt="Logo"
                  style={{
                    height: '46px',
                    width: '46px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))'
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span style={{ fontSize: '5.5pt', color: '#94a3b8', marginTop: '1px' }}>
                  تاريخ: {today}
                </span>
              </div>
            </div>

            {/* Table Area (Fills exact 40 rows) */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '6.4pt',
                tableLayout: 'fixed',
                textAlign: 'right'
              }}>
                <thead>
                  <tr style={{ height: '4.8mm' }}>
                    <th style={{ ...thStyle, width: '22px' }}>#</th>
                    <th style={{ ...thStyle, width: '135px', textAlign: 'right', paddingRight: '6px' }}>اسم ولقب اللاعب</th>
                    <th style={{ ...thStyle, width: '52px' }}>الفئة</th>
                    <th style={{ ...thStyle, width: '58px', backgroundColor: '#064e3b', color: '#6ee7b7' }}>مقاس البدلة</th>
                    <th style={{ ...thStyle, width: '65px' }}>حالة السداد</th>
                    <th style={{ ...thStyle, width: '65px' }}>حالة الاستلام</th>
                    <th style={{ ...thStyle, width: '70px' }}>العتاد / رقم القطعة</th>
                    <th style={{ ...thStyle, width: '95px', textAlign: 'right', paddingRight: '5px' }}>ملاحظات</th>
                    <th style={{ ...thStyle, width: '65px' }}>توقيع الاستلام</th>
                  </tr>
                </thead>
                <tbody>
                  {paddedRows.map((item, idx) => {
                    const globalIdx = pageStartIdx + idx + 1;
                    const isEven = idx % 2 === 0;
                    const rowBg = isEven ? '#ffffff' : '#f8fafc';

                    if ('isPlaceholder' in item) {
                      return (
                        <tr key={`ph-${idx}`} style={{ height: '5.12mm', backgroundColor: rowBg }}>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#94a3b8', fontWeight: '700', fontFamily: 'monospace' }}>
                            {globalIdx}
                          </td>
                          <td style={{ ...tdBase, color: '#cbd5e1' }}>......................................................</td>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#cbd5e1' }}>—</td>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#cbd5e1' }}>—</td>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#cbd5e1' }}>—</td>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#cbd5e1' }}>—</td>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#cbd5e1' }}>—</td>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#cbd5e1' }}>—</td>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#cbd5e1' }}>—</td>
                        </tr>
                      );
                    }

                    const p = item as PaidPlayerKitData;
                    const kitSize = p.uniform_size && p.uniform_size !== '---' ? p.uniform_size : 'غير محدد';

                    return (
                      <tr key={p.player_id || idx} style={{ height: '5.12mm', backgroundColor: rowBg }}>
                        {/* # */}
                        <td style={{ ...tdBase, textAlign: 'center', color: '#64748b', fontWeight: '700', fontFamily: 'monospace' }}>
                          {globalIdx}
                        </td>

                        {/* Name */}
                        <td style={{ ...tdBase, fontWeight: '800', color: '#0f172a', paddingRight: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </td>

                        {/* Category */}
                        <td style={{ ...tdBase, textAlign: 'center', fontWeight: '700', color: '#047857' }}>
                          {p.category || 'عام'}
                        </td>

                        {/* Kit Size */}
                        <td style={{ ...tdBase, textAlign: 'center', fontWeight: '900', color: '#065f46', backgroundColor: '#f0fdf4' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.5px 5px',
                            borderRadius: '3px',
                            background: '#dcfce7',
                            border: '1px solid #86efac',
                            fontSize: '6.5pt',
                            fontFamily: 'monospace'
                          }}>
                            {kitSize}
                          </span>
                        </td>

                        {/* Payment Status */}
                        <td style={{ ...tdBase, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.5px 4px',
                            borderRadius: '3px',
                            fontSize: '6pt',
                            fontWeight: '800',
                            backgroundColor: p.paymentBg,
                            color: p.paymentColor,
                            border: `1px solid ${p.paymentBorder}`,
                            whiteSpace: 'nowrap'
                          }}>
                            {p.paymentLabel}
                          </span>
                        </td>

                        {/* Delivery Status */}
                        <td style={{ ...tdBase, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.5px 4px',
                            borderRadius: '3px',
                            fontSize: '6pt',
                            fontWeight: '700',
                            backgroundColor: p.isDelivered ? '#ecfdf5' : '#fff1f2',
                            color: p.isDelivered ? '#059669' : '#e11d48',
                            border: `1px solid ${p.isDelivered ? '#a7f3d0' : '#fecdd3'}`,
                            whiteSpace: 'nowrap'
                          }}>
                            {p.deliveryStatusLabel}
                          </span>
                        </td>

                        {/* Kit Items / Kit Number */}
                        <td style={{ ...tdBase, textAlign: 'center', fontSize: '6pt', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.kitNumber ? `[#${p.kitNumber}] ` : ''}{p.kitItems || '—'}
                        </td>

                        {/* Notes */}
                        <td style={{ ...tdBase, fontSize: '6pt', color: '#334155', paddingRight: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.notes || '—'}
                        </td>

                        {/* Signature Cell */}
                        <td style={{ ...tdBase, textAlign: 'center', border: '1px solid #cbd5e1' }}>
                          {p.isDelivered ? (
                            <span style={{ color: '#059669', fontSize: '6pt', fontWeight: 'bold' }}>✓ مُسلّم</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '5.5pt' }}>....................</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Section */}
            <div style={{ marginTop: '1.5mm', paddingTop: '1mm', flexShrink: 0 }}>
              {isLastPage ? (
                <div>
                  {/* Summary Banner on Last Page */}
                  <div style={{
                    padding: '2px 8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '6.5pt',
                    fontWeight: '700',
                    marginBottom: '2mm'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span>إجمالي اللاعبين المسددين: <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{totalEligible}</strong></span>
                      <span>سددوا كاملة: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{fullCount}</strong></span>
                      <span>سددوا نصفها: <strong style={{ color: '#b45309', fontFamily: 'monospace' }}>{halfCount}</strong></span>
                      {exemptCount > 0 && <span>حالات خاصة: <strong style={{ color: '#9333ea', fontFamily: 'monospace' }}>{exemptCount}</strong></span>}
                      <span>استلموا اللباس: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{deliveredCount}</strong></span>
                      <span>قيد الانتظار: <strong style={{ color: '#e11d48', fontFamily: 'monospace' }}>{pendingDeliveryCount}</strong></span>
                    </div>
                    <span style={{ color: '#059669', fontWeight: '800' }}>نهاية الكشف الرسمي لتوزيع الألبسة والعتاد</span>
                  </div>

                  {/* Signatures and Stamps */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    textAlign: 'center',
                    paddingTop: '1mm',
                    borderTop: '1px solid #e2e8f0',
                    fontSize: '6.5pt'
                  }}>
                    <div>
                      <p style={{ margin: '0 0 10px', fontWeight: '800', color: '#0f172a' }}>مسؤول العتاد وتوزيع الألبسة</p>
                      <div style={{ borderBottom: '1px dashed #94a3b8', width: '90px', margin: '0 auto' }}></div>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 10px', fontWeight: '800', color: '#0f172a' }}>المشرف الفني العام</p>
                      <div style={{ borderBottom: '1px dashed #94a3b8', width: '90px', margin: '0 auto' }}></div>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 10px', fontWeight: '800', color: '#0f172a' }}>ختم ومصادقة إدارة الأكاديمية</p>
                      <div style={{ borderBottom: '1px dashed #94a3b8', width: '90px', margin: '0 auto' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', fontSize: '6.4pt', color: '#64748b', paddingBottom: '1mm' }}>
                  <span>(تُستكمل بقية قائمة اللاعبين في الصفحة التالية...)</span>
                </div>
              )}

              {/* Bottom Footer Line */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1mm',
                marginTop: '1.5mm',
                fontSize: '6pt',
                color: '#94a3b8'
              }}>
                <span>{academyName} — كشف توزيع الألبسة والعتاد للمسددين (40 بالورقة)</span>
                <span style={{ fontWeight: '800', color: '#0f172a' }}>صفحة {pageIdx + 1} من {totalPages}</span>
                <span>تاريخ الاستخراج: {today}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
