const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function topttCommand(sock, chatId, message) {
    try {
        const ctx = message.message?.extendedTextMessage?.contextInfo;
        const qMsg = ctx?.quotedMessage;

        if (!qMsg || !qMsg.audioMessage) {
            return sock.sendMessage(
                chatId,
                { text: '⚠️ Reply audio dengan .toptt' },
                { quoted: message }
            );
        }

        // ===== DOWNLOAD AUDIO =====
        const stream = await downloadContentFromMessage(
            qMsg.audioMessage,
            'audio'
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const inputPath = path.join(__dirname, '../tmp', `${Date.now()}.mp3`);
        const outputPath = path.join(__dirname, '../tmp', `${Date.now()}.opus`);

        fs.writeFileSync(inputPath, buffer);

        // ===== CONVERT TO PTT =====
        await new Promise((resolve, reject) => {
            exec(
                `ffmpeg -y -i "${inputPath}" -vn -c:a libopus -b:a 64k "${outputPath}"`,
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // ===== SEND AS PTT =====
        await sock.sendMessage(
            chatId,
            {
                audio: fs.readFileSync(outputPath),
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            },
            { quoted: message }
        );

        // ===== CLEAN =====
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

    } catch (err) {
        console.error('toptt error:', err);
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal convert ke PTT' },
            { quoted: message }
        );
    }
}

module.exports = topttCommand;
