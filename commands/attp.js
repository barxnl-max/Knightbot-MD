const { spawn } = require('child_process')
const fs = require('fs')
const { writeExifVid } = require('../lib/exif')

/* =========================
   MAIN COMMAND
========================= */

async function attpCommand(sock, chatId, message) {
    const body =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        ''

    const text = body.split(' ').slice(1).join(' ').trim()
    if (!text) {
        await sock.sendMessage(
            chatId,
            { text: '❌ Contoh: .attp halo aku sayang kamu' },
            { quoted: message }
        )
        return
    }

    try {
        const mp4Buffer = await renderBlinkingVideo(text)
        const webpPath = await writeExifVid(mp4Buffer, {
            packname: 'Catashtroph',
            author: 'peler'
        })

        const sticker = fs.readFileSync(webpPath)
        fs.unlinkSync(webpPath)

        await sock.sendMessage(chatId, { sticker }, { quoted: message })
    } catch (e) {
        console.error('ATTP ERROR:', e)
        // sengaja TIDAK kirim pesan error biar gak spam
    }
}

module.exports = attpCommand

/* =========================
   TEXT UTILS
========================= */

// auto font mengecil
function calcFontSize(text) {
    const maxSize = 72
    const minSize = 28
    const limit = 18

    if (text.length <= limit) return maxSize
    return Math.max(
        Math.floor(maxSize * (limit / text.length)),
        minSize
    )
}

// auto enter / wrap
function wrapText(text, maxLine = 12) {
    const words = text.split(' ')
    let lines = []
    let line = ''

    for (const w of words) {
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

// escape aman buat drawtext
function escapeText(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/:/g, '\\:')
        .replace(/,/g, '\\,')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
}

/* =========================
   FFMPEG RENDER
========================= */

function renderBlinkingVideo(text) {
    return new Promise((resolve, reject) => {
        const wrapped = wrapText(text)
        const fontSize = calcFontSize(text)
        const safeText = escapeText(wrapped)

        const cycle = 0.3
        const duration = 1.8

        const draw = (color, start, end) =>
            `drawtext=text='${safeText}':` +
            `fontsize=${fontSize}:` +
            `fontcolor=${color}:` +
            `borderw=2:bordercolor=black@0.6:` +
            `x=(w-text_w)/2:y=(h-text_h)/2:` +
            `enable='between(mod(t\\,${cycle})\\,${start}\\,${end})'`

        const filter =
            draw('red', 0, 0.1) + ',' +
            draw('blue', 0.1, 0.2) + ',' +
            draw('green', 0.2, 0.3)

        const args = [
            '-y',
            '-f', 'lavfi',
            '-i', `color=c=black:s=512x512:d=${duration}:r=20`,
            '-vf', filter,
            '-pix_fmt', 'yuv420p',
            '-t', duration.toString(),
            '-f', 'mp4',
            'pipe:1'
        ]

        const ff = spawn('ffmpeg', args)
        const chunks = []
        const errors = []

        ff.stdout.on('data', d => chunks.push(d))
        ff.stderr.on('data', e => errors.push(e))

        ff.on('close', code => {
            if (code === 0) {
                resolve(Buffer.concat(chunks))
            } else {
                reject(Buffer.concat(errors).toString())
            }
        })
    })
}
