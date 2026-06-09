import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Portal, Modal as PaperModal, Button } from "react-native-paper";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import Icon, { MaterialIconName } from "./Icon";

interface Slide {
  icon: MaterialIconName;
  title: string;
  items: { icon: MaterialIconName; label: string; desc: string }[];
}

const SLIDES: Slide[] = [
  {
    icon: "videogame-asset",
    title: "Dos formas de jugar",
    items: [
      {
        icon: "swap-horiz",
        label: "Código → Descripción",
        desc: "Ves el código (ej: 10-33) y elegís su significado entre 4 opciones.",
      },
      {
        icon: "radio",
        label: "Descripción → Código",
        desc: "Ves el significado (ej: 'Recarga de agua') y elegís el código correcto.",
      },
    ],
  },
  {
    icon: "local-fire-department",
    title: "Modo Racha",
    items: [
      {
        icon: "all-inclusive",
        label: "Sin límite de preguntas",
        desc: "El juego no termina hasta que te equivocás o se agota el tiempo de una pregunta.",
      },
      {
        icon: "emoji-events",
        label: "Tu récord es la racha",
        desc: "Cuantos más códigos consecutivos respondas bien, mayor tu posición en el ranking.",
      },
    ],
  },
  {
    icon: "bolt",
    title: "Modo Velocidad",
    items: [
      {
        icon: "timer",
        label: "10 códigos con reloj",
        desc: "El cronómetro corre por cada pregunta. Solo las respuestas correctas suman a tu tiempo promedio.",
      },
      {
        icon: "trending-up",
        label: "Cuanto más rápido, mejor",
        desc: "Menor tiempo promedio = mejor posición en el ranking de velocidad.",
      },
    ],
  },
  {
    icon: "military-tech",
    title: "Perfil y Logros",
    items: [
      {
        icon: "military-tech",
        label: "Logros bomberiles",
        desc: "Desbloqueá insignias desde Pre Aspirante hasta Alpha. Tocá tu nombre en el encabezado para ver tu progreso.",
      },
      {
        icon: "bar-chart",
        label: "Mis Errores y Práctica",
        desc: "Ves qué códigos te cuestan más. Tocá \"Practicar Top 5\" para repasar los más difíciles con ayuda de nemotecnias.",
      },
    ],
  },
  {
    icon: "radio",
    title: "Radio en Código 10",
    items: [
      {
        icon: "local-hospital",
        label: "Simulaciones de comunicaciones reales",
        desc: "Aprendé cómo se comunican los bomberos en un servicio real, desde el despacho hasta el informe final.",
      },
      {
        icon: "lightbulb",
        label: "Tocá los códigos",
        desc: "En cada transmisión, los códigos están resaltados. Tocálos para ver su significado al instante.",
      },
    ],
  },
  {
    icon: "favorite",
    title: "Instalar y Apoyar",
    items: [
      {
        icon: "install-mobile",
        label: "Instalá la app",
        desc: "Tocá \"Instalar\" para agregarla a tu pantalla de inicio y usarla como app nativa, sin el navegador.",
      },
      {
        icon: "favorite",
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
  const styles = makeStyles(C);
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
    <Portal>
      <PaperModal visible={visible} onDismiss={handleClose} contentContainerStyle={[styles.card, { backgroundColor: C.card }]}>
        <Button onPress={handleClose} textColor={C.textHint} compact style={{ alignSelf: "flex-end" }}>
          Saltar
        </Button>

        <View style={[styles.heroIcon, { backgroundColor: C.yellow + "1A" }]}>
          <Icon name={slide.icon} size={36} color={C.yellow} />
        </View>
        <Text style={[styles.title, { color: C.text }]}>{slide.title}</Text>

        <View style={styles.items}>
          {slide.items.map((item) => (
            <View key={item.label} style={[styles.item, { backgroundColor: C.cardRaised }]}>
              <Icon name={item.icon} size={24} color={C.yellow} style={styles.itemIcon} />
              <View style={styles.itemText}>
                <Text style={[styles.itemLabel, { color: C.text }]}>{item.label}</Text>
                <Text style={[styles.itemDesc, { color: C.textDim }]}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: C.border },
                i === index && { backgroundColor: C.yellow, width: 22 },
              ]}
            />
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.btn}
          contentStyle={{ paddingVertical: 4 }}
          labelStyle={{ fontSize: 16, fontWeight: "700" }}
        >
          {isLast ? "Empezar" : "Siguiente"}
        </Button>
      </PaperModal>
    </Portal>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: 24,
      padding: 24,
      margin: 20,
      alignSelf: "center",
      width: "90%",
      maxWidth: 420,
      alignItems: "center",
      gap: 16,
    },
    heroIcon: {
      width: 72, height: 72, borderRadius: 36,
      alignItems: "center", justifyContent: "center",
    },
    title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
    items: { width: "100%", gap: 14 },
    item: {
      flexDirection: "row",
      gap: 14,
      borderRadius: 14,
      padding: 14,
      alignItems: "flex-start",
    },
    itemIcon: { marginTop: 1 },
    itemText: { flex: 1, gap: 3 },
    itemLabel: { fontSize: 14, fontWeight: "700" },
    itemDesc: { fontSize: 13, lineHeight: 19 },
    dots: { flexDirection: "row", gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    btn: { width: "100%", borderRadius: 14 },
  });
}
