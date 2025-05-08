const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    react: "✅",
    desc: "Get pairing code from chama-md4 bot",
    category: "download",
    use: ".pair +923427582XXX",
    filename: __filename
}, async (conn, mek, m, { q, senderNumber, reply }) => {
    try {
        // Extract phone number from user input or default to sender's number
        const phoneNumber = q ? q.trim() : senderNumber;

        // Validate number format
        if (!phoneNumber || !phoneNumber.match(/^\+?\d{10,15}$/)) {
            return reply("❌ Please provide a valid phone number with country code\nExample: .pair +923427582XXX");
        }

        // Fetch pairing code from chama-md4 API
        const response = await axios.get(`https://chama-md4.onrender.com/pair?phone=${encodeURIComponent(phoneNumber)}`);
        
        if (!response.data || !response.data.code) {
            return reply("❌ Failed to retrieve pairing code. Please try again later.");
        }

        const pairingCode = response.data.code;
        const doneMessage = "> *CHAMA-MD4 PAIRING COMPLETED*";

        // Send formatted message
        await reply(`${doneMessage}\n\n*Your pairing code is:* ${pairingCode}`);

        // Optional: send code again as plain text
        await new Promise(resolve => setTimeout(resolve, 2000));
        await reply(`${pairingCode}`);

    } catch (error) {
        console.error("Pair command error:", error);
        await reply("❌ An error occurred while getting pairing code. Please try again later.");
    }
});
