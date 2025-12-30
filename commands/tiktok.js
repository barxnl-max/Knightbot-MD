const axios = require("axios")

const processedMessages = new Set()

module.exports = async function tiktokCommand(sock, chatId, message) {
  try {
    if (processedMessages.has(message.key.id)) return
    processedMessages.add(message.key.id)
    setTimeout(() => processedMessages.delete(message.key.id), 300000)

    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text

    if (!text) return

    const args = text.split(" ").slice(1)
    const url = args.find(v => v.startsWith("http"))
    const isViewOnce = args.includes("--vv")

    if (!url) {
      return sock.sendMessage(chatId, {
        text: "❌ Masukkan link TikTok"
      }, { quoted: message })
    }

    await sock.sendMessage(chatId, {
      react: { text: "⏳", key: message.key }
    })

    const api = await axios.get(
      `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`,
      { timeout: 20000 }
    )

    if (!api.data?.status || !api.data?.data?.urls?.length) {
      throw "API gagal"
    }

    const data = api.data.data
    const title = data.metadata?.title || "TikTok Video"

    // ⚠️ PAKAI URL KEDUA (PALING STABIL)
    const videoUrl = data.urls[1]

    await sock.sendMessage(chatId, {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption: `📥 TikTok Download\n📝 ${title}`,
      viewOnce: isViewOnce
    }, { quoted: message })

  } catch (e) {
    console.error("TIKTOK ERROR:", e)
    sock.sendMessage(chatId, {
      text: "❌ Gagal download TikTok"
    }, { quoted: message })
  }
}
