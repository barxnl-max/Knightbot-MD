const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const EzGif = require('../lib/ezgif');

const SFW = [
    'waifu','neko','shinobu','megumin','hug','kiss','pat','smile','wink'
];

const NSFW = ['waifu','neko','trap','blowjob'];

async function waifuPicsCommand(sock, chatId, message, type = 'waifu', nsfw = false) {
    try {
        const list = nsfw ? NSFW : SFW;
        if (!list.includes(type)) {
            return sock.sendMessage(
                chatId,
                { text: '❌ Type tidak valid' },
                { quoted: message }
            );
        }

        const api = `https://api.waifu.pics/${nsfw ? 'nsfw' : 'sfw'}/${type}`;
        const res = await fetch(api);
        const json = await res.json();
        if (!json.url) throw 'no url';

        // download file
        const mediaRes = await fetch(json.url);
        const buffer = Buffer.from(await mediaRes.arrayBuffer());

        const ext = json.url.split('.').pop().toLowerCase();
        const tmpDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        // =============================
        // GIF / WEBP → convert dulu
        // =============================
        if (ext === 'gif' || ext === 'webp') {
            const input = path.join(tmpDir, `waifu_${Date.now()}.${ext}`);
            fs.writeFileSync(input, buffer);

            const ezgif = new EzGif();
            const mp4Url = await ezgif.WebP2mp4(input);

            await sock.sendMessage(
                chatId,
                {
                    video: { url: mp4Url },
                    gifPlayback: true,
                    caption: `✨ waifu.pics (${type})`
                },
                { quoted: message }
            );

            fs.unlinkSync(input);
            return;
        }

        // =============================
        // IMAGE BIASA
        // =============================
        await sock.sendMessage(
            chatId,
            {
                image: buffer,
                caption: `✨ waifu.pics (${type})`
            },
            { quoted: message }
        );

    } catch (e) {
        console.error('waifupics error:', e);
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal ambil waifu' },
            { quoted: message }
        );
    }
}

module.exports = waifuPicsCommand;
