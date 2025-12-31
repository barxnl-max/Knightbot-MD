const fs = require('fs')
const path = require('path')

async function helpCommand(sock, chatId, message) {
  const helpMessage = `
Halo 👋
Saya adalah WhatsApp Bot 🤖
Dibangun menggunakan TypeScript (katanya 😄)

Ketik .menu untuk melihat fitur
`.trim()

  const imagePath = path.join(__dirname, '../assets/bot_image.jpg')
  const imageBuffer = fs.existsSync(imagePath)
    ? fs.readFileSync(imagePath)
    : null

  await sock.sendMessage(
    chatId,
    {
      image: imageBuffer || { url: 'https://files.catbox.moe/nwvkbt.png' },
      caption: helpMessage,
      contextInfo: {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363368222492263@newsletter',
          newsletterName: 'AI Assistant',
          serverId: 1
        },
        externalAdReply: {
          title: '© Lydia Bot',
          body: 'AI WhatsApp Assistant',
          thumbnailUrl: 'https://files.catbox.moe/nwvkbt.png',
          mediaType: 1,
          previewType: 0,
          renderLargerThumbnail: false,
          sourceUrl: 'https://ai.whatsapp.com'
        }
      }
    },
    { quoted: message }
  )
}

module.exports = helpCommand
