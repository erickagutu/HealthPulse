import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { storage, HealthEntry, UserProfile, Notification } from "@/lib/storage";
import { useAuth } from "./AuthContext";

interface HealthContextType {
  entries: HealthEntry[];
  profile: UserProfile | null;
  notifications: Notification[];
  unreadCount: number;
  hasCheckedUpToday: boolean;
  loadingEntries: boolean;
  addEntry: (
    entry: Omit<HealthEntry, "id" | "userId" | "timestamp">
  ) => Promise<HealthEntry>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  refreshEntries: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  addNotification: (
    notif: Omit<Notification, "id" | "userId" | "timestamp" | "read">
  ) => Promise<void>;
  markCheckedUpToday: () => Promise<void>;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasCheckedUpToday, setHasCheckedUpToday] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const refreshEntries = useCallback(async () => {
    if (!user) return;
    setLoadingEntries(true);
    const [e, p, n, lastCheckup] = await Promise.all([
      storage.getHealthEntries(user.uid),
      storage.getUserProfile(user.uid),
      storage.getNotifications(user.uid),
      storage.getLastCheckupDate(user.uid),
    ]);
    setEntries(e);
    setProfile(p);
    setNotifications(n);
    setHasCheckedUpToday(lastCheckup === new Date().toDateString());
    setLoadingEntries(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshEntries();
    } else {
      setEntries([]);
      setProfile(null);
      setNotifications([]);
      setHasCheckedUpToday(false);
      setLoadingEntries(false);
    }
  }, [user, refreshEntries]);

  const addEntry = useCallback(
    async (entry: Omit<HealthEntry, "id" | "userId" | "timestamp">) => {
      if (!user) throw new Error("Not authenticated");
      const newEntry = await storage.addHealthEntry(user.uid, entry);
      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    },
    [user]
  );

  const saveProfile = useCallback(
    async (p: UserProfile) => {
      await storage.saveUserProfile(p);
      setProfile(p);
    },
    []
  );

  const markNotificationsRead = useCallback(async () => {
    if (!user) return;
    await storage.markNotificationsRead(user.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  const addNotification = useCallback(
    async (
      notif: Omit<Notification, "id" | "userId" | "timestamp" | "read">
    ) => {
      if (!user) return;
      const newNotif = await storage.addNotification(user.uid, notif);
      setNotifications((prev) => [newNotif, ...prev]);
    },
    [user]
  );

  const markCheckedUpToday = useCallback(async () => {
    if (!user) return;
    await storage.setLastCheckupDate(user.uid);
    setHasCheckedUpToday(true);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <HealthContext.Provider
      value={{
        entries,
        profile,
        notifications,
        unreadCount,
        hasCheckedUpToday,
        loadingEntries,
        addEntry,
        saveProfile,
        refreshEntries,
        markNotificationsRead,
        addNotification,
        markCheckedUpToday,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth(): HealthContextType {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth must be used within HealthProvider");
  return ctx;
}
