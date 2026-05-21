import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { subscribeLeaderboard, LeaderboardEntry } from "../utils/scores";
import { useAuth } from "../context/AuthContext";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { useHomeBack } from "../hooks/useHomeBack";

const MEDALS = ["🥇", "🥈", "🥉"];

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins === 1) return "hace 1 min";
  return `hace ${mins} min`;
}

export default function LeaderboardScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useHomeBack();

  useEffect(() => {
    const unsub = subscribeLeaderboard((data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const userRank = user ? entries.findIndex((e) => e.uid === user.uid) + 1 : 0;

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Última Hora</Text>
        <Text style={styles.headerSub}>Mejor partida por jugador · se actualiza en vivo</Text>
      </View>

      {/* Posición propia */}
      {user && userRank > 0 && (
        <View style={styles.myRankBanner}>
          <Text style={styles.myRankText}>
            Tu posición: #{userRank} con {entries[userRank - 1]?.errors} errores
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.yellow} size="large" />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🕐</Text>
          <Text style={styles.emptyTitle}>Sin partidas en la última hora</Text>
          <Text style={styles.emptyText}>¡Jugá una partida para aparecer en el ranking!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.uid}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const isMe = item.uid === user?.uid;
            const accuracy = Math.round((item.correct / item.total) * 100);
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={styles.rankText}>
                  {item.rank <= 3 ? MEDALS[item.rank - 1] : `#${item.rank}`}
                </Text>

                <View style={styles.userInfo}>
                  <Text style={[styles.username, isMe && styles.usernameMe]} numberOfLines={1}>
                    {item.username}{isMe ? " (vos)" : ""}
                  </Text>
                  <Text style={styles.timeAgo}>{timeAgo(item.playedAt)}</Text>
                </View>

                <View style={styles.stats}>
                  <View style={[styles.errorBadge, item.errors === 0 && styles.errorBadgePerfect]}>
                    <Text style={[styles.errorCount, item.errors === 0 && styles.errorCountPerfect]}>
                      {item.errors === 0 ? "✓ 0" : `✗ ${item.errors}`}
                    </Text>
                  </View>
                  <Text style={styles.accuracy}>{accuracy}%</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      backgroundColor: C.card,
    },
    headerTitle: { color: C.yellow, fontSize: 18, fontWeight: "bold" },
    headerSub: { color: C.textHint, fontSize: 12, marginTop: 2 },
    myRankBanner: {
      backgroundColor: "rgba(255,193,7,0.12)",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,193,7,0.3)",
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
      paddingVertical: 13,
      gap: 12,
    },
    rowMe: { backgroundColor: "rgba(255,193,7,0.08)" },
    rankText: { fontSize: 18, width: 36, textAlign: "center" },
    userInfo: { flex: 1 },
    username: { color: C.text, fontSize: 15, fontWeight: "bold" },
    usernameMe: { color: C.yellow },
    timeAgo: { color: C.textHint, fontSize: 11, marginTop: 2 },
    stats: { alignItems: "flex-end", gap: 3 },
    errorBadge: {
      backgroundColor: C.wrongBg,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: C.wrongBorder,
    },
    errorBadgePerfect: {
      backgroundColor: C.correctBg,
      borderColor: C.correctBorder,
    },
    errorCount: { color: C.wrongBorder, fontWeight: "bold", fontSize: 13 },
    errorCountPerfect: { color: C.correctBorder },
    accuracy: { color: C.textHint, fontSize: 11 },
  });
}
