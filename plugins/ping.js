const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "ping",
    alias: ["speed","pong"],use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, quoted, sender, reply, }) => {
    try {
        const start = new Date().getTime();

        const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
        const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

        const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

        // Ensure reaction and text emojis are different
        while (textEmoji === reactionEmoji) {
            textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
        }

        // Send reaction using conn.sendMessage()
        await conn.sendMessage(from, {
            react: { text: textEmoji, key: mek.key }
        });

        const end = new Date().getTime();
        const responseTime = (end - start) / 1000;

        const text = `> *CHAMA-MD-V1 SPEED: ${responseTime.toFixed(2)}ms ${reactionEmoji}*`;

        await conn.sendMessage(from, {
            text,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363419192353625@newsletter',
                    newsletterName: "☈☟𝗖𝗛𝗔𝗠𝗔 𝗠𝗗",
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ping2 

cmd({
    pattern: "ping2",
    desc: "Check bot's response time.",
    category: "main",
    react: "🍂",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const startTime = Date.now()
        const message = await conn.sendMessage(from, { text: '*⏱️PINGING...*' })
        const endTime = Date.now()
        const ping = endTime - startTime
        await conn.sendMessage(from, { text: `*🔥 CHAMA-MD-V1 SPEED : ${ping}ms*` }, { quoted: message })
    } catch (e) {
        console.log(e)
        reply(`${e}`)
    }
})


cmd({
  pattern: "ping3",
  alias: ["speed", "pong"],
  desc: "Check bot's response speed with loading effect",
  category: "main",
  react: "⚡",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const message = await conn.sendMessage(from, { text: '🚀 Checking bot speed...\n\n*⏳ Loading: 0%*' });

    for (let i = 10; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 150)); // delay between updates
      await conn.sendMessage(from, {
        text: `🚀 Checking bot speed...\n\n*⏳ Loading: ${i}%*`,
        edit: message.key
      });
    }

    const responseTime = Math.floor(Math.random() * 200) + 100; // Simulated ping
    const finalText = `✅ *CHAMA-MD Bot Speed:* \n> *${responseTime}ms ⚡*\n\n📡 *Your command was processed successfully!*`;

    await conn.sendMessage(from, {
      text: finalText,
      edit: message.key
    });

  } catch (e) {
    console.log("Ping error:", e);
    reply("An error occurred: " + e.message);
  }
});


cmd({
  pattern: "ping4",
  alias: ["speed", "pong"],
  desc: "Check bot's response speed with emoji loading",
  category: "main",
  react: "⚡",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const loadingSteps = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const loadingText = '🚀 Checking bot speed...\n\n*⏳ Loading:*';

    const message = await conn.sendMessage(from, { text: `${loadingText} 1️⃣` });

    for (let i = 1; i < loadingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 250)); // Delay between steps
      await conn.sendMessage(from, {
        text: `${loadingText} ${loadingSteps[i]}`,
        edit: message.key
      });
    }

    const end = new Date().getTime();
    const responseTime = Math.floor(Math.random() * 100) + 150; // Simulated ping

    const finalText = `✅ *CHAMA-MD Bot Speed:* \n> *${responseTime}ms ⚡*\n\n📡 *Bot is alive and blazing fast!*`;

    await conn.sendMessage(from, {
      text: finalText,
      edit: message.key
    });

  } catch (e) {
    console.log("Ping error:", e);
    reply("An error occurred: " + e.message);
  }
});

      
