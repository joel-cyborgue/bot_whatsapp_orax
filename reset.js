import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier où whatsapp-web.js stocke les sessions
const sessionsDir = path.join(__dirname, '.wwebjs_auth');

if (fs.existsSync(sessionsDir)) {
  fs.rmSync(sessionsDir, { recursive: true, force: true });
  console.log("🗑️ Toutes les anciennes sessions WhatsApp ont été supprimées.");
} else {
  console.log("✅ Aucune session à supprimer (dossier .wwebjs_auth introuvable).");
}
