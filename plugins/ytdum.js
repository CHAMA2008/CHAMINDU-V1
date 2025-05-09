const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');

let globalSearchMap = {}; // store context by user

cmd({ 
    pattern: "yts3", 
    alias: ["ytsss","tys"], 
    react: "🕵️‍♀️", 
    desc: "Search and download YouTube video/audio", 
    category: "main", 
    use: '.song <name>', 
    filename: __filename 
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a YouTube song name.");

        const yt = await ytsearch(q);
        if (!yt.results || yt.results.length === 0) return reply("No results found!");

        let list = yt.results.slice(0, 5);
        let msg = `🎬 *Search Results for:* _${q}_\n\n`;
        list.forEach((v, i) => {
            msg += `*${i + 1}.* ${v.title}\n   ⏳ ${v.timestamp} | 👁 ${v.views} | 🔗 ${v.url}\n\n`;
        });
        msg += "📝 Reply with a number (1-5) to select a song.";

        globalSearchMap[m.sender] = list;

        await conn.sendMessage(from, { text: msg }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("Error occurred during search.");
    }
});

// Handle all replies
cmd({
    on: 'message'
}, async (conn, m) => {
    const from = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const body = m.message?.conversation || m.message?.extendedTextMessage?.text;
    if (!body) return;

    // Check if it's a valid reply for a search
    if (globalSearchMap[sender]) {
        const selectedIndex = parseInt(body.trim()) - 1;
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= globalSearchMap[sender].length) return;

        const video = globalSearchMap[sender][selectedIndex];
        delete globalSearchMap[sender];

        const msg = `ඔබ තෝරාගත්තේ: 🎵 *${video.title}*

*Download type එක තෝරන්න:*
1️⃣ Audio (MP3)
2️⃣ Video (MP4)`;

        conn.sendMessage(from, { text: msg }, { quoted: m });
        globalSearchMap[sender] = { video, step: 'type' };
        return;
    }

    // After type selection
    if (globalSearchMap[sender]?.step === 'type') {
        const choice = body.trim();
        const { video } = globalSearchMap[sender];
        delete globalSearchMap[sender];

        if (choice === '1') {
            const msg = `*Audio Format තෝරන්න:*
1️⃣ MP3 as Document
2️⃣ MP3 as Audio (Play)
3️⃣ MP3 as Voice Note`;
            conn.sendMessage(from, { text: msg }, { quoted: m });
            globalSearchMap[sender] = { video, step: 'audio' };
        } else if (choice === '2') {
            const msg = `*Video Format තෝරන්න:*
1️⃣ MP4 as Document
2️⃣ MP4 as Normal Video`;
            conn.sendMessage(from, { text: msg }, { quoted: m });
            globalSearchMap[sender] = { video, step: 'video' };
        } else {
            conn.sendMessage(from, { text: "*වැරදි වරදක්. 1 හෝ 2 යොදන්න.*" }, { quoted: m });
        }
        return;
    }

    // Audio format selection
    if (globalSearchMap[sender]?.step === 'audio') {
        const format = body.trim();
        const { video } = globalSearchMap[sender];
        delete globalSearchMap[sender];

        try {
            const apiUrl = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(video.url)}`;
            const res = await fetch(apiUrl);
            const data = await res.json();
            if (!data.success) return conn.sendMessage(from, { text: "Failed to download audio." }, { quoted: m });

            if (format === '1') {
                await conn.sendMessage(from, {
                    document: { url: data.result.downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${video.title}.mp3`
                }, { quoted: m });
            } else if (format === '2') {
                await conn.sendMessage(from, {
                    audio: { url: data.result.downloadUrl },
                    mimetype: 'audio/mpeg'
                }, { quoted: m });
            } else if (format === '3') {
                await conn.sendMessage(from, {
                    audio: { url: data.result.downloadUrl },
                    mimetype: 'audio/mpeg',
                    ptt: true
                }, { quoted: m });
            } else {
                conn.sendMessage(from, { text: "*වැරදි වරදක්. 1, 2 හෝ 3 තෝරන්න.*" }, { quoted: m });
            }
        } catch (e) {
            console.log(e);
            conn.sendMessage(from, { text: "Audio download error." }, { quoted: m });
        }
        return;
    }

    // Video format selection
    if (globalSearchMap[sender]?.step === 'video') {
        const format = body.trim();
        const { video } = globalSearchMap[sender];
        delete globalSearchMap[sender];

        try {
            const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(video.url)}`;
            const res = await fetch(apiUrl);
            const data = await res.json();
            if (!data.success) return conn.sendMessage(from, { text: "Failed to download video." }, { quoted: m });

            if (format === '1') {
                await conn.sendMessage(from, {
                    document: { url: data.result.download_url },
                    mimetype: 'video/mp4',
                    fileName: `${video.title}.mp4`
                }, { quoted: m });
            } else if (format === '2') {
                await conn.sendMessage(from, {
                    video: { url: data.result.download_url },
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                conn.sendMessage(from, { text: "*වැරදි වරදක්. 1 හෝ 2 තෝරන්න.*" }, { quoted: m });
            }
        } catch (e) {
            console.log(e);
            conn.sendMessage(from, { text: "Video download error." }, { quoted: m });
        }
        return;
    }
});
