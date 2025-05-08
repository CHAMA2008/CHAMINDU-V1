const config = require('../config');
const { cmd } = require('../command');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();
const yts = require('yt-search');

cmd({
  pattern: "ytsplay",
  alias: ["yplay", "ytsearchplay","ytss"],
  use: ".ytsplay <query>",
  react: "🎧",
  desc: "Search on YouTube and download audio",
  category: "search + download",
  filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
  try {
    if (!q) return await reply("❌ Please provide a search term!");

    const search = await yts(q);
    const videos = search.videos.slice(0, 5); // Top 5 results

    if (!videos.length) return await reply("❌ No results found!");

    let txt = `🎬 *Search Results for:* _${q}_\n\n`;
    videos.forEach((v, i) => {
      txt += `*${i + 1}.* ${v.title}\n   ⏳ ${v.timestamp} | 👁 ${v.views} | 🔗 ${v.url}\n\n`;
    });
    txt += `📝 Reply with a number (1-${videos.length}) to select a song.`;

    const sentMsg = await conn.sendMessage(from, { text: txt }, { quoted: mek });
    const msgId = sentMsg.key.id;

    conn.ev.on('messages.upsert', async (msgUpdate) => {
      try {
        const res = msgUpdate?.messages[0];
        if (!res?.message) return;

        const isReply = res?.message?.extendedTextMessage?.contextInfo?.stanzaId === msgId;
        const userInput = res.message?.conversation || res.message?.extendedTextMessage?.text;
        const selectedIndex = parseInt(userInput?.trim());

        if (!isReply || isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > videos.length) return;

        const chosen = videos[selectedIndex - 1];
        const videoId = chosen.videoId;

        // Now ask for format
        const formatMsg = `🔽 *Choose Format for:*\n🎵 ${chosen.title}\n\n` +
          `1.1 *Audio Type* 🎧\n1.2 *Document Type* 📁\n\nReply with your choice!`;

        const formatPrompt = await conn.sendMessage(from, { image: { url: chosen.image }, caption: formatMsg }, { quoted: res });
        const formatMsgId = formatPrompt.key.id;

        conn.ev.on('messages.upsert', async (fmUpdate) => {
          try {
            const fm = fmUpdate?.messages[0];
            if (!fm?.message) return;

            const formatReply = fm.message?.conversation || fm.message?.extendedTextMessage?.text;
            const isReplyToFormat = fm?.message?.extendedTextMessage?.contextInfo?.stanzaId === formatMsgId;

            if (!isReplyToFormat) return;

            const audioData = await dy_scrap.ytmp3(`https://youtube.com/watch?v=${videoId}`);
            const dlUrl = audioData?.result?.download?.url;
            if (!dlUrl) return await conn.sendMessage(from, { text: "❌ Failed to get download link!" }, { quoted: fm });

            if (formatReply.trim() === "1.1") {
              await conn.sendMessage(from, {
                audio: { url: dlUrl },
                mimetype: "audio/mpeg",
                ptt: false
              }, { quoted: fm });
            } else if (formatReply.trim() === "1.2") {
              await conn.sendMessage(from, {
                document: { url: dlUrl },
                fileName: `${chosen.title}.mp3`,
                mimetype: "audio/mpeg",
                caption: chosen.title
              }, { quoted: fm });
            } else {
              await conn.sendMessage(from, { text: "❌ Invalid format reply. Use 1.1 or 1.2." }, { quoted: fm });
            }

            await conn.sendMessage(from, { text: "✅ Download completed!" }, { quoted: fm });

          } catch (e) {
            console.error(e);
            await conn.sendMessage(from, { text: `❌ Format error: ${e.message}` }, { quoted: mek });
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
