const { spawn } = require('child_process')
const fs = require('fs')
const { writeExifVid } = require('../lib/exif')

/* =========================
   HELPER FUNCTIONS
========================= */

function calcFontSize(text) {
    const maxSize = 72
    const minSize = 28
    const maxChars = 18

    const len = text.length
    if (len <= maxChars) return maxSize

    const size = Math.floor(maxSize * (maxChars / len))
    return Math.max(size, minSize)
}

function wrapText(text, maxLine = 12) {
    const words = text.split(' ')
    let lines = []
    let line = ''

    for (const word of words) {
        if ((line + word).length > maxLine) {
            lines.push(line.trim())
            line = word + ' '
        } else {
            line += word + ' '
        }
    }
    if (line) lines.push(line.trim())
    return lines.join('\n')
}

function escapeDrawtextText(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/:/g, '\\:')
        .replace(/,/g, '\\,')
        .replace(/'/g, "\\'")
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/%/g, '\\%')
}

/* =========================
   MAIN COMMAND
========================= */

async function attpCommand(sock, chatId, message) {
    const body =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        ''

    const text = body.split(' ').slice(1).join(' ')
    if (!text) {
        return sock.sendMessage(
            chatId,
            { text: '❌ Contoh: .attp halo aku sayang kamu' },
            { quoted: message }
        )
    }

    try {
        const mp4 = await renderBlinkingVideo(text)
        const webpPath = await writeExifVid(mp4, {
            packname: 'Knight Bot',
            author: 'ATTp'
        })

        const sticker = fs.readFileSync(webpPath)
        fs.unlinkSync(webpPath)

        await sock.sendMessage(chatId, { sticker }, { quoted: message })
    } catch (e) {
        console.error('ATTP ERROR:', e)
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal membuat sticker ATTp' },
            { quoted: message }
        )
    }
}

module.exports = attpCommand

/* =========================
   FFMPEG RENDER
========================= */

function renderBlinkingVideo(text) {
    return new Promise((resolve, reject) => {
        const fontPath =
            process.platform === 'win32'
                ? 'C:/Windows/Fonts/arialbd.ttf'
                : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

        const wrapped = wrapText(text)
        const fontSize = calcFontSize(text)
        const safeText = escapeDrawtextText(wrapped)

        const cycle = 0.3
        const duration = 1.8

        const draw = color => (
            `drawtext=fontfile='${fontPath}':` +
            `text='${safeText}':` +
            `fontsize=${fontSize}:` +
            `fontcolor=${color}:` +
            `borderw=2:bordercolor=black@0.6:` +
            `x=(w-text_w)/2:y=(h-text_h)/2`
        )

        const filter =
            `${draw('red')}:enable='lt(mod(t\\,${cycle})\\,0.1)',` +
            `${draw('blue')}:enable='between(mod(t\\,${cycle})\\,0.1\\,0.2)',` +
            `${draw('green')}:enable='gte(mod(t\\,${cycle})\\,0.2)'`

        const ff = spawn('ffmpeg', [
            '-y',
            '-f', 'lavfi',
            '-i', `color=c=black:s=512x512:d=${duration}:r=20`,
            '-vf', filter,
            '-pix_fmt', 'yuv420p',
            '-t', duration.toString(),
            '-f', 'mp4',
            'pipe:1'
        ])

        const chunks = []
        const errors = []

        ff.stdout.on('data', d => chunks.push(d))
        ff.stderr.on('data', e => errors.push(e))

        ff.on('close', code => {
            if (code === 0) return resolve(Buffer.concat(chunks))
            reject(Buffer.concat(errors).toString())
        })
    })
}            '-i', `color=c=black:s=512x512:d=${dur}:r=20`,
            '-vf', filter,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart+frag_keyframe+empty_moov',
            '-t', String(dur),
            '-f', 'mp4',
            'pipe:1'
        ];

        const ff = spawn('ffmpeg', args);
        const chunks = [];
        const errors = [];
        ff.stdout.on('data', d => chunks.push(d));
        ff.stderr.on('data', e => errors.push(e));
        ff.on('error', reject);
        ff.on('close', code => {
            if (code === 0) return resolve(Buffer.concat(chunks));
            reject(new Error(Buffer.concat(errors).toString() || `ffmpeg exited with code ${code}`));
        });
    });
}
