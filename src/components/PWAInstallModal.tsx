import { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const STEPS = {
  android: [
    { icon: "⋮", label: "Tocá los 3 puntos", sub: "Arriba a la derecha del navegador" },
    { icon: "➕", label: "\"Agregar a pantalla de inicio\"", sub: "O \"Instalar aplicación\" según tu browser" },
    { icon: "✅", label: "Confirmá tocando \"Agregar\"", sub: "Aparece el diálogo de confirmación" },
    { icon: "🏠", label: "¡Listo!", sub: "La app aparece en tu pantalla de inicio como una app normal" },
  ],
  ios: [
    { icon: "□↑", label: "Tocá el botón compartir", sub: "La barra del fondo del Safari, ícono de cuadrado con flecha" },
    { icon: "➕", label: "\"En el inicio\" o \"Agregar al inicio\"", sub: "Deslizá hacia abajo en las opciones hasta encontrarlo" },
    { icon: "✅", label: "Tocá \"Agregar\" arriba a la derecha", sub: "Podés cambiarle el nombre si querés" },
    { icon: "🏠", label: "¡Listo!", sub: "La app aparece en tu pantalla de inicio como una app normal" },
  ],
};

export default function PWAInstallModal({ visible, onClose }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [tab, setTab] = useState<"android" | "ios">("android");

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>📲 Instalar la App</Text>
          <Text style={styles.subtitle}>
            Agregala a tu pantalla de inicio para abrirla como una app sin necesitar el navegador
          </Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === "android" && styles.tabActive]}
              onPress={() => setTab("android")}
            >
              <Text style={[styles.tabText, tab === "android" && styles.tabTextActive]}>
                🤖 Android
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "ios" && styles.tabActive]}
              onPress={() => setTab("ios")}
            >
              <Text style={[styles.tabText, tab === "ios" && styles.tabTextActive]}>
                🍎 iPhone
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pasos */}
          <ScrollView style={styles.stepsScroll} showsVerticalScrollIndicator={false}>
            {STEPS[tab].map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepLeft}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  {i < STEPS[tab].length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={styles.stepContent}>
                  <View style={styles.stepIconRow}>
                    <View style={styles.stepIconBox}>
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                    </View>
                    <Text style={styles.stepLabel}>{step.label}</Text>
                  </View>
                  <Text style={styles.stepSub}>{step.sub}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Nota */}
          <View style={styles.note}>
            <Text style={styles.noteText}>
              💡 Una vez instalada, funciona aunque cierres el navegador
            </Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 22,
      width: "100%",
      maxWidth: 420,
      borderWidth: 1.5,
      borderColor: C.yellow,
      maxHeight: "85%",
    },
    title: {
      color: C.yellow,
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 6,
    },
    subtitle: {
      color: C.textDim,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 16,
    },
    tabs: {
      flexDirection: "row",
      backgroundColor: C.cardRaised,
      borderRadius: 10,
      padding: 3,
      marginBottom: 18,
      gap: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: "center",
    },
    tabActive: {
      backgroundColor: C.yellow,
    },
    tabText: {
      color: C.textDim,
      fontSize: 14,
      fontWeight: "600",
    },
    tabTextActive: {
      color: C.black,
      fontWeight: "bold",
    },
    stepsScroll: {
      maxHeight: 280,
    },
    step: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 4,
    },
    stepLeft: {
      alignItems: "center",
      width: 28,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.yellow,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumberText: {
      color: C.black,
      fontWeight: "bold",
      fontSize: 13,
    },
    stepLine: {
      width: 2,
      flex: 1,
      backgroundColor: C.border,
      marginVertical: 4,
    },
    stepContent: {
      flex: 1,
      paddingBottom: 18,
      gap: 4,
    },
    stepIconRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    stepIconBox: {
      backgroundColor: C.cardRaised,
      borderRadius: 8,
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    stepIcon: {
      fontSize: 16,
    },
    stepLabel: {
      color: C.text,
      fontSize: 14,
      fontWeight: "bold",
      flex: 1,
      lineHeight: 18,
    },
    stepSub: {
      color: C.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    note: {
      backgroundColor: "rgba(255,193,7,0.1)",
      borderRadius: 10,
      padding: 10,
      marginTop: 4,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: "rgba(255,193,7,0.3)",
    },
    noteText: {
      color: C.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    closeBtn: {
      backgroundColor: C.yellow,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
    },
    closeBtnText: {
      color: C.black,
      fontWeight: "bold",
      fontSize: 15,
    },
  });
}
