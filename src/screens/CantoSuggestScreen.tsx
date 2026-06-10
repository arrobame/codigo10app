import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useHomeBack } from "../hooks/useHomeBack";
import Icon from "../components/Icon";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { submitCanto } from "../utils/cantos";

export default function CantoSuggestScreen() {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuth();
  useHomeBack();

  const [title, setTitle] = useState("");
  const [letra, setLetra] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit() {
    if (!user || !title.trim() || !letra.trim()) return;
    setSending(true);
    setError(false);
    try {
      await submitCanto(title, letra, user.uid, user.username);
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <View style={[styles.gate, { backgroundColor: C.bg }]}>
        <Icon name="lock" size={48} color={C.textHint} style={{ marginBottom: 4 }} />
        <Text style={[styles.gateTitle, { color: C.text }]}>Iniciá sesión para sugerir</Text>
        <Text style={[styles.gateText, { color: C.textDim }]}>
          Solo usuarios registrados pueden enviar cantos.
        </Text>
        <View style={{ marginTop: 8 }}>
          <GoogleSignInButton />
        </View>
      </View>
    );
  }

  if (sent) {
    return (
      <View style={[styles.gate, { backgroundColor: C.bg }]}>
        <View style={[styles.confirmCircle, { backgroundColor: C.correctBorder }]}>
          <Icon name="check" size={40} color="#fff" />
        </View>
        <Text style={[styles.gateTitle, { color: C.text }]}>¡Gracias por tu canto!</Text>
        <Text style={[styles.gateText, { color: C.textDim }]}>
          Lo revisaremos pronto. Si se aprueba, aparecerá en la lista para todos.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: C.bg }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.label, { color: C.textDim }]}>Título del canto</Text>
      <TextInput
        mode="outlined"
        placeholder="Ej: Suena la corneta"
        value={title}
        onChangeText={setTitle}
        maxLength={80}
        activeOutlineColor={C.yellow}
        outlineColor={C.border}
        textColor={C.text}
      />

      <Text style={[styles.label, { color: C.textDim }]}>Letra</Text>
      <Text style={[styles.hint, { color: C.textHint }]}>
        Escribí la letra completa. Si es de llamada y respuesta, podés repetir cada frase en la línea siguiente.
      </Text>
      <TextInput
        mode="outlined"
        placeholder={"Suena la corneta\nSuena la corneta\ny salimos al trote\ny salimos al trote"}
        value={letra}
        onChangeText={setLetra}
        multiline
        maxLength={2000}
        style={styles.letraInput}
        activeOutlineColor={C.yellow}
        outlineColor={C.border}
        textColor={C.text}
      />
      <Text style={[styles.userHint, { color: C.textHint }]}>
        Enviando como: <Text style={{ color: C.yellow }}>{user.username}</Text>
      </Text>

      {error && (
        <Text style={styles.errorText}>No se pudo enviar. Revisá tu conexión e intentá de nuevo.</Text>
      )}

      <Button
        mode="contained"
        icon="send"
        onPress={handleSubmit}
        disabled={!title.trim() || !letra.trim() || sending}
        loading={sending}
        style={styles.submitBtn}
        contentStyle={{ paddingVertical: 6 }}
      >
        Enviar sugerencia
      </Button>
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 16, gap: 8 },
    label: { fontSize: 13, fontWeight: "bold", marginTop: 8 },
    hint: { fontSize: 12, lineHeight: 17 },
    letraInput: { minHeight: 200 },
    userHint: { fontSize: 12, marginTop: 4 },
    errorText: { color: "#ef5350", fontSize: 13, fontWeight: "600", marginTop: 4 },
    submitBtn: { borderRadius: 14, marginTop: 12 },
    gate: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
    gateTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
    gateText: { fontSize: 14, textAlign: "center", lineHeight: 21 },
    confirmCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  });
}
