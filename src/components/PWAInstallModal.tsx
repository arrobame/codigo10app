import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Portal, Modal as PaperModal, Button, SegmentedButtons, Surface } from "react-native-paper";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import Icon, { MaterialIconName } from "./Icon";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const STEPS: Record<"android" | "ios", { icon: MaterialIconName; label: string; sub: string }[]> = {
  android: [
    { icon: "more-vert", label: "Tocá los 3 puntos", sub: "Arriba a la derecha del navegador" },
    { icon: "add", label: "\"Agregar a pantalla de inicio\"", sub: "O \"Instalar aplicación\" según tu browser" },
    { icon: "check-circle", label: "Confirmá tocando \"Agregar\"", sub: "Aparece el diálogo de confirmación" },
    { icon: "home", label: "¡Listo!", sub: "La app aparece en tu pantalla de inicio como una app normal" },
  ],
  ios: [
    { icon: "ios-share", label: "Tocá el botón compartir", sub: "La barra del fondo del Safari, ícono de cuadrado con flecha" },
    { icon: "add", label: "\"En el inicio\" o \"Agregar al inicio\"", sub: "Deslizá hacia abajo en las opciones hasta encontrarlo" },
    { icon: "check-circle", label: "Tocá \"Agregar\" arriba a la derecha", sub: "Podés cambiarle el nombre si querés" },
    { icon: "home", label: "¡Listo!", sub: "La app aparece en tu pantalla de inicio como una app normal" },
  ],
};

export default function PWAInstallModal({ visible, onClose }: Props) {
  const { C } = useTheme();
  const styles = makeStyles(C);
  const [tab, setTab] = useState<"android" | "ios">("android");

  return (
    <Portal>
      <PaperModal visible={visible} onDismiss={onClose} contentContainerStyle={[styles.card, { backgroundColor: C.card }]}>
        <Text style={[styles.title, { color: C.text }]}>Instalar la App</Text>
        <Text style={[styles.subtitle, { color: C.textDim }]}>
          Agregala a tu pantalla de inicio para abrirla como una app sin necesitar el navegador
        </Text>

        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as "android" | "ios")}
          buttons={[
            { value: "android", label: "Android", icon: "android" },
            { value: "ios", label: "iPhone", icon: "apple" },
          ]}
          style={{ marginBottom: 16 }}
        />

        <ScrollView style={styles.stepsScroll} showsVerticalScrollIndicator={false}>
          {STEPS[tab].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepNumber, { backgroundColor: C.yellow }]}>
                  <Text style={[styles.stepNumberText, { color: C.onAccent }]}>{i + 1}</Text>
                </View>
                {i < STEPS[tab].length - 1 && <View style={[styles.stepLine, { backgroundColor: C.border }]} />}
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepIconRow}>
                  <Surface style={[styles.stepIconBox, { backgroundColor: C.cardRaised }]} elevation={0}>
                    <Icon name={step.icon} size={18} color={C.textDim} />
                  </Surface>
                  <Text style={[styles.stepLabel, { color: C.text }]}>{step.label}</Text>
                </View>
                <Text style={[styles.stepSub, { color: C.textDim }]}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.note, { backgroundColor: C.cardRaised, borderColor: C.border }]}>
          <Icon name="lightbulb" size={15} color={C.yellow} />
          <Text style={[styles.noteText, { color: C.textDim }]}>
            Una vez instalada, funciona aunque cierres el navegador
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={onClose}
          style={styles.closeBtn}
          labelStyle={{ fontWeight: "700", fontSize: 15 }}
        >
          Entendido
        </Button>
      </PaperModal>
    </Portal>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: 20,
      padding: 22,
      margin: 20,
      alignSelf: "center",
      width: "90%",
      maxWidth: 420,
      maxHeight: "85%" as any,
    },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
    subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
    stepsScroll: { maxHeight: 280 },
    step: { flexDirection: "row", gap: 12, marginBottom: 4 },
    stepLeft: { alignItems: "center", width: 28 },
    stepNumber: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: "center", justifyContent: "center",
    },
    stepNumberText: { fontWeight: "bold", fontSize: 13 },
    stepLine: { width: 2, flex: 1, marginVertical: 4 },
    stepContent: { flex: 1, paddingBottom: 18, gap: 4 },
    stepIconRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    stepIconBox: {
      borderRadius: 8, width: 34, height: 34,
      alignItems: "center", justifyContent: "center",
    },
    stepLabel: { fontSize: 14, fontWeight: "bold", flex: 1, lineHeight: 18 },
    stepSub: { fontSize: 12, lineHeight: 17 },
    note: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10, marginTop: 4, marginBottom: 14, borderWidth: 1 },
    noteText: { flex: 1, fontSize: 12, lineHeight: 17 },
    closeBtn: { borderRadius: 12 },
  });
}
