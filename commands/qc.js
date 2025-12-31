const axios = require('axios')

const COLOR_MAP = {
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
  cyan: '#48D1CC',
  violet: '#BA55D3',
  gold: '#FFD700',
  silver: '#C0C0C0'
}

module.exports = async function qcCommand(sock, chatId, m, args) {
  try {
    const ctx = m.message?.extendedTextMessage?.contextInfo
    const quoted = ctx?.quotedMessage
    const quotedSender = ctx?.participant

    let text
    let targetJid

    // =====================
    // AMBIL TEKS & TARGET
    // =====================
    if (quoted) {
      text =
        quoted.conversation ||
        quoted.extendedTextMessage?.text
      targetJid = quotedSender
    } else {
      text = args.slice(1).join(' ')
      targetJid = m.key.participant || m.key.remoteJid
    }

    if (!text)
      return sock.sendMessage(
        chatId,
        { text: '⚠️ Masukkan teks atau reply chat' },
        { quoted: m }
      )

    if (text.length > 80)
      return sock.sendMessage(
        chatId,
        { text: '⚠️ Maksimal 80 karakter' },
        { quoted: m }
      )

    // =====================
    // WARNA (DEFAULT PUTIH)
    // =====================
    const colorInput = (args[0] || '').toLowerCase()
    const backgroundColor = COLOR_MAP[colorInput] || COLOR_MAP.white

    // =====================
    // NAMA & FOTO PROFIL
    // =====================
    let username = 'Unknown'
    try {
      const contact = await sock.getContact(targetJid)
      username = contact?.notify || contact?.name || username
    } catch {}

    const avatar = await sock
      .profilePictureUrl(targetJid, 'image')
      .catch(() => 'https://files.catbox.moe/nwvkbt.png')

    // =====================
    // QC PAYLOAD
    // =====================
    const payload = {
      type: 'quote',
      format: 'png',
      backgroundColor,
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          avatar: true,
          from: {
            id: 1,
            name: username,
            photo: { url: avatar }
          },
          text,
          replyMessage: {}
        }
      ]
    }

    // =====================
    // GENERATE QC
    // =====================
    const res = await axios.post(
      'https://bot.lyo.su/quote/generate',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const buffer = Buffer.from(res.data.result.image, 'base64')

    // =====================
    // SEND STICKER
    // =====================
    await sock.sendMessage(
      chatId,
      { sticker: buffer },
      { quoted: m }
    )

  } catch (err) {
    console.error('QC ERROR:', err)
    await sock.sendMessage(
      chatId,
      { text: '❌ Gagal membuat QC' },
      { quoted: m }
    )
  }
}
