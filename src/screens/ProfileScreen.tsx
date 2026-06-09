import { useEffect, useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { PlayerRecord, PeriodStats, fetchPeriodStats } from "../utils/scores";
import { useAuth } from "../context/AuthContext";
import { ACHIEVEMENTS } from "../utils/achievements";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import Icon, { MaterialIconName } from "../components/Icon";
import { useHomeBack } from "../hooks/useHomeBack";
import { RootStackParamList } from "../types";

type Tab = "alltime" | "week";

export default function ProfileScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const route = useRoute<RouteProp<RootStackParamList, "Profile">>();
  const navigation = useNavigation();
  const { uid, username } = route.params;
  const { user, signOut } = useAuth();
  const isOwnProfile = user?.uid === uid;
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
        <View style={[styles.avatarCircle, { backgroundColor: C.yellow + "1A" }]}>
          <Icon name="account-circle" size={48} color={C.yellow} />
        </View>
        <Text style={styles.username}>{username}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={C.yellow} style={{ marginTop: 48 }} size="large" />
      ) : (
        <View style={styles.content}>

          {/* ── Logros ── */}
          <Text style={styles.sectionLabel}>
            LOGROS ({record ? ACHIEVEMENTS.filter(a => a.check(record!)).length : 0}/{ACHIEVEMENTS.length})
          </Text>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((a) => {
              const unlocked = !!record && a.check(record);
              return (
                <View
                  key={a.id}
                  style={[
                    styles.achievementCard,
                    unlocked ? styles.achievementUnlocked : styles.achievementLocked,
                  ]}
                >
                  <View style={[styles.achievementBadge, unlocked ? styles.achievementBadgeOn : styles.achievementBadgeOff]}>
                    <Icon
                      name={unlocked ? a.icon : "lock"}
                      size={24}
                      color={unlocked ? C.yellow : C.textHint}
                    />
                  </View>
                  <Text style={[styles.achievementName, !unlocked && styles.achievementDimText]}>
                    {a.name}
                  </Text>
                  <Text style={styles.achievementDesc}>{a.description}</Text>
                </View>
              );
            })}
          </View>

          {/* ── Tabs ── */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, tab === "alltime" && styles.tabActive]}
              onPress={() => setTab("alltime")} activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "alltime" && styles.tabTextActive]}>
                Todos los tiempos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "week" && styles.tabActive]}
              onPress={() => setTab("week")} activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "week" && styles.tabTextActive]}>
                Últimos 7 días
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Stats del período ── */}
          <View style={styles.grid}>
            <StatBox icon="sports-esports" label="Partidas"  value={String(active.gamesPlayed)} C={C} />
            <StatBox icon="insights" label="Precisión" value={`${pct}%`} C={C} accent />
          </View>
          <View style={styles.grid}>
            <StatBox icon="check-circle" label="Aciertos" value={String(active.totalCorrect)} C={C} />
            <StatBox icon="cancel" label="Errores"   value={String(wrong)} C={C} />
          </View>

          {/* ── Récords personales ── */}
          {tab === "alltime" && (
            <>
              <Text style={styles.sectionLabel}>CÓDIGO → DESCRIPCIÓN</Text>
              <View style={styles.grid}>
                <RecordItem icon="local-fire-department" label="Racha máx."  value={fmtStreak(record?.bestStreak_ctd)} C={C} />
                <RecordItem icon="bolt" label="Vel. récord" value={fmtSpeed(record?.bestAvgSpeed_ctd)} C={C} />
              </View>
              <Text style={styles.sectionLabel}>DESCRIPCIÓN → CÓDIGO</Text>
              <View style={styles.grid}>
                <RecordItem icon="local-fire-department" label="Racha máx."  value={fmtStreak(record?.bestStreak_dtc)} C={C} />
                <RecordItem icon="bolt" label="Vel. récord" value={fmtSpeed(record?.bestAvgSpeed_dtc)} C={C} />
              </View>
            </>
          )}

          {!record && tab === "alltime" && (
            <Text style={styles.noData}>Jugá una partida para ver tus estadísticas.</Text>
          )}
          {tab === "week" && (week?.gamesPlayed ?? 0) === 0 && (
            <Text style={styles.noData}>No jugaste partidas en los últimos 7 días.</Text>
          )}

          {isOwnProfile && (
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={async () => { await signOut(); navigation.goBack(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.signOutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function StatBox({ icon, label, value, C, accent }: {
  icon: MaterialIconName; label: string; value: string; C: ThemeColors; accent?: boolean;
}) {
  return (
    <View style={{
      flex: 1, borderRadius: 16, padding: 20, alignItems: "center", gap: 8,
      backgroundColor: accent ? C.yellow + "18" : C.card,
      borderWidth: 1,
      borderColor: accent ? C.yellow + "66" : C.border,
    }}>
      <Icon name={icon} size={26} color={accent ? C.yellow : C.textDim} />
      <Text style={{ color: accent ? C.yellow : C.text, fontSize: 28, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: C.textHint, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function RecordItem({ icon, label, value, C }: {
  icon: MaterialIconName; label: string; value: string; C: ThemeColors;
}) {
  return (
    <View style={{
      flex: 1, borderRadius: 16, padding: 20, alignItems: "center", gap: 8,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    }}>
      <Icon name={icon} size={26} color={C.yellow} />
      <Text style={{ color: C.text, fontSize: 28, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: C.textHint, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 40, gap: 16 },
    hero: { alignItems: "center", paddingVertical: 12, gap: 10 },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
    username: { color: C.text, fontSize: 22, fontWeight: "bold" },
    tabRow: {
      flexDirection: "row", backgroundColor: C.card,
      borderRadius: 14, padding: 4, gap: 4,
      borderWidth: 1, borderColor: C.border,
    },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 11, alignItems: "center" },
    tabActive: { backgroundColor: C.yellow },
    tabText: { color: C.textHint, fontSize: 13, fontWeight: "600" },
    tabTextActive: { color: C.onAccent, fontWeight: "700" },
    content: { gap: 14 },
    grid: { flexDirection: "row", gap: 14 },
    sectionLabel: {
      color: C.textHint, fontSize: 11, fontWeight: "bold",
      letterSpacing: 1.2, marginTop: 4,
    },
    noData: { color: C.textDim, fontSize: 14, textAlign: "center", marginVertical: 16 },
    signOutBtn: {
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
      marginTop: 8,
    },
    signOutText: { color: C.textHint, fontSize: 14, fontWeight: "600" },

    achievementsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    achievementCard: {
      width: "47%",
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
    },
    achievementUnlocked: {
      backgroundColor: C.card,
      borderColor: C.yellow + "55",
    },
    achievementLocked: {
      backgroundColor: C.cardRaised,
      borderColor: C.border,
    },
    achievementBadge: {
      width: 48, height: 48, borderRadius: 24,
      alignItems: "center", justifyContent: "center",
    },
    achievementBadgeOn: { backgroundColor: C.yellow + "1A" },
    achievementBadgeOff: { backgroundColor: C.border + "55" },
    achievementName: {
      color: C.text,
      fontSize: 13,
      fontWeight: "bold",
      textAlign: "center",
    },
    achievementDimText: { color: C.textHint },
    achievementDesc: {
      color: C.textHint,
      fontSize: 11,
      textAlign: "center",
      lineHeight: 15,
    },
  });
}
