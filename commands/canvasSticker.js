const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { Canvas } = require('canvacord')
const fs = require('fs')
const { writeExifImg } = require('../lib/exif')
const settings = require('../settings')

async function canvasStickerCommand(sock, chatId, message) {
    try {
        const ctx = message.message?.extendedTextMessage?.contextInfo
        const quoted = ctx?.quotedMessage

        if (!quoted || (!quoted.imageMessage && !quoted.stickerMessage)) {
            return sock.sendMessage(
                chatId,
                { text: '⚠️ Reply foto atau stiker (non GIF)' },
                { quoted: message }
            )
        }

        // =========================
        // DOWNLOAD MEDIA
        // =========================
        let stream
        if (quoted.imageMessage) {
            stream = await downloadContentFromMessage(quoted.imageMessage, 'image')
        } else {
            stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker')
        }

        let buffer = Buffer.alloc(0)
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        // =========================
        // FAST TRIGGERED (STATIC PNG)
        // =========================
        const canvas = new Canvas(512, 512)
            .setImage(buffer)
            .triggered({
                intensity: 15,   // getar
                text: true       // tulisan TRIGGERED
            })

        const result = canvas.toBuffer() // PNG, bukan GIF

        // =========================
        // CONVERT TO STICKER
        // =========================
        const webpPath = await writeExifImg(result, {
            packname: settings.packname,
            author: settings.author
        })

        const sticker = fs.readFileSync(webpPath)
        fs.unlinkSync(webpPath)

        await sock.sendMessage(
            chatId,
            { sticker },
            { quoted: message }
        )

    } catch (err) {
        console.error('TRIGGERED ERROR:', err)
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal bikin stiker triggered' },
            { quoted: message }
        )
    }
}

module.exports = canvasStickerCommand
