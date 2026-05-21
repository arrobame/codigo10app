import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import * as Clipboard from "expo-clipboard";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { useHomeBack } from "../hooks/useHomeBack";

const PHONE = "0971274229";

export default function DonationScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  useHomeBack();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>💛🥹</Text>
        <Text style={styles.heroTitle}>Apoyá al Desarrollador</Text>
        <Text style={styles.heroSub}>
          Por favor doname alguito 🥹, estoy muy sogüe y todavia me falta comprar el uniforme de gala!
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📱 Transferencia vía celular</Text>
        <Text style={styles.phoneNumber}>{PHONE}</Text>
        <Text style={styles.phoneHint}>Tipeá este número en tu app bancaria</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
          <Text style={styles.copyBtnText}>{copied ? "✓ ¡Número copiado!" : "Copiar número"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>👨‍💻 Mensaje del desarrollador</Text>
        <Text style={styles.messageText}>
          Esta aplicación fue desarrollada de forma completamente{" "}
          <Text style={styles.highlight}>independiente</Text>, en tiempo libre y sin fines de lucro,
          como una herramienta de estudio para los bomberos y aspirantes a bomberos voluntarios del Paraguay.{"\n\n"}
          Cada donación, nos ayuda enormemente a conseguir nuestros uniformes y otros elementos. ¡Muchas gracias por tu apoyo!
        </Text>
      </View>

      <View style={styles.disclaimerCard}>
        <View style={styles.disclaimerHeader}>
          <Text style={styles.disclaimerIcon}>⚠️</Text>
          <Text style={styles.disclaimerTitle}>AVISO IMPORTANTE</Text>
        </View>
        <Text style={styles.disclaimerText}>
          Las donaciones recibidas son{" "}
          <Text style={styles.highlightRed}>exclusivamente</Text> para el desarrollador independiente de esta aplicación.
        </Text>
        <View style={styles.divider} />
        <Text style={styles.disclaimerText}>
          <Text style={styles.highlightRed}>
            El CBVP (Cuerpo de Bomberos Voluntarios del Paraguay) no tiene ninguna relación con el desarrollador ni con esta aplicación.
          </Text>{" "}
          Esta app no es oficial del CBVP y no fue creada ni avalada por la institución.
        </Text>
        <View style={styles.divider} />
        <Text style={styles.disclaimerText}>
          Si deseás hacer donaciones al CBVP, hacelo directamente a través de los canales oficiales de la institución.
        </Text>
      </View>

      <Text style={styles.footer}>Desarrollado con ❤️ por MdP.</Text>
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingTop: 10, gap: 16 },
    hero: { alignItems: "center", paddingVertical: 24 },
    heroEmoji: { fontSize: 60, marginBottom: 10 },
    heroTitle: { color: C.yellow, fontSize: 26, fontWeight: "bold", textAlign: "center" },
    heroSub: { color: C.textDim, fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 },
    card: {
      backgroundColor: C.card,
      borderRadius: 18,
      padding: 24,
      alignItems: "center",
      borderWidth: 2,
      borderColor: C.yellow,
    },
    cardTitle: { color: C.textDim, fontSize: 13, marginBottom: 10 },
    phoneNumber: { color: C.yellow, fontSize: 38, fontWeight: "bold", letterSpacing: 3, marginBottom: 6 },
    phoneHint: { color: C.textHint, fontSize: 12, marginBottom: 18 },
    copyBtn: { backgroundColor: C.yellow, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30 },
    copyBtnText: { color: C.black, fontWeight: "bold", fontSize: 15 },
    messageCard: { backgroundColor: C.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
    messageTitle: { color: C.text, fontSize: 15, fontWeight: "bold", marginBottom: 10 },
    messageText: { color: C.textDim, fontSize: 14, lineHeight: 22 },
    highlight: { color: C.yellow, fontWeight: "bold" },
    disclaimerCard: {
      backgroundColor: C.wrongBg,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1.5,
      borderColor: C.wrongBorder,
      gap: 12,
    },
    disclaimerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    disclaimerIcon: { fontSize: 20 },
    disclaimerTitle: { color: C.red, fontWeight: "bold", fontSize: 15, letterSpacing: 0.5 },
    disclaimerText: { color: C.textDim, fontSize: 13, lineHeight: 20 },
    highlightRed: { color: C.redHighlight, fontWeight: "bold" },
    divider: { height: 1, backgroundColor: C.wrongBorder + "44" },
    footer: { textAlign: "center", color: C.textHint, fontSize: 13, paddingVertical: 16 },
  });
}
