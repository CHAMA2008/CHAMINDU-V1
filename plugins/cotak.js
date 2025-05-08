const { cmd } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const { sleep } = require('../lib/functions2');

let broadcastStop = false;

cmd({
  pattern: "broadcastall",
  category: "owner",
  desc: "Broadcast message to all contacts",
  filename: __filename,
  use: "<your message here>"
}, async (conn, mek, m, { q, reply, isCreator }) => {
  try {
    if (!isCreator) return reply("❌ Only the bot owner can use this command.");
    if (!q) return reply("❌ Please provide a message to broadcast.");

    broadcastStop = false;

    const contacts = Object.keys(await conn.chats.all()).filter(jid => jid.endsWith('@s.whatsapp.net'));

    reply(`📢 Broadcasting to ${contacts.length} contacts...\n⏳ Please wait...`);

    let sent = 0;
    for (let jid of contacts) {
      if (broadcastStop) {
        return reply(`🛑 Broadcast stopped! ✅ Sent to ${sent} users.`);
      }

      try {
        await conn.sendMessage(jid, { text: q });
        sent++;
        await sleep(1200);
      } catch (err) {
        console.log(`Failed to send to ${jid}:`, err);
      }
    }

    reply(`✅ Broadcast completed! Sent to ${sent} users.`);

  } catch (err) {
    console.error("Broadcast Error:", err);
    await m.error(`❌ Error: ${err}\n\nCommand: broadcastall`, err);
  }
});

cmd({
  pattern: "stopbroadcast",
  category: "owner",
  desc: "Stop an active broadcast",
  filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
  if (!isCreator) return reply("❌ Only the bot owner can stop the broadcast.");
  broadcastStop = true;
  reply("🛑 Stopping broadcast...");
});
