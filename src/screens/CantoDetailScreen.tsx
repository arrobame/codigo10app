import { useMemo, useLayoutEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Icon from "../components/Icon";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { cantos } from "../data/cantos";
import { NavigationProp } from "../types";

export default function CantoDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp>();
  const { cantoId } = route.params as { cantoId: string };
  const canto = cantos.find((c) => c.id === cantoId)!;
  const { C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C, isDark), [C, isDark]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: canto.title });
  }, [navigation, canto.title]);

  return (
    <View style={styles.container}>
      {/* Descripción */}
      <View style={styles.descBanner}>
        <Text style={styles.descText}>{canto.description}</Text>
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.yellow }]} />
          <Text style={styles.legendText}>El guía canta</Text>
        </View>
        <Icon name="arrow-forward" size={14} color={C.textHint} />
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.textHint }]} />
          <Text style={styles.legendText}>La tropa repite</Text>
        </View>
      </View>

      {/* Canto */}
      <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
        {canto.lines.map((line, i) => {
          const isGuia = line.voice === "guia";
          return (
            <View key={i} style={[styles.lineWrap, isGuia ? styles.leftWrap : styles.rightWrap]}>
              <View style={[styles.bubble, isGuia ? styles.guiaBubble : styles.tropaBubble]}>
                <View style={styles.labelRow}>
                  <Icon
                    name={isGuia ? "campaign" : "groups"}
                    size={13}
                    color={isGuia ? C.yellow : C.textDim}
                  />
                  <Text style={[styles.label, { color: isGuia ? C.yellow : C.textDim }]}>
                    {isGuia ? "GUÍA" : "TODOS REPITEN"}
                  </Text>
                </View>
                <Text style={[styles.lineText, { color: C.text }]}>{line.text}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.doneRow}>
          <Icon name="check-circle" size={16} color={C.correctBorder} />
          <Text style={styles.doneText}>Fin del canto</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(C: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    descBanner: {
      backgroundColor: C.cardRaised,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    descText: { color: C.textDim, fontSize: 13, lineHeight: 18 },

    legend: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 9, height: 9, borderRadius: 5 },
    legendText: { color: C.textDim, fontSize: 12 },

    chat: { flex: 1 },
    chatContent: { padding: 16, gap: 10, paddingBottom: 24 },

    lineWrap: { maxWidth: "85%" },
    leftWrap: { alignSelf: "flex-start" },
    rightWrap: { alignSelf: "flex-end" },

    bubble: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
    guiaBubble: {
      backgroundColor: isDark ? C.yellow + "1A" : C.yellow + "12",
      borderWidth: 1,
      borderColor: C.yellow + "55",
    },
    tropaBubble: {
      backgroundColor: C.cardRaised,
      borderWidth: 1,
      borderColor: C.border,
    },

    labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    label: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
    lineText: { fontSize: 16, lineHeight: 22, fontWeight: "500" },

    doneRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 16 },
    doneText: { color: C.correctBorder, fontWeight: "700", fontSize: 13 },
  });
}
