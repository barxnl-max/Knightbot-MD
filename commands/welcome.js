const { handleWelcome } = require('../lib/welcome')
const { isWelcomeOn, getWelcome } = require('../lib/index')
const fetch = require('node-fetch')

// =====================
// COMMAND SET WELCOME
// =====================
async function welcomeCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
            text: 'This command can only be used in groups.'
        })
        return
    }

    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        ''

    const matchText = text.split(' ').slice(1).join(' ')
    await handleWelcome(sock, chatId, message, matchText)
}

// =====================
// HANDLE MEMBER JOIN
// =====================
async function handleJoinEvent(sock, groupId, participants) {
    const isEnabled = await isWelcomeOn(groupId)
    if (!isEnabled) return

    const customWelcome = await getWelcome(groupId)
    const groupMetadata = await sock.groupMetadata(groupId)

    const groupName = groupMetadata.subject
    const groupDesc = groupMetadata.desc || 'No description available'

    for (const participant of participants) {
        const jid =
            typeof participant === 'string'
                ? participant
                : participant.id || participant.toString()

        const userNumber = jid.split('@')[0]

        // ===== GET DISPLAY NAME =====
        let displayName = userNumber
        try {
            displayName = await sock.getName(jid)
        } catch {}

        // ===== BUILD MESSAGE =====
        let caption
        if (customWelcome) {
            caption = customWelcome
                .replace(/{user}/g, `@${displayName}`)
                .replace(/{group}/g, groupName)
                .replace(/{description}/g, groupDesc)
        } else {
            caption =
`👋 Welcome @${displayName}

Selamat datang di *${groupName}*
Semoga betah dan patuhi rules grup ya.

${groupDesc}`
        }

        // ===== GET PROFILE PICTURE =====
        let imageBuffer
        try {
            const ppUrl = await sock.profilePictureUrl(jid, 'image')
            const res = await fetch(ppUrl)
            imageBuffer = await res.buffer()
        } catch {
            // fallback jika PP private / tidak ada
            const fallback = 'https://img.pyrocdn.com/dbKUgahg.png'
            const res = await fetch(fallback)
            imageBuffer = await res.buffer()
        }

        // ===== SEND WELCOME =====
        await sock.sendMessage(groupId, {
            image: imageBuffer,
            caption,
            mentions: [jid]
        })
    }
}

module.exports = {
    welcomeCommand,
    handleJoinEvent
}
