const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();
const fetch = require('node-fetch');

cmd({
  pattern: "yts4",
  alias: ["ytsearch", "media", "ytmedia"],
  use: ".yts <query>",
  react: "🔎",
  desc: "Search YouTube and download Audio/Video",
  category: "main",
  filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide a YouTube video/song name.");

    const yt = await ytsearch(q);
    const results = yt.results.slice(0, 10);
    if (results.length === 0) return reply("❌ No results found!");

    let list = "🔎 *Search Results:*\n\n";
    results.forEach((v, i) => {
      list += `${i + 1}. *${v.title}*\n${v.url}\n\n`;
    });

    const listMsg = await conn.sendMessage(from, { text: list + "Reply with a number (1-10) to choose a result." }, { quoted: mek });
    const listMsgId = listMsg.key.id;

    conn.ev.on("messages.upsert", async (update) => {
      const msg = update?.messages?.[0];
      if (!msg?.message) return;

      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      const isReplyToList = msg?.message?.extendedTextMessage?.contextInfo?.stanzaId === listMsgId;

      if (!isReplyToList) return;

      const index = parseInt(text.trim()) - 1;
      if (isNaN(index) || index < 0 || index >= results.length) return reply("❌ Invalid number. Use 1–10.");

      const chosen = results[index];

      const askType = await conn.sendMessage(from, {
        image: { url: chosen.thumbnail },
        caption: `📌 *What do you want to download?*\n\n1️⃣ Audio 🎧\n2️⃣ Video 🎥\n\n_Reply with 1 or 2_`
      }, { quoted: msg });
      const typeMsgId = askType.key.id;

      conn.ev.on("messages.upsert", async (tUpdate) => {
        const tMsg = tUpdate?.messages?.[0];
        if (!tMsg?.message) return;

        const tText = tMsg.message?.conversation || tMsg.message?.extendedTextMessage?.text;
        const isReplyToType = tMsg?.message?.extendedTextMessage?.contextInfo?.stanzaId === typeMsgId;
        if (!isReplyToType) return;

        if (tText.trim() === "1") {
          // AUDIO formats
          const optMsg = await conn.sendMessage(from, {
            image: { url: chosen.thumbnail },
            caption: `🎧 *Choose audio format for:* ${chosen.title}\n\n1️⃣ MP3 Document 📄\n2️⃣ MP3 Audio 🎧\n3️⃣ Voice Note 🎙️`
          }, { quoted: tMsg });
          const optMsgId = optMsg.key.id;

          conn.ev.on("messages.upsert", async (aUpdate) => {
            const aMsg = aUpdate?.messages?.[0];
            if (!aMsg?.message) return;

            const aText = aMsg.message?.conversation || aMsg.message?.extendedTextMessage?.text;
            const isReplyToAudio = aMsg?.message?.extendedTextMessage?.contextInfo?.stanzaId === optMsgId;
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

        } else if (tText.trim() === "2") {
          // VIDEO formats
          const vMsg = await conn.sendMessage(from, {
            image: { url: chosen.thumbnail },
            caption: `🎥 *Choose video format for:* ${chosen.title}\n\n1️⃣ MP4 Document 📄\n2️⃣ MP4 Video ▶️`
          }, { quoted: tMsg });
          const vMsgId = vMsg.key.id;

          conn.ev.on("messages.upsert", async (vUpdate) => {
            const vRes = vUpdate?.messages?.[0];
            if (!vRes?.message) return;

            const vText = vRes.message?.conversation || vRes.message?.extendedTextMessage?.text;
            const isReplyToVideo = vRes?.message?.extendedTextMessage?.contextInfo?.stanzaId === vMsgId;
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
                }, { quoted: vRes });
                break;
              case "2":
                await conn.sendMessage(from, {
                  video: { url },
                  mimetype: "video/mp4"
                }, { quoted: vRes });
                break;
              default:
                await conn.sendMessage(from, { text: "❌ Invalid input. Reply with 1 or 2." }, { quoted: vRes });
            }
          });

        } else {
          await conn.sendMessage(from, { text: "❌ Invalid input. Use 1 for Audio or 2 for Video." }, { quoted: tMsg });
        }
      });
    });

  } catch (err) {
    console.error(err);
    reply("❌ Error: " + err.message);
  }
});
