const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();
const fetch = require('node-fetch');

cmd({
  pattern: "media",
  alias: ["ytdownload", "ytmedia","ytms"],
  use: ".media <query>",
  react: "📽️",
  desc: "Search YouTube and choose Audio/Video to download",
  category: "main",
  filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide a YouTube song or video name.");

    const yt = await ytsearch(q);
    if (yt.results.length < 1) return reply("❌ No results found.");

    const chosen = yt.results[0];

    const chooseType = `📌 *What do you want to download?*\n\n1️⃣ Audio 🎧\n2️⃣ Video 🎥\n\n_Reply with the number_`;
    const typeMsg = await conn.sendMessage(from, { image: { url: chosen.thumbnail }, caption: chooseType }, { quoted: mek });

    const typeMsgId = typeMsg.key.id;

    conn.ev.on("messages.upsert", async (msgUpdate) => {
      const userMsg = msgUpdate?.messages[0];
      if (!userMsg?.message) return;

      const replyText = userMsg.message?.conversation || userMsg.message?.extendedTextMessage?.text;
      const isReplyToType = userMsg?.message?.extendedTextMessage?.contextInfo?.stanzaId === typeMsgId;

      if (!isReplyToType) return;

      if (replyText === "1") {
        // AUDIO format options
        const audioOpt = `🎧 *Choose audio format for:* ${chosen.title}\n\n1️⃣ MP3 Document 📄\n2️⃣ MP3 Audio 🎧\n3️⃣ Voice Note 🎙️`;
        const audioMsg = await conn.sendMessage(from, { image: { url: chosen.thumbnail }, caption: audioOpt }, { quoted: userMsg });
        const audioMsgId = audioMsg.key.id;

        conn.ev.on("messages.upsert", async (aUpdate) => {
          const aMsg = aUpdate?.messages[0];
          if (!aMsg?.message) return;

          const aText = aMsg.message?.conversation || aMsg.message?.extendedTextMessage?.text;
          const isReplyToAudio = aMsg?.message?.extendedTextMessage?.contextInfo?.stanzaId === audioMsgId;
          if (!isReplyToAudio) return;

          const audioData = await dy_scrap.ytmp3(chosen.url);
          const url = audioData?.result?.download?.url;
          if (!url) return reply("❌ Audio download failed!");

          switch (aText.trim()) {
            case "1":
              await conn.sendMessage(from, {
                document: { url },
                fileName: `${chosen.title}.mp3`,
                mimetype: "audio/mpeg"
              }, { quoted: aMsg });
              break;
            case "2":
              await conn.sendMessage(from, {
                audio: { url },
                mimetype: "audio/mpeg"
              }, { quoted: aMsg });
              break;
            case "3":
              await conn.sendMessage(from, {
                audio: { url },
                mimetype: "audio/mpeg",
                ptt: true
              }, { quoted: aMsg });
              break;
            default:
              await conn.sendMessage(from, { text: "❌ Invalid input. Reply with 1, 2, or 3." }, { quoted: aMsg });
          }
        });

      } else if (replyText === "2") {
        // VIDEO format options
        const videoOpt = `🎥 *Choose video format for:* ${chosen.title}\n\n1️⃣ MP4 Document 📄\n2️⃣ MP4 Video ▶️`;
        const videoMsg = await conn.sendMessage(from, { image: { url: chosen.thumbnail }, caption: videoOpt }, { quoted: userMsg });
        const videoMsgId = videoMsg.key.id;

        conn.ev.on("messages.upsert", async (vUpdate) => {
          const vMsg = vUpdate?.messages[0];
          if (!vMsg?.message) return;

          const vText = vMsg.message?.conversation || vMsg.message?.extendedTextMessage?.text;
          const isReplyToVideo = vMsg?.message?.extendedTextMessage?.contextInfo?.stanzaId === videoMsgId;
          if (!isReplyToVideo) return;

          const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(chosen.url)}`;
          const response = await fetch(apiUrl);
          const data = await response.json();
          const url = data?.result?.download_url;
          if (!url) return reply("❌ Video download failed!");

          switch (vText.trim()) {
            case "1":
              await conn.sendMessage(from, {
                document: { url },
                fileName: `${chosen.title}.mp4`,
                mimetype: "video/mp4"
              }, { quoted: vMsg });
              break;
            case "2":
              await conn.sendMessage(from, {
                video: { url },
                mimetype: "video/mp4"
              }, { quoted: vMsg });
              break;
            default:
              await conn.sendMessage(from, { text: "❌ Invalid input. Reply with 1 or 2." }, { quoted: vMsg });
          }
        });
      } else {
        await conn.sendMessage(from, { text: "❌ Invalid input. Use 1 for Audio or 2 for Video." }, { quoted: userMsg });
      }
    });

  } catch (err) {
    console.error(err);
    reply("❌ Error: " + err.message);
  }
});
