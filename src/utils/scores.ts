import {
  collection,
  doc,
  runTransaction,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface PlayerRecord {
  uid: string;
  username: string;
  bestStreak: number;
  bestAvgSpeed: number;
  updatedAt: any;
}

export interface RankedRecord extends PlayerRecord {
  rank: number;
}

// Guarda o actualiza el récord del jugador (solo mejora, nunca empeora)
export async function saveRecord(
  uid: string,
  username: string,
  streak: number | null,
  avgSpeed: number | null
): Promise<void> {
  const ref = doc(db, "records", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, {
        uid,
        username,
        bestStreak: streak ?? 0,
        bestAvgSpeed: avgSpeed ?? null,
        updatedAt: serverTimestamp(),
      });
    } else {
      const data = snap.data() as PlayerRecord;
      const updates: Record<string, any> = { username, updatedAt: serverTimestamp() };
      if (streak !== null && streak > (data.bestStreak ?? 0)) updates.bestStreak = streak;
      if (avgSpeed !== null && (!data.bestAvgSpeed || avgSpeed < data.bestAvgSpeed)) updates.bestAvgSpeed = avgSpeed;
      tx.update(ref, updates);
    }
  });
}

export function subscribeStreakLeaderboard(
  onUpdate: (entries: RankedRecord[]) => void
): () => void {
  const q = query(
    collection(db, "records"),
    orderBy("bestStreak", "desc"),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map((d, i) => ({ ...(d.data() as PlayerRecord), rank: i + 1 })));
    },
    (error) => {
      console.error("streakLeaderboard:", error);
      onUpdate([]);
    }
  );
}

export function subscribeSpeedLeaderboard(
  onUpdate: (entries: RankedRecord[]) => void
): () => void {
  const q = query(
    collection(db, "records"),
    orderBy("bestAvgSpeed", "asc"),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map((d, i) => ({ ...(d.data() as PlayerRecord), rank: i + 1 })));
    },
    (error) => {
      console.error("speedLeaderboard:", error);
      onUpdate([]);
    }
  );
}
