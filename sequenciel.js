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
  "❓ Quizz 4 – Quel composant stocke une charge électrique ?\n🟣 Diode\n🔴 Transistor\n🟡 Condensateur\n🟢 LED",
  "❓ Quizz 5 – À quoi sert la fonction delay() sur Arduino ?\n🟣 Boucler le programme\n🔴 Attendre un certain temps\n🟡 Lancer le bootloader\n🟢 Lire un capteur",
  "❓ Quizz 6 – L’IA apprend à partir de :\n🟣 Prières\n🔴 Règles fixes\n🟡 Données\n🟢 Mots-clés",
  "❓ Quizz 7 – Un neurone artificiel :\n🟣 Est une cellule biologique\n🔴 Traite un signal d’entrée\n🟡 Est un microcontrôleur\n🟢 Est une diode",
  "❓ Quizz 8 – Le machine learning sert à :\n🟣 Prédire à partir d’exemples\n🔴 Compiler un programme\n🟡 Recharger des batteries\n🟢 Refroidir les circuits",
  "❓ Quizz 9 – Le deep learning utilise :\n🟣 Des transistors\n🔴 Des capteurs de mouvement\n🟡 Des réseaux de neurones profonds\n🟢 Des batteries au lithium",
  "❓ Quizz 10 – Une image peut être comprise par une IA en la transformant en :\n🟣 Couleurs\n🔴 Sons\n🟡 Données numériques\n🟢 Langage C++",
  "❓ Quizz 11 – Le capteur LDR détecte :\n🟣 Le son\n🔴 La lumière\n🟡 L’humidité\n🟢 Le mouvement",
  "❓ Quizz 12 – Quelle fonction mesure une tension analogique sur Arduino ?\n🟣 digitalRead()\n🔴 analogWrite()\n🟡 analogRead()\n🟢 pinMode()",
  "❓ Quizz 13 – L’unité de la tension est :\n🟣 Ohm\n🔴 Ampère\n🟡 Volt\n🟢 Watt",
  "❓ Quizz 14 – En IA, NLP signifie :\n🟣 Neuron Learning Processor\n🔴 Natural Language Processing\n🟡 Neural Loop Pipeline\n🟢 Non Linear Prediction",
  "❓ Quizz 15 – L’IA générative peut :\n🟣 Apprendre seule sans données\n🔴 Écrire des textes, images, sons\n🟡 Modifier le hardware\n🟢 Compiler du code sans erreurs",
  "❓ Quizz 16 – Quel composant est polarisé ?\n🟣 Résistance\n🔴 LED\n🟡 Breadboard\n🟢 Fils Dupont",
  "❓ Quizz 17 – Que mesure le capteur DHT11 ?\n🟣 Bruit\n🔴 Température et humidité\n🟡 Mouvement\n🟢 Lumière",
  "❓ Quizz 18 – L’apprentissage supervisé signifie :\n🟣 L’IA s’auto-entraine\n🔴 On lui fournit des exemples avec réponses\n🟡 On la programme ligne par ligne\n🟢 Elle imite l’humain sans données",
  "❓ Quizz 19 – Une breadboard sert à :\n🟣 Coder\n🔴 Prototyper sans souder\n🟡 Afficher un signal\n🟢 Sauver le projet",
  "❓ Quizz 20 – Une IA bien entraînée peut :\n🟣 Remplacer tous les humains\n🔴 Répondre avec logique sur des cas appris\n🟡 Créer du code sans bug\n🟢 Prévoir l’avenir sans erreur"
];

// 'TTECH™ |  Général'
const groupName = 'TTECH™ |  Général'; // Nom du groupe
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
  cron.schedule('*/50 * * * *', async () => {
    try {
      const message = '[ orax - bot ] ' + messages[currentIndex];
      currentIndex = (currentIndex + 1) % messages.length; // Boucle circulaire

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
// je dois push le projet !!