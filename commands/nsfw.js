const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const EzGif = require('../lib/ezgif');

const NSFW_DIR = path.join(__dirname, '..', 'lib', 'nsfw');

function getCategories() {
    if (!fs.existsSync(NSFW_DIR)) return [];
    return fs.readdirSync(NSFW_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', '').toLowerCase());
}

function getRandom(category) {
    const file = path.join(NSFW_DIR, `${category}.json`);
    if (!fs.existsSync(file)) return null;

    const data = JSON.parse(fs.readFileSync(file));
    if (!Array.isArray(data) || !data.length) return null;

    return data[Math.floor(Math.random() * data.length)];
}

module.exports = async function nsfwCommand(sock, chatId, message, args = []) {

    // =====================
    // NSFW LIST
    // =====================
    if (args[0] === 'list') {
        const categories = getCategories();
        if (!categories.length) {
            return sock.sendMessage(chatId,
                { text: '❌ NSFW list kosong' },
                { quoted: message }
            );
        }

        return sock.sendMessage(chatId,
            { text: `🔥 NSFW LIST:\n\n${categories.join(', ')}` },
            { quoted: message }
        );
    }

    // =====================
    // NSFW TANPA ARGUMEN
    // =====================
    if (!args.length) {
        return sock.sendMessage(chatId,
            { text: '⚠️ Gunakan:\n.nsfw <kategori>\n.nsfwlist' },
            { quoted: message }
        );
    }

    const hasVV = args.includes('--vv');
    const category = args.find(a => !a.startsWith('--'))?.toLowerCase();

    const categories = getCategories();
    if (!categories.includes(category)) {
        return sock.sendMessage(chatId,
            { text: '❌ Kategori tidak ada\n\n' + categories.join(', ') },
            { quoted: message }
        );
    }

    const url = getRandom(category);
    if (!url) {
        return sock.sendMessage(chatId,
            { text: '❌ File kosong / rusak' },
            { quoted: message }
        );
    }

    // =====================
    // GIF / WEBP
    // =====================
    if (url.endsWith('.gif') || url.endsWith('.webp')) {
        const tmpDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const ext = path.extname(url);
        const tmpFile = path.join(tmpDir, Date.now() + ext);

        const res = await fetch(url);
        fs.writeFileSync(tmpFile, Buffer.from(await res.arrayBuffer()));

        const mp4 = await EzGif.WebP2mp4(tmpFile);
        fs.unlinkSync(tmpFile);

        return sock.sendMessage(chatId, {
            video: { url: mp4 },
            gifPlayback: true,
            viewOnce: hasVV,
            caption: `🔥 NSFW ${category}`
        }, { quoted: message });
    }

    // =====================
    // IMAGE
    // =====================
    return sock.sendMessage(chatId, {
        image: { url },
        viewOnce: hasVV,
        caption: `🔥 NSFW ${category}`
    }, { quoted: message });
};
