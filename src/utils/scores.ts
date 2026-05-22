import {
  collection,
  doc,
  addDoc,
  runTransaction,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  serverTimestamp,
  serverTimestamp as ts,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { QuizDirection, QuizMode } from "../types";

export interface PlayerRecord {
  uid: string;
  username: string;
  bestStreak_ctd: number;
  bestAvgSpeed_ctd: number | null;
  bestStreak_dtc: number;
  bestAvgSpeed_dtc: number | null;
  gamesPlayed: number;
  totalCorrect: number;
  totalQuestions: number;
  updatedAt: any;
}

export interface GameLog {
  correct: number;
  total: number;
  mode: QuizMode;
  direction: QuizDirection;
  playedAt: Timestamp;
}

export interface PeriodStats {
  gamesPlayed: number;
  totalCorrect: number;
  totalQuestions: number;
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
  mode: QuizMode,
  streak: number | null,
  avgSpeed: number | null,
  correct: number,
  total: number,
): Promise<void> {
  const s = suffix(direction);
  const streakKey = `bestStreak_${s}` as keyof PlayerRecord;
  const speedKey  = `bestAvgSpeed_${s}` as keyof PlayerRecord;
  const ref = doc(db, "records", uid);

  // Actualizar récords y contadores globales
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, {
        uid, username,
        bestStreak_ctd: 0, bestAvgSpeed_ctd: null,
        bestStreak_dtc: 0, bestAvgSpeed_dtc: null,
        gamesPlayed: 1,
        totalCorrect: correct,
        totalQuestions: total,
        ...(streak !== null   ? { [streakKey]: streak }   : {}),
        ...(avgSpeed !== null ? { [speedKey]:  avgSpeed } : {}),
        updatedAt: serverTimestamp(),
      });
    } else {
      const data = snap.data() as PlayerRecord;
      const updates: Record<string, any> = {
        username,
        updatedAt: serverTimestamp(),
        gamesPlayed:    increment(1),
        totalCorrect:   increment(correct),
        totalQuestions: increment(total),
      };
      if (streak !== null && streak > ((data[streakKey] as number) ?? 0))
        updates[streakKey as string] = streak;
      if (avgSpeed !== null && (!data[speedKey] || avgSpeed < (data[speedKey] as number)))
        updates[speedKey as string] = avgSpeed;
      tx.update(ref, updates);
    }
  });

  // Log individual de la partida (para estadísticas de 7 días)
  await addDoc(collection(db, "records", uid, "games"), {
    correct,
    total,
    mode,
    direction,
    playedAt: serverTimestamp(),
  });
}

// Estadísticas de los últimos N días desde la subcolección de partidas
export async function fetchPeriodStats(uid: string, days: number): Promise<PeriodStats> {
  const since = Timestamp.fromDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  const q = query(
    collection(db, "records", uid, "games"),
    where("playedAt", ">=", since)
  );
  try {
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => d.data() as GameLog);
    return {
      gamesPlayed:    logs.length,
      totalCorrect:   logs.reduce((s, g) => s + g.correct, 0),
      totalQuestions: logs.reduce((s, g) => s + g.total,   0),
    };
  } catch {
    return { gamesPlayed: 0, totalCorrect: 0, totalQuestions: 0 };
  }
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
  const q = query(collection(db, "records"), where(field, ">", 0), orderBy(field, "asc"), limit(20));
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
