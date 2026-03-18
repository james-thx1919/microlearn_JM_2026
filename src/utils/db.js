import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export async function getOrCreateUser(firebaseUser) {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      xp: 0,
      level: 1,
      streak: 0,
      lastSessionDate: null,
      interests: [
        "Productivity",
        "Soft Skills",
        "Tech",
        "Health",
        "Mindfulness",
        "STEM",
      ],
      badges: [],
      totalSessions: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return profile;
  }
  return snap.data();
}

export async function refreshUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function updateUserStats(uid, updates) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, updates);
}

export async function saveSession(uid, data) {
  const ref = collection(db, "users", uid, "sessions");
  const docRef = await addDoc(ref, { ...data, completedAt: serverTimestamp() });
  return docRef.id;
}

export async function getUserSessions(uid, limitCount = 30) {
  const ref = collection(db, "users", uid, "sessions");
  const q = query(ref, orderBy("completedAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
