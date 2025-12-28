const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const EzGif = require('../lib/ezgif');

const NSFW_DIR = path.join(__dirname, '../lib/nsfw');

function getCategories() {
    if (!fs.existsSync(NSFW_DIR)) return [];
    return fs.readdirSync(NSFW_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
}

function getRandomUrl(category) {
    const filePath = path.join(NSFW_DIR, `${category}.json`);
    if (!fs.existsSync(filePath)) return null;

    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath));
    } catch {
        return null;
    }

    if (!Array.isArray(data) || !data.length) return null;
    return data[Math.floor(Math.random() * data.length)]?.url || null;
}

async function nsfwCommand(sock, chatId, message, args = []) {
    try {
        // ======================
        // LIST
        // ======================
        if (args[0] === 'list') {
            const list = getCategories();
            if (!list.length) {
                return sock.sendMessage(chatId,
                    { text: '❌ Tidak ada kategori NSFW' },
                    { quoted: message }
                );
            }

            return sock.sendMessage(chatId,
                { text: `🔞 *NSFW Categories*\n\n${list.map(v => `• ${v}`).join('\n')}` },
                { quoted: message }
            );
        }

        const hasVV = args.includes('--vv');
        const category = args.find(v => !v.startsWith('--'));

        if (!category) {
            return sock.sendMessage(chatId,
                { text: '❌ Gunakan: .nsfw <kategori>\natau .nsfwlist' },
                { quoted: message }
            );
        }

        const url = getRandomUrl(category);
        if (!url) {
            return sock.sendMessage(chatId,
                { text: '❌ NSFW error / kategori tidak ada' },
                { quoted: message }
            );
        }

        const res = await fetch(url);
        const buffer = Buffer.from(await res.arrayBuffer());
        const ext = url.split('.').pop().toLowerCase();

        const tmpDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        // ======================
        // GIF / WEBP
        // ======================
        if (ext === 'gif' || ext === 'webp') {
            const input = path.join(tmpDir, Date.now() + '.' + ext);
            fs.writeFileSync(input, buffer);

            const mp4Url = await EzGif.WebP2mp4(input);
            fs.unlinkSync(input);

            return sock.sendMessage(chatId,
                {
                    video: { url: mp4Url },
                    gifPlayback: true,
                    viewOnce: hasVV,
                    caption: `🔞 NSFW (${category})`
                },
                { quoted: message }
            );
        }

        // ======================
        // IMAGE
        // ======================
        return sock.sendMessage(chatId,
            {
                image: buffer,
                viewOnce: hasVV,
                caption: `🔞 NSFW (${category})`
            },
            { quoted: message }
        );

    } catch (err) {
        console.error('NSFW error:', err);
        return sock.sendMessage(chatId,
            { text: '❌ NSFW error (internal)' },
            { quoted: message }
        );
    }
}

// ⬇⬇⬇ EXPORT PALING BAWAH
module.exports = nsfwCommand;
