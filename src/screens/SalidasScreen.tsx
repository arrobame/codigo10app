import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, Chip } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { salidas } from "../data/salidas";
import Icon, { MaterialIconName } from "../components/Icon";

const CATEGORY_ICONS: Record<string, MaterialIconName> = {
  Accidente: "car-crash",
  Rescate: "emergency",
  Incendio: "local-fire-department",
};

export default function SalidasScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Simulaciones de comunicaciones radiales reales usando el Código 10.
        Tocá cualquier código resaltado para ver su significado.
      </Text>

      {salidas.map((s) => (
        <Card
          key={s.id}
          onPress={() => navigation.navigate("SalidaDetail", { salidaId: s.id })}
          style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}
          elevation={0}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: C.yellow + "1A" }]}>
                <Icon name={CATEGORY_ICONS[s.category] ?? "campaign"} size={24} color={C.yellow} />
              </View>
              <View style={styles.cardMeta}>
                <Chip
                  compact
                  style={[styles.chip, { backgroundColor: C.cardRaised }]}
                  textStyle={[styles.chipText, { color: C.textDim }]}
                >
                  {s.category.toUpperCase()}
                </Chip>
                <Text style={[styles.cardTitle, { color: C.text }]}>{s.title}</Text>
              </View>
            </View>
            <Text style={[styles.cardDesc, { color: C.textDim }]}>{s.description}</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardSteps, { color: C.textHint }]}>{s.steps.length} transmisiones</Text>
              <Icon name="chevron-right" size={20} color={C.textHint} />
            </View>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 16, gap: 12, paddingBottom: 32 },
    intro: { color: C.textDim, fontSize: 13, lineHeight: 19, marginBottom: 4 },
    card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
    cardContent: { gap: 10 },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    cardMeta: { flex: 1, gap: 5 },
    chip: { alignSelf: "flex-start" },
    chipText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
    cardTitle: { fontSize: 15, fontWeight: "700" },
    cardDesc: { fontSize: 13, lineHeight: 18 },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardSteps: { fontSize: 11 },
  });
}
