const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');

cmd({
    pattern: "ytsdu",
    alias: ["ytsearch"],
    use: '.yts <search>',
    react: "🔎",
    desc: "Search YouTube and choose audio/video format",
    category: "search",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a YouTube search term.");

        const yt = await ytsearch(q);
        if (!yt.results || yt.results.length === 0) return reply("No results found!");

        const videos = yt.results.slice(0, 20); // up to 20 results

        for (let vid of videos) {
            let mp4Api = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(vid.url)}`;
            let mp3Api = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(vid.url)}`;

            let mp4res = await fetch(mp4Api).then(r => r.json());
            let mp3res = await fetch(mp3Api).then(r => r.json());

            if (!mp4res?.success || !mp3res?.success) continue;

            const caption = `🎬 *Title:* ${vid.title}
⏱️ *Duration:* ${vid.timestamp}
👀 *Views:* ${vid.views}
👤 *Author:* ${vid.author.name}
🔗 *Link:* ${vid.url}

*Choose format to download:*
1️⃣. 📄 MP3 as Document
2️⃣. 🎧 MP3 as Audio
3️⃣. 🎙 MP3 as Voice Note
4️⃣. 📄 MP4 as Document
5️⃣. ▶ MP4 as Video

_© Powered by chamindu_`;

            const msg = await conn.sendMessage(from, {
                image: { url: vid.thumbnail },
                caption: caption,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363419192353625@newsletter',
                        newsletterName: '☈☟𝗖𝗛𝗔𝗠𝗔 𝗠𝗗',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });

            conn.ev.on("messages.upsert", async (msgUpdate) => {
                const received = msgUpdate.messages[0];
                if (!received?.message?.extendedTextMessage) return;

                const choice = received.message.extendedTextMessage.text.trim();
                if (received.message.extendedTextMessage.contextInfo?.stanzaId !== msg.key.id) return;

                await conn.sendMessage(from, { react: { text: "📥", key: received.key } });

                switch (choice) {
                    case "1":
                        await conn.sendMessage(from, {
                            document: { url: mp3res.result.downloadUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${vid.title}.mp3`
                        }, { quoted: received });
                        break;
                    case "2":
                        await conn.sendMessage(from, {
                            audio: { url: mp3res.result.downloadUrl },
                            mimetype: "audio/mpeg"
                        }, { quoted: received });
                        break;
                    case "3":
                        await conn.sendMessage(from, {
                            audio: { url: mp3res.result.downloadUrl },
                            mimetype: "audio/mpeg",
                            ptt: true
                        }, { quoted: received });
                        break;
                    case "4":
                        await conn.sendMessage(from, {
                            document: { url: mp4res.result.download_url },
                            mimetype: "video/mp4",
                            fileName: `${vid.title}.mp4`
                        }, { quoted: received });
                        break;
                    case "5":
                        await conn.sendMessage(from, {
                            video: { url: mp4res.result.download_url },
                            mimetype: "video/mp4"
                        }, { quoted: received });
                        break;
                    default:
                        await conn.sendMessage(from, {
                            text: "*Invalid option. Please reply with a number from 1 to 5.*"
                        }, { quoted: received });
                        break;
                }
            });
        }

    } catch (e) {
        console.log(e);
        reply("An error occurred. Please try again later.");
    }
});
