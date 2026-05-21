import { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Dimensions } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useHomeBack } from "../hooks/useHomeBack";
import { NavigationProp, RootStackParamList } from "../types";
import { Sounds } from "../utils/sounds";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { saveRecord } from "../utils/scores";

type SaveStatus = "saving" | "saved" | "error" | "noauth";

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
        Animated.timing(drop.anim, {
          toValue: 1,
          duration: drop.duration,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, []);

  useEffect(() => {
    Sounds.results(mode === "streak" ? (streak > 0 ? 1 : 0) : score, total);

    if (!user) {
      setSaveStatus("noauth");
      return;
    }

    const promise =
      mode === "streak"
        ? saveRecord(user.uid, user.username, direction, mode, streak, null, streak, streak)
        : saveRecord(user.uid, user.username, direction, mode, null, avgSpeed, score, total);

    promise
      .then(() => setSaveStatus("saved"))
      .catch((err) => {
        console.error("saveRecord failed:", err);
        setSaveStatus("error");
      });
  }, []);

  useHomeBack();

  function SaveBanner() {
    if (saveStatus === "saving") return (
      <View style={[styles.saveBanner, styles.saveBannerPending]}>
        <Text style={styles.saveBannerText}>⏳ Guardando en el ranking...</Text>
      </View>
    );
    if (saveStatus === "saved") return (
      <View style={[styles.saveBanner, styles.saveBannerOk]}>
        <Text style={styles.saveBannerText}>✓ Guardado en el ranking</Text>
      </View>
    );
    if (saveStatus === "noauth") return (
      <TouchableOpacity
        style={[styles.saveBanner, styles.saveBannerWarn]}
        onPress={() => navigation.navigate("Home")}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBannerText}>⚠ Iniciá sesión para guardar en el ranking</Text>
      </TouchableOpacity>
    );
    return (
      <View style={[styles.saveBanner, styles.saveBannerError]}>
        <Text style={styles.saveBannerText}>✗ Error al guardar · verificá tu conexión</Text>
      </View>
    );
  }

  // ── Streak mode ──────────────────────────────────────────────────────────────
  if (mode === "streak") {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🔥</Text>
          <Text style={styles.heroNumber}>{streak}</Text>
          <Text style={styles.heroLabel}>racha máxima</Text>
          {isNewRecord && streak > 0 && (
            <View style={styles.recordBadge}>
              <Text style={styles.recordBadgeText}>🏆 ¡NUEVO RÉCORD PERSONAL!</Text>
            </View>
          )}
        </View>

        <SaveBanner />

        {missedCode && (
          <View style={styles.missedCard}>
            <Text style={styles.missedLabel}>
              {streak === 0 ? "Primera respuesta incorrecta:" : "Te equivocaste en:"}
            </Text>
            <View style={styles.missedRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{missedCode}</Text>
              </View>
              <Text style={styles.missedDesc} numberOfLines={3}>{missedDesc}</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]}
            onPress={() => navigation.replace("Quiz", { mode, direction })}>
            <Text style={styles.buttonTextWhite}>🔄 Intentar de nuevo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonRanking]}
            onPress={() => navigation.navigate("Leaderboard", { initialTab: "streak" })}>
            <Text style={styles.buttonTextGold}>🏆 Ver Ranking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonGhost]}
            onPress={() => navigation.navigate("Home")}>
            <Text style={styles.buttonTextGhost}>🏠 Inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Speed mode ───────────────────────────────────────────────────────────────
  const pct = Math.round((score / total) * 100);
  const { height: screenHeight } = Dimensions.get("window");

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>⚡</Text>
          <View style={styles.speedRow}>
            <Text style={styles.heroNumber}>{avgSpeed.toFixed(2)}</Text>
            <Text style={styles.speedUnit}>s</Text>
          </View>
          <Text style={styles.heroLabel}>promedio por código</Text>
          {isNewRecord && (
            <View style={styles.recordBadge}>
              <Text style={styles.recordBadgeText}>🏆 ¡NUEVO RÉCORD PERSONAL!</Text>
            </View>
          )}
        </View>

        <SaveBanner />

        <View style={styles.precisionCard}>
          <Text style={styles.precisionLabel}>Precisión</Text>
          <View style={styles.precisionTrack}>
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
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]}
            onPress={() => navigation.replace("Quiz", { mode, direction })}>
            <Text style={styles.buttonTextWhite}>🔄 Intentar de nuevo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonRanking]}
            onPress={() => navigation.navigate("Leaderboard", { initialTab: mode === "speed" ? "speed" : "streak", initialDirection: direction })}>
            <Text style={styles.buttonTextGold}>🏆 Ver Ranking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonGhost]}
            onPress={() => navigation.navigate("Home")}>
            <Text style={styles.buttonTextGhost}>🏠 Inicio</Text>
          </TouchableOpacity>
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
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingTop: 16, gap: 14 },

    heroCard: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      borderWidth: 2,
      borderColor: C.yellow,
    },
    heroEmoji: { fontSize: 48, marginBottom: 4 },
    heroNumber: { fontSize: 72, fontWeight: "bold", color: C.yellow, lineHeight: 80 },
    heroLabel: { color: C.textDim, fontSize: 14, marginTop: 4 },
    speedRow: { flexDirection: "row", alignItems: "flex-end" },
    speedUnit: { fontSize: 32, fontWeight: "bold", color: C.yellow, marginBottom: 8, marginLeft: 4 },
    recordBadge: {
      marginTop: 14,
      backgroundColor: C.yellow,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    recordBadgeText: { color: C.black, fontWeight: "bold", fontSize: 13 },

    saveBanner: {
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      alignItems: "center",
    },
    saveBannerPending: { backgroundColor: C.cardRaised },
    saveBannerOk: { backgroundColor: C.correctBg, borderWidth: 1, borderColor: C.correctBorder },
    saveBannerWarn: { backgroundColor: "rgba(255,193,7,0.12)", borderWidth: 1, borderColor: C.yellow },
    saveBannerError: { backgroundColor: C.wrongBg, borderWidth: 1, borderColor: C.wrongBorder },
    saveBannerText: { color: C.text, fontSize: 13, fontWeight: "600" },

    missedCard: {
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1.5,
      borderColor: C.wrongBorder,
    },
    missedLabel: { color: C.textHint, fontSize: 12, marginBottom: 10 },
    missedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    codeBadge: {
      backgroundColor: C.wrongBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      minWidth: 68,
      alignItems: "center",
    },
    codeText: { color: C.wrongBorder, fontWeight: "bold", fontSize: 14 },
    missedDesc: { flex: 1, color: C.text, fontSize: 14, lineHeight: 20 },

    precisionCard: {
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    precisionLabel: { color: C.textHint, fontSize: 12 },
    precisionTrack: { height: 10, backgroundColor: C.cardRaised, borderRadius: 5, overflow: "hidden" },
    precisionFill: { height: "100%", borderRadius: 5 },
    precisionPct: { fontSize: 15, fontWeight: "bold" },

    actions: { gap: 10 },
    button: { padding: 16, borderRadius: 13, alignItems: "center" },
    buttonPrimary: { backgroundColor: C.red },
    buttonRanking: { backgroundColor: "#1a1a2e", borderWidth: 1.5, borderColor: "#FFD700" },
    buttonGhost: { backgroundColor: "transparent" },
    buttonTextWhite: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    buttonTextGold: { color: "#FFD700", fontSize: 16, fontWeight: "bold" },
    buttonTextGhost: { color: C.textHint, fontSize: 16, fontWeight: "bold" },
  });
}
