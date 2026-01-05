const { handleWelcome } = require('../lib/welcome')
const { isWelcomeOn, getWelcome } = require('../lib/index')

const DEFAULT_PP = 'https://files.catbox.moe/nwvkbt.png'

async function welcomeCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: 'This command can only be used in groups.' })
    }

    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        ''

    const matchText = text.split(' ').slice(1).join(' ')
    await handleWelcome(sock, chatId, message, matchText)
}

async function handleJoinEvent(sock, groupId, participants) {
    const enabled = await isWelcomeOn(groupId)
    if (!enabled) return

    const customWelcome = await getWelcome(groupId)
    const metadata = await sock.groupMetadata(groupId)

    const groupName = metadata.subject
    const groupDesc = metadata.desc || 'No description available'

    for (const p of participants) {
        try {
            const jid = typeof p === 'string' ? p : p.id
            const mentionName = jid.split('@')[0]

            // =========================
            // BUILD MESSAGE
            // =========================
            let caption
            if (customWelcome) {
                caption = customWelcome
                    .replace(/{user}/g, `@${mentionName}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc)
            } else {
                caption =
`👋 Welcome @${mentionName}

Selamat datang di *${groupName}*
Semoga betah dan patuhi rules ya 🤝

📌 *Deskripsi Grup*
${groupDesc}`
            }

            // =========================
            // GET PROFILE PICTURE
            // =========================
            let ppUrl = DEFAULT_PP
            try {
                const url = await sock.profilePictureUrl(jid, 'image')
                if (url) ppUrl = url
            } catch {}

            // =========================
            // SEND IMAGE + CAPTION
            // =========================
            await sock.sendMessage(groupId, {
                image: { url: ppUrl },
                caption,
                mentions: [jid]
            })

        } catch (err) {
            console.error('WELCOME ERROR:', err)

            const jid = typeof p === 'string' ? p : p.id
            const mentionName = jid.split('@')[0]

            await sock.sendMessage(groupId, {
                text: `Welcome @${mentionName} to *${groupName}* 👋`,
                mentions: [jid]
            })
        }
    }
}

module.exports = {
    welcomeCommand,
    handleJoinEvent
}
