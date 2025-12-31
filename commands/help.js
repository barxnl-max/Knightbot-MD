async function helpCommand(sock, chatId, message) {
    const sender = message.key.participant || message.key.remoteJid

    // ambil teks command
    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        ''

    const args = text.trim().split(/\s+/).slice(1)
    const isAll = args[0]?.toLowerCase() === 'all'

    const helpMessage = `
HALO 👋
Saya adalah WhatsApp Bot 🤖

Ketik:
.menu all
atau
.help all

untuk melihat semua fitur.
`.trim()

    const helpMessageAll = `
INI MENU LENGKAP 🔥

• Downloader
• Sticker & Image
• Utility
• Group Admin
• Game
• Fun
• Dan banyak lagi

Gunakan dengan bijak ✨
`.trim()

    const messageText = isAll ? helpMessageAll : helpMessage

    try {
        await sock.sendMessage(
            chatId,
            {
                text: messageText,
                contextInfo: {
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: 'WhatsApp Bot',
                        mediaType: 1,
                        previewType: 0,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://telegra.ph/file/3a34bfa58714bdef500d9.jpg'
                        // sourceUrl sengaja dihilangkan
                    }
                },
                mentions: [sender]
            },
            { quoted: message }
        )
    } catch (err) {
        console.error('HELP ERROR:', err)
        await sock.sendMessage(chatId, { text: messageText }, { quoted: message })
    }
}

module.exports = helpCommand
