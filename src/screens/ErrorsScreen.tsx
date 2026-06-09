import { useState, useCallback, useMemo } from "react";
import { View, Text, FlatList, StyleSheet, Platform } from "react-native";
import { Button, Surface, TouchableRipple, Divider } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Icon from "../components/Icon";
import { getErrors, clearErrors } from "../utils/storage";
import { useHomeBack } from "../hooks/useHomeBack";
import { codigos } from "../data/codigos";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { NavigationProp } from "../types";

interface ErrorEntry {
  codigo: string;
  descripcion: string;
  count: number;
}

export default function ErrorsScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const navigation = useNavigation<NavigationProp>();
  const [entries, setEntries] = useState<ErrorEntry[]>([]);

  useHomeBack();

  useFocusEffect(
    useCallback(() => { loadErrors(); }, [])
  );

  async function loadErrors() {
    const errors = await getErrors();
    const list: ErrorEntry[] = Object.entries(errors)
      .map(([codigo, count]) => ({
        codigo,
        descripcion: codigos.find((c) => c.codigo === codigo)?.descripcion ?? "Código desconocido",
        count,
      }))
      .sort((a, b) => b.count - a.count);
    setEntries(list);
  }

  function handleClear() {
    const doClear = async () => {
      await clearErrors();
      setEntries([]);
    };
    if (Platform.OS === "web") {
      if (window.confirm("¿Borrar todos los registros de errores?")) doClear();
      return;
    }
    const Alert = require("react-native").Alert;
    Alert.alert("Limpiar historial", "¿Borrar todos los registros de errores?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpiar", style: "destructive", onPress: doClear },
    ]);
  }

  if (entries.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: C.bg }]}>
        <Icon name="bar-chart" size={56} color={C.textHint} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyTitle, { color: C.text }]}>Sin registros aún</Text>
        <Text style={[styles.emptyText, { color: C.textDim }]}>
          Completá un quiz para que aquí aparezcan los códigos que más te cuestan.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <Surface style={[styles.topBar, { backgroundColor: C.card, borderBottomColor: C.border }]} elevation={0}>
        <Text style={[styles.topBarLabel, { color: C.textDim }]}>
          {entries.length} código{entries.length !== 1 ? "s" : ""} con errores
        </Text>
        <Button onPress={handleClear} textColor={C.red} compact mode="text">Limpiar</Button>
      </Surface>

      <Surface style={[styles.practiceCard, { backgroundColor: C.card, borderColor: C.yellow }]} elevation={0}>
        <TouchableRipple
          onPress={() => navigation.navigate("Quiz", {
            mode: "practice",
            direction: "codigo_a_descripcion",
            practiceCodes: entries.slice(0, 5).map(e => e.codigo),
          })}
          style={styles.practiceTouch}
          borderless
        >
          <View style={styles.practiceInner}>
            <Icon name="psychology" size={28} color={C.yellow} />
            <Text style={[styles.practiceBtnTitle, { color: C.text }]}>Practicar Top {Math.min(5, entries.length)}</Text>
            <Text style={[styles.practiceBtnSub, { color: C.textDim }]}>2 rondas con tus códigos más difíciles</Text>
          </View>
        </TouchableRipple>
      </Surface>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.codigo}
        ItemSeparatorComponent={() => <Divider style={{ backgroundColor: C.border }} />}
        renderItem={({ item, index }) => (
          <Surface style={[styles.row, { backgroundColor: C.card }]} elevation={0}>
            <View style={[styles.rank, { backgroundColor: C.cardRaised }, index < 3 && { backgroundColor: C.yellow }]}>
              <Text style={[styles.rankText, { color: C.textDim }, index < 3 && { color: C.onAccent }]}>
                {index + 1}
              </Text>
            </View>
            <View style={[styles.codigoBadge, { backgroundColor: C.cardRaised, borderColor: C.border }]}>
              <Text style={[styles.codigoText, { color: C.yellow }]}>{item.codigo}</Text>
            </View>
            <Text style={[styles.descripcion, { color: C.textDim }]} numberOfLines={2}>
              {item.descripcion}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: C.wrongBg, borderColor: C.wrongBorder }]}>
              <Text style={[styles.countText, { color: C.wrongBorder }]}>✗ {item.count}</Text>
            </View>
          </Surface>
        )}
      />
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    empty: {
      flex: 1, justifyContent: "center", alignItems: "center", padding: 36,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
    topBar: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 4,
      borderBottomWidth: 1,
    },
    topBarLabel: { fontSize: 13 },
    practiceCard: {
      margin: 12, marginBottom: 4,
      borderRadius: 14, borderWidth: 2, overflow: "hidden",
    },
    practiceTouch: { borderRadius: 14 },
    practiceInner: {
      alignItems: "center", justifyContent: "center",
      gap: 6, padding: 14,
    },
    practiceBtnIcon: { fontSize: 28 },
    practiceBtnTitle: { fontSize: 15, fontWeight: "bold", textAlign: "center" },
    practiceBtnSub: { fontSize: 12, textAlign: "center" },
    row: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, paddingVertical: 13, gap: 10,
    },
    rank: {
      width: 26, height: 26, borderRadius: 13,
      alignItems: "center", justifyContent: "center",
    },
    rankText: { fontSize: 12, fontWeight: "bold" },
    codigoBadge: {
      borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5,
      minWidth: 66, alignItems: "center", borderWidth: 1,
    },
    codigoText: { fontWeight: "bold", fontSize: 13 },
    descripcion: { flex: 1, fontSize: 13, lineHeight: 18 },
    countBadge: {
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
      borderWidth: 1, minWidth: 44, alignItems: "center",
    },
    countText: { fontWeight: "bold", fontSize: 12 },
  });
}
