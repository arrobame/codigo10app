import {
  collection, addDoc, query, orderBy,
  onSnapshot, updateDoc, doc,
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
