module.exports = async (sock, message) => {
  const mentioned =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

  // cek apakah BOT di-tag
  if (!mentioned.includes(sock.user.id)) return false

  const chatId = message.key.remoteJid
  const isGroup = chatId.endsWith('@g.us')

  const text = isGroup
    ? 'Oh iyakah, iya emang gua ganteng dari lahir sih, makasih yah bro dek💞˜‚'
    : 'Apaan bang?'

  await sock.sendMessage(chatId, { text }, { quoted: message })
  return true
}
