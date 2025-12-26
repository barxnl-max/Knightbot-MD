const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const EzGif = require('../lib/ezgif');

// =======================
// TYPE LIST
// =======================
const SFW = [
    'waifu',
    'neko',
    'shinobu',
    'megumin',
    'bully',
    'cuddle',
    'cry',
    'hug',
    'awoo',
    'kiss',
    'lick',
    'pat',
    'smug',
    'bonk',
    'yeet',
    'blush',
    'smile',
    'wave',
    'highfive',
    'handhold',
    'nom',
    'bite',
    'glomp',
    'slap',
    'kill',
    'kick',
    'happy',
    'wink',
    'poke',
    'dance',
    'cringe'
];

const NSFW = [
    'waifu',
    'neko',
    'trap',
    'blowjob'
];

async function waifuPicsCommand(sock, chatId, message, type = 'waifu', nsfw = false) {
    try {
        const list = nsfw ? NSFW : SFW;

        if (!list.includes(type)) {
            return sock.sendMessage(
                chatId,
                { text: `❌ Type tidak valid\n\nAvailable:\n${list.join(', ')}` },
                { quoted: message }
            );
        }

        const api = `https://api.waifu.pics/${nsfw ? 'nsfw' : 'sfw'}/${type}`;
        const res = await fetch(api);
        const json = await res.json();

        if (!json?.url) throw new Error('No URL');

        // =======================
        // DOWNLOAD
        // =======================
        const mediaRes = await fetch(json.url);
        const buffer = Buffer.from(await mediaRes.arrayBuffer());

        const ext = json.url.split('.').pop().toLowerCase();
        const tmpDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        // =======================
        // GIF / WEBP → MP4
        // =======================
        if (ext === 'gif' || ext === 'webp') {
            const input = path.join(tmpDir, `waifu_${Date.now()}.${ext}`);
            fs.writeFileSync(input, buffer);

            const mp4Url = await EzGif.WebP2mp4(input);
            fs.unlinkSync(input);

            return sock.sendMessage(
                chatId,
                {
                    video: { url: mp4Url },
                    gifPlayback: true,
                    caption: `✨ waifu.pics (${type})`
                },
                { quoted: message }
            );
        }

        // =======================
        // IMAGE BIASA
        // =======================
        return sock.sendMessage(
            chatId,
            {
                image: buffer,
                caption: `✨ waifu.pics (${type})`
            },
            { quoted: message }
        );

    } catch (err) {
        console.error('waifupics error:', err);
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal ambil waifu (rate limit / error)' },
            { quoted: message }
        );
    }
}

module.exports = waifuPicsCommand;
