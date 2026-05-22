import {
  collection, addDoc, query, orderBy,
  onSnapshot, updateDoc, doc, getDoc, setDoc,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export type FeedbackType = "problema" | "sugerencia";

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  message: string;
  uid: string;
  username: string | null;
  createdAt: Timestamp | null;
  read: boolean;
}

function isSameDay(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth()    === now.getMonth()    &&
    date.getDate()     === now.getDate()
  );
}

export async function hasSentToday(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "feedbackQuota", uid));
    if (!snap.exists()) return false;
    const lastSentAt = snap.data().lastSentAt as Timestamp | null;
    if (!lastSentAt) return false;
    return isSameDay(lastSentAt.toDate());
  } catch {
    return false;
  }
}

export async function submitFeedback(
  type: FeedbackType,
  message: string,
  uid: string,
  username: string | null,
): Promise<void> {
  await addDoc(collection(db, "feedback"), {
    type,
    message: message.trim(),
    uid,
    username,
    createdAt: serverTimestamp(),
    read: false,
  });
  await setDoc(doc(db, "feedbackQuota", uid), { lastSentAt: serverTimestamp() });
}

export function subscribeFeedback(
  onUpdate: (items: FeedbackItem[]) => void
): () => void {
  const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedbackItem)));
    },
    (error) => { console.error("subscribeFeedback:", error); onUpdate([]); }
  );
}

export async function markAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, "feedback", id), { read: true });
}
