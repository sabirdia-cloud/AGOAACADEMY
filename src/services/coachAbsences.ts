export interface CoachAbsence {
  id: string;
  coach_id: number;
  date: string; // YYYY-MM-DD
  reason: string;
  type: 'training' | 'match' | 'other';
  deducted_sessions: number; // default 1
  created_at: string;
}

const STORAGE_KEY_PREFIX = 'agoa_coach_absences_';

export const coachAbsenceService = {
  getAbsences: (coachId: number): CoachAbsence[] => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${coachId}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to get coach absences:", e);
      return [];
    }
  },

  getAllAbsences: (): CoachAbsence[] => {
    try {
      const list: CoachAbsence[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) list.push(...arr);
          }
        }
      }
      return list;
    } catch (e) {
      console.warn("Failed to get all absences:", e);
      return [];
    }
  },

  addAbsence: (coachId: number, absence: Omit<CoachAbsence, 'id' | 'coach_id' | 'created_at'>): CoachAbsence => {
    const list = coachAbsenceService.getAbsences(coachId);
    const newRecord: CoachAbsence = {
      id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      coach_id: Number(coachId),
      date: absence.date,
      reason: absence.reason || 'غياب شخصي',
      type: absence.type || 'training',
      deducted_sessions: Number(absence.deducted_sessions) || 1,
      created_at: new Date().toISOString()
    };
    list.unshift(newRecord);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${coachId}`, JSON.stringify(list));
    return newRecord;
  },

  deleteAbsence: (coachId: number, absenceId: string): void => {
    const list = coachAbsenceService.getAbsences(coachId);
    const updated = list.filter(a => a.id !== absenceId);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${coachId}`, JSON.stringify(updated));
  }
};

