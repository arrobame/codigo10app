import {
  collection, addDoc, query, where,
  onSnapshot, updateDoc, doc,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const OWNER_EMAIL = "delpuertomiguel7@gmail.com";

export type CantoStatus = "pending" | "accepted" | "rejected";

export interface Canto {
  id: string;
  title: string;
  letra: string;
  status: CantoStatus;
  submittedBy: string;
  submittedByName: string | null;
  createdAt: Timestamp | null;
}

function seconds(c: Canto): number {
  return c.createdAt ? c.createdAt.seconds : Number.MAX_SAFE_INTEGER;
}

// Evitamos índice compuesto (where + orderBy) ordenando del lado del cliente.
function subscribeByStatus(
  status: CantoStatus,
  onUpdate: (cantos: Canto[]) => void,
): () => void {
  const q = query(collection(db, "cantos"), where("status", "==", status));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Canto));
      list.sort((a, b) => seconds(b) - seconds(a)); // más nuevos primero
      onUpdate(list);
    },
    (error) => { console.error("subscribeCantos:", error); onUpdate([]); }
  );
}

export function subscribeAcceptedCantos(onUpdate: (cantos: Canto[]) => void): () => void {
  return subscribeByStatus("accepted", onUpdate);
}

export function subscribePendingCantos(onUpdate: (cantos: Canto[]) => void): () => void {
  return subscribeByStatus("pending", onUpdate);
}

export async function submitCanto(
  title: string,
  letra: string,
  uid: string,
  username: string | null,
): Promise<void> {
  await addDoc(collection(db, "cantos"), {
    title: title.trim(),
    letra: letra.trim(),
    status: "pending" as CantoStatus,
    submittedBy: uid,
    submittedByName: username,
    createdAt: serverTimestamp(),
  });
}

export async function acceptCanto(
  id: string,
  edits?: { title?: string; letra?: string },
): Promise<void> {
  const patch: Record<string, unknown> = { status: "accepted" };
  if (edits?.title != null) patch.title = edits.title.trim();
  if (edits?.letra != null) patch.letra = edits.letra.trim();
  await updateDoc(doc(db, "cantos", id), patch);
}

export async function rejectCanto(id: string): Promise<void> {
  await updateDoc(doc(db, "cantos", id), { status: "rejected" });
}

export async function updateCantoFields(
  id: string,
  fields: { title: string; letra: string },
): Promise<void> {
  await updateDoc(doc(db, "cantos", id), {
    title: fields.title.trim(),
    letra: fields.letra.trim(),
  });
}
