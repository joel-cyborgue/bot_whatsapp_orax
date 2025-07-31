import 'dotenv/config';
import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import pkg from 'whatsapp-web.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client, LocalAuth, MessageMedia } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//================== CONFIG ==================//
const groupName = 'Orax_test'; // ← à adapter si besoin
const chatHistory = {}; // Historique de chaque groupe pour le contexte IA
//================== CONFIG ==================//

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

//== QR code à scanner une seule fois ==
client.on('qr', qr => {
  console.log('📲 Scanner ce QR code avec WhatsApp :');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot prêt, connecté à WhatsApp.');
});

//======== Message IA avec mémoire =========//
client.on('message', async message => {
  if (!message.fromMe && message.body.startsWith('!ask')) {
    const groupId = message.from;
    const question = message.body.replace('!ask', '').trim();

    if (!question) {
      await message.reply("❌ Pose une vraie question après `!ask`.");
      return;
    }

    if (!chatHistory[groupId]) chatHistory[groupId] = [];
    chatHistory[groupId].push({ role: 'user', content: question });

    // Ne garde que les 6 derniers échanges
    if (chatHistory[groupId].length > 6) {
      chatHistory[groupId] = chatHistory[groupId].slice(-6);
    }

    const prompt = chatHistory[groupId]
      .map(m => m.role === 'user' ? `Utilisateur: ${m.content}` : `Bot: ${m.content}`)
      .join('\n') + `\nBot:`;

    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          prompt,
          stream: false
        })
      });

      const data = await res.json();
      const reply = data.response.trim();
      chatHistory[groupId].push({ role: 'bot', content: reply });

      await message.reply("🤖 " + reply);
    } catch (err) {
      console.error("❌ Erreur Mistral:", err);
      await message.reply("❌ Erreur avec Mistral.");
    }
  }
});

//====== Déconnexion & Auth ======//
client.on('auth_failure', msg => {
  console.error('❌ Échec d’authentification :', msg);
});

client.on('disconnected', reason => {
  console.log('🔌 Déconnecté :', reason);
});

client.initialize();
