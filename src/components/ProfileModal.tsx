import { useEffect, useState, useMemo } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { PlayerRecord, PeriodStats, fetchPeriodStats } from "../utils/scores";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";

interface Props {
  visible: boolean;
  onClose: () => void;
  uid: string;
  username: string;
}

type Tab = "alltime" | "week";

export default function ProfileModal({ visible, onClose, uid, username }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [tab, setTab] = useState<Tab>("alltime");
  const [record, setRecord] = useState<PlayerRecord | null>(null);
  const [week, setWeek] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "records", uid)).then((s) => s.exists() ? s.data() as PlayerRecord : null),
      fetchPeriodStats(uid, 7),
    ])
      .then(([rec, w]) => { setRecord(rec); setWeek(w); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, uid]);

  function fmtSpeed(v: number | null | undefined) {
    return v != null ? `${v.toFixed(1)}s` : "—";
  }
  function fmtStreak(v: number | undefined) {
    return v != null && v > 0 ? `${v}` : "—";
  }

  const allTime: PeriodStats = {
    gamesPlayed:    record?.gamesPlayed    ?? 0,
    totalCorrect:   record?.totalCorrect   ?? 0,
    totalQuestions: record?.totalQuestions ?? 0,
  };
  const active = tab === "alltime" ? allTime : (week ?? { gamesPlayed: 0, totalCorrect: 0, totalQuestions: 0 });
  const pct = active.totalQuestions > 0
    ? Math.round((active.totalCorrect / active.totalQuestions) * 100) : 0;
  const wrong = active.totalQuestions - active.totalCorrect;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.card}>
            {/* Encabezado */}
            <View style={styles.header}>
              <Text style={styles.avatar}>👤</Text>
              <Text style={styles.username}>{username}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, tab === "alltime" && styles.tabActive]}
                onPress={() => setTab("alltime")} activeOpacity={0.8}
              >
                <Text style={[styles.tabText, tab === "alltime" && styles.tabTextActive]}>
                  🏆 Todos los tiempos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === "week" && styles.tabActive]}
                onPress={() => setTab("week")} activeOpacity={0.8}
              >
                <Text style={[styles.tabText, tab === "week" && styles.tabTextActive]}>
                  📅 Últimos 7 días
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color={C.yellow} style={{ marginVertical: 24 }} />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 340 }}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Stats del período */}
                <View style={styles.statsGrid}>
                  <StatBox icon="🎮" label="Partidas"   value={String(active.gamesPlayed)} C={C} />
                  <StatBox icon="📊" label="Precisión"  value={`${pct}%`} C={C} accent />
                </View>
                <View style={styles.statsGrid}>
                  <StatBox icon="✅" label="Aciertos"  value={String(active.totalCorrect)} C={C} />
                  <StatBox icon="❌" label="Errores"    value={String(wrong)} C={C} />
                </View>

                {/* Récords personales — solo en tab todos los tiempos */}
                {tab === "alltime" && (
                  <>
                    <Text style={styles.sectionLabel}>🔤 CÓDIGO → DESCRIPCIÓN</Text>
                    <View style={styles.statsGrid}>
                      <RecordItem icon="🔥" label="Racha máx."  value={fmtStreak(record?.bestStreak_ctd)} C={C} />
                      <RecordItem icon="⚡" label="Vel. récord" value={fmtSpeed(record?.bestAvgSpeed_ctd)} C={C} />
                    </View>
                    <Text style={styles.sectionLabel}>📻 DESCRIPCIÓN → CÓDIGO</Text>
                    <View style={styles.statsGrid}>
                      <RecordItem icon="🔥" label="Racha máx."  value={fmtStreak(record?.bestStreak_dtc)} C={C} />
                      <RecordItem icon="⚡" label="Vel. récord" value={fmtSpeed(record?.bestAvgSpeed_dtc)} C={C} />
                    </View>
                  </>
                )}

                {!record && tab === "alltime" && (
                  <Text style={styles.noData}>Jugá una partida para ver tus estadísticas.</Text>
                )}
                {tab === "week" && (week?.gamesPlayed ?? 0) === 0 && (
                  <Text style={styles.noData}>No jugaste partidas en los últimos 7 días.</Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function StatBox({ icon, label, value, C, accent }: {
  icon: string; label: string; value: string; C: ThemeColors; accent?: boolean;
}) {
  return (
    <View style={{
      flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 4,
      backgroundColor: accent ? C.yellow + "18" : C.cardRaised,
      borderWidth: accent ? 1 : 0, borderColor: accent ? C.yellow + "55" : "transparent",
    }}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={{ color: accent ? C.yellow : C.text, fontSize: 20, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: C.textHint, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function RecordItem({ icon, label, value, C }: {
  icon: string; label: string; value: string; C: ThemeColors;
}) {
  return (
    <View style={{
      flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 4,
      backgroundColor: C.cardRaised,
    }}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={{ color: C.text, fontSize: 20, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: C.textHint, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center", alignItems: "center", padding: 20,
    },
    card: {
      backgroundColor: C.card, borderRadius: 24,
      width: "100%", maxWidth: 420, padding: 24, gap: 14,
    },
    header: { alignItems: "center", gap: 4 },
    avatar: { fontSize: 40 },
    username: { color: C.yellow, fontSize: 18, fontWeight: "bold" },
    tabRow: {
      flexDirection: "row", backgroundColor: C.cardRaised,
      borderRadius: 12, padding: 4, gap: 4,
    },
    tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
    tabActive: { backgroundColor: C.yellow },
    tabText: { color: C.textHint, fontSize: 12, fontWeight: "600" },
    tabTextActive: { color: C.black, fontWeight: "700" },
    scrollContent: { gap: 10 },
    statsGrid: { flexDirection: "row", gap: 10 },
    sectionLabel: {
      color: C.textHint, fontSize: 10, fontWeight: "bold",
      letterSpacing: 1.2, marginTop: 4,
    },
    noData: { color: C.textDim, fontSize: 13, textAlign: "center", marginVertical: 8 },
    closeBtn: {
      backgroundColor: C.cardRaised, borderRadius: 12,
      paddingVertical: 12, alignItems: "center",
    },
    closeBtnText: { color: C.textDim, fontSize: 14, fontWeight: "bold" },
  });
}
