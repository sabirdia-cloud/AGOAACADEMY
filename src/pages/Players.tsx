import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Printer, FileText, CreditCard as IdCard, User, Users, Phone, MapPin, Calendar, Scale, Ruler, Droplets, Shirt, Camera, Loader2, QrCode, Shield, Edit, Trash2, MessageCircle, Send, Check, Info, Download, TrendingUp, Trophy, BookOpen, ArrowRight, LayoutGrid, List, X, Sparkles, CheckCircle2, ArrowRightLeft, CheckSquare, Square, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { api } from "@/services/api";
import { PlayerApplicationTemplate, PlayerCardTemplate, ScoutReportTemplate, PedagogicalNotebookTemplate, CategoryPlayersListTemplate, PaidSubscribersA4SheetTemplate } from "@/components/PrintTemplates";
import { PrintPortal } from "@/components/PrintPortal";
import { exportToPDF, exportToPNG } from "@/lib/pdf-export";
import { QRScannerModal } from "@/components/QRScannerModal";
import { useAuth } from "@/services/AuthContext";
import { wilayas, algeriaCities } from "@/data/algeria";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FUTPlayerCard } from "@/components/FUTPlayerCard";

export function Players() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [playerToDelete, setPlayerToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedSquadId, setSelectedSquadId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [printData, setPrintData] = useState<{ 
    type: 'application' | 'card' | 'scout' | 'pedagogical' | 'category' | null, 
    player?: any, 
    evaluation?: any,
    evaluations?: any[],
    physicalMetrics?: any[],
    attendanceStats?: any,
    subscriptions?: any[],
    payments?: any[],
    messages?: any[],
    categoryData?: any
  }>({ type: null, player: null });
  const [isExporting, setIsExporting] = useState(false);
  const [academySettings, setAcademySettings] = useState<any>(null);
  const [isPedagogicalLoading, setIsPedagogicalLoading] = useState(false);
  const [isExportWhatsAppOpen, setIsExportWhatsAppOpen] = useState(false);
  const [whatsappExportText, setWhatsappExportText] = useState("");
  const [isExportingCategoryPDF, setIsExportingCategoryPDF] = useState(false);
  const [categoryExportData, setCategoryExportData] = useState<{
    categoryName: string;
    squadName?: string;
    players: any[];
    subscriptions?: any[];
    headCoach?: string;
  } | null>(null);
  const [isCategoryExportModalOpen, setIsCategoryExportModalOpen] = useState(false);

  const playBeep = (type: 'success' | 'error' = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } else {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio Context not supported");
    }
  };

  // New states for form handling
  const [selectedWilaya, setSelectedWilaya] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedPlayerForMessage, setSelectedPlayerForMessage] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [futModalPlayer, setFutModalPlayer] = useState<any | null>(null);

  // Bulk & Quick Reassign States
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(new Set());
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [targetPlayerForSingleReassign, setTargetPlayerForSingleReassign] = useState<any | null>(null);
  const [reassignCategory, setReassignCategory] = useState<string>("");
  const [reassignTeamId, setReassignTeamId] = useState<number | string>("");
  const [reassignCoachId, setReassignCoachId] = useState<number | string>("");
  const [reassignUpdateTeamCoach, setReassignUpdateTeamCoach] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  // Paid Subscribers Sheet (A4 - 40 Players per page)
  const [isPaidSheetOpen, setIsPaidSheetOpen] = useState(false);
  const [sheetCategory, setSheetCategory] = useState<string>("all");
  const [sheetPaymentType, setSheetPaymentType] = useState<"all_paid" | "full" | "half">("all_paid");
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [allParents, setAllParents] = useState<any[]>([]);
  const [isLoadingPaidData, setIsLoadingPaidData] = useState(false);

  // Extract unique categories from teams, categories and players
  const uniqueCategories = Array.from(new Set([
    ...teams.map(t => t.category),
    ...categories.map((c: any) => c.name || c.category),
    ...players.map(p => p.category)
  ].filter(Boolean)));
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  useEffect(() => {
    loadData();
  }, []);

  // External Scanner Global Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Skip if we are typing in an input/textarea (unless it's the search input)
      if (
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA") &&
        !(target as HTMLInputElement).placeholder?.includes("بحث")
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // Scanners are fast. If time between keys > 50ms, it's likely a human
      if (currentTime - lastKeyTime > 50) {
        buffer = "";
      }
      
      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.length > 2) {
          setSearchQuery(buffer);
          playBeep('success');
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Fetch categories first as they are critical for the form
    try {
      const categoriesData = await api.getCategories();
      setCategories(categoriesData);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }

    try {
      const teamsData = await api.getTeams();
      setTeams(teamsData);
    } catch (e) {
      console.error("Failed to load teams:", e);
    }

    try {
      const coachesData = await api.getCoaches();
      setCoaches(coachesData);
    } catch (e) {
      console.error("Failed to load coaches:", e);
    }

    try {
      const settingsData = await api.getAcademySettings();
      setAcademySettings(settingsData);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }

    try {
      const playersData = await api.getPlayers();
      setPlayers(playersData);
    } catch (error) {
      console.error("Failed to load players list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = (type: 'application' | 'card', player: any) => {
    setPrintData({ type, player });
  };

  const handleAddPlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setIsUploading(true);
    let finalPhotoUrl = editingPlayer?.photo_url || null;

    try {
      if (photoFile) {
        finalPhotoUrl = await api.uploadPlayerPhoto(photoFile);
      }

      const teamIdVal = formData.get("team_id") as string;
      let selectedTeamId: number | null = null;
      let selectedCategory: string | null = null;

      if (teamIdVal && teamIdVal.startsWith('cat:')) {
        selectedCategory = teamIdVal.replace('cat:', '');
      } else if (teamIdVal) {
        selectedTeamId = Number(teamIdVal);
        const team = teams.find(t => t.team_id === selectedTeamId);
        selectedCategory = team?.category || null;
      }

      const parentUsername = (formData.get("parent_username") as string) || (formData.get("phone") as string);
      const parentPassword = formData.get("parent_password") as string;
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;

      if (parentUsername && !alphanumericRegex.test(parentUsername)) {
        alert('خطأ: اسم المستخدم للولي يجب أن يحتوي على حروف وأرقام إنجليزية فقط بدون رموز أو مسافات.');
        return;
      }
      if (!editingPlayer && parentPassword && !alphanumericRegex.test(parentPassword)) {
        alert('خطأ: كلمة المرور للولي يجب أن تحتوي على حروف وأرقام إنجليزية فقط بدون رموز أو مسافات.');
        return;
      }

      const rawName = (formData.get("name") as string || "").trim();
      const rawBirthDate = (formData.get("birth_date") as string || "").trim();
      const rawPhone = (formData.get("phone") as string || "").trim();
      const rawIdCard = (formData.get("id_card_number") as string || "").trim();

      if (!editingPlayer) {
        // Prevent duplicate player registration
        const existingPlayer = players.find(p => {
          const pName = (p.name || "").trim().toLowerCase();
          const targetName = rawName.toLowerCase();
          const sameName = pName === targetName;
          const sameBirth = rawBirthDate && p.birth_date === rawBirthDate;
          const samePhone = rawPhone && p.phone && p.phone.replace(/\D/g, '') === rawPhone.replace(/\D/g, '');
          const sameIdCard = rawIdCard && p.id_card_number && p.id_card_number.trim() === rawIdCard;

          if (sameIdCard) return true;
          if (sameName && sameBirth) return true;
          if (sameName && samePhone) return true;
          return false;
        });

        if (existingPlayer) {
          alert(`تنبيه: يوجد لاعب مسجل مسبقاً بنفس البيانات باسم "${existingPlayer.name}" (المعرف: #${existingPlayer.player_id}).\nلا يمكن إعادة تسجيل نفس اللاعب مرتين لتفادي التكرار.`);
          setIsUploading(false);
          return;
        }
      }

      const playerData = {
        name: rawName,
        birth_date: rawBirthDate,
        birth_state: formData.get("birth_state") as string,
        birth_city: formData.get("birth_city") as string,
        join_date: formData.get("join_date") as string,
        category: selectedCategory,
        weight: formData.get("weight") ? Number(formData.get("weight")) : null,
        height: formData.get("height") ? Number(formData.get("height")) : null,
        blood_type: (formData.get("blood_type") as string) || null,
        uniform_size: (formData.get("uniform_size") as string) || null,
        photo_url: finalPhotoUrl,
        father_name: formData.get("father_name") as string,
        id_card_number: (formData.get("id_card_number") as string) || null,
        id_card_issue_date: (formData.get("id_card_issue_date") as string) || null,
        address: (formData.get("address") as string) || null,
        phone: (formData.get("phone") as string) || null,
        team_id: selectedTeamId,
        parent_username: parentUsername,
        parent_password: parentPassword,
      };

      if (editingPlayer) {
        await api.updatePlayer(editingPlayer.player_id, playerData);
      } else {
        await api.addPlayer(playerData);
      }
      await loadData();
      closeModal();
    } catch (error: any) {
      console.error("Failed to save player:", error);
      if (error.message) {
        alert(error.message);
      } else {
        alert("حدث خطأ أثناء حفظ بيانات اللاعب. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedPlayerForMessage || !messageText.trim()) return;
    setIsSending(true);
    try {
      await api.notifyParentOfPlayer(selectedPlayerForMessage.player_id, messageText, 'رسالة خاصة');
      setIsMessageModalOpen(false);
      setMessageText("");
    } catch (e) {
      alert("فشل إرسال الرسالة.");
    } finally {
      setIsSending(false);
    }
  };

  const handleBulkWhatsApp = () => {
    if (!bulkMessage.trim()) return;
    const phones = Array.from(new Set(players.map(p => p.phone).filter(p => !!p)));
    if (phones.length > 0) {
      // Open the first one and provide feedback
      api.sendWhatsAppNotification(phones[0] as string, bulkMessage);
    }
    setIsBulkWhatsAppOpen(false);
    setBulkMessage("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlayer(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setSelectedWilaya("");
  };

  const openEditModal = async (player: any) => {
    // Fetch parent credentials
    const creds = await api.getPlayerParentCredentials(player.player_id);
    const playerWithCreds = {
      ...player,
      parent_username: creds?.parent_username || '',
      parent_password: creds?.parent_password || ''
    };

    setEditingPlayer(playerWithCreds);
    setSelectedWilaya(player.birth_state || "");
    setPhotoPreview(player.photo_url || null);
    setIsModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDeletePlayer = async (id: number) => {
    setPlayerToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (playerToDelete) {
      setIsDeleting(true);
      try {
        await api.deletePlayer(playerToDelete);
        await loadData();
        setIsConfirmOpen(false);
      } catch (error) {
        console.error("Failed to delete player:", error);
      } finally {
        setIsDeleting(false);
        setPlayerToDelete(null);
      }
    }
  };

  // ─── Quick & Bulk Reassignment Handlers ───
  const openSingleReassign = (player: any) => {
    setTargetPlayerForSingleReassign(player);
    const team = teams.find(t => t.team_id === player.team_id);
    const cat = player.category || team?.category || "";
    setReassignCategory(cat);
    setReassignTeamId(player.team_id ? String(player.team_id) : "");

    let coachId = "";
    if (team?.coach_id) {
      coachId = String(team.coach_id);
    } else if (team) {
      const tc = coaches.find((c: any) => c.team_id === team.team_id);
      if (tc) coachId = String(tc.coach_id);
    }
    if (!coachId && cat) {
      const cc = coaches.find((c: any) => c.category === cat);
      if (cc) coachId = String(cc.coach_id);
    }
    setReassignCoachId(coachId);
    setReassignUpdateTeamCoach(false);
    setIsReassignModalOpen(true);
  };

  const openBulkReassign = () => {
    if (selectedPlayerIds.size === 0) return;
    setTargetPlayerForSingleReassign(null);
    setReassignCategory(selectedCategoryFilter || "");
    setReassignTeamId(selectedSquadId ? String(selectedSquadId) : "");
    setReassignCoachId("");
    setReassignUpdateTeamCoach(false);
    setIsReassignModalOpen(true);
  };

  const handleCategoryChangeInReassign = (newCat: string) => {
    setReassignCategory(newCat);
    const squadsForCat = teams.filter(t => t.category === newCat);
    if (squadsForCat.length > 0) {
      const firstSquad = squadsForCat[0];
      setReassignTeamId(String(firstSquad.team_id));
      if (firstSquad.coach_id) {
        setReassignCoachId(String(firstSquad.coach_id));
      } else {
        const c = coaches.find((co: any) => co.team_id === firstSquad.team_id || co.category === newCat);
        setReassignCoachId(c ? String(c.coach_id) : "");
      }
    } else {
      setReassignTeamId("");
      const c = coaches.find((co: any) => co.category === newCat);
      setReassignCoachId(c ? String(c.coach_id) : "");
    }
  };

  const handleTeamChangeInReassign = (teamIdVal: string) => {
    setReassignTeamId(teamIdVal);
    if (teamIdVal) {
      const team = teams.find(t => t.team_id === Number(teamIdVal));
      if (team?.coach_id) {
        setReassignCoachId(String(team.coach_id));
      } else if (team) {
        const c = coaches.find((co: any) => co.team_id === team.team_id || co.category === team.category);
        setReassignCoachId(c ? String(c.coach_id) : "");
      }
    }
  };

  const handleExecuteReassign = async () => {
    const playerIdsToUpdate = targetPlayerForSingleReassign
      ? [targetPlayerForSingleReassign.player_id]
      : Array.from(selectedPlayerIds);

    if (playerIdsToUpdate.length === 0) {
      alert("يرجى تحديد لاعب واحد على الأقل.");
      return;
    }

    if (!reassignCategory && !reassignTeamId) {
      alert("يرجى اختيار الفئة أو الفوج المستهدف.");
      return;
    }

    setIsReassigning(true);

    try {
      const finalTeamId = reassignTeamId ? Number(reassignTeamId) : null;
      let finalCategory = reassignCategory;

      if (!finalCategory && finalTeamId) {
        const team = teams.find(t => t.team_id === finalTeamId);
        finalCategory = team?.category || "";
      }

      // Update players while strictly preserving all other existing fields
      const updatePromises = playerIdsToUpdate.map(pid =>
        api.updatePlayer(pid, {
          category: finalCategory || null,
          team_id: finalTeamId
        })
      );

      await Promise.all(updatePromises);

      // If user opted to also link the selected coach to this squad
      if (finalTeamId && reassignCoachId && reassignUpdateTeamCoach) {
        try {
          await api.updateTeam(finalTeamId, { coach_id: Number(reassignCoachId) });
        } catch (teamErr) {
          console.warn("Could not update team coach_id:", teamErr);
        }
      }

      playBeep('success');
      alert(`✅ تم بنجاح تغيير وتحديث الفئة والفوج والمدرب لـ ${playerIdsToUpdate.length} لاعب بضغطة زر، مع الحفاظ الكامل على كافة بياناتهم!`);

      await loadData();
      setSelectedPlayerIds(new Set());
      setTargetPlayerForSingleReassign(null);
      setIsReassignModalOpen(false);
    } catch (err: any) {
      console.error("Failed to reassign players:", err);
      alert(`حدث خطأ أثناء التحديث: ${err.message || 'يرجى التحقق من الاتصال'}`);
    } finally {
      setIsReassigning(false);
    }
  };

  const getTeamName = (player: any) => {
    if (player.team_id) {
      const team = teams.find(t => t.team_id === player.team_id);
      return team ? `${team.category} - ${team.team_name}` : player.category || "غير محدد";
    }
    return player.category || "غير محدد";
  };

  // Age calculation helper
  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return null;
    try {
      const bDate = new Date(birthDateStr);
      if (isNaN(bDate.getTime())) return null;
      const diff = Date.now() - bDate.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  };

  // Coach resolver for each player
  const getPlayerCoachInfo = (player: any) => {
    // Specific priority for Category U9 squads:
    // Team 8 -> الفوج 1 (U9 A) -> قسوم أشرف
    // Team 5 -> الفوج 2 (فئة U7) -> شوقي حيدر
    if (player.team_id === 8) {
      const coach = coaches.find((c: any) => c.coach_id === 13 || c.name?.includes('قسوم') || c.team_id === 8);
      return {
        name: coach?.name || "قسوم أشرف",
        phone: coach?.phone,
        role: "مدرب الفوج 1 (U9 A)",
        isSquadCoach: true
      };
    }
    if (player.team_id === 5 || player.team_id === 9) {
      const coach = coaches.find((c: any) => c.coach_id === 10 || c.name?.includes('شوقي') || c.team_id === 5 || c.team_id === 9);
      return {
        name: coach?.name || "شوقي حيدر",
        phone: coach?.phone,
        role: "مدرب فئة U7",
        isSquadCoach: true
      };
    }

    // 1. If player has team_id (squad)
    if (player.team_id) {
      const team = teams.find((t: any) => t.team_id === player.team_id);
      if (team) {
        if (team.coach_id) {
          const coach = coaches.find((c: any) => c.coach_id === team.coach_id || c.id === team.coach_id);
          if (coach) {
            return {
              name: coach.name,
              phone: coach.phone,
              role: `مدرب ${team.team_name.startsWith('فوج') ? team.team_name : `فوج ${team.team_name}`}`,
              isSquadCoach: true
            };
          }
        }
        const teamCoach = coaches.find((c: any) => c.team_id === team.team_id);
        if (teamCoach) {
          return {
            name: teamCoach.name,
            phone: teamCoach.phone,
            role: `مدرب ${team.team_name.startsWith('فوج') ? team.team_name : `فوج ${team.team_name}`}`,
            isSquadCoach: true
          };
        }
      }
    }

    // 2. Fallback to category coach
    const playerCat = player.category || (player.team_id && teams.find((t: any) => t.team_id === player.team_id)?.category);
    if (playerCat) {
      if (playerCat === 'U9') {
        return {
          name: "ك. قسوم أشرف / ك. شوقي حيدر",
          role: "مدربو فئة U9",
          isSquadCoach: false
        };
      }
      const catCoach = coaches.find((c: any) => c.category === playerCat && !c.team_id) ||
                       coaches.find((c: any) => c.category === playerCat);
      if (catCoach) {
        return {
          name: catCoach.name,
          phone: catCoach.phone,
          role: `مدرب فئة ${playerCat}`,
          isSquadCoach: false
        };
      }
    }

    return null;
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.father_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.player_id).includes(searchQuery) ||
        (p.phone || "").includes(searchQuery) ||
        (p.parent_username || "").includes(searchQuery) ||
        (p.qr_code || "").includes(searchQuery);

      const playerCat = p.category || (p.team_id && teams.find((t: any) => t.team_id === p.team_id)?.category);

      const matchesCategory = selectedCategoryFilter 
        ? playerCat === selectedCategoryFilter
        : true;

      const matchesSquad = selectedSquadId !== null
        ? p.team_id === selectedSquadId
        : true;

      return matchesSearch && matchesCategory && matchesSquad;
    });
  }, [players, searchQuery, selectedCategoryFilter, selectedSquadId, teams]);

  // Active filter spotlight information
  const activeFilterInfo = useMemo(() => {
    if (selectedSquadId) {
      const team = teams.find((t: any) => t.team_id === selectedSquadId);
      let coach = null;
      if (selectedSquadId === 8) {
        coach = coaches.find((c: any) => c.coach_id === 13 || c.name?.includes('قسوم') || c.team_id === 8);
      } else if (selectedSquadId === 5 || selectedSquadId === 9) {
        coach = coaches.find((c: any) => c.coach_id === 10 || c.name?.includes('شوقي') || c.team_id === 5 || c.team_id === 9);
      } else {
        if (team?.coach_id) {
          coach = coaches.find((c: any) => c.coach_id === team.coach_id || c.id === team.coach_id);
        }
        if (!coach && team) {
          coach = coaches.find((c: any) => c.team_id === team.team_id);
        }
        if (!coach && team?.category) {
          coach = coaches.find((c: any) => c.category === team.category);
        }
      }
      const sName = team?.team_name ? (team.team_name.startsWith('فوج') ? team.team_name : `فوج ${team.team_name}`) : 'فوج محدد';
      return {
        type: 'squad' as const,
        title: team ? `فئة ${team.category} • ${sName}` : 'فوج محدد',
        categoryName: team?.category || selectedCategoryFilter || '',
        squadName: sName,
        coachName: coach?.name || (selectedSquadId === 8 ? 'قسوم أشرف' : (selectedSquadId === 5 || selectedSquadId === 9) ? 'شوقي حيدر' : 'غير معين'),
        coachPhone: coach?.phone,
        coachRole: `مدرب ${sName}`,
        count: filteredPlayers.length
      };
    }

    if (selectedCategoryFilter) {
      if (selectedCategoryFilter === 'U9') {
        const coach = coaches.find((c: any) => c.coach_id === 13 || c.name?.includes('قسوم') || c.category === 'U9');
        return {
          type: 'category' as const,
          title: `فئة U9`,
          categoryName: 'U9',
          squadName: null,
          coachName: coach?.name || 'قسوم أشرف',
          coachPhone: coach?.phone,
          coachRole: 'المشرف الفني للفئة',
          count: filteredPlayers.length
        };
      }
      if (selectedCategoryFilter === 'U7') {
        const coach = coaches.find((c: any) => c.coach_id === 10 || c.name?.includes('شوقي') || c.category === 'U7');
        return {
          type: 'category' as const,
          title: `فئة U7`,
          categoryName: 'U7',
          squadName: null,
          coachName: coach?.name || 'شوقي حيدر',
          coachPhone: coach?.phone,
          coachRole: 'مدرب فئة U7',
          count: filteredPlayers.length
        };
      }

      const catCoach = coaches.find((c: any) => c.category === selectedCategoryFilter && !c.team_id) ||
                       coaches.find((c: any) => c.category === selectedCategoryFilter);
      return {
        type: 'category' as const,
        title: `فئة ${selectedCategoryFilter}`,
        categoryName: selectedCategoryFilter,
        squadName: null,
        coachName: catCoach?.name || 'غير معين',
        coachPhone: catCoach?.phone,
        coachRole: 'المشرف الفني للفئة',
        count: filteredPlayers.length
      };
    }

    return null;
  }, [selectedSquadId, selectedCategoryFilter, teams, coaches, filteredPlayers.length]);

  // Squads available for currently selected category
  const availableSquadsForCategory = useMemo(() => {
    if (!selectedCategoryFilter) return [];
    return teams.filter((t: any) => t.category === selectedCategoryFilter);
  }, [selectedCategoryFilter, teams]);

  const handleExportExcel = () => {
    const exportData = filteredPlayers.map(p => ({
      "المعرف": p.player_id,
      "الاسم الكامل": p.name || "",
      "الفئة": getTeamName(p),
      "تاريخ الميلاد": p.birth_date || "",
      "اسم الأب": p.father_name || "",
      "الهاتف": p.phone || "",
      "تاريخ الانضمام": p.join_date || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "اللاعبين");
    
    // Auto format header
    XLSX.utils.sheet_add_aoa(worksheet, [["المعرف", "الاسم الكامل", "الفئة", "تاريخ الميلاد", "اسم الأب", "الهاتف", "تاريخ الانضمام"]], { origin: "A1" });

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(data, `قائمة_اللاعبين_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportCategoryPDF = async (categoryName: string, squadId?: number) => {
    try {
      setIsExportingCategoryPDF(true);
      const [allSubs] = await Promise.all([
        api.getSubscriptions().catch(() => [])
      ]);

      const selectedSquad = squadId ? teams.find(t => t.team_id === squadId) : null;

      const catPlayers = players.filter(p => {
        if (squadId) {
          return p.team_id === squadId;
        }
        if (p.category === categoryName) return true;
        if (p.team_id) {
          const team = teams.find(t => t.team_id === p.team_id);
          return team && team.category === categoryName;
        }
        return false;
      }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

      let coachDisplayName = "المدرب المسؤول";
      if (squadId === 8) {
        coachDisplayName = "قسوم أشرف";
      } else if (squadId === 5 || squadId === 9) {
        coachDisplayName = "شوقي حيدر";
      } else if (selectedSquad) {
        let sc = coaches.find((c: any) => c.coach_id === selectedSquad.coach_id || c.id === selectedSquad.coach_id);
        if (!sc) sc = coaches.find((c: any) => c.team_id === selectedSquad.team_id);
        coachDisplayName = sc?.name || "المدرب المسؤول";
      } else if (categoryName === 'U7') {
        coachDisplayName = "ك. شوقي حيدر";
      } else if (categoryName === 'U9') {
        coachDisplayName = "ك. قسوم أشرف";
      } else {
        const catTeams = teams.filter(t => t.category === categoryName);
        const catCoach = coaches.find(c => c.category === categoryName && !c.team_id) ||
                         coaches.find(c => c.category === categoryName || catTeams.some(t => t.coach_id === c.coach_id));
        coachDisplayName = catCoach?.name || "المدرب المسؤول";
      }

      setCategoryExportData({
        categoryName,
        squadName: selectedSquad ? selectedSquad.team_name : undefined,
        players: catPlayers,
        subscriptions: allSubs || [],
        headCoach: coachDisplayName
      });

      setTimeout(async () => {
        try {
          const safeName = categoryName.replace(/[^\w\u0621-\u064A]/g, '_');
          const squadSuffix = selectedSquad ? `_${selectedSquad.team_name.replace(/[^\w\u0621-\u064A]/g, '_')}` : '';
          await exportToPDF('category-players-pdf', `قائمة_لاعبين_فئة_${safeName}${squadSuffix}_${new Date().toISOString().split('T')[0]}`);
        } catch (err) {
          console.error("PDF Export error:", err);
          alert("حدث خطأ أثناء تصدير ملف PDF");
        } finally {
          setIsExportingCategoryPDF(false);
          setCategoryExportData(null);
        }
      }, 1200);
    } catch (err) {
      console.error("Export category PDF error:", err);
      setIsExportingCategoryPDF(false);
      setCategoryExportData(null);
    }
  };

  const handlePrintCategory = async (categoryName: string, squadId?: number) => {
    try {
      const allSubs = await api.getSubscriptions().catch(() => []);
      const selectedSquad = squadId ? teams.find(t => t.team_id === squadId) : null;

      const catPlayers = players.filter(p => {
        if (squadId) {
          return p.team_id === squadId;
        }
        if (p.category === categoryName) return true;
        if (p.team_id) {
          const team = teams.find(t => t.team_id === p.team_id);
          return team && team.category === categoryName;
        }
        return false;
      }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

      let coachDisplayName = "المدرب المسؤول";
      if (squadId === 8) {
        coachDisplayName = "قسوم أشرف";
      } else if (squadId === 5 || squadId === 9) {
        coachDisplayName = "شوقي حيدر";
      } else if (selectedSquad) {
        let sc = coaches.find((c: any) => c.coach_id === selectedSquad.coach_id || c.id === selectedSquad.coach_id);
        if (!sc) sc = coaches.find((c: any) => c.team_id === selectedSquad.team_id);
        coachDisplayName = sc?.name || "المدرب المسؤول";
      } else if (categoryName === 'U7') {
        coachDisplayName = "ك. شوقي حيدر";
      } else if (categoryName === 'U9') {
        coachDisplayName = "ك. قسوم أشرف";
      } else {
        const catTeams = teams.filter(t => t.category === categoryName);
        const catCoach = coaches.find(c => c.category === categoryName && !c.team_id) ||
                         coaches.find(c => c.category === categoryName || catTeams.some(t => t.coach_id === c.coach_id));
        coachDisplayName = catCoach?.name || "المدرب المسؤول";
      }

      setPrintData({
        type: 'category',
        player: null,
        categoryData: {
          categoryName,
          squadName: selectedSquad ? selectedSquad.team_name : undefined,
          players: catPlayers,
          subscriptions: allSubs || [],
          headCoach: coachDisplayName
        }
      });
      setIsCategoryExportModalOpen(false);
    } catch (err) {
      console.error("Print category error:", err);
      alert("حدث خطأ أثناء إعداد طباعة القائمة");
    }
  };

  // ─── Paid Subscribers A4 Sheet Handlers ──────────────────────────────────────
  const handleOpenPaidListSheet = async (category: string = "all", paymentType: "all_paid" | "full" | "half" = "all_paid") => {
    setSheetCategory(category);
    setSheetPaymentType(paymentType);
    setIsPaidSheetOpen(true);
    if (allSubscriptions.length === 0 || allParents.length === 0) {
      setIsLoadingPaidData(true);
      try {
        const [subs, prnts] = await Promise.all([
          api.getSubscriptions().catch(() => []),
          api.getParents().catch(() => [])
        ]);
        setAllSubscriptions(subs || []);
        setAllParents(prnts || []);
      } catch (err) {
        console.error("Failed to load subs or parents for paid sheet:", err);
      } finally {
        setIsLoadingPaidData(false);
      }
    }
  };

  const handleExportPaidExcel = () => {
    const parseBirthTime = (birthDate: any): number => {
      if (!birthDate) return Infinity;
      const parts = String(birthDate).split(/[-/.]/);
      let year: number, month: number, day: number;
      if (parts[0] && parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1] || '1', 10);
        day = parseInt(parts[2] || '1', 10);
      } else if (parts[2] && parts[2].length === 4) {
        day = parseInt(parts[0] || '1', 10);
        month = parseInt(parts[1] || '1', 10);
        year = parseInt(parts[2], 10);
      } else {
        const d = new Date(birthDate);
        return isNaN(d.getTime()) ? Infinity : d.getTime();
      }
      const t = new Date(year, month - 1, day).getTime();
      return isNaN(t) ? Infinity : t;
    };

    const resolveGuardianName = (p: any): string => {
      if (p.father_name && String(p.father_name).trim() !== '') return p.father_name;
      const matchedParent = allParents.find((pr: any) =>
        (p.parent_id && pr.id === p.parent_id) ||
        (p.parent_username && pr.username === p.parent_username) ||
        (p.phone && pr.phone === p.phone)
      );
      if (matchedParent?.full_name) return matchedParent.full_name;
      if (p.guardian_name) return p.guardian_name;
      if (p.parent_name) return p.parent_name;
      return 'غير مسجل';
    };

    const resolveGuardianPhone = (p: any): string => {
      if (p.phone && String(p.phone).trim() !== '') return p.phone;
      const matchedParent = allParents.find((pr: any) =>
        (p.parent_id && pr.id === p.parent_id) ||
        (p.parent_username && pr.username === p.parent_username)
      );
      if (matchedParent?.phone) return matchedParent.phone;
      if (p.guardian_phone) return p.guardian_phone;
      if (p.parent_phone) return p.parent_phone;
      if (p.emergency_contact) return p.emergency_contact;
      return '—';
    };

    const filtered = players.filter((p: any) => {
      if (sheetCategory !== 'all' && p.category !== sheetCategory) return false;
      const pSubs = allSubscriptions.filter((s: any) => s.player_id === p.player_id);
      const totalPaid = pSubs.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
      const hasActiveSub = pSubs.some((s: any) => s.status === 'active' || s.status === 'نشط' || s.status === 'paid');
      const isExempt = pSubs.some((s: any) => 
        (s.plan_name && (s.plan_name.includes('معفى') || s.plan_name.includes('خاصة') || s.plan_name.includes('إعفاء'))) ||
        s.status === 'معفى'
      );
      const isPaid = totalPaid > 0 || hasActiveSub;
      if (!isPaid && !isExempt) return false;

      const hasHalfPlan = pSubs.some((s: any) => (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000);
      const isFullPaid = totalPaid >= 10000 && !hasHalfPlan;
      const isHalfPaid = (hasHalfPlan || totalPaid === 5000) && !isFullPaid;

      if (sheetPaymentType === 'full' && !isFullPaid) return false;
      if (sheetPaymentType === 'half' && !isHalfPaid) return false;

      return true;
    }).sort((a: any, b: any) => parseBirthTime(a.birth_date) - parseBirthTime(b.birth_date));

    const rows = filtered.map((p, idx) => {
      const pSubs = allSubscriptions.filter((s: any) => s.player_id === p.player_id);
      const totalPaid = pSubs.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
      const hasHalfPlan = pSubs.some((s: any) => (s.plan_name && s.plan_name.includes('نصف')) || Number(s.amount) === 5000);
      const isExempt = pSubs.some((s: any) => 
        (s.plan_name && (s.plan_name.includes('معفى') || s.plan_name.includes('خاصة') || s.plan_name.includes('إعفاء'))) ||
        s.status === 'معفى'
      );
      const isFull = totalPaid >= 10000 && !hasHalfPlan;
      const isHalf = (hasHalfPlan || totalPaid === 5000) && !isFull;
      const paymentStatus = isExempt ? 'معفى' : isFull ? `دفعة كاملة (${totalPaid} دج)` : isHalf ? `نصف دفعة (${totalPaid} دج)` : `${totalPaid} دج`;

      return {
        "ت": idx + 1,
        "اسم ولقب اللاعب": p.name || '---',
        "تاريخ الميلاد": p.birth_date || '---',
        "الفئة": p.category || '---',
        "اسم ولي الأمر": resolveGuardianName(p),
        "رقم هاتف الولي": resolveGuardianPhone(p),
        "حالة السداد": paymentStatus,
        "المبلغ المسدد (دج)": totalPaid
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "اللاعبين المسددين للاشتراكات");
    const fileName = `كشف_اللاعبين_المسددين_${sheetCategory !== 'all' ? sheetCategory + '_' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(blob, fileName);
  };

  const handleOpenWhatsAppExport = () => {
    const header = "📋 *قائمة الاتصال بأولياء الأمور*\n" + "━━━━━━━━━━━━━━━\n\n";
    const list = filteredPlayers.map((p, index) => {
      const parentName = p.father_name || "غير مسجل";
      const phone = p.phone || "بدون رقم";
      const playerName = p.name || "---";
      return `${index + 1}. *الولي:* ${parentName}\n   *اللاعب:* ${playerName}\n   *الهاتف:* ${phone}\n`;
    }).join('\n');
    
    setWhatsappExportText(header + list);
    setIsExportWhatsAppOpen(true);
  };

  const handleShareToWhatsApp = () => {
    if (!whatsappExportText) return;
    
    // Fallback if text is too long (WhatsApp URL limit is ~2000-4000 chars)
    if (whatsappExportText.length > 3000) {
      navigator.clipboard.writeText(whatsappExportText);
      alert("القائمة طويلة جداً للإرسال المباشر. تم نسخ النص للحافظة، يمكنك لصقه في واتساب يدوياً.");
      return;
    }

    const link = `https://wa.me/?text=${encodeURIComponent(whatsappExportText)}`;
    window.open(link, '_blank');
  };

  const handleScoutPrint = async (player: any) => {
    try {
      const evals = await api.getEvaluations();
      const playerEval = evals.filter((e: any) => e.player_id === player.player_id)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      setPrintData({ type: 'scout', player, evaluation: playerEval });
    } catch (error) {
       console.error("Failed to load evaluation for scout report:", error);
       setPrintData({ type: 'scout', player, evaluation: null });
    }
  };

  const handlePedagogicalPrint = async (player: any) => {
    setIsPedagogicalLoading(true);
    try {
      const [evals, metrics, attendance, subscriptions, payments, messages] = await Promise.all([
        api.getEvaluationsByPlayer(player.player_id),
        api.getPhysicalMetrics(player.player_id),
        api.getPlayerAttendanceStats(player.player_id),
        api.getSubscriptionsByPlayer(player.player_id),
        api.getPlayerPayments(player.player_id),
        api.getPlayerMessages(player.player_id)
      ]);
      
      setPrintData({ 
        type: 'pedagogical', 
        player, 
        evaluations: evals,
        physicalMetrics: metrics,
        attendanceStats: attendance,
        subscriptions,
        payments,
        messages
      });
    } catch (error) {
      console.error("Failed to load data for pedagogical notebook:", error);
      alert("حدث خطأ أثناء تحميل بيانات الملف البيداغوجي");
    } finally {
      setIsPedagogicalLoading(false);
    }
  };

  if (isModalOpen) {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
          <Button variant="ghost" onClick={closeModal} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
            <ArrowRight className="h-5 w-5 ml-2" />
            عودة للقائمة
          </Button>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">
            {editingPlayer ? "تعديل بيانات اللاعب" : "إضافة لاعب جديد"}
          </h2>
        </div>
        <Card className="bg-zinc-900/40 border-zinc-800/50">
          <CardContent className="p-6">
            <form onSubmit={handleAddPlayer} className="space-y-8">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="h-32 w-32 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden bg-zinc-900 relative group shadow-xl">
                  {photoPreview ? (
                    <img src={photoPreview} className="h-full w-full object-cover" alt="Player preview" />
                  ) : (
                    <User className="h-10 w-10 text-zinc-500" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg"
                >
                  <Camera className="h-5 w-5" />
                  التقاط / رفع صورة
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1 */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-emerald-500 flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <User className="h-6 w-6" />
                      معلومات اللاعب الأساسية
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">لقب وإسم اللاعب *</label>
                        <input required name="name" defaultValue={editingPlayer?.name} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">تاريخ الازدياد *</label>
                        <input required name="birth_date" type="date" defaultValue={editingPlayer?.birth_date} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">ولاية الميلاد *</label>
                        <select
                          required
                          name="birth_state"
                          value={selectedWilaya || editingPlayer?.birth_state || ""}
                          onChange={(e) => setSelectedWilaya(e.target.value)}
                          className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        >
                          <option value="">اختر الولاية</option>
                          {wilayas.map(w => (
                            <option key={w.id} value={w.name}>{w.id} - {w.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">بلدية الميلاد *</label>
                        <select
                          required
                          name="birth_city"
                          defaultValue={editingPlayer?.birth_city}
                          className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        >
                          <option value="">اختر البلدية</option>
                          {selectedWilaya && wilayas.find(w => w.name === selectedWilaya) && algeriaCities[wilayas.find(w => w.name === selectedWilaya)!.id] ? (
                            algeriaCities[wilayas.find(w => w.name === selectedWilaya)!.id].map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))
                          ) : (
                            <option value={editingPlayer?.birth_city}>{editingPlayer?.birth_city || "اختر الولاية أولاً"}</option>
                          )}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">تاريخ الانضمام *</label>
                        <input required name="join_date" type="date" defaultValue={editingPlayer?.join_date} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">الفئة / الفوج *</label>
                        <select required name="team_id" defaultValue={editingPlayer?.team_id || (editingPlayer?.category ? `cat:${editingPlayer.category}` : "")} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all">
                          <option value="">اختر الفوج</option>
                          {categories.map(cat => (
                            <optgroup key={cat.category_id} label={cat.name} className="bg-zinc-900 text-emerald-500">
                              <option value={`cat:${cat.name}`}>{cat.name} (فئة كاملة)</option>
                              {teams.filter(t => t.category === cat.name).map(team => (
                                <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-blue-500 flex items-center gap-2 border-b border-zinc-800 pb-3 pt-4">
                      <Scale className="h-6 w-6" />
                      القياسات البدنية
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Scale className="h-4 w-4" /> الوزن (كغ)</label>
                        <input name="weight" type="number" defaultValue={editingPlayer?.weight} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Ruler className="h-4 w-4" /> الطول (سم)</label>
                        <input name="height" type="number" defaultValue={editingPlayer?.height} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Droplets className="h-4 w-4" /> زمرة الدم</label>
                        <select name="blood_type" defaultValue={editingPlayer?.blood_type} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all">
                          <option value="">غير محدد</option>
                          {bloodTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Shirt className="h-4 w-4" /> مقياس البدلة</label>
                        <input name="uniform_size" defaultValue={editingPlayer?.uniform_size} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-amber-500 flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <Users className="h-6 w-6" />
                      معلومات ولي أمر اللاعب
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">إسم الأب أو الولي *</label>
                        <input required name="father_name" defaultValue={editingPlayer?.father_name} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Phone className="h-4 w-4" /> رقم الهاتف</label>
                        <input name="phone" defaultValue={editingPlayer?.phone} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">رقم بطاقة التعريف</label>
                        <input name="id_card_number" defaultValue={editingPlayer?.id_card_number} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">تاريخ صدور بطاقة التعريف</label>
                        <input name="id_card_issue_date" type="date" defaultValue={editingPlayer?.id_card_issue_date} className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><MapPin className="h-4 w-4" /> العنوان</label>
                      <textarea name="address" defaultValue={editingPlayer?.address} rows={3} className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-base text-zinc-50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all resize-none" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-rose-500 flex items-center gap-2 border-b border-zinc-800 pb-3 pt-4">
                      <Shield className="h-6 w-6" />
                      بيانات دخول فضاء الأولياء
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">اسم المستخدم للولي *</label>
                        <input required name="parent_username" defaultValue={editingPlayer?.parent_username} placeholder="إيميل أو رقم هاتف" className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">كلمة المرور *</label>
                        <input required name="parent_password" type="password" defaultValue={editingPlayer?.parent_password} placeholder="********" className="w-full h-12 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-50 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-end gap-4 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={closeModal} className="border-zinc-700 text-zinc-300 h-12 px-8 text-base">إلغاء</Button>
                <Button type="submit" disabled={isUploading} className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 text-base shadow-lg shadow-emerald-900/20">
                  {isUploading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> جاري الحفظ...</> : (editingPlayer ? "تحديث البيانات" : "حفظ اللاعب")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate Category Statistics
  const categoryStats = categories.map(cat => {
    const catPlayers = players.filter(p => {
      if (p.category === cat.name) return true;
      if (p.team_id) {
        const team = teams.find(t => t.team_id === p.team_id);
        return team && team.category === cat.name;
      }
      return false;
    });
    
    const catTeams = teams.filter(t => t.category === cat.name);
    const catCoach = coaches.find(c => c.category === cat.name && !c.team_id);
    
    const squads = catTeams.map(team => {
      const teamPlayersCount = players.filter(p => p.team_id === team.team_id).length;
      let teamCoach = null;
      if (team.team_id === 8) {
        teamCoach = coaches.find((c: any) => c.coach_id === 13 || c.name?.includes('قسوم') || c.team_id === 8);
      } else if (team.team_id === 5 || team.team_id === 9) {
        teamCoach = coaches.find((c: any) => c.coach_id === 10 || c.name?.includes('شوقي') || c.team_id === 5 || c.team_id === 9);
      } else {
        if (team.coach_id) {
          teamCoach = coaches.find((c: any) => c.coach_id === team.coach_id || c.id === team.coach_id);
        }
        if (!teamCoach) {
          teamCoach = coaches.find((c: any) => c.team_id === team.team_id);
        }
      }
      return {
        id: team.team_id,
        name: team.team_name,
        count: teamPlayersCount,
        coach: teamCoach?.name || (team.team_id === 8 ? 'قسوم أشرف' : (team.team_id === 5 || team.team_id === 9) ? 'شوقي حيدر' : undefined)
      };
    });

    let displayHeadCoach = catCoach?.name;
    if (!displayHeadCoach && cat.name === 'U9') {
      displayHeadCoach = 'ك. قسوم أشرف';
    } else if (!displayHeadCoach && cat.name === 'U7') {
      displayHeadCoach = 'ك. شوقي حيدر';
    } else if (!displayHeadCoach && squads.length > 0) {
      const coachesList = Array.from(new Set(squads.map(s => s.coach).filter(Boolean)));
      if (coachesList.length > 0) {
        displayHeadCoach = coachesList.join(' • ');
      }
    }

    return {
      id: cat.category_id,
      name: cat.name,
      totalPlayers: catPlayers.length,
      headCoach: displayHeadCoach,
      squads: squads
    };
  }).filter(c => c.totalPlayers > 0 || c.squads.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">إدارة اللاعبين</h2>
          <p className="text-zinc-400 mt-1 text-sm">إدارة شاملة لبيانات اللاعبين وأولياء أمورهم.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => handleOpenPaidListSheet(selectedCategoryFilter || "all", "all_paid")}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex-1 sm:flex-initial shadow-lg shadow-emerald-900/30 border border-emerald-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="mr-2 h-4 w-4" />
            <span>كشف المسددين A4 (40 لاعب)</span>
          </Button>
          <Button onClick={() => setIsCategoryExportModalOpen(true)} variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex-1 sm:flex-initial">
            <FileText className="mr-2 h-4 w-4" />
            تصدير قوائم الفئات PDF
          </Button>
          <Button onClick={() => setIsBulkWhatsAppOpen(true)} variant="outline" className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 flex-1 sm:flex-initial">
            <MessageCircle className="mr-2 h-4 w-4" />
            رسالة جماعية
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10 flex-1 sm:flex-initial">
            <Download className="mr-2 h-4 w-4" />
            تصدير Excel
          </Button>
          <Button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial shadow-lg shadow-emerald-900/20">
            <Plus className="mr-2 h-4 w-4" />
            إضافة لاعب
          </Button>
        </div>
      </div>

      {/* Category Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        {categoryStats.map((cat) => (
          <Card 
            key={cat.id} 
            onClick={() => {
              if (selectedCategoryFilter === cat.name && selectedSquadId === null) {
                setSelectedCategoryFilter(null);
                setSelectedSquadId(null);
              } else {
                setSelectedCategoryFilter(cat.name);
                setSelectedSquadId(null);
              }
            }}
            className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 cursor-pointer ${
              selectedCategoryFilter === cat.name 
                ? 'bg-zinc-800/90 border-emerald-500/50 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/30' 
                : 'bg-zinc-900/40 border-zinc-800/50 hover:border-emerald-500/30'
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
            
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                  selectedCategoryFilter === cat.name ? 'bg-emerald-500 text-zinc-950' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  <Shield className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    {selectedCategoryFilter === cat.name && (
                      <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                        محددة الآن
                      </span>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">فئة برعم</p>
                  </div>
                  <CardTitle className="text-xl font-black text-white">{cat.name}</CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 relative z-10">
              {/* Main Stats */}
              <div className="flex items-end justify-between bg-zinc-950/40 rounded-xl p-3 border border-zinc-800/30">
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-bold mb-1">المدرب الرئيسي للفئة</p>
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <User className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-bold truncate max-w-[120px]">{cat.headCoach || "غير معين"}</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-zinc-500 font-bold mb-1">إجمالي اللاعبين</p>
                  <p className="text-2xl font-black text-white leading-none font-mono">{cat.totalPlayers}</p>
                </div>
              </div>

              {/* Squads Breakdown - Clickable squads for instant filtering */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> تفاصيل الأفواج (اضغط للفلترة)</span>
                  <span className="text-[9px] text-zinc-600">{cat.squads.length} فوج</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {cat.squads.length > 0 ? cat.squads.map(squad => (
                    <div 
                      key={squad.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryFilter(cat.name);
                        setSelectedSquadId(selectedSquadId === squad.id ? null : squad.id);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedSquadId === squad.id
                          ? 'bg-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500 text-white shadow-sm'
                          : 'bg-zinc-800/30 border-zinc-800/50 hover:bg-zinc-800/70 hover:border-emerald-500/40'
                      }`}
                      title={`تصفية وعرض قائمة لاعبي ${squad.name}`}
                    >
                      <div className="flex flex-col text-right">
                        <span className={`text-xs font-bold ${selectedSquadId === squad.id ? 'text-emerald-300 font-black' : 'text-zinc-200'}`}>
                          {squad.name}
                        </span>
                        <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                           <User className="h-2.5 w-2.5 text-emerald-400" /> {squad.coach ? `ك. ${squad.coach}` : "بدون مدرب"}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-black min-w-[45px] text-center transition-colors ${
                        selectedSquadId === squad.id ? 'bg-emerald-500 text-zinc-950 font-black' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {squad.count} لاعب
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-2 bg-zinc-800/20 rounded-lg border border-dashed border-zinc-800">
                      <p className="text-[10px] text-zinc-600">لا توجد أفواج مسجلة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Category PDF Export Button */}
              <div className="pt-2 border-t border-zinc-800/50">
                <Button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleExportCategoryPDF(cat.name); 
                  }} 
                  size="sm" 
                  variant="outline" 
                  disabled={isExportingCategoryPDF}
                  className="w-full h-8 text-xs font-bold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 gap-1.5 transition-all"
                >
                  {isExportingCategoryPDF && categoryExportData?.categoryName === cat.name ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  تصدير قائمة {cat.name} (PDF)
                </Button>
              </div>
            </CardContent>
            
            {/* Bottom Progress Accent */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l from-emerald-500 to-blue-500 transition-opacity ${
              selectedCategoryFilter === cat.name ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'
            }`}></div>
          </Card>
        ))}
      </div>

      {/* ─── Active Filter Spotlight & Coach Showcase Banner ─── */}
      {activeFilterInfo && (
        <div className="rounded-2xl bg-gradient-to-l from-zinc-900/90 via-zinc-900/80 to-emerald-950/40 border border-emerald-500/40 p-4 sm:p-5 shadow-xl shadow-emerald-950/20 backdrop-blur-md relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            {/* Title & Coach Info */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-inner">
                <Shield className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {activeFilterInfo.type === 'squad' ? 'فوج محدد' : 'فئة كاملة'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{activeFilterInfo.title}</h3>
                </div>

                {/* Coach Details */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300 pt-0.5">
                  <span className="text-zinc-400 font-bold">{activeFilterInfo.coachRole}:</span>
                  <div className="inline-flex items-center gap-2 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-bold text-emerald-300 shadow-sm">
                    <User className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-black">ك. {activeFilterInfo.coachName}</span>
                    {activeFilterInfo.coachPhone && (
                      <a 
                        href={`tel:${activeFilterInfo.coachPhone}`} 
                        className="text-zinc-400 hover:text-emerald-400 mr-2 border-r border-zinc-700 pr-2 flex items-center gap-1 font-mono text-xs"
                        title={`اتصال هاتفي بالمدرب: ${activeFilterInfo.coachPhone}`}
                      >
                        <Phone className="h-3 w-3 text-emerald-500" />
                        <span>{activeFilterInfo.coachPhone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-zinc-950/70 border border-zinc-800/80 px-4 py-2.5 rounded-xl text-center shadow-inner">
                <p className="text-[10px] text-zinc-400 font-bold">إجمالي لاعبي القائمة</p>
                <p className="text-xl font-black text-white font-mono leading-none mt-0.5">
                  {filteredPlayers.length} <span className="text-xs font-normal text-zinc-400">لاعب</span>
                </p>
              </div>

              {selectedCategoryFilter && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePrintCategory(selectedCategoryFilter, selectedSquadId || undefined)}
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 text-zinc-300 font-bold text-xs h-10 px-3.5 gap-1.5"
                    title="طباعة فورية A4 للقائمة المحددة"
                  >
                    <Printer className="h-4 w-4" />
                    <span>طباعة القائمة</span>
                  </Button>

                  <Button
                    onClick={() => handleExportCategoryPDF(selectedCategoryFilter, selectedSquadId || undefined)}
                    disabled={isExportingCategoryPDF}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-3.5 gap-1.5 shadow-md shadow-emerald-950/30"
                  >
                    {isExportingCategoryPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    تحميل كشف PDF
                  </Button>
                </div>
              )}

              <Button
                onClick={() => {
                  setSelectedCategoryFilter(null);
                  setSelectedSquadId(null);
                }}
                variant="outline"
                size="sm"
                className="border-zinc-700 hover:border-rose-500/50 hover:bg-rose-500/10 text-zinc-300 hover:text-rose-400 font-bold text-xs h-10 px-3 gap-1.5"
              >
                <X className="h-4 w-4" />
                إلغاء الفلترة (عرض الكل)
              </Button>
            </div>
          </div>

          {/* Interactive Squad Pills Bar (if category has multiple squads) */}
          {selectedCategoryFilter && availableSquadsForCategory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800/70 flex flex-wrap items-center gap-2 relative z-10">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 ml-1">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                أفواج الفئة:
              </span>

              {/* All Squads in Category Pill */}
              <button
                type="button"
                onClick={() => setSelectedSquadId(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedSquadId === null
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                    : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                }`}
              >
                جميع الأفواج ({categoryStats.find(c => c.name === selectedCategoryFilter)?.totalPlayers || 0} لاعب)
              </button>

              {/* Individual Squad Pills */}
              {availableSquadsForCategory.map((team: any) => {
                const teamCount = players.filter(p => p.team_id === team.team_id).length;
                const teamCoach = coaches.find(c => c.team_id === team.team_id || (team.coach_id && (c.coach_id === team.coach_id || c.id === team.coach_id)));
                const isSelected = selectedSquadId === team.team_id;

                return (
                  <button
                    key={team.team_id}
                    type="button"
                    onClick={() => setSelectedSquadId(isSelected ? null : team.team_id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                        : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                    }`}
                  >
                    <span>{team.team_name}</span>
                    {teamCoach && (
                      <span className={`text-[10px] ${isSelected ? 'text-zinc-900 font-bold' : 'text-zinc-400'}`}>
                        • ك. {teamCoach.name}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-zinc-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {teamCount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Main Players List Card ─── */}
      <Card className="bg-zinc-900/40 border-zinc-800/50 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header Toolbar: Search, View Mode, Count, and Scanner */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-zinc-800/60 bg-zinc-950/40">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="بحث سريع عن لاعب بالاسم، رقم المعرف، هاتف الولي، أو QR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pr-10 pl-4 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsQrScannerOpen(true)}
                className="h-10 w-10 border-zinc-800 text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/40 rounded-xl"
                title="مسح QR Code"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-2.5">
              {/* Counter */}
              <div className="text-xs font-bold text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-3 py-2 rounded-xl">
                عدد اللاعبين: <span className="text-emerald-400 font-black font-mono">{filteredPlayers.length}</span>
                <span className="text-zinc-500 font-normal"> / {players.length}</span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'table'
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="عرض جدول منظم"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">جدول</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'cards'
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="عرض بطاقات اللاعبين"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">بطاقات</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── View 1: Professional Table View (Desktop & Responsive) ─── */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-zinc-400 bg-zinc-950/70 border-b border-zinc-800/60 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-3 py-3.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={filteredPlayers.length > 0 && filteredPlayers.every(p => selectedPlayerIds.has(p.player_id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlayerIds(prev => {
                              const next = new Set(prev);
                              filteredPlayers.forEach(p => next.add(p.player_id));
                              return next;
                            });
                          } else {
                            setSelectedPlayerIds(prev => {
                              const next = new Set(prev);
                              filteredPlayers.forEach(p => next.delete(p.player_id));
                              return next;
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                        title="تحديد الكل"
                      />
                    </th>
                    <th className="px-3 py-3.5 font-black text-center w-10 text-zinc-400">#</th>
                    <th className="px-5 py-3.5 font-black text-zinc-300">اللاعب ومعلوماته</th>
                    <th className="px-4 py-3.5 font-black text-zinc-300">الفئة / الفوج</th>
                    <th className="px-4 py-3.5 font-black text-zinc-300">المدرب المسؤول</th>
                    <th className="px-4 py-3.5 font-black text-zinc-300">الميلاد / السن</th>
                    <th className="px-4 py-3.5 font-black text-zinc-300">الولي والهاتف</th>
                    <th className="px-4 py-3.5 font-black text-center text-zinc-300">المقاس / الحالة</th>
                    <th className="px-5 py-3.5 font-black text-left text-zinc-300">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                          <span className="text-sm font-bold">جاري تحميل بيانات اللاعبين...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                          <User className="h-10 w-10 text-zinc-600" />
                          <span className="text-sm font-bold text-zinc-400">لا يوجد لاعبون مطابقون للبحث أو الفلترة المحددة</span>
                          {(selectedCategoryFilter || selectedSquadId || searchQuery) && (
                            <Button 
                              onClick={() => { setSelectedCategoryFilter(null); setSelectedSquadId(null); setSearchQuery(""); }} 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 text-xs border-zinc-700 text-zinc-300"
                            >
                              إعادة ضبط الفلاتر
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((player, idx) => {
                      const coachInfo = getPlayerCoachInfo(player);
                      const age = calculateAge(player.birth_date);
                      const team = teams.find(t => t.team_id === player.team_id);
                      const categoryName = player.category || team?.category || "غير محدد";
                      const squadName = team?.team_name ? (team.team_name.startsWith('فوج') ? team.team_name : `فوج ${team.team_name}`) : (player.group_name || "—");
                      const isSelected = selectedPlayerIds.has(player.player_id);

                      return (
                        <tr 
                          key={player.player_id} 
                          className={`transition-colors group ${
                            isSelected 
                              ? 'bg-emerald-950/30 hover:bg-emerald-950/40 border-r-4 border-r-emerald-500' 
                              : 'hover:bg-zinc-800/30'
                          }`}
                        >
                          {/* 0. Select Checkbox */}
                          <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedPlayerIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(player.player_id)) next.delete(player.player_id);
                                  else next.add(player.player_id);
                                  return next;
                                });
                              }}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                            />
                          </td>

                          {/* 1. Numbering (#) */}
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono text-xs font-black border transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black'
                                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 group-hover:border-emerald-500/40 group-hover:text-emerald-400'
                            }`}>
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                          </td>

                          {/* 2. Photo & Player Info */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div 
                                className="h-11 w-11 rounded-xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-emerald-400 overflow-hidden flex-shrink-0 cursor-pointer shadow-md group-hover:ring-2 group-hover:ring-emerald-500/50 transition-all"
                                onClick={() => setSelectedPlayerDetails(player)}
                                title="عرض تفاصيل اللاعب"
                              >
                                {player.photo_url ? (
                                  <img src={player.photo_url} className="h-full w-full object-cover" alt={player.name} />
                                ) : (
                                  <div className="flex flex-col items-center justify-center">
                                    <User className="h-5 w-5 text-zinc-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span 
                                  className="font-black text-zinc-100 group-hover:text-emerald-400 transition-colors cursor-pointer text-sm"
                                  onClick={() => setSelectedPlayerDetails(player)}
                                >
                                  {player.name}
                                </span>
                                <span className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                  {player.father_name ? `الولي: ${player.father_name}` : "الولي: غير مسجل"}
                                  &nbsp;•&nbsp;
                                  <span className="font-mono text-zinc-400">ID #{player.player_id}</span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Category & Squad */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Shield className="h-3 w-3" />
                                {categoryName}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                                <Users className="h-2.5 w-2.5 text-zinc-400" />
                                {squadName}
                              </span>
                            </div>
                          </td>

                          {/* 4. Coach Name for the Squad / Category */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {coachInfo ? (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-200">
                                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                                    <User className="h-3 w-3" />
                                  </div>
                                  <span className="truncate max-w-[140px] font-black text-emerald-300">
                                    ك. {coachInfo.name}
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-400 mt-0.5 pr-6">
                                  {coachInfo.role}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-500 italic">غير معين</span>
                            )}
                          </td>

                          {/* 5. Birth Date & Age */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-bold text-zinc-200">{player.birth_date || '—'}</span>
                              {age !== null && (
                                <span className="text-[10px] text-emerald-400 font-bold mt-0.5">
                                  {age} سنة
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Guardian Phone */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {player.phone ? (
                              <div className="flex items-center gap-2">
                                <a 
                                  href={`tel:${player.phone}`} 
                                  className="font-mono text-xs font-bold text-zinc-200 hover:text-emerald-400 transition-colors flex items-center gap-1"
                                  title="اتصال هاتفي"
                                >
                                  <Phone className="h-3 w-3 text-zinc-400" />
                                  <span>{player.phone}</span>
                                </a>
                                <a 
                                  href={`https://wa.me/213${player.phone.replace(/^0/, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                  title="مراسلة واتساب"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-500">لا يوجد هاتف</span>
                            )}
                          </td>

                          {/* 7. Kit Size & Active Status */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              {player.uniform_size && player.uniform_size !== '---' ? (
                                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-mono font-bold">
                                  {player.uniform_size}
                                </span>
                              ) : null}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                نشط
                              </span>
                            </div>
                          </td>

                          {/* 8. Actions Toolbar */}
                          <td className="px-5 py-3 whitespace-nowrap text-left">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedPlayerDetails(player)} title="عرض التفاصيل الكاملة" className="text-zinc-400 hover:text-emerald-400 h-8 w-8 p-0">
                                <Info className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleExportPDF('application', player)} title="استمارة التسجيل" className="text-zinc-400 hover:text-blue-400 h-8 w-8 p-0">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleExportPDF('card', player)} title="بطاقة اللاعب" className="text-zinc-400 hover:text-amber-400 h-8 w-8 p-0">
                                <IdCard className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/academy/physical-metrics?player_id=${player.player_id}`)} title="القياسات البدنية" className="text-zinc-400 hover:text-emerald-400 h-8 w-8 p-0">
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleScoutPrint(player)} title="تقرير الكشاف (FIFA Card)" className="text-zinc-400 hover:text-amber-400 h-8 w-8 p-0">
                                <Trophy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handlePedagogicalPrint(player)} title="الدفتر البيداغوجي" className="text-zinc-400 hover:text-emerald-400 h-8 w-8 p-0" disabled={isPedagogicalLoading}>
                                {isPedagogicalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedPlayerForMessage(player); setIsMessageModalOpen(true); }} title="إرسال رسالة خاصة للولي" className="text-zinc-400 hover:text-blue-400 h-8 w-8 p-0">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openSingleReassign(player)} title="تغيير الفئة والفوج والمدرب بضغطة زر" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-8 px-2 text-xs font-bold flex items-center gap-1">
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                                <span>نقل</span>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(player)} title="تعديل بيانات اللاعب" className="text-zinc-400 hover:text-emerald-400 h-8 px-2 text-xs font-bold">
                                تعديل
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeletePlayer(player.player_id)} title="حذف" className="text-zinc-400 hover:text-rose-400 h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ─── View 2: Professional Player Cards Grid View ─── */
            <div className="p-4 sm:p-5">
              {isLoading ? (
                <div className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                    <span className="text-sm font-bold">جاري تحميل بيانات اللاعبين...</span>
                  </div>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                    <User className="h-10 w-10 text-zinc-600" />
                    <span className="text-sm font-bold text-zinc-400">لا يوجد لاعبون مطابقون للبحث أو الفلترة المحددة</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredPlayers.map((player, idx) => {
                    const coachInfo = getPlayerCoachInfo(player);
                    const age = calculateAge(player.birth_date);
                    const team = teams.find(t => t.team_id === player.team_id);
                    const categoryName = player.category || team?.category || "غير محدد";
                    const squadName = team?.team_name ? (team.team_name.startsWith('فوج') ? team.team_name : `فوج ${team.team_name}`) : (player.group_name || "—");

                    return (
                      <div 
                        key={player.player_id}
                        className={`group relative rounded-2xl bg-zinc-950/70 border p-4 transition-all duration-300 flex flex-col justify-between ${
                          selectedPlayerIds.has(player.player_id)
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20 shadow-xl shadow-emerald-950/30'
                            : 'border-zinc-800/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/20'
                        }`}
                      >
                        <div>
                          {/* Card Top: Selection Checkbox, Numbering # & Category badge */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedPlayerIds.has(player.player_id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlayerIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(player.player_id)) next.delete(player.player_id);
                                    else next.add(player.player_id);
                                    return next;
                                  });
                                }}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                              />
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-zinc-800/90 text-zinc-300 font-mono text-xs font-black border border-zinc-700/60">
                                #{(idx + 1).toString().padStart(2, '0')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {categoryName}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                {squadName}
                              </span>
                            </div>
                          </div>

                          {/* Player Avatar & Primary Info */}
                          <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => setSelectedPlayerDetails(player)}>
                            <div className="h-14 w-14 rounded-2xl bg-zinc-800 border border-zinc-700/80 overflow-hidden flex-shrink-0 flex items-center justify-center text-emerald-400 shadow-md group-hover:ring-2 group-hover:ring-emerald-500/50 transition-all">
                              {player.photo_url ? (
                                <img src={player.photo_url} className="h-full w-full object-cover" alt={player.name} />
                              ) : (
                                <User className="h-7 w-7 text-zinc-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-white text-base truncate group-hover:text-emerald-400 transition-colors">
                                {player.name}
                              </h4>
                              <p className="text-xs text-zinc-400 truncate mt-0.5">
                                {player.father_name ? `الولي: ${player.father_name}` : "الولي: غير مسجل"}
                              </p>
                              <p className="text-[10px] font-mono text-zinc-500">
                                المعرف: #{player.player_id}
                              </p>
                            </div>
                          </div>

                          {/* Coach Highlight Box */}
                          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 mb-3 space-y-0.5">
                            <p className="text-[9px] text-zinc-500 font-bold">
                              {coachInfo?.role || "المدرب المسؤول"}:
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-black text-xs text-emerald-400">
                                <User className="h-3 w-3" />
                                <span>{coachInfo ? `ك. ${coachInfo.name}` : "غير معين"}</span>
                              </div>
                              {coachInfo?.phone && (
                                <a 
                                  href={`tel:${coachInfo.phone}`}
                                  className="text-zinc-400 hover:text-emerald-400 text-[10px] font-mono flex items-center gap-0.5"
                                  title="اتصال بالمدرب"
                                >
                                  <Phone className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                              <span className="text-[10px] text-zinc-500 block">الميلاد / السن</span>
                              <span className="font-bold text-zinc-200 text-[11px] font-mono">
                                {player.birth_date || '—'} {age ? `(${age} سنة)` : ''}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                              <span className="text-[10px] text-zinc-500 block">المقاس / الهاتف</span>
                              <span className="font-bold text-zinc-200 text-[11px] truncate block font-mono">
                                {player.uniform_size || '—'} {player.phone ? `• ${player.phone}` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-2 border-t border-zinc-800/70 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedPlayerDetails(player)} title="تفاصيل" className="h-8 w-8 p-0 text-zinc-400 hover:text-emerald-400">
                              <Info className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleExportPDF('card', player)} title="بطاقة اللاعب" className="h-8 w-8 p-0 text-zinc-400 hover:text-amber-400">
                              <IdCard className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleExportPDF('application', player)} title="استمارة" className="h-8 w-8 p-0 text-zinc-400 hover:text-blue-400">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedPlayerForMessage(player); setIsMessageModalOpen(true); }} title="رسالة" className="h-8 w-8 p-0 text-zinc-400 hover:text-emerald-400">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openSingleReassign(player)} title="تغيير الفئة والمدرب" className="h-8 px-2 text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 flex items-center gap-1">
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                              <span>نقل</span>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(player)} className="h-8 px-2.5 text-xs font-bold text-zinc-300 hover:text-emerald-400">
                              تعديل
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePlayer(player.player_id)} className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-400">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Floating Bulk Actions Toolbar (Appears when 1+ players selected) ─── */}
      {selectedPlayerIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-3xl mx-auto z-40 bg-zinc-950/95 backdrop-blur-xl border-2 border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-black/90 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-base shrink-0 border border-emerald-500/40 shadow-inner">
              {selectedPlayerIds.size}
            </div>
            <div>
              <p className="text-xs font-black text-zinc-100 flex items-center gap-1.5">
                <span>تم تحديد {selectedPlayerIds.size} لاعبين</span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] text-emerald-400 font-bold">جاهز لإجراء التغيير الجماعي</span>
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                تغيير الفئة والفوج والمدرب دفعة واحدة بضغطة زر مع الحفاظ على جميع البيانات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Select All Filtered Button */}
            {selectedPlayerIds.size < filteredPlayers.length && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlayerIds(new Set(filteredPlayers.map(p => p.player_id)));
                }}
                className="text-[11px] font-bold text-zinc-300 hover:text-white px-2.5 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-all"
              >
                تحديد الكل ({filteredPlayers.length})
              </button>
            )}

            {/* Main Execute Button */}
            <Button
              onClick={openBulkReassign}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 flex-1 sm:flex-initial justify-center"
            >
              <ArrowRightLeft className="h-4 w-4" />
              تغيير الفئة والفوج والمدرب ({selectedPlayerIds.size})
            </Button>

            {/* Deselect All */}
            <button
              type="button"
              onClick={() => setSelectedPlayerIds(new Set())}
              className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
              title="إلغاء التحديد"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}



      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="حذف اللاعب"
        message="هل أنت متأكد من حذف هذا اللاعب؟ سيؤدي ذلك لحذف كافة بياناته، اشتراكاته، وسجلاته البدنية والتقنية بشكل نهائي."
      />

      {printData.type && (printData.player || (printData.type === 'category' && printData.categoryData)) && (
        <PrintPortal
          onClose={() => setPrintData({ type: null, player: null })}
          title={
            printData.type === 'category' ? `قائمة لاعبي فئة ${printData.categoryData?.categoryName}` :
            printData.type === 'application' ? `استمارة تسجيل - ${printData.player?.name}` : 
            printData.type === 'pedagogical' ? `الدفتر البيداغوجي الإلكتروني - ${printData.player?.name}` :
            printData.type === 'scout' ? `تقرير الكشاف - ${printData.player?.name}` :
            `بطاقة اللاعب - ${printData.player?.name}`
          }
          fileName={
            printData.type === 'category' ? `قائمة_فئة_${printData.categoryData?.categoryName}` :
            printData.type === 'application' ? `App-${printData.player?.name}` : 
            printData.type === 'pedagogical' ? `PedagogicalNotebook-${printData.player?.name}` :
            printData.type === 'scout' ? `ScoutReport-${printData.player?.name}` :
            `Card-${printData.player?.name}`
          }
          id={printData.type === 'category' ? "category-players-report" : printData.type === 'pedagogical' ? "pedagogical-notebook-doc" : "player-doc"}
        >
          <div className="bg-white p-4">
            {printData.type === 'application' ? (
              <PlayerApplicationTemplate
                player={printData.player}
                teamName={teams.find(t => t.team_id === printData.player.team_id)?.team_name || "غير محدد"}
                academySettings={academySettings}
              />
            ) : printData.type === 'card' ? (
              <PlayerCardTemplate
                player={printData.player}
                teamName={teams.find(t => t.team_id === printData.player.team_id)?.team_name || ""}
                coachName={
                  (() => {
                    const team = teams.find(t => t.team_id === printData.player.team_id);
                    if (team?.coach_id) {
                      const coach = coaches.find(c => c.coach_id === team.coach_id);
                      return coach?.name;
                    }
                    return undefined;
                  })()
                }
                academySettings={academySettings}
              />
            ) : printData.type === 'scout' ? (
              <ScoutReportTemplate
                player={printData.player}
                evaluation={printData.evaluation}
                academySettings={academySettings}
              />
            ) : printData.type === 'pedagogical' ? (
              <PedagogicalNotebookTemplate 
                player={printData.player}
                evaluations={printData.evaluations}
                physicalMetrics={printData.physicalMetrics}
                attendanceStats={printData.attendanceStats}
                subscriptions={printData.subscriptions}
                payments={printData.payments}
                messages={printData.messages}
                academySettings={academySettings}
              />
            ) : printData.type === 'category' && printData.categoryData ? (
              <CategoryPlayersListTemplate
                categoryName={printData.categoryData.categoryName}
                squadName={printData.categoryData.squadName}
                players={printData.categoryData.players}
                teams={teams}
                coaches={coaches}
                subscriptions={printData.categoryData.subscriptions}
                headCoach={printData.categoryData.headCoach}
                academySettings={academySettings}
              />
            ) : null}
          </div>
        </PrintPortal>
      )}

      {/* ── Paid Subscribers A4 Sheet Print Portal ─────────────────────────────────────── */}
      {isPaidSheetOpen && (
        <PrintPortal
          onClose={() => setIsPaidSheetOpen(false)}
          title={`كشف اللاعبين المسددين لاشتراكاتهم (A4) - ${sheetCategory === 'all' ? 'جميع الفئات' : 'فئة ' + sheetCategory}`}
          fileName={`Paid-Players-A4-${sheetCategory}-${new Date().toISOString().split('T')[0]}`}
          id="paid-subscribers-sheet-players"
        >
          {/* Top Control Bar in Portal */}
          <div className="bg-zinc-900 border-b border-zinc-800 p-3 flex flex-wrap items-center justify-between gap-3 text-sm no-print">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-400 px-2 font-bold">نوع السداد:</span>
                <button
                  type="button"
                  onClick={() => setSheetPaymentType('all_paid')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    sheetPaymentType === 'all_paid'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  جميع المسددين
                </button>
                <button
                  type="button"
                  onClick={() => setSheetPaymentType('full')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    sheetPaymentType === 'full'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  دفعة كاملة (10,000 دج)
                </button>
                <button
                  type="button"
                  onClick={() => setSheetPaymentType('half')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    sheetPaymentType === 'half'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  نصف دفعة (5,000 دج)
                </button>
              </div>

              <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-400 font-bold">الفئة:</span>
                <select
                  value={sheetCategory}
                  onChange={(e) => setSheetCategory(e.target.value)}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900 text-white">جميع الفئات</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-zinc-900 text-white">فئة {cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportPaidExcel}
              className="flex items-center gap-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="تصدير كشف إكسل بنفس البيانات والترتيب"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تصدير ملف Excel</span>
            </button>
          </div>

          {isLoadingPaidData ? (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
              <p className="text-sm">جاري جلب بيانات الاشتراكات وأولياء الأمور...</p>
            </div>
          ) : (
            <PaidSubscribersA4SheetTemplate
              players={players}
              subscriptions={allSubscriptions}
              parents={allParents}
              academySettings={academySettings}
              categoryFilter={sheetCategory}
              paymentTypeFilter={sheetPaymentType}
              containerId="paid-subscribers-sheet-players-content"
            />
          )}
        </PrintPortal>
      )}

      {/* Category PDF Hidden Export Container */}
      {categoryExportData && (
        <div 
          id="category-players-pdf" 
          style={{ position: 'fixed', left: 0, top: 0, width: '210mm', zIndex: -999, pointerEvents: 'none', background: '#ffffff' }}
        >
          <CategoryPlayersListTemplate
            categoryName={categoryExportData.categoryName}
            squadName={categoryExportData.squadName}
            players={categoryExportData.players}
            teams={teams}
            coaches={coaches}
            subscriptions={categoryExportData.subscriptions}
            headCoach={categoryExportData.headCoach}
            academySettings={academySettings}
          />
        </div>
      )}

      {/* Category PDF Selection Modal */}
      <Modal 
        isOpen={isCategoryExportModalOpen} 
        onClose={() => setIsCategoryExportModalOpen(false)} 
        title="تصدير قوائم اللاعبين حسب الفئات والأفواج (PDF / طباعة)" 
        size="md"
      >
        <div className="space-y-4 pt-4 text-right font-tajawal" dir="rtl">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              اختر الفئة أو الفوج الذي ترغب في تصدير قائمته الرسمية أو طباعتها مباشرة A4 مع مدرب الفوج وتدقيق اشتراكات كل لاعب.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {categoryStats.map((cat) => (
              <div 
                key={cat.id} 
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-500/40 transition-all group space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{cat.name}</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      المدرب: <span className="text-zinc-300 font-bold">{cat.headCoach || "غير محدد"}</span>
                      &nbsp;•&nbsp;
                      إجمالي الفئة: <span className="text-emerald-400 font-bold font-mono">{cat.totalPlayers}</span> لاعب
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setIsCategoryExportModalOpen(false);
                        handleOpenPaidListSheet(cat.name, "all_paid");
                      }}
                      variant="outline"
                      size="sm"
                      className="border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs h-8 px-2.5 gap-1.5"
                      title="كشف المسددين A4 (40 لاعب) لهذه الفئة"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>كشف المسددين</span>
                    </Button>

                    <Button
                      onClick={() => handlePrintCategory(cat.name)}
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 text-zinc-300 font-bold text-xs h-8 px-2.5 gap-1.5"
                      title="طباعة كامل الفئة A4"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>طباعة الفئة</span>
                    </Button>

                    <Button
                      onClick={() => handleExportCategoryPDF(cat.name)}
                      disabled={isExportingCategoryPDF}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3.5 gap-1.5 shadow-md shadow-emerald-900/20"
                      title="تحميل PDF لكامل الفئة"
                    >
                      {isExportingCategoryPDF && categoryExportData?.categoryName === cat.name && !categoryExportData?.squadName ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      تحميل PDF
                    </Button>
                  </div>
                </div>

                {/* Squad-level quick print/download (e.g. U9 A vs U9 B) */}
                {cat.squads && cat.squads.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                    <div className="text-[10px] font-bold text-zinc-400">طباعة أو تحميل حسب الفوج والمدرب:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {cat.squads.map((squad: any) => (
                        <div 
                          key={squad.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 hover:border-emerald-500/30 transition-colors"
                        >
                          <div className="min-w-0 pr-1">
                            <div className="text-xs font-bold text-zinc-200 truncate">{squad.name}</div>
                            <div className="text-[10px] text-zinc-400 truncate">
                              المدرب: <span className="text-emerald-400 font-semibold">{squad.coach || "غير محدد"}</span> ({squad.count} لاعب)
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handlePrintCategory(cat.name, squad.id)}
                              className="p-1.5 rounded-md hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 border border-zinc-700/50 hover:border-emerald-500/40 transition-colors"
                              title={`طباعة ${squad.name}`}
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleExportCategoryPDF(cat.name, squad.id)}
                              disabled={isExportingCategoryPDF}
                              className="p-1.5 rounded-md hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 border border-zinc-700/50 hover:border-emerald-500/40 transition-colors"
                              title={`تحميل PDF ${squad.name}`}
                            >
                              {isExportingCategoryPDF && categoryExportData?.squadName === squad.name ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-800">
            <Button 
              variant="outline" 
              onClick={() => setIsCategoryExportModalOpen(false)} 
              className="border-zinc-800 text-zinc-400 text-xs"
            >
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>

      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScan={(code) => setSearchQuery(code)}
        players={players}
      />
      {/* Private Message Modal */}
      <Modal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} title={`إرسال ملاحظة خاصة: ${selectedPlayerForMessage?.name}`} size="md">
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">نص الملاحظة أو الرسالة</label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="اكتب رسالتك هنا... سيتمكن الولي من رؤيتها في فضاء الأولياء."
              className="w-full h-32 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMessageModalOpen(false)} className="border-zinc-800 text-zinc-300">إلغاء</Button>
            <Button onClick={handleSendMessage} disabled={isSending || !messageText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> إرسال الآن</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk WhatsApp Modal */}
      <Modal isOpen={isBulkWhatsAppOpen} onClose={() => setIsBulkWhatsAppOpen(false)} title="رسالة جماعية لجميع الأولياء (WhatsApp)" size="md">
        <div className="space-y-4 pt-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-500 mt-0.5" />
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              سيقوم النظام بفتح تطبيق واتساب بالرسالة المكتوبة. يمكنك إرسالها للأولياء المسجلة أرقام هواتفهم.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">محتوى الرسالة الجماعية</label>
            <textarea
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              placeholder="اكتب التنبيه أو الإعلان هنا..."
              className="w-full h-40 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-zinc-500 text-center">عدد الأرقام المستهدفة: {Array.from(new Set(players.map(p => p.phone).filter(p => !!p))).length}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBulkWhatsAppOpen(false)} className="border-zinc-800 text-zinc-300">إلغاء</Button>
              <Button onClick={handleBulkWhatsApp} disabled={!bulkMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <MessageCircle className="mr-2 h-4 w-4" />
                فتح في واتساب
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* WhatsApp Export Modal */}
      <Modal isOpen={isExportWhatsAppOpen} onClose={() => setIsExportWhatsAppOpen(false)} title="تصدير قائمة الأولياء لواتساب" size="lg">
        <div className="space-y-4 pt-4" dir="rtl">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-green-500 mt-0.5" />
            <p className="text-xs text-green-200/80 leading-relaxed font-tajawal">
              هذه الواجهة تسمح لك بتصدير قائمة بجميع أرقام وأسماء الأولياء لمشاركتها عبر واتساب أو حفظها كملاحظة.
            </p>
          </div>
          
          <div className="relative">
            <textarea
              readOnly
              value={whatsappExportText}
              className="w-full h-80 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 font-mono focus:outline-none"
            />
            <div className="absolute top-2 left-2">
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText(whatsappExportText);
                  alert("تم نسخ النص للحافظة");
                }}
                className="h-8 text-xs bg-zinc-900/50 hover:bg-zinc-800 rounded-lg"
               >
                 نسخ النص
               </Button>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-zinc-800 pt-4">
            <p className="text-[10px] text-zinc-500 font-tajawal">
              عدد اللاعبين المشمولين: {filteredPlayers.length}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsExportWhatsAppOpen(false)} className="border-zinc-800 text-zinc-300 font-tajawal rounded-xl">
                إغلاق
              </Button>
              <Button onClick={handleShareToWhatsApp} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-green-900/20 font-tajawal">
                <MessageCircle className="mr-2 h-4 w-4 ml-2" />
                مشاركة عبر WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* EA FC / FIFA Player Card Modal */}
      <Modal
        isOpen={!!futModalPlayer}
        onClose={() => setFutModalPlayer(null)}
        title={`بطاقة EA Sports / FIFA الرقمية: ${futModalPlayer?.name || ""}`}
        size="md"
      >
        {futModalPlayer && (
          <div className="py-4 flex flex-col items-center justify-center font-tajawal">
            <FUTPlayerCard
              player={{
                name: futModalPlayer.name,
                category: futModalPlayer.category,
                position: futModalPlayer.position || "FWD",
                jerseyNumber: futModalPlayer.jersey_number,
                photoUrl: futModalPlayer.photo_url,
                rating: futModalPlayer.level_score || 85,
                academyName: "أكاديمية أجيال وادي العثمانية",
              }}
              cardTheme="gold"
              showActions={true}
            />
          </div>
        )}
      </Modal>

      {/* Player Details Modal */}
      <Modal 
        isOpen={!!selectedPlayerDetails} 
        onClose={() => setSelectedPlayerDetails(null)} 
        title="الملف الرياضي والتربوي الكامل للاعب" 
        size="lg"
      >
        {selectedPlayerDetails && (
          <div className="space-y-6 pt-4 text-right" dir="rtl">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start border-b border-zinc-800 pb-6">
              <div className="h-32 w-32 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center overflow-hidden relative shadow-2xl flex-shrink-0">
                {selectedPlayerDetails.photo_url ? (
                  <img src={selectedPlayerDetails.photo_url} className="h-full w-full object-cover" alt={selectedPlayerDetails.name} />
                ) : (
                  <User className="h-12 w-12 text-zinc-500" />
                )}
                <div className="absolute bottom-0 inset-x-0 bg-zinc-950/80 text-white text-[10px] font-black text-center py-1">
                  ID-{String(selectedPlayerDetails.player_id).padStart(5, '0')}
                </div>
              </div>
              
              <div className="flex-1 space-y-3 text-center md:text-right w-full font-tajawal">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <h3 className="text-2xl font-black text-white">{selectedPlayerDetails.name}</h3>
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-black self-center md:self-auto">
                    <Shield className="h-3.5 w-3.5" />
                    {getTeamName(selectedPlayerDetails)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 text-sm text-zinc-400">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 block font-bold">تاريخ الميلاد</span>
                    <span className="text-zinc-200 font-medium">{selectedPlayerDetails.birth_date}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 block font-bold">مكان الميلاد</span>
                    <span className="text-zinc-200 font-medium">{selectedPlayerDetails.birth_city || "---"} ({selectedPlayerDetails.birth_state || "---"})</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 block font-bold">تاريخ الانضمام</span>
                    <span className="text-zinc-200 font-medium">{selectedPlayerDetails.join_date || "---"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-tajawal">
              {/* Physical details card */}
              <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 space-y-4">
                <h4 className="text-sm font-black text-emerald-400 border-b border-zinc-800 pb-2 flex items-center gap-2">
                  <Scale className="h-4 w-4 animate-pulse" />
                  المؤشرات المورفولوجية والبدنية
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/30 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">الوزن</span>
                    <span className="text-lg font-black text-zinc-100">{selectedPlayerDetails.weight ? `${selectedPlayerDetails.weight} كغ` : "---"}</span>
                  </div>
                  <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/30 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">الطول</span>
                    <span className="text-lg font-black text-zinc-100">{selectedPlayerDetails.height ? `${selectedPlayerDetails.height} سم` : "---"}</span>
                  </div>
                  <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/30 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">زمرة الدم</span>
                    <span className="text-lg font-black text-rose-500">{selectedPlayerDetails.blood_type || "---"}</span>
                  </div>
                  <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/30 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">مقاس البدلة</span>
                    <span className="text-lg font-black text-blue-400">{selectedPlayerDetails.uniform_size || "---"}</span>
                  </div>
                </div>
              </div>

              {/* Parent Details Card */}
              <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 space-y-3">
                <h4 className="text-sm font-black text-blue-400 border-b border-zinc-800 pb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  معلومات الاتصال والولي
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                    <span className="text-zinc-500">اسم الأب/الولي:</span>
                    <span className="font-bold text-zinc-200">{selectedPlayerDetails.father_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                    <span className="text-zinc-500">رقم الهاتف:</span>
                    <span className="font-bold text-zinc-200">{selectedPlayerDetails.phone || "---"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                    <span className="text-zinc-500">رقم بطاقة التعريف:</span>
                    <span className="font-medium text-zinc-300">{selectedPlayerDetails.id_card_number || "---"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500">العنوان السكني:</span>
                    <span className="font-medium text-zinc-300 truncate max-w-[200px]">{selectedPlayerDetails.address || "---"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Space Login Details */}
            <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 space-y-3 font-tajawal">
              <h4 className="text-sm font-black text-rose-400 border-b border-zinc-800 pb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                بيانات الدخول لحساب الأولياء والتحقق
              </h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block">اسم المستخدم للولي</span>
                  <span className="text-zinc-200 font-mono font-bold">{selectedPlayerDetails.parent_username || selectedPlayerDetails.phone || "---"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block">رمز التعرف الموحد (QR Code)</span>
                  <span className="text-emerald-400 font-mono font-bold">{selectedPlayerDetails.qr_code || "---"}</span>
                </div>
              </div>
            </div>

            {/* Quick Export actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800 font-tajawal">
              <Button 
                onClick={() => {
                  setSelectedPlayerDetails(null);
                  handleExportPDF('application', selectedPlayerDetails);
                }} 
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                استمارة التسجيل
              </Button>
              <Button 
                onClick={() => {
                  setSelectedPlayerDetails(null);
                  handleExportPDF('card', selectedPlayerDetails);
                }} 
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5"
              >
                <IdCard className="h-3.5 w-3.5" />
                بطاقة اللاعب
              </Button>
              <Button 
                onClick={() => {
                  const p = selectedPlayerDetails;
                  setSelectedPlayerDetails(null);
                  setFutModalPlayer(p);
                }} 
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-950/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                بطاقة EA FC الرقمية ⭐
              </Button>
              <Button 
                onClick={() => {
                  setSelectedPlayerDetails(null);
                  handleScoutPrint(selectedPlayerDetails);
                }} 
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5"
              >
                <Trophy className="h-3.5 w-3.5" />
                تقرير الكشاف (FIFA Card)
              </Button>
              <Button 
                onClick={() => {
                  setSelectedPlayerDetails(null);
                  handlePedagogicalPrint(selectedPlayerDetails);
                }} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/20"
              >
                <BookOpen className="h-3.5 w-3.5" />
                الدفتر البيداغوجي
              </Button>
              <Button 
                onClick={() => {
                  const p = selectedPlayerDetails;
                  setSelectedPlayerDetails(null);
                  openSingleReassign(p);
                }} 
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-900/20"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                تغيير الفئة والفوج والمدرب
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Modal: Fast Category, Squad & Coach Reassignment (One-Click) ─── */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => {
          if (!isReassigning) {
            setIsReassignModalOpen(false);
            setTargetPlayerForSingleReassign(null);
          }
        }}
        title="تغيير الفئة والفوج والمدرب بضغطة زر ⚡"
        size="md"
      >
        <div className="space-y-5 pt-3" dir="rtl">
          {/* Header context */}
          <div className="p-3.5 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-zinc-900/60 border border-blue-500/30 rounded-2xl flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30 mt-0.5">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-white">
                {targetPlayerForSingleReassign
                  ? `نقل وتحديث بيانات اللاعب: ${targetPlayerForSingleReassign.name}`
                  : `نقل وتحديث بيانات (${selectedPlayerIds.size}) لاعبين مختارين`}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                حدد الفئة الجديدة والفوج والمدرب وسيتم تطبيق التحديث فورياً مع الحفاظ الكامل على كافة البيانات الشخصية والمالية والطبية للاعبين.
              </p>
            </div>
          </div>

          {/* Selected Players Preview */}
          {!targetPlayerForSingleReassign && selectedPlayerIds.size > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">اللاعبون المحددون ({selectedPlayerIds.size}):</label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                {Array.from(selectedPlayerIds).map(pid => {
                  const p = players.find(x => x.player_id === pid);
                  if (!p) return null;
                  return (
                    <span key={pid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-900 text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {p.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* 1. Target Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-400" />
                الفئة الجديدة المستهدفة:
              </label>
              <select
                value={reassignCategory}
                onChange={(e) => handleCategoryChangeInReassign(e.target.value)}
                className="w-full h-11 bg-zinc-950 border border-zinc-700 rounded-xl px-3 text-sm text-zinc-100 font-bold focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- اختر الفئة --</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>فئة {cat}</option>
                ))}
              </select>
            </div>

            {/* 2. Target Squad / Team */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-violet-400" />
                الفوج / الفريق المستهدف في قاعدة البيانات:
              </label>
              <select
                value={reassignTeamId}
                onChange={(e) => handleTeamChangeInReassign(e.target.value)}
                className="w-full h-11 bg-zinc-950 border border-zinc-700 rounded-xl px-3 text-sm text-zinc-100 font-bold focus:border-emerald-500 focus:outline-none"
              >
                <option value="">بدون فوج محدد (الفئة فقط)</option>
                {teams
                  .filter(t => !reassignCategory || t.category === reassignCategory)
                  .map(t => {
                    const assignedCoach = coaches.find(c => c.coach_id === t.coach_id || c.id === t.coach_id || c.team_id === t.team_id);
                    return (
                      <option key={t.team_id} value={t.team_id}>
                        {t.team_name} (فئة {t.category}) {assignedCoach ? `• المدرب: ك. ${assignedCoach.name}` : ''}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* 3. Target Coach */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                <User className="h-4 w-4 text-blue-400" />
                المدرب المسؤول:
              </label>
              <select
                value={reassignCoachId}
                onChange={(e) => setReassignCoachId(e.target.value)}
                className="w-full h-11 bg-zinc-950 border border-zinc-700 rounded-xl px-3 text-sm text-zinc-100 font-bold focus:border-emerald-500 focus:outline-none"
              >
                <option value="">مدرب الفوج التلقائي</option>
                {coaches.map((c: any) => (
                  <option key={c.coach_id || c.id} value={c.coach_id || c.id}>
                    ك. {c.name} {c.category ? `(فئة ${c.category})` : ''} {c.phone ? `• ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Link coach to squad checkbox */}
            {reassignTeamId && reassignCoachId && (
              <label className="flex items-center gap-2 p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={reassignUpdateTeamCoach}
                  onChange={(e) => setReassignUpdateTeamCoach(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                />
                <span className="text-xs text-zinc-300 font-bold">
                  تثبيت وتحديث هذا المدرب كمدرب رسمي لهذا الفوج في قاعدة البيانات أيضاً
                </span>
              </label>
            )}

            {/* Safety Guarantee Banner */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>ضمان سلامة البيانات:</strong> يتم تحديث الفئة والفوج فقط مع الحفاظ بنسبة 100% على كافة بيانات اللاعبين (الصور، تواريخ الميلاد، هواتف الأولياء، القياسات، والاشتراكات).
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsReassignModalOpen(false);
                setTargetPlayerForSingleReassign(null);
              }}
              disabled={isReassigning}
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleExecuteReassign}
              disabled={isReassigning || (!reassignCategory && !reassignTeamId)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isReassigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحديث والحفظ...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4" />
                  تحديث الفئة والمدرب الآن (بضغطة زر)
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
