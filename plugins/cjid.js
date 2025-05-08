const { cmd } = require('../command');

cmd({
    pattern: "cjid1",
    desc: "Get JID of current chat (Channel supported)",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, {
    from, reply
}) => {
    try {
        if (from.endsWith('@newsletter')) {
            return reply(`📣 *Channel JID:*\n\`\`\`${from}\`\`\``);
        } else {
            return reply(`❌ *Not a Channel*\nThis chat isn't a WhatsApp Channel.\n\nJID: \`\`\`${from}\`\`\``);
        }
    } catch (e) {
        console.error("Channel JID Error:", e);
        reply(`⚠️ Error:\n${e.message}`);
    }
});
