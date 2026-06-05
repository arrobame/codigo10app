import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";

interface Slide {
  emoji: string;
  title: string;
  items: { icon: string; label: string; desc: string }[];
}

const SLIDES: Slide[] = [
  {
    emoji: "🎮",
    title: "Dos formas de jugar",
    items: [
      {
        icon: "🔤",
        label: "Código → Descripción",
        desc: "Ves el código (ej: 10-33) y elegís su significado entre 4 opciones.",
      },
      {
        icon: "📻",
        label: "Descripción → Código",
        desc: "Ves el significado (ej: 'Recarga de agua') y elegís el código correcto.",
      },
    ],
  },
  {
    emoji: "🔥",
    title: "Modo Racha",
    items: [
      {
        icon: "♾️",
        label: "Sin límite de preguntas",
        desc: "El juego no termina hasta que te equivocás o se agota el tiempo de una pregunta.",
      },
      {
        icon: "🏆",
        label: "Tu récord es la racha",
        desc: "Cuantos más códigos consecutivos respondas bien, mayor tu posición en el ranking.",
      },
    ],
  },
  {
    emoji: "⚡",
    title: "Modo Velocidad",
    items: [
      {
        icon: "⏱️",
        label: "10 códigos con reloj",
        desc: "El cronómetro corre por cada pregunta. Solo las respuestas correctas suman a tu tiempo promedio.",
      },
      {
        icon: "📈",
        label: "Cuanto más rápido, mejor",
        desc: "Menor tiempo promedio = mejor posición en el ranking de velocidad.",
      },
    ],
  },
  {
    emoji: "🏅📊",
    title: "Perfil y Logros",
    items: [
      {
        icon: "🏅",
        label: "Logros bomberiles",
        desc: "Desbloqueá insignias desde Pre Aspirante hasta Alpha. Tocá tu nombre en el encabezado para ver tu progreso.",
      },
      {
        icon: "📊",
        label: "Mis Errores y Práctica",
        desc: "Ves qué códigos te cuestan más. Tocá \"Practicar Top 5\" para repasar los más difíciles con ayuda de nemotecnias (🧠).",
      },
    ],
  },
  {
    emoji: "📻",
    title: "Radio en Código 10",
    items: [
      {
        icon: "🚑",
        label: "Simulaciones de comunicaciones reales",
        desc: "Aprendé cómo se comunican los bomberos en un servicio real, desde el despacho hasta el informe final.",
      },
      {
        icon: "💡",
        label: "Tocá los códigos",
        desc: "En cada transmisión, los códigos están resaltados. Tocálos para ver su significado al instante.",
      },
    ],
  },
  {
    emoji: "📥💛",
    title: "Instalar y Apoyar",
    items: [
      {
        icon: "📥",
        label: "Instalá la app",
        desc: "Tocá \"Instalar\" para agregarla a tu pantalla de inicio y usarla como app nativa, sin el navegador.",
      },
      {
        icon: "💛",
        label: "Apoyá al desarrollador",
        desc: "Esta app la hizo un aspirante a bombero solo, en su tiempo libre. ¡Cualquier donación ayuda enormemente!",
      },
    ],
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TutorialModal({ visible, onClose }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [index, setIndex] = useState(0);

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function handleNext() {
    if (isLast) {
      onClose();
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handleClose() {
    setIndex(0);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Skip */}
          <TouchableOpacity style={styles.skipBtn} onPress={handleClose}>
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>

          {/* Emoji + título */}
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <Text style={styles.title}>{slide.title}</Text>

          {/* Items */}
          <View style={styles.items}>
            {slide.items.map((item) => (
              <View key={item.label} style={styles.item}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>

          {/* Botón */}
          <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.btnText}>
              {isLast ? "¡Empezar!" : "Siguiente →"}
            </Text>
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
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 24,
      padding: 28,
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
      gap: 16,
    },
    skipBtn: { alignSelf: "flex-end" },
    skipText: { color: C.textHint, fontSize: 13 },
    emoji: { fontSize: 52 },
    title: { color: C.yellow, fontSize: 20, fontWeight: "bold", textAlign: "center" },
    items: { width: "100%", gap: 14 },
    item: {
      flexDirection: "row",
      gap: 14,
      backgroundColor: C.cardRaised,
      borderRadius: 14,
      padding: 14,
      alignItems: "flex-start",
    },
    itemIcon: { fontSize: 26, marginTop: 1 },
    itemText: { flex: 1, gap: 3 },
    itemLabel: { color: C.text, fontSize: 14, fontWeight: "bold" },
    itemDesc: { color: C.textDim, fontSize: 13, lineHeight: 19 },
    dots: { flexDirection: "row", gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
    dotActive: { backgroundColor: C.yellow, width: 22 },
    btn: {
      backgroundColor: C.yellow,
      paddingVertical: 13,
      paddingHorizontal: 40,
      borderRadius: 14,
      width: "100%",
      alignItems: "center",
    },
    btnText: { color: C.black, fontSize: 16, fontWeight: "bold" },
  });
}
