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
  //"📢 Info quizz 🧠:  A partir de demain suivez un mini quizz lancé le matin à 7H00 et corrigé à 18H00 ! Réagissez avec 🟣🔴🟡🟢 correspondant à la bonne réponse.",
  //"📌 Tips du jour : 🧠 L’intelligence artificielle, c’est un cerveau numérique qui apprend comme toi en cours : plus il voit, plus il comprend !",

  "❓ Quizz 1 – À quoi sert la broche GND sur Arduino ?\n🟣 Alimenter un capteur\n🔴 Envoyer des données\n🟡 Se connecter à la masse électrique\n🟢 Contrôler un moteur",
  "❓ Quizz 2 – Que fait une résistance ?\n🟣 Accumule l’énergie\n🔴 Limite le courant électrique\n🟡 Interrompt le circuit\n🟢 Amplifie le signal",
  "❓ Quizz 3 – Quelle est la vitesse standard de Serial.begin ?\n🟣 4800 bauds\n🔴 9600 bauds\n🟡 14400 bauds\n🟢 115200 bauds",
];

const reponses = [
  //"💡 Quizz 1 – À quoi sert la broche GND sur Arduino ?\nBonne réponse : 🟡 Se connecter à la masse électrique",
  "💡 Quizz 2 – Que fait une résistance ?\nBonne réponse : 🔴 Limite le courant électrique",
  "💡 Quizz 3 – Quelle est la vitesse standard de Serial.begin ?\nBonne réponse : 🔴 9600 bauds",
  "💡 Quizz 4 – Quel composant stocke une charge électrique ?\nBonne réponse : 🟡 Condensateur",
];


// 'TTECH™ |  Général'
const groupName = 'TTECH™ |  Général'; // Nom du groupe
const mediaDir = path.join(__dirname, 'media/answers'); // Dossier image
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
  cron.schedule('30 18 * * *', async () => {
    try {
      const message = '[ orax - bot ] Reponse ' + reponses[currentIndex] + "\n Vous pouvez me poser des question en tapant d'abord !ask";
      currentIndex = (currentIndex + 1) % reponses.length; // Boucle circulaire

      const chats = await client.getChats();
      const group = chats.find(chat => chat.isGroup && chat.name === groupName);

      if (!group) {
        console.error(`❌ Groupe "${groupName}" non trouvé.`);
        return;
      }

      const images = fs.readdirSync(mediaDir).filter(file => /\.(jpg|jpeg|webp|png)$/i.test(file));
      if (images.length === 0) {
        console.error('❌ Aucune image trouvée dans le dossier media.');
        return;
      }

      const randomImage = images[Math.floor(Math.random() * images.length)];
      const imagePath = path.join(mediaDir, randomImage);
      const media = MessageMedia.fromFilePath(imagePath);

      await client.sendMessage(group.id._serialized, media, { caption: message });
      console.log(`[ orax - bot ] ✅ Message + image "${randomImage}" envoyés dans "${groupName}"`);
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
// je dois push le projet !!

client.on('message', async message => {
  if (!message.fromMe && message.body.startsWith('!ask')) {
    const question = message.body.replace('!ask', '').trim();

    if (!question) {
      await message.reply("❌ Pose une vraie question après !ask");
      return;
    }

    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          prompt: question,
          stream: false
        })
      });

      const data = await res.json();
      await message.reply("[ orax - bot ] 🤖 " + data.response.trim());
    } catch (err) {
      console.error("Erreur:", err);
      await message.reply("❌ Erreur en appelant Mistral.");
    }
  }
});