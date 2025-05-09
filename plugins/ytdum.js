const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');

cmd({
  pattern: "ytsm",
  alias: ["yplay", "ytsearchplay", "ytss"],
  use: ".ytsplay <query>",
  react: "🎧",
  desc: "Search on YouTube and download audio/video",
  category: "search + download",
  filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
  try {
    if (!q) return await reply("❌ Please provide a search term!");

    const search = await yts(q);
    const videos = search.videos.slice(0, 5);
    if (!videos.length) return await reply("❌ No results found!");

    let txt = `🎬 *Search Results for:* _${q}_\n\n`;
    videos.forEach((v, i) => {
      txt += `*${i + 1}.* ${v.title}\n   ⏳ ${v.timestamp} | 👁 ${v.views} | 🔗 ${v.url}\n\n`;
    });
    txt += `📝 Reply with a number (1-${videos.length}) to select a song/video.`;

    const sentMsg = await conn.sendMessage(from, { text: txt }, { quoted: mek });
    const msgId = sentMsg.key.id;

    conn.ev.once('messages.upsert', async (msgUpdate) => {
      try {
        const res = msgUpdate.messages[0];
        const isReply = res?.message?.extendedTextMessage?.contextInfo?.stanzaId === msgId;
        const userInput = res.message?.conversation || res.message?.extendedTextMessage?.text;
        const selectedIndex = parseInt(userInput?.trim());

        if (!isReply || isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > videos.length) return;

        const chosen = videos[selectedIndex - 1];
        const videoUrl = chosen.url;

        const formatMsg = `🖼️ *${chosen.title}*\n\n` +
          `1️⃣ Audio\n2️⃣ Video\n\nReply with your choice to download.`;

        const promptMsg = await conn.sendMessage(from, { image: { url: chosen.image }, caption: formatMsg }, { quoted: res });
        const promptMsgId = promptMsg.key.id;

        conn.ev.once('messages.upsert', async (formatReply) => {
          try {
            const fr = formatReply.messages[0];
            const frText = fr.message?.conversation || fr.message?.extendedTextMessage?.text;
            const isReply2 = fr?.message?.extendedTextMessage?.contextInfo?.stanzaId === promptMsgId;

            if (!isReply2) return;

            await conn.sendMessage(from, { react: { text: "⏳", key: fr.key } });

            if (frText.trim() === "1") {
              // Audio Download
              const api = await fetch(`https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`);
              const json = await api.json();
              if (!json.result?.download_url) return reply("❌ Failed to get audio!");

              await conn.sendMessage(from, {
                audio: { url: json.result.download_url },
                mimetype: "audio/mpeg"
              }, { quoted: fr });

            } else if (frText.trim() === "2") {
              // Video Download
              const api = await fetch(`https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`);
              const json = await api.json();
              if (!json.result?.download_url) return reply("❌ Failed to get video!");

              await conn.sendMessage(from, {
                video: { url: json.result.download_url },
                mimetype: "video/mp4"
              }, { quoted: fr });

            } else {
              await conn.sendMessage(from, { text: "❌ Invalid choice. Reply with 1 or 2." }, { quoted: fr });
            }

          } catch (e) {
            console.error(e);
            await conn.sendMessage(from, { text: `❌ Download failed: ${e.message}` }, { quoted: mek });
          }
        });

      } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: `❌ Selection error: ${e.message}` }, { quoted: mek });
      }
    });

  } catch (e) {
    console.error(e);
    await conn.sendMessage(from, { text: `❌ Unexpected error: ${e.message}` }, { quoted: mek });
  }
});
