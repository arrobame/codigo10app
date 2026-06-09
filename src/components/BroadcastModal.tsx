import { Text } from "react-native";
import { Portal, Dialog, Button } from "react-native-paper";
import { useTheme } from "../theme/ThemeContext";
import { Broadcast } from "../utils/inAppNotifications";

interface Props {
  broadcast: Broadcast | null;
  onClose: () => void;
}

export default function BroadcastModal({ broadcast, onClose }: Props) {
  const { C } = useTheme();

  if (!broadcast) return null;

  return (
    <Portal>
      <Dialog visible onDismiss={onClose} style={[{ backgroundColor: C.card, alignSelf: "center", width: "90%", maxWidth: 360, borderRadius: 20 }]}>
        <Dialog.Title style={{ color: C.text, textAlign: "center" }}>
          {broadcast.title}
        </Dialog.Title>
        <Dialog.Content>
          <Text style={{ color: C.textDim, fontSize: 14, lineHeight: 22, textAlign: "center" }}>
            {broadcast.body}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose} textColor={C.yellow}>Entendido</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
