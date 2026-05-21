import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface ScoreEntry {
  uid: string;
  username: string;
  errors: number;
  correct: number;
  total: number;
  points: number;
  playedAt: Date;
}

export async function saveScore(entry: Omit<ScoreEntry, "playedAt">): Promise<void> {
  await addDoc(collection(db, "scores"), {
    ...entry,
    playedAt: Timestamp.now(),
  });
}

export interface LeaderboardEntry extends ScoreEntry {
  rank: number;
}

// Suscripción en tiempo real al ranking de la última hora
// Devuelve una función para cancelar la suscripción
export function subscribeLeaderboard(
  onUpdate: (entries: LeaderboardEntry[]) => void
): () => void {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const q = query(
    collection(db, "scores"),
    where("playedAt", ">=", Timestamp.fromDate(oneHourAgo)),
    orderBy("playedAt", "desc"),
    limit(500)
  );

  return onSnapshot(q, (snapshot) => {
    const raw: ScoreEntry[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: d.uid,
        username: d.username,
        errors: d.errors,
        correct: d.correct,
        total: d.total,
        points: d.points ?? 0,
        playedAt: (d.playedAt as Timestamp).toDate(),
      };
    });

    // Mejor partida por usuario (menos errores, más aciertos como desempate)
    const byUser: Record<string, ScoreEntry> = {};
    for (const entry of raw) {
      const prev = byUser[entry.uid];
      if (!prev || entry.errors < prev.errors || (entry.errors === prev.errors && entry.correct > prev.correct)) {
        byUser[entry.uid] = entry;
      }
    }

    const sorted = Object.values(byUser)
      .sort((a, b) => a.errors - b.errors || b.correct - a.correct)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    onUpdate(sorted);
  });
}
