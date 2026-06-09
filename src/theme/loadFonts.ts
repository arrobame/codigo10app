import { Platform } from "react-native";

// App web-only: cargamos Geist desde Google Fonts e indicamos a react-native-web
// que la herede desde la raíz. Se ejecuta una sola vez al importar el módulo.
let injected = false;

export function loadWebFonts() {
  if (injected) return;
  if (Platform.OS !== "web") return;
  if (typeof document === "undefined") return;
  injected = true;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap";
  document.head.appendChild(link);

  const style = document.createElement("style");
  style.textContent = `
    html, body, #root, #root input, #root textarea, #root button {
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
  `;
  document.head.appendChild(style);
}
