import { useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useHomeBack } from "../hooks/useHomeBack";
import { NavigationProp, RootStackParamList } from "../types";
import { Sounds } from "../utils/sounds";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { saveScore } from "../utils/scores";

interface Rating {
  emoji: string;
  label: string;
  color: string;
  message: string;
}

function getRating(score: number, total: number): Rating {
  const pct = score / total;
  if (pct === 1)   return { emoji: "🏆", label: "¡Perfecto!", color: "#FFC107", message: "Dominaste todos los códigos. ¡Sos un bombero élite!" };
  if (pct >= 0.8)  return { emoji: "⭐", label: "¡Excelente!", color: "#69F0AE", message: "Casi perfecto. Solo un poco más de práctica." };
  if (pct >= 0.6)  return { emoji: "👍", label: "¡Bien hecho!", color: "#40C4FF", message: "Buen avance. Repasá los que fallaste." };
  if (pct >= 0.4)  return { emoji: "📻", label: "Sigue practicando", color: "#FFD54F", message: "Usá el modo Estudiar antes del próximo intento." };
  return           { emoji: "💪", label: "¡A estudiar!", color: "#CC0000", message: "Cada intento te acerca a dominar el Código 10." };
}

export default function ResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "Result">>();
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { score, total, mode, points, maxStreak } = route.params;
  const { user } = useAuth();

  useEffect(() => {
    Sounds.results(score, total);
    // Guardar en Firestore si el usuario está logueado
    if (user) {
      saveScore({
        uid: user.uid,
        username: user.username,
        errors: total - score,
        correct: score,
        total,
        points,
      }).catch(console.error);
    }
  }, []);
  useHomeBack();

  const rating = getRating(score, total);
  const pct = Math.round((score / total) * 100);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { borderColor: rating.color }]}>
        <Text style={styles.ratingEmoji}>{rating.emoji}</Text>
        <Text style={[styles.ratingLabel, { color: rating.color }]}>{rating.label}</Text>
        <Text style={styles.ratingMessage}>{rating.message}</Text>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{score}/{total}</Text>
            <Text style={styles.statLabel}>Correctas</Text>
          </View>
          <View style={[styles.stat, styles.statHighlight]}>
            <Text style={styles.statValueHighlight}>{points}</Text>
            <Text style={styles.statLabelHighlight}>Puntos ⭐</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>🔥 {maxStreak}</Text>
            <Text style={styles.statLabel}>Racha máx.</Text>
          </View>
        </View>

        <View style={styles.accuracyContainer}>
          <View style={styles.accuracyTrack}>
            <View style={[styles.accuracyFill, { width: `${pct}%` as any, backgroundColor: rating.color }]} />
          </View>
          <Text style={[styles.accuracyLabel, { color: rating.color }]}>{pct}% de precisión</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={() => navigation.replace("Quiz", { mode })}>
          <Text style={styles.buttonTextWhite}>🔄 Intentar de nuevo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.replace("Quiz", { mode: mode === "codigo_a_descripcion" ? "descripcion_a_codigo" : "codigo_a_descripcion" })}
        >
          <Text style={styles.buttonTextOnCard}>🔀 Cambiar modo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => navigation.navigate("Study")}>
          <Text style={styles.buttonTextYellow}>📖 Estudiar códigos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonGhost]} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.buttonTextGhost}>🏠 Inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 24, paddingTop: 20 },
    card: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 28,
      borderWidth: 2.5,
      marginBottom: 24,
      alignItems: "center",
    },
    ratingEmoji: { fontSize: 64, marginBottom: 8 },
    ratingLabel: { fontSize: 24, fontWeight: "bold", marginBottom: 6 },
    ratingMessage: { fontSize: 14, color: C.textDim, textAlign: "center", lineHeight: 20 },
    divider: { height: 1, backgroundColor: C.border, width: "100%", marginVertical: 20 },
    statsRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 20, gap: 8 },
    stat: { flex: 1, alignItems: "center", backgroundColor: C.cardRaised, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 4 },
    statHighlight: { backgroundColor: C.yellow },
    statValue: { fontSize: 20, fontWeight: "bold", color: C.text },
    statValueHighlight: { fontSize: 22, fontWeight: "bold", color: C.black },
    statLabel: { fontSize: 11, color: C.textDim, marginTop: 2 },
    statLabelHighlight: { fontSize: 11, color: C.black, marginTop: 2 },
    accuracyContainer: { width: "100%", alignItems: "center", gap: 6 },
    accuracyTrack: { width: "100%", height: 10, backgroundColor: C.cardRaised, borderRadius: 5, overflow: "hidden" },
    accuracyFill: { height: "100%", borderRadius: 5 },
    accuracyLabel: { fontSize: 13, fontWeight: "bold" },
    actions: { gap: 12 },
    button: { padding: 16, borderRadius: 13, alignItems: "center" },
    buttonPrimary: { backgroundColor: C.red },
    buttonSecondary: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.red },
    buttonOutline: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.yellow },
    buttonGhost: { backgroundColor: "transparent" },
    buttonTextWhite: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
    buttonTextOnCard: { color: C.text, fontSize: 16, fontWeight: "bold" },
    buttonTextYellow: { color: C.yellow, fontSize: 16, fontWeight: "bold" },
    buttonTextGhost: { color: C.textHint, fontSize: 16, fontWeight: "bold" },
  });
}
