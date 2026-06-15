import { useState, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { Button, TextInput, SegmentedButtons, Surface, TouchableRipple, Divider } from "react-native-paper";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import Icon from "../components/Icon";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useHomeBack } from "../hooks/useHomeBack";
import { Sounds } from "../utils/sounds";
import {
  FeedbackItem, FeedbackType,
  submitFeedback, subscribeFeedback, markAsRead, hasSentToday,
} from "../utils/feedback";
import {
  ApodoRequest, subscribeApodoRequests, approveApodoRequest, rejectApodoRequest,
  NameRequest, subscribeNameRequests, approveNameRequest, rejectNameRequest,
} from "../utils/scores";

const OWNER_EMAIL = "delpuertomiguel7@gmail.com";
type AdminTab = "inbox" | "send" | "broadcast" | "moderar";

export default function FeedbackScreen() {
  const { C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C, isDark), [C, isDark]);
  const { user } = useAuth();
  useHomeBack();

  const isOwner = user?.email === OWNER_EMAIL;

  const [checkingLimit, setCheckingLimit] = useState(true);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!user) { setCheckingLimit(false); return; }
    hasSentToday(user.uid).then((reached) => {
      setLimitReached(reached);
      setCheckingLimit(false);
    });
  }, [user]);

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

  const [adminTab, setAdminTab] = useState<AdminTab>(isOwner ? "inbox" : "send");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  useEffect(() => {
    if (!isOwner) return;
    setLoadingInbox(true);
    const unsub = subscribeFeedback((data) => { setItems(data); setLoadingInbox(false); });
    return unsub;
  }, [isOwner]);

  const unread = items.filter((i) => !i.read).length;

  const [apodoReqs, setApodoReqs] = useState<ApodoRequest[]>([]);
  const [nameReqs, setNameReqs] = useState<NameRequest[]>([]);
  useEffect(() => {
    if (!isOwner) return;
    const u1 = subscribeApodoRequests(setApodoReqs);
    const u2 = subscribeNameRequests(setNameReqs);
    return () => { u1(); u2(); };
  }, [isOwner]);

  const pendingMod = nameReqs.length + apodoReqs.length;

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

  function renderNotLoggedIn() {
    return (
      <View style={[styles.gateContainer]}>
        <Icon name="lock" size={48} color={C.textHint} style={{ marginBottom: 4 }} />
        <Text style={[styles.gateTitle, { color: C.text }]}>Iniciá sesión para continuar</Text>
        <Text style={[styles.gateText, { color: C.textDim }]}>
          Solo usuarios registrados pueden enviar reportes o sugerencias.
        </Text>
      </View>
    );
  }

  function renderSentConfirmation() {
    return (
      <View style={[styles.confirmContainer, { backgroundColor: C.cardRaised }]}>
        <View style={[styles.confirmCircle, { backgroundColor: C.correctBorder }]}>
          <Icon name="check" size={40} color="#fff" />
        </View>
        <Text style={[styles.confirmTitle, { color: C.text }]}>¡Gracias por tu mensaje!</Text>
        <Text style={[styles.confirmSub, { color: C.textDim }]}>
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
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent]} keyboardShouldPersistTaps="handled">
        {limitReached ? (
          <Surface style={[styles.limitBanner, { backgroundColor: C.cardRaised, borderColor: C.border }]} elevation={0}>
            <Icon name="hourglass-empty" size={26} color={C.textDim} />
            <View>
              <Text style={[styles.limitTitle, { color: C.text }]}>Ya enviaste hoy</Text>
              <Text style={[styles.limitSub, { color: C.textHint }]}>Podés enviar un nuevo mensaje mañana.</Text>
            </View>
          </Surface>
        ) : (
          <Text style={[styles.sectionTitle, { color: C.textDim }]}>¿Qué querés reportar?</Text>
        )}

        <SegmentedButtons
          value={type}
          onValueChange={(v) => !limitReached && setType(v as FeedbackType)}
          style={limitReached ? { opacity: 0.45 } : undefined}
          buttons={[
            { value: "problema", label: "Problema", icon: "bug-outline" },
            { value: "sugerencia", label: "Sugerencia", icon: "lightbulb-outline" },
          ]}
        />

        <TextInput
          mode="outlined"
          placeholder={
            type === "problema"
              ? "Describí el problema que encontraste..."
              : "Contanos tu idea o sugerencia..."
          }
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          editable={!limitReached}
          style={[styles.input, limitReached && { opacity: 0.45 }]}
          activeOutlineColor={C.yellow}
          outlineColor={C.border}
          textColor={C.text}
        />
        {!limitReached && (
          <Text style={[styles.charCount, { color: C.textHint }]}>{message.length}/1000</Text>
        )}

        <Text style={[styles.userHint, { color: C.textHint }]}>
          Enviando como: <Text style={{ color: C.yellow }}>{user!.username}</Text>
        </Text>

        {sendError && (
          <Surface style={[styles.errorBanner, { backgroundColor: C.wrongBg, borderColor: C.wrongBorder + "88" }]} elevation={0}>
            <Icon name="error-outline" size={16} color="#ef5350" />
            <Text style={{ flex: 1, color: "#ef5350", fontSize: 13, fontWeight: "600" }}>
              No se pudo enviar. Revisá tu conexión e intentá de nuevo.
            </Text>
          </Surface>
        )}

        <Button
          mode="contained"
          icon="send"
          onPress={handleSubmit}
          disabled={limitReached || !message.trim() || sending}
          loading={sending}
          style={[styles.submitBtn]}
          contentStyle={{ paddingVertical: 6 }}
        >
          Enviar
        </Button>
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
      <TouchableRipple
        style={[styles.inboxRow, { backgroundColor: C.card }, !item.read && { backgroundColor: C.yellow + "12" }]}
        onPress={() => !item.read && markAsRead(item.id)}
      >
        <View style={{ gap: 8 }}>
          <View style={styles.inboxRowHeader}>
            <View style={[styles.typeBadge, { backgroundColor: C.cardRaised }]}>
              <Icon name={item.type === "problema" ? "bug-report" : "lightbulb"} size={13} color={C.textDim} />
              <Text style={[styles.typeBadgeText, { color: C.textDim }]}>
                {item.type === "problema" ? "Problema" : "Sugerencia"}
              </Text>
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: C.yellow }]} />}
          </View>
          <Text style={[styles.inboxMessage, { color: C.text }]}>{item.message}</Text>
          <Text style={[styles.inboxMeta, { color: C.textHint }]}>{item.username ?? item.uid} · {date}</Text>
        </View>
      </TouchableRipple>
    );
  }

  function renderBroadcast() {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionTitle, { color: C.textDim }]}>ENVIAR A TODOS LOS USUARIOS</Text>
        <TextInput
          mode="outlined"
          placeholder="Título de la notificación..."
          value={bTitle}
          onChangeText={setBTitle}
          maxLength={80}
          activeOutlineColor={C.yellow}
          outlineColor={C.border}
          textColor={C.text}
        />
        <TextInput
          mode="outlined"
          placeholder="Mensaje..."
          value={bBody}
          onChangeText={setBBody}
          multiline
          maxLength={300}
          style={{ minHeight: 100 }}
          activeOutlineColor={C.yellow}
          outlineColor={C.border}
          textColor={C.text}
        />
        {bSent && (
          <Surface style={[styles.successBanner, { backgroundColor: C.correctBg, borderColor: C.correctBorder + "88" }]} elevation={0}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={{ flex: 1, color: "#4CAF50", fontSize: 14, fontWeight: "bold" }}>Notificación enviada a todos los usuarios.</Text>
          </Surface>
        )}
        <Button
          mode="contained"
          icon="bullhorn"
          onPress={handleBroadcast}
          disabled={!bTitle.trim() || !bBody.trim() || bSending}
          loading={bSending}
          style={styles.submitBtn}
          contentStyle={{ paddingVertical: 6 }}
        >
          Enviar notificación
        </Button>
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
          <Icon name="inbox" size={48} color={C.textHint} />
          <Text style={[styles.emptyText, { color: C.textDim }]}>Sin mensajes todavía</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderInboxItem}
        ItemSeparatorComponent={() => <Divider style={{ backgroundColor: C.border }} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    );
  }

  function renderModeration() {
    type ModItem = {
      key: string; type: "nombre" | "apodo"; who: string; value: string;
      onApprove: () => void; onReject: () => void;
    };
    const items: ModItem[] = [
      ...nameReqs.map((r) => ({
        key: `n_${r.uid}`, type: "nombre" as const, who: r.currentName, value: r.requestedName,
        onApprove: () => approveNameRequest(r.uid, r.requestedName), onReject: () => rejectNameRequest(r.uid),
      })),
      ...apodoReqs.map((r) => ({
        key: `a_${r.uid}`, type: "apodo" as const, who: r.username, value: r.apodo,
        onApprove: () => approveApodoRequest(r.uid, r.apodo), onReject: () => rejectApodoRequest(r.uid),
      })),
    ];
    if (items.length === 0) {
      return (
        <View style={styles.empty}>
          <Icon name="gavel" size={48} color={C.textHint} />
          <Text style={[styles.emptyText, { color: C.textDim }]}>Sin solicitudes pendientes</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={items}
        keyExtractor={(it) => it.key}
        ItemSeparatorComponent={() => <Divider style={{ backgroundColor: C.border }} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Surface style={[styles.inboxRow, { backgroundColor: C.card }]} elevation={0}>
            <View style={{ gap: 10 }}>
              <View style={[styles.typeBadge, { backgroundColor: C.cardRaised, alignSelf: "flex-start" }]}>
                <Icon name={item.type === "nombre" ? "badge" : "label"} size={13} color={C.textDim} />
                <Text style={[styles.typeBadgeText, { color: C.textDim }]}>{item.type === "nombre" ? "NOMBRE" : "APODO"}</Text>
              </View>
              <Text style={[styles.inboxMessage, { color: C.text }]}>
                <Text style={{ color: C.textDim }}>{item.who}</Text>
                {item.type === "nombre" ? " quiere llamarse: " : " solicitó el apodo: "}
                <Text style={{ fontWeight: "bold", color: C.yellow }}>{item.value}</Text>
              </Text>
              <View style={styles.apodoActions}>
                <Button mode="contained" icon="check" compact onPress={item.onApprove} style={styles.apodoBtn}>Aprobar</Button>
                <Button mode="outlined" icon="close" compact textColor={C.red} onPress={item.onReject} style={styles.apodoBtn}>Rechazar</Button>
              </View>
            </View>
          </Surface>
        )}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {isOwner && (
        <SegmentedButtons
          value={adminTab}
          onValueChange={(v) => setAdminTab(v as AdminTab)}
          style={{ margin: 12, marginBottom: 4 }}
          buttons={[
            { value: "inbox", label: unread > 0 ? `(${unread})` : "Bandeja", icon: "inbox" },
            { value: "send", label: "Enviar", icon: "email-outline" },
            { value: "broadcast", label: "Notif.", icon: "bullhorn" },
            { value: "moderar", label: pendingMod > 0 ? `(${pendingMod})` : "Moderar", icon: "gavel" },
          ]}
        />
      )}

      {!user
        ? renderNotLoggedIn()
        : isOwner && adminTab === "inbox"
          ? renderInbox()
          : isOwner && adminTab === "broadcast"
            ? renderBroadcast()
            : isOwner && adminTab === "moderar"
              ? renderModeration()
              : renderForm()
      }
    </View>
  );
}

function makeStyles(C: ThemeColors, _isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    gateContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
    gateEmoji: { fontSize: 48, marginBottom: 4 },
    gateTitle: { fontSize: 17, fontWeight: "bold", textAlign: "center" },
    gateText: { fontSize: 14, textAlign: "center", lineHeight: 21 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, gap: 14 },
    sectionTitle: { fontSize: 13, fontWeight: "bold", letterSpacing: 0.5 },
    limitBanner: {
      flexDirection: "row", alignItems: "center", gap: 12,
      borderRadius: 12, padding: 14, borderWidth: 1,
    },
    limitEmoji: { fontSize: 28 },
    limitTitle: { fontSize: 14, fontWeight: "bold" },
    limitSub: { fontSize: 12, marginTop: 2 },
    input: { minHeight: 140 },
    charCount: { fontSize: 11, textAlign: "right", marginTop: -8 },
    userHint: { fontSize: 12 },
    confirmContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
    confirmCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 8 },
    confirmCheck: { color: "#fff", fontSize: 40, lineHeight: 48, fontWeight: "bold" },
    confirmTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
    confirmSub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
    successBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1 },
    errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1 },
    submitBtn: { borderRadius: 14 },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 16 },
    inboxRow: { padding: 16 },
    inboxRowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    typeBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    typeBadgeText: { fontSize: 12, fontWeight: "bold" },
    unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: "auto" as any },
    inboxMessage: { fontSize: 14, lineHeight: 21 },
    inboxMeta: { fontSize: 11 },
    apodoActions: { flexDirection: "row", gap: 10 },
    apodoBtn: { flex: 1, borderRadius: 12 },
  });
}
