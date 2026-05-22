import { useEffect, useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { PlayerRecord, PeriodStats, fetchPeriodStats } from "../utils/scores";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { useHomeBack } from "../hooks/useHomeBack";
import { RootStackParamList } from "../types";

type Tab = "alltime" | "week";

export default function ProfileScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const route = useRoute<RouteProp<RootStackParamList, "Profile">>();
  const { uid, username } = route.params;
  useHomeBack();

  const [tab, setTab] = useState<Tab>("alltime");
  const [record, setRecord] = useState<PlayerRecord | null>(null);
  const [week, setWeek] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "records", uid)).then((s) => s.exists() ? s.data() as PlayerRecord : null),
      fetchPeriodStats(uid, 7),
    ])
      .then(([rec, w]) => { setRecord(rec); setWeek(w); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  function fmtSpeed(v: number | null | undefined) {
    return v != null ? `${v.toFixed(2)}s` : "—";
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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

      {/* Encabezado */}
      <View style={styles.hero}>
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
        <ActivityIndicator color={C.yellow} style={{ marginTop: 48 }} size="large" />
      ) : (
        <View style={styles.content}>

          {/* Stats del período */}
          <View style={styles.grid}>
            <StatBox icon="🎮" label="Partidas"  value={String(active.gamesPlayed)} C={C} />
            <StatBox icon="📊" label="Precisión" value={`${pct}%`} C={C} accent />
          </View>
          <View style={styles.grid}>
            <StatBox icon="✅" label="Aciertos" value={String(active.totalCorrect)} C={C} />
            <StatBox icon="❌" label="Errores"   value={String(wrong)} C={C} />
          </View>

          {/* Récords personales */}
          {tab === "alltime" && (
            <>
              <Text style={styles.sectionLabel}>🔤 CÓDIGO → DESCRIPCIÓN</Text>
              <View style={styles.grid}>
                <RecordItem icon="🔥" label="Racha máx."  value={fmtStreak(record?.bestStreak_ctd)} C={C} />
                <RecordItem icon="⚡" label="Vel. récord" value={fmtSpeed(record?.bestAvgSpeed_ctd)} C={C} />
              </View>
              <Text style={styles.sectionLabel}>📻 DESCRIPCIÓN → CÓDIGO</Text>
              <View style={styles.grid}>
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
        </View>
      )}
    </ScrollView>
  );
}

function StatBox({ icon, label, value, C, accent }: {
  icon: string; label: string; value: string; C: ThemeColors; accent?: boolean;
}) {
  return (
    <View style={{
      flex: 1, borderRadius: 16, padding: 20, alignItems: "center", gap: 8,
      backgroundColor: accent ? C.yellow + "18" : C.card,
      borderWidth: accent ? 1.5 : 1,
      borderColor: accent ? C.yellow + "66" : C.border,
    }}>
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={{ color: accent ? C.yellow : C.text, fontSize: 28, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: C.textHint, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function RecordItem({ icon, label, value, C }: {
  icon: string; label: string; value: string; C: ThemeColors;
}) {
  return (
    <View style={{
      flex: 1, borderRadius: 16, padding: 20, alignItems: "center", gap: 8,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    }}>
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={{ color: C.text, fontSize: 28, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: C.textHint, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 40, gap: 16 },
    hero: { alignItems: "center", paddingVertical: 12, gap: 8 },
    avatar: { fontSize: 56 },
    username: { color: C.yellow, fontSize: 22, fontWeight: "bold" },
    tabRow: {
      flexDirection: "row", backgroundColor: C.card,
      borderRadius: 14, padding: 4, gap: 4,
      borderWidth: 1, borderColor: C.border,
    },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 11, alignItems: "center" },
    tabActive: { backgroundColor: C.yellow },
    tabText: { color: C.textHint, fontSize: 13, fontWeight: "600" },
    tabTextActive: { color: C.black, fontWeight: "700" },
    content: { gap: 14 },
    grid: { flexDirection: "row", gap: 14 },
    sectionLabel: {
      color: C.textHint, fontSize: 11, fontWeight: "bold",
      letterSpacing: 1.2, marginTop: 4,
    },
    noData: { color: C.textDim, fontSize: 14, textAlign: "center", marginVertical: 16 },
  });
}
