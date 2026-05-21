import { useMemo, useState } from "react";
import {
  View, Text, SectionList, StyleSheet, TextInput,
  TouchableOpacity, Modal, Pressable,
} from "react-native";
import { useHomeBack } from "../hooks/useHomeBack";
import { codigos, Codigo } from "../data/codigos";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";

const SECTIONS: { title: string; emoji: string; range: [number, number]; color: string }[] = [
  { title: "Informaciones necesarias",  emoji: "📡", range: [0,  35], color: "#1565C0" },
  { title: "Informaciones de Servicio", emoji: "🚒", range: [40, 69], color: "#2E7D32" },
  { title: "Situaciones de emergencia", emoji: "🚨", range: [70, 79], color: "#B71C1C" },
  { title: "Informaciones de apoyo",    emoji: "🤝", range: [80, 99], color: "#6A1B9A" },
];

function codigoNum(c: Codigo) {
  return parseInt(c.codigo.split("-")[1]);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function sectionColor(c: Codigo): string {
  const n = codigoNum(c);
  return SECTIONS.find((s) => n >= s.range[0] && n <= s.range[1])?.color ?? "#FFC107";
}

function buildSections(items: Codigo[]) {
  return SECTIONS.map((s) => ({
    ...s,
    data: items.filter((c) => {
      const n = codigoNum(c);
      return n >= s.range[0] && n <= s.range[1];
    }),
  })).filter((s) => s.data.length > 0);
}

export default function StudyScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  useHomeBack();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Codigo | null>(null);

  function toggleSection(title: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  const filtered = search
    ? codigos.filter(
        (c) =>
          c.codigo.includes(search) ||
          c.descripcion.toLowerCase().includes(search.toLowerCase())
      )
    : codigos;

  const isSearching = search.length > 0;
  const allSections = useMemo(() => buildSections(filtered), [filtered]);
  const sections = useMemo(
    () => allSections.map((s) => ({
      ...s,
      data: isSearching || expanded.has(s.title) ? s.data : [],
    })),
    [allSections, expanded, isSearching]
  );

  const selectedColor = selected ? sectionColor(selected) : "#FFC107";

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar código o descripción..."
        placeholderTextColor={C.textHint}
        value={search}
        onChangeText={setSearch}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.codigo}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderSectionHeader={({ section }) => {
          const isOpen = isSearching || expanded.has(section.title);
          const total = allSections.find((s) => s.title === section.title)?.data.length ?? 0;
          return (
            <TouchableOpacity
              style={[styles.sectionHeader, { backgroundColor: section.color + "18", borderLeftColor: section.color }]}
              onPress={() => toggleSection(section.title)}
              activeOpacity={0.75}
            >
              <Text style={styles.sectionEmoji}>{section.emoji}</Text>
              <View style={styles.sectionHeaderMid}>
                <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
                <Text style={styles.sectionMeta}>
                  {total} {total === 1 ? "código" : "códigos"} · del {pad(section.range[0])} al {pad(section.range[1])}
                </Text>
              </View>
              <View style={[styles.chevronBadge, { borderColor: section.color + "55" }]}>
                <Text style={[styles.chevron, { color: section.color }]}>{isOpen ? "▲" : "▼"}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        renderSectionFooter={({ section }) =>
          isSearching || expanded.has(section.title) ? <View style={styles.sectionFooter} /> : null
        }
        renderItem={({ item, section }) => (
          <TouchableOpacity
            style={[styles.row, { borderLeftColor: section.color }]}
            onPress={() => setSelected(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.codigoBadge, { backgroundColor: section.color }]}>
              <Text style={styles.codigoText}>{item.codigo}</Text>
            </View>
            <Text style={styles.descripcion}>{item.descripcion}</Text>
            <Text style={[styles.hint, { color: section.color }]}>🧠</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal de nemotecnia */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            {selected && (
              <>
                <View style={[styles.modalBadge, { backgroundColor: selectedColor }]}>
                  <Text style={styles.modalCodigo}>{selected.codigo}</Text>
                </View>
                <Text style={styles.modalDesc}>{selected.descripcion}</Text>
                <View style={[styles.modalDivider, { backgroundColor: selectedColor + "40" }]} />
                <Text style={styles.modalNemoLabel}>🧠 Nemotecnia</Text>
                <Text style={styles.modalNemo}>{selected.nemotecnia}</Text>
                <TouchableOpacity
                  style={[styles.modalClose, { backgroundColor: selectedColor }]}
                  onPress={() => setSelected(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCloseText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    search: {
      margin: 12, padding: 12, backgroundColor: C.card,
      borderRadius: 10, borderWidth: 1, borderColor: C.border,
      fontSize: 15, color: C.text,
    },
    sectionHeader: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, paddingVertical: 14,
      borderLeftWidth: 5, gap: 12,
    },
    sectionEmoji: { fontSize: 22 },
    sectionHeaderMid: { flex: 1 },
    sectionTitle: { fontSize: 14, fontWeight: "bold", lineHeight: 20 },
    sectionMeta: { color: C.textHint, fontSize: 12, marginTop: 2 },
    chevronBadge: {
      width: 28, height: 28, borderRadius: 8, borderWidth: 1,
      alignItems: "center", justifyContent: "center",
    },
    chevron: { fontSize: 11, fontWeight: "bold" },
    sectionFooter: { height: 8, backgroundColor: C.bg },
    row: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: C.card, paddingHorizontal: 16,
      paddingVertical: 13, gap: 14, borderLeftWidth: 3,
    },
    codigoBadge: {
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
      minWidth: 72, alignItems: "center",
    },
    codigoText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
    descripcion: { flex: 1, fontSize: 14, color: C.textDim, lineHeight: 20 },
    hint: { fontSize: 16 },
    separator: { height: 1, backgroundColor: C.border },

    // Modal
    overlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center", alignItems: "center", padding: 24,
    },
    modal: {
      backgroundColor: C.card, borderRadius: 20,
      padding: 24, width: "100%", maxWidth: 420, alignItems: "center", gap: 12,
    },
    modalBadge: {
      borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
    },
    modalCodigo: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    modalDesc: { color: C.text, fontSize: 17, fontWeight: "bold", textAlign: "center" },
    modalDivider: { height: 1, width: "100%" },
    modalNemoLabel: { color: C.textHint, fontSize: 12, fontWeight: "bold", letterSpacing: 0.5 },
    modalNemo: {
      color: C.text, fontSize: 15, lineHeight: 24,
      textAlign: "center", fontStyle: "italic",
    },
    modalClose: {
      marginTop: 4, borderRadius: 12, paddingVertical: 12,
      paddingHorizontal: 32, alignSelf: "stretch", alignItems: "center",
    },
    modalCloseText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  });
}
