// Limpia los records de velocidad del usuario delpuertomiguel7@gmail.com
// Uso:
//   1. Descargá el service account desde Firebase Console →
//      Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada
//   2. Guardalo como service-account.json en la raíz del proyecto
//   3. node scripts/admin-clear-speed.js

const admin = require("firebase-admin");
const path  = require("path");

const SA_PATH = path.join(__dirname, "../service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(SA_PATH),
  projectId: "codigo10-trivia",
});

const db = admin.firestore();
const TARGET_USERNAME = "delpuertomiguel7";

async function run() {
  const snap = await db.collection("records")
    .where("username", "==", TARGET_USERNAME)
    .get();

  if (snap.empty) {
    console.log("No se encontró ningún documento con username =", TARGET_USERNAME);
    process.exit(0);
  }

  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(`Encontrado: uid=${data.uid}  bestAvgSpeed_ctd=${data.bestAvgSpeed_ctd}  bestAvgSpeed_dtc=${data.bestAvgSpeed_dtc}`);

    await doc.ref.update({
      bestAvgSpeed_ctd: null,
      bestAvgSpeed_dtc: null,
    });

    console.log("✓ Campos de velocidad borrados correctamente.");
  }

  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
