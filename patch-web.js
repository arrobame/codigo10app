const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "dist", "index.html");
let html = fs.readFileSync(file, "utf8");

// Reemplazar favicon por el logo del CBVP
html = html.replace(
  '<link rel="icon" href="/favicon.ico" />',
  [
    '<link rel="icon" type="image/png" href="/cbvp_logo.png" />',
    '<link rel="apple-touch-icon" href="/cbvp_logo.png" />',
    '<link rel="manifest" href="/manifest.json" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '<meta name="apple-mobile-web-app-title" content="Código 10 App" />',
  ].join("\n")
);

// Corregir el título
html = html.replace(/<title>.*?<\/title>/, "<title>Código 10 App</title>");

fs.writeFileSync(file, html, "utf8");
console.log("✓ index.html actualizado con manifest y logo del CBVP");

// Restaurar link de Vercel al proyecto correcto (se pierde cuando Expo borra dist/)
const vercelDir = path.join(__dirname, "dist", ".vercel");
fs.mkdirSync(vercelDir, { recursive: true });
fs.writeFileSync(
  path.join(vercelDir, "project.json"),
  JSON.stringify({
    projectId: "prj_C6AHV1WuN8BsYuLSyUwnqewTAHAZ",
    orgId: "team_pgfGiHOHhH1sYPa5jZIRO0EO",
    projectName: "codigo10",
  })
);
console.log("✓ Vercel linkeado a proyecto codigo10");
