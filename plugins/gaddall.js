const { cmd } = require('../command');

cmd({
    pattern: "adds",
    alias: ["adar", "invite"],
    desc: "Adds one or more members to the group",
    category: "admin",
    react: "➕",
    filename: __filename
},
async (conn, mek, m, {
    from, q, isGroup, isBotAdmins, reply, quoted, senderNumber
}) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");

    const botOwner = conn.user.id.split(":")[0];
    if (senderNumber !== botOwner) {
        return reply("❌ Only the bot owner can use this command.");
    }

    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let numbers = [];

    // Case 1: Quoted message
    if (m.quoted) {
        numbers.push(m.quoted.sender.split("@")[0]);
    }

    // Case 2: Mentioned users
    if (m.mentionedJid?.length) {
        numbers.push(...m.mentionedJid.map(jid => jid.split("@")[0]));
    }

    // Case 3: Numbers separated by comma or space
    if (q) {
        const rawNumbers = q.split(/[,\s]+/).filter(x => /^\d+$/.test(x));
        numbers.push(...rawNumbers);
    }

    // Remove duplicates
    numbers = [...new Set(numbers)];

    if (numbers.length === 0) {
        return reply("❌ Please reply to a message, mention users, or provide numbers separated by commas.");
    }

    let success = [], failed = [];

    for (let num of numbers) {
        const jid = num + "@s.whatsapp.net";
        try {
            await conn.groupParticipantsUpdate(from, [jid], "add");
            success.push(`@${num}`);
        } catch (e) {
            console.error(`Failed to add ${num}:`, e.message);
            failed.push(num);
        }
    }

    let message = "";
    if (success.length) message += `✅ Successfully added:\n${success.join(", ")}\n`;
    if (failed.length) message += `❌ Failed to add:\n${failed.join(", ")}`;

    reply(message, { mentions: success.map(n => n + "@s.whatsapp.net") });
});
