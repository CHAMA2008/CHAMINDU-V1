const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');

// YouTube Search & Interactive Selection Handler
cmd({
    pattern: "ytsdum",
    alias: ["ytplay", "yts"],
    desc: "Search and select YouTube audio/video",
    category: "main",
    use: ".play <query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("*කරුණාකර ගීතයේ නමක් හෝ YouTube ලින්ක් එකක් දෙන්න.*");

        const yt = await ytsearch(q);
        if (!yt.results.length) return reply("*ප්‍රතිඵල කිසිවක් හමු නොවුණා.*");

        let resultText = `🎬 *Search Results for:* _${q}_\n\n`;
        yt.results.slice(0, 5).forEach((v, i) => {
            resultText += `*${i + 1}.* ${v.title}\n   ⏳ ${v.timestamp} | 👁 ${v.views} | 🔗 ${v.url}\n\n`;
        });
        resultText += "📝 Reply with a number (1-5) to select a song.";

        const searchMsg = await conn.sendMessage(from, { text: resultText }, { quoted: mek });

        conn.ev.once("messages.upsert", async ({ messages }) => {
            const replyMsg = messages[0];
            if (!replyMsg.message?.extendedTextMessage) return;

            const selected = replyMsg.message.extendedTextMessage.text.trim();
            const index = parseInt(selected);
            if (isNaN(index) || index < 1 || index > 5) return;

            const selectedVid = yt.results[index - 1];

            const msgText = `*Selected:* ${selectedVid.title}\n*Choose format:*\n1️⃣ Audio Only\n2️⃣ Video Only\n\n_Reply with 1 or 2_`;
            const formatMsg = await conn.sendMessage(from, { image: { url: selectedVid.thumbnail }, caption: msgText }, { quoted: replyMsg });

            conn.ev.once("messages.upsert", async ({ messages }) => {
                const formatReply = messages[0];
                if (!formatReply.message?.extendedTextMessage) return;

                const formatChoice = formatReply.message.extendedTextMessage.text.trim();
                const isAudio = formatChoice === "1";

                if (isAudio) {
                    const audioApi = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(selectedVid.url)}`;
                    const res = await fetch(audioApi);
                    const data = await res.json();
                    if (!data.result?.downloadUrl) return reply("*Audio ලබාගැනීම අසාර්ථකයි.*");

                    const formatText = `*Choose Audio Format:*\n1️⃣ Document\n2️⃣ Normal\n3️⃣ Voice Note`;
                    const audioFormatMsg = await conn.sendMessage(from, { text: formatText }, { quoted: formatReply });

                    conn.ev.once("messages.upsert", async ({ messages }) => {
                        const fMsg = messages[0];
                        const opt = fMsg.message?.extendedTextMessage?.text.trim();
                        if (opt === "1") {
                            await conn.sendMessage(from, { document: { url: data.result.downloadUrl }, mimetype: "audio/mpeg", fileName: `${selectedVid.title}.mp3` }, { quoted: fMsg });
                        } else if (opt === "2") {
                            await conn.sendMessage(from, { audio: { url: data.result.downloadUrl }, mimetype: "audio/mpeg" }, { quoted: fMsg });
                        } else if (opt === "3") {
                            await conn.sendMessage(from, { audio: { url: data.result.downloadUrl }, mimetype: "audio/mpeg", ptt: true }, { quoted: fMsg });
                        } else {
                            await conn.sendMessage(from, { text: "*වැරදි තේරීමක්. 1, 2 හෝ 3 තෝරන්න.*" }, { quoted: fMsg });
                        }
                    });
                } else if (formatChoice === "2") {
                    const videoApi = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(selectedVid.url)}`;
                    const res = await fetch(videoApi);
                    const data = await res.json();
                    if (!data.result?.download_url) return reply("*වීඩියෝ ලබාගැනීම අසාර්ථකයි.*");

                    const formatText = `*Choose Video Format:*\n1️⃣ Document\n2️⃣ Normal Video`;
                    const videoFormatMsg = await conn.sendMessage(from, { text: formatText }, { quoted: formatReply });

                    conn.ev.once("messages.upsert", async ({ messages }) => {
                        const fMsg = messages[0];
                        const opt = fMsg.message?.extendedTextMessage?.text.trim();
                        if (opt === "1") {
                            await conn.sendMessage(from, { document: { url: data.result.download_url }, mimetype: "video/mp4", fileName: `${selectedVid.title}.mp4` }, { quoted: fMsg });
                        } else if (opt === "2") {
                            await conn.sendMessage(from, { video: { url: data.result.download_url }, mimetype: "video/mp4" }, { quoted: fMsg });
                        } else {
                            await conn.sendMessage(from, { text: "*වැරදි තේරීමක්. 1 හෝ 2 තෝරන්න.*" }, { quoted: fMsg });
                        }
                    });
                } else {
                    await conn.sendMessage(from, { text: "*වැරදි තේරීමක්. කරුණාකර 1 හෝ 2 යොදන්න.*" }, { quoted: formatReply });
                }
            });
        });

    } catch (e) {
        console.error(e);
        reply("*දෝෂයක් ඇතිවුණා. කරුණාකර පසුව උත්සාහ කරන්න.*");
    }
});
