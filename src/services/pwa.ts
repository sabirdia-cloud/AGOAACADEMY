import { api } from "./api";

const DB_NAME = "AcademyOfflineDB";
const STORE_NAME = "pending_attendance";

let deferredInstallPrompt: any = null;

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
      const recordsToSync = pending.map(({ id, offline_at, ...rest }) => ({
        ...rest,
        notes: (rest.notes || '') + ` (تم الرفع أوفلاين)`
      }));

      await api.addAttendance(recordsToSync);
      await this.clearPendingAttendance(pending.map(p => p.id));
      console.log("Offline sync complete!");
      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      return false;
    }
  },

  registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);

          // Check for service worker updates periodically (every 30 mins)
          setInterval(() => {
            reg.update().catch(() => {});
          }, 30 * 60 * 1000);

          // Check for update on visibility change (when coach unlocks phone / switches tabs)
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              reg.update().catch(() => {});
            }
          });

          // Detect when a new service worker is installing
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New update available!');
                  window.dispatchEvent(new CustomEvent('agoa-pwa-update-available'));
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] SW registration failed:', err);
        });

      // Listen for message from service worker when activated
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('[PWA] App updated to version:', event.data.version);
          window.dispatchEvent(new CustomEvent('agoa-pwa-update-available'));
        }
      });
    });

    // Capture install prompt for Android / Chrome
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      window.dispatchEvent(new CustomEvent('agoa-pwa-can-install'));
    });
  },

  getInstallPrompt() {
    return deferredInstallPrompt;
  },

  async promptInstall(): Promise<boolean> {
    if (!deferredInstallPrompt) return false;
    try {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      return outcome === 'accepted';
    } catch (e) {
      return false;
    }
  },

  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  },

  isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }
};

// Check for sync on load if online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => pwaService.syncOfflineData());
}
