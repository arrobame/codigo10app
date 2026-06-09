import { useMemo, useState, useCallback } from "react";
import { View, Text, SectionList, StyleSheet, ScrollView } from "react-native";
import { Searchbar, Portal, Dialog, Button, TouchableRipple, TextInput } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useHomeBack } from "../hooks/useHomeBack";
import { codigos, Codigo } from "../data/codigos";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import Icon, { MaterialIconName } from "../components/Icon";
import {
  getCustomNemotecnias,
  setCustomNemotecnia,
  deleteCustomNemotecnia,
} from "../utils/nemotecnias";

const SECTIONS: { title: string; icon: MaterialIconName; range: [number, number] }[] = [
  { title: "Informaciones necesarias",  icon: "settings-input-antenna", range: [0,  35] },
  { title: "Informaciones de Servicio", icon: "fire-truck",             range: [40, 69] },
  { title: "Situaciones de emergencia", icon: "warning",                range: [70, 79] },
  { title: "Informaciones de apoyo",    icon: "handshake",              range: [80, 99] },
];

function codigoNum(c: Codigo) { return parseInt(c.codigo.split("-")[1]); }
function pad(n: number) { return String(n).padStart(2, "0"); }

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

  const effectiveNemo = selected ? (customMap[selected.codigo] ?? selected.nemotecnia ?? "") : "";
  const isCustom = selected ? !!customMap[selected.codigo] : false;

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <Searchbar
        placeholder="Buscar código o descripción..."
        value={search}
        onChangeText={setSearch}
        style={[styles.searchBar, { backgroundColor: C.card }]}
        inputStyle={{ color: C.text }}
        iconColor={C.textHint}
        placeholderTextColor={C.textHint}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.codigo}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: C.border }]} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderSectionHeader={({ section }) => {
          const isOpen = isSearching || expanded.has(section.title);
          const total = allSections.find((s) => s.title === section.title)?.data.length ?? 0;
          return (
            <TouchableRipple
              onPress={() => toggleSection(section.title)}
              style={[styles.sectionHeader, { backgroundColor: C.card, borderLeftColor: C.yellow }]}
            >
              <View style={styles.sectionHeaderInner}>
                <Icon name={section.icon} size={22} color={C.yellow} />
                <View style={styles.sectionHeaderMid}>
                  <Text style={[styles.sectionTitle, { color: C.text }]}>{section.title}</Text>
                  <Text style={[styles.sectionMeta, { color: C.textHint }]}>
                    {total} {total === 1 ? "código" : "códigos"} · del {pad(section.range[0])} al {pad(section.range[1])}
                  </Text>
                </View>
                <Icon name={isOpen ? "expand-less" : "expand-more"} size={24} color={C.textHint} />
              </View>
            </TouchableRipple>
          );
        }}
        renderSectionFooter={({ section }) =>
          isSearching || expanded.has(section.title) ? <View style={[styles.sectionFooter, { backgroundColor: C.bg }]} /> : null
        }
        renderItem={({ item }) => {
          const hasNemo = !!(item.nemotecnia || customMap[item.codigo]);
          const hasCustom = !!customMap[item.codigo];
          return (
            <TouchableRipple
              onPress={() => openModal(item)}
              style={[styles.row, { backgroundColor: C.card, borderLeftColor: C.border }]}
            >
              <View style={styles.rowInner}>
                <View style={[styles.codigoBadge, { backgroundColor: C.cardRaised, borderColor: C.border }]}>
                  <Text style={[styles.codigoText, { color: C.yellow }]}>{item.codigo}</Text>
                </View>
                <Text style={[styles.descripcion, { color: C.textDim }]}>{item.descripcion}</Text>
                {hasNemo && (
                  <Icon name={hasCustom ? "edit" : "psychology"} size={16} color={hasCustom ? C.yellow : C.textHint} />
                )}
              </View>
            </TouchableRipple>
          );
        }}
      />

      <Portal>
        <Dialog visible={selected !== null} onDismiss={closeModal} style={[styles.dialog, { backgroundColor: C.card }]}>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0, maxHeight: 500 }}>
            <ScrollView contentContainerStyle={{ padding: 24, gap: 12, alignItems: "center" }}>
              {selected && (
                <>
                  <View style={[styles.modalBadge, { backgroundColor: C.yellow }]}>
                    <Text style={styles.modalCodigo}>{selected.codigo}</Text>
                  </View>
                  <Text style={[styles.modalDesc, { color: C.text }]}>{selected.descripcion}</Text>
                  <View style={[styles.modalDivider, { backgroundColor: C.border }]} />

                  <View style={styles.nemoHeader}>
                    <Icon name="psychology" size={15} color={C.textHint} />
                    <Text style={[styles.nemoLabel, { color: C.textHint }]}>Nemotecnia</Text>
                    {isCustom && (
                      <View style={[styles.customBadge, { backgroundColor: C.yellow + "1A", borderColor: C.yellow + "66" }]}>
                        <Text style={[styles.customBadgeText, { color: C.yellow }]}>Personalizada</Text>
                      </View>
                    )}
                  </View>

                  {editing ? (
                    <>
                      <TextInput
                        mode="outlined"
                        value={editText}
                        onChangeText={setEditText}
                        multiline
                        autoFocus
                        placeholder="Escribí tu propia nemotecnia..."
                        style={[styles.editInput, { width: "100%" }]}
                        activeOutlineColor={C.yellow}
                        outlineColor={C.border}
                        textColor={C.text}
                      />
                      <View style={[styles.editActions, { width: "100%" }]}>
                        <Button
                          mode="contained"
                          onPress={saveEdit}
                          style={{ flex: 1, borderRadius: 12 }}
                        >
                          Guardar
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => setEditing(false)}
                          style={{ flex: 1, borderRadius: 12 }}
                          textColor={C.textDim}
                        >
                          Cancelar
                        </Button>
                      </View>
                      {isCustom && (
                        <Button onPress={resetToDefault} textColor={C.textHint} compact>
                          Restablecer ejemplo original
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {effectiveNemo ? (
                        <>
                          <Text style={[styles.nemoText, { color: C.text }]}>{effectiveNemo}</Text>
                          {!isCustom && (
                            <Text style={[styles.exampleHint, { color: C.textHint }]}>Ejemplo — podés personalizarla</Text>
                          )}
                        </>
                      ) : (
                        <Text style={[styles.exampleHint, { color: C.textHint }]}>Sin nemotecnia todavía — ¡creá la tuya!</Text>
                      )}
                      <Button
                        mode="outlined"
                        icon="pencil"
                        onPress={startEditing}
                        style={[styles.editStartBtn, { borderColor: C.yellow, width: "100%" }]}
                        textColor={C.yellow}
                      >
                        {isCustom ? "Editar mi nemotecnia" : "Crear mi nemotecnia"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeModal} textColor={C.textDim}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    searchBar: { margin: 12, borderRadius: 12 },
    sectionHeader: { borderLeftWidth: 3 },
    sectionHeaderInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
    sectionHeaderMid: { flex: 1 },
    sectionTitle: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
    sectionMeta: { fontSize: 12, marginTop: 2 },
    sectionFooter: { height: 8 },
    separator: { height: 1 },
    row: { borderLeftWidth: 3 },
    rowInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
    codigoBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 72, alignItems: "center", borderWidth: 1 },
    codigoText: { fontWeight: "bold", fontSize: 13 },
    descripcion: { flex: 1, fontSize: 14, lineHeight: 20 },
    dialog: { alignSelf: "center", width: "90%", maxWidth: 380, borderRadius: 20, maxHeight: "85%" as any },
    modalBadge: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
    modalCodigo: { color: C.onAccent, fontSize: 24, fontWeight: "bold" },
    modalDesc: { fontSize: 17, fontWeight: "bold", textAlign: "center" },
    modalDivider: { height: 1, width: "100%" },
    nemoHeader: { flexDirection: "row", alignItems: "center", width: "100%", gap: 6 },
    nemoLabel: { fontSize: 12, fontWeight: "bold", letterSpacing: 0.5 },
    customBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 4 },
    customBadgeText: { fontSize: 11, fontWeight: "bold" },
    nemoText: { fontSize: 15, lineHeight: 24, textAlign: "center", fontStyle: "italic", width: "100%" },
    exampleHint: { fontSize: 11, fontStyle: "italic" },
    editStartBtn: { borderWidth: 1.5, borderRadius: 12 },
    editInput: { minHeight: 100 },
    editActions: { flexDirection: "row", gap: 10 },
  });
}
