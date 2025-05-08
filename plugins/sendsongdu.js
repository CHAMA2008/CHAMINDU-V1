const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');

// Global + Sri Lankan song sources
const globalHits = [
  "Top 50 Global Songs", "Billboard Hot 100", "Trending Music 2025",
  "Latin Hits", "Kpop Chart", "EDM Party", "Top Afrobeat Songs",
  "UK Top 40", "Top Chill Hits", "Bollywood Romantic Songs"
];

const lankaHits = [
  "Sri Lankan Trending Songs", "New Sinhala Songs", "Sudu Andumin - Sanka",
  "Top Sinhala Rap", "Wasthi Productions Songs", "Bathiya & Santhush Hits",
  "Ratta Music", "Lankan Love Songs", "Ape Sindu 2025", "Sinhala TikTok Hits"
];

const songQueries = [...globalHits, ...lankaHits]; // mix global + lanka

cmd({
    pattern: "sendsongdu",
    use: '.sendsongdu',
    react: "🎧",
    desc: "Send trending song (Lanka + Global) with audio",
    category: "music",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Pick random query from the mix
        const randomQuery = songQueries[Math.floor(Math.random() * songQueries.length)];
        const yt = await ytsearch(randomQuery);
        if (!yt.results || yt.results.length === 0) return reply("No songs found!");

        // Pick random song from results
        const vid = yt.results[Math.floor(Math.random() * yt.results.length)];

        // Fetch MP3
        const mp3Api = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(vid.url)}`;
        const mp3res = await fetch(mp3Api).then(r => r.json());
        if (!mp3res?.success) return reply("Failed to fetch audio.");

        // Build caption
        const caption = `🌍 *Trending Song Recommendation*

🎬 *Title:* ${vid.title}
⏱️ *Duration:* ${vid.timestamp}
👀 *Views:* ${vid.views}
👤 *Author:* ${vid.author.name}
🔗 *Link:* ${vid.url}

*Enjoy this song! Sent by CHAMA-MD-V1*`;

        // Send image + caption
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1000,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363419192353625@newsletter',
                    newsletterName: '☈☟𝗖𝗛𝗔𝗠𝗔 𝗠𝗗',
                    serverMessageId: 200
                }
            }
        }, { quoted: mek });

        // Send audio
        await conn.sendMessage(from, {
            audio: { url: mp3res.result.downloadUrl },
            mimetype: "audio/mpeg"
        });

    } catch (e) {
        console.log(e);
        reply("Something went wrong. Please try again later.");
    }
});
