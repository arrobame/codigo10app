import { useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Surface, TouchableRipple, Button, SegmentedButtons } from "react-native-paper";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import Icon from "../components/Icon";
import {
  subscribeStreakLeaderboard,
  subscribeSpeedLeaderboard,
  RankedEntry,
} from "../utils/scores";
import { checkAndUpdateRank, buildModeKey } from "../utils/rankingTracker";
import { useAuth } from "../context/AuthContext";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { useHomeBack } from "../hooks/useHomeBack";
import { RootStackParamList, QuizDirection, NavigationProp } from "../types";

type Tab = "streak" | "speed";

export default function LeaderboardScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "Leaderboard">>();

  const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? "streak");
  const [direction, setDirection] = useState<QuizDirection>(
    route.params?.initialDirection ?? "codigo_a_descripcion"
  );
  const [streakEntries, setStreakEntries] = useState<RankedEntry[]>([]);
  const [speedEntries, setSpeedEntries] = useState<RankedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [surpassBanner, setSurpassBanner] = useState<string | null>(null);

  useHomeBack();

  useEffect(() => {
    setLoading(true);
    setStreakEntries([]);
    setSpeedEntries([]);
    const u1 = subscribeStreakLeaderboard(direction, (data) => setStreakEntries(data));
    const u2 = subscribeSpeedLeaderboard(direction, (data) => { setSpeedEntries(data); setLoading(false); });
    return () => { u1(); u2(); };
  }, [direction]);

  const entries = tab === "streak" ? streakEntries : speedEntries;
  const myRecord = user ? entries.find((e) => e.uid === user.uid) : null;

  useEffect(() => {
    if (!user || entries.length === 0) return;
    setSurpassBanner(null);
    const modeKey = buildModeKey(tab, direction);
    checkAndUpdateRank(modeKey, user.uid, entries).then((result) => {
      if (!result) return;
      const { surpassers } = result;
      const msg = surpassers.length === 1
        ? `${surpassers[0].username} te superó en este ranking`
        : `Varios usuarios te superaron en este ranking`;
      setSurpassBanner(msg);
    });
  }, [entries, tab, direction, user?.uid]);

  function toggleDirection() {
    setDirection((d) =>
      d === "codigo_a_descripcion" ? "descripcion_a_codigo" : "codigo_a_descripcion"
    );
  }

  function renderMyBanner() {
    if (!myRecord) return null;
    const value =
      tab === "streak"
        ? `${myRecord.bestStreak} consecutivos`
        : myRecord.bestAvgSpeed != null ? `${myRecord.bestAvgSpeed.toFixed(2)}s promedio` : "—";
    return (
      <View style={[styles.myRankBanner]}>
        <Text style={[styles.myRankText, { color: C.yellow }]}>Tu récord: #{myRecord.rank} · {value}</Text>
      </View>
    );
  }

  function renderItem({ item }: { item: RankedEntry }) {
    const isMe = item.uid === user?.uid;
    const num = tab === "streak"
      ? `${item.bestStreak}`
      : item.bestAvgSpeed != null ? `${item.bestAvgSpeed.toFixed(2)}s` : "—";
    const sub = tab === "streak" ? "consecutivos" : "por código";
    const topThree = item.rank <= 3;
    return (
      <Surface style={[styles.rowSurface, isMe && { backgroundColor: C.yellow + "12" }]} elevation={0}>
        <TouchableRipple
          onPress={() => navigation.navigate("Profile", { uid: item.uid, username: item.username })}
          style={styles.rowTouch}
        >
          <View style={styles.rowInner}>
            <View style={[styles.rankBadge, topThree && { backgroundColor: C.yellow }]}>
              <Text style={[styles.rankText, { color: topThree ? C.onAccent : C.textDim }]}>{item.rank}</Text>
            </View>
            <Text style={[styles.username, { color: isMe ? C.yellow : C.text }]} numberOfLines={1}>
              {item.username}{isMe ? " (vos)" : ""}
            </Text>
            <View style={styles.valueBadge}>
              <View style={styles.valueRow}>
                <Icon name={tab === "streak" ? "local-fire-department" : "bolt"} size={15} color={isMe ? C.yellow : C.textDim} />
                <Text style={[styles.valueText, { color: isMe ? C.yellow : C.text }]}>{num}</Text>
              </View>
              <Text style={[styles.valueSub, { color: C.textHint }]}>{sub}</Text>
            </View>
          </View>
        </TouchableRipple>
      </Surface>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Botón de dirección */}
      <Button
        mode="outlined"
        icon="swap-horizontal"
        onPress={toggleDirection}
        style={styles.directionBtn}
        textColor={C.yellow}
      >
        {direction === "codigo_a_descripcion" ? "Código → Descripción" : "Descripción → Código"}
      </Button>

      {/* Banner superado */}
      {surpassBanner && (
        <TouchableRipple
          onPress={() => setSurpassBanner(null)}
          style={styles.surpassBanner}
        >
          <View style={styles.surpassInner}>
            <Icon name="warning" size={16} color="#ef5350" />
            <Text style={styles.surpassText}>{surpassBanner}</Text>
            <Icon name="close" size={16} color="#ef5350" />
          </View>
        </TouchableRipple>
      )}

      {/* Tabs */}
      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        style={styles.tabRow}
        buttons={[
          { value: "streak", label: "Racha Máxima", icon: "fire" },
          { value: "speed", label: "Velocidad", icon: "lightning-bolt" },
        ]}
      />

      {/* Descripción */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        {tab === "streak" ? (
          <>
            <Text style={[styles.headerTitle, { color: C.text }]}>Mayor racha de respuestas correctas</Text>
            <Text style={[styles.headerSub, { color: C.textHint }]}>Códigos consecutivos sin error · récord histórico</Text>
          </>
        ) : (
          <>
            <Text style={[styles.headerTitle, { color: C.text }]}>Velocidad promedio por código</Text>
            <Text style={[styles.headerSub, { color: C.textHint }]}>Segundos por respuesta en 10 preguntas · récord histórico</Text>
          </>
        )}
      </View>

      {renderMyBanner()}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.yellow} size="large" />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Icon name={tab === "streak" ? "local-fire-department" : "bolt"} size={48} color={C.textHint} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>Sin récords aún</Text>
          <Text style={[styles.emptyText, { color: C.textDim }]}>¡Jugá una partida para aparecer en el ranking!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.uid}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: C.border }]} />}
          renderItem={renderItem}
          ListFooterComponent={<View style={{ height: 72 }} />}
        />
      )}

      <Surface style={[styles.homeBtn, { backgroundColor: C.card, borderColor: C.border }]} elevation={0}>
        <TouchableRipple onPress={() => navigation.navigate("Home")} style={styles.homeBtnTouch} borderless>
          <View style={styles.homeBtnInner}>
            <Icon name="home" size={18} color={C.textDim} />
            <Text style={[styles.homeBtnText, { color: C.textDim }]}>Inicio</Text>
          </View>
        </TouchableRipple>
      </Surface>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    directionBtn: {
      margin: 12, marginBottom: 8,
      borderColor: C.yellow,
    },
    surpassBanner: {
      marginHorizontal: 12, marginBottom: 4,
      backgroundColor: "#B71C1C22",
      borderWidth: 1, borderColor: "#B71C1C66",
      borderRadius: 12,
      overflow: "hidden",
    },
    surpassInner: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 10, paddingHorizontal: 14,
    },
    surpassText: { color: "#ef5350", fontSize: 13, fontWeight: "bold", flex: 1 },
    surpassDismiss: { color: "#ef5350", fontSize: 14, marginLeft: 8 },
    tabRow: { marginHorizontal: 12, marginBottom: 4 },
    header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
    headerTitle: { fontSize: 14, fontWeight: "bold" },
    headerSub: { fontSize: 11, marginTop: 2 },
    myRankBanner: {
      backgroundColor: "rgba(255,193,7,0.1)",
      borderBottomWidth: 1, borderBottomColor: "rgba(255,193,7,0.25)",
      paddingVertical: 8, paddingHorizontal: 16,
    },
    myRankText: { fontSize: 13, fontWeight: "bold" },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 6 },
    emptyText: { fontSize: 14, textAlign: "center" },
    separator: { height: 1 },
    rowSurface: { backgroundColor: C.card },
    rowTouch: { paddingHorizontal: 16, paddingVertical: 14 },
    rowInner: { flexDirection: "row", alignItems: "center", gap: 12 },
    rankBadge: {
      width: 30, height: 30, borderRadius: 15,
      alignItems: "center", justifyContent: "center",
    },
    rankText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
    username: { flex: 1, fontSize: 15, fontWeight: "bold" },
    valueBadge: { alignItems: "flex-end" },
    valueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    valueText: { fontSize: 16, fontWeight: "bold" },
    valueSub: { fontSize: 10, marginTop: 1 },
    homeBtn: {
      position: "absolute", bottom: 16, left: 16, right: 16,
      borderWidth: 1, borderRadius: 13, overflow: "hidden",
    },
    homeBtnTouch: { paddingVertical: 14, alignItems: "center", borderRadius: 13 },
    homeBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
    homeBtnText: { fontSize: 15, fontWeight: "bold" },
  });
}
