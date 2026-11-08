import React from "react";
import { Shield, UserCheck, UserX, Clock, Phone, Cake, Award, Calendar, BarChart3 } from "lucide-react";
import { AdminSignature } from "./PrintTemplates";

export interface AdminScanEntry {
  id: number;
  player_id: number;
  name: string;
  birth_date: string;
  phone: string;
  category: string;
  team_name: string;
  check_in_time: string;
  date: string;
}

export interface PlayerStats {
  present: number;
  absent: number;
  rate: number;
}

export interface AbsentPlayerEntry {
  player_id: number;
  name: string;
  birth_date: string;
  phone: string;
  category: string;
  team_name: string;
  stats?: PlayerStats;
}

export interface AdminScannerReportTemplateProps {
  presentPlayers: (AdminScanEntry & { stats?: PlayerStats })[];
  absentPlayersByCategory: Record<string, (AbsentPlayerEntry & { stats?: PlayerStats })[]>;
  categoryStats: {
    category: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
  }[];
  date: string;
  academySettings?: any;
  user?: any;
}

export const AdminScannerReportTemplate: React.FC<AdminScannerReportTemplateProps> = ({
  presentPlayers,
  absentPlayersByCategory,
  categoryStats,
  date,
  academySettings,
  user,
}) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;
  const totalPresent = presentPlayers.length;
  const totalAbsent = Object.values(absentPlayersByCategory).reduce((acc, list) => acc + list.length, 0);
  const totalPlayers = totalPresent + totalAbsent;
  const overallRate = totalPlayers > 0 ? Math.round((totalPresent / totalPlayers) * 100) : 0;
  const currentTime = new Date().toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      id="admin-scanner-report-content"
      className="print-container"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "12mm 15mm",
        backgroundColor: "#ffffff",
        direction: "rtl",
        fontFamily: "'Tajawal', 'Cairo', sans-serif",
        color: "#0f172a",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "3px double #0f172a",
          paddingBottom: "14px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div
            style={{
              height: "65px",
              maxWidth: "160px",
              border: "1.5px solid #e2e8f0",
              borderRadius: "10px",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fff",
            }}
          >
            {academyLogo ? (
              <img
                src={academyLogo}
                crossOrigin="anonymous"
                style={{ maxHeight: "58px", maxWidth: "150px", objectFit: "contain" }}
                alt="logo"
              />
            ) : (
              <Shield size={42} color="#2563eb" />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: 0 }}>{academyName}</h1>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0", fontWeight: "bold" }}>
              الإدارة العامة • بوابة المسح الإلكتروني الذكية
            </p>
          </div>
        </div>

        <div style={{ textAlign: "left" }}>
          <div
            style={{
              background: "#0f172a",
              color: "#fff",
              padding: "5px 16px",
              borderRadius: "6px",
              fontWeight: "900",
              fontSize: "13px",
              display: "inline-block",
            }}
          >
            تقرير الحضور والغياب الرسمي
          </div>
          <div style={{ marginTop: "6px", fontSize: "10px", color: "#475569", fontWeight: "bold" }}>
            <div>التاريخ: {date}</div>
            <div>توقيت الطباعة: {currentTime}</div>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "8px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "10px", color: "#1e40af", fontWeight: "bold" }}>إجمالي اللاعبين</div>
          <div style={{ fontSize: "18px", fontWeight: "900", color: "#1e3a8a", marginTop: "2px" }}>
            {totalPlayers}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "8px",
            padding: "8px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "10px", color: "#065f46", fontWeight: "bold" }}>الحاضرون (المسجلون)</div>
          <div style={{ fontSize: "18px", fontWeight: "900", color: "#047857", marginTop: "2px" }}>
            {totalPresent}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: "8px",
            padding: "8px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "10px", color: "#9f1239", fontWeight: "bold" }}>اللاعبون الغائبون</div>
          <div style={{ fontSize: "18px", fontWeight: "900", color: "#be123c", marginTop: "2px" }}>
            {totalAbsent}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#faf5ff",
            border: "1px solid #e9d5ff",
            borderRadius: "8px",
            padding: "8px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "10px", color: "#6b21a8", fontWeight: "bold" }}>نسبة الحضور العامة</div>
          <div style={{ fontSize: "18px", fontWeight: "900", color: "#7e22ce", marginTop: "2px" }}>
            %{overallRate}
          </div>
        </div>
      </div>

      {/* 3. Category Breakdown Table (if multiple categories) */}
      {categoryStats.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "900",
              color: "#1e293b",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "12px",
                backgroundColor: "#2563eb",
                borderRadius: "2px",
                display: "inline-block",
              }}
            />
            إحصائيات الحضور والغياب حسب الفئات
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9", color: "#0f172a" }}>
                <th style={{ padding: "6px 10px", border: "1px solid #cbd5e1", textAlign: "right" }}>الفئة</th>
                <th style={{ padding: "6px 10px", border: "1px solid #cbd5e1", textAlign: "center" }}>الحاضرون</th>
                <th style={{ padding: "6px 10px", border: "1px solid #cbd5e1", textAlign: "center" }}>الغائبون</th>
                <th style={{ padding: "6px 10px", border: "1px solid #cbd5e1", textAlign: "center" }}>الإجمالي</th>
                <th style={{ padding: "6px 10px", border: "1px solid #cbd5e1", textAlign: "center" }}>نسبة الحضور</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((cat, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td style={{ padding: "5px 10px", border: "1px solid #e2e8f0", fontWeight: "bold" }}>
                    {cat.category}
                  </td>
                  <td
                    style={{
                      padding: "5px 10px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "#059669",
                    }}
                  >
                    {cat.present}
                  </td>
                  <td
                    style={{
                      padding: "5px 10px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "#e11d48",
                    }}
                  >
                    {cat.absent}
                  </td>
                  <td
                    style={{
                      padding: "5px 10px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {cat.total}
                  </td>
                  <td
                    style={{
                      padding: "5px 10px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: cat.rate >= 75 ? "#059669" : cat.rate >= 50 ? "#d97706" : "#e11d48",
                    }}
                  >
                    %{cat.rate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Section: Present Players */}
      <div style={{ marginBottom: "18px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            color: "#047857",
            marginBottom: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ecfdf5",
            padding: "5px 10px",
            borderRadius: "6px",
            border: "1px solid #a7f3d0",
          }}
        >
          <span>✅ قائمة اللاعبين الحاضرين ({presentPlayers.length})</span>
          <span style={{ fontSize: "10px", fontWeight: "bold", color: "#065f46" }}>
            مسجلون إلكترونياً عبر الماسح/الكاميرا
          </span>
        </div>

        {presentPlayers.length === 0 ? (
          <div
            style={{
              padding: "14px",
              textAlign: "center",
              fontSize: "11px",
              color: "#64748b",
              border: "1px dashed #cbd5e1",
              borderRadius: "6px",
            }}
          >
            لا يوجد لاعبين مسجلين في هذه الجلسة حتى الآن
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#0f172a", color: "#ffffff" }}>
                <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center", width: "24px" }}>
                  #
                </th>
                <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "right" }}>اسم اللاعب</th>
                <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center" }}>تاريخ الميلاد</th>
                <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center" }}>هاتف الولي</th>
                <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center" }}>الفئة</th>
                <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center" }}>الفوج</th>
                <th style={{ padding: "6px 8px", border: "1px solid #0f172a", textAlign: "center" }}>توقيت الحضور</th>
                <th
                  style={{
                    padding: "6px 8px",
                    border: "1px solid #0f172a",
                    textAlign: "center",
                    backgroundColor: "#1e3a8a",
                  }}
                >
                  سجل الحضور والغياب السابق
                </th>
              </tr>
            </thead>
            <tbody>
              {presentPlayers.map((entry, idx) => (
                <tr key={entry.id || idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td
                    style={{
                      padding: "5px 6px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      color: "#64748b",
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0", fontWeight: "900", color: "#0f172a" }}>
                    {entry.name}
                  </td>
                  <td
                    style={{
                      padding: "5px 6px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      direction: "ltr",
                      fontFamily: "monospace",
                    }}
                  >
                    {entry.birth_date || "—"}
                  </td>
                  <td
                    style={{
                      padding: "5px 6px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      direction: "ltr",
                      fontFamily: "monospace",
                    }}
                  >
                    {entry.phone || "—"}
                  </td>
                  <td style={{ padding: "5px 6px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: "bold" }}>
                    {entry.category || "—"}
                  </td>
                  <td style={{ padding: "5px 6px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                    {entry.team_name || "—"}
                  </td>
                  <td
                    style={{
                      padding: "5px 6px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      fontWeight: "900",
                      color: "#059669",
                      direction: "ltr",
                      fontFamily: "monospace",
                    }}
                  >
                    {entry.check_in_time}
                  </td>
                  <td
                    style={{
                      padding: "5px 6px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                      fontSize: "9.5px",
                    }}
                  >
                    <span style={{ color: "#059669", fontWeight: "bold" }}>
                      حضور: {entry.stats?.present ?? 0}
                    </span>
                    <span style={{ margin: "0 4px", color: "#cbd5e1" }}>|</span>
                    <span style={{ color: "#e11d48", fontWeight: "bold" }}>
                      غياب: {entry.stats?.absent ?? 0}
                    </span>
                    {entry.stats && (
                      <span
                        style={{
                          marginRight: "6px",
                          padding: "1px 4px",
                          borderRadius: "3px",
                          fontSize: "8.5px",
                          fontWeight: "bold",
                          backgroundColor:
                            entry.stats.rate >= 75
                              ? "#ecfdf5"
                              : entry.stats.rate >= 50
                              ? "#fef3c7"
                              : "#fff1f2",
                          color:
                            entry.stats.rate >= 75
                              ? "#065f46"
                              : entry.stats.rate >= 50
                              ? "#92400e"
                              : "#9f1239",
                        }}
                      >
                        %{entry.stats.rate}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. Section: Absent Players Grouped by Category */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            color: "#be123c",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#fff1f2",
            padding: "5px 10px",
            borderRadius: "6px",
            border: "1px solid #fecdd3",
          }}
        >
          <span>❌ قائمة اللاعبين الغائبين ({totalAbsent}) — مفصلة حسب الفئات</span>
          <span style={{ fontSize: "10px", fontWeight: "bold", color: "#9f1239" }}>
            اللاعبون المسجلون الذين لم يحضروا
          </span>
        </div>

        {totalAbsent === 0 ? (
          <div
            style={{
              padding: "14px",
              textAlign: "center",
              fontSize: "11px",
              color: "#059669",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "6px",
              fontWeight: "bold",
            }}
          >
            🎉 لا يوجد غائبون! نسبة الحضور مكتملة 100%.
          </div>
        ) : (
          Object.entries(absentPlayersByCategory).map(([categoryName, playersList]) => {
            if (playersList.length === 0) return null;
            return (
              <div key={categoryName} style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRight: "4px solid #e11d48",
                    padding: "4px 8px",
                    fontWeight: "bold",
                    fontSize: "10.5px",
                    color: "#0f172a",
                    marginBottom: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>الفئة: {categoryName}</span>
                  <span style={{ color: "#e11d48", fontWeight: "900" }}>{playersList.length} لاعب غائب</span>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#334155", color: "#ffffff" }}>
                      <th style={{ padding: "5px 8px", border: "1px solid #334155", textAlign: "center", width: "24px" }}>
                        #
                      </th>
                      <th style={{ padding: "5px 8px", border: "1px solid #334155", textAlign: "right" }}>
                        اسم اللاعب
                      </th>
                      <th style={{ padding: "5px 8px", border: "1px solid #334155", textAlign: "center" }}>
                        تاريخ الميلاد
                      </th>
                      <th style={{ padding: "5px 8px", border: "1px solid #334155", textAlign: "center" }}>
                        هاتف الولي للتواصل
                      </th>
                      <th style={{ padding: "5px 8px", border: "1px solid #334155", textAlign: "center" }}>
                        الفوج
                      </th>
                      <th
                        style={{
                          padding: "5px 8px",
                          border: "1px solid #334155",
                          textAlign: "center",
                          backgroundColor: "#475569",
                        }}
                      >
                        سجل الحضور والغياب السابق
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersList.map((player, pIdx) => (
                      <tr key={player.player_id || pIdx} style={{ backgroundColor: pIdx % 2 === 0 ? "#ffffff" : "#fff1f2/20" }}>
                        <td
                          style={{
                            padding: "4px 6px",
                            border: "1px solid #e2e8f0",
                            textAlign: "center",
                            fontFamily: "monospace",
                            color: "#64748b",
                          }}
                        >
                          {pIdx + 1}
                        </td>
                        <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0", fontWeight: "bold", color: "#0f172a" }}>
                          {player.name}
                        </td>
                        <td
                          style={{
                            padding: "4px 6px",
                            border: "1px solid #e2e8f0",
                            textAlign: "center",
                            direction: "ltr",
                            fontFamily: "monospace",
                          }}
                        >
                          {player.birth_date || "—"}
                        </td>
                        <td
                          style={{
                            padding: "4px 6px",
                            border: "1px solid #e2e8f0",
                            textAlign: "center",
                            direction: "ltr",
                            fontFamily: "monospace",
                            fontWeight: "bold",
                            color: "#0f172a",
                          }}
                        >
                          {player.phone || "—"}
                        </td>
                        <td style={{ padding: "4px 6px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                          {player.team_name || "—"}
                        </td>
                        <td
                          style={{
                            padding: "4px 6px",
                            border: "1px solid #e2e8f0",
                            textAlign: "center",
                            fontSize: "9.5px",
                          }}
                        >
                          <span style={{ color: "#059669", fontWeight: "bold" }}>
                            حضور: {player.stats?.present ?? 0}
                          </span>
                          <span style={{ margin: "0 4px", color: "#cbd5e1" }}>|</span>
                          <span style={{ color: "#e11d48", fontWeight: "bold" }}>
                            غياب: {player.stats?.absent ?? 0}
                          </span>
                          {player.stats && (
                            <span
                              style={{
                                marginRight: "6px",
                                padding: "1px 4px",
                                borderRadius: "3px",
                                fontSize: "8.5px",
                                fontWeight: "bold",
                                backgroundColor:
                                  player.stats.rate >= 75
                                    ? "#ecfdf5"
                                    : player.stats.rate >= 50
                                    ? "#fef3c7"
                                    : "#fff1f2",
                                color:
                                  player.stats.rate >= 75
                                    ? "#065f46"
                                    : player.stats.rate >= 50
                                    ? "#92400e"
                                    : "#9f1239",
                              }}
                            >
                              %{player.stats.rate}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Footer Signatures & Official Stamp */}
      <div
        style={{
          marginTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderTop: "1px solid #cbd5e1",
          paddingTop: "16px",
          pageBreakInside: "avoid",
        }}
      >
        <div style={{ textAlign: "center", minWidth: "180px" }}>
          <p style={{ fontWeight: "bold", fontSize: "11px", color: "#0f172a", marginBottom: "35px" }}>
            المشرف على المسح الإلكتروني
          </p>
          <div style={{ borderBottom: "1.5px solid #0f172a", width: "140px", margin: "0 auto" }}></div>
        </div>

        <div style={{ textAlign: "center", minWidth: "200px" }}>
          <AdminSignature />
        </div>
      </div>

      {/* 7. Footer metadata */}
      <div
        style={{
          marginTop: "16px",
          borderTop: "1px solid #f1f5f9",
          paddingTop: "6px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8.5px",
          color: "#94a3b8",
        }}
      >
        <span>العنوان: {academySettings?.address || "—"}</span>
        <span>الهاتف: {academySettings?.phone || "—"}</span>
        <span>الموسم الرياضي: {academySettings?.current_season || "—"}</span>
        <span>نظام إدارة الأكاديمية الذكي • تقرير رسمي</span>
      </div>
    </div>
  );
};
