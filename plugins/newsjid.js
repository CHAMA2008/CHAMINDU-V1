const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
  name: 'sendlankanews',
  alias: ['lankadeepa', 'news'],
  description: 'Get latest Lankadeepa news headlines with image and description',
  category: '🌐 𝙄𝙣𝙛𝙤',
  usage: '.lankanews',
  react: '📰',
  async execute(message, client, args) {
    try {
      const { data } = await axios.get('https://www.lankadeepa.lk/');
      const $ = cheerio.load(data);
      const newsItems = [];

      $('.lead-story .lead-story-image, .lead-story .lead-story-desc').each((i, el) => {
        if (i >= 5) return false; // Limit to top 5

        const image = $(el).find('img').attr('src');
        const title = $(el).find('h2, h3').text().trim();
        const description = $(el).find('p').text().trim();
        const link = $(el).find('a').attr('href');

        if (title && image && link) {
          newsItems.push({
            title,
            description,
            image: image.startsWith('http') ? image : `https://www.lankadeepa.lk${image}`,
            link: link.startsWith('http') ? link : `https://www.lankadeepa.lk${link}`,
          });
        }
      });

      if (newsItems.length === 0) {
        return await client.sendMessage(message.from, { text: '⚠️ Could not fetch news from Lankadeepa. Website layout might have changed.' }, { quoted: message });
      }

      for (const news of newsItems) {
        await client.sendMessage(
          message.from,
          {
            image: { url: news.image },
            caption: `📰 *${news.title}*\n\n🗒️ ${news.description || 'No summary available'}\n🔗 ${news.link}`,
          },
          { quoted: message }
        );
      }
    } catch (error) {
      console.error('[LANKA NEWS ERROR]', error);
      await client.sendMessage(
        message.from,
        { text: '🚫 Error fetching Lankadeepa news. Please try again later.' },
        { quoted: message }
      );
    }
  },
};
