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
import { QuizDirection } from "../types";

export interface PlayerRecord {
  uid: string;
  username: string;
  // Código → Descripción
  bestStreak_ctd: number;
  bestAvgSpeed_ctd: number | null;
  // Descripción → Código
  bestStreak_dtc: number;
  bestAvgSpeed_dtc: number | null;
  updatedAt: any;
}

export interface RankedEntry {
  uid: string;
  username: string;
  bestStreak: number;
  bestAvgSpeed: number | null;
  rank: number;
}

function suffix(direction: QuizDirection) {
  return direction === "codigo_a_descripcion" ? "ctd" : "dtc";
}

export async function saveRecord(
  uid: string,
  username: string,
  direction: QuizDirection,
  streak: number | null,
  avgSpeed: number | null
): Promise<void> {
  const s = suffix(direction);
  const streakKey = `bestStreak_${s}` as keyof PlayerRecord;
  const speedKey  = `bestAvgSpeed_${s}` as keyof PlayerRecord;
  const ref = doc(db, "records", uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, {
        uid, username,
        bestStreak_ctd: 0, bestAvgSpeed_ctd: null,
        bestStreak_dtc: 0, bestAvgSpeed_dtc: null,
        ...(streak !== null   ? { [streakKey]: streak }   : {}),
        ...(avgSpeed !== null ? { [speedKey]:  avgSpeed } : {}),
        updatedAt: serverTimestamp(),
      });
    } else {
      const data = snap.data() as PlayerRecord;
      const updates: Record<string, any> = { username, updatedAt: serverTimestamp() };
      if (streak !== null && streak > ((data[streakKey] as number) ?? 0))
        updates[streakKey as string] = streak;
      if (avgSpeed !== null && (!data[speedKey] || avgSpeed < (data[speedKey] as number)))
        updates[speedKey as string] = avgSpeed;
      tx.update(ref, updates);
    }
  });
}

export function subscribeStreakLeaderboard(
  direction: QuizDirection,
  onUpdate: (entries: RankedEntry[]) => void
): () => void {
  const field = `bestStreak_${suffix(direction)}`;
  const q = query(collection(db, "records"), orderBy(field, "desc"), limit(20));
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map((d, i) => {
        const r = d.data() as PlayerRecord;
        const s = suffix(direction);
        return {
          uid: r.uid, username: r.username, rank: i + 1,
          bestStreak:   (r[`bestStreak_${s}`   as keyof PlayerRecord] as number) ?? 0,
          bestAvgSpeed: (r[`bestAvgSpeed_${s}` as keyof PlayerRecord] as number | null) ?? null,
        };
      }));
    },
    (error) => { console.error("streakLeaderboard:", error); onUpdate([]); }
  );
}

export function subscribeSpeedLeaderboard(
  direction: QuizDirection,
  onUpdate: (entries: RankedEntry[]) => void
): () => void {
  const field = `bestAvgSpeed_${suffix(direction)}`;
  const q = query(collection(db, "records"), orderBy(field, "asc"), limit(20));
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map((d, i) => {
        const r = d.data() as PlayerRecord;
        const s = suffix(direction);
        return {
          uid: r.uid, username: r.username, rank: i + 1,
          bestStreak:   (r[`bestStreak_${s}`   as keyof PlayerRecord] as number) ?? 0,
          bestAvgSpeed: (r[`bestAvgSpeed_${s}` as keyof PlayerRecord] as number | null) ?? null,
        };
      }));
    },
    (error) => { console.error("speedLeaderboard:", error); onUpdate([]); }
  );
}
