const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { UploadFileUgu, TelegraPh } = require('../lib/uploader')
const { writeExifImg } = require('../lib/exif')
const settings = require('../settings')

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
    url = typeof res === 'string' ? res : res.url
  } finally {
    setTimeout(() => {
      try { fs.unlinkSync(tempPath) } catch {}
    }, 2000)
  }

  return url
}

module.exports = async function memegenCommand(sock, chatId, message, userMessage) {
  try {
    const quotedImg = await downloadQuotedImage(message)
    if (!quotedImg) {
      return sock.sendMessage(
        chatId,
        { text: '⚠️ Reply gambar untuk membuat meme' },
        { quoted: message }
      )
    }

    const isImage = userMessage.includes('--image')
    const cleanText = userMessage
      .replace(/^\.memegen/i, '')
      .replace('--image', '')
      .trim()

    let [top = '', bottom = ''] = cleanText.split('|')

    top = encodeURIComponent(top || '_')
    bottom = encodeURIComponent(bottom || '_')

    const bgUrl = await uploadImage(quotedImg)

    const memeUrl =
      `https://api.memegen.link/images/custom/${top}/${bottom}.png` +
      `?background=${encodeURIComponent(bgUrl)}`

    // ================= IMAGE =================
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

    // ================= STICKER =================
    const imgBuffer = (await axios.get(memeUrl, {
      responseType: 'arraybuffer'
    })).data

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

  } catch (e) {
    console.error('MEMEGEN ERROR:', e)
    await sock.sendMessage(
      chatId,
      { text: '❌ Gagal membuat meme' },
      { quoted: message }
    )
  }
}
