import { useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";

const PHONE = "0971274229";

interface Props {
  visible: boolean;
  onClose: () => void;
  onGoToDonation: () => void;
}

export default function DonationModal({ visible, onClose, onGoToDonation }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>💛</Text>
            <Text style={styles.title}>Apoyá al Desarrollador</Text>
          </View>

          <Text style={styles.body}>
            Por favor doname alguito 🥹, estoy muy sogüe y todavia me falta comprar el uniforme de gala! 
          </Text>

          <View style={styles.phoneBox}>
            <Text style={styles.phoneLabel}>📱 Transferencia vía celular</Text>
            <Text style={styles.phoneNumber}>{PHONE}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={styles.copyBtnText}>{copied ? "✓ Copiado!" : "Copiar número"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerIcon}>⚠️</Text>
            <Text style={styles.disclaimerText}>
              Las donaciones son <Text style={styles.bold}>exclusivamente</Text> para el desarrollador independiente.{"\n"}
              <Text style={styles.disclaimerRed}>El CBVP no tiene ninguna relación con esta aplicación.</Text>
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => { onClose(); onGoToDonation(); }}>
              <Text style={styles.btnPrimaryText}>❤️ Ver más info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
              <Text style={styles.btnGhostText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.75)",
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
    },
    header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    headerEmoji: { fontSize: 30 },
    title: { color: C.yellow, fontSize: 20, fontWeight: "bold", flex: 1 },
    body: { color: C.textDim, fontSize: 14, lineHeight: 21, marginBottom: 16 },
    bold: { color: C.text, fontWeight: "bold" },
    phoneBox: {
      backgroundColor: C.cardRaised,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      marginBottom: 14,
      borderWidth: 1,
      borderColor: C.border,
    },
    phoneLabel: { color: C.textDim, fontSize: 12, marginBottom: 6 },
    phoneNumber: { color: C.yellow, fontSize: 26, fontWeight: "bold", letterSpacing: 2, marginBottom: 10 },
    copyBtn: { backgroundColor: C.yellow, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    copyBtnText: { color: C.black, fontWeight: "bold", fontSize: 13 },
    disclaimer: {
      flexDirection: "row",
      gap: 8,
      backgroundColor: C.wrongBg,
      borderRadius: 10,
      padding: 12,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: C.wrongBorder + "55",
    },
    disclaimerIcon: { fontSize: 16, marginTop: 1 },
    disclaimerText: { flex: 1, color: C.textDim, fontSize: 12, lineHeight: 18 },
    disclaimerRed: { color: C.redHighlight, fontWeight: "bold" },
    actions: { gap: 10 },
    btnPrimary: { backgroundColor: C.yellow, borderRadius: 12, padding: 14, alignItems: "center" },
    btnPrimaryText: { color: C.black, fontWeight: "bold", fontSize: 15 },
    btnGhost: { padding: 10, alignItems: "center" },
    btnGhostText: { color: C.textHint, fontSize: 14 },
  });
}
