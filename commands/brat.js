const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { writeExifImg } = require('../lib/exif');

async function bratCommand(sock, chatId, message, text) {
    if (!text) {
        return sock.sendMessage(
            chatId,
            { text: '❌ Contoh: .brat halo dunia' },
            { quoted: message }
        );
    }

    try {
        // Ambil gambar dari API BRAT
        const url = `https://aqul-brat.hf.space/?text=${encodeURIComponent(text)}`;
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const imgBuffer = Buffer.from(res.data);

        // Tambahin EXIF (WM)
        const webpPath = await writeExifImg(imgBuffer, {
            packname: 'Catastroph',
            author: 'Catastroph'
        });

        const stickerBuffer = fs.readFileSync(webpPath);
        try { fs.unlinkSync(webpPath); } catch {}

        // Kirim sebagai stiker
        await sock.sendMessage(
            chatId,
            { sticker: stickerBuffer },
            { quoted: message }
        );

    } catch (err) {
        console.error('BRAT EXIF ERROR:', err);
        // silent fail (biar ga spam error)
    }
}

module.exports = bratCommand;
