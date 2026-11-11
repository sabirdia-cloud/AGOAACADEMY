import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, CheckCircle, XCircle, Clock, Calendar, QrCode, Camera, MessageCircle, Wallet, Shirt, Bell, Radio, Smartphone, ScanLine, UserCheck, Filter, Phone, Cake, Users, Zap, Download, X, UserX, BarChart3 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useAuth } from "@/services/AuthContext";
import { QRScannerModal } from "@/components/QRScannerModal";
import { PrintPortal } from "@/components/PrintPortal";
import { AttendanceReportTemplate } from "@/components/PrintTemplates";
import { AdminScannerReportTemplate } from "@/components/AdminScannerReportTemplate";
import { LayoutDashboard, FileText, Printer, ChevronDown, ChevronUp, WifiOff, Wifi, RefreshCw } from "lucide-react";
import { pwaService } from "@/services/pwa";
import { cn } from "@/lib/utils";
import { supabase } from "@/services/supabaseClient";

export function Attendance() {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach';
  const [attendance, setAttendance] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [attendanceToDelete, setAttendanceToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scanner, setScanner] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isBarcodeMode, setIsBarcodeMode] = useState(false);
  const [academySettings, setAcademySettings] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{ 
    text: string, 
    type: 'success' | 'error' | 'info', 
    playerName?: string,
    isPaid?: boolean,
    hasKit?: boolean 
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterQrOpen, setIsFilterQrOpen] = useState(false);
  const [scannedPlayers, setScannedPlayers] = useState<Set<number>>(new Set());
  const [lastScannedId, setLastScannedId] = useState<number | null>(null);
  const processingRef = useRef<Set<number>>(new Set());
  const lastScanTimeRef = useRef<number>(0);

  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'log' | 'reports' | 'scanner'>('log');
  // Admin external scanner state
  const [adminScanLog, setAdminScanLog] = useState<Array<{
    id: number;
    player_id: number;
    name: string;
    birth_date: string;
    phone: string;
    category: string;
    team_name: string;
    check_in_time: string;
    date: string;
  }>>([]);
  const [adminScanMessage, setAdminScanMessage] = useState<{ text: string; type: 'success' | 'error' | 'info'; playerName?: string; } | null>(null);
  const [adminScanFilter, setAdminScanFilter] = useState({ category: '', team: '' });
  const adminBarcodeInputRef = useRef<HTMLInputElement>(null);
  const isAdminScannerActive = useRef(false);
  const [adminScanMode, setAdminScanMode] = useState<'external' | 'camera'>('external');
  const [adminCameraError, setAdminCameraError] = useState<string | null>(null);
  const adminCameraScannerRef = useRef<any>(null);
  const [adminScannerSubTab, setAdminScannerSubTab] = useState<'present' | 'absent' | 'summary'>('present');
  const [isAdminPrintModalOpen, setIsAdminPrintModalOpen] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());
  const [printData, setPrintData] = useState<{ training: any, players: any[], attendance: any[] } | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isNfcMode, setIsNfcMode] = useState(false);
  const [activeScanTab, setActiveScanTab] = useState<'camera' | 'nfc' | 'laser'>('camera');
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);
  const nfcCtrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
    return () => {
      if (nfcCtrlRef.current) {
        nfcCtrlRef.current.abort();
      }
    };
  }, []);

  const startNfcScan = async () => {
    if (!('NDEFReader' in window)) {
      setNfcError("تقنية NFC غير مدعومة في هذا الجهاز أو المتصفح. يرجى استخدام متصفح Chrome للأندرويد.");
      return;
    }

    try {
      setNfcError(null);
      setIsNfcScanning(true);
      
      const ndef = new (window as any).NDEFReader();
      nfcCtrlRef.current = new AbortController();
      
      await ndef.scan({ signal: nfcCtrlRef.current.signal });
      
      ndef.addEventListener("readingerror", () => {
        setScanMessage({ text: "فشل قراءة شريحة NFC. يرجى المحاولة مجدداً.", type: 'error' });
        playBeep('error');
      });
      
      ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
        let scannedText = "";
        
        if (message.records && message.records.length > 0) {
          for (const record of message.records) {
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder(record.encoding || "utf-8");
              scannedText = textDecoder.decode(record.data);
              break;
            }
          }
        }
        
        if (!scannedText && serialNumber) {
          scannedText = serialNumber;
        }

        if (scannedText) {
          onScanSuccessRef.current(scannedText);
        }
      });

    } catch (err: any) {
      console.error("NFC Scan Error:", err);
      setIsNfcScanning(false);
      if (err.name === 'NotAllowedError') {
        setNfcError("تم رفض إذن استخدام الـ NFC. يرجى تفعيل الإذن من إعدادات المتصفح.");
      } else {
        setNfcError(`خطأ في تشغيل NFC: ${err.message || err}`);
      }
    }
  };

  const stopNfcScan = () => {
    if (nfcCtrlRef.current) {
      nfcCtrlRef.current.abort();
      nfcCtrlRef.current = null;
    }
    setIsNfcScanning(false);
  };

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    // Check for offline data
    pwaService.getPendingAttendance().then(data => setOfflineCount(data.length));

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const syncNow = async () => {
    const success = await pwaService.syncOfflineData();
    if (success) {
        alert("تم مزامنة البيانات السابقة بنجاح!");
        await loadData();
        const pending = await pwaService.getPendingAttendance();
        setOfflineCount(pending.length);
    }
  };

  const playBeep = (type: 'success' | 'error' = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // E6
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } else {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        oscillator.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.2); // A2
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio Context not supported or interaction required");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Realtime subscription for attendance updates from coaches
  useEffect(() => {
    const channel = supabase
      .channel('admin-attendance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        api.getAttendance().then(data => setAttendance(data || []));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Use a ref for onScanSuccess so the scanner always calls the latest version
  const onScanSuccessRef = useRef<(text: string) => void>(() => { });

  useEffect(() => {
    if (editingAttendance) {
      setSelectedTrainingId(editingAttendance.training_id);
    }
  }, [editingAttendance]);

  useEffect(() => {
    if (isScannerOpen || isBarcodeMode) {
      setCameraError(null);

      // --- External Barcode Scanner Logic ---
      let buffer = '';
      let lastTime = Date.now();

      const handleKeyDown = (e: KeyboardEvent) => {
          // If focus is in an input field, don't intercept (unless it's our specific case)
          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
              return;
          }

          const currentTime = Date.now();
          
          // If the time between keystrokes is too long (> 150ms), it's probably manual typing
          // 150ms is better for 1D scanners like ZKB109
          if (currentTime - lastTime > 150) {
              buffer = '';
          }
          lastTime = currentTime;

          if (e.key === 'Enter') {
              if (buffer.length > 0) {
                  onScanSuccessRef.current(buffer);
                  buffer = '';
                  e.preventDefault();
              }
          } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
              buffer += e.key;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      // ----------------------------------------

      let newScanner: any = null;
      if (isScannerOpen) {
        newScanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        // Use ref wrapper so it always gets the latest callback
        newScanner.render((text: string) => onScanSuccessRef.current(text), (error: any) => {
          if (typeof error === 'string' && (error.includes("NotAllowedError") || error.includes("Permission denied"))) {
            setCameraError("تم رفض الإذن بالوصول إلى الكاميرا. يرجى تفعيل الإذن من إعدادات المتصفح.");
          }
        });
        setScanner(newScanner);
      }
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (newScanner) {
          newScanner.clear().catch((err: any) => console.error("Failed to clear scanner", err));
        }
      };
    }
  }, [isScannerOpen, isBarcodeMode]);

  // Admin scanner tab: handle external barcode scanner input
  const onAdminScanSuccessRef = useRef<(text: string) => void>(() => {});
  onAdminScanSuccessRef.current = (decodedText: string) => {
    const cleanText = decodedText.trim();
    if (!cleanText) return;

    const computeQR = (p: any): string => {
      if (p.qr_code) return p.qr_code;
      const idStr = String(p.player_id || "").padStart(5, '0');
      const dateStr = p.birth_date ? p.birth_date.split('-').reverse().join('') : '00000000';
      return idStr + dateStr;
    };

    const pByQR = players.find((p: any) => p.qr_code && p.qr_code === cleanText);
    const pByPREFIX = !pByQR && cleanText.startsWith("PLAYER:")
      ? players.find((p: any) => String(p.player_id) === cleanText.split(":")[1].replace(/\D/g, ''))
      : null;
    const pByURL = !pByQR && !pByPREFIX && cleanText.includes("/player/")
      ? players.find((p: any) => {
          const parts = cleanText.split("/player/")[1]?.split("/");
          const idPart = parts?.find((s: string) => /^\d+$/.test(s.replace(/\D/g, '')))?.replace(/\D/g, '');
          return idPart && String(p.player_id) === idPart;
        })
      : null;
    const pByComputed = !pByQR && !pByPREFIX && !pByURL ? players.find((p: any) => computeQR(p) === cleanText) : null;
    const pById = !pByQR && !pByPREFIX && !pByURL && !pByComputed && /^\d+$/.test(cleanText)
      ? players.find((p: any) => String(p.player_id) === cleanText)
      : null;

    const foundPlayer = pByQR || pByPREFIX || pByURL || pByComputed || pById;

    if (!foundPlayer) {
      setAdminScanMessage({ text: `❌ لم يتم التعرف على هذه البطاقة`, type: 'error' });
      playBeep('error');
      setTimeout(() => setAdminScanMessage(null), 2000);
      return;
    }

    // Check duplicate scan in current session
    const alreadyScanned = adminScanLog.some(entry => entry.player_id === foundPlayer.player_id);
    if (alreadyScanned) {
      setAdminScanMessage({ text: `⚠️ ${foundPlayer.name} مسجل مسبقاً في هذه الجلسة`, type: 'info', playerName: foundPlayer.name });
      playBeep('error');
      setTimeout(() => setAdminScanMessage(null), 2000);
      return;
    }

    const team = teams.find((t: any) => Number(t.team_id) === Number(foundPlayer.team_id));
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('ar-DZ');

    const newEntry = {
      id: Date.now(),
      player_id: foundPlayer.player_id,
      name: foundPlayer.name,
      birth_date: foundPlayer.birth_date || '',
      phone: foundPlayer.phone || '',
      category: foundPlayer.category || team?.category || '',
      team_name: team?.name || team?.team_name || '',
      check_in_time: checkInTime,
      date: dateStr,
    };

    setAdminScanLog(prev => [newEntry, ...prev]);
    setAdminScanMessage({ text: `✅ تم تسجيل حضور ${foundPlayer.name}`, type: 'success', playerName: foundPlayer.name });
    playBeep('success');
    setTimeout(() => setAdminScanMessage(null), 1500);

    // Focus back on the input
    setTimeout(() => adminBarcodeInputRef.current?.focus(), 100);
  };

  // Admin camera scanner lifecycle
  useEffect(() => {
    if (activeTab !== 'scanner' || adminScanMode !== 'camera') {
      // Cleanup camera if switching away
      if (adminCameraScannerRef.current) {
        adminCameraScannerRef.current.clear().catch(() => {});
        adminCameraScannerRef.current = null;
      }
      return;
    }

    setAdminCameraError(null);
    const scannerId = 'admin-qr-reader';

    // Small delay to ensure DOM element is rendered
    const timeout = setTimeout(() => {
      try {
        const newScanner = new Html5QrcodeScanner(
          scannerId,
          { fps: 10, qrbox: { width: 220, height: 220 } },
          false
        );
        newScanner.render(
          (text: string) => onAdminScanSuccessRef.current(text),
          (err: any) => {
            if (typeof err === 'string' && (err.includes('NotAllowedError') || err.includes('Permission denied'))) {
              setAdminCameraError('تم رفض الإذن بالوصول إلى الكاميرا. يرجى تفعيل الإذن من إعدادات المتصفح.');
            }
          }
        );
        adminCameraScannerRef.current = newScanner;
      } catch (e) {
        setAdminCameraError('فشل تشغيل الكاميرا. يرجى التحقق من الأذونات.');
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (adminCameraScannerRef.current) {
        adminCameraScannerRef.current.clear().catch(() => {});
        adminCameraScannerRef.current = null;
      }
    };
  }, [activeTab, adminScanMode]);

  // onScanSuccess – assigned to ref so scanner always uses the latest closure
  onScanSuccessRef.current = async (decodedText: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 500) return;

    // Compute the expected QR for matching players without a saved qr_code
    const computeQR = (p: any): string => {
      if (p.qr_code) return p.qr_code;
      const idStr = String(p.player_id || "").padStart(5, '0');
      const dateStr = p.birth_date ? p.birth_date.split('-').reverse().join('') : '00000000';
      return idStr + dateStr;
    };

    let playerId: number | null = null;
    const cleanText = decodedText.trim();

    // Try various matching strategies
    const pByQR = players.find(p => p.qr_code && p.qr_code === cleanText);
    
    const pByPREFIX = !pByQR && cleanText.startsWith("PLAYER:") 
      ? players.find(p => String(p.player_id) === cleanText.split(":")[1].replace(/\D/g, '')) 
      : null;
    
    const pByURL = !pByQR && !pByPREFIX && cleanText.includes("/player/")
      ? players.find(p => {
          const parts = cleanText.split("/player/")[1]?.split("/");
          const idPart = parts?.find(s => /^\d+$/.test(s.replace(/\D/g, '')))?.replace(/\D/g, '');
          return idPart && String(p.player_id) === idPart;
        })
      : null;

    const pByComputed = !pByQR && !pByPREFIX && !pByURL ? players.find(p => computeQR(p) === cleanText) : null;
    
    const foundPlayer = pByQR || pByPREFIX || pByURL || pByComputed;

    if (foundPlayer) {
      playerId = foundPlayer.player_id;
    } else if (/^\d+$/.test(cleanText)) {
      playerId = Number(cleanText);
    }

    if (!playerId || isNaN(playerId)) return;
    if (processingRef.current.has(playerId)) return;

    const targetTraining = selectedTrainingId
      ? trainings.find(t => Number(t.training_id) === Number(selectedTrainingId))
      : trainings[0];

    if (!targetTraining) {
      setScanMessage({ text: "يرجى اختيار حصة تدريبية أولاً", type: 'error' });
      return;
    }

    const player = players.find(p => Number(p.player_id) === Number(playerId));
    if (!player) {
      setScanMessage({ text: "هذا اللاعب غير موجود أو لا ينتمي لصلاحياتك", type: 'error' });
      playBeep('error');
      return;
    }

    if (Number(player.team_id) !== Number(targetTraining.team_id)) {
      setScanMessage({ text: "هذا اللاعب لا ينتمي للفئة المخصصة لهذه الحصة", type: 'error' });
      playBeep('error');
      return;
    }

    const isAlreadyInDatabase = attendance.some(
      record => Number(record.player_id) === Number(playerId) && Number(record.training_id) === Number(targetTraining.training_id)
    );

    if (isAlreadyInDatabase) {
      processingRef.current.add(playerId);
      setScanMessage({ text: `اللاعب مسجل مسبقاً في هذا التدريب`, type: 'info' });
      playBeep('error');
      setTimeout(() => setScanMessage(null), 3000);
      return;
    }

    const attendanceData = {
      training_id: targetTraining.training_id,
      player_id: playerId,
      status: "حاضر",
      check_in_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      notes: "تم التحضير عبر QR Code",
    };

    lastScanTimeRef.current = now;
    processingRef.current.add(playerId);
    setLastScannedId(playerId);

    try {
      // Optimistic UI Update for maximum speed
      setAttendance(prev => [...prev, { ...attendanceData, attendance_id: Date.now() }]);
      setScannedPlayers(prev => new Set(prev).add(playerId!));
      playBeep('success');

      // Financial & Kit Quick-Check
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const hasPaid = payments.some(p => 
        Number(p.player_id) === Number(playerId) && 
        p.month === currentMonth && 
        p.year === currentYear && 
        p.status === 'paid'
      );
      const hasKit = kits.some(k => Number(k.player_id) === Number(playerId) && k.status === 'delivered');

      if (isOffline) {
        pwaService.saveAttendanceOffline([attendanceData]).catch(console.error);
        setOfflineCount(prev => prev + 1);
        setScanMessage({ 
          text: `تم الحفظ أوفلاين ${player.name}`, 
          type: 'success', 
          playerName: player.name,
          isPaid: hasPaid,
          hasKit: hasKit
        });
      } else {
        setScanMessage({ 
          text: `تم تسجيل حضور ${player.name} بنجاح`, 
          type: 'success', 
          playerName: player.name,
          isPaid: hasPaid,
          hasKit: hasKit
        });
        
        // Background sync without blocking the next scan
        api.addAttendance(attendanceData).then(async () => {
          const msg = `تنبيه: تم تسجيل حضور اللاعب ${player.name} في حصة تدريب يوم ${targetTraining.date}.`;
          api.notifyParentOfPlayer(playerId!, msg).catch(console.error);
          
          // Additional WhatsApp Alert if enabled
          if (academySettings?.notify_whatsapp) {
            const waMsg = `✅ *تم تسجيل الحضور*\nاللاعب: ${player.name}\nالحصة: ${targetTraining.date}\nالوقت: ${attendanceData.check_in_time}`;
            await api.sendWhatsAppNotification(player.phone, waMsg);
          }
        }).catch(async (error: any) => {
          if (error.message === 'Failed to fetch' || !navigator.onLine) {
            await pwaService.saveAttendanceOffline([attendanceData]);
            setOfflineCount(prev => prev + 1);
          } else {
            console.error("Failed to sync attendance in background:", error);
          }
        });
      }

      // Fast message clear to allow rapid scanning visual feedback
      setTimeout(() => setScanMessage(null), 1000);
    } catch (error: any) {
      processingRef.current.delete(playerId);
      setScanMessage({ text: `فشل في تسجيل الحضور: ${error.message || ''}`, type: 'error' });
      setTimeout(() => setScanMessage(null), 1500);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [attendanceData, trainingsData, playersData, teamsData, settingsData, coachesData, paymentsData, kitsData] = await Promise.all([
        api.getAttendance(),
        api.getTrainings(),
        api.getPlayers(),
        api.getTeams(),
        api.getAcademySettings(),
        api.getCoaches(),
        api.getPayments(),
        api.getKits()
      ]);

      setTeams(teamsData || []);
      setCoaches(coachesData || []);
      setPayments(paymentsData || []);
      setKits(kitsData || []);
      setAcademySettings(settingsData);

      if (user?.role === 'coach' && user?.coach_id) {
        // STRICT MATCHING: Find teams explicitly assigned to this coach (فوج المدرب فقط)
        let coachTeams = (teamsData || []).filter((t: any) =>
          Number(t.coach_id) === Number(user.coach_id) ||
          (user.team_id && Number(t.team_id) === Number(user.team_id))
        );
        if (coachTeams.length === 0 && user.category) {
          coachTeams = (teamsData || []).filter((t: any) =>
            t.category === user.category && (!t.coach_id || Number(t.coach_id) === Number(user.coach_id))
          );
        }
        const coachTeamIds = coachTeams.map((t: any) => Number(t.team_id));

        if (coachTeamIds.length === 0) {
          setPlayers([]);
          setTrainings([]);
          setAttendance([]);
        } else {
          // STRICT PLAYERS: Only players in this coach's specific team/squad (فوج)
          const filteredPlayers = (playersData || []).filter((p: any) =>
            p.team_id && coachTeamIds.includes(Number(p.team_id))
          );
          const filteredPlayerIds = filteredPlayers.map((p: any) => Number(p.player_id));

          const filteredTrainings = (trainingsData || []).filter((t: any) => coachTeamIds.includes(Number(t.team_id)));
          const filteredAttendance = (attendanceData || []).filter((a: any) =>
            filteredPlayerIds.includes(Number(a.player_id))
          );

          setPlayers(filteredPlayers);
          setTrainings(filteredTrainings);
          setAttendance(filteredAttendance);
          setTeams(coachTeams);
        }
      } else {
        setPlayers(playersData || []);
        setTrainings(trainingsData || []);
        setAttendance(attendanceData || []);
        setTeams(teamsData || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      // Don't crash — just keep empty state
      setPlayers([]);
      setTrainings([]);
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleAddAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const checkInTime = formData.get("check_in_time") as string;
    const trainingId = Number(formData.get("training_id"));
    const playerId = Number(formData.get("player_id"));

    // Final validation
    const training = trainings.find(t => Number(t.training_id) === Number(trainingId));
    const player = players.find(p => Number(p.player_id) === Number(playerId));

    if (training && player && Number(player.team_id) !== Number(training.team_id)) {
      alert("خطأ: اللاعب لا ينتمي للفئة المخصصة لهذه الحصة التدريبية");
      return;
    }

    const attendanceData = {
      training_id: trainingId,
      player_id: playerId,
      status: formData.get("status") as string,
      check_in_time: checkInTime || null,
      notes: formData.get("notes") as string,
    };

    try {
      if (editingAttendance) {
        await api.updateAttendance(editingAttendance.attendance_id, attendanceData);
      } else if (isOffline) {
        await pwaService.saveAttendanceOffline([attendanceData]);
        setOfflineCount(prev => prev + 1);
        alert("تم الحفظ في الذاكرة المؤقتة (أوفلاين). سيتم الرفع تلقائياً عند توفر الإنترنت.");
      } else {
        await api.addAttendance(attendanceData);
        // Notify parent asynchronously (on both updates and new)
        if (player && training) {
          const msg = attendanceData.status === 'غائب' 
            ? `⚠️ تنبيه غياب: اللاعب ${player.name} غائب عن حصة التدريب بتاريخ ${training.date}.`
            : `تنبيه: تم تسجيل حضور اللاعب ${player.name} (بشكل يدوي) في حصة تدريب يوم ${training.date}. الحالة: ${attendanceData.status}`;
          
          api.notifyParentOfPlayer(playerId, msg, attendanceData.status === 'غائب' ? 'تنبيه غياب' : 'عام').catch(console.error);
        }
      }

      await loadData();
      setIsModalOpen(false);
      setEditingAttendance(null);
      setSelectedTrainingId(null);
    } catch (error: any) {
      if (!editingAttendance && (error.message === 'Failed to fetch' || !navigator.onLine)) {
        await pwaService.saveAttendanceOffline([attendanceData]);
        setOfflineCount(prev => prev + 1);
        alert("تم الحفظ أوفلاين (انقطع الاتصال)");
        setIsModalOpen(false);
        setEditingAttendance(null);
      } else {
        console.error("Failed to save attendance:", error);
        alert(`خطأ في الحفظ: ${error.message || 'يرجى مراجعة قاعدة البيانات'}`);
      }
    }
  };

  const handleFinalizeAttendance = async () => {
    if (scannedPlayers.size === 0) {
      setIsScannerOpen(false);
      return;
    }

    const confirmed = window.confirm("هل تريد إنهاء عملية المسح وإرسال تقرير الحضور النهائي للإدارة؟");
    if (!confirmed) return;

    try {
      const training = trainings.find(t => Number(t.training_id) === Number(selectedTrainingId));
      const team = teams.find(t => Number(t.team_id) === Number(training?.team_id));
      
      const reportMsg = `📊 تقرير حضور حصة تدريبية:\nالتاريخ: ${training?.date}\nالفئة: ${team?.category || 'غير محددة'}\nالفوج: ${team?.team_name || 'غير محدد'}\nعدد الحاضرين: ${scannedPlayers.size}\nالموقع: ${training?.location || 'غير محدد'}`;

      await api.addAcademyNotification({
        recipient_role: 'admin',
        title: 'تقرير حضور حصة تدريبية 📋',
        message: reportMsg,
        data: {
          training_id: selectedTrainingId,
          scanned_count: scannedPlayers.size,
          date: training?.date
        },
        created_at: new Date().toISOString()
      });

      alert("✅ تم إرسال تقرير الحضور للإدارة بنجاح. يمكنهم الآن معاينته وطباعته.");
      
      setIsScannerOpen(false);
      setScannedPlayers(new Set());
      setScanMessage(null);
      processingRef.current.clear();
      loadData();
    } catch (error: any) {
      console.error("Failed to send report:", error);
      alert("⚠️ فشل إرسال التقرير للإدارة. يرجى التأكد من الاتصال بالإنترنت.");
    }
  };

  const handleDeleteAttendance = async (id: number) => {
    setAttendanceToDelete(id);
    setIsConfirmOpen(true);
  };

  const notifyAbsences = async (trainingId: number) => {
    const sessionPlayers = getSessionAbsences(trainingId);
    const absences = sessionPlayers.filter(p => p.status === 'غائب');
    
    if (absences.length === 0) {
      alert("لا يوجد غيابات مسجلة في هذه الحصة.");
      return;
    }

    if (!window.confirm(`هل أنت متأكد من إرسال تنبيهات غياب (WhatsApp) لـ ${absences.length} لاعبين؟`)) return;

    let successCount = 0;
    for (const player of absences) {
      const msg = `⚠️ تنبيه غياب: نحيطكم علماً أن اللاعب ${player.name} لم يحضر الحصة التدريبية المبرمجة بتاريخ ${player.date || ''}. يرجى توضيح سبب الغياب للإدارة.`;
      try {
        await api.notifyParentOfPlayer(player.player_id, msg, 'تنبيه غياب');
        successCount++;
      } catch (e) {
        console.error(`Failed to notify ${player.name}:`, e);
      }
    }

    alert(`✅ تم إرسال ${successCount} تنبيهات بنجاح.`);
  };

  const confirmDelete = async () => {
    if (attendanceToDelete) {
      setIsDeleting(true);
      try {
        await api.deleteAttendance(attendanceToDelete);
        await loadData();
        setIsConfirmOpen(false);
      } catch (error) {
        console.error("Failed to delete attendance:", error);
      } finally {
        setIsDeleting(false);
        setAttendanceToDelete(null);
      }
    }
  };

  const getPlayerName = (id: number) => {
    const player = players.find(p => Number(p.player_id) === Number(id));
    return player ? player.name : "غير محدد";
  };

  const getTrainingInfo = (id: number) => {
    const training = trainings.find(t => Number(t.training_id) === Number(id));
    if (!training) return "غير محدد";
    const team = teams.find(t => Number(t.team_id) === Number(training.team_id));
    return `${training.date} - ${team?.category || training.category || 'فئة'} (${team?.team_name || 'فوج'}) - ${training.location}`;
  };

  const getFilteredPlayersForModal = () => {
    if (!selectedTrainingId) return [];
    const training = trainings.find(t => Number(t.training_id) === Number(selectedTrainingId));
    if (!training) return [];
    const team = teams.find(t => Number(t.team_id) === Number(training.team_id));
    const cat = team?.category || training.category;
    return players.filter(p => 
      (training.team_id && Number(p.team_id) === Number(training.team_id)) ||
      (cat && p.category === cat)
    );
  };

  const getSessionAbsences = (trainingId: number) => {
    const training = trainings.find(t => Number(t.training_id) === Number(trainingId));
    if (!training) return [];
    const team = teams.find(t => Number(t.team_id) === Number(training.team_id));
    const trainingCategory = team?.category || training.category;

    // All attendance records saved for this specific session
    const sessionAttendance = attendance.filter(a => Number(a.training_id) === Number(trainingId));
    const attendanceMap = new Map(sessionAttendance.map(a => [Number(a.player_id), a]));

    // All players belonging to this training:
    // Either having a saved attendance record, OR matching team_id, OR matching category
    const sessionPlayers = players.filter(p => {
      const pid = Number(p.player_id);
      if (attendanceMap.has(pid)) return true;
      if (training.team_id && Number(p.team_id) === Number(training.team_id)) return true;
      if (trainingCategory && p.category === trainingCategory) return true;
      return false;
    });

    return sessionPlayers.map(player => {
      const record = attendanceMap.get(Number(player.player_id));
      return {
        ...player,
        status: record ? record.status : "غائب",
        check_in_time: record ? (record.check_in_time || record.time_recorded) : null,
        notes: record ? record.notes : ""
      };
    });
  };

  const toggleSessionExpand = (id: number) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredAttendance = attendance.filter(a => {
    const player = players.find(p => Number(p.player_id) === Number(a.player_id));
    const playerName = player ? player.name.toLowerCase() : "غير محدد";
    const s = searchTerm.toLowerCase();
    return playerName.includes(s) ||
      String(a.player_id).includes(searchTerm) ||
      (player?.qr_code || "").includes(searchTerm) ||
      (player?.father_name || "").toLowerCase().includes(s);
  });

  // Player Attendance & Absence Historical Stats calculation
  const getPlayerAttendanceStats = (playerId: number) => {
    const playerRecords = attendance.filter(a => Number(a.player_id) === Number(playerId));
    const present = playerRecords.filter(a => a.status === 'حاضر' || a.status === 'present').length;
    const absent = playerRecords.filter(a => a.status === 'غائب' || a.status === 'absent').length;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { present, absent, rate, total };
  };

  // Scanned players set
  const scannedPlayerIdsSet = new Set(adminScanLog.map(e => Number(e.player_id)));

  // Categories with at least one scan
  const scannedCategoriesList = [...new Set(adminScanLog.map(e => e.category).filter(Boolean))];

  // All academy categories for filter dropdown
  const allAcademyCategories = [...new Set([
    ...adminScanLog.map(e => e.category),
    ...players.map(p => p.category)
  ])].filter(Boolean);

  // Relevant categories for absence and stats
  const relevantCategories = adminScanFilter.category
    ? [adminScanFilter.category]
    : scannedCategoriesList.length > 0
    ? scannedCategoriesList
    : allAcademyCategories;

  // Filter absent players
  const absentPlayersList = players.filter((player: any) => {
    const pid = Number(player.player_id);
    if (scannedPlayerIdsSet.has(pid)) return false;

    const team = teams.find((t: any) => Number(t.team_id) === Number(player.team_id));
    const playerCat = player.category || team?.category || '';
    const playerTeamName = team?.name || team?.team_name || player.team_name || '';

    if (adminScanFilter.category && playerCat !== adminScanFilter.category) return false;
    if (!adminScanFilter.category && scannedCategoriesList.length > 0 && !scannedCategoriesList.includes(playerCat)) return false;
    if (adminScanFilter.team && playerTeamName !== adminScanFilter.team) return false;

    return true;
  }).map((player: any) => {
    const team = teams.find((t: any) => Number(t.team_id) === Number(player.team_id));
    return {
      player_id: player.player_id,
      name: player.name,
      birth_date: player.birth_date || '',
      phone: player.phone || '',
      category: player.category || team?.category || 'غير محدد',
      team_name: team?.name || team?.team_name || player.team_name || 'غير محدد',
      stats: getPlayerAttendanceStats(player.player_id)
    };
  });

  // Group absent players by category
  const absentPlayersByCategory: Record<string, typeof absentPlayersList> = {};
  absentPlayersList.forEach(p => {
    const cat = p.category || 'غير محدد';
    if (!absentPlayersByCategory[cat]) absentPlayersByCategory[cat] = [];
    absentPlayersByCategory[cat].push(p);
  });

  // Present players with full stats
  const presentPlayersWithStats = adminScanLog.map(entry => ({
    ...entry,
    stats: getPlayerAttendanceStats(entry.player_id)
  }));

  // Filter present players based on admin filter
  const filteredPresentPlayers = presentPlayersWithStats.filter(entry => {
    if (adminScanFilter.category && entry.category !== adminScanFilter.category) return false;
    if (adminScanFilter.team && entry.team_name !== adminScanFilter.team) return false;
    return true;
  });

  // Category stats summary
  const categoryStatsList = relevantCategories.map(cat => {
    const presentInCat = adminScanLog.filter(e => e.category === cat).length;
    const absentInCat = (absentPlayersByCategory[cat] || []).length;
    const totalInCat = presentInCat + absentInCat;
    const rate = totalInCat > 0 ? Math.round((presentInCat / totalInCat) * 100) : 0;
    return {
      category: cat,
      present: presentInCat,
      absent: absentInCat,
      total: totalInCat,
      rate
    };
  });

  const totalPresentCount = adminScanLog.length;
  const totalAbsentCount = absentPlayersList.length;
  const totalSessionPlayers = totalPresentCount + totalAbsentCount;
  const sessionAttendanceRate = totalSessionPlayers > 0 ? Math.round((totalPresentCount / totalSessionPlayers) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">تحضير اللاعبين</h2>
          <p className="text-zinc-400 mt-1 text-sm">
            {user?.role === 'coach' ? 'تسجيل حضور لاعبي فوجهك فقط.' : 'تسجيل حضور وغياب اللاعبين في الحصص التدريبية.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isCoach && (
            <>
              <Button 
                onClick={() => { 
                  setSelectedTrainingId(trainings[0]?.training_id || null); 
                  setIsScannerOpen(true); 
                  setIsBarcodeMode(false);
                  setIsNfcMode(false);
                  setActiveScanTab('camera');
                  stopNfcScan();
                }} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto font-black shadow-lg shadow-emerald-950/20"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                بوابة الحضور الذكي بالهاتف
              </Button>
              <Button 
                onClick={() => { 
                  setEditingAttendance(null); 
                  setSelectedTrainingId(null); 
                  setIsModalOpen(true); 
                }} 
                className="bg-zinc-800 hover:bg-zinc-700 text-white w-full sm:w-auto font-bold"
              >
                <Plus className="mr-2 h-4 w-4" />
                تحضير يدوي
              </Button>
            </>
          )}
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 gap-2 pb-2 sm:pb-0">
          <div className="flex flex-wrap">
            <button
              onClick={() => {
                setActiveTab('log');
                loadData();
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'log' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
            >
              <LayoutDashboard className="h-4 w-4 inline mr-2" />
              سجل الحضور العام
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                loadData();
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'reports' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              تقارير الحصص (بالفئة)
            </button>
            <button
              onClick={() => {
                setActiveTab('scanner');
                loadData();
                setTimeout(() => adminBarcodeInputRef.current?.focus(), 300);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'scanner' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
            >
              <ScanLine className="h-4 w-4 inline mr-2" />
              بوابة الماسح الخارجي
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-8 border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50 text-xs gap-1.5 self-end sm:self-center"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            تحديث
          </Button>
        </div>
      )}

      {activeTab === 'log' ? (
        <>
          {(isOffline || offlineCount > 0) && (
            <div className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-500 ${
              isOffline ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isOffline ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                }`}>
                  {isOffline ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isOffline ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {isOffline ? 'أنت تعمل حالياً بدون إنترنت' : 'تم استعادة الاتصال بالإنترنت'}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-bold">
                    {offlineCount > 0 
                      ? `هناك ${offlineCount} سجلات حضور مخزنة محلياً بانتظار الرفع.` 
                      : 'سيتم حفظ أي حضور تسجله الآن محلياً ورفعه لاحقاً.'}
                  </p>
                </div>
              </div>
              {!isOffline && offlineCount > 0 && (
                <Button onClick={syncNow} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6">
                  مزامنة البيانات الآن
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/40 p-3 sm:p-4 rounded-xl border border-zinc-800/50 mt-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="بحث في سجلات الحضور (اسم اللاعب أو QR)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-10 pl-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFilterQrOpen(true)} className="h-10 border-zinc-800 text-zinc-400 hover:text-emerald-500">
                <QrCode className="h-4 w-4 mr-2" />
                بحث بالماسح
              </Button>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950/50 border border-zinc-800 rounded-lg text-[10px] text-zinc-500">
                إجمالي السجلات: {filteredAttendance.length}
              </div>
            </div>
          </div>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-0">
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-zinc-800/50">
                {isLoading ? (
                  <div className="py-10 text-center text-zinc-500">جاري التحميل...</div>
                ) : filteredAttendance.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500">لا توجد سجلات تطابق البحث</div>
                ) : filteredAttendance.map((record) => (
                  <div key={record.attendance_id} className="p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-50">{getPlayerName(record.player_id)}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">{getTrainingInfo(record.training_id)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${record.status === 'حاضر' ? 'bg-emerald-500/10 text-emerald-400' :
                          record.status === 'غائب' ? 'bg-rose-500/10 text-rose-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>{record.status}</span>
                        <span className="text-xs text-zinc-500" dir="ltr">{record.check_in_time || '--:--'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingAttendance(record); setIsModalOpen(true); }} className="text-zinc-400 hover:text-emerald-500 h-8 px-2 text-xs">تعديل</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAttendance(record.attendance_id)} className="text-zinc-400 hover:text-rose-500 h-8 px-2 text-xs">حذف</Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="text-xs text-zinc-400 bg-zinc-950/50 border-b border-zinc-800/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">اللاعب</th>
                      <th className="px-6 py-4 font-medium">التدريب / الفئة</th>
                      <th className="px-6 py-4 font-medium">وقت الحضور</th>
                      <th className="px-6 py-4 font-medium">الحالة</th>
                      <th className="px-6 py-4 font-medium">ملاحظات</th>
                      <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {isLoading ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">جاري التحميل...</td></tr>
                    ) : filteredAttendance.map((record) => (
                      <tr key={record.attendance_id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-50">{getPlayerName(record.player_id)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{getTrainingInfo(record.training_id)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-300" dir="ltr">{record.check_in_time || '--:--'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${record.status === 'حاضر' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20' :
                            record.status === 'غائب' ? 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20'
                            }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-400">{record.notes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingAttendance(record); setIsModalOpen(true); }} className="text-zinc-400 hover:text-emerald-500">تعديل</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAttendance(record.attendance_id)} className="text-zinc-400 hover:text-rose-500">حذف</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Admin External Scanner Tab */}
      {activeTab === 'scanner' && user?.role === 'admin' && (
        <div className="space-y-4 mt-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-zinc-900/60 border border-blue-800/30 rounded-2xl">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <ScanLine className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-50">بوابة الماسح الخارجي للإدارة</h3>
                <p className="text-xs text-zinc-400 mt-0.5">مرر بطاقة اللاعب على الماسح أو الكاميرا لتسجيل الحضور فورياً، مع كشف الغائبين وإحصائيات الحضور الكاملة.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-bold text-blue-400">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                LIVE
              </span>
              <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-400">
                {totalPresentCount} حاضر
              </span>
              <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs font-bold text-rose-400">
                {totalAbsentCount} غائب
              </span>
              <span className="px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-full text-xs font-bold text-zinc-300">
                %{sessionAttendanceRate} نسبة الحضور
              </span>

              {/* Header Print Button */}
              <Button
                onClick={() => setIsAdminPrintModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/30 transition-all active:scale-95"
              >
                <Printer className="h-4 w-4" />
                طباعة كشف الحضور والغياب
              </Button>
            </div>
          </div>

          {/* Scanner Input + Live Data */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Scanner Controls Column */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAdminScanMode('external');
                    setAdminCameraError(null);
                    setTimeout(() => adminBarcodeInputRef.current?.focus(), 300);
                  }}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all',
                    adminScanMode === 'external'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  ماسح خارجي
                </button>
                <button
                  type="button"
                  onClick={() => setAdminScanMode('camera')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all',
                    adminScanMode === 'camera'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  <Camera className="h-3.5 w-3.5" />
                  كاميرا الحاسوب
                </button>
              </div>

              {/* External Scanner Mode */}
              {adminScanMode === 'external' && (
                <div className="p-5 bg-zinc-900/60 border-2 border-dashed border-blue-500/30 rounded-2xl flex flex-col items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Zap className="h-7 w-7 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-200">الماسح الخارجي متصل وجاهز</p>
                    <p className="text-xs text-zinc-500 mt-1">مرر البطاقة على الجهاز وسيتم التسجيل والحساب تلقائياً</p>
                  </div>
                  <input
                    ref={adminBarcodeInputRef}
                    type="text"
                    autoFocus
                    placeholder="انتظار قراءة البطاقة..."
                    className="w-full text-center bg-zinc-950 border border-blue-500/40 rounded-xl py-3 px-4 text-blue-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-zinc-600"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim();
                        if (value) {
                          onAdminScanSuccessRef.current(value);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const target = e.target;
                      setTimeout(() => target.focus(), 300);
                    }}
                  />
                </div>
              )}

              {/* Camera Mode */}
              {adminScanMode === 'camera' && (
                <div className="bg-zinc-900/60 border-2 border-dashed border-blue-500/30 rounded-2xl overflow-hidden">
                  {adminCameraError ? (
                    <div className="p-6 flex flex-col items-center gap-3 text-center">
                      <XCircle className="h-10 w-10 text-rose-400" />
                      <p className="text-xs text-rose-400 font-bold">{adminCameraError}</p>
                      <button
                        onClick={() => { setAdminCameraError(null); setAdminScanMode('external'); setTimeout(() => setAdminScanMode('camera'), 100); }}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div id="admin-qr-reader" className="w-full" />
                      {/* Overlay corners */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                        <div className="w-44 h-44 border-2 border-blue-500/40 rounded-2xl relative">
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-scanner-line"></div>
                        </div>
                      </div>
                      <p className="text-center text-[10px] text-zinc-500 py-2 border-t border-zinc-800/50">وجّه الكاميرا نحو بطاقة QR أو الباركود</p>
                    </div>
                  )}
                </div>
              )}

              {/* Scan Result Feedback */}
              {adminScanMessage && (
                <div className={`p-4 rounded-xl border animate-in zoom-in duration-300 ${
                  adminScanMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : adminScanMessage.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/20'
                    : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    {adminScanMessage.type === 'success' ? (
                      <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                    ) : adminScanMessage.type === 'error' ? (
                      <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
                    ) : (
                      <Clock className="h-6 w-6 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p className={`font-bold text-sm ${
                        adminScanMessage.type === 'success' ? 'text-emerald-400'
                        : adminScanMessage.type === 'error' ? 'text-rose-400'
                        : 'text-amber-400'
                      }`}>{adminScanMessage.text}</p>
                      {adminScanMessage.playerName && (
                        <p className="text-xs text-zinc-400 mt-0.5">{adminScanMessage.playerName}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Finish Scanning & Print Prompt Box */}
              {adminScanLog.length > 0 && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      الانتهاء من المسح
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {adminScanLog.length} مسجل • {totalAbsentCount} غائب
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    عند الانتهاء من فحص جميع اللاعبين، اضغط أدناه لمعاينة كشف الحضور والغياب مع جميع تفاصيل اللاعبين وطباعته رسمياً.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsAdminPrintModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <Printer className="h-4 w-4" />
                    إنهاء المسح والطباعة الآن
                  </Button>
                </div>
              )}

              {/* Clear Log Button */}
              {adminScanLog.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('هل تريد مسح سجل هذه الجلسة والبدء من جديد؟')) {
                      setAdminScanLog([]);
                    }
                  }}
                  className="w-full py-2 px-4 rounded-xl border border-rose-500/20 text-rose-400 text-xs font-bold hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="h-3.5 w-3.5" />
                  مسح سجل الجلسة ({adminScanLog.length})
                </button>
              )}
            </div>

            {/* Results Column (Present / Absent / Category Summary) */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              {/* Filters */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <select
                    value={adminScanFilter.category}
                    onChange={(e) => setAdminScanFilter(prev => ({ ...prev, category: e.target.value, team: '' }))}
                    className="h-9 w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">كل الفئات ({allAcademyCategories.length})</option>
                    {allAcademyCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <select
                    value={adminScanFilter.team}
                    onChange={(e) => setAdminScanFilter(prev => ({ ...prev, team: e.target.value }))}
                    className="h-9 w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">كل الأفواج</option>
                    {[...new Set(
                      teams
                        .filter((t: any) => !adminScanFilter.category || t.category === adminScanFilter.category)
                        .map((t: any) => t.team_name || t.name)
                    )].filter(Boolean).map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub-Tabs Switcher */}
              <div className="flex items-center justify-between p-1 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAdminScannerSubTab('present')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      adminScannerSubTab === 'present'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    الحاضرون ({filteredPresentPlayers.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminScannerSubTab('absent')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      adminScannerSubTab === 'absent'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    <UserX className="h-3.5 w-3.5" />
                    الغائبون في كل فئة ({absentPlayersList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminScannerSubTab('summary')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      adminScannerSubTab === 'summary'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    إحصائيات الفئات
                  </button>
                </div>

                {/* Print Shortcut Button */}
                <button
                  type="button"
                  onClick={() => setIsAdminPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-bold transition-all shrink-0 ml-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  طباعة
                </button>
              </div>

              {/* View 1: Present Players Table */}
              {adminScannerSubTab === 'present' && (
                <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden">
                  {filteredPresentPlayers.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="h-14 w-14 rounded-full bg-zinc-800/50 flex items-center justify-center">
                        <ScanLine className="h-7 w-7 text-zinc-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-500">في انتظار أول مسح</p>
                        <p className="text-xs text-zinc-600 mt-1">مرر بطاقة لاعب على الماسح الخارجي أو الكاميرا لبدء التسجيل</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2.5 border-b border-zinc-800/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {filteredPresentPlayers.length} حاضر
                          {(adminScanFilter.category || adminScanFilter.team) && ` (مفلتر من ${adminScanLog.length})`}
                        </span>
                        {(adminScanFilter.category || adminScanFilter.team) && (
                          <button
                            onClick={() => setAdminScanFilter({ category: '', team: '' })}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                          >
                            <X className="h-3 w-3" /> إزالة الفلتر
                          </button>
                        )}
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm text-right">
                          <thead className="text-[10px] text-zinc-500 bg-zinc-950/50 border-b border-zinc-800/50 uppercase tracking-wide">
                            <tr>
                              <th className="px-3 py-3 font-medium text-center">#</th>
                              <th className="px-4 py-3 font-medium">اسم اللاعب</th>
                              <th className="px-3 py-3 font-medium text-center">تاريخ الميلاد</th>
                              <th className="px-3 py-3 font-medium text-center">هاتف الولي</th>
                              <th className="px-3 py-3 font-medium text-center">الفئة</th>
                              <th className="px-3 py-3 font-medium text-center">الفوج</th>
                              <th className="px-3 py-3 font-medium text-center">توقيت الحضور</th>
                              <th className="px-4 py-3 font-medium text-center bg-zinc-950/70">سجل الحضور والغياب</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/30">
                            {filteredPresentPlayers.map((entry, idx) => (
                              <tr key={entry.id} className="hover:bg-zinc-800/20 transition-colors animate-in fade-in duration-300">
                                <td className="px-3 py-3 text-zinc-600 font-mono text-xs text-center">{filteredPresentPlayers.length - idx}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                      <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                                    </div>
                                    <span className="font-semibold text-zinc-50 text-sm">{entry.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1 text-zinc-400 text-xs">
                                    <Cake className="h-3 w-3 text-zinc-600 shrink-0" />
                                    <span dir="ltr">{entry.birth_date || '—'}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Phone className="h-3 w-3 text-zinc-600 shrink-0" />
                                    <span className="text-zinc-300 text-xs font-mono" dir="ltr">{entry.phone || '—'}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold border border-indigo-500/20">
                                    {entry.category || '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full text-[10px] font-bold border border-violet-500/20">
                                    {entry.team_name || '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Clock className="h-3 w-3 text-emerald-500 shrink-0" />
                                    <span className="text-emerald-400 text-xs font-black font-mono" dir="ltr">{entry.check_in_time}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      حضور: {entry.stats?.present ?? 0}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                      غياب: {entry.stats?.absent ?? 0}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="sm:hidden divide-y divide-zinc-800/30">
                        {filteredPresentPlayers.map((entry) => (
                          <div key={entry.id} className="p-3 flex items-start gap-3 animate-in fade-in duration-300">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <UserCheck className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-zinc-50 text-sm truncate">{entry.name}</p>
                                <span className="text-emerald-400 text-xs font-black font-mono shrink-0" dir="ltr">{entry.check_in_time}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-bold">{entry.category || '—'}</span>
                                <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 rounded text-[10px] font-bold">{entry.team_name || '—'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-2">
                                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                  <span className="flex items-center gap-1"><Cake className="h-2.5 w-2.5" /> <span dir="ltr">{entry.birth_date || '—'}</span></span>
                                  <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> <span dir="ltr">{entry.phone || '—'}</span></span>
                                </div>
                                <div className="flex items-center gap-1 text-[9px]">
                                  <span className="text-emerald-400 font-bold">ح: {entry.stats?.present ?? 0}</span>
                                  <span className="text-zinc-600">|</span>
                                  <span className="text-rose-400 font-bold">غ: {entry.stats?.absent ?? 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* View 2: Absent Players Grouped by Category */}
              {adminScannerSubTab === 'absent' && (
                <div className="space-y-3">
                  {absentPlayersList.length === 0 ? (
                    <div className="p-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-black text-emerald-400">حضور كامل! لا يوجد غائبون</h4>
                      <p className="text-xs text-zinc-400 mt-1">جميع اللاعبين المسجلين في هذه الفئات قد تم مسح بطاقاتهم بنجاح.</p>
                    </div>
                  ) : (
                    Object.entries(absentPlayersByCategory).map(([catName, pList]) => {
                      if (pList.length === 0) return null;
                      return (
                        <div key={catName} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden">
                          {/* Category Header */}
                          <div className="px-4 py-2.5 bg-gradient-to-r from-rose-950/30 to-zinc-950/40 border-b border-rose-900/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                              <span className="text-xs font-black text-zinc-200">فئة {catName}</span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              {pList.length} لاعب غائب
                            </span>
                          </div>

                          {/* Desktop Table */}
                          <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm text-right">
                              <thead className="text-[10px] text-zinc-500 bg-zinc-950/50 border-b border-zinc-800/50 uppercase tracking-wide">
                                <tr>
                                  <th className="px-3 py-2.5 font-medium text-center">#</th>
                                  <th className="px-4 py-2.5 font-medium">اسم اللاعب</th>
                                  <th className="px-3 py-2.5 font-medium text-center">تاريخ الميلاد</th>
                                  <th className="px-3 py-2.5 font-medium text-center">هاتف الولي للتواصل</th>
                                  <th className="px-3 py-2.5 font-medium text-center">الفوج</th>
                                  <th className="px-4 py-2.5 font-medium text-center">سجل الحضور والغياب السابق</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/30">
                                {pList.map((player, pIdx) => (
                                  <tr key={player.player_id} className="hover:bg-zinc-800/20 transition-colors">
                                    <td className="px-3 py-2.5 text-zinc-600 font-mono text-xs text-center">{pIdx + 1}</td>
                                    <td className="px-4 py-2.5 font-bold text-zinc-200 text-sm">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                                          <UserX className="h-3 w-3 text-rose-400" />
                                        </div>
                                        <span>{player.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-xs text-zinc-400 font-mono" dir="ltr">
                                      {player.birth_date || '—'}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      {player.phone ? (
                                        <a
                                          href={`tel:${player.phone}`}
                                          className="inline-flex items-center gap-1 text-xs font-mono text-blue-400 hover:underline"
                                          dir="ltr"
                                        >
                                          <Phone className="h-3 w-3" />
                                          {player.phone}
                                        </a>
                                      ) : (
                                        <span className="text-zinc-600 text-xs">—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded text-[10px] font-bold">
                                        {player.team_name || '—'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                          حضور: {player.stats?.present ?? 0}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                          غياب: {player.stats?.absent ?? 0}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="sm:hidden divide-y divide-zinc-800/30">
                            {pList.map((player) => (
                              <div key={player.player_id} className="p-3 flex items-start gap-3">
                                <div className="h-7 w-7 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <UserX className="h-3.5 w-3.5 text-rose-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-bold text-zinc-100 text-sm truncate">{player.name}</p>
                                    <span className="text-rose-400 text-xs font-bold shrink-0">غائب</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px] text-zinc-400">
                                    <span className="text-violet-400 font-bold">{player.team_name || '—'}</span>
                                    {player.phone && (
                                      <a href={`tel:${player.phone}`} className="text-blue-400 font-mono" dir="ltr">
                                        {player.phone}
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5 text-[9px]">
                                    <span className="text-emerald-400 font-bold">سجل الحضور: {player.stats?.present ?? 0}</span>
                                    <span className="text-zinc-600">|</span>
                                    <span className="text-rose-400 font-bold">سجل الغياب: {player.stats?.absent ?? 0}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* View 3: Category Summary & Statistics */}
              {adminScannerSubTab === 'summary' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryStatsList.map((catStat) => (
                    <div
                      key={catStat.category}
                      className="p-4 bg-zinc-900/50 border border-zinc-800/60 rounded-2xl flex flex-col justify-between gap-3 hover:border-blue-500/30 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-sm text-zinc-100">فئة {catStat.category}</h4>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-black',
                            catStat.rate >= 75
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : catStat.rate >= 50
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          )}>
                            %{catStat.rate} حضور
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden mt-3 border border-zinc-800/80">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${catStat.rate}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/50 text-center">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold">الحاضرون</p>
                          <p className="text-sm font-black text-emerald-400 mt-0.5">{catStat.present}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold">الغائبون</p>
                          <p className="text-sm font-black text-rose-400 mt-0.5">{catStat.absent}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold">الإجمالي</p>
                          <p className="text-sm font-black text-zinc-200 mt-0.5">{catStat.total}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminScanFilter(prev => ({ ...prev, category: catStat.category }));
                          setAdminScannerSubTab('present');
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center justify-center gap-1 pt-1"
                      >
                        فلترة حسب هذه الفئة
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Official Print Action Prompt */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 mt-1">
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-300">جاهز لاستخراج كشف الحضور والغياب الرسمي؟</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">يتضمن التقرير توقيت الحضور، قائمة الغائبين لكل فئة، وسجل الحضور والغياب الكامل لكل لاعب.</p>
                </div>
                <Button
                  onClick={() => setIsAdminPrintModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 shrink-0 w-full sm:w-auto justify-center"
                >
                  <Printer className="h-4 w-4" />
                  معاينة وطباعة التقرير الشامل
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isScannerOpen || isBarcodeMode || isNfcMode}
        onClose={() => { 
          setIsScannerOpen(false); 
          setIsBarcodeMode(false);
          setIsNfcMode(false);
          stopNfcScan();
          setScannedPlayers(new Set()); 
          setScanMessage(null); 
          processingRef.current.clear(); 
        }}
        title={`بوابة التحضير الرقمية الذكية 📱`}
      >
        <div className="space-y-4">
          {/* Smart Scan Tab Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveScanTab('camera');
                setIsScannerOpen(true);
                setIsBarcodeMode(false);
                setIsNfcMode(false);
                stopNfcScan();
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-all text-[10px] font-black",
                (isScannerOpen && !isBarcodeMode && !isNfcMode) ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Camera size={14} />
              <span>الكاميرا (QR/Barcode)</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setActiveScanTab('nfc');
                setIsNfcMode(true);
                setIsScannerOpen(false);
                setIsBarcodeMode(false);
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-all text-[10px] font-black",
                (isNfcMode) ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Radio size={14} />
              <span>اللاسلكي (NFC)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveScanTab('laser');
                setIsBarcodeMode(true);
                setIsScannerOpen(false);
                setIsNfcMode(false);
                stopNfcScan();
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-all text-[10px] font-black",
                (isBarcodeMode) ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Shirt size={14} />
              <span>قارئ ليزري (Laser)</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-400">الحصة التدريبية المستهدفة</label>
            <select
              value={selectedTrainingId || ''}
              onChange={(e) => setSelectedTrainingId(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">اختر التدريب</option>
              {trainings.map(t => (
                <option key={t.training_id} value={t.training_id}>{getTrainingInfo(t.training_id)}</option>
              ))}
            </select>
          </div>

          {/* Laser Scanner Mode */}
          {isBarcodeMode && (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-950/50 rounded-xl border border-dashed border-emerald-500/30">
               <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-pulse">
                  <Shirt className="h-8 w-8" />
               </div>
               <div className="w-full max-w-sm">
                  <h3 className="text-lg font-bold text-zinc-100 mb-2">الماسح الخارجي (1D/2D) متصل</h3>
                  <p className="text-sm text-zinc-500 mx-auto mb-4">مرر باركود اللاعب (مثل قارئ ZKB109).</p>
                  <input 
                     type="text" 
                     autoFocus 
                     placeholder="انتظار قراءة الباركود..." 
                     className="w-full text-center bg-zinc-900 border border-emerald-500/50 rounded-lg py-3 text-emerald-400 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                           const value = e.currentTarget.value.trim();
                           if (value) {
                               onScanSuccessRef.current(value);
                               e.currentTarget.value = '';
                           }
                        }
                     }}
                     onBlur={(e) => {
                         // Keep focus for continuous scanning
                         const target = e.target;
                         setTimeout(() => target.focus(), 500);
                     }}
                  />
               </div>
               
               {scanMessage && (
                  <div className={`w-full p-4 rounded-lg animate-in zoom-in duration-300 ${
                    scanMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}>
                    <p className="font-bold">{scanMessage.text}</p>
                    {scanMessage.playerName && <p className="text-xs mt-1 opacity-80">{scanMessage.playerName}</p>}
                  </div>
               )}
            </div>
          )}

          {/* Web NFC Mode */}
          {isNfcMode && (
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-950/50 rounded-xl border border-zinc-800/80 relative overflow-hidden">
               {/* Glowing Background Waves */}
               {isNfcScanning && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                   <div className="h-40 w-40 rounded-full bg-emerald-500/5 animate-ping duration-1000"></div>
                   <div className="h-60 w-60 rounded-full bg-emerald-500/3 animate-ping duration-1500 delay-300"></div>
                 </div>
               )}

               <div className={cn(
                 "h-20 w-20 rounded-full flex items-center justify-center text-white relative z-10 transition-all duration-500",
                 isNfcScanning 
                   ? "bg-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-bounce" 
                   : "bg-zinc-800 text-zinc-400"
               )}>
                  <Radio className={cn("h-10 w-10", isNfcScanning && "animate-pulse")} />
               </div>
               
               <div className="relative z-10 space-y-1">
                  <h3 className="text-base font-black text-zinc-100">
                    {isNfcScanning ? "قارئ NFC نشط ومستعد" : "القارئ اللاسلكي غير نشط"}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                    {isNfcScanning 
                      ? "📡 قم بتقريب شريحة أو بطاقة اللاعب الذكية من الجزء الخلفي للهاتف الآن لتسجيل الحضور فورياً." 
                      : "انقر على الزر بالأسفل لتفعيل الحساس اللاسلكي والبدء في تسجيل الحضور باللمس."}
                  </p>
               </div>

               {nfcError && (
                 <div className="w-full p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold relative z-10">
                   {nfcError}
                 </div>
               )}

               {scanMessage && (
                 <div className={`w-full p-4 rounded-lg relative z-20 animate-in zoom-in duration-300 ${
                   scanMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                 }`}>
                   {scanMessage.type === 'success' ? (
                     <CheckCircle className="h-10 w-10 mx-auto mb-2 text-white animate-bounce" />
                   ) : (
                     <XCircle className="h-10 w-10 mx-auto mb-2 text-white animate-shake" />
                   )}
                   <p className="font-bold text-base">{scanMessage.text}</p>
                   {scanMessage.playerName && (
                     <div className="mt-2 space-y-2">
                       <p className="text-white text-lg font-black">{scanMessage.playerName}</p>
                       
                       <div className="flex gap-2 justify-center">
                         <div className={cn(
                           "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border",
                           scanMessage.isPaid ? "bg-white/20 text-white border-white/20" : "bg-black/20 text-rose-200 border-rose-500/30"
                         )}>
                           <Wallet className="h-3 w-3" />
                           {scanMessage.isPaid ? "خالص مالياً" : "غير خالص"}
                         </div>

                         <div className={cn(
                           "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border",
                           scanMessage.hasKit ? "bg-white/20 text-white border-white/20" : "bg-black/20 text-amber-200 border-amber-500/30"
                         )}>
                           <Shirt className="h-3 w-3" />
                           {scanMessage.hasKit ? "استلم العتاد" : "لم يستلم"}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}

               <div className="w-full pt-2 relative z-10">
                 {isNfcScanning ? (
                   <Button 
                     onClick={stopNfcScan}
                     className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
                   >
                     إيقاف الاستشعار اللاسلكي
                   </Button>
                 ) : (
                   <Button 
                     onClick={startNfcScan}
                     disabled={!nfcSupported}
                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-950/20"
                   >
                     ابدأ قراءة NFC 📡
                   </Button>
                 )}
               </div>

               {!nfcSupported && (
                 <p className="text-[10px] text-zinc-500 relative z-10">
                   ⚠️ تقنية NFC تتطلب متصفح Chrome على هواتف الأندرويد أو تطبيق PWA المثبت.
                 </p>
               )}
            </div>
          )}

          {/* Camera (QR/Barcode) Mode */}
          {isScannerOpen && !isBarcodeMode && !isNfcMode && (
            <>
              {cameraError ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-center text-sm">
                  <XCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>{cameraError}</p>
                  <Button variant="outline" size="sm" onClick={() => { setCameraError(null); setIsScannerOpen(false); setTimeout(() => setIsScannerOpen(true), 100); }} className="mt-4 border-rose-500/20 hover:bg-rose-500/20 text-rose-400">إعادة المحاولة</Button>
                </div>
              ) : (
                <>
                  <div className="relative overflow-hidden rounded-xl border-2 border-zinc-800 bg-black aspect-square max-w-[320px] mx-auto group">
                    <div id="qr-reader" className="w-full h-full"></div>

                    {/* Professional Scanner Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                      {/* Focus Corners */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-emerald-500/50 rounded-2xl">
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>

                        {/* Scanning Animation Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scanner-line"></div>
                      </div>

                      {/* Dimmed Background */}
                      <div className="absolute inset-0 bg-black/40 mask-scanner"></div>
                    </div>

                    {/* Success/Error Feedback Overlay */}
                    {scanMessage && (
                      <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300 ${scanMessage.type === 'success' ? 'bg-emerald-600/90' : 'bg-rose-600/90'
                        }`}>
                        {scanMessage.type === 'success' ? (
                          <CheckCircle className="h-16 w-16 text-white mb-4 animate-bounce" />
                        ) : (
                          <XCircle className="h-16 w-16 text-white mb-4 animate-shake" />
                        )}
                        <h3 className="text-white text-xl font-bold mb-2">{scanMessage.text}</h3>
                        {scanMessage.playerName && (
                          <div className="mt-2 space-y-3">
                            <p className="text-emerald-100 text-lg font-black">{scanMessage.playerName}</p>
                            
                            <div className="flex gap-2 justify-center">
                              {/* Financial Badge */}
                              <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border animate-in slide-in-from-bottom-2 duration-500",
                                scanMessage.isPaid 
                                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30" 
                                  : "bg-rose-500/20 text-rose-200 border-rose-500/30"
                              )}>
                                <Wallet className="h-3 w-3" />
                                {scanMessage.isPaid ? "خالص مالياً" : "غير خالص"}
                              </div>

                              {/* Kit Badge */}
                              <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border animate-in slide-in-from-bottom-2 delay-100 duration-500",
                                scanMessage.hasKit 
                                  ? "bg-blue-500/20 text-blue-200 border-blue-500/30" 
                                  : "bg-amber-500/20 text-amber-200 border-amber-500/30"
                              )}>
                                <Shirt className="h-3 w-3" />
                                {scanMessage.hasKit ? "استلم العتاد" : "لم يستلم"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-full">
                {isNfcMode ? <Radio className="h-5 w-5 text-emerald-500" /> : isBarcodeMode ? <Shirt className="h-5 w-5 text-emerald-500" /> : <QrCode className="h-5 w-5 text-emerald-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">الماسح جاهز</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  {isNfcMode 
                    ? "قم بتقريب بطاقة أو شريحة NFC من الهاتف" 
                    : isBarcodeMode 
                      ? "قم بمسح البطاقة باستخدام الجهاز الخارجي" 
                      : "وجه الكاميرا نحو رمز البطاقة"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-500 font-bold">LIVE</span>
            </div>
          </div>

          {scannedPlayers.size > 0 && (
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">إحصائيات الجلسة الحالية ({scannedPlayers.size})</h4>
              <div className="max-h-24 overflow-y-auto grid grid-cols-1 gap-1">
                {Array.from(scannedPlayers).slice(0, 5).map((id: number) => (
                  <div key={id} className="flex items-center justify-between text-xs py-1 px-2 bg-zinc-900/50 rounded border border-zinc-800/50">
                    <span className="text-zinc-300">{getPlayerName(id)}</span>
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  </div>
                ))}
                {scannedPlayers.size > 5 && (
                  <p className="text-[10px] text-zinc-500 text-center mt-1">+{scannedPlayers.size - 5} لاعبين آخرين</p>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
             <Button variant="outline" onClick={() => { 
               setIsScannerOpen(false); 
               setIsBarcodeMode(false);
               setIsNfcMode(false);
               stopNfcScan();
               setScannedPlayers(new Set()); 
               setScanMessage(null); 
               processingRef.current.clear(); 
             }} className="border-zinc-800 text-zinc-400">إلغاء</Button>
             <Button onClick={handleFinalizeAttendance} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">إنهاء وإرسال التقرير</Button>
          </div>
        </div>
      </Modal>

      {/* Admin Reports View */}
      {activeTab === 'reports' && (
        <div className="space-y-6 mt-4">
          {trainings.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl">
              لا توجد حصص تدريبية مسجلة حالياً.
            </div>
          ) : (
            trainings.map(session => {
              const sessionPlayers = getSessionAbsences(session.training_id);
              const presentCount = sessionPlayers.filter(p => p.status === 'حاضر').length;
              const isExpanded = expandedSessions.has(session.training_id);
              const team = teams.find(t => Number(t.team_id) === Number(session.team_id));

              return (
                <div key={session.training_id} className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl overflow-hidden mb-4">
                  <div
                    className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-zinc-800/20"
                    onClick={() => toggleSessionExpand(session.training_id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-50">{team?.category || 'فئة'} - {team?.team_name || 'فوج غير محدد'} - {session.date}</h3>
                        <p className="text-xs text-zinc-500 mt-1 capitalize">
                          الموقع: {session.location} | {session.start_time} - {session.end_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950/50 rounded-full border border-zinc-800 text-xs text-zinc-400">
                        {presentCount} حاضر | {sessionPlayers.length - presentCount} غائب
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-zinc-800 text-zinc-400 hover:text-blue-500 shrink-0 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          const msg = prompt("اكتب رسالة جماعية لأولياء هذا الفوج:", `تنبيه: حصة تدريب ${team?.category || ''} - ${team?.team_name || ''} اليوم (${session.date})...`);
                          if (msg) {
                            api.notifyParentsOfTeam(session.team_id, msg, 'تدريب')
                              .then(() => alert("✅ تم إرسال الإشعار لجميع الأولياء."))
                              .catch(() => alert("❌ فشل الإرسال"));
                          }
                        }}
                      >
                        <MessageCircle className="h-3 w-3 mr-2 ml-1" />
                        مراسلة الكل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-zinc-800 text-zinc-300 hover:text-emerald-500 shrink-0 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          const sessionData = {
                            ...session,
                            team_name: team?.team_name || 'فريق غير محدد',
                            category: team?.category || 'غير محددة',
                            coach_name: coaches.find(c => Number(c.coach_id) === Number(team?.coach_id))?.name || 'غير محدد'
                          };
                          setPrintData({
                            training: sessionData,
                            players: sessionPlayers,
                            attendance: attendance.filter(a => Number(a.training_id) === Number(session.training_id))
                          });
                        }}
                      >
                        <Printer className="h-3 w-3 mr-2 ml-1" />
                        طباعة
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-rose-800/50 text-rose-400 hover:bg-rose-500 hover:text-white shrink-0 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          notifyAbsences(session.training_id);
                        }}
                      >
                        <Bell className="h-3 w-3 mr-2 ml-1" />
                        تنبيه الغياب
                      </Button>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-zinc-600" /> : <ChevronDown className="h-5 w-5 text-zinc-600" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-zinc-800/30 animate-in slide-in-from-top-2 duration-200">
                      <div className="overflow-x-auto mt-4">
                        <table className="w-full text-xs text-right">
                          <thead className="bg-zinc-950/30 text-zinc-500 uppercase">
                            <tr>
                              <th className="px-4 py-2 font-medium">اللاعب</th>
                              <th className="px-4 py-2 font-medium text-center">الحالة</th>
                              <th className="px-4 py-2 font-medium text-center">الوقت</th>
                              <th className="px-4 py-2 text-right">ملاحظات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/30">
                            {sessionPlayers.map(p => (
                              <tr key={p.player_id} className="hover:bg-zinc-800/10">
                                <td className="px-4 py-3 font-medium text-zinc-200">{p.name}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'حاضر' ? 'bg-emerald-500/10 text-emerald-400' :
                                    p.status === 'غائب' ? 'bg-rose-500/10 text-rose-400' :
                                      'bg-amber-500/10 text-amber-400'
                                    }`}>
                                    {p.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-zinc-500" dir="ltr">{p.check_in_time || '--:--'}</td>
                                <td className="px-4 py-3 text-zinc-400 max-w-[150px] truncate">{p.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingAttendance(null); setSelectedTrainingId(null); }} title={editingAttendance ? "تعديل سجل الحضور" : "تسجيل حضور جديد"}>
        <form onSubmit={handleAddAttendance} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">التدريب</label>
            <select
              required
              name="training_id"
              value={selectedTrainingId || ''}
              onChange={(e) => setSelectedTrainingId(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">اختر التدريب</option>
              {trainings.map(t => (
                <option key={t.training_id} value={t.training_id}>{getTrainingInfo(t.training_id)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">اللاعب (يظهر لاعبو الفئة/الفوج المختار فقط)</label>
            <select required name="player_id" defaultValue={editingAttendance?.player_id} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
              <option value="">اختر اللاعب</option>
              {getFilteredPlayersForModal().map(p => (
                <option key={p.player_id} value={p.player_id}>{p.name}</option>
              ))}
            </select>
            {selectedTrainingId && getFilteredPlayersForModal().length === 0 && (
              <p className="text-xs text-rose-400 mt-1">لا يوجد لاعبين مسجلين في هذه الفئة.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">الحالة</label>
              <select required name="status" defaultValue={editingAttendance?.status || "حاضر"} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none">
                <option value="حاضر">حاضر</option>
                <option value="غائب">غائب</option>
                <option value="بعذر">بعذر</option>
                <option value="متأخر">متأخر</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">وقت الحضور</label>
              <input name="check_in_time" defaultValue={editingAttendance?.check_in_time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })} type="time" className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">ملاحظات</label>
            <textarea name="notes" defaultValue={editingAttendance?.notes} className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingAttendance(null); }} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">{editingAttendance ? "تحديث" : "حفظ"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="حذف سجل التحضير"
        message="هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء."
      />

      {/* Search Filter QR Scanner */}
      <QRScannerModal
        isOpen={isFilterQrOpen}
        onClose={() => setIsFilterQrOpen(false)}
        onScan={(code) => {
          const cleanCode = code.startsWith("PLAYER:") ? code.split(":")[1] : code;
          setSearchTerm(cleanCode);
        }}
        players={players}
      />

      <PrintPortal
        isOpen={!!printData}
        onClose={() => setPrintData(null)}
        title={`تقرير حضور ${printData?.training?.category} - ${printData?.training?.team_name} - ${printData?.training?.date}`}
        id="attendance-print"
      >
        {printData && (
          <AttendanceReportTemplate
            training={printData.training}
            players={printData.players}
            attendance={printData.attendance}
            academySettings={academySettings}
          />
        )}
      </PrintPortal>

      <PrintPortal
        isOpen={isAdminPrintModalOpen}
        onClose={() => setIsAdminPrintModalOpen(false)}
        title={`تقرير_حضور_وغياب_المسح_الإلكتروني_${new Date().toLocaleDateString('ar-DZ').replace(/\//g, '-')}`}
        id="admin-scanner-report"
      >
        <AdminScannerReportTemplate
          presentPlayers={presentPlayersWithStats}
          absentPlayersByCategory={absentPlayersByCategory}
          categoryStats={categoryStatsList}
          date={new Date().toLocaleDateString('ar-DZ')}
          academySettings={academySettings}
          user={user}
        />
      </PrintPortal>
    </div >
  );
}
