const axios = require('axios')
const fs = require('fs')
const { writeExifImg } = require('../lib/exif')
const settings = require('../settings')

const COLORS = {
  pink: '#f68ac9',
  blue: '#6cace4',
  red: '#f44336',
  green: '#4caf50',
  yellow: '#ffeb3b',
  purple: '#9c27b0',
  darkblue: '#0d47a1',
  lightblue: '#03a9f4',
  ash: '#9e9e9e',
  orange: '#ff9800',
  black: '#000000',
  white: '#ffffff',
  teal: '#008080',
  magenta: '#ff00ff',
  gold: '#ffd700',
  silver: '#c0c0c0'
}

module.exports = async function qcCommand(sock, chatId, message, userMessage) {
  try {
    const args = userMessage.trim().split(' ').slice(1)
    if (!args[0]) {
      return sock.sendMessage(
        chatId,
        { text: 'Contoh: .qc white halo dunia' },
        { quoted: message }
      )
    }

    const color = args.shift().toLowerCase()
    const backgroundColor = COLORS[color]
    if (!backgroundColor) {
      return sock.sendMessage(
        chatId,
        { text: '❌ Warna tidak ditemukan' },
        { quoted: message }
      )
    }

    // ====== AMBIL TEKS ======
    let text
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (quoted?.conversation) {
      text = quoted.conversation
    } else {
      text = args.join(' ')
    }

    if (!text) {
      return sock.sendMessage(
        chatId,
        { text: '❌ Tidak ada teks' },
        { quoted: message }
      )
    }

    if (text.length > 80) {
      return sock.sendMessage(
        chatId,
        { text: '❌ Maksimal 80 karakter' },
        { quoted: message }
      )
    }

    // ====== AVATAR ======
    let avatar
    try {
      avatar = await sock.profilePictureUrl(message.key.participant || message.key.remoteJid, 'image')
    } catch {
      avatar = 'https://files.catbox.moe/nwvkbt.png'
    }

    // ====== PAYLOAD QC ======
    const payload = {
      type: 'quote',
      format: 'png',
      backgroundColor,
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: message.pushName || 'User',
            photo: { url: avatar }
          },
          text,
          replyMessage: {}
        }
      ]
    }

    // ====== REQUEST ======
    const res = await axios.post(
      'https://bot.lyo.su/quote/generate',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const imgBuffer = Buffer.from(res.data.result.image, 'base64')

    // ====== CONVERT KE STIKER ======
    const webpPath = await writeExifImg(imgBuffer, {
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
