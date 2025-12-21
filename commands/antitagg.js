module.exports = async (sock, message) => {
  const msg = message.message

  // ambil contextInfo dari semua tipe pesan
  const contextInfo =
    msg?.extendedTextMessage?.contextInfo ||
    msg?.imageMessage?.contextInfo ||
    msg?.videoMessage?.contextInfo ||
    {}

  const mentioned = contextInfo.mentionedJid || []
  if (!mentioned.includes(sock.user.id)) return false

  const chatId = message.key.remoteJid

  // ===== CONFIG =====
  const COOLDOWN = 30 * 1000 // 30 detik
  // ==================

  // ===== Cooldown anti spam =====
  global.tagBotCooldown ??= {}
  if (
    global.tagBotCooldown[chatId] &&
    Date.now() - global.tagBotCooldown[chatId] < COOLDOWN
  ) return false

  global.tagBotCooldown[chatId] = Date.now()

  // ===== Delay biar natural =====
  await new Promise(r => setTimeout(r, 1200))

  // ===== Respon random lucu =====
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
