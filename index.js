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

//==================================================== MESSAGES ======================================================//
const messages = [
  "📌 Tips du jour : 📚 Un modèle de classification, c’est comme un gardien qui voit une image et dit : 'toi 🐶 à gauche, toi 🐱 à droite'. Il apprend ça avec des exemples !",
  "📌 Tips du jour : 🧠 L’intelligence artificielle, c’est un cerveau numérique qui apprend comme toi en cours : plus il voit, plus il comprend !",
  "📌 Tips du jour : 🤖 Le machine learning, c’est quand un ordi apprend à reconnaître des choses sans qu’on lui explique chaque détail. Comme deviner le héros d’un film juste avec une scène !",
  "📌 Tips du jour : 🧬 Un neurone artificiel, c’est une mini-calculette. Plein ensemble ? Ça donne un super cerveau IA 💡",
  "📌 Tips du jour : 💤 L’IA ne dort jamais, mais elle a besoin de données comme toi d’entraînement. Pas de data = pas de progrès 📉",
  "📌 Tips du jour : 👁️ La vision par ordinateur, c’est des yeux pour les machines. Montre-lui un chat 🐈, elle dit 'chat'. Show must go on !",
];
//==================================================== MESSAGES ======================================================//

// const groupName = 'TTECH™ |  Général';
const groupName = 'Orax_test';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// QR code à scanner à la première exécution uniquement
client.on('qr', qr => {
  console.log('📲 Scanner ce QR code avec WhatsApp :');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Client WhatsApp prêt !');

  // Envoi quotidien à 8h GMT
  cron.schedule('*/1 * * * *', async () => {
    try {
      const message = '[ orax - bot ] ' + messages[Math.floor(Math.random() * messages.length)];
      const chats = await client.getChats();
      const group = chats.find(chat => chat.isGroup && chat.name === groupName);

      if (!group) {
        console.log(`❌ Groupe "${groupName}" non trouvé.`);
        return;
      }

      // Choisir une image aléatoire
      const mediaDir = path.join(__dirname, 'media/tips');
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
      console.error('❌ Erreur lors de l’envoi du message :', err);
    }
  });
});

client.on('auth_failure', msg => {
  console.error('❌ Échec d’authentification :', msg);
});

client.on('disconnected', reason => {
  console.log('🔌 Déconnecté :', reason);
});

client.initialize();
