import { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions } from "react-native";
import { Card, Button, Surface } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import Icon, { MaterialIconName } from "../components/Icon";
import { useHomeBack } from "../hooks/useHomeBack";
import { NavigationProp, RootStackParamList } from "../types";
import { Sounds } from "../utils/sounds";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { saveRecord } from "../utils/scores";

type SaveStatus = "saving" | "saved" | "error" | "noauth" | "invalid";

const CELEBRATION_EMOJIS = ["🔥", "🪓", "💧", "🚒", "⛑️", "🧯", "🪢", "🪣", "💨", "🚨"];
let lastCelebrationIdx = -1;
function pickCelebrationEmoji(): string {
  let idx: number;
  do { idx = Math.floor(Math.random() * CELEBRATION_EMOJIS.length); }
  while (idx === lastCelebrationIdx && CELEBRATION_EMOJIS.length > 1);
  lastCelebrationIdx = idx;
  return CELEBRATION_EMOJIS[idx];
}

const RAIN_COUNT = 28;
function createDrop() {
  const { width } = Dimensions.get("window");
  const gameWidth = Math.min(width, 480);
  return {
    x: Math.random() * Math.max(gameWidth - 50, 100),
    startDelay: Math.random() * 2200,
    duration: 1400 + Math.random() * 900,
    size: 22 + Math.floor(Math.random() * 26),
    anim: new Animated.Value(0),
  };
}

export default function ResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "Result">>();
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuth();
  const { mode, direction, streak, avgSpeed, score, total, missedCode, missedDesc, isNewRecord } = route.params;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saving");
  const celebrationEmoji = useMemo(() => mode === "speed" ? pickCelebrationEmoji() : "", []);
  const drops = useMemo(() => Array.from({ length: RAIN_COUNT }, createDrop), []);

  useEffect(() => {
    if (mode !== "speed") return;
    const { height } = Dimensions.get("window");
    const animations = drops.map((drop) =>
      Animated.sequence([
        Animated.delay(drop.startDelay),
        Animated.timing(drop.anim, { toValue: 1, duration: drop.duration, useNativeDriver: true }),
      ])
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, []);

  useEffect(() => {
    Sounds.results(mode === "streak" ? (streak > 0 ? 1 : 0) : score, total);
    if (!user) { setSaveStatus("noauth"); return; }
    if (mode === "speed" && score < 7) { setSaveStatus("invalid"); return; }
    const promise =
      mode === "streak"
        ? saveRecord(user.uid, user.username, direction, mode, streak, null, streak, streak)
        : saveRecord(user.uid, user.username, direction, mode, null, avgSpeed, score, total);
    promise
      .then(() => setSaveStatus("saved"))
      .catch((err) => { console.error("saveRecord failed:", err); setSaveStatus("error"); });
  }, []);

  useHomeBack();

  function SaveBanner() {
    const bannerMap: Record<SaveStatus, { icon: MaterialIconName; iconColor: string; text: string; bg: string; border: string }> = {
      saving: { icon: "hourglass-empty", iconColor: C.textDim, text: "Guardando en el ranking...", bg: C.cardRaised, border: C.border },
      saved: { icon: "check-circle", iconColor: C.correctBorder, text: "Guardado en el ranking", bg: C.correctBg, border: C.correctBorder },
      invalid: { icon: "info", iconColor: C.yellow, text: "Necesitás al menos 7 aciertos para guardar en el ranking", bg: C.yellow + "14", border: C.yellow },
      noauth: { icon: "login", iconColor: C.yellow, text: "Iniciá sesión para guardar en el ranking", bg: C.yellow + "14", border: C.yellow },
      error: { icon: "error", iconColor: C.wrongBorder, text: "Error al guardar · verificá tu conexión", bg: C.wrongBg, border: C.wrongBorder },
    };
    const bannerProps = bannerMap[saveStatus];

    const isClickable = saveStatus === "noauth";
    if (isClickable) {
      return (
        <Button onPress={() => navigation.navigate("Home")} mode="text" icon={bannerProps.icon} textColor={C.yellow} compact>
          {bannerProps.text}
        </Button>
      );
    }
    return (
      <Surface style={[styles.saveBanner, { backgroundColor: bannerProps.bg, borderColor: bannerProps.border }]} elevation={0}>
        <Icon name={bannerProps.icon} size={16} color={bannerProps.iconColor} />
        <Text style={[styles.saveBannerText, { color: C.text }]}>{bannerProps.text}</Text>
      </Surface>
    );
  }

  // ── Streak mode ──────────────────────────────────────────────────────────────
  if (mode === "streak") {
    return (
      <ScrollView style={[styles.scroll, { backgroundColor: C.bg }]} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={[styles.heroCard, { backgroundColor: C.card, borderColor: C.yellow }]} elevation={0}>
          <Card.Content style={{ alignItems: "center", gap: 4 }}>
            <Icon name="local-fire-department" size={48} color={C.yellow} style={{ marginBottom: 4 }} />
            <Text style={[styles.heroNumber, { color: C.yellow }]}>{streak}</Text>
            <Text style={[styles.heroLabel, { color: C.textDim }]}>racha máxima</Text>
            {isNewRecord && streak > 0 && (
              <Surface style={[styles.recordBadge, { backgroundColor: C.yellow }]} elevation={0}>
                <Icon name="emoji-events" size={15} color={C.onAccent} />
                <Text style={[styles.recordBadgeText, { color: C.onAccent }]}>¡NUEVO RÉCORD PERSONAL!</Text>
              </Surface>
            )}
          </Card.Content>
        </Card>

        <SaveBanner />

        {missedCode && (
          <Card style={[styles.missedCard, { backgroundColor: C.card, borderColor: C.wrongBorder }]} elevation={1}>
            <Card.Content>
              <Text style={[styles.missedLabel, { color: C.textHint }]}>
                {streak === 0 ? "Primera respuesta incorrecta:" : "Te equivocaste en:"}
              </Text>
              <View style={styles.missedRow}>
                <View style={[styles.codeBadge, { backgroundColor: C.wrongBg }]}>
                  <Text style={[styles.codeText, { color: C.wrongBorder }]}>{missedCode}</Text>
                </View>
                <Text style={[styles.missedDesc, { color: C.text }]} numberOfLines={3}>{missedDesc}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.actions}>
          <Button mode="contained" icon="refresh" onPress={() => navigation.replace("Quiz", { mode, direction })} contentStyle={{ paddingVertical: 6 }} style={{ borderRadius: 13 }}>
            Intentar de nuevo
          </Button>
          <Button mode="outlined" icon="trophy" style={[styles.rankingBtn, { borderColor: C.border }]} textColor={C.text} onPress={() => navigation.navigate("Leaderboard", { initialTab: "streak" })} contentStyle={{ paddingVertical: 6 }}>
            Ver Ranking
          </Button>
          <Button mode="text" icon="home" textColor={C.textHint} onPress={() => navigation.navigate("Home")} contentStyle={{ paddingVertical: 6 }}>
            Inicio
          </Button>
        </View>
      </ScrollView>
    );
  }

  // ── Speed mode ───────────────────────────────────────────────────────────────
  const pct = Math.round((score / total) * 100);
  const { height: screenHeight } = Dimensions.get("window");

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.scroll, { backgroundColor: C.bg }]} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={[styles.heroCard, { backgroundColor: C.card, borderColor: C.yellow }]} elevation={0}>
          <Card.Content style={{ alignItems: "center", gap: 4 }}>
            <Icon name="bolt" size={48} color={C.yellow} style={{ marginBottom: 4 }} />
            <View style={styles.speedRow}>
              <Text style={[styles.heroNumber, { color: C.yellow }]}>{avgSpeed.toFixed(2)}</Text>
              <Text style={[styles.speedUnit, { color: C.yellow }]}>s</Text>
            </View>
            <Text style={[styles.heroLabel, { color: C.textDim }]}>promedio por código</Text>
            {isNewRecord && (
              <Surface style={[styles.recordBadge, { backgroundColor: C.yellow }]} elevation={0}>
                <Icon name="emoji-events" size={15} color={C.onAccent} />
                <Text style={[styles.recordBadgeText, { color: C.onAccent }]}>¡NUEVO RÉCORD PERSONAL!</Text>
              </Surface>
            )}
          </Card.Content>
        </Card>

        <SaveBanner />

        <Card style={[styles.precisionCard, { backgroundColor: C.card, borderColor: C.border }]} elevation={1}>
          <Card.Content style={{ gap: 8 }}>
            <Text style={[styles.precisionLabel, { color: C.textHint }]}>Precisión</Text>
            <View style={[styles.precisionTrack, { backgroundColor: C.cardRaised }]}>
              <View style={[styles.precisionFill, {
                width: `${pct}%` as any,
                backgroundColor: pct === 100 ? "#27ae60" : pct >= 70 ? C.yellow : C.red,
              }]} />
            </View>
            <Text style={[styles.precisionPct, {
              color: pct === 100 ? "#27ae60" : pct >= 70 ? C.yellow : C.red,
            }]}>
              {score}/{total} correctas · {pct}%
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button mode="contained" icon="refresh" onPress={() => navigation.replace("Quiz", { mode, direction })} contentStyle={{ paddingVertical: 6 }} style={{ borderRadius: 13 }}>
            Intentar de nuevo
          </Button>
          <Button mode="outlined" icon="trophy" style={[styles.rankingBtn, { borderColor: C.border }]} textColor={C.text} onPress={() => navigation.navigate("Leaderboard", { initialTab: mode === "speed" ? "speed" : "streak", initialDirection: direction })} contentStyle={{ paddingVertical: 6 }}>
            Ver Ranking
          </Button>
          <Button mode="text" icon="home" textColor={C.textHint} onPress={() => navigation.navigate("Home")} contentStyle={{ paddingVertical: 6 }}>
            Inicio
          </Button>
        </View>
      </ScrollView>

      {/* Lluvia de emojis */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {drops.map((drop, i) => (
          <Animated.Text
            key={i}
            style={{
              position: "absolute",
              left: drop.x,
              top: 0,
              fontSize: drop.size,
              transform: [{
                translateY: drop.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, screenHeight + 60],
                }),
              }],
              opacity: drop.anim.interpolate({
                inputRange: [0, 0.08, 0.88, 1],
                outputRange: [0, 1, 1, 0],
              }),
            }}
          >
            {celebrationEmoji}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    container: { padding: 20, paddingTop: 16, gap: 14 },
    heroCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
    heroNumber: { fontSize: 72, fontWeight: "bold", lineHeight: 80, textAlign: "center" as any },
    heroLabel: { fontSize: 14, marginTop: 4, textAlign: "center" as any },
    speedRow: { flexDirection: "row", alignItems: "flex-end" },
    speedUnit: { fontSize: 32, fontWeight: "bold", marginBottom: 8, marginLeft: 4 },
    recordBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
    recordBadgeText: { fontWeight: "bold", fontSize: 13 },
    saveBanner: {
      flexDirection: "row", gap: 8,
      borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
      alignItems: "center", justifyContent: "center", borderWidth: 1,
    },
    saveBannerText: { fontSize: 13, fontWeight: "600" },
    missedCard: { borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
    missedLabel: { fontSize: 12, marginBottom: 10 },
    missedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    codeBadge: {
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
      minWidth: 68, alignItems: "center",
    },
    codeText: { fontWeight: "bold", fontSize: 14 },
    missedDesc: { flex: 1, fontSize: 14, lineHeight: 20 },
    precisionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
    precisionLabel: { fontSize: 12 },
    precisionTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
    precisionFill: { height: "100%", borderRadius: 5 },
    precisionPct: { fontSize: 15, fontWeight: "bold" },
    actions: { gap: 10 },
    rankingBtn: {
      borderRadius: 13,
    },
  });
}
