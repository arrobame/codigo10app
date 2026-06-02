import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import Navigation from "./src/navigation";

// Necesario para cerrar el browser de OAuth en native
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navigation />
        <StatusBar style="auto" />
        <Analytics />
      </AuthProvider>
    </ThemeProvider>
  );
}
