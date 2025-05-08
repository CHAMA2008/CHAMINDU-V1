const { cmd } = require("../command");
const axios = require('axios');
const NodeCache = require('node-cache');

// Initialize cache (1-minute TTL)
const searchCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// ======================
// FROZEN QUEEN Theme
// ======================
const frozenTheme = {
  header: `╭═══❖•°❄️°•❖═══╮\n   ༺ CHAMA-MD-V1 ༻\n  ╰═══❖•°❄️°•❖═══╯\n`,
  box: function(title, content) {
    return `${this.header}╔═════❖ ❄️ ❖═════╗\n   ✧ ${title} ✧\n╚═════❖ ❄️ ❖═════╝\n\n${content}\n\n❄═════❖ ❄️ ❖═════❄\n✧ THE COLD NEVER BOTHERED ME ANYWAY ✧`;
  },
  getForwardProps: function() {
    return {
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        stanzaId: "BAE5" + Math.random().toString(16).substr(2, 12).toUpperCase(),
        mentionedJid: [],
        conversionData: {
          conversionDelaySeconds: 0,
          conversionSource: "frozen_queen",
          conversionType: "message"
        }
      }
    };
  },
  resultEmojis: ["❄️", "🧊", "👑", "🎥", "🎬", "📽️", "🎞️", "❅", "✧", "🌬️"]
};

// Film search and download command
cmd({
  pattern: "movie",
  react: "❄️",
  desc: "Enjoy cinema from Frozen Queen's treasury of films with Sinhala subtitles",
  category: "ice kingdom",
  filename: __filename,
}, async (conn, mek, m, { from, q, pushname }) => {
  if (!q) {
    await conn.sendMessage(from, {
      text: frozenTheme.box("Royal Decree", 
        "❅ Usage: .film2 <movie name>\n❅ Example: .film2 Deadpool\n❅ Vault: Films with Sinhala Subtitles\n❅ Reply 'done' to stop"),
      ...frozenTheme.getForwardProps()
    }, { quoted: mek });
    return;
  }

  try {
    // Step 1: Check cache for movie data
    const cacheKey = `film_search_${q.toLowerCase()}`;
    let searchData = searchCache.get(cacheKey);

    if (!searchData) {
      const searchUrl = `https://suhas-bro-api.vercel.app/movie/sinhalasub/search?text=${encodeURIComponent(q)}`;
      let retries = 3;
      while (retries > 0) {
        try {
          const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
          searchData = searchResponse.data;
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw new Error("Failed to retrieve data from movie treasury");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!searchData.status || !searchData.result.data || searchData.result.data.length === 0) {
        throw new Error("No films found in Ice Kingdom");
      }

      searchCache.set(cacheKey, searchData);
    }

    // Step 2: Format movie list
    let filmList = `❄️ *FROZEN CINEMATIC VAULT* ❄️\n\n`;
    const films = searchData.result.data.map((film, index) => ({
      number: index + 1,
      title: film.title.replace("Sinhala Subtitles | සිංහල උපසිරසි සමඟ", "").trim(),
      link: film.link,
      image: null // Image not provided in search API, will fetch later
    }));

    films.forEach(film => {
      filmList += `${frozenTheme.resultEmojis[0]} ${film.number}. *${film.title}*\n\n`;
    });
    filmList += `${frozenTheme.resultEmojis[8]} Select a movie: Reply with the number\n`;
    filmList += `${frozenTheme.resultEmojis[9]} Reply 'done' to stop\n`;
    filmList += `${frozenTheme.resultEmojis[9]} FROZEN-QUEEN BY MR.Chathura`;

    const movieListMessage = await conn.sendMessage(from, {
      text: frozenTheme.box("Cinematic Quest", filmList),
      ...frozenTheme.getForwardProps()
    }, { quoted: mek });

    const movieListMessageKey = movieListMessage.key;

    // Step 3: Track download options with a Map
    const downloadOptionsMap = new Map();

    // Step 4: Handle movie and quality selections with a single listener
    const selectionHandler = async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const replyText = message.message.extendedTextMessage.text.trim();
      const repliedToId = message.message.extendedTextMessage.contextInfo.stanzaId;

      // Exit condition
      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", selectionHandler);
        downloadOptionsMap.clear();
        await conn.sendMessage(from, {
          text: frozenTheme.box("Royal Farewell", 
            "❅ Cinematic quest ended!\n❅ Return to the Ice Kingdom anytime"),
          ...frozenTheme.getForwardProps()
        }, { quoted: message });
        return;
      }

      // Movie selection
      if (repliedToId === movieListMessageKey.id) {
        const selectedNumber = parseInt(replyText);
        const selectedFilm = films.find(film => film.number === selectedNumber);

        if (!selectedFilm) {
          await conn.sendMessage(from, {
            text: frozenTheme.box("Frozen Warning", 
              "❅ Invalid selection!\n❅ Choose a movie number\n❅ Snowgies are confused"),
            ...frozenTheme.getForwardProps()
          }, { quoted: message });
          return;
        }

        // Validate movie link
        if (!selectedFilm.link || !selectedFilm.link.startsWith('http')) {
          await conn.sendMessage(from, {
            text: frozenTheme.box("Ice Warning", 
              "❅ Invalid movie link provided\n❅ Please select another movie"),
            ...frozenTheme.getForwardProps()
          }, { quoted: message });
          return;
        }

        // Fetch download links and details
        const downloadUrl = `https://suhas-bro-api.vercel.app/movie/sinhalasub/movie?url=${encodeURIComponent(selectedFilm.link)}`;
        let downloadData;
        let downloadRetries = 3;

        while (downloadRetries > 0) {
          try {
            const downloadResponse = await axios.get(downloadUrl, { timeout: 10000 });
            downloadData = downloadResponse.data;
            if (!downloadData.status || !downloadData.result.data) {
              throw new Error("Invalid API response: Missing status or data");
            }
            break;
          } catch (error) {
            console.error(`Download API error: ${error.message}, Retries left: ${downloadRetries}`);
            downloadRetries--;
            if (downloadRetries === 0) {
              await conn.sendMessage(from, {
                text: frozenTheme.box("Ice Warning", 
                  `❅ Failed to fetch download links: ${error.message}\n❅ Please try another movie`),
                ...frozenTheme.getForwardProps()
              }, { quoted: message });
              return;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const movieDetails = downloadData.result.data;
        const downloadLinks = [];

        // Prioritize pixeldrain_dl links
        const allLinks = movieDetails.pixeldrain_dl || [];
        const sdLink = allLinks.find(link => link.quality === "SD 480p");
        if (sdLink) {
          downloadLinks.push({
            number: 1,
            quality: "SD Quality",
            size: sdLink.size,
            url: sdLink.link
          });
        }

        let hdLink = allLinks.find(link => link.quality === "HD 720p");
        if (!hdLink) {
          hdLink = allLinks.find(link => link.quality === "FHD 1080p");
        }
        if (hdLink) {
          downloadLinks.push({
            number: 2,
            quality: "HD Quality",
            size: hdLink.size,
            url: hdLink.link
          });
        }

        if (downloadLinks.length === 0) {
          await conn.sendMessage(from, {
            text: frozenTheme.box("Ice Warning", 
              "❅ No SD or HD quality links available\n❅ Please try another movie"),
            ...frozenTheme.getForwardProps()
          }, { quoted: message });
          return;
        }

        let downloadOptions = `${frozenTheme.resultEmojis[3]} *${selectedFilm.title}*\n\n`;
        downloadOptions += `${frozenTheme.resultEmojis[4]} *Choose Quality*:\n\n`;
        downloadLinks.forEach(link => {
          downloadOptions += `${frozenTheme.resultEmojis[0]} ${link.number}. *${link.quality}* (${link.size})\n`;
        });
        downloadOptions += `\n${frozenTheme.resultEmojis[8]} Select quality: Reply with the number\n`;
        downloadOptions += `${frozenTheme.resultEmojis[9]} Reply 'done' to stop\n`;
        downloadOptions += `${frozenTheme.resultEmojis[9]} FROZEN-QUEEN BY MR.Chathura`;

        const downloadMessage = await conn.sendMessage(from, {
          image: { url: movieDetails.image || "https://i.ibb.co/5Yb4VZy/snowflake.jpg" },
          caption: frozenTheme.box("Royal Treasury", downloadOptions),
          ...frozenTheme.getForwardProps()
        }, { quoted: message });

        // Store download options in Map
        downloadOptionsMap.set(downloadMessage.key.id, { film: selectedFilm, downloadLinks });
      }
      // Quality selection
      else if (downloadOptionsMap.has(repliedToId)) {
        const { film, downloadLinks } = downloadOptionsMap.get(repliedToId);
        const selectedQualityNumber = parseInt(replyText);
        const selectedLink = downloadLinks.find(link => link.number === selectedQualityNumber);

        if (!selectedLink) {
          await conn.sendMessage(from, {
            text: frozenTheme.box("Frozen Warning", 
              "❅ Invalid quality selection!\n❅ Choose a quality number\n❅ Snowgies are confused"),
            ...frozenTheme.getForwardProps()
          }, { quoted: message });
          return;
        }

        // Check file size
        const sizeStr = selectedLink.size.toLowerCase();
        let sizeInGB = 0;
        if (sizeStr.includes("gb")) {
          sizeInGB = parseFloat(sizeStr.replace("gb", "").trim());
        } else if (sizeStr.includes("mb")) {
          sizeInGB = parseFloat(sizeStr.replace("mb", "").trim()) / 1024;
        }

        if (sizeInGB > 2) {
          await conn.sendMessage(from, {
            text: frozenTheme.box("Ice Warning", 
              `❅ Item too large (${selectedLink.size})!\n❅ Direct download: ${selectedLink.url}\n❅ Try a smaller quality`),
            ...frozenTheme.getForwardProps()
          }, { quoted: message });
          return;
        }

        // Send movie as document
        try {
          await conn.sendMessage(from, {
            document: { url: selectedLink.url },
            mimetype: "video/mp4",
            fileName: `${film.title} - ${selectedLink.quality}.mp4`,
            caption: frozenTheme.box("Cinematic Treasure", 
              `${frozenTheme.resultEmojis[3]} *${film.title}*\n${frozenTheme.resultEmojis[4]} Quality: ${selectedLink.quality}\n${frozenTheme.resultEmojis[2]} Size: ${selectedLink.size}\n\n${frozenTheme.resultEmojis[8]} Your treasure shines in Ice Kingdom!\n${frozenTheme.resultEmojis[9]} FROZEN-QUEEN BY MR.Chathura`),
            ...frozenTheme.getForwardProps()
          }, { quoted: message });

          await conn.sendMessage(from, { react: { text: frozenTheme.resultEmojis[0], key: message.key } });
        } catch (downloadError) {
          await conn.sendMessage(from, {
            text: frozenTheme.box("Ice Warning", 
              `❅ Download error: ${downloadError.message}\n❅ Direct download: ${selectedLink.url}\n❅ Try again`),
            ...frozenTheme.getForwardProps()
          }, { quoted: message });
        }
      }
    };

    // Register the persistent selection listener
    conn.ev.on("messages.upsert", selectionHandler);

  } catch (e) {
    console.error("Error:", e);
    await conn.sendMessage(from, {
      text: frozenTheme.box("Ice Storm", 
        `❅ Error: ${e.message || "Ice Harpies destroyed the treasury"}\n❅ Royal treasury closed\n❅ Try again after the storm clears`),
      ...frozenTheme.getForwardProps()
    }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});
