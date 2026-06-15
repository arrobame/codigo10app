import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  runTransaction,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { QuizDirection, QuizMode } from "../types";

export interface PlayerRecord {
  uid: string;
  username: string;
  apodo?: string | null;            // alias asignado por el admin (se muestra en gris)
  usernameChangedAt?: Timestamp | null; // último cambio de nombre (límite semanal)
  bestStreak_ctd: number;
  bestAvgSpeed_ctd: number | null;
  bestStreak_dtc: number;
  bestAvgSpeed_dtc: number | null;
  gamesPlayed: number;
  totalCorrect: number;
  totalQuestions: number;
  updatedAt: any;
}

export const USERNAME_CHANGE_COOLDOWN_DAYS = 7;

// Devuelve la fecha en la que el usuario podrá cambiar el nombre de nuevo,
// o null si ya puede cambiarlo ahora.
export function nextUsernameChangeDate(record: PlayerRecord | null): Date | null {
  const ts = record?.usernameChangedAt;
  if (!ts) return null;
  const next = new Date(ts.toDate().getTime() + USERNAME_CHANGE_COOLDOWN_DAYS * 86400000);
  return next > new Date() ? next : null;
}

// Setea el nombre directamente (admin o al aprobar una solicitud). No toca el cooldown.
export async function setUsername(uid: string, username: string): Promise<void> {
  await setDoc(doc(db, "records", uid), { uid, username: username.trim() }, { merge: true });
}

// ─── Solicitudes de cambio de nombre (moderadas por el admin) ─────────────────
export interface NameRequest {
  uid: string;
  currentName: string;
  requestedName: string;
  createdAt: Timestamp | null;
}

// El usuario solicita cambiar su nombre: queda pendiente hasta que el admin apruebe.
// Marca usernameChangedAt para el límite de 1 solicitud por semana.
export async function requestNameChange(uid: string, currentName: string, requestedName: string): Promise<void> {
  await setDoc(doc(db, "nameRequests", uid), {
    uid, currentName, requestedName: requestedName.trim(), createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "records", uid), { uid, usernameChangedAt: serverTimestamp() }, { merge: true });
}

export async function getNameRequest(uid: string): Promise<NameRequest | null> {
  try {
    const snap = await getDoc(doc(db, "nameRequests", uid));
    return snap.exists() ? ({ ...snap.data() } as NameRequest) : null;
  } catch {
    return null;
  }
}

export function subscribeNameRequests(onUpdate: (reqs: NameRequest[]) => void): () => void {
  return onSnapshot(
    collection(db, "nameRequests"),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...d.data() } as NameRequest));
      list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      onUpdate(list);
    },
    (error) => { console.error("subscribeNameRequests:", error); onUpdate([]); }
  );
}

export async function approveNameRequest(uid: string, requestedName: string): Promise<void> {
  await setUsername(uid, requestedName);
  await deleteDoc(doc(db, "nameRequests", uid));
}

export async function rejectNameRequest(uid: string): Promise<void> {
  await deleteDoc(doc(db, "nameRequests", uid));
}

// Asigna (o borra) el apodo de un usuario. Solo el admin debería poder llamarlo;
// las reglas de Firestore lo restringen al owner.
export async function setApodo(uid: string, apodo: string): Promise<void> {
  await setDoc(
    doc(db, "records", uid),
    { apodo: apodo.trim() || null },
    { merge: true }
  );
}

// ─── Solicitudes de apodo (moderadas por el admin) ────────────────────────────
export interface ApodoRequest {
  uid: string;
  username: string;
  apodo: string;
  createdAt: Timestamp | null;
}

// El usuario solicita un apodo: queda pendiente y secreto hasta que el admin lo apruebe.
export async function requestApodo(uid: string, username: string, apodo: string): Promise<void> {
  await setDoc(doc(db, "apodoRequests", uid), {
    uid,
    username,
    apodo: apodo.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getApodoRequest(uid: string): Promise<ApodoRequest | null> {
  try {
    const snap = await getDoc(doc(db, "apodoRequests", uid));
    return snap.exists() ? ({ ...snap.data() } as ApodoRequest) : null;
  } catch {
    return null;
  }
}

export function subscribeApodoRequests(onUpdate: (reqs: ApodoRequest[]) => void): () => void {
  return onSnapshot(
    collection(db, "apodoRequests"),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...d.data() } as ApodoRequest));
      list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      onUpdate(list);
    },
    (error) => { console.error("subscribeApodoRequests:", error); onUpdate([]); }
  );
}

// Aprueba la solicitud: publica el apodo y borra el pedido.
export async function approveApodoRequest(uid: string, apodo: string): Promise<void> {
  await setApodo(uid, apodo);
  await deleteDoc(doc(db, "apodoRequests", uid));
}

// Rechaza (o limpia) la solicitud sin publicarla.
export async function rejectApodoRequest(uid: string): Promise<void> {
  await deleteDoc(doc(db, "apodoRequests", uid));
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
  apodo?: string | null;
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

  // Actualizar récords y contadores globales + log de partida en una sola transacción
  const gameRef = doc(collection(db, "records", uid, "games"));
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
    // Log de la partida en la misma transacción para garantizar consistencia
    tx.set(gameRef, { correct, total, mode, direction, playedAt: serverTimestamp() });
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
          uid: r.uid, username: r.username, apodo: r.apodo ?? null, rank: i + 1,
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
          uid: r.uid, username: r.username, apodo: r.apodo ?? null, rank: i + 1,
          bestStreak:   (r[`bestStreak_${s}`   as keyof PlayerRecord] as number) ?? 0,
          bestAvgSpeed: (r[`bestAvgSpeed_${s}` as keyof PlayerRecord] as number | null) ?? null,
        };
      }));
    },
    (error) => { console.error("speedLeaderboard:", error); onUpdate([]); }
  );
}
