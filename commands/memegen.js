const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const axios = require('axios')
const fs = require('fs')
const uploadImage = require('../lib/uploadImage')
const uploadFile = require('../lib/uploadFile')
const { writeExifImg } = require('../lib/exif')
const settings = require('../settings')

// =======================
// AMBIL IMAGE DARI REPLY
// =======================
async function getReplyImage(message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (!quoted?.imageMessage) return null

    const stream = await downloadContentFromMessage(quoted.imageMessage, 'image')
    let buffer = Buffer.alloc(0)
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
}

module.exports = async function memegenCommand(sock, chatId, message, userMessage) {
    try {
        const args = userMessage.split(' ').slice(1)
        const isImage = args.includes('--image')

        const textRaw = args.filter(v => v !== '--image').join(' ')
        if (!textRaw.includes('|')) {
            return sock.sendMessage(chatId, {
                text: '❌ Format salah\n.memegen atas|bawah\n(memegen WAJIB reply gambar)'
            }, { quoted: message })
        }

        // =======================
        // WAJIB REPLY IMAGE
        // =======================
        const imageBuffer = await getReplyImage(message)
        if (!imageBuffer) {
            return sock.sendMessage(chatId, {
                text: '❌ Reply gambar untuk dijadikan background meme'
            }, { quoted: message })
        }

        let [topText, bottomText] = textRaw.split('|')
        topText = (topText || '').trim()
        bottomText = (bottomText || '').trim()

        // =======================
        // UPLOAD IMAGE
        // =======================
        const bgUrl = await uploadImage(imageBuffer)
            .catch(() => uploadFile(imageBuffer))

        if (!bgUrl) throw 'Upload image gagal'

        // =======================
        // MEMEGEN URL (NO DEFAULT BG)
        // =======================
        const memeUrl =
            `https://api.memegen.link/images/custom/` +
            `${encodeURIComponent(topText)}/${encodeURIComponent(bottomText)}.png` +
            `?background=${encodeURIComponent(bgUrl)}`

        // =======================
        // IMAGE MODE
        // =======================
        if (isImage) {
            return await sock.sendMessage(chatId, {
                image: { url: memeUrl },
                caption: '🖼️ Meme Generator'
            }, { quoted: message })
        }

        // =======================
        // STICKER MODE
        // =======================
        const res = await axios.get(memeUrl, { responseType: 'arraybuffer' })
        const webpPath = await writeExifImg(res.data, {
            packname: settings.packname,
            author: settings.author
        })

        const sticker = fs.readFileSync(webpPath)
        fs.unlinkSync(webpPath)

        await sock.sendMessage(chatId, { sticker }, { quoted: message })

    } catch (e) {
        console.error('MEMEGEN ERROR:', e)
        await sock.sendMessage(chatId, {
            text: '❌ Gagal membuat meme'
        }, { quoted: message })
    }
}
// peler
