const fetch = require("node-fetch");
const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { cmd } = require("../command");

cmd({
  pattern: "statue",
  alias: ["status", "st"],
  desc: "Get best TikTok status videos.",
  react: '✅',
  category: 'tools',
  filename: __filename
}, async (conn, m, store, { from, args, reply, pushname }) => {
  if (!args[0]) {
    return reply("🌸 *Status videos for what?*\n\n*Usage Example:*\n.statue <query>");
  }

  const query = args.join(" ");
  await store.react('⌛');

  try {
    reply(`🔎 Searching TikTok Status Videos for: *${query}*`);

    const response = await fetch(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      await store.react('❌');
      return reply("❌ No status videos found. Try a different keyword!");
    }

    const results = data.data.sort(() => Math.random() - 0.5).slice(0, 10);
    const cards = [];

    for (let i = 0; i < results.length; i++) {
      const video = results[i];

      if (!video.nowm) continue;

      cards.push({
        body: proto.Message.InteractiveMessage.Body.fromObject({
          text: `🎬 ${video.title}`
        }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({
          text: `🎥 By: ${video.author || 'Unknown'} | Duration: ${video.duration || 'Unknown'}`
        }),
        header: proto.Message.InteractiveMessage.Header.fromObject({
          title: `TikTok Status ${i + 1}`,
          hasMediaAttachment: true,
          videoMessage: {
            url: video.nowm,
            mimetype: 'video/mp4',
            caption: `🌸 *${video.title}*`
          }
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: []
        })
      });
    }

    if (cards.length === 0) {
      return reply("❌ No valid videos to display!");
    }

    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.create({
              text: '📱 TikTok Status Videos for: ' + query
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: '> *© ❄️Frozen-queen❄️ by mr chathura*'
            }),
            header: proto.Message.InteractiveMessage.Header.create({
              hasMediaAttachment: false
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
              cards
            })
          })
        }
      }
    }, {});

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    await store.react('✅');

  } catch (error) {
    console.error("Error in Statue Command:", error);
    await store.react('❌');
    reply("❌ An error occurred while searching TikTok status videos. Please try again later.");
  }
});
