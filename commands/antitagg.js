// commands/tagbot.js

const cooldown = new Map()

// Ubah sesukamu
const COOLDOWN_MS = 10 * 1000 // 10 detik per user

const responses = [
  'Iya iya, kenapa? 😑',
  'Dipanggil mulu, capek tau',
  'Hadir… walau males',
  'Apaan sih?',
  'Woy?',
  'Kenapa manggil gue?',
  'Santai napa 😴',
  'Ada apa lagi?',
  'Aku bukan customer service 😶',
  'Tag terus, baterai gue abis'
]

async function handleTagBot(sock, message) {
  try {
    // =====================
    // VALIDASI DASAR
    // =====================
    if (!message?.message) return

    const chatId = message.key.remoteJid
    if (!chatId.endsWith('@g.us')) return // grup only

    const sender =
      message.key.participant || message.key.remoteJid

    // Jangan respon diri sendiri
    if (message.key.fromMe) return

    // =====================
    // AMBIL MENTION
    // =====================
    const mentioned =
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    if (mentioned.length === 0) return

    // JID bot
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'

    // Kalau bot tidak di-mention → stop
    if (!mentioned.includes(botJid)) return

    // =====================
    // COOLDOWN USER
    // =====================
    const now = Date.now()
    const last = cooldown.get(sender)

    if (last && now - last < COOLDOWN_MS) return
    cooldown.set(sender, now)

    // =====================
    // PILIH RESPON RANDOM
    // =====================
    const text =
      responses[Math.floor(Math.random() * responses.length)]

    // Delay biar natural
    await new Promise(r => setTimeout(r, 600))

    await sock.sendMessage(
      chatId,
      { text },
      { quoted: message }
    )
  } catch (err) {
    console.error('TagBot Error:', err)
  }
}

module.exports = handleTagBot
