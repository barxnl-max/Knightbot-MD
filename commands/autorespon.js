const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const DB_DIR = './database'
const TEXT_DB = './database/autorespon_text.json'
const MEDIA_DB = './database/autorespon_media.json'
const MEDIA_DIR = './database/autorespon_media'

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR)
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR)
if (!fs.existsSync(TEXT_DB)) fs.writeFileSync(TEXT_DB, '{}')
if (!fs.existsSync(MEDIA_DB)) fs.writeFileSync(MEDIA_DB, '{}')

const load = (file) => JSON.parse(fs.readFileSync(file))
const save = (file, data) =>
    fs.writeFileSync(file, JSON.stringify(data, null, 2))

module.exports = async (sock, chatId, message, userMessage, channelInfo) => {

    // ===============================
    // AMBIL QUOTED MESSAGE (AMAN)
    // ===============================
    const quoted =
        message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
        message.message?.imageMessage?.contextInfo?.quotedMessage ||
        message.message?.videoMessage?.contextInfo?.quotedMessage ||
        message.message?.audioMessage?.contextInfo?.quotedMessage ||
        null

    // ===============================
    // ADD AUTORESPON
    // ===============================
    if (userMessage.startsWith('.addautorespon')) {
        const arg = userMessage.replace('.addautorespon', '').trim().toLowerCase()

        // ===== ADD MEDIA =====
        if (quoted && arg && !arg.includes('|')) {
            let mediaType, mediaMsg

            if (quoted.imageMessage) {
                mediaType = 'image'
                mediaMsg = quoted.imageMessage
            } else if (quoted.videoMessage) {
                mediaType = 'video'
                mediaMsg = quoted.videoMessage
            } else if (quoted.audioMessage) {
                mediaType = 'audio'
                mediaMsg = quoted.audioMessage
            } else if (quoted.stickerMessage) {
                mediaType = 'sticker'
                mediaMsg = quoted.stickerMessage
            }

            if (!mediaType) {
                await sock.sendMessage(chatId, { text: '❌ reply media dulu', ...channelInfo }, { quoted: message })
                return
            }

            const stream = await downloadContentFromMessage(mediaMsg, mediaType)
            let buffer = Buffer.from([])
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

            const ext =
                mediaType === 'image' ? 'jpg' :
                mediaType === 'video' ? 'mp4' :
                mediaType === 'audio' ? 'mp3' :
                'webp'

            const filename = `${arg}.${ext}`
            fs.writeFileSync(path.join(MEDIA_DIR, filename), buffer)

            const mediaDB = load(MEDIA_DB)
            mediaDB[arg] = { mediaType, file: filename }
            save(MEDIA_DB, mediaDB)

            await sock.sendMessage(chatId, {
                text: `✅ autorespon media "${arg}" ditambahkan`,
                ...channelInfo
            }, { quoted: message })
            return
        }

        // ===== ADD TEXT =====
        if (arg.includes('|')) {
            const [key, raw] = arg.split('|')
            const responses = raw
                .split('*')
                .map(v => v.trim())
                .filter(Boolean)

            if (!responses.length) {
                await sock.sendMessage(chatId, { text: '❌ respon kosong', ...channelInfo }, { quoted: message })
                return
            }

            const textDB = load(TEXT_DB)
            textDB[key] = responses
            save(TEXT_DB, textDB)

            await sock.sendMessage(chatId, {
                text: `✅ autorespon teks "${key}" ditambahkan (${responses.length})`,
                ...channelInfo
            }, { quoted: message })
            return
        }

        await sock.sendMessage(chatId, { text: '❌ format salah', ...channelInfo }, { quoted: message })
        return
    }

    // ===============================
    // LIST AUTORESPON
    // ===============================
    if (userMessage === '.listautorespon') {
        const textDB = load(TEXT_DB)
        const mediaDB = load(MEDIA_DB)

        let txt = '📋 *LIST AUTORESPON*\n\n'

        txt += `📝 TEXT (${Object.keys(textDB).length})\n`
        txt += Object.keys(textDB).length
            ? Object.keys(textDB).map(v => `- ${v}`).join('\n')
            : '- kosong'

        txt += `\n\n🖼️ MEDIA (${Object.keys(mediaDB).length})\n`
        txt += Object.keys(mediaDB).length
            ? Object.keys(mediaDB).map(v => `- ${v}`).join('\n')
            : '- kosong'

        await sock.sendMessage(chatId, { text: txt, ...channelInfo }, { quoted: message })
        return
    }

    // ===============================
    // DELETE AUTORESPON
    // ===============================
    if (userMessage.startsWith('.delautorespon')) {
        const key = userMessage.replace('.delautorespon', '').trim().toLowerCase()
        if (!key) return

        const textDB = load(TEXT_DB)
        const mediaDB = load(MEDIA_DB)

        if (textDB[key]) {
            delete textDB[key]
            save(TEXT_DB, textDB)
            await sock.sendMessage(chatId, { text: `✅ autorespon teks "${key}" dihapus`, ...channelInfo }, { quoted: message })
            return
        }

        if (mediaDB[key]) {
            const filePath = path.join(MEDIA_DIR, mediaDB[key].file)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            delete mediaDB[key]
            save(MEDIA_DB, mediaDB)
            await sock.sendMessage(chatId, { text: `✅ autorespon media "${key}" dihapus`, ...channelInfo }, { quoted: message })
            return
        }

        await sock.sendMessage(chatId, { text: `❌ autorespon "${key}" tidak ditemukan`, ...channelInfo }, { quoted: message })
        return
    }

    // ===============================
    // AUTO RESPON (TEXT + MEDIA)
    // ===============================
    if (!userMessage.startsWith('.')) {

        // ===== MEDIA PRIORITAS =====
        const mediaDB = load(MEDIA_DB)
        for (const k in mediaDB) {
            if (userMessage.includes(k)) {
                const data = mediaDB[k]
                const filePath = path.join(MEDIA_DIR, data.file)

                // 🔊 AUDIO FIX (VN / PTT)
                if (data.mediaType === 'audio') {
                    await sock.sendMessage(chatId, {
                        audio: { url: filePath },
                        mimetype: 'audio/mpeg',
                        ptt: true
                    }, { quoted: message })
                    return
                }

                // 🖼️ IMAGE / 🎥 VIDEO / 🧷 STICKER
                const buffer = fs.readFileSync(filePath)
                await sock.sendMessage(chatId, {
                    [data.mediaType]: buffer
                }, { quoted: message })
                return
            }
        }

        // ===== TEXT =====
        const textDB = load(TEXT_DB)
        for (const k in textDB) {
            if (userMessage.includes(k)) {
                const list = textDB[k]
                const reply = list[Math.floor(Math.random() * list.length)]
                await sock.sendMessage(chatId, { text: reply, ...channelInfo }, { quoted: message })
                return
            }
        }
    }
}
