const { cmd } = require("../command");
const axios = require("axios");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

cmd({
  pattern: "aistick",
  alias: ["aisticker", "fluxsticker","ais"],
  desc: "Generate an AI image and convert it to sticker.",
  category: "sticker",
  use: "<prompt>",
  filename: __filename,
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("Please provide a prompt.\n*Example:* .aistick anime girl with sword");

    await reply("> *GENERATING AI STICKER...*");

    // Step 1: Generate AI image
    const apiUrl = `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    if (!response || !response.data) {
      return reply("❌ Failed to get image from AI API.");
    }

    const imageBuffer = Buffer.from(response.data, "binary");

    // Step 2: Convert to sticker
    const sticker = new Sticker(imageBuffer, {
      pack: "CHAMA-MD-V1",
      author: "FluxAI",
      type: StickerTypes.FULL,
      categories: ["🌟", "🤖"],
      quality: 80,
    });

    const stickerBuffer = await sticker.toBuffer();

    await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: mek });

  } catch (err) {
    console.error("AI Sticker Error:", err);
    reply(`❌ Error: ${err.response?.data?.message || err.message}`);
  }
});
