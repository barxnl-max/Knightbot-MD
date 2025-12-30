const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const { UploadFileUgu, TelegraPh } = require('../lib/uploader')
const { writeExifImg } = require('../lib/exif')
const settings = require('../settings')

/* =========================
   DOWNLOAD QUOTED IMAGE
========================= */
async function downloadQuotedImage(message) {
  const quoted =
    message.message?.extendedTextMessage?.contextInfo?.quotedMessage

  if (!quoted || !quoted.imageMessage) return null

  const stream = await downloadContentFromMessage(
    quoted.imageMessage,
    'image'
  )

  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }

  return buffer
}

/* =========================
   UPLOAD IMAGE → URL
========================= */
async function uploadImage(buffer) {
  const tempDir = path.join(__dirname, '../temp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  const tempPath = path.join(tempDir, `${Date.now()}.jpg`)
  fs.writeFileSync(tempPath, buffer)

  let url
  try {
    url = await TelegraPh(tempPath)
  } catch {
    const res = await UploadFileUgu(tempPath)
    url = typeof res === 'string'
      ? res
      : (res.url || res.url_full)
  } finally {
    setTimeout(() => {
      try { fs.unlinkSync(tempPath) } catch {}
    }, 2000)
  }

  return url
}

/* =========================
   MEMEGEN COMMAND
========================= */
module.exports = async function memegenCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      ''

    // ===== VALIDASI COMMAND =====
    if (!text.toLowerCase().startsWith('.memegen')) return

    // ===== HARUS REPLY GAMBAR =====
    const quotedImg = await downloadQuotedImage(message)
    if (!quotedImg) {
      return sock.sendMessage(
        chatId,
        { text: '⚠️ Reply gambar untuk membuat meme' },
        { quoted: message }
      )
    }

    // ===== FLAG =====
    const isImage = text.includes('--image')

    // ===== PARSE TEXT =====
    const cleanText = text
      .replace(/^\.memegen/i, '')
      .replace('--image', '')
      .trim()

    let [top = '', bottom = ''] = cleanText.split('|')

    top = encodeURIComponent(top || '_')
    bottom = encodeURIComponent(bottom || '_')

    // ===== UPLOAD BG =====
    const bgUrl = await uploadImage(quotedImg)

    const memeUrl =
      `https://api.memegen.link/images/custom/${top}/${bottom}.png` +
      `?background=${encodeURIComponent(bgUrl)}`

    // ================= IMAGE MODE =================
    if (isImage) {
      return await sock.sendMessage(
        chatId,
        {
          image: { url: memeUrl },
          caption: '🖼️ Meme Generated'
        },
        { quoted: message }
      )
    }

    // ================= STICKER MODE =================
    const imgBuffer = (
      await axios.get(memeUrl, { responseType: 'arraybuffer' })
    ).data

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
    console.error('MEMEGEN ERROR:', err)
    await sock.sendMessage(
      chatId,
      { text: '❌ Gagal membuat meme' },
      { quoted: message }
    )
  }
}
