const fs = require('fs')

const autoResponFile = './data/autorespon.json'

function loadAutoRespon() {
    if (!fs.existsSync(autoResponFile)) return {}
    return JSON.parse(fs.readFileSync(autoResponFile))
}

function saveAutoRespon(data) {
    fs.writeFileSync(autoResponFile, JSON.stringify(data, null, 2))
}

module.exports = async (sock, chatId, message, userMessage, channelInfo) => {

    // ADD
    if (userMessage.startsWith('.addautorespon')) {
        const text = userMessage.replace('.addautorespon', '').trim()

        if (!text.includes('|')) {
            await sock.sendMessage(chatId, {
                text: 'format: .addautorespon kata|respon1, respon2',
                ...channelInfo
            }, { quoted: message })
            return true
        }

        const [key, value] = text.split('|')
        const kata = key.replace(/\s+/g, ' ').trim().toLowerCase()
        const respon = value
            .split(',')
            .map(v => v.replace(/\s+/g, ' ').trim())
            .filter(Boolean)

        if (!kata || !respon.length) return true

        const data = loadAutoRespon()
        data[kata] = respon
        saveAutoRespon(data)

        await sock.sendMessage(chatId, {
            text: `✅ autorespon "${kata}" ditambahkan`,
            ...channelInfo
        }, { quoted: message })

        return true
    }

    // DEL
    if (userMessage.startsWith('.delautorespon')) {
        const kata = userMessage.replace('.delautorespon', '').trim().toLowerCase()
        const data = loadAutoRespon()

        if (!data[kata]) {
            await sock.sendMessage(chatId, {
                text: `❌ autorespon "${kata}" tidak ditemukan`,
                ...channelInfo
            }, { quoted: message })
            return true
        }

        delete data[kata]
        saveAutoRespon(data)

        await sock.sendMessage(chatId, {
            text: `✅ autorespon "${kata}" dihapus`,
            ...channelInfo
        }, { quoted: message })

        return true
    }

    // LIST
    if (userMessage === '.listautorespon') {
        const data = loadAutoRespon()
        const keys = Object.keys(data)

        if (!keys.length) {
            await sock.sendMessage(chatId, {
                text: 'Belum ada autorespon',
                ...channelInfo
            }, { quoted: message })
        } else {
            await sock.sendMessage(chatId, {
                text: '📋 AUTORESPON:\n\n' + keys.map((k, i) => `${i + 1}. ${k}`).join('\n'),
                ...channelInfo
            }, { quoted: message })
        }

        return true
    }

    // AUTO RESPON
    if (!userMessage.startsWith('.')) {
        const data = loadAutoRespon()
        for (const kata in data) {
            if (userMessage.includes(kata)) {
                const list = data[kata]
                const reply = list[Math.floor(Math.random() * list.length)]

                await sock.sendMessage(chatId, {
                    text: reply,
                    ...channelInfo
                }, { quoted: message })

                return true
            }
        }
    }

    return false
}
