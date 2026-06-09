import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Portal, Dialog, Button, Surface, TouchableRipple } from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../theme/ThemeContext";
import Icon from "./Icon";

const PHONE = "0971274229";

interface Props {
  visible: boolean;
  onClose: () => void;
  onGoToDonation: () => void;
}

export default function DonationModal({ visible, onClose, onGoToDonation }: Props) {
  const { C } = useTheme();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGoToDonation() {
    onClose();
    onGoToDonation();
  }

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={[styles.dialog, { backgroundColor: C.card }]}
      >
        <Dialog.Title style={{ color: C.text, fontSize: 19 }}>Apoyá al Desarrollador</Dialog.Title>
        <Dialog.Content style={{ gap: 12 }}>
          <Text style={{ color: C.textDim, fontSize: 14, lineHeight: 21 }}>
            Por favor doname alguito, estoy muy sogüe y todavía me falta comprar el uniforme de gala.
          </Text>

          <Surface style={[styles.phoneBox, { backgroundColor: C.cardRaised, borderColor: C.border }]} elevation={0}>
            <View style={styles.phoneLabelRow}>
              <Icon name="smartphone" size={14} color={C.textDim} />
              <Text style={{ color: C.textDim, fontSize: 12 }}>Transferencia vía celular</Text>
            </View>
            <Text style={{ color: C.text, fontSize: 26, fontWeight: "700", letterSpacing: 2, marginBottom: 12 }}>
              {PHONE}
            </Text>
            <TouchableRipple onPress={handleCopy} style={[styles.copyBtn, { backgroundColor: C.yellow }]} borderless>
              <View style={styles.copyBtnInner}>
                <Icon name={copied ? "check" : "content-copy"} size={15} color={C.onAccent} />
                <Text style={{ color: C.onAccent, fontWeight: "700", fontSize: 13 }}>
                  {copied ? "Copiado" : "Copiar número"}
                </Text>
              </View>
            </TouchableRipple>
          </Surface>

          <View style={[styles.disclaimer, { backgroundColor: C.wrongBg, borderColor: C.wrongBorder + "55" }]}>
            <Icon name="warning" size={16} color={C.redHighlight} />
            <Text style={{ flex: 1, color: C.textDim, fontSize: 12, lineHeight: 18 }}>
              Las donaciones son <Text style={{ color: C.text, fontWeight: "700" }}>exclusivamente</Text> para el desarrollador.{"\n"}
              <Text style={{ color: C.redHighlight, fontWeight: "700" }}>El CBVP no tiene ninguna relación con esta app.</Text>
            </Text>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose} textColor={C.textHint}>Cerrar</Button>
          <Button onPress={handleGoToDonation} mode="contained">Ver más info</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: "center",
    width: "90%",
    maxWidth: 360,
    borderRadius: 20,
  },
  phoneBox: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  phoneLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  copyBtn: { borderRadius: 20 },
  copyBtnInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 20 },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
});
