const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions')

cmd({
    pattern: "tagall",
    react: "📢",
    alias: ["gc_tagall"],
    desc: "To Tag all Members",
    category: "group",
    use: '.tagall [message]',
    filename: __filename
},
async (conn, mek, m, { from, participants, reply, isGroup, senderNumber, groupAdmins, prefix, command, args, body }) => {
    try {
        if (!isGroup) return reply("❌ *This command can only be used in group chats.*");

        const botOwner = conn.user.id.split(":")[0];
        const senderJid = senderNumber + "@s.whatsapp.net";

        if (!groupAdmins.includes(senderJid) && senderNumber !== botOwner) {
            return reply("❌ *Only group admins or the bot owner can use this command.*");
        }

        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply("❌ *Failed to fetch group information.*");

        let groupName = groupInfo.subject || "Unknown Group";
        let totalMembers = participants?.length || 0;
        if (totalMembers === 0) return reply("❌ *No members found in this group.*");

        // Try to get group profile picture
        let groupPP;
        try {
            groupPP = await conn.profilePictureUrl(from, 'image');
        } catch {
            groupPP = 'https://telegra.ph/file/9dc3ae2b3d74458bdfd46.jpg'; // fallback image
        }

        const emojis = ['📢', '🔊', '🌐', '🛡️', '🚀', '🎯', '🧿', '🪩', '🌀', '💠', '🎊', '🎧', '📣', '🗣️'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const message = body.slice(body.indexOf(command) + command.length).trim() || "📣 *Hello everyone!*";

        let teks = `╭───❰ *📛 Group Announcement* ❱───╮
│ 📌 *Group:* ${groupName}
│ 👥 *Members:* ${totalMembers}
│ 💬 *Message:* ${message}
╰────────────────────────────╯

📍 *Mentioning all members below:*\n`;

        for (let mem of participants) {
            if (!mem.id) continue;
            teks += `${randomEmoji} @${mem.id.split('@')[0]}\n`;
        }

        teks += `\n━━━━━━⊱ *CHMA ┃ MD* ⊰━━━━━━`;

        await conn.sendMessage(from, {
            image: { url: groupPP },
            caption: teks.trim(),
            mentions: participants.map(p => p.id)
        }, { quoted: mek });

    } catch (e) {
        console.error("TagAll Error:", e);
        reply(`❌ *An error occurred!*\n\n_Error:_ ${e.message || e}`);
    }
});
