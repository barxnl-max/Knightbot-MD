const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const EzGif = require('../lib/ezgif');
const { getCategories, getRandom } = require('../lib/nsfwManager');

async function nsfwCommand(sock, chatId, message, args = []) {
    try {
        // =====================
        // NSFW LIST
        // =====================
        if (args[0] === 'list') {
            const list = getCategories();
            return sock.sendMessage(
                chatId,
                { text: `🔞 NSFW List:\n\n${list.join(', ')}` },
                { quoted: message }
            );
        }

        const hasVV = args.includes('--vv');
        const category = args.find(v => !v.startsWith('--')) || null;

        const { category: picked, url } = getRandom(category);

        // =====================
        // DOWNLOAD
        // =====================
        const res = await fetch(url);
        const buffer = Buffer.from(await res.arrayBuffer());
        const ext = url.split('.').pop().toLowerCase();

        const tmpDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        // =====================
        // GIF / WEBP → MP4
        // =====================
        if (ext === 'gif' || ext === 'webp') {
            const input = path.join(tmpDir, Date.now() + '.' + ext);
            fs.writeFileSync(input, buffer);

            const mp4Url = await EzGif.WebP2mp4(input);
            fs.unlinkSync(input);

            return sock.sendMessage(
                chatId,
                {
                    video: { url: mp4Url },
                    gifPlayback: true,
                    viewOnce: hasVV,
                    caption: `🔞 NSFW (${picked})`
                },
                { quoted: message }
            );
        }

        // =====================
        // IMAGE
        // =====================
        await sock.sendMessage(
            chatId,
            {
                image: buffer,
                viewOnce: hasVV,
                caption: `🔞 NSFW (${picked})`
            },
            { quoted: message }
        );

    } catch (e) {
        console.error('nsfw error:', e);
        sock.sendMessage(
            chatId,
            { text: '❌ NSFW error / kategori tidak ada' },
            { quoted: message }
        );
    }
}

module.exports = nsfwCommand;
