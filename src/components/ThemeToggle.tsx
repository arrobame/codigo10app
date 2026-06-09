import { SegmentedButtons } from "react-native-paper";
import { useTheme } from "../theme/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <SegmentedButtons
      value={isDark ? "dark" : "light"}
      onValueChange={(v) => { if ((v === "dark") !== isDark) toggle(); }}
      density="small"
      buttons={[
        { value: "dark", icon: "weather-night", label: "", style: { minWidth: 44 } },
        { value: "light", icon: "white-balance-sunny", label: "", style: { minWidth: 44 } },
      ]}
    />
  );
}
