//=============================== IMPORTS ===============================//
import 'dotenv/config';
import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import pkg from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client, LocalAuth, MessageMedia } = pkg;

// Pour gérer __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//=============================== VARIABLES ===============================//
const messages = [
  "📢 Info quizz 🧠:  A partir de maintenant suiver un mini quizz lancer le matin 7h00 et corrigé à 18h00 ! réagir avec 🔵🟣🔴🟠🟡🟢⚪ correspondant à la bonne réponse",
  "📌 Tips du jour : 🧠 L’intelligence artificielle, c’est un cerveau numérique qui apprend comme toi en cours : plus il voit, plus il comprend !",
  "📌 Tips du jour : 🤖 Le machine learning, c’est quand un ordi apprend à reconnaître des choses sans qu’on lui explique chaque détail. Comme deviner le héros d’un film juste avec une scène !",
  "📌 Tips du jour : 🧬 Un neurone artificiel, c’est une mini-calculette. Plein ensemble ? Ça donne un super cerveau IA 💡",
  "📌 Tips du jour : 💤 L’IA ne dort jamais, mais elle a besoin de données comme toi d’entraînement. Pas de data = pas de progrès 📉",
  "📌 Tips du jour : 👁️ La vision par ordinateur, c’est des yeux pour les machines. Montre-lui un chat 🐈, elle dit 'chat'. Show must go on !",
];
// 'TTECH™ |  Général'
const groupName = 'Orax_test'; // Nom du groupe
const mediaDir = path.join(__dirname, 'media/quizz'); // Dossier image
let currentIndex = 0;

//=============================== CLIENT INIT ===============================//
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', qr => {
  console.log('📲 Scanner ce QR code avec WhatsApp :');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Client WhatsApp prêt !');

  // Cron tous les jours à 8h GMT (changer à */1 * * * * pour test rapide)
  cron.schedule('*/1 * * * *', async () => {
    try {
      const message = '[ orax - bot ] ' + messages[currentIndex];
      currentIndex = (currentIndex + 1) % messages.length; // Boucle circulaire

      const chats = await client.getChats();
      const group = chats.find(chat => chat.isGroup && chat.name === groupName);

      if (!group) {
        console.error(`❌ Groupe "${groupName}" non trouvé.`);
        return;
      }

      const images = fs.readdirSync(mediaDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
      if (images.length === 0) {
        console.error('❌ Aucune image trouvée dans le dossier media.');
        return;
      }

      const randomImage = images[Math.floor(Math.random() * images.length)];
      const imagePath = path.join(mediaDir, randomImage);
      const media = MessageMedia.fromFilePath(imagePath);

      await client.sendMessage(group.id._serialized, media, { caption: message });
      console.log(`[BOT ORAX] ✅ Message + image "${randomImage}" envoyés dans "${groupName}"`);
    } catch (err) {
      console.error('❌ Erreur lors de l’envoi :', err);
    }
  });
});

client.on('auth_failure', msg => {
  console.error('❌ Authentification échouée :', msg);
});

client.on('disconnected', reason => {
  console.log('🔌 Déconnecté :', reason);
});

client.initialize();
