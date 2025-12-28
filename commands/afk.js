const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const AFK = require('../lib/afk');

async function afkCommand(sock, chatId, message, senderId, args) {
    let reason = args.join(' ') || 'AFK';

    const ctx = message.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;

    let mediaData = null;

    // ======================
    // JIKA REPLY MEDIA
    // ======================
    if (quoted) {
        let type, media;

        if (quoted.imageMessage) {
            type = 'image';
            media = quoted.imageMessage;
        } else if (quoted.videoMessage) {
            type = 'video';
            media = quoted.videoMessage;
        } else if (quoted.stickerMessage) {
            type = 'sticker';
            media = quoted.stickerMessage;
        }

        if (type && media) {
            const stream = await downloadContentFromMessage(media, type);
            const chunks = [];
            for await (const c of stream) chunks.push(c);

            const buffer = Buffer.concat(chunks);
            const ext = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'webp';

            const dir = path.join(__dirname, '../tmp');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir);

            const filePath = path.join(dir, `afk_${senderId}.${ext}`);
            fs.writeFileSync(filePath, buffer);

            mediaData = {
                type,
                path: filePath
            };
        }
    }

    AFK.set(senderId, reason, mediaData);

    await sock.sendMessage(
        chatId,
        { text: `💤 AFK diaktifkan\nAlasan: ${reason}` },
        { quoted: message }
    );
}

module.exports = afkCommand;
