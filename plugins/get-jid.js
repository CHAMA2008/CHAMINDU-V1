const { cmd } = require('../command');

cmd({
    pattern: "jid",
    alias: ["id", "chatid", "gjid"],
    desc: "Get full JID of current chat/user/channel (Creator Only)",
    react: "🆔",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, {
    from, isGroup, isCreator, reply, sender
}) => {
    try {
        if (!isCreator) {
            return reply("❌ *Command Restricted* - Only my creator can use this.");
        }

        let type = "❓ Unknown";
        let jid = from;
        let id = jid.split('@')[0];

        if (from.endsWith('@g.us')) {
            type = "👥 Group";
        } else if (from.endsWith('@s.whatsapp.net')) {
            type = "👤 Private Chat";
            jid = sender;
            id = jid.split('@')[0];
        } else if (from.endsWith('@broadcast')) {
            type = "📢 Broadcast List";
        } else if (from.endsWith('@newsletter')) {
            type = "📣 Channel";
        }

        const message = `╭───〔 *CHAT INFO* 〕───
│ 🆔 *ID:* ${id}
│ 🗂️ *Type:* ${type}
│ 🔗 *JID:* \`\`\`${jid}\`\`\`
╰──────────────────────`;

        reply(message);

    } catch (e) {
        console.error("JID Error:", e);
        reply(`⚠️ Error fetching JID:\n${e.message}`);
    }
});
