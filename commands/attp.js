const { spawn } = require('child_process')
const fs = require('fs')
const { writeExifVid } = require('../lib/exif')

async function attpCommand(sock, chatId, message) {
    const body =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        ''

    const text = body.split(' ').slice(1).join(' ').trim()
    if (!text) {
        return sock.sendMessage(
            chatId,
            { text: '❌ contoh: .attp halo aku sayang kamu' },
            { quoted: message }
        )
    }

    try {
        const mp4 = await renderBlinkingAttp(text)
        const webpPath = await writeExifVid(mp4, { packname: 'Knight Bot' })
        const webp = fs.readFileSync(webpPath)
        fs.unlinkSync(webpPath)

        await sock.sendMessage(chatId, { sticker: webp }, { quoted: message })
    } catch (e) {
        console.error(e)
        await sock.sendMessage(chatId, { text: '❌ gagal bikin sticker' })
    }
}

module.exports = attpCommand

/* ================= UTIL ================= */

function wrapText(text, maxLine = 12) {
    const words = text.split(' ')
    let lines = []
    let line = ''

    for (let w of words) {
        if ((line + w).length > maxLine) {
            lines.push(line.trim())
            line = w + ' '
        } else {
            line += w + ' '
        }
    }
    if (line) lines.push(line.trim())
    return lines.join('\n')
}

function calcFontSize(text) {
    const max = 72
    const min = 28
    const limit = 18

    if (text.length <= limit) return max
    return Math.max(Math.floor(max * (limit / text.length)), min)
}

function escapeText(s) {
    return s
        .replace(/\\/g, '\\\\')
        .replace(/:/g, '\\:')
        .replace(/,/g, '\\,')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
}

/* ================= FFMPEG ================= */

function renderBlinkingAttp(text) {
    return new Promise((resolve, reject) => {
        const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
        const wrapped = wrapText(text)
        const size = calcFontSize(text)
        const safe = escapeText(wrapped)

        const draw = (color, start, end) =>
            `drawtext=fontfile=${font}:text='${safe}':fontsize=${size}:fontcolor=${color}:borderw=2:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(mod(t\\,0.3)\\,${start}\\,${end})'`

        const filter =
            draw('red', 0, 0.1) + ',' +
            draw('blue', 0.1, 0.2) + ',' +
            draw('green', 0.2, 0.3)

        const args = [
            '-y',
            '-f', 'lavfi',
            '-i', 'color=black:s=512x512:d=1.8:r=20',
            '-vf', filter,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-f', 'mp4',
            'pipe:1'
        ]

        const ff = spawn('ffmpeg', args)
        const buf = []
        const err = []

        ff.stdout.on('data', d => buf.push(d))
        ff.stderr.on('data', e => err.push(e))
        ff.on('close', c => {
            if (c === 0) resolve(Buffer.concat(buf))
            else reject(Buffer.concat(err).toString())
        })
    })
}
