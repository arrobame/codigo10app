import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import {
  subscribeStreakLeaderboard,
  subscribeSpeedLeaderboard,
  RankedRecord,
} from "../utils/scores";
import { useAuth } from "../context/AuthContext";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { useHomeBack } from "../hooks/useHomeBack";
import { RootStackParamList } from "../types";

const MEDALS = ["🥇", "🥈", "🥉"];
type Tab = "streak" | "speed";

export default function LeaderboardScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "Leaderboard">>();
  const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? "streak");
  const [streakEntries, setStreakEntries] = useState<RankedRecord[]>([]);
  const [speedEntries, setSpeedEntries] = useState<RankedRecord[]>([]);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [loadingSpeed, setLoadingSpeed] = useState(true);

  useHomeBack();

  useEffect(() => {
    const unsub = subscribeStreakLeaderboard((data) => {
      setStreakEntries(data);
      setLoadingStreak(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeSpeedLeaderboard((data) => {
      setSpeedEntries(data);
      setLoadingSpeed(false);
    });
    return unsub;
  }, []);

  const entries = tab === "streak" ? streakEntries : speedEntries;
  const loading = tab === "streak" ? loadingStreak : loadingSpeed;
  const myRecord = user ? entries.find((e) => e.uid === user.uid) : null;

  function renderMyBanner() {
    if (!myRecord) return null;
    const value =
      tab === "streak"
        ? `🔥 ${myRecord.bestStreak} consecutivos`
        : `⚡ ${myRecord.bestAvgSpeed.toFixed(1)}s promedio`;
    return (
      <View style={styles.myRankBanner}>
        <Text style={styles.myRankText}>
          Tu récord: #{myRecord.rank} · {value}
        </Text>
      </View>
    );
  }

  function renderItem({ item }: { item: RankedRecord }) {
    const isMe = item.uid === user?.uid;
    const value =
      tab === "streak"
        ? `🔥 ${item.bestStreak}`
        : `⚡ ${item.bestAvgSpeed.toFixed(1)}s`;
    const sub =
      tab === "streak"
        ? "consecutivos"
        : "por código";

    return (
      <View style={[styles.row, isMe && styles.rowMe]}>
        <Text style={styles.rankText}>
          {item.rank <= 3 ? MEDALS[item.rank - 1] : `#${item.rank}`}
        </Text>
        <Text style={[styles.username, isMe && styles.usernameMe]} numberOfLines={1}>
          {item.username}{isMe ? " (vos)" : ""}
        </Text>
        <View style={styles.valueBadge}>
          <Text style={[styles.valueText, isMe && styles.valueTextMe]}>{value}</Text>
          <Text style={styles.valueSub}>{sub}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selector de tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "streak" && styles.tabActive]}
          onPress={() => setTab("streak")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === "streak" && styles.tabTextActive]}>
            🔥 Racha Máxima
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "speed" && styles.tabActive]}
          onPress={() => setTab("speed")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === "speed" && styles.tabTextActive]}>
            ⚡ Velocidad
          </Text>
        </TouchableOpacity>
      </View>

      {/* Descripción del ranking activo */}
      <View style={styles.header}>
        {tab === "streak" ? (
          <>
            <Text style={styles.headerTitle}>Mayor racha de respuestas correctas</Text>
            <Text style={styles.headerSub}>Códigos consecutivos sin error · récord histórico</Text>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>Velocidad promedio por código</Text>
            <Text style={styles.headerSub}>Segundos por respuesta en 10 preguntas · récord histórico</Text>
          </>
        )}
      </View>

      {renderMyBanner()}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.yellow} size="large" />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>{tab === "streak" ? "🔥" : "⚡"}</Text>
          <Text style={styles.emptyTitle}>Sin récords aún</Text>
          <Text style={styles.emptyText}>¡Jugá una partida para aparecer en el ranking!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.uid}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    tabRow: {
      flexDirection: "row",
      margin: 12,
      backgroundColor: C.cardRaised,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 9,
      alignItems: "center",
    },
    tabActive: { backgroundColor: C.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    tabText: { color: C.textHint, fontSize: 13, fontWeight: "600" },
    tabTextActive: { color: C.yellow },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    headerTitle: { color: C.text, fontSize: 14, fontWeight: "bold" },
    headerSub: { color: C.textHint, fontSize: 11, marginTop: 2 },
    myRankBanner: {
      backgroundColor: "rgba(255,193,7,0.1)",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,193,7,0.25)",
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    myRankText: { color: C.yellow, fontSize: 13, fontWeight: "bold" },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { color: C.text, fontSize: 17, fontWeight: "bold", marginBottom: 6 },
    emptyText: { color: C.textDim, fontSize: 14, textAlign: "center" },
    separator: { height: 1, backgroundColor: C.border },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowMe: { backgroundColor: "rgba(255,193,7,0.07)" },
    rankText: { fontSize: 18, width: 36, textAlign: "center" },
    username: { flex: 1, color: C.text, fontSize: 15, fontWeight: "bold" },
    usernameMe: { color: C.yellow },
    valueBadge: { alignItems: "flex-end" },
    valueText: { color: C.text, fontSize: 16, fontWeight: "bold" },
    valueTextMe: { color: C.yellow },
    valueSub: { color: C.textHint, fontSize: 10, marginTop: 1 },
  });
}
