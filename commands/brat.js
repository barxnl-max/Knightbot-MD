const fetch = require('node-fetch');
const webp = require('node-webpmux');
const crypto = require('crypto');
const settings = require('../settings');

async function sbratCommand(sock, chatId, texttt, message) {
    try {
        if (!text) {
            return sock.sendMessage(
                chatId,
                { text: '⚠️ Contoh: .sbrat Akbar' },
                { quoted: message }
            );
        }

        const url = `https://aqul-brat.hf.space/?text=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Fetch brat failed');

        const imgBuffer = Buffer.from(await res.arrayBuffer());

        // =========================
        // ADD WATERMARK (EXIF)
        // =========================
        const img = new webp.Image();
        await img.load(imgBuffer);

        const metadata = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': settings.packname || 'Catashtroph',
            'sticker-pack-publisher': settings.author || '@barxnl250_',
            'emojis': ['🔥']
        };

        const exifAttr = Buffer.from([
            0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,
            0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,
            0x00,0x00,0x16,0x00,0x00,0x00
        ]);

        const jsonBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exif;

        const finalSticker = await img.save(null);

        // =========================
        // SEND STICKER
        // =========================
        await sock.sendMessage(
            chatId,
            { sticker: finalSticker },
            { quoted: message }
        );

    } catch (err) {
        console.error('sbrat wm error:', err);
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal bikin stiker brat' },
            { quoted: message }
        );
    }
}

module.exports = sbratCommand;
