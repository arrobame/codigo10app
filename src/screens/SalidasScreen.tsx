import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { salidas } from "../data/salidas";

const CATEGORY_COLORS: Record<string, string> = {
  Accidente: "#CC0000",
  Rescate:   "#1565C0",
  Incendio:  "#E65100",
};

export default function SalidasScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C, isDark), [C, isDark]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Aprendé cómo se estructuran las transmisiones radiales reales durante una salida a servicio.
        Toca cualquier código en la transmisión para ver su significado.
      </Text>

      {salidas.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={styles.card}
          onPress={() => navigation.navigate("SalidaDetail", { salidaId: s.id })}
          activeOpacity={0.85}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardEmoji}>{s.emoji}</Text>
            <View style={styles.cardMeta}>
              <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[s.category] ?? "#555" }]}>
                <Text style={styles.categoryText}>{s.category.toUpperCase()}</Text>
              </View>
              <Text style={styles.cardTitle}>{s.title}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>{s.description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardSteps}>{s.steps.length} transmisiones</Text>
            <Text style={styles.cardArrow}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors, _isDark: boolean) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 16, gap: 12, paddingBottom: 32 },
    intro: {
      color: C.textDim,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 4,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1.5,
      borderColor: C.border,
      gap: 10,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    cardEmoji: { fontSize: 32, marginTop: 2 },
    cardMeta: { flex: 1, gap: 5 },
    categoryBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    categoryText: { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
    cardTitle: { color: C.text, fontSize: 15, fontWeight: "700" },
    cardDesc: { color: C.textDim, fontSize: 13, lineHeight: 18 },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardSteps: { color: C.textHint, fontSize: 11 },
    cardArrow: { color: C.textHint, fontSize: 20 },
  });
}
