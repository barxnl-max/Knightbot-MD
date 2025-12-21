const { jidNormalizedUser } = require('@whiskeysockets/baileys')

module.exports = async (sock, chatId, mentionedJids, message) => {
  if (!mentionedJids || mentionedJids.length === 0) return false

  // normalisasi jid bot
  const botJid = jidNormalizedUser(sock.user.id)

  // cek apakah bot di-mention
  if (!mentionedJids.includes(botJid)) return false

  // ===== cooldown =====
  const COOLDOWN = 30 * 1000
  global.tagBotCooldown ??= {}

  if (
    global.tagBotCooldown[chatId] &&
    Date.now() - global.tagBotCooldown[chatId] < COOLDOWN
  ) return false

  global.tagBotCooldown[chatId] = Date.now()

  // delay natural
  await new Promise(r => setTimeout(r, 1200))

  const replies = [
    'Heh dipanggil-panggil 😑',
    'Iya iya nongol, sabar napa',
    'Kenapa sih? Lagi rebahan ini',
    'Tag mulu… ada apa?',
    'Hadir 🙋‍♂️ tapi pelan-pelan',
    'Dipanggil pas lagi males',
    'Apasi woy 😭',
    'Iya iya, ada apa nih',
    'Lagi ngopi, bentar ☕',
    'Sabar… napas dulu'
  ]

  const text = replies[Math.floor(Math.random() * replies.length)]

  await sock.sendMessage(chatId, { text }, { quoted: message })
  return true
}
