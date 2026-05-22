import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";

const KEY = "cbvp_last_broadcast_seen";

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  createdAt: Timestamp | null;
}

export async function getUnseenBroadcast(uid: string): Promise<Broadcast | null> {
  try {
    const lastSeen = await AsyncStorage.getItem(KEY);
    const q = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const doc = snap.docs[0];
    if (lastSeen === doc.id) return null;

    const data = doc.data();
    return {
      id: doc.id,
      title: data.title as string,
      body: data.body as string,
      createdAt: (data.createdAt as Timestamp) ?? null,
    };
  } catch {
    return null;
  }
}

export async function markBroadcastSeen(id: string): Promise<void> {
  await AsyncStorage.setItem(KEY, id);
}
