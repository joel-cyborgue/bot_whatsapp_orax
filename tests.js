const puppeteer = require('puppeteer');
(async() => {
  const browser = await puppeteer.launch();
  const page = browser.newPage();
  const data = await res.json();
  await message.reply("[ orax - bot ]🤖 " + data.response.trim());
  (await page).goto("127.0.0.1");
  (await page).screenshot({path: "exemple.png"});
})();