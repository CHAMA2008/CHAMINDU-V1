const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');

// MP4 video download

cmd({ 
    pattern: "mp4", 
    alias: ["video2"], 
    react: "🎥", 
    desc: "Download YouTube video", 
    category: "main", 
    use: '.mp4 < Yt url or Name >', 
    filename: __filename 
}, async (conn, mek, m, { from, prefix, quoted, q, reply }) => { 
    try { 
        if (!q) return await reply("Please provide a YouTube URL or video name.");
        
        const yt = await ytsearch(q);
        if (yt.results.length < 1) return reply("No results found!");
        
        let yts = yt.results[0];  
        let apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(yts.url)}`;
        
        let response = await fetch(apiUrl);
        let data = await response.json();
        
        if (data.status !== 200 || !data.success || !data.result.download_url) {
            return reply("Failed to fetch the video. Please try again later.");
        }

        let ytmsg = `📹 *Video Downloader*
🎬 *Title:* ${yts.title}
⏳ *Duration:* ${yts.timestamp}
👀 *Views:* ${yts.views}
👤 *Author:* ${yts.author.name}
🔗 *Link:* ${yts.url}
> Powered By chamindu ❤️`;

        // Send video directly with caption
        await conn.sendMessage(
            from, 
            { 
                video: { url: data.result.download_url }, 
                caption: ytmsg,
                mimetype: "video/mp4"
            }, 
            { quoted: mek }
        );

    } catch (e) {
        console.log(e);
        reply("An error occurred. Please try again later.");
    }
});

// MP3 song download 

cmd({ 
    pattern: "song2", 
    alias: ["play", "mp3"], 
    react: "🎶", 
    desc: "Download YouTube song", 
    category: "main", 
    use: '.song <query>', 
    filename: __filename 
}, async (conn, mek, m, { from, sender, reply, q }) => { 
    try {
        if (!q) return reply("Please provide a song name or YouTube link.");

        const yt = await ytsearch(q);
        if (!yt.results.length) return reply("No results found!");

        const song = yt.results[0];
        const apiUrl = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(song.url)}`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data?.result?.downloadUrl) return reply("Download failed. Try again later.");

    await conn.sendMessage(from, {
    audio: { url: data.result.downloadUrl },
    mimetype: "audio/mpeg",
    fileName: `${song.title}.mp3`,
    contextInfo: {
        externalAdReply: {
            title: song.title.length > 25 ? `${song.title.substring(0, 22)}...` : song.title,
            body: "Join our WhatsApp Channel",
            mediaType: 1,
            thumbnailUrl: song.thumbnail.replace('default.jpg', 'hqdefault.jpg'),
            sourceUrl: 'https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j',
            mediaUrl: 'https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j',
            showAdAttribution: true,
            renderLargerThumbnail: true
        }
    }
}, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply("An error occurred. Please try again.");
    }
});

//sndsong
cmd({
    pattern: "sndsong",
    react: "🎵",
    desc: "Auto-send Sinhala song without search",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const sinhalaSearchKeywords = [
            "Sinhala new song",
            "Sinhala love song",
            "Top sinhala songs",
            "Sanuka Wickramasinghe songs",
            "Kasun Kalhara hit songs",
            "Sri Lankan trending songs",
            "Sinhala music 2024",
            "BnS sinhala hits",
            "Umariya songs",
            "Sinhala romantic songs"
        ];

        const randomKeyword = sinhalaSearchKeywords[Math.floor(Math.random() * sinhalaSearchKeywords.length)];
        const yt = await ytsearch(randomKeyword);
        if (!yt.results.length) return reply("❌ No Sinhala song found right now.");

        const song = yt.results[Math.floor(Math.random() * yt.results.length)];
        const apiUrl = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(song.url)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data?.result?.downloadUrl) return reply("❌ MP3 download failed.");

        await conn.sendMessage(from, {
            audio: { url: data.result.downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${song.title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: song.title.length > 25 ? `${song.title.slice(0, 22)}...` : song.title,
                    body: "Auto Sinhala Song",
                    mediaType: 1,
                    thumbnailUrl: song.thumbnail.replace('default.jpg', 'hqdefault.jpg'),
                    sourceUrl: song.url,
                    showAdAttribution: true,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Auto Sinhala Song Error:", error);
        reply("⚠️ Error occurred. Try again later.");
    }
});


//😓😓😓
let autoSongInterval = null;

cmd({
    pattern: "sndsong",
    react: "🎧",
    desc: "Start auto-sending Sinhala songs",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        if (autoSongInterval) return reply("⛔ Already running. Use `.stopsong` to stop.");

        const sinhalaKeywords = [
            "Sanuka Wickramasinghe", "Kasun Kalhara", "BnS sinhala songs", 
            "Umariya sinhala", "Top Sinhala love songs", "New sinhala music"
        ];

        const sendRandomSong = async () => {
            try {
                const keyword = sinhalaKeywords[Math.floor(Math.random() * sinhalaKeywords.length)];
                const yt = await ytsearch(keyword);
                const song = yt.results[Math.floor(Math.random() * yt.results.length)];
                const api = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(song.url)}`;
                const res = await fetch(api);
                const data = await res.json();
                if (!data?.result?.downloadUrl) return;

                await conn.sendMessage(from, {
                    audio: { url: data.result.downloadUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${song.title}.mp3`,
                    contextInfo: {
                        externalAdReply: {
                            title: song.title.length > 25 ? `${song.title.slice(0, 22)}...` : song.title,
                            body: "Auto Sinhala Song",
                            mediaType: 1,
                            thumbnailUrl: song.thumbnail.replace('default.jpg', 'hqdefault.jpg'),
                            sourceUrl: song.url,
                            showAdAttribution: true,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: mek });
            } catch (err) {
                console.error("Song error:", err);
            }
        };

        autoSongInterval = setInterval(sendRandomSong, 10 * 60 * 1000); // every 10 min
        sendRandomSong(); // send first immediately
        reply("✅ Auto Sinhala songs started! Use `.stopsong` to stop.");

    } catch (err) {
        console.error("sndsong error:", err);
        reply("❌ Error starting auto songs.");
    }
});

cmd({
    pattern: "stopsong",
    react: "⛔",
    desc: "Stop auto Sinhala songs",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    if (autoSongInterval) {
        clearInterval(autoSongInterval);
        autoSongInterval = null;
        return reply("✅ Auto Sinhala songs stopped.");
    } else {
        return reply("❌ Auto songs not running.");
    }
});
