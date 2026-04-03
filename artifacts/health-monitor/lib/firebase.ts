import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);

export type { User as FirebaseUser };

export interface AppUser {
  uid: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
}

async function getIsAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data()?.isAdmin ?? false) : false;
  } catch {
    return false;
  }
}

async function countUsers(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.size;
  } catch {
    return 1;
  }
}

export const auth = {
  async signUpWithEmailAndPassword(
    email: string,
    password: string,
    displayName: string
  ): Promise<AppUser> {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await updateProfile(cred.user, { displayName });

    const userCount = await countUsers();
    const isAdmin = userCount === 0;

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      displayName,
      isAdmin,
      createdAt: serverTimestamp(),
    });

    return { uid: cred.user.uid, email, displayName, isAdmin };
  },

  async signInWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<AppUser> {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const isAdmin = await getIsAdmin(cred.user.uid);
    return {
      uid: cred.user.uid,
      email: cred.user.email ?? email,
      displayName: cred.user.displayName,
      isAdmin,
    };
  },

  async signOut(): Promise<void> {
    await signOut(firebaseAuth);
  },

  onAuthStateChanged(callback: (user: AppUser | null) => void) {
    return onAuthStateChanged(firebaseAuth, async (user: User | null) => {
      if (!user) {
        callback(null);
        return;
      }
      const isAdmin = await getIsAdmin(user.uid);
      callback({
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName,
        isAdmin,
      });
    });
  },

  async getAllUsers(): Promise<AppUser[]> {
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map((d) => d.data() as AppUser);
    } catch {
      return [];
    }
  },
};
