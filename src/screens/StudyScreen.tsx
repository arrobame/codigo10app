import { useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, TextInput } from "react-native";
import { useHomeBack } from "../hooks/useHomeBack";
import { codigos } from "../data/codigos";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";

export default function StudyScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  useHomeBack();
  const [search, setSearch] = useState("");

  const filtered = codigos.filter(
    (c) =>
      c.codigo.includes(search) ||
      c.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar código o descripción..."
        placeholderTextColor={C.textHint}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.codigo}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.codigoBadge}>
              <Text style={styles.codigoText}>{item.codigo}</Text>
            </View>
            <Text style={styles.descripcion}>{item.descripcion}</Text>
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
    search: {
      margin: 12,
      padding: 12,
      backgroundColor: C.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
      fontSize: 15,
      color: C.text,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
    },
    codigoBadge: {
      backgroundColor: C.yellow,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      minWidth: 72,
      alignItems: "center",
    },
    codigoText: {
      color: C.black,
      fontWeight: "bold",
      fontSize: 14,
    },
    descripcion: {
      flex: 1,
      fontSize: 14,
      color: C.textDim,
      lineHeight: 20,
    },
    separator: {
      height: 1,
      backgroundColor: C.border,
    },
  });
}
