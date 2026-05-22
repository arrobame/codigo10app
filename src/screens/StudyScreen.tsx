import { useMemo, useState, useCallback } from "react";
import {
  View, Text, SectionList, StyleSheet, TextInput,
  TouchableOpacity, Modal, Pressable, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useHomeBack } from "../hooks/useHomeBack";
import { codigos, Codigo } from "../data/codigos";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import {
  getCustomNemotecnias,
  setCustomNemotecnia,
  deleteCustomNemotecnia,
} from "../utils/nemotecnias";

const SECTIONS: { title: string; emoji: string; range: [number, number]; color: string }[] = [
  { title: "Informaciones necesarias",  emoji: "📡", range: [0,  35], color: "#1565C0" },
  { title: "Informaciones de Servicio", emoji: "🚒", range: [40, 69], color: "#2E7D32" },
  { title: "Situaciones de emergencia", emoji: "🚨", range: [70, 79], color: "#B71C1C" },
  { title: "Informaciones de apoyo",    emoji: "🤝", range: [80, 99], color: "#6A1B9A" },
];

function codigoNum(c: Codigo) { return parseInt(c.codigo.split("-")[1]); }
function pad(n: number) { return String(n).padStart(2, "0"); }

function sectionColor(c: Codigo): string {
  const n = codigoNum(c);
  return SECTIONS.find((s) => n >= s.range[0] && n <= s.range[1])?.color ?? "#FFC107";
}

function buildSections(items: Codigo[]) {
  return SECTIONS.map((s) => ({
    ...s,
    data: items.filter((c) => { const n = codigoNum(c); return n >= s.range[0] && n <= s.range[1]; }),
  })).filter((s) => s.data.length > 0);
}

export default function StudyScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  useHomeBack();

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Codigo | null>(null);
  const [customMap, setCustomMap] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  useFocusEffect(useCallback(() => {
    getCustomNemotecnias().then(setCustomMap);
  }, []));

  function toggleSection(title: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  }

  function openModal(item: Codigo) {
    setSelected(item);
    setEditing(false);
    setEditText("");
  }

  function startEditing() {
    if (!selected) return;
    setEditText(customMap[selected.codigo] ?? selected.nemotecnia ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected || !editText.trim()) return;
    await setCustomNemotecnia(selected.codigo, editText.trim());
    setCustomMap((prev) => ({ ...prev, [selected.codigo]: editText.trim() }));
    setEditing(false);
  }

  async function resetToDefault() {
    if (!selected) return;
    await deleteCustomNemotecnia(selected.codigo);
    setCustomMap((prev) => { const next = { ...prev }; delete next[selected.codigo]; return next; });
    setEditing(false);
  }

  function closeModal() {
    setSelected(null);
    setEditing(false);
    setEditText("");
  }

  const filtered = search
    ? codigos.filter((c) =>
        c.codigo.includes(search) || c.descripcion.toLowerCase().includes(search.toLowerCase()))
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
  const effectiveNemo = selected ? (customMap[selected.codigo] ?? selected.nemotecnia ?? "") : "";
  const isCustom = selected ? !!customMap[selected.codigo] : false;

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
        renderItem={({ item, section }) => {
          const hasNemo = !!(item.nemotecnia || customMap[item.codigo]);
          const hasCustom = !!customMap[item.codigo];
          return (
            <TouchableOpacity
              style={[styles.row, { borderLeftColor: section.color }]}
              onPress={() => openModal(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.codigoBadge, { backgroundColor: section.color }]}>
                <Text style={styles.codigoText}>{item.codigo}</Text>
              </View>
              <Text style={styles.descripcion}>{item.descripcion}</Text>
              {hasNemo && (
                <Text style={[styles.nemoHint, { color: hasCustom ? C.yellow : section.color }]}>
                  {hasCustom ? "✏️" : "🧠"}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.modal} onPress={() => {}}>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                <View style={[styles.modalBadge, { backgroundColor: selectedColor }]}>
                  <Text style={styles.modalCodigo}>{selected.codigo}</Text>
                </View>
                <Text style={styles.modalDesc}>{selected.descripcion}</Text>
                <View style={[styles.modalDivider, { backgroundColor: selectedColor + "40" }]} />

                <View style={styles.nemoHeader}>
                  <Text style={styles.nemoLabel}>🧠 Nemotecnia</Text>
                  {isCustom && (
                    <View style={[styles.customBadge, { backgroundColor: C.yellow + "22", borderColor: C.yellow + "66" }]}>
                      <Text style={[styles.customBadgeText, { color: C.yellow }]}>✏️ Personalizada</Text>
                    </View>
                  )}
                </View>

                {editing ? (
                  <>
                    <TextInput
                      style={[styles.editInput, { borderColor: selectedColor, color: C.text, backgroundColor: C.cardRaised }]}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      autoFocus
                      placeholderTextColor={C.textHint}
                      placeholder="Escribí tu propia nemotecnia..."
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={[styles.editBtn, { backgroundColor: selectedColor }]}
                        onPress={saveEdit}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.editBtnTextWhite}>Guardar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editBtn, { backgroundColor: C.cardRaised }]}
                        onPress={() => setEditing(false)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.editBtnText, { color: C.textDim }]}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                    {isCustom && (
                      <TouchableOpacity onPress={resetToDefault} style={styles.resetBtn}>
                        <Text style={[styles.resetBtnText, { color: C.textHint }]}>
                          Restablecer ejemplo original
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    {effectiveNemo ? (
                      <>
                        <Text style={styles.nemoText}>{effectiveNemo}</Text>
                        {!isCustom && (
                          <Text style={styles.exampleHint}>↑ Ejemplo — podés personalizarla</Text>
                        )}
                      </>
                    ) : (
                      <Text style={styles.exampleHint}>Sin nemotecnia todavía — ¡creá la tuya!</Text>
                    )}
                    <TouchableOpacity
                      style={[styles.editStartBtn, { borderColor: selectedColor }]}
                      onPress={startEditing}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.editStartText, { color: selectedColor }]}>
                        ✏️ {isCustom ? "Editar mi nemotecnia" : "Crear mi nemotecnia"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                  <Text style={styles.closeBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
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
      paddingHorizontal: 14, paddingVertical: 14, borderLeftWidth: 5, gap: 12,
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
      flexDirection: "row", alignItems: "center", backgroundColor: C.card,
      paddingHorizontal: 16, paddingVertical: 13, gap: 14, borderLeftWidth: 3,
    },
    codigoBadge: {
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
      minWidth: 72, alignItems: "center",
    },
    codigoText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
    descripcion: { flex: 1, fontSize: 14, color: C.textDim, lineHeight: 20 },
    nemoHint: { fontSize: 16 },
    separator: { height: 1, backgroundColor: C.border },
    overlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center", alignItems: "center", padding: 20,
    },
    modal: {
      backgroundColor: C.card, borderRadius: 20,
      width: "100%", maxWidth: 420, maxHeight: "85%" as any,
    },
    modalContent: { padding: 24, gap: 12, alignItems: "center" },
    modalBadge: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
    modalCodigo: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    modalDesc: { color: C.text, fontSize: 17, fontWeight: "bold", textAlign: "center" },
    modalDivider: { height: 1, width: "100%" },
    nemoHeader: { flexDirection: "row", alignItems: "center", width: "100%", gap: 8 },
    nemoLabel: { color: C.textHint, fontSize: 12, fontWeight: "bold", letterSpacing: 0.5 },
    customBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    customBadgeText: { fontSize: 11, fontWeight: "bold" },
    nemoText: { color: C.text, fontSize: 15, lineHeight: 24, textAlign: "center", fontStyle: "italic", width: "100%" },
    exampleHint: { color: C.textHint, fontSize: 11, fontStyle: "italic" },
    editStartBtn: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24, width: "100%", alignItems: "center" },
    editStartText: { fontSize: 14, fontWeight: "bold" },
    editInput: { width: "100%", borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 22, minHeight: 100, textAlignVertical: "top" },
    editActions: { flexDirection: "row", gap: 10, width: "100%" },
    editBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
    editBtnTextWhite: { color: "#fff", fontSize: 14, fontWeight: "bold" },
    editBtnText: { fontSize: 14, fontWeight: "bold" },
    resetBtn: { alignItems: "center" },
    resetBtnText: { fontSize: 12, textDecorationLine: "underline" },
    closeBtn: { backgroundColor: C.cardRaised, borderRadius: 12, paddingVertical: 12, alignItems: "center", width: "100%" },
    closeBtnText: { color: C.textDim, fontSize: 14, fontWeight: "bold" },
  });
}
