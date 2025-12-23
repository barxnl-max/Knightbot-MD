const fs = require('fs')
const path = require('path')

const textFile = './database/autorespon_text.json'
const mediaFile = './database/autorespon_media.json'
const mediaDir = './database/autorespon_media'

if (!fs.existsSync('./database')) fs.mkdirSync('./database')
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir)
if (!fs.existsSync(textFile)) fs.writeFileSync(textFile, '{}')
if (!fs.existsSync(mediaFile)) fs.writeFileSync(mediaFile, '{}')

const load = (f) => JSON.parse(fs.readFileSync(f))
const save = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2))

module.exports = async (sock, chatId, message, userMessage, channelInfo) => {

    // ================= ADD AUTORESPON =================
    if (userMessage.startsWith('.addautorespon')) {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const arg = userMessage.replace('.addautorespon', '').trim().toLowerCase()

        // ===== MEDIA =====
        if (quoted && arg && !arg.includes('|')) {
            const mediaType =
                quoted.imageMessage ? 'image' :
                quoted.videoMessage ? 'video' :
                quoted.audioMessage ? 'audio' :
                quoted.stickerMessage ? 'sticker' : null

            if (!mediaType) return true

            const stream = await sock.downloadContentFromMessage(
                quoted[`${mediaType}Message`],
                mediaType
            )

            let buffer = Buffer.from([])
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

            const ext =
                mediaType === 'image' ? 'jpg' :
                mediaType === 'video' ? 'mp4' :
                mediaType === 'audio' ? 'mp3' : 'webp'

            const fileName = `${arg}.${ext}`
            fs.writeFileSync(path.join(mediaDir, fileName), buffer)

            const mediaData = load(mediaFile)
            mediaData[arg] = { mediaType, file: fileName }
            save(mediaFile, mediaData)

            await sock.sendMessage(chatId, {
                text: `✅ autorespon media "${arg}" ditambahkan`,
                ...channelInfo
            }, { quoted: message })
            return true
        }

        // ===== TEXT (pakai *) =====
        if (arg.includes('|')) {
            const [key, raw] = arg.split('|')

            const responses = raw
                .split('*')
                .map(v => v.trim())
                .filter(Boolean)

            if (!responses.length) return true

            const textData = load(textFile)
            textData[key] = responses
            save(textFile, textData)

            await sock.sendMessage(chatId, {
                text: `✅ autorespon teks "${key}" ditambahkan (${responses.length})`,
                ...channelInfo
            }, { quoted: message })
            return true
        }

        await sock.sendMessage(chatId, { text: '❌ format salah', ...channelInfo }, { quoted: message })
        return true
    }

    // ================= LIST AUTORESPON =================
    if (userMessage === '.listautorespon') {
        const textData = load(textFile)
        const mediaData = load(mediaFile)

        let txt = '📋 *LIST AUTORESPON*\n\n'

        const textKeys = Object.keys(textData)
        const mediaKeys = Object.keys(mediaData)

        txt += `📝 Text (${textKeys.length}):\n`
        txt += textKeys.length ? textKeys.map(v => `- ${v}`).join('\n') : '- kosong'

        txt += `\n\n🖼️ Media (${mediaKeys.length}):\n`
        txt += mediaKeys.length ? mediaKeys.map(v => `- ${v}`).join('\n') : '- kosong'

        await sock.sendMessage(chatId, { text: txt, ...channelInfo }, { quoted: message })
        return true
    }

    // ================= DELETE AUTORESPON =================
    if (userMessage.startsWith('.delautorespon')) {
        const key = userMessage.replace('.delautorespon', '').trim().toLowerCase()
        if (!key) return true

        const textData = load(textFile)
        const mediaData = load(mediaFile)

        // TEXT
        if (textData[key]) {
            delete textData[key]
            save(textFile, textData)

            await sock.sendMessage(chatId, {
                text: `✅ autorespon teks "${key}" dihapus`,
                ...channelInfo
            }, { quoted: message })
            return true
        }

        // MEDIA
        if (mediaData[key]) {
            const filePath = path.join(mediaDir, mediaData[key].file)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

            delete mediaData[key]
            save(mediaFile, mediaData)

            await sock.sendMessage(chatId, {
                text: `✅ autorespon media "${key}" dihapus`,
                ...channelInfo
            }, { quoted: message })
            return true
        }

        await sock.sendMessage(chatId, {
            text: `❌ autorespon "${key}" tidak ditemukan`,
            ...channelInfo
        }, { quoted: message })
        return true
    }

    // ================= AUTO RESPON =================
    if (!userMessage.startsWith('.')) {

        // MEDIA PRIORITAS
        const mediaData = load(mediaFile)
        for (const key in mediaData) {
            if (userMessage.includes(key)) {
                const filePath = path.join(mediaDir, mediaData[key].file)
                const buffer = fs.readFileSync(filePath)
                await sock.sendMessage(chatId, { [mediaData[key].mediaType]: buffer }, { quoted: message })
                return true
            }
        }

        // TEXT
        const textData = load(textFile)
        for (const key in textData) {
            if (userMessage.includes(key)) {
                const list = textData[key]
                const reply = list[Math.floor(Math.random() * list.length)]
                await sock.sendMessage(chatId, { text: reply, ...channelInfo }, { quoted: message })
                return true
            }
        }
    }

    return false
}
