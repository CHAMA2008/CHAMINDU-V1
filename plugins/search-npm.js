const axios = require("axios");
const { cmd } = require("../command");

const npmSearchCache = new Map();

cmd({
  pattern: "npm2",
  desc: "Search for npm packages",
  react: "📦",
  category: "convert",
  filename: __filename,
  use: ".npm <package-name>"
}, async (conn, mek, msg, { from, args, reply }) => {
  try {
    const query = args.join(" ");
    if (!query) return reply("🔍 Please provide a package name. Example: `.npm express`");

    const url = `https://api.npms.io/v2/search?q=${encodeURIComponent(query)}&size=5`;
    const res = await axios.get(url);
    const results = res.data.results;

    if (!results.length) return reply("❌ No packages found.");

    let caption = `
╭───────────────╮
   NPM PACKAGE DOWNLOADER
╰───────────────╯
╔═══════════════╗
     NPM SEARCH
╚═══════════════╝

📦 *Search Results:*
`;

    results.forEach((pkg, i) => {
      caption += `\n${i + 1}. *${pkg.package.name}* (v${pkg.package.version})\n   ${pkg.package.description || "No description"}\n`;
    });

    caption += `\n📝 Reply with the number of the package you want to view full details.\n\n─────────────────\nPowered by CHAMA-MD-V1`;

    npmSearchCache.set(from, results);
    await conn.sendMessage(from, { text: caption }, { quoted: mek });

  } catch (e) {
    console.error("NPM search error:", e);
    reply("⚠️ Error while searching. Please try again.");
  }
});

// 🧠 Handle number reply
cmd({
  on: "text"
}, async (conn, mek, msg, { from, body, reply }) => {
  const cached = npmSearchCache.get(from);
  if (!cached || !/^[1-5]$/.test(body.trim())) return;

  const index = parseInt(body.trim()) - 1;
  const selected = cached[index];
  if (!selected) return reply("❌ Invalid selection.");

  const pkg = selected.package;

  const response = `
╭───────『 📦 PACKAGE DETAILS 』───────╮

🔰 Name: ${pkg.name}
📄 Description: ${pkg.description || "No description"}
🆚 Version: ${pkg.version}
🪪 License: ${pkg.license || "N/A"}
👤 Author: ${pkg.author?.name || "Unknown"}
🔗 NPM: ${pkg.links.npm}
🔗 Repo: ${pkg.links.repository || "Not available"}

╰────────────────────────────╯
Powered by CHAMA-MD-V1
  `;

  reply(response);
  npmSearchCache.delete(from); // clear cache after use
});
