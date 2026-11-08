import React from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Users, Calendar, Phone, Shield, MapPin,
  TrendingUp, Activity, ClipboardCheck, User,
  Trophy, Star, Heart, Fingerprint, Info,
  Scale, Droplets, Ruler, Globe, Mail,
  CreditCard, CheckCircle2, FileText, IdCard, Shirt
} from "lucide-react";
import { SkillRadarChart } from "./SkillRadarChart";
import { useAuth } from "@/services/AuthContext";

interface BasePrintProps {
  academySettings?: any;
  user?: any; // To display admin/creator name and title
}

export const AdminSignature = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px', color: '#0f172a' }}>{user.title || 'ختم الإدارة والمصادقة'}</p>
        {user.full_name && <p style={{ fontWeight: 'normal', fontStyle: 'italic', fontSize: '12px', color: '#475569', marginBottom: '30px' }}>{user.full_name}</p>}
        <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>المصادقة والختم</p>
      </div>
    );
  }
  return <p style={{ fontWeight: "bold", marginBottom: "60px", color: '#0f172a' }}>ختم الإدارة والمصادقة</p>;
};

interface PlayerCardProps extends BasePrintProps {
  player: any;
  teamName: string;
  coachName?: string;
}

interface PlayerApplicationProps extends BasePrintProps {
  player: any;
  teamName: string;
}

interface SubscriptionReceiptProps extends BasePrintProps {
  sub: any;
  playerName: string;
}

interface MatchCallListProps extends BasePrintProps {
  match: any;
  players: any[];
  teamName: string;
  coachName: string;
}

interface StockReceiptProps extends BasePrintProps {
  data: any;
  type: 'entry' | 'output';
}

interface FinancialReportProps extends BasePrintProps {
  transactions: any[];
  startDate?: string;
  endDate?: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  subscriptionIncome?: number;
  otherIncome?: number;
}

const getPlayerQrValue = (player: any) => {
  // Return a public profile URL that scouts/parents can scan
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/player/${player?.player_id || 0}`;
};

export interface CategoryCardTheme {
  categoryLabel: string;
  categoryTag: string;
  primary: string;
  secondary: string;
  gradient: string;
  subGradient: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accent: string;
  cardBorder: string;
  lightBg: string;
}

export const getCategoryCardTheme = (category?: string): CategoryCardTheme => {
  const cat = (category || '').toLowerCase().trim();

  // U7 / U6 / براعم صغرى / المهد
  if (cat.includes('u7') || cat.includes('u6') || cat.includes('صغرى') || cat.includes('baby')) {
    return {
      categoryLabel: 'U07 • براعم صغرى',
      categoryTag: 'U-07',
      primary: '#0284c7',
      secondary: '#0369a1',
      gradient: 'linear-gradient(135deg, #075985 0%, #0284c7 55%, #38bdf8 100%)',
      subGradient: 'linear-gradient(90deg, #0369a1 0%, #0284c7 60%, #38bdf8 100%)',
      badgeBg: '#e0f2fe',
      badgeText: '#0369a1',
      badgeBorder: '#bae6fd',
      accent: '#38bdf8',
      cardBorder: '#0284c7',
      lightBg: '#f0f9ff',
    };
  }

  // U9 / U8 / البراعم / École
  if (cat.includes('u9') || cat.includes('u8') || cat.includes('براعم') || cat.includes('ecole') || cat.includes('école')) {
    return {
      categoryLabel: 'U09 • البراعم',
      categoryTag: 'U-09',
      primary: '#2563eb',
      secondary: '#1d4ed8',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #60a5fa 100%)',
      subGradient: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 60%, #60a5fa 100%)',
      badgeBg: '#dbeafe',
      badgeText: '#1e40af',
      badgeBorder: '#bfdbfe',
      accent: '#60a5fa',
      cardBorder: '#2563eb',
      lightBg: '#eff6ff',
    };
  }

  // U11 / U10 / المدارس / Poussins
  if (cat.includes('u11') || cat.includes('u10') || cat.includes('مدارس') || cat.includes('poussin')) {
    return {
      categoryLabel: 'U11 • المدارس',
      categoryTag: 'U-11',
      primary: '#059669',
      secondary: '#047857',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 55%, #34d399 100%)',
      subGradient: 'linear-gradient(90deg, #047857 0%, #059669 60%, #10b981 100%)',
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
      badgeBorder: '#a7f3d0',
      accent: '#34d399',
      cardBorder: '#059669',
      lightBg: '#ecfdf5',
    };
  }

  // U13 / U12 / الأصاغر / Benjamins
  if (cat.includes('u13') || cat.includes('u12') || cat.includes('أصاغر') || cat.includes('اصاغر') || cat.includes('benjamin')) {
    return {
      categoryLabel: 'U13 • الأصاغر',
      categoryTag: 'U-13',
      primary: '#d97706',
      secondary: '#b45309',
      gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 55%, #fbbf24 100%)',
      subGradient: 'linear-gradient(90deg, #b45309 0%, #d97706 60%, #f59e0b 100%)',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      badgeBorder: '#fde68a',
      accent: '#fbbf24',
      cardBorder: '#d97706',
      lightBg: '#fffbeb',
    };
  }

  // U15 / U14 / الأشبال / Minimes
  if (cat.includes('u15') || cat.includes('u14') || cat.includes('أشبال') || cat.includes('اشبال') || cat.includes('minime')) {
    return {
      categoryLabel: 'U15 • الأشبال',
      categoryTag: 'U-15',
      primary: '#7c3aed',
      secondary: '#6d28d9',
      gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)',
      subGradient: 'linear-gradient(90deg, #6d28d9 0%, #7c3aed 60%, #8b5cf6 100%)',
      badgeBg: '#ede9fe',
      badgeText: '#5b21b6',
      badgeBorder: '#ddd6fe',
      accent: '#a78bfa',
      cardBorder: '#7c3aed',
      lightBg: '#f5f3ff',
    };
  }

  // U17 / U16 / الأواسط / Cadets
  if (cat.includes('u17') || cat.includes('u16') || cat.includes('أواسط') || cat.includes('اواسط') || cat.includes('cadet')) {
    return {
      categoryLabel: 'U17 • الأواسط',
      categoryTag: 'U-17',
      primary: '#e11d48',
      secondary: '#be123c',
      gradient: 'linear-gradient(135deg, #881337 0%, #e11d48 55%, #fb7185 100%)',
      subGradient: 'linear-gradient(90deg, #be123c 0%, #e11d48 60%, #f43f5e 100%)',
      badgeBg: '#ffe4e6',
      badgeText: '#9f1239',
      badgeBorder: '#fecdd3',
      accent: '#fb7185',
      cardBorder: '#e11d48',
      lightBg: '#fff1f2',
    };
  }

  // U19 / U18 / U20 / النخبة / Juniors
  if (cat.includes('u19') || cat.includes('u18') || cat.includes('u20') || cat.includes('junior') || cat.includes('نخبة')) {
    return {
      categoryLabel: 'U19 • النخبة',
      categoryTag: 'U-19',
      primary: '#0f766e',
      secondary: '#115e59',
      gradient: 'linear-gradient(135deg, #134e4a 0%, #0f766e 55%, #2dd4bf 100%)',
      subGradient: 'linear-gradient(90deg, #115e59 0%, #0f766e 60%, #14b8a6 100%)',
      badgeBg: '#ccfbf1',
      badgeText: '#115e59',
      badgeBorder: '#99f6e4',
      accent: '#2dd4bf',
      cardBorder: '#0f766e',
      lightBg: '#f0fdfa',
    };
  }

  // U21 / الأكابر / الفريق الأول / Seniors
  if (cat.includes('u21') || cat.includes('أكابر') || cat.includes('اكابر') || cat.includes('senior') || cat.includes('كبار') || cat.includes('أول')) {
    return {
      categoryLabel: 'الأكابر • SENIORS',
      categoryTag: 'SENIOR',
      primary: '#0f172a',
      secondary: '#1e293b',
      gradient: 'linear-gradient(135deg, #020617 0%, #0f172a 55%, #334155 100%)',
      subGradient: 'linear-gradient(90deg, #0f172a 0%, #1e293b 60%, #475569 100%)',
      badgeBg: '#fef9c3',
      badgeText: '#854d0e',
      badgeBorder: '#fde047',
      accent: '#eab308',
      cardBorder: '#0f172a',
      lightBg: '#f8fafc',
    };
  }

  // Default theme (Green Academy)
  return {
    categoryLabel: category ? `فئة ${category}` : 'بطاقة اللاعب',
    categoryTag: category ? category.slice(0, 5).toUpperCase() : 'CADET',
    primary: '#059669',
    secondary: '#047857',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 55%, #10b981 100%)',
    subGradient: 'linear-gradient(90deg, #047857 0%, #059669 60%, #10b981 100%)',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
    badgeBorder: '#a7f3d0',
    accent: '#10b981',
    cardBorder: '#059669',
    lightBg: '#ecfdf5',
  };
};

const getCategoryColor = (category: string) => {
  const theme = getCategoryCardTheme(category);
  return {
    bg: theme.primary,
    gradient: theme.gradient,
    border: theme.cardBorder,
    text: theme.badgeText,
    light: theme.lightBg
  };
};

export const PlayerCardTemplate: React.FC<PlayerCardProps> = ({ player, teamName, coachName, academySettings }) => {
  const theme = getCategoryCardTheme(player?.category);
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url || "/academy-logo.png";
  const badgeLogo = academySettings?.logo_url?.includes('agoa_academy_logo')
    ? 'https://ouskqpcmsldrzgjkksju.supabase.co/storage/v1/object/public/photos/agoa_shield_badge_1791590773652.png'
    : (academySettings?.logo_url || '/academy-badge.png');
  const currentSeason = academySettings?.current_season || "2025/2026";
  const bloodType = (player?.blood_type || player?.blood_group || player?.blood || '').trim();
  const kitNumber = player?.kit_number || player?.uniform_number || player?.number || '';
  const position = player?.position || '';
  const licenseNumber = String(player?.player_id || player?.id || 1).padStart(7, '0');

  // Format birth date cleanly
  const formatBirth = (dateStr?: string) => {
    if (!dateStr) return '—';
    let clean = String(dateStr).trim();
    if (clean.includes('T')) clean = clean.split('T')[0];
    if (clean.includes(' ')) clean = clean.split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-');
      return `${d}/${m}/${y}`;
    }
    return clean;
  };

  const getAge = (birthDateStr?: string) => {
    if (!birthDateStr) return '';
    try {
      const bDate = new Date(birthDateStr);
      const diff = Date.now() - bDate.getTime();
      const ageDate = new Date(diff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return isNaN(age) ? '' : `${age} سنة`;
    } catch {
      return '';
    }
  };

  const birthFormatted = formatBirth(player?.birth_date);
  const ageStr = getAge(player?.birth_date);

  return (
    <div
      id="player-card"
      style={{
        width: "90mm",
        height: "53mm",
        maxHeight: "53mm",
        direction: "rtl",
        fontFamily: "'Tajawal', 'Cairo', 'Segoe UI', sans-serif",
        backgroundColor: '#ffffff',
        borderRadius: '5px',
        overflow: 'hidden',
        position: 'relative',
        border: `1.2px solid ${theme.primary}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        color: '#0f172a',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
      className="print-container player-card-template"
    >
      {/* 1. Header Section - Gradient with Distinct Category Theme (Height: ~9.6mm) */}
      <div style={{ 
        height: '9.6mm', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 2.5mm',
        background: theme.gradient,
        color: '#ffffff',
        boxSizing: 'border-box',
        position: 'relative',
        borderBottom: '1px solid rgba(0,0,0,0.15)'
      }}>
        {/* Right Info: Country & Academy */}
        <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '5px', fontWeight: 'bold', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.2px' }}>
            الجمهورية الجزائرية الديمقراطية الشعبية
          </p>
          <h2 style={{ margin: '0', fontSize: '8.4px', fontWeight: '900', color: '#ffffff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {academyName}
          </h2>
          <p style={{ margin: 0, fontSize: '5.2px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
            الموسم: {currentSeason} • رخصة #{licenseNumber}
          </p>
        </div>

        {/* Center / Left: Academy Logo & Category Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', marginRight: '1mm' }}>
          <span style={{
            fontSize: '6.2px',
            fontWeight: '900',
            backgroundColor: '#ffffff',
            color: theme.primary,
            padding: '1px 4px',
            borderRadius: '3px',
            border: '0.8px solid rgba(255,255,255,0.8)',
            boxShadow: '0 0.5px 2px rgba(0,0,0,0.15)',
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap'
          }}>
            {theme.categoryTag}
          </span>
          <div style={{ 
            width: '8.8mm', 
            height: '8.8mm', 
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0.5px 2px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {badgeLogo ? (
              <img src={badgeLogo} crossOrigin="anonymous" style={{ width: '96%', height: '96%', objectFit: 'contain' }} alt="logo" />
            ) : (
              <Shield size={18} color={theme.primary} />
            )}
          </div>
        </div>
      </div>

      {/* 2. Sub-Banner Title Ribbon (Height: ~3.2mm) */}
      <div style={{
        background: theme.subGradient,
        color: '#ffffff',
        padding: '0 3mm',
        height: '3.2mm',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '6px',
        fontWeight: '900',
        letterSpacing: '0.3px',
        boxSizing: 'border-box'
      }}>
        <span>بطاقة اللاعب الرسمية • LICENCE OFFICIELLE</span>
        <span style={{ opacity: 0.95 }}>{theme.categoryLabel}</span>
      </div>

      {/* 3. Main Content Section (Height: ~28.5mm) */}
      <div style={{ 
        display: 'flex', 
        height: '28.5mm',
        padding: '1.2mm 2.5mm', 
        alignItems: 'center', 
        gap: '2.5mm',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
        {/* Subtle Watermark Shield Emblem */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '26%',
          transform: 'translate(-50%, -50%)',
          width: '26mm',
          height: '26mm',
          opacity: 0.08,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          {badgeLogo && <img src={badgeLogo} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />}
        </div>
        {/* Photo Box + Kit / Position (Right Side) */}
        <div style={{ width: '18.5mm', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{
            width: '18.5mm', 
            height: '22mm',
            border: `1.2px solid ${theme.primary}`,
            borderRadius: '3px',
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            position: 'relative',
            boxShadow: '0 0.5px 2px rgba(0,0,0,0.1)'
          }}>
            {player?.photo_url ? (
              <img src={player.photo_url} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="photo" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.lightBg }}>
                <User size={22} color={theme.primary} />
              </div>
            )}
            
            {/* Kit Number Badge Overlay */}
            {kitNumber && (
              <div style={{
                position: 'absolute',
                top: '1px',
                right: '1px',
                backgroundColor: theme.primary,
                color: '#ffffff',
                fontSize: '5.8px',
                fontWeight: '900',
                padding: '0.3px 3px',
                borderRadius: '2px',
                fontFamily: 'monospace',
                lineHeight: 1
              }}>
                #{kitNumber}
              </div>
            )}
          </div>

          {/* Position Pill */}
          <div style={{
            marginTop: '1px',
            width: '100%',
            textAlign: 'center',
            fontSize: '5.8px',
            fontWeight: '800',
            color: theme.badgeText,
            backgroundColor: theme.badgeBg,
            border: `0.5px solid ${theme.badgeBorder}`,
            borderRadius: '2px',
            padding: '0.2px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {position || 'لاعب رسمي'}
          </div>
        </div>

        {/* Player Data Fields Grid (Left Side) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', minWidth: 0 }}>
          {/* Player Name */}
          <div style={{ borderBottom: `1px solid ${theme.badgeBorder}`, paddingBottom: '0.6px' }}>
            <span style={{ fontSize: '9px', fontWeight: '950', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
              {player?.name || '—'}
            </span>
          </div>

          {/* Row 1: Birth Date & Age */}
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '6.8px' }}>
            <span style={{ color: '#64748b', fontWeight: '700', minWidth: '13mm' }}>الميلاد:</span>
            <span style={{ fontWeight: '800', color: '#1e293b', fontFamily: 'monospace' }}>
              {birthFormatted} {ageStr ? <span style={{ color: '#047857', fontWeight: '900', fontFamily: "'Tajawal', sans-serif" }}>({ageStr})</span> : ''}
            </span>
          </div>

          {/* Row 2: Category & Squad */}
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '6.8px' }}>
            <span style={{ color: '#64748b', fontWeight: '700', minWidth: '13mm' }}>الفئة / الفوج:</span>
            <span style={{ fontWeight: '800', color: theme.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {player?.category || '—'} {teamName ? <span style={{ color: '#334155' }}>• {teamName}</span> : ''}
            </span>
          </div>

          {/* Row 3: BLOOD TYPE (زمرة الدم) + Guardian Phone */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2mm' }}>
            {/* Blood Type Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
              <span style={{ fontSize: '6.5px', color: '#64748b', fontWeight: '700' }}>زمرة الدم:</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                backgroundColor: bloodType ? '#fef2f2' : '#f8fafc',
                color: bloodType ? '#b91c1c' : '#64748b',
                border: `1px solid ${bloodType ? '#fca5a5' : '#cbd5e1'}`,
                borderRadius: '3px',
                padding: '0.4px 4px',
                fontSize: '7.5px',
                fontWeight: '900',
                fontFamily: 'monospace',
                lineHeight: 1
              }}>
                <Droplets size={7.5} color={bloodType ? "#dc2626" : "#94a3b8"} />
                <span>{bloodType || '—'}</span>
              </span>
            </div>

            {/* Guardian Phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1mm', fontSize: '6.8px' }}>
              <span style={{ color: '#64748b', fontWeight: '700' }}>الهاتف:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0f172a', direction: 'ltr' }}>
                {player?.phone || player?.parent_phone || '—'}
              </span>
            </div>
          </div>

          {/* Row 4: Coach */}
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '6.8px' }}>
            <span style={{ color: '#64748b', fontWeight: '700', minWidth: '13mm' }}>المدرب:</span>
            <span style={{ fontWeight: '800', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {coachName || 'ك. الطاقم الفني'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Footer Section - Security, Stamp, QR Code & Barcode (Height: ~11.5mm) */}
      <div style={{ 
        height: '11.5mm', 
        padding: '0 2.5mm', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderTop: '1px solid #e2e8f0', 
        backgroundColor: '#f8fafc',
        boxSizing: 'border-box'
      }}>
        {/* Official Administration Seal Notice */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '5.8px', fontWeight: '900', color: '#0f172a' }}>
            تأشيرة وخاتم الإدارة
          </span>
          <span style={{ fontSize: '4.8px', color: '#94a3b8', fontWeight: '700' }}>
            بطاقة معتمدة رسمياً
          </span>
        </div>

        {/* Center: Barcode & License Number */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            height: '3.2mm', 
            width: '24mm', 
            display: 'flex', 
            gap: '0.25mm',
            backgroundColor: '#ffffff', 
            padding: '0.2mm 0.5mm', 
            border: '0.5px solid #cbd5e1',
            borderRadius: '1.5px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  flex: 1, 
                  backgroundColor: '#0f172a', 
                  height: '100%', 
                  width: i % 3 === 0 ? '0.6mm' : i % 5 === 0 ? '0.4mm' : '0.2mm' 
                }} 
              />
            ))}
          </div>
          <span style={{ fontSize: '5.8px', fontWeight: '900', color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.8px', marginTop: '0.5px', lineHeight: 1 }}>
            DZ•{licenseNumber}
          </span>
        </div>

        {/* Left: Scannable QR Code */}
        <div style={{ 
          width: '8.8mm', 
          height: '8.8mm', 
          border: '0.8px solid #cbd5e1', 
          padding: '0.4mm', 
          borderRadius: '2px', 
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <QRCodeSVG value={getPlayerQrValue(player)} size={28} level="M" />
        </div>
      </div>
    </div>
  );
};

export const PlayerApplicationTemplate: React.FC<PlayerApplicationProps> = ({ player, teamName, academySettings }) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;
  const currentSeason = academySettings?.current_season || "2024 / 2025";

  return (
    <div
      id="player-application"
      className="print-container"
      style={{
        width: "210mm",
        height: "297mm",
        margin: "0 auto",
        padding: "10mm", // Reduced from 12mm
        color: "#000",
        direction: "rtl",
        fontFamily: "'Tajawal', sans-serif",
        backgroundColor: "#fff",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative"
      }}
    >
      {/* Official Frame */}
      <div style={{ position: 'absolute', top: '4mm', left: '4mm', right: '4mm', bottom: '4mm', border: '1.5px solid #000', pointerEvents: 'none' }}></div>

      {/* 1. Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
        <div style={{ textAlign: "center", minWidth: "160px" }}>
          <p style={{ margin: 0, fontSize: "10px", fontWeight: "bold" }}>الجمهورية الجزائرية الديمقراطية الشعبية</p>
          <div style={{ height: "70px", maxWidth: "160px", margin: "5px auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {academyLogo ? (
              <img src={academyLogo} crossOrigin="anonymous" style={{ maxHeight: "70px", maxWidth: "160px", objectFit: "contain" }} alt="logo" />
            ) : (
              <Shield size={55} color="#dc2626" />
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", flex: 1 }}>
          <h1 style={{ fontSize: "22px", fontWeight: "950", margin: "0 0 5px 0" }}>{academyName}</h1>
          <div style={{ border: "1.5px solid #000", padding: "5px 20px", backgroundColor: "#000", color: "#fff", display: "inline-block", fontSize: "16px", fontWeight: "900" }}>
            اسـتـمـارة طـلـب انـخـراط
          </div>
          <p style={{ marginTop: "5px", fontSize: "13px", fontWeight: "bold" }}>الموسم الدراسي: {currentSeason}</p>
        </div>

        <div style={{ width: "160px", textAlign: "left" }}>
          <div style={{ border: "1.5px solid #000", padding: "8px", borderRadius: "4px", background: "#f9f9f9", textAlign: "right" }}>
            <p style={{ margin: "0 0 2px 0", fontSize: "10px" }}>رقم الملف:</p>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "950", color: "#dc2626" }}>#{String(player.player_id || 0).padStart(5, '0')}</p>
          </div>
        </div>
      </div>

      {/* 2. Main Body Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <section>
            <h3 style={{ fontSize: "14px", fontWeight: "950", color: "#fff", backgroundColor: "#000", padding: "5px 12px", marginBottom: "10px", borderRight: "6px solid #dc2626" }}>
              1. معلومات اللاعب الشخصية
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}><b>الاسم واللقب:</b> {player.name}</div>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}><b>تاريخ الميلاد:</b> {player.birth_date}</div>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px", gridColumn: "span 2" }}><b>مكان الميلاد:</b> {player.birth_city} - {player.birth_state}</div>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}><b>الفئة / الفريق:</b> {player.category} - {teamName}</div>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}><b>زمرة الدم:</b> {player.blood_type || "---"}</div>
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: "14px", fontWeight: "950", color: "#fff", backgroundColor: "#000", padding: "5px 12px", marginBottom: "10px", borderRight: "6px solid #dc2626" }}>
              2. معلومات الولي والتواصل
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px", gridColumn: "span 2" }}><b>اسم الولي:</b> {player.father_name}</div>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}><b>رقم الهاتف:</b> {player.phone}</div>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}><b>رقم البطاقة:</b> {player.id_card_number || "---"}</div>
              <div style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px", gridColumn: "span 2" }}><b>العنوان السكني:</b> {player.address || "---"}</div>
            </div>
          </section>
        </div>

        {/* Photo and QR */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center" }}>
          <div style={{ width: "130px", height: "160px", border: "2px solid #000", borderRadius: "4px", overflow: "hidden" }}>
            {player.photo_url ? (
              <img src={player.photo_url} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="p" />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={60} color="#ccc" /></div>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "10px", border: "1px solid #ddd" }}>
            <QRCodeSVG value={getPlayerQrValue(player)} size={90} level="M" />
            <p style={{ fontSize: "9px", marginTop: "5px", fontWeight: "bold" }}>المعرف الرقمي</p>
          </div>
        </div>
      </div>

      {/* 3. Official Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ border: "1.5px solid #000", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ backgroundColor: "#000", color: "#fff", padding: "6px", fontWeight: "bold", textAlign: "center", fontSize: "12px" }}>تعهد ولي الأمر</div>
          <div style={{ padding: "12px", fontSize: "11px", lineHeight: "1.6" }}>
            <p style={{ margin: 0 }}>أوافق على انخراط ابني في {academyName} وألتزم بكافة القوانين والتعليمات.</p>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "9px", color: "#999" }}>البصمة</span>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "10px", fontWeight: "bold" }}>توقيع الولي</p>
                <div style={{ width: "100px", height: "30px", borderBottom: "1.5px solid #000" }}></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ border: "1.5px solid #dc2626", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ backgroundColor: "#dc2626", color: "#fff", padding: "6px", fontWeight: "bold", textAlign: "center", fontSize: "12px" }}>الشهادة الطبية</div>
          <div style={{ padding: "12px", fontSize: "11px", lineHeight: "1.6" }}>
            <p style={{ margin: 0 }}>أشهد أن اللاعب لائق بدنياً وصحياً لممارسة كرة القدم ولا يوجد أي مانع طبي.</p>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "9px" }}>بتاريخ: .../.../202...</span>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "10px", fontWeight: "bold" }}>ختم الطبيب</p>
                <div style={{ width: "100px", height: "30px", borderBottom: "1.5px solid #dc2626" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Approval */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "15px", fontWeight: "950", marginBottom: "40px" }}>مصادقة وموافقة رئيس الأكاديمية</p>
        <div style={{ width: "200px", borderTop: "2px solid #000", margin: "0 auto" }}></div>
      </div>

      {/* 5. Footer Details */}
      <footer style={{ 
        paddingTop: "5px", 
        borderTop: "1px solid #eee", 
        display: "flex", 
        justifyContent: "space-between", 
        fontSize: "8px", 
        color: "#94a3b8"
      }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <span><b>العنوان:</b> {academySettings?.address || "---"}</span>
          <span><b>الهاتف:</b> {academySettings?.phone || "---"}</span>
        </div>
        <span>نظام ULTRA 2026 - {academyName}</span>
      </footer>
    </div>
  );
};

export const SubscriptionReceiptTemplate: React.FC<SubscriptionReceiptProps & { receiptNumber?: number | string }> = ({ sub, playerName, academySettings, receiptNumber }) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;
  const isExempt = Number(sub.amount) === 0 || 
    (sub.plan_name && (sub.plan_name.includes('معفى') || sub.plan_name.includes('خاصة') || sub.plan_name.includes('إعفاء')));

  const ReceiptCopy = ({ title }: { title: string }) => (
    <div style={{
      border: '2px solid #0f172a',
      borderRadius: '16px',
      padding: '30px',
      backgroundColor: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    }}>
      {/* Aesthetic Accents */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: isExempt ? 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)' : 'linear-gradient(90deg, #059669 0%, #10b981 100%)' }}></div>
      <div style={{ position: 'absolute', top: '50%', right: '-50px', width: '200px', height: '200px', background: isExempt ? '#7c3aed' : '#059669', opacity: 0.03, borderRadius: '50%', transform: 'translateY(-50%)' }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{
            height: '70px',
            maxWidth: '170px',
            padding: '4px 8px',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {academyLogo ? (
              <img src={academyLogo} crossOrigin="anonymous" style={{ maxHeight: '64px', maxWidth: '160px', objectFit: 'contain' }} alt="logo" />
            ) : (
              <Shield size={46} color={isExempt ? "#7c3aed" : "#059669"} />
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{academyName}</h2>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>
              {isExempt ? 'إثبات حالة خاصة (إعفاء معتمد كامل الصلاحيات)' : 'إيصال استلام مالي رسمي للدفع'}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ 
            background: isExempt ? '#6b21a8' : '#0f172a', 
            color: '#fff', 
            padding: '4px 15px', 
            borderRadius: '4px', 
            fontSize: '14px', 
            fontWeight: '900', 
            marginBottom: '5px' 
          }}>
            {isExempt 
              ? 'حالة خاصة (معفى)' 
              : `وصل رقم: ${String(receiptNumber ?? sub.subscription_id ?? 1).padStart(6, '0')}`}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>تاريخ الإصدار: {new Date().toLocaleDateString('ar-DZ')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>الاسم الكامل للمستفيد</span>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>{playerName}</span>
        </div>
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>نوع وطبيعة الاشتراك</span>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>{sub.plan_name}</span>
        </div>
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>فترة صلاحية الاشتراك</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>من: {sub.start_date} إلى: {sub.end_date}</span>
        </div>
        <div style={{
          background: isExempt ? 'linear-gradient(135deg, #4c1d95 0%, #581c87 100%)' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          padding: '15px',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>المبلغ الصافي:</span>
          <span style={{ fontSize: '20px', fontWeight: '900' }}>
            {Number(sub.amount) === 0 || (sub.plan_name && (sub.plan_name.includes('معفى') || sub.plan_name.includes('خاصة'))) 
              ? '0 دج (إعفاء معتمد)' 
              : `${sub.amount} دج`}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '5px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <QRCodeSVG value={`SUB_RECEIPT:${sub.subscription_id}`} size={60} level="M" />
          </div>
          <div style={{ maxWidth: '180px' }}>
            <p style={{ fontSize: '10px', color: '#0f172a', fontWeight: 'bold', margin: '0 0 5px 0' }}>
              {isExempt ? 'تحقق رقمي من الإعفاء' : 'تحقق رقمي من الدفع'}
            </p>
            <p style={{ fontSize: '9px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              {isExempt 
                ? 'هذه الوثيقة تمثل إثباتاً رسمياً لاعتماد إعفاء اللاعب مع منحه كامل الحقوق والصلاحيات.' 
                : 'هذا الوصل يمثل إثباتاً رسمياً لعملية الدفع وصالح للاستعمال لدى إدارة الأكاديمية.'}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', margin: '0 0 50px 0' }}>ختم وتوقيع المحاسب</p>
          <div style={{ borderTop: '2px solid #0f172a', width: '150px' }}></div>
        </div>
      </div>

      {/* Official Stamp Watermark */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '200px',
        opacity: 0.05,
        transform: 'rotate(-25deg)',
        pointerEvents: 'none'
      }}>
        {academyLogo ? (
          <img src={academyLogo} crossOrigin="anonymous" style={{ width: '150px', height: '150px', objectFit: 'contain' }} alt="stamp" />
        ) : (
          <Shield size={150} />
        )}
      </div>
    </div>
  );

  return (
    <div
      id="subscription-receipt"
      style={{
        width: '210mm',
        height: '297mm',
        margin: 'auto',
        backgroundColor: '#ffffff',
        padding: '15mm',
        display: 'flex',
        flexDirection: 'column',
        gap: '15mm',
        direction: "rtl",
        fontFamily: "'Tajawal', sans-serif",
      }}
      className="print-container"
    >
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute',
          top: '-20px',
          left: '0',
          fontSize: '11px',
          fontWeight: 'black',
          color: '#059669',
          letterSpacing: '2px'
        }}>نسخة الإدارة (ADMIN)</span>
        <ReceiptCopy title="ADMIN" />
      </div>

      <div style={{
        borderTop: '2px dashed #94a3b8',
        position: 'relative',
        margin: '10px 0'
      }}>
        <div style={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff',
          padding: '0 15px',
          color: '#64748b',
          fontSize: '11px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          قص هنا (Cut Here)
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute',
          top: '-20px',
          left: '0',
          fontSize: '11px',
          fontWeight: 'black',
          color: '#0f172a',
          letterSpacing: '2px'
        }}>نسخة اللاعب / الولي (PARENT)</span>
        <ReceiptCopy title="PARENT" />
      </div>
    </div>
  );
};

export const MatchCallListTemplate: React.FC<MatchCallListProps> = ({ match, players, teamName, coachName, academySettings }) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;

  return (
    <div
      id="match-call-list"
      className="print-container"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "auto",
        padding: "15mm",
        backgroundColor: "#ffffff",
        direction: "rtl",
        fontFamily: "'Tajawal', sans-serif",
        color: "#1e293b",
        position: 'relative'
      }}
    >
      {/* Institutional Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        borderBottom: '4px double #0f172a',
        paddingBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', minWidth: '160px' }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '10px' }}>الجمهورية الجزائرية الديمقراطية الشعبية</p>
          <div style={{ height: '70px', maxWidth: '160px', margin: '8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {academyLogo ? (
              <img src={academyLogo} crossOrigin="anonymous" style={{ maxHeight: '68px', maxWidth: '160px', objectFit: 'contain' }} alt="logo" />
            ) : (
              <Shield size={50} color="#059669" />
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 5px 0' }}>{academyName}</h1>
          <div style={{ background: '#0f172a', color: '#fff', padding: '5px 25px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold' }}>
            قائمة اللاعبين المستدعين للمنافسة
          </div>
        </div>

        <div style={{ minWidth: '150px', textAlign: 'left' }}>
          <p style={{ fontSize: "14px", fontWeight: "bold" }}>التاريخ: {new Date().toLocaleDateString('ar-DZ')}</p>
        </div>
      </div>

      {/* Match Details Card */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "15px",
        marginBottom: "30px",
        backgroundColor: "#f8fafc",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        fontSize: '14px'
      }}>
        <div><b>المنافس:</b> {match.opponent}</div>
        <div><b>التوقيت:</b> {match.time}</div>
        <div><b>الملعب:</b> {match.location}</div>
        <div><b>الفئة:</b> <span style={{ color: '#059669', fontWeight: 'bold' }}>{teamName}</span></div>
        <div><b>المدرب:</b> {coachName}</div>
        <div><b>تاريخ اللقاء:</b> {match.match_date}</div>
      </div>

      {/* Players Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: "#0f172a", color: "#ffffff" }}>
            <th style={{ padding: "12px", border: "1px solid #0f172a", textAlign: "right", width: "50px" }}>#</th>
            <th style={{ padding: "12px", border: "1px solid #0f172a", textAlign: "right" }}>الاسم الكامل للاعب</th>
            <th style={{ padding: "12px", border: "1px solid #0f172a", textAlign: "center" }}>رقم القميص</th>
            <th style={{ padding: "12px", border: "1px solid #0f172a", textAlign: "right" }}>ملاحظات طبية / فنية</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player.player_id} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
              <td style={{ padding: "12px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
              <td style={{ padding: "12px", border: "1px solid #e2e8f0", fontWeight: "900" }}>{player.name}</td>
              <td style={{ padding: "12px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: 'bold' }}>{player.jersey_number || "---"}</td>
              <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}></td>
            </tr>
          ))}
          {/* Fill empty rows to make it look full (up to 18 players) */}
          {Array.from({ length: Math.max(0, 18 - players.length) }).map((_, i) => (
            <tr key={`empty-${i}`} style={{ height: '40px' }}>
              <td style={{ border: "1px solid #e2e8f0" }}></td>
              <td style={{ border: "1px solid #e2e8f0" }}></td>
              <td style={{ border: "1px solid #e2e8f0" }}></td>
              <td style={{ border: "1px solid #e2e8f0" }}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Signatures */}
      <div style={{ marginTop: "50px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center", minWidth: '200px' }}>
          <p style={{ fontWeight: "bold", marginBottom: "60px", color: '#0f172a' }}>إمضاء المدرب</p>
          <div style={{ borderBottom: "2px solid #0f172a", width: "100%" }}></div>
        </div>

        <div style={{ textAlign: "center", minWidth: '200px' }}>
          <AdminSignature />
          <div style={{ borderBottom: "2px solid #0f172a", width: "100%" }}></div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
        <span>العنوان: {academySettings?.address || "---"}</span>
        <span>الهاتف: {academySettings?.phone || "---"}</span>
        <span>الموسم: {academySettings?.current_season || "---"}</span>
      </div>
    </div>
  );
};

export const PlayerCardsBatchTemplate: React.FC<{ players: any[]; teams?: any[]; coaches?: any[]; academySettings?: any }> = ({ players, teams = [], coaches = [], academySettings }) => {
  return (
    <div
      className="print-container a4-cards-sheet"
      style={{
        width: "210mm",
        height: "297mm",
        maxHeight: "297mm",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        direction: "rtl",
        padding: "8mm 12mm",
        boxSizing: "border-box",
        pageBreakAfter: "always",
        breakAfter: "page",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative"
      }}
    >
      {/* Inline Print Optimization */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .a4-cards-sheet {
            page-break-after: always !important;
            break-after: page !important;
          }
          .a4-cards-sheet:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}} />

      {/* Grid: 2 Columns x 5 Rows = 10 Cards Per A4 Sheet (90mm x 53mm per card) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 90mm)",
        gridTemplateRows: "repeat(5, 53mm)",
        gap: "4mm 6mm",
        justifyContent: "center",
        alignContent: "center",
        width: "186mm",
        height: "281mm",
        boxSizing: "border-box"
      }}>
        {players.slice(0, 10).map((player) => {
          const team = teams.find(t => 
            (t.team_id != null && player.team_id != null && String(t.team_id) === String(player.team_id)) ||
            (t.id != null && player.team_id != null && String(t.id) === String(player.team_id)) ||
            (player.category && t.category === player.category)
          );
          const coach = team?.coach_id 
            ? coaches.find(c => String(c.coach_id) === String(team.coach_id) || String(c.id) === String(team.coach_id))
            : coaches.find(c => (player.category && c.category === player.category) || (player.team_id && String(c.team_id) === String(player.team_id)));

          let resolvedTeamName = "";
          if (team?.team_name) {
            resolvedTeamName = team.team_name.startsWith('فوج') ? team.team_name : `فوج ${team.team_name}`;
          } else if (team?.name) {
            resolvedTeamName = team.name;
          } else if (player.group || player.group_name) {
            const g = player.group || player.group_name;
            resolvedTeamName = g.startsWith('فوج') ? g : `فوج ${g}`;
          }

          return (
            <PlayerCardTemplate
              key={player.player_id || player.id}
              player={player}
              teamName={resolvedTeamName}
              coachName={coach?.name}
              academySettings={academySettings}
            />
          );
        })}
      </div>
    </div>
  );
};

export const StockReceiptTemplate: React.FC<StockReceiptProps> = ({ data, type, academySettings }) => {
  const title = type === 'entry' ? 'وصل استلام مخزني (Bon d\'entrée)' : 'وصل إخراج مخزني (Bon de sortie)';
  const partyLabel = type === 'entry' ? 'المورد / المصدر:' : 'الجهة المستفيدة:';
  const partyValue = type === 'entry' ? data.source : data.beneficiary;
  const dateLabel = type === 'entry' ? 'تاريخ التوريد:' : 'تاريخ الإخراج:';
  const dateValue = type === 'entry' ? (data.purchase_date || data.entry_date) : data.output_date;
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;

  return (
    <div
      id="stock-receipt"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "auto",
        direction: "rtl",
        fontFamily: "'Tajawal', sans-serif",
        backgroundColor: '#ffffff',
        padding: '15mm',
        color: '#1e293b',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        borderBottom: '4px double #0f172a',
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ height: '70px', maxWidth: '170px', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {academyLogo ? (
              <img src={academyLogo} crossOrigin="anonymous" style={{ maxHeight: '64px', maxWidth: '160px', objectFit: 'contain' }} alt="logo" />
            ) : (
              <Shield size={46} color="#059669" />
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{academyName}</h2>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>مصلحة التموين والمخازن</p>
          </div>
        </div>

        <div style={{ textAlign: 'left' }}>
          <div style={{ background: '#0f172a', color: '#fff', padding: '5px 20px', borderRadius: '6px', fontWeight: 'bold' }}>
            {title}
          </div>
          <p style={{ fontSize: '12px', marginTop: '10px', fontWeight: 'bold' }}>رقم المرجع: {String(data.entry_id || data.output_id || data.receipt_number).padStart(5, '0')}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px' }}>{partyLabel}</span>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{partyValue}</span>
        </div>
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px' }}>{dateLabel}</span>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{dateValue}</span>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ backgroundColor: '#0f172a', color: '#fff' }}>
            <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'right' }}>الصنف (Article)</th>
            <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'center', width: '100px' }}>الكمية</th>
            <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'right' }}>الثمن الوحدوي</th>
            <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'right' }}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {data.items && Array.isArray(data.items) ? (
            data.items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td style={{ padding: '15px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{item.product_name}</td>
                <td style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900' }}>{item.quantity}</td>
                <td style={{ padding: '15px', border: '1px solid #e2e8f0' }}>{Number(item.unit_price || 0).toFixed(2).replace('.', ',')} دج</td>
                <td style={{ padding: '15px', border: '1px solid #e2e8f0', fontWeight: '900' }}>{Number(item.total_price || (item.quantity * (item.unit_price || 0))).toFixed(2).replace('.', ',')} دج</td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={{ padding: '15px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{data.product_name || data.item_name}</td>
              <td style={{ padding: '15px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900' }}>{data.quantity}</td>
              <td style={{ padding: '15px', border: '1px solid #e2e8f0' }}>{Number(data.unit_price || 0).toFixed(2).replace('.', ',')} دج</td>
              <td style={{ padding: '15px', border: '1px solid #e2e8f0', fontWeight: '900' }}>{(data.quantity * (data.unit_price || 0)).toFixed(2).replace('.', ',')} دج</td>
            </tr>
          )}
          {/* Total Summary Row */}
          <tr>
            <td colSpan={3} style={{ padding: '12px 15px', border: '1px solid #e2e8f0', textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              المجموع الإجمالي (Total Général):
            </td>
            <td style={{ padding: '12px 15px', border: '2px solid #0f172a', fontWeight: '900', fontSize: '16px', backgroundColor: '#f8fafc', color: '#0f172a' }}>
              {(data.items && Array.isArray(data.items)
                ? data.items.reduce((sum: number, it: any) => sum + (it.total_price || (it.quantity * it.unit_price)), 0)
                : (data.quantity * (data.unit_price || 0))
              ).toFixed(2).replace('.', ',')} دج
            </td>
          </tr>
          {/* Notes row if any */}
          {data.notes && (
            <tr>
              <td colSpan={4} style={{ padding: '15px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                ملاحظات: {data.notes}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '60px' }}>أمين المخزن</p>
          <div style={{ borderBottom: '1px solid #0f172a' }}></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '60px' }}>المستلم (أو المورد)</p>
          <div style={{ borderBottom: '1px solid #0f172a' }}></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '60px' }}>مصادقة الإدارة</p>
          <div style={{ borderBottom: '1px solid #0f172a' }}></div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
        <span>العنوان: {academySettings?.address || "---"}</span>
        <span>الهاتف: {academySettings?.phone || "---"}</span>
        <span>الموسم: {academySettings?.current_season || "---"}</span>
      </div>
    </div>
  );
};

export const FinancialReportTemplate: React.FC<FinancialReportProps> = ({
  transactions,
  startDate,
  endDate,
  totalIncome,
  totalExpense,
  balance,
  subscriptionIncome,
  otherIncome,
  academySettings
}) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;

  const subIncome = subscriptionIncome !== undefined
    ? subscriptionIncome
    : transactions.filter(t => t.type === 'income' && (t.is_subscription || t.category?.includes('اشتراك'))).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const othIncome = otherIncome !== undefined
    ? otherIncome
    : transactions.filter(t => t.type === 'income' && !t.is_subscription && !t.category?.includes('اشتراك')).reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const fmt = (n: number) => (Number(n) || 0).toLocaleString('fr-FR');

  return (
    <div
      id="finance-report"
      className="print-container"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "auto",
        padding: "10mm",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        direction: "rtl",
        fontFamily: "'Tajawal', sans-serif",
        color: "#1e293b",
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '3px double #0f172a',
        paddingBottom: '15px'
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ height: '70px', maxWidth: '170px', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {academyLogo ? (
              <img src={academyLogo} crossOrigin="anonymous" style={{ maxWidth: '160px', maxHeight: '64px', objectFit: 'contain' }} alt="logo" />
            ) : (
              <Shield size={46} color="#059669" />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{academyName}</h1>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', fontWeight: 'bold' }}>تقرير الكشف المالي والمحاسباتي</p>
          </div>
        </div>

        <div style={{ textAlign: 'left' }}>
          <div style={{ background: '#0f172a', color: '#fff', padding: '5px 16px', borderRadius: '6px', fontWeight: '900', fontSize: '13px' }}>
            كشف الحسابات المالية
          </div>
          <p style={{ fontSize: '10px', marginTop: '6px', color: '#64748b', fontFamily: 'monospace' }}>تاريخ التقرير: {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* Period & Summary Boxes */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
            الفترة المالية: <span style={{ fontFamily: 'monospace' }}>{startDate || "البداية"}</span> إلى <span style={{ fontFamily: 'monospace' }}>{endDate || "اليوم"}</span>
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>إجمالي العمليات: <strong style={{ fontFamily: 'monospace' }}>{transactions.length}</strong></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#166534', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>مداخيل الاشتراكات</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#166534', fontFamily: 'monospace' }}>{fmt(subIncome)} دج</span>
          </div>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#0369a1', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>مداخيل أخرى</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#0369a1', fontFamily: 'monospace' }}>{fmt(othIncome)} دج</span>
          </div>
          <div style={{ background: '#ecfdf5', border: '1.5px solid #059669', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#047857', fontWeight: '900', display: 'block', marginBottom: '3px' }}>المجموع الكلي للمداخيل</span>
            <span style={{ fontSize: '15px', fontWeight: '900', color: '#047857', fontFamily: 'monospace' }}>{fmt(totalIncome)} دج</span>
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#991b1b', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>إجمالي المصاريف (-)</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#991b1b', fontFamily: 'monospace' }}>{fmt(totalExpense)} دج</span>
          </div>
          <div style={{ background: balance >= 0 ? '#eff6ff' : '#fff1f2', border: `1.5px solid ${balance >= 0 ? '#3b82f6' : '#f43f5e'}`, padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: balance >= 0 ? '#1e40af' : '#9f1239', fontWeight: '900', display: 'block', marginBottom: '3px' }}>الرصيد الصافي</span>
            <span style={{ fontSize: '15px', fontWeight: '900', color: balance >= 0 ? '#1e40af' : '#be123c', fontFamily: 'monospace' }}>{fmt(balance)} دج</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '25px' }}>
        <thead>
          <tr style={{ backgroundColor: '#0f172a', color: '#fff' }}>
            <th style={{ padding: '8px 10px', border: '1px solid #0f172a', textAlign: 'right', width: '90px' }}>التاريخ</th>
            <th style={{ padding: '8px 10px', border: '1px solid #0f172a', textAlign: 'center', width: '100px' }}>نوع العملية</th>
            <th style={{ padding: '8px 10px', border: '1px solid #0f172a', textAlign: 'right', width: '140px' }}>الفئة / المصدر</th>
            <th style={{ padding: '8px 10px', border: '1px solid #0f172a', textAlign: 'right' }}>التفاصيل / ملاحظات</th>
            <th style={{ padding: '8px 10px', border: '1px solid #0f172a', textAlign: 'left', width: '110px' }}>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, idx) => {
            const isSub = t.is_subscription || t.category === 'اشتراكات اللاعبين' || t.module === 'subscription';
            return (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '10.5px' }}>{t.date}</td>
                <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  {t.type === 'income' ? (
                    isSub ? (
                      <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                        اشتراك لاعب
                      </span>
                    ) : (
                      <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                        مدخول آخر
                      </span>
                    )
                  ) : (
                    <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                      مصاريف
                    </span>
                  )}
                </td>
                <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{t.category}</td>
                <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', color: '#475569' }}>{t.notes || "---"}</td>
                <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', fontWeight: 'bold', textAlign: 'left', fontFamily: 'monospace', color: t.type === 'income' ? '#059669' : '#e11d48' }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)} دج
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '60px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '60px', fontSize: '14px' }}>توقيع المحاسب / المصلحة المالية</p>
          <div style={{ borderBottom: '1.5px solid #0f172a', width: '200px', margin: '0 auto' }}></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '60px', fontSize: '14px' }}>مصادقة المدير العام للأكاديمية</p>
          <div style={{ borderBottom: '1.5px solid #0f172a', width: '200px', margin: '0 auto' }}></div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
        <span>العنوان: {academySettings?.address || "---"}</span>
        <span>الهاتف: {academySettings?.phone || "---"}</span>
        <span>الموسم: {academySettings?.current_season || "---"}</span>
      </div>
    </div>
  );
};
export const AttendanceReportTemplate: React.FC<{ training: any; players: any[]; attendance: any[]; academySettings?: any }> = ({ training, players, attendance, academySettings }) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;

  // Process data: for this training session, get all players in the team
  // and their attendance status
  const reportData = players.map(player => {
    const record = attendance.find(a => a.player_id === player.player_id && a.training_id === training.training_id);
    return {
      ...player,
      attendanceStatus: record ? record.status : "غائب",
      checkInTime: record ? record.check_in_time : "---",
      notes: record ? record.notes : ""
    };
  });

  const presentCount = reportData.filter(d => d.attendanceStatus === "حاضر").length;
  const absentCount = reportData.length - presentCount;

  return (
    <div
      id="attendance-report"
      className="print-container"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "auto",
        padding: "15mm",
        backgroundColor: "#ffffff",
        direction: "rtl",
        fontFamily: "'Tajawal', sans-serif",
        color: "#1e293b",
        position: 'relative'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '4px double #0f172a',
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ height: '70px', maxWidth: '170px', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {academyLogo ? (
              <img src={academyLogo} crossOrigin="anonymous" style={{ maxHeight: '64px', maxWidth: '160px', objectFit: 'contain' }} alt="logo" />
            ) : (
              <Shield size={46} color="#059669" />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{academyName}</h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>التقرير الإداري الفني لحصص التدريب</p>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ background: '#0f172a', color: '#fff', padding: '6px 20px', borderRadius: '6px', fontWeight: '900', fontSize: '14px' }}>
            كشف الحضور والغياب
          </div>
          <p style={{ fontSize: '11px', marginTop: '10px', color: '#64748b', fontWeight: 'bold' }}>التاريخ: {training.date}</p>
        </div>
      </div>

      {/* Session Details Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "15px",
        marginBottom: "25px",
        backgroundColor: "#f8fafc",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: 'flex', gap: '5px', fontSize: '14px' }}>
            <span style={{ color: '#64748b', fontWeight: 'bold', minWidth: '25mm' }}>الفئة العمرية:</span>
            <span style={{ fontWeight: '950', color: '#0f172a' }}>{training.category || training.team_name || "---"}</span>
          </div>
          <div style={{ display: 'flex', gap: '5px', fontSize: '14px' }}>
            <span style={{ color: '#64748b', fontWeight: 'bold', minWidth: '25mm' }}>اسم الفوج:</span>
            <span style={{ fontWeight: '950', color: '#0f172a' }}>{training.team_name || "---"}</span>
          </div>
          <div style={{ display: 'flex', gap: '5px', fontSize: '14px' }}>
            <span style={{ color: '#64748b', fontWeight: 'bold', minWidth: '25mm' }}>المدرب المسؤول:</span>
            <span style={{ fontWeight: '950', color: '#059669' }}>{training.coach_name || "---"}</span>
          </div>
          <div style={{ display: 'flex', gap: '5px', fontSize: '14px' }}>
            <span style={{ color: '#64748b', fontWeight: 'bold', minWidth: '25mm' }}>مكان التدريب:</span>
            <span style={{ fontWeight: 'bold' }}>{training.location || "---"}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", paddingRight: '20px', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>إجمالي اللاعبين</p>
            <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '950', color: '#0f172a' }}>{reportData.length}</p>
          </div>
          <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '8px', border: '1px solid #d1fae5', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#059669', fontWeight: 'bold' }}>عدد الحاضرين</p>
            <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '950', color: '#059669' }}>{presentCount}</p>
          </div>
          <div style={{ background: '#fff1f2', padding: '10px', borderRadius: '8px', border: '1px solid #ffe4e6', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#e11d48', fontWeight: 'bold' }}>عدد الغائبين</p>
            <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '950', color: '#e11d48' }}>{absentCount}</p>
          </div>
          <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>توقيت الحصة</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>{training.start_time} - {training.end_time}</p>
          </div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr style={{ backgroundColor: "#0f172a", color: "#ffffff" }}>
            <th style={{ padding: "10px", border: "1px solid #0f172a", textAlign: "right", width: "40px" }}>#</th>
            <th style={{ padding: "10px", border: "1px solid #0f172a", textAlign: "right" }}>اسم اللاعب</th>
            <th style={{ padding: "10px", border: "1px solid #0f172a", textAlign: "center", width: "100px" }}>الحالة</th>
            <th style={{ padding: "10px", border: "1px solid #0f172a", textAlign: "center", width: "80px" }}>التوقيت</th>
            <th style={{ padding: "10px", border: "1px solid #0f172a", textAlign: "right" }}>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {reportData.map((player, idx) => (
            <tr key={player.player_id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
              <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>{idx + 1}</td>
              <td style={{ padding: "8px", border: "1px solid #e2e8f0", fontWeight: "900" }}>{player.name}</td>
              <td style={{
                padding: "8px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
                fontWeight: "bold",
                color: player.attendanceStatus === "حاضر" ? "#059669" : "#ef4444"
              }}>
                {player.attendanceStatus}
              </td>
              <td style={{ padding: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>{player.checkInTime}</td>
              <td style={{ padding: "8px", border: "1px solid #e2e8f0", color: "#64748b" }}>{player.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>توقيع المدرب المسؤول</p>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '40px' }}>{training.coach_name || "---"}</p>
          <div style={{ borderBottom: '1.5px solid #0f172a', width: '200px', margin: '0 auto' }}></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <AdminSignature />
          <div style={{ borderBottom: '1.5px solid #0f172a', width: '200px', margin: '0 auto' }}></div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
        <span>العنوان: {academySettings?.address || "---"}</span>
        <span>الهاتف: {academySettings?.phone || "---"}</span>
        <span>الموسم: {academySettings?.current_season || "---"}</span>
      </div>
    </div>
  );
};

export const ScoutReportTemplate: React.FC<{ player: any; evaluation?: any; academySettings?: any }> = ({ player, evaluation, academySettings }) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;
  
  const normalize = (v: any) => {
    const n = Number(v) || 0;
    return n > 10 ? n : n * 10;
  };

  const overall = Math.round(
    (normalize(evaluation?.technical) + normalize(evaluation?.tactical) + normalize(evaluation?.physical) + 
     normalize(evaluation?.mental) + normalize(evaluation?.shooting) + normalize(evaluation?.passing) + 
     normalize(evaluation?.dribbling) + normalize(evaluation?.defending)) / 8
  ) || 0;

  const skills = [
    { label: "تقني (TEC)", value: normalize(evaluation?.technical), color: "#10b981" },
    { label: "تكتيكي (TAC)", value: normalize(evaluation?.tactical), color: "#3b82f6" },
    { label: "بدني (PHY)", value: normalize(evaluation?.physical || evaluation?.physical_status), color: "#f59e0b" },
    { label: "ذهني (MEN)", value: normalize(evaluation?.mental), color: "#ef4444" },
    { label: "تسديد (SHO)", value: normalize(evaluation?.shooting), color: "#ec4899" },
    { label: "تمرير (PAS)", value: normalize(evaluation?.passing), color: "#8b5cf6" },
  ];

  return (
    <div
      id="scout-report"
      className="print-container"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "auto",
        padding: "15mm",
        backgroundColor: "#ffffff",
        direction: "rtl",
        fontFamily: "'Tajawal', sans-serif",
        color: "#1e293b",
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Decorative Border */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '10mm', background: '#0f172a' }}></div>
      <div style={{ position: 'absolute', top: '10mm', right: 0, width: '100%', height: '2mm', background: '#10b981' }}></div>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15mm', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', padding: '5px', border: '2px solid #0f172a', borderRadius: '15px' }}>
             {academyLogo ? (
               <img src={academyLogo} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="logo" />
             ) : (
               <Shield size={60} color="#0f172a" />
             )}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{academyName}</h1>
            <p style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold', margin: 0 }}>قسم اكتشاف المواهب والتحليل الفني</p>
            <p style={{ fontSize: '11px', color: '#64748b' }}>تقرير الكشاف الرسمي (Official Scout Report)</p>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
           <div style={{ border: '2px solid #0f172a', padding: '10px 20px', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>المستوى الإجمالي</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '950', color: '#0f172a' }}>{overall}<span style={{ fontSize: '16px' }}>%</span></p>
           </div>
        </div>
      </div>

      {/* Player Profile Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '30px', marginBottom: '40px' }}>
        {/* Photo Card */}
        <div style={{ position: 'relative' }}>
          <div style={{ 
            width: '180px', 
            height: '230px', 
            borderRadius: '15px', 
            overflow: 'hidden', 
            border: '4px solid #0f172a',
            backgroundColor: '#f8fafc',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
          }}>
            {player.photo_url ? (
              <img src={player.photo_url} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={player.name} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={80} color="#cbd5e1" />
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '40px', backgroundColor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
               #{String(player.player_id).padStart(4, '0')}
            </div>
          </div>
        </div>

        {/* Vital Stats */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '950', color: '#0f172a', marginBottom: '15px', borderBottom: '4px solid #10b981', display: 'inline-block', paddingBottom: '5px' }}>
            {player.name}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
               <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>الفئة العمرية</span>
               <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{player.category}</span>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
               <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>تاريخ الميلاد</span>
               <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{player.birth_date}</span>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
               <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>القدم المفضلة</span>
               <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{player.preferred_foot || "غير محدد"}</span>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
               <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>المركز</span>
               <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{player.position || "غير محدد"}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff' }}>
             <p style={{ margin: 0, fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>ملاحظة الكشاف التحليلية:</p>
             <p style={{ margin: '8px 0 0 0', fontSize: '13px', lineHeight: 1.6, fontStyle: 'italic' }}>
               {evaluation?.notes || "هذا اللاعب يظهر إمكانيات واعدة في تطوير مهاراته الأساسية. يحتاج إلى التركيز على الجانب البدني والتمركز التكتيكي في المباريات القادمة."}
             </p>
          </div>
        </div>
      </div>

      {/* Skills Analysis */}
      <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <TrendingUp size={20} color="#10b981" /> تحليل توزيع المهارات الأساسية
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
         {/* Numerical Analysis */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {skills.map(skill => (
              <div key={skill.label} style={{ marginBottom: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                  <span>{skill.label}</span>
                  <span style={{ color: skill.color }}>{skill.value}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${skill.value}%`, height: '100%', backgroundColor: skill.color, borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
         </div>

         {/* Radar Visual Placeholder */}
         {/* Skills Radar Analysis */}
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '15px', backgroundColor: '#f8fafc', padding: '10px' }}>
            <SkillRadarChart 
              skills={{
                pace: evaluation?.pace || 50,
                shooting: evaluation?.shooting || 50,
                passing: evaluation?.passing || 50,
                dribbling: evaluation?.dribbling || 50,
                defending: evaluation?.defending || 50,
                physical: evaluation?.physical_status || 50,
              }}
              color="#10b981"
            />
         </div>
         
         <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '60px', height: '60px', opacity: 0.15 }}>
                <QRCodeSVG value={`PLAYER_REPORT:${player.player_id}`} size={60} level="M" />
            </div>
         </div>
      </div>

      {/* Comparison & Potential */}
      <div style={{ marginTop: '40px', border: '2px solid #0f172a', borderRadius: '15px', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#0f172a', color: '#fff', padding: '10px 20px', fontWeight: 'bold', fontSize: '14px' }}>
           مؤشرات التطوير والموهبة (Potential Indices)
        </div>
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
           <div>
              <p style={{ fontSize: '10px', color: '#64748b', margin: '0 0 5px 0' }}>معدل الذكاء الكروي</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                 {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= (evaluation?.tactical > 7 ? 5 : 4) ? "#f59e0b" : "none"} color="#f59e0b" />)}
              </div>
           </div>
           <div>
              <p style={{ fontSize: '10px', color: '#64748b', margin: '0 0 5px 0' }}>الانضباط والروح الرياضية</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                 {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= (evaluation?.mental > 6 ? 5 : 3) ? "#10b981" : "none"} color="#10b981" />)}
              </div>
           </div>
           <div>
              <p style={{ fontSize: '10px', color: '#64748b', margin: '0 0 5px 0' }}>مؤشر القابلية للتطور</p>
              <div style={{ backgroundColor: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden', marginTop: '5px' }}>
                 <div style={{ width: '85%', height: '100%', backgroundColor: '#10b981' }}></div>
              </div>
           </div>
        </div>
      </div>

      {/* Institutional signatures */}
      <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '60px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '60px', fontSize: '14px', color: '#0f172a' }}>المدير الفني للأكاديمية</p>
          <div style={{ borderBottom: '2.5px solid #0f172a', width: '180px', margin: '0 auto' }}></div>
        </div>
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <AdminSignature />
          <div style={{ borderBottom: '2.5px solid #0f172a', width: '180px', margin: '0 auto' }}></div>
          {/* Watermark Logo */}
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', opacity: 0.1 }}>
             <Shield size={100} color="#0f172a" />
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <div style={{ 
        position: 'absolute', 
        bottom: '10mm', 
        left: '15mm', 
        right: '15mm', 
        paddingTop: '10px', 
        borderTop: '0.5px solid #cbd5e1', 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '9px', 
        color: '#94a3b8',
        fontWeight: 'bold'
      }}>
        <span>ولد التقرير رقم: {Date.now()}</span>
        <span>{academyName} - نظام التحليل المتقدم للبيانات الرياضية</span>
        <span>صالح لمدة 6 أشهر من تاريخ الإصدار</span>
      </div>
    </div>
  );
};

export const PedagogicalNotebookTemplate: React.FC<{ 
  player: any; 
  attendanceStats?: any;
  evaluations?: any[];
  physicalMetrics?: any[];
  subscriptions?: any[];
  payments?: any[];
  messages?: any[];
  academySettings?: any;
}> = ({ player, attendanceStats, evaluations, physicalMetrics, subscriptions, payments, messages, academySettings }) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;
  
  const normalize = (v: any) => {
    const n = Number(v) || 0;
    return n > 10 ? n : n * 10;
  };

  const sortedEvals = [...(evaluations || [])].sort((a, b) => new Date(b.date || b.evaluation_date).getTime() - new Date(a.date || a.evaluation_date).getTime());
  const latestEval = sortedEvals[0];
  
  const tech = normalize(latestEval?.technical || (latestEval?.passing ? (normalize(latestEval.passing) + normalize(latestEval.dribbling)) / 2 : 0));
  const tact = normalize(latestEval?.tactical || (latestEval?.defending ? (normalize(latestEval.defending) + normalize(latestEval.passing)) / 2 : 0));
  const phys = normalize(latestEval?.physical || latestEval?.physical_status || 0);
  const ment = normalize(latestEval?.mental || 50);

  const overall = latestEval ? Math.round((tech + tact + phys + ment) / 4) : 0;

  return (
    <div id="pedagogical-notebook" className="print-container" style={{ direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      {/* PAGE 1: COVER PAGE */}
      <div style={{ width: '210mm', height: '297mm', padding: '15mm', backgroundColor: '#fff', position: 'relative', border: '12px solid #0f172a', boxSizing: 'border-box', pageBreakAfter: 'always', breakAfter: 'page', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
           <div style={{ maxWidth: '300px', height: '140px', margin: '0 auto 25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {academyLogo ? <img src={academyLogo} crossOrigin="anonymous" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} alt="logo" /> : <Shield size={100} color="#0f172a" />}
           </div>
           <h1 style={{ fontSize: '38px', fontWeight: '950', color: '#0f172a', marginBottom: '15px' }}>{academyName}</h1>
           <p style={{ fontSize: '20px', color: '#10b981', fontWeight: 'bold', letterSpacing: '1px' }}>البرنامج البيداغوجي الموحد لتطوير المواهب</p>
           
           <div style={{ marginTop: '50mm', borderTop: '5px solid #10b981', paddingTop: '40mm', width: '100%' }}>
              <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#1e293b', marginBottom: '25px' }}>الدفتر البيداغوجي الشخصي للاعب</h2>
              <div style={{ marginTop: '10px', fontSize: '26px', fontWeight: '950', color: '#fff', padding: '15px 50px', backgroundColor: '#0f172a', borderRadius: '15px', display: 'inline-block', border: '2px solid #10b981', minWidth: '350px' }}>
                {player.name}
              </div>
              <p style={{ marginTop: '25px', fontSize: '18px', color: '#64748b', fontWeight: 'bold' }}>الموسم الرياضي: {academySettings?.current_season || "2024 / 2025"}</p>
           </div>
        </div>
        
        <div style={{ position: 'absolute', bottom: '15mm', left: '0', right: '0', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: '900' }}>
           <p>وثيقة تربوية وتقنية رسمية © {new Date().getFullYear()} {academyName}</p>
        </div>
      </div>

      {/* PAGE 2: ADMINISTRATIVE & PHYSICAL FOLLOW-UP */}
      <div style={{ width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: '#fff', pageBreakAfter: 'always', breakAfter: 'page', position: 'relative', boxSizing: 'border-box' }}>
        <div style={{ borderBottom: '3px solid #0f172a', paddingBottom: '12px', marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3 style={{ fontSize: '22px', fontWeight: '950', margin: 0, color: '#0f172a' }}>01. الهوية الرياضية والقياسات المورفولوجية</h3>
           <span style={{ fontSize: '13px', fontWeight: '900', color: '#64748b' }}>{player.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '35px', marginBottom: '45px' }}>
           <div style={{ width: '180px', height: '230px', border: '5px solid #f8fafc', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' }}>
              {player.photo_url ? <img src={player.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={100} color="#cbd5e1" /></div>}
              <div style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#0f172a', color: '#fff', textAlign: 'center', padding: '5px 0', fontSize: '12px', fontWeight: 'bold' }}>#{String(player.player_id).padStart(5, '0')}</div>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {[
                { label: 'الاسم واللقب كليا:', val: player.name },
                { label: 'تاريخ الميلاد بالتحديد:', val: player.birth_date },
                { label: 'الفئة الفنية الملحق بها:', val: player.category },
                { label: 'المركز التكتيكي الأساسي:', val: player.position || "غير محدد" },
                { label: 'القدم المفضلة للاعب:', val: player.preferred_foot || "غير محدد" },
                { label: 'تاريخ التحاق اللاعب:', val: player.join_date || "---" },
                { label: 'زمرة الدم والتحاليل:', val: player.blood_type || "---" },
                { label: 'رقم التعريف الموحد:', val: `ID-${String(player.player_id).padStart(5, '0')}` }
              ].map((item, i) => (
                <div key={i} style={{ borderBottom: '2px solid #f1f5f9', padding: '10px 5px' }}>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 5px 0', fontWeight: '900' }}>{item.label}</p>
                  <p style={{ fontSize: '15px', fontWeight: '950', color: '#1e293b', margin: 0 }}>{item.val}</p>
                </div>
              ))}
           </div>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '20px', border: '1.5px solid #e2e8f0', marginBottom: '40px' }}>
          <h4 style={{ fontSize: '17px', fontWeight: '950', marginBottom: '20px', color: '#10b981', borderRight: '5px solid #10b981', paddingRight: '12px' }}>سجل المتابعة البدنية المورفولوجية</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                  <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'right' }}>التاريخ المرجعي</th>
                  <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>الوزن (كغ)</th>
                  <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>الطول (سم)</th>
                  <th style={{ padding: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>مؤشر BMI</th>
                </tr>
            </thead>
            <tbody>
                {physicalMetrics && physicalMetrics.length > 0 ? physicalMetrics.slice(0, 10).map((m, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '12px', border: '1px solid #e2e8f0', fontWeight: '900' }}>{m.record_date}</td>
                      <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '950', color: '#0f172a' }}>{m.weight} كغ</td>
                      <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '950', color: '#0f172a' }}>{m.height} سم</td>
                      <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{m.bmi}</td>
                  </tr>
                )) : <tr><td colSpan={4} style={{ textAlign: 'center', padding: '35px', color: '#94a3b8', fontStyle: 'italic', fontSize: '16px' }}>لا توجد بيانات سجلات بدنية مسجلة حالياً</td></tr>}
            </tbody>
          </table>
        </div>

        <div>
           <h4 style={{ fontSize: '17px', fontWeight: '950', marginBottom: '20px', color: '#3b82f6', borderRight: '5px solid #3b82f6', paddingRight: '12px' }}>كشف الحضور والالتزام السنوي التراكمي</h4>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '15px', textAlign: 'center', border: '1.5px solid #bae6fd' }}>
                 <p style={{ margin: 0, fontSize: '12px', color: '#0369a1', fontWeight: '900' }}>مجموع الحصص</p>
                 <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '950', color: '#0c4a6e' }}>{attendanceStats?.total || 0}</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '15px', textAlign: 'center', border: '1.5px solid #bbf7d0' }}>
                 <p style={{ margin: 0, fontSize: '12px', color: '#15803d', fontWeight: '900' }}>نسبة الحضور</p>
                 <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '950', color: '#064e3b' }}>{attendanceStats?.presentPercentage || 0}%</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#fff7ed', borderRadius: '15px', textAlign: 'center', border: '1.5px solid #fed7aa' }}>
                 <p style={{ margin: 0, fontSize: '12px', color: '#c2410c', fontWeight: '900' }}>أيام الغياب المبرر</p>
                 <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '950', color: '#7c2d12' }}>{attendanceStats?.excused || 0}</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '15px', textAlign: 'center', border: '1.5px solid #fecaca' }}>
                 <p style={{ margin: 0, fontSize: '12px', color: '#b91c1c', fontWeight: '900' }}>الغيابات غير المبررة</p>
                 <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '950', color: '#7f1d1d' }}>{attendanceStats?.absent || 0}</p>
              </div>
           </div>
        </div>
      </div>

      {/* PAGE 3: TECHNICAL ASSESSMENT & COACHING HISTORY */}
      <div style={{ width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: '#fff', position: 'relative', boxSizing: 'border-box', pageBreakAfter: 'always', breakAfter: 'page' }}>
        <div style={{ borderBottom: '3px solid #0f172a', paddingBottom: '12px', marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3 style={{ fontSize: '22px', fontWeight: '950', margin: 0, color: '#0f172a' }}>02. المتابعة التقنية والسجل البيداغوجي الشامل</h3>
           <span style={{ fontSize: '13px', fontWeight: '900', color: '#64748b' }}>إعداد الطاقم الفني</span>
        </div>

        {/* Graphical Analysis Visualization */}
        <div style={{ padding: '30px', backgroundColor: '#f8fafc', borderRadius: '25px', border: '1.5px solid #e2e8f0', marginBottom: '40px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '950', color: '#1e293b' }}>تحليل مهارات الأداء (التقييم الأخير)</h4>
              <div style={{ textAlign: 'center', backgroundColor: '#0f172a', color: '#fff', padding: '10px 25px', borderRadius: '15px', border: '2px solid #10b981' }}>
                 <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', opacity: 0.9 }}>المعدل العام للأداء</p>
                 <p style={{ margin: 0, fontSize: '28px', fontWeight: '950' }}>{overall}%</p>
              </div>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                 {[
                   { label: 'القدرات الفنية الأساسية (Technical)', val: Math.round(tech), color: '#10b981' },
                   { label: 'الوعي والتحرك التكتيكي (Tactical)', val: Math.round(tact), color: '#3b82f6' },
                   { label: 'اللياقة البدنية والتحمل (Physical)', val: Math.round(phys), color: '#f59e0b' },
                   { label: 'الجانب الذهني والانضباط (Mental)', val: Math.round(ment), color: '#ef4444' }
                 ].map(s => (
                   <div key={s.label}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '950' }}>
                       <span>{s.label}</span>
                       <span style={{ color: s.color }}>{s.val}%</span>
                     </div>
                     <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                       <div style={{ width: `${s.val}%`, height: '100%', background: s.color, borderRadius: '5px' }}></div>
                     </div>
                   </div>
                 ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid #e2e8f0', paddingRight: '25px' }}>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ backgroundColor: '#0f172a', color: '#10b981', display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '950', marginBottom: '10px' }}>ملاحظة المدرب الختامية:</div>
                    <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155', fontStyle: 'italic', fontWeight: 'bold' }}>
                      {latestEval?.notes || "هذا اللاعب يظهر بوادر واعدة ويحتاج لمزيد من التدقيق على الجوانب التكتيكية في المباريات القادمة."}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* FULL COACHING EVALUATION HISTORY */}
        <div style={{ marginBottom: '50px' }}>
           <h4 style={{ fontSize: '17px', fontWeight: '950', marginBottom: '20px', color: '#4f46e5', borderRight: '5px solid #4f46e5', paddingRight: '12px' }}>السجل التاريخي الشامل للتقييمات البيداغوجية</h4>
           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                 <tr style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'right', width: '100px' }}>التاريخ</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>فني</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>تكتيك</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>بدني</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>ذهني</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'right' }}>التوجيهات والملاحظات البيداغوجية للمدرب</th>
                 </tr>
              </thead>
              <tbody>
                 {sortedEvals.length > 0 ? sortedEvals.map((ev, idx) => (
                   <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', fontWeight: '950' }}>{ev.date || ev.evaluation_date}</td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>{normalize(ev.technical)}%</td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>{normalize(ev.tactical)}%</td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>{normalize(ev.physical || ev.physical_status)}%</td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>{normalize(ev.mental)}%</td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', color: '#444', fontSize: '11px', lineHeight: 1.5, fontWeight: 'bold' }}>{ev.notes}</td>
                   </tr>
                 )) : <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontStyle: 'italic' }}>لا توجد سجلات تقييم تاريخية مخيرة حالياً لهذا اللاعب</td></tr>}
              </tbody>
           </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '60px', marginTop: '50px' }}>
           <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: '950', color: '#0f172a' }}>توقيع مدرب الفئة</p>
              <div style={{ borderBottom: '2.5px solid #0f172a', width: '150px', margin: '25px auto' }}></div>
           </div>
           <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: '950', color: '#0f172a' }}>المؤطر البيداغوجي العام</p>
              <div style={{ borderBottom: '2.5px solid #0f172a', width: '150px', margin: '25px auto' }}></div>
           </div>
           <div style={{ textAlign: 'center' }}>
              <AdminSignature />
              <div style={{ borderBottom: '2.5px solid #0f172a', width: '150px', margin: '25px auto' }}></div>
           </div>
        </div>

         <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', textAlign: 'center', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontWeight: 'bold' }}>
            <p>{academyName} - نظام الإدارة البيداغوجي المتكامل - استخرج هذا التقرير بتاريخ {new Date().toLocaleDateString('ar-DZ')}</p>
         </div>
      </div>

      {/* PAGE 4: ADMINISTRATIVE, FINANCIAL & PEDAGOGICAL NOTES */}
      <div style={{ width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: '#fff', position: 'relative', boxSizing: 'border-box' }}>
        <div style={{ borderBottom: '3px solid #0f172a', paddingBottom: '12px', marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3 style={{ fontSize: '22px', fontWeight: '950', margin: 0, color: '#0f172a' }}>03. المتابعة الإدارية، المالية والملاحظات السلوكية</h3>
           <span style={{ fontSize: '13px', fontWeight: '900', color: '#64748b' }}>السجل التاريخي الشامل</span>
        </div>

        {/* Subscriptions section */}
        <div style={{ marginBottom: '40px' }}>
           <h4 style={{ fontSize: '17px', fontWeight: '950', marginBottom: '15px', color: '#059669', borderRight: '5px solid #059669', paddingRight: '12px' }}>سجل الاشتراكات (Subscriptions History)</h4>
           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                 <tr style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                    <th style={{ padding: '10px', border: '1px solid #bbf7d0', textAlign: 'right' }}>نوع الاشتراك</th>
                    <th style={{ padding: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>تاريخ البدء</th>
                    <th style={{ padding: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>تاريخ الانتهاء</th>
                    <th style={{ padding: '10px', border: '1px solid #bbf7d0', textAlign: 'left' }}>المبلغ</th>
                    <th style={{ padding: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>الحالة</th>
                 </tr>
              </thead>
              <tbody>
                 {subscriptions && subscriptions.length > 0 ? subscriptions.map((s, idx) => (
                   <tr key={idx}>
                     <td style={{ padding: '10px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{s.plan_name || 'اشتراك دوري'}</td>
                     <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{s.start_date}</td>
                     <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{s.end_date}</td>
                     <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'left', fontWeight: '900' }}>{s.amount?.toLocaleString() || s.price?.toLocaleString()} دج</td>
                     <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ color: new Date(s.end_date) > new Date() ? '#059669' : '#ef4444', fontWeight: 'bold' }}>
                           {new Date(s.end_date) > new Date() ? 'ساري' : 'منتهي'}
                        </span>
                     </td>
                   </tr>
                 )) : <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>لا توجد سجلات اشتراكات مسجلة</td></tr>}
              </tbody>
           </table>
        </div>

        {/* Payments section */}
        <div style={{ marginBottom: '40px' }}>
           <h4 style={{ fontSize: '17px', fontWeight: '950', marginBottom: '15px', color: '#d97706', borderRight: '5px solid #d97706', paddingRight: '12px' }}>سجل المدفوعات المالية (Payments Record)</h4>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {payments && (payments || []).length > 0 ? (payments || []).slice(0, 8).map((p, idx) => (
                <div key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffcf5' }}>
                   <div>
                      <p style={{ margin: 0, fontSize: '10px', color: '#92400e', fontWeight: 'bold' }}>{p.payment_date}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '950' }}>{p.notes || 'تسديد اشتراك'}</p>
                   </div>
                   <div style={{ fontSize: '16px', fontWeight: '950', color: '#b45309' }}>{p.amount?.toLocaleString()} دج</div>
                </div>
              )) : <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '20px', color: '#94a3b8' }}>لا توجد سجلات مدفوعات مسجلة</div>}
           </div>
        </div>

        {/* Pedagogical Messages / Behavioral section */}
        <div style={{ marginBottom: '40px' }}>
           <h4 style={{ fontSize: '17px', fontWeight: '950', marginBottom: '15px', color: '#ef4444', borderRight: '5px solid #ef4444', paddingRight: '12px' }}>الملاحظات التربوية والسلوكية (Behavioral Notes)</h4>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages && (messages || []).length > 0 ? (messages || []).filter(m => m.type !== 'automatique').slice(0, 5).map((m, idx) => (
                <div key={idx} style={{ padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', position: 'relative' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: '#991b1b', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>{m.type || 'تنبيه'}</span>
                      <span style={{ fontSize: '10px', color: '#991b1b' }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('ar-DZ') : ''}</span>
                   </div>
                   <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#7f1d1d', fontWeight: 'bold' }}>{m.message || m.content}</p>
                </div>
              )) : <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', color: '#94a3b8', fontStyle: 'italic' }}>السجل البيداغوجي نظيف - لا توجد ملاحظات سلبية مسجلة</div>}
           </div>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '2px solid #0f172a', paddingTop: '20px', textAlign: 'center' }}>
           <p style={{ fontSize: '14px', fontWeight: '950', color: '#0f172a', marginBottom: '40px' }}>المصادقة النهائية للمدير العام للأكاديمية</p>
           <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '200px', borderBottom: '1px dashed #000' }}></div>
           </div>
        </div>

        <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', textAlign: 'center', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontWeight: 'bold' }}>
           <p>نهاية التقرير البيداغوجي الموحد - © {academyName}</p>
        </div>
      </div>
    </div>
  );
};

export const BatchPedagogicalReportsTemplate: React.FC<{
  playersData: any[];
  academySettings?: any;
}> = ({ playersData, academySettings }) => {
  return (
    <div id="batch-pedagogical-reports">
      {playersData.map((data, idx) => (
        <div key={data.player.player_id}>
          <PedagogicalNotebookTemplate 
            player={data.player}
            attendanceStats={data.attendanceStats}
            evaluations={data.evaluations}
            physicalMetrics={data.physicalMetrics}
            subscriptions={data.subscriptions}
            payments={data.payments}
            messages={data.messages}
            academySettings={academySettings}
          />
          {idx < playersData.length - 1 && (
            <div style={{ height: '0', pageBreakAfter: 'always', breakAfter: 'page' }} />
          )}
        </div>
      ))}
    </div>
  );
};

export const AdministrativeActivityReportTemplate: React.FC<{
  title: string;
  players: any[];
  trainings: any[];
  matches: any[];
  summary: any;
  academySettings?: any;
  fromDate?: string;
  toDate?: string;
}> = ({ title, players, trainings, matches, summary, academySettings, fromDate, toDate }) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;
  const currentSeason = academySettings?.current_season || "2025 / 2026";
  const today = new Date().toLocaleDateString('fr-FR');
  
  const playersByCategory = (players || []).reduce((acc: any, p: any) => {
    const cat = p.category || 'فئة غير محددة';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const totalPlayers = (players || []).length;
  const totalTrainings = (trainings || []).length;
  const totalMatches = (matches || []).length;

  const pageStyle: React.CSSProperties = {
    width: '210mm',
    height: '297mm',
    padding: '10mm',
    backgroundColor: '#ffffff',
    direction: 'rtl',
    fontFamily: "'Tajawal', 'Cairo', 'Segoe UI', sans-serif",
    color: '#0f172a',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const renderHeader = (pageNumber: number, totalPgs: number) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '3px solid #10b981',
      paddingBottom: '6mm',
      marginBottom: '5mm',
    }}>
      <div style={{ flex: 1, textAlign: 'right' }}>
        <h1 style={{ margin: 0, fontSize: '16pt', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px' }}>
          {academyName}
        </h1>
        <h2 style={{ margin: '2px 0 0', fontSize: '12pt', fontWeight: '700', color: '#10b981' }}>
          {title}
        </h2>
        <div style={{ marginTop: '3px', display: 'flex', gap: '14px', fontSize: '8pt', color: '#64748b' }}>
          <span>الموسم الرياضي: <strong style={{ color: '#0f172a' }}>{currentSeason}</strong></span>
          {fromDate && <span>من: <strong style={{ color: '#0f172a' }}>{fromDate}</strong></span>}
          {toDate && <span>إلى: <strong style={{ color: '#0f172a' }}>{toDate}</strong></span>}
          <span>تاريخ التقرير: <strong style={{ color: '#0f172a' }}>{today}</strong></span>
        </div>
      </div>
      <div style={{ marginRight: '8mm', textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {academyLogo ? (
          <img src={academyLogo} crossOrigin="anonymous" alt="Logo" style={{ height: '60px', maxWidth: '170px', objectFit: 'contain' }} />
        ) : (
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24pt', color: '#fff', fontWeight: '900'
          }}>
            {academyName.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );

  const renderFooter = (pageNumber: number, totalPgs: number) => (
    <div style={{
      position: 'absolute',
      bottom: '4mm',
      left: '10mm',
      right: '10mm',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '1px solid #e2e8f0',
      paddingTop: '2mm',
      fontSize: '7.5pt',
      color: '#94a3b8',
    }}>
      <span>{academyName} — {title}</span>
      <span style={{ fontWeight: '700', color: '#0f172a' }}>صفحة {pageNumber} من {totalPgs}</span>
      <span>{today}</span>
    </div>
  );

  return (
    <div id="administrative-report" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ═══ PAGE 1: Overview, Introduction, Categorical Stats & Educational Activities ═══ */}
      <div style={pageStyle}>
        {renderHeader(1, 2)}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4mm' }}>
          {/* 1. Introduction */}
          <section>
            <h3 style={{ fontSize: '10.5pt', fontWeight: '900', color: '#0f172a', borderRight: '4px solid #10b981', paddingRight: '8px', margin: '0 0 2mm' }}>
              1 — مقدمة التقرير
            </h3>
            <p style={{ fontSize: '8.5pt', lineHeight: '1.6', textAlign: 'justify', margin: 0, color: '#334155' }}>
              في إطار تطوير الرياضة القاعدية والتكوين الاحترافي للمواهب الشابة، واصلت {academyName} نشاطها التكويني والرياضي خلال الموسم الرياضي {currentSeason}.
              عمل الطاقم الإداري والفني على توفير أفضل الظروف المادية والتربوية لتنمية المهارات الكروية، الانضباط الرياضي، وصقل المواهب في بيئة إيجابية محفزة.
            </p>
          </section>

          {/* 2. Key Metrics Summary Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px 12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7pt', color: '#64748b', fontWeight: '700' }}>إجمالي اللاعبين المسجلين</div>
              <div style={{ fontSize: '14pt', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>{totalPlayers}</div>
            </div>
            <div style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '7pt', color: '#64748b', fontWeight: '700' }}>الحصص التدريبية المنفذة</div>
              <div style={{ fontSize: '14pt', fontWeight: '900', color: '#3b82f6', fontFamily: 'monospace' }}>{totalTrainings}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7pt', color: '#64748b', fontWeight: '700' }}>المباريات واللقاءات</div>
              <div style={{ fontSize: '14pt', fontWeight: '900', color: '#f59e0b', fontFamily: 'monospace' }}>{totalMatches}</div>
            </div>
          </div>

          {/* 3. Technical Stats by Category */}
          <section>
            <h3 style={{ fontSize: '10.5pt', fontWeight: '900', color: '#0f172a', borderRight: '4px solid #10b981', paddingRight: '8px', margin: '0 0 2mm' }}>
              2 — الإحصائيات الفنية وتوزيع الفئات الرياضية
            </h3>
            <p style={{ fontSize: '8pt', margin: '0 0 2mm', color: '#64748b' }}>
              تضم الأكاديمية عدة فئات عمرية، حيث بلغ التعداد الكلي {totalPlayers} لاعباً نشطاً موزعين على الأفواج كما يلي:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {Object.entries(playersByCategory).map(([cat, count]: [string, any], idx) => {
                const percentage = totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0;
                return (
                  <div key={idx} style={{ padding: '6px 10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '8pt' }}>
                      <strong style={{ color: '#0f172a' }}>{cat}</strong>
                      <span style={{ fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>
                        {count} لاعب ({percentage}%)
                      </span>
                    </div>
                    <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#10b981' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. Activities & Pedagogical Aspects */}
          <section>
            <h3 style={{ fontSize: '10.5pt', fontWeight: '900', color: '#0f172a', borderRight: '4px solid #10b981', paddingRight: '8px', margin: '0 0 2mm' }}>
              3 — النشاطات التدريبية والتكوين البيداغوجي
            </h3>
            <div style={{ fontSize: '8.5pt', lineHeight: '1.6', color: '#334155' }}>
              <div style={{ marginBottom: '1.5mm' }}>
                • <strong>التدريبات الفنية والبدنية:</strong> شمل البرنامج تدريبات تحكم بالكرة، التمركز، بناء اللعب، مع اختبارات بدنية دورية.
              </div>
              <div style={{ marginBottom: '1.5mm' }}>
                • <strong>التربية والأخلاق الرياضية:</strong> التركيز على احترام الزملاء، المدرب، الحكام، ومبادئ الروح الرياضية كأولوية في تكوين شخصية اللاعب.
              </div>
              <div>
                • <strong>المتابعة الفردية:</strong> تقييم مستمر لكل لاعب وفق شبكة معايير فنية، تكتيكية، بدنية وذهنية.
              </div>
            </div>
          </section>
        </div>

        {renderFooter(1, 2)}
      </div>

      {/* ═══ PAGE 2: Trainings, Matches, Recommendations & Signatures ═══ */}
      <div style={pageStyle}>
        {renderHeader(2, 2)}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4mm' }}>
          {/* 4. Recent Trainings Summary */}
          <section>
            <h3 style={{ fontSize: '10.5pt', fontWeight: '900', color: '#0f172a', borderRight: '4px solid #10b981', paddingRight: '8px', margin: '0 0 2mm' }}>
              4 — عينة من سجل الحصص التدريبية المنفذة
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                  <th style={{ padding: '5px 8px', border: '1px solid #1e293b' }}>#</th>
                  <th style={{ padding: '5px 8px', border: '1px solid #1e293b' }}>التاريخ</th>
                  <th style={{ padding: '5px 8px', border: '1px solid #1e293b' }}>المكان</th>
                  <th style={{ padding: '5px 8px', border: '1px solid #1e293b' }}>الوقت</th>
                </tr>
              </thead>
              <tbody>
                {(trainings || []).slice(0, 8).map((t, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{t.date}</td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t.location || 'الملعب الرئيسي'}</td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{t.start_time || '---'}</td>
                  </tr>
                ))}
                {(trainings || []).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>لا توجد حصص مسجلة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* 5. Matches Summary */}
          <section>
            <h3 style={{ fontSize: '10.5pt', fontWeight: '900', color: '#0f172a', borderRight: '4px solid #10b981', paddingRight: '8px', margin: '0 0 2mm' }}>
              5 — سجل مشاركات المباريات الرسمية والودية
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                  <th style={{ padding: '5px 8px', border: '1px solid #1e293b' }}>التاريخ</th>
                  <th style={{ padding: '5px 8px', border: '1px solid #1e293b' }}>المنافسة</th>
                  <th style={{ padding: '5px 8px', border: '1px solid #1e293b', textAlign: 'center' }}>النتيجة</th>
                  <th style={{ padding: '5px 8px', border: '1px solid #1e293b', textAlign: 'center' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(matches || []).slice(0, 6).map((m, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{m.match_date || m.date || '---'}</td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{m.competition || 'مباراة تطبيقية'}</td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', fontFamily: 'monospace' }}>
                      {m.home_score != null && m.away_score != null ? `${m.home_score} - ${m.away_score}` : (m.score || '—')}
                    </td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '1px 6px', borderRadius: '4px', fontSize: '7pt', fontWeight: '700',
                        backgroundColor: m.status === 'completed' ? '#ecfdf5' : '#f1f5f9',
                        color: m.status === 'completed' ? '#059669' : '#475569',
                      }}>
                        {m.status === 'completed' ? 'ملعوبة' : 'مبرمجة'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(matches || []).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>لا توجد مباريات مسجلة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* 6. Recommendations & Perspectives */}
          <section>
            <h3 style={{ fontSize: '10.5pt', fontWeight: '900', color: '#0f172a', borderRight: '4px solid #10b981', paddingRight: '8px', margin: '0 0 2mm' }}>
              6 — التوصيات والآفاق المستقبلية
            </h3>
            <div style={{ fontSize: '8pt', lineHeight: '1.5', color: '#334155' }}>
              • مواصلة الاستثمار في العتاد الرياضي البيداغوجي الحديث لتطوير المهارات الدقيقة.<br />
              • تكثيف المباريات الودية مع الأكاديميات النظيرة لرفع مستوى الاحتكاك والتنافس.<br />
              • تعزيز قنوات التواصل الرقمية مع أولياء الأمور لمتابعة التطور الدراسي والسلوكي للاعبين.
            </div>
          </section>

          {/* 7. Signatures & Official Stamp */}
          <div style={{
            marginTop: 'auto',
            borderTop: '2px solid #0f172a',
            paddingTop: '6mm',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30mm',
            textAlign: 'center',
          }}>
            <div>
              <p style={{ fontWeight: '900', fontSize: '9pt', color: '#0f172a', margin: '0 0 15mm' }}>
                توقيع ومصادقة المدير الفني
              </p>
              <div style={{ borderBottom: '1px dashed #94a3b8', width: '120px', margin: '0 auto' }}></div>
            </div>
            <div>
              <AdminSignature />
              <div style={{ borderBottom: '1px dashed #94a3b8', width: '120px', margin: '0 auto' }}></div>
            </div>
          </div>
        </div>

        {renderFooter(2, 2)}
      </div>
    </div>
  );
};


export const FinancialStatementTemplate: React.FC<{
  title: string;
  transactions: any[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  academySettings?: any;
  fromDate?: string;
  toDate?: string;
  subscriptionIncomeTotal?: number;
  manualIncomeTotal?: number;
}> = ({ title, transactions, totalIncome, totalExpense, balance, academySettings, fromDate, toDate, subscriptionIncomeTotal, manualIncomeTotal }) => {
  const academyName = academySettings?.name || 'أكاديمية أجيال وادي العثمانية';
  const academyLogo = academySettings?.logo_url;
  const today = new Date().toLocaleDateString('fr-FR');
  const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR');

  const subIncome = subscriptionIncomeTotal ?? transactions
    .filter(t => t.type === 'income' && (t.module === 'subscription' || t.notes?.includes('اشتراك')))
    .reduce((s, t) => s + (t.amount || 0), 0);

  const otherIncome = manualIncomeTotal ?? (totalIncome - subIncome);

  const invoiceExpTotal = transactions
    .filter(t => t.type === 'expense' && t.module === 'invoice')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const manualExpTotal = transactions
    .filter(t => t.type === 'expense' && t.module !== 'invoice')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const baseStyle: React.CSSProperties = {
    width: '210mm', height: '297mm', padding: '10mm',
    backgroundColor: '#fff', direction: 'rtl',
    fontFamily: "'Tajawal', 'Cairo', 'Segoe UI', sans-serif",
    color: '#0f172a', boxSizing: 'border-box',
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  };

  const footerStyle: React.CSSProperties = {
    position: 'absolute', bottom: '7mm', left: '10mm', right: '10mm',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderTop: '1px solid #e2e8f0', paddingTop: '3mm',
    fontSize: '8pt', color: '#94a3b8',
  };

  const thG: React.CSSProperties = {
    padding: '7px 10px', border: '1px solid #1e293b',
    backgroundColor: '#0f172a', color: '#fff',
    textAlign: 'right', fontWeight: '700', fontSize: '8.5pt',
  };

  const tdBase: React.CSSProperties = {
    padding: '5px 8px', border: '1px solid #e2e8f0',
    fontSize: '8pt', color: '#1e293b', textAlign: 'right',
  };

  // Page 1: Summary header + income/expense tables + balance
  // Page 2+: Transaction detail table (30 rows per page)
  const TRANS_PER_PAGE = 32;
  const transPages: any[][] = [];
  for (let i = 0; i < Math.max(transactions.length, 1); i += TRANS_PER_PAGE) {
    transPages.push(transactions.slice(i, i + TRANS_PER_PAGE));
  }
  const totalPages = 1 + transPages.length;

  const renderPageHeader = (isFirst = false) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '3px solid #059669', paddingBottom: '7mm', marginBottom: '6mm',
    }}>
      <div style={{ flex: 1, textAlign: 'right' }}>
        <h1 style={{ margin: 0, fontSize: '16pt', fontWeight: '900', color: '#059669' }}>{academyName}</h1>
        <h2 style={{ margin: '2px 0 0', fontSize: '11pt', fontWeight: '700', color: '#0f172a' }}>{title}</h2>
        <div style={{ marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '8pt', color: '#64748b' }}>
          <span>الموسم: <strong style={{ color: '#0f172a' }}>{academySettings?.current_season || '2025/2026'}</strong></span>
          {fromDate && <span>من: <strong style={{ color: '#0f172a' }}>{fromDate}</strong></span>}
          {toDate && <span>إلى: <strong style={{ color: '#0f172a' }}>{toDate}</strong></span>}
          <span>تاريخ الطباعة: <strong>{today}</strong></span>
        </div>
      </div>
      <div style={{ marginRight: '8mm', textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {academyLogo
          ? <img src={academyLogo} crossOrigin="anonymous" alt="logo" style={{ height: '60px', maxWidth: '170px', objectFit: 'contain' }} />
          : <Shield size={55} color="#059669" />
        }
      </div>
    </div>
  );

  const renderFooter = (pageNum: number) => (
    <div style={footerStyle}>
      <span>{academyName} — {title}</span>
      <span style={{ fontWeight: '700', color: '#475569' }}>{pageNum} / {totalPages}</span>
      <span>{today}</span>
    </div>
  );

  return (
    <div id="financial-statement" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ═══ PAGE 1: Summary ═══ */}
      <div style={baseStyle}>
        {renderPageHeader(true)}

        {/* Income table */}
        <div style={{ marginBottom: '5mm' }}>
          <h3 style={{ fontSize: '11pt', fontWeight: '900', color: '#059669', borderRight: '4px solid #059669', paddingRight: '6px', margin: '0 0 4mm' }}>
            1 — المداخيل
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <thead>
              <tr>
                <th style={{ ...thG, backgroundColor: '#064e3b', color: '#6ee7b7' }}>المصدر</th>
                <th style={{ ...thG, backgroundColor: '#064e3b', color: '#6ee7b7', textAlign: 'left', width: '120px' }}>المبلغ (دج)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#f0fdf4' }}>
                <td style={{ ...tdBase, fontWeight: '700', color: '#065f46' }}>💳  اشتراكات اللاعبين</td>
                <td style={{ ...tdBase, textAlign: 'left', fontWeight: '900', color: '#059669', fontFamily: 'monospace' }}>{fmt(subIncome)}</td>
              </tr>
              <tr>
                <td style={tdBase}>📥  مداخيل أخرى (يدوية)</td>
                <td style={{ ...tdBase, textAlign: 'left', fontWeight: '700', fontFamily: 'monospace' }}>{fmt(otherIncome)}</td>
              </tr>
              <tr style={{ backgroundColor: '#ecfdf5', fontWeight: '900' }}>
                <td style={{ ...tdBase, fontWeight: '900' }}>المجموع الكلي للمداخيل</td>
                <td style={{ ...tdBase, textAlign: 'left', color: '#059669', fontWeight: '900', fontSize: '10pt', fontFamily: 'monospace' }}>{fmt(totalIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Expense table */}
        <div style={{ marginBottom: '5mm' }}>
          <h3 style={{ fontSize: '11pt', fontWeight: '900', color: '#dc2626', borderRight: '4px solid #dc2626', paddingRight: '6px', margin: '0 0 4mm' }}>
            2 — المصاريف
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <thead>
              <tr>
                <th style={{ ...thG, backgroundColor: '#7f1d1d', color: '#fca5a5' }}>البيان</th>
                <th style={{ ...thG, backgroundColor: '#7f1d1d', color: '#fca5a5', textAlign: 'left', width: '120px' }}>المبلغ (دج)</th>
              </tr>
            </thead>
            <tbody>
              {invoiceExpTotal > 0 && (
                <tr style={{ backgroundColor: '#fff7f7' }}>
                  <td style={{ ...tdBase, fontWeight: '700', color: '#991b1b' }}>🧾  فواتير المصاريف</td>
                  <td style={{ ...tdBase, textAlign: 'left', fontWeight: '900', color: '#dc2626', fontFamily: 'monospace' }}>{fmt(invoiceExpTotal)}</td>
                </tr>
              )}
              {manualExpTotal > 0 && (
                <tr>
                  <td style={tdBase}>📋  مصاريف يدوية أخرى</td>
                  <td style={{ ...tdBase, textAlign: 'left', fontWeight: '700', fontFamily: 'monospace' }}>{fmt(manualExpTotal)}</td>
                </tr>
              )}
              {invoiceExpTotal === 0 && manualExpTotal === 0 && (
                <tr><td colSpan={2} style={{ ...tdBase, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>لا توجد مصاريف مسجلة</td></tr>
              )}
              <tr style={{ backgroundColor: '#fef2f2', fontWeight: '900' }}>
                <td style={{ ...tdBase, fontWeight: '900' }}>المجموع الكلي للمصاريف</td>
                <td style={{ ...tdBase, textAlign: 'left', color: '#dc2626', fontWeight: '900', fontSize: '10pt', fontFamily: 'monospace' }}>{fmt(totalExpense)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Balance summary */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5mm',
          marginBottom: '5mm',
        }}>
          <div style={{ padding: '6mm', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #d1fae5', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '7pt', color: '#065f46', fontWeight: '700' }}>إجمالي المداخيل</p>
            <p style={{ margin: '4px 0 0', fontSize: '13pt', fontWeight: '900', color: '#059669', fontFamily: 'monospace' }}>{fmt(totalIncome)} دج</p>
          </div>
          <div style={{ padding: '6mm', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '7pt', color: '#991b1b', fontWeight: '700' }}>إجمالي المصاريف</p>
            <p style={{ margin: '4px 0 0', fontSize: '13pt', fontWeight: '900', color: '#dc2626', fontFamily: 'monospace' }}>{fmt(totalExpense)} دج</p>
          </div>
          <div style={{ padding: '6mm', backgroundColor: balance >= 0 ? '#059669' : '#ef4444', borderRadius: '8px', textAlign: 'center', color: '#fff' }}>
            <p style={{ margin: 0, fontSize: '7pt', fontWeight: '700', opacity: 0.9 }}>الرصيد النهائي</p>
            <p style={{ margin: '4px 0 0', fontSize: '14pt', fontWeight: '900', fontFamily: 'monospace' }}>{fmt(balance)} دج</p>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '5mm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30mm', textAlign: 'center' }}>
          <div>
            <p style={{ fontWeight: '700', fontSize: '9pt', marginBottom: '15mm', color: '#0f172a' }}>توقيع أمين المال</p>
            <div style={{ borderBottom: '1px dotted #475569', width: '100px', margin: '0 auto' }}></div>
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '9pt', marginBottom: '15mm', color: '#0f172a' }}>مصادقة الإدارة</p>
            <div style={{ borderBottom: '1px dotted #475569', width: '100px', margin: '0 auto' }}></div>
          </div>
        </div>

        {renderFooter(1)}
      </div>

      {/* ═══ PAGES 2+: Transaction Details ═══ */}
      {transPages.map((pageTrans, pageIdx) => {
        const pageNum = pageIdx + 2;
        const startIdx = pageIdx * TRANS_PER_PAGE;
        return (
          <div key={pageIdx} style={baseStyle}>
            {renderPageHeader()}

            <h3 style={{ fontSize: '11pt', fontWeight: '900', color: '#0f172a', borderRight: '4px solid #0f172a', paddingRight: '6px', margin: '0 0 4mm' }}>
              سجل العمليات المالية التفصيلي
              <span style={{ fontSize: '8pt', fontWeight: '400', color: '#64748b', marginRight: '8px' }}>
                ({startIdx + 1} – {Math.min(startIdx + TRANS_PER_PAGE, transactions.length)} من {transactions.length})
              </span>
            </h3>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                <thead>
                  <tr>
                    <th style={{ ...thG, width: '24px', textAlign: 'center', color: '#94a3b8' }}>#</th>
                    <th style={{ ...thG, width: '80px' }}>التاريخ</th>
                    <th style={thG}>البيان / التفاصيل</th>
                    <th style={{ ...thG, width: '55px', textAlign: 'center' }}>النوع</th>
                    <th style={{ ...thG, width: '90px', textAlign: 'left' }}>المبلغ (دج)</th>
                  </tr>
                </thead>
                <tbody>
                  {pageTrans.map((t, i) => {
                    const isIncome = t.type === 'income';
                    const isSub = t.module === 'subscription';
                    const isEven = i % 2 === 0;
                    return (
                      <tr key={i} style={{ backgroundColor: isEven ? '#fff' : '#f8fafc' }}>
                        <td style={{ ...tdBase, textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>
                          {startIdx + i + 1}
                        </td>
                        <td style={{ ...tdBase, fontFamily: 'monospace', fontSize: '7.5pt', color: '#475569' }}>
                          {t.date || '—'}
                        </td>
                        <td style={{ ...tdBase, maxWidth: '180px' }}>
                          <div style={{ fontWeight: isSub ? '700' : '400', color: isSub ? '#065f46' : '#1e293b' }}>
                            {t.notes || t.description || '—'}
                          </div>
                          {t.category && <div style={{ fontSize: '7pt', color: '#94a3b8' }}>{t.category}</div>}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '1px 6px', borderRadius: '4px', fontSize: '7pt', fontWeight: '700',
                            backgroundColor: isIncome ? '#ecfdf5' : '#fef2f2',
                            color: isIncome ? '#059669' : '#dc2626',
                            border: `1px solid ${isIncome ? '#d1fae5' : '#fee2e2'}`,
                          }}>
                            {isIncome ? 'مدخول' : 'مصروف'}
                          </span>
                        </td>
                        <td style={{ ...tdBase, textAlign: 'left', fontWeight: '700', fontFamily: 'monospace', color: isIncome ? '#059669' : '#dc2626' }}>
                          {fmt(t.amount || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {pageIdx === transPages.length - 1 && (
                  <tfoot>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <td colSpan={4} style={{ ...tdBase, fontWeight: '900', textAlign: 'right', fontSize: '9pt' }}>
                        مجموع المداخيل: <span style={{ color: '#059669', fontFamily: 'monospace' }}>{fmt(totalIncome)} دج</span>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        مجموع المصاريف: <span style={{ color: '#dc2626', fontFamily: 'monospace' }}>{fmt(totalExpense)} دج</span>
                      </td>
                      <td style={{ ...tdBase, textAlign: 'left', fontWeight: '900', color: balance >= 0 ? '#059669' : '#dc2626', fontFamily: 'monospace', fontSize: '9pt' }}>
                        {fmt(balance)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {renderFooter(pageNum)}
          </div>
        );
      })}
    </div>
  );
};



export const KitReceiptTemplate: React.FC<{
  player: any;
  items: string[];
  date: string;
  type: 'distribution' | 'assignment';
  kitNumber?: string;
  notes?: string;
  academySettings?: any;
}> = ({ player, items, date, type, kitNumber, notes, academySettings }) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;

  return (
    <div style={{ 
      width: "100%", 
      padding: "20mm", 
      backgroundColor: "#fff", 
      color: "#000", 
      fontFamily: "'Tajawal', sans-serif",
      minHeight: "148mm", // A5 size height
      position: 'relative',
      direction: 'rtl'
    }}>
      {/* Receipt Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '4px solid #059669', paddingBottom: '15px' }}>
        <div style={{ textAlign: 'right' }}>
           <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#059669' }}>{type === 'distribution' ? 'وصل تسليم لباس' : 'وصل تخصيص قطعة مرقمة'}</h1>
           <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#64748b' }}>الرقم المرجعي: KIT-{Date.now().toString().slice(-6)}</p>
        </div>
        <div style={{ height: '70px', maxWidth: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {academyLogo ? (
            <img src={academyLogo} crossOrigin="anonymous" alt="Logo" style={{ maxHeight: '68px', maxWidth: '160px', objectFit: 'contain' }} />
          ) : (
            <Shield size={55} color="#059669" />
          )}
        </div>
        <div style={{ textAlign: 'left' }}>
           <p style={{ margin: 0, fontWeight: 'bold' }}>{academyName}</p>
           <p style={{ margin: 0, fontSize: '12px' }}>التاريخ: {date}</p>
        </div>
      </div>

      {/* Player Section */}
      <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
               <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>إسم اللاعب</p>
               <p style={{ margin: '5px 0 0', fontWeight: '900', fontSize: '16px' }}>{player?.name}</p>
            </div>
            <div>
               <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>الفئة / الفوج</p>
               <p style={{ margin: '5px 0 0', fontWeight: 'bold' }}>{player?.category || '---'}</p>
            </div>
         </div>
      </div>

      {/* Items Section */}
      <div style={{ marginBottom: '30px' }}>
         <h3 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '10px', color: '#0f172a' }}>قائمة العتاد المسلم:</h3>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ backgroundColor: '#059669', color: '#fff' }}>
                  <th style={{ padding: '10px', border: '1px solid #059669', textAlign: 'right' }}>البيان</th>
                  <th style={{ padding: '10px', border: '1px solid #059669', textAlign: 'center' }}>المقاس</th>
                  {kitNumber && <th style={{ padding: '10px', border: '1px solid #059669', textAlign: 'center' }}>الرقم</th>}
               </tr>
            </thead>
            <tbody>
               {items.map((item, idx) => (
                  <tr key={idx}>
                     <td style={{ padding: '10px', border: '1px solid #e2e8f0', color: '#000', fontWeight: 'bold' }}>{item}</td>
                     <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#000' }}>{player?.uniform_size || '---'}</td>
                     {kitNumber && <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', color: '#059669', fontSize: '18px' }}>{kitNumber}</td>}
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {notes && (
         <div style={{ marginBottom: '30px' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>ملاحظات:</p>
            <p style={{ margin: '5px 0 0', fontSize: '12px', fontStyle: 'italic' }}>{notes}</p>
         </div>
      )}

      {/* Signature Section */}
      <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', textAlign: 'center' }}>
         <div>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px', color: '#64748b', marginBottom: '40px' }}>توقيع المستلم (الولي)</p>
            <div style={{ borderBottom: '1px solid #cbd5e1', width: '120px', margin: '0 auto' }}></div>
         </div>
         <div>
            <AdminSignature />
            <div style={{ borderBottom: '1px solid #cbd5e1', width: '120px', margin: '0 auto' }}></div>
         </div>
      </div>

      {/* Footer */}
      <div style={{ 
        position: 'absolute', 
        bottom: '10mm', 
        left: '20mm', 
        right: '20mm', 
        borderTop: '0.5px solid #e2e8f0', 
        paddingTop: '10px',
        textAlign: 'center',
        fontSize: '9px',
        color: '#94a3b8'
      }}>
        <p style={{ margin: 0 }}>نظام إدارة الأكاديميات الاحترافي - تم إصدار هذا الوصل آلياً</p>
      </div>
    </div>
  );
};

export const CategoryPlayersListTemplate: React.FC<{
  categoryName: string;
  players: any[];
  teams?: any[];
  subscriptions?: any[];
  headCoach?: string;
  academySettings?: any;
  squadName?: string;
  coaches?: any[];
}> = ({ categoryName, players = [], teams = [], subscriptions = [], headCoach, academySettings, squadName, coaches = [] }) => {
  const academyName = academySettings?.name || "أكاديمية أجيال وادي العثمانية";
  const academyLogo = academySettings?.logo_url;
  const currentSeason = academySettings?.current_season || "2025 / 2026";
  const today = new Date().toLocaleDateString('fr-FR');

  const isU9 = categoryName.toUpperCase().includes('U9');

  // Resolve coach display in header
  const getCoachHeaderDisplay = () => {
    if (categoryName.toUpperCase().includes('U7')) {
      return 'ك. شوقي حيدر (مدرب فئة U7)';
    }

    if (squadName) {
      if (squadName.includes('U7')) {
        return 'ك. شوقي حيدر (مدرب فئة U7)';
      }
      if (squadName.includes('1') || squadName.toUpperCase().includes('A')) {
        return 'ك. قسوم أشرف (مدرب الفوج 1 / U9 A)';
      }
      if (squadName.includes('2') || squadName.toUpperCase().includes('B')) {
        return 'ك. شوقي حيدر (مدرب فئة U7)';
      }
      return headCoach || 'المدرب المسؤول';
    }

    if (isU9) {
      return 'ك. قسوم أشرف (مدرب فئة U9)';
    }

    return headCoach || 'المدرب المسؤول';
  };

  // Calculate age helper
  const getAge = (birthDateStr: string) => {
    if (!birthDateStr) return '';
    try {
      const bDate = new Date(birthDateStr);
      const diff = Date.now() - bDate.getTime();
      const ageDate = new Date(diff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return isNaN(age) ? '' : `${age} سنة`;
    } catch {
      return '';
    }
  };

  // Subscription status helper - exactly matching Subscriptions section logic
  const checkSubscriptionStatus = (player: any) => {
    const pId = Number(player.player_id || player.id);
    const playerSubs = (subscriptions || []).filter((s: any) => 
      Number(s.player_id) === pId
    );

    const activeSub = playerSubs.find((s: any) => s.status === 'نشط');
    const totalPaid = playerSubs.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
    const hasHalfPlan = playerSubs.some((s: any) => 
      (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000
    );

    // Check if player has special exempt status (حالة خاصة معفى)
    const isExempt = playerSubs.some((s: any) => 
      (s.plan_name && (s.plan_name.includes('معفى') || s.plan_name.includes('خاصة') || s.plan_name.includes('إعفاء') || s.plan_name.includes('منحة'))) ||
      s.status === 'معفى'
    );

    if (isExempt) {
      return {
        isPaid: true,
        type: 'exempt' as const,
        label: 'حالة خاصة (معفى)',
        amount: 0,
        color: '#7e22ce',
        bgColor: '#faf5ff',
        borderColor: '#e9d5ff',
        icon: '⭐'
      };
    }

    // Full payment: 10,000 DZD or more, or active full subscription
    if (totalPaid >= 10000 && !hasHalfPlan) {
      return {
        isPaid: true,
        type: 'full' as const,
        label: 'تم الدفع (كامل)',
        amount: totalPaid,
        color: '#047857',
        bgColor: '#ecfdf5',
        borderColor: '#a7f3d0',
        icon: '✅'
      };
    }

    // Half payment: 5,000 DZD or half plan
    if (hasHalfPlan || totalPaid === 5000) {
      return {
        isPaid: true,
        type: 'half' as const,
        label: 'نصف دفعة (5,000 د.ج)',
        amount: totalPaid,
        color: '#b45309',
        bgColor: '#fffbeb',
        borderColor: '#fde68a',
        icon: '⚠️'
      };
    }

    // Any paid amount or active subscription or player.is_paid
    if (totalPaid > 0 || !!activeSub || player.is_paid || player.subscription_status === 'مدفوع') {
      return {
        isPaid: true,
        type: 'full' as const,
        label: totalPaid > 0 ? `تم الدفع (${totalPaid.toLocaleString('fr-FR')} د.ج)` : 'تم الدفع',
        amount: totalPaid,
        color: '#047857',
        bgColor: '#ecfdf5',
        borderColor: '#a7f3d0',
        icon: '✅'
      };
    }

    // Unpaid
    return {
      isPaid: false,
      type: 'unpaid' as const,
      label: 'غير مدفوع',
      amount: 0,
      color: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      icon: '❌'
    };
  };

  // Group squads within this category
  const categoryTeams = teams.filter(t => t.category === categoryName);

  // Overall subscription statistics for this category
  const fullPaidCount = players.filter(p => checkSubscriptionStatus(p).type === 'full').length;
  const halfPaidCount = players.filter(p => checkSubscriptionStatus(p).type === 'half').length;
  const paidCount = fullPaidCount + halfPaidCount;
  const unpaidCount = players.length - paidCount;
  const paymentRate = players.length > 0 ? Math.round((paidCount / players.length) * 100) : 0;

  // Exactly 40 players per A4 page with 1cm margin
  const ROWS_PER_PAGE = 40;
  const paginatePlayers = (list: any[]) => {
    if (list.length === 0) return [[]];
    const resultPages: any[][] = [];
    for (let i = 0; i < list.length; i += ROWS_PER_PAGE) {
      resultPages.push(list.slice(i, i + ROWS_PER_PAGE));
    }
    return resultPages;
  };

  const pages = paginatePlayers(players);
  const totalPages = pages.length;

  const pageStyle: React.CSSProperties = {
    width: '210mm',
    height: '297mm',
    maxHeight: '297mm',
    padding: '7mm 10mm', // 7mm vertical, 10mm (1cm) horizontal
    backgroundColor: '#ffffff',
    direction: 'rtl',
    fontFamily: "'Tajawal', 'Cairo', 'Segoe UI', sans-serif",
    color: '#0f172a',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    pageBreakAfter: 'always',
    breakAfter: 'page',
  };

  const renderHeader = (pageNum: number) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '2px solid #059669',
      paddingBottom: '1.5mm',
      marginBottom: '1.5mm',
      flexShrink: 0
    }}>
      <div style={{ flex: 1, textAlign: 'right' }}>
        <h1 style={{ margin: 0, fontSize: '11pt', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.15 }}>
          {academyName}
        </h1>
        <h2 style={{ margin: '1px 0 0', fontSize: '9pt', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>قائمة لاعبي:</span>
          <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '1px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
            فئة {categoryName} {squadName ? `• ${squadName}` : ''}
          </span>
          <span style={{ fontSize: '6.5pt', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
            (40 لاعب في الورقة)
          </span>
        </h2>
        <div style={{ marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '6.4pt', color: '#64748b' }}>
          <span>الموسم: <strong style={{ color: '#0f172a' }}>{currentSeason}</strong></span>
          <span>المدرب: <strong style={{ color: '#0f172a' }}>{getCoachHeaderDisplay()}</strong></span>
          {!squadName && <span>الأفواج: <strong style={{ color: '#0f172a' }}>{categoryTeams.length || 1}</strong></span>}
          <span>إجمالي اللاعبين: <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{players.length}</strong></span>
          <span>مسدد كامل: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>{fullPaidCount}</strong></span>
          <span>نصف دفعة: <strong style={{ color: '#b45309', fontFamily: 'monospace' }}>{halfPaidCount}</strong></span>
          <span>غير مسدد: <strong style={{ color: '#dc2626', fontFamily: 'monospace' }}>{unpaidCount}</strong></span>
          <span>نسبة السداد: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{paymentRate}%</strong></span>
        </div>
      </div>
      <div style={{ marginRight: '5mm', textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {academyLogo ? (
          <img src={academyLogo} crossOrigin="anonymous" alt="Logo" style={{ height: '42px', maxWidth: '150px', objectFit: 'contain' }} />
        ) : (
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18pt', color: '#fff', fontWeight: '900'
          }}>
            {academyName.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );

  const thStyle: React.CSSProperties = {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '1.5px 3.5px',
    textAlign: 'right',
    fontWeight: '700',
    fontSize: '6.4pt',
    border: '1px solid #1e293b',
  };

  const tdBase: React.CSSProperties = {
    padding: '0.8px 3px',
    border: '1px solid #e2e8f0',
    fontSize: '6.4pt',
    color: '#1e293b',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.15',
  };

  // Resolve squad & coach for player row
  const getPlayerSquadAndCoach = (p: any) => {
    const team = teams.find(t => t.team_id === p.team_id);
    let sName = team?.team_name || p.team_name || '';
    let cName = '';

    // Direct mapping for Team 8 (U9 A / فوج 1)
    if (p.team_id === 8 || sName === 'A' || sName.includes('U9 A') || (sName.includes('1') && isU9)) {
      sName = 'الفوج 1 (U9 A)';
      cName = 'ك. قسوم أشرف';
    }
    // Direct mapping for Team 5 / 9 (U7 / شوقي حيدر)
    else if (p.team_id === 5 || p.team_id === 9 || sName.includes('U7') || p.category === 'U7' || (sName.includes('2') && isU9)) {
      sName = team?.team_name?.startsWith('فوج') ? team.team_name : (team?.team_name ? `فوج ${team.team_name}` : 'فوج فئة U7');
      cName = 'ك. شوقي حيدر';
    }
    // Other teams
    else if (team) {
      sName = team.team_name.startsWith('فوج') ? team.team_name : `فوج ${team.team_name}`;
      const coach = coaches.find(c => (team.coach_id && (c.coach_id === team.coach_id || c.id === team.coach_id)) || c.team_id === team.team_id);
      cName = coach?.name ? `ك. ${coach.name}` : (headCoach ? `ك. ${headCoach}` : '—');
    } else {
      sName = p.group_name || 'الفوج 1';
      cName = headCoach ? `ك. ${headCoach}` : '—';
    }

    return { squadName: sName, coachName: cName };
  };

  let cumulativeIndex = 0;

  return (
    <div id="category-players-report" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Inline Print Media Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 7mm 10mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .a4-category-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          .a4-category-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}} />

      {pages.map((pagePlayers, pageIdx) => {
        const isLastPage = pageIdx === totalPages - 1;
        const pageStartIdx = cumulativeIndex;
        cumulativeIndex += pagePlayers.length;

        // Pad each page up to 40 rows so the sheet always fills exactly 40 rows
        const paddedPlayers: any[] = [...pagePlayers];
        while (paddedPlayers.length < 40) {
          paddedPlayers.push({ isPlaceholder: true });
        }

        return (
          <div key={pageIdx} className="a4-category-page" style={pageStyle}>
            {renderHeader(pageIdx + 1)}

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '6.4pt', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ height: '4.8mm' }}>
                    <th style={{ ...thStyle, width: '22px', textAlign: 'center', color: '#86efac' }}>#</th>
                    <th style={{ ...thStyle, width: '135px' }}>اسم ولقب اللاعب</th>
                    <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>تاريخ الميلاد (العمر)</th>
                    <th style={{ ...thStyle, width: '75px', textAlign: 'center' }}>الفوج</th>
                    <th style={{ ...thStyle, width: '75px', textAlign: 'center', color: '#93c5fd' }}>المدرب المشرف</th>
                    <th style={{ ...thStyle, width: '38px', textAlign: 'center' }}>المركز</th>
                    <th style={{ ...thStyle, width: '26px', textAlign: 'center' }}>الرقم</th>
                    <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>هاتف الولي</th>
                    <th style={{ ...thStyle, width: '95px', textAlign: 'center', backgroundColor: '#064e3b', color: '#6ee7b7' }}>
                      دفع الاشتراك
                    </th>
                    <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {paddedPlayers.map((p, idx) => {
                    const globalIdx = pageStartIdx + idx + 1;
                    const isEven = idx % 2 === 0;

                    if (p.isPlaceholder) {
                      return (
                        <tr key={`ph-${idx}`} style={{ height: '5.15mm', backgroundColor: isEven ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#94a3b8', fontWeight: '700', fontFamily: 'monospace' }}>
                            {globalIdx}
                          </td>
                          <td style={{ ...tdBase, color: '#cbd5e1' }}>
                            ............................................................
                          </td>
                          <td style={{ ...tdBase, textAlign: 'center', color: '#cbd5e1' }}>—</td>
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

                    const ageStr = getAge(p.birth_date);
                    const birthDisplay = p.birth_date ? `${p.birth_date} ${ageStr ? `(${ageStr})` : ''}` : '—';
                    const isInjured = p.status === 'مصاب';
                    const isInactive = p.status === 'معلق' || p.status === 'غير نشط';
                    const subStatus = checkSubscriptionStatus(p);
                    const { squadName: playerSquad, coachName: playerCoach } = getPlayerSquadAndCoach(p);

                    return (
                      <tr key={p.player_id || idx} style={{ height: '5.15mm', backgroundColor: isEven ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ ...tdBase, textAlign: 'center', color: '#64748b', fontWeight: '700', fontFamily: 'monospace' }}>
                          {globalIdx}
                        </td>
                        <td style={{ ...tdBase, fontWeight: '800', color: '#0f172a' }}>
                          {p.name}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center', fontSize: '6.4pt', color: '#475569' }}>
                          {birthDisplay}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center', fontWeight: '700', color: '#047857' }}>
                          {playerSquad}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center', fontWeight: '800', color: '#0f172a' }}>
                          {playerCoach}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center', color: '#475569' }}>
                          {p.position || '—'}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center', fontWeight: '800', fontFamily: 'monospace', color: '#059669' }}>
                          {p.kit_number || p.uniform_number || '—'}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center', fontFamily: 'monospace', fontSize: '6.4pt', color: '#334155' }}>
                          {p.phone || p.parent_phone || '—'}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '6.2pt',
                            fontWeight: '800',
                            backgroundColor: subStatus.bgColor,
                            color: subStatus.color,
                            border: `1px solid ${subStatus.borderColor}`,
                            whiteSpace: 'nowrap'
                          }}>
                            <span>{subStatus.icon}</span>
                            <span>{subStatus.label}</span>
                          </span>
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.5px 4px',
                            borderRadius: '3px',
                            fontSize: '6.2pt',
                            fontWeight: '700',
                            backgroundColor: isInjured ? '#fef2f2' : isInactive ? '#fef3c7' : '#ecfdf5',
                            color: isInjured ? '#dc2626' : isInactive ? '#d97706' : '#059669',
                            border: `1px solid ${isInjured ? '#fecaca' : isInactive ? '#fde68a' : '#a7f3d0'}`
                          }}>
                            {p.status || 'نشط'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* If Last Page: Show category summary banner & Administration stamp */}
            {isLastPage ? (
              <div style={{ marginTop: '1.5mm', paddingTop: '1mm', flexShrink: 0 }}>
                {/* Summary Banner */}
                <div style={{
                  padding: '1.5px 6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '3px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '6.4pt',
                  fontWeight: '700',
                  marginBottom: '1.5mm',
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#0f172a' }}>
                      إجمالي اللاعبين المسجلين: <strong style={{ fontFamily: 'monospace', color: '#059669' }}>{players.length}</strong>
                    </span>
                    <span style={{ color: '#047857' }}>
                      مسدد بالكامل: <strong style={{ fontFamily: 'monospace' }}>{fullPaidCount}</strong>
                    </span>
                    <span style={{ color: '#b45309' }}>
                      نصف دفعة: <strong style={{ fontFamily: 'monospace' }}>{halfPaidCount}</strong>
                    </span>
                    <span style={{ color: '#dc2626' }}>
                      غير مسدد: <strong style={{ fontFamily: 'monospace' }}>{unpaidCount}</strong>
                    </span>
                    <span style={{ color: '#0f172a' }}>
                      نسبة السداد: <strong style={{ fontFamily: 'monospace', color: '#059669' }}>{paymentRate}%</strong>
                    </span>
                  </div>
                  <span style={{ color: '#059669', fontWeight: '800' }}>نهاية القائمة الرسمية للفئة</span>
                </div>

                {/* Signatures */}
                <div style={{
                  borderTop: '1px solid #0f172a',
                  paddingTop: '1.5mm',
                  display: 'grid',
                  gridTemplateColumns: (isU9 && !squadName) ? '1fr 1fr 1fr' : '1fr 1fr',
                  gap: (isU9 && !squadName) ? '10mm' : '20mm',
                  textAlign: 'center',
                }}>
                  {(isU9 && !squadName) ? (
                    <>
                      <div>
                        <p style={{ fontWeight: '800', fontSize: '6.5pt', color: '#0f172a', margin: '0 0 1.5mm' }}>
                          توقيع مدرب الفوج 1 (U9 A)<br />
                          <span style={{ color: '#059669', fontWeight: '900' }}>ك. قسوم أشرف</span>
                        </p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '80px', margin: '0 auto' }}></div>
                      </div>
                      <div>
                        <p style={{ fontWeight: '800', fontSize: '6.5pt', color: '#0f172a', margin: '0 0 1.5mm' }}>
                          توقيع مدرب الفوج 2 (فئة U7)<br />
                          <span style={{ color: '#059669', fontWeight: '900' }}>ك. شوقي حيدر</span>
                        </p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '80px', margin: '0 auto' }}></div>
                      </div>
                      <div>
                        <p style={{ fontWeight: '800', fontSize: '6.5pt', color: '#0f172a', margin: '0 0 1.5mm' }}>
                          ختم ومصادقة الإدارة العامة<br />
                          <span style={{ color: '#059669', fontWeight: '900' }}>للأكاديمية</span>
                        </p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '80px', margin: '0 auto' }}></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p style={{ fontWeight: '800', fontSize: '6.6pt', color: '#0f172a', margin: '0 0 2mm' }}>
                          توقيع ومصادقة المدرب المشرف ({
                            squadName?.includes('1') || squadName?.includes('A') ? 'ك. قسوم أشرف' :
                            squadName?.includes('2') || squadName?.includes('B') || squadName?.includes('U7') ? 'ك. شوقي حيدر' :
                            (headCoach || 'المدرب المسؤول')
                          })
                        </p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '90px', margin: '0 auto' }}></div>
                      </div>
                      <div>
                        <p style={{ fontWeight: '800', fontSize: '6.6pt', color: '#0f172a', margin: '0 0 2mm' }}>
                          ختم ومصادقة الإدارة العامة للأكاديمية
                        </p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '90px', margin: '0 auto' }}></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '6.4pt', color: '#64748b', paddingTop: '1mm' }}>
                <span>(تُستكمل القائمة في الصفحة التالية...)</span>
              </div>
            )}

            {/* Bottom Footer line */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '1mm',
              marginTop: '1.5mm',
              fontSize: '6.2pt',
              color: '#94a3b8',
              flexShrink: 0
            }}>
              <span>{academyName} — قائمة لاعبي فئة {categoryName} (40 لاعب في الورقة)</span>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>صفحة {pageIdx + 1} من {totalPages}</span>
              <span>تاريخ الاستخراج: {today}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

