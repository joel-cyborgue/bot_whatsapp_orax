const cron = require('node-cron');

// Mémoire des tâches dynamiques
const dynamicTasks = {};

// Fonction pour transformer texte naturel en cron format
function parseNaturalCommand(text) {
  const match = text.match(/!ask !chaque (minute|heure|jour)(?: à (\d{1,2})h(\d{2})?)? envoie ?: ?"(.+?)"/i);

  if (!match) return null;

  const [_, freq, hour, min, message] = match;
  let cronTime;

  if (freq === 'minute') {
    cronTime = '*/1 * * * *';
  } else if (freq === 'heure') {
    const m = min || '00';
    cronTime = `${m} * * * *`;
  } else if (freq === 'jour') {
    const h = hour || '7';
    const m = min || '00';
    cronTime = `${m} ${h} * * *`;
  }

  return {
    cron: cronTime,
    message
  };
}

module.exports = (client) => {
  client.on('message', async (message) => {
    if (!message.body.startsWith('!ask')) return;

    const result = parseNaturalCommand(message.body);

    if (!result) {
      await message.reply("❌ Format invalide. Exemple : !ask !chaque jour à 7h00 envoie : \"Ton message\"");
      return;
    }

    // Stoppe l’ancienne tâche s’il y en a une
    const key = message.from + '_ask';
    if (dynamicTasks[key]) dynamicTasks[key].stop();

    const task = cron.schedule(result.cron, async () => {
      try {
        await client.sendMessage(message.from, "🗓️ " + result.message);
      } catch (e) {
        console.error("Erreur envoi message planifié :", e);
      }
    });

    dynamicTasks[key] = task;
    await message.reply(`✅ Planifié : "${result.message}" sera envoyé selon "${result.cron}"`);
  });
};
