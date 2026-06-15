import { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import { Canto, OWNER_EMAIL, subscribeAcceptedCantos, subscribePendingCantos } from "../utils/cantos";
import { fetchUsernames } from "../utils/scores";

export default function CantosScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuth();
  const isOwner = user?.email === OWNER_EMAIL;

  const [cantos, setCantos] = useState<Canto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = subscribeAcceptedCantos((list) => { setCantos(list); setLoading(false); });
    return unsub;
  }, []);

  // Resolver el nombre actual de cada autor (puede haber cambiado tras sugerir el canto).
  useEffect(() => {
    const uids = cantos.map((c) => c.submittedBy).filter(Boolean);
    if (uids.length === 0) return;
    fetchUsernames(uids).then(setNameMap);
  }, [cantos]);

  useEffect(() => {
    if (!isOwner) return;
    const unsub = subscribePendingCantos((list) => setPendingCount(list.length));
    return unsub;
  }, [isOwner]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Cantos para marchar al trote. ¿Sabés uno que no está? Sugerilo y, una vez aprobado,
        aparecerá acá para todos.
      </Text>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate("CantoSuggest")}
          style={styles.actionBtn}
        >
          Sugerir un canto
        </Button>
        {isOwner && (
          <Button
            mode="outlined"
            icon="shield-account"
            onPress={() => navigation.navigate("CantosModeration")}
            style={styles.actionBtn}
            textColor={C.yellow}
          >
            {pendingCount > 0 ? `Moderar (${pendingCount})` : "Moderar"}
          </Button>
        )}
      </View>

      {loading ? null : cantos.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="music-note" size={48} color={C.textHint} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>Todavía no hay cantos</Text>
          <Text style={[styles.emptyText, { color: C.textDim }]}>
            ¡Sé el primero en sugerir uno!
          </Text>
        </View>
      ) : (
        cantos.map((c) => (
          <Card
            key={c.id}
            onPress={() => navigation.navigate("CantoDetail", { title: c.title, letra: c.letra })}
            style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}
            elevation={0}
          >
            <Card.Content style={styles.cardContent}>
              <View style={[styles.iconBox, { backgroundColor: C.yellow + "1A" }]}>
                <Icon name="music-note" size={22} color={C.yellow} />
              </View>
              <View style={styles.cardMeta}>
                <Text style={[styles.cardTitle, { color: C.text }]}>{c.title}</Text>
                {(nameMap[c.submittedBy] ?? c.submittedByName) ? (
                  <Text style={[styles.cardSub, { color: C.textHint }]}>sugerido por {nameMap[c.submittedBy] ?? c.submittedByName}</Text>
                ) : null}
              </View>
              <Icon name="chevron-right" size={20} color={C.textHint} />
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 16, gap: 12, paddingBottom: 32 },
    intro: { color: C.textDim, fontSize: 13, lineHeight: 19 },
    actions: { gap: 10, marginBottom: 4 },
    actionBtn: { borderRadius: 12 },
    card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
    cardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    cardMeta: { flex: 1, gap: 2 },
    cardTitle: { fontSize: 15, fontWeight: "700" },
    cardSub: { fontSize: 11 },
    empty: { alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 24 },
    emptyTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
    emptyText: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  });
}
