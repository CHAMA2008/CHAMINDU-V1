const fetch = require("node-fetch");
const { cmd } = require("../command");

cmd({
  pattern: "statue",
  alias: ["status", "st"],
  desc: "Get best TikTok status videos.",
  react: '✅',
  category: 'tools',
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  if (!args[0]) {
    return reply("🌸 *Status videos for what?*\n\n*Usage Example:*\n.statue <query>");
  }

  const query = args.join(" ");
  await store.react('⌛');
  
  try {
    reply(`🔎 Searching TikTok Status Videos for: *${query}*`);

    const response = await fetch(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data?.data?.length) {
      await store.react('❌');
      return reply("❌ No status videos found. Try a different keyword!");
    }

    const results = data.data.sort(() => Math.random() - 0.5).slice(0, 10); // 10 random results

    let listText = `🎬 *Select a TikTok Status Video:*\n\n`;
    results.forEach((v, i) => {
      listText += `${i + 1}. ${v.title} (${v.duration || '??'}s)\n`;
    });
    listText += `\n_Reply with a number (1-${results.length}) to get that video._`;

    const listMsg = await conn.sendMessage(from, {
      text: listText
    }, { quoted: m });

    // Handle reply
    const handler = async (msg) => {
      const msgContent = msg?.message?.extendedTextMessage?.text?.trim();
      const replyId = msg?.message?.extendedTextMessage?.contextInfo?.stanzaId;

      if (replyId !== listMsg.key.id) return;

      const choice = parseInt(msgContent);
      if (!choice || choice < 1 || choice > results.length) {
        return conn.sendMessage(from, { text: "❌ Invalid number. Please enter 1 to " + results.length }, { quoted: msg });
      }

      const selected = results[choice - 1];
      if (!selected.nowm) return conn.sendMessage(from, { text: "❌ Video URL not found." }, { quoted: msg });

      const caption = `🎬 *${selected.title}*\n👤 ${selected.author || 'Unknown'}\n⏱ ${selected.duration || 'Unknown'}s\n🔗 ${selected.link}`;
      await conn.sendMessage(from, {
        video: { url: selected.nowm },
        caption
      }, { quoted: msg });

      // Optional: remove listener after successful response
      conn.ev.off('messages.upsert', upsertHandler);
    };

    const upsertHandler = (update) => {
      const msg = update.messages[0];
      if (!msg?.message?.extendedTextMessage) return;
      handler(msg);
    };

    conn.ev.on('messages.upsert', upsertHandler);

  } catch (error) {
    console.error("Statue Command Error:", error);
    await store.react('❌');
    reply("❌ Something went wrong. Try again later.");
  }
});
