async function helpCommand(sock, chatId, message) {
    const helpMessage = `Testing`

    const sender = message.key.participant || message.key.remoteJid

    try {
        await sock.sendMessage(
            chatId,
            {
                text: helpMessage,
                contextInfo: {
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: 'WhatsApp Bot',
                        mediaType: 1,
                        previewType: 0,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://telegra.ph/file/3a34bfa58714bdef500d9.jpg',
                       // sourceUrl: 'https://whatsapp.com/channel/0029Va8ZH8fFXUuc69TGVw1q'
                    }
                },
                mentions: [sender]
            },
            { quoted: message }
        )
    } catch (err) {
        console.error('HELP ERROR:', err)
        await sock.sendMessage(
            chatId,
            { text: helpMessage },
            { quoted: message }
        )
    }
}

module.exports = helpCommand
