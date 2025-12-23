const xvideos = require('../lib/xvideos')

// cache: per chat
// value: { data: [], expire: timestamp }
const xvCache = new Map()

function setCache(chatId, data) {
    xvCache.set(chatId, {
        data,
        expire: Date.now() + 2 * 60 * 1000 // 2 menit
    })
}

function getCache(chatId) {
    const cache = xvCache.get(chatId)
    if (!cache) return null

    if (Date.now() > cache.expire) {
        xvCache.delete(chatId)
        return 'expired'
    }

    return cache.data
}

module.exports = async (sock, chatId, message, userMessage) => {
    try {
        const text = userMessage.trim()
        const args = text.split(/\s+/)
        const cmd = args[0].toLowerCase()
        const query = args.slice(1).join(' ')

        const quoted = message.message?.extendedTextMessage?.contextInfo
        const isReply = !!quoted
        const isNumber = /^[0-9]+$/.test(text)

        // ======================
        // 🔍 SEARCH
        // ======================
        if (cmd === '.xvsearch') {
            if (!query) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Cari apa?' },
                    { quoted: message }
                )
                return
            }

            const res = await xvideos.search(query)
            if (!Array.isArray(res) || !res.length) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Tidak ada hasil.' },
                    { quoted: message }
                )
                return
            }

            const list = res.slice(0, 10)
            setCache(chatId, list)

            let out = `🔎 *Hasil Pencarian*\n\n`
            out += list.map((v, i) =>
                `*${i + 1}.* ${v.title}
⏱ ${v.duration} | 📺 ${v.resolution}`
            ).join('\n\n')

            out += `\n\n↩️ *Reply pesan ini dengan angka (1-${list.length})*\n⏳ Berlaku 2 menit`

            await sock.sendMessage(
                chatId,
                { text: out },
                { quoted: message }
            )
            return
        }

        // ======================
        // 🔢 ANGKA TANPA REPLY → DIAM
        // ======================
        if (isNumber && !isReply) {
            return
        }

        // ======================
        // ⬇️ REPLY ANGKA → DOWNLOAD
        // ======================
        if (isNumber && isReply) {
            const cache = getCache(chatId)

            // cache expired
            if (cache === 'expired') {
                await sock.sendMessage(
                    chatId,
                    { text: '⏳ List sudah kadaluarsa, silakan search ulang.' },
                    { quoted: message }
                )
                return
            }

            // cache kosong / tidak ada
            if (!Array.isArray(cache)) {
                return
            }

            const idx = Number(text) - 1
            if (!cache[idx]) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Nomor tidak valid.' },
                    { quoted: message }
                )
                return
            }

            const url = cache[idx].link
            const dl = await xvideos.download(url)

            if (!dl || !dl.videos) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Gagal mengambil video.' },
                    { quoted: message }
                )
                return
            }

            const videoUrl =
                dl.videos.high ||
                dl.videos.low ||
                dl.videos.HLS

            if (!videoUrl) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Video tidak ditemukan.' },
                    { quoted: message }
                )
                return
            }

            await sock.sendMessage(
                chatId,
                { video: { url: videoUrl } },
                { quoted: message }
            )
            return
        }

    } catch (e) {
        console.error('XVIDEOS COMMAND ERROR:', e)
    }
}
