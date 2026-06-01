import React from "react";
import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import Navigation from "./src/navigation";

// Necesario para cerrar el browser de OAuth en native
WebBrowser.maybeCompleteAuthSession();

// Vercel Analytics: solo se activa en web (no-op en otros entornos)
let Analytics: React.ComponentType | null = null;
if (Platform.OS === "web") {
  Analytics = require("@vercel/analytics/react").Analytics;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navigation />
        <StatusBar style="auto" />
        {Analytics && <Analytics />}
      </AuthProvider>
    </ThemeProvider>
  );
}
