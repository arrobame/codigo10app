import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, Button, Divider, Surface } from "react-native-paper";
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
    <ScrollView style={[styles.scroll, { backgroundColor: C.bg }]} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>💛🥹</Text>
        <Text style={[styles.heroTitle, { color: C.yellow }]}>Apoyá al Desarrollador</Text>
        <Text style={[styles.heroSub, { color: C.textDim }]}>
          Por favor doname alguito 🥹, estoy muy sogüe y todavia me falta comprar el uniforme de gala!
        </Text>
      </View>

      <Card style={[styles.phoneCard, { backgroundColor: C.card, borderColor: C.yellow }]} elevation={3}>
        <Card.Content style={{ alignItems: "center", gap: 10 }}>
          <Text style={[styles.cardTitle, { color: C.textDim }]}>📱 Transferencia vía celular</Text>
          <Text style={[styles.phoneNumber, { color: C.yellow }]}>{PHONE}</Text>
          <Text style={[styles.phoneHint, { color: C.textHint }]}>Tipeá este número en tu app bancaria</Text>
          <Button
            mode="contained"
            onPress={handleCopy}
            style={styles.copyBtn}
            labelStyle={{ color: C.black, fontWeight: "bold" }}
          >
            {copied ? "✓ ¡Número copiado!" : "Copiar número"}
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.messageCard, { backgroundColor: C.card, borderColor: C.border }]} elevation={1}>
        <Card.Content style={{ gap: 10 }}>
          <Text style={[styles.messageTitle, { color: C.text }]}>👨‍💻 Mensaje del desarrollador</Text>
          <Text style={[styles.messageText, { color: C.textDim }]}>
            Esta aplicación fue desarrollada de forma completamente{" "}
            <Text style={{ color: C.yellow, fontWeight: "bold" }}>independiente</Text>, en tiempo libre y sin fines de lucro,
            como una herramienta de estudio para los bomberos y aspirantes a bomberos voluntarios del Paraguay.{"\n\n"}
            Cada donación, nos ayuda enormemente a conseguir nuestros uniformes y otros elementos. ¡Muchas gracias por tu apoyo!
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.disclaimerCard, { backgroundColor: C.wrongBg, borderColor: C.wrongBorder }]} elevation={0}>
        <Card.Content style={{ gap: 12 }}>
          <View style={styles.disclaimerHeader}>
            <Text style={styles.disclaimerIcon}>⚠️</Text>
            <Text style={[styles.disclaimerTitle, { color: C.red }]}>AVISO IMPORTANTE</Text>
          </View>
          <Text style={[styles.disclaimerText, { color: C.textDim }]}>
            Las donaciones recibidas son{" "}
            <Text style={{ color: C.redHighlight, fontWeight: "bold" }}>exclusivamente</Text> para el desarrollador independiente de esta aplicación.
          </Text>
          <Divider style={{ backgroundColor: C.wrongBorder + "44" }} />
          <Text style={[styles.disclaimerText, { color: C.textDim }]}>
            <Text style={{ color: C.redHighlight, fontWeight: "bold" }}>
              El CBVP no tiene ninguna relación con el desarrollador ni con esta aplicación.
            </Text>{" "}
            Esta app no es oficial del CBVP y no fue creada ni avalada por la institución.
          </Text>
          <Divider style={{ backgroundColor: C.wrongBorder + "44" }} />
          <Text style={[styles.disclaimerText, { color: C.textDim }]}>
            Si deseás hacer donaciones al CBVP, hacelo directamente a través de los canales oficiales de la institución.
          </Text>
        </Card.Content>
      </Card>

      <Text style={[styles.footer, { color: C.textHint }]}>Desarrollado con ❤️ por MdP.</Text>
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    container: { padding: 20, paddingTop: 10, gap: 16 },
    hero: { alignItems: "center", paddingVertical: 24 },
    heroEmoji: { fontSize: 60, marginBottom: 10 },
    heroTitle: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
    heroSub: { fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 },
    phoneCard: { borderRadius: 18, borderWidth: 2, overflow: "hidden" },
    cardTitle: { fontSize: 13 },
    phoneNumber: { fontSize: 38, fontWeight: "bold", letterSpacing: 3 },
    phoneHint: { fontSize: 12 },
    copyBtn: { borderRadius: 30 },
    messageCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
    messageTitle: { fontSize: 15, fontWeight: "bold" },
    messageText: { fontSize: 14, lineHeight: 22 },
    disclaimerCard: { borderRadius: 16, borderWidth: 1.5, overflow: "hidden" },
    disclaimerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    disclaimerIcon: { fontSize: 20 },
    disclaimerTitle: { fontWeight: "bold", fontSize: 15, letterSpacing: 0.5 },
    disclaimerText: { fontSize: 13, lineHeight: 20 },
    footer: { textAlign: "center", fontSize: 13, paddingVertical: 16 },
  });
}
