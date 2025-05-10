const { cmd } = require('../command');
const fs = require('fs');

cmd({
    pattern: "addcontacts",
    desc: "Add contacts from a .vcf file to the group",
    category: "admin",
    react: "📁",
    filename: __filename
},
async (conn, mek, m, {
    from, isGroup, isBotAdmins, reply, senderNumber
}) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    const botOwner = conn.user.id.split(":")[0];
    if (senderNumber !== botOwner) return reply("❌ Only the bot owner can use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to add members.");

    if (!m.quoted || m.quoted.mimetype !== 'text/x-vcard') {
        return reply("❌ Please reply to a .vcf contact file.");
    }

    try {
        const vcfFile = await conn.downloadAndSaveMediaMessage(m.quoted);
        const data = fs.readFileSync(vcfFile, 'utf-8');
        const regex = /TEL.*?:\+?(\d{7,15})/g;
        let match;
        const numbers = new Set();

        while ((match = regex.exec(data)) !== null) {
            numbers.add(match[1].replace(/^0+/, '').replace(/^+/, '').replace(/^94/, '')); // Clean
        }

        const cleanNumbers = Array.from(numbers).map(n => (n.startsWith("94") ? n : `94${n}`));
        let success = [], failed = [];

        for (const num of cleanNumbers) {
            const jid = `${num}@s.whatsapp.net`;
            try {
                await conn.groupParticipantsUpdate(from, [jid], "add");
                success.push(`@${num}`);
            } catch (e) {
                failed.push(num);
            }
        }

        let msg = "";
        if (success.length) msg += `✅ Successfully added:\n${success.join(", ")}\n`;
        if (failed.length) msg += `❌ Failed to add:\n${failed.join(", ")}`;
        reply(msg, { mentions: success.map(n => `${n}@s.whatsapp.net`) });
        fs.unlinkSync(vcfFile);
    } catch (err) {
        console.error(err);
        reply("❌ Error reading the contact file.");
    }
});
