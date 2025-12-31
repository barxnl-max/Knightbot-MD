const axios = require('axios')
const fs = require('fs')
const { writeExifImg } = require('../lib/exif')
const settings = require('../settings')

const COLORS = {
  white: '#ffffff',
  black: '#000000',
  red: '#f44336',
  blue: '#2196f3',
  green: '#4caf50',
  yellow: '#ffeb3b',
  purple: '#9c27b0',
  pink: '#f68ac9',
  orange: '#ff9800',
  cyan: '#48D1CC'
}

module.exports = async function qcCommand(sock, chatId, message, userMessage) {
  try {
    const ctx = message.message?.extendedTextMessage?.contextInfo
    const quotedMsg = ctx?.quotedMessage

    const args = userMessage.replace(/^\.qc/i, '').trim().split(' ')

    // ================= COLOR =================
    let backgroundColor = COLORS.white
    if (COLORS[args[0]?.toLowerCase()]) {
      backgroundColor = COLORS[args.shift().toLowerCase()]
    }

    // ================= TEXT =================
    let text = ''
    if (quotedMsg) {
      text =
        quotedMsg.conversation ||
        quotedMsg.extendedTextMessage?.text ||
        ''
    } else {
      text = args.join(' ')
    }

    if (!text) {
      return sock.sendMessage(
        chatId,
        { text: '⚠️ Masukkan teks atau reply chat' },
        { quoted: message }
      )
    }

    if (text.length > 80) {
      return sock.sendMessage(
        chatId,
        { text: '⚠️ Maksimal 80 karakter' },
        { quoted: message }
      )
    }

    // ================= TARGET USER =================
    const targetJid =
      ctx?.participant ||
      message.key.participant ||
      message.key.remoteJid

    const targetName =
      quotedMsg
        ? (ctx?.pushName || 'User')
        : (message.pushName || 'User')

    // ================= AVATAR =================
    let avatar
    try {
      avatar = await sock.profilePictureUrl(targetJid, 'image')
    } catch {
      avatar = 'https://files.catbox.moe/nwvkbt.png'
    }

    // ================= PAYLOAD =================
    const payload = {
      type: 'quote',
      format: 'png',
      backgroundColor,
      width: 512,
      height: 768,
      scale: 2,
      messages: [{
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name: targetName,
          photo: { url: avatar }
        },
        text,
        replyMessage: {}
      }]
    }

    // ================= API =================
    const res = await axios.post(
      'https://bot.lyo.su/quote/generate',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const buffer = Buffer.from(res.data.result.image, 'base64')

    // ================= STICKER =================
    const webpPath = await writeExifImg(buffer, {
      packname: settings.packname,
      author: settings.author
    })

    const sticker = fs.readFileSync(webpPath)
    fs.unlinkSync(webpPath)

    await sock.sendMessage(
      chatId,
      { sticker },
      { quoted: message }
    )

  } catch (err) {
    console.error('QC ERROR:', err)
    await sock.sendMessage(
      chatId,
      { text: '❌ Gagal membuat QC sticker' },
      { quoted: message }
    )
  }
}
