const config = require("../config");
const os = require('os');
const axios = require('axios');
const cheerio = require('cheerio');
const {
  cmd,
  commands
} = require("../command");
const {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl, // isUrl is needed to validate image URLs
  Json,
  runtime,
  sleep, // sleep might be useful to add delays between sending images
  fetchJson,
  jsonformat
} = require("../lib/functions");
const {
  default: makeWASocket,
  makeWALegacySocket,
  extractMessageContent,
  makeInMemoryStore,
  proto,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  getBinaryNodeChild,
  jidDecode,
  areJidsSameUser,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  WAMessageStubType,
  WA_DEFAULT_EPHEMERAL
} = require("@whiskeysockets/baileys");

// --- Configuration ---
// Group JID for auto news is in config.js (config.AUTO_NEWS_JID)
// Auto update interval is set to 1 minute (60000 ms)
const LANKADEEPA_CHECK_INTERVAL_MS = 1 * 60 * 1000; // 1 minute interval for checking

// --- State variables for auto-news ---
let autoLankadeepaNewsInterval = null;
let isAutoLankadeepaNewsRunning = false;
let lastSentLankadeepaLink = null; // State for Lankadeepa auto news


// --- Helper Functions for Scraping ---

// Lankadeepa Scraping (HTML) - Fetches details of the latest article
const scrapeLatestLankadeepaNews = async () => { // Renamed function for clarity
    try {
        const res = await axios.get("https://www.lankadeepa.lk/latest_news/1");
        const $ = cheerio.load(res.data);

        // Get the news article URL, image, title, and date from the listing page
        // !! IMPORTANT: These selectors might need updating if Lankadeepa changes its website structure !!
        const firstArticle = $("div.m-t--10.p-b-40 > div:nth-child(1)"); // Select the first article block
        const articleUrl = firstArticle.find("a").attr("href"); // Link is on the 'a' tag inside
        const imageUrl = firstArticle.find("a > img").attr("src"); // Image is on the 'img' tag inside 'a'
        const title = firstArticle.find("div > h5:nth-child(1) > a").text().trim(); // Title is inside h5
        const date = firstArticle.find("div > span > span.f1-s-4.cl8.hov-cl10.trans-03.timec").text().trim(); // Date selector


        if (!articleUrl) {
            console.warn("Lankadeepa: Could not find latest article URL from listing page.");
            return null; // Return null if link not found on listing
        }

        // Make articleUrl absolute if it's relative
         const fullArticleUrl = articleUrl.startsWith('http') ? articleUrl : `https://www.lankadeepa.lk${articleUrl}`;

        // Get the description and additional images from the article's detailed page
        const articleRes = await axios.get(fullArticleUrl);
        const $$ = cheerio.load(articleRes.data);

        // Extract the description text
        // !! IMPORTANT: Description selector might need updating !!
        const description = $$("div.header.inner-content.p-b-20").find('p').text().trim();

        // --- Find additional images within the description container ---
        // !! IMPORTANT: Image selectors might need updating if the structure changes !!
        // Try finding images directly within the description div or inside paragraphs within it
        const additionalImages = $$("div.header.inner-content.p-b-20 img").map((i, el) => $$(el).attr('src')).get();

        const validatedImages = [];
         for (const img of additionalImages) {
             if (img) {
                 const fullImgUrl = img.startsWith('http') ? img : `https://www.lankadeepa.lk${img}`;
                 if (isUrl(fullImgUrl)) { // Use the isUrl helper to validate
                     validatedImages.push(fullImgUrl);
                 } else {
                     console.warn("Lankadeepa: Invalid additional image URL found:", fullImgUrl);
                 }
             }
         }
        // --- End of finding additional images ---

        return {
            title: title || 'No Title',
            link: fullArticleUrl,
            date: date || 'No Date',
            imageUrl: imageUrl && isUrl(imageUrl.startsWith('http') ? imageUrl : `https://www.lankadeepa.lk${imageUrl}`) ? (imageUrl.startsWith('http') ? imageUrl : `https://www.lankadeepa.lk${imageUrl}`) : null, // Validate and make main image absolute
            description: description || 'No description available.',
            additionalImages: validatedImages
        };

    } catch (err) {
        console.error("Error scraping Lankadeepa news:", err);
        return null; // Return null on any scraping error
    }
};


// --- Main Auto News Logic Function ---

// Function to check for new Lankadeepa news and send
const checkAndSendLankadeepaNews = async (client) => {
    // Use the state variable to ensure auto news is enabled
    if (!isAutoLankadeepaNewsRunning || !config.AUTO_NEWS_JID) { // Check state and JID
        console.warn("Lankadeepa auto news check skipped (not running or JID not configured).");
        // If auto news is supposed to be running but JID is gone, stop the interval
        if (!config.AUTO_NEWS_JID && isAutoLankadeepaNewsRunning) {
             stopAutoLankadeepaNews();
             isAutoLankadeepaNewsRunning = false; // Ensure state is false
              // Optional: Notify owner
              // if (config.OWNER_JID) { ... }
        }
        return;
    }

    const targetJid = config.AUTO_NEWS_JID;

    try {
        const latestNews = await scrapeLatestLankadeepaNews(); // Use the combined scraping function

        if (!latestNews || !latestNews.link) {
            console.log("Lankadeepa Auto: Skipping send due to failure in scraping latest news or missing link.");
            return; // Stop if scraping failed or link is missing
        }

        const { title, link, date, imageUrl, description, additionalImages } = latestNews;

        // --- Check if this is a new article ---
        // This is the core logic to send ONLY when a NEW article is detected.
        if (link && link !== lastSentLankadeepaLink) {
            console.log(`New Lankadeepa news detected! Link: ${link}. Last sent link: ${lastSentLankadeepaLink}`);

            // --- Format and Send Message ---
            let caption = `╭═════════════════⚆
> *𝗖𝗛𝗔𝗠𝗔 𝗠𝗗 𝗩1 👩‍💻*
╰═════════════════⚆
🇱🇰 *_LANKADEEPA NEWS_* 📰
            
*📚 සිරස්තලය:* ${title}
*🔖 Link:* ${link}
*📅 දිනය:* ${date}
*📝 විස්තරය:*
${description}`;

            // Send the main message (assuming auto messages don't need to be quoted)
            if (imageUrl) { // imageUrl is already validated and absolute by scrape function
                 await client.sendMessage(targetJid, { image: { url: imageUrl }, caption: caption });
                 console.log(`Lankadeepa Auto: Sent main news image with caption.`);
             } else {
                 await client.sendMessage(targetJid, { text: caption });
                 console.warn(`Lankadeepa Auto: Missing main image URL. Sending caption as text.`);
             }

             // Send additional images
             if (additionalImages.length > 0) {
                 console.log(`Lankadeepa Auto: Found ${additionalImages.length} additional images. Sending...`);
                 // Optional: Send a separator message before additional images
                 // await client.sendMessage(targetJid, { text: "අමතර පින්තූර:" });
                 for (const extraImgUrl of additionalImages) { // additionalImages is already validated
                     try {
                          // Send each additional image as a separate message without a caption
                          await client.sendMessage(targetJid, { image: { url: extraImgUrl } });
                         // Optional: Add a small delay between sending images to avoid flooding
                         // await sleep(500); // Uncomment this line if you imported sleep
                     } catch (imgErr) {
                         console.error("Lankadeepa Auto: Error sending additional image:", extraImgUrl, imgErr);
                     }
                 }
             }

            // --- Update last sent link ONLY AFTER successful sending ---
            lastSentLankadeepaLink = link;
            console.log(`Successfully sent new Lankadeepa news. Updated lastSentLankadeepaLink.`);

        } else {
             // If the link is the same as the last sent link, it means no new news has been published.
             // console.log(`Lankadeepa Auto: No new news detected. Last sent: ${lastSentLankadeepaLink || 'None'}, Latest scraped: ${link}`); // Uncomment for debugging
        }

    } catch (err) {
        console.error("Error in Lankadeepa auto news check:", err);
         // Optional: Notify owner about the error
         // if (config.OWNER_JID) { ... }
    }
};


// Function to start the Lankadeepa auto news checker interval
function startAutoLankadeepaNews(client) {
    // Clear any existing interval
    if (autoLankadeepaNewsInterval) {
        clearInterval(autoLankadeepaNewsInterval);
        autoLankadeepaNewsInterval = null;
    }

    console.log(`Starting Lankadeepa auto news checker interval. Checking every ${LANKADEEPA_CHECK_INTERVAL_MS / 1000} seconds.`);

    // On startup, set the initial lastSentLink without sending a message
    // This helps populate lastSentLankadeepaLink on startup so the first article
    // after startup doesn't get sent if it was already sent before.
     const setInitialLankadeepaLink = async () => {
         console.log("Setting initial Lankadeepa news link on startup...");
         try {
             const latestNews = await scrapeLatestLankadeepaNews(); // Use the combined scraping function
             if (latestNews && latestNews.link) {
                 lastSentLankadeepaLink = latestNews.link;
                 console.log("Initial Lankadeepa link set:", lastSentLankadeepaLink);
             } else {
                 console.warn("Lankadeepa: Could not find initial link on startup.");
             }
         } catch (e) {
             console.error("Error setting initial Lankadeepa link:", e);
         }
     };
     setInitialLankadeepaLink(); // Run initial link setting asynchronously


    // Set the interval to check for new news
    // Only set the interval if auto news is intended to be running and JID is configured
    // The 'isAutoLankadeepaNewsRunning' state must be set TRUE via a command BEFORE calling startAutoLankadeepaNews
    // if you want it to start the interval automatically after initial link setting.
    // Or, the main bot index.js should handle saving/loading isAutoLankadeepaNewsRunning state.

    // Based on your autoLankadeepaOn command calling startAutoLankadeepaNews, the interval
    // will only effectively start AFTER you use the .autolankadeepon command.
    // The initial link setting runs as soon as startAutoLankadeepaNews is called.

     if (isAutoLankadeepaNewsRunning && config.AUTO_NEWS_JID) {
         // Set the interval AFTER initial links are potentially set
         autoLankadeepaNewsInterval = setInterval(async () => {
             // Check the state again inside the interval just in case
             if (isAutoLankadeepaNewsRunning && config.AUTO_NEWS_JID) {
                await checkAndSendLankadeepaNews(client);
             } else if (!config.AUTO_NEWS_JID) {
                 console.warn("AUTO_NEWS_JID is not configured during interval check. Stopping interval.");
                 stopAutoLankadeepaNews(); // Stop if JID is missing
                 isAutoLankadeepaNewsRunning = false; // Ensure state is false
                  // Optional: Notify owner
                  // if (config.OWNER_JID) { ... }
             } else {
                 // This case happens if the state was true but JID is missing
                 console.warn("Lankadeepa auto news interval checking but JID is missing. Stopping.");
                 stopAutoLankadeepaNews();
                 isAutoLankadeepaNewsRunning = false;
             }
         }, LANKADEEPA_CHECK_INTERVAL_MS);
         console.log("Periodic Lankadeepa auto news interval started.");
     } else {
         console.log("Lankadeepa auto news is not enabled initially or JID is not configured. Interval will not start.");
         // If the state was true but JID was missing when startAutoLankadeepaNews was called initially
          if (!config.AUTO_NEWS_JID && isAutoLankadeepaNewsRunning) {
              stopAutoLankadeepaNews(); // Ensure it's stopped
              isAutoLankadeepaNewsRunning = false;
          }
     }
}

// Function to stop the Lankadeepa auto news checker interval
function stopAutoLankadeepaNews() {
    if (autoLankadeepaNewsInterval) {
        clearInterval(autoLankadeepaNewsInterval);  // Stop the interval
        autoLankadeepaNewsInterval = null;
        console.log("⚒️ Lankadeepa Auto news checker stopped.");
        // Note: lastSentLankadeepaLink is NOT reset here.
    }
}

// --- Add new Auto ON/OFF Command Definitions ---

const autoLankadeepaOnCommand = {
    pattern: "lautonewson", // Specific command name
    react: '✅',
    desc: "Enable auto Lankadeepa news sending to the configured group (Owner only).",
    category: 'owner',
    use: ".autolankadeepon",
    filename: __filename
};

const autoLankadeepaOffCommand = {
    pattern: "lautonewsoff", // Specific command name
    react: '❌',
    desc: "Disable auto Lankadeepa news sending (Owner only).",
    category: 'owner',
    use: ".autolankadeepoff",
    filename: __filename
};


// --- Command Definitions --- (Keep existing manual command)
const lankadeepaCommand = {
  pattern: "lankadeepa",
  react: '🇱🇰',
  desc: "To see the latest Lankadeepa news.",
  category: 'news',
  use: ".lankadeepa",
  filename: __filename
};


// --- Command Registrations ---

// Register Manual Lankadeepa command
cmd(lankadeepaCommand, async (client, message, msgInfo, {
  from, // Chat ID to send reply
  reply // Function to reply
}) => {
  try {
    const latestNews = await scrapeLatestLankadeepaNews(); // Use the combined scraping function

    if (!latestNews || !latestNews.link) {
        console.error("Lankadeepa Manual: Could not get latest news details.");
        return reply("සමාවෙන්න, ලංකාදීප පුවත් ලබාගැනීමට නොහැකි විය."); // Error message
    }

     const { title, link, date, imageUrl, description, additionalImages } = latestNews;

    // Format the message to send
    let caption = `╭═════════════════⚆
> *𝗖𝗛𝗔𝗠𝗔 𝗠𝗗 𝗩1 👩‍💻*
╰═════════════════⚆
🇱🇰 *_LANKADEEPA NEWS_* 📰
            
*📚 සිරස්තලය:* ${title}
*🔖 Link:* ${link}
*📅 දිනය:* ${date}
*📝 විස්තරය:*
${description}`;


    // Send the main message with the primary image and caption
     if (imageUrl) { // imageUrl is already validated and absolute
        await client.sendMessage(from, {
          image: { url: imageUrl },
          caption: caption
        }, { quoted: message }); // Quote the original command message
        console.log(`Lankadeepa Manual: Sent main news image with caption.`);

    } else {
        // Send caption as text if main image is missing or invalid
         await client.sendMessage(from, { text: caption }, { quoted: message }); // Quote the original command message
         console.warn(`Lankadeepa Manual: Missing main image URL. Sending caption as text.`);
    }


    // Send additional images as separate messages
    if (additionalImages.length > 0) {
        console.log(`Lankadeepa Manual: Found ${additionalImages.length} additional images. Sending...`);
        // Optional: Send a separator message
        // await client.sendMessage(from, { text: "අමතර පින්තූර:" }, { quoted: message }); // Can quote separator too
        for (const extraImgUrl of additionalImages) { // additionalImages is already validated
            try {
                 // Send each additional image as a separate message without a caption
                 await client.sendMessage(from, { image: { url: extraImgUrl } }); // Not quoting subsequent messages usually
                 // Optional: Add a small delay between sending images
                 // await sleep(500); // Uncomment this line if you imported sleep
             } catch (imgErr) {
                console.error("Lankadeepa Manual: Error sending additional image:", extraImgUrl, imgErr);
            }
        }
    }

    // Optional: React to the message
    // Reacting to the original command message is usually best practice
     await client.sendMessage(from, {
       react: {
         text: '✅',
         key: message.key // React to the original command message key
       }
     });


  } catch (err) {
    console.error("Error executing lankadeepa command:", err);
    reply("සමාවෙන්න, මේ මොහොතේ ලංකාදීප පුවත් ලබාගැනීමට නොහැකි විය."); // Inform the user
  }
});


// Register Auto ON/OFF Commands
cmd(autoLankadeepaOnCommand, async (client, message, msgInfo, { isOwner, reply }) => {
    if (!isOwner) {
        return reply("මෙම විධානය භාවිතා කළ හැක්කේ බොට් හිමිකරුට පමණි.");
    }
    if (!config.AUTO_NEWS_JID) {
        return reply("ස්වයංක්‍රීය පුවත් යැවිය යුතු කණ්ඩායම config.js හි AUTO_NEWS_JID යටතේ සකසා නොමැත.");
    }
    if (isAutoLankadeepaNewsRunning) {
        return reply("ස්වයංක්‍රීය ලංකාදීප පුවත් දැනටමත් ක්‍රියාත්මකයි.");
    }

    isAutoLankadeepaNewsRunning = true;
    startAutoLankadeepaNews(client); // Pass client

    reply(`ස්වයංක්‍රීය ලංකාදීප පුවත් ක්‍රියාත්මක කරන ලදී. නව පුවත් සඳහා සෑම මිනිත්තුවකට වරක් පරීක්ෂා කරනු ලැබේ. (යැවීමට නියමිත කණ්ඩායම: ${config.AUTO_NEWS_JID})`); // Updated reply message

    await client.sendMessage(message.key.remoteJid, { react: { text: '✅', key: message.key } });
});

cmd(autoLankadeepaOffCommand, async (client, message, msgInfo, { isOwner, reply }) => {
    if (!isOwner) {
        return reply("මෙම විධානය භාවිතා කළ හැක්කේ බොට් හිමිකරුට පමණි.");
    }
    if (!isAutoLankadeepaNewsRunning) {
        return reply("ස්වයංක්‍රීය ලංකාදීප පුවත් දැනටමත් අක්‍රීයයි.");
    }

    isAutoLankadeepaNewsRunning = false;
    stopAutoLankadeepaNews();

    reply("ස්වයංක්‍රීය ලංකාදීප පුවත් අක්‍රීය කරන ලදී.");

    await client.sendMessage(message.key.remoteJid, { react: { text: '❌', key: message.key } });
});
