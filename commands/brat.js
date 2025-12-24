const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { writeExifImg } = require('../lib/exif')

module.exports = async function bratCommand(sock, chatId, message) {
    try {
        // ambil text dari message (aman semua tipe)
        const body =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            ''

        const text = body.split(' ').slice(1).join(' ')
        if (!text) {
            await sock.sendMessage(
                chatId,
                { text: 'Contoh: .brat halo dunia' },
                { quoted: message }
            )
            return
        }

        // panggil API brat
        const url = `https://aqul-brat.hf.space/?text=${encodeURIComponent(text)}`
        const res = await axios.get(url, { responseType: 'arraybuffer' })

        // simpan sementara
        const imgPath = path.join(__dirname, '../tmp/brat.png')
        fs.writeFileSync(imgPath, res.data)

        // kasih exif (watermark)
        const stickerPath = await writeExifImg(
            imgPath,
            { packname: 'Catastroph', author: 'Brat Sticker' }
        )

        const sticker = fs.readFileSync(stickerPath)

        await sock.sendMessage(
            chatId,
            { sticker },
            { quoted: message }
        )

        // cleanup
        fs.unlinkSync(imgPath)
        fs.unlinkSync(stickerPath)

    } catch (e) {
        console.error('BRAT ERROR:', e)
        // diam aja kalau error (biar gak spam ❌)
    }
}
