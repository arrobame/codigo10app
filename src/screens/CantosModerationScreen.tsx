import { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Platform } from "react-native";
import { Button, TextInput, Surface, Divider } from "react-native-paper";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useHomeBack } from "../hooks/useHomeBack";
import Icon from "../components/Icon";
import {
  Canto, OWNER_EMAIL,
  subscribePendingCantos, acceptCanto, rejectCanto, updateCantoFields,
} from "../utils/cantos";

export default function CantosModerationScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuth();
  const isOwner = user?.email === OWNER_EMAIL;
  useHomeBack();

  const [pending, setPending] = useState<Canto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLetra, setEditLetra] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) { setLoading(false); return; }
    const unsub = subscribePendingCantos((list) => { setPending(list); setLoading(false); });
    return unsub;
  }, [isOwner]);

  if (!isOwner) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Icon name="block" size={48} color={C.textHint} style={{ marginBottom: 12 }} />
        <Text style={[styles.emptyTitle, { color: C.text }]}>No autorizado</Text>
      </View>
    );
  }

  function startEdit(c: Canto) {
    setEditingId(c.id);
    setEditTitle(c.title);
    setEditLetra(c.letra);
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim() || !editLetra.trim()) return;
    setBusyId(id);
    try {
      await updateCantoFields(id, { title: editTitle, letra: editLetra });
      setEditingId(null);
    } finally { setBusyId(null); }
  }

  async function accept(id: string) {
    setBusyId(id);
    try { await acceptCanto(id); } finally { setBusyId(null); }
  }

  function reject(id: string) {
    const doReject = async () => {
      setBusyId(id);
      try { await rejectCanto(id); } finally { setBusyId(null); }
    };
    if (Platform.OS === "web") {
      if (window.confirm("¿Rechazar este canto? No se mostrará a los usuarios.")) doReject();
      return;
    }
    const Alert = require("react-native").Alert;
    Alert.alert("Rechazar canto", "¿Rechazar este canto?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Rechazar", style: "destructive", onPress: doReject },
    ]);
  }

  function renderItem({ item }: { item: Canto }) {
    const isEditing = editingId === item.id;
    const busy = busyId === item.id;
    return (
      <Surface style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]} elevation={0}>
        {isEditing ? (
          <View style={{ gap: 8 }}>
            <TextInput
              mode="outlined" value={editTitle} onChangeText={setEditTitle} maxLength={80}
              activeOutlineColor={C.yellow} outlineColor={C.border} textColor={C.text}
            />
            <TextInput
              mode="outlined" value={editLetra} onChangeText={setEditLetra} multiline maxLength={2000}
              style={{ minHeight: 160 }} activeOutlineColor={C.yellow} outlineColor={C.border} textColor={C.text}
            />
            <View style={styles.row}>
              <Button mode="contained" onPress={() => saveEdit(item.id)} disabled={busy} loading={busy} style={styles.flexBtn}>
                Guardar
              </Button>
              <Button mode="outlined" onPress={() => setEditingId(null)} textColor={C.textDim} style={styles.flexBtn}>
                Cancelar
              </Button>
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: C.text }]}>{item.title}</Text>
            {item.submittedByName ? (
              <Text style={[styles.sub, { color: C.textHint }]}>sugerido por {item.submittedByName}</Text>
            ) : null}
            <Text style={[styles.letra, { color: C.textDim }]}>{item.letra}</Text>
            <View style={styles.row}>
              <Button mode="contained" icon="check" onPress={() => accept(item.id)} disabled={busy} loading={busy} style={styles.flexBtn}>
                Aceptar
              </Button>
              <Button mode="outlined" icon="pencil" onPress={() => startEdit(item)} textColor={C.yellow} style={styles.flexBtn}>
                Editar
              </Button>
            </View>
            <Button mode="text" icon="close" onPress={() => reject(item.id)} textColor={C.red} compact>
              Rechazar
            </Button>
          </>
        )}
      </Surface>
    );
  }

  if (!loading && pending.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Icon name="inbox" size={48} color={C.textHint} style={{ marginBottom: 12 }} />
        <Text style={[styles.emptyTitle, { color: C.text }]}>Sin cantos pendientes</Text>
        <Text style={[styles.emptyText, { color: C.textDim }]}>Cuando alguien sugiera un canto, aparecerá acá.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <Divider style={{ backgroundColor: "transparent", height: 12 }} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
    title: { fontSize: 16, fontWeight: "700" },
    sub: { fontSize: 11 },
    letra: { fontSize: 14, lineHeight: 22, marginTop: 4, marginBottom: 6 },
    row: { flexDirection: "row", gap: 10, marginTop: 4 },
    flexBtn: { flex: 1, borderRadius: 12 },
    emptyTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
    emptyText: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  });
}
