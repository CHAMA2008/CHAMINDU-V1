// created by chathura hanska❣️🌪️
// by frozen queen ❄️🌬️

const { cmd } = require("../command");
const axios = require("axios");
require("dotenv").config();
const CREATOR = "Chathura";

// Global variables to manage auto-news for Hiru
let newsInterval = null;
let autoNewsGroupId = null;
let lastSentNewsTitle = null;

// API endpoints
const hiruNewsApi = "https://suhas-bro-api.vercel.app/news/hiru";
const deranaNewsApi = "https://suhas-bro-api.vercel.app/news/derana";

// Command for automatic Hiru news updates
cmd(
  {
    pattern: "autonews",
    alias: ["autohirunews"],
    react: "📰",
    desc: "Enable or disable automatic Hiru news updates with FrozenQueen",
    category: "utility",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      isGroup,
      sender,
      senderNumber,
      botNumber2,
      botNumber,
      pushname,
      isMe,
      isOwner,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      reply,
    }
  ) => {
    try {
      const action = args[0]?.toLowerCase();

      if (action === "on") {
        if (newsInterval) {
          return reply("*❌ FrozenQueen Error:* Auto news is already enabled!");
        }

        if (!isGroup) {
          return reply("*❌ FrozenQueen Error:* This command can only be used in a group!");
        }

        autoNewsGroupId = from;
        const savedMek = { ...mek };

        const initialNews = await fetchNews(hiruNewsApi);
        if (initialNews) {
          await sendNews(robin, autoNewsGroupId, initialNews, "HIRU", savedMek);
          lastSentNewsTitle = initialNews.title;
        } else {
          reply("*❄️ FrozenQueen Warning:* Failed to fetch initial Hiru news. API may be down. Continuing with updates...");
        }

        newsInterval = setInterval(async () => {
          try {
            const news = await fetchNews(hiruNewsApi);
            if (news) {
              if (news.title !== lastSentNewsTitle) {
                await sendNews(robin, autoNewsGroupId, news, "HIRU", savedMek);
                lastSentNewsTitle = news.title;
              }
            } else {
              console.log("No new news or API issue detected.");
            }
          } catch (e) {
            console.error("FrozenQueen Auto-news check error:", e);
          }
        }, 300000);

        return reply(
          "*✅ FrozenQueen Auto News Enabled!* ❄️\n" +
          "- Latest Hiru news sent (if available).\n" +
          "- Checking for updates every 5 minutes."
        );
      } else if (action === "off") {
        if (!newsInterval) {
          return reply("*❌ FrozenQueen Error:* Auto news is not enabled!");
        }

        clearInterval(newsInterval);
        newsInterval = null;
        autoNewsGroupId = null;
        lastSentNewsTitle = null;

        return reply("*✅ FrozenQueen Auto News Disabled!* ❄️");
      } else {
        return reply("*❌ FrozenQueen Error:* Invalid action! Use `.autonews on` or `.autonews off`.");
      }
    } catch (e) {
      console.error("FrozenQueen Auto-news error:", e);
      reply(`*❌ FrozenQueen Error:* ${e.message || "Something went wrong. Please try again later."}`);
    }
  }
);

// Command for manual Ada Derana news using Derana API
cmd(
  {
    pattern: "derana",
    alias: ["derananews"],
    react: "📰",
    desc: "Get the latest Ada Derana news update manually",
    category: "utility",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    { from, quoted, reply }
  ) => {
    try {
      const latestNews = await fetchNews(deranaNewsApi);

      if (!latestNews || !latestNews.title) {
        return reply("*❌ FrozenQueen Error:* Failed to fetch the latest Ada Derana news. The API may be down or returned no data.");
      }

      console.log("Derana API Response (latestNews):", JSON.stringify(latestNews, null, 2));

      // Validate image URL
      const imageUrl = latestNews.image && typeof latestNews.image === "string" && latestNews.image.match(/\.(jpg|jpeg|png|gif)$/i) ? latestNews.image : null;

      if (!imageUrl) {
        console.log("FrozenQueen: No valid image URL found, sending text-only message");
      }

      const messageContent = {
        caption: `
*📰 ${latestNews.title} (Ada Derana)* ❄️

📅 *Date:* ${latestNews.date || "Not available"}
📝 *Description:* ${latestNews.desc || "No description available"}

🔗 *Read more:* ${latestNews.url || "No link available"}

*❄️ FrozenQueen News Generated ❄️*
        `,
      };

      if (imageUrl) {
        messageContent.image = { url: imageUrl };
      }

      await robin.sendMessage(from, messageContent, { quoted: mek });
      console.log("FrozenQueen: Successfully sent Ada Derana news via API");
    } catch (e) {
      console.error("FrozenQueen Derana news error:", e);
      reply(`*❌ FrozenQueen Error:* ${e.message || "Something went wrong. Please try again later."}`);
    }
  }
);

// Function to fetch news from an API (used for both Hiru and Derana)
async function fetchNews(apiUrl) {
  try {
    const response = await axios.get(apiUrl, { timeout: 10000 });
    console.log("Raw API Response from", apiUrl, ":", JSON.stringify(response.data, null, 2));
    if (!response.data || !response.data.status || !response.data.result) {
      console.log("FrozenQueen: No news found or invalid response format from API:", apiUrl);
      return null;
    }
    return response.data.result; // Expected: { title, image, date, desc, url } for Derana
  } catch (e) {
    console.error("FrozenQueen: Failed to fetch news from API:", apiUrl, e.response ? e.response.status : e.message);
    return null;
  }
}

// Function to send news to the group (updated for Hiru compatibility)
async function sendNews(client, groupId, news, source, replyTo) {
  try {
    if (!groupId) {
      console.error("FrozenQueen: No group ID available for sending news");
      return;
    }

    const imageUrl = (news.image || news.img) && typeof (news.image || news.img) === "string" && (news.image || news.img).match(/\.(jpg|jpeg|png|gif)$/i) ? (news.image || news.img) : null;

    if (!imageUrl) {
      console.log("FrozenQueen: No valid image URL found for", source, ", sending text-only message");
    }

    const messageContent = {
      caption: `
*📰 ${news.title} (${source})* ❄️

📅 *Date:* ${news.date || "Not available"}
📝 *Description:* ${news.desc || "No description available"}

🔗 *Read more:* ${news.link || news.url || "No link available"}

*❄️ FrozenQueen Auto News Generated ❄️*
      `,
    };

    if (imageUrl) {
      messageContent.image = { url: imageUrl };
    }

    await client.sendMessage(groupId, messageContent, { quoted: replyTo });
    console.log(`FrozenQueen: Successfully sent ${source} news to group`);
  } catch (e) {
    console.error("FrozenQueen: Failed to send news:", e);
  }
}

module.exports = { fetchNews, sendNews };
