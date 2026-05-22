import { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { Broadcast } from "../utils/inAppNotifications";

interface Props {
  broadcast: Broadcast | null;
  onClose: () => void;
}

export default function BroadcastModal({ broadcast, onClose }: Props) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  if (!broadcast) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.iconRow}>
            <Text style={styles.icon}>📢</Text>
          </View>
          <Text style={styles.title}>{broadcast.title}</Text>
          <Text style={styles.body}>{broadcast.body}</Text>
          <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.btnText}>Entendido</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
      gap: 12,
    },
    iconRow: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: C.yellow + "22",
      borderWidth: 2,
      borderColor: C.yellow,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: { fontSize: 28 },
    title: { color: C.text, fontSize: 17, fontWeight: "bold", textAlign: "center" },
    body:  { color: C.textDim, fontSize: 14, textAlign: "center", lineHeight: 22 },
    btn: {
      backgroundColor: C.yellow,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 32,
      marginTop: 4,
    },
    btnText: { color: C.black, fontSize: 15, fontWeight: "bold" },
  });
}
