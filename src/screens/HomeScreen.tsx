import { useState, useMemo, useLayoutEffect, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { Card, Surface, TouchableRipple, SegmentedButtons } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationProp, QuizDirection } from "../types";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import Icon from "../components/Icon";
import DonationModal from "../components/DonationModal";
import { APP_VERSION } from "../version";
import HeaderAuth from "../components/HeaderAuth";
import ThemeToggle from "../components/ThemeToggle";
import PWAInstallModal from "../components/PWAInstallModal";
import TutorialModal from "../components/TutorialModal";

let donationShownThisSession = false;

function FullRow({
  styles, C, icon, title, sub, onPress,
}: {
  styles: ReturnType<typeof makeStyles>;
  C: ThemeColors;
  icon: React.ComponentProps<typeof Icon>["name"];
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Surface style={[styles.fullCard, { backgroundColor: C.card, borderColor: C.border }]} elevation={0}>
      <TouchableRipple onPress={onPress} borderless style={styles.fullCardTouch}>
        <View style={styles.fullCardInner}>
          <Icon name={icon} size={24} color={C.yellow} />
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonTitle, { color: C.text }]}>{title}</Text>
            <Text style={[styles.buttonSub, { color: C.textHint }]}>{sub}</Text>
          </View>
          <Icon name="chevron-right" size={24} color={C.textHint} />
        </View>
      </TouchableRipple>
    </Surface>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C, isDark), [C, isDark]);
  const [showDonation, setShowDonation] = useState(!donationShownThisSession);
  const [showInstall, setShowInstall] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [direction, setDirection] = useState<QuizDirection>("codigo_a_descripcion");
  const installPromptRef = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem("cbvp_tutorial_seen").then((val) => {
      if (!val) setShowTutorial(true);
    });
  }, []);

  async function handleCloseTutorial() {
    await AsyncStorage.setItem("cbvp_tutorial_seen", "1");
    setShowTutorial(false);
  }

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if ((window as any).__installPrompt) {
      installPromptRef.current = (window as any).__installPrompt;
    }
    const handler = (e: any) => {
      e.preventDefault();
      installPromptRef.current = e;
      (window as any).__installPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (installPromptRef.current) {
      installPromptRef.current.prompt();
      const { outcome } = await installPromptRef.current.userChoice;
      if (outcome === "accepted") installPromptRef.current = null;
    } else {
      setShowInstall(true);
    }
  }

  function handleCloseDonation() {
    donationShownThisSession = true;
    setShowDonation(false);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.origin : "https://codigo10.vercel.app";
    const text = "🚒 ¡Aprendé el Código 10 del CBVP Paraguay!\nQuiz interactivo para bomberos y aspirantes. Completamente gratis:";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Código 10 App", text, url });
        return;
      } catch {}
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`;
    if (typeof window !== "undefined") window.open(waUrl, "_blank");
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <HeaderAuth />,
      headerRight: () => (
        <View style={{ marginRight: 8 }}>
          <ThemeToggle />
        </View>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <TutorialModal visible={showTutorial} onClose={handleCloseTutorial} />
      <DonationModal
        visible={showDonation}
        onClose={handleCloseDonation}
        onGoToDonation={() => { handleCloseDonation(); navigation.navigate("Donation"); }}
      />
      <PWAInstallModal visible={showInstall} onClose={() => setShowInstall(false)} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Código 10</Text>
        <Text style={[styles.subtitle, { color: C.textDim }]}>
          Aprendé el Código 10 que usan los bomberos
        </Text>
      </View>

      <View style={styles.menu}>
        {/* ── Jugar ─────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: C.textHint }]}>JUGAR</Text>

        <SegmentedButtons
          value={direction}
          onValueChange={(v) => setDirection(v as QuizDirection)}
          buttons={[
            { value: "codigo_a_descripcion", label: "Código → Desc" },
            { value: "descripcion_a_codigo", label: "Desc → Código" },
          ]}
        />

        <View style={styles.row}>
          {/* CTA principal: única superficie con acento sólido */}
          <Card
            onPress={() => navigation.navigate("Quiz", { mode: "streak", direction })}
            style={[styles.halfCard, { backgroundColor: C.yellow, borderColor: C.yellow }]}
            elevation={0}
          >
            <Card.Content style={styles.halfCardContent}>
              <Icon name="local-fire-department" size={26} color={C.onAccent} />
              <Text style={[styles.halfTitle, { color: C.onAccent }]}>Racha</Text>
              <Text style={[styles.halfSub, { color: "rgba(255,255,255,0.75)" }]}>Máxima</Text>
            </Card.Content>
          </Card>

          <Card
            onPress={() => navigation.navigate("Quiz", { mode: "speed", direction })}
            style={[styles.halfCard, { backgroundColor: C.card, borderColor: C.border }]}
            elevation={0}
          >
            <Card.Content style={styles.halfCardContent}>
              <Icon name="bolt" size={26} color={C.yellow} />
              <Text style={[styles.halfTitle, { color: C.text }]}>Velocidad</Text>
              <Text style={[styles.halfSub, { color: C.textHint }]}>10 códigos</Text>
            </Card.Content>
          </Card>
        </View>

        {/* ── Comunidad ─────────────────────── */}
        <Text style={[styles.sectionLabel, { color: C.textHint }]}>COMUNIDAD</Text>
        <FullRow
          styles={styles}
          C={C}
          icon="emoji-events"
          title="Ranking"
          sub="Los mejores aspirantes"
          onPress={() => navigation.navigate("Leaderboard")}
        />

        {/* ── Estudiar ──────────────────────── */}
        <Text style={[styles.sectionLabel, { color: C.textHint }]}>ESTUDIAR</Text>
        <View style={styles.row}>
          <Card
            onPress={() => navigation.navigate("Study")}
            style={[styles.halfCard, { backgroundColor: C.card, borderColor: C.border }]}
            elevation={0}
          >
            <Card.Content style={styles.halfCardContent}>
              <Icon name="menu-book" size={26} color={C.yellow} />
              <Text style={[styles.halfTitle, { color: C.text }]}>Códigos</Text>
              <Text style={[styles.halfSub, { color: C.textHint }]}>Lista completa</Text>
            </Card.Content>
          </Card>

          <Card
            onPress={() => navigation.navigate("Errors")}
            style={[styles.halfCard, { backgroundColor: C.card, borderColor: C.border }]}
            elevation={0}
          >
            <Card.Content style={styles.halfCardContent}>
              <Icon name="bar-chart" size={26} color={C.yellow} />
              <Text style={[styles.halfTitle, { color: C.text }]}>Mis Errores</Text>
              <Text style={[styles.halfSub, { color: C.textHint }]}>Los más difíciles</Text>
            </Card.Content>
          </Card>
        </View>

        <FullRow
          styles={styles}
          C={C}
          icon="radio"
          title="Radio en Código 10"
          sub="Simulaciones de comunicaciones reales"
          onPress={() => navigation.navigate("Salidas")}
        />

        <FullRow
          styles={styles}
          C={C}
          icon="music-note"
          title="Cantos de Marcha"
          sub="Aprendé cantos para marchar al trote"
          onPress={() => navigation.navigate("Cantos")}
        />

        {/* ── Más ───────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: C.textHint }]}>MÁS</Text>
        <View style={styles.row}>
          <Card
            onPress={handleInstall}
            style={[styles.halfCard, { backgroundColor: C.card, borderColor: C.border }]}
            elevation={0}
          >
            <Card.Content style={styles.halfCardContent}>
              <Icon name="install-mobile" size={26} color={C.yellow} />
              <Text style={[styles.halfTitle, { color: C.text }]}>Instalar</Text>
              <Text style={[styles.halfSub, { color: C.textHint }]}>Agregar al inicio</Text>
            </Card.Content>
          </Card>

          <Card
            onPress={handleShare}
            style={[styles.halfCard, { backgroundColor: C.card, borderColor: C.border }]}
            elevation={0}
          >
            <Card.Content style={styles.halfCardContent}>
              <Icon name="share" size={26} color={C.yellow} />
              <Text style={[styles.halfTitle, { color: C.text }]}>Compartir</Text>
              <Text style={[styles.halfSub, { color: C.textHint }]}>Invitá amigos</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.row}>
          <Card
            onPress={() => navigation.navigate("Feedback")}
            style={[styles.halfCard, { backgroundColor: C.card, borderColor: C.border }]}
            elevation={0}
          >
            <Card.Content style={styles.halfCardContent}>
              <Icon name="feedback" size={26} color={C.yellow} />
              <Text style={[styles.halfTitle, { color: C.text }]}>Reportar</Text>
              <Text style={[styles.halfSub, { color: C.textHint }]}>Problema o idea</Text>
            </Card.Content>
          </Card>

          <Card
            onPress={() => navigation.navigate("Donation")}
            style={[styles.halfCard, { backgroundColor: C.card, borderColor: C.border }]}
            elevation={0}
          >
            <Card.Content style={styles.halfCardContent}>
              <Icon name="favorite" size={26} color={C.yellow} />
              <Text style={[styles.halfTitle, { color: C.text }]}>Apoyar</Text>
              <Text style={[styles.halfSub, { color: C.textHint }]}>Al desarrollador</Text>
            </Card.Content>
          </Card>
        </View>

        <Text style={[styles.versionText, { color: C.textHint }]}>v{APP_VERSION}</Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors, _isDark: boolean) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 32 },
    header: { alignItems: "center", paddingVertical: 20 },
    title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
    subtitle: { fontSize: 14, marginTop: 6, textAlign: "center" },
    menu: { gap: 12, marginTop: 8 },
    sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.4, marginTop: 6 },
    row: { flexDirection: "row", gap: 12 },
    halfCard: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 16,
      overflow: "hidden",
    },
    halfCardContent: {
      alignItems: "center",
      gap: 6,
      paddingVertical: 14,
    },
    halfTitle: { fontSize: 14, fontWeight: "700", textAlign: "center" },
    halfSub: { fontSize: 11, textAlign: "center" },
    fullCard: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: "hidden",
    },
    fullCardTouch: { borderRadius: 16 },
    fullCardInner: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 14,
    },
    buttonContent: { flex: 1 },
    buttonTitle: { fontSize: 16, fontWeight: "700" },
    buttonSub: { fontSize: 12, marginTop: 2 },
    versionText: { fontSize: 11, textAlign: "center", marginTop: 8 },
  });
}
