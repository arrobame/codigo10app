import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { PaperWrapper } from "./src/theme/PaperWrapper";
import { AuthProvider } from "./src/context/AuthContext";
import Navigation from "./src/navigation";
import { loadWebFonts } from "./src/theme/loadFonts";

// Necesario para cerrar el browser de OAuth en native
WebBrowser.maybeCompleteAuthSession();

// Carga Geist (web-only) antes del primer render
loadWebFonts();

export default function App() {
  return (
    <ThemeProvider>
      <PaperWrapper>
        <AuthProvider>
          <Navigation />
          <StatusBar style="auto" />
          <Analytics />
        </AuthProvider>
      </PaperWrapper>
    </ThemeProvider>
  );
}
