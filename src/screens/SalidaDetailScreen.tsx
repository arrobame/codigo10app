import { useState, useRef, useMemo, useLayoutEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { salidas, SalidaSide } from "../data/salidas";
import { codigos } from "../data/codigos";
import { NavigationProp } from "../types";

// Renderiza el mensaje partiendo los códigos "10-XX" en chips tapeables
function MessageText({
  text, onCode, chipStyle, textStyle,
}: {
  text: string;
  onCode: (code: string) => void;
  chipStyle: object;
  textStyle: object;
}) {
  const parts = text.split(/(10-\d+)/g);
  return (
    <Text style={textStyle}>
      {parts.map((part, i) =>
        /^10-\d+$/.test(part) ? (
          <Text key={i} style={chipStyle} onPress={() => onCode(part)}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

export default function SalidaDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp>();
  const { salidaId } = route.params as { salidaId: string };
  const salida = salidas.find((s) => s.id === salidaId)!;
  const { C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C, isDark), [C, isDark]);

  const [revealed, setRevealed] = useState(1);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const total = salida.steps.length;
  const done = revealed >= total;
  const codeInfo = selectedCode ? codigos.find((c) => c.codigo === selectedCode) : null;

  useLayoutEffect(() => {
    navigation.setOptions({ title: salida.title });
  }, [navigation, salida.title]);

  function handleNext() {
    if (!done) {
      setRevealed((r) => r + 1);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }

  function handleReplay() {
    setRevealed(1);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 80);
  }

  return (
    <View style={styles.container}>
      {/* Modal: detalle de código tapeado */}
      <Modal
        visible={!!selectedCode}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCode(null)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSelectedCode(null)}
        >
          <View style={styles.codeModal}>
            <Text style={styles.codeNum}>{selectedCode}</Text>
            {codeInfo ? (
              <Text style={styles.codeDesc}>{codeInfo.descripcion}</Text>
            ) : (
              <Text style={styles.codeDesc}>Código no encontrado</Text>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedCode(null)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Descripción del escenario */}
      <View style={styles.descBanner}>
        <Text style={styles.descText}>{salida.description}</Text>
      </View>

      {/* Chat de transmisiones */}
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>📻 Toca los códigos resaltados para ver su significado.</Text>

        {salida.steps.slice(0, revealed).map((step, i) => (
          <View
            key={i}
            style={[styles.stepWrap, step.side === "mobile" ? styles.rightWrap : styles.leftWrap]}
          >
            <View style={[styles.bubble, step.side === "dispatch" ? styles.dispatchBubble : styles.mobileBubble]}>
              <Text style={[styles.speakerLabel, step.side === "dispatch" ? styles.dispatchLabel : styles.mobileLabel]}>
                {step.speaker}
              </Text>
              <MessageText
                text={step.message}
                onCode={setSelectedCode}
                chipStyle={styles.codeChip}
                textStyle={[styles.msgText, step.side === "dispatch" ? styles.dispatchMsgText : styles.mobileMsgText]}
              />
            </View>
            <Text style={[styles.noteText, step.side === "mobile" ? styles.noteRight : styles.noteLeft]}>
              {step.note}
            </Text>
          </View>
        ))}

        {done && (
          <View style={styles.doneRow}>
            <Text style={styles.doneText}>✓ Fin de la transmisión</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer: progreso + botón */}
      <View style={styles.footer}>
        <Text style={styles.progressText}>{Math.min(revealed, total)} / {total}</Text>
        {done ? (
          <TouchableOpacity style={[styles.footerBtn, styles.replayBtn]} onPress={handleReplay} activeOpacity={0.85}>
            <Text style={styles.replayBtnText}>↺  Repetir</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.footerBtn, styles.nextBtn]} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>Siguiente  →</Text>
          </TouchableOpacity>
        )}
      </View>
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

    chat: { flex: 1 },
    chatContent: { padding: 16, gap: 16, paddingBottom: 12 },

    hint: { color: C.textHint, fontSize: 11, textAlign: "center", marginBottom: 4 },

    stepWrap: { gap: 5, maxWidth: "85%" },
    leftWrap:  { alignSelf: "flex-start" },
    rightWrap: { alignSelf: "flex-end" },

    bubble: { borderRadius: 14, padding: 12, gap: 4 },
    dispatchBubble: {
      backgroundColor: isDark ? "#2a0000" : "#fff5f5",
      borderWidth: 1.5,
      borderColor: C.red,
    },
    mobileBubble: {
      backgroundColor: isDark ? "#1c1a00" : "#fffde7",
      borderWidth: 1.5,
      borderColor: C.yellow,
    },

    speakerLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
    dispatchLabel: { color: C.red },
    mobileLabel:   { color: C.yellowDark },

    msgText:         { fontSize: 15, lineHeight: 22 },
    dispatchMsgText: { color: C.text },
    mobileMsgText:   { color: C.text },

    codeChip: {
      backgroundColor: C.yellow,
      color: C.black,
      fontWeight: "700",
      fontSize: 14,
      borderRadius: 4,
      overflow: "hidden",
    },

    noteText:  { fontSize: 11, color: C.textHint, lineHeight: 15 },
    noteLeft:  { alignSelf: "flex-start", paddingLeft: 4 },
    noteRight: { alignSelf: "flex-end", textAlign: "right", paddingRight: 4 },

    doneRow:  { alignItems: "center", paddingVertical: 16 },
    doneText: { color: C.correctBorder, fontWeight: "700", fontSize: 13 },

    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: C.border,
      backgroundColor: C.card,
    },
    progressText: { color: C.textHint, fontSize: 13 },
    footerBtn: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 10 },
    nextBtn:   { backgroundColor: C.red },
    nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    replayBtn:   { backgroundColor: C.cardRaised, borderWidth: 1, borderColor: C.border },
    replayBtnText: { color: C.textDim, fontWeight: "600", fontSize: 14 },

    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    codeModal: {
      backgroundColor: C.card,
      borderRadius: 18,
      padding: 24,
      width: "100%",
      maxWidth: 340,
      gap: 10,
      alignItems: "center",
      borderWidth: 2,
      borderColor: C.yellow,
    },
    codeNum:  { fontSize: 34, fontWeight: "900", color: C.yellow },
    codeDesc: { fontSize: 16, color: C.text, textAlign: "center", fontWeight: "600" },
    nemoBox:  { backgroundColor: C.cardRaised, borderRadius: 10, padding: 10, width: "100%" },
    nemoText: { color: C.textDim, fontSize: 13, lineHeight: 18, textAlign: "center" },
    closeBtn: {
      marginTop: 4,
      paddingVertical: 8,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: C.cardRaised,
      borderWidth: 1,
      borderColor: C.border,
    },
    closeBtnText: { color: C.textDim, fontSize: 14, fontWeight: "600" },
  });
}
