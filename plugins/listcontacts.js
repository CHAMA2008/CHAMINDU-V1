const { cmd } = require('../command');

cmd({
  pattern: "listco",
  category: "owner",
  desc: "Show total number of users bot has in contacts",
  filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
  try {
    if (!isCreator) return reply("❌ Only the bot owner can use this command.");

    const chats = await conn.chats.all();
    const numbers = chats.filter(c => c.id.endsWith('@s.whatsapp.net'));

    const count = numbers.length;

    await reply(`👥 Bot has saved ~ ${count} individual contacts 🛸`);

    await conn.sendMessage(m.chat, { react: { text: "🛸", key: m.key } });

  } catch (err) {
    console.error("❌ Error counting contacts:", err);
    return reply("❌ Error while retrieving contact count.");
  }
});
