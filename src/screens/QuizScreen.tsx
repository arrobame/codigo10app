import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useHomeBack } from "../hooks/useHomeBack";
import * as Haptics from "expo-haptics";
import { Sounds } from "../utils/sounds";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { addError } from "../utils/storage";
import { NavigationProp, RootStackParamList, QuizMode, QuizDirection } from "../types";
import { codigos, Codigo } from "../data/codigos";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { PlayerRecord } from "../utils/scores";

const SPEED_TOTAL = 10;
const MAX_TIME = 15;
const OPTIONS_COUNT = 4;

const FIREFIGHTER_EMOJIS = ["🪓", "🔥", "💧", "🪢", "🚒", "🪣", "⛑️", "🧯", "🚨", "💨"];

interface GeneratedQuestion {
  correct: Codigo;
  options: Codigo[];
}

type FeedbackPhase = "correct" | "wrong" | "near_miss" | "timeout";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isNearMiss(a: string, b: string): boolean {
  const an = parseInt(a.split("-")[1]);
  const bn = parseInt(b.split("-")[1]);
  return Math.abs(an - bn) <= 2;
}

function buildDistractors(correct: Codigo, weights: Record<string, number>): Codigo[] {
  const idx = codigos.findIndex((c) => c.codigo === correct.codigo);
  const adjacent: Codigo[] = [];
  for (let i = 1; i <= 8 && adjacent.length < 4; i++) {
    if (idx - i >= 0) adjacent.push(codigos[idx - i]);
    if (idx + i < codigos.length) adjacent.push(codigos[idx + i]);
  }
  const others = codigos.filter(
    (c) => c.codigo !== correct.codigo && !adjacent.find((a) => a.codigo === c.codigo)
  );
  const weightedOthers = [...others].sort(
    (a, b) => (weights[b.codigo] || 1) - (weights[a.codigo] || 1)
  );
  const nearMissCount = Math.min(2, adjacent.length);
  const hardCount = OPTIONS_COUNT - 1 - nearMissCount;
  return shuffle([
    ...shuffle(adjacent).slice(0, nearMissCount),
    ...weightedOthers.slice(0, hardCount),
  ]).slice(0, OPTIONS_COUNT - 1);
}

function generateStreakQuestion(weights: Record<string, number>): GeneratedQuestion {
  const totalW = codigos.reduce((sum, c) => sum + (weights[c.codigo] || 1), 0);
  let rand = Math.random() * totalW;
  let correct = codigos[0];
  for (const c of codigos) {
    rand -= weights[c.codigo] || 1;
    if (rand <= 0) { correct = c; break; }
  }
  return { correct, options: shuffle([correct, ...buildDistractors(correct, weights)]) };
}

function generateSpeedQuestion(usedCodes: Set<string>): GeneratedQuestion {
  const available = codigos.filter((c) => !usedCodes.has(c.codigo));
  const pool = available.length > 0 ? available : [...codigos];
  const correct = pool[Math.floor(Math.random() * pool.length)];
  usedCodes.add(correct.codigo);
  return { correct, options: shuffle([correct, ...buildDistractors(correct, {})]) };
}

export default function QuizScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "Quiz">>();
  const { mode, direction } = route.params;
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuth();
  useHomeBack();

  // Load personal best in background for new-record detection
  const personalBestRef = useRef<PlayerRecord | null>(null);
  useEffect(() => {
    if (user) {
      getDoc(doc(db, "records", user.uid))
        .then((snap) => { if (snap.exists()) personalBestRef.current = snap.data() as PlayerRecord; })
        .catch(() => {});
    }
  }, []);

  // Streak mode refs
  const streakRef = useRef(0);
  const weightsRef = useRef<Record<string, number>>({});

  // Speed mode refs
  const usedCodesRef = useRef(new Set<string>());
  const answerTimesRef = useRef<number[]>([]);
  const correctCountRef = useRef(0);

  // Shared refs
  const isAnsweredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef(Date.now());

  // State
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<GeneratedQuestion>(() =>
    mode === "speed"
      ? generateSpeedQuestion(usedCodesRef.current)
      : generateStreakQuestion({})
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [feedbackPhase, setFeedbackPhase] = useState<FeedbackPhase | null>(null);
  const [streak, setStreak] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(MAX_TIME);

  // Animations
  const timerWidthAnim = useRef(new Animated.Value(1)).current;
  const timerColorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const heroScaleAnim = useRef(new Animated.Value(1)).current;

  // Emoji volador en aciertos
  const [flyEmoji, setFlyEmoji] = useState<string | null>(null);
  const flyXRef = useRef(0);
  const flyYStartRef = useRef<number | null>(null);
  const flyOpacity = useRef(new Animated.Value(0)).current;
  const flyY = useRef(new Animated.Value(0)).current;
  const containerRef = useRef<any>(null);
  const containerOffset = useRef({ x: 0, y: 0 });

  // Timer per question
  useEffect(() => {
    isAnsweredRef.current = false;
    questionStartRef.current = Date.now();
    setTimerRemaining(MAX_TIME);
    if (timerRef.current) clearInterval(timerRef.current);

    timerWidthAnim.setValue(1);
    timerColorAnim.setValue(0);
    Animated.timing(timerWidthAnim, {
      toValue: 0, duration: MAX_TIME * 1000, easing: Easing.linear, useNativeDriver: false,
    }).start();
    Animated.timing(timerColorAnim, {
      toValue: 1, duration: MAX_TIME * 1000, easing: Easing.linear, useNativeDriver: false,
    }).start();

    // Speed mode: 100ms intervals for decimal display; streak: 1s intervals
    const intervalMs = mode === "speed" ? 100 : 1000;
    const startTime = Date.now();
    let lastTickSec = MAX_TIME;

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, MAX_TIME - elapsed);
      setTimerRemaining(remaining);

      // Tick sound only on whole-second crossings
      const currentSec = Math.ceil(remaining);
      if (currentSec !== lastTickSec) {
        lastTickSec = currentSec;
        if (currentSec <= 5 && currentSec > 0) Sounds.tick();
      }

      if (remaining <= 0) { clearInterval(timerRef.current!); handleTimeout(); }
    }, intervalMs);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [questionIndex]);

  const timerColor = timerColorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#27ae60", "#f39c12", "#e74c3c"],
  });
  const timerWidth = timerWidthAnim.interpolate({
    inputRange: [0, 1], outputRange: ["0%", "100%"],
  });

  function clockColor(): string {
    if (timerRemaining > 8) return "#27ae60";
    if (timerRemaining > 3) return "#f39c12";
    return "#e74c3c";
  }

  function triggerFlyEmoji(touchPageX?: number, touchPageY?: number) {
    const { width } = Dimensions.get("window");
    const gameWidth = Math.min(width, 480);
    if (touchPageX !== undefined) {
      flyXRef.current = Math.max(0, touchPageX - containerOffset.current.x - 27);
    } else {
      flyXRef.current = 30 + Math.random() * Math.max(gameWidth - 110, 60);
    }
    flyYStartRef.current = touchPageY !== undefined
      ? touchPageY - containerOffset.current.y - 27
      : null;
    const emoji = FIREFIGHTER_EMOJIS[Math.floor(Math.random() * FIREFIGHTER_EMOJIS.length)];
    setFlyEmoji(emoji);
    flyOpacity.setValue(1);
    flyY.setValue(0);
    Animated.parallel([
      Animated.timing(flyY, { toValue: -200, duration: 700, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(250),
        Animated.timing(flyOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start(() => setFlyEmoji(null));
  }

  // ─── Timeout ────────────────────────────────────────────────────────────────
  function handleTimeout() {
    if (isAnsweredRef.current) return;
    isAnsweredRef.current = true;
    setSelected("__timeout__");
    setFeedbackPhase("timeout");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    Sounds.timeout();
    addError(question.correct.codigo);
    triggerShake();
    if (mode === "streak") {
      setTimeout(() => finishStreak(question.correct), 900);
    } else {
      setTimeout(advanceToNext, 800);
    }
  }

  // ─── Answer ─────────────────────────────────────────────────────────────────
  function handleAnswer(option: Codigo, evt?: any) {
    if (isAnsweredRef.current) return;
    isAnsweredRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    timerWidthAnim.stopAnimation();
    timerColorAnim.stopAnimation();

    const timeTaken = Math.min((Date.now() - questionStartRef.current) / 1000, MAX_TIME);
    const isCorrect = option.codigo === question.correct.codigo;
    const nm = !isCorrect && isNearMiss(option.codigo, question.correct.codigo);
    const phase: FeedbackPhase = isCorrect ? "correct" : nm ? "near_miss" : "wrong";

    setSelected(option.codigo);
    setFeedbackPhase(phase);

    if (isCorrect) {
      if (mode === "speed") answerTimesRef.current.push(timeTaken);
      triggerFlyEmoji(evt?.nativeEvent?.pageX, evt?.nativeEvent?.pageY);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (mode === "streak") {
        const newStreak = streakRef.current + 1;
        streakRef.current = newStreak;
        setStreak(newStreak);
        heroScaleAnim.setValue(1.5);
        Animated.spring(heroScaleAnim, { toValue: 1, useNativeDriver: true }).start();
        weightsRef.current = {
          ...weightsRef.current,
          [option.codigo]: Math.max((weightsRef.current[option.codigo] || 1) * 0.6, 0.3),
        };
        if (newStreak >= 2) Sounds.streak(newStreak);
        else Sounds.correct();
      } else {
        correctCountRef.current++;
        Sounds.correct();
      }
      setTimeout(advanceToNext, 400);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (nm) Sounds.nearMiss();
      else Sounds.wrong();
      addError(question.correct.codigo);
      triggerShake();
      if (mode === "streak") {
        setTimeout(() => finishStreak(question.correct), nm ? 1100 : 900);
      } else {
        weightsRef.current = {
          ...weightsRef.current,
          [question.correct.codigo]: Math.min((weightsRef.current[question.correct.codigo] || 1) * 1.5, 3),
        };
        setTimeout(advanceToNext, nm ? 900 : 700);
      }
    }
  }

  // ─── End streak game ─────────────────────────────────────────────────────────
  function finishStreak(missedCode: Codigo) {
    const finalStreak = streakRef.current;
    const pb = personalBestRef.current;
    const streakKey = direction === "codigo_a_descripcion" ? "bestStreak_ctd" : "bestStreak_dtc";
    const isNewRecord = finalStreak > 0 && (!pb || finalStreak > ((pb[streakKey as keyof PlayerRecord] as number) ?? 0));
    navigation.replace("Result", {
      mode,
      direction,
      streak: finalStreak,
      avgSpeed: 0,
      score: finalStreak,
      total: finalStreak,
      missedCode: missedCode.codigo,
      missedDesc: missedCode.descripcion,
      isNewRecord,
    });
  }

  // ─── Advance / end speed game ────────────────────────────────────────────────
  function advanceToNext() {
    if (mode === "speed" && questionIndex + 1 >= SPEED_TOTAL) {
      const times = answerTimesRef.current;
      const avgSpeed =
        times.length > 0
          ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 100) / 100
          : MAX_TIME;
      const pb = personalBestRef.current;
      const speedKey = direction === "codigo_a_descripcion" ? "bestAvgSpeed_ctd" : "bestAvgSpeed_dtc";
      const pbSpeed = pb ? (pb[speedKey as keyof PlayerRecord] as number | null) : null;
      const isNewRecord = !pbSpeed || avgSpeed < pbSpeed;
      navigation.replace("Result", {
        mode,
        direction,
        streak: 0,
        avgSpeed,
        score: correctCountRef.current,
        total: SPEED_TOTAL,
        missedCode: null,
        missedDesc: null,
        isNewRecord,
      });
      return;
    }

    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      const nextQ =
        mode === "speed"
          ? generateSpeedQuestion(usedCodesRef.current)
          : generateStreakQuestion(weightsRef.current);
      setQuestion(nextQ);
      setSelected(null);
      setFeedbackPhase(null);
      setQuestionIndex((i) => i + 1);
      fadeAnim.setValue(1);
    });
  }

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function getFeedbackMessage(): string {
    if (feedbackPhase === "correct") {
      if (mode === "streak" && streak >= 10) return `🔥 ¡RACHA x${streak}!`;
      if (mode === "streak" && streak >= 5) return `⚡ ¡En racha! x${streak}`;
      return "✓ ¡Correcto!";
    }
    if (feedbackPhase === "near_miss") return "🟡 ¡Casi! Faltó muy poco...";
    if (feedbackPhase === "timeout") return "⏱ ¡Se acabó el tiempo!";
    return "✗ Incorrecto";
  }

  function getOptionStyle(option: Codigo) {
    if (!selected) return styles.option;
    if (option.codigo === question.correct.codigo) return [styles.option, styles.optionCorrect];
    if (option.codigo === selected && selected !== "__timeout__") {
      return isNearMiss(option.codigo, question.correct.codigo)
        ? [styles.option, styles.optionNearMiss]
        : [styles.option, styles.optionWrong];
    }
    return [styles.option, styles.optionDimmed];
  }

  function getOptionTextStyle(option: Codigo) {
    if (!selected) return styles.optionText;
    if (option.codigo === question.correct.codigo || option.codigo === selected)
      return [styles.optionText, styles.optionTextSelected];
    return [styles.optionText, styles.optionTextFaded];
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={() => {
        containerRef.current?.measure((_x: number, _y: number, _w: number, _h: number, px: number, py: number) => {
          containerOffset.current = { x: px, y: py };
        });
      }}
    >
      {/* Progress bar — speed only */}
      {mode === "speed" && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(questionIndex / SPEED_TOTAL) * 100}%` as any }]} />
        </View>
      )}

      {/* Timer bar */}
      <View style={styles.timerTrack}>
        <Animated.View style={[styles.timerFill, { width: timerWidth, backgroundColor: timerColor }]} />
      </View>

      {/* Hero metric */}
      {mode === "streak" ? (
        <View style={styles.heroArea}>
          <Animated.Text style={[styles.streakHero, { transform: [{ scale: heroScaleAnim }] }]}>
            🔥 {streak}
          </Animated.Text>
          <Text style={styles.heroLabel}>racha actual</Text>
        </View>
      ) : (
        <View style={styles.heroArea}>
          <Text style={[styles.clockHero, { color: clockColor() }]}>
            {timerRemaining.toFixed(2)}
          </Text>
          <Text style={styles.heroLabel}>{questionIndex + 1} / {SPEED_TOTAL}</Text>
        </View>
      )}

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }]}
      >
        {/* Question card */}
        <View style={[styles.questionCard, mode === "speed" && styles.questionCardSpeed]}>
          <Text style={styles.modeLabel}>
            {direction === "codigo_a_descripcion" ? "¿Qué significa este código?" : "¿Qué código corresponde?"}
          </Text>
          <Text style={[styles.questionText, direction === "descripcion_a_codigo" && styles.questionTextSmall]}>
            {direction === "codigo_a_descripcion" ? question.correct.codigo : question.correct.descripcion}
          </Text>
        </View>

        {/* Feedback banner */}
        {feedbackPhase && (
          <View style={[
            styles.feedbackBanner,
            feedbackPhase === "correct" ? styles.feedbackCorrect :
            feedbackPhase === "near_miss" ? styles.feedbackNearMiss :
            styles.feedbackWrong,
          ]}>
            <Text style={styles.feedbackTitle}>{getFeedbackMessage()}</Text>
            {feedbackPhase !== "correct" && (
              <Text style={styles.feedbackAnswer}>
                {direction === "codigo_a_descripcion"
                  ? `${question.correct.codigo} = ${question.correct.descripcion}`
                  : `"${question.correct.descripcion}" = ${question.correct.codigo}`}
              </Text>
            )}
          </View>
        )}

        {/* Options */}
        <View style={styles.options}>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option.codigo}
              style={getOptionStyle(option)}
              onPress={(evt) => handleAnswer(option, evt)}
              activeOpacity={0.75}
              disabled={selected !== null}
            >
              <Text style={getOptionTextStyle(option)}>
                {direction === "codigo_a_descripcion" ? option.descripcion : option.codigo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Emoji volador en acierto */}
      {flyEmoji && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Animated.Text style={{
            position: "absolute",
            left: flyXRef.current,
            top: flyYStartRef.current !== null ? flyYStartRef.current : "38%" as any,
            fontSize: 54,
            opacity: flyOpacity,
            transform: [{ translateY: flyY }],
          }}>
            {flyEmoji}
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg, padding: 16 },
    progressTrack: { height: 4, backgroundColor: C.cardRaised, borderRadius: 2, marginBottom: 6, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: C.yellow, borderRadius: 2 },
    timerTrack: { height: 6, backgroundColor: C.cardRaised, borderRadius: 3, marginBottom: 8, overflow: "hidden" },
    timerFill: { height: "100%", borderRadius: 3 },

    heroArea: { alignItems: "center", paddingVertical: 10, marginBottom: 8 },
    streakHero: { fontSize: 52, fontWeight: "bold", color: C.yellow, lineHeight: 60 },
    clockHero: { fontSize: 72, fontWeight: "bold", lineHeight: 80, fontVariant: ["tabular-nums"] as any },
    heroLabel: { color: C.textHint, fontSize: 12, marginTop: 2, letterSpacing: 0.5 },

    content: { flex: 1 },
    questionCard: {
      backgroundColor: C.yellow,
      borderRadius: 18,
      padding: 20,
      alignItems: "center",
      marginBottom: 12,
      shadowColor: C.yellow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    questionCardSpeed: {
      borderWidth: 2,
      borderColor: "rgba(255,215,0,0.5)",
    },
    modeLabel: { color: "rgba(0,0,0,0.5)", fontSize: 12, marginBottom: 8 },
    questionText: { color: C.black, fontSize: 30, fontWeight: "bold", textAlign: "center" },
    questionTextSmall: { fontSize: 18, lineHeight: 26 },

    feedbackBanner: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12, alignItems: "center" },
    feedbackCorrect: { backgroundColor: C.correctBg, borderWidth: 1.5, borderColor: C.correctBorder },
    feedbackNearMiss: { backgroundColor: C.nearMissBg, borderWidth: 1.5, borderColor: C.nearMissBorder },
    feedbackWrong: { backgroundColor: C.wrongBg, borderWidth: 1.5, borderColor: C.wrongBorder },
    feedbackTitle: { fontWeight: "bold", fontSize: 15, color: C.text, textAlign: "center" },
    feedbackAnswer: { color: C.textDim, fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 18 },

    options: { gap: 9 },
    option: { backgroundColor: C.card, borderRadius: 13, padding: 14, borderWidth: 2, borderColor: C.border },
    optionCorrect: { backgroundColor: C.correctBg, borderColor: C.correctBorder },
    optionWrong: { backgroundColor: C.wrongBg, borderColor: C.wrongBorder },
    optionNearMiss: { backgroundColor: C.nearMissBg, borderColor: C.nearMissBorder },
    optionDimmed: { borderColor: C.border },
    optionText: { fontSize: 14, color: C.text, textAlign: "center", lineHeight: 20 },
    optionTextSelected: { fontWeight: "bold" },
    optionTextFaded: { color: C.textHint },
  });
}
