const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');
const { execSync } = require("child_process");

function getCPUUsage() {
    return new Promise((resolve) => {
        const start = cpuAverage();
        setTimeout(() => {
            const end = cpuAverage();
            const idleDiff = end.idle - start.idle;
            const totalDiff = end.total - start.total;
            const usage = 100 - Math.round(100 * idleDiff / totalDiff);
            resolve(usage);
        }, 100);
    });
}

function cpuAverage() {
    const cpus = os.cpus();
    let idle = 0, total = 0;

    cpus.forEach(core => {
        for (let type in core.times) {
            total += core.times[type];
        }
        idle += core.times.idle;
    });

    return { idle: idle / cpus.length, total: total / cpus.length };
}

cmd({
    pattern: "system",
    alias: ["status", "sysinfo", "sys"],
    desc: "Show full system & bot info",
    category: "main",
    react: "🖥️",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const now = new Date();
        const hr = parseInt(now.toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: "Asia/Colombo" }));
        const greeting = hr >= 5 && hr < 12 ? "🌞 Good Morning!" :
                         hr >= 12 && hr < 17 ? "☀️ Good Afternoon!" :
                         hr >= 17 && hr < 20 ? "🌇 Good Evening!" : "🌙 Good Night!";

        const usedRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
        const ramPercent = ((usedRam / totalRam) * 100).toFixed(0);
        const ramBar = "█".repeat(Math.min(10, Math.floor(ramPercent / 10))) + "░".repeat(10 - Math.floor(ramPercent / 10));

        const cpuUsage = await getCPUUsage();
        const cpuBar = "█".repeat(Math.min(10, Math.floor(cpuUsage / 10))) + "░".repeat(10 - Math.floor(cpuUsage / 10));

        const cpus = os.cpus();
        const cpuModel = cpus[0].model;
        const cpuCores = cpus.length;
        const cpuSpeed = cpus[0].speed;

        let disk = "N/A";
        try {
            const stdout = execSync("df -h /").toString().split("\n")[1].split(/\s+/);
            disk = `Used: ${stdout[2]} / Total: ${stdout[1]}`;
        } catch {}

        const nets = os.networkInterfaces();
        const ip = Object.values(nets).flat().find(i => i.family === 'IPv4' && !i.internal)?.address || "N/A";

        const pingStart = Date.now();
        await conn.sendMessage(from, { text: "⚙️ Gathering system data..." }, { quoted: mek });
        const ping = Date.now() - pingStart;

        const uptime = runtime(process.uptime());
        const nodeVer = process.version;
        const platform = `${os.platform()} (${os.arch()})`;
        const hostname = os.hostname();

        const statusMsg = ["✅ All systems nominal", "🚀 Running smooth like silk", "🔧 No errors detected", "🔥 System stable & responsive"];
        const funLine = statusMsg[Math.floor(Math.random() * statusMsg.length)];

        const systemInfo = `
╭━━〔 *💻 SYSTEM STATUS* 〕━━╮

${greeting}

🤖 *Bot Name:* ${config.BOT_NAME}
👑 *Owner:* ${config.OWNER_NAME}
✏️ *Prefix:* ${config.PREFIX}
🔐 *Mode:* ${config.MODE === 'public' ? '🌍 Public' : '🔒 Private'}

📡 *Ping:* ${ping} ms
⏳ *Uptime:* ${uptime}
✨ *Status:* ${funLine}

💾 *RAM Usage:* ${usedRam} MB / ${totalRam} MB
📊 *RAM Bar:* [${ramBar}] ${ramPercent}%

🖥️ *CPU:* ${cpuModel}
├─ Cores: ${cpuCores}
├─ Speed: ${cpuSpeed} MHz
└─ Usage: ${cpuUsage}% [${cpuBar}]

🗂️ *Disk:* ${disk}
🌍 *IP Address:* ${ip}
🧠 *Node.js:* ${nodeVer}
🧱 *OS:* ${platform}
🖥️ *Host:* ${hostname}

╰━━〔 *CHAMA-MD-V1 SYSTEM END* 〕━━╯
`;

        await conn.sendMessage(from, {
            image: { url:'https://files.catbox.moe/0eo2q4.jpg' },
            caption: systemInfo.trim(),
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1000,
                isForwarded: true
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("System Info Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
