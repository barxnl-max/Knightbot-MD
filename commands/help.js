const settings = require('../settings')
const fs = require('fs')
const path = require('path')

async function helpCommand(sock, chatId, message) {
  const helpMessage = `
Halo 👋
Saya adalah WhatsApp Bot yang siap membantu kamu 🤖

Ketik .menu untuk melihat semua fitur
  `.trim()

  try {
    const imagePath = path.join(__dirname, '../assets/bot_image.jpg')

    const contextInfo = {
      mentionedJid: [message.key.participant || message.key.remoteJid],
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363423464130445@newsletter',
        newsletterName: 'Lydia Bot • AI Assistant',
        serverId: 0
      },
      externalAdReply: {
        title: '© Lydia Bot',
        body: 'AI WhatsApp Assistant',
        thumbnailUrl: 'https://files.catbox.moe/nwvkbt.png',
        mediaType: 1,
        previewType: 0,
        renderLargerThumbnail: false,
        sourceUrl: 'https://github.com/barxnl-max'
      }
    }

    // ====== KIRIM DENGAN GAMBAR JIKA ADA ======
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath)

      await sock.sendMessage(
        chatId,
        {
          image: imageBuffer,
          caption: helpMessage,
          contextInfo
        },
        { quoted: message }
      )
    } else {
      // ====== FALLBACK TANPA GAMBAR ======
      await sock.sendMessage(
        chatId,
        {
          text: helpMessage,
          contextInfo
        },
        { quoted: message }
      )
    }
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
