// commands/tagbot.js
const settings = require('../settings')

const cooldown = new Map()
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
    if (!message?.message) return

    const chatId = message.key.remoteJid
    if (!chatId.endsWith('@g.us')) return

    if (message.key.fromMe) return

    const sender =
      message.key.participant || message.key.remoteJid

    // =====================
    // AMBIL MENTION
    // =====================
    const mentioned =
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    if (!mentioned.length) return

    // =====================
    // AMBIL NO BOT DARI SETTINGS
    // =====================
    const botJid = settings.ownerNumber + '@s.whatsapp.net'

    // Kalau bot tidak di-tag → stop
    if (!mentioned.includes(botJid)) return

    // =====================
    // COOLDOWN
    // =====================
    const now = Date.now()
    const last = cooldown.get(sender)
    if (last && now - last < COOLDOWN_MS) return
    cooldown.set(sender, now)

    // =====================
    // RESPON RANDOM
    // =====================
    const reply =
      responses[Math.floor(Math.random() * responses.length)]

    await new Promise(r => setTimeout(r, 600))

    await sock.sendMessage(
      chatId,
      { text: reply },
      { quoted: message }
    )
  } catch (e) {
    console.error('TagBot Error:', e)
  }
}

module.exports = handleTagBot
