import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useHomeBack } from "../hooks/useHomeBack";
import * as Haptics from "expo-haptics";
import { Sounds } from "../utils/sounds";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { addError } from "../utils/storage";
import { NavigationProp, RootStackParamList, QuizMode } from "../types";
import { codigos, Codigo } from "../data/codigos";

// ─── Constants ───────────────────────────────────────────────────────────────
const TOTAL_QUESTIONS = 10;
const OPTIONS_COUNT = 4;
const MAX_TIME = 15;
const BASE_POINTS = 100;

// Variable reward pool (Efecto Skinner): 3x aparece solo el 3% del tiempo
const MULTIPLIER_POOL = [1, 1, 1, 1, 1, 1, 1, 1.5, 1.5, 1.5, 2, 2, 3];

interface GeneratedQuestion {
  correct: Codigo;
  options: Codigo[];
  multiplier: number;
  isSpecial: boolean; // 2x o 3x — mostrado como "Pregunta Especial"
}

type FeedbackPhase = "correct" | "wrong" | "near_miss" | "timeout";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Efecto "Casi Acierto": dos códigos son near-miss si difieren en ≤2 en el número
function isNearMiss(a: string, b: string): boolean {
  const an = parseInt(a.split("-")[1]);
  const bn = parseInt(b.split("-")[1]);
  return Math.abs(an - bn) <= 2;
}

// Zona del flujo: distractores incluyen códigos adyacentes para crear tensión
function buildDistractors(
  correct: Codigo,
  weights: Record<string, number>
): Codigo[] {
  const idx = codigos.findIndex((c) => c.codigo === correct.codigo);

  // Códigos adyacentes (near-miss provocado)
  const adjacent: Codigo[] = [];
  for (let i = 1; i <= 8 && adjacent.length < 4; i++) {
    if (idx - i >= 0) adjacent.push(codigos[idx - i]);
    if (idx + i < codigos.length) adjacent.push(codigos[idx + i]);
  }

  // Otros, priorizando los que el jugador falló más (adaptive difficulty)
  const others = codigos.filter(
    (c) =>
      c.codigo !== correct.codigo &&
      !adjacent.find((a) => a.codigo === c.codigo)
  );
  const weightedOthers = [...others].sort(
    (a, b) => (weights[b.codigo] || 1) - (weights[a.codigo] || 1)
  );

  // Mix: ~60% adyacentes, ~40% difíciles del historial
  const nearMissCount = Math.min(2, adjacent.length);
  const hardCount = OPTIONS_COUNT - 1 - nearMissCount;

  return shuffle([
    ...shuffle(adjacent).slice(0, nearMissCount),
    ...weightedOthers.slice(0, hardCount),
  ]).slice(0, OPTIONS_COUNT - 1);
}

// Selección adaptativa (Zona del flujo): más peso a códigos fallados
function generateQuestion(
  mode: QuizMode,
  weights: Record<string, number>
): GeneratedQuestion {
  const totalW = codigos.reduce((sum, c) => sum + (weights[c.codigo] || 1), 0);
  let rand = Math.random() * totalW;
  let correct = codigos[0];
  for (const c of codigos) {
    rand -= weights[c.codigo] || 1;
    if (rand <= 0) {
      correct = c;
      break;
    }
  }

  const distractors = buildDistractors(correct, weights);
  const multiplier =
    MULTIPLIER_POOL[Math.floor(Math.random() * MULTIPLIER_POOL.length)];

  return {
    correct,
    options: shuffle([correct, ...distractors]),
    multiplier,
    isSpecial: multiplier >= 2,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function QuizScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "Quiz">>();
  const { mode } = route.params;

  // Refs (para closures en timers y callbacks)
  const pointsRef = useRef(0);
  const streakRef = useRef(0);
  const maxStreakRef = useRef(0);
  const correctCountRef = useRef(0);
  const weightsRef = useRef<Record<string, number>>({});
  const isAnsweredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Theme
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  useHomeBack();

  // State
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<GeneratedQuestion>(() =>
    generateQuestion(mode, {})
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [feedbackPhase, setFeedbackPhase] = useState<FeedbackPhase | null>(null);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [pointsDelta, setPointsDelta] = useState<{
    value: number;
    isBonus: boolean;
  } | null>(null);

  // Animations
  const timerWidthAnim = useRef(new Animated.Value(1)).current;
  const timerColorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pointsOpacityAnim = useRef(new Animated.Value(0)).current;
  const pointsTranslateAnim = useRef(new Animated.Value(0)).current;
  const streakScaleAnim = useRef(new Animated.Value(1)).current;
  const specialPulseAnim = useRef(new Animated.Value(1)).current;

  // Pulso continuo en preguntas especiales
  useEffect(() => {
    if (!question.isSpecial || selected !== null) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(specialPulseAnim, {
          toValue: 1.04,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(specialPulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [question, selected]);

  // Timer al cambiar de pregunta
  useEffect(() => {
    isAnsweredRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    timerWidthAnim.setValue(1);
    timerColorAnim.setValue(0);

    Animated.timing(timerWidthAnim, {
      toValue: 0,
      duration: MAX_TIME * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    Animated.timing(timerColorAnim, {
      toValue: 1,
      duration: MAX_TIME * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    let t = MAX_TIME;
    timerRef.current = setInterval(() => {
      t--;
      if (t <= 5 && t > 0) Sounds.tick();
      if (t <= 0) {
        clearInterval(timerRef.current!);
        handleTimeout();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questionIndex]);

  const timerColor = timerColorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#27ae60", "#f39c12", "#e74c3c"],
  });

  const timerWidth = timerWidthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ─── Timeout ───────────────────────────────────────────────────────────────
  function handleTimeout() {
    if (isAnsweredRef.current) return;
    isAnsweredRef.current = true;

    setSelected("__timeout__");
    setFeedbackPhase("timeout");
    streakRef.current = 0;
    setStreak(0);

    weightsRef.current = {
      ...weightsRef.current,
      [question.correct.codigo]: Math.min(
        (weightsRef.current[question.correct.codigo] || 1) * 1.5,
        3
      ),
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {}
    );
    Sounds.timeout();
    addError(question.correct.codigo);
    triggerShake();
    setTimeout(advanceToNext, 2200);
  }

  // ─── Answer handler ────────────────────────────────────────────────────────
  function handleAnswer(option: Codigo) {
    if (isAnsweredRef.current) return;
    isAnsweredRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    timerWidthAnim.stopAnimation();
    timerColorAnim.stopAnimation();

    const isCorrect = option.codigo === question.correct.codigo;
    const nm =
      !isCorrect && isNearMiss(option.codigo, question.correct.codigo);
    const phase: FeedbackPhase = isCorrect
      ? "correct"
      : nm
      ? "near_miss"
      : "wrong";

    setSelected(option.codigo);
    setFeedbackPhase(phase);

    if (isCorrect) {
      // Racha
      const newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      setStreak(newStreak);
      if (newStreak > maxStreakRef.current) {
        maxStreakRef.current = newStreak;
      }
      correctCountRef.current++;

      // Puntos: base + bonus racha × multiplicador (Efecto Skinner)
      const streakBonus =
        newStreak >= 5 ? 200 : newStreak >= 3 ? 100 : newStreak >= 2 ? 50 : 0;
      const earned = Math.floor(
        (BASE_POINTS + streakBonus) * question.multiplier
      );
      pointsRef.current += earned;
      setPoints(pointsRef.current);
      setPointsDelta({ value: earned, isBonus: question.isSpecial });

      // Reducir peso (ya lo sabe)
      weightsRef.current = {
        ...weightsRef.current,
        [option.codigo]: Math.max(
          (weightsRef.current[option.codigo] || 1) * 0.6,
          0.3
        ),
      };

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
      if (question.isSpecial) Sounds.bonus(question.multiplier);
      else if (newStreak >= 2) Sounds.streak(newStreak);
      else Sounds.correct();

      // Animación racha
      streakScaleAnim.setValue(1.5);
      Animated.spring(streakScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // Popup de puntos flota hacia arriba
      pointsOpacityAnim.setValue(0);
      pointsTranslateAnim.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pointsOpacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pointsTranslateAnim, {
            toValue: -50,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(pointsOpacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(advanceToNext, question.isSpecial ? 2000 : 1600);
    } else {
      // LDW: near-miss consigue 10 pts de consolación ("casi ganaste")
      if (nm) {
        const consolation = 10;
        pointsRef.current += consolation;
        setPoints(pointsRef.current);
        setPointsDelta({ value: consolation, isBonus: false });

        pointsOpacityAnim.setValue(0);
        pointsTranslateAnim.setValue(0);
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pointsOpacityAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(pointsTranslateAnim, {
              toValue: -40,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(pointsOpacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setPointsDelta(null);
      }

      // Reset racha
      streakRef.current = 0;
      setStreak(0);

      // Aumentar peso (hay que repasar este código)
      weightsRef.current = {
        ...weightsRef.current,
        [question.correct.codigo]: Math.min(
          (weightsRef.current[question.correct.codigo] || 1) * 1.5,
          3
        ),
      };

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {}
      );
      if (nm) Sounds.nearMiss();
      else Sounds.wrong();
      addError(question.correct.codigo);
      triggerShake();
      setTimeout(advanceToNext, nm ? 2500 : 1800);
    }
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

  function advanceToNext() {
    if (questionIndex + 1 >= TOTAL_QUESTIONS) {
      navigation.replace("Result", {
        score: correctCountRef.current,
        total: TOTAL_QUESTIONS,
        mode,
        points: pointsRef.current,
        maxStreak: maxStreakRef.current,
      });
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      const nextQ = generateQuestion(mode, weightsRef.current);
      setQuestion(nextQ);
      setSelected(null);
      setFeedbackPhase(null);
      setPointsDelta(null);
      setQuestionIndex((i) => i + 1);
      fadeAnim.setValue(1);
    });
  }

  // ─── Feedback helpers ──────────────────────────────────────────────────────
  function getFeedbackMessage(): string {
    if (feedbackPhase === "correct") {
      if (question.multiplier === 3) return "🎊 ¡MULTIPLICADOR x3!";
      if (question.multiplier === 2) return "🎊 ¡MULTIPLICADOR x2!";
      if (streak >= 5) return `🔥 ¡RACHA BRUTAL x${streak}!`;
      if (streak >= 3) return `⚡ ¡En racha! x${streak}`;
      return "✓ ¡Correcto!";
    }
    if (feedbackPhase === "near_miss")
      return "🟡 ¡Casi! Faltó muy poco... (+10 pts)";
    if (feedbackPhase === "timeout") return "⏱ ¡Se acabó el tiempo!";
    return "✗ Incorrecto";
  }

  function getOptionStyle(option: Codigo) {
    if (!selected) return styles.option;
    if (option.codigo === question.correct.codigo)
      return [styles.option, styles.optionCorrect];
    if (option.codigo === selected && selected !== "__timeout__") {
      return isNearMiss(option.codigo, question.correct.codigo)
        ? [styles.option, styles.optionNearMiss]
        : [styles.option, styles.optionWrong];
    }
    return [styles.option, styles.optionDimmed];
  }

  function getOptionTextStyle(option: Codigo) {
    if (!selected) return styles.optionText;
    if (
      option.codigo === question.correct.codigo ||
      option.codigo === selected
    )
      return [styles.optionText, styles.optionTextSelected];
    return [styles.optionText, styles.optionTextFaded];
  }

  const progressPct = ((questionIndex) / TOTAL_QUESTIONS) * 100;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Barra de progreso de preguntas */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      {/* Timer */}
      <View style={styles.timerTrack}>
        <Animated.View
          style={[
            styles.timerFill,
            { width: timerWidth, backgroundColor: timerColor },
          ]}
        />
      </View>

      {/* Meta row */}
      <View style={styles.meta}>
        <Text style={styles.metaQuestion}>
          {questionIndex + 1} / {TOTAL_QUESTIONS}
        </Text>

        <Animated.View
          style={[
            styles.streakBadge,
            streak > 0 && styles.streakBadgeActive,
            { transform: [{ scale: streakScaleAnim }] },
          ]}
        >
          <Text style={[styles.streakText, streak > 0 && styles.streakTextActive]}>
            🔥 {streak}
          </Text>
        </Animated.View>

        <Text style={styles.pointsLabel}>⭐ {points}</Text>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        {/* Tarjeta de pregunta */}
        <Animated.View
          style={[
            styles.questionCard,
            question.isSpecial && styles.questionCardSpecial,
            question.isSpecial && { transform: [{ scale: specialPulseAnim }] },
          ]}
        >
          {question.isSpecial && (
            <View style={styles.specialBadge}>
              <Text style={styles.specialBadgeText}>
                ⚡ PREGUNTA ESPECIAL x{question.multiplier}
              </Text>
            </View>
          )}

          <Text style={styles.modeLabel}>
            {mode === "codigo_a_descripcion"
              ? "¿Qué significa este código?"
              : "¿Qué código corresponde?"}
          </Text>

          <Text style={styles.questionText}>
            {mode === "codigo_a_descripcion"
              ? question.correct.codigo
              : question.correct.descripcion}
          </Text>
        </Animated.View>

        {/* Banner de feedback */}
        {feedbackPhase && (
          <View
            style={[
              styles.feedbackBanner,
              feedbackPhase === "correct"
                ? question.isSpecial
                  ? styles.feedbackBonus
                  : styles.feedbackCorrect
                : feedbackPhase === "near_miss"
                ? styles.feedbackNearMiss
                : styles.feedbackWrong,
            ]}
          >
            <Text style={styles.feedbackTitle}>{getFeedbackMessage()}</Text>
            {feedbackPhase !== "correct" && (
              <Text style={styles.feedbackAnswer}>
                {mode === "codigo_a_descripcion"
                  ? `${question.correct.codigo} = ${question.correct.descripcion}`
                  : `"${question.correct.descripcion}" = ${question.correct.codigo}`}
              </Text>
            )}
          </View>
        )}

        {/* Opciones */}
        <View style={styles.options}>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option.codigo}
              style={getOptionStyle(option)}
              onPress={() => handleAnswer(option)}
              activeOpacity={0.75}
              disabled={selected !== null}
            >
              <Text style={getOptionTextStyle(option)}>
                {mode === "codigo_a_descripcion"
                  ? option.descripcion
                  : option.codigo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Popup de puntos (flotante, no bloquea toques) */}
      <View
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        {pointsDelta !== null && (
          <Animated.View
            style={[
              styles.pointsPopup,
              {
                opacity: pointsOpacityAnim,
                transform: [{ translateY: pointsTranslateAnim }],
              },
            ]}
          >
            <Text
              style={[
                styles.pointsPopupText,
                {
                  color: pointsDelta.isBonus
                    ? "#f39c12"
                    : feedbackPhase === "near_miss"
                    ? "#e67e22"
                    : "#27ae60",
                },
              ]}
            >
              +{pointsDelta.value} pts{pointsDelta.isBonus ? " 🎊" : ""}
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg, padding: 16 },
    progressTrack: { height: 4, backgroundColor: C.cardRaised, borderRadius: 2, marginBottom: 6, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: C.yellow, borderRadius: 2 },
    timerTrack: { height: 6, backgroundColor: C.cardRaised, borderRadius: 3, marginBottom: 14, overflow: "hidden" },
    timerFill: { height: "100%", borderRadius: 3 },
    meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    metaQuestion: { color: C.textDim, fontSize: 14 },
    streakBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: C.cardRaised },
    streakBadgeActive: { backgroundColor: "rgba(255,193,7,0.15)", borderWidth: 1, borderColor: "rgba(255,193,7,0.4)" },
    streakText: { fontSize: 14, fontWeight: "bold", color: C.textHint },
    streakTextActive: { color: C.yellow },
    pointsLabel: { fontSize: 14, fontWeight: "bold", color: C.yellow },
    content: { flex: 1 },
    questionCard: {
      backgroundColor: C.yellow,
      borderRadius: 18,
      padding: 24,
      alignItems: "center",
      marginBottom: 14,
      shadowColor: C.yellow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 8,
    },
    questionCardSpecial: { backgroundColor: C.yellowDark, borderWidth: 2.5, borderColor: "#FFFFFF" },
    specialBadge: { backgroundColor: C.red, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
    specialBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold", letterSpacing: 0.5 },
    modeLabel: { color: "rgba(0,0,0,0.55)", fontSize: 12, marginBottom: 10 },
    questionText: { color: C.black, fontSize: 26, fontWeight: "bold", textAlign: "center", lineHeight: 34 },
    feedbackBanner: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14, alignItems: "center" },
    feedbackCorrect: { backgroundColor: C.correctBg, borderWidth: 1.5, borderColor: C.correctBorder },
    feedbackBonus: { backgroundColor: "rgba(255,193,7,0.15)", borderWidth: 1.5, borderColor: C.yellow },
    feedbackNearMiss: { backgroundColor: C.nearMissBg, borderWidth: 1.5, borderColor: C.nearMissBorder },
    feedbackWrong: { backgroundColor: C.wrongBg, borderWidth: 1.5, borderColor: C.wrongBorder },
    feedbackTitle: { fontWeight: "bold", fontSize: 15, color: C.text, textAlign: "center" },
    feedbackAnswer: { color: C.textDim, fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 18 },
    options: { gap: 10 },
    option: { backgroundColor: C.card, borderRadius: 13, padding: 14, borderWidth: 2, borderColor: C.border },
    optionCorrect: { backgroundColor: C.correctBg, borderColor: C.correctBorder },
    optionWrong: { backgroundColor: C.wrongBg, borderColor: C.wrongBorder },
    optionNearMiss: { backgroundColor: C.nearMissBg, borderColor: C.nearMissBorder },
    optionDimmed: { borderColor: C.border },
    optionText: { fontSize: 14, color: C.text, textAlign: "center", lineHeight: 20 },
    optionTextSelected: { fontWeight: "bold" },
    optionTextFaded: { color: C.textHint },
    pointsPopup: { position: "absolute", top: 200, left: 0, right: 0, alignItems: "center" },
    pointsPopupText: {
      fontSize: 30,
      fontWeight: "bold",
      textShadowColor: "rgba(0,0,0,0.4)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 4,
    },
  });
}
