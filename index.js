import 'dotenv/config';
import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import pkg from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const chatHistory = {};
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
  "📌 Tips du jour : 🔢 L’IA lit les chiffres comme toi un manga. Chaque chiffre cache une info 🕵️",
  "📌 Tips du jour : 🏀 En IA, on ne code pas les règles, on montre des exemples. Comme apprendre le basket en regardant LeBron jouer !",
  "📌 Tips du jour : ✨ L’IA, c’est pas de la magie, c’est des maths, des stats et beaucoup de tests. Mais ça fait des trucs incroyables !",
  "📌 Tips du jour : 🎤 Tu connais Siri ou Alexa ? C’est de l’IA qui comprend ta voix et te répond. Elle écoute mieux que ton pote parfois 😅",
  "📌 Tips du jour : 🎼 L’IA peut composer de la musique, écrire des poèmes ou coder un jeu vidéo. Elle est multi-talent comme toi !",
  "📌 Tips du jour : ❌ En IA, chaque erreur est une leçon. Les fails font progresser !",
  "📌 Tips du jour : 🧠 Les réseaux de neurones profonds, c’est un cerveau à plusieurs étages. Plus y’a d’étages, plus c’est puissant !",
  "📌 Tips du jour : 💬 Un chatbot, c’est un pote virtuel qui discute avec toi. Et parfois, il est très bavard 🗨️",
  "📌 Tips du jour : ⚡ Quand tu dis 'Ok Google', l’IA capte ta voix, comprend ta question et t’envoie une réponse plus vite que l’éclair ⚡",
  "📌 Tips du jour : 💎 Les données, c’est l’or numérique 💰. Celui qui les comprend peut changer le monde !",
  "📌 Tips du jour : 🧬 L’IA peut détecter une maladie, corriger une photo ou prédire un match. Elle analyse tout très vite !",
  "📌 Tips du jour : 🧑‍💻 GPT (comme moi) a lu des milliards de phrases. Résultat ? Je te parle comme un humain 📖",
  "📌 Tips du jour : 🔍 En IA, on apprend avec ou sans correction. Supervisé : on donne la réponse. Non-supervisé : elle devine !",
  "📌 Tips du jour : 👂 Les robots IA voient 🎥, entendent 🎧 et pensent avec du code 👨‍💻",
  "📌 Tips du jour : 🌀 Les GANs, ce sont des IA qui créent des visages qui n’existent pas. Impressionnant et... mystérieux 👻",
  "📌 Tips du jour : 📱 L’IA dans ton tel gère la batterie, les filtres photo, et te propose tes meilleures apps. Smart, non ?",
  "📌 Tips du jour : 🌐 Apprendre l’IA, c’est parler la langue des machines. Un vrai super-pouvoir !",
  "📌 Tips du jour : ❤️ L’IA n’a pas de cœur, mais elle peut surveiller les battements du tien avec un simple capteur. #santé",
  "📌 Tips du jour : 🚘 Les voitures autonomes utilisent caméras + capteurs + IA pour rouler sans pilote. Futur en marche !",
  "📌 Tips du jour : ⏳ En IA, il faut être patient. Ton modèle va échouer, c’est normal. Il devient meilleur à chaque essai !",
  "📌 Tips du jour : 📺 Quand YouTube te recommande une vidéo, c’est l’IA qui devine ce que tu vas adorer regarder 😍",
  "📌 Tips du jour : 👩‍🏫 L’IA a besoin de toi pour apprendre. Tu es son prof, elle est ton élève !",
  "📌 Tips du jour : 🌍 Tu veux changer le monde ? Apprends à parler IA. C’est elle qui pilotera les systèmes de demain !",
  "📌 Tips du jour : 🚀 Pas besoin d’être un génie pour commencer l’IA. Juste un peu de curiosité et de passion. Go go go !",
  "📌 Le savais tu ? : 🤖 Je ne suis pas un humain mais un bot de message programmer par orax la startup de la communauté TTECH !"
];
//==================================================== MESSAGES ======================================================//

// const groupName = 'TTECH™ |  Général';
const groupName = 'TTECH™ |  Général';

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
  cron.schedule('0 7 * * *', async () => {
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
      console.log(`[ orax - bot ] ✅ Message + image "${randomImage}" envoyés dans "${groupName}"`);
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
      await message.reply("[ orax - bot ]🤖 " + data.response.trim());
    } catch (err) {
      console.error("Erreur:", err);
      await message.reply("❌ Erreur en appelant Mistral.");
    }
  }else if (!message.fromMe) { // mettre tout message recu dans un fichier json
  }
});