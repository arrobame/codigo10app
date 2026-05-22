const { version } = require("../package.json");
const fs = require("fs");
const path = require("path");

fs.writeFileSync(
  path.join(__dirname, "../src/version.ts"),
  `export const APP_VERSION = "${version}";\n`
);

console.log(`✓ src/version.ts actualizado a v${version}`);
