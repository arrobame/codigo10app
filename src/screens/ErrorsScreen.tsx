import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
    useCallback(() => {
      loadErrors();
    }, [])
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

    Alert.alert(
      "Limpiar historial",
      "¿Borrar todos los registros de errores?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpiar", style: "destructive", onPress: doClear },
      ]
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>Sin registros aún</Text>
        <Text style={styles.emptyText}>
          Completá un quiz para que aquí aparezcan los códigos que más te
          cuestan.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarLabel}>
          {entries.length} código{entries.length !== 1 ? "s" : ""} con errores
        </Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearBtn}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.practiceBtn}
        onPress={() => navigation.navigate("Quiz", {
          mode: "practice",
          direction: "codigo_a_descripcion",
          practiceCodes: entries.slice(0, 5).map(e => e.codigo),
        })}
        activeOpacity={0.85}
      >
        <Text style={styles.practiceBtnIcon}>🧠</Text>
        <Text style={styles.practiceBtnTitle}>Practicar Top {Math.min(5, entries.length)}</Text>
        <Text style={styles.practiceBtnSub}>2 rondas con tus códigos más difíciles</Text>
      </TouchableOpacity>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.codigo}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={[styles.rank, index < 3 && styles.rankTop]}>
              <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.codigoBadge}>
              <Text style={styles.codigoText}>{item.codigo}</Text>
            </View>
            <Text style={styles.descripcion} numberOfLines={2}>
              {item.descripcion}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>✗ {item.count}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    empty: {
      flex: 1,
      backgroundColor: C.bg,
      justifyContent: "center",
      alignItems: "center",
      padding: 36,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: {
      color: C.text,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 8,
    },
    emptyText: {
      color: C.textDim,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      backgroundColor: C.card,
    },
    topBarLabel: { color: C.textDim, fontSize: 13 },
    clearBtn: { color: C.red, fontSize: 13, fontWeight: "bold" },
    practiceBtn: {
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      margin: 12,
      marginBottom: 4,
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 2,
      borderColor: C.yellow,
    },
    practiceBtnIcon: { fontSize: 28 },
    practiceBtnTitle: { color: C.text, fontSize: 15, fontWeight: "bold", textAlign: "center" },
    practiceBtnSub: { color: C.textDim, fontSize: 12, textAlign: "center" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      paddingHorizontal: 14,
      paddingVertical: 13,
      gap: 10,
    },
    rank: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: C.cardRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    rankTop: { backgroundColor: C.yellow },
    rankText: { fontSize: 12, fontWeight: "bold", color: C.textDim },
    rankTextTop: { color: C.black },
    codigoBadge: {
      backgroundColor: C.yellow,
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 5,
      minWidth: 66,
      alignItems: "center",
    },
    codigoText: { color: C.black, fontWeight: "bold", fontSize: 13 },
    descripcion: { flex: 1, fontSize: 13, color: C.textDim, lineHeight: 18 },
    countBadge: {
      backgroundColor: C.wrongBg,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: C.wrongBorder,
      minWidth: 44,
      alignItems: "center",
    },
    countText: { color: C.wrongBorder, fontWeight: "bold", fontSize: 12 },
    separator: { height: 1, backgroundColor: C.border },
  });
}
