const { spawn } = require('child_process')
const fs = require('fs')
const { writeExifImg } = require('../lib/exif')

/**
 * .attp <text>
 * Sticker text transparan (ATTP)
 */
async function attpCommand(sock, chatId, message) {
    const rawText =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        ''

    const text = rawText.split(' ').slice(1).join(' ').trim()

    if (!text) {
        await sock.sendMessage(
            chatId,
            { text: '❌ Contoh: .attp halo aku sayang kamu' },
            { quoted: message }
        )
        return
    }

    try {
        const webpBuffer = await renderATTP(text)

        const stickerPath = await writeExifImg(webpBuffer, {
            packname: 'Knight Bot',
            author: 'ATTP'
        })

        const sticker = fs.readFileSync(stickerPath)
        fs.unlinkSync(stickerPath)

        await sock.sendMessage(chatId, { sticker }, { quoted: message })
    } catch (err) {
        console.error('ATTP ERROR:', err)
        await sock.sendMessage(
            chatId,
            { text: '❌ gagal bikin sticker' },
            { quoted: message }
        )
    }
}

module.exports = attpCommand

/* ================= RENDER ENGINE ================= */

function renderATTP(text) {
    return new Promise((resolve, reject) => {
        const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

        // escape text biar ffmpeg aman
        const escapeText = (t) =>
            t.replace(/\\/g, '\\\\')
             .replace(/:/g, '\\:')
             .replace(/'/g, "\\'")
             .replace(/%/g, '\\%')
             .replace(/\n/g, '\\n')

        const safeText = escapeText(text)

        // auto font size (semakin panjang semakin kecil)
        const len = text.length
        let fontSize = 96
        if (len > 20) fontSize = 72
        if (len > 40) fontSize = 56
        if (len > 70) fontSize = 44
        if (len > 100) fontSize = 36

        const drawText = `
drawtext=
fontfile=${fontPath}:
text='${safeText}':
fontsize=${fontSize}:
fontcolor=white:
borderw=4:
bordercolor=black@0.6:
line_spacing=12:
x=(w-text_w)/2:
y=(h-text_h)/2:
wrap=1
        `.replace(/\n/g, '')

        const args = [
            '-y',
            '-f', 'lavfi',
            '-i', 'color=c=#00000000:s=512x512',
            '-vf', drawText,
            '-frames:v', '1',
            '-vcodec', 'libwebp',
            '-lossless', '1',
            '-compression_level', '6',
            '-preset', 'picture',
            '-pix_fmt', 'yuva420p',
            '-f', 'webp',
            'pipe:1'
        ]

        const ff = spawn('ffmpeg', args)
        const chunks = []
        const errors = []

        ff.stdout.on('data', (d) => chunks.push(d))
        ff.stderr.on('data', (e) => errors.push(e))

        ff.on('close', (code) => {
            if (code === 0) return resolve(Buffer.concat(chunks))
            reject(Buffer.concat(errors).toString())
        })
    })
}
