import AsyncStorage from "@react-native-async-storage/async-storage";
import { RankedEntry } from "./scores";

const KEY = "cbvp_ranking_snapshot";

type ModeKey = "streak_ctd" | "streak_dtc" | "speed_ctd" | "speed_dtc";

interface Snapshot {
  rank: number;
  aboveUids: string[];
}

type SnapshotStore = Partial<Record<ModeKey, Snapshot>>;

async function load(): Promise<SnapshotStore> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function save(store: SnapshotStore): Promise<void> {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(store)); } catch {}
}

export interface SurpassedResult {
  surpassers: RankedEntry[];
}

export async function checkAndUpdateRank(
  modeKey: ModeKey,
  userUid: string,
  entries: RankedEntry[],
): Promise<SurpassedResult | null> {
  const myEntry = entries.find((e) => e.uid === userUid);
  if (!myEntry) return null;

  const currentRank = myEntry.rank;
  const currentAboveUids = entries.filter((e) => e.rank < currentRank).map((e) => e.uid);

  const store = await load();
  const prev = store[modeKey];

  // Actualizar snapshot para la próxima vez
  store[modeKey] = { rank: currentRank, aboveUids: currentAboveUids };
  await save(store);

  if (!prev) return null; // primera vez, nada que comparar

  // Personas que ahora están arriba y antes no estaban
  const prevAboveSet = new Set(prev.aboveUids);
  const newSurpassers = entries.filter(
    (e) => e.rank < currentRank && !prevAboveSet.has(e.uid)
  );

  return newSurpassers.length > 0 ? { surpassers: newSurpassers } : null;
}

export function buildModeKey(
  tab: "streak" | "speed",
  direction: "codigo_a_descripcion" | "descripcion_a_codigo",
): ModeKey {
  return `${tab}_${direction === "codigo_a_descripcion" ? "ctd" : "dtc"}` as ModeKey;
}
