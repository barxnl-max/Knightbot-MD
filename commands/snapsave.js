const snapsave = require('../lib/snapsave')

module.exports = async function snapsaveCommand(
    sock,
    chatId,
    message,
    userMessage,
    channelInfo
) {
    try {
        const args = userMessage.split(' ').slice(1)
        if (!args.length) {
            await sock.sendMessage(chatId, {
                text: '❌ Contoh:\n.snapsave https://instagram.com/xxxx',
                ...channelInfo
            }, { quoted: message })
            return
        }

        const url = args[0]
        const result = await snapsave(url)

        if (!result.success) {
            await sock.sendMessage(chatId, {
                text: `❌ ${result.message}`,
                ...channelInfo
            }, { quoted: message })
            return
        }

        const { media, description, preview } = result.data

        // Kirim satu-satu biar aman
        for (const item of media) {
            if (item.type === 'image') {
                await sock.sendMessage(chatId, {
                    image: { url: item.url },
                    caption: description || ''
                }, { quoted: message })
            } else {
                await sock.sendMessage(chatId, {
                    video: { url: item.url },
                    caption: description || ''
                }, { quoted: message })
            }
        }

    } catch (e) {
        console.error('SNAPSAVE ERROR:', e)
        // silent error (tidak spam chat)
    }
}
