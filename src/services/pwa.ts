import { api } from "./api";

const DB_NAME = "AcademyOfflineDB";
const STORE_NAME = "pending_attendance";

export const pwaService = {
  async openDB() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async saveAttendanceOffline(attendanceRecords: any[]) {
    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    attendanceRecords.forEach(record => store.add({ ...record, offline_at: new Date().toISOString() }));
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  },

  async getPendingAttendance() {
    try {
        const db = await this.openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        return new Promise<any[]>((resolve) => {
          request.onsuccess = () => resolve(request.result);
        });
    } catch (e) {
        return [];
    }
  },

  async clearPendingAttendance(ids: number[]) {
    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    ids.forEach(id => store.delete(id));
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  },

  async syncOfflineData() {
    if (!navigator.onLine) return;
    const pending = await this.getPendingAttendance();
    if (pending.length === 0) return;

    try {
      console.log(`Syncing ${pending.length} offline attendance records...`);
      // Extract original records (remove IndexedDB primary 'id')
      const recordsToSync = pending.map(({ id, offline_at, ...rest }) => ({
          ...rest,
          notes: (rest.notes || '') + ` (تم الرفع أوفلاين)`
      }));
      
      await api.addAttendance(recordsToSync);
      await this.clearPendingAttendance(pending.map(p => p.id));
      console.log("Sync complete!");
      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      return false;
    }
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          console.log('SW registered:', reg);
        }).catch(err => {
          console.log('SW registration failed:', err);
        });
      });
    }
  }
};

// Check for sync on load if online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => pwaService.syncOfflineData());
}
