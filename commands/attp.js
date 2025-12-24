const { spawn } = require('child_process')
const fs = require('fs')
const { writeExifImg } = require('../lib/exif')

async function attpCommand(sock, chatId, message) {
    const raw =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        ''

    const text = raw.split(' ').slice(1).join(' ').trim()

    if (!text) {
        await sock.sendMessage(
            chatId,
            { text: '❌ Contoh: .attp halo aku sayang kamu' },
            { quoted: message }
        )
        return
    }

    try {
        const formattedText = autoNewLine(text)
        const buffer = await renderATTP(formattedText)

        const stickerPath = await writeExifImg(buffer, {
            packname: 'Catashtroph',
            author: 'ATTP'
        })

        const sticker = fs.readFileSync(stickerPath)
        fs.unlinkSync(stickerPath)

        await sock.sendMessage(chatId, { sticker }, { quoted: message })
    } catch (e) {
        console.error('ATTP ERROR:', e)
        await sock.sendMessage(
            chatId,
            { text: '❌ gagal bikin sticker' },
            { quoted: message }
        )
    }
}

module.exports = attpCommand

/* ================= HELPERS ================= */

function autoNewLine(text, maxChar = 12) {
    const words = text.split(' ')
    let lines = []
    let line = ''

    for (let word of words) {
        if ((line + word).length > maxChar) {
            lines.push(line.trim())
            line = word + ' '
        } else {
            line += word + ' '
        }
    }
    if (line) lines.push(line.trim())

    return lines.join('\n')
}

function renderATTP(text) {
    return new Promise((resolve, reject) => {
        const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

        const safeText = text
            .replace(/\\/g, '\\\\')
            .replace(/:/g, '\\:')
            .replace(/'/g, "\\'")
            .replace(/%/g, '\\%')
            .replace(/\n/g, '\\n')

        const len = text.length
        let fontSize = 96
        if (len > 20) fontSize = 72
        if (len > 40) fontSize = 56
        if (len > 70) fontSize = 44
        if (len > 100) fontSize = 36

        const drawText = `drawtext=fontfile=${fontPath}:text='${safeText}':fontsize=${fontSize}:fontcolor=white:borderw=4:bordercolor=black@0.6:line_spacing=10:x=(w-text_w)/2:y=(h-text_h)/2`

        const args = [
            '-y',
            '-f', 'lavfi',
            '-i', 'color=c=#00000000:s=512x512',
            '-vf', drawText,
            '-frames:v', '1',
            '-vcodec', 'libwebp',
            '-lossless', '1',
            '-pix_fmt', 'yuva420p',
            '-f', 'webp',
            'pipe:1'
        ]

        const ff = spawn('ffmpeg', args)
        const out = []
        const err = []

        ff.stdout.on('data', d => out.push(d))
        ff.stderr.on('data', e => err.push(e))

        ff.on('close', code => {
            if (code === 0) return resolve(Buffer.concat(out))
            reject(Buffer.concat(err).toString())
        })
    })
}
