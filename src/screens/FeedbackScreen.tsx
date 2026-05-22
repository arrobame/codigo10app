import { useState, useMemo, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, FlatList,
} from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useHomeBack } from "../hooks/useHomeBack";
import { Sounds } from "../utils/sounds";
import {
  FeedbackItem, FeedbackType,
  submitFeedback, subscribeFeedback, markAsRead, hasSentToday,
} from "../utils/feedback";

const OWNER_EMAIL = "delpuertomiguel7@gmail.com";

type AdminTab = "inbox" | "send" | "broadcast";

export default function FeedbackScreen() {
  const { C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C, isDark), [C, isDark]);
  const { user } = useAuth();
  useHomeBack();

  const isOwner = user?.email === OWNER_EMAIL;

  // ── Límite diario ────────────────────────────────────────────
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!user) { setCheckingLimit(false); return; }
    hasSentToday(user.uid).then((reached) => {
      setLimitReached(reached);
      setCheckingLimit(false);
    });
  }, [user]);

  // ── Formulario ──────────────────────────────────────────────
  const [type, setType] = useState<FeedbackType>("problema");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(false);

  async function handleSubmit() {
    if (!user || !message.trim() || limitReached) return;
    setSending(true);
    setSendError(false);
    try {
      await submitFeedback(type, message, user.uid, user.username);
      setMessage("");
      setLimitReached(true);
      setSent(true);
      Sounds.send();
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  }

  // ── Bandeja admin ────────────────────────────────────────────
  const [adminTab, setAdminTab] = useState<AdminTab>(isOwner ? "inbox" : "send");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  useEffect(() => {
    if (!isOwner) return;
    setLoadingInbox(true);
    const unsub = subscribeFeedback((data) => {
      setItems(data);
      setLoadingInbox(false);
    });
    return unsub;
  }, [isOwner]);

  const unread = items.filter((i) => !i.read).length;

  // ── Broadcast ────────────────────────────────────────────────
  const [bTitle, setBTitle] = useState("");
  const [bBody, setBBody] = useState("");
  const [bSending, setBSending] = useState(false);
  const [bSent, setBSent] = useState(false);

  async function handleBroadcast() {
    if (!bTitle.trim() || !bBody.trim() || bSending) return;
    setBSending(true);
    try {
      await addDoc(collection(db, "broadcasts"), {
        title: bTitle.trim(),
        body: bBody.trim(),
        sentBy: user!.uid,
        createdAt: serverTimestamp(),
      });
      setBTitle("");
      setBBody("");
      setBSent(true);
      setTimeout(() => setBSent(false), 4000);
    } finally {
      setBSending(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────
  function renderNotLoggedIn() {
    return (
      <View style={styles.gateContainer}>
        <Text style={styles.gateEmoji}>🔒</Text>
        <Text style={styles.gateTitle}>Iniciá sesión para continuar</Text>
        <Text style={styles.gateText}>
          Solo usuarios registrados pueden enviar reportes o sugerencias.
        </Text>
      </View>
    );
  }

  function renderSentConfirmation() {
    return (
      <View style={styles.confirmContainer}>
        <View style={styles.confirmCircle}>
          <Text style={styles.confirmCheck}>✓</Text>
        </View>
        <Text style={styles.confirmTitle}>¡Gracias por tu mensaje!</Text>
        <Text style={styles.confirmSub}>
          {type === "problema"
            ? "Tu reporte fue recibido. Lo revisaremos pronto."
            : "Tu sugerencia fue recibida. ¡Nos ayuda a mejorar!"}
        </Text>
      </View>
    );
  }

  function renderForm() {
    if (checkingLimit) {
      return <ActivityIndicator style={{ marginTop: 40 }} color={C.yellow} />;
    }

    if (sent) return renderSentConfirmation();

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {limitReached ? (
          <View style={styles.limitBanner}>
            <Text style={styles.limitEmoji}>⏳</Text>
            <View>
              <Text style={styles.limitTitle}>Ya enviaste hoy</Text>
              <Text style={styles.limitSub}>Podés enviar un nuevo mensaje mañana.</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.sectionTitle}>¿Qué querés reportar?</Text>
        )}

        <View style={[styles.typeToggle, limitReached && styles.disabledSection]}>
          <TouchableOpacity
            style={[styles.typeOption, type === "problema" && styles.typeOptionActive]}
            onPress={() => !limitReached && setType("problema")}
            activeOpacity={limitReached ? 1 : 0.8}
          >
            <Text style={[styles.typeText, type === "problema" && styles.typeTextActive]}>
              🐛 Problema
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeOption, type === "sugerencia" && styles.typeOptionActive]}
            onPress={() => !limitReached && setType("sugerencia")}
            activeOpacity={limitReached ? 1 : 0.8}
          >
            <Text style={[styles.typeText, type === "sugerencia" && styles.typeTextActive]}>
              💡 Sugerencia
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, limitReached && styles.inputDisabled]}
          placeholder={
            type === "problema"
              ? "Describí el problema que encontraste..."
              : "Contanos tu idea o sugerencia..."
          }
          placeholderTextColor={C.textHint}
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
          maxLength={1000}
          editable={!limitReached}
        />
        {!limitReached && (
          <Text style={styles.charCount}>{message.length}/1000</Text>
        )}

        <Text style={styles.userHint}>
          Enviando como: <Text style={{ color: C.yellow }}>{user!.username}</Text>
        </Text>

        {sendError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>❌ No se pudo enviar. Revisá tu conexión e intentá de nuevo.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, (limitReached || !message.trim() || sending) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={limitReached || !message.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitBtnText}>Enviar</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderInboxItem({ item }: { item: FeedbackItem }) {
    const date = item.createdAt
      ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("es-PY", {
          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
        })
      : "—";
    return (
      <TouchableOpacity
        style={[styles.inboxRow, !item.read && styles.inboxRowUnread]}
        onPress={() => !item.read && markAsRead(item.id)}
        activeOpacity={0.75}
      >
        <View style={styles.inboxRowHeader}>
          <View style={[styles.typeBadge, item.type === "problema" ? styles.typeBadgeProblema : styles.typeBadgeSugerencia]}>
            <Text style={styles.typeBadgeText}>
              {item.type === "problema" ? "🐛 Problema" : "💡 Sugerencia"}
            </Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.inboxMessage}>{item.message}</Text>
        <Text style={styles.inboxMeta}>
          {item.username ?? item.uid} · {date}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderBroadcast() {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>ENVIAR A TODOS LOS USUARIOS</Text>

        <TextInput
          style={styles.input}
          placeholder="Título de la notificación..."
          placeholderTextColor={C.textHint}
          value={bTitle}
          onChangeText={setBTitle}
          maxLength={80}
        />

        <TextInput
          style={[styles.input, { minHeight: 100 }]}
          placeholder="Mensaje..."
          placeholderTextColor={C.textHint}
          value={bBody}
          onChangeText={setBBody}
          multiline
          textAlignVertical="top"
          maxLength={300}
        />

        {bSent && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Notificación enviada a todos los usuarios.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, (!bTitle.trim() || !bBody.trim() || bSending) && styles.submitBtnDisabled]}
          onPress={handleBroadcast}
          activeOpacity={0.85}
          disabled={!bTitle.trim() || !bBody.trim() || bSending}
        >
          {bSending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitBtnText}>📢 Enviar notificación</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderInbox() {
    if (loadingInbox) {
      return <ActivityIndicator style={{ marginTop: 40 }} color={C.yellow} size="large" />;
    }
    if (items.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>Sin mensajes todavía</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderInboxItem}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {isOwner && (
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, adminTab === "inbox" && styles.tabActive]}
            onPress={() => setAdminTab("inbox")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, adminTab === "inbox" && styles.tabTextActive]}>
              📋 {unread > 0 ? `(${unread})` : "Bandeja"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, adminTab === "send" && styles.tabActive]}
            onPress={() => setAdminTab("send")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, adminTab === "send" && styles.tabTextActive]}>
              📨 Enviar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, adminTab === "broadcast" && styles.tabActive]}
            onPress={() => setAdminTab("broadcast")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, adminTab === "broadcast" && styles.tabTextActive]}>
              📢 Notif.
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!user
        ? renderNotLoggedIn()
        : isOwner && adminTab === "inbox"
          ? renderInbox()
          : isOwner && adminTab === "broadcast"
            ? renderBroadcast()
            : renderForm()
      }
    </View>
  );
}

function makeStyles(C: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    // Gate (no logueado)
    gateContainer: {
      flex: 1, justifyContent: "center", alignItems: "center",
      padding: 32, gap: 12,
    },
    gateEmoji: { fontSize: 48, marginBottom: 4 },
    gateTitle: { color: C.text, fontSize: 17, fontWeight: "bold", textAlign: "center" },
    gateText: { color: C.textDim, fontSize: 14, textAlign: "center", lineHeight: 21 },

    // Tabs (solo admin)
    tabRow: {
      flexDirection: "row",
      margin: 12,
      marginBottom: 4,
      backgroundColor: C.cardRaised,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
    tabActive: { backgroundColor: C.card, elevation: 2 },
    tabText: { color: C.textHint, fontSize: 13, fontWeight: "600" },
    tabTextActive: { color: C.yellow, fontWeight: "700" },

    // Formulario
    scroll: { flex: 1 },
    scrollContent: { padding: 16, gap: 14 },
    sectionTitle: { color: C.textDim, fontSize: 13, fontWeight: "bold", letterSpacing: 0.5 },

    limitBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.cardRaised,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: C.border,
    },
    limitEmoji: { fontSize: 28 },
    limitTitle: { color: C.text, fontSize: 14, fontWeight: "bold" },
    limitSub: { color: C.textHint, fontSize: 12, marginTop: 2 },

    typeToggle: {
      flexDirection: "row",
      backgroundColor: C.cardRaised,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    disabledSection: { opacity: 0.45 },
    typeOption: {
      flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center",
    },
    typeOptionActive: { backgroundColor: C.card, elevation: 2 },
    typeText: { color: C.textHint, fontSize: 13, fontWeight: "600" },
    typeTextActive: { color: C.yellow, fontWeight: "700" },

    input: {
      backgroundColor: C.card,
      borderWidth: 1.5,
      borderColor: C.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: C.text,
      minHeight: 140,
      lineHeight: 22,
    },
    inputDisabled: { opacity: 0.45 },
    charCount: { color: C.textHint, fontSize: 11, textAlign: "right", marginTop: -8 },
    userHint: { color: C.textHint, fontSize: 12 },

    // Confirmación post-envío
    confirmContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 16,
      backgroundColor: C.cardRaised,
    },
    confirmCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#2E7D32",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    confirmCheck: { color: "#fff", fontSize: 40, lineHeight: 48, fontWeight: "bold" },
    confirmTitle: { color: C.text, fontSize: 20, fontWeight: "bold", textAlign: "center" },
    confirmSub: { color: C.textDim, fontSize: 14, textAlign: "center", lineHeight: 22 },

    successBanner: {
      backgroundColor: "#2E7D3222",
      borderWidth: 1,
      borderColor: "#2E7D3288",
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    successText: { color: "#4CAF50", fontSize: 14, fontWeight: "bold" },
    errorBanner: {
      backgroundColor: "#B71C1C22",
      borderWidth: 1,
      borderColor: "#B71C1C88",
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    errorText: { color: "#ef5350", fontSize: 13, fontWeight: "600" },

    submitBtn: {
      backgroundColor: C.red,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 4,
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

    // Bandeja admin
    empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
    emptyEmoji: { fontSize: 48 },
    emptyText: { color: C.textDim, fontSize: 16 },

    inboxRow: { backgroundColor: C.card, padding: 16, gap: 8 },
    inboxRowUnread: { backgroundColor: isDark ? "#1a1a2e" : "#FFF8E1" },
    inboxRowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    typeBadgeProblema: { backgroundColor: "#B71C1C22" },
    typeBadgeSugerencia: { backgroundColor: "#1565C022" },
    typeBadgeText: { fontSize: 12, fontWeight: "bold", color: C.text },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: C.yellow, marginLeft: "auto" as any,
    },
    inboxMessage: { color: C.text, fontSize: 14, lineHeight: 21 },
    inboxMeta: { color: C.textHint, fontSize: 11 },
  });
}
