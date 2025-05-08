const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');

cmd({
    pattern: "asong",
    alias: ["asongdu"],
    use: '.asong <search>',
    react: "🔎",
    desc: "Search YouTube and get voice note",
    category: "search",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a YouTube search term.");

        const yt = await ytsearch(q);
        if (!yt.results || yt.results.length === 0) return reply("No results found!");

        const videos = yt.results.slice(0, 20); // up to 20 results

        for (let vid of videos) {
            let mp3Api = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(vid.url)}`;
            let mp3res = await fetch(mp3Api).then(r => r.json());

            if (!mp3res?.success) continue;

            const caption = `🎬 *Title:* ${vid.title}
⏱️ *Duration:* ${vid.timestamp}
👀 *Views:* ${vid.views}
👤 *Author:* ${vid.author.name}
🔗 *Link:* ${vid.url}

> _ᴜꜱᴇ ʜᴇᴀᴅᴘʜᴏɴᴇꜱ ꜰᴏʀ ʙᴇꜱᴛ ᴇxᴘᴇʀɪᴇɴᴄᴇ🎧🗣️_

👇මේ වගේ ලස්සන සින්දු අහන්න මෙහාට එන්නකෝ 🥰🎧

🫟Follow Us - https://whatsapp.com/channel/0029Vb5xNts5Ui2ckgvOlt0W
> ©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴄʜᴀᴍᴀ ᴏꜰᴄ
`;

            await conn.sendMessage(from, {
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

            // Send voice note instead of normal mp3
            await conn.sendMessage(from, {
                audio: { url: mp3res.result.downloadUrl },
                mimetype: "audio/mpeg",
                ptt: true // make it a voice note
            });

        }

    } catch (e) {
        console.log(e);
        reply("An error occurred. Please try again later.");
    }
});
