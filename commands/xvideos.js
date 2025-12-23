const xvideos = require('../lib/xvideos')

// cache per chat
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

        // ======================
        // 🔍 SEARCH
        // ======================
        if (cmd === '.xvsearch') {
            const query = args.slice(1).join(' ')
            if (!query) {
                await sock.sendMessage(chatId, { text: 'Cari apa?' }, { quoted: message })
                return
            }

            const res = await xvideos.search(query)
            if (!Array.isArray(res) || !res.length) {
                await sock.sendMessage(chatId, { text: 'Tidak ada hasil.' }, { quoted: message })
                return
            }

            const list = res.slice(0, 10)
            setCache(chatId, list)

            let out = `🔎 *Hasil Pencarian*\n\n`
            out += list.map((v, i) =>
                `*${i + 1}.* ${v.title}\n⏱ ${v.duration} | 📺 ${v.resolution}`
            ).join('\n\n')

            out += `\n\nKetik: *.getxvideo <nomor>*\nContoh: *.getxvideo 2*\n⏳ Berlaku 2 menit`

            await sock.sendMessage(chatId, { text: out }, { quoted: message })
            return
        }

        // ======================
        // ⬇️ GET VIDEO (TANPA REPLY)
        // ======================
        if (cmd === '.getxvideo') {
            const num = args[1]

            // user belum search
            const cache = getCache(chatId)
            if (!cache) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Belum ada list.\nSilakan cari dulu dengan:\n*.xvsearch <kata kunci>*' },
                    { quoted: message }
                )
                return
            }

            // cache expired
            if (cache === 'expired') {
                await sock.sendMessage(
                    chatId,
                    { text: '⏳ List sudah kadaluarsa.\nSilakan cari ulang dengan *.xvsearch*' },
                    { quoted: message }
                )
                return
            }

            if (!num || !/^[0-9]+$/.test(num)) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Masukkan nomor.\nContoh: *.getxvideo 1*' },
                    { quoted: message }
                )
                return
            }

            const idx = Number(num) - 1
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
        console.error('XVIDEOS CMD ERROR:', e)
    }
}
