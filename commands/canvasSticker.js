const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const Canvacord = require('canvacord')
const fs = require('fs')
const path = require('path')
const { writeExifImg } = require('../lib/exif')
const settings = require('../settings')

async function canvasStickerCommand(sock, chatId, message) {
    try {
        const ctx = message.message?.extendedTextMessage?.contextInfo
        const quoted = ctx?.quotedMessage

        if (!quoted || !quoted.imageMessage) {
            return sock.sendMessage(
                chatId,
                { text: '⚠️ Reply foto lalu ketik .sticker' },
                { quoted: message }
            )
        }

        // =========================
        // DOWNLOAD IMAGE
        // =========================
        const stream = await downloadContentFromMessage(
            quoted.imageMessage,
            'image'
        )

        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        // =========================
        // PROCESS WITH CANVACORD
        // (contoh: trigger effect)
        // =========================
        const processed = await Canvacord.Canvas.trigger(buffer)

        // =========================
        // CONVERT TO STICKER + WM
        // =========================
        const webpPath = await writeExifImg(processed, {
            packname: settings.packname,
            author: settings.author
        })

        const stickerBuffer = fs.readFileSync(webpPath)
        fs.unlinkSync(webpPath)

        // =========================
        // SEND STICKER
        // =========================
        await sock.sendMessage(
            chatId,
            { sticker: stickerBuffer },
            { quoted: message }
        )

    } catch (err) {
        console.error('canvas sticker error:', err)
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal bikin stiker' },
            { quoted: message }
        )
    }
}

module.exports = canvasStickerCommand
