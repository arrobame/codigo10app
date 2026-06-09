import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

interface Props {
  name: MaterialIconName;
  size?: number;
  color?: string;
  style?: object;
}

// Wrapper único de íconos (Material Symbols / Material Icons).
// Por defecto usa el color de texto del tema.
export default function Icon({ name, size = 22, color, style }: Props) {
  const { C } = useTheme();
  return <MaterialIcons name={name} size={size} color={color ?? C.text} style={style} />;
}

export type { MaterialIconName };
