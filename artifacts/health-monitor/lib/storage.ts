import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  where,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface HealthEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  energy: number;
  sleep: number;
  water: number;
  steps: number;
  notes: string;
  symptoms: string[];
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  age: string;
  height: string;
  weight: string;
  occupation: string;
  gender: string;
  bloodType: string;
  conditions: string;
  medications: string;
  goal: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "checkup" | "tip" | "reminder";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS_KEY = (uid: string) => `@healthpulse_notifications_${uid}`;
const LAST_CHECKUP_KEY = (uid: string) => `@healthpulse_last_checkup_${uid}`;
const AI_TIPS_KEY = (uid: string) => `@healthpulse_tips_${uid}`;

export const storage = {
  async getHealthEntries(uid: string): Promise<HealthEntry[]> {
    try {
      const q = query(
        collection(db, "users", uid, "entries"),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HealthEntry));
    } catch {
      return [];
    }
  },

  async addHealthEntry(
    uid: string,
    entry: Omit<HealthEntry, "id" | "userId" | "timestamp">
  ): Promise<HealthEntry> {
    const data = {
      ...entry,
      userId: uid,
      timestamp: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, "users", uid, "entries"), {
      ...data,
      serverTimestamp: serverTimestamp(),
    });
    return { id: ref.id, ...data };
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, "users", uid, "profile", "data"));
      if (!snap.exists()) return null;
      return snap.data() as UserProfile;
    } catch {
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await setDoc(doc(db, "users", profile.uid, "profile", "data"), profile);
  },

  async getNotifications(uid: string): Promise<Notification[]> {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY(uid));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async addNotification(
    uid: string,
    notif: Omit<Notification, "id" | "userId" | "timestamp" | "read">
  ): Promise<Notification> {
    const notifs = await storage.getNotifications(uid);
    const newNotif: Notification = {
      ...notif,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      userId: uid,
      timestamp: new Date().toISOString(),
      read: false,
    };
    await AsyncStorage.setItem(
      NOTIFICATIONS_KEY(uid),
      JSON.stringify([newNotif, ...notifs].slice(0, 50))
    );
    return newNotif;
  },

  async markNotificationsRead(uid: string): Promise<void> {
    const notifs = await storage.getNotifications(uid);
    const updated = notifs.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIFICATIONS_KEY(uid), JSON.stringify(updated));
  },

  async getLastCheckupDate(uid: string): Promise<string | null> {
    return AsyncStorage.getItem(LAST_CHECKUP_KEY(uid));
  },

  async setLastCheckupDate(uid: string): Promise<void> {
    await AsyncStorage.setItem(
      LAST_CHECKUP_KEY(uid),
      new Date().toDateString()
    );
  },

  async getAITips(uid: string): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(AI_TIPS_KEY(uid));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveAITips(uid: string, tips: string[]): Promise<void> {
    await AsyncStorage.setItem(AI_TIPS_KEY(uid), JSON.stringify(tips));
  },

  async getAllUsersData(
    userIds: string[]
  ): Promise<{ uid: string; entries: HealthEntry[]; profile: UserProfile | null }[]> {
    const results = await Promise.all(
      userIds.map(async (uid) => ({
        uid,
        entries: await storage.getHealthEntries(uid),
        profile: await storage.getUserProfile(uid),
      }))
    );
    return results;
  },
};

export const SYMPTOMS = [
  "Headache",
  "Fatigue",
  "Nausea",
  "Chest Pain",
  "Shortness of Breath",
  "Dizziness",
  "Back Pain",
  "Joint Pain",
  "Stomach Ache",
  "Anxiety",
  "Insomnia",
  "Loss of Appetite",
];
