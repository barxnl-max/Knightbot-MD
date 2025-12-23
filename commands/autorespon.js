const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_DIR = path.join(__dirname, '../data')
const MEDIA_DIR = path.join(__dirname, '../media')
const TEXT_DB = path.join(DATA_DIR, 'autorespon_text.json')
const MEDIA_DB = path.join(DATA_DIR, 'autorespon_media.json')

// ensure dirs
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR)
if (!fs.existsSync(TEXT_DB)) fs.writeFileSync(TEXT_DB, '{}')
if (!fs.existsSync(MEDIA_DB)) fs.writeFileSync(MEDIA_DB, '{}')

function loadJSON(file) {
    return JSON.parse(fs.readFileSync(file))
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
}
function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

module.exports = async function autoresponCommand(
    sock,
    chatId,
    message,
    userMessage,
    channelInfo
) {
    try {
        const textDB = loadJSON(TEXT_DB)
        const mediaDB = loadJSON(MEDIA_DB)

        // ======================
        // ADD AUTORESPON
        // ======================
        if (userMessage.startsWith('.addautorespon')) {
            const args = userMessage.replace('.addautorespon', '').trim()
            if (!args) {
                await sock.sendMessage(chatId, { text: '❌ format: .addautorespon keyword|respon1*respon2', ...channelInfo }, { quoted: message })
                return
            }

            const [keywordRaw, respRaw] = args.split('|')
            const keyword = keywordRaw.toLowerCase()

            // ===== MEDIA (reply)
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
            if (quoted) {
                let mediaType, stream
                if (quoted.imageMessage) {
                    mediaType = 'image'
                    stream = await sock.downloadMediaMessage({ message: quoted })
                } else if (quoted.videoMessage) {
                    mediaType = 'video'
                    stream = await sock.downloadMediaMessage({ message: quoted })
                } else if (quoted.audioMessage) {
                    mediaType = 'audio'
                    stream = await sock.downloadMediaMessage({ message: quoted })
                } else if (quoted.stickerMessage) {
                    mediaType = 'sticker'
                    stream = await sock.downloadMediaMessage({ message: quoted })
                }

                if (!mediaType) {
                    await sock.sendMessage(chatId, { text: '❌ media tidak didukung', ...channelInfo }, { quoted: message })
                    return
                }

                const ext =
                    mediaType === 'image' ? 'jpg' :
                    mediaType === 'video' ? 'mp4' :
                    mediaType === 'audio' ? 'ogg' :
                    'webp'

                const filename = crypto.randomBytes(8).toString('hex') + '.' + ext
                const filePath = path.join(MEDIA_DIR, filename)
                fs.writeFileSync(filePath, stream)

                mediaDB[keyword] = {
                    mediaType,
                    file: filename
                }
                saveJSON(MEDIA_DB, mediaDB)

                await sock.sendMessage(chatId, { text: `✅ autorespon media "${keyword}" ditambahkan`, ...channelInfo }, { quoted: message })
                return
            }

            // ===== TEXT
            if (!respRaw) {
                await sock.sendMessage(chatId, { text: '❌ respon teks kosong', ...channelInfo }, { quoted: message })
                return
            }

            const responses = respRaw.split('*').map(v => v.trim()).filter(Boolean)
            textDB[keyword] = responses
            saveJSON(TEXT_DB, textDB)

            await sock.sendMessage(chatId, { text: `✅ autorespon teks "${keyword}" ditambahkan (${responses.length})`, ...channelInfo }, { quoted: message })
            return
        }

        // ======================
        // LIST AUTORESPON
        // ======================
        if (userMessage === '.listautorespon') {
            const keys = [
                ...Object.keys(textDB),
                ...Object.keys(mediaDB)
            ]
            if (!keys.length) {
                await sock.sendMessage(chatId, { text: '❌ belum ada autorespon', ...channelInfo })
                return
            }
            await sock.sendMessage(chatId, {
                text: '📌 AUTORESPON:\n' + keys.map(v => `- ${v}`).join('\n'),
                ...channelInfo
            })
            return
        }

        // ======================
        // DEL AUTORESPON
        // ======================
        if (userMessage.startsWith('.delautorespon')) {
            const key = userMessage.replace('.delautorespon', '').trim().toLowerCase()
            if (!key) {
                await sock.sendMessage(chatId, { text: '❌ format: .delautorespon keyword', ...channelInfo })
                return
            }

            if (textDB[key]) {
                delete textDB[key]
                saveJSON(TEXT_DB, textDB)
                await sock.sendMessage(chatId, { text: `✅ autorespon teks "${key}" dihapus`, ...channelInfo })
                return
            }

            if (mediaDB[key]) {
                const filePath = path.join(MEDIA_DIR, mediaDB[key].file)
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
                delete mediaDB[key]
                saveJSON(MEDIA_DB, mediaDB)
                await sock.sendMessage(chatId, { text: `✅ autorespon media "${key}" dihapus`, ...channelInfo })
                return
            }

            await sock.sendMessage(chatId, { text: `❌ autorespon "${key}" tidak ditemukan`, ...channelInfo })
            return
        }

        // ======================
        // AUTO RESPON TEXT
        // ======================
        const key = userMessage.toLowerCase()
        if (textDB[key]) {
            await sock.sendMessage(chatId, { text: rand(textDB[key]), ...channelInfo }, { quoted: message })
            return
        }

        // ======================
        // AUTO RESPON MEDIA
        // ======================
        if (mediaDB[key]) {
            const data = mediaDB[key]
            const filePath = path.join(MEDIA_DIR, data.file)

            if (data.mediaType === 'audio') {
                await sock.sendMessage(chatId, {
                    audio: fs.readFileSync(filePath),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: message })
                return
            }

            const buffer = fs.readFileSync(filePath)
            await sock.sendMessage(chatId, {
                [data.mediaType]: buffer
            }, { quoted: message })
            return
        }

    } catch (e) {
        console.error(e)
        await sock.sendMessage(chatId, { text: '❌ An error occurred while processing your message.' })
    }
}
